import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/dm-helper';
import { getUserFromToken } from '@/lib/auth';

// 终止任务
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json({
        success: false,
        message: '请输入终止原因'
      }, { status: 400 });
    }

    // 获取任务当前值
    const projects = await query<any[]>('SELECT * FROM "projects" WHERE "id" = ?', [id]);
    const currentProject = projects[0] as any;
    if (projects.length === 0) {
      return NextResponse.json({
        success: false,
        message: '任务不存在'
      }, { status: 404 });
    }

    // 更新任务状态和进展记录
    await query(`
      UPDATE "projects"
      SET "status" = 'cancelled',
          "current_progress" = COALESCE("current_progress", '') || '\n\n【终止原因】' || ?
      WHERE "id" = ?
    `, [reason, id]);

    // 记录操作日志
    let ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    if (ipAddress && ipAddress.includes(',')) {
      ipAddress = ipAddress.split(',')[0].trim();
    }

    // 构建变更记录
    const statusLabels: Record<string, string> = {
      planning: '规划中',
      in_progress: '进行中',
      completed: '已完成',
      terminated: '已终止',
      paused: '已暂停',
      cancelled: '已终止'
    };

    const oldStatusLabel = statusLabels[currentProject.status] || currentProject.status;
    const details = `状态: ${oldStatusLabel} → 已终止\n原因: ${reason}`;

    await execute(`
      INSERT INTO "SYSDBA"."project_logs" ("project_id", "operator_id", "action", "details")
      VALUES (?, ?, ?, ?)
    `, [id, user.id, 'terminated', details]);

    return NextResponse.json({
      success: true,
      message: '任务已终止'
    });
  } catch (error) {
    console.error('终止任务失败:', error);
    return NextResponse.json({
      success: false,
      message: '终止任务失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
