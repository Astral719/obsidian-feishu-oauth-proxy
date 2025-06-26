import {
	FeishuShareSettings,
	FeishuOAuthResponse,
	FeishuApiError,
	FeishuDocCreateResponse,
	FeishuFolderListResponse,
	ShareResult,
	FeishuUserInfo,
	FEISHU_ERROR_MESSAGES
} from './types';
import { FEISHU_CONFIG, HTTP_STATUS } from './constants';

/**
 * 飞书 API 服务类
 * 负责与飞书开放平台 API 的交互
 */
export class FeishuApiService {
	private settings: FeishuShareSettings;

	constructor(settings: FeishuShareSettings) {
		this.settings = settings;
	}

	/**
	 * 更新设置
	 */
	updateSettings(settings: FeishuShareSettings) {
		this.settings = settings;
	}

	/**
	 * 生成授权 URL
	 */
	generateAuthUrl(): string {
		// 检查应用配置
		if (!this.settings.appId || !this.settings.appSecret) {
			throw new Error('请先在设置中配置飞书应用的 App ID 和 App Secret');
		}

		// 生成随机状态值用于安全验证
		const state = this.generateRandomState();
		localStorage.setItem('feishu-oauth-state', state);

		// 构建授权 URL
		const params = new URLSearchParams({
			app_id: this.settings.appId,
			redirect_uri: FEISHU_CONFIG.REDIRECT_URI,
			scope: FEISHU_CONFIG.SCOPES,
			state: state,
			response_type: 'code',
		});

		const authUrl = `${FEISHU_CONFIG.AUTHORIZE_URL}?${params.toString()}`;
		console.log('Generated auth URL:', authUrl);

		return authUrl;
	}

