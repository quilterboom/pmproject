# 项目管理系统 - 部署指南

## 项目概述

这是一个完整的项目管理系统，包含以下功能：

- ✅ 用户登录注册
- ✅ 卡片式大屏展示项目概览
- ✅ 项目管理（增删改查）
- ✅ 人员管理和权限控制
- ✅ 部门-科室-模块三级分类

## 技术栈

- **后端**: Next.js 16 (App Router) + MySQL
- **前端**: React 19 + Tailwind CSS 4 + shadcn/ui
- **认证**: JWT
- **数据库**: MySQL 5.7+

## 数据库配置

### 当前配置信息

```env
DB_HOST=129.226.220.194
DB_PORT=3306
DB_USER=root
DB_PASSWORD=Lyp552034#
DB_NAME=project_managents
```

### 离线部署时的配置

在离线服务器上部署时，请修改 `.env` 文件（如果不存在，请创建）：

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=project_managents
```

## 部署步骤

### 1. 准备服务器环境

确保服务器已安装：
- Node.js 18+ （建议 20.x）
- MySQL 5.7+
- pnpm (包管理器)

### 2. 创建数据库

```bash
# 登录 MySQL
mysql -u root -p

# 创建数据库
CREATE DATABASE project_managents CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 退出
EXIT;
```

### 3. 上传项目文件

将整个项目文件夹上传到服务器。

### 4. 安装依赖

```bash
cd /path/to/project

# 安装 pnpm（如果未安装）
npm install -g pnpm

# 安装项目依赖
pnpm install
```

### 5. 配置环境变量

创建 `.env` 文件（在项目根目录）：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=project_managents

# JWT 配置
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# 服务端口
PORT=5000
```

### 6. 初始化数据库

```bash
# 初始化数据库表结构和默认数据
curl http://localhost:5000/api/init-db
```

或者手动调用：
```bash
pnpm tsx src/lib/init-db.ts
```

### 7. 构建项目

```bash
pnpm build
```

### 8. 启动服务

**开发环境**：
```bash
pnpm dev
```

**生产环境**：
```bash
pnpm start
```

### 9. 使用 PM2 管理进程（推荐）

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start npm --name "project-management" -- start

# 查看状态
pm2 status

# 查看日志
pm2 logs project-management

# 停止服务
pm2 stop project-management

# 重启服务
pm2 restart project-management
```

## 默认账户

系统已自动创建默认管理员账户：

- **用户名**: `admin`
- **密码**: `admin123`
- **角色**: 管理员
- **所属部门**: 仪控部

⚠️ **首次登录后请立即修改密码！**

## 默认组织架构

### 部门
- 仪控部

### 科室
- 保护科
- 技术管理科
- 控制科
- 专用系统科

### 模块
- 工业机网络安全（隶属于保护科）

**注**: 您可以在系统中添加更多的部门、科室和模块。

## 功能说明

### 1. 登录注册
- 访问首页进行登录
- 新用户可以注册账户（需要选择所属部门、科室、模块）

### 2. 主页大屏
- 展示项目总数、已完成、进行中项目数量
- 按状态、优先级、部门统计项目分布
- 显示最近7天新增、即将到期、已超期项目

### 3. 项目管理
- 创建新项目（填写项目名称、描述、部门、科室、模块等）
- 查看项目列表
- 支持按状态、部门筛选
- 显示项目进度、优先级等信息

### 4. 人员管理
- 查看用户列表
- 管理员可以添加新用户
- 管理员可以启用/禁用用户
- 支持按部门筛选用户

### 5. 数据权限
- 管理员可以查看所有数据
- 普通用户只能查看同部门的项目和用户
- 基于角色（admin、manager、member）的权限控制

## 目录结构

```
project-management/
├── src/
│   ├── app/
│   │   ├── api/              # API 路由
│   │   │   ├── auth/         # 认证相关 API
│   │   │   ├── projects/     # 项目管理 API
│   │   │   ├── users/        # 用户管理 API
│   │   │   ├── departments/  # 部门 API
│   │   │   ├── offices/      # 科室 API
│   │   │   └── modules/      # 模块 API
│   │   ├── dashboard/        # 前端页面
│   │   └── layout.tsx        # 主布局
│   ├── components/ui/        # UI 组件（shadcn/ui）
│   └── lib/                  # 工具函数
│       ├── db.ts             # 数据库配置
│       ├── init-db.ts        # 数据库初始化
│       └── auth.ts           # 认证工具
├── public/                   # 静态资源
├── package.json
├── tsconfig.json
└── next.config.ts
```

## 常见问题

### 1. 数据库连接失败

检查 `.env` 文件中的数据库配置是否正确，确保 MySQL 服务正在运行。

### 2. 端口被占用

修改 `.env` 文件中的 `PORT` 配置，或者停止占用 5000 端口的服务。

### 3. 初始化数据库失败

确保数据库已创建，并且用户有足够的权限创建表。

### 4. 登录失败

- 检查用户名和密码是否正确
- 确认用户状态是否为 `active`
- 查看服务器日志获取详细错误信息

## 开发说明

### 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 访问 http://localhost:5000
```

### API 文档

所有 API 都遵循 RESTful 规范：

- **认证**: `/api/auth/login`, `/api/auth/register`, `/api/auth/me`
- **部门**: `/api/departments`
- **科室**: `/api/offices`
- **模块**: `/api/modules`
- **项目**: `/api/projects`
- **用户**: `/api/users`
- **统计**: `/api/dashboard/stats`

### 数据库表结构

- `departments` - 部门表
- `offices` - 科室表
- `modules` - 模块表
- `users` - 用户表
- `projects` - 项目表
- `project_members` - 项目成员关联表
- `user_permissions` - 用户数据权限表

## 技术支持

如有问题，请查看：
- 服务器日志：`pm2 logs project-management`
- 浏览器控制台（前端错误）
- 数据库日志（MySQL 错误）

## 更新日志

### v1.0.0 (2026-04-05)
- ✅ 完成基础功能开发
- ✅ 实现登录注册功能
- ✅ 实现项目大屏展示
- ✅ 实现项目管理功能
- ✅ 实现人员管理功能
- ✅ 实现数据权限控制
