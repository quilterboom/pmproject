import { query } from './src/lib/dm-helper';

async function main() {
  try {
    const users = await query("SELECT id, username, real_name, role FROM \"SYSDBA\".\"users\" WHERE username = 'P297107'");
    console.log('用户信息:', JSON.stringify(users, null, 2));
    
    const projects = await query('SELECT id, name, manager_name, status FROM "SYSDBA"."projects" ORDER BY id DESC LIMIT 5');
    console.log('最近项目:', JSON.stringify(projects, null, 2));
  } catch (e) {
    console.error(e);
  }
}
main();