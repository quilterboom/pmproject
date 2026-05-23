# 项目上下文

### 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4
- **数据库**: 达梦数据库 (DM) - 国产数据库

## 目录结构

```
├── public/                 # 静态资源
├── scripts/                # 构建与启动脚本
│   ├── build.sh            # 构建脚本
│   ├── dev.sh              # 开发环境启动脚本
│   ├── prepare.sh          # 预处理脚本
│   ├── start.sh            # 生产环境启动脚本
│   └── init-dm-database.js # 达梦数据库初始化脚本
├── src/
│   ├── app/                # 页面路由与布局
│   │   └── api/            # API 路由
│   ├── components/ui/      # Shadcn UI 组件库
│   ├── hooks/              # 自定义 Hooks
│   ├── lib/                # 工具库
│   │   ├── utils.ts        # 通用工具函数 (cn)
│   │   ├── db.ts           # 达梦数据库连接配置
│   │   ├── dm-helper.ts    # 达梦数据库查询辅助函数
│   │   ├── init-db.ts      # 数据库操作函数（已适配达梦）
│   │   └── auth.ts         # 认证相关函数
│   └── server.ts           # 自定义服务端入口
├── next.config.ts          # Next.js 配置
├── package.json            # 项目依赖管理
└── tsconfig.json           # TypeScript 配置
```

## 数据库配置

### 达梦数据库连接

- **地址**: 129.226.220.194:5236
- **用户名**: SYSDBA
- **密码**: SYSDBA000

### 初始化数据库

```bash
NODE_OPTIONS=--openssl-legacy-provider node scripts/init-dm-database.js
```

### 测试账号

- **管理员**: admin / admin123
- **普通用户**: user1 / admin123

## 包管理规范

**仅允许使用 pnpm** 作为包管理器，**严禁使用 npm 或 yarn**。
**常用命令**：
- 安装依赖：`pnpm add <package>`
- 安装开发依赖：`pnpm add -D <package>`
- 安装所有依赖：`pnpm install`
- 移除依赖：`pnpm remove <package>`

## 开发规范

### 数据库开发规范（达梦数据库）

1. **使用双引号包裹表名和列名**：达梦数据库默认不区分大小写，需要使用双引号来保持大小写敏感。
   ```sql
   SELECT * FROM "users" WHERE "username" = ?
   ```

2. **标识符函数**：
   - 使用 `IDENTITY(1,1)` 替代 MySQL 的 `AUTO_INCREMENT`
   - 日期函数使用 `CURRENT_TIMESTAMP`、`CURRENT_DATE` 替代 `NOW()`
   - 日期转换使用 `TO_DATE(?, 'YYYY-MM-DD')`

3. **数据类型**：
   - 布尔类型使用 `SMALLINT`（0/1）替代 `BOOLEAN`
   - 长文本使用 `VARCHAR(500)` 或 `VARCHAR(1000)` 替代 `TEXT`
   - 数字精度使用 `DECIMAL(15,2)`

4. **字符串函数**：
   - 使用 `||` 替代 `CONCAT`
   - 使用 `LIST(col, ',')` 替代 `GROUP_CONCAT`

