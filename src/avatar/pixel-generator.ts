/**
 * @module pixel-generator
 * @description 像素小人生成主模块。
 * 根据配置或面部特征生成 32x32 像素风格小人头像。
 */

import type { FaceFeatures, PixelAvatarConfig, FaceShape, EyeSize, SkinTone, HairStyle } from '../types';
import { drawFace } from './parts/draw-face';
import { drawEyes } from './parts/draw-eyes';
import { drawHair } from './parts/draw-hair';
import { drawBody } from './parts/draw-body';
import { SHIRT_COLORS } from './pixel-palettes';

/**
 * 根据 PixelAvatarConfig 生成像素小人头像 Canvas。
 * 支持两种配置模式：
 * 1. 完整模式：使用 config.face 对象的各个字段
 * 2. 快捷模式：使用 config.skinTone, config.faceShape 等顶层字段（avatar 模块扩展）
 * @param config - 像素小人配置对象
 * @param size - 输出 Canvas 边长（像素），默认 64。将 32x32 逻辑网格映射到此大小
 * @returns 绘制好的 HTMLCanvasElement
 */
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

  const pixelSize = size / 32; // 将 32x32 像素映射到实际 canvas 大小

  // 清空（透明背景）
  ctx.clearRect(0, 0, size, size);

  // 解析配置（支持快捷模式和完整模式）
  const shirtColor = config.shirtColor ?? config.bodyColor;
  const faceShape: FaceShape = config.faceShape ?? config.face.shape;
  const skinTone: SkinTone = config.skinTone ?? config.face.skinTone;
  const eyeSize: EyeSize = config.eyeSize ?? config.face.eyeSize;
  const eyeDistance = config.face.eyeDistance ?? 0.5;
  const hairStyle: HairStyle = config.hairStyle ?? config.face.hairStyle;
  const hairColor: string = config.hairColor ?? 'black';

  // 图层顺序：身体 -> 脸型 -> 眼睛 -> 头发
  drawBody(ctx, 0, 0, shirtColor, pixelSize);
  drawFace(ctx, 0, 0, faceShape, skinTone, pixelSize);
  drawEyes(ctx, 0, 0, eyeSize, eyeDistance, pixelSize);
  drawHair(ctx, 0, 0, hairStyle, hairColor, pixelSize);

  return canvas;
}

/**
 * 从 FaceFeatures 生成像素小人头像 Canvas。
 * 自动选择随机 T 恤颜色，其他参数从特征中提取。
 * @param features - 面部特征对象
 * @param size - 输出 Canvas 边长（像素），默认 64
 * @returns 绘制好的 HTMLCanvasElement
 */
export function generatePixelAvatarFromFeatures(
  features: FaceFeatures,
  size: number = 64,
): HTMLCanvasElement {
  // 随机选择衬衫颜色
  const shirtColor = SHIRT_COLORS[Math.floor(Math.random() * SHIRT_COLORS.length)];

  const config: PixelAvatarConfig = {
    face: {
      shape: features.shape,
      eyeSize: features.eyeSize,
      skinTone: features.skinTone,
      hairStyle: features.hairStyle,
      hasGlasses: features.hasGlasses,
      hasBeard: features.hasBeard,
      eyeDistance: features.eyeDistance,
      skinRGB: features.skinRGB,
      hairColor: features.hairColor,
    },
    bodyColor: shirtColor,
    shirtColor,
    accessory: '',
    expression: 'happy',
  };

  return generatePixelAvatar(config, size);
}

/**
 * 将 Canvas 转换为 Data URL 字符串。
 * @param canvas - 要导出的 Canvas 元素
 * @param format - 图片格式，默认 'image/png'
 * @returns Base64 编码的 Data URL
 */
export function canvasToDataURL(
  canvas: HTMLCanvasElement,
  format: string = 'image/png',
): string {
  return canvas.toDataURL(format);
}

/** 从数组中随机取一个元素 */
function randomPick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 生成一个随机配置的像素小人头像，用于 demo/mock。
 * @param size - 输出 Canvas 边长（像素），默认 64
 * @returns 绘制好的 HTMLCanvasElement
 */
export function generateRandomAvatar(size: number = 64): HTMLCanvasElement {
  const faceShapes: FaceShape[] = ['round', 'oval', 'square', 'long', 'heart'];
  const eyeSizes: EyeSize[] = ['big', 'medium', 'small'];
  const skinTones: SkinTone[] = ['fair', 'light', 'medium', 'tan', 'deep'];
  const hairStyles: HairStyle[] = ['short', 'long', 'curly', 'ponytail', 'bald'];
  const hairColorNames = ['black', 'brown', 'blonde', 'red', 'blue', 'pink', 'white'];

  const config: PixelAvatarConfig = {
    face: {
      shape: randomPick(faceShapes),
      eyeSize: randomPick(eyeSizes),
      skinTone: randomPick(skinTones),
      hairStyle: randomPick(hairStyles),
      hasGlasses: false,
      hasBeard: false,
    },
    bodyColor: randomPick(SHIRT_COLORS),
    shirtColor: randomPick(SHIRT_COLORS),
    accessory: '',
    expression: 'happy',
    faceShape: randomPick(faceShapes),
    skinTone: randomPick(skinTones),
    eyeSize: randomPick(eyeSizes),
    hairStyle: randomPick(hairStyles),
    hairColor: randomPick(hairColorNames),
  };

  return generatePixelAvatar(config, size);
}
