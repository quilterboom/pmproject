// MySQL 到达梦数据库迁移脚本
const mysql = require('mysql2/promise');
const dm = require('dmdb');

// MySQL 配置
const mysqlConfig = {
  host: '129.226.220.194',
  port: 3306,
  user: 'root',
  password: 'Lyp552034#',
  database: 'project_management'
};

// 达梦数据库配置
const dmConfig = {
  host: '129.226.220.194',
  port: 5236,
  user: 'SYSDBA',
  password: 'SYSDBA000'
};

async function migrateDatabase() {
  let mysqlConn;
  let dmConn;
  
  try {
    console.log('1. 连接 MySQL 数据库...');
    mysqlConn = await mysql.createConnection(mysqlConfig);
    console.log('✓ MySQL 连接成功');

    console.log('\n2. 连接达梦数据库...');
    dmConn = await dm.getConnection(dmConfig);
    console.log('✓ 达梦数据库连接成功');

    // 3. 获取所有表
    console.log('\n3. 获取 MySQL 数据库表结构...');
    const [tables] = await mysqlConn.query('SHOW TABLES');
    console.log('找到以下表:', tables.map(t => Object.values(t)[0]));

    // 4. 创建达梦数据库
    console.log('\n4. 创建达梦数据库...');
    try {
      await dmConn.execute('CREATE DATABASE PROJECT_MANAGEMENT');
      console.log('✓ 数据库创建成功');
    } catch (err) {
      console.log('  数据库已存在或创建失败:', err.message);
    }

    await dmConn.execute('USE PROJECT_MANAGEMENT');

    // 5. 迁移每个表
    for (const tableObj of tables) {
      const tableName = Object.values(tableObj)[0];
      console.log(`\n5. 迁移表: ${tableName}`);
      
      // 获取表创建语句
      const [createResult] = await mysqlConn.query(`SHOW CREATE TABLE ${tableName}`);
      const createSQL = createResult[0]['Create Table'];
      console.log('  创建表结构...');
      
      // 转换 MySQL 到达梦语法
      let dmCreateSQL = createSQL
        .replace(/`/g, '"')
        .replace(/ ENGINE=InnoDB/gi, '')
        .replace(/ CHARACTER SET utf8mb4/gi, '')
        .replace(/ COLLATE utf8mb4_unicode_ci/gi, '')
        .replace(/ COMMENT='[^']*'/gi, '')
        .replace(/ AUTO_INCREMENT=\d+/gi, '')
        .replace(/ CHARSET=utf8mb4/gi, '');
      
      try {
        await dmConn.execute(`DROP TABLE IF EXISTS "${tableName}"`);
        await dmConn.execute(dmCreateSQL);
        console.log('  ✓ 表结构创建成功');
      } catch (err) {
        console.error('  ✗ 表结构创建失败:', err.message);
        continue;
      }

      // 获取数据
      const [rows] = await mysqlConn.query(`SELECT * FROM ${tableName}`);
      
      if (rows.length > 0) {
        console.log(`  插入 ${rows.length} 条数据...`);
        
        // 获取列名
        const columns = Object.keys(rows[0]);
        const placeholders = columns.map(() => '?').join(', ');
        const insertSQL = `INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders})`;
        
        for (const row of rows) {
          const values = Object.values(row);
          try {
            await dmConn.execute(insertSQL, values);
          } catch (err) {
            console.error(`    插入数据失败:`, err.message);
          }
        }
        console.log(`  ✓ 数据插入成功`);
      }
    }

    console.log('\n✅ 数据库迁移完成！');

  } catch (error) {
    console.error('\n❌ 迁移失败:', error);
    throw error;
  } finally {
    if (mysqlConn) await mysqlConn.end();
    if (dmConn) await dmConn.disconnect();
  }
}

migrateDatabase();
