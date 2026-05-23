import { NextResponse } from 'next/server';
import { query } from '@/lib/dm-helper';

// 获取所有部门
export async function GET() {
  try {
    const departments = await query('SELECT "id", "name", "description" FROM "SYSDBA"."departments" ORDER BY "id"');

    return NextResponse.json({
      success: true,
      data: departments
    });
  } catch (error) {
    console.error('获取部门列表失败:', error);
    return NextResponse.json({
      success: false,
      message: '获取部门列表失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
