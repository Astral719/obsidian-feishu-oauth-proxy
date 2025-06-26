#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
飞书OAuth状态查询 - Vercel Serverless Function
"""

import json
import time
from urllib.parse import parse_qs

# OAuth状态存储（与其他文件共享）
oauth_results = {}
oauth_pending = {}

def handler(request):
    """检查OAuth状态"""
    
    # 处理CORS
    headers = {'Access-Control-Allow-Origin': '*'}
    
    if request.method == 'OPTIONS':
        headers.update({
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, OPTIONS'
        })
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'status': 'ok'})
        }
    
    try:
        # 获取state参数
        query_string = request.get('query', '')
        if isinstance(query_string, dict):
            query_params = query_string
        else:
            query_params = parse_qs(query_string)
            query_params = {k: v[0] if isinstance(v, list) and v else v for k, v in query_params.items()}
        
        state = query_params.get('state')
        
        if not state:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'success': False, 'error': 'Missing state parameter'})
            }
        
        # 清理过期的请求（超过5分钟）
        current_time = time.time()
        for s in list(oauth_results.keys()):
            if current_time - oauth_results[s]['timestamp'] > 300:  # 5分钟
                del oauth_results[s]

        for s in list(oauth_pending.keys()):
            if current_time - oauth_pending[s]['timestamp'] > 300:  # 5分钟
                del oauth_pending[s]

        if state in oauth_results:
            result = oauth_results[state]
            # 返回结果后删除，避免重复使用
            del oauth_results[state]
            if state in oauth_pending:
                del oauth_pending[state]
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps(result)
            }

        if state in oauth_pending:
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'success': False,
                    'pending': True,
                    'message': 'OAuth authorization in progress'
                })
            }

        return {
            'statusCode': 404,
            'headers': headers,
            'body': json.dumps({
                'success': False,
                'error': 'OAuth state not found or expired'
            })
        }

    except Exception as e:
        print(f"OAuth status error: {e}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'success': False, 'error': str(e)})
        }

# Vercel entry point
def main(request):
    return handler(request)
