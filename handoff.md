# Pocket Friend Island Handoff

更新日期：2026-07-25

当前重点：把“手机拍照/上传照片 -> REF 原图 -> POTATO 本地抽象小人 -> SEEDREAM 豆包像素小人”的轻量体验，部署到已经打印的固定二维码地址。

固定二维码目标地址：

```text
https://pocket-friend.pages.dev/photo-pixel-lite
```

## 1. 当前仓库状态

实际工作目录：

```text
E:\Advx_Ball\pocket-friend-latest-preview
```

当前分支：

```text
feature/photo-pixel-lite-qr
```

当前关键提交：

```text
ca1cb68 fix: add pages route fallback for photo lite
eb02a48 feat: add public photo pixel lite flow
36e2931 chore: main 分支只保留 REF + Seedream 两列对比
```

远程仓库：

```text
fioluuuna-island  https://github.com/fioluuuna/pocket-friend-island.git
origin            https://github.com/3356153957/pocket-friend.git
```

已推送分支：

```text
fioluuuna-island/main
fioluuuna-island/feature/photo-pixel-lite-qr
fioluuuna-island/demo-showall
fioluuuna-island/feature/encounter-profile-arrival-flow
```

当前 `fioluuuna-island/main` 已被更新到 `ca1cb68`，包含轻量拍照三列体验代码。

## 2. 已完成功能

### 2.1 轻量拍照体验页

新增路由：

```text
/photo-pixel-lite
```

页面能力：

- 手机优先 UI。
- 支持手机相机拍照。
- 支持从相册上传图片。
- 自动压缩照片到前端可处理尺寸。
- 展示三列结果：
  - `REF`：用户原照片。
  - `POTATO`：本地 Canvas 生成的抽象土豆小人。
  - `SEEDREAM`：豆包 Seedream 生成的冒险岛风格像素小人。
- 失败时显示明确错误，不让用户误以为是随机坏掉。

### 2.2 豆包 Seedream 服务端代理

已把 Seedream 调用从前端密钥模式改为服务端代理模式。

前端请求：

```text
POST /api/seedream-lite
```

Cloudflare Pages Function 负责读取服务端环境变量并请求火山引擎：

```text
functions/api/seedream-lite.ts
```

这样 API Key 不会暴露在浏览器里。

### 2.3 本地开发代理

`vite.config.ts` 已加入本地开发代理。开发时前端访问 `/api/seedream-lite`，Vite dev server 会转发请求到豆包接口。

### 2.4 自托管备用服务

新增：

```text
server/photo-pixel-lite-server.mjs
```

用途：如果不用 Cloudflare Pages，也可以用 Node 启动一个静态页面 + API 代理服务。

启动脚本：

```text
npm run serve:lite
```

### 2.5 SPA 路由回退

新增：

```text
public/_redirects
```

内容：

```text
/* /index.html 200
```

用途：Cloudflare Pages 直接打开 `/photo-pixel-lite` 时不会 404。

## 3. 修改过的文件

本轮轻量体验相关文件：

```text
src/PhotoPixelLite.tsx
src/App.tsx
src/api/doubao-seedream.ts
functions/api/seedream-lite.ts
server/photo-pixel-lite-server.mjs
vite.config.ts
package.json
public/_redirects
.gitignore
```

历史上已经完成并推送过的照片像素化/Seedream 主体验相关文件包括：

```text
src/components/FaceCapture.tsx
src/TestAvatar.tsx
src/avatar/feature-extractor.ts
src/avatar/pixel-generator.ts
src/avatar/parts/draw-face.ts
src/avatar/parts/draw-hair.ts
src/avatar/parts/draw-body.ts
src/types/index.ts
```

注意：当前轻量二维码体验主要入口是 `src/PhotoPixelLite.tsx`，不要为了修二维码页去大范围改主体验 UI。

## 4. 验证结果

本地测试已通过：

```text
npm test
```

结果：

```text
1 个测试文件通过
6 个测试通过
```

生产构建已通过：

```text
npm run build
```

构建成功，但有一个 Vite chunk 体积警告：

```text
assets/index-*.js 大于 500 kB
```

这不是功能阻塞。当前主要原因是主应用依赖和 sourcemap 较大。

## 5. 当前最大阻塞

代码已经推到 GitHub，但固定二维码对应的 Cloudflare Pages 项目还没有被真正更新。

原因：

当前登录 Cloudflare 的账号是：

```text
fioluuuna@gmail.com
```

这个账号里目前看不到旧的固定项目：

```text
pocket-friend.pages.dev
```

已经验证：

- `https://pocket-friend.pages.dev/photo-pixel-lite` 能返回页面。
- 但返回的是旧首页内容，不是新做的三列拍照体验。
- 当前账号尝试创建 `pocket-friend` 项目时，Cloudflare 分配的是新域名 `pocket-friend-8pb.pages.dev`。
- 这说明 `pocket-friend.pages.dev` 这个短域名已经被另一个 Cloudflare Pages 项目占用。

