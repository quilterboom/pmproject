import { NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/dm-helper';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, realName, email, phone, departmentId, officeId, moduleId } = body;

    // 验证必填字段
    if (!username || !password || !realName) {
      return NextResponse.json({
        success: false,
        message: '用户名、密码和真实姓名不能为空'
      }, { status: 400 });
    }

    // 验证密码长度
    if (password.length < 6) {
      return NextResponse.json({
        success: false,
        message: '密码长度不能少于6位'
      }, { status: 400 });
    }

    // 检查用户名是否已存在
    const existingUser = await queryOne<any>(
      'SELECT "id" FROM "SYSDBA"."users" WHERE "username" = ?',
      [username]
    );

    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: '用户名已存在'
      }, { status: 400 });
    }

    // 检查邮箱是否已存在
    if (email) {
      const existingEmail = await queryOne<any>(
        'SELECT "id" FROM "SYSDBA"."users" WHERE "email" = ?',
        [email]
      );

      if (existingEmail) {
        return NextResponse.json({
          success: false,
          message: '邮箱已被使用'
        }, { status: 400 });
      }
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 插入用户
    await execute(`
      INSERT INTO "SYSDBA"."users" ("username", "password", "real_name", "email", "phone", "department_id", "office_id", "module_id", "role", "status")
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'user', 'active')
    `, [username, hashedPassword, realName, email || null, phone || null, departmentId || null, officeId || null, moduleId || null]);

    // 获取新插入的用户ID
    const newUser = await queryOne<any>('SELECT LAST_INSERT_ID() as "id"');

    return NextResponse.json({
      success: true,
      message: '注册成功',
      data: {
        id: newUser?.id,
        username,
        realName
      }
    });
  } catch (error) {
    console.error('注册失败:', error);
    return NextResponse.json({
      success: false,
      message: '注册失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
