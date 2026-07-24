/**
 * 小岛背景绘制工具类
 * @description 提供静态方法，用纯 Canvas fillRect 逐像素绘制天空、云朵、小岛、树木、房屋、瀑布
 * @module island/sprites/IslandBackground
 */

/** Canvas 2D 渲染上下文类型 */
type Ctx = CanvasRenderingContext2D;

/** 像素单位大小 */
const PX = 4;

/**
 * 绘制天蓝色渐变天空
 * @param ctx - Canvas 2D 渲染上下文
 * @param width - 画布宽度
 * @param height - 画布高度
 */
export function drawSky(ctx: Ctx, width: number, height: number): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#87CEEB');
  gradient.addColorStop(1, '#B3E5FC');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

/**
 * 绘制白色像素云朵
 * @param ctx - Canvas 2D 渲染上下文
 * @param x - 云朵左上角 X 坐标
 * @param y - 云朵左上角 Y 坐标
 */
export function drawCloud(ctx: Ctx, x: number, y: number): void {
  ctx.fillStyle = '#FFFFFF';
  // 上排像素
  ctx.fillRect(x + PX * 2, y, PX * 4, PX);
  ctx.fillRect(x + PX, y + PX, PX * 6, PX);
  // 中排像素
  ctx.fillRect(x, y + PX * 2, PX * 8, PX);
  // 下排像素
  ctx.fillRect(x + PX, y + PX * 3, PX * 6, PX);
  ctx.fillRect(x + PX * 2, y + PX * 4, PX * 4, PX);
}

/**
 * 绘制绿色草地小岛（含土壤断层）
 * @param ctx - Canvas 2D 渲染上下文
 * @param centerX - 小岛中心 X 坐标
 * @param centerY - 小岛中心 Y 坐标
 */
export function drawIsland(ctx: Ctx, centerX: number, centerY: number): void {
  const islandWidth = 300;
  const islandHeight = 120;
  const startX = centerX - islandWidth / 2;
  const startY = centerY - islandHeight / 2;

  // 土壤层（下方断层）
  ctx.fillStyle = '#8D6E63';
  for (let row = 0; row < PX * 6; row += PX) {
    const currentY = startY + islandHeight - PX * 8 + row;
    const offset = row * 0.6;
    ctx.fillRect(
      startX + PX * 2 + offset,
      currentY,
      islandWidth - PX * 4 - offset * 2,
      PX
    );
  }

  // 草地椭圆主体
  ctx.fillStyle = '#7CB342';
  for (let row = 0; row < islandHeight - PX * 4; row += PX) {
    const t = row / (islandHeight - PX * 4);
    const halfWidth = (islandWidth / 2) * Math.sqrt(1 - t * t) * 0.9;
    const currentY = startY + row;
    ctx.fillRect(
      centerX - halfWidth,
      currentY,
      halfWidth * 2,
      PX
    );
  }

  // 草地高光
  ctx.fillStyle = '#8BC34A';
  for (let row = 0; row < islandHeight * 0.3; row += PX) {
    const t = row / (islandHeight - PX * 4);
    const halfWidth = (islandWidth / 2) * Math.sqrt(1 - t * t) * 0.6;
    const currentY = startY + row + PX;
    ctx.fillRect(
      centerX - halfWidth + PX * 2,
      currentY,
      halfWidth * 1.2,
      PX
    );
  }
}

/**
 * 绘制像素树
 * @param ctx - Canvas 2D 渲染上下文
 * @param x - 树底部中心 X 坐标
 * @param y - 树底部 Y 坐标
 */
export function drawTree(ctx: Ctx, x: number, y: number): void {
  const px = PX;

  // 树干（棕色）
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(x - px, y - px * 6, px * 2, px * 6);

  // 树冠层（深绿 + 浅绿层次）
  // 顶层 - 浅绿
  ctx.fillStyle = '#7CB342';
  ctx.fillRect(x - px * 3, y - px * 10, px * 6, px);
  ctx.fillRect(x - px * 4, y - px * 9, px * 8, px);

  // 中层 - 深绿
  ctx.fillStyle = '#558B2F';
  ctx.fillRect(x - px * 5, y - px * 8, px * 10, px * 2);

  // 下层 - 浅绿
  ctx.fillStyle = '#7CB342';
  ctx.fillRect(x - px * 4, y - px * 6, px * 8, px * 2);

  // 高光点缀
  ctx.fillStyle = '#9CCC65';
  ctx.fillRect(x - px * 2, y - px * 9, px, px);
  ctx.fillRect(x + px, y - px * 8, px, px);
}

