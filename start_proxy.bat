@echo off
echo 🚀 启动飞书分享代理服务器（Python 版本）
echo.

REM 检查 Python 是否安装
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误：未找到 Python，请先安装 Python 3.7+
    pause
    exit /b 1
)

REM 检查是否已安装依赖
pip show flask >nul 2>&1
if %errorlevel% neq 0 (
    echo 📦 正在安装 Python 依赖...
    pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
    echo.
)

echo 🔧 启动代理服务器...
python feishu_proxy.py

pause
