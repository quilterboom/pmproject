import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/dm-helper';

// 添加 current_progress 字段到 projects 表
export async function POST() {
  try {
    // 检查字段是否已存在
    const columns = await query<any[]>(`
      SELECT "COLUMN_NAME" FROM "USER_TAB_COLUMNS" WHERE "TABLE_NAME" = 'PROJECTS' AND "COLUMN_NAME" = 'CURRENT_PROGRESS'
    `);

    if (columns.length > 0) {
      return NextResponse.json({
        success: true,
        message: '字段已存在'
      });
    }

    // 添加字段（达梦语法）
    await execute(`
      ALTER TABLE "projects" ADD ("current_progress" VARCHAR(500))
    `);

    return NextResponse.json({
      success: true,
      message: '成功添加 current_progress 字段'
    });
  } catch (error) {
    console.error('添加字段失败:', error);
    return NextResponse.json({
      success: false,
      message: '添加字段失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
