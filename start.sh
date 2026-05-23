#!/bin/bash

# 项目管理系统 - 快速启动脚本

echo "==================================="
echo "  项目管理系统 - 快速启动"
echo "==================================="

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js 18+"
    exit 1
fi

echo "✓ Node.js 版本: $(node -v)"

# 检查 pnpm
if ! command -v pnpm &> /dev/null; then
    echo "⚠️  pnpm 未安装，正在安装..."
    npm install -g pnpm
fi

echo "✓ pnpm 版本: $(pnpm -v)"

# 检查 .env 文件
if [ ! -f .env ]; then
    echo "⚠️  .env 文件不存在，正在创建..."
    cp .env.example .env
    echo "✓ 已创建 .env 文件"
    echo "⚠️  请编辑 .env 文件，配置数据库连接信息"
    echo ""
    read -p "是否现在配置数据库？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "数据库主机 [localhost]: " DB_HOST
        read -p "数据库端口 [3306]: " DB_PORT
        read -p "数据库用户名 [root]: " DB_USER
        read -s -p "数据库密码: " DB_PASSWORD
        echo
        read -p "数据库名称 [project_management]: " DB_NAME

        # 更新 .env 文件
        sed -i "s/DB_HOST=.*/DB_HOST=${DB_HOST:-localhost}/" .env
        sed -i "s/DB_PORT=.*/DB_PORT=${DB_PORT:-3306}/" .env
        sed -i "s/DB_USER=.*/DB_USER=${DB_USER:-root}/" .env
        sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=${DB_PASSWORD}/" .env
        sed -i "s/DB_NAME=.*/DB_NAME=${DB_NAME:-project_management}/" .env
        echo "✓ 数据库配置已更新"
    fi
fi

# 安装依赖
if [ ! -d node_modules ]; then
    echo ""
    echo "正在安装依赖..."
    pnpm install
    echo "✓ 依赖安装完成"
fi

# 初始化数据库
echo ""
read -p "是否初始化数据库？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "正在初始化数据库..."
    pnpm tsx src/lib/init-db.ts
    echo "✓ 数据库初始化完成"
fi

# 启动服务
echo ""
echo "==================================="
echo "  启动服务"
echo "==================================="

read -p "选择启动模式 (1: 开发模式, 2: 生产模式) [1]: " MODE
MODE=${MODE:-1}

if [ $MODE = "1" ]; then
    echo "启动开发服务器..."
    pnpm dev
elif [ $MODE = "2" ]; then
    echo "构建项目..."
    pnpm build
    echo "启动生产服务器..."
    pnpm start
else
    echo "无效选择"
    exit 1
fi
