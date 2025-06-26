import { App, Modal, Setting, Notice } from 'obsidian';
import { FeishuFolder } from './types';
import { FeishuApiService } from './feishu-api';

/**
 * 文件夹选择模态框
 */
export class FolderSelectModal extends Modal {
	private feishuApi: FeishuApiService;
	private onSelect: (folder: FeishuFolder | null) => void;
	private folders: FeishuFolder[] = [];
	private currentPath: FeishuFolder[] = [];
	private loading = false;

	constructor(
		app: App, 
		feishuApi: FeishuApiService, 
		onSelect: (folder: FeishuFolder | null) => void
	) {
		super(app);
		this.feishuApi = feishuApi;
		this.onSelect = onSelect;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		// 设置标题
		contentEl.createEl('h2', { text: '选择飞书文件夹' });

		// 创建面包屑导航
		this.createBreadcrumb(contentEl);

		// 创建文件夹列表容器
		const listContainer = contentEl.createDiv('folder-list-container');
		listContainer.style.cssText = `
			max-height: 400px;
			overflow-y: auto;
			border: 1px solid var(--background-modifier-border);
			border-radius: 4px;
			margin: 10px 0;
		`;

		// 创建按钮容器
		const buttonContainer = contentEl.createDiv('modal-button-container');
		buttonContainer.style.cssText = `
			display: flex;
			justify-content: space-between;
			margin-top: 20px;
		`;

		// 选择当前文件夹按钮
		const selectCurrentButton = buttonContainer.createEl('button', {
			text: '选择当前文件夹',
			cls: 'mod-cta'
		});
		selectCurrentButton.addEventListener('click', () => {
			const currentFolder = this.currentPath.length > 0 
				? this.currentPath[this.currentPath.length - 1] 
				: null;
			this.onSelect(currentFolder);
			this.close();
		});

		// 取消按钮
		const cancelButton = buttonContainer.createEl('button', {
			text: '取消'
		});
		cancelButton.addEventListener('click', () => {
			this.close();
		});

		// 加载根目录文件夹
		this.loadFolders(listContainer);
	}

	/**
	 * 创建面包屑导航
	 */
	private createBreadcrumb(containerEl: HTMLElement) {
		const breadcrumbEl = containerEl.createDiv('folder-breadcrumb');
		breadcrumbEl.style.cssText = `
			padding: 12px;
			background: var(--background-secondary);
			border-radius: 6px;
			margin-bottom: 12px;
			font-size: 14px;
			border: 1px solid var(--background-modifier-border);
			display: flex;
			align-items: center;
			flex-wrap: wrap;
			gap: 4px;
		`;

		// 根目录
		const rootEl = breadcrumbEl.createEl('span', {
			text: '🏠 我的空间',
			cls: 'breadcrumb-item'
		});
		rootEl.style.cssText = `
			cursor: pointer;
			color: var(--text-accent);
			padding: 4px 8px;
			border-radius: 4px;
			transition: background-color 0.2s;
		`;
		rootEl.addEventListener('click', () => {
			this.navigateToRoot();
		});
		rootEl.addEventListener('mouseenter', () => {
			rootEl.style.backgroundColor = 'var(--background-modifier-hover)';
		});
		rootEl.addEventListener('mouseleave', () => {
			rootEl.style.backgroundColor = '';
		});

		// 去重并优化当前路径显示
		const uniquePath = this.getUniquePath();

		// 当前路径
		uniquePath.forEach((folder, index) => {
			// 分隔符
			const separatorEl = breadcrumbEl.createEl('span', { text: '›' });
			separatorEl.style.cssText = `
				color: var(--text-muted);
				margin: 0 4px;
				font-weight: bold;
			`;

			const folderEl = breadcrumbEl.createEl('span', {
				text: `📁 ${folder.name}`,
				cls: 'breadcrumb-item'
			});

			if (index < uniquePath.length - 1) {
				// 可点击的路径项
				folderEl.style.cssText = `
					cursor: pointer;
					color: var(--text-accent);
					padding: 4px 8px;
					border-radius: 4px;
					transition: background-color 0.2s;
				`;
				folderEl.addEventListener('click', () => {
					this.navigateToUniqueFolder(index);
				});
				folderEl.addEventListener('mouseenter', () => {
					folderEl.style.backgroundColor = 'var(--background-modifier-hover)';
				});
				folderEl.addEventListener('mouseleave', () => {
					folderEl.style.backgroundColor = '';
				});
			} else {
				// 当前文件夹（不可点击）
				folderEl.style.cssText = `
					color: var(--text-normal);
					padding: 4px 8px;
					border-radius: 4px;
					background: var(--background-modifier-border);
					font-weight: 500;
				`;
			}
		});
	}

	/**
	 * 获取去重后的路径
	 */
	private getUniquePath(): FeishuFolder[] {
		const uniquePath: FeishuFolder[] = [];
		const seenTokens = new Set<string>();

		for (const folder of this.currentPath) {
			if (!seenTokens.has(folder.folder_token)) {
				seenTokens.add(folder.folder_token);
				uniquePath.push(folder);
			}
		}

		return uniquePath;
	}

	/**
	 * 导航到去重路径中的指定文件夹
	 */
	private async navigateToUniqueFolder(index: number) {
		const uniquePath = this.getUniquePath();
		if (index >= 0 && index < uniquePath.length) {
			// 重建路径到指定位置
			this.currentPath = uniquePath.slice(0, index + 1);

			// 重新创建面包屑
			const breadcrumbEl = this.contentEl.querySelector('.folder-breadcrumb');
			if (breadcrumbEl) {
				breadcrumbEl.remove();
				this.createBreadcrumb(this.contentEl);
			}

			// 重新加载文件夹列表
			const listContainer = this.contentEl.querySelector('.folder-list-container') as HTMLElement;
			if (listContainer) {
				await this.loadFolders(listContainer);
			}
		}
	}

