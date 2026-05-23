import { query } from './init-db';

/**
 * 记录项目操作日志
 */
export async function logProjectAction(params: {
  projectId: number;
  userId: number;
  action: 'created' | 'updated' | 'deleted' | 'status_changed' | 'progress_updated';
  changes?: Record<string, { old?: any; new: any }>;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  description?: string;
  ipAddress?: string;
}): Promise<void> {
  try {
    await query(`
      INSERT INTO project_logs (
        project_id, user_id, action, changes, old_values, new_values, description, ip_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      params.projectId,
      params.userId,
      params.action,
      JSON.stringify(params.changes || {}),
      JSON.stringify(params.oldValues || {}),
      JSON.stringify(params.newValues || {}),
      params.description || '',
      params.ipAddress || null
    ]);
  } catch (error) {
    console.error('记录项目操作日志失败:', error);
    // 记录失败不应影响主流程，只打印错误
  }
}

/**
 * 获取项目操作记录
 */
export async function getProjectLogs(projectId: number, limit: number = 50): Promise<any[]> {
  const logs = await query(`
    SELECT
      pl.*,
      u.username,
      u.real_name
    FROM project_logs pl
    LEFT JOIN users u ON pl.user_id = u.id
    WHERE pl.project_id = ?
    ORDER BY pl.created_at DESC
    LIMIT ?
  `, [projectId, limit]);

  return logs as any[];
}
