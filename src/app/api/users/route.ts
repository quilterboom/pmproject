import { NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/dm-helper';
import { getUserFromToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// 获取用户列表
export async function GET(request: Request) {
  try {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('page_size') || '10');
    const departmentId = searchParams.get('department_id');
    const role = searchParams.get('role');

    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    // 非管理员只能看到同部门的用户
    if (user.role !== 'admin') {
      whereClause += ' AND u."department_id" = ?';
      params.push(user.department_id);
    }

    if (departmentId) {
      whereClause += ' AND u."department_id" = ?';
      params.push(departmentId);
    }

    if (role) {
      whereClause += ' AND u."role" = ?';
      params.push(role);
    }

    // 查询总数
    const countResult = await queryOne<{ total: number }>(
      `SELECT COUNT(*) as total FROM "SYSDBA"."users" u ${whereClause}`,
      params
    );
    const total = countResult?.total || 0;

    // 查询用户列表
    const users = await query<any>(`
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
      ${whereClause}
      ORDER BY u."created_at" DESC
      LIMIT ? OFFSET ?
    `, [...params, pageSize, offset]);

    return NextResponse.json({
      success: true,
      data: {
        list: users,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return NextResponse.json({
      success: false,
      message: '获取用户列表失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 创建用户（仅管理员）
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: '未授权' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const currentUser = await getUserFromToken(token);
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ success: false, message: '无权限创建用户' }, { status: 403 });
    }

    const body = await request.json();
    const { username, password, realName, email, phone, departmentId, officeId, moduleId, role, status } = body;

    if (!username || !password) {
      return NextResponse.json({ success: false, message: '用户名和密码不能为空' }, { status: 400 });
    }

    // 检查用户名是否存在
    const existing = await queryOne<any>('SELECT "id" FROM "SYSDBA"."users" WHERE "username" = ?', [username]);
    if (existing) {
      return NextResponse.json({ success: false, message: '用户名已存在' }, { status: 400 });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 插入用户
    await execute(`
      INSERT INTO "SYSDBA"."users" ("username", "password", "real_name", "email", "phone", "department_id", "office_id", "module_id", "role", "status")
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [username, hashedPassword, realName || null, email || null, phone || null, departmentId || null, officeId ? parseInt(officeId) : null, moduleId ? parseInt(moduleId) : null, role || 'member', status || 'active']);

    return NextResponse.json({ success: true, message: '创建成功' });
  } catch (error) {
    console.error('创建用户失败:', error);
    return NextResponse.json({ success: false, message: '创建失败' }, { status: 500 });
  }
}
