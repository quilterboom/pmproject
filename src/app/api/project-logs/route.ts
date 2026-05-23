import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/dm-helper';

// 获取项目操作日志
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    if (!projectId) {
      return NextResponse.json({
        success: false,
        message: '缺少项目ID'
      }, { status: 400 });
    }

    const logs = await query<any>(`
      SELECT 
        pl.*,
        u.real_name as operator_name
      FROM "SYSDBA"."project_logs" pl
      LEFT JOIN "SYSDBA"."users" u ON pl.operator_id = u.id
      WHERE pl.project_id = ?
      ORDER BY pl.created_at DESC
      LIMIT 50
    `, [projectId]);

    return NextResponse.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('获取操作日志失败:', error);
    return NextResponse.json({
      success: false,
      message: '获取操作日志失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 记录操作日志
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId, operatorId, action, details } = body;

    if (!projectId || !action) {
      return NextResponse.json({
        success: false,
        message: '缺少必要参数'
      }, { status: 400 });
    }

    await execute(`
      INSERT INTO "SYSDBA"."project_logs" (
        "project_id", "operator_id", "action", "details"
      ) VALUES (?, ?, ?, ?)
    `, [projectId, operatorId || null, action, details || null]);

    return NextResponse.json({
      success: true,
      message: '日志记录成功'
    });
  } catch (error) {
    console.error('记录操作日志失败:', error);
    return NextResponse.json({
      success: false,
      message: '记录操作日志失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
