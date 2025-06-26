#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
飞书分享代理服务器 - Python 版本
基于飞书官方 Python 示例实现
"""

import json
import base64
import requests
from flask import Flask, request, jsonify, redirect, render_template_string
from flask_cors import CORS
from requests_toolbelt.multipart.encoder import MultipartEncoder
import logging
import threading
import time
import webbrowser
from urllib.parse import urlparse, parse_qs

# 配置日志
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # 允许跨域请求

# OAuth 状态存储
oauth_results = {}
oauth_pending = {}

@app.route('/proxy', methods=['POST', 'OPTIONS'])
def proxy():
    """代理请求到飞书 API"""
    if request.method == 'OPTIONS':
        # 处理预检请求
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response
    
    try:
        # 获取请求数据
        proxy_request = request.get_json()
        target_url = proxy_request.get('url')
        method = proxy_request.get('method', 'POST')
        headers = proxy_request.get('headers', {})
        data = proxy_request.get('data')
        
        logger.info(f"=== Proxy Request Debug ===")
        logger.info(f"Target URL: {target_url}")
        logger.info(f"Method: {method}")
        logger.info(f"Headers: {headers}")
        logger.info(f"Data: {data}")
        
        # 检查是否是文件上传请求
        is_file_upload = '/files/upload_all' in target_url and data and 'file_content' in data

        if is_file_upload:
            logger.info("Processing direct file upload request...")

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

            logger.info(f"Multipart data fields: {list(multipart_data.keys())}")
            logger.info(f"File size: {len(file_content)}")

            # 使用 MultipartEncoder（官方推荐方式）
            multipart_encoder = MultipartEncoder(fields=multipart_data)

            # 设置正确的 Content-Type
            upload_headers = {
                'Authorization': headers.get('Authorization'),
                'Content-Type': multipart_encoder.content_type
            }

            logger.info(f"Upload headers: {upload_headers}")
            logger.info(f"Content-Type: {multipart_encoder.content_type}")

            # 发送请求
            response = requests.post(
                target_url,
                data=multipart_encoder,
                headers=upload_headers,
                timeout=60  # 增加超时时间
            )
            
        else:
            # 普通 JSON 请求
            logger.info("Processing regular JSON request...")
            
            response = requests.request(
                method=method,
                url=target_url,
                headers=headers,
                json=data,
                timeout=30
            )
        
        logger.info(f"=== Response Debug ===")
        logger.info(f"Status Code: {response.status_code}")
        logger.info(f"Response Text: {response.text}")
        logger.info(f"========================")
        
        # 返回响应
        try:
            response_data = response.json()
        except:
            response_data = {"error": "Invalid JSON response", "text": response.text}
        
        return jsonify(response_data), response.status_code
        
    except Exception as e:
        logger.error(f"Proxy error: {str(e)}")
        return jsonify({
            'error': 'Proxy request failed',
            'details': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health():
    """健康检查端点"""
    return jsonify({'status': 'ok', 'message': '飞书分享代理服务器运行正常'})

@app.route('/oauth/start', methods=['POST', 'OPTIONS'])
def start_oauth():
    """启动OAuth流程"""
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response

    try:
        data = request.get_json()
        app_id = data.get('app_id')
        state = data.get('state')

        if not app_id or not state:
            return jsonify({'success': False, 'error': 'Missing app_id or state'}), 400

        # 存储OAuth请求
        oauth_pending[state] = {
            'app_id': app_id,
            'timestamp': time.time(),
            'completed': False
        }

        # 构建授权URL
        redirect_uri = f"http://localhost:5000/oauth/callback"
        auth_url = f"https://open.feishu.cn/open-apis/authen/v1/authorize?app_id={app_id}&redirect_uri={redirect_uri}&response_type=code&state={state}&scope=contact:user.base:readonly docx:document drive:drive"

        logger.info(f"Starting OAuth flow for state: {state}")
        logger.info(f"Auth URL: {auth_url}")

        # 自动打开浏览器
        threading.Thread(target=lambda: webbrowser.open(auth_url)).start()

        return jsonify({
            'success': True,
            'auth_url': auth_url,
            'callback_url': f"http://localhost:5000/oauth/status/{state}"
        })

    except Exception as e:
        logger.error(f"OAuth start error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/oauth/callback')
def oauth_callback():
    """处理OAuth回调"""
    try:
        code = request.args.get('code')
        state = request.args.get('state')
        error = request.args.get('error')

        logger.info(f"OAuth callback received - Code: {code}, State: {state}, Error: {error}")

        if error:
            oauth_results[state] = {
                'success': False,
                'error': error,
                'timestamp': time.time()
            }
            return render_template_string("""
            <html>
            <head><title>授权失败</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h2 style="color: red;">❌ 授权失败</h2>
                <p>错误信息: {{ error }}</p>
                <p>请关闭此页面并重试。</p>
            </body>
            </html>
            """, error=error)

        if not code or not state:
            return render_template_string("""
            <html>
            <head><title>授权失败</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h2 style="color: red;">❌ 授权失败</h2>
                <p>缺少必要的授权参数</p>
                <p>请关闭此页面并重试。</p>
            </body>
            </html>
            """)

        # 存储授权结果
        oauth_results[state] = {
            'success': True,
            'code': code,
            'timestamp': time.time()
        }

        # 标记为完成
        if state in oauth_pending:
            oauth_pending[state]['completed'] = True

        return render_template_string("""
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
        """)

    except Exception as e:
        logger.error(f"OAuth callback error: {e}")
        return render_template_string("""
        <html>
        <head><title>授权错误</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: red;">❌ 处理授权时发生错误</h2>
            <p>错误信息: {{ error }}</p>
            <p>请关闭此页面并重试。</p>
        </body>
        </html>
        """, error=str(e))

@app.route('/oauth/status/<state>', methods=['GET'])
def oauth_status(state):
    """检查OAuth状态"""
    try:
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
            return jsonify(result)

        if state in oauth_pending:
            return jsonify({
                'success': False,
                'pending': True,
                'message': 'OAuth authorization in progress'
            })

        return jsonify({
            'success': False,
            'error': 'OAuth state not found or expired'
        }), 404

    except Exception as e:
        logger.error(f"OAuth status error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    print("🚀 飞书分享代理服务器启动成功！")
    print("📍 地址: http://localhost:5000")
    print("🔧 基于飞书官方 Python 示例实现")
    print("🔐 支持自动OAuth授权流程")
    print("⚡ 请保持此服务器运行，以便 Obsidian 插件正常工作。")
    print("=" * 50)

    app.run(host='0.0.0.0', port=5000, debug=False)
