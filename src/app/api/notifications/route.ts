import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/dm-helper';
import { getUserFromToken } from '@/lib/auth';

// 获取当前用户的消息列表
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
    const pageSize = parseInt(searchParams.get('page_size') || '20');
    const offset = (page - 1) * pageSize;

    // 获取消息列表
    const notifications = await query(`
      SELECT 
        n.*,
        p.name as project_name
      FROM "SYSDBA"."notifications" n
      LEFT JOIN "SYSDBA"."projects" p ON n.project_id = p.id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
      LIMIT ? OFFSET ?
    `, [user.id, pageSize, offset]);

    // 获取总数
    const countResult = await query(`
      SELECT COUNT(*) as total FROM "SYSDBA"."notifications" WHERE user_id = ?
    `, [user.id]);

    // 获取未读数
    const unreadResult = await query(`
      SELECT COUNT(*) as count FROM "SYSDBA"."notifications" WHERE user_id = ? AND is_read = 0
    `, [user.id]);

    return NextResponse.json({
      success: true,
      data: {
        list: notifications,
        unreadCount: unreadResult[0]?.count || 0,
        pagination: {
          page,
          pageSize,
          total: countResult[0]?.total || 0,
          totalPages: Math.ceil((countResult[0]?.total || 0) / pageSize)
        }
      }
    });
  } catch (error) {
    console.error('获取消息列表失败:', error);
    return NextResponse.json({
      success: false,
      message: '获取消息列表失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 标记消息为已读
export async function PATCH(request: Request) {
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

    const body = await request.json();
    const { notificationId } = body;

    if (notificationId) {
      // 标记单条消息为已读
      await execute(`
        UPDATE "SYSDBA"."notifications" SET is_read = 1 WHERE id = ? AND user_id = ?
      `, [notificationId, user.id]);
    } else {
      // 标记所有消息为已读
      await execute(`
        UPDATE "SYSDBA"."notifications" SET is_read = 1 WHERE user_id = ?
      `, [user.id]);
    }

    return NextResponse.json({
      success: true,
      message: '标记已读成功'
    });
  } catch (error) {
    console.error('标记已读失败:', error);
    return NextResponse.json({
      success: false,
      message: '标记已读失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
