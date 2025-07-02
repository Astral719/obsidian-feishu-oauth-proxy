# Obsidian 核心 API 使用指南

## 📚 API 概述

本指南基于飞书分享插件的实际开发经验，总结了 Obsidian 插件开发中最常用和最重要的核心 API。

## 1. 插件基础结构

### 1.1 插件主类
```typescript
import { Plugin } from 'obsidian';

export default class YourPlugin extends Plugin {
    async onload() {
        console.log('Loading plugin...');
        // 插件加载逻辑
    }

    onunload() {
        console.log('Unloading plugin...');
        // 插件卸载逻辑
    }
}
```

### 1.2 插件生命周期
- **onload()**: 插件启用时调用，用于初始化
- **onunload()**: 插件禁用时调用，用于清理资源

## 2. 网络请求 API ⭐ 重点

### 2.1 requestUrl - 核心网络API
```typescript
import { requestUrl } from 'obsidian';

// GET 请求
const response = await requestUrl({
    url: 'https://api.example.com/data',
    method: 'GET',
    headers: {
        'Authorization': 'Bearer token',
        'Content-Type': 'application/json'
    }
});

// POST 请求
const postResponse = await requestUrl({
    url: 'https://api.example.com/upload',
    method: 'POST',
    headers: {
        'Authorization': 'Bearer token',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ data: 'example' })
});

// 文件上传 (multipart/form-data)
const fileUpload = await requestUrl({
    url: 'https://api.example.com/upload',
    method: 'POST',
    headers: {
        'Authorization': 'Bearer token',
        'Content-Type': 'multipart/form-data; boundary=---7MA4YWxkTrZu0gW'
    },
    body: formDataBuffer // ArrayBuffer
});
```

### 2.2 响应处理
```typescript
// 处理响应
const data = response.json || JSON.parse(response.text);
console.log('Status:', response.status);
console.log('Headers:', response.headers);
console.log('Data:', data);

// 错误处理
try {
    const response = await requestUrl({ url: 'https://api.example.com' });
    if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: ${response.text}`);
    }
} catch (error) {
    console.error('Request failed:', error);
}
```

## 3. 文件系统 API

### 3.1 文件读取
```typescript
// 读取当前活动文件
const activeFile = this.app.workspace.getActiveFile();
if (activeFile) {
    const content = await this.app.vault.read(activeFile);
    console.log('File content:', content);
}

// 读取指定文件
const file = this.app.vault.getAbstractFileByPath('path/to/file.md');
if (file instanceof TFile) {
    const content = await this.app.vault.read(file);
}
```

### 3.2 文件写入和创建
```typescript
// 创建新文件
const newFile = await this.app.vault.create('new-file.md', 'File content');

// 修改现有文件
await this.app.vault.modify(file, 'New content');

// 删除文件
await this.app.vault.delete(file);
```

### 3.3 文件监听
```typescript
// 监听文件变化
this.registerEvent(
    this.app.vault.on('modify', (file) => {
        console.log('File modified:', file.path);
    })
);

// 监听文件创建
this.registerEvent(
    this.app.vault.on('create', (file) => {
        console.log('File created:', file.path);
    })
);
```

## 4. UI 组件 API

### 4.1 Notice 通知组件
```typescript
import { Notice } from 'obsidian';

// 基础通知
new Notice('操作成功！');

// 自定义持续时间 (毫秒)
new Notice('这条消息显示10秒', 10000);

// 自定义样式的通知
const notice = new Notice('', 0); // 持续时间为0表示不自动消失
notice.noticeEl.innerHTML = `
    <div style="color: green;">
        ✅ 操作成功！
    </div>
`;
```

### 4.2 Modal 模态框
```typescript
import { Modal, App } from 'obsidian';

class CustomModal extends Modal {
    constructor(app: App) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: '标题' });
        contentEl.createEl('p', { text: '内容' });
        
        // 添加按钮
        const button = contentEl.createEl('button', { text: '确定' });
        button.onclick = () => {
            this.close();
        };
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

// 使用模态框
const modal = new CustomModal(this.app);
modal.open();
```

### 4.3 Setting 设置页面
```typescript
import { PluginSettingTab, Setting } from 'obsidian';

class SettingTab extends PluginSettingTab {
    plugin: YourPlugin;

