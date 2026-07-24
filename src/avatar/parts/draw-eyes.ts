/**
 * @module parts/draw-eyes
 * @description 在 32x32 像素网格上用 Canvas 2D API 绘制眼睛。
 * 支持三种大小：big / medium / small，间距可调。
 */

import type { EyeSize } from '../../types';

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
 * 在 Canvas 上绘制眼睛。
 * @param ctx - Canvas 2D 渲染上下文
 * @param offsetX - 绘制起始 X 偏移（实际像素坐标）
 * @param offsetY - 绘制起始 Y 偏移（实际像素坐标）
 * @param eyeSize - 眼睛大小枚举
 * @param eyeDistance - 眼间距归一化值 0-1，0=很近，1=很远
 * @param pixelSize - 每个逻辑像素的实际绘制大小，默认 1
 */
export function drawEyes(
  ctx: CanvasRenderingContext2D,
  offsetX: number,
  offsetY: number,
  eyeSize: EyeSize,
  eyeDistance: number,
  pixelSize: number = 1,
): void {
  const centerX = 16;
  const eyeY = 12; // 眼睛位于脸的上半部分
  const gap = 3 + Math.round(eyeDistance * 4); // 间距 3-7 像素

  const leftEyeX = centerX - gap;
  const rightEyeX = centerX + gap;

  const eyeWhite = '#FFFFFF';
  const pupilColor = '#1a1a2e';
  const highlightColor = '#FFFFFF';

  switch (eyeSize) {
    case 'big': {
      // 大眼：4x3 眼白 + 2x2 瞳孔 + 1x1 高光
      fillEyeBig(ctx, leftEyeX, eyeY, eyeWhite, pupilColor, highlightColor, offsetX, offsetY, pixelSize);
      fillEyeBig(ctx, rightEyeX, eyeY, eyeWhite, pupilColor, highlightColor, offsetX, offsetY, pixelSize);
      break;
    }
    case 'medium': {
      // 中眼：3x2 眼白 + 1x1 瞳孔
      fillEyeMedium(ctx, leftEyeX, eyeY, eyeWhite, pupilColor, offsetX, offsetY, pixelSize);
      fillEyeMedium(ctx, rightEyeX, eyeY, eyeWhite, pupilColor, offsetX, offsetY, pixelSize);
      break;
    }
    case 'small': {
      // 小眼：2x2 纯黑小点
      fillEyeSmall(ctx, leftEyeX, eyeY, pupilColor, offsetX, offsetY, pixelSize);
      fillEyeSmall(ctx, rightEyeX, eyeY, pupilColor, offsetX, offsetY, pixelSize);
      break;
    }
  }
}

/** 绘制大号眼睛 (4x3 眼白 + 2x2 瞳孔 + 1x1 高光) */
function fillEyeBig(
  ctx: CanvasRenderingContext2D,
  eyeX: number,
  eyeY: number,
  white: string,
  pupil: string,
  highlight: string,
  ox: number,
  oy: number,
  ps: number,
): void {
  // 眼白 4x3 (居中在 eyeX, eyeY)
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -2; dx <= 1; dx++) {
      fillPixel(ctx, eyeX + dx, eyeY + dy, white, ox, oy, ps);
    }
  }
  // 瞳孔 2x2
  fillPixel(ctx, eyeX - 1, eyeY, pupil, ox, oy, ps);
  fillPixel(ctx, eyeX, eyeY, pupil, ox, oy, ps);
  fillPixel(ctx, eyeX - 1, eyeY + 1, pupil, ox, oy, ps);
  fillPixel(ctx, eyeX, eyeY + 1, pupil, ox, oy, ps);
  // 高光 1x1
  fillPixel(ctx, eyeX - 1, eyeY - 1, highlight, ox, oy, ps);
}

/** 绘制中号眼睛 (3x2 眼白 + 1x1 瞳孔) */
function fillEyeMedium(
  ctx: CanvasRenderingContext2D,
  eyeX: number,
  eyeY: number,
  white: string,
  pupil: string,
  ox: number,
  oy: number,
  ps: number,
): void {
  // 眼白 3x2
  for (let dy = 0; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      fillPixel(ctx, eyeX + dx, eyeY + dy, white, ox, oy, ps);
    }
  }
  // 瞳孔 1x1
  fillPixel(ctx, eyeX, eyeY, pupil, ox, oy, ps);
}

/** 绘制小号眼睛 (2x2 纯黑) */
function fillEyeSmall(
  ctx: CanvasRenderingContext2D,
  eyeX: number,
  eyeY: number,
  color: string,
  ox: number,
  oy: number,
  ps: number,
): void {
  fillPixel(ctx, eyeX, eyeY, color, ox, oy, ps);
  fillPixel(ctx, eyeX + 1, eyeY, color, ox, oy, ps);
  fillPixel(ctx, eyeX, eyeY + 1, color, ox, oy, ps);
  fillPixel(ctx, eyeX + 1, eyeY + 1, color, ox, oy, ps);
}
