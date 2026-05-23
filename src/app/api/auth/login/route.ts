import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/dm-helper';
import { generateToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({
        success: false,
        message: '用户名和密码不能为空'
      }, { status: 400 });
    }

    // 查询用户
    const user = await queryOne<any>(
      'SELECT * FROM "SYSDBA"."users" WHERE "username" = ?',
      [username]
    );

    if (!user) {
      return NextResponse.json({
        success: false,
        message: '用户名或密码错误'
      }, { status: 401 });
    }

    // 检查用户状态
    if (user.status !== 'active') {
      return NextResponse.json({
        success: false,
        message: '账户已被禁用'
      }, { status: 403 });
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json({
        success: false,
        message: '用户名或密码错误'
      }, { status: 401 });
    }

    // 生成 Token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role
    });

    // 返回用户信息（不包含密码）
    const { password: _, ...userInfo } = user;

    return NextResponse.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: userInfo
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    return NextResponse.json({
      success: false,
      message: '登录失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
