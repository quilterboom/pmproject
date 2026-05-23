import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/dm-helper';

// 创建 project_logs 表
export async function POST() {
  try {
    // 检查表是否已存在
    const tables = await query<any[]>(`
      SELECT "TABLE_NAME" FROM "USER_TABLES" WHERE "TABLE_NAME" = 'PROJECT_LOGS'
    `);

    if (tables.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'project_logs 表已存在'
      });
    }

    // 创建表（达梦数据库语法）
    await execute(`
      CREATE TABLE "project_logs" (
        "id" INT IDENTITY(1,1) PRIMARY KEY,
        "project_id" INT NOT NULL,
        "user_id" INT NOT NULL,
        "action" VARCHAR(50) NOT NULL,
        "changes" VARCHAR(500),
        "old_values" VARCHAR(500),
        "new_values" VARCHAR(500),
        "description" VARCHAR(500),
        "ip_address" VARCHAR(100),
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    return NextResponse.json({
      success: true,
      message: '成功创建 project_logs 表'
    });
  } catch (error) {
    console.error('创建表失败:', error);
    return NextResponse.json({
      success: false,
      message: '创建表失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
