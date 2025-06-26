#!/bin/bash

echo "========================================"
echo "飞书分享插件 - Obsidian 安装脚本"
echo "========================================"
echo

# 检查是否存在构建文件
if [ ! -f "main.js" ]; then
    echo "[错误] 未找到 main.js 文件，请先运行 npm run build"
    exit 1
fi

if [ ! -f "manifest.json" ]; then
    echo "[错误] 未找到 manifest.json 文件"
    exit 1
fi

echo "[信息] 请输入您的 Obsidian 笔记库路径"
echo "例如: /Users/YourName/Documents/MyVault"
read -p "笔记库路径: " VAULT_PATH

if [ -z "$VAULT_PATH" ]; then
    echo "[错误] 路径不能为空"
    exit 1
fi

# 检查笔记库路径是否存在
if [ ! -d "$VAULT_PATH" ]; then
    echo "[错误] 指定的笔记库路径不存在: $VAULT_PATH"
    exit 1
fi

# 设置插件目录路径
PLUGIN_DIR="$VAULT_PATH/.obsidian/plugins/obsidian-feishu-share"

echo
echo "[信息] 目标插件目录: $PLUGIN_DIR"

# 创建插件目录
if [ ! -d "$PLUGIN_DIR" ]; then
    echo "[信息] 创建插件目录..."
    mkdir -p "$PLUGIN_DIR"
fi

# 复制文件
echo "[信息] 复制插件文件..."
cp "main.js" "$PLUGIN_DIR/"
cp "manifest.json" "$PLUGIN_DIR/"

# 检查复制是否成功
if [ -f "$PLUGIN_DIR/main.js" ]; then
    echo "[成功] main.js 复制完成"
else
    echo "[错误] main.js 复制失败"
fi

if [ -f "$PLUGIN_DIR/manifest.json" ]; then
    echo "[成功] manifest.json 复制完成"
else
    echo "[错误] manifest.json 复制失败"
fi

echo
echo "========================================"
echo "安装完成！"
echo "========================================"
echo
echo "接下来请："
echo "1. 打开 Obsidian"
echo "2. 进入 设置 > 第三方插件"
echo "3. 关闭"安全模式"（如果开启的话）"
echo "4. 找到"飞书分享"插件并启用"
echo "5. 按照测试指南进行配置和测试"
echo
echo "测试文档位置: $(pwd)/测试指南.md"
echo
