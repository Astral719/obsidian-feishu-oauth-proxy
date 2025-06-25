# Obsidian飞书分享 - 云端OAuth代理服务

## 🎯 项目简介

这是 Obsidian 飞书分享插件的云端代理服务，部署在 Vercel 上，为用户提供零门槛的 OAuth 授权和 API 代理服务。

## � Token管理策略

### OAuth状态管理
- **临时授权状态**: 5分钟过期（仅用于授权流程）
- **目的**: 清理授权过程中的临时数据，不影响用户体验

### Access Token管理
- **飞书Token**: 2小时有效期
- **自动刷新**: 插件自动检测并刷新过期Token
- **用户体验**: 无需重复手动授权，长期有效使用

## �🚀 快速部署

### 1. 一键部署到 Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/obsidian-feishu-oauth-proxy)

### 2. 手动部署

```bash
# 1. 克隆项目
git clone https://github.com/your-username/obsidian-feishu-oauth-proxy.git
cd obsidian-feishu-oauth-proxy

# 2. 安装 Vercel CLI
npm i -g vercel

# 3. 登录 Vercel
vercel login

# 4. 部署项目
vercel --prod
```

### 3. 配置 KV 数据库

1. 在 Vercel Dashboard 中，进入你的项目
2. 点击 "Storage" 标签
3. 创建新的 "KV Database"
4. 复制 `KV_REST_API_URL` 和 `KV_REST_API_TOKEN`
5. 在项目设置中添加环境变量：
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`

## 📁 API 端点

### OAuth 相关

- `POST /api/oauth/start` - 启动 OAuth 流程
- `GET /api/oauth/callback` - OAuth 回调处理
- `GET /api/oauth/status/{state}` - 查询 OAuth 状态

### 通用代理

- `POST /api/proxy` - 飞书 API 通用代理

## 🔧 配置飞书应用

在飞书开放平台中，将回调地址设置为：
```
https://your-app.vercel.app/api/oauth/callback
```

## 🎯 使用方法

在 Obsidian 飞书分享插件设置中：
1. 选择 "云端托管" 代理类型
2. 或者设置自定义代理地址为：`https://your-app.vercel.app`

## ✅ 功能特性

- ✅ **零门槛** - 用户无需安装本地服务器
- ✅ **高可用** - Vercel 99.99% 可用性保证
- ✅ **全球 CDN** - 访问速度快
- ✅ **自动 HTTPS** - 安全可靠
- ✅ **免费额度** - 个人用户完全免费
- ✅ **完整功能** - 支持所有飞书 API 调用

## 🔒 安全性

- OAuth 状态存储在 Vercel KV 中，5分钟自动过期
- 所有请求都通过 HTTPS 加密
- 不存储用户的敏感信息
- 支持 CORS 跨域请求

## 📊 监控和日志

- Vercel 提供完整的请求日志
- 支持实时监控和错误追踪
- 自动扩容，无需担心并发限制

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
