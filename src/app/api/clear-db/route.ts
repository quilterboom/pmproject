import { NextResponse } from 'next/server';
import { execute } from '@/lib/dm-helper';

export async function GET() {
  try {
    // 按照外键依赖顺序删除表
    await execute('SET REFERENTIAL_INTEGRITY FALSE');

    const tables = [
      '"user_permissions"',
      '"project_members"',
      '"projects"',
      '"users"',
      '"modules"',
      '"offices"',
      '"departments"'
    ];

    for (const table of tables) {
      await execute(`TRUNCATE TABLE ${table}`);
    }

    await execute('SET REFERENTIAL_INTEGRITY TRUE');

    return NextResponse.json({
      success: true,
      message: '数据库已清空'
    });
  } catch (error) {
    console.error('清空数据库失败:', error);
    return NextResponse.json({
      success: false,
      message: '清空数据库失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
