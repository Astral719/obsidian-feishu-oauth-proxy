// Vercel Serverless Function for Feishu API Proxy
export default async function handler(req, res) {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { url, method = 'POST', headers = {}, data, isFileUpload = false } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'Missing URL parameter' });
        }

        console.log('=== Proxy Request Debug ===');
        console.log('Target URL:', url);
        console.log('Method:', method);
        console.log('Headers:', Object.keys(headers));
        console.log('Is File Upload:', isFileUpload);

        // 准备请求选项
        const fetchOptions = {
            method: method,
            headers: {
                ...headers,
                'User-Agent': 'Obsidian-Feishu-Share/1.0.0'
            }
        };

        // 处理请求体
        if (data) {
            if (isFileUpload && data.file_name && data.file_content) {
                // 处理文件上传：构建multipart/form-data
                const boundary = '---7MA4YWxkTrZu0gW';
                let formData = '';

                // 添加文件名
                formData += `--${boundary}\r\n`;
                formData += `Content-Disposition: form-data; name="file_name"\r\n\r\n`;
                formData += `${data.file_name}\r\n`;

                // 添加文件内容
                formData += `--${boundary}\r\n`;
                formData += `Content-Disposition: form-data; name="file"; filename="${data.file_name}"\r\n`;
                formData += `Content-Type: text/markdown\r\n\r\n`;

                // 将base64内容解码为二进制
                const binaryContent = Buffer.from(data.file_content, 'base64').toString('binary');
                formData += binaryContent + '\r\n';

                // 添加父节点信息（如果有）
                if (data.parent_type) {
                    formData += `--${boundary}\r\n`;
                    formData += `Content-Disposition: form-data; name="parent_type"\r\n\r\n`;
                    formData += `${data.parent_type}\r\n`;
                }

                if (data.parent_node) {
                    formData += `--${boundary}\r\n`;
                    formData += `Content-Disposition: form-data; name="parent_node"\r\n\r\n`;
                    formData += `${data.parent_node}\r\n`;
                }

                formData += `--${boundary}--\r\n`;

                fetchOptions.body = formData;
                fetchOptions.headers['Content-Type'] = `multipart/form-data; boundary=${boundary}`;

                console.log('Constructed multipart form data, length:', formData.length);

            } else if (typeof data === 'string') {
                // 处理其他字符串数据
                fetchOptions.body = data;
            } else {
                // 处理JSON数据
                fetchOptions.body = JSON.stringify(data);
                if (!fetchOptions.headers['Content-Type']) {
                    fetchOptions.headers['Content-Type'] = 'application/json';
                }
            }
        }

        // 发送请求到飞书API
        const response = await fetch(url, fetchOptions);
        const responseText = await response.text();

        console.log('=== Response Debug ===');
        console.log('Status Code:', response.status);
        console.log('Response Length:', responseText.length);
        console.log('========================');

        // 尝试解析JSON响应
        let responseData;
        try {
            responseData = JSON.parse(responseText);
        } catch (e) {
            // 如果不是JSON，返回原始响应
            responseData = {
                raw_response: responseText,
                content_type: response.headers.get('content-type') || 'unknown'
            };
        }

        // 返回响应，保持原始状态码
        return res.status(response.status).json(responseData);

    } catch (error) {
        console.error('Proxy error:', error);
        return res.status(500).json({
            error: error.message,
            details: error.stack
        });
    }
}
