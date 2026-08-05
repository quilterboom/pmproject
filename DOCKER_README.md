# PM Project - 项目管理系统 Docker 部署

本项目已改造为可直接用 Docker / docker-compose 启动。镜像基于 `node:20-slim`，构建时执行 `next build` + `tsup` 打包，运行时用 `node dist/server.js` 启动自定义服务，监听 `0.0.0.0:5000`。

> ⚠️ 达梦数据库驱动依赖旧版 OpenSSL 算法，容器已通过 `NODE_OPTIONS=--openssl-legacy-provider` 启用兼容模式，无需手动处理。

## 一、用 docker-compose 启动（推荐）

```bash
# 构建并后台启动
docker compose up -d --build

# 查看日志
docker compose logs -f pm-project

# 停止
docker compose down
```

启动后访问：http://localhost:5000

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 容器内监听端口 | `5000` |
| `DB_HOST` | 达梦数据库地址 | `129.226.220.194` |
| `DB_PORT` | 达梦数据库端口 | `5236` |
| `DB_USER` | 数据库用户 | `SYSDBA` |
| `DB_PASSWORD` | 数据库密码 | `SYSDBA000` |
| `JWT_SECRET` | JWT 签名密钥（生产环境请修改） | `please-change-this-in-production` |

可在项目根目录创建 `.env` 文件覆盖上述默认值，例如：

```env
DB_HOST=129.226.220.194
DB_PASSWORD=你的密码
JWT_SECRET=一段足够随机的字符串
```

## 二、仅用 docker 命令启动

```bash
# 构建镜像
docker build -t pm-project .

# 运行容器
docker run -d \
  -p 5000:5000 \
  --name pm-project \
  -e DB_HOST=129.226.220.194 \
  -e DB_PORT=5236 \
  -e DB_USER=SYSDBA \
  -e DB_PASSWORD=你的密码 \
  -e JWT_SECRET=你的JWT密钥 \
  pm-project
```

## 三、导出镜像到离线服务器

```bash
# 保存（在本机）
docker save pm-project:latest -o pm-project.tar

# 加载并运行（在离线服务器）
docker load -i pm-project.tar
docker run -d -p 5000:5000 --name pm-project pm-project
```

## 四、初始化数据库（可选）

达梦数据库为独立的远程实例（默认 `129.226.220.194:5236`），表结构只需初始化一次。从**源码目录**（需本地有 node_modules）执行：

```bash
NODE_OPTIONS=--openssl-legacy-provider node scripts/init-dm-database.js
```

初始化完成后会写入示例部门、用户（admin/admin123、user1/admin123）和示例项目数据。

## 五、验证

```bash
# 容器状态（STATUS 应为 healthy/Up）
docker ps | grep pm-project

# 健康检查 / 页面访问
curl -I http://localhost:5000

# 登录测试
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## 六、注意事项

1. 容器网络需能访问达梦数据库主机（默认走公网地址，确保防火墙/安全组放行 5236）。
2. 默认账号：管理员 `admin / admin123`，普通用户 `user1 / admin123`。
3. 本机为 Apple Silicon（arm64）时，构建出的镜像是 arm64 架构；部署到 x64 服务器需加 `--platform linux/amd64`，例如：
   ```bash
   docker build --platform linux/amd64 -t pm-project .
   ```
