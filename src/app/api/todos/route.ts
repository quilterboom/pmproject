import { NextResponse } from 'next/server';
import { query } from '@/lib/dm-helper';
import { getUserFromToken } from '@/lib/auth';

// 获取当前用户的待办项目列表
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

    // 获取当前用户负责的项目（根据 manager_name 匹配用户真实姓名）
    const projects = await query(`
      SELECT 
        p.*,
        d.name as department_name,
        o.name as office_name,
        m.name as module_name
      FROM "SYSDBA"."projects" p
      LEFT JOIN "SYSDBA"."departments" d ON p.department_id = d.id
      LEFT JOIN "SYSDBA"."offices" o ON p.office_id = o.id
      LEFT JOIN "SYSDBA"."modules" m ON p.module_id = m.id
      WHERE p.manager_name = ?
      AND p.status NOT IN ('completed', 'cancelled', 'terminated')
      ORDER BY p.end_date ASC, p.created_at DESC
    `, [user.real_name]);

    // 获取未读消息数
    const unreadCount = await query(`
      SELECT COUNT(*) as count FROM "SYSDBA"."notifications"
      WHERE user_id = ? AND is_read = 0
    `, [user.id]);

    return NextResponse.json({
      success: true,
      data: {
        projects: projects,
        unreadCount: unreadCount[0]?.count || 0
      }
    });
  } catch (error) {
    console.error('获取待办列表失败:', error);
    return NextResponse.json({
      success: false,
      message: '获取待办列表失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
