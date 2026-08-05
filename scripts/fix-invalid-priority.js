/**
 * 修复数据库中无效的优先级值
 * 将非数字的优先级值（如 'medium', 'high', 'low'）转换为数字
 */

const dm = require('dmdb');

async function fixInvalidPriority() {
  console.log('正在连接到数据库...');
  
  const connectionString = 'dm://SYSDBA:SYSDBA000@129.226.220.194:5236';
  const conn = await dm.getConnection(connectionString);
  
  try {
    // 查看修复前的优先级值
    console.log('\n=== 修复前的优先级值 ===');
    const beforeResult = await conn.execute('SELECT DISTINCT priority, COUNT(*) as cnt FROM "SYSDBA"."projects" GROUP BY priority');
    if (beforeResult.rows) {
      console.log('修复前:', JSON.stringify(beforeResult.rows, null, 2));
    } else {
      console.log('修复前结果:', beforeResult);
    }
    
    // 将 'medium' 转为 2, 'high' 转为 1, 'low' 转为 3
    console.log('\n正在修复优先级值...');
    
    // 修复字符串值
    await conn.execute('UPDATE "SYSDBA"."projects" SET priority = 2 WHERE priority = \'medium\'');
    await conn.execute('UPDATE "SYSDBA"."projects" SET priority = 1 WHERE priority = \'high\'');
    await conn.execute('UPDATE "SYSDBA"."projects" SET priority = 3 WHERE priority = \'low\'');
    
    // 修复其他非数字值
    await conn.execute(`
      UPDATE "SYSDBA"."projects" 
      SET priority = 2 
      WHERE priority IS NOT NULL 
      AND priority NOT IN (1, 2, 3)
    `);
    
    // 查看修复后的优先级值
    console.log('\n=== 修复后的优先级值 ===');
    const afterResult = await conn.execute('SELECT DISTINCT priority, COUNT(*) as cnt FROM "SYSDBA"."projects" GROUP BY priority');
    if (afterResult.rows) {
      console.log('修复后:', JSON.stringify(afterResult.rows, null, 2));
    } else {
      console.log('修复后结果:', afterResult);
    }
    
    console.log('\n✅ 修复完成！');
    
  } catch (error) {
    console.error('修复失败:', error);
    throw error;
  } finally {
    await conn.close();
  }
}

fixInvalidPriority().catch(err => {
  console.error(err);
  process.exit(1);
});