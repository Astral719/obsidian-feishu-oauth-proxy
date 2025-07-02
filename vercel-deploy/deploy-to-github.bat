@echo off
echo 🚀 部署 Obsidian 飞书分享云端代理到 GitHub...
echo.

REM 检查是否在正确的目录
if not exist "api" (
    echo ❌ 错误：请在 vercel-deploy 目录中运行此脚本
    pause
    exit /b 1
)

REM 初始化 Git 仓库
echo 📦 初始化 Git 仓库...
git init

REM 添加核心文件
echo 📁 添加项目文件...
git add api/
git add package.json
git add vercel.json
git add README.md
git add DEPLOYMENT_GUIDE.md
git add DEPLOY_SUMMARY.md
git add deploy.sh
git add test-deployment.js

REM 提交文件
echo 💾 提交文件...
git commit -m "Initial commit: Obsidian Feishu OAuth proxy for Vercel"

REM 提示用户添加远程仓库
echo.
echo 🔗 请手动添加远程仓库并推送：
echo.
echo 1. 在 GitHub 上创建新仓库：obsidian-feishu-oauth-proxy
echo 2. 复制仓库 URL（例如：https://github.com/your-username/obsidian-feishu-oauth-proxy.git）
echo 3. 运行以下命令：
echo.
echo    git remote add origin https://github.com/your-username/obsidian-feishu-oauth-proxy.git
echo    git branch -M main
echo    git push -u origin main
echo.
echo 🎉 完成后，你就可以在 Vercel 中连接这个 GitHub 仓库了！
echo.
pause
