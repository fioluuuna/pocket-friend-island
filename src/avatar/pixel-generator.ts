/**
 * Deterministic 32x32 pixel avatar generator.
 */

import type { FaceFeatures, PixelAvatarConfig, FaceShape, EyeSize, SkinTone, HairStyle, HairColorName } from '../types';
import { drawFace } from './parts/draw-face';
import { drawEyes } from './parts/draw-eyes';
import { drawHair } from './parts/draw-hair';
import { drawBody } from './parts/draw-body';
import { SHIRT_COLORS } from './pixel-palettes';

const DEFAULT_SHIRT_COLOR = SHIRT_COLORS[5];

export function generatePixelAvatar(
  config: PixelAvatarConfig,
  size: number = 64,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('[pixel-generator] Failed to get 2D context from canvas.');
  }

  const pixelSize = size / 32;
  ctx.clearRect(0, 0, size, size);
  ctx.imageSmoothingEnabled = false;

  const faceShape: FaceShape = config.faceShape ?? config.face.shape;
  const skinTone: SkinTone = config.skinTone ?? config.face.skinTone;
  const eyeSize: EyeSize = config.eyeSize ?? config.face.eyeSize;
  const eyeDistance = config.face.eyeDistance ?? 0.5;
  const hairStyle: HairStyle = config.hairStyle ?? config.face.hairStyle;
  const hairColor: HairColorName = config.hairColor ?? config.face.hairColor ?? 'brown';
  const shirtColor = config.shirtColor ?? config.face.shirtColor ?? config.bodyColor ?? DEFAULT_SHIRT_COLOR;
  const skinRGB = config.face.skinRGB;
  const hairRGB = config.face.hairRGB;
  const hasGlasses = config.face.genderPresentation?.hasGlasses ?? config.face.hasGlasses;
  const hasBeard = config.face.genderPresentation?.hasBeard ?? config.face.hasBeard;
  const hasMakeup = config.face.genderPresentation?.hasMakeup ?? config.face.hasMakeup ?? false;

  drawBody(ctx, 0, 0, shirtColor, pixelSize, skinTone, skinRGB);
  drawFace(ctx, 0, 0, faceShape, skinTone, pixelSize, skinRGB);
  drawEyes(ctx, 0, 0, eyeSize, eyeDistance, pixelSize);
  drawHair(ctx, 0, 0, hairStyle, hairColor, pixelSize, hairRGB);
  drawGenderPresentation(ctx, 0, 0, pixelSize, {
    hasGlasses,
    hasBeard,
    hasMakeup,
    hairColor,
    hairRGB,
  });

  return canvas;
}

export function generatePixelAvatarFromFeatures(
  features: FaceFeatures,
  size: number = 64,
): HTMLCanvasElement {
  const shirtColor = features.shirtColor ?? deterministicColorFromFeatures(features);

  const config: PixelAvatarConfig = {
    face: {
      shape: features.shape,
      eyeSize: features.eyeSize,
      skinTone: features.skinTone,
      hairStyle: features.hairStyle,
      hasGlasses: features.hasGlasses,
      hasBeard: features.hasBeard,
      hasMakeup: features.hasMakeup,
      genderPresentation: features.genderPresentation,
      eyeDistance: features.eyeDistance,
      skinRGB: features.skinRGB,
      hairRGB: features.hairRGB,
      hairColor: features.hairColor,
      shirtColor,
      usedFallback: features.usedFallback,
      warnings: features.warnings,
    },
    bodyColor: shirtColor,
    shirtColor,
    accessory: '',
    expression: 'happy',
  };

  return generatePixelAvatar(config, size);
}

export function canvasToDataURL(
  canvas: HTMLCanvasElement,
  format: string = 'image/png',
): string {
  return canvas.toDataURL(format);
}

/**
 * Kept for demo/mock callers, but now intentionally deterministic.
 */
