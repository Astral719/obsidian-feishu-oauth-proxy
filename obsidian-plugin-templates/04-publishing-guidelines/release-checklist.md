# Obsidian 插件发布检查清单

## 📋 发布前检查清单

**插件名称：** [插件名称]  
**版本号：** [x.x.x]  
**发布负责人：** [姓名]  
**发布日期：** [YYYY-MM-DD]

## 1. 代码质量检查

### 1.1 代码规范
- [ ] **TypeScript 编译无错误**
  ```bash
  npm run build
  # 确保没有编译错误
  ```

- [ ] **ESLint 检查通过**
  ```bash
  npm run lint
  # 修复所有 lint 错误和警告
  ```

- [ ] **代码注释完整**
  - [ ] 所有公共方法都有注释
  - [ ] 复杂逻辑有解释说明
  - [ ] TODO 项目已清理

### 1.2 错误处理
- [ ] **网络请求错误处理**
  - [ ] 超时处理
  - [ ] 网络异常处理
  - [ ] API 错误码处理

- [ ] **用户输入验证**
  - [ ] 必填字段验证
  - [ ] 格式验证
  - [ ] 边界值处理

- [ ] **异常情况处理**
  - [ ] 文件不存在
  - [ ] 权限不足
  - [ ] 服务不可用

## 2. 功能测试

### 2.1 核心功能测试
- [ ] **主要功能流程**
  - [ ] 功能1：[描述] - 测试通过
  - [ ] 功能2：[描述] - 测试通过
  - [ ] 功能3：[描述] - 测试通过

- [ ] **边界条件测试**
  - [ ] 空文件处理
  - [ ] 大文件处理
  - [ ] 特殊字符处理
  - [ ] 网络异常情况

### 2.2 用户界面测试
- [ ] **设置页面**
  - [ ] 所有设置项正常工作
  - [ ] 设置保存和加载正确
  - [ ] 输入验证正常

- [ ] **模态框和通知**
  - [ ] 模态框正常显示和关闭
  - [ ] 通知消息准确友好
  - [ ] 错误提示清晰明确

### 2.3 兼容性测试
- [ ] **Obsidian 版本兼容**
  - [ ] 最低支持版本测试
  - [ ] 最新版本测试
  - [ ] API 兼容性确认

- [ ] **平台兼容性**
  - [ ] Windows 测试
  - [ ] macOS 测试
  - [ ] Linux 测试 (如适用)
  - [ ] 移动端测试 (如适用)

## 3. 文件结构检查

### 3.1 必需文件
- [ ] **main.js** - 插件主文件
  - [ ] 文件存在且可执行
  - [ ] 文件大小合理 (< 5MB)
  - [ ] 语法正确无错误

- [ ] **manifest.json** - 插件清单
  ```json
  {
    "id": "plugin-id",
    "name": "插件名称",
    "version": "1.0.0",
    "minAppVersion": "0.15.0",
    "description": "插件描述（不包含'Obsidian'字样）",
    "author": "作者名称",
    "authorUrl": "https://github.com/username",
    "fundingUrl": "https://github.com/username/repo",
    "isDesktopOnly": false
  }
  ```

- [ ] **versions.json** - 版本兼容性
  ```json
  {
    "1.0.0": "0.15.0"
  }
  ```

- [ ] **README.md** - 项目说明
  - [ ] 插件功能描述清晰
  - [ ] 安装说明完整
  - [ ] 使用说明详细
  - [ ] 截图或演示

- [ ] **LICENSE** - 许可证文件
  - [ ] 许可证类型明确 (推荐 MIT)
  - [ ] 版权信息正确

### 3.2 可选文件
- [ ] **styles.css** - 自定义样式 (如需要)
- [ ] **.gitignore** - Git 忽略文件
- [ ] **package.json** - 项目配置
- [ ] **tsconfig.json** - TypeScript 配置

## 4. 内容规范检查

### 4.1 命名规范
- [ ] **插件 ID**
  - [ ] 使用 kebab-case 格式
  - [ ] 不包含 "obsidian" 字样
  - [ ] 具有描述性且唯一

