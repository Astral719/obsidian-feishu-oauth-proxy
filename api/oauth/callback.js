// Vercel Serverless Function for OAuth Callback
// 使用全局内存存储OAuth结果

// 使用全局对象存储，这样可以在不同的函数调用间共享
if (!global.oauthResults) {
    global.oauthResults = new Map();
}

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { code, state, error } = req.query;

        console.log(`OAuth callback received - Code: ${code}, State: ${state}, Error: ${error}`);

        if (error) {
            // 存储错误结果
            global.oauthResults.set(`oauth:${state}`, {
                success: false,
                error: error,
                timestamp: Date.now()
            });

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

        // 存储授权结果到全局内存（备用）
        global.oauthResults.set(`oauth:${state}`, {
            success: true,
            code: code,
            timestamp: Date.now()
        });

        console.log(`OAuth result stored for state: ${state}`);

        // 方案1：尝试通过postMessage发送给父窗口
        // 方案2：显示授权码让用户复制
        return res.status(200).send(`
            <html>
            <head><title>授权成功</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h2 style="color: green;">✅ 授权成功！</h2>
                <div id="status">正在尝试自动传递授权码...</div>

                <div id="manual-section" style="display: none; margin-top: 30px;">
                    <p>如果自动授权失败，请复制以下授权码到Obsidian插件中：</p>
                    <div style="background: #f5f5f5; padding: 15px; margin: 20px; border-radius: 5px; font-family: monospace; word-break: break-all;">
                        ${code}
                    </div>
                    <button onclick="copyToClipboard('${code}')" style="background: #007acc; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                        复制授权码
                    </button>
                </div>

                <script>
                    // 尝试通过postMessage发送给父窗口
                    function sendToParent() {
                        try {
                            if (window.opener) {
                                window.opener.postMessage({
                                    type: 'FEISHU_OAUTH_SUCCESS',
                                    code: '${code}',
                                    state: '${state}'
                                }, '*');
                                document.getElementById('status').innerHTML = '✅ 授权码已发送，请返回 Obsidian 查看结果。';
                                setTimeout(() => window.close(), 2000);
                                return true;
                            }
                        } catch (e) {
                            console.error('Failed to send to parent:', e);
                        }
                        return false;
                    }

                    // 立即尝试发送
                    if (!sendToParent()) {
                        // 如果失败，显示手动复制选项
                        setTimeout(() => {
                            document.getElementById('status').innerHTML = '⚠️ 自动传递失败';
                            document.getElementById('manual-section').style.display = 'block';
                        }, 2000);
                    }

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
