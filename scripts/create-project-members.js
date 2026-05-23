const dm = require('dmdb');

const connectionString = 'dm://SYSDBA:SYSDBA000@129.226.220.194:5236';

async function createTable() {
  let conn;
  try {
    conn = await dm.getConnection(connectionString);
    
    // 创建项目成员关联表
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS "project_members" (
        "id" INT IDENTITY(1,1) PRIMARY KEY,
        "project_id" INT NOT NULL,
        "user_id" INT NOT NULL,
        "role" VARCHAR(50) DEFAULT 'member',
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ 项目成员表创建成功');
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    if (conn) conn.close();
  }
}

createTable();
