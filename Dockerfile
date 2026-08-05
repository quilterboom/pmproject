# 单阶段构建：本机（arm64）可直接 build 并 docker save 导出为镜像 tar
FROM node:22-bookworm

WORKDIR /app

# 必须与 package.json 的 packageManager 完全一致（pnpm@9.0.0），
# 否则 pnpm 会尝试下载并校验其它版本签名，在弱网下极易超时失败
RUN npm install -g pnpm@9.0.0

# 改用国内镜像源，规避 registry.npmjs.org 的 ECONNRESET / 超时
RUN npm config set registry https://registry.npmmirror.com \
 && pnpm config set registry https://registry.npmmirror.com

# 仅安装依赖（层缓存友好）
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile \
  --network-concurrency=4 \
  --fetch-retries=5 \
  --fetch-retry-mintimeout=20000 \
  --fetch-retry-maxtimeout=180000

# 复制源码并构建（next build + tsup -> dist/server.js）
COPY . .
RUN pnpm build

# 删除 devDependencies，保留生产运行时依赖
RUN pnpm prune --prod

ENV NODE_ENV=production
# 达梦数据库驱动依赖旧版 OpenSSL 算法，需启用 legacy provider
ENV NODE_OPTIONS=--openssl-legacy-provider
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=5000

EXPOSE 5000

# 健康检查（node 自带 http，无需额外安装 curl）
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000',r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"

CMD ["sh", "-c", "node dist/server.js"]
