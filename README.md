# 项目管理系统

## 系统简介

这是一个专为仪控部设计的项目管理系统，支持部门-科室-模块三级组织架构，提供项目管理、人员管理、数据权限控制等功能。

## 组织架构

### 当前架构

```
仪控部
├── 保护科
│   └── 工业机网络安全
├── 技术管理科
├── 控制科
└── 专用系统科
```

### 职能说明

#### 部门
- **仪控部**: 负责仪器设备控制相关工作

#### 科室
- **保护科**: 负责保护相关工作
  - 工业机网络安全：负责工业机网络安全工作
- **技术管理科**: 负责技术管理工作
- **控制科**: 负责控制相关工作
- **专用系统科**: 负责专用系统相关工作

## 系统功能

### 1. 用户管理
- ✅ 用户注册（需选择所属部门、科室、模块）
- ✅ 用户登录（JWT 认证）
- ✅ 用户列表查看
- ✅ 用户启用/禁用（仅管理员）
- ✅ 角色管理（管理员、经理、成员）

### 2. 项目管理
- ✅ 创建项目
- ✅ 项目列表查看
- ✅ 项目状态管理（规划中、进行中、已完成、暂停、已取消）
- ✅ 项目优先级设置（低、中、高、紧急）
- ✅ 项目进度跟踪
- ✅ 按部门、科室、模块分类

### 3. 数据大屏
- ✅ 项目总览（总数、已完成、进行中、平均进度）
- ✅ 按状态统计
- ✅ 按优先级统计
- ✅ 按部门统计
- ✅ 最近7天新增项目
- ✅ 即将到期项目（30天内）
- ✅ 已超期项目

### 4. 权限控制
- ✅ 基于 JWT 的身份认证
- ✅ 角色权限控制（admin、manager、member）
- ✅ 数据权限隔离（非管理员只能查看同部门数据）

## 快速开始

### 默认账户

- **用户名**: `admin`
- **密码**: `admin123`
- **角色**: 管理员

### 访问地址

- **开发环境**: http://localhost:5000
- **生产环境**: 根据部署配置

### 使用流程

1. **登录系统**: 使用默认账户登录
2. **添加用户**: 在人员管理页添加团队成员
3. **创建项目**: 在项目管理页创建新项目
4. **查看统计**: 在主页查看项目统计信息

## 技术架构

### 后端
- **框架**: Next.js 16 (App Router)
- **数据库**: MySQL 5.7+
- **认证**: JWT (jsonwebtoken)
- **密码加密**: bcryptjs

### 前端
- **框架**: React 19
- **样式**: Tailwind CSS 4
- **组件库**: shadcn/ui
- **状态管理**: React Hooks

## 部署说明

详细部署步骤请参考 [DEPLOY.md](./DEPLOY.md)

### 快速部署

```bash
# 1. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置数据库连接信息

# 2. 安装依赖
pnpm install

# 3. 初始化数据库
curl http://localhost:5000/api/init-db

# 4. 启动服务
pnpm dev  # 开发模式
# 或
pnpm build && pnpm start  # 生产模式
```

### 使用 PM2 管理进程

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start npm --name "project-management" -- start

# 查看状态
pm2 status

# 查看日志
pm2 logs project-management

# 重启服务
pm2 restart project-management

# 停止服务
pm2 stop project-management
```

## API 接口

### 认证接口
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `GET /api/auth/me` - 获取当前用户信息

### 组织架构接口
- `GET /api/departments` - 获取部门列表
- `GET /api/offices?department_id=1` - 获取科室列表
- `GET /api/modules?office_id=1` - 获取模块列表

### 项目管理接口
- `GET /api/projects` - 获取项目列表
- `POST /api/projects` - 创建项目
- `GET /api/projects/[id]` - 获取项目详情
- `PUT /api/projects/[id]` - 更新项目
- `DELETE /api/projects/[id]` - 删除项目

### 用户管理接口
- `GET /api/users` - 获取用户列表
- `POST /api/users` - 创建用户（仅管理员）
- `GET /api/users/[id]` - 获取用户详情
- `PUT /api/users/[id]` - 更新用户
- `DELETE /api/users/[id]` - 删除用户（仅管理员）

### 数据统计接口
- `GET /api/dashboard/stats` - 获取项目统计数据

### 系统管理接口
- `GET /api/init-db` - 初始化数据库
- `GET /api/clear-db` - 清空数据库（谨慎使用）

## 数据库表结构

### departments（部门表）
- `id` - 主键
- `name` - 部门名称
- `description` - 部门描述

### offices（科室表）
- `id` - 主键
- `department_id` - 所属部门
- `name` - 科室名称
- `description` - 科室描述

### modules（模块表）
- `id` - 主键
- `office_id` - 所属科室
- `name` - 模块名称
- `description` - 模块描述

### users（用户表）
- `id` - 主键
- `username` - 用户名
- `password` - 密码（加密）
- `real_name` - 真实姓名
- `email` - 邮箱
- `phone` - 电话
- `department_id` - 所属部门
- `office_id` - 所属科室
- `module_id` - 所属模块
- `role` - 角色（admin、manager、member）
- `status` - 状态（active、inactive）

### projects（项目表）
- `id` - 主键
- `name` - 项目名称
- `code` - 项目编号
- `description` - 项目描述
- `department_id` - 所属部门
- `office_id` - 所属科室
- `module_id` - 所属模块
- `manager_id` - 项目经理
- `start_date` - 开始日期
- `end_date` - 结束日期
- `status` - 状态
- `progress` - 进度（0-100）
- `priority` - 优先级
- `budget` - 预算
- `actual_cost` - 实际花费

### project_members（项目成员表）
- `id` - 主键
- `project_id` - 项目ID
- `user_id` - 用户ID
- `role` - 在项目中的角色

### user_permissions（用户权限表）
- `id` - 主键
- `user_id` - 用户ID
- `permission_type` - 权限类型
- `target_id` - 目标ID

## 注意事项

### 安全提示
1. ⚠️ 首次登录后请立即修改默认密码
2. ⚠️ 生产环境务必修改 JWT_SECRET
3. ⚠️ 定期备份数据库
4. ⚠️ 不要使用 `/api/clear-db` 清空生产数据库

### 性能优化
1. 建议对常用查询字段建立索引
2. 定期清理过期数据
3. 使用 PM2 或其他进程管理工具

### 扩展建议
1. 可以添加项目文件上传功能
2. 可以添加项目评论/讨论功能
3. 可以添加项目里程碑管理
4. 可以添加任务管理和甘特图
5. 可以添加报表导出功能

## 问题反馈

如有问题或建议，请联系系统管理员。

## 更新日志

### v1.0.0 (2026-04-05)
- ✅ 完成基础功能开发
- ✅ 实现登录注册功能
- ✅ 实现项目大屏展示
- ✅ 实现项目管理功能
- ✅ 实现人员管理功能
- ✅ 实现数据权限控制
- ✅ 配置仪控部组织架构
  - 部门：仪控部
  - 科室：保护科、技术管理科、控制科、专用系统科
  - 模块：工业机网络安全
