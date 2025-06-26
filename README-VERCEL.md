# Obsidian飞书分享 - Vercel云端部署方案

## 🎯 解决方案概述

为了降低普通用户的使用门槛，我们提供了Vercel云端托管方案，无需本地运行Python服务器。

## 🚀 部署步骤

### 1. 准备Vercel账号
1. 访问 [vercel.com](https://vercel.com)
2. 使用GitHub账号注册/登录

### 2. 创建KV数据库
1. 在Vercel Dashboard中，点击 "Storage"
2. 创建新的 "KV Database"
3. 记录 `KV_REST_API_URL` 和 `KV_REST_API_TOKEN`

### 3. 部署到Vercel
```bash
# 1. 安装Vercel CLI
npm i -g vercel

# 2. 登录Vercel
vercel login

# 3. 部署项目
vercel --prod

# 4. 设置环境变量
vercel env add KV_REST_API_URL
vercel env add KV_REST_API_TOKEN
```

### 4. 配置飞书应用
在飞书开放平台中，将回调地址设置为：
```
https://your-app.vercel.app/api/oauth/callback
```

## 📁 文件结构

```
api/
├── oauth/
│   ├── start.js          # 启动OAuth流程
│   ├── callback.js       # OAuth回调处理
│   └── status/
│       └── [state].js    # OAuth状态查询
├── proxy.js              # 飞书API代理
vercel.json               # Vercel配置
vercel-package.json       # 依赖配置
```

## 🔧 插件配置

在插件设置中，将代理服务器地址设置为：
```
https://your-app.vercel.app
```

## ✅ 优势

1. **零门槛** - 用户无需安装Python或运行本地服务器
2. **高可用** - Vercel提供99.99%可用性保证
3. **全球CDN** - 访问速度快
4. **自动HTTPS** - 安全可靠
5. **免费额度** - 对个人用户完全免费

## 🎯 用户体验

- ✅ 点击授权按钮
- ✅ 自动打开浏览器
- ✅ 完成飞书授权
- ✅ 自动返回结果
- ✅ 无需任何本地配置

## 🔄 迁移方案

现有用户可以：
1. **继续使用本地Python服务器** - 完全兼容
2. **切换到云端服务** - 更新代理地址即可
3. **使用手动授权** - 作为备用方案

这样既保持了功能完整性，又大大降低了使用门槛！
