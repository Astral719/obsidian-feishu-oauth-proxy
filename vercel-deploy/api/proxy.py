#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
飞书分享代理服务器 - Vercel Python 版本
基于飞书官方 Python 示例实现，适配Vercel Serverless Functions
"""

import json
import base64
import requests
from requests_toolbelt.multipart.encoder import MultipartEncoder
import os
from urllib.parse import parse_qs

def handler(request):
    """Vercel Serverless Function 处理器"""
    
    # 处理CORS预检请求
    if request.method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            'body': json.dumps({'status': 'ok'})
        }
    
    if request.method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    try:
        # 解析请求体
        if hasattr(request, 'get_json'):
            # Flask-like interface
            proxy_request = request.get_json()
        else:
            # Vercel interface
            body = request.get('body', '')
            if isinstance(body, str):
                proxy_request = json.loads(body)
            else:
                proxy_request = body
        
        target_url = proxy_request.get('url')
        method = proxy_request.get('method', 'POST')
        headers = proxy_request.get('headers', {})
        data = proxy_request.get('data')
        
        print(f"=== Proxy Request Debug ===")
        print(f"Target URL: {target_url}")
        print(f"Method: {method}")
        print(f"Headers: {headers}")
        print(f"Data keys: {list(data.keys()) if data else None}")
        
        # 检查是否是文件上传请求
        is_file_upload = '/files/upload_all' in target_url and data and 'file_content' in data

        if is_file_upload:
            print("Processing file upload request...")

            # 解码 base64 文件内容
            file_content = base64.b64decode(data['file_content'])

            # 使用直接上传方式（基于成功的测试）
            multipart_data = {
                'file_name': data['file_name'],
                'parent_type': data.get('parent_type', 'explorer'),
                'size': str(len(file_content)),  # 文件大小（字符串格式）
                'file': (data['file_name'], file_content, 'text/markdown')
            }

            # 添加可选字段
            if data.get('parent_node'):
                multipart_data['parent_node'] = data['parent_node']

            print(f"Multipart data fields: {list(multipart_data.keys())}")
            print(f"File size: {len(file_content)}")

            # 使用 MultipartEncoder（官方推荐方式）
            multipart_encoder = MultipartEncoder(fields=multipart_data)

            # 设置正确的 Content-Type
            upload_headers = {
                'Authorization': headers.get('Authorization'),
                'Content-Type': multipart_encoder.content_type
            }

            print(f"Upload headers: {upload_headers}")
            print(f"Content-Type: {multipart_encoder.content_type}")

            # 发送请求
            response = requests.post(
                target_url,
                data=multipart_encoder,
                headers=upload_headers,
                timeout=60  # 增加超时时间
            )
            
        else:
            # 普通 JSON 请求
            print("Processing regular JSON request...")
            
            response = requests.request(
                method=method,
                url=target_url,
                headers=headers,
                json=data,
                timeout=30
            )
        
        print(f"=== Response Debug ===")
        print(f"Status Code: {response.status_code}")
        print(f"Response Text: {response.text}")
        print(f"========================")
        
        # 返回响应
        try:
            response_data = response.json()
        except:
            response_data = {"error": "Invalid JSON response", "text": response.text}
        
        return {
            'statusCode': response.status_code,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(response_data)
        }
        
    except Exception as e:
        print(f"Proxy error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'error': 'Proxy request failed',
                'details': str(e)
            })
        }

# Vercel entry point
def main(request):
    return handler(request)
