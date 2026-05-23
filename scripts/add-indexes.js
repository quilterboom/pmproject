const dm = require('dmdb');

const connectionString = 'dm://SYSDBA:SYSDBA000@129.226.220.194:5236';

async function addIndexes() {
  let conn;
  try {
    conn = await dm.getConnection(connectionString);
    
    // 为 modules 表添加 office_id 索引
    try {
      await conn.execute(`CREATE INDEX idx_modules_office_id ON "SYSDBA"."modules"("office_id")`);
      console.log('✓ 添加 modules office_id 索引成功');
    } catch (e) {
      console.log('✓ modules 索引已存在或创建失败:', e.message);
    }
    
    // 为 offices 表添加 department_id 索引
    try {
      await conn.execute(`CREATE INDEX idx_offices_dept_id ON "SYSDBA"."offices"("department_id")`);
      console.log('✓ 添加 offices department_id 索引成功');
    } catch (e) {
      console.log('✓ offices 索引已存在或创建失败:', e.message);
    }
    
    // 为 users 表添加索引
    try {
      await conn.execute(`CREATE INDEX idx_users_dept ON "SYSDBA"."users"("department_id")`);
      console.log('✓ 添加 users department_id 索引成功');
    } catch (e) {
      console.log('✓ users 索引已存在或创建失败:', e.message);
    }
    
    // 为 projects 表添加索引
    try {
      await conn.execute(`CREATE INDEX idx_projects_dept ON "SYSDBA"."projects"("department_id")`);
      console.log('✓ 添加 projects department_id 索引成功');
    } catch (e) {
      console.log('✓ projects 索引已存在或创建失败:', e.message);
    }
    
    console.log('✓ 索引创建完成');
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    if (conn) conn.close();
  }
}

addIndexes();
