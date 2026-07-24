# Pocket Friend Island Web

Pocket Friend 的网页版小岛家园 + 匹配算法 + 像素小人生成模块。

## 技术栈

- **构建**: Vite 6 + React 19 + TypeScript 5.5
- **游戏渲染**: Phaser 3 (像素画模式)
- **匹配算法**: Pocket Match 双维度加权匹配引擎（协作画像适配分 0-50 + 标签匹配分 0-50 = 综合匹配分 0-100）
- **像素生成**: Canvas 2D API 程序化零件拼接（脸型/眼睛/发型/身体）
- **人脸检测**: MediaPipe Face Mesh（468 关键点特征提取，可选依赖）
- **测试**: Vitest

## 核心模块

### matching/ - Pocket Match 匹配引擎
- `engine.ts` - 综合匹配引擎 calculateMatchScore()
- `collaboration-matrix.ts` - 8x8 协作风格兼容矩阵 + 4x4 社交节奏兼容矩阵
- `overlap.ts` - 标签重合度（Jaccard 变种）
- `complement.ts` - 互补标签规则表（25+ 条规则）

### avatar/ - 像素风小人生成
- `pixel-generator.ts` - 主生成函数 generatePixelAvatar()
- `parts/draw-face.ts` - 5 种脸型 Canvas 绘制
- `parts/draw-eyes.ts` - 3 种眼睛大小绘制
- `parts/draw-hair.ts` - 5 种发型绘制
- `parts/draw-body.ts` - 身体/衣服绘制
- `face-detector.ts` - MediaPipe Face Mesh 封装
- `feature-extractor.ts` - 468 关键点 → 脸型/眼睛/肤色特征

### island/ - 小岛游戏场景
- `IslandScene.tsx` - React 组件（Phaser 3 挂载）
- `scenes/IslandScene.ts` - 漂浮小岛主场景（天空、草地、瀑布、小房子、设备）
- `sprites/ResidentSprite.ts` - 像素居民 Sprite（待机浮动、跳跃进入）

### components/ - UI 组件
- `PixelButton.tsx` - 像素风格按钮
- `MatchCard.tsx` - 匹配结果卡片
- `RadarUI.tsx` - 雷达扫描 UI
- `AvatarPreview.tsx` - 像素小人预览

## 快速开始

```bash
npm install
npm run dev     # 启动开发服务器 localhost:5173
npm run test    # 运行匹配算法测试
npm run build   # 构建生产版本
```

## 视觉风格

16-bit 像素 RPG 风格，参考《星露谷》《动物森友会》：
- 天蓝渐变天空 + 像素白云
- 绿色漂浮小岛 + 棕色土壤断层 + 瀑布动画
- 彩色屋顶小房子 + 像素树
- Press Start 2P 像素字体
- 2-3 头身像素小人
