/**
 * Markdown 内容处理器
 * 负责处理 Obsidian 中的 Markdown 内容，使其适合在飞书中显示
 */
export class MarkdownProcessor {
	
	/**
	 * 处理 Markdown 内容
	 * @param content 原始 Markdown 内容
	 * @returns 处理后的 Markdown 内容
	 */
	process(content: string): string {
		let processedContent = content;

		// 1. 处理 Obsidian 特有的双向链接语法
		processedContent = this.processWikiLinks(processedContent);

		// 2. 处理 Obsidian 的块引用
		processedContent = this.processBlockReferences(processedContent);

		// 3. 处理 Obsidian 的标签
		processedContent = this.processTags(processedContent);

		// 4. 处理 Obsidian 的嵌入内容
		processedContent = this.processEmbeds(processedContent);

		// 5. 处理图片链接（确保网络图片链接格式正确）
		processedContent = this.processImages(processedContent);

		// 6. 清理多余的空行
		processedContent = this.cleanupWhitespace(processedContent);

		return processedContent;
	}

	/**
	 * 处理 Obsidian 的双向链接 [[link]] 语法
	 * 将其转换为普通的 Markdown 链接或文本
	 */
	private processWikiLinks(content: string): string {
		// 匹配 [[link]] 或 [[link|display text]] 格式
		return content.replace(/\[\[([^\]|]+)(\|([^\]]+))?\]\]/g, (match, link, _, displayText) => {
			const text = displayText || link;
			// 由于飞书无法处理内部链接，我们将其转换为普通文本
			// 可以考虑添加一个标记，比如 "📝 链接：文件名"
			return `📝 ${text}`;
		});
	}

	/**
	 * 处理 Obsidian 的块引用 ^blockId
	 */
	private processBlockReferences(content: string): string {
		// 移除块引用标记，因为飞书不支持
		return content.replace(/\s*\^[a-zA-Z0-9-]+\s*$/gm, '');
	}

	/**
	 * 处理 Obsidian 的标签 #tag
	 * 保留标签，但确保格式正确
	 */
	private processTags(content: string): string {
		// Obsidian 的标签格式与 Markdown 的标题格式可能冲突
		// 这里我们保持原样，让飞书自行处理
		return content;
	}

	/**
	 * 处理 Obsidian 的嵌入内容 ![[file]]
	 */
	private processEmbeds(content: string): string {
		// 将嵌入语法转换为链接引用
		return content.replace(/!\[\[([^\]]+)\]\]/g, (match, filename) => {
			return `> 📎 嵌入文件：${filename}`;
		});
	}

	/**
	 * 处理图片链接
	 * 确保网络图片链接格式正确，本地图片给出提示
	 */
	private processImages(content: string): string {
		// 处理标准 Markdown 图片语法 ![alt](url)
		content = content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
			// 检查是否为网络链接
			if (this.isNetworkUrl(url)) {
				return match; // 保持原样
			} else {
				// 本地图片，添加提示
				return `> 🖼️ 本地图片：${alt || url} (需要手动上传到飞书)`;
			}
		});

		// 处理 Obsidian 的图片嵌入语法 ![[image.png]]
		content = content.replace(/!\[\[([^\]]+\.(png|jpg|jpeg|gif|svg|webp))\]\]/gi, (match, filename) => {
			return `> 🖼️ 本地图片：${filename} (需要手动上传到飞书)`;
		});

		return content;
	}

	/**
	 * 检查 URL 是否为网络链接
	 */
	private isNetworkUrl(url: string): boolean {
		return /^https?:\/\//.test(url);
	}

	/**
	 * 清理多余的空行和空白字符
	 */
	private cleanupWhitespace(content: string): string {
		// 移除行尾空白
		content = content.replace(/[ \t]+$/gm, '');
		
		// 将多个连续空行合并为最多两个空行
		content = content.replace(/\n{3,}/g, '\n\n');
		
		// 移除开头和结尾的空行
		content = content.trim();
		
		return content;
	}

	/**
	 * 验证处理后的内容
	 * @param content 处理后的内容
	 * @returns 验证结果和错误信息
	 */
	validate(content: string): { valid: boolean; error?: string } {
		// 检查内容长度
		if (content.length === 0) {
			return { valid: false, error: '文档内容不能为空' };
		}

		// 检查内容大小（假设每个字符平均 2 字节）
		const estimatedSize = content.length * 2;
		const maxSize = 10 * 1024 * 1024; // 10MB
		if (estimatedSize > maxSize) {
			return { valid: false, error: '文档内容过大，请减少内容后重试' };
		}

		return { valid: true };
	}

	/**
	 * 提取文档摘要（用于预览）
	 * @param content Markdown 内容
	 * @param maxLength 最大长度
	 * @returns 摘要文本
	 */
	extractSummary(content: string, maxLength: number = 200): string {
		// 移除 Markdown 格式标记
		let summary = content
			.replace(/#{1,6}\s+/g, '') // 移除标题标记
			.replace(/\*\*([^*]+)\*\*/g, '$1') // 移除粗体标记
			.replace(/\*([^*]+)\*/g, '$1') // 移除斜体标记
			.replace(/`([^`]+)`/g, '$1') // 移除行内代码标记
			.replace(/```[\s\S]*?```/g, '[代码块]') // 替换代码块
			.replace(/!\[([^\]]*)\]\([^)]+\)/g, '[图片: $1]') // 替换图片
			.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 移除链接格式，保留文本
			.replace(/\n+/g, ' ') // 将换行替换为空格
			.trim();

		// 截断到指定长度
		if (summary.length > maxLength) {
			summary = summary.substring(0, maxLength) + '...';
		}

		return summary;
	}
}
