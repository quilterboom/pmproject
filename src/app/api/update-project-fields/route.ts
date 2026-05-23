import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/dm-helper';

// 修改 projects 表结构：移除 code 字段，修改 priority 为 1,2,3
export async function POST() {
  try {
    // 1. 移除 code 字段
    try {
      const columns = await query<any[]>(`
        SELECT "COLUMN_NAME" FROM "USER_TAB_COLUMNS" WHERE "TABLE_NAME" = 'PROJECTS' AND "COLUMN_NAME" = 'CODE'
      `);

      if (columns.length > 0) {
        await execute(`
          ALTER TABLE "projects" DROP ("code")
        `);
        console.log('已移除 code 字段');
      }
    } catch (error) {
      console.error('移除 code 字段失败:', error);
    }

    // 2. 修改 priority 字段为数字
    try {
      // 先检查 priority 字段
      const columns = await query<any[]>(`
        SELECT "COLUMN_NAME" FROM "USER_TAB_COLUMNS" WHERE "TABLE_NAME" = 'PROJECTS' AND "COLUMN_NAME" = 'PRIORITY'
      `);

      if (columns.length > 0) {
        // 将优先级转换为 1,2,3
        // 'high' -> 1, 'medium' -> 2, 'low' -> 3
        await execute(`
          UPDATE "SYSDBA"."projects"
          SET "priority" = CASE "priority"
            WHEN 'high' THEN 1
            WHEN 'medium' THEN 2
            WHEN 'low' THEN 3
            ELSE 2
          END
        `);

        console.log('已修改 priority 字段值');
      }
    } catch (error) {
      console.error('修改 priority 字段失败:', error);
    }

    return NextResponse.json({
      success: true,
      message: '成功修改数据库结构'
    });
  } catch (error) {
    console.error('修改数据库结构失败:', error);
    return NextResponse.json({
      success: false,
      message: '修改数据库结构失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
