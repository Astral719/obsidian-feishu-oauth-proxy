// Vercel Serverless Function for Home Page
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const html = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Obsidian 飞书分享 - 云端代理服务</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #333;
            }
            
            .container {
                background: white;
                border-radius: 20px;
                padding: 40px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                max-width: 600px;
                width: 90%;
                text-align: center;
            }
            
            .logo {
                font-size: 48px;
                margin-bottom: 20px;
            }
            
            h1 {
                color: #2c3e50;
                margin-bottom: 10px;
                font-size: 28px;
            }
            
            .subtitle {
                color: #7f8c8d;
                margin-bottom: 30px;
                font-size: 16px;
            }
            
            .status {
                background: #2ecc71;
                color: white;
                padding: 10px 20px;
                border-radius: 25px;
                display: inline-block;
                margin-bottom: 30px;
                font-weight: 500;
            }
            
            .features {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            
            .feature {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 10px;
                border-left: 4px solid #3498db;
            }
            
            .feature h3 {
                color: #2c3e50;
                margin-bottom: 10px;
                font-size: 18px;
            }
            
            .feature p {
                color: #7f8c8d;
                font-size: 14px;
                line-height: 1.5;
            }
            
            .endpoints {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 10px;
                margin-bottom: 30px;
                text-align: left;
            }
            
            .endpoints h3 {
                color: #2c3e50;
                margin-bottom: 15px;
                text-align: center;
            }
            
            .endpoint {
                background: white;
                padding: 10px 15px;
                border-radius: 5px;
                margin-bottom: 10px;
                font-family: 'Monaco', 'Menlo', monospace;
                font-size: 14px;
                border-left: 3px solid #3498db;
            }
            
            .footer {
                color: #7f8c8d;
                font-size: 14px;
            }
            
            .footer a {
                color: #3498db;
                text-decoration: none;
            }
            
            .footer a:hover {
                text-decoration: underline;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">🚀</div>
            <h1>Obsidian 飞书分享</h1>
            <p class="subtitle">云端 OAuth 代理服务</p>
            
            <div class="status">
                ✅ 服务运行正常
            </div>
            
            <div class="features">
                <div class="feature">
                    <h3>🔐 OAuth 授权</h3>
                    <p>自动处理飞书 OAuth 流程，用户无需手动复制授权码</p>
                </div>
                <div class="feature">
                    <h3>🌐 API 代理</h3>
                    <p>代理所有飞书 API 请求，解决跨域和网络问题</p>
                </div>
                <div class="feature">
                    <h3>☁️ 零门槛</h3>
                    <p>无需安装本地服务器，开箱即用</p>
                </div>
                <div class="feature">
                    <h3>🔒 安全可靠</h3>
                    <p>HTTPS 加密，OAuth 状态自动过期</p>
                </div>
            </div>
            
            <div class="endpoints">
                <h3>📡 API 端点</h3>
                <div class="endpoint">POST /api/oauth/start - 启动 OAuth 流程</div>
                <div class="endpoint">GET /api/oauth/callback - OAuth 回调处理</div>
                <div class="endpoint">GET /api/oauth/status/{state} - 查询 OAuth 状态</div>
                <div class="endpoint">POST /api/proxy - 飞书 API 通用代理</div>
            </div>
            
            <div class="footer">
                <p>
                    由 <a href="https://vercel.com" target="_blank">Vercel</a> 强力驱动 | 
                    服务时间: ${new Date().toLocaleString('zh-CN')}
                </p>
            </div>
        </div>
    </body>
    </html>
    `;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
}
