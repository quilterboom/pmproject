import { NextResponse } from 'next/server';
import { query } from '@/lib/dm-helper';

// 获取项目统计数据（用于大屏展示）- 不需要认证的版本
export async function GET() {
  try {
    // 按项目类型统计，并获取每个类型下的项目列表
    const types = await query<any[]>(`
      SELECT "id" as type_id, "name" as project_type_name, "color"
      FROM "SYSDBA"."project_types"
      WHERE "is_active" = 1
      ORDER BY "sort_order" ASC
    `);

    // 为每个项目类型获取项目列表
    const byProjectType = await Promise.all(
      types.map(async (type: any) => {
        const projects = await query<any[]>(`
          SELECT
            p."id",
            p."name",
            p."priority",
            p."end_date",
            p."status",
            p."progress",
            (
              SELECT STRING_AGG(u."real_name", ', ')
              FROM "project_members" pm
              JOIN "SYSDBA"."users" u ON pm."user_id" = u."id"
              WHERE pm."project_id" = p."id" AND pm."role" = 'manager'
            ) as manager_names
          FROM "SYSDBA"."projects" p
          WHERE p."project_type_id" = ?
          ORDER BY p."end_date" ASC, p."priority" DESC, p."created_at" DESC
        `, [type.type_id]);

        return {
          type_id: type.type_id,
          project_type_name: type.project_type_name,
          color: type.color,
          count: projects.length,
          projects: projects.map((p: any) => ({
            ...p,
            is_overdue: p.end_date && new Date(p.end_date) < new Date() && p.status !== 'completed' && p.status !== 'cancelled'
          }))
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        byProjectType
      }
    });
  } catch (error) {
    console.error('获取项目统计失败:', error);
    return NextResponse.json({
      success: false,
      message: '获取项目统计失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
