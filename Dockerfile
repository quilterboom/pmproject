# Node.js 18 基础镜像
FROM node:18-slim

# 设置工作目录
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制 package 文件
COPY package.json pnpm-lock.yaml* ./

# 安装依赖（利用 Docker 缓存）
RUN pnpm install --frozen-lockfile || pnpm install

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 5000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000 || exit 1

# 启动命令
CMD ["sh", "-c", "NODE_OPTIONS=--openssl-legacy-provider pnpm tsx src/server.ts"]
