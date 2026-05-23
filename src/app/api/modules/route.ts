import { NextResponse } from 'next/server';
import { query } from '@/lib/dm-helper';

// 获取模块列表（可以按科室筛选）
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const officeId = searchParams.get('office_id');

    let sql = 'SELECT "id", "office_id", "name", "description" FROM "SYSDBA"."modules"';
    const params: any[] = [];

    if (officeId) {
      sql += ' WHERE "office_id" = ?';
      params.push(officeId);
    }

    sql += ' ORDER BY "id"';

    const modules = await query(sql, params);

    return NextResponse.json({
      success: true,
      data: modules
    });
  } catch (error) {
    console.error('获取模块列表失败:', error);
    return NextResponse.json({
      success: false,
      message: '获取模块列表失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
