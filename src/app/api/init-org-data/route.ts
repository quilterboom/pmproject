import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/dm-helper';

// 初始化部门科室模块数据
export async function POST() {
  try {
    // 检查是否已存在
    const existingDept = await query<any>('SELECT * FROM "SYSDBA"."departments" WHERE "name" = ?', ['仪控部']);
    
    let deptId: number;
    
    if (existingDept.length === 0) {
      // 插入部门
      await execute(
        'INSERT INTO "SYSDBA"."departments" ("name", "description") VALUES (?, ?)',
        ['仪控部', '负责仪控相关业务']
      );
      const newDept = await query<any>('SELECT "id" FROM "SYSDBA"."departments" WHERE "name" = ?', ['仪控部']);
      deptId = newDept[0].id;
    } else {
      deptId = existingDept[0].id;
    }
    
    // 检查并插入科室
    const existingOffice = await query<any>('SELECT * FROM "SYSDBA"."offices" WHERE "name" = ?', ['技术管理科']);
    let officeId: number;
    
    if (existingOffice.length === 0) {
      await execute(
        'INSERT INTO "SYSDBA"."offices" ("department_id", "name", "description") VALUES (?, ?, ?)',
        [deptId, '技术管理科', '负责技术管理']
      );
      const newOffice = await query<any>('SELECT "id" FROM "SYSDBA"."offices" WHERE "name" = ?', ['技术管理科']);
      officeId = newOffice[0].id;
    } else {
      officeId = existingOffice[0].id;
    }
    
    // 检查并插入模块
    const existingModule = await query<any>('SELECT * FROM "SYSDBA"."modules" WHERE "name" = ?', ['工业机模块']);
    
    if (existingModule.length === 0) {
      await execute(
        'INSERT INTO "SYSDBA"."modules" ("office_id", "name", "description") VALUES (?, ?, ?)',
        [officeId, '工业机模块', '工业机相关模块']
      );
    }
    
    return NextResponse.json({
      success: true,
      message: '数据插入成功',
      data: {
        department: { id: deptId, name: '仪控部' },
        office: { id: officeId, name: '技术管理科' },
        module: { name: '工业机模块' }
      }
    });
    
  } catch (error) {
    console.error('插入数据失败:', error);
    return NextResponse.json({
      success: false,
      message: '插入数据失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
