import { NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/dm-helper';
import { getUserFromToken } from '@/lib/auth';

// 获取所有项目类型
export async function GET(request: Request) {
  try {
    const types = await query(`
      SELECT * FROM "SYSDBA"."project_types" 
      WHERE "is_active" = 1 
      ORDER BY "sort_order" ASC, "id" ASC
    `);
    
    return NextResponse.json({
      success: true,
      data: types
    });
  } catch (error) {
    console.error('获取项目类型失败:', error);
    return NextResponse.json({
      success: false,
      message: '获取项目类型失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 创建项目类型（仅管理员）
export async function POST(request: Request) {
  try {
    // 验证用户权限
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        message: '未提供有效的认证信息'
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = await getUserFromToken(token);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: '无效的认证信息'
      }, { status: 401 });
    }

    // 只有管理员可以创建项目类型
    if (user.role !== 'admin') {
      return NextResponse.json({
        success: false,
        message: '只有管理员可以创建项目类型'
      }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, color, sortOrder } = body;

    // 验证必填字段
    if (!name || name.trim() === '') {
      return NextResponse.json({
        success: false,
        message: '项目类型名称不能为空'
      }, { status: 400 });
    }

    // 检查名称是否已存在
    const existing = await queryOne<any>(
      'SELECT "id" FROM "SYSDBA"."project_types" WHERE "name" = ?',
      [name.trim()]
    );
    
    if (existing) {
      return NextResponse.json({
        success: false,
        message: '项目类型名称已存在'
      }, { status: 400 });
    }

    // 插入新项目类型
    await execute(`
      INSERT INTO "SYSDBA"."project_types" ("name", "description", "color", "sort_order", "is_active")
      VALUES (?, ?, ?, ?, 1)
    `, [
      name.trim(),
      description || null,
      color || '#3b82f6',
      sortOrder || 0
    ]);

    return NextResponse.json({
      success: true,
      message: '项目类型创建成功'
    });
  } catch (error) {
    console.error('创建项目类型失败:', error);
    return NextResponse.json({
      success: false,
      message: '创建项目类型失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
