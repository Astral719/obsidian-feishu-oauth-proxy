/**
 * 飞书分享插件类型定义
 */

export interface FeishuSettings {
	appId: string;
	appSecret: string;
	callbackUrl: string;
	accessToken: string;
	refreshToken: string;
	userInfo: FeishuUserInfo | null;
	defaultFolderId: string;
	defaultFolderName: string;
}

export interface FeishuUserInfo {
	name: string;
	avatar_url: string;
	email: string;
	user_id: string;
}

export interface FeishuOAuthResponse {
	code: number;
	msg: string;
	data: {
		access_token: string;
		refresh_token: string;
		expires_in: number;
		token_type: string;
	};
}

export interface FeishuApiError {
	code: number;
	msg: string;
}

export interface ShareResult {
	success: boolean;
	url?: string;
	title?: string;
	error?: string;
}

export interface FeishuFileUploadResponse {
	code: number;
	msg: string;
	data: {
		file_token: string;
	};
}

export interface FeishuDocCreateResponse {
	code: number;
	msg: string;
	data: {
		document: {
			document_id: string;
			revision_id: number;
			title: string;
		};
	};
}

export interface FeishuFolderListResponse {
	code: number;
	msg: string;
	data: {
		files: Array<{
			token: string;
			name: string;
			type: string;
			parent_token: string;
			url: string;
			created_time: string;
			modified_time: string;
		}>;
		has_more: boolean;
		page_token: string;
	};
}