    constructor(app: App, plugin: YourPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        // 文本输入设置
        new Setting(containerEl)
            .setName('API Key')
            .setDesc('输入你的API密钥')
            .addText(text => text
                .setPlaceholder('输入API Key')
                .setValue(this.plugin.settings.apiKey)
                .onChange(async (value) => {
                    this.plugin.settings.apiKey = value;
                    await this.plugin.saveSettings();
                }));

        // 按钮设置
        new Setting(containerEl)
            .setName('测试连接')
            .setDesc('测试API连接是否正常')
            .addButton(button => button
                .setButtonText('测试')
                .setCta()
                .onClick(async () => {
                    // 测试逻辑
                }));
    }
}
```

## 5. 命令和菜单 API

### 5.1 注册命令
```typescript
// 注册编辑器命令
this.addCommand({
    id: 'share-current-note',
    name: '分享当前笔记',
    editorCallback: (editor, view) => {
        // 命令执行逻辑
        this.shareCurrentNote();
    }
});

// 注册全局命令
this.addCommand({
    id: 'open-settings',
    name: '打开设置',
    callback: () => {
        // 命令执行逻辑
    }
});
```

### 5.2 右键菜单
```typescript
// 文件菜单
this.registerEvent(
    this.app.workspace.on('file-menu', (menu, file) => {
        if (file instanceof TFile && file.extension === 'md') {
            menu.addItem((item) => {
                item.setTitle('分享到飞书')
                    .setIcon('share')
                    .onClick(() => {
                        this.shareFile(file);
                    });
            });
        }
    })
);

// 编辑器菜单
this.registerEvent(
    this.app.workspace.on('editor-menu', (menu, editor, view) => {
        menu.addItem((item) => {
            item.setTitle('分享选中内容')
                .setIcon('share')
                .onClick(() => {
                    const selection = editor.getSelection();
                    this.shareContent(selection);
                });
        });
    })
);
```

## 6. 设置管理 API

### 6.1 设置接口定义
```typescript
interface PluginSettings {
    apiKey: string;
    defaultFolder: string;
    autoSync: boolean;
}

const DEFAULT_SETTINGS: PluginSettings = {
    apiKey: '',
    defaultFolder: '',
    autoSync: false
};
```

### 6.2 设置加载和保存
```typescript
export default class YourPlugin extends Plugin {
    settings: PluginSettings;

    async onload() {
        await this.loadSettings();
        
        // 添加设置页面
        this.addSettingTab(new SettingTab(this.app, this));
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
```

## 7. 协议处理 API

### 7.1 注册自定义协议
```typescript
// 注册协议处理器
this.registerObsidianProtocolHandler('your-plugin', (params) => {
    console.log('Received protocol call:', params);
    // 处理协议调用
    this.handleProtocolCall(params);
});

// 协议调用示例: obsidian://your-plugin?action=share&file=note.md
```

## 8. 常用工具函数

### 8.1 文件路径处理
```typescript
import { normalizePath } from 'obsidian';

// 标准化路径
const normalizedPath = normalizePath('folder/subfolder/file.md');

// 获取文件扩展名
const extension = file.extension; // 'md'

// 获取文件名（不含扩展名）
const basename = file.basename; // 'filename'
```

### 8.2 时间处理
```typescript
// 获取当前时间戳
const timestamp = Date.now();

// 格式化日期
const date = new Date();
const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
```

## 9. 错误处理最佳实践

### 9.1 统一错误处理
```typescript
async function safeApiCall<T>(apiCall: () => Promise<T>): Promise<T | null> {
    try {
        return await apiCall();
    } catch (error) {
        console.error('API call failed:', error);
        new Notice(`操作失败: ${error.message}`);
        return null;
    }
}

// 使用示例
const result = await safeApiCall(() => 
    requestUrl({ url: 'https://api.example.com' })
);
```

### 9.2 用户友好的错误提示
```typescript
function handleError(error: Error, context: string) {
    console.error(`${context} error:`, error);
    
    // 根据错误类型提供不同的用户提示
    if (error.message.includes('network')) {
        new Notice('网络连接失败，请检查网络设置');
    } else if (error.message.includes('auth')) {
        new Notice('认证失败，请检查API密钥');
    } else {
        new Notice(`${context}失败: ${error.message}`);
    }
}
```

---

**指南版本：** v1.0.0  
**最后更新：** 2025-06-27  
**基于经验：** 飞书分享插件开发实践  
**适用版本：** Obsidian 0.15.0+
