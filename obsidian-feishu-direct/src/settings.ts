import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import FeishuSharePlugin from './main';
import { ManualAuthModal } from './manual-auth-modal';
import { FolderSelectModal } from './folder-select-modal';

export class FeishuSettingTab extends PluginSettingTab {
	plugin: FeishuSharePlugin;

	constructor(app: App, plugin: FeishuSharePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// 标题和说明
		containerEl.createEl('h2', { text: '飞书分享设置' });
		
		const descEl = containerEl.createDiv('setting-item-description');
		descEl.innerHTML = `
			<p>直连飞书API，回调地址仅中转无记录。</p>
			<p><strong>特点：</strong>无依赖、更安全、响应更快</p>
		`;

		// 应用配置部分
		containerEl.createEl('h3', { text: '🔧 应用配置' });

		// App ID
		new Setting(containerEl)
			.setName('App ID')
			.setDesc('飞书应用的 App ID')
			.addText(text => text
				.setPlaceholder('输入飞书应用的 App ID')
				.setValue(this.plugin.settings.appId)
				.onChange(async (value) => {
					console.log('Setting App ID:', value);
					this.plugin.settings.appId = value.trim();
					await this.plugin.saveSettings();
					console.log('App ID saved:', this.plugin.settings.appId);
				}));

		// App Secret
		new Setting(containerEl)
			.setName('App Secret')
			.setDesc('飞书应用的 App Secret')
			.addText(text => {
				text.setPlaceholder('输入飞书应用的 App Secret')
					.setValue(this.plugin.settings.appSecret)
					.onChange(async (value) => {
						console.log('Setting App Secret:', value ? '***' : 'empty');
						this.plugin.settings.appSecret = value.trim();
						await this.plugin.saveSettings();
						console.log('App Secret saved:', this.plugin.settings.appSecret ? '***' : 'empty');
					});
				text.inputEl.type = 'password';
			});

		// 回调地址
		new Setting(containerEl)
			.setName('OAuth回调地址')
			.setDesc('obsidian需web回调中转，例如：https://md2feishu.xinqi.life/oauth-callback')
			.addText(text => text
				.setPlaceholder('https://md2feishu.xinqi.life/oauth-callback')
				.setValue(this.plugin.settings.callbackUrl)
				.onChange(async (value) => {
					console.log('Setting callback URL:', value);
					this.plugin.settings.callbackUrl = value.trim();
					await this.plugin.saveSettings();
					console.log('Callback URL saved:', this.plugin.settings.callbackUrl);
				}));

		// 授权部分
		containerEl.createEl('h3', { text: '🔐 授权管理' });

		// 当前授权状态
		const authStatusEl = containerEl.createDiv('setting-item');
		const authStatusInfo = authStatusEl.createDiv('setting-item-info');
		authStatusInfo.createDiv('setting-item-name').setText('授权状态');
		
		const statusDesc = authStatusInfo.createDiv('setting-item-description');
		if (this.plugin.settings.userInfo) {
			statusDesc.innerHTML = `
				<span style="color: var(--text-success);">✅ 已授权</span><br>
				<strong>用户：</strong>${this.plugin.settings.userInfo.name}<br>
				<strong>邮箱：</strong>${this.plugin.settings.userInfo.email}
			`;
		} else {
			statusDesc.innerHTML = '<span style="color: var(--text-error);">❌ 未授权</span>';
		}

		// 自动授权按钮（推荐）
		new Setting(containerEl)
			.setName('🚀 一键授权（推荐）')
			.setDesc('自动打开浏览器完成授权，通过云端回调自动返回授权结果，无需手动操作')
			.addButton(button => {
				button
					.setButtonText('🚀 一键授权')
					.setCta()
					.onClick(() => {
						this.startAutoAuth();
					});
			});

		// 手动授权按钮（备用）
		new Setting(containerEl)
			.setName('📝 手动授权（备用）')
			.setDesc('如果一键授权遇到问题，可以使用传统的手动复制粘贴授权方式')
			.addButton(button => {
				button
					.setButtonText('手动授权')
					.onClick(() => {
						this.startManualAuth();
					});
			});

		// 清除授权
		if (this.plugin.settings.userInfo) {
			new Setting(containerEl)
				.setName('清除授权')
				.setDesc('清除当前的授权信息')
				.addButton(button => {
					button
						.setButtonText('🗑️ 清除授权')
						.setWarning()
						.onClick(async () => {
							this.plugin.settings.accessToken = '';
							this.plugin.settings.refreshToken = '';
							this.plugin.settings.userInfo = null;
							await this.plugin.saveSettings();
							this.plugin.feishuApi.updateSettings(this.plugin.settings);
							new Notice('✅ 授权信息已清除');
							this.display(); // 刷新界面
						});
				});
		}

		// 文件夹设置部分（仅在已授权时显示）
		if (this.plugin.settings.userInfo) {
			containerEl.createEl('h3', { text: '📁 默认文件夹' });

			// 当前默认文件夹显示
			new Setting(containerEl)
				.setName('当前默认文件夹')
				.setDesc(`文档将保存到：${this.plugin.settings.defaultFolderName || '我的空间'}${this.plugin.settings.defaultFolderId ? ` (ID: ${this.plugin.settings.defaultFolderId})` : ''}`)
				.addButton(button => {
					button
						.setButtonText('📁 选择文件夹')
						.onClick(() => {
							this.showFolderSelectModal();
						});
				});
		}

		// 使用说明部分
		containerEl.createEl('h3', { text: '📖 使用说明' });

		const usageEl = containerEl.createDiv('setting-item-description');
		usageEl.innerHTML = `
			<div style="
				background: var(--background-secondary);
				border: 1px solid var(--background-modifier-border);
				padding: 16px;
				border-radius: 8px;
				margin-bottom: 16px;
				border-left: 4px solid var(--color-accent);
			">
				<strong style="color: var(--text-accent); font-size: 14px;">📋 快速配置指南</strong>
				<ol style="margin: 12px 0 0 0; padding-left: 20px; color: var(--text-normal);">
					<li style="margin-bottom: 8px;">
						<strong>创建飞书应用：</strong>访问
						<a href="https://open.feishu.cn/app" target="_blank" style="color: var(--text-accent); text-decoration: none;">
							飞书开放平台 🔗
						</a>
						创建"企业自建应用"，获取App ID和App Secret
					</li>
					<li style="margin-bottom: 8px;">
						<strong>配置OAuth回调：</strong>在飞书应用"安全设置"中添加回调地址：
						<br><code style="background: var(--background-primary); padding: 2px 6px; border-radius: 3px; font-size: 12px;">https://md2feishu.xinqi.life/oauth-callback</code>
						<br><span style="font-size: 12px; color: var(--text-muted);">💡 默认使用我们的回调服务，代码开源可自行部署</span>
					</li>
					<li style="margin-bottom: 8px;">
						<strong>添加应用权限：</strong>在"权限管理"中添加以下权限：
						<ul style="margin: 4px 0 0 20px; font-size: 12px; color: var(--text-muted);">
							<li>contact:user.base:readonly - 获取用户基本信息</li>
							<li>docx:document - 创建、编辑文档</li>
							<li>drive:drive - 访问云空间文件</li>
						</ul>
					</li>
					<li style="margin-bottom: 8px;">
						<strong>完成授权：</strong>在上方输入App ID和App Secret，点击"🚀 一键授权"
					</li>
					<li style="margin-bottom: 8px;">
						<strong>选择文件夹：</strong>授权后可选择默认保存文件夹（可选）
					</li>
					<li style="margin-bottom: 0;">
						<strong>开始使用：</strong>右键MD文件选择"📤 分享到飞书"，或使用命令面板
					</li>
				</ol>
			</div>
			<div style="
				background: var(--background-secondary);
				border: 1px solid var(--background-modifier-border);
				padding: 12px;
				border-radius: 6px;
				border-left: 4px solid var(--color-accent);
			">
				<strong style="color: var(--text-accent);">🎉 功能特色：</strong>
				<ul style="margin: 8px 0 0 20px; color: var(--text-normal);">
					<li style="margin-bottom: 4px;">✅ <strong>智能授权：</strong>自动检测token状态，失效时自动重新授权</li>
					<li style="margin-bottom: 4px;">✅ <strong>无缝分享：</strong>一键分享，自动处理授权和转换流程</li>
					<li style="margin-bottom: 4px;">✅ <strong>格式保持：</strong>完美保持Markdown格式，包括图片、表格、代码块</li>
					<li style="margin-bottom: 4px;">✅ <strong>智能处理：</strong>自动处理Obsidian双向链接、标签等语法</li>
					<li style="margin-bottom: 4px;">✅ <strong>可视化选择：</strong>支持浏览和选择目标文件夹</li>
					<li style="margin-bottom: 0;">✅ <strong>一键复制：</strong>分享成功后可一键复制文档链接</li>
				</ul>
			</div>
		`;

	// 添加"了解作者"按钮
	this.addAuthorSection(containerEl);
}

private addAuthorSection(containerEl: HTMLElement) {
	// 添加分隔线
	containerEl.createEl('hr', {
		attr: {
			style: 'margin: 24px 0; border: none; border-top: 1px solid var(--background-modifier-border);'
		}
	});

	// 创建作者信息区域
	const authorSection = containerEl.createDiv({
		attr: {
			style: `
				text-align: center;
				padding: 16px;
				background: var(--background-secondary);
				border-radius: 8px;
				border: 1px solid var(--background-modifier-border);
			`
		}
	});

	// 添加标题
	authorSection.createEl('h4', {
		text: '👨‍💻 了解作者',
		attr: {
			style: 'margin: 0 0 12px 0; color: var(--text-normal);'
		}
	});

	// 添加描述
	authorSection.createEl('p', {
		text: '想了解更多关于作者和其他项目的信息？',
		attr: {
			style: 'margin: 0 0 16px 0; color: var(--text-muted); font-size: 14px;'
		}
	});

	// 添加按钮
	const authorButton = authorSection.createEl('button', {
		text: '🌐 访问作者主页',
		attr: {
			style: `
				background: var(--color-accent);
				color: var(--text-on-accent);
				border: none;
				padding: 8px 16px;
				border-radius: 6px;
				cursor: pointer;
				font-size: 14px;
				font-weight: 500;
				transition: opacity 0.2s;
			`
		}
	});

	authorButton.addEventListener('click', () => {
		window.open('https://ai.xinqi.life/about', '_blank');
	});

	// 添加悬停效果
	authorButton.addEventListener('mouseenter', () => {
		authorButton.style.opacity = '0.8';
	});

	authorButton.addEventListener('mouseleave', () => {
		authorButton.style.opacity = '1';
	});
}

