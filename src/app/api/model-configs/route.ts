import { NextResponse } from 'next/server';
import { query, execute, queryOne } from '@/lib/dm-helper';
import { getUserFromToken } from '@/lib/auth';

// 获取模型配置列表
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeDisabled = searchParams.get('include_disabled') === 'true';

    let sql = 'SELECT * FROM "SYSDBA"."model_configs"';
    if (!includeDisabled) {
      sql += ' WHERE "status" = \'active\'';
    }
    sql += ' ORDER BY "is_default" DESC, "id" ASC';

    const configs = await query<any>(sql);

    // 不返回 api_key 明文
    const safeConfigs = configs.map((c: any) => ({
      ...c,
      api_key: c.api_key ? '***已保存***' : ''
    }));

    return NextResponse.json({
      success: true,
      data: safeConfigs
    });
  } catch (error) {
    console.error('获取模型配置失败:', error);
    return NextResponse.json({
      success: false,
      message: '获取失败',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// 创建/更新模型配置（需要管理员权限）
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        message: '未授权'
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = await getUserFromToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({
        success: false,
        message: '需要管理员权限'
      }, { status: 403 });
    }

    const body = await request.json();
    const { 
      id, 
      name, 
      provider, 
      base_url, 
      api_key, 
      model, 
      is_default, 
      status 
    } = body;

    if (!name || !provider || !model) {
      return NextResponse.json({
        success: false,
        message: '名称、供应商和模型不能为空'
      }, { status: 400 });
    }

    // 如果设为默认，先取消其他默认
    if (is_default === 1) {
      await execute(`
        UPDATE "SYSDBA"."model_configs" SET "is_default" = 0
      `);
    }

    if (id) {
      // 更新
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      updateFields.push('"name" = ?');
      updateValues.push(name);
      updateFields.push('"provider" = ?');
      updateValues.push(provider);
      if (base_url) {
        updateFields.push('"base_url" = ?');
        updateValues.push(base_url);
      }
      // 只有真正填写了 api_key 才更新，空字符串不更新（保留原值）
      if (api_key && api_key.trim() && api_key !== '***已保存***') {
        updateFields.push('"api_key" = ?');
        updateValues.push(api_key);
      }
      updateFields.push('"model" = ?');
      updateValues.push(model);
      updateFields.push('"is_default" = ?');
      updateValues.push(is_default || 0);
      updateFields.push('"status" = ?');
      updateValues.push(status || 'active');
      updateFields.push('"updated_at" = CURRENT_TIMESTAMP');
      updateValues.push(id);

      await execute(`
        UPDATE "SYSDBA"."model_configs" 
        SET ${updateFields.join(', ')} 
        WHERE "id" = ?
      `, updateValues);

      return NextResponse.json({
        success: true,
        message: '更新成功'
      });
    } else {
      // 新增
      await execute(`
        INSERT INTO "SYSDBA"."model_configs" (
          "name", "provider", "base_url", "api_key", "model", "is_default", "status"
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        name,
        provider,
        base_url || null,
        api_key || null,
        model,
        is_default || 0,
        status || 'active'
      ]);

      return NextResponse.json({
        success: true,
        message: '创建成功'
      });
    }
  } catch (error) {
    console.error('保存模型配置失败:', error);
    return NextResponse.json({
      success: false,
      message: '保存失败',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// 删除模型配置（需要管理员权限）
export async function DELETE(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        message: '未授权'
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = await getUserFromToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({
        success: false,
        message: '需要管理员权限'
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        message: '缺少配置ID'
      }, { status: 400 });
    }

    // 检查是否为最后一个默认配置
    const config = await queryOne<any>(`
      SELECT * FROM "SYSDBA"."model_configs" WHERE "id" = ?
    `, [id]);

    if (!config) {
      return NextResponse.json({
        success: false,
        message: '配置不存在'
      }, { status: 404 });
    }

    // 删除
    await execute(`
      DELETE FROM "SYSDBA"."model_configs" WHERE "id" = ?
    `, [id]);

    // 如果删除的是默认配置，指定另一个为默认
    if (config.is_default === 1) {
      const nextConfig = await queryOne<any>(`
        SELECT * FROM "SYSDBA"."model_configs" ORDER BY "id" ASC
      `);
      if (nextConfig) {
        await execute(`
          UPDATE "SYSDBA"."model_configs" SET "is_default" = 1 WHERE "id" = ?
        `, [nextConfig.id]);
      }
    }

    return NextResponse.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除模型配置失败:', error);
    return NextResponse.json({
      success: false,
      message: '删除失败',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// 更新模型配置（支持直接更新特定字段）
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, model, base_url } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        message: '缺少 id'
      }, { status: 400 });
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (model !== undefined) {
      updateFields.push('"model" = ?');
      updateValues.push(model);
    }
    if (base_url !== undefined) {
      updateFields.push('"base_url" = ?');
      updateValues.push(base_url);
    }

    if (updateFields.length === 0) {
      return NextResponse.json({
        success: false,
        message: '没有需要更新的字段'
      }, { status: 400 });
    }

    updateFields.push('"updated_at" = CURRENT_TIMESTAMP');
    updateValues.push(id);

    await execute(`
      UPDATE "SYSDBA"."model_configs" 
      SET ${updateFields.join(', ')}
      WHERE "id" = ?
    `, updateValues);

    return NextResponse.json({
      success: true,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新模型配置失败:', error);
    return NextResponse.json({
      success: false,
      message: '更新失败',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}