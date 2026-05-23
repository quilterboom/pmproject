import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/dm-helper';

export async function GET() {
  try {
    // 先检查字段是否存在
    const columns = await query<any[]>('SELECT "COLUMN_NAME" FROM "USER_TAB_COLUMNS" WHERE "TABLE_NAME" = \'PROJECTS\'');
    const columnNames = columns.map((col: any) => col.COLUMN_NAME);

    const messages = [];

    // 删除 budget 字段（如果存在）
    if (columnNames.includes('BUDGET')) {
      await execute('ALTER TABLE "projects" DROP ("budget")');
      messages.push('budget 字段已删除');
    } else {
      messages.push('budget 字段不存在');
    }

    // 删除 actual_cost 字段（如果存在）
    if (columnNames.includes('ACTUAL_COST')) {
      await execute('ALTER TABLE "projects" DROP ("actual_cost")');
      messages.push('actual_cost 字段已删除');
    } else {
      messages.push('actual_cost 字段不存在');
    }

    // 验证字段已删除
    const newColumns = await query<any[]>('SELECT "COLUMN_NAME" FROM "USER_TAB_COLUMNS" WHERE "TABLE_NAME" = \'PROJECTS\'');
    const newColumnNames = newColumns.map((col: any) => col.COLUMN_NAME);

    return NextResponse.json({
      success: true,
      message: '预算字段处理完成',
      messages,
      currentColumns: newColumnNames
    });
  } catch (error) {
    console.error('删除预算字段失败:', error);
    return NextResponse.json({
      success: false,
      message: '删除预算字段失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
