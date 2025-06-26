import { Plugin, TFile, Notice, addIcon } from 'obsidian';
import { FeishuShareSettings } from './src/types';
import { DEFAULT_SETTINGS, MESSAGES, FILE_CONSTANTS } from './src/constants';
import { FeishuShareSettingTab } from './src/settings';
import { FeishuApiService } from './src/feishu-api';
import { MarkdownProcessor } from './src/markdown-processor';

/**
 * 飞书分享插件主类
 */
export default class FeishuSharePlugin extends Plugin {
	settings: FeishuShareSettings;
	feishuApi: FeishuApiService;
	markdownProcessor: MarkdownProcessor;

	async onload() {
		console.log('Loading Feishu Share Plugin');

		// 加载设置
		await this.loadSettings();

		// 初始化服务
		this.feishuApi = new FeishuApiService(this.settings);
		this.markdownProcessor = new MarkdownProcessor();

		// 添加自定义图标
		this.addFeishuIcon();

		// 添加命令
		this.addCommand({
			id: 'share-to-feishu',
			name: '分享到飞书',
			icon: 'feishu-icon',
			callback: () => this.shareToFeishu(),
		});

		// 添加文件菜单项
		this.registerEvent(
			this.app.workspace.on('file-menu', (menu, file) => {
				if (file instanceof TFile && this.isMarkdownFile(file)) {
					menu.addItem((item) => {
						item
							.setTitle('分享到飞书')
							.setIcon('feishu-icon')
							.onClick(() => this.shareFileToFeishu(file));
					});
				}
			})
		);

		// 添加编辑器菜单项
		this.registerEvent(
			this.app.workspace.on('editor-menu', (menu, editor, view) => {
				if (view.file && this.isMarkdownFile(view.file)) {
					menu.addItem((item) => {
						item
							.setTitle('分享到飞书')
							.setIcon('feishu-icon')
							.onClick(() => this.shareToFeishu());
					});
				}
			})
		);

		// 添加设置选项卡
		this.addSettingTab(new FeishuShareSettingTab(this.app, this));

		// OAuth 回调现在通过本地服务器处理，不需要协议处理器
	}

	onunload() {
		console.log('Unloading Feishu Share Plugin');
	}

	/**
	 * 加载插件设置
	 */
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	/**
	 * 保存插件设置
	 */
	async saveSettings() {
		await this.saveData(this.settings);
		// 更新 API 服务的设置
		if (this.feishuApi) {
			this.feishuApi.updateSettings(this.settings);
		}
	}

	/**
	 * 添加飞书图标
	 */
	private addFeishuIcon() {
		addIcon('feishu-icon', `
			<svg viewBox="0 0 24 24" fill="currentColor">
				<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
			</svg>
		`);
	}

	/**
	 * 检查文件是否为 Markdown 文件
	 */
	private isMarkdownFile(file: TFile): boolean {
		return FILE_CONSTANTS.MARKDOWN_EXTENSIONS.some(ext => 
			file.path.toLowerCase().endsWith(ext)
		);
	}

	/**
	 * 分享当前活动文件到飞书
	 */
	async shareToFeishu() {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice(MESSAGES.ERROR.NO_ACTIVE_FILE);
			return;
		}

		if (!this.isMarkdownFile(activeFile)) {
			new Notice(MESSAGES.ERROR.NOT_MARKDOWN_FILE);
			return;
		}

		await this.shareFileToFeishu(activeFile);
	}

	/**
	 * 分享指定文件到飞书
	 */
	async shareFileToFeishu(file: TFile) {
		try {
			// 检查授权状态
			if (!this.settings.accessToken) {
				new Notice(MESSAGES.ERROR.AUTH_REQUIRED);
				return;
			}

			// 显示进度提示
			const notice = new Notice(MESSAGES.INFO.SHARING, 0);

			// 读取文件内容
			const content = await this.app.vault.read(file);
			
			// 处理 Markdown 内容
			const processedContent = this.markdownProcessor.process(content);
			
			// 获取文件标题（去除扩展名）
			const title = file.basename;

			// 分享到飞书
			const result = await this.feishuApi.createDocument(
				title,
				processedContent,
				this.settings.defaultFolderId
			);

			// 隐藏进度提示
			notice.hide();

			if (result.success && result.docUrl) {
				// 显示成功通知
				const successNotice = new Notice(
					`${MESSAGES.SUCCESS.SHARE_SUCCESS}${result.docTitle}`,
					10000
				);
				
				// 添加点击打开链接的功能
				successNotice.noticeEl.addEventListener('click', () => {
					window.open(result.docUrl, '_blank');
				});
				
				// 添加复制链接按钮
				const copyButton = successNotice.noticeEl.createEl('button', {
					text: '复制链接',
					cls: 'mod-cta'
				});
				copyButton.addEventListener('click', (e) => {
					e.stopPropagation();
					navigator.clipboard.writeText(result.docUrl!);
					new Notice('链接已复制到剪贴板');
				});
			} else {
				new Notice(`${MESSAGES.ERROR.SHARE_FAILED}：${result.error}`);
			}

		} catch (error) {
			console.error('Share to Feishu error:', error);
			new Notice(`${MESSAGES.ERROR.SHARE_FAILED}：${error.message}`);
		}
	}

	/**
	 * 刷新设置页面显示
	 */
	private refreshSettingsDisplay() {
		// 由于 Obsidian API 限制，这里暂时不实现自动刷新
		// 用户需要手动刷新设置页面来看到更新后的授权状态
		console.log('Authorization completed, settings may need manual refresh');
	}
}
