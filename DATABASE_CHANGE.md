# 数据库名称变更说明

## 📝 变更内容

### 旧数据库名称
```
project_managents
```

### 新数据库名称
```
project_management
```

## 🔧 修改的文件

### 1. 配置文件
- ✅ `src/lib/db.ts` - 修改默认数据库名称
- ✅ `.env.example` - 修改环境变量示例

### 2. 文档文件
- ✅ `DEPLOY.md` - 修改所有数据库名称引用
- ✅ `start.sh` - 修改启动脚本中的默认值

### 3. 数据库
- ✅ 已清空旧数据库
- ✅ 已重新初始化为 `project_management` 数据库

## 📊 数据库结构（project_management）

### 表列表
1. **departments** - 部门表
2. **offices** - 科室表
3. **modules** - 模块表
4. **users** - 用户表
5. **projects** - 项目表
6. **project_members** - 项目成员关联表
7. **user_permissions** - 用户数据权限表

### 默认数据

#### 部门
| ID | 名称 | 描述 |
|----|------|------|
| 1  | 仪控部 | 负责仪器设备控制相关工作 |

#### 科室
| ID | 部门ID | 名称 | 描述 |
|----|--------|------|------|
| 1  | 1      | 保护科 | 负责保护相关工作 |
| 2  | 1      | 技术管理科 | 负责技术管理工作 |
| 3  | 1      | 控制科 | 负责控制相关工作 |
| 4  | 1      | 专用系统科 | 负责专用系统相关工作 |

#### 模块
| ID | 科室ID | 名称 | 描述 |
|----|--------|------|------|
| 1  | 1      | 工业机网络安全 | 负责工业机网络安全工作 |

#### 默认管理员
| ID | 用户名 | 密码 | 真实姓名 | 角色 | 部门ID |
|----|--------|------|----------|------|--------|
| 1  | admin  | admin123 | 系统管理员 | admin | 1 |

## ✅ 验证结果

### API 测试
```bash
# 部门列表
curl http://localhost:5000/api/departments
# ✅ 返回：仪控部

# 科室列表
curl http://localhost:5000/api/offices?department_id=1
# ✅ 返回：保护科、技术管理科、控制科、专用系统科

# 模块列表
curl http://localhost:5000/api/modules?office_id=1
# ✅ 返回：工业机网络安全

# 登录测试
curl -X POST -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}' \
  http://localhost:5000/api/auth/login
# ✅ 返回：token 和用户信息
```

## 🚀 部署说明

### 本地部署
```bash
# 1. 创建数据库
mysql -u root -p
CREATE DATABASE project_managents CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，确保 DB_NAME=project_managents

# 3. 初始化数据库
curl http://localhost:5000/api/init-db
# 或运行：pnpm tsx src/lib/init-db.ts

# 4. 启动服务
pnpm dev  # 开发模式
# 或
pnpm build && pnpm start  # 生产模式
```

### 服务器部署
```bash
# 1. 在 MySQL 服务器上创建数据库
mysql -h 129.226.220.194 -u root -p
CREATE DATABASE project_managents CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;

# 2. 配置 .env 文件
DB_HOST=129.226.220.194
DB_PORT=3306
DB_USER=root
DB_PASSWORD=Lyp552034#
DB_NAME=project_managents

# 3. 安装依赖并初始化
pnpm install
pnpm tsx src/lib/init-db.ts

# 4. 构建并启动
pnpm build
pm2 start npm --name "project-manager" -- start
```

## ⚠️ 注意事项

1. **数据库名称**: 务必使用 `project_managents`，避免与现有数据库冲突
2. **表名前缀**: 所有表名使用简单命名，不使用前缀
3. **字符集**: 使用 `utf8mb4` 字符集，支持完整的中文字符
4. **初始化**: 部署时必须运行初始化脚本创建表结构

## 📚 相关文档

- 部署指南：`DEPLOY.md`
- 使用说明：`README.md`
- 快速启动：`start.sh`

---

**变更时间**: 2026-04-05  
**数据库名称**: project_managents  
**状态**: ✅ 已完成并验证通过
