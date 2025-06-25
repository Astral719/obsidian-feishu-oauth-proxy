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

        // 简化方案：直接显示授权码，优化用户体验
        return res.status(200).send(`
            <html>
            <head>
                <title>授权成功</title>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; padding: 30px; background: #f8f9fa;">
                <div style="max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                    <h2 style="color: #28a745; margin-bottom: 20px;">✅ 飞书授权成功！</h2>

                    <div style="background: #e9ecef; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0 0 15px 0; font-weight: 600; color: #495057;">请复制以下授权码：</p>
                        <div id="auth-code" style="background: #f8f9fa; padding: 15px; border-radius: 6px; font-family: 'Courier New', monospace; font-size: 14px; word-break: break-all; border: 2px dashed #6c757d; color: #212529; font-weight: bold;">
                            ${code}
                        </div>
                    </div>

                    <button onclick="copyToClipboard('${code}')" style="background: #007bff; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: 500; margin: 10px;">
                        📋 复制授权码
                    </button>

                    <div style="margin-top: 30px; padding: 20px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
                        <p style="margin: 0; color: #856404; font-size: 14px;">
                            <strong>下一步：</strong><br>
                            1. 返回 Obsidian 插件设置页面<br>
                            2. 点击"手动输入授权码"按钮<br>
                            3. 粘贴上面的授权码完成授权
                        </p>
                    </div>

                    <p style="margin-top: 20px; color: #6c757d; font-size: 12px;">
                        授权码将在5分钟后过期，请尽快使用
                    </p>
                </div>

                <script>
                    function copyToClipboard(text) {
                        // 现代浏览器
                        if (navigator.clipboard) {
                            navigator.clipboard.writeText(text).then(function() {
                                showCopySuccess();
                            }).catch(function() {
                                fallbackCopy(text);
                            });
                        } else {
                            fallbackCopy(text);
                        }
                    }

                    function fallbackCopy(text) {
                        // 备用复制方法
                        const textArea = document.createElement('textarea');
                        textArea.value = text;
                        textArea.style.position = 'fixed';
                        textArea.style.opacity = '0';
                        document.body.appendChild(textArea);
                        textArea.select();
                        try {
                            document.execCommand('copy');
                            showCopySuccess();
                        } catch (err) {
                            alert('复制失败，请手动选择授权码');
                        }
                        document.body.removeChild(textArea);
                    }

                    function showCopySuccess() {
                        const button = event.target;
                        const originalText = button.innerHTML;
                        button.innerHTML = '✅ 已复制！';
                        button.style.background = '#28a745';
                        setTimeout(() => {
                            button.innerHTML = originalText;
                            button.style.background = '#007bff';
                        }, 2000);
                    }

                    // 自动选中授权码文本，方便手动复制
                    document.getElementById('auth-code').addEventListener('click', function() {
                        const range = document.createRange();
                        range.selectNodeContents(this);
                        const selection = window.getSelection();
                        selection.removeAllRanges();
                        selection.addRange(range);
                    });
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