5. **连接池配置**：
   ```typescript
   export async function getPool() {
     const connectionString = `dm://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}`;
     pool = await dm.createPool({
       connectString: connectionString,
       poolMin: 2,
       poolMax: 10,
       poolTimeout: 30,
       queueMax: 500,
     });
     return pool;
   }
   ```

6. **结果处理**：
   - 达梦数据库返回的是数组格式，需要转换为对象格式
   - 使用 `dm-helper.ts` 中的辅助函数会自动处理转换

### Hydration 错误预防

严禁在 JSX 渲染逻辑中直接使用 `typeof window`、`Date.now()`、`Math.random()` 等动态数据。必须使用 `'use client'` 并配合 `useEffect` + `useState` 确保动态内容仅在客户端挂载后渲染；同时严禁非法 HTML 嵌套（如 `<p>` 嵌套 `<div>`）。

## 启动开发服务器

```bash
NODE_OPTIONS=--openssl-legacy-provider pnpm tsx src/server.ts
```

注意：由于达梦数据库驱动使用较旧版本的 OpenSSL 加密算法，需要设置 `NODE_OPTIONS=--openssl-legacy-provider` 来启用兼容模式。

## API 接口

### 认证 API

- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息

### 项目 API

- `GET /api/projects` - 获取项目列表（支持分页、筛选）
- `POST /api/projects` - 创建项目
- `GET /api/projects/[id]` - 获取项目详情
- `PUT /api/projects/[id]` - 更新项目
- `DELETE /api/projects/[id]` - 删除项目
- `PATCH /api/projects/[id]/status` - 更新项目状态
- `PATCH /api/projects/[id]/progress` - 更新项目进度

### 大屏展示 API

- `GET /api/dashboard/stats` - 获取统计数据

## 数据库表结构

### 用户表 (users)

| 列名 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| username | VARCHAR(100) | 用户名，唯一 |
| password | VARCHAR(255) | 密码（bcrypt加密） |
| real_name | VARCHAR(100) | 真实姓名 |
| email | VARCHAR(100) | 邮箱 |
| phone | VARCHAR(50) | 电话 |
| role | VARCHAR(50) | 角色（admin/user） |
| status | VARCHAR(50) | 状态（active/inactive） |
| department_id | INT | 部门ID |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### 部门表 (departments)

| 列名 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| name | VARCHAR(100) | 部门名称 |
| description | VARCHAR(500) | 描述 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### 项目表 (projects)

| 列名 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| name | VARCHAR(200) | 项目名称 |
| description | VARCHAR(1000) | 项目描述 |
| department_id | INT | 部门ID |
| office_id | INT | 科室ID |
| module_id | INT | 模块ID |
| progress | INT | 进度（0-100） |
| status | VARCHAR(50) | 状态 |
| priority | VARCHAR(50) | 优先级 |
| budget | DECIMAL(15,2) | 预算 |
| start_date | DATE | 开始日期 |
| end_date | DATE | 结束日期 |
| manager_name | VARCHAR(100) | 负责人姓名 |
| manager_phone | VARCHAR(50) | 负责人电话 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### 里程碑表 (milestones)

| 列名 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| project_id | INT | 项目ID |
| name | VARCHAR(200) | 里程碑名称 |
| description | VARCHAR(500) | 描述 |
| due_date | DATE | 截止日期 |
| completed | SMALLINT | 是否完成（0/1） |
| completed_at | TIMESTAMP | 完成时间 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### 任务表 (tasks)

| 列名 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| project_id | INT | 项目ID |
| milestone_id | INT | 里程碑ID |
| title | VARCHAR(200) | 任务标题 |
| description | VARCHAR(500) | 描述 |
| assignee | VARCHAR(100) | 负责人 |
| status | VARCHAR(50) | 状态 |
| priority | VARCHAR(50) | 优先级 |
| due_date | DATE | 截止日期 |
| completed_at | TIMESTAMP | 完成时间 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### 文档表 (documents)

| 列名 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| project_id | INT | 项目ID |
| title | VARCHAR(200) | 文档标题 |
| file_path | VARCHAR(500) | 文件路径 |
| file_type | VARCHAR(50) | 文件类型 |
| uploaded_by | VARCHAR(100) | 上传人 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### 风险表 (risks)

| 列名 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| project_id | INT | 项目ID |
| title | VARCHAR(200) | 风险标题 |
| description | VARCHAR(500) | 描述 |
| severity | VARCHAR(50) | 严重程度 |
| probability | VARCHAR(50) | 发生概率 |
| impact | VARCHAR(50) | 影响程度 |
| mitigation | VARCHAR(500) | 应对措施 |
| status | VARCHAR(50) | 状态 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### 成本表 (costs)

| 列名 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| project_id | INT | 项目ID |
| category | VARCHAR(100) | 成本类别 |
| description | VARCHAR(200) | 描述 |
| amount | DECIMAL(15,2) | 金额 |
| date | DATE | 日期 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |
