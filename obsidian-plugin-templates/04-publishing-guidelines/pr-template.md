# Obsidian 插件社区提交 PR 模板

## 📝 官方 PR 模板

**重要提醒：** 必须严格按照官方模板格式提交，任何格式偏差都可能导致自动化检查失败。

### 标准 PR 模板内容

```markdown
# I am submitting a new Community Plugin

## Repo URL
Link to my plugin: https://github.com/[username]/[repository-name]

## Release Checklist
- [ ] I have tested the plugin on
  - [ ] Windows
  - [ ] macOS
  - [ ] Linux
  - [ ] Android _(if applicable)_
  - [ ] iOS _(if applicable)_
- [ ] My GitHub release contains all required files (as individual files, not just in the source.zip / source.tar.gz)
  - [ ] `main.js`
  - [ ] `manifest.json`
  - [ ] `styles.css` _(optional)_
- [ ] GitHub release name matches the exact version number specified in my manifest.json (***Note:** Use the exact version number, don't include a prefix `v`*)
- [ ] The `id` in my `manifest.json` matches the `id` in the `community-plugins.json` file.
- [ ] My README.md describes the plugin's purpose and provides clear usage instructions.
- [ ] I have read the developer policies at https://docs.obsidian.md/Developer+policies, and have assessed my plugins's adherence to these policies.
- [ ] I have read the tips in https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines and have self-reviewed my plugin to avoid these common pitfalls.
- [ ] I have added a license in the LICENSE file.
- [ ] My project respects and is compatible with the original license of any code from other plugins that I'm using. I have given proper attribution to these other projects in my `README.md`.
```

## 📋 PR 提交步骤详解

### 步骤 1: 准备工作
1. **确保插件已发布**
   - GitHub Release 已创建
   - 版本号格式正确 (如: `1.0.0`，不带 `v` 前缀)
   - 必需文件已上传 (main.js, manifest.json, versions.json)

2. **Fork 官方仓库**
   ```bash
   # Fork https://github.com/obsidianmd/obsidian-releases
   git clone https://github.com/[your-username]/obsidian-releases.git
   cd obsidian-releases
   ```

### 步骤 2: 修改 community-plugins.json
```json
{
  "id": "your-plugin-id",
  "name": "插件名称",
  "author": "作者名称",
  "description": "插件描述（不包含 Obsidian 字样）",
  "repo": "username/repository-name"
}
```

**注意事项：**
- `id` 必须与 manifest.json 中的 id 完全一致
- `name` 不能包含 "Obsidian" 字样
- `description` 不能包含 "Obsidian" 字样
- `repo` 格式为 `username/repository-name`

### 步骤 3: 创建 Pull Request
1. **提交更改**
   ```bash
   git add community-plugins.json
   git commit -m "Add [plugin-name] plugin"
   git push origin main
   ```

2. **创建 PR**
   - 访问你的 Fork 仓库
   - 点击 "Create Pull Request"
   - 使用上面的官方模板填写 PR 描述

### 步骤 4: 填写检查清单
逐项检查并勾选所有适用的项目：

#### 平台测试
- **Windows**: 必须测试
- **macOS**: 必须测试  
- **Linux**: 推荐测试
- **Android/iOS**: 仅当插件支持移动端时

#### 文件检查
- **main.js**: 必须存在
- **manifest.json**: 必须存在
- **styles.css**: 可选，如果有自定义样式

#### 版本检查
- Release 名称必须与 manifest.json 中的版本号完全一致
- 不能包含 `v` 前缀

#### 文档检查
- README.md 必须包含插件用途和使用说明
- LICENSE 文件必须存在

## 🚨 常见错误和解决方案

### 错误 1: "You did not follow the pull request template"
**原因：** PR 描述格式不符合官方模板
**解决：** 完全按照官方模板格式重写 PR 描述

### 错误 2: "Failed to validate plugin"
**可能原因：**
- manifest.json 包含 "Obsidian" 字样
- 版本号不匹配
- 必需文件缺失
- JSON 格式错误

**解决步骤：**
1. 检查 manifest.json 中的 name 和 description
2. 确认版本号匹配
3. 验证所有文件都已上传
4. 使用 JSON 验证器检查格式

### 错误 3: "Release URL not found"
**原因：** Release 不存在或 URL 错误
**解决：** 确认 GitHub Release 已正确创建并公开

## 📊 PR 状态说明

### 自动化检查状态
- **✅ All checks have passed**: 所有检查通过，等待人工审核
- **❌ Validation failed**: 验证失败，需要修复问题
- **🟡 Pending**: 检查进行中

### 标签说明
- **Ready for review**: 准备好人工审核
- **Validation failed**: 自动化验证失败
- **Changes requested**: 需要修改

## 🔄 修复问题后的更新流程

1. **修复问题**
   - 更新 GitHub Release
   - 修复 manifest.json 问题
   - 重新上传文件

2. **触发重新检查**
   - 编辑 PR 描述 (添加空格或换行)
   - 或关闭并重新打开 PR
   - 或推送新的提交到 PR 分支

3. **等待检查结果**
   - 自动化检查通常在 5-10 分钟内完成
   - 检查通过后会显示绿色勾选

## 📞 获取帮助

### 官方资源
- [插件开发文档](https://docs.obsidian.md/Plugins)
- [插件发布指南](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines)
- [开发者政策](https://docs.obsidian.md/Developer+policies)

### 社区支持
- [Obsidian 开发者论坛](https://forum.obsidian.md/c/developers/14)
- [Discord 开发者频道](https://discord.gg/obsidianmd)

## 📝 PR 描述示例

```markdown
# I am submitting a new Community Plugin

## Repo URL
Link to my plugin: https://github.com/Astral719/obsidian-feishu-share

## Release Checklist
- [x] I have tested the plugin on
  - [x] Windows
  - [x] macOS
  - [ ] Linux
  - [ ] Android _(if applicable)_
  - [ ] iOS _(if applicable)_
- [x] My GitHub release contains all required files (as individual files, not just in the source.zip / source.tar.gz)
  - [x] `main.js`
  - [x] `manifest.json`
  - [ ] `styles.css` _(optional)_
- [x] GitHub release name matches the exact version number specified in my manifest.json (***Note:** Use the exact version number, don't include a prefix `v`*)
- [x] The `id` in my `manifest.json` matches the `id` in the `community-plugins.json` file.
- [x] My README.md describes the plugin's purpose and provides clear usage instructions.
- [x] I have read the developer policies at https://docs.obsidian.md/Developer+policies, and have assessed my plugins's adherence to these policies.
- [x] I have read the tips in https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines and have self-reviewed my plugin to avoid these common pitfalls.
- [x] I have added a license in the LICENSE file.
- [x] My project respects and is compatible with the original license of any code from other plugins that I'm using. I have given proper attribution to these other projects in my `README.md`.
```

---

**模板版本：** v1.0.0  
**最后更新：** 2025-06-27  
**基于经验：** 飞书分享插件成功提交流程  
**重要提醒：** 严格按照官方模板格式，确保所有检查项都已完成
