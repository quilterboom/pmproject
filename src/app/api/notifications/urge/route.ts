import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/dm-helper';
import { getUserFromToken } from '@/lib/auth';

// 催办通知
export async function POST(request: Request) {
  try {
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

    // 只有管理员可以催办
    if (currentUser.role !== 'admin') {
      return NextResponse.json({
        success: false,
        message: '只有管理员可以催办任务'
      }, { status: 403 });
    }

    const body = await request.json();
    const { projectId, taskId } = body;

    if (!projectId) {
      return NextResponse.json({
        success: false,
        message: '缺少项目ID'
      }, { status: 400 });
    }

    // 获取项目信息
    const projectResult = await query<any>(
      'SELECT * FROM "SYSDBA"."projects" WHERE "id" = ?',
      [projectId]
    );
    
    if (projectResult.length === 0) {
      return NextResponse.json({
        success: false,
        message: '项目不存在'
      }, { status: 404 });
    }

    const project = projectResult[0];

    // 获取任务信息（如果指定了任务ID）
    let task = null;
    if (taskId) {
      const taskResult = await query<any>(
        'SELECT * FROM "SYSDBA"."tasks" WHERE "id" = ?',
        [taskId]
      );
      if (taskResult.length > 0) {
        task = taskResult[0];
      }
    }

    // 获取当前时间
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const currentTimeStr = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    // 格式化催办内容
    let title = '';
    let content = '';
    let notifyUserIds: number[] = [];

    if (task) {
      // 催办具体任务
      title = `【催办提醒】${task.title}`;
      content = `${currentUser.real_name || currentUser.username} 在 ${currentTimeStr} 催办了任务「${task.title}」，请尽快处理！`;
      
      // 查找任务负责人（根据 assignee 字段查找对应用户）
      if (task.assignee) {
        const assigneeUsers = await query<any>(
          'SELECT "id" FROM "SYSDBA"."users" WHERE "real_name" = ? OR "username" = ?',
          [task.assignee, task.assignee]
        );
        assigneeUsers.forEach(u => notifyUserIds.push(u.id));
      }
    } else {
      // 催办整个项目
      title = `【催办提醒】${project.name}`;
      content = `${currentUser.real_name || currentUser.username} 在 ${currentTimeStr} 催办了项目「${project.name}」，请尽快处理！`;
      
      // 查找项目负责人
      if (project.manager_name) {
        const managerUsers = await query<any>(
          'SELECT "id" FROM "SYSDBA"."users" WHERE "real_name" = ? OR "username" = ?',
          [project.manager_name, project.manager_name]
        );
        managerUsers.forEach(u => notifyUserIds.push(u.id));
      }
    }

    if (notifyUserIds.length === 0) {
      return NextResponse.json({
        success: false,
        message: '未找到任务负责人，无法发送催办通知'
      }, { status: 400 });
    }

    // 去重
    notifyUserIds = [...new Set(notifyUserIds)];

    // 为每个负责人创建通知
    for (const userId of notifyUserIds) {
      await execute(
        `INSERT INTO "SYSDBA"."notifications" ("user_id", "type", "title", "content", "project_id", "is_read", "created_at") 
         VALUES (?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)`,
        [userId, 'urge', title, content, projectId]
      );
    }

    return NextResponse.json({
      success: true,
      message: `催办通知已发送，共通知 ${notifyUserIds.length} 位负责人`
    });
  } catch (error) {
    console.error('催办通知失败:', error);
    return NextResponse.json({
      success: false,
      message: '催办通知发送失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}