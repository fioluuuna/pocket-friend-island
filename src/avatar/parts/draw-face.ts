import type { FaceShape, SkinTone } from '../../types';
import { SKIN_PALETTES } from '../pixel-palettes';

export function drawFace(
  ctx: CanvasRenderingContext2D,
  offsetX: number,
  offsetY: number,
  faceShape: FaceShape,
  skinTone: SkinTone,
  pixelSize: number = 1,
  skinRGB?: [number, number, number],
): void {
  const palette = SKIN_PALETTES[skinTone];
  const mainColor = skinRGB ? rgbToHex(skinRGB) : palette.main;
  const shadowColor = skinRGB ? adjustColor(mainColor, -32) : palette.shadow;
  const highlightColor = skinRGB ? adjustColor(mainColor, 28) : palette.highlight;

  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      if (!isFacePixel(x, y, faceShape)) continue;

      let color = mainColor;
      if (isShadowRegion(x, y, faceShape)) {
        color = shadowColor;
      } else if (isHighlightRegion(x, y)) {
        color = highlightColor;
      }

      ctx.fillStyle = color;
      ctx.fillRect(offsetX + x * pixelSize, offsetY + y * pixelSize, pixelSize, pixelSize);
    }
  }
}

function isFacePixel(x: number, y: number, faceShape: FaceShape): boolean {
  switch (faceShape) {
    case 'round':
      return isInsideEllipse(x, y, 16, 15, 12, 11);
    case 'oval':
      return isInsideEllipse(x, y, 16, 15, 10, 12);
    case 'square':
      return isInsideRoundedRect(x, y, 5, 6, 22, 18, 4);
    case 'long':
      return isInsideEllipse(x, y, 16, 15, 10, 14);
    case 'heart':
      return isHeartShape(x, y);
    default:
      return isInsideEllipse(x, y, 16, 15, 10, 12);
  }
}

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

function isInsideRoundedRect(
  px: number,
  py: number,
  rx: number,
  ry: number,
  width: number,
  height: number,
  radius: number,
): boolean {
  if (px < rx || px >= rx + width || py < ry || py >= ry + height) return false;

  const cornerX = Math.min(px - rx, rx + width - 1 - px);
  const cornerY = Math.min(py - ry, ry + height - 1 - py);
  if (cornerX < radius && cornerY < radius) {
    const dx = cornerX - radius;
    const dy = cornerY - radius;
    return dx * dx + dy * dy <= radius * radius;
  }
  return true;
}

function isHeartShape(x: number, y: number): boolean {
  const cx = 16;
  if (y < 7 || y > 23) return false;
  if (y <= 16) {
    const progress = (y - 7) / 9;
    const halfWidth = 13 - progress * 2;
    return x >= cx - halfWidth && x <= cx + halfWidth;
  }

  const progress = (y - 16) / 7;
  const halfWidth = 11 - progress * 9;
  return x >= cx - halfWidth && x <= cx + halfWidth;
}

function isShadowRegion(x: number, y: number, faceShape: FaceShape): boolean {
  if (y >= 20 && isFacePixel(x, y, faceShape)) return true;
  if (y >= 17 && (x <= 7 || x >= 25)) return true;
  return false;
}

function isHighlightRegion(x: number, y: number): boolean {
  return x >= 13 && x <= 19 && y >= 8 && y <= 10;
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
