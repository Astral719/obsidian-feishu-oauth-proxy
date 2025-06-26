const http = require('http');
const https = require('https');
const url = require('url');

/**
 * 简单的代理服务器，用于解决 CORS 问题
 * 将 Obsidian 插件的请求转发到飞书 API
 */

const PORT = 3001;

const server = http.createServer((req, res) => {
    // 设置 CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // 处理预检请求
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // 只处理 POST 请求到 /proxy 路径
    if (req.method === 'POST' && req.url === '/proxy') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const requestData = JSON.parse(body);
                const { url: targetUrl, method, headers, data } = requestData;
                
                console.log('=== Proxy Request Debug ===');
                console.log('Target URL:', targetUrl);
                console.log('Method:', method || 'POST');

                // 安全地显示请求数据，隐藏敏感信息（仅用于日志显示）
                const safeDataForLog = { ...data };
                if (safeDataForLog.client_secret) {
                    safeDataForLog.client_secret = `[${safeDataForLog.client_secret.length} chars]`;
                }
                console.log('Request data:', JSON.stringify(safeDataForLog, null, 2));
                console.log('Headers:', headers);

                // 检查原始数据是否完整
                console.log('Data validation:');
                if (data && typeof data === 'object') {
                    if (data.client_id !== undefined) {
                        console.log('- client_id present:', !!data.client_id);
                        console.log('- client_secret present:', !!data.client_secret);
                        console.log('- client_secret length:', data.client_secret ? data.client_secret.length : 0);
                        console.log('- code present:', !!data.code);
                    } else if (data.app_id !== undefined) {
                        console.log('- app_id present:', !!data.app_id);
                        console.log('- app_secret present:', !!data.app_secret);
                        console.log('- app_secret length:', data.app_secret ? data.app_secret.length : 0);
                        console.log('- code present:', !!data.code);
                    } else {
                        console.log('- Request data:', JSON.stringify(data, null, 2));
                    }
                } else {
                    console.log('- No data or empty request body');
                }
                
                // 使用原始的 API 端点
                let finalUrl = targetUrl;

                // 解析目标 URL
                const parsedUrl = url.parse(finalUrl);

                // 检查是否是文件上传请求 - 但先尝试直接发送 JSON
                const isFileUpload = false; // 暂时禁用 multipart 转换，直接发送 JSON

                let requestBody;
                let contentType;

                if (isFileUpload) {
                    // 处理文件上传 - 完全手动构建 multipart 数据
                    console.log('Processing file upload request...');

                    // 解码 base64 内容
                    const fileContent = Buffer.from(data.file_content, 'base64');

                    // 使用飞书官方文档的固定 boundary 格式
                    const boundary = '---7MA4YWxkTrZu0gW';
                    contentType = `multipart/form-data; boundary=${boundary}`;

                    // 按照官方示例的字段顺序构建 multipart 数据
                    const parts = [];

                    // 1. file_name
                    parts.push(`--${boundary}\r\n`);
                    parts.push(`Content-Disposition: form-data; name="file_name"\r\n\r\n`);
                    parts.push(`${data.file_name}\r\n`);

                    // 2. parent_type
                    if (data.parent_type) {
                        parts.push(`--${boundary}\r\n`);
                        parts.push(`Content-Disposition: form-data; name="parent_type"\r\n\r\n`);
                        parts.push(`${data.parent_type}\r\n`);
                    }

                    // 3. parent_node
                    if (data.parent_node) {
                        parts.push(`--${boundary}\r\n`);
                        parts.push(`Content-Disposition: form-data; name="parent_node"\r\n\r\n`);
                        parts.push(`${data.parent_node}\r\n`);
                    }

                    // 4. size (必需字段！)
                    const fileSize = fileContent.length;
                    parts.push(`--${boundary}\r\n`);
                    parts.push(`Content-Disposition: form-data; name="size"\r\n\r\n`);
                    parts.push(`${fileSize}\r\n`);

                    // 5. file (最后)
                    parts.push(`--${boundary}\r\n`);
                    parts.push(`Content-Disposition: form-data; name="file"; filename="${data.file_name.replace(/"/g, '\\"')}"\r\n`);
                    parts.push(`Content-Type: text/markdown\r\n\r\n`);

                    // 合并文本部分
                    const textPart = parts.join('');
                    const endBoundary = `\r\n--${boundary}--\r\n`;

                    // 创建完整的请求体
                    requestBody = Buffer.concat([
                        Buffer.from(textPart, 'utf8'),
                        fileContent,
                        Buffer.from(endBoundary, 'utf8')
                    ]);

                    console.log('File upload form data prepared, size:', requestBody.length);
                    console.log('Content-Type:', contentType);
                    console.log('Boundary:', boundary);
                    console.log('First 500 bytes of request body:');
                    console.log(requestBody.slice(0, 500).toString('utf8'));
                    console.log('Last 200 bytes of request body:');
                    console.log(requestBody.slice(-200).toString('utf8'));

                    // 保存请求体到文件以便调试
                    const fs = require('fs');
                    fs.writeFileSync('debug_request.txt', requestBody);
                    console.log('Request body saved to debug_request.txt');
                } else {
                    // 普通 JSON 请求
                    contentType = 'application/json';
                    requestBody = data ? JSON.stringify(data) : '';
                }

                // 发送请求
                sendRequest();

                function sendRequest() {
                    // 构建请求选项
                    const options = {
                        hostname: parsedUrl.hostname,
                        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
                        path: parsedUrl.path,
                        method: method || 'POST',
                        headers: {
                            'Content-Type': contentType,
                            'Content-Length': Buffer.isBuffer(requestBody) ? requestBody.length : Buffer.byteLength(requestBody),
                            ...headers
                        }
                    };

                    // 发起请求
                    const protocol = parsedUrl.protocol === 'https:' ? https : http;
                    const proxyReq = protocol.request(options, (proxyRes) => {
                        let responseData = '';

                        proxyRes.on('data', chunk => {
                            responseData += chunk;
                        });

                        proxyRes.on('end', () => {
                            console.log('=== Proxy Response Debug ===');
                            console.log('Status Code:', proxyRes.statusCode);
                            console.log('Response Data:', responseData);
                            console.log('=============================');

                            res.writeHead(proxyRes.statusCode, {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            });
                            res.end(responseData);
                        });
                    });

                    proxyReq.on('error', (error) => {
                        console.error('Proxy request error:', error);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Proxy request failed', details: error.message }));
                    });

                    // 发送请求数据
                    if (requestBody) {
                        proxyReq.write(requestBody);
                    }
                    proxyReq.end();
                }
                
            } catch (error) {
                console.error('Request parsing error:', error);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid request format' }));
            }
        });
        
    } else {
        // 返回简单的状态页面
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>飞书分享代理服务器</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    .status { color: #4CAF50; font-size: 18px; }
                </style>
            </head>
            <body>
                <h1>飞书分享代理服务器</h1>
                <p class="status">✅ 服务器运行正常</p>
                <p>端口: ${PORT}</p>
                <p>用于解决 Obsidian 插件的 CORS 问题</p>
            </body>
            </html>
        `);
    }
});

server.listen(PORT, 'localhost', () => {
    console.log(`飞书分享代理服务器启动成功！`);
    console.log(`地址: http://localhost:${PORT}`);
    console.log(`请保持此服务器运行，以便 Obsidian 插件正常工作。`);
});

server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`端口 ${PORT} 已被占用，请关闭占用该端口的程序或修改端口号。`);
    } else {
        console.error('服务器启动失败:', error);
    }
});
