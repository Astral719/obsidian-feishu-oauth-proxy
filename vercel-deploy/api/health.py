#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
健康检查端点 - Vercel Serverless Function
"""

import json

def handler(request):
    """健康检查"""
    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'status': 'ok', 
            'message': '飞书分享代理服务器运行正常 (Vercel Python)',
            'version': '2.0.0'
        })
    }

# Vercel entry point
def main(request):
    return handler(request)