	private startAutoAuth() {
		console.log('Starting auto auth...');
		console.log('Current settings:', {
			appId: this.plugin.settings.appId,
			appSecret: this.plugin.settings.appSecret ? '***' : 'empty',
			hasUserInfo: !!this.plugin.settings.userInfo
		});

		if (!this.plugin.settings.appId || !this.plugin.settings.appSecret) {
			new Notice('❌ 请先配置 App ID 和 App Secret');
			console.error('Missing App ID or App Secret');
			return;
		}

		// 确保API服务有最新的设置
		this.plugin.feishuApi.updateSettings(this.plugin.settings);
		console.log('Updated API service settings');

		try {
			// 生成授权URL并打开浏览器
			const authUrl = this.plugin.feishuApi.generateAuthUrl();
			console.log('Opening auth URL:', authUrl);

			// 打开浏览器进行授权
			window.open(authUrl, '_blank');

			new Notice('🔄 已打开浏览器进行授权，完成后将自动返回Obsidian');

			// 监听授权成功事件
			const successHandler = () => {
				console.log('Auto auth success event received');
				this.display(); // 刷新设置界面
				window.removeEventListener('feishu-auth-success', successHandler);
			};

			window.addEventListener('feishu-auth-success', successHandler);

		} catch (error) {
			console.error('Auto auth error:', error);
			new Notice(`❌ 自动授权失败: ${error.message}`);
		}
	}

