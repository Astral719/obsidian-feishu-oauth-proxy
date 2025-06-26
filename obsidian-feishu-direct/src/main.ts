import { Plugin, Notice, TFile, Menu, Editor, MarkdownView } from 'obsidian';
import { FeishuSettings } from './types';
import { DEFAULT_SETTINGS } from './constants';
import { FeishuApiService } from './feishu-api';
import { FeishuSettingTab } from './settings';
import { MarkdownProcessor } from './markdown-processor';

export default class FeishuSharePlugin extends Plugin {
	settings: FeishuSettings;
	feishuApi: FeishuApiService;
	markdownProcessor: MarkdownProcessor;

	async onload() {
		console.log('Loading Feishu Share Direct Plugin');

		// 加载设置
		await this.loadSettings();

		// 初始化服务
		this.feishuApi = new FeishuApiService(this.settings);
		this.markdownProcessor = new MarkdownProcessor();

		// 注册自定义协议处理器，实现自动授权回调
		this.registerObsidianProtocolHandler('feishu-auth', (params) => {
			console.log('Received OAuth callback via protocol:', params);
			this.handleOAuthCallback(params);
		});

		// 添加设置页面
		this.addSettingTab(new FeishuSettingTab(this.app, this));

		// 添加命令
		this.addCommand({
			id: 'share-current-note',
			name: '分享当前笔记到飞书',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				this.shareCurrentNote();
			}
		});

		// 添加右键菜单
		this.registerEvent(
			this.app.workspace.on('file-menu', (menu: Menu, file: TFile) => {
				if (file instanceof TFile && file.extension === 'md') {
					menu.addItem((item) => {
						item
							.setTitle('📤 分享到飞书')
							.setIcon('share')
							.onClick(() => {
								this.shareFile(file);
							});
					});
				}
			})
		);

		// 添加编辑器右键菜单
		this.registerEvent(
			this.app.workspace.on('editor-menu', (menu: Menu, editor: Editor, view: MarkdownView) => {
				menu.addItem((item) => {
					item
						.setTitle('📤 分享到飞书')
						.setIcon('share')
						.onClick(() => {
							this.shareCurrentNote();
						});
				});
			})
		);

