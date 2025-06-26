// 直接测试飞书API的脚本
const https = require('https');

// 测试用的最简单数据
const testContent = "# Test Document\n\nThis is a test.";
const fileName = "test.md";
const fileBuffer = Buffer.from(testContent, 'utf8');
const base64Content = fileBuffer.toString('base64');

// 构建multipart数据
const boundary = '---7MA4YWxkTrZu0gW';
let body = '';

// 1. file_name
body += `--${boundary}\r\n`;
body += `Content-Disposition: form-data; name="file_name"\r\n\r\n`;
body += `${fileName}\r\n`;

// 2. size
body += `--${boundary}\r\n`;
body += `Content-Disposition: form-data; name="size"\r\n\r\n`;
body += `${fileBuffer.length}\r\n`;

// 3. file
body += `--${boundary}\r\n`;
body += `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n`;
body += `Content-Type: text/markdown\r\n\r\n`;

// 结束boundary
const bodyEnd = `\r\n--${boundary}--\r\n`;

// 组合完整的body
const bodyBuffer = Buffer.concat([
    Buffer.from(body, 'utf8'),
    fileBuffer,
    Buffer.from(bodyEnd, 'utf8')
]);

console.log('=== Debug Info ===');
console.log('File name:', fileName);
console.log('File size:', fileBuffer.length);
console.log('Base64 size:', base64Content.length);
console.log('Body size:', bodyBuffer.length);
console.log('Content-Type:', `multipart/form-data; boundary=${boundary}`);
console.log('');
console.log('Body preview (first 200 chars):');
console.log(bodyBuffer.toString('utf8', 0, 200));
console.log('');
console.log('Body preview (last 100 chars):');
console.log(bodyBuffer.toString('utf8', bodyBuffer.length - 100));
console.log('==================');

// 测试不同的API端点
const endpoints = [
    '/open-apis/drive/v1/medias/upload_all',
    '/open-apis/drive/v1/files/upload_all'
];

async function testEndpoint(endpoint) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'open.feishu.cn',
            port: 443,
            path: endpoint,
            method: 'POST',
            headers: {
                'Authorization': 'Bearer YOUR_TOKEN_HERE', // 需要替换为实际token
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': bodyBuffer.length
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve({
                    endpoint,
                    status: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        });

        req.on('error', (error) => {
            reject({ endpoint, error });
        });

        req.write(bodyBuffer);
        req.end();
    });
}

// 如果要测试，需要替换token
console.log('To test, replace YOUR_TOKEN_HERE with actual token and run:');
console.log('node debug-feishu-api.js');

// 导出数据供其他脚本使用
module.exports = {
    boundary,
    bodyBuffer,
    testContent,
    fileName,
    fileBuffer
};
