# 四个场景宣传素材交接

仓库：`https://github.com/fioluuuna/pocket-friend-island`  
分支：`feature/encounter-profile-arrival-flow`  
用途：给宣传/视觉队友提取四个场景图、录制场景内小人动态、做海报/视频/路演素材。

## 1. 先说结论

如果只想要“能动的四场景前端演示”，直接看这个文件：

```text
apps/mobile/public/scene-publicity-demo.html
```

本地启动前端后访问：

```text
http://127.0.0.1:5175/scene-publicity-demo.html
```

这个页面已经把四个场景、动态小人、真人照片 badge、点击气泡、全屏录制按钮都单独抽出来了，不需要走登录/问卷/硬件照片流程。

四个场景不是单独的视频文件，也不是 GIF。现在项目里的正式实现方式是：

```text
场景背景 PNG
+ Canvas 动态小人绘制
+ 真人照片 badge
+ 名字标签
+ 对话气泡
+ 点击小人反馈
+ 横屏展示
```

所以宣传队友有两种拿素材方式：

1. 直接拿四张静态场景图做宣传背景。
2. 本地跑项目，进入 PALS 页面后点四个建筑，录制每个场景里的动态效果。

## 2. 四张单独场景图在仓库哪里

仓库路径：

```text
apps/mobile/public/assets/scenes/venture-center.png
apps/mobile/public/assets/scenes/all-night-lab.png
apps/mobile/public/assets/scenes/pitch-stage.png
apps/mobile/public/assets/scenes/academic-center.png
```

对应中文场景：

| 文件 | 场景名 | 用途理解 |
| --- | --- | --- |
| `venture-center.png` | 湖畔创业中心 | 共创、桌游、临时灵感碰撞 |
| `all-night-lab.png` | 通宵实验室 | 调试、补 demo、安静并肩 |
| `pitch-stage.png` | 路演舞台 | 展示、鼓掌、互相记住作品 |
| `academic-center.png` | 杭州未来科技城学术交流中心 | 正式相遇、会后聊天、深度交换 |

总岛入口图在这里：

```text
apps/mobile/public/assets/scene-hackathon.png
```

备用/近景图在这里：

```text
apps/mobile/public/assets/scene-alt.png
```

## 3. 动态效果代码在仓库哪里

核心 Canvas 动效组件：

```text
apps/mobile/src/components/InteractiveIsland.tsx
```

这里负责：

- 画背景图。
- 让像素小人入场跳进场景。
- 让小人在场景 walk 区域内慢慢移动。
- 绘制 Seedream 像素小人。
- 在小人头顶绘制真人照片 badge。
- 绘制名字标签。
- 绘制气泡文案。
- 点击小人时放大/弹一下并切换选中状态。

PALS 页面和四个建筑入口：

```text
apps/mobile/src/components/HomeWorld.tsx
```

这里负责：

- 总岛展示。
- 四个建筑热点。
- 点击建筑进入对应场景。
- BACK 返回总岛。
- 横屏展示按钮。
- 场景居民列表和卡片信息。

四个场景的数据配置：

```text
apps/gateway/src/productStore.ts
apps/mobile/src/app/productApi.ts
```

其中重要字段：

```ts
{
  id: "venture-center",
  name: "湖畔创业中心",
  shortName: "创业中心",
  assetUrl: "/assets/scenes/venture-center.png",
  outerX: 0.43,
  outerY: 0.52,
  walk: { x1: 0.18, x2: 0.88, y1: 0.48, y2: 0.86 },
}
```

说明：

- `assetUrl` 是场景图。
- `outerX / outerY` 是总岛上建筑热点位置。
- `walk` 是小人在场景里可以移动的区域。

## 4. 怎么录制四个动态场景

本地启动：

```bash
npm run dev:gateway
```

另开一个终端：

```bash
cd apps/mobile
npx vite --host 0.0.0.0 --port 5175 --strictPort
```

打开：

```text
http://127.0.0.1:5175/
```

录制路径：

1. 完成登录、问卷、Pendant、Arrival。
2. 进入底部 `PALS`。
3. 在总岛上点四个建筑。
4. 进入场景后，小人会自动移动，头顶会有真人照片 badge。
5. 点右下角横屏按钮，可以录更适合宣传视频的横屏画面。
6. 每个场景录 5-8 秒即可。

## 5. 给宣传队友的最快拿图方式

如果他只要静态图：

```text
下载 apps/mobile/public/assets/scenes/ 下的四张 PNG
```

如果他要动态视频：

```text
本地跑项目 -> PALS -> 点建筑进场景 -> 横屏 -> 屏幕录制
```

## 6. 可以直接发给队友的 GitHub 链接

功能分支：

```text
https://github.com/fioluuuna/pocket-friend-island/tree/feature/encounter-profile-arrival-flow
```

场景素材目录：

```text
https://github.com/fioluuuna/pocket-friend-island/tree/feature/encounter-profile-arrival-flow/apps/mobile/public/assets/scenes
```

动效组件：

```text
https://github.com/fioluuuna/pocket-friend-island/blob/feature/encounter-profile-arrival-flow/apps/mobile/src/components/InteractiveIsland.tsx
```

独立动态演示页：

```text
https://github.com/fioluuuna/pocket-friend-island/blob/feature/encounter-profile-arrival-flow/apps/mobile/public/scene-publicity-demo.html
```

PALS 页面：

```text
https://github.com/fioluuuna/pocket-friend-island/blob/feature/encounter-profile-arrival-flow/apps/mobile/src/components/HomeWorld.tsx
```

## 7. 注意事项

- 不要让宣传队友只截 MAP 页，MAP 是高德地图功能区，不是四个像素场景区。
- 四个像素场景在 PALS 页。
- 如果要拍“脸盲解决”卖点，画面重点是：像素小人下面动，真人照片 badge 顶在头上。
- 如果页面没有真实居民，先跑一次硬件照片 -> Seedream -> 入岛流程。
- `.env` 不在仓库里，需要单独手动发给开发队友，宣传队友如果只拿图不需要 `.env`。

## 8. 一句话说明

宣传用的四个场景图在 `apps/mobile/public/assets/scenes/`；动态效果在 `InteractiveIsland.tsx`，入口交互在 `HomeWorld.tsx`。要视频就跑项目录 PALS 横屏，要静态图就直接拿四张 PNG。
