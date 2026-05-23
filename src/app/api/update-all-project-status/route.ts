import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/dm-helper';

// 批量更新所有任务的状态字段（根据进度计算）
export async function POST() {
  try {
    // 获取所有任务的进度
    const projects = await query<any[]>(`
      SELECT "id", "progress", "status"
      FROM "SYSDBA"."projects"
    `);

    let updatedCount = 0;

    // 更新每个任务的状态
    for (const project of projects) {
      let newStatus = project.status;

      // 如果状态是暂停或取消，保持不变
      if (project.status !== 'on_hold' && project.status !== 'cancelled') {
        // 否则根据进度计算状态
        if (project.progress === 0) {
          newStatus = 'planning';
        } else if (project.progress === 100) {
          newStatus = 'completed';
        } else {
          newStatus = 'in_progress';
        }
      }

      // 如果状态需要更新
      if (newStatus !== project.status) {
        await execute(`
          UPDATE "SYSDBA"."projects"
          SET "status" = ?
          WHERE "id" = ?
        `, [newStatus, project.id]);
        updatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `成功更新 ${updatedCount} 个任务的状态`,
      data: {
        totalProjects: projects.length,
        updatedCount
      }
    });
  } catch (error) {
    console.error('批量更新状态失败:', error);
    return NextResponse.json({
      success: false,
      message: '批量更新状态失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
