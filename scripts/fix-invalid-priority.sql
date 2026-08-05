-- 修复数据库中无效的优先级值
-- 将非数字的优先级值（如 'medium', 'high', 'low'）转换为数字
-- 1 = 高, 2 = 中, 3 = 低

-- 查看当前所有的优先级值
SELECT DISTINCT priority, COUNT(*) as cnt 
FROM "SYSDBA"."projects" 
GROUP BY priority;

-- 将 'medium' 转为 2, 'high' 转为 1, 'low' 转为 3
UPDATE "SYSDBA"."projects" SET priority = 2 WHERE priority = 'medium';
UPDATE "SYSDBA"."projects" SET priority = 1 WHERE priority = 'high';
UPDATE "SYSDBA"."projects" SET priority = 3 WHERE priority = 'low';

-- 将其他非数字值转为 2（中优先级）
UPDATE "SYSDBA"."projects" 
SET priority = 2 
WHERE priority IS NOT NULL 
AND priority NOT IN (1, 2, 3);

-- 确认修复后的结果
SELECT DISTINCT priority, COUNT(*) as cnt 
FROM "SYSDBA"."projects" 
GROUP BY priority;