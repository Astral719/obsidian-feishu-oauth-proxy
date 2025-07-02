#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
飞书OAuth回调处理 - Vercel Serverless Function
"""

import json
import time
from urllib.parse import parse_qs

# OAuth状态存储（与oauth-start.py共享）
oauth_results = {}

def handler(request):
    """处理OAuth回调"""
    
    try:
        # 解析查询参数
        query_string = request.get('query', '')
        if isinstance(query_string, dict):
            # 如果已经是字典格式
            query_params = query_string
        else:
            # 解析查询字符串
            query_params = parse_qs(query_string)
            # parse_qs返回的值是列表，取第一个元素
            query_params = {k: v[0] if isinstance(v, list) and v else v for k, v in query_params.items()}
        
        code = query_params.get('code')
        state = query_params.get('state')
        error = query_params.get('error')

        print(f"OAuth callback received - Code: {code}, State: {state}, Error: {error}")

        if error:
            oauth_results[state] = {
                'success': False,
                'error': error,
                'timestamp': time.time()
            }
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'text/html'},
                'body': f"""
                <html>
                <head><title>授权失败</title></head>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h2 style="color: red;">❌ 授权失败</h2>
                    <p>错误信息: {error}</p>
                    <p>请关闭此页面并重试。</p>
                </body>
                </html>
                """
            }

        if not code or not state:
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'text/html'},
                'body': """
                <html>
                <head><title>授权失败</title></head>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h2 style="color: red;">❌ 授权失败</h2>
                    <p>缺少必要的授权参数</p>
                    <p>请关闭此页面并重试。</p>
                </body>
                </html>
                """
            }

        # 存储授权结果
        oauth_results[state] = {
            'success': True,
            'code': code,
            'timestamp': time.time()
        }

        print(f"OAuth authorization successful for state: {state}")

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'text/html'},
            'body': """
            <html>
            <head><title>授权成功</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h2 style="color: green;">✅ 授权成功！</h2>
                <p>授权码已自动获取，请返回 Obsidian 查看结果。</p>
                <p>您可以关闭此页面。</p>
                <script>
                    // 3秒后自动关闭窗口
                    setTimeout(function() {
                        window.close();
                    }, 3000);
                </script>
            </body>
            </html>
            """
        }

    except Exception as e:
        print(f"OAuth callback error: {e}")
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'text/html'},
            'body': f"""
            <html>
            <head><title>授权错误</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h2 style="color: red;">❌ 处理授权时发生错误</h2>
                <p>错误信息: {str(e)}</p>
                <p>请关闭此页面并重试。</p>
            </body>
            </html>
            """
        }

# Vercel entry point
def main(request):
    return handler(request)
