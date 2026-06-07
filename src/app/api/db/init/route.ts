import { NextResponse } from 'next/server';
import { execute, queryOne } from '@/lib/dm-helper';
import { getUserFromToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: '未提供认证信息' }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const currentUser = await getUserFromToken(token);
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ success: false, message: '需要管理员权限' }, { status: 403 });
    }

    const results: string[] = [];

    const createTable = async (name: string, sql: string) => {
      try {
        await execute(sql);
        results.push(`✓ ${name}`);
      } catch (err: any) {
        if (err.message?.includes('already exists') || err.message?.includes('已存在')) {
          results.push(`○ ${name} (已存在)`);
        } else {
          results.push(`✗ ${name}: ${err.message}`);
        }
      }
    };

    await createTable('用户表 (users)', `
      CREATE TABLE IF NOT EXISTS "SYSDBA"."users" (
        "id" INT IDENTITY(1,1) PRIMARY KEY,
        "username" VARCHAR(100) NOT NULL UNIQUE,
        "password" VARCHAR(255) NOT NULL,
        "real_name" VARCHAR(100),
        "email" VARCHAR(100),
        "phone" VARCHAR(50),
        "role" VARCHAR(50) DEFAULT 'member',
        "status" VARCHAR(50) DEFAULT 'active',
        "department_id" INT,
        "office_id" INT,
        "module_id" INT,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await createTable('部门表 (departments)', `
      CREATE TABLE IF NOT EXISTS "SYSDBA"."departments" (
        "id" INT IDENTITY(1,1) PRIMARY KEY,
        "name" VARCHAR(100) NOT NULL UNIQUE,
        "description" VARCHAR(500),
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await createTable('科室表 (offices)', `
      CREATE TABLE IF NOT EXISTS "SYSDBA"."offices" (
        "id" INT IDENTITY(1,1) PRIMARY KEY,
        "department_id" INT,
        "name" VARCHAR(100) NOT NULL,
        "description" VARCHAR(500),
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await createTable('模块表 (modules)', `
      CREATE TABLE IF NOT EXISTS "SYSDBA"."modules" (
        "id" INT IDENTITY(1,1) PRIMARY KEY,
        "office_id" INT,
        "name" VARCHAR(100) NOT NULL,
        "description" VARCHAR(500),
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await createTable('任务类型表 (project_types)', `
      CREATE TABLE IF NOT EXISTS "SYSDBA"."project_types" (
        "id" INT IDENTITY(1,1) PRIMARY KEY,
        "name" VARCHAR(100) NOT NULL,
        "color" VARCHAR(20) DEFAULT '#3B82F6',
        "description" VARCHAR(500),
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await createTable('项目表 (projects)', `
      CREATE TABLE IF NOT EXISTS "SYSDBA"."projects" (
        "id" INT IDENTITY(1,1) PRIMARY KEY,
        "name" VARCHAR(200) NOT NULL,
        "description" VARCHAR(1000),
        "goal" VARCHAR(1000),
        "current_progress" VARCHAR(1000),
        "department_id" INT,
        "office_id" INT,
        "module_id" INT,
        "project_type_id" INT,
        "progress" INT DEFAULT 0,
        "status" VARCHAR(50) DEFAULT 'planning',
        "priority" VARCHAR(50) DEFAULT '2',
        "budget" DECIMAL(15,2),
        "start_date" DATE,
        "end_date" DATE,
        "manager_name" VARCHAR(100),
        "manager_phone" VARCHAR(50),
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await createTable('项目成员表 (project_members)', `
      CREATE TABLE IF NOT EXISTS "SYSDBA"."project_members" (
        "id" INT IDENTITY(1,1) PRIMARY KEY,
        "project_id" INT,
        "user_id" INT,
        "role" VARCHAR(50) DEFAULT 'member',
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await createTable('操作日志表 (project_logs)', `
      CREATE TABLE IF NOT EXISTS "SYSDBA"."project_logs" (
        "id" INT IDENTITY(1,1) PRIMARY KEY,
        "project_id" INT,
        "operator_id" INT,
        "action" VARCHAR(50),
        "details" VARCHAR(1000),
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await createTable('里程碑表 (milestones)', `
      CREATE TABLE IF NOT EXISTS "SYSDBA"."milestones" (
        "id" INT IDENTITY(1,1) PRIMARY KEY,
        "project_id" INT,
        "name" VARCHAR(200) NOT NULL,
        "description" VARCHAR(500),
        "due_date" DATE,
        "completed" SMALLINT DEFAULT 0,
        "completed_at" TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await createTable('子任务表 (tasks)', `
      CREATE TABLE IF NOT EXISTS "SYSDBA"."tasks" (
        "id" INT IDENTITY(1,1) PRIMARY KEY,
        "project_id" INT,
        "milestone_id" INT,
        "title" VARCHAR(200) NOT NULL,
        "description" VARCHAR(500),
        "assignee" VARCHAR(100),
        "status" VARCHAR(50) DEFAULT 'pending',
        "priority" VARCHAR(50) DEFAULT '2',
        "due_date" DATE,
        "completed_at" TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await createTable('通知表 (notifications)', `
      CREATE TABLE IF NOT EXISTS "SYSDBA"."notifications" (
        "id" INT IDENTITY(1,1) PRIMARY KEY,
        "user_id" INT,
        "type" VARCHAR(50),
        "title" VARCHAR(200),
        "content" VARCHAR(1000),
        "read" SMALLINT DEFAULT 0,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await createTable('AI模型配置表 (model_configs)', `
      CREATE TABLE IF NOT EXISTS "SYSDBA"."model_configs" (
        "id" INT IDENTITY(1,1) PRIMARY KEY,
        "name" VARCHAR(100),
        "provider" VARCHAR(50),
        "base_url" VARCHAR(200),
        "api_key" VARCHAR(500),
        "model" VARCHAR(100),
        "is_default" SMALLINT DEFAULT 0,
        "status" VARCHAR(50) DEFAULT 'active',
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const existingAdmin = await queryOne<any>(
      'SELECT "id" FROM "SYSDBA"."users" WHERE "username" = ?',
      ['admin']
    );

    if (!existingAdmin) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      await execute(`
        INSERT INTO "SYSDBA"."users" ("username", "password", "real_name", "email", "role", "status")
        VALUES (?, ?, ?, ?, ?, ?)
      `, ['admin', hashedPassword, '系统管理员', 'admin@example.com', 'admin', 'active']);
      results.push('✓ 管理员账号 (admin/admin123)');
    } else {
      results.push('○ 管理员账号 (已存在)');
    }

    const existingTypes = await queryOne<any>(
      'SELECT "id" FROM "SYSDBA"."project_types" WHERE "name" = ?',
      ['功能开发']
    );

    if (!existingTypes) {
      await execute(`INSERT INTO "SYSDBA"."project_types" ("name", "color") VALUES (?, ?)`, ['功能开发', '#3B82F6']);
      await execute(`INSERT INTO "SYSDBA"."project_types" ("name", "color") VALUES (?, ?)`, ['缺陷修复', '#EF4444']);
      await execute(`INSERT INTO "SYSDBA"."project_types" ("name", "color") VALUES (?, ?)`, ['技术优化', '#10B981']);
      await execute(`INSERT INTO "SYSDBA"."project_types" ("name", "color") VALUES (?, ?)`, ['需求分析', '#F59E0B']);
      await execute(`INSERT INTO "SYSDBA"."project_types" ("name", "color") VALUES (?, ?)`, ['测试验证', '#8B5CF6']);
      results.push('✓ 默认任务类型');
    } else {
      results.push('○ 默认任务类型 (已存在)');
    }

    return NextResponse.json({
      success: true,
      message: '数据库初始化完成',
      data: {
        results
      }
    });
  } catch (error) {
    console.error('数据库初始化失败:', error);
    return NextResponse.json({
      success: false,
      message: '数据库初始化失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}