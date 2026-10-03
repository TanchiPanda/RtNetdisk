# CloudrevePro 部署指南（前端 Pages + 后端 Render + R2）

## 架构说明

```
用户浏览器
    ↓
Cloudflare Pages（前端静态网页）
    ↓ API 请求
Render（后端 Go 程序，免费实例）
    ↓ 文件存储
Cloudflare R2（对象存储）
```

---

## 第一步：前端部署到 Cloudflare Pages

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 左侧 → **Workers & Pages** → **创建应用** → **Pages** → **直接上传**
3. 项目名称：`netdisk-frontend`（随便填）
4. 把 `cloudrevepro-frontend-with-api.zip` 解压，把 `build/` 目录里的**所有文件**拖进去上传
5. 等待部署完成，得到域名：`https://netdisk-frontend.pages.dev`

> 注意：前端 API 地址已经配置为 `https://netdisk.tcpanda.dpdns.org/api/v3`
> 如果你的后端域名变了，需要重新打包前端

---

## 第二步：后端部署到 Render

### 2.1 准备 GitHub 仓库

1. 在 GitHub 新建一个仓库，名字随便（比如 `cloudreve-pro-deploy`）
2. 把以下文件上传到仓库根目录：
   - `Dockerfile.render` → 重命名为 `Dockerfile`
   - `cloudreve-linux-amd64`（后端二进制文件）

### 2.2 在 Render 创建服务

1. 登录 [Render](https://render.com/)
2. 点 **New** → **Web Service**
3. 选 **Deploy from a Git repository**
4. 连接你的 GitHub 账号，选择刚才的仓库
5. 配置：
   - **Name**：`cloudreve-backend`
   - **Region**：选离你近的（Singapore）
   - **Branch**：`main`
   - **Runtime**：`Docker`
   - **Dockerfile Path**：`./Dockerfile`
   - **Instance Type**：Free（免费实例）
6. 点 **Create Web Service**
7. 等待部署完成，得到后端域名：`https://cloudreve-backend.onrender.com`

---

## 第三步：配置后端

### 3.1 首次启动

后端第一次启动会自动创建 `conf.ini` 配置文件和 SQLite 数据库。

在 Render 的 **Logs** 页面里，你会看到类似：
```
初始管理员账号：admin@cloudreve.org
初始管理员密码：xxxxxxxx
```

用这个账号密码登录后台。

### 3.2 配置 R2 存储

1. 登录后台（`https://你的后端域名/admin`）
2. 左侧 → **存储策略** → **添加存储策略**
3. 类型选 **S3 兼容**
4. 填写 R2 的配置：
   - **Bucket 名称**：你的 R2 bucket 名
   - **Endpoint**：`https://.r2.cloudflarestorage.com`
   - **Access Key ID**：R2 的 Access Key
   - **Access Key Secret**：R2 的 Secret Key
5. 保存

---

## 第四步：更新前端 API 地址

如果你后端的域名和之前配置的不一样，需要重新打包前端：

1. 编辑 `src/middleware/Api.ts`
2. 把 `baseURL` 改成你的新后端地址 + `/api/v3`
3. 重新 `yarn build`
4. 重新上传到 Cloudflare Pages

---

## 常见问题

### Q: Render 免费实例会休眠吗？
A: 会，15 分钟没访问会休眠，下次访问需要等 30 秒左右唤醒。个人用足够。

### Q: SQLite 数据会丢吗？
A: Render 免费实例重启后文件系统会重置，SQLite 数据库可能丢失。
如果需要持久化，建议：
- 用 Render 的免费 PostgreSQL 数据库
- 或者定期备份数据库文件

### Q: R2 怎么获取 Access Key？
A: Cloudflare Dashboard → R2 → 右侧 **Manage API Tokens** → 创建 API Token
