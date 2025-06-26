/**
 * OAuth 回调服务器
 * 用于处理飞书 OAuth 授权回调
 */

export class OAuthCallbackServer {
	private server: any = null;
	private port = 8080;
	private onCallback: (code: string, state?: string) => void;

	constructor(onCallback: (code: string, state?: string) => void) {
		this.onCallback = onCallback;
	}

	/**
	 * 启动本地回调服务器
	 */
	async start(): Promise<void> {
		return new Promise((resolve, reject) => {
			try {
				// 创建简单的 HTTP 服务器
				const http = require('http');
				
				this.server = http.createServer((req: any, res: any) => {
					// 设置 CORS 头
					res.setHeader('Access-Control-Allow-Origin', '*');
					res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
					res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

					if (req.method === 'OPTIONS') {
						res.writeHead(200);
						res.end();
						return;
					}

					if (req.url && req.url.startsWith('/callback')) {
						this.handleCallback(req, res);
					} else {
						res.writeHead(404);
						res.end('Not Found');
					}
				});

				this.server.listen(this.port, 'localhost', () => {
					console.log(`OAuth callback server started on http://localhost:${this.port}`);
					resolve();
				});

				this.server.on('error', (error: any) => {
					if (error.code === 'EADDRINUSE') {
						// 端口被占用，尝试下一个端口
						this.port++;
						if (this.port > 8090) {
							reject(new Error('无法找到可用端口'));
							return;
						}
						this.server.listen(this.port, 'localhost');
					} else {
						reject(error);
					}
				});

			} catch (error) {
				reject(error);
			}
		});
	}

	/**
	 * 停止服务器
	 */
	stop(): void {
		if (this.server) {
			this.server.close();
			this.server = null;
			console.log('OAuth callback server stopped');
		}
	}

	/**
	 * 获取当前回调 URL
	 */
	getCallbackUrl(): string {
		return `http://localhost:${this.port}/callback`;
	}

	/**
	 * 处理授权回调
	 */
	private handleCallback(req: any, res: any): void {
		try {
			const url = new URL(req.url, `http://localhost:${this.port}`);
			const code = url.searchParams.get('code');
			const state = url.searchParams.get('state');
			const error = url.searchParams.get('error');

			// 返回成功页面
			const successHtml = `
				<!DOCTYPE html>
				<html>
				<head>
					<meta charset="UTF-8">
					<title>授权成功</title>
					<style>
						body { 
							font-family: Arial, sans-serif; 
							text-align: center; 
							padding: 50px;
							background: #f5f5f5;
						}
						.container {
							background: white;
							padding: 30px;
							border-radius: 8px;
							box-shadow: 0 2px 10px rgba(0,0,0,0.1);
							max-width: 400px;
							margin: 0 auto;
						}
						.success { color: #4CAF50; }
						.error { color: #f44336; }
					</style>
				</head>
				<body>
					<div class="container">
						${error ? `
							<h2 class="error">授权失败</h2>
							<p>错误信息：${error}</p>
						` : `
							<h2 class="success">授权成功！</h2>
							<p>您可以关闭此页面，返回 Obsidian 继续使用。</p>
						`}
					</div>
					<script>
						// 3秒后自动关闭窗口
						setTimeout(() => {
							window.close();
						}, 3000);
					</script>
				</body>
				</html>
			`;

			res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
			res.end(successHtml);

			// 处理回调
			if (error) {
				console.error('OAuth error:', error);
			} else if (code) {
				// 延迟调用回调函数，确保响应已发送
				setTimeout(() => {
					this.onCallback(code, state || undefined);
					// 停止服务器
					this.stop();
				}, 1000);
			}

		} catch (error) {
			console.error('Callback handling error:', error);
			res.writeHead(500);
			res.end('Internal Server Error');
		}
	}
}
