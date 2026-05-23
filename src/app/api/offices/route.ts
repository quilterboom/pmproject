import { NextResponse } from 'next/server';
import { query } from '@/lib/dm-helper';

// 获取科室列表（可以按部门筛选）
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('department_id');

    let sql = 'SELECT "id", "department_id", "name", "description" FROM "SYSDBA"."offices"';
    const params: any[] = [];

    if (departmentId) {
      sql += ' WHERE "department_id" = ?';
      params.push(departmentId);
    }

    sql += ' ORDER BY "id"';

    const offices = await query(sql, params);

    return NextResponse.json({
      success: true,
      data: offices
    });
  } catch (error) {
    console.error('获取科室列表失败:', error);
    return NextResponse.json({
      success: false,
      message: '获取科室列表失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