	/**
	 * 启动简化OAuth流程（打开授权页面，用户手动复制授权码）
	 */
	async startAutoOAuth(): Promise<boolean> {
		try {
			console.log('Starting OAuth flow via proxy server...');

			// 检查应用配置
			if (!this.settings.appId || !this.settings.appSecret) {
				throw new Error('请先在设置中配置飞书应用的 App ID 和 App Secret');
			}

			// 生成随机状态值
			const state = this.generateRandomState();
			localStorage.setItem('feishu-oauth-state', state);

			// 启动OAuth流程
			const proxyUrl = this.settings.proxyUrl || 'https://md2feishu.xinqi.life';
			console.log(`Using proxy URL: ${proxyUrl}`);

			const startResponse = await fetch(`${proxyUrl}/oauth/start`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					app_id: this.settings.appId,
					state: state
				})
			});

			console.log(`Start response status: ${startResponse.status}`);
			const startResult = await startResponse.json();
			console.log('Start result:', startResult);

			if (!startResult.success) {
				throw new Error(startResult.error || 'Failed to start OAuth flow');
			}

			console.log('OAuth flow started, opening authorization URL...');

			// Python服务器会自动打开浏览器并处理OAuth流程
			console.log('Python server will handle OAuth flow automatically');

			// 轮询检查OAuth状态
			const maxAttempts = 60; // 最多等待60秒
			const pollInterval = 1000; // 每秒检查一次

			console.log(`Starting OAuth status polling for state: ${state}`);

			for (let attempt = 1; attempt <= maxAttempts; attempt++) {
				await new Promise(resolve => setTimeout(resolve, pollInterval));

				try {
					const statusUrl = `${proxyUrl}/oauth/status/${state}`;
					console.log(`Polling status URL: ${statusUrl}`);

					const statusResponse = await fetch(statusUrl);
					console.log(`Status response status: ${statusResponse.status}`);

					if (!statusResponse.ok) {
						console.warn(`OAuth status check failed with status: ${statusResponse.status}`);
						continue;
					}

					const statusResult = await statusResponse.json();
					console.log(`OAuth status check ${attempt}:`, JSON.stringify(statusResult, null, 2));

					if (statusResult.success && statusResult.code) {
						console.log('OAuth authorization completed, exchanging code for token...');

						// 使用授权码获取访问令牌
						const success = await this.handleOAuthCallback(statusResult.code);
						return success;
					} else if (statusResult.error && !statusResult.pending) {
						console.error(`OAuth error: ${statusResult.error}`);
						throw new Error(statusResult.error);
					}

					// 继续等待
					console.log(`Waiting for OAuth authorization... (${attempt}/${maxAttempts})`);
					if (statusResult.pending) {
						console.log(`Status: ${statusResult.message || 'Pending'}`);
					}
				} catch (pollError) {
					console.warn(`OAuth status check failed (attempt ${attempt}):`, pollError);
					// 继续尝试
				}
			}

			throw new Error('OAuth authorization timeout');

		} catch (error) {
			console.error('OAuth error:', error);
			throw error;
		}
	}

	/**
	 * 处理 OAuth 回调
	 */
	async handleOAuthCallback(code: string, state?: string): Promise<boolean> {
		try {
			console.log('=== OAuth Callback Debug Info ===');
			console.log('Code received:', code);
			console.log('Code length:', code.length);
			console.log('State received:', state);
			console.log('App ID:', this.settings.appId);
			console.log('App Secret length:', this.settings.appSecret ? this.settings.appSecret.length : 'not set');

			// 验证授权码格式
			if (!code || code.length < 10) {
				throw new Error('授权码格式不正确，请检查是否完整复制');
			}

			// 验证状态值（如果提供了状态值）
			const savedState = localStorage.getItem('feishu-oauth-state');
			console.log('Saved state:', savedState);
			if (state && savedState && state !== savedState) {
				console.warn('State validation failed:', { provided: state, saved: savedState });
				// 不要因为状态验证失败就中断流程，只是警告
			}

			// 清除保存的状态值
			localStorage.removeItem('feishu-oauth-state');

			// 使用授权码获取访问令牌
			console.log('Exchanging code for token...');
			const tokenResponse = await this.exchangeCodeForToken(code);
			console.log('Token exchange successful, access_token length:', tokenResponse.access_token.length);

			// 保存令牌
			this.settings.accessToken = tokenResponse.access_token;
			this.settings.refreshToken = tokenResponse.refresh_token;

			// 从 token 响应中提取用户信息
			console.log('Extracting user info from token response...');
			const userInfo: FeishuUserInfo = {
				userId: tokenResponse.open_id,
				name: tokenResponse.name,
				avatar: tokenResponse.avatar_url,
			};
			this.settings.userInfo = userInfo;
			console.log('User info extracted:', userInfo.name);
			console.log('=== OAuth Callback Success ===');

			return true;
		} catch (error) {
			console.error('=== OAuth Callback Error ===');
			console.error('Error details:', error);
			console.error('Error message:', error.message);
			console.error('Error stack:', error.stack);

			// 提供更详细的错误信息
			if (error.message) {
				throw new Error(error.message);
			} else {
				throw new Error('授权处理失败，请重试');
			}
		}
	}

	/**
	 * 使用授权码换取访问令牌
	 */
	private async exchangeCodeForToken(code: string): Promise<FeishuOAuthResponse> {
		console.log('=== Debug Settings ===');
		console.log('App ID raw:', JSON.stringify(this.settings.appId));
		console.log('App ID length:', this.settings.appId ? this.settings.appId.length : 0);
		console.log('App Secret length:', this.settings.appSecret ? this.settings.appSecret.length : 0);
		console.log('App Secret first 4 chars:', this.settings.appSecret ? this.settings.appSecret.substring(0, 4) : 'N/A');
		console.log('App Secret last 4 chars:', this.settings.appSecret ? this.settings.appSecret.substring(-4) : 'N/A');

		// 尝试飞书官方文档的参数格式
		const requestBody = {
			grant_type: 'authorization_code',
			app_id: this.settings.appId?.trim(), // 使用 app_id 而不是 client_id
			app_secret: this.settings.appSecret?.trim(), // 使用 app_secret 而不是 client_secret
			code: code.trim(),
			redirect_uri: FEISHU_CONFIG.REDIRECT_URI,
		};

		console.log('=== Debug Request Body ===');
		console.log('Final app_id:', JSON.stringify(requestBody.app_id));
		console.log('Final app_secret length:', requestBody.app_secret ? requestBody.app_secret.length : 0);

		console.log('Token exchange request:', {
			url: FEISHU_CONFIG.TOKEN_URL,
			body: {
				...requestBody,
				app_secret: requestBody.app_secret ? `[${requestBody.app_secret.length} chars]` : '[MISSING]'
			} // 显示长度而不是内容
		});

		// 使用代理服务器发送请求
		const proxyRequest = {
			url: FEISHU_CONFIG.TOKEN_URL,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			data: requestBody
		};

		const proxyUrl = this.settings.proxyUrl || 'https://md2feishu.xinqi.life';
		const response = await fetch(`${proxyUrl}/proxy`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(proxyRequest),
		});

		const data = await response.json();
		console.log('Token exchange response:', {
			status: response.status,
			ok: response.ok,
			code: data.code,
			msg: data.msg
		});

		if (!response.ok || data.code !== 0) {
			const errorMsg = this.getErrorMessage(data);
			console.error('Token exchange failed:', errorMsg);
			throw new Error(errorMsg);
		}

		return data.data;
	}

	/**
	 * 刷新访问令牌
	 */
	async refreshAccessToken(): Promise<boolean> {
		try {
			if (!this.settings.refreshToken) {
				return false;
			}

			const response = await fetch(FEISHU_CONFIG.REFRESH_TOKEN_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					grant_type: 'refresh_token',
					refresh_token: this.settings.refreshToken,
				}),
			});

			const data = await response.json();
			
			if (!response.ok || data.code !== 0) {
				return false;
			}

			// 更新令牌
			this.settings.accessToken = data.data.access_token;
			this.settings.refreshToken = data.data.refresh_token;

			return true;
		} catch (error) {
			console.error('Refresh token error:', error);
			return false;
		}
	}

	/**
	 * 获取用户信息
	 */
	async getUserInfo(): Promise<FeishuUserInfo> {
		const response = await this.makeAuthenticatedRequest('/authen/v1/user_info');
		return {
			userId: response.data.user_id,
			name: response.data.name,
			avatar: response.data.avatar_url,
		};
	}

	/**
	 * 创建飞书文档 - 使用文件导入方式
	 */
	async createDocument(title: string, content: string, folderId?: string): Promise<ShareResult> {
		try {
			// 验证标题长度
			if (title.length > 100) {
				title = title.substring(0, 97) + '...';
			}

			console.log('Creating document via file import...');
			console.log('Title:', title);
			console.log('Content length:', content.length);
			console.log('Folder ID:', folderId);

			// 使用文件导入方式创建文档
			return await this.importMarkdownAsDocument(title, content, folderId);

		} catch (error) {
			console.error('Create document error:', error);
			return {
				success: false,
				error: error.message,
				errorCode: error.code,
			};
		}
	}

	/**
	 * 通过上传 Markdown 文件创建飞书文档（容错策略）
	 */
	private async importMarkdownAsDocument(title: string, content: string, folderId?: string): Promise<ShareResult> {
		try {
			console.log('=== Starting Upload Process with Fallback Strategy ===');

			// 第一步：上传文件到飞书
			console.log('Step 1: Uploading markdown file...');
			const uploadResult = await this.uploadMarkdownFile(title, content);

			if (!uploadResult.success || !uploadResult.fileToken) {
				throw new Error(`File upload failed: ${uploadResult.error}`);
			}

			console.log('File uploaded successfully, token:', uploadResult.fileToken);

			// 准备备用文件链接
			const fallbackFileUrl = `https://feishu.cn/file/${uploadResult.fileToken}`;

			// 第二步：尝试导入任务（15秒超时策略）
			console.log('Step 2: Attempting import task with 15s timeout...');
			try {
				// 处理文件名：移除 .md 扩展名
				const cleanTitle = title.endsWith('.md') ? title.slice(0, -3) : title;
				const importResult = await this.createImportTaskWithCorrectFolder(uploadResult.fileToken, cleanTitle);

				if (importResult.success && importResult.ticket) {
					console.log('Import task created, ticket:', importResult.ticket);

					// 第三步：等待导入完成（15秒超时）
					console.log('Step 3: Waiting for import completion (15s timeout)...');
					const finalResult = await this.waitForImportCompletionWithTimeout(importResult.ticket, 15000);

					if (finalResult.success && finalResult.documentToken) {
						const docUrl = `https://feishu.cn/docx/${finalResult.documentToken}`;
						console.log('=== Import Process Completed Successfully ===');
						console.log('Document URL:', docUrl);

						// 第四步：删除源文件（转换成功后）
						console.log('Step 4: Deleting source file after successful conversion...');
						try {
							await this.deleteSourceFile(uploadResult.fileToken);
							console.log('✅ Source file deleted successfully');
						} catch (deleteError) {
							console.warn('⚠️ Failed to delete source file:', deleteError.message);
							// 不影响主流程，继续返回成功结果
						}

						return {
							success: true,
							docUrl: docUrl,
							docTitle: title,
						};
					} else {
						// 导入失败或超时，使用备用策略
						console.warn('Import failed or timed out, using fallback file URL');
						console.log('=== Using Fallback Strategy ===');
						console.log('Keeping source file and returning file URL:', fallbackFileUrl);

						return {
							success: true,
							docUrl: fallbackFileUrl,
							docTitle: title,
							warning: '转换超时，已保留源文件。可稍后手动转换为在线文档格式'
						};
					}
				}
			} catch (importError) {
				console.warn('Import task failed, using fallback strategy:', importError.message);
			}

			// 如果导入任务创建失败，返回文件链接作为备选方案
			console.log('=== Fallback to File Link (Import Task Failed) ===');
			console.log('Keeping source file and returning file URL:', fallbackFileUrl);

			return {
				success: true,
				docUrl: fallbackFileUrl,
				docTitle: title,
				warning: '导入任务创建失败，已保留源文件。可稍后手动转换为在线文档格式'
			};

		} catch (error) {
			console.error('=== Upload Process Failed ===');
			console.error('Error:', error.message);
			return {
				success: false,
				error: error.message,
			};
		}
	}



	/**
	 * 获取文件夹列表
	 */
	async getFolderList(parentFolderId?: string): Promise<FeishuFolderListResponse> {
		try {
			console.log('Getting folder list, parent folder ID:', parentFolderId);

			const params = new URLSearchParams();
			if (parentFolderId) {
				params.append('parent_folder_token', parentFolderId);
			}
			params.append('page_size', '50');

			// 修复API路径：使用正确的文件列表API
			const url = `/drive/v1/files${params.toString() ? '?' + params.toString() : ''}`;
			console.log('Folder list API URL:', url);

			const response = await this.makeAuthenticatedRequest(url);
			console.log('Folder list response:', JSON.stringify(response, null, 2));

			// 过滤出文件夹类型的项目
			if (response.data && response.data.files) {
				const folders = response.data.files.filter((file: any) => file.type === 'folder');
				return {
					...response,
					data: {
						...response.data,
						folders: folders
					}
				};
			}

			return response;
		} catch (error) {
			console.error('Get folder list error:', error);
			throw error;
		}
	}

	/**
	 * 发起认证请求
	 */
	private async makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
		const url = `${FEISHU_CONFIG.API_BASE_URL}${endpoint}`;

		const headers = {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${this.settings.accessToken}`,
			...options.headers,
		};

		// 使用代理服务器发送请求
		const proxyRequest = {
			url: url,
			method: options.method || 'GET',
			headers: headers,
			data: options.body ? JSON.parse(options.body as string) : undefined
		};

		console.log('=== makeAuthenticatedRequest Debug ===');
		console.log('Endpoint:', endpoint);
		console.log('Full URL:', url);
		console.log('Method:', options.method || 'GET');
		console.log('Has body:', !!options.body);
		console.log('Access token length:', this.settings.accessToken ? this.settings.accessToken.length : 0);

		const proxyUrl = this.settings.proxyUrl || 'https://md2feishu.xinqi.life';
		let response = await fetch(`${proxyUrl}/proxy`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(proxyRequest),
		});

		let data = await response.json();

		// 如果访问令牌过期，尝试刷新
		if (data.code === 99991663 && this.settings.refreshToken) {
			const refreshed = await this.refreshAccessToken();
			if (refreshed) {
				// 重新发起请求
				proxyRequest.headers['Authorization'] = `Bearer ${this.settings.accessToken}`;
				response = await fetch(`${proxyUrl}/proxy`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(proxyRequest),
				});
				data = await response.json();
			}
		}

		if (!response.ok || data.code !== 0) {
			const error = new Error(this.getErrorMessage(data));
			(error as any).code = data.code;
			throw error;
		}

		return data;
	}

	/**
	 * 发起文件上传请求
	 */
	private async makeAuthenticatedFileUpload(endpoint: string, uploadData: any): Promise<any> {
		const url = `${FEISHU_CONFIG.API_BASE_URL}${endpoint}`;

		const headers = {
			'Authorization': `Bearer ${this.settings.accessToken}`,
		};

		// 使用代理服务器发送文件上传请求
		const proxyRequest = {
			url: url,
			method: 'POST',
			headers: headers,
			data: uploadData
			// 移除isFileUpload标记，代理服务器会自动检测
		};

		console.log('=== makeAuthenticatedFileUpload Debug ===');
		console.log('Endpoint:', endpoint);
		console.log('Full URL:', url);
		console.log('File name:', uploadData.file_name);
		console.log('Content length:', uploadData.file_content ? uploadData.file_content.length : 0);
		console.log('Access token length:', this.settings.accessToken ? this.settings.accessToken.length : 0);

		const proxyUrl = this.settings.proxyUrl || 'https://md2feishu.xinqi.life';
		let response = await fetch(`${proxyUrl}/proxy`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(proxyRequest),
		});

		let data = await response.json();

		// 如果访问令牌过期，尝试刷新
		if (data.code === 99991663 && this.settings.refreshToken) {
			const refreshed = await this.refreshAccessToken();
			if (refreshed) {
				// 重新发起请求
				proxyRequest.headers['Authorization'] = `Bearer ${this.settings.accessToken}`;
				response = await fetch(`${proxyUrl}/proxy`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(proxyRequest),
				});
				data = await response.json();
			}
		}

		if (!response.ok || data.code !== 0) {
			console.error('File upload API error:');
			console.error('Response status:', response.status);
			console.error('Response ok:', response.ok);
			console.error('Data:', JSON.stringify(data, null, 2));

			let errorMessage = 'File upload failed';
			if (data && typeof data === 'object') {
				if (data.code !== undefined && data.msg) {
					errorMessage = this.getErrorMessage(data);
				} else if (data.error) {
					errorMessage = data.error;
				} else if (data.message) {
					errorMessage = data.message;
				}
			}

			const error = new Error(errorMessage);
			(error as any).code = data?.code;
			throw error;
		}

		return data;
	}

	/**
	 * 获取错误信息
	 */
	private getErrorMessage(errorData: FeishuApiError): string {
		const { code, msg } = errorData;
		
		// 查找预定义的中文错误信息
		const chineseMessage = FEISHU_ERROR_MESSAGES[code];
		
		if (chineseMessage) {
			return `${chineseMessage} (错误码: ${code})`;
		}
		
		// 如果没有预定义的中文信息，返回原始错误信息
		return `${msg} (错误码: ${code})`;
	}

	/**
	 * 检查是否有有效的token
	 */
	hasValidToken(): boolean {
		return !!(this.settings.accessToken && this.settings.accessToken.trim());
	}

	/**
	 * 生成随机状态值
	 */
	private generateRandomState(): string {
		return Math.random().toString(36).substring(2, 15) +
			   Math.random().toString(36).substring(2, 15);
	}

	/**
	 * 检查授权状态
	 */
	isAuthorized(): boolean {
		return !!this.settings.accessToken;
	}

	/**
	 * 清除授权信息
	 */
	clearAuth(): void {
		this.settings.accessToken = '';
		this.settings.refreshToken = '';
		this.settings.userInfo = null;
		this.settings.defaultFolderId = '';
		this.settings.defaultFolderName = '我的空间';
	}

	/**
	 * 上传 Markdown 文件到飞书 - 通过代理服务器
	 */
	private async uploadMarkdownFile(title: string, content: string): Promise<{success: boolean, fileToken?: string, error?: string}> {
		try {
			console.log('Uploading markdown file via proxy...');

			// 准备文件数据
			const fileName = title.endsWith('.md') ? title : `${title}.md`;

			// 将文件内容转换为 base64
			const utf8Bytes = new TextEncoder().encode(content);
			const base64Content = btoa(utf8Bytes.reduce((data, byte) => data + String.fromCharCode(byte), ''));

			// 完全按照Python脚本的参数格式
			const uploadData: any = {
				file_name: fileName,
				file_content: base64Content,
				parent_type: 'explorer',  // 与Python脚本一致
				size: utf8Bytes.length.toString(),  // UTF-8字节长度（与Python脚本解码后的长度一致）
			};

			// 如果设置了默认文件夹，添加parent_node
			if (this.settings.defaultFolderId) {
				uploadData.parent_node = this.settings.defaultFolderId;
				console.log('Uploading to folder:', this.settings.defaultFolderId);
			}

			console.log('Using Python script compatible parameters:', {
				file_name: fileName,
				parent_type: uploadData.parent_type,
				size: uploadData.size,
				utf8_bytes_size: utf8Bytes.length,
				has_parent_node: !!uploadData.parent_node
			});

			console.log('Uploading file:', fileName, 'Size:', content.length);

			// 通过代理服务器上传文件 - 使用Python脚本相同的API端点
			const response = await this.makeAuthenticatedFileUpload('/drive/v1/files/upload_all', uploadData);

			console.log('Upload response:', JSON.stringify(response, null, 2));

			if (response.data && response.data.file_token) {
				return {
					success: true,
					fileToken: response.data.file_token,
				};
			} else {
				throw new Error(`Upload failed: ${response.msg || 'Unknown error'}`);
			}

		} catch (error) {
			console.error('Upload markdown file error:', error);
			console.error('Error type:', typeof error);
			console.error('Error message:', error?.message);
			console.error('Error stack:', error?.stack);

			const errorMessage = error?.message || error?.toString() || 'Unknown upload error';
			return {
				success: false,
				error: errorMessage,
			};
		}
	}

	/**
	 * 创建导入任务
	 */
	private async createImportTask(fileToken: string, title: string, folderId?: string): Promise<{success: boolean, ticket?: string, error?: string}> {
		try {
			console.log('Creating import task for file token:', fileToken);

			// point 字段是必需的，mount_type 只支持 1
			const requestBody = {
				file_extension: 'md',
				file_token: fileToken,
				type: 'docx',
				file_name: title.endsWith('.md') ? title : `${title}.md`,
				point: {
					mount_type: 1, // 只支持 1
					mount_key: '', // 空字符串表示默认位置
				}
			};

			console.log('Import task request:', JSON.stringify(requestBody, null, 2));

			const response = await this.makeAuthenticatedRequest('/drive/v1/import_tasks', {
				method: 'POST',
				body: JSON.stringify(requestBody),
			});

			console.log('Import task response:', JSON.stringify(response, null, 2));

			if (response.data && response.data.ticket) {
				return {
					success: true,
					ticket: response.data.ticket,
				};
			} else {
				throw new Error(`Import task creation failed: ${response.msg || 'Unknown error'}`);
			}

		} catch (error) {
			console.error('Create import task error:', error);
			return {
				success: false,
				error: error.message,
			};
		}
	}

	/**
	 * 创建导入任务（使用正确的根文件夹token）
	 */
	private async createImportTaskWithCorrectFolder(fileToken: string, title: string): Promise<{success: boolean, ticket?: string, error?: string}> {
		try {
			console.log('Creating import task with correct folder for file token:', fileToken);

			// 使用从文件列表中观察到的正确根文件夹token
			const requestBody = {
				file_extension: 'md',
				file_token: fileToken,
				type: 'docx',
				file_name: title, // title 已经在调用时处理过，不再添加 .md 扩展名
				point: {
					mount_type: 1, // 只支持 1
					mount_key: 'nodcn2EG5YG1i5Rsh5uZs0FsUje', // 使用正确的根文件夹token
				}
			};

			console.log('Import task request with correct folder:', JSON.stringify(requestBody, null, 2));

			const response = await this.makeAuthenticatedRequest('/drive/v1/import_tasks', {
				method: 'POST',
				body: JSON.stringify(requestBody),
			});

			console.log('Import task response:', JSON.stringify(response, null, 2));

			if (response.data && response.data.ticket) {
				return {
					success: true,
					ticket: response.data.ticket,
				};
			} else {
				throw new Error(`Import task creation failed: ${response.msg || 'Unknown error'}`);
			}

		} catch (error) {
			console.error('Create import task with correct folder error:', error);
			return {
				success: false,
				error: error.message,
			};
		}
	}

	/**
	 * 等待导入完成
	 */
	private async waitForImportCompletion(ticket: string): Promise<{success: boolean, documentToken?: string, error?: string}> {
		try {
			console.log('Waiting for import completion, ticket:', ticket);

			// 渐进式检查策略：前几次快速检查，后面逐渐放慢
			const maxAttempts = 25;
			const startTime = Date.now();

			for (let attempt = 1; attempt <= maxAttempts; attempt++) {
				console.log(`Checking import status, attempt ${attempt}/${maxAttempts}...`);

				const response = await this.makeAuthenticatedRequest(`/drive/v1/import_tasks/${ticket}`, {
					method: 'GET',
				});

				console.log(`Import status check ${attempt}:`, JSON.stringify(response, null, 2));

				if (response.data && response.data.result) {
					const result = response.data.result;

					if (result.job_status === 3 || result.job_status === 0) {
						// 导入成功 (job_status: 3 或 0 都表示成功)
						if (result.token) {
							const elapsedTime = Date.now() - startTime;
							console.log(`Import completed successfully in ${elapsedTime}ms, document token:`, result.token);
							return {
								success: true,
								documentToken: result.token,
							};
						} else {
							console.warn('Import completed but no document token returned, continuing to wait...');
							// 有时候成功状态返回但token还没准备好，继续等待
							if (attempt < maxAttempts) {
								await new Promise(resolve => setTimeout(resolve, this.getDelayForAttempt(attempt)));
							}
						}
					} else if (result.job_status === 1) {
						// 还在处理中，继续等待
						console.log('Import still in progress, waiting...');
						if (attempt < maxAttempts) {
							await new Promise(resolve => setTimeout(resolve, this.getDelayForAttempt(attempt)));
						}
					} else if (result.job_status === 2) {
						// 导入显示失败，但根据用户反馈实际可能成功，继续等待一段时间
						const errorMsg = result.job_error_msg || 'Unknown error';
						console.warn(`Import shows failure status (${result.job_status}), but continuing to wait. Error: ${errorMsg}`);

						if (attempt <= 8) { // 前8次尝试时，即使显示失败也继续等待
							console.log(`Attempt ${attempt}/8: Ignoring failure status, continuing to wait...`);
							if (attempt < maxAttempts) {
								await new Promise(resolve => setTimeout(resolve, this.getDelayForAttempt(attempt)));
							}
						} else {
							// 8次后才真正认为失败
							console.error('Import failed after extended waiting:', errorMsg);
							throw new Error(`Import failed with status: ${result.job_status}, error: ${errorMsg}`);
						}
					} else {
						// 其他状态 (可能是 0 或其他值)
						console.log(`Job status: ${result.job_status}, continuing to wait...`);
						if (attempt < maxAttempts) {
							await new Promise(resolve => setTimeout(resolve, this.getDelayForAttempt(attempt)));
						}
					}
				} else {
					throw new Error('Invalid import status response');
				}
			}

			// 超时
			throw new Error('Import timeout: process took too long to complete');

		} catch (error) {
			console.error('Wait for import completion error:', error);
			return {
				success: false,
				error: error.message,
			};
		}
	}

	/**
	 * 获取渐进式延迟时间
	 */
	private getDelayForAttempt(attempt: number): number {
		// 渐进式延迟策略：
		// 前3次：1秒 (快速检查)
		// 4-8次：2秒 (正常检查)
		// 9次以后：3秒 (慢速检查)
		if (attempt <= 3) {
			return 1000; // 1秒
		} else if (attempt <= 8) {
			return 2000; // 2秒
		} else {
			return 3000; // 3秒
		}
	}

	/**
	 * 等待导入完成（带超时控制）
	 */
	private async waitForImportCompletionWithTimeout(ticket: string, timeoutMs: number): Promise<{success: boolean, documentToken?: string, error?: string}> {
		try {
			console.log(`Waiting for import completion with ${timeoutMs}ms timeout, ticket:`, ticket);

			const startTime = Date.now();
			const maxAttempts = Math.ceil(timeoutMs / 1000); // 每秒检查一次

			for (let attempt = 1; attempt <= maxAttempts; attempt++) {
				const elapsedTime = Date.now() - startTime;

				// 检查是否超时
				if (elapsedTime >= timeoutMs) {
					console.warn(`Import timeout after ${elapsedTime}ms`);
					return {
						success: false,
						error: `Import timeout after ${timeoutMs}ms`
					};
				}

				console.log(`Checking import status, attempt ${attempt}/${maxAttempts}, elapsed: ${elapsedTime}ms...`);

				const response = await this.makeAuthenticatedRequest(`/drive/v1/import_tasks/${ticket}`, {
					method: 'GET',
				});

				console.log(`Import status check ${attempt}:`, JSON.stringify(response, null, 2));

				if (response.data && response.data.result) {
					const result = response.data.result;

					if (result.job_status === 3 || result.job_status === 0) {
						// 导入成功 (job_status: 3 或 0 都表示成功)
						if (result.token) {
							const totalTime = Date.now() - startTime;
							console.log(`Import completed successfully in ${totalTime}ms, document token:`, result.token);
							return {
								success: true,
								documentToken: result.token,
							};
						} else {
							console.warn('Import completed but no document token returned, continuing to wait...');
							// 有时候成功状态返回但token还没准备好，继续等待
							if (attempt < maxAttempts) {
								await new Promise(resolve => setTimeout(resolve, this.getDelayForAttempt(attempt)));
							}
						}
					} else if (result.job_status === 1) {
						// 还在处理中，继续等待
						console.log('Import still in progress, waiting...');
						if (attempt < maxAttempts) {
							await new Promise(resolve => setTimeout(resolve, this.getDelayForAttempt(attempt)));
						}
					} else if (result.job_status === 2) {
						// 导入显示失败，但根据用户反馈实际可能成功，继续等待一段时间
						const errorMsg = result.job_error_msg || 'Unknown error';
						console.warn(`Import shows failure status (${result.job_status}), but continuing to wait. Error: ${errorMsg}`);

						if (attempt <= 8) { // 前8次尝试时，即使显示失败也继续等待
							console.log(`Attempt ${attempt}/8: Ignoring failure status, continuing to wait...`);
							if (attempt < maxAttempts) {
								await new Promise(resolve => setTimeout(resolve, this.getDelayForAttempt(attempt)));
							}
						} else {
							// 8次后才真正认为失败
							console.error('Import failed after extended waiting:', errorMsg);
							return {
								success: false,
								error: `Import failed with status: ${result.job_status}, error: ${errorMsg}`
							};
						}
					} else {
						// 其他状态 (可能是 0 或其他值)
						console.log(`Job status: ${result.job_status}, continuing to wait...`);
						if (attempt < maxAttempts) {
							await new Promise(resolve => setTimeout(resolve, this.getDelayForAttempt(attempt)));
						}
					}
				} else {
					throw new Error('Invalid import status response');
				}
			}

			return {
				success: false,
				error: `Import timeout after ${timeoutMs}ms`
			};

		} catch (error) {
			console.error('Import completion check error:', error);
			return {
				success: false,
				error: error.message,
			};
		}
	}

	/**
	 * 删除源文件
	 */
	private async deleteSourceFile(fileToken: string): Promise<void> {
		try {
			console.log('Deleting source file with token:', fileToken);

			// 根据API文档，删除文件需要指定type参数
			const response = await this.makeAuthenticatedRequest(`/drive/v1/files/${fileToken}?type=file`, {
				method: 'DELETE',
			});

			console.log('Delete file response:', JSON.stringify(response, null, 2));

			if (response.code === 0) {
				console.log('Source file deleted successfully');
			} else {
				throw new Error(`Delete file failed: ${response.msg || 'Unknown error'}`);
			}

		} catch (error) {
			console.error('Delete source file error:', error);
			throw error;
		}
	}

	/**
	 * 将 Markdown 转换为简单的文档块 (已废弃，保留以防需要)
	 */
	private convertMarkdownToSimpleBlocks(markdown: string): any[] {
		const lines = markdown.split('\n');
		const blocks: any[] = [];

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];

			if (line.trim() === '') {
				// 跳过空行
				continue;
			}

			if (line.startsWith('### ')) {
				// 三级标题
				blocks.push({
					block_type: 'heading3',
					heading3: {
						elements: [{
							text_run: {
								content: line.substring(4).trim()
							}
						}]
					}
				});
			} else if (line.startsWith('## ')) {
				// 二级标题
				blocks.push({
					block_type: 'heading2',
					heading2: {
						elements: [{
							text_run: {
								content: line.substring(3).trim()
							}
						}]
					}
				});
			} else if (line.startsWith('# ')) {
				// 一级标题
				blocks.push({
					block_type: 'heading1',
					heading1: {
						elements: [{
							text_run: {
								content: line.substring(2).trim()
							}
						}]
					}
				});
			} else {
				// 普通文本
				blocks.push({
					block_type: 'text',
					text: {
						elements: [{
							text_run: {
								content: line
							}
						}]
					}
				});
			}
		}

		// 如果没有内容，至少添加一个文本块
		if (blocks.length === 0) {
			blocks.push({
				block_type: 'text',
				text: {
					elements: [{
						text_run: {
							content: markdown || '文档内容'
						}
					}]
				}
			});
		}

		console.log('Converted to blocks:', blocks.length, 'blocks');
		return blocks;
	}
}