/**
 * 绘制像素小房子
 * @param ctx - Canvas 2D 渲染上下文
 * @param x - 房子左下角 X 坐标
 * @param y - 房子底部 Y 坐标
 * @param roofColor - 屋顶颜色（如 '#F48FB1' 粉色 或 '#4FC3F7' 蓝色）
 * @param wallColor - 墙壁颜色（如 '#FFF8E1' 米色 或 '#FFFFFF' 白色）
 */
export function drawHouse(
  ctx: Ctx,
  x: number,
  y: number,
  roofColor: string,
  wallColor: string
): void {
  const px = PX;

  // 墙壁
  ctx.fillStyle = wallColor;
  ctx.fillRect(x, y - px * 5, px * 10, px * 5);

  // 屋顶（三角形 - 用 fillRect 模拟像素三角）
  ctx.fillStyle = roofColor;
  // 屋顶逐行缩进
  ctx.fillRect(x + px, y - px * 6, px * 8, px);
  ctx.fillRect(x + px * 2, y - px * 7, px * 6, px);
  ctx.fillRect(x + px * 3, y - px * 8, px * 4, px);
  ctx.fillRect(x + px * 4, y - px * 9, px * 2, px);

  // 门（深棕色）
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(x + px * 4, y - px * 3, px * 2, px * 3);

  // 窗户
  ctx.fillStyle = '#BBDEFB';
  ctx.fillRect(x + px * 1, y - px * 4, px * 2, px * 2);
  ctx.fillRect(x + px * 7, y - px * 4, px * 2, px * 2);

  // 窗户十字框
  ctx.fillStyle = '#5D4037';
  ctx.fillRect(x + px * 1, y - px * 3, px * 2, px);
  ctx.fillRect(x + px * 2, y - px * 4, px, px * 2);
  ctx.fillRect(x + px * 7, y - px * 3, px * 2, px);
  ctx.fillRect(x + px * 8, y - px * 4, px, px * 2);

  // 屋顶边框高光
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillRect(x + px, y - px * 6, px * 8, px);
}

/**
 * 绘制像素瀑布（基于帧号变化水流）
 * @param ctx - Canvas 2D 渲染上下文
 * @param x - 瀑布左上角 X 坐标
 * @param y - 瀑布顶部 Y 坐标
 * @param frame - 动画帧号（用于水流偏移）
 */
export function drawWaterfall(
  ctx: Ctx,
  x: number,
  y: number,
  frame: number
): void {
  const px = PX;
  const waterfallHeight = 60;
  const offset = (frame % 4) * px;

  // 瀑布主体（蓝色水流）
  ctx.fillStyle = '#4FC3F7';
  for (let row = 0; row < waterfallHeight; row += px) {
    const shift = ((row + offset) % (px * 3)) === 0 ? px : 0;
    ctx.fillRect(x + shift, y + row, px * 2, px);
  }

  // 瀑布白色高光
  ctx.fillStyle = '#FFFFFF';
  for (let row = offset; row < waterfallHeight; row += px * 4) {
    ctx.fillRect(x, y + row, px, px);
  }

  // 底部水花
  ctx.fillStyle = '#B3E5FC';
  ctx.fillRect(x - px, y + waterfallHeight, px * 4, px);
  ctx.fillRect(x - px * 2, y + waterfallHeight + px, px * 6, px);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(x, y + waterfallHeight - px, px, px);
}

/** 命名空间对象，将所有绘制方法聚合为一个整体导出 */
export const IslandBackground = {
  drawSky,
  drawCloud,
  drawIsland,
  drawTree,
  drawHouse,
  drawWaterfall,
} as const;
