# Node.js 20 基础镜像 (Next.js 16 需要 Node 20+)
FROM node:20-slim

# 设置工作目录
WORKDIR /app

# 安装 pnpm (锁定 9.x 以匹配 pnpm-lock.yaml)
RUN npm install -g pnpm@9

# 安装系统依赖 (healthcheck 需要 curl)
RUN apt-get update && apt-get install -y curl ca-certificates && rm -rf /var/lib/apt/lists/*

# 复制 package 文件
COPY package.json pnpm-lock.yaml* ./

# 安装依赖（利用 Docker 缓存）
RUN pnpm install --frozen-lockfile || pnpm install

# 复制源代码
COPY . .

# 构建时注入的前端配置（NEXT_PUBLIC_* 会在 next build 时内联进客户端包）
ARG NEXT_PUBLIC_API_BASE
ENV NEXT_PUBLIC_API_BASE=${NEXT_PUBLIC_API_BASE}
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}

# 构建 Next.js 生产产物 (.next) —— server.ts 以 dev=false 运行必须存在
RUN pnpm next build

# 用 tsup 把自定义 server 打包成 dist/server.js (与 scripts/start.sh 一致)
RUN pnpm tsup src/server.ts --format cjs --platform node --target node20 --outDir dist --no-splitting --no-minify

# 暴露端口
EXPOSE 5000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:5000 || exit 1

# 启动命令 (--openssl-legacy-provider 兼容达梦数据库驱动)
CMD ["sh", "-c", "NODE_OPTIONS=--openssl-legacy-provider node dist/server.js"]
