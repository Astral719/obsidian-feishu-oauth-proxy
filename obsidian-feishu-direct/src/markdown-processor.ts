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

		// 处理各种 Obsidian 特有语法
		processedContent = this.processWikiLinks(processedContent);
		processedContent = this.processBlockReferences(processedContent);
		processedContent = this.processTags(processedContent);
		processedContent = this.processEmbeds(processedContent);
		processedContent = this.processImages(processedContent);
		processedContent = this.cleanupWhitespace(processedContent);

		return processedContent;
	}

	/**
	 * 处理 Wiki 链接 [[link]]
	 */
	private processWikiLinks(content: string): string {
		// 匹配 [[link]] 或 [[link|display]]
		return content.replace(/\[\[([^\]|]+)(\|([^\]]+))?\]\]/g, (match, link, _, display) => {
			const displayText = display || link;
			return `📝 ${displayText}`;
		});
	}

	/**
	 * 处理块引用 [[file#^block]]
	 */
	private processBlockReferences(content: string): string {
		// 匹配块引用
		return content.replace(/\[\[([^#\]]+)#\^([^\]]+)\]\]/g, (match, file, block) => {
			return `📝 ${file} (块引用: ${block})`;
		});
	}

	/**
	 * 处理标签 #tag
	 */
	private processTags(content: string): string {
		// 保持标签原样，但确保格式正确
		return content.replace(/#([a-zA-Z0-9_\u4e00-\u9fff]+)/g, (match, tag) => {
			return `#${tag}`;
		});
	}

	/**
	 * 处理嵌入内容 ![[file]]
	 */
	private processEmbeds(content: string): string {
		// 匹配嵌入语法
		return content.replace(/!\[\[([^\]]+)\]\]/g, (match, file) => {
			return `📎 嵌入文件：${file}`;
		});
	}

	/**
	 * 处理图片链接
	 */
	private processImages(content: string): string {
		// 处理本地图片路径，转换为提示文本
		return content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
			// 如果是网络图片，保持原样
			if (src.startsWith('http://') || src.startsWith('https://')) {
				return match;
			}
			
			// 如果是本地图片，转换为提示
			const altText = alt || '图片';
			return `🖼️ ${altText} (本地图片: ${src})`;
		});
	}

	/**
	 * 清理多余的空白字符
	 */
	private cleanupWhitespace(content: string): string {
		// 移除多余的空行（超过2个连续换行）
		content = content.replace(/\n{3,}/g, '\n\n');
		
		// 移除行尾空格
		content = content.replace(/[ \t]+$/gm, '');
		
		// 确保文件末尾有且仅有一个换行
		content = content.replace(/\s+$/, '\n');
		
		return content;
	}

	/**
	 * 处理 Obsidian 特有的代码块语法
	 */
	private processCodeBlocks(content: string): string {
		// 处理带有 Obsidian 插件的代码块
		return content.replace(/```(\w+)[\s\S]*?```/g, (match) => {
			// 保持代码块原样，但可以在这里添加特殊处理
			return match;
		});
	}

	/**
	 * 处理数学公式
	 */
	private processMathFormulas(content: string): string {
		// 处理行内数学公式 $formula$
		content = content.replace(/\$([^$]+)\$/g, (match, formula) => {
			return `📐 数学公式: ${formula}`;
		});

		// 处理块级数学公式 $$formula$$
		content = content.replace(/\$\$([^$]+)\$\$/g, (match, formula) => {
			return `\n📐 数学公式块:\n${formula}\n`;
		});

		return content;
	}

	/**
	 * 处理 Obsidian 的高亮语法
	 */
	private processHighlights(content: string): string {
		// 处理高亮 ==text==
		return content.replace(/==([^=]+)==/g, (match, text) => {
			return `**${text}**`; // 转换为粗体
		});
	}

	/**
	 * 完整处理（包含所有功能）
	 */
	processComplete(content: string): string {
		let processedContent = content;

		// 按顺序处理各种语法
		processedContent = this.processWikiLinks(processedContent);
		processedContent = this.processBlockReferences(processedContent);
		processedContent = this.processEmbeds(processedContent);
		processedContent = this.processImages(processedContent);
		processedContent = this.processTags(processedContent);
		processedContent = this.processHighlights(processedContent);
		processedContent = this.processMathFormulas(processedContent);
		processedContent = this.processCodeBlocks(processedContent);
		processedContent = this.cleanupWhitespace(processedContent);

		return processedContent;
	}
}