结论：

已打印二维码不能变，因此必须找到真正拥有 `pocket-friend.pages.dev` 的 Cloudflare 账号，并在那个项目里部署当前 GitHub main。

## 6. Cloudflare 需要配置的环境变量

在真正的 `pocket-friend` Pages 项目里配置：

```text
DOUBAO_API_KEY
DOUBAO_MODEL=doubao-seedream-5-0-260128
```

本地 `.env` 路径：

```text
E:\Advx_Ball\pocket-friend-latest-preview\.env
```

注意：

- `.env` 不能提交到 GitHub。
- 不要把 API Key 写进前端代码。
- 不要把 API Key 发到公开聊天或公开仓库。

## 7. 已知 Bug / 风险

### 7.1 固定二维码项目归属不明

这是最高优先级问题。找不到 `pocket-friend.pages.dev` 所属 Cloudflare 项目，就无法保证已打印二维码打开的是新体验。

### 7.2 Cloudflare 误建项目不要用

当前账号里出现过这些项目/域名：

```text
pocket-friend-photo-pixel.pages.dev
pocket-friend-8pb.pages.dev
```

这些不是已打印二维码的目标地址。除非临时救场，否则不要拿去印刷或发队友。

### 7.3 Seedream 生成速度不稳定

豆包图生图可能需要十几秒到几十秒。页面已有 loading 和错误提示，但现场网络差时仍可能失败。

### 7.4 主入口文件中文显示可能有编码问题

`src/App.tsx` 在 PowerShell 终端中显示中文乱码。可能是终端编码问题，也可能是源文件历史编码混乱。当前轻量页不依赖这些中文文本，但后续整理主站时建议统一 UTF-8。

### 7.5 构建产物较大

`dist/assets/index-*.js` 和 sourcemap 较大。Cloudflare 部署时建议不要上传无用 sourcemap，避免部署慢或超时。

### 7.6 本地未跟踪目录不要误提交

当前本地有未跟踪目录：

```text
apps/
background-preview-raw/
deploy-dist/
```

这些不是本轮轻量二维码体验必须提交的内容，交接时不要直接 `git add .`。

## 8. 下一步计划

### P0：让已打印二维码打开新页面

目标：

```text
https://pocket-friend.pages.dev/photo-pixel-lite
```

打开后必须看到轻量拍照三列体验。

执行路径：

1. 找到真正拥有 `pocket-friend.pages.dev` 的 Cloudflare 账号。
2. 在该账号的 Pages 项目 `pocket-friend` 中连接 GitHub 仓库：

```text
https://github.com/fioluuuna/pocket-friend-island
```

3. 让 Cloudflare 部署 `main` 分支。
4. 配置 Pages 环境变量：

```text
DOUBAO_API_KEY
DOUBAO_MODEL=doubao-seedream-5-0-260128
```

5. 部署完成后手机流量访问二维码路径测试。

### P1：现场稳定性优化

- 加强 Seedream 失败兜底：如果 API 超时，仍展示 REF + POTATO，并提示“Seedream 生成失败，请重试”。
- 给 Seedream 生成按钮加“重新生成”。
- 对手机相机权限失败做更友好的提示。

### P2：宣传物料辅助

- 从 Seedream 生成结果中导出单张像素小人图。
- 可加一个“下载三宫格”或“下载像素小人”按钮。

### P3：回归主产品

轻量页稳定后，再回到完整链路：

```text
问卷 -> 磁场/兴趣 -> 硬件照片/姓名 -> Seedream 像素人 -> 入岛动效 -> MAP 小岛
```

## 9. 交接注意事项

- 固定二维码不能换 URL。
- 不要继续使用 localtunnel、局域网 IP、localhost，这些都不适合打印物料。
- 不要把 `DOUBAO_API_KEY` 提交到 GitHub。
- 不要直接 `git add .`，当前有临时目录。
- 轻量页只改 `/photo-pixel-lite` 相关内容，避免影响主站首页和完整 demo。
- 如果 Cloudflare 项目找不到，优先查谁最早创建/部署了 `pocket-friend.pages.dev`。

## 10. 常用命令

本地开发：

```bash
npm install
npm run dev
```

本地构建：

```bash
npm run build
```

测试：

```bash
npm test
```

查看当前分支：

```bash
git branch --show-current
```

查看远程分支：

```bash
git branch -r
```

谨慎提交本轮代码：

```bash
git add src/PhotoPixelLite.tsx src/App.tsx src/api/doubao-seedream.ts functions/api/seedream-lite.ts server/photo-pixel-lite-server.mjs vite.config.ts package.json public/_redirects .gitignore
git commit -m "feat: add public photo pixel lite flow"
git push fioluuuna-island feature/photo-pixel-lite-qr
```

当前这些提交已经做过，上面命令主要给后续增量修改参考。
