/**
 * @module parts/draw-body
 * @description 在 32x32 像素网格上用 Canvas 2D API 绘制身体。
 * 采用 2-3 头身比例，从脸下方开始绘制 T 恤和手臂。
 */

import type { SkinTone } from '../../types';
import { SKIN_PALETTES } from '../pixel-palettes';

/** 填充单个像素 */
function fillPixel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  offsetX: number,
  offsetY: number,
  pixelSize: number,
): void {
  ctx.fillStyle = color;
  ctx.fillRect(
    offsetX + x * pixelSize,
    offsetY + y * pixelSize,
    pixelSize,
    pixelSize,
  );
}

/** 将 HEX 颜色变暗，用于生成阴影色 */
function darkenColor(hex: string, amount: number = 30): string {
  const clean = hex.replace('#', '');
  const r = Math.max(0, parseInt(clean.substring(0, 2), 16) - amount);
  const g = Math.max(0, parseInt(clean.substring(2, 4), 16) - amount);
  const b = Math.max(0, parseInt(clean.substring(4, 6), 16) - amount);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/** 将 HEX 颜色变亮，用于生成高光色 */
function lightenColor(hex: string, amount: number = 30): string {
  const clean = hex.replace('#', '');
  const r = Math.min(255, parseInt(clean.substring(0, 2), 16) + amount);
  const g = Math.min(255, parseInt(clean.substring(2, 4), 16) + amount);
  const b = Math.min(255, parseInt(clean.substring(4, 6), 16) + amount);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * 在 Canvas 上绘制身体。
 * @param ctx - Canvas 2D 渲染上下文
 * @param offsetX - 绘制起始 X 偏移（实际像素坐标）
 * @param offsetY - 绘制起始 Y 偏移（实际像素坐标）
 * @param shirtColor - T 恤颜色 HEX 字符串
 * @param pixelSize - 每个逻辑像素的实际绘制大小，默认 1
 */
export function drawBody(
  ctx: CanvasRenderingContext2D,
  offsetX: number,
  offsetY: number,
  shirtColor: string,
  pixelSize: number = 1,
  skinTone: SkinTone = 'light',
  skinRGB?: [number, number, number],
): void {
  const mainColor = shirtColor;
  const shadowColor = darkenColor(shirtColor, 40);
  const highlightColor = lightenColor(shirtColor, 25);
  const skinPalette = SKIN_PALETTES[skinTone];
  const skinColor = skinRGB ? rgbToHex(skinRGB) : skinPalette.main;
  const skinShadow = skinRGB ? darkenColor(skinColor, 28) : skinPalette.shadow;

  // 脖子 (y=22~23, x=14~18)
  for (let y = 22; y <= 23; y++) {
    for (let x = 14; x <= 18; x++) {
      fillPixel(ctx, x, y, skinShadow, offsetX, offsetY, pixelSize);
    }
  }

  // 肩膀和身体 (y=24~30)
  for (let y = 24; y <= 30; y++) {
    // 身体宽度随 y 变化：肩膀宽，腰部略窄
    let bodyStart = 10;
    let bodyEnd = 22;

    // 肩膀区域加宽
    if (y === 24) {
      bodyStart = 8;
      bodyEnd = 24;
    } else if (y === 25) {
      bodyStart = 9;
      bodyEnd = 23;
    }
    // 底部略收窄
    if (y >= 29) {
      bodyStart = 11;
      bodyEnd = 21;
    }

    for (let x = bodyStart; x <= bodyEnd; x++) {
      let color = mainColor;

      // 两侧阴影
      if (x === bodyStart || x === bodyEnd) {
        color = shadowColor;
      }
      // 中央高光
      if (x >= 14 && x <= 18 && y >= 25 && y <= 28) {
        color = highlightColor;
      }

      fillPixel(ctx, x, y, color, offsetX, offsetY, pixelSize);
    }
  }

  // 手臂（两侧各 2 像素宽，y=25~30）
  for (let y = 25; y <= 30; y++) {
    // 左手臂
    fillPixel(ctx, 7, y, skinShadow, offsetX, offsetY, pixelSize);
    fillPixel(ctx, 8, y, skinColor, offsetX, offsetY, pixelSize);
    // 右手臂
    fillPixel(ctx, 23, y, skinColor, offsetX, offsetY, pixelSize);
    fillPixel(ctx, 24, y, skinShadow, offsetX, offsetY, pixelSize);
  }
}

function rgbToHex(rgb: [number, number, number]): string {
  return `#${rgb.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}
