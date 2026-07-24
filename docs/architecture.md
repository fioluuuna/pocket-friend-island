# Pocket Friend Island Web - 架构文档

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 框架 | React | 19 |
| 游戏引擎 | Phaser | 3 |
| 语言 | TypeScript | 5.x (strict mode) |
| 构建 | Vite | 6.x |
| 样式 | CSS (内联 + 全局类) | - |
| 字体 | Press Start 2P (Google Fonts) | - |

## 模块职责

```
src/
├── types.ts              # 全局类型定义（PlayerProfile, MatchResult, 枚举映射等）
├── App.tsx               # 主应用组件（视图切换、状态管理、匹配逻辑）
├── main.tsx              # React 入口
├── index.css             # 全局像素风样式（CSS 变量、动画、通用类）
├── vite-env.d.ts         # Vite 类型声明
│
├── island/               # Phaser 游戏场景模块
│   ├── phaser-config.ts  #   Phaser 3 配置（800x600, pixelArt, arcade physics）
│   ├── IslandScene.tsx   #   React 包装组件（生命周期管理）
│   ├── index.ts          #   barrel export
│   ├── scenes/
│   │   └── IslandScene.ts#   主场景（天空、小岛、树木、房屋、瀑布动画、居民管理）
│   └── sprites/
│       ├── IslandBackground.ts  #   背景绘制工具类（纯 Canvas fillRect）
│       └── ResidentSprite.ts    #   居民精灵（idle 浮动、跳入动画）
│
├── components/           # UI 组件模块
│   ├── PixelButton.tsx   #   像素风格按钮（primary/secondary/danger）
│   ├── MatchCard.tsx     #   匹配结果卡片（分数、标签、画像、操作按钮）
│   ├── RadarUI.tsx       #   CSS 雷达扫描 UI（旋转扫描线、设备点）
│   ├── AvatarPreview.tsx#   像素小人头像预览
│   └── index.ts          #   barrel export
│
├── mock/                 # Mock 数据层
│   ├── mock-players.ts   #   10 个模拟玩家 + 当前用户资料
│   ├── ble-scanner.ts    #   模拟 BLE 扫描器（EventTarget, 定时触发 scan 事件）
│   └── index.ts          #   barrel export
│
└── api/                  # API 层（placeholder）
    ├── client.ts         #   HTTP 客户端（fetchNearbyPlayers, uploadPhoto, reportProximity）
    ├── websocket.ts      #   WebSocket 管理（connect, onMatch, onCapture）
    └── index.ts          #   barrel export
```

## 数据流

```
MockBLEScanner.startScan()
  │
  ├── 每 3s 随机选取 0-3 个 MOCK_PLAYERS
  ├── 生成随机距离 (1-15m)
  ├── 过滤 <= 10m 的设备
  │
  ▼
dispatch CustomEvent('scan', ProximityEvent[])
  │
  ▼
App.handleScan()
  ├── 更新 radarDevices（附加 matchTier）
  ├── calculateMatch() → MatchResult[]
  ├── 更新 nearbyMatches（去重保留最高分）
  └── 更新 residents（tier >= medium 的加入小岛）
      │
      ▼
  IslandSceneComponent → Phaser IslandScene
  RadarUI → 显示检测到的设备
  高匹配自动切换 → matching 视图 → MatchCard
```

## 匹配算法概述

匹配分数 (0-100) 计算逻辑：

1. **共同兴趣**：每个共同标签 +15 分
2. **风格互补**：协作风格不同 +10 分
3. **节奏互补**：社交节奏不同 +5 分
4. **随机波动**：0-9 分（模拟真实匹配的不确定性）

| 分数区间 | 匹配等级 | 颜色 |
|----------|---------|------|
| >= 60    | high    | 红色 #EF5350 |
| 35-59    | medium  | 黄色 #FFD54F |
| < 35     | low     | 绿色 #A5D6A7 |

## 视觉风格

- **像素艺术**：所有图形使用 `fillRect` 逐像素绘制，`image-rendering: pixelated`
- **字体**：Press Start 2P（Google Fonts）
- **配色**：天蓝天空 (#87CEEB)、绿色草地 (#7CB342)、棕色土壤 (#8D6E63)、彩色屋顶
- **UI 控件**：3px 实线边框 + box-shadow 凸起效果，hover/active 位移反馈
- **动画**：CSS @keyframes 驱动雷达旋转、中心闪烁；Phaser tween 驱动居民浮动和瀑布
