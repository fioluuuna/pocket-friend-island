/**
 * @module parts/draw-face
 * @description 在 32x32 像素网格上用 Canvas 2D API 程序化绘制脸型。
 * 支持五种脸型：round / oval / square / long / heart。
 */

import type { FaceShape, SkinTone } from '../../types';
import { SKIN_PALETTES } from '../pixel-palettes';

/** 判断坐标 (px, py) 是否在椭圆内 */
function isInsideEllipse(
  px: number,
  py: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
): boolean {
  const dx = px - cx;
  const dy = py - cy;
  return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1;
}

/** 判断坐标是否在圆角矩形内 */
function isInsideRoundedRect(
  px: number,
  py: number,
  rx: number,
  ry: number,
  w: number,
  h: number,
  radius: number,
): boolean {
  if (px < rx || px >= rx + w || py < ry || py >= ry + h) return false;

  const nearLeft = px - rx;
  const nearRight = rx + w - 1 - px;
  const nearTop = py - ry;
  const nearBottom = ry + h - 1 - py;

  const cornerX = Math.min(nearLeft, nearRight);
  const cornerY = Math.min(nearTop, nearBottom);

  if (cornerX < radius && cornerY < radius) {
    const cdx = cornerX - radius;
    const cdy = cornerY - radius;
    return cdx * cdx + cdy * cdy <= radius * radius;
  }

  return true;
}

/**
 * 在 Canvas 上绘制 32x32 像素脸型。
 * @param ctx - Canvas 2D 渲染上下文
 * @param offsetX - 绘制起始 X 偏移（实际像素坐标）
 * @param offsetY - 绘制起始 Y 偏移（实际像素坐标）
 * @param faceShape - 脸型枚举
 * @param skinTone - 肤色枚举
 * @param pixelSize - 每个逻辑像素的实际绘制大小，默认 1
 */
export function drawFace(
  ctx: CanvasRenderingContext2D,
  offsetX: number,
  offsetY: number,
  faceShape: FaceShape,
  skinTone: SkinTone,
  pixelSize: number = 1,
): void {
  const palette = SKIN_PALETTES[skinTone];
  const mainColor = palette.main;
  const shadowColor = palette.shadow;
  const highlightColor = palette.highlight;

  // 遍历 32x32 网格，逐像素判断是否属于脸部区域
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const inside = isFacePixel(x, y, faceShape);
      if (!inside) continue;

      // 根据位置选择颜色：底部和两侧偏下区域用阴影色
      let color = mainColor;

      if (isShadowRegion(x, y, faceShape)) {
        color = shadowColor;
      } else if (isHighlightRegion(x, y)) {
        color = highlightColor;
      }

      ctx.fillStyle = color;
      ctx.fillRect(
        offsetX + x * pixelSize,
        offsetY + y * pixelSize,
        pixelSize,
        pixelSize,
      );
    }
  }
}

/**
 * 判断逻辑坐标 (x, y) 是否属于指定脸型的内部。
 * 脸部区域大约在 y=6 到 y=24，中心 x=16。
 */
function isFacePixel(x: number, y: number, faceShape: FaceShape): boolean {
  switch (faceShape) {
    case 'round': {
      // 圆形：中心 (16, 15)，水平半径 12，垂直半径 11
      return isInsideEllipse(x, y, 16, 15, 12, 11);
    }
    case 'oval': {
      // 椭圆：稍窄，上下拉长
      return isInsideEllipse(x, y, 16, 15, 10, 12);
    }
    case 'square': {
      // 方形：圆角方形，宽 22，高 18，圆角半径 4
      return isInsideRoundedRect(x, y, 5, 6, 22, 18, 4);
    }
    case 'long': {
      // 长脸：椭圆纵向拉长
      return isInsideEllipse(x, y, 16, 15, 10, 14);
    }
    case 'heart': {
      // 心形：额头宽，下巴尖
      return isHeartShape(x, y);
    }
    default: {
      return isInsideEllipse(x, y, 16, 15, 12, 11);
    }
  }
}

/**
 * 心形脸的像素判断：上宽下尖。
 * 上半部分用宽椭圆，下半部分逐渐收窄成三角形。
 */
function isHeartShape(x: number, y: number): boolean {
  const cx = 16;
  const topY = 7;
  const midY = 16;
  const bottomY = 23;

  if (y < topY || y > bottomY) return false;

  if (y <= midY) {
    // 上半部分：宽椭圆
    const progress = (y - topY) / (midY - topY);
    const halfWidth = 13 - progress * 2;
    return x >= cx - halfWidth && x <= cx + halfWidth;
  } else {
    // 下半部分：逐渐收窄
    const progress = (y - midY) / (bottomY - midY);
    const halfWidth = 11 - progress * 9;
    return x >= cx - halfWidth && x <= cx + halfWidth;
  }
}

/**
 * 判断是否为阴影区域（下巴、侧脸下方）。
 */
function isShadowRegion(x: number, y: number, faceShape: FaceShape): boolean {
  // 下巴区域（脸型底部 3 行）
  if (isFacePixel(x, y - 3, faceShape) && !isFacePixel(x, y - 4, faceShape)) {
    return true;
  }
  // 侧面下方
  if (y >= 17 && (x <= 7 || x >= 25)) {
    return true;
  }
  return false;
}

/**
 * 判断是否为高光区域（额头中央偏上）。
 */
function isHighlightRegion(x: number, y: number): boolean {
  // 额头中央小区域
  return x >= 13 && x <= 19 && y >= 8 && y <= 10;
}