export function generateRandomAvatar(size: number = 64): HTMLCanvasElement {
  return generatePixelAvatarFromFeatures({
    shape: 'oval',
    eyeSize: 'medium',
    skinTone: 'light',
    hairStyle: 'short',
    hasGlasses: false,
    hasBeard: false,
    hasMakeup: false,
    genderPresentation: {
      hasGlasses: false,
      hasBeard: false,
      hasMakeup: false,
    },
    eyeDistance: 0.5,
    skinRGB: [245, 203, 167],
    hairRGB: [93, 64, 55],
    hairColor: 'brown',
    shirtColor: DEFAULT_SHIRT_COLOR,
    usedFallback: true,
    warnings: [{ field: 'image', message: 'Demo avatar uses fixed default features.' }],
  }, size);
}

function drawGenderPresentation(
  ctx: CanvasRenderingContext2D,
  offsetX: number,
  offsetY: number,
  pixelSize: number,
  options: {
    hasGlasses: boolean;
    hasBeard: boolean;
    hasMakeup: boolean;
    hairColor: HairColorName;
    hairRGB?: [number, number, number];
  },
): void {
  if (options.hasBeard) {
    const beardColor = options.hairRGB ? rgbToHex(options.hairRGB) : beardFallback(options.hairColor);
    for (let y = 17; y <= 21; y++) {
      const start = y < 20 ? 12 : 13;
      const end = y < 20 ? 20 : 19;
      for (let x = start; x <= end; x++) {
        if (y === 17 && x >= 14 && x <= 18) continue;
        fillPixel(ctx, x, y, darkenColor(beardColor, 20), offsetX, offsetY, pixelSize);
      }
    }
  }

  if (options.hasMakeup) {
    fillPixel(ctx, 14, 18, '#D81B60', offsetX, offsetY, pixelSize);
    fillPixel(ctx, 15, 19, '#AD1457', offsetX, offsetY, pixelSize);
    fillPixel(ctx, 16, 19, '#AD1457', offsetX, offsetY, pixelSize);
    fillPixel(ctx, 17, 19, '#AD1457', offsetX, offsetY, pixelSize);
    fillPixel(ctx, 18, 18, '#D81B60', offsetX, offsetY, pixelSize);
  }

  if (options.hasGlasses) {
    const frame = '#1A1A2E';
    for (let x = 10; x <= 14; x++) fillPixel(ctx, x, 12, frame, offsetX, offsetY, pixelSize);
    for (let x = 18; x <= 22; x++) fillPixel(ctx, x, 12, frame, offsetX, offsetY, pixelSize);
    fillPixel(ctx, 15, 12, frame, offsetX, offsetY, pixelSize);
    fillPixel(ctx, 16, 12, frame, offsetX, offsetY, pixelSize);
    fillPixel(ctx, 17, 12, frame, offsetX, offsetY, pixelSize);
    fillPixel(ctx, 10, 13, frame, offsetX, offsetY, pixelSize);
    fillPixel(ctx, 14, 13, frame, offsetX, offsetY, pixelSize);
    fillPixel(ctx, 18, 13, frame, offsetX, offsetY, pixelSize);
    fillPixel(ctx, 22, 13, frame, offsetX, offsetY, pixelSize);
  }
}

function deterministicColorFromFeatures(features: FaceFeatures): string {
  const seed = [
    features.shape,
    features.eyeSize,
    features.skinTone,
    features.hairStyle,
    features.hairColor ?? 'brown',
    features.hasGlasses,
    features.hasBeard,
    features.hasMakeup ?? false,
  ].join('|');
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return SHIRT_COLORS[hash % SHIRT_COLORS.length];
}

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
  ctx.fillRect(offsetX + x * pixelSize, offsetY + y * pixelSize, pixelSize, pixelSize);
}

function beardFallback(hairColor: HairColorName): string {
  const map: Record<HairColorName, string> = {
    black: '#1A1A2E',
    brown: '#5D4037',
    blonde: '#CDAA18',
    red: '#A82020',
    blue: '#039BE5',
    pink: '#EC407A',
    white: '#BDBDBD',
  };
  return map[hairColor];
}

function rgbToHex(rgb: [number, number, number]): string {
  return `#${rgb.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

function darkenColor(hex: string, amount: number): string {
  const clean = hex.replace('#', '');
  const r = Math.max(0, parseInt(clean.slice(0, 2), 16) - amount);
  const g = Math.max(0, parseInt(clean.slice(2, 4), 16) - amount);
  const b = Math.max(0, parseInt(clean.slice(4, 6), 16) - amount);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