	private startManualAuth() {
		console.log('Starting manual auth...');
		console.log('Current settings:', {
			appId: this.plugin.settings.appId,
			appSecret: this.plugin.settings.appSecret ? '***' : 'empty',
			hasUserInfo: !!this.plugin.settings.userInfo
		});

		if (!this.plugin.settings.appId || !this.plugin.settings.appSecret) {
			new Notice('❌ 请先配置 App ID 和 App Secret');
			console.error('Missing App ID or App Secret');
			return;
		}

		// 确保API服务有最新的设置
		this.plugin.feishuApi.updateSettings(this.plugin.settings);
		console.log('Updated API service settings');

		const modal = new ManualAuthModal(
			this.app,
			this.plugin.feishuApi,
			async () => {
				// 授权成功回调
				console.log('Auth success callback triggered');
				await this.plugin.saveSettings();
				this.display(); // 刷新设置界面
			}
		);
		modal.open();
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
					console.log('📁 Folder selected:', selectedFolder);
					console.log('📁 Folder token:', selectedFolder.folder_token || selectedFolder.token);
					console.log('📁 Folder name:', selectedFolder.name);

					// 兼容两种属性名：folder_token 和 token
					this.plugin.settings.defaultFolderId = selectedFolder.folder_token || selectedFolder.token || '';
					this.plugin.settings.defaultFolderName = selectedFolder.name;
				} else {
					// 用户选择了根目录（我的空间）
					console.log('📁 Root folder selected (我的空间)');
					this.plugin.settings.defaultFolderId = '';
					this.plugin.settings.defaultFolderName = '我的空间';
				}

				await this.plugin.saveSettings();
				console.log('📁 Settings saved:', {
					defaultFolderId: this.plugin.settings.defaultFolderId,
					defaultFolderName: this.plugin.settings.defaultFolderName
				});

				new Notice('✅ 默认文件夹设置已保存');
				this.display(); // 刷新设置界面
			}
		);

		modal.open();
	}
}
