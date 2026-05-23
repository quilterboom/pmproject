#!/usr/bin/env node

/**
 * 达梦数据库初始化脚本
 * 运行此脚本将在达梦数据库中创建所有必要的表和初始数据
 */

const dm = require('dmdb');
const bcrypt = require('bcryptjs');

const dbConfig = {
  host: '129.226.220.194',
  port: 5236,
  user: 'SYSDBA',
  password: 'SYSDBA000'
};

async function initDatabase() {
  let conn = null;
  
  try {
    console.log('1. 连接达梦数据库...');
    // 使用连接串格式
    const connectionString = `dm://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}`;
    
    // 直接获取连接
    conn = await dm.getConnection(connectionString);
    console.log('✓ 达梦数据库连接成功\n');

    // 创建表
    console.log('2. 创建数据库表...');

    try {
      // 用户表
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS "users" (
          "id" INT IDENTITY(1,1) PRIMARY KEY,
          "username" VARCHAR(100) NOT NULL UNIQUE,
          "password" VARCHAR(255) NOT NULL,
          "real_name" VARCHAR(100),
          "email" VARCHAR(100),
          "phone" VARCHAR(50),
          "role" VARCHAR(50) DEFAULT 'user',
          "status" VARCHAR(50) DEFAULT 'active',
          "department_id" INT,
          "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('  ✓ 用户表');
      
      // 部门表
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS "departments" (
          "id" INT IDENTITY(1,1) PRIMARY KEY,
          "name" VARCHAR(100) NOT NULL UNIQUE,
          "description" VARCHAR(500),
          "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('  ✓ 部门表');
      
      // 科室表
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS "offices" (
          "id" INT IDENTITY(1,1) PRIMARY KEY,
          "department_id" INT NOT NULL,
          "name" VARCHAR(100) NOT NULL,
          "description" VARCHAR(500),
          "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE
        )
      `);
      console.log('  ✓ 科室表');
      
      // 模块表
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS "modules" (
          "id" INT IDENTITY(1,1) PRIMARY KEY,
          "office_id" INT NOT NULL,
          "name" VARCHAR(100) NOT NULL,
          "description" VARCHAR(500),
          "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE CASCADE
        )
      `);
      console.log('  ✓ 模块表');
      
      // 项目表
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS "projects" (
          "id" INT IDENTITY(1,1) PRIMARY KEY,
          "name" VARCHAR(200) NOT NULL,
          "description" VARCHAR(1000),
          "department_id" INT,
          "office_id" INT,
          "module_id" INT,
          "progress" INT DEFAULT 0,
          "status" VARCHAR(50) DEFAULT 'planning',
          "priority" VARCHAR(50) DEFAULT 'medium',
          "budget" DECIMAL(15,2),
          "start_date" DATE,
          "end_date" DATE,
          "manager_name" VARCHAR(100),
          "manager_phone" VARCHAR(50),
          "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL,
          FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE SET NULL,
          FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE SET NULL
        )
      `);
      console.log('  ✓ 项目表');
      
      // 里程碑表
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS "milestones" (
          "id" INT IDENTITY(1,1) PRIMARY KEY,
          "project_id" INT NOT NULL,
          "name" VARCHAR(200) NOT NULL,
          "description" VARCHAR(500),
          "due_date" DATE,
          "completed" SMALLINT DEFAULT 0,
          "completed_at" TIMESTAMP,
          "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE
        )
      `);
      console.log('  ✓ 里程碑表');
      
      // 任务表
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS "tasks" (
          "id" INT IDENTITY(1,1) PRIMARY KEY,
          "project_id" INT NOT NULL,
          "milestone_id" INT,
          "title" VARCHAR(200) NOT NULL,
          "description" VARCHAR(500),
          "assignee" VARCHAR(100),
          "status" VARCHAR(50) DEFAULT 'pending',
          "priority" VARCHAR(50) DEFAULT 'medium',
          "due_date" DATE,
          "completed_at" TIMESTAMP,
          "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE,
          FOREIGN KEY ("milestone_id") REFERENCES "milestones"("id") ON DELETE SET NULL
        )
      `);
      console.log('  ✓ 任务表');
      
      // 文档表
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS "documents" (
          "id" INT IDENTITY(1,1) PRIMARY KEY,
          "project_id" INT NOT NULL,
          "title" VARCHAR(200) NOT NULL,
          "file_path" VARCHAR(500),
          "file_type" VARCHAR(50),
          "uploaded_by" VARCHAR(100),
          "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE
        )
      `);
      console.log('  ✓ 文档表');
      
      // 风险表
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS "risks" (
          "id" INT IDENTITY(1,1) PRIMARY KEY,
          "project_id" INT NOT NULL,
          "title" VARCHAR(200) NOT NULL,
          "description" VARCHAR(500),
          "severity" VARCHAR(50) DEFAULT 'medium',
          "probability" VARCHAR(50) DEFAULT 'medium',
          "impact" VARCHAR(50) DEFAULT 'medium',
          "mitigation" VARCHAR(500),
          "status" VARCHAR(50) DEFAULT 'identified',
          "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE
        )
      `);
      console.log('  ✓ 风险表');
      
      // 成本表
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS "costs" (
          "id" INT IDENTITY(1,1) PRIMARY KEY,
          "project_id" INT NOT NULL,
          "category" VARCHAR(100),
          "description" VARCHAR(200),
          "amount" DECIMAL(15,2) NOT NULL,
          "date" DATE,
          "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE
        )
      `);
      console.log('  ✓ 成本表');
      
      console.log('\n✓ 所有表创建成功！\n');
      
    } catch (err) {
      console.error('创建表失败:', err.message);
    }

    // 插入初始数据
    console.log('3. 插入初始数据...');
    
    try {
      // 清空已有数据（可选，用于重新初始化）
      await conn.execute('DELETE FROM "costs"');
      await conn.execute('DELETE FROM "risks"');
      await conn.execute('DELETE FROM "documents"');
      await conn.execute('DELETE FROM "tasks"');
      await conn.execute('DELETE FROM "milestones"');
      await conn.execute('DELETE FROM "projects"');
      await conn.execute('DELETE FROM "modules"');
      await conn.execute('DELETE FROM "offices"');
      await conn.execute('DELETE FROM "departments"');
      await conn.execute('DELETE FROM "users"');
      
      // 生成密码哈希
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      
      // 插入部门
      const departments = [
        { name: '信息技术部', description: '负责企业信息化建设' },
        { name: '财务部', description: '负责企业财务管理' },
        { name: '人力资源部', description: '负责企业人力资源管理' },
        { name: '市场部', description: '负责企业市场营销' },
        { name: '研发部', description: '负责产品研发' }
      ];
      
      for (const dept of departments) {
        await conn.execute(
          `INSERT INTO "departments" ("name", "description") VALUES (?, ?)`,
          [dept.name, dept.description]
        );
      }
      console.log('  ✓ 部门数据');
      
      // 获取部门ID
      const deptResult = await conn.execute('SELECT "id", "name" FROM "departments"');
      const deptMap = {};
      deptResult.rows.forEach(row => {
        deptMap[row[1]] = row[0]; // row[0] is id, row[1] is name
      });
      
      // 插入用户
      await conn.execute(
        `INSERT INTO "users" ("username", "password", "real_name", "email", "role", "status", "department_id") VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['admin', hashedPassword, '系统管理员', 'admin@example.com', 'admin', 'active', deptMap['信息技术部']]
      );
      console.log('  ✓ 管理员用户 (admin/admin123)');
      
      await conn.execute(
        `INSERT INTO "users" ("username", "password", "real_name", "email", "role", "status", "department_id") VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['user1', hashedPassword, '张三', 'user1@example.com', 'user', 'active', deptMap['信息技术部']]
      );
      console.log('  ✓ 普通用户 (user1/admin123)');
      
      // 插入项目示例
      const projects = [
        { 
          name: '企业ERP系统升级', 
          description: '升级现有ERP系统至最新版本',
          department_name: '信息技术部',
          progress: 65,
          status: 'in_progress',
          priority: 'high',
          budget: 500000,
          start_date: '2024-01-01',
          end_date: '2024-12-31',
          manager_name: '张经理',
          manager_phone: '13800138000'
        },
        { 
          name: '财务共享中心建设', 
          description: '建设集团级财务共享中心',
          department_name: '财务部',
          progress: 30,
          status: 'in_progress',
          priority: 'high',
          budget: 300000,
          start_date: '2024-03-01',
          end_date: '2024-09-30',
          manager_name: '李经理',
          manager_phone: '13900139000'
        },
        { 
          name: '人力资源系统优化', 
          description: '优化HR系统流程，提升效率',
          department_name: '人力资源部',
          progress: 80,
          status: 'in_progress',
          priority: 'medium',
          budget: 150000,
          start_date: '2024-01-15',
          end_date: '2024-06-30',
          manager_name: '王经理',
          manager_phone: '13700137000'
        },
        { 
          name: '品牌升级项目', 
          description: '企业品牌形象升级',
          department_name: '市场部',
          progress: 45,
          status: 'in_progress',
          priority: 'medium',
          budget: 200000,
          start_date: '2024-02-01',
          end_date: '2024-08-31',
          manager_name: '刘经理',
          manager_phone: '13600136000'
        },
        { 
          name: '新一代产品研发', 
          description: '研发新一代核心产品',
          department_name: '研发部',
          progress: 20,
          status: 'planning',
          priority: 'high',
          budget: 1000000,
          start_date: '2024-06-01',
          end_date: '2025-12-31',
          manager_name: '陈经理',
          manager_phone: '13500135000'
        }
      ];
      
      for (const proj of projects) {
        await conn.execute(
          `INSERT INTO "projects" ("name", "description", "department_id", "progress", "status", "priority", "budget", "start_date", "end_date", "manager_name", "manager_phone") 
           VALUES (?, ?, ?, ?, ?, ?, ?, TO_DATE(?, 'YYYY-MM-DD'), TO_DATE(?, 'YYYY-MM-DD'), ?, ?)`,
          [proj.name, proj.description, deptMap[proj.department_name], proj.progress, proj.status, proj.priority, proj.budget, proj.start_date, proj.end_date, proj.manager_name, proj.manager_phone]
        );
      }
      console.log('  ✓ 项目数据');
      
      // 获取项目ID
      const projResult = await conn.execute('SELECT "id", "name" FROM "projects"');
      const projMap = {};
      projResult.rows.forEach(row => {
        projMap[row[1]] = row[0];
      });
      
      // 插入里程碑示例
      const milestones = [
        { project_name: '企业ERP系统升级', name: '需求分析完成', due_date: '2024-03-31', completed: 1 },
        { project_name: '企业ERP系统升级', name: '系统设计完成', due_date: '2024-05-31', completed: 1 },
        { project_name: '企业ERP系统升级', name: '开发测试完成', due_date: '2024-09-30', completed: 0 },
        { project_name: '企业ERP系统升级', name: '上线部署完成', due_date: '2024-12-31', completed: 0 },
        { project_name: '财务共享中心建设', name: '流程梳理完成', due_date: '2024-04-30', completed: 1 },
        { project_name: '财务共享中心建设', name: '系统上线', due_date: '2024-09-30', completed: 0 }
      ];
      
      for (const ms of milestones) {
        await conn.execute(
          `INSERT INTO "milestones" ("project_id", "name", "due_date", "completed", "completed_at") VALUES (?, ?, TO_DATE(?, 'YYYY-MM-DD'), ?, ?)`,
          [projMap[ms.project_name], ms.name, ms.due_date, ms.completed, ms.completed ? new Date() : null]
        );
      }
      console.log('  ✓ 里程碑数据');
      
      // 获取里程碑ID
      const msResult = await conn.execute('SELECT "id", "name", "project_id" FROM "milestones"');
      const msMap = {};
      msResult.rows.forEach(row => {
        const key = row[2] + '-' + row[1];
        msMap[key] = row[0];
      });
      
      // 插入任务示例
      const tasks = [
        { project_name: '企业ERP系统升级', title: '完成数据库设计', status: 'completed', priority: 'high', assignee: '张三' },
        { project_name: '企业ERP系统升级', title: '开发用户管理模块', status: 'in_progress', priority: 'high', assignee: '李四' },
        { project_name: '企业ERP系统升级', title: '开发权限管理模块', status: 'pending', priority: 'medium', assignee: '王五' },
        { project_name: '财务共享中心建设', title: '财务流程调研', status: 'completed', priority: 'high', assignee: '赵六' },
        { project_name: '财务共享中心建设', title: '系统选型', status: 'in_progress', priority: 'high', assignee: '钱七' }
      ];
      
      for (const task of tasks) {
        await conn.execute(
          `INSERT INTO "tasks" ("project_id", "title", "status", "priority", "assignee", "completed_at") VALUES (?, ?, ?, ?, ?, ?)`,
          [projMap[task.project_name], task.title, task.status, task.priority, task.assignee, task.status === 'completed' ? new Date() : null]
        );
      }
      console.log('  ✓ 任务数据');
      
      console.log('\n✓ 初始数据插入成功！\n');
      
    } catch (err) {
      console.error('插入数据失败:', err.message);
    }

    // 关闭连接
    await conn.close();
    
    console.log('=================================');
    console.log('达梦数据库初始化完成！');
    console.log('=================================');
    console.log('\n测试账号:');
    console.log('  管理员: admin / admin123');
    console.log('  普通用户: user1 / admin123');
    console.log('=================================');
    
  } catch (err) {
    console.error('❌ 数据库初始化失败:', err.message);
    if (conn) {
      await conn.close();
    }
    process.exit(1);
  }
}

initDatabase();
