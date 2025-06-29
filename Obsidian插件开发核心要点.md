# Obsidian 插件开发核心要点

*基于飞书分享插件成功开发经验总结*

## 🎯 关键API (必须掌握)

### 1. 网络请求 - requestUrl
```typescript
import { requestUrl } from 'obsidian';

// 解决CORS问题的核心API
const response = await requestUrl({
    url: 'https://api.example.com',
    method: 'POST',
    headers: { 'Authorization': 'Bearer token' },
    body: JSON.stringify(data)
});
```

### 2. 文件操作
```typescript
// 读取当前文件
const activeFile = this.app.workspace.getActiveFile();
const content = await this.app.vault.read(activeFile);

// 设置管理
await this.loadData(); // 加载设置
await this.saveData(settings); // 保存设置
```

### 3. UI组件
```typescript
// 通知
new Notice('操作成功！');

// 设置页面
new Setting(containerEl)
    .setName('API Key')
    .addText(text => text.onChange(async (value) => {
        this.settings.apiKey = value;
        await this.saveSettings();
    }));
```

## 📋 发布检查清单 (关键点)

### 必需文件
- [ ] **main.js** - 插件主文件
- [ ] **manifest.json** - 不能包含"Obsidian"字样 ⚠️
- [ ] **versions.json** - 版本兼容性
- [ ] **README.md** - 功能说明
- [ ] **LICENSE** - 许可证文件

### manifest.json 模板
```json
{
  "id": "plugin-id",
  "name": "插件名称",
  "version": "1.0.0",
  "minAppVersion": "0.15.0",
  "description": "插件描述（不包含Obsidian字样）",
  "author": "作者名称"
}
```

### 社区提交PR模板
```markdown
# I am submitting a new Community Plugin

## Repo URL
Link to my plugin: https://github.com/username/repo

## Release Checklist
- [x] I have tested the plugin on
  - [x] Windows
  - [x] macOS
- [x] My GitHub release contains all required files
  - [x] main.js
  - [x] manifest.json
- [x] GitHub release name matches the exact version number
- [x] The id in my manifest.json matches the id in community-plugins.json
- [x] My README.md describes the plugin's purpose
- [x] I have added a license in the LICENSE file
```

## ⚠️ 常见陷阱

1. **CORS问题** - 使用 `requestUrl` 而不是 `fetch`
2. **manifest.json包含"Obsidian"** - 自动检查会失败
3. **版本号不匹配** - Release名称必须与manifest.json一致
4. **PR模板格式错误** - 必须严格按照官方模板

## 🚀 开发流程

1. **技术验证** - 先用PoC验证核心API可行性
2. **MVP开发** - 实现核心功能，快速迭代
3. **错误处理** - 完善用户体验和异常处理
4. **发布准备** - 检查清单 + 文档完善
5. **社区提交** - 官方PR模板 + 等待审核

## 💡 成功关键

- **提前验证技术可行性** - 避免走错路线
- **使用正确的API** - `requestUrl`解决CORS
- **严格遵循发布规范** - 避免审核失败
- **完善错误处理** - 提升用户体验

---

**核心要点版本：** v1.0.0  
**基于项目：** 飞书分享插件 (12小时开发，一次通过审核)  
**适用场景：** 快速上手Obsidian插件开发
