import { NextResponse } from 'next/server';
import { execute } from '@/lib/dm-helper';

// 修改 ip_address 字段长度
export async function POST() {
  try {
    // 达梦数据库的 VARCHAR 默认就足够大，无需修改
    return NextResponse.json({
      success: true,
      message: 'ip_address 字段类型无需修改（达梦数据库 VARCHAR 足够大）'
    });
  } catch (error) {
    console.error('修改字段失败:', error);
    return NextResponse.json({
      success: false,
      message: '修改字段失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