		console.log('Feishu Share Direct Plugin loaded successfully');
	}

	onunload() {
		console.log('Unloading Feishu Share Direct Plugin');
	}

	async loadSettings() {
		const loadedData = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData);
		console.log('Settings loaded:', {
			appId: this.settings.appId,
			appSecret: this.settings.appSecret ? '***' : 'empty',
			hasUserInfo: !!this.settings.userInfo,
			defaultFolderId: this.settings.defaultFolderId,
			defaultFolderName: this.settings.defaultFolderName,
			loadedData: loadedData
		});
	}

	async saveSettings() {
		console.log('Saving settings:', {
			appId: this.settings.appId,
			appSecret: this.settings.appSecret ? '***' : 'empty',
			hasUserInfo: !!this.settings.userInfo,
			defaultFolderId: this.settings.defaultFolderId,
			defaultFolderName: this.settings.defaultFolderName
		});
		await this.saveData(this.settings);
		if (this.feishuApi) {
			this.feishuApi.updateSettings(this.settings);
		}
		console.log('Settings saved successfully');
	}

	/**
	 * 处理OAuth回调
	 */
	private async handleOAuthCallback(params: any) {
		console.log('Processing OAuth callback...', params);

		if (params.code) {
			new Notice('🔄 正在处理授权回调...');

			try {
				const success = await this.feishuApi.processCallback(`obsidian://feishu-auth?${new URLSearchParams(params).toString()}`);

				if (success) {
					new Notice('🎉 自动授权成功！');
					await this.saveSettings();

					// 通知设置页面刷新 - 使用自定义事件
					window.dispatchEvent(new CustomEvent('feishu-auth-success'));
				} else {
					new Notice('❌ 授权处理失败，请重试');
				}
			} catch (error) {
				console.error('OAuth callback error:', error);
				new Notice(`❌ 授权处理失败: ${error.message}`);
			}
		} else if (params.error) {
			new Notice(`❌ 授权失败: ${params.error_description || params.error}`);
		} else {
			new Notice('❌ 无效的授权回调');
		}
	}

	/**
	 * 分享当前笔记
	 */
	async shareCurrentNote() {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice('❌ 没有打开的笔记');
			return;
		}

		if (activeFile.extension !== 'md') {
			new Notice('❌ 只支持分享 Markdown 文件');
			return;
		}

		await this.shareFile(activeFile);
	}

	/**
	 * 分享指定文件
	 */
	async shareFile(file: TFile) {
		try {
			// 检查授权状态
			if (!this.settings.accessToken || !this.settings.userInfo) {
				new Notice('❌ 请先在设置中完成飞书授权');
				return;
			}

			new Notice('🔄 正在分享到飞书...');

			// 读取文件内容
			const rawContent = await this.app.vault.read(file);

			// 获取文件标题（去掉.md扩展名）
			const title = file.basename;

			console.log('=== Starting Feishu Share ===');
			console.log('File:', file.path);
			console.log('Title:', title);
			console.log('Raw content length:', rawContent.length);

			// 使用Markdown处理器处理内容
			console.log('Processing markdown content...');
			const processedContent = this.markdownProcessor.processComplete(rawContent);
			console.log('Processed content length:', processedContent.length);

			// 调用API分享
			const result = await this.feishuApi.shareMarkdown(title, processedContent);

			if (result.success) {
				console.log('Share successful:', result);

				// 显示美观的成功通知
				if (result.url) {
					console.log('📋 文档链接:', result.url);

					// 创建美观的成功通知
					const linkNotice = new Notice('', 10000); // 10秒后自动消失
					linkNotice.noticeEl.empty();

					// 重置Notice的默认样式
					linkNotice.noticeEl.style.cssText = `
						background: transparent !important;
						border: none !important;
						box-shadow: none !important;
						padding: 0 !important;
						margin: 0 !important;
					`;

					const container = linkNotice.noticeEl.createDiv('feishu-success-container');
					container.style.cssText = `
						position: relative;
						display: flex;
						flex-direction: column;
						gap: 16px;
						padding: 20px;
						background: var(--background-primary);
						border-radius: 12px;
						border: 1px solid var(--background-modifier-border);
						box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
						min-width: 320px;
						max-width: 400px;
					`;

					// 顶部区域：图标 + 标题
					const header = container.createDiv('feishu-success-header');
					header.style.cssText = `
						display: flex;
						align-items: center;
						gap: 12px;
					`;

					const iconContainer = header.createDiv('feishu-icon-container');
					iconContainer.style.cssText = `
						width: 48px;
						height: 48px;
						background: linear-gradient(135deg, #4CAF50, #45a049);
						border-radius: 50%;
						display: flex;
						align-items: center;
						justify-content: center;
						box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
					`;

					const icon = iconContainer.createEl('span', {
						text: '✓',
						cls: 'feishu-success-icon'
					});
					icon.style.cssText = `
						font-size: 24px;
						font-weight: bold;
						color: white;
					`;

					const headerText = header.createDiv('feishu-header-text');
					headerText.style.cssText = `
						flex: 1;
					`;

					const title = headerText.createEl('div', {
						text: '分享成功！',
						cls: 'feishu-success-title'
					});
					title.style.cssText = `
						font-size: 18px;
						font-weight: 600;
						color: var(--text-normal);
						margin-bottom: 4px;
					`;

					const subtitle = headerText.createEl('div', {
						text: `文档：${result.title}`,
						cls: 'feishu-success-subtitle'
					});
					subtitle.style.cssText = `
						font-size: 14px;
						color: var(--text-muted);
						line-height: 1.4;
					`;

					// 按钮区域
					const buttonGroup = container.createDiv('feishu-button-group');
					buttonGroup.style.cssText = `
						display: flex;
						gap: 12px;
					`;

					// 复制按钮（主要操作）
					const copyBtn = buttonGroup.createEl('button', {
						text: '📋 复制链接',
						cls: 'feishu-copy-btn'
					});
					copyBtn.style.cssText = `
						flex: 1;
						padding: 12px 16px;
						background: linear-gradient(135deg, var(--interactive-accent), var(--interactive-accent-hover));
						color: var(--text-on-accent);
						border: none;
						border-radius: 8px;
						cursor: pointer;
						font-size: 14px;
						font-weight: 500;
						transition: all 0.3s ease;
						box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
					`;

					copyBtn.onmouseenter = () => {
						copyBtn.style.transform = 'translateY(-2px)';
						copyBtn.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.15)';
					};

					copyBtn.onmouseleave = () => {
						copyBtn.style.transform = 'translateY(0)';
						copyBtn.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
					};

					copyBtn.onclick = async () => {
						try {
							if (result.url) {
								await navigator.clipboard.writeText(result.url);
								copyBtn.innerHTML = '✅ 已复制';
								copyBtn.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
								setTimeout(() => {
									copyBtn.innerHTML = '📋 复制链接';
									copyBtn.style.background = 'linear-gradient(135deg, var(--interactive-accent), var(--interactive-accent-hover))';
								}, 2000);
							}
						} catch (error) {
							console.error('复制失败:', error);
							copyBtn.innerHTML = '❌ 复制失败';
							copyBtn.style.background = 'linear-gradient(135deg, #f44336, #d32f2f)';
							setTimeout(() => {
								copyBtn.innerHTML = '📋 复制链接';
								copyBtn.style.background = 'linear-gradient(135deg, var(--interactive-accent), var(--interactive-accent-hover))';
							}, 2000);
						}
					};

					// 打开按钮（次要操作）
					const openBtn = buttonGroup.createEl('button', {
						text: '🔗 打开',
						cls: 'feishu-open-btn'
					});
					openBtn.style.cssText = `
						padding: 12px 16px;
						background: var(--background-secondary);
						color: var(--text-normal);
						border: 1px solid var(--background-modifier-border);
						border-radius: 8px;
						cursor: pointer;
						font-size: 14px;
						font-weight: 500;
						transition: all 0.3s ease;
						min-width: 80px;
					`;

					openBtn.onmouseenter = () => {
						openBtn.style.background = 'var(--background-modifier-hover)';
						openBtn.style.transform = 'translateY(-2px)';
						openBtn.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
					};

					openBtn.onmouseleave = () => {
						openBtn.style.background = 'var(--background-secondary)';
						openBtn.style.transform = 'translateY(0)';
						openBtn.style.boxShadow = 'none';
					};

					openBtn.onclick = () => {
						if (result.url) {
							window.open(result.url, '_blank');
						}
					};

					// 添加关闭按钮
					const closeBtn = container.createEl('button', {
						text: '×',
						cls: 'feishu-close-btn'
					});
					closeBtn.style.cssText = `
						position: absolute;
						top: 8px;
						right: 8px;
						width: 24px;
						height: 24px;
						background: transparent;
						border: none;
						border-radius: 50%;
						cursor: pointer;
						font-size: 16px;
						color: var(--text-muted);
						display: flex;
						align-items: center;
						justify-content: center;
						transition: all 0.2s ease;
					`;

					closeBtn.onmouseenter = () => {
						closeBtn.style.background = 'var(--background-modifier-hover)';
						closeBtn.style.color = 'var(--text-normal)';
					};

					closeBtn.onmouseleave = () => {
						closeBtn.style.background = 'transparent';
						closeBtn.style.color = 'var(--text-muted)';
					};

					closeBtn.onclick = () => {
						linkNotice.hide();
					};
				} else {
					// 没有URL时的简单成功通知
					new Notice(`✅ 分享成功！文档标题：${result.title}`);
				}
			} else {
				new Notice(`❌ 分享失败：${result.error}`);
				console.error('Share failed:', result.error);
			}

		} catch (error) {
			console.error('Share file error:', error);
			new Notice(`❌ 分享失败：${error.message}`);
		}
	}

	/**
	 * 检查并刷新token
	 */
	async ensureValidAuth(): Promise<boolean> {
		if (!this.settings.accessToken) {
			return false;
		}

		// 这里可以添加token有效性检查和自动刷新逻辑
		// 暂时简单返回true
		return true;
	}
}
