# 飞书分享 - Obsidian 插件

快速将 Obsidian 中的 Markdown 内容分享到飞书云文档的插件。

## ✨ 功能特性

- 🚀 **一键分享**：在 Obsidian 中直接将 Markdown 文件分享到飞书云文档
- 🔐 **安全授权**：使用 OAuth 2.0 标准授权流程，保护用户隐私
- 📁 **文件夹管理**：支持选择飞书中的目标文件夹（开发中）
- 🎯 **智能处理**：自动处理 Obsidian 特有语法，优化飞书显示效果
- 📱 **多端支持**：支持桌面端和移动端 Obsidian

## 🛠️ 安装方法

### 方法一：手动安装（推荐）

1. 下载最新版本的插件文件
2. 将文件解压到 Obsidian 插件目录：`{vault}/.obsidian/plugins/obsidian-feishu-share/`
3. 在 Obsidian 设置中启用"飞书分享"插件

### 方法二：开发者安装

```bash
# 克隆项目
git clone https://github.com/your-username/obsidian-feishu-share.git
cd obsidian-feishu-share

# 安装依赖
npm install

# 构建插件
npm run build

# 将构建结果复制到 Obsidian 插件目录
```

## 🚀 快速开始

### 1. 创建飞书应用

在使用插件前，需要先创建飞书应用：

1. 访问 [飞书开放平台](https://open.feishu.cn/app)
2. 创建企业自建应用或个人应用
3. 在应用管理页面获取 `App ID` 和 `App Secret`
4. 配置重定向 URL：`obsidian://feishu-share-callback`
5. 申请以下权限：
   - `contact:user.base:readonly` (读取用户基本信息)
   - `docs:doc:create` (创建文档)
   - `drive:explorer:readonly` (读取文件夹列表)

### 2. 配置插件

1. 在 Obsidian 设置中找到"飞书分享"插件
2. 点击"开始授权"按钮
3. 在弹出的飞书授权页面中登录并确认授权
4. 授权成功后即可开始使用

### 3. 分享内容

支持多种分享方式：

- **菜单分享**：在 Markdown 文件中，点击右上角菜单中的"分享到飞书"
- **右键分享**：右键点击文件，选择"分享到飞书"
- **命令分享**：使用命令面板（Ctrl/Cmd + P）搜索"分享到飞书"

## 📝 支持的内容格式

### ✅ 完全支持
- 标准 Markdown 语法（标题、段落、列表、粗体、斜体、代码块等）
- 网络图片链接（http/https 协议）
- 表格、引用块
- 链接

### ⚠️ 部分支持
- Obsidian 双向链接 `[[link]]` → 转换为 `📝 link`
- Obsidian 嵌入内容 `![[file]]` → 转换为 `📎 嵌入文件：file`
- Obsidian 标签 `#tag` → 保持原样

### ❌ 不支持
- 本地图片文件（需要手动上传到飞书）
- Obsidian 插件特有的扩展语法

## ⚙️ 配置选项

### 授权管理
- **授权状态**：显示当前飞书账号的授权状态
- **重新授权**：重新进行飞书账号授权
- **解除授权**：清除本地保存的授权信息

### 文件夹设置
- **默认文件夹**：设置分享文档的默认存放位置
- **选择文件夹**：从飞书云空间中选择目标文件夹（开发中）

## 🔧 开发说明

### 技术栈
- TypeScript
- Obsidian API
- 飞书开放平台 API
- esbuild（构建工具）

### 项目结构
```
├── main.ts                 # 插件主文件
├── src/
│   ├── types.ts            # 类型定义
│   ├── constants.ts        # 常量配置
│   ├── feishu-api.ts       # 飞书 API 服务
│   ├── markdown-processor.ts # Markdown 处理器
│   └── settings.ts         # 设置界面
├── manifest.json           # 插件清单
├── package.json           # 项目配置
└── README.md              # 说明文档
```

### 构建命令
```bash
npm run dev     # 开发模式（监听文件变化）
npm run build   # 生产构建
```

## 🐛 问题反馈

如果您在使用过程中遇到问题，请：

1. 查看 Obsidian 开发者控制台的错误信息
2. 确认飞书应用配置是否正确
3. 检查网络连接是否正常
4. 提交 Issue 时请包含详细的错误信息和复现步骤

## 📄 许可证

MIT License

## 🙏 致谢

感谢 Obsidian 社区和飞书开放平台提供的优秀 API 支持。
