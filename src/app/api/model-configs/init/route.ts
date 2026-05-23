import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/dm-helper';

// 初始化模型配置表
export async function GET() {
  try {
    // 创建模型配置表
    await execute(`
      CREATE TABLE IF NOT EXISTS "SYSDBA"."model_configs" (
        "id" INT IDENTITY(1,1) PRIMARY KEY,
        "name" VARCHAR(100) NOT NULL,
        "provider" VARCHAR(50) NOT NULL,
        "base_url" VARCHAR(500),
        "api_key" VARCHAR(500),
        "model" VARCHAR(100),
        "is_default" SMALLINT DEFAULT 0,
        "status" VARCHAR(50) DEFAULT 'active',
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 检查是否有默认配置，如果没有则插入
    const configs = await query('SELECT * FROM "SYSDBA"."model_configs"');
    if (configs.length === 0) {
      // 插入默认配置
      await execute(`
        INSERT INTO "SYSDBA"."model_configs" (
          "name", "provider", "base_url", "api_key", "model", "is_default", "status"
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        'MiniMax 默认',
        'minimax-cn',
        'https://api.minimaxi.com/anthropic',
        '',
        'MiniMax-M2.5',
        1,
        'active'
      ]);
    }

    return NextResponse.json({ success: true, message: '模型配置表初始化成功' });
  } catch (error) {
    console.error('初始化模型配置表失败:', error);
    return NextResponse.json({
      success: false,
      message: '初始化失败',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}