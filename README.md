# RtNetdisk · 个人云盘

基于 Supabase Auth + Cloudflare R2 的多用户云盘系统。

## 架构

```
用户浏览器
    ↓
Cloudflare Pages（前端静态页面）
    ↓ /api/*
Cloudflare Worker（API 中间层）
    ↓
Cloudflare R2（文件存储，按 user_id 分目录）
```

## 文件说明

| 文件 | 说明 |
|---|---|
| `index.html` | 前端页面（登录 + 文件列表 + 上传） |
| `worker.js` | Cloudflare Worker 代码（API 中间层） |

## 部署步骤

### 1. 部署前端到 Cloudflare Pages
- 把 `index.html` 上传到 Cloudflare Pages
- 绑定自定义域名 `pan.r6t5.dpdns.org`

### 2. 部署 Worker 到 Cloudflare Workers
- 创建新 Worker，粘贴 `worker.js` 代码
- 绑定 R2 bucket：`r6t5-netdisk`
- 设置环境变量：
  - `SUPABASE_URL`: `https://fckqmlwkujixwztzqqni.supabase.co`
  - `SUPABASE_ANON_KEY`: 你的 Supabase anon key

### 3. 配置 R2 CORS
在 R2 bucket 设置里添加 CORS 规则：
```json
[{
  "AllowedOrigins": ["*"],
  "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
  "AllowedHeaders": ["*"]
}]
```

### 4. 配置 Pages 域名
- 前端域名：`pan.r6t5.dpdns.org`
- API 路径：`/api/*` → Worker

## 使用

- 登录：使用 Supabase 账号登录
- 上传：拖拽或点击上传文件
- 文件自动存到 R2 的 `/{user_id}/` 目录下
- 每个用户只能看到自己的文件