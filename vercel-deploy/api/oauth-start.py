#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
飞书OAuth启动 - Vercel Serverless Function
"""

import json
import time
import os
from urllib.parse import urlencode

# 使用Vercel KV存储OAuth状态（如果可用）
# 否则使用内存存储（注意：Serverless函数重启会丢失）
oauth_pending = {}

def handler(request):
    """处理OAuth启动请求"""
    
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
            data = request.get_json()
        else:
            body = request.get('body', '')
            if isinstance(body, str):
                data = json.loads(body)
            else:
                data = body
        
        app_id = data.get('app_id')
        state = data.get('state')

        if not app_id or not state:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': False, 'error': 'Missing app_id or state'})
            }

        # 存储OAuth请求
        oauth_pending[state] = {
            'app_id': app_id,
            'timestamp': time.time(),
            'completed': False
        }

        # 使用固定的域名
        base_url = 'https://md2feishu.xinqi.life'

        # 构建授权URL
        redirect_uri = f"{base_url}/api/oauth-callback"
        
        auth_params = {
            'app_id': app_id,
            'redirect_uri': redirect_uri,
            'response_type': 'code',
            'state': state,
            'scope': 'contact:user.base:readonly docx:document drive:drive'
        }
        
        auth_url = f"https://open.feishu.cn/open-apis/authen/v1/authorize?{urlencode(auth_params)}"

        print(f"Starting OAuth flow for state: {state}")
        print(f"Auth URL: {auth_url}")
        print(f"Redirect URI: {redirect_uri}")

        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'auth_url': auth_url,
                'callback_url': f"{base_url}/api/oauth-status?state={state}",
                'message': 'Please open the auth_url in browser to complete authorization'
            })
        }

    except Exception as e:
        print(f"OAuth start error: {e}")
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': False, 'error': str(e)})
        }

# Vercel entry point
def main(request):
    return handler(request)