	/**
	 * 加载文件夹列表
	 */
	private async loadFolders(containerEl: HTMLElement) {
		if (this.loading) return;

		this.loading = true;
		containerEl.empty();

		// 显示加载状态
		const loadingEl = containerEl.createDiv('loading-indicator');
		loadingEl.textContent = '正在加载文件夹...';
		loadingEl.style.cssText = `
			text-align: center;
			padding: 20px;
			color: var(--text-muted);
		`;

		try {
			const parentFolderId = this.currentPath.length > 0 
				? this.currentPath[this.currentPath.length - 1].folder_token 
				: undefined;

			const response = await this.feishuApi.getFolderList(parentFolderId);
			this.folders = response.data.folders;

			// 清除加载状态
			containerEl.empty();

			// 显示文件夹列表
			this.renderFolderList(containerEl);

		} catch (error) {
			console.error('Load folders error:', error);
			containerEl.empty();
			
			const errorEl = containerEl.createDiv('error-message');
			errorEl.textContent = `加载失败：${error.message}`;
			errorEl.style.cssText = `
				text-align: center;
				padding: 20px;
				color: var(--text-error);
			`;

			// 重试按钮
			const retryButton = containerEl.createEl('button', {
				text: '重试'
			});
			retryButton.style.cssText = `
				display: block;
				margin: 10px auto;
			`;
			retryButton.addEventListener('click', () => {
				this.loadFolders(containerEl);
			});
		}

		this.loading = false;
	}

	/**
	 * 渲染文件夹列表
	 */
	private renderFolderList(containerEl: HTMLElement) {
		if (this.folders.length === 0) {
			const emptyEl = containerEl.createDiv('empty-message');
			emptyEl.textContent = '此文件夹为空';
			emptyEl.style.cssText = `
				text-align: center;
				padding: 20px;
				color: var(--text-muted);
			`;
			return;
		}

		this.folders.forEach(folder => {
			const folderEl = containerEl.createDiv('folder-item');
			folderEl.style.cssText = `
				padding: 10px;
				border-bottom: 1px solid var(--background-modifier-border);
				cursor: pointer;
				display: flex;
				align-items: center;
				transition: background-color 0.2s;
			`;

			// 文件夹图标
			const iconEl = folderEl.createEl('span', { text: '📁' });
			iconEl.style.marginRight = '10px';

			// 文件夹名称
			const nameEl = folderEl.createEl('span', { text: folder.name });
			nameEl.style.flex = '1';

			// 进入箭头
			const arrowEl = folderEl.createEl('span', { text: '→' });
			arrowEl.style.cssText = `
				color: var(--text-muted);
				margin-left: 10px;
			`;

			// 悬停效果
			folderEl.addEventListener('mouseenter', () => {
				folderEl.style.backgroundColor = 'var(--background-modifier-hover)';
			});
			folderEl.addEventListener('mouseleave', () => {
				folderEl.style.backgroundColor = '';
			});

			// 点击进入文件夹
			folderEl.addEventListener('click', () => {
				this.enterFolder(folder);
			});
		});
	}

	/**
	 * 进入文件夹
	 */
	private async enterFolder(folder: FeishuFolder) {
		// 检查是否已经在当前路径中，避免重复添加
		const existingIndex = this.currentPath.findIndex(f => f.folder_token === folder.folder_token);

		if (existingIndex >= 0) {
			// 如果文件夹已存在，截断到该位置
			this.currentPath = this.currentPath.slice(0, existingIndex + 1);
		} else {
			// 如果文件夹不存在，添加到路径末尾
			this.currentPath.push(folder);
		}

		// 重新创建面包屑
		const breadcrumbEl = this.contentEl.querySelector('.folder-breadcrumb');
		if (breadcrumbEl) {
			breadcrumbEl.remove();
			this.createBreadcrumb(this.contentEl);
		}

		// 重新加载文件夹列表
		const listContainer = this.contentEl.querySelector('.folder-list-container') as HTMLElement;
		if (listContainer) {
			await this.loadFolders(listContainer);
		}
	}

	/**
	 * 导航到根目录
	 */
	private async navigateToRoot() {
		this.currentPath = [];
		
		// 重新创建面包屑
		const breadcrumbEl = this.contentEl.querySelector('.folder-breadcrumb');
		if (breadcrumbEl) {
			breadcrumbEl.remove();
			this.createBreadcrumb(this.contentEl);
		}

		// 重新加载文件夹列表
		const listContainer = this.contentEl.querySelector('.folder-list-container') as HTMLElement;
		if (listContainer) {
			await this.loadFolders(listContainer);
		}
	}

	/**
	 * 导航到指定层级的文件夹
	 */
	private async navigateToFolder(index: number) {
		this.currentPath = this.currentPath.slice(0, index + 1);
		
		// 重新创建面包屑
		const breadcrumbEl = this.contentEl.querySelector('.folder-breadcrumb');
		if (breadcrumbEl) {
			breadcrumbEl.remove();
			this.createBreadcrumb(this.contentEl);
		}

		// 重新加载文件夹列表
		const listContainer = this.contentEl.querySelector('.folder-list-container') as HTMLElement;
		if (listContainer) {
			await this.loadFolders(listContainer);
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
