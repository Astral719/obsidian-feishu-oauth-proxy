import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import FeishuSharePlugin from '../main';
import { MESSAGES } from './constants';
import { FolderSelectModal } from './folder-select-modal';
import { ManualAuthModal } from './manual-auth-modal';

/**
 * 飞书分享插件设置界面
 */
export class FeishuShareSettingTab extends PluginSettingTab {
	plugin: FeishuSharePlugin;

	constructor(app: App, plugin: FeishuSharePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// 插件标题和描述
		containerEl.createEl('h2', { text: '飞书分享设置' });
		containerEl.createEl('p', { 
			text: '配置飞书账号授权和默认上传设置，实现一键分享 Markdown 内容到飞书云文档。' 
		});

		// 飞书应用配置说明
		this.addAppConfigSection(containerEl);

		// 应用配置
		this.addAppCredentialsSection(containerEl);

		// 代理服务器设置
		this.addProxySection(containerEl);

		// 授权状态和管理
		this.addAuthSection(containerEl);

		// 文件夹设置
		this.addFolderSection(containerEl);

		// 使用说明
		this.addUsageSection(containerEl);
	}

	/**
	 * 添加应用配置说明部分
	 */
	private addAppConfigSection(containerEl: HTMLElement): void {
		containerEl.createEl('h3', { text: '📋 使用前准备' });
		
		const configDiv = containerEl.createDiv('setting-item-description');
		configDiv.innerHTML = `
			<p><strong>首次使用需要创建飞书应用：</strong></p>
			<ol>
				<li>访问 <a href="https://open.feishu.cn/app" target="_blank">飞书开放平台</a></li>
				<li>创建企业自建应用或个人应用</li>
				<li>在应用管理页面获取 App ID 和 App Secret</li>
				<li>配置重定向 URL：<code>https://httpbin.org/get</code></li>
				<li>申请以下权限：
					<ul>
						<li>contact:user.base:readonly (读取用户基本信息)</li>
						<li>docx:document (创建和管理文档)</li>
						<li>drive:drive (访问云文档)</li>
					</ul>
				</li>
			</ol>
			<p><em>注意：由于技术限制，当前版本需要您手动配置应用信息。未来版本将简化此流程。</em></p>
		`;
	}

	/**
	 * 添加应用凭据配置部分
	 */
	private addAppCredentialsSection(containerEl: HTMLElement): void {
		containerEl.createEl('h3', { text: '🔑 应用配置' });

		// App ID 配置
		new Setting(containerEl)
			.setName('App ID')
			.setDesc('在飞书开放平台创建应用后获得的 App ID')
			.addText(text => text
				.setPlaceholder('请输入 App ID')
				.setValue(this.plugin.settings.appId)
				.onChange(async (value) => {
					this.plugin.settings.appId = value.trim();
					await this.plugin.saveSettings();
				}));

		// App Secret 配置
		new Setting(containerEl)
			.setName('App Secret')
			.setDesc('在飞书开放平台创建应用后获得的 App Secret（请妥善保管）')
			.addText(text => {
				text.inputEl.type = 'password';
				text
					.setPlaceholder('请输入 App Secret')
					.setValue(this.plugin.settings.appSecret)
					.onChange(async (value) => {
						this.plugin.settings.appSecret = value.trim();
						await this.plugin.saveSettings();
					});
			});

		// 配置状态提示
		const statusDiv = containerEl.createDiv('setting-item-description');
		if (this.plugin.settings.appId && this.plugin.settings.appSecret) {
			statusDiv.innerHTML = '<span style="color: var(--text-success);">✅ 应用配置已完成</span>';
		} else {
			statusDiv.innerHTML = '<span style="color: var(--text-error);">⚠️ 请完成应用配置后再进行授权</span>';
		}
	}

	/**
	 * 添加代理服务器设置部分
	 */
	private addProxySection(containerEl: HTMLElement): void {
		containerEl.createEl('h3', { text: '🌐 代理服务器设置' });

		// 代理服务器类型选择
		let currentProxyType = this.getProxyType();
		new Setting(containerEl)
			.setName('代理服务器类型')
			.setDesc('选择代理服务器类型：云端托管（推荐）或本地服务器')
			.addDropdown(dropdown => dropdown
				.addOption('cloud', '☁️ 云端托管 (推荐，零配置)')
				.addOption('local', '🏠 本地服务器 (需要运行Python脚本)')
				.addOption('custom', '🔧 自定义地址')
				.setValue(currentProxyType)
				.onChange(async (value) => {
					// 保存用户选择的类型到设置中
					this.plugin.settings.proxyType = value;
					if (value === 'local') {
						this.plugin.settings.proxyUrl = 'http://localhost:5000';
					} else if (value === 'cloud') {
						this.plugin.settings.proxyUrl = 'https://md2feishu.xinqi.life';
					}
					// custom类型在下面的文本框中设置
					await this.plugin.saveSettings();
					this.display(); // 刷新界面
				}));

		// 自定义代理地址（仅在选择自定义时显示）
		if (currentProxyType === 'custom') {
			const customUrlSetting = new Setting(containerEl)
				.setName('自定义代理地址')
				.setDesc('输入您的自定义代理服务器地址');

			let tempUrl = this.plugin.settings.proxyUrl || '';

			customUrlSetting.addText(text => text
				.setPlaceholder('https://your-proxy.vercel.app')
				.setValue(tempUrl)
				.onChange((value) => {
					tempUrl = value;
				}))
				.addButton(button => button
					.setButtonText('保存')
					.setCta()
					.onClick(async () => {
						this.plugin.settings.proxyUrl = tempUrl;
						await this.plugin.saveSettings();
						new Notice('自定义代理地址已保存');
						this.display(); // 刷新界面
					}));
		}

		// 显示当前代理地址
		const currentProxyDiv = containerEl.createDiv('setting-item-description');
		const currentUrl = this.plugin.settings.proxyUrl || 'https://md2feishu.xinqi.life';
		currentProxyDiv.innerHTML = `<span style="color: var(--text-muted);">当前代理地址: ${currentUrl}</span>`;
	}

