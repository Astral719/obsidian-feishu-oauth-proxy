@echo off
chcp 65001 >nul
echo ========================================
echo 飞书分享插件 - 代理服务器启动
echo ========================================
echo.

echo [信息] 正在启动代理服务器...
echo [信息] 请保持此窗口打开，以便插件正常工作
echo [信息] 按 Ctrl+C 可以停止服务器
echo.

node proxy-server.js

pause
