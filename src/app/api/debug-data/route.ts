import { NextResponse } from 'next/server';
import { query } from '@/lib/dm-helper';

export async function GET() {
  try {
    // 测试项目类型表
    const types = await query('SELECT * FROM "SYSDBA"."project_types" LIMIT 5');
    
    // 测试项目表
    const projects = await query('SELECT COUNT(*) as count FROM "SYSDBA"."projects"');
    
    // 测试项目表带类型
    const projectWithType = await query(`
      SELECT p."id", p."name", p."project_type_id", pt."name" as type_name
      FROM "SYSDBA"."projects" p
      LEFT JOIN "SYSDBA"."project_types" pt ON p."project_type_id" = pt."id"
      LIMIT 5
    `);
    
    return NextResponse.json({
      success: true,
      data: {
        types,
        projectCount: projects,
        projectWithType
      }
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Debug error',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