	/**
	 * 获取代理服务器类型
	 */
	private getProxyType(): string {
		// 优先使用保存的类型
		if (this.plugin.settings.proxyType) {
			return this.plugin.settings.proxyType;
		}

		// 如果没有保存的类型，根据URL推断
		const url = this.plugin.settings.proxyUrl || 'https://md2feishu.xinqi.life';
		if (url === 'http://localhost:5000') {
			return 'local';
		} else if (url === 'https://md2feishu.xinqi.life') {
			return 'cloud';
		} else {
			return 'custom';
		}
	}

	/**
	 * 添加授权管理部分
	 */
	private addAuthSection(containerEl: HTMLElement): void {
		containerEl.createEl('h3', { text: '🔐 飞书账号授权' });

		// 显示授权状态
		const statusDiv = containerEl.createDiv('setting-item');
		const statusInfo = statusDiv.createDiv('setting-item-info');
		statusInfo.createDiv('setting-item-name').setText('授权状态');
		
		const statusDesc = statusInfo.createDiv('setting-item-description');
		this.updateAuthStatus(statusDesc);

		// 授权/重新授权按钮
		const authControl = statusDiv.createDiv('setting-item-control');
		const authButton = authControl.createEl('button', {
			text: this.plugin.settings.accessToken ? '重新授权' : '开始授权',
			cls: 'mod-cta'
		});

		// 检查是否已配置应用信息
		const canAuth = this.plugin.settings.appId && this.plugin.settings.appSecret;
		if (!canAuth) {
			authButton.disabled = true;
			authButton.title = '请先配置 App ID 和 App Secret';
		}

		authButton.addEventListener('click', () => {
			if (canAuth) {
				this.startAutoAuth();
			}
		});

		// 手动输入授权码按钮
		if (canAuth && !this.plugin.settings.accessToken) {
			const manualButton = authControl.createEl('button', {
				text: '手动输入授权码'
			});

			manualButton.addEventListener('click', () => {
				this.startManualAuth();
			});
		}

		// 解除授权按钮
		if (this.plugin.settings.accessToken) {
			const clearButton = authControl.createEl('button', {
				text: '解除授权',
				cls: 'mod-warning'
			});

			clearButton.addEventListener('click', () => {
				this.clearAuth();
			});
		}
	}

	/**
	 * 添加文件夹设置部分
	 */
	private addFolderSection(containerEl: HTMLElement): void {
		if (!this.plugin.settings.accessToken) {
			return; // 未授权时不显示文件夹设置
		}

		containerEl.createEl('h3', { text: '📁 默认上传位置' });

		// 当前文件夹显示
		const folderDiv = containerEl.createDiv('setting-item');
		const folderInfo = folderDiv.createDiv('setting-item-info');
		folderInfo.createDiv('setting-item-name').setText('默认文件夹');
		
		const folderDesc = folderInfo.createDiv('setting-item-description');
		folderDesc.setText(
			this.plugin.settings.defaultFolderName || '我的空间（根目录）'
		);

		// 选择文件夹按钮
		const folderControl = folderDiv.createDiv('setting-item-control');
		const selectButton = folderControl.createEl('button', {
			text: '选择文件夹'
		});

		selectButton.addEventListener('click', () => {
			this.selectFolder();
		});

		// 重置为默认按钮
		if (this.plugin.settings.defaultFolderId) {
			const resetButton = folderControl.createEl('button', {
				text: '重置为默认'
			});

			resetButton.addEventListener('click', () => {
				this.resetFolder();
			});
		}
	}

