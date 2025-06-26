// Vercel Serverless Function for OAuth Callback
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
                <head>
                    <title>授权失败</title>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5;">
                    <div style="background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto;">
                        <h2 style="color: #ff4757; margin-bottom: 20px;">❌ 授权失败</h2>
                        <p style="color: #666; margin-bottom: 20px;">错误信息: ${error}</p>
                        <p style="color: #666;">请关闭此页面并重试。</p>
                    </div>
                </body>
                </html>
            `);
        }

        if (!code || !state) {
            return res.status(200).send(`
                <html>
                <head>
                    <title>授权失败</title>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5;">
                    <div style="background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto;">
                        <h2 style="color: #ff4757; margin-bottom: 20px;">❌ 授权失败</h2>
                        <p style="color: #666; margin-bottom: 20px;">缺少必要的授权参数</p>
                        <p style="color: #666;">请关闭此页面并重试。</p>
                    </div>
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
            <head>
                <title>授权成功</title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5;">
                <div style="background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto;">
                    <h2 style="color: #2ed573; margin-bottom: 20px;">✅ 授权成功！</h2>
                    <p style="color: #666; margin-bottom: 20px;">授权码已自动获取，请返回 Obsidian 查看结果。</p>
                    <p style="color: #666;">您可以关闭此页面。</p>
                    <div style="margin-top: 30px; padding: 15px; background: #f8f9fa; border-radius: 5px; border-left: 4px solid #2ed573;">
                        <p style="margin: 0; color: #666; font-size: 14px;">💡 提示：此页面将在3秒后自动关闭</p>
                    </div>
                </div>
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
            <head>
                <title>授权错误</title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5;">
                <div style="background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto;">
                    <h2 style="color: #ff4757; margin-bottom: 20px;">❌ 处理授权时发生错误</h2>
                    <p style="color: #666; margin-bottom: 20px;">错误信息: ${error.message}</p>
                    <p style="color: #666;">请关闭此页面并重试。</p>
                </div>
            </body>
            </html>
        `);
    }
}
