import { NextResponse } from 'next/server';
import { query, execute, queryOne } from '@/lib/dm-helper';
import { getUserFromToken } from '@/lib/auth';

// 更新任务状态
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证用户身份
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

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    // 验证状态值
    const validStatuses = ['planning', 'in_progress', 'completed', 'on_hold', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({
        success: false,
        message: '无效的状态值'
      }, { status: 400 });
    }

    // 获取当前任务信息
    const currentProject = await queryOne<any>(
      'SELECT * FROM "projects" WHERE "id" = ?',
      [id]
    );

    if (!currentProject) {
      return NextResponse.json({
        success: false,
        message: '任务不存在'
      }, { status: 404 });
    }

    const oldStatus = currentProject.status;

    // 如果状态没有变化，直接返回成功
    if (oldStatus === status) {
      return NextResponse.json({
        success: true,
        message: '状态未变化',
        data: currentProject
      });
    }

    // 更新任务状态
    await execute(`
      UPDATE "projects"
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, id]);

    // 获取更新后的任务
    const updatedProject = await queryOne<any>(
      'SELECT * FROM "projects" WHERE "id" = ?',
      [id]
    );

    return NextResponse.json({
      success: true,
      message: '状态更新成功',
      data: updatedProject
    });

  } catch (error) {
    console.error('更新任务状态失败:', error);
    return NextResponse.json({
      success: false,
      message: '更新任务状态失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
