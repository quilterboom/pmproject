import { NextResponse } from 'next/server';
import { initDatabase } from '@/lib/init-db';

export async function GET() {
  try {
    await initDatabase();
    return NextResponse.json({
      success: true,
      message: '数据库初始化成功'
    });
  } catch (error) {
    console.error('数据库初始化失败:', error);
    return NextResponse.json({
      success: false,
      message: '数据库初始化失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
