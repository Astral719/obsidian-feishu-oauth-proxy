/**
 * 飞书分享插件的类型定义
 */

// 插件设置接口
export interface FeishuShareSettings {
	// 飞书应用配置
	appId: string;
	appSecret: string;

	// 代理服务器配置
	proxyUrl: string;
	proxyType?: string; // 'cloud' | 'local' | 'custom'

	// 飞书授权相关
	accessToken: string;
	refreshToken: string;
	userInfo: FeishuUserInfo | null;

	// 文件夹配置
	defaultFolderId: string;
	defaultFolderName: string;
}

// 飞书用户信息
export interface FeishuUserInfo {
	userId: string;
	name: string;
	avatar?: string;
}

// 飞书 OAuth 响应
export interface FeishuOAuthResponse {
	access_token: string;
	refresh_token: string;
	expires_in: number;
	token_type: string;
	// 用户信息字段
	open_id: string;
	name: string;
	avatar_url: string;
	en_name?: string;
	tenant_key: string;
	union_id: string;
}

// 飞书 API 错误响应
export interface FeishuApiError {
	code: number;
	msg: string;
	data?: any;
}

// 飞书文档创建响应
export interface FeishuDocCreateResponse {
	code: number;
	msg: string;
	data: {
		doc: {
			doc_id: string;
			doc_token: string;
			title: string;
			url: string;
		};
	};
}

// 飞书文件夹列表响应
export interface FeishuFolderListResponse {
	code: number;
	msg: string;
	data: {
		folders: FeishuFolder[];
		has_more: boolean;
		page_token?: string;
	};
}

// 飞书文件夹信息
export interface FeishuFolder {
	folder_token: string;
	name: string;
	parent_folder_token?: string;
	created_time: string;
	modified_time: string;
}

// 分享操作结果
export interface ShareResult {
	success: boolean;
	docUrl?: string;
	docTitle?: string;
	error?: string;
	errorCode?: number;
	warning?: string;
}

// 常见错误码映射
export const FEISHU_ERROR_MESSAGES: Record<number, string> = {
	1: '系统错误',
	2: '参数错误',
	3: '权限不足',
	4: '资源不存在',
	5: '请求频率过高',
	99991663: 'access_token 无效或已过期',
	99991664: 'refresh_token 无效或已过期',
	99991665: '应用权限不足',
	99991666: '用户权限不足',
	230001: '文档标题不能为空',
	230002: '文档标题过长',
	230003: '文档内容过大',
	230004: '文件夹不存在或无权限访问',
};
