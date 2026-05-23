import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/dm-helper';

export async function POST() {
  try {
    // 创建项目类型表（达梦数据库语法）
    await execute(`
      CREATE TABLE IF NOT EXISTS "project_types" (
        "id" INT IDENTITY(1,1) PRIMARY KEY,
        "name" VARCHAR(100) NOT NULL UNIQUE,
        "description" VARCHAR(500),
        "color" VARCHAR(20) DEFAULT '#3b82f6',
        "sort_order" INT DEFAULT 0,
        "is_active" SMALLINT DEFAULT 1,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 插入默认数据
    await execute(`
      DELETE FROM "SYSDBA"."project_types"
    `);
    
    await execute(`
      INSERT INTO "SYSDBA"."project_types" ("name", "description", "color", "sort_order", "is_active") VALUES
      ('专项任务', '针对特定目标的专项任务', '#3b82f6', 1, 1),
      ('日常任务', '日常运维和管理任务', '#22c55e', 2, 1)
    `);

    // 检查 projects 表是否有 project_type_id 字段
    const columns = await query<any[]>(`
      SELECT "COLUMN_NAME" FROM "USER_TAB_COLUMNS" WHERE "TABLE_NAME" = 'projects' AND "COLUMN_NAME" = 'project_type_id'
    `);

    if (columns.length === 0) {
      // 添加 project_type_id 字段
      await execute(`
        ALTER TABLE "projects" ADD ("project_type_id" INT)
      `);
    }

    return NextResponse.json({
      success: true,
      message: '项目类型表创建成功'
    });
  } catch (error) {
    console.error('创建项目类型表失败:', error);
    return NextResponse.json({
      success: false,
      message: '创建项目类型表失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
