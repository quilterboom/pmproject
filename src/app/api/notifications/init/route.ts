import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/dm-helper';

// 创建消息通知表
export async function GET() {
  try {
    // 创建 notifications 表
    await execute(`
      CREATE TABLE IF NOT EXISTS "SYSDBA"."notifications" (
        "id" INT IDENTITY(1,1) PRIMARY KEY,
        "user_id" INT NOT NULL,
        "type" VARCHAR(50) NOT NULL,
        "title" VARCHAR(200) NOT NULL,
        "content" TEXT,
        "project_id" INT,
        "is_read" SMALLINT DEFAULT 0,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    return NextResponse.json({
      success: true,
      message: 'notifications 表创建成功'
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
