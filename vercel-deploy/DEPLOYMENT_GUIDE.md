# 🚀 Obsidian 飞书分享云端代理 - 完整部署指南

## 📋 部署前准备

### 1. 账号准备
- ✅ GitHub 账号
- ✅ Vercel 账号（使用 GitHub 登录）
- ✅ 飞书开放平台账号

### 2. 工具准备
- ✅ Node.js 18+ 
- ✅ Git
- ✅ Vercel CLI（可选，推荐）

## 🎯 方法一：一键部署（推荐）

### 1. Fork 项目到你的 GitHub

1. 访问项目仓库
2. 点击右上角 "Fork" 按钮
3. 选择你的 GitHub 账号

### 2. 连接 Vercel

1. 访问 [vercel.com](https://vercel.com)
2. 使用 GitHub 账号登录
3. 点击 "New Project"
4. 选择你刚才 Fork 的项目
5. 点击 "Deploy"

### 3. 配置 KV 数据库

1. 部署完成后，进入项目 Dashboard
2. 点击 "Storage" 标签
3. 点击 "Create Database"
4. 选择 "KV" 类型
5. 输入数据库名称（如：`oauth-storage`）
6. 点击 "Create"

### 4. 设置环境变量

1. 在 KV 数据库页面，复制：
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`

2. 回到项目 Dashboard
3. 点击 "Settings" 标签
4. 点击 "Environment Variables"
5. 添加两个环境变量：
   ```
   KV_REST_API_URL = [你的KV数据库URL]
   KV_REST_API_TOKEN = [你的KV数据库Token]
   ```

### 5. 重新部署

1. 点击 "Deployments" 标签
2. 点击最新部署右侧的 "..." 菜单
3. 选择 "Redeploy"
4. 等待部署完成

## 🎯 方法二：命令行部署

### 1. 克隆项目

```bash
git clone https://github.com/your-username/obsidian-feishu-oauth-proxy.git
cd obsidian-feishu-oauth-proxy
```

### 2. 安装 Vercel CLI

```bash
npm install -g vercel
```

### 3. 登录 Vercel

```bash
vercel login
```

### 4. 部署项目

```bash
# 安装依赖
npm install

# 部署到生产环境
vercel --prod
```

### 5. 配置数据库和环境变量

按照方法一的步骤 3-5 进行配置。

## 🔧 配置飞书应用

### 1. 登录飞书开放平台

访问 [open.feishu.cn](https://open.feishu.cn)

### 2. 创建或编辑应用

1. 进入你的飞书应用管理页面
2. 点击 "应用配置" → "安全设置"
3. 在 "重定向URL" 中添加：
   ```
   https://your-app-name.vercel.app/api/oauth/callback
   ```
   （替换 `your-app-name` 为你的实际 Vercel 应用名称）

### 3. 保存配置

点击 "保存" 按钮完成配置。

## 🎮 配置 Obsidian 插件

### 1. 更新插件设置

1. 打开 Obsidian
2. 进入 "设置" → "第三方插件" → "飞书分享"
3. 在 "代理服务器类型" 中选择 "云端托管"
4. 或者选择 "自定义地址"，输入：
   ```
   https://your-app-name.vercel.app
   ```

### 2. 测试连接

1. 配置你的飞书 App ID 和 App Secret
2. 点击 "开始授权" 按钮
3. 应该会自动打开浏览器进行授权

## ✅ 验证部署

### 1. 检查 API 端点

访问以下 URL 确认服务正常：

```
https://your-app-name.vercel.app/api/oauth/start
```

应该返回 405 错误（因为需要 POST 请求），这表示服务正在运行。

### 2. 检查日志

1. 在 Vercel Dashboard 中点击 "Functions"
2. 查看各个函数的执行日志
3. 确认没有错误信息

## 🔍 故障排除

### 常见问题

1. **部署失败**
   - 检查 Node.js 版本是否 18+
   - 确认所有文件都已正确上传

2. **OAuth 回调失败**
   - 检查飞书应用中的回调 URL 是否正确
   - 确认 KV 数据库配置正确

3. **API 代理失败**
   - 检查环境变量是否设置正确
   - 查看 Vercel 函数日志

### 获取帮助

- 查看 Vercel 部署日志
- 检查浏览器开发者工具的网络请求
- 查看 Obsidian 插件的控制台日志

## 🎉 完成！

恭喜！你已经成功部署了云端代理服务。现在用户可以享受零门槛的飞书分享体验了！

## 📊 监控和维护

### 1. 监控使用情况

- Vercel Dashboard 提供详细的使用统计
- 可以查看请求量、响应时间等指标

### 2. 更新服务

- 直接在 GitHub 中修改代码
- Vercel 会自动重新部署

### 3. 扩容

- Vercel 自动处理扩容
- 免费额度通常足够个人使用

---

🎯 **目标达成**：为 Obsidian 飞书分享插件提供零门槛的云端代理服务！
