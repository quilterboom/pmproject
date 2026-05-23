import { NextResponse } from 'next/server';
import { execute } from '@/lib/dm-helper';

// 修改 department_id 字段为可为空
export async function POST() {
  try {
    // 修改 department_id 字段为可空（达梦数据库默认就支持可空）
    await execute(`
      UPDATE "SYSDBA"."projects" SET "department_id" = NULL WHERE "department_id" = 0
    `);

    return NextResponse.json({
      success: true,
      message: '成功修改 department_id 字段为可空'
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