	/**
	 * 添加使用说明部分
	 */
	private addUsageSection(containerEl: HTMLElement): void {
		containerEl.createEl('h3', { text: '📖 使用说明' });
		
		const usageDiv = containerEl.createDiv('setting-item-description');
		usageDiv.innerHTML = `
			<p><strong>分享方式：</strong></p>
			<ul>
				<li>在 Markdown 文件中，点击右上角菜单中的"分享到飞书"</li>
				<li>右键点击文件，选择"分享到飞书"</li>
				<li>使用命令面板搜索"分享到飞书"</li>
			</ul>
			<p><strong>支持的内容：</strong></p>
			<ul>
				<li>✅ 标准 Markdown 格式（标题、列表、粗体、斜体等）</li>
				<li>✅ 网络图片链接（http/https）</li>
				<li>⚠️ Obsidian 特有语法会转换为普通文本</li>
				<li>❌ 本地图片需要手动上传到飞书</li>
			</ul>
		`;
	}

	/**
	 * 更新授权状态显示
	 */
	private updateAuthStatus(element: HTMLElement): void {
		if (this.plugin.settings.accessToken && this.plugin.settings.userInfo) {
			element.innerHTML = `
				<span style="color: var(--text-success);">✅ 已授权</span><br>
				<small>账户：${this.plugin.settings.userInfo.name}</small>
			`;
		} else {
			element.innerHTML = '<span style="color: var(--text-error);">❌ 未授权</span>';
		}
	}

	/**
	 * 开始自动授权流程
	 */
	private async startAutoAuth(): Promise<void> {
		try {
			new Notice('🚀 启动自动授权流程...');

			// 检查是否已经有token，如果有就直接使用
			if (this.plugin.feishuApi.hasValidToken()) {
				new Notice('✅ 检测到有效的授权token，无需重新授权');
				return;
			}

			// 尝试自动OAuth流程
			const success = await this.plugin.feishuApi.startAutoOAuth();

			if (success) {
				await this.plugin.saveSettings();
				new Notice(MESSAGES.SUCCESS.AUTH_SUCCESS);
				this.display(); // 刷新设置界面
			} else {
				new Notice(MESSAGES.ERROR.AUTH_FAILED);
			}

		} catch (error) {
			console.error('Auto auth error:', error);

			// 如果自动授权失败，回退到手动授权
			new Notice('⚠️ 自动授权失败，切换到手动授权模式...');
			this.startManualAuth();
		}
	}

	/**
	 * 开始手动授权流程（备用方案）
	 */
	private async startManualAuth(): Promise<void> {
		try {
			// 生成授权 URL
			const authUrl = this.plugin.feishuApi.generateAuthUrl();

			// 打开手动授权模态框
			const modal = new ManualAuthModal(
				this.app,
				authUrl,
				async (code: string) => {
					try {
						new Notice(MESSAGES.INFO.AUTHORIZING);

						// 使用授权码获取访问令牌
						const success = await this.plugin.feishuApi.handleOAuthCallback(code);

						if (success) {
							await this.plugin.saveSettings();
							new Notice(MESSAGES.SUCCESS.AUTH_SUCCESS);
							this.display(); // 刷新设置界面
						} else {
							new Notice(MESSAGES.ERROR.AUTH_FAILED);
						}
					} catch (error) {
						console.error('Auth callback error:', error);
						new Notice(`${MESSAGES.ERROR.AUTH_FAILED}：${error.message}`);
					}
				}
			);

			modal.open();

		} catch (error) {
			console.error('Start manual auth error:', error);
			new Notice(`${MESSAGES.ERROR.AUTH_FAILED}：${error.message}`);
		}
	}

	/**
	 * 清除授权信息
	 */
	private async clearAuth(): Promise<void> {
		this.plugin.feishuApi.clearAuth();
		await this.plugin.saveSettings();
		new Notice('已解除飞书授权');
		this.display(); // 刷新界面
	}

	/**
	 * 选择文件夹
	 */
	private async selectFolder(): Promise<void> {
		try {
			// 直接打开文件夹选择模态框
			this.showFolderSelectModal();
		} catch (error) {
			console.error('Select folder error:', error);
			new Notice(`打开文件夹选择失败：${error.message}`);
		}
	}

	/**
	 * 显示文件夹选择模态框
	 */
	private showFolderSelectModal(): void {
		const modal = new FolderSelectModal(
			this.app,
			this.plugin.feishuApi,
			async (selectedFolder) => {
				if (selectedFolder) {
					// 用户选择了一个文件夹
					this.plugin.settings.defaultFolderId = selectedFolder.folder_token;
					this.plugin.settings.defaultFolderName = selectedFolder.name;
				} else {
					// 用户选择了根目录（我的空间）
					this.plugin.settings.defaultFolderId = '';
					this.plugin.settings.defaultFolderName = '我的空间';
				}

				await this.plugin.saveSettings();
				new Notice('默认文件夹设置已保存');
				this.display(); // 刷新设置界面
			}
		);

		modal.open();
	}

	/**
	 * 重置文件夹设置
	 */
	private async resetFolder(): Promise<void> {
		this.plugin.settings.defaultFolderId = '';
		this.plugin.settings.defaultFolderName = '我的空间';
		await this.plugin.saveSettings();
		new Notice('已重置为默认文件夹');
		this.display(); // 刷新界面
	}
}
