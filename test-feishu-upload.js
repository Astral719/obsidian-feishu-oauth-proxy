// 测试飞书文件上传的简单脚本
const fs = require('fs');

// 模拟一个简单的markdown文件
const testContent = `# 测试文档

这是一个测试文档。

## 功能测试
- 列表项1
- 列表项2

**粗体文本** 和 *斜体文本*
`;

// 将内容转换为base64
const base64Content = Buffer.from(testContent, 'utf8').toString('base64');

console.log('Test content length:', testContent.length);
console.log('Base64 content length:', base64Content.length);
console.log('Base64 content (first 100 chars):', base64Content.substring(0, 100));

// 构建multipart数据（完全按照飞书官方示例）
const boundary = '---7MA4YWxkTrZu0gW';
const fileName = 'test.md';
const fileBuffer = Buffer.from(base64Content, 'base64');

console.log('File buffer length:', fileBuffer.length);

// 手动构建multipart body
let body = '';

// 1. file_name
body += `--${boundary}\r\n`;
body += `Content-Disposition: form-data; name="file_name"\r\n\r\n`;
body += `${fileName}\r\n`;

// 2. parent_type
body += `--${boundary}\r\n`;
body += `Content-Disposition: form-data; name="parent_type"\r\n\r\n`;
body += `explorer\r\n`;

// 3. size
body += `--${boundary}\r\n`;
body += `Content-Disposition: form-data; name="size"\r\n\r\n`;
body += `${fileBuffer.length}\r\n`;

// 4. file
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

console.log('Total body length:', bodyBuffer.length);
console.log('Content-Type:', `multipart/form-data; boundary=${boundary}`);

// 输出前200个字符用于调试
console.log('Body preview (first 200 chars):');
console.log(bodyBuffer.toString('utf8', 0, 200));

console.log('\nBody preview (last 100 chars):');
console.log(bodyBuffer.toString('utf8', bodyBuffer.length - 100));
