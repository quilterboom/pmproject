import { query } from '../src/lib/dm-helper';

async function main() {
  // 检查用户表
  const users = await query("SELECT id, username, real_name, role FROM \"SYSDBA\".\"users\" WHERE username = 'P297107'");
  console.log("用户信息:", JSON.stringify(users[0] ?? null, null, 2));

  // 检查项目表（取最近 10 条）
  const projects = await query('SELECT id, name, manager_name, status FROM "SYSDBA"."projects" ORDER BY id DESC');
  console.log("\n最近项目:", JSON.stringify(projects.slice(0, 10), null, 2));

  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
