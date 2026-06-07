# 项目管理系统 (PM Project)

专为仪控部设计的任务管理和数据统计平台。

## 功能特性

### 任务概览
- 📊 **数据概览仪表盘** - 展示总任务数、已完成、进行中、即将到期、已超期等关键指标
- 🔗 **指标卡片联动** - 点击任一指标卡片，自动筛选并展示该状态下的详细任务列表
- 📈 **实时统计** - 按状态、优先级、部门等多维度统计项目数据

### 任务管理
- ✨ **AI 智能创建** - 输入自然语言描述，AI 自动解析生成任务信息
- 📋 **任务类型分组** - 按任务类型分组展示，支持可拖拽调整列宽
- 🔍 **多维度筛选** - 支持按状态、优先级、负责人、任务类型、模块筛选
- ⏰ **进度跟踪** - 实时更新任务进度，支持里程碑管理
- 🔔 **催办功能** - 一键催办超时任务
- 👥 **团队协作** - 支持添加项目成员，明确职责分工

### 状态管理
- 🔄 **状态流转** - 规划中 → 进行中 → 已完成
- ⏸ **暂停/终止** - 专用 API 处理暂停和终止，保留完整历史数据
- ⚠️ **超期预警** - 自动识别即将到期和已超期任务

### AI 功能
- 🤖 **任务解析** - MiniMax / OpenAI / Anthropic / Ollama 多模型支持
- 💬 **智能问答** - 基于项目数据的企业知识库问答
- 📋 **风险分析** - AI 自动分析任务风险并生成建议

### 数据安全
- 🔐 **权限分级** - 管理员/经理/成员三级权限体系
- 🔑 **JWT 认证** - 安全的 Token 认证机制
- 👤 **数据隔离** - 非管理员只能查看自己负责的任务

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | Next.js 16 + React 19 | App Router 架构 |
| UI 框架 | Tailwind CSS 4 + shadcn/ui | 现代化样式方案 |
| 状态管理 | Zustand | 轻量级状态管理 |
| 后端 | Next.js API Routes | 服务端 API |
| 数据库 | 达梦数据库 (DM) | 国产高性能数据库 |
| 认证 | JWT + bcryptjs | 安全认证机制 |

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
创建 `.env` 文件：
```env
DB_HOST=localhost
DB_PORT=5236
DB_NAME=SYSDBA
DB_USER=your_username
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
```

### 3. 初始化数据库
```bash
curl -X POST http://localhost:5000/api/db/init \
  -H "Authorization: Bearer <管理员token>"
```

初始化完成后会自动创建：
- 12 张数据表
- 默认管理员账号 (admin/admin123)
- 5 个默认任务类型

### 4. 启动服务
```bash
# 开发环境
npm run dev

# 生产环境
pnpm build && NODE_OPTIONS=--openssl-legacy-provider pnpm tsx src/server.ts
```

访问 http://localhost:5000

## 默认账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 管理员 |

## 项目结构

```
src/
├── app/
│   ├── api/                    # API 路由
│   │   ├── auth/              # 认证 (login/register/me)
│   │   ├── projects/         # 项目管理 (CRUD + terminate/pause)
│   │   ├── users/            # 用户管理
│   │   ├── dashboard/        # 统计数据
│   │   ├── db/               # 数据库初始化
│   │   └── ai/               # AI 功能
│   └── dashboard/            # 管理后台页面
│       ├── projects/          # 项目列表/详情
│       ├── users/             # 用户管理
│       └── model-config/      # AI 模型配置
├── components/
│   └── projects/             # 项目模块组件
│       ├── FilterBar.tsx      # 筛选栏
│       ├── Pagination.tsx      # 分页组件
│       ├── ProjectCard.tsx    # 项目卡片
│       ├── ProjectHeader.tsx  # 表头
│       ├── ProjectFormDialog.tsx # 新建/编辑
│       ├── LogsDialog.tsx      # 操作记录
│       ├── TeamDialog.tsx     # 团队成员
│       └── ConfirmDialog.tsx  # 确认对话框
├── stores/                    # Zustand 状态管理
├── hooks/                     # 自定义 Hooks
├── lib/                       # 工具函数
│   ├── dm-helper.ts          # 数据库操作
│   ├── constants.ts          # 常量配置
│   └── api-response.ts       # API 响应封装
└── types/                    # TypeScript 类型
```

## API 接口

### 认证
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/register` | 用户注册 |
| GET | `/api/auth/me` | 获取当前用户 |

### 用户管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/users` | 用户列表 |
| POST | `/api/users` | 创建用户 |
| PUT | `/api/users/[id]` | 更新用户 |
| DELETE | `/api/users/[id]` | 删除用户 |

### 项目管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/projects` | 项目列表（支持分页、筛选） |
| POST | `/api/projects` | 创建项目 |
| GET | `/api/projects/[id]` | 项目详情 |
| PUT | `/api/projects/[id]` | 更新项目 |
| DELETE | `/api/projects/[id]` | 删除项目 |
| POST | `/api/projects/[id]/terminate` | 终止项目 |
| POST | `/api/projects/[id]/pause` | 暂停项目 |

### 数据统计
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/dashboard/stats` | 仪表盘统计 |
| GET | `/api/departments` | 部门列表 |
| GET | `/api/modules` | 模块列表 |
| GET | `/api/project-types` | 任务类型列表 |

### AI 功能
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/ai/parse-task` | AI 解析任务描述 |
| POST | `/api/ai/chat` | AI 问答 |
| POST | `/api/ai/analyze-tasks` | AI 风险分析 |

### 系统管理
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/db/init` | 初始化数据库 |
| GET | `/api/notifications` | 通知列表 |
| POST | `/api/notifications/urge` | 发送催办 |

## 数据库表

| 表名 | 说明 |
|------|------|
| users | 用户表 |
| departments | 部门表 |
| offices | 科室表 |
| modules | 模块表 |
| projects | 项目表 |
| project_types | 任务类型表 |
| project_members | 项目成员表 |
| project_logs | 操作日志表 |
| milestones | 里程碑表 |
| tasks | 子任务表 |
| notifications | 通知表 |
| model_configs | AI 模型配置表 |

## 常用操作

### 筛选项目
```
GET /api/projects?status=in_progress&priority=1&page=1&page_size=20
```

### AI 智能创建任务
```bash
# 1. AI 解析自然语言描述
curl -X POST http://localhost:5000/api/ai/parse-task \
  -H "Content-Type: application/json" \
  -d '{"description":"完成用户登录页面，优先级高"}'

# 2. 使用解析结果创建项目
curl -X POST http://localhost:5000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"用户登录页面","priority":"1",...}'
```

### 终止任务
```bash
curl -X POST http://localhost:5000/api/projects/123/terminate \
  -H "Content-Type: application/json" \
  -d '{"reason":"需求变更，项目取消"}'
```

## 部署

详细部署说明请参考 [DEPLOY.md](./DEPLOY.md)

## 许可证

MIT