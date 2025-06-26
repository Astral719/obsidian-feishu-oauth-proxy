#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试飞书token和权限的脚本
"""

import requests
import json

def test_token_validity(access_token):
    """测试token是否有效"""
    print("=== 测试Token有效性 ===")
    
    # 测试获取用户信息
    url = "https://open.feishu.cn/open-apis/authen/v1/user_info"
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.get(url, headers=headers)
        print(f"用户信息API状态码: {response.status_code}")
        print(f"响应内容: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('code') == 0:
                print("✅ Token有效")
                return True
            else:
                print(f"❌ Token无效: {data.get('msg')}")
                return False
        else:
            print(f"❌ HTTP错误: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ 请求失败: {e}")
        return False

def test_drive_permissions(access_token):
    """测试云空间权限"""
    print("\n=== 测试云空间权限 ===")
    
    # 测试获取根文件夹信息
    url = "https://open.feishu.cn/open-apis/drive/v1/files"
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.get(url, headers=headers)
        print(f"云空间API状态码: {response.status_code}")
        print(f"响应内容: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('code') == 0:
                print("✅ 有云空间读取权限")
                return True
            else:
                print(f"❌ 云空间权限不足: {data.get('msg')}")
                return False
        else:
            print(f"❌ HTTP错误: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ 请求失败: {e}")
        return False

def test_simple_upload(access_token):
    """测试最简单的文件上传"""
    print("\n=== 测试文件上传API ===")
    
    # 创建最简单的测试文件
    test_content = "# Test\nThis is a test file."
    file_name = "test.md"
    
    # 测试上传API的可访问性
    url = "https://open.feishu.cn/open-apis/drive/v1/files/upload_all"
    headers = {
        'Authorization': f'Bearer {access_token}'
    }
    
    # 构建最简单的multipart数据
    files = {
        'file_name': (None, file_name),
        'size': (None, str(len(test_content.encode('utf-8')))),
        'file': (file_name, test_content.encode('utf-8'), 'text/markdown')
    }
    
    try:
        response = requests.post(url, headers=headers, files=files)
        print(f"上传API状态码: {response.status_code}")
        print(f"响应内容: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('code') == 0:
                print("✅ 文件上传成功")
                return True
            else:
                print(f"❌ 上传失败: 错误码 {data.get('code')}, 消息: {data.get('msg')}")
                return False
        else:
            print(f"❌ HTTP错误: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ 请求失败: {e}")
        return False

def main():
    print("飞书API测试工具")
    print("=" * 50)
    
    # 从用户输入获取token
    access_token = input("请输入access_token: ").strip()
    
    if not access_token:
        print("❌ 未提供access_token")
        return
    
    # 依次测试
    token_valid = test_token_validity(access_token)
    if not token_valid:
        print("\n❌ Token无效，请检查token是否正确或已过期")
        return
    
    drive_permission = test_drive_permissions(access_token)
    if not drive_permission:
        print("\n❌ 云空间权限不足，请检查应用权限配置")
        return
    
    upload_success = test_simple_upload(access_token)
    if upload_success:
        print("\n🎉 所有测试通过！文件上传功能正常")
    else:
        print("\n❌ 文件上传测试失败")

if __name__ == '__main__':
    main()
