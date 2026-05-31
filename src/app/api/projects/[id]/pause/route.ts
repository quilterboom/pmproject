import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/dm-helper';
import { getUserFromToken } from '@/lib/auth';

// 暂停项目
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
        message: '请输入暂停原因'
      }, { status: 400 });
    }

    // 获取项目当前值
    const projects = await query('SELECT * FROM projects WHERE id = ?', [id]) as any[];
    if (projects.length === 0) {
      return NextResponse.json({
        success: false,
        message: '项目不存在'
      }, { status: 404 });
    }

    const currentProject = projects[0];

    // 更新项目状态和进展记录
    await query(`
      UPDATE "projects"
      SET "status" = 'on_hold',
          "current_progress" = COALESCE("current_progress", '') || '\n\n【暂停原因】' || ?
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
      on_hold: '已暂停'
    };

    const oldStatusLabel = statusLabels[currentProject.status] || currentProject.status;
    const details = `状态: ${oldStatusLabel} → 已暂停\n原因: ${reason}`;

    await execute(`
      INSERT INTO "SYSDBA"."project_logs" ("project_id", "operator_id", "action", "details")
      VALUES (?, ?, ?, ?)
    `, [id, user.id, 'paused', details]);

    return NextResponse.json({
      success: true,
      message: '项目已暂停'
    });
  } catch (error) {
    console.error('暂停项目失败:', error);
    return NextResponse.json({
      success: false,
      message: '暂停项目失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
