/**
 * 飞书分享插件的常量定义
 */

// 飞书开放平台配置
export const FEISHU_CONFIG = {
	// 飞书开放平台 API 基础 URL
	API_BASE_URL: 'https://open.feishu.cn/open-apis',

	// OAuth 相关 URL
	OAUTH_BASE_URL: 'https://open.feishu.cn/open-apis/authen/v1',
	AUTHORIZE_URL: 'https://open.feishu.cn/open-apis/authen/v1/authorize',
	TOKEN_URL: 'https://open.feishu.cn/open-apis/authen/v1/access_token',
	REFRESH_TOKEN_URL: 'https://open.feishu.cn/open-apis/authen/v1/refresh_access_token',

	// 重定向 URI（使用不会消费授权码的地址）
	REDIRECT_URI: 'https://example.com/callback',

	// 代理服务器配置
	PROXY_URL: 'http://localhost:3001/proxy',
	
	// API 权限范围
	SCOPES: [
		'contact:user.base:readonly',  // 读取用户基本信息
		'docx:document',               // 创建和管理文档
		'drive:drive',                 // 访问云文档
	].join(' '),
};

// 插件默认设置
export const DEFAULT_SETTINGS: Partial<import('./types').FeishuShareSettings> = {
	appId: '',
	appSecret: '',
	proxyUrl: 'https://md2feishu.xinqi.life', // 默认使用云端Python代理
	proxyType: 'cloud', // 默认使用云端服务器
	accessToken: '',
	refreshToken: '',
	userInfo: null,
	defaultFolderId: '',
	defaultFolderName: '我的空间',
};

// 本地存储键名
export const STORAGE_KEYS = {
	SETTINGS: 'feishu-share-settings',
	TEMP_AUTH_STATE: 'feishu-share-auth-state',
};

// 通知消息
export const MESSAGES = {
	SUCCESS: {
		SHARE_SUCCESS: '分享成功！已创建飞书文档：',
		AUTH_SUCCESS: '飞书授权成功！',
		SETTINGS_SAVED: '设置已保存',
	},
	ERROR: {
		NO_ACTIVE_FILE: '请先打开一个 Markdown 文件',
		NOT_MARKDOWN_FILE: '当前文件类型不支持分享到飞书',
		AUTH_REQUIRED: '请先完成飞书授权',
		AUTH_FAILED: '飞书授权失败',
		SHARE_FAILED: '分享失败',
		NETWORK_ERROR: '网络连接错误',
		UNKNOWN_ERROR: '未知错误',
		FOLDER_NOT_FOUND: '目标文件夹无效，将上传到"我的空间"',
	},
	INFO: {
		SHARING: '正在分享到飞书...',
		AUTHORIZING: '正在进行飞书授权...',
		LOADING_FOLDERS: '正在加载文件夹列表...',
	},
};

// HTTP 状态码
export const HTTP_STATUS = {
	OK: 200,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	TOO_MANY_REQUESTS: 429,
	INTERNAL_SERVER_ERROR: 500,
};

// 文件相关常量
export const FILE_CONSTANTS = {
	MARKDOWN_EXTENSIONS: ['.md', '.markdown'],
	MAX_TITLE_LENGTH: 100,
	MAX_CONTENT_SIZE: 10 * 1024 * 1024, // 10MB
};
