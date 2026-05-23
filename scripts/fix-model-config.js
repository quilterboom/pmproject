const { Pool } = require('pg');

const pool = new Pool({
  host: '129.226.220.194',
  port: 5236,
  user: 'SYSDBA',
  password: 'SYSDBA004',
  database: 'PMDB'
});

async function main() {
  // 查询当前配置
  const res = await pool.query('SELECT * FROM "SYSDBA"."model_configs" WHERE "id" = 1');
  console.log('Before:', JSON.stringify(res.rows[0], null, 2));
  
  // 更新 base_url 和 model
  await pool.query(`
    UPDATE "SYSDBA"."model_configs" 
    SET "base_url" = ?, "model" = ?, "updated_at" = CURRENT_TIMESTAMP
    WHERE "id" = ?
  `, ['https://api.minimaxi.com/v1/text/chatcompletion_v2', 'MiniMax-M2.5', 1]);
  
  const res2 = await pool.query('SELECT * FROM "SYSDBA"."model_configs" WHERE "id" = 1');
  console.log('After:', JSON.stringify(res2.rows[0], null, 2));
  
  await pool.end();
}

main().catch(console.error);