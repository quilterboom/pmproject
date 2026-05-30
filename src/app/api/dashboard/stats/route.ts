import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/dm-helper';
import { getUserFromToken } from '@/lib/auth';

// 获取项目统计数据（用于大屏展示）
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: '未提供认证信息' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ success: false, message: '无效的认证信息' }, { status: 401 });
    }

    const isAdmin = user.role === 'admin';

    // ========== 总项目数 ==========
    let totalProjects = 0;
    if (isAdmin) {
      const totalResult = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM "SYSDBA"."projects"');
      totalProjects = totalResult?.count || 0;
    } else {
      const managerName = `%${user.realName || user.username}%`;
      const totalResult = await queryOne<{ count: number }>(
        'SELECT COUNT(*) as count FROM "SYSDBA"."projects" WHERE manager_name LIKE ?',
        [managerName]
      );
      totalProjects = totalResult?.count || 0;
    }

    // ========== 计算状态 ==========
    let allProjects: any[] = [];
    if (isAdmin) {
      allProjects = await query<any>('SELECT id, progress, status FROM "SYSDBA"."projects"');
    } else {
      const managerName = `%${user.realName || user.username}%`;
      allProjects = await query<any>(
        'SELECT id, progress, status FROM "SYSDBA"."projects" WHERE manager_name LIKE ?',
        [managerName]
      );
    }

    const statusCounts: Record<string, number> = { planning: 0, in_progress: 0, completed: 0, on_hold: 0, cancelled: 0 };
    allProjects.forEach(p => {
      const status = p.status;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    const byStatus = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

    // ========== 优先级统计 ==========
    let priorityResult: any[] = [];
    if (isAdmin) {
      priorityResult = await query<any>('SELECT priority, COUNT(*) as count FROM "SYSDBA"."projects" GROUP BY priority');
    } else {
      const managerName = `%${user.realName || user.username}%`;
      priorityResult = await query<any>(
        'SELECT priority, COUNT(*) as count FROM "SYSDBA"."projects" WHERE manager_name LIKE ? GROUP BY priority',
        [managerName]
      );
    }

    // ========== 部门统计 ==========
    let deptResult: any[] = [];
    if (isAdmin) {
      deptResult = await query<any>(`
        SELECT d.name as department_name, COUNT(*) as count
        FROM "SYSDBA"."projects" p LEFT JOIN "SYSDBA"."departments" d ON p.department_id = d.id
        GROUP BY p.department_id, d.name ORDER BY count DESC
      `);
    } else {
      const managerName = `%${user.realName || user.username}%`;
      deptResult = await query<any>(`
        SELECT d.name as department_name, COUNT(*) as count
        FROM "SYSDBA"."projects" p LEFT JOIN "SYSDBA"."departments" d ON p.department_id = d.id
        WHERE p.manager_name LIKE ?
        GROUP BY p.department_id, d.name ORDER BY count DESC
      `, [managerName]);
    }

    // ========== 模块项目 ==========
    let projectsByModule: any[] = [];
    if (isAdmin) {
      projectsByModule = await query<any>(`
        SELECT p.id, p.name, m.name as module_name, p.progress, p.status, p.priority, p.end_date
        FROM "SYSDBA"."projects" p LEFT JOIN "SYSDBA"."modules" m ON p.module_id = m.id
        ORDER BY m.name ASC, p.end_date ASC, p.priority DESC
      `);
      if (projectsByModule.length === 0) projectsByModule = [];
    } else {
      const managerName = `%${user.realName || user.username}%`;
      projectsByModule = await query<any>(`
        SELECT p.id, p.name, m.name as module_name, p.progress, p.status, p.priority, p.end_date
        FROM "SYSDBA"."projects" p LEFT JOIN "SYSDBA"."modules" m ON p.module_id = m.id
        WHERE p.manager_name LIKE ?
        ORDER BY m.name ASC, p.end_date ASC, p.priority DESC
      `, [managerName]);
    }

    // ========== 模块统计 ==========
    let moduleResult: any[] = [];
    if (isAdmin) {
      moduleResult = await query<any>(`
        SELECT m.name as module_name, COUNT(p.id) as count
        FROM "SYSDBA"."modules" m LEFT JOIN "SYSDBA"."projects" p ON p.module_id = m.id
        GROUP BY m.id, m.name HAVING COUNT(p.id) > 0 ORDER BY count DESC
      `);
    } else {
      const managerName = `%${user.realName || user.username}%`;
      moduleResult = await query<any>(`
        SELECT m.name as module_name, COUNT(p.id) as count
        FROM "SYSDBA"."modules" m LEFT JOIN "SYSDBA"."projects" p ON p.module_id = m.id
        WHERE p.manager_name LIKE ?
        GROUP BY m.id, m.name HAVING COUNT(p.id) > 0 ORDER BY count DESC
      `, [managerName]);
    }

    const byProjectType = moduleResult.map(mod => {
      const modProjects = projectsByModule.filter(p => p.module_name === mod.module_name);
      return {
        project_type_name: mod.module_name,
        count: mod.count,
        projects: modProjects.map(p => ({
          ...p,
          is_overdue: p.end_date && new Date(p.end_date) < new Date() && (p.status === 'planning' || p.status === 'in_progress')
        }))
      };
    });

    // ========== 平均进度 ==========
    let avgProgress = 0;
    if (isAdmin) {
      const r = await queryOne<{ avg: number }>('SELECT AVG(progress) as avg FROM "SYSDBA"."projects" WHERE status != ?', ['cancelled']);
      avgProgress = r?.avg || 0;
    } else {
      const managerName = `%${user.realName || user.username}%`;
      const r = await queryOne<{ avg: number }>(
        'SELECT AVG(progress) as avg FROM "SYSDBA"."projects" WHERE manager_name LIKE ? AND status != ?',
        [managerName, 'cancelled']
      );
      avgProgress = r?.avg || 0;
    }

    // ========== 最近7天 ==========
    let recentProjects = 0;
    if (isAdmin) {
      const r = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM "SYSDBA"."projects" WHERE created_at >= CURRENT_TIMESTAMP - 7');
      recentProjects = r?.count || 0;
    } else {
      const managerName = `%${user.realName || user.username}%`;
      const r = await queryOne<{ count: number }>(
        'SELECT COUNT(*) as count FROM "SYSDBA"."projects" WHERE manager_name LIKE ? AND created_at >= CURRENT_TIMESTAMP - 7',
        [managerName]
      );
      recentProjects = r?.count || 0;
    }

    // ========== 即将到期 ==========
    let upcomingProjects = 0;
    if (isAdmin) {
      const r = await queryOne<{ count: number }>(`
        SELECT COUNT(*) as count FROM "SYSDBA"."projects"
        WHERE end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 30 AND status IN ('planning', 'in_progress')
      `);
      upcomingProjects = r?.count || 0;
    } else {
      const managerName = `%${user.realName || user.username}%`;
      const r = await queryOne<{ count: number }>(`
        SELECT COUNT(*) as count FROM "SYSDBA"."projects"
        WHERE manager_name LIKE ? AND end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 30 AND status IN ('planning', 'in_progress')
      `, [managerName]);
      upcomingProjects = r?.count || 0;
    }

    // ========== 超期项目 ==========
    let overdueProjects = 0;
    if (isAdmin) {
      const r = await queryOne<{ count: number }>(`
        SELECT COUNT(*) as count FROM "SYSDBA"."projects"
        WHERE end_date < CURRENT_DATE AND status IN ('planning', 'in_progress')
      `);
      overdueProjects = r?.count || 0;
    } else {
      const managerName = `%${user.realName || user.username}%`;
      const r = await queryOne<{ count: number }>(`
        SELECT COUNT(*) as count FROM "SYSDBA"."projects"
        WHERE manager_name LIKE ? AND end_date < CURRENT_DATE AND status IN ('planning', 'in_progress')
      `, [managerName]);
      overdueProjects = r?.count || 0;
    }

    // ========== 按状态项目列表 ==========
    const projectsByStatus = await Promise.all(
      ['planning', 'in_progress', 'completed', 'on_hold', 'cancelled'].map(async (status) => {
        let projects: any[] = [];
        if (isAdmin) {
          projects = await query<any>(`
            SELECT p.id, p.name, d.name as department_name, p.progress, p.priority, p.end_date
            FROM "SYSDBA"."projects" p LEFT JOIN "SYSDBA"."departments" d ON p.department_id = d.id
            WHERE p.status = ? ORDER BY p.end_date ASC, p.priority DESC
          `, [status]);
        } else {
          const managerName = `%${user.realName || user.username}%`;
          projects = await query<any>(`
            SELECT p.id, p.name, d.name as department_name, p.progress, p.priority, p.end_date
            FROM "SYSDBA"."projects" p LEFT JOIN "SYSDBA"."departments" d ON p.department_id = d.id
            WHERE p.manager_name LIKE ? AND p.status = ? ORDER BY p.end_date ASC, p.priority DESC
          `, [managerName, status]);
        }
        return {
          status,
          count: projects.length,
          projects: projects.map(p => ({
            ...p,
            is_overdue: status === 'in_progress' && p.end_date && new Date(p.end_date) < new Date()
          }))
        };
      })
    );

    // ========== 最新项目 ==========
    let latestProjects: any[] = [];
    if (isAdmin) {
      latestProjects = await query<any>(`
        SELECT p.id, p.name, d.name as department_name, p.progress, p.status, p.priority, p.created_at
        FROM "SYSDBA"."projects" p LEFT JOIN "SYSDBA"."departments" d ON p.department_id = d.id
        ORDER BY p.created_at DESC LIMIT 10
      `);
    } else {
      const managerName = `%${user.realName || user.username}%`;
      latestProjects = await query<any>(`
        SELECT p.id, p.name, d.name as department_name, p.progress, p.status, p.priority, p.created_at
        FROM "SYSDBA"."projects" p LEFT JOIN "SYSDBA"."departments" d ON p.department_id = d.id
        WHERE p.manager_name LIKE ? ORDER BY p.created_at DESC LIMIT 10
      `, [managerName]);
    }

    return NextResponse.json({
      success: true,
      data: {
        totalProjects,
        avgProgress: Math.round(avgProgress),
        overview: { recentProjects, upcomingProjects, overdueProjects },
        byStatus,
        byPriority: priorityResult,
        byProjectType,
        projectsByStatus,
        latestProjects
      }
    });

  } catch (error) {
    console.error('获取统计数据失败:', error);
    return NextResponse.json({
      success: false,
      message: '获取统计数据失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}