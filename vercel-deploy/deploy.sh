#!/bin/bash

echo "🚀 开始部署 Obsidian 飞书分享云端代理服务..."

# 检查是否安装了 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI 未安装，正在安装..."
    npm install -g vercel
fi

# 检查是否已登录 Vercel
echo "🔐 检查 Vercel 登录状态..."
if ! vercel whoami &> /dev/null; then
    echo "📝 请登录 Vercel..."
    vercel login
fi

# 安装依赖
echo "📦 安装依赖..."
npm install

# 部署到 Vercel
echo "🚀 部署到 Vercel..."
vercel --prod

echo "✅ 部署完成！"
echo ""
echo "📋 接下来的步骤："
echo "1. 在 Vercel Dashboard 中创建 KV 数据库"
echo "2. 设置环境变量 KV_REST_API_URL 和 KV_REST_API_TOKEN"
echo "3. 在飞书开放平台中设置回调地址"
echo "4. 在 Obsidian 插件中配置代理地址"
echo ""
echo "🎉 享受零门槛的飞书分享体验！"
