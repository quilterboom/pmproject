-- 删除项目表中的预算相关字段
-- 执行此脚本前请备份数据库！

USE project_management;

-- 删除 budget 字段
ALTER TABLE projects DROP COLUMN IF EXISTS budget;

-- 删除 actual_cost 字段
ALTER TABLE projects DROP COLUMN IF EXISTS actual_cost;

-- 验证字段已删除
DESCRIBE projects;

SELECT '✅ 预算字段已成功删除' AS message;
