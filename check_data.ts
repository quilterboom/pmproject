import dm from './src/lib/dm-helper';

async function main() {
  const pool = await dm.getPool();
  
  // 检查用户表
  const users = await pool.query("SELECT id, username, real_name, role FROM \"SYSDBA\".\"users\" WHERE username = 'P297107'");
  console.log("用户信息:", JSON.stringify(users.rows[0], null, 2));
  
  // 检查项目表
  const projects = await pool.query('SELECT id, name, manager_name, status FROM "SYSDBA"."projects" ORDER BY id DESC LIMIT 10');
  console.log("\n最近10个项目:", JSON.stringify(projects.rows, null, 2));
  
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });