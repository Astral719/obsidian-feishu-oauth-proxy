#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
飞书直接上传测试脚本
基于 upload_all 接口：https://open.feishu.cn/document/server-docs/docs/drive-v1/media/upload_all
直接将 MD 文件转换为 DOCX
"""

import json
import base64
import requests
import time
import os
from requests_toolbelt.multipart.encoder import MultipartEncoder

class FeishuDirectUploader:
    def __init__(self, app_id, app_secret, access_token):
        self.app_id = app_id
        self.app_secret = app_secret
        self.access_token = access_token
        self.base_url = "https://open.feishu.cn/open-apis"
    
    def upload_md_to_docx(self, file_path, parent_token=None, file_name=None):
        """
        直接上传 MD 文件并转换为 DOCX
        """
        if not file_name:
            file_name = os.path.basename(file_path)
        
        print(f"📤 开始直接上传并转换文件: {file_name}")
        
        # 读取文件内容
        with open(file_path, 'rb') as f:
            file_content = f.read()
        
        print(f"📋 文件大小: {len(file_content)} 字节")
        
        # 构建 multipart 数据
        multipart_data = {
            'file_name': file_name,
            'parent_type': 'explorer',  # 上传到云空间
            'size': str(len(file_content)),  # 文件大小（字符串格式）
            'file': (file_name, file_content, 'text/markdown')  # 指定 MIME 类型
        }
        
        # 如果指定了父文件夹
        if parent_token:
            multipart_data['parent_node'] = parent_token
        
        print(f"📋 Multipart 字段: {list(multipart_data.keys())}")
        
        # 使用 MultipartEncoder
        multipart_encoder = MultipartEncoder(fields=multipart_data)
        
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': multipart_encoder.content_type
        }
        
        url = f"{self.base_url}/drive/v1/files/upload_all"
        
        print(f"🔗 请求URL: {url}")
        print(f"📋 Content-Type: {multipart_encoder.content_type}")
        print(f"📋 Authorization: Bearer {self.access_token[:20]}...")
        
        try:
            response = requests.post(url, data=multipart_encoder, headers=headers, timeout=60)
            
            print(f"📊 响应状态: {response.status_code}")
            print(f"📄 响应内容: {response.text}")
            
            if response.status_code == 200:
                result = response.json()
                if result.get("code") == 0:
                    file_token = result["data"]["file_token"]
                    print(f"✅ 文件上传成功! file_token: {file_token}")
                    
                    # 构建文档链接
                    doc_url = f"https://feishu.cn/file/{file_token}"
                    print(f"🔗 文件链接: {doc_url}")
                    
                    return {
                        "success": True, 
                        "file_token": file_token, 
                        "url": doc_url,
                        "response": result
                    }
                else:
                    return {
                        "success": False, 
                        "error": f"API错误: {result.get('msg', 'Unknown error')}", 
                        "code": result.get('code'),
                        "response": result
                    }
            else:
                return {
                    "success": False, 
                    "error": f"HTTP错误: {response.status_code}", 
                    "response_text": response.text
                }
                
        except Exception as e:
            return {
                "success": False, 
                "error": f"请求异常: {str(e)}"
            }
    
    def test_different_approaches(self, file_path):
        """
        测试不同的上传方式
        """
        file_name = os.path.basename(file_path)
        
        print("🧪 测试不同的上传方式")
        print("=" * 60)
        
        # 方式1: 基本上传
        print("📋 方式1: 基本上传（不指定父文件夹）")
        result1 = self.upload_md_to_docx(file_path)
        print(f"结果1: {'✅ 成功' if result1['success'] else '❌ 失败'}")
        if not result1['success']:
            print(f"错误: {result1['error']}")
        print("-" * 40)
        
        # 方式2: 指定根文件夹
        print("📋 方式2: 指定根文件夹")
        root_token = "nodcn2EG5YG1i5Rsh5uZs0FsUje"  # 从之前的测试中获得
        result2 = self.upload_md_to_docx(file_path, parent_token=root_token)
        print(f"结果2: {'✅ 成功' if result2['success'] else '❌ 失败'}")
        if not result2['success']:
            print(f"错误: {result2['error']}")
        print("-" * 40)
        
        # 方式3: 修改文件名（去掉.md扩展名）
        print("📋 方式3: 修改文件名（去掉.md扩展名）")
        name_without_ext = file_name.replace('.md', '')
        result3 = self.upload_md_to_docx(file_path, file_name=name_without_ext)
        print(f"结果3: {'✅ 成功' if result3['success'] else '❌ 失败'}")
        if not result3['success']:
            print(f"错误: {result3['error']}")
        print("-" * 40)
        
        # 返回最成功的结果
        for result in [result1, result2, result3]:
            if result['success']:
                return result
        
        return result1  # 如果都失败，返回第一个结果

def main():
    """主函数"""
    print("🚀 飞书直接上传 MD→DOCX 测试")
    print("=" * 60)
    
    # 配置信息
    APP_ID = "cli_a8b28252ccf3d500c"
    APP_SECRET = "aXR89uejnesoHsnda3tUZcJtejKFkQvB"
    ACCESS_TOKEN = "u-7kgHO1SeF0r8gDawhjZzOU54ir7B54EXj0G0kl880EEB"
    
    # 测试文件路径
    test_file = "direct_test.md"
    
    # 创建测试文件
    if not os.path.exists(test_file):
        test_content = """# 直接上传测试

## 简介

这是一个测试飞书直接上传功能的 Markdown 文档。

## 内容

### 文本测试
- 普通文本
- **粗体文本**
- *斜体文本*

### 列表测试
1. 第一项
2. 第二项
3. 第三项

### 代码测试
```python
def hello():
    print("Hello, Feishu!")
```

### 表格测试
| 列1 | 列2 |
|-----|-----|
| 数据1 | 数据2 |
| 数据3 | 数据4 |

---

**测试完成！**
"""
        with open(test_file, 'w', encoding='utf-8') as f:
            f.write(test_content)
        print(f"📝 创建测试文件: {test_file}")
    
    # 创建上传器
    uploader = FeishuDirectUploader(APP_ID, APP_SECRET, ACCESS_TOKEN)
    
    # 执行测试
    result = uploader.test_different_approaches(test_file)
    
    print("=" * 60)
    print("🎯 最终结果:")
    
    if result["success"]:
        print(f"🎉 上传成功!")
        print(f"📄 文件token: {result['file_token']}")
        print(f"🔗 文件链接: {result['url']}")
        print(f"📋 完整响应: {json.dumps(result['response'], indent=2, ensure_ascii=False)}")
    else:
        print(f"❌ 上传失败: {result['error']}")
        if 'response' in result:
            print(f"📋 响应详情: {json.dumps(result.get('response', {}), indent=2, ensure_ascii=False)}")

if __name__ == "__main__":
    main()
