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
		// 加载设置
		await this.loadSettings();

		// 初始化服务
		this.feishuApi = new FeishuApiService(this.settings);
		this.markdownProcessor = new MarkdownProcessor();

		// 注册自定义协议处理器，实现自动授权回调
		this.registerObsidianProtocolHandler('feishu-auth', (params) => {
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

		}

	onunload() {
		}

	async loadSettings() {
		const loadedData = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData);
		}

	async saveSettings() {
		await this.saveData(this.settings);
		if (this.feishuApi) {
			this.feishuApi.updateSettings(this.settings);
		}
		}

	/**
	 * 处理OAuth回调
	 */
	private async handleOAuthCallback(params: any) {
		if (params.code) {
			new Notice('🔄 正在处理授权回调...');

			try {
				const success = await this.feishuApi.processCallback(`obsidian://feishu-auth?${new URLSearchParams(params).toString()}`);

				if (success) {
					new Notice('🎉 自动授权成功！');
					await this.saveSettings();

					// 通知设置页面刷新和分享流程继续 - 使用自定义事件
					window.dispatchEvent(new CustomEvent('feishu-auth-success', {
						detail: {
							timestamp: Date.now(),
							source: 'oauth-callback'
						}
					}));
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
		// 创建持续状态提示
		const statusNotice = new Notice('🔄 正在分享到飞书...', 0); // 0表示不自动消失

		try {
			// 检查基本授权状态
			if (!this.settings.accessToken || !this.settings.userInfo) {
				statusNotice.hide();
				new Notice('❌ 请先在设置中完成飞书授权');
				return;
			}

			// 读取文件内容
			const rawContent = await this.app.vault.read(file);

			// 获取文件标题（去掉.md扩展名）
			const title = file.basename;

			// 使用Markdown处理器处理内容
			const processedContent = this.markdownProcessor.processComplete(rawContent);
			// 调用API分享（内部会自动检查和刷新token，如果需要重新授权会等待完成）
			const result = await this.feishuApi.shareMarkdown(title, processedContent, statusNotice);

			// 隐藏状态提示
			statusNotice.hide();

			if (result.success) {
				// 显示美观的成功通知
				if (result.url) {
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
								copyBtn.textContent = '✅ 已复制';
								copyBtn.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
								setTimeout(() => {
									copyBtn.textContent = '📋 复制链接';
									copyBtn.style.background = 'linear-gradient(135deg, var(--interactive-accent), var(--interactive-accent-hover))';
								}, 2000);
							}
						} catch (error) {
							console.error('复制失败:', error);
							copyBtn.textContent = '❌ 复制失败';
							copyBtn.style.background = 'linear-gradient(135deg, #f44336, #d32f2f)';
							setTimeout(() => {
								copyBtn.textContent = '📋 复制链接';
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
			// 确保隐藏状态提示
			statusNotice.hide();
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
