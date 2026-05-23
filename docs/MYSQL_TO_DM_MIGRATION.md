# MySQL 到达梦数据库迁移文档

## 迁移概述

本项目已完成从 MySQL 数据库到达梦（DM）数据库的迁移。

## 完成的工作

### 1. 数据库配置修改

**修改文件**: `src/lib/db.ts`

- 修改数据库连接配置为达梦数据库
- 端口从 3306 改为 5236
- 用户名从 `root` 改为 `SYSDBA`
- 密码从 `Lyp552034#` 改为 `SYSDBA000`

### 2. 数据库驱动修改

**修改文件**: `src/lib/init-db.ts`

- 从 `mysql2/promise` 驱动改为 `dmdb` 达梦数据库驱动
- 修改连接池创建方式
- 修改查询和事务执行方法
- 调整表结构定义以兼容达梦数据库语法

### 3. SQL 语法适配

修改了所有 API 文件中的 SQL 语句，使其兼容达梦数据库：

#### 3.1 字符串聚合函数
```sql
-- MySQL
GROUP_CONCAT(u.real_name SEPARATOR ', ')

-- 达梦
LIST(u.real_name, ', ')
```

#### 3.2 日期函数
```sql
-- MySQL
DATE_SUB(NOW(), INTERVAL 7 DAY)
DATE_ADD(NOW(), INTERVAL 30 DAY)
NOW()

-- 达梦
SYSDATE - 7
SYSDATE + 30
SYSDATE
```

#### 3.3 表名和列名
```sql
-- MySQL（使用反引号）
`table_name`

-- 达梦（使用双引号）
"table_name"
```

#### 3.4 自增主键
```sql
-- MySQL
id INT AUTO_INCREMENT PRIMARY KEY

-- 达梦
id INT IDENTITY(1,1) PRIMARY KEY
```

### 4. 修改的文件清单

- `src/lib/db.ts` - 数据库配置
- `src/lib/init-db.ts` - 数据库初始化
- `src/app/api/dashboard/stats/route.ts` - 大屏统计数据 API
- `src/app/api/projects/route.ts` - 项目列表 API
- `src/app/api/projects/[id]/route.ts` - 项目详情 API
- `src/app/api/projects/[id]/status/route.ts` - 项目状态 API
- `src/app/api/projects/[id]/progress/route.ts` - 项目进度 API
- `src/app/api/debug-stats/route.ts` - 调试统计 API

## 使用说明

### 初始化达梦数据库

在启动应用程序之前，需要先初始化达梦数据库：

```bash
cd /workspace/projects
node scripts/init-dm-database.js
```

此脚本将：
1. 连接到达梦数据库服务器
2. 创建 `PROJECT_MANAGEMENT` 数据库（如果不存在）
3. 创建所有必要的表结构
4. 插入默认数据（部门、科室、模块、用户、项目类型）

### 启动应用程序

初始化数据库后，可以启动应用程序：

```bash
coze dev
```

或使用生产模式：

```bash
coze build
coze start
```

## 数据库连接信息

- **主机**: 129.226.220.194
- **端口**: 5236
- **用户名**: SYSDBA
- **密码**: SYSDBA000
- **数据库**: PROJECT_MANAGEMENT

## 达梦数据库特性

### 兼容 MySQL 的特性
- 大部分 SQL 语法兼容
- 支持 `LIMIT` 和 `OFFSET`
- 支持 `JOIN` 操作
- 支持子查询

### 需要注意的差异
- 字符串聚合使用 `LIST()` 而不是 `GROUP_CONCAT()`
- 日期函数使用 `SYSDATE` 而不是 `NOW()`
- 自增主键使用 `IDENTITY(1,1)` 而不是 `AUTO_INCREMENT`
- 表名和列名使用双引号而不是反引号
- 布尔类型使用 `INT`（0/1）而不是 `TINYINT(1)`

## 故障排除

### 1. 数据库连接失败

如果遇到连接失败错误：
```
[6001] 网络通信异常
```

请检查：
- 达梦数据库服务器是否正在运行
- 网络连接是否正常
- 防火墙是否允许 5236 端口

### 2. SQL 语法错误

如果遇到 SQL 语法错误：
- 检查是否所有 `GROUP_CONCAT` 都已改为 `LIST()`
- 检查是否所有 `NOW()` 都已改为 `SYSDATE`
- 检查表名和列名是否使用双引号

### 3. 初始化失败

如果初始化脚本失败：
- 确保达梦数据库服务正在运行
- 检查用户名和密码是否正确
- 查看错误信息中的详细说明

## 后续维护

### 数据备份

建议定期备份达梦数据库：

```bash
# 使用达梦数据库的备份工具
# 请参考达梦数据库官方文档
```

### 性能优化

- 达梦数据库的连接池配置已优化
- 可以根据实际使用情况调整 `poolMin` 和 `poolMax` 参数

## 技术支持

如遇到问题，请检查：
1. 应用程序日志（`/app/work/logs/bypass/`）
2. 达梦数据库日志
3. 网络连接状态
