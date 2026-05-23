import { NextResponse } from 'next/server';
import { execute, queryOne } from '@/lib/dm-helper';
import { getUserFromToken } from '@/lib/auth';

// 更新任务进度
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
    const { progress } = body;

    // 验证进度值
    if (progress === undefined || progress === null || typeof progress !== 'number') {
      return NextResponse.json({
        success: false,
        message: '进度值无效'
      }, { status: 400 });
    }

    if (progress < 0 || progress > 100) {
      return NextResponse.json({
        success: false,
        message: '进度值必须在 0-100 之间'
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

    const oldProgress = currentProject.progress;

    // 如果进度没有变化，直接返回成功
    if (oldProgress === progress) {
      return NextResponse.json({
        success: true,
        message: '进度未变化',
        data: currentProject
      });
    }

    // 根据进度自动计算状态
    let status = currentProject.status;
    if (progress === 0) {
      status = 'planning';
    } else if (progress === 100) {
      status = 'completed';
    } else {
      status = 'in_progress';
    }

    // 更新任务进度
    await execute(`
      UPDATE "projects"
      SET progress = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [progress, status, id]);

    // 获取更新后的任务
    const updatedProject = await queryOne<any>(
      'SELECT * FROM "projects" WHERE "id" = ?',
      [id]
    );

    return NextResponse.json({
      success: true,
      message: '进度更新成功',
      data: updatedProject
    });

  } catch (error) {
    console.error('更新任务进度失败:', error);
    return NextResponse.json({
      success: false,
      message: '更新任务进度失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
