import { query, execute } from './dm-helper';

/**
 * 清空数据库所有表数据（用于重新初始化）
 */
export async function clearDatabase() {
  try {
    console.log('开始清空数据库...');

    // 按照外键依赖顺序删除表
    await execute('SET REFERENTIAL_INTEGRITY FALSE');

    const tables = [
      '"user_permissions"',
      '"project_members"',
      '"projects"',
      '"users"',
      '"modules"',
      '"offices"',
      '"departments"'
    ];

    for (const table of tables) {
      await execute(`TRUNCATE TABLE ${table}`);
      console.log(`✓ 已清空表: ${table}`);
    }

    await execute('SET REFERENTIAL_INTEGRITY TRUE');

    console.log('✅ 数据库清空完成！');
  } catch (error) {
    console.error('❌ 清空数据库失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  clearDatabase()
    .then(() => {
      console.log('\n现在可以重新初始化数据库');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n清空数据库失败:', error);
      process.exit(1);
    });
}
