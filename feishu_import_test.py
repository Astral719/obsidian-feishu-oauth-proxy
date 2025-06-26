#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
飞书文档导入测试脚本
基于官方导入文件接口：https://open.feishu.cn/document/server-docs/docs/drive-v1/import_task/import-user-guide
"""

import json
import base64
import requests
import time
import os
from requests_toolbelt.multipart.encoder import MultipartEncoder

class FeishuImporter:
    def __init__(self, app_id, app_secret, access_token=None):
        self.app_id = app_id
        self.app_secret = app_secret
        self.access_token = access_token
        self.base_url = "https://open.feishu.cn/open-apis"
    
    def get_tenant_access_token(self):
        """获取租户访问令牌（如果需要）"""
        url = f"{self.base_url}/auth/v3/tenant_access_token/internal"
        payload = {
            "app_id": self.app_id,
            "app_secret": self.app_secret
        }
        response = requests.post(url, json=payload)
        result = response.json()
        if result.get("code") == 0:
            return result["tenant_access_token"]
        else:
            raise Exception(f"获取租户令牌失败: {result}")
    
    def upload_file(self, file_path, file_name=None):
        """
        第一步：上传文件
        """
        if not file_name:
            file_name = os.path.basename(file_path)
        
        print(f"📤 开始上传文件: {file_name}")
        
        # 读取文件内容
        with open(file_path, 'rb') as f:
            file_content = f.read()
        
        # 构建 multipart 数据
        multipart_data = {
            'file_name': file_name,
            'parent_type': 'explorer',  # 导入到云空间
            'size': str(len(file_content)),
            'file': (file_name, file_content, 'text/markdown')
        }
        
        # 使用 MultipartEncoder
        multipart_encoder = MultipartEncoder(fields=multipart_data)
        
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': multipart_encoder.content_type
        }
        
        url = f"{self.base_url}/drive/v1/files/upload_all"
        
        print(f"🔗 请求URL: {url}")
        print(f"📋 文件大小: {len(file_content)} 字节")
        
        response = requests.post(url, data=multipart_encoder, headers=headers)
        
        print(f"📊 响应状态: {response.status_code}")
        print(f"📄 响应内容: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            if result.get("code") == 0:
                file_token = result["data"]["file_token"]
                print(f"✅ 文件上传成功! file_token: {file_token}")
                return file_token
            else:
                raise Exception(f"文件上传失败: {result}")
        else:
            raise Exception(f"HTTP错误: {response.status_code}, {response.text}")
    
    def get_root_folder_token(self):
        """获取用户根文件夹token"""
        print(f"📁 获取根文件夹信息...")

        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }

        # 获取根文件夹
        url = f"{self.base_url}/drive/v1/metas/batch_query"
        payload = {
            "request_docs": [
                {
                    "doc_token": "",
                    "doc_type": "folder"
                }
            ]
        }

        response = requests.post(url, json=payload, headers=headers)
        print(f"📊 根文件夹响应: {response.status_code}, {response.text}")

        # 如果上面的方法不行，尝试获取文件列表来找到根文件夹
        url2 = f"{self.base_url}/drive/v1/files"
        params = {
            "page_size": 10,
            "folder_token": ""  # 空字符串表示根目录
        }

        response2 = requests.get(url2, params=params, headers=headers)
        print(f"📊 文件列表响应: {response2.status_code}, {response2.text}")

        return ""  # 暂时返回空字符串

    def create_import_task(self, file_token, file_name, target_type="docx"):
        """
        第二步：创建导入任务
        """
        print(f"📋 创建导入任务...")

        # 使用从文件列表中观察到的根文件夹token
        root_token = "nodcn2EG5YG1i5Rsh5uZs0FsUje"

        # 尝试不同的参数组合
        payload = {
            "file_extension": "md",  # 使用正确的扩展名
            "file_token": file_token,
            "type": target_type,  # docx, sheet, bitable
            "file_name": file_name,
            "point": {
                "mount_type": 1,  # 1=云空间
                "mount_key": root_token   # 使用实际的根文件夹token
            }
        }
        
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }
        
        url = f"{self.base_url}/drive/v1/import_tasks"
        
        print(f"🔗 请求URL: {url}")
        print(f"📋 请求数据: {json.dumps(payload, indent=2, ensure_ascii=False)}")
        
        response = requests.post(url, json=payload, headers=headers)
        
        print(f"📊 响应状态: {response.status_code}")
        print(f"📄 响应内容: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            if result.get("code") == 0:
                ticket = result["data"]["ticket"]
                print(f"✅ 导入任务创建成功! ticket: {ticket}")
                return ticket
            else:
                raise Exception(f"导入任务创建失败: {result}")
        else:
            raise Exception(f"HTTP错误: {response.status_code}, {response.text}")
    
    def check_import_status(self, ticket, max_wait_time=120):
        """
        第三步：检查导入状态
        """
        print(f"⏳ 检查导入状态...")
        
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }
        
        url = f"{self.base_url}/drive/v1/import_tasks/{ticket}"
        
        start_time = time.time()
        
        while time.time() - start_time < max_wait_time:
            print(f"🔍 查询导入状态... (已等待 {int(time.time() - start_time)} 秒)")
            
            response = requests.get(url, headers=headers)
            
            print(f"📊 响应状态: {response.status_code}")
            print(f"📄 响应内容: {response.text}")
            
            if response.status_code == 200:
                result = response.json()
                if result.get("code") == 0:
                    job_status = result["data"]["result"]["job_status"]
                    job_error_msg = result["data"]["result"].get("job_error_msg", "")
                    
                    print(f"📋 任务状态: {job_status}")
                    
                    if job_status == 3:  # 成功
                        token = result["data"]["result"].get("token")
                        if token:
                            print(f"🎉 导入成功! 文档token: {token}")
                            # 构建文档链接
                            doc_url = f"https://feishu.cn/docx/{token}"
                            print(f"🔗 文档链接: {doc_url}")
                            return {"success": True, "token": token, "url": doc_url}
                        else:
                            raise Exception("导入成功但未返回文档token")
                    
                    elif job_status == 2:  # 失败
                        error_msg = job_error_msg or "未知错误"
                        raise Exception(f"导入失败: {error_msg}")
                    
                    elif job_status == 1:  # 进行中
                        print("⏳ 导入进行中，继续等待...")
                        time.sleep(5)
                        continue
                    
                    else:
                        print(f"⚠️ 未知状态: {job_status}，继续等待...")
                        time.sleep(5)
                        continue
                else:
                    raise Exception(f"查询状态失败: {result}")
            else:
                raise Exception(f"HTTP错误: {response.status_code}, {response.text}")
        
        raise Exception(f"导入超时 (超过 {max_wait_time} 秒)")
    
    def import_markdown_file(self, file_path, target_type="docx"):
        """
        完整的导入流程
        """
        try:
            file_name = os.path.basename(file_path)
            print(f"🚀 开始导入 Markdown 文件: {file_name}")
            print("=" * 60)
            
            # 第一步：上传文件
            file_token = self.upload_file(file_path, file_name)
            print("=" * 60)
            
            # 第二步：创建导入任务
            ticket = self.create_import_task(file_token, file_name, target_type)
            print("=" * 60)
            
            # 第三步：等待导入完成
            result = self.check_import_status(ticket)
            print("=" * 60)
            
            print("🎉 导入完成!")
            return result
            
        except Exception as e:
            print(f"❌ 导入失败: {str(e)}")
            return {"success": False, "error": str(e)}

def main():
    """主函数"""
    print("🚀 飞书 Markdown 文档导入测试")
    print("=" * 60)
    
    # 配置信息（请替换为你的实际值）
    APP_ID = "cli_a8b28252ccf3d500c"
    APP_SECRET = "aXR89uejnesoHsnda3tUZcJtejKFkQvB"
    ACCESS_TOKEN = "u-7kgHO1SeF0r8gDawhjZzOU54ir7B54EXj0G0kl880EEB"  # 用户访问令牌
    
    # 测试文件路径
    test_file = "test.md"
    
    # 创建测试文件（如果不存在）
    if not os.path.exists(test_file):
        test_content = """# 简单测试

这是一个简单的测试文档。

## 基本内容

- 项目1
- 项目2
- 项目3

测试完成。
"""
        with open(test_file, 'w', encoding='utf-8') as f:
            f.write(test_content)
        print(f"📝 创建测试文件: {test_file}")
    
    # 创建导入器
    importer = FeishuImporter(APP_ID, APP_SECRET, ACCESS_TOKEN)
    
    # 执行导入
    result = importer.import_markdown_file(test_file)
    
    if result["success"]:
        print(f"🎉 导入成功!")
        print(f"📄 文档token: {result['token']}")
        print(f"🔗 文档链接: {result['url']}")
    else:
        print(f"❌ 导入失败: {result['error']}")

if __name__ == "__main__":
    main()
