# 给队友 / Cursor 的交接说明：固定二维码轻量体验部署

## 最重要结论

二维码已经送印，二维码地址不能变：

```text
https://pocket-friend.pages.dev/photo-pixel-lite
```

请不要生成新二维码，不要换成 localhost、局域网 IP、localtunnel、新的 pages.dev 域名。

现在要做的事情只有一个：

把本仓库里已经做好的 `/photo-pixel-lite` 轻量体验，部署到真正服务 `pocket-friend.pages.dev` 的 Cloudflare Pages 项目里。

## 代码所在仓库和分支

GitHub 仓库：

```text
https://github.com/fioluuuna/pocket-friend-island
```

功能分支：

```text
feature/photo-pixel-lite-qr
```

main 分支目前也已经包含核心轻量体验提交：

```text
ca1cb68 fix: add pages route fallback for photo lite
eb02a48 feat: add public photo pixel lite flow
```

建议队友优先查看：

```text
https://github.com/fioluuuna/pocket-friend-island/tree/feature/photo-pixel-lite-qr
```

## 已实现功能

轻量体验页路径：

```text
/photo-pixel-lite
```

体验流程：

```text
手机扫码 -> 打开网页 -> 拍照/上传照片 -> 自动生成三列结果
```

三列结果：

```text
REF      原始真人照片
POTATO   本地 Canvas 抽象土豆小人
SEEDREAM 豆包 Seedream 生成的冒险岛风格像素小人
```

## 核心文件

```text
src/PhotoPixelLite.tsx
```

轻量体验主页面，包含拍照/上传、图片压缩、本地抽象土豆小人、三列展示 UI。

```text
src/App.tsx
```

路由入口。访问 `/photo-pixel-lite` 时直接渲染 `PhotoPixelLite`。

```text
functions/api/seedream-lite.ts
```

Cloudflare Pages Function。服务端代理豆包 Seedream API，避免 API Key 暴露到前端。

```text
vite.config.ts
```

本地开发代理 `/api/seedream-lite`，方便本地调试。

```text
public/_redirects
```

Cloudflare Pages SPA 回退规则。保证直接访问 `/photo-pixel-lite` 不 404。

```text
server/photo-pixel-lite-server.mjs
```

备用 Node 自托管服务。不是固定二维码的首选方案。

## 环境变量

Cloudflare Pages 项目里必须配置：

```text
DOUBAO_API_KEY=火山引擎豆包 API Key
DOUBAO_MODEL=doubao-seedream-5-0-260128
```

注意：

```text
不要把 DOUBAO_API_KEY 写进前端代码
不要提交 .env 到 GitHub
不要在公开仓库/公开聊天暴露 API Key
```

本机 `.env` 路径仅供项目本人手动查看：

```text
E:\Advx_Ball\pocket-friend-latest-preview\.env
```

## 当前阻塞

当前登录的 Cloudflare 账号 `fioluuuna@gmail.com` 看不到真正的 `pocket-friend.pages.dev` Pages 项目。

已验证：

```text
https://pocket-friend.pages.dev/photo-pixel-lite
```

现在能打开，但返回的是旧首页，不是新的三列拍照体验。

说明：

真正拥有 `pocket-friend.pages.dev` 的 Cloudflare Pages 项目，应该在另一个 Cloudflare 账号里，或者由某个队友创建。

## 队友需要做什么

### 方案 A：在真正的 Cloudflare Pages 项目里重新部署

找到 Cloudflare Pages 项目：

```text
pocket-friend
```

它对应的域名必须是：

```text
pocket-friend.pages.dev
```

然后执行：

1. 连接 GitHub 仓库 `fioluuuna/pocket-friend-island`
2. 部署 `main` 分支，或部署 `feature/photo-pixel-lite-qr`
3. 配置环境变量 `DOUBAO_API_KEY` 和 `DOUBAO_MODEL`
4. 部署完成后访问 `https://pocket-friend.pages.dev/photo-pixel-lite`

### 方案 B：如果 Cloudflare 已经连了 GitHub

在 Cloudflare Pages 后台手动触发重新部署最新 main。

确认使用的仓库代码至少包含：

```text
ca1cb68 fix: add pages route fallback for photo lite
```

## 给 Cursor 的直接提示词

可以把下面这段直接发给 Cursor：

```text
请在仓库 https://github.com/fioluuuna/pocket-friend-island 中检查 feature/photo-pixel-lite-qr 分支。

目标：保持已打印二维码 URL 不变：
https://pocket-friend.pages.dev/photo-pixel-lite

不要生成新二维码，不要换域名。

请把 /photo-pixel-lite 轻量体验部署到真正服务 pocket-friend.pages.dev 的 Cloudflare Pages 项目里。

核心代码：
- src/PhotoPixelLite.tsx
- src/App.tsx
- functions/api/seedream-lite.ts
- vite.config.ts
- public/_redirects

Cloudflare Pages 环境变量需要配置：
- DOUBAO_API_KEY
- DOUBAO_MODEL=doubao-seedream-5-0-260128

验收标准：
1. 手机流量打开 https://pocket-friend.pages.dev/photo-pixel-lite
2. 页面显示拍照/上传入口
3. 上传或拍照后显示三列：REF、POTATO、SEEDREAM
4. SEEDREAM 列真实调用豆包 Seedream API 生成像素小人
5. 浏览器前端源码里不能出现 API Key
```

## 验收标准

最终必须满足：

```text
手机用自己的流量扫码可以打开
URL 仍然是 https://pocket-friend.pages.dev/photo-pixel-lite
页面不是旧首页
页面能拍照或上传照片
能看到 REF / POTATO / SEEDREAM 三列
Seedream 能返回可爱像素小人
API Key 不暴露在前端
```

## 不要做的事

```text
不要换二维码
不要换成 pocket-friend-photo-pixel.pages.dev
不要换成 pocket-friend-8pb.pages.dev
不要用 localtunnel
不要用 localhost
不要用局域网 IP
不要把 API Key 写死到前端
不要直接 git add .，本地有临时目录
```

## 本地验证命令

```bash
npm install
npm test
npm run build
```

当前本地已验证：

```text
npm test 通过：1 个测试文件，6 个测试
npm run build 通过：只有 chunk 体积警告，不影响功能
```
