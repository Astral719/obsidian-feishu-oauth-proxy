#!/bin/bash

# 测试飞书API的curl命令
# 需要替换YOUR_TOKEN_HERE为实际的token

echo "Testing Feishu upload API with curl..."

# 创建测试文件
echo "# Test Document

This is a test markdown file." > test.md

# 测试 medias/upload_all 端点
echo "Testing /drive/v1/medias/upload_all..."
curl -X POST "https://open.feishu.cn/open-apis/drive/v1/medias/upload_all" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: multipart/form-data" \
  -F "file_name=test.md" \
  -F "size=$(wc -c < test.md)" \
  -F "file=@test.md" \
  -v

echo ""
echo "========================"
echo ""

# 测试 files/upload_all 端点
echo "Testing /drive/v1/files/upload_all..."
curl -X POST "https://open.feishu.cn/open-apis/drive/v1/files/upload_all" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: multipart/form-data" \
  -F "file_name=test.md" \
  -F "size=$(wc -c < test.md)" \
  -F "file=@test.md" \
  -v

# 清理
rm test.md

echo ""
echo "Replace YOUR_TOKEN_HERE with actual token to test"
