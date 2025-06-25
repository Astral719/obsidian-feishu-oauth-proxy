// Vercel Serverless Function for OAuth Callback
// 使用Vercel KV存储OAuth结果
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { code, state, error } = req.query;

        console.log(`OAuth callback received - Code: ${code}, State: ${state}, Error: ${error}`);

        if (error) {
            // 存储错误结果
            await kv.set(`oauth:${state}`, {
                success: false,
                error: error,
                timestamp: Date.now()
            }, { ex: 300 }); // 5分钟过期

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

        // 存储授权结果
        await kv.set(`oauth:${state}`, {
            success: true,
            code: code,
            timestamp: Date.now()
        }, { ex: 300 }); // 5分钟过期

        return res.status(200).send(`
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
