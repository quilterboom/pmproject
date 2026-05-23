const dm = require('dmdb');

const connectionString = 'dm://SYSDBA:SYSDBA000@129.226.220.194:5236';

async function initPermissions() {
  let conn;
  try {
    conn = await dm.getConnection(connectionString);
    
    // 1. 创建权限表
    console.log('创建权限表...');
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS "SYSDBA"."permissions" (
        "id" INT IDENTITY(1,1) PRIMARY KEY,
        "code" VARCHAR(100) NOT NULL UNIQUE,
        "name" VARCHAR(100) NOT NULL,
        "description" VARCHAR(500),
        "category" VARCHAR(50),
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ permissions 表创建成功');
    
    // 2. 创建角色表
    console.log('创建角色表...');
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS "SYSDBA"."roles" (
        "id" INT IDENTITY(1,1) PRIMARY KEY,
        "code" VARCHAR(50) NOT NULL UNIQUE,
        "name" VARCHAR(100) NOT NULL,
        "description" VARCHAR(500),
        "is_system" SMALLINT DEFAULT 0,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ roles 表创建成功');
    
    // 3. 创建角色权限关联表
    console.log('创建角色权限关联表...');
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS "SYSDBA"."role_permissions" (
        "id" INT IDENTITY(1,1) PRIMARY KEY,
        "role_id" INT NOT NULL,
        "permission_id" INT NOT NULL,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("role_id") REFERENCES "SYSDBA"."roles"("id"),
        FOREIGN KEY ("permission_id") REFERENCES "SYSDBA"."permissions"("id")
      )
    `);
    console.log('✓ role_permissions 表创建成功');
    
    // 4. 创建用户角色关联表
    console.log('创建用户角色关联表...');
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS "SYSDBA"."user_roles" (
        "id" INT IDENTITY(1,1) PRIMARY KEY,
        "user_id" INT NOT NULL,
        "role_id" INT NOT NULL,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("user_id") REFERENCES "SYSDBA"."users"("id"),
        FOREIGN KEY ("role_id") REFERENCES "SYSDBA"."roles"("id")
      )
    `);
    console.log('✓ user_roles 表创建成功');
    
    // 5. 插入默认权限
    console.log('插入默认权限...');
    const permissions = [
      // 页面权限
      { code: 'page_dashboard', name: '工作台', category: 'page' },
      { code: 'page_projects', name: '项目管理', category: 'page' },
      { code: 'page_users', name: '人员管理', category: 'page' },
      { code: 'page_todos', name: '待办事项', category: 'page' },
      { code: 'page_settings', name: '系统设置', category: 'page' },
      { code: 'page_permissions', name: '权限管理', category: 'page' },
      // 操作权限
      { code: 'project_create', name: '创建项目', category: 'action' },
      { code: 'project_edit', name: '编辑项目', category: 'action' },
      { code: 'project_delete', name: '删除项目', category: 'action' },
      { code: 'project_manage_members', name: '管理项目成员', category: 'action' },
      { code: 'user_create', name: '创建用户', category: 'action' },
      { code: 'user_edit', name: '编辑用户', category: 'action' },
      { code: 'user_delete', name: '删除用户', category: 'action' },
      { code: 'role_manage', name: '管理角色权限', category: 'action' },
    ];
    
    for (const perm of permissions) {
      try {
        await conn.execute(
          `INSERT INTO "SYSDBA"."permissions" ("code", "name", "category") VALUES (?, ?, ?)`,
          [perm.code, perm.name, perm.category]
        );
      } catch (e) {
        // 忽略重复插入
      }
    }
    console.log('✓ 默认权限插入成功');
    
    // 6. 插入默认角色
    console.log('插入默认角色...');
    const roles = [
      { code: 'admin', name: '管理员', description: '系统管理员，拥有所有权限', is_system: 1 },
      { code: 'user', name: '普通用户', description: '普通用户，基本操作权限', is_system: 1 },
    ];
    
    for (const role of roles) {
      try {
        await conn.execute(
          `INSERT INTO "SYSDBA"."roles" ("code", "name", "description", "is_system") VALUES (?, ?, ?, ?)`,
          [role.code, role.name, role.description, role.is_system]
        );
      } catch (e) {
        // 忽略重复插入
      }
    }
    console.log('✓ 默认角色插入成功');
    
    // 7. 给管理员角色分配所有权限
    console.log('分配管理员权限...');
    const adminRole = await conn.execute(`SELECT "id" FROM "SYSDBA"."roles" WHERE "code" = 'admin'`);
    const allPerms = await conn.execute(`SELECT "id" FROM "SYSDBA"."permissions"`);
    
    if (adminRole && adminRole.length > 0 && allPerms && allPerms.length > 0) {
      const adminId = adminRole[0].ID;
      for (const perm of allPerms) {
        try {
          await conn.execute(
            `INSERT INTO "SYSDBA"."role_permissions" ("role_id", "permission_id") VALUES (?, ?)`,
            [adminId, perm.ID]
          );
        } catch (e) {
          // 忽略重复
        }
      }
    }
    console.log('✓ 管理员权限分配成功');
    
    // 8. 给普通用户分配基本权限
    console.log('分配普通用户权限...');
    const userRole = await conn.execute(`SELECT "id" FROM "SYSDBA"."roles" WHERE "code" = 'user'`);
    
    if (userRole && userRole.length > 0) {
      const userRoleId = userRole[0].ID;
      const basicPerms = [
        'page_dashboard', 'page_projects', 'page_todos',
        'project_create', 'project_edit'
      ];
      
      for (const code of basicPerms) {
        const perm = await conn.execute(`SELECT "id" FROM "SYSDBA"."permissions" WHERE "code" = ?`, [code]);
        if (perm && perm.length > 0) {
          try {
            await conn.execute(
              `INSERT INTO "SYSDBA"."role_permissions" ("role_id", "permission_id") VALUES (?, ?)`,
              [userRoleId, perm[0].ID]
            );
          } catch (e) {
            // 忽略重复
          }
        }
      }
    }
    console.log('✓ 普通用户权限分配成功');
    
    // 9. 给现有管理员用户分配管理员角色
    console.log('分配管理员角色给用户...');
    const adminUsers = await conn.execute(`SELECT "id" FROM "SYSDBA"."users" WHERE "role" = 'admin'`);
    if (adminUsers && adminUsers.length > 0 && adminRole && adminRole.length > 0) {
      for (const user of adminUsers) {
        try {
          await conn.execute(
            `INSERT INTO "SYSDBA"."user_roles" ("user_id", "role_id") VALUES (?, ?)`,
            [user.ID, adminRole[0].ID]
          );
        } catch (e) {
          // 忽略重复
        }
      }
    }
    console.log('✓ 用户角色分配成功');
    
    console.log('\n=== 权限管理系统初始化完成 ===');
    
  } catch (error) {
    console.error('初始化失败:', error.message);
  } finally {
    if (conn) {
      await conn.close();
    }
  }
}

initPermissions();
