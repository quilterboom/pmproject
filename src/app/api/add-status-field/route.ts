import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/dm-helper';

// 检查并添加 status 字段
export async function POST() {
  try {
    // 检查字段是否已存在
    const columns = await query<any[]>(`
      SELECT "COLUMN_NAME" FROM "USER_TAB_COLUMNS" WHERE "TABLE_NAME" = 'PROJECTS' AND "COLUMN_NAME" = 'STATUS'
    `);

    if (columns.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'status 字段已存在'
      });
    }

    // 添加字段（达梦语法）
    await execute(`
      ALTER TABLE "projects" ADD ("status" VARCHAR(50) DEFAULT 'planning')
    `);

    return NextResponse.json({
      success: true,
      message: '成功添加 status 字段'
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
