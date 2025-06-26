# 飞书分享代理服务器 - Python Vercel 部署

## 🚀 部署概述

这是基于Python的飞书分享代理服务器，部署在Vercel上。使用Python实现确保与飞书官方示例完全兼容。

## 📁 文件结构

```
api/
├── proxy.py           # 主代理功能（文件上传、API转发）
├── oauth-start.py     # OAuth授权启动
├── oauth-callback.py  # OAuth回调处理
├── oauth-status.py    # OAuth状态查询
└── health.py         # 健康检查

requirements.txt       # Python依赖
vercel.json           # Vercel配置
```

## 🔧 核心功能

### 1. 文件上传代理 (`/api/proxy`)
- 使用 `requests-toolbelt.MultipartEncoder`
- 完全兼容飞书官方Python示例
- 支持markdown文件上传和转换

### 2. OAuth流程 (`/api/oauth-*`)
- 自动化OAuth授权流程
- 无需手动复制授权码
- 支持状态轮询

### 3. 健康检查 (`/api/health`)
- 服务状态监控
- 版本信息

## 🌐 部署配置

### 域名设置
- **生产域名**: `https://md2feishu.xinqi.life`
- **OAuth回调**: `https://md2feishu.xinqi.life/api/oauth-callback`

### 飞书应用配置
在飞书开放平台添加OAuth回调地址：
```
https://md2feishu.xinqi.life/api/oauth-callback
```

## 📦 依赖管理

### Python依赖 (`requirements.txt`)
```
requests==2.31.0
requests-toolbelt==1.0.0
```

### Vercel配置 (`vercel.json`)
- Python 3.9运行时
- 60秒超时限制
- CORS支持

## 🔍 API端点

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/health` | GET | 健康检查 |
| `/api/proxy` | POST | 代理飞书API请求 |
| `/api/oauth-start` | POST | 启动OAuth流程 |
| `/api/oauth-callback` | GET | OAuth回调处理 |
| `/api/oauth-status` | GET | 查询OAuth状态 |

## 🧪 测试

### 健康检查
```bash
curl https://md2feishu.xinqi.life/api/health
```

预期响应：
```json
{
  "status": "ok",
  "message": "飞书分享代理服务器运行正常 (Vercel Python)",
  "version": "2.0.0"
}
```

## 🔄 部署流程

1. **代码推送** - 推送到GitHub仓库
2. **自动部署** - Vercel自动检测并部署
3. **域名配置** - 确保域名指向Vercel
4. **飞书配置** - 更新OAuth回调地址

## 📊 监控

### Vercel控制台
- 函数执行日志
- 性能监控
- 错误追踪

### 日志查看
1. 登录Vercel控制台
2. 选择项目
3. 查看Functions标签页

## 🔧 故障排除

### 常见问题

1. **1061002参数错误**
   - 检查multipart格式
   - 验证文件大小计算

2. **OAuth回调失败**
   - 确认回调地址配置
   - 检查域名解析

3. **函数超时**
   - 检查文件大小限制
   - 优化请求处理

### 调试步骤
1. 查看Vercel函数日志
2. 测试健康检查端点
3. 验证飞书应用配置
4. 检查网络连接

## 🚀 优势

### 相比JavaScript版本
- ✅ 使用飞书官方Python示例
- ✅ requests-toolbelt库支持
- ✅ 更稳定的multipart处理

### 相比本地部署
- ✅ 无需本地Python环境
- ✅ 自动扩展和负载均衡
- ✅ 全球CDN加速
- ✅ 零维护成本

## 📝 更新日志

### v2.0.0 (当前版本)
- 完全基于Python实现
- 使用Vercel Serverless Functions
- 支持自动OAuth流程
- 优化文件上传性能
