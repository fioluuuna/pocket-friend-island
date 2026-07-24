/**
 * @module parts/draw-hair
 * @description 在 32x32 像素网格上用 Canvas 2D API 绘制发型。
 * 支持五种发型：short / long / curly / ponytail / bald。
 */

import type { HairColorName, HairStyle } from '../../types';
import { HAIR_PALETTES } from '../pixel-palettes';

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

/**
 * 在 Canvas 上绘制头发。
 * @param ctx - Canvas 2D 渲染上下文
 * @param offsetX - 绘制起始 X 偏移（实际像素坐标）
 * @param offsetY - 绘制起始 Y 偏移（实际像素坐标）
 * @param hairStyle - 发型枚举
 * @param hairColor - 发色名称（对应 HAIR_PALETTES 的 key）
 * @param pixelSize - 每个逻辑像素的实际绘制大小，默认 1
 */
export function drawHair(
  ctx: CanvasRenderingContext2D,
  offsetX: number,
  offsetY: number,
  hairStyle: HairStyle,
  hairColor: HairColorName,
  pixelSize: number = 1,
  hairRGB?: [number, number, number],
): void {
  if (hairStyle === 'bald') {
    return;
  }

  const palette = HAIR_PALETTES[hairColor] ?? HAIR_PALETTES.black;
  const mainColor = hairRGB ? rgbToHex(hairRGB) : palette.main;
  const shadowColor = hairRGB ? adjustColor(mainColor, -38) : palette.shadow;
  const highlightColor = hairRGB ? adjustColor(mainColor, 42) : palette.highlight;

  switch (hairStyle) {
    case 'short': {
      drawShortHair(ctx, offsetX, offsetY, mainColor, shadowColor, highlightColor, pixelSize);
      break;
    }
    case 'long': {
      drawLongHair(ctx, offsetX, offsetY, mainColor, shadowColor, highlightColor, pixelSize);
      break;
    }
    case 'curly': {
      drawCurlyHair(ctx, offsetX, offsetY, mainColor, shadowColor, highlightColor, pixelSize);
      break;
    }
    case 'ponytail': {
      drawPonytailHair(ctx, offsetX, offsetY, mainColor, shadowColor, highlightColor, pixelSize);
      break;
    }
  }
}

/**
 * 短发：头顶覆盖 4-5 行像素，两侧到耳朵位置。
 */
function drawShortHair(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  main: string,
  shadow: string,
  highlight: string,
  ps: number,
): void {
  // 头顶区域 y=5~9，宽度随 y 增大而变宽
  const hairShape: Array<[number, number, number]> = [
    [5, 12, 20],  // y=5, x: 12-20
    [6, 10, 22],  // y=6, x: 10-22
    [7, 8, 24],   // y=7, x: 8-24
    [8, 7, 25],   // y=8, x: 7-25
    [9, 8, 24],   // y=9, x: 8-24
  ];

  for (const [row, startX, endX] of hairShape) {
    for (let x = startX; x <= endX; x++) {
      let color = main;
      // 高光区域
      if (x >= 13 && x <= 18 && row <= 7) {
        color = highlight;
      }
      // 边缘阴影
      if (x === startX || x === endX) {
        color = shadow;
      }
      fillPixel(ctx, x, row, color, ox, oy, ps);
    }
  }
}

/**
 * 长发：头顶 + 两侧垂到肩膀位置 (y: 0-20)。
 */
function drawLongHair(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  main: string,
  shadow: string,
  highlight: string,
  ps: number,
): void {
  // 头顶
  drawShortHair(ctx, ox, oy, main, shadow, highlight, ps);

  // 两侧长发 y=10~22
  for (let y = 10; y <= 22; y++) {
    // 左侧
    for (let dx = 0; dx < 3; dx++) {
      const x = 7 + dx;
      const color = dx === 0 ? shadow : main;
      fillPixel(ctx, x, y, color, ox, oy, ps);
    }
    // 右侧
    for (let dx = 0; dx < 3; dx++) {
      const x = 22 + dx;
      const color = dx === 2 ? shadow : main;
      fillPixel(ctx, x, y, color, ox, oy, ps);
    }
  }
}

/**
 * 卷发：波浪形边缘，用随机凸起的像素块。
 */
function drawCurlyHair(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  main: string,
  shadow: string,
  highlight: string,
  ps: number,
): void {
  // 头顶主体
  for (let y = 4; y <= 10; y++) {
    const halfWidth = 10 + Math.round(Math.sin(y * 1.5) * 2);
    for (let x = 16 - halfWidth; x <= 16 + halfWidth; x++) {
      let color = main;
      if (x >= 13 && x <= 19 && y <= 7) {
        color = highlight;
      }
      if (Math.abs(x - (16 - halfWidth)) <= 1 || Math.abs(x - (16 + halfWidth)) <= 1) {
        color = shadow;
      }
      fillPixel(ctx, x, y, color, ox, oy, ps);
    }
  }

  // 卷曲的侧发
  const curlyOffsets = [0, -1, 0, 1, 0, -1, 0, 1, 0];
  for (let y = 11; y <= 19; y++) {
    const idx = y - 11;
    const offset = curlyOffsets[idx % curlyOffsets.length];
    // 左侧卷发
    fillPixel(ctx, 7 + offset, y, main, ox, oy, ps);
    fillPixel(ctx, 8 + offset, y, shadow, ox, oy, ps);
    // 右侧卷发
    fillPixel(ctx, 24 + offset, y, main, ox, oy, ps);
    fillPixel(ctx, 23 + offset, y, shadow, ox, oy, ps);
  }
}

/**
 * 马尾：头顶扎起，后方 2-3 像素宽的尾巴垂下。
 */
function drawPonytailHair(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  main: string,
  shadow: string,
  highlight: string,
  ps: number,
): void {
  // 头顶（和短发类似但稍小）
  const hairShape: Array<[number, number, number]> = [
    [5, 12, 20],
    [6, 11, 21],
    [7, 9, 23],
    [8, 8, 24],
  ];

  for (const [row, startX, endX] of hairShape) {
    for (let x = startX; x <= endX; x++) {
      let color = main;
      if (x >= 14 && x <= 18 && row <= 7) {
        color = highlight;
      }
      if (x === startX || x === endX) {
        color = shadow;
      }
      fillPixel(ctx, x, row, color, ox, oy, ps);
    }
  }

  // 扎起的小结（头顶中央偏后）
  fillPixel(ctx, 16, 4, shadow, ox, oy, ps);
  fillPixel(ctx, 17, 4, main, ox, oy, ps);
  fillPixel(ctx, 16, 5, main, ox, oy, ps);

  // 马尾尾巴（从头顶后方垂下）
  for (let y = 6; y <= 22; y++) {
    fillPixel(ctx, 25, y, main, ox, oy, ps);
    fillPixel(ctx, 26, y, shadow, ox, oy, ps);
    if (y <= 20) {
      fillPixel(ctx, 27, y, main, ox, oy, ps);
    }
  }
}

function rgbToHex(rgb: [number, number, number]): string {
  return `#${rgb.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

function adjustColor(hex: string, amount: number): string {
  const clean = hex.replace('#', '');
  const r = Math.max(0, Math.min(255, parseInt(clean.slice(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(clean.slice(2, 4), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(clean.slice(4, 6), 16) + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
