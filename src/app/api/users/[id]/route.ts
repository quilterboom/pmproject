import { NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/dm-helper';
import { getUserFromToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// 获取单个用户详情
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        message: '未提供有效的认证信息'
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const currentUser = await getUserFromToken(token);
    if (!currentUser) {
      return NextResponse.json({
        success: false,
        message: '无效的认证信息'
      }, { status: 401 });
    }

    const user = await queryOne<any>(`
      SELECT
        u."id", u."username", u."real_name", u."email", u."phone",
        u."department_id", u."office_id", u."module_id",
        u."role", u."status", u."created_at",
        d."name" as department_name,
        o."name" as office_name,
        m."name" as module_name
      FROM "SYSDBA"."users" u
      LEFT JOIN "SYSDBA"."departments" d ON u."department_id" = d."id"
      LEFT JOIN "SYSDBA"."offices" o ON u."office_id" = o."id"
      LEFT JOIN "SYSDBA"."modules" m ON u."module_id" = m."id"
      WHERE u."id" = ?
    `, [id]);

    if (!user) {
      return NextResponse.json({
        success: false,
        message: '用户不存在'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('获取用户详情失败:', error);
    return NextResponse.json({
      success: false,
      message: '获取用户详情失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 更新用户
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        message: '未提供有效的认证信息'
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const currentUser = await getUserFromToken(token);
    if (!currentUser) {
      return NextResponse.json({
        success: false,
        message: '无效的认证信息'
      }, { status: 401 });
    }

    const body = await request.json();
    const {
      realName,
      email,
      phone,
      departmentId,
      officeId,
      moduleId,
      role,
      status,
      password
    } = body;

    let sql = 'UPDATE "SYSDBA"."users" SET';
    const queryParams: any[] = [];
    const updates: string[] = [];

    if (realName !== undefined) {
      updates.push('"real_name" = ?');
      queryParams.push(realName);
    }
    if (email !== undefined) {
      updates.push('"email" = ?');
      queryParams.push(email);
    }
    if (phone !== undefined) {
      updates.push('"phone" = ?');
      queryParams.push(phone);
    }
    if (departmentId !== undefined) {
      updates.push('"department_id" = ?');
      queryParams.push(departmentId);
    }
    if (officeId !== undefined) {
      updates.push('"office_id" = ?');
      queryParams.push(officeId ? parseInt(officeId) : null);
    }
    if (moduleId !== undefined) {
      updates.push('"module_id" = ?');
      queryParams.push(moduleId ? parseInt(moduleId) : null);
    }
    if (role !== undefined && currentUser.role === 'admin') {
      updates.push('"role" = ?');
      queryParams.push(role);
    }
    if (status !== undefined && currentUser.role === 'admin') {
      updates.push('"status" = ?');
      queryParams.push(status);
    }
    // 只有在密码不为空时才更新密码
    if (password !== undefined && password !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push('"password" = ?');
      queryParams.push(hashedPassword);
    }

    if (updates.length === 0) {
      return NextResponse.json({
        success: false,
        message: '没有需要更新的字段'
      }, { status: 400 });
    }

    sql += ' ' + updates.join(', ') + ' WHERE "id" = ?';
    queryParams.push(Number(id));

    const affectedRows = await execute(sql, queryParams);

    if (affectedRows === 0) {
      return NextResponse.json({
        success: false,
        message: '用户不存在'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: '用户更新成功'
    });
  } catch (error) {
    console.error('更新用户失败:', error);
    return NextResponse.json({
      success: false,
      message: '更新用户失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 删除用户（仅管理员）
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        message: '未提供有效的认证信息'
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = await getUserFromToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({
        success: false,
        message: '无权限删除用户'
      }, { status: 403 });
    }

    const affectedRows = await execute('DELETE FROM "SYSDBA"."users" WHERE "id" = ?', [id]);

    if (affectedRows === 0) {
      return NextResponse.json({
        success: false,
        message: '用户不存在'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: '用户删除成功'
    });
  } catch (error) {
    console.error('删除用户失败:', error);
    return NextResponse.json({
      success: false,
      message: '删除用户失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 重置用户密码（仅管理员）
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        message: '未提供有效的认证信息'
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const currentUser = await getUserFromToken(token);
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({
        success: false,
        message: '无权限重置密码'
      }, { status: 403 });
    }

    const body = await request.json();
    const { password } = body;

    if (!password || password === '') {
      return NextResponse.json({
        success: false,
        message: '密码不能为空'
      }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const affectedRows = await execute(
      'UPDATE "SYSDBA"."users" SET "password" = ? WHERE "id" = ?',
      [hashedPassword, Number(id)]
    );

    if (affectedRows === 0) {
      return NextResponse.json({
        success: false,
        message: '用户不存在'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: '密码重置成功'
    });
  } catch (error) {
    console.error('重置密码失败:', error);
    return NextResponse.json({
      success: false,
      message: '重置密码失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
