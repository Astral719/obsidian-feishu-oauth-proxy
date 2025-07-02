import { App, Modal, Setting, Notice } from 'obsidian';
import { FEISHU_CONFIG } from './constants';

/**
 * 手动授权模态框
 */
export class ManualAuthModal extends Modal {
	private onComplete: (code: string) => void;
	private authUrl: string;

	constructor(app: App, authUrl: string, onComplete: (code: string) => void) {
		super(app);
		this.authUrl = authUrl;
		this.onComplete = onComplete;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		// 设置标题
		contentEl.createEl('h2', { text: '飞书授权' });

		// 说明文字
		const descEl = contentEl.createDiv('auth-description');
		descEl.style.cssText = `
			margin: 20px 0;
			padding: 15px;
			background: var(--background-secondary);
			border-radius: 8px;
			line-height: 1.6;
		`;
		descEl.innerHTML = `
			<p><strong>🚀 简化授权流程 - 只需复制粘贴URL：</strong></p>
			<ol>
				<li>点击下方的"打开授权页面"按钮</li>
				<li>在弹出的飞书页面中登录并确认授权</li>
				<li>授权成功后，会跳转到一个显示"✅ 授权成功！"的页面</li>
				<li><strong>复制浏览器地址栏的完整URL</strong>（包含 code= 参数）</li>
				<li>将完整URL粘贴到下方输入框中</li>
				<li>点击"完成授权"按钮</li>
			</ol>
			<div style="background: var(--background-modifier-success); padding: 10px; border-radius: 4px; margin-top: 10px;">
				<strong>💡 提示：</strong>无需手动提取授权码，直接复制完整的回调URL即可！
			</div>
		`;

		// 授权链接按钮
		const linkContainer = contentEl.createDiv('auth-link-container');
		linkContainer.style.cssText = `
			text-align: center;
			margin: 20px 0;
		`;

		const authButton = linkContainer.createEl('button', {
			text: '🔗 打开授权页面',
			cls: 'mod-cta'
		});
		authButton.style.cssText = `
			padding: 12px 24px;
			font-size: 16px;
		`;
		authButton.addEventListener('click', () => {
			window.open(this.authUrl, '_blank');
		});

		// 复制链接按钮
		const copyButton = linkContainer.createEl('button', {
			text: '📋 复制授权链接',
		});
		copyButton.style.cssText = `
			margin-left: 10px;
			padding: 12px 24px;
		`;
		copyButton.addEventListener('click', () => {
			navigator.clipboard.writeText(this.authUrl);
			new Notice('授权链接已复制到剪贴板');
		});

		// 授权码输入
		const inputContainer = contentEl.createDiv('auth-input-container');
		inputContainer.style.cssText = `
			margin: 20px 0;
		`;

		const inputLabel = inputContainer.createEl('label', {
			text: '回调URL：'
		});
		inputLabel.style.cssText = `
			display: block;
			margin-bottom: 8px;
			font-weight: bold;
		`;

		const codeInput = inputContainer.createEl('input', {
			type: 'text',
			placeholder: '请粘贴完整的回调URL（包含code参数）'
		});
		codeInput.style.cssText = `
			width: 100%;
			padding: 10px;
			border: 1px solid var(--background-modifier-border);
			border-radius: 4px;
			font-family: monospace;
			font-size: 12px;
		`;

		// 示例说明
		const exampleEl = inputContainer.createDiv('auth-example');
		exampleEl.style.cssText = `
			margin-top: 8px;
			font-size: 12px;
			color: var(--text-muted);
		`;
		exampleEl.innerHTML = `
			<strong>示例URL：</strong><br>
			<code>https://httpbin.org/get?code=abc123def456&state=xyz789</code><br>
			<strong>💡 直接复制粘贴即可，无需手动提取授权码！</strong>
		`;

		// 按钮容器
		const buttonContainer = contentEl.createDiv('modal-button-container');
		buttonContainer.style.cssText = `
			display: flex;
			justify-content: space-between;
			margin-top: 30px;
		`;

		// 完成授权按钮
		const completeButton = buttonContainer.createEl('button', {
			text: '✅ 完成授权',
			cls: 'mod-cta'
		});
		completeButton.addEventListener('click', () => {
			const code = codeInput.value.trim();
			if (!code) {
				new Notice('请输入授权码');
				return;
			}
			
			// 验证授权码格式（基本检查）
			if (code.length < 10) {
				new Notice('授权码格式不正确，请检查后重试');
				return;
			}

			this.onComplete(code);
			this.close();
		});

		// 取消按钮
		const cancelButton = buttonContainer.createEl('button', {
			text: '取消'
		});
		cancelButton.addEventListener('click', () => {
			this.close();
		});

		// 自动聚焦到输入框
		setTimeout(() => {
			codeInput.focus();
		}, 100);

		// 支持回车键提交
		codeInput.addEventListener('keypress', (e) => {
			if (e.key === 'Enter') {
				completeButton.click();
			}
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
