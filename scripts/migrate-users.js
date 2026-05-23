const dm = require('dmdb');

const connectionString = 'dm://SYSDBA:SYSDBA000@129.226.220.194:5236';

async function migrate() {
  let conn;
  try {
    conn = await dm.getConnection(connectionString);
    
    // 检查 office_id 字段是否存在
    const columns = await conn.execute(`
      SELECT column_name FROM all_tab_columns 
      WHERE owner = 'SYSDBA' AND table_name = 'USERS' 
      AND column_name IN ('OFFICE_ID', 'MODULE_ID')
    `);
    
    const colArray = Array.isArray(columns) ? columns : [];
    const existingCols = colArray.map(function(c) { return c.COLUMN_NAME ? c.COLUMN_NAME.toUpperCase() : null; }).filter(Boolean);
    
    console.log('现有字段:', existingCols);
    
    if (!existingCols.includes('OFFICE_ID')) {
      await conn.execute(`ALTER TABLE "SYSDBA"."users" ADD "office_id" INT`);
      console.log('✓ 添加 office_id 字段成功');
    } else {
      console.log('✓ office_id 字段已存在');
    }
    
    if (!existingCols.includes('MODULE_ID')) {
      await conn.execute(`ALTER TABLE "SYSDBA"."users" ADD "module_id" INT`);
      console.log('✓ 添加 module_id 字段成功');
    } else {
      console.log('✓ module_id 字段已存在');
    }
    
    console.log('✓ 数据库迁移完成');
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    if (conn) conn.close();
  }
}

migrate();
