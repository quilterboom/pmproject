# PM Project - 项目管理系统 Docker 配置

## 快速部署

### 1. 构建镜像
```bash
docker build -t pm-project .
```

### 2. 保存镜像（拷贝到离线服务器）
```bash
docker save pm-project -o pm-project.tar
```

### 3. 在离线服务器加载镜像
```bash
docker load -i pm-project.tar
```

### 4. 运行容器
```bash
docker run -d \
  -p 5000:5000 \
  --name pm-project \
  -e DB_HOST=你的数据库地址 \
  -e DB_PORT=5236 \
  -e DB_USER=SYSDBA \
  -e DB_PASSWORD=你的密码 \
  -e JWT_SECRET=你的JWT密钥 \
  pm-project
```

### 5. 初始化数据库
```bash
# 先登录获取 token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 使用返回的 token 初始化数据库
curl -X POST http://localhost:5000/api/db/init \
  -H "Authorization: Bearer <返回的token>"
```

## 使用 docker-compose（可选）

创建 `docker-compose.yml`：
```yaml
version: '3.8'
services:
  pm-project:
    build: .
    ports:
      - "5000:5000"
    environment:
      - DB_HOST=你的数据库地址
      - DB_PORT=5236
      - DB_USER=SYSDBA
      - DB_PASSWORD=你的密码
      - JWT_SECRET=你的JWT密钥
    restart: unless-stopped
```

使用：
```bash
# 启动
docker-compose up -d

# 停止
docker-compose down
```

## 验证部署

```bash
# 检查容器状态
docker ps | grep pm-project

# 查看日志
docker logs -f pm-project

# 测试访问
curl http://localhost:5000
```

## 默认账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 管理员 |

## 注意事项

1. 确保达梦数据库已部署并可从容器内访问
2. 首次使用需要调用 `/api/db/init` 初始化数据库表
3. 防火墙需开放 5000 端口