- [ ] **插件名称**
  - [ ] 不包含 "Obsidian" 字样 ⚠️ 重要
  - [ ] 简洁明了
  - [ ] 符合官方命名规范

- [ ] **描述文本**
  - [ ] 不包含 "Obsidian" 字样 ⚠️ 重要
  - [ ] 描述准确简洁
  - [ ] 突出核心功能

### 4.2 版本号规范
- [ ] **语义化版本**
  - [ ] 格式：MAJOR.MINOR.PATCH
  - [ ] 版本号递增正确
  - [ ] 与 Git tag 一致

## 5. GitHub 仓库检查

### 5.1 仓库结构
- [ ] **文件位置正确**
  - [ ] main.js 在根目录
  - [ ] manifest.json 在根目录
  - [ ] versions.json 在根目录
  - [ ] README.md 在根目录
  - [ ] LICENSE 在根目录

- [ ] **分支管理**
  - [ ] 主分支代码稳定
  - [ ] 开发分支已合并
  - [ ] 无未完成的功能分支

### 5.2 Release 准备
- [ ] **创建 GitHub Release**
  - [ ] 版本号格式：1.0.0 (不带 v 前缀)
  - [ ] Release 标题：版本号 - 插件名称
  - [ ] Release 描述包含更新内容

- [ ] **上传必需文件**
  - [ ] main.js
  - [ ] manifest.json
  - [ ] versions.json
  - [ ] 文件完整无损坏

## 6. 社区提交准备

### 6.1 obsidian-releases 仓库
- [ ] **Fork 官方仓库**
  - [ ] Fork https://github.com/obsidianmd/obsidian-releases
  - [ ] 克隆到本地

- [ ] **修改 community-plugins.json**
  ```json
  {
    "id": "plugin-id",
    "name": "插件名称",
    "author": "作者名称",
    "description": "插件描述",
    "repo": "username/repository-name"
  }
  ```

### 6.2 Pull Request 准备
- [ ] **使用官方 PR 模板**
  ```markdown
  # I am submitting a new Community Plugin
  
  ## Repo URL
  Link to my plugin: https://github.com/username/repo
  
  ## Release Checklist
  - [x] I have tested the plugin on
    - [x] Windows
    - [x] macOS
    - [ ] Linux
  - [x] My GitHub release contains all required files
    - [x] main.js
    - [x] manifest.json
    - [ ] styles.css (optional)
  - [x] GitHub release name matches the exact version number
  - [x] The id in my manifest.json matches the id in community-plugins.json
  - [x] My README.md describes the plugin's purpose
  - [x] I have read the developer policies
  - [x] I have added a license in the LICENSE file
  ```

## 7. 最终检查

### 7.1 自动化检查预期
- [ ] **插件验证**
  - [ ] manifest.json 格式正确
  - [ ] 版本号匹配
  - [ ] 文件完整性

- [ ] **内容检查**
  - [ ] 不包含禁用词汇
  - [ ] 描述符合规范
  - [ ] 许可证兼容

### 7.2 发布确认
- [ ] **最终确认**
  - [ ] 所有检查项已完成
  - [ ] 功能测试通过
  - [ ] 文档完整准确
  - [ ] 准备好接受社区反馈

## 8. 发布后跟踪

### 8.1 监控指标
- [ ] **自动化检查状态**
- [ ] **社区反馈收集**
- [ ] **用户问题跟踪**

### 8.2 后续计划
- [ ] **用户反馈处理计划**
- [ ] **Bug 修复计划**
- [ ] **功能迭代计划**

---

## ⚠️ 常见失败原因

1. **manifest.json 包含 "Obsidian" 字样**
2. **版本号不匹配**
3. **文件缺失或损坏**
4. **PR 模板格式不正确**
5. **许可证缺失**

## ✅ 发布成功标志

- 通过所有自动化检查
- 获得 "Ready for review" 标签
- 进入人工审核队列

---

**检查清单版本：** v1.0.0  
**最后更新：** 2025-06-27  
**基于经验：** 飞书分享插件发布流程  
**使用说明：** 发布前逐项检查，确保所有项目都已完成
