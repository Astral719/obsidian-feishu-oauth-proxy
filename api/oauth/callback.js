// Vercel Serverless Function for OAuth Callback
// 简化版本，不使用KV存储，直接显示结果
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { code, state, error } = req.query;

        console.log(`OAuth callback received - Code: ${code}, State: ${state}, Error: ${error}`);

        if (error) {
            return res.status(200).send(`
                <html>
                <head><title>授权失败</title></head>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h2 style="color: red;">❌ 授权失败</h2>
                    <p>错误信息: ${error}</p>
                    <p>请关闭此页面并重试。</p>
                </body>
                </html>
            `);
        }

        if (!code || !state) {
            return res.status(200).send(`
                <html>
                <head><title>授权失败</title></head>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h2 style="color: red;">❌ 授权失败</h2>
                    <p>缺少必要的授权参数</p>
                    <p>请关闭此页面并重试。</p>
                </body>
                </html>
            `);
        }

        // 显示授权码，让用户手动复制
        return res.status(200).send(`
            <html>
            <head><title>授权成功</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h2 style="color: green;">✅ 授权成功！</h2>
                <p>请复制以下授权码到Obsidian插件中：</p>
                <div style="background: #f5f5f5; padding: 15px; margin: 20px; border-radius: 5px; font-family: monospace; word-break: break-all;">
                    ${code}
                </div>
                <button onclick="copyToClipboard('${code}')" style="background: #007acc; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                    复制授权码
                </button>
                <p style="margin-top: 20px; color: #666;">
                    <small>授权码将在5分钟后过期</small>
                </p>
                <script>
                    function copyToClipboard(text) {
                        navigator.clipboard.writeText(text).then(function() {
                            alert('授权码已复制到剪贴板！');
                        });
                    }
                </script>
            </body>
            </html>
        `);

    } catch (error) {
        console.error('OAuth callback error:', error);
        return res.status(200).send(`
            <html>
            <head><title>授权错误</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h2 style="color: red;">❌ 处理授权时发生错误</h2>
                <p>错误信息: ${error.message}</p>
                <p>请关闭此页面并重试。</p>
            </body>
            </html>
        `);
    }
}
