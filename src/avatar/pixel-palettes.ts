/**
 * @module pixel-palettes
 * @description 像素小人预置调色板数据，包含肤色、发色和衣服颜色。
 * 提供欧氏距离匹配函数，用于从采样颜色反推最接近的预置色。
 */

import type { HairColorName, SkinTone } from '../types';

/** 肤色调色板：每种肤色包含主色、阴影色、高光色和 RGB 值 */
export const SKIN_PALETTES: Record<
  SkinTone,
  { main: string; shadow: string; highlight: string; rgb: [number, number, number] }
> = {
  fair: {
    main: '#FFE0BD',
    shadow: '#E8C4A0',
    highlight: '#FFF0DB',
    rgb: [255, 224, 189],
  },
  light: {
    main: '#F5CBA7',
    shadow: '#D4A373',
    highlight: '#FDE4C8',
    rgb: [245, 203, 167],
  },
  medium: {
    main: '#C68642',
    shadow: '#A0632C',
    highlight: '#D4A06A',
    rgb: [198, 134, 66],
  },
  tan: {
    main: '#8D5524',
    shadow: '#6B3A14',
    highlight: '#A06E3A',
    rgb: [141, 85, 36],
  },
  deep: {
    main: '#5C3A21',
    shadow: '#3D2514',
    highlight: '#7A5040',
    rgb: [92, 58, 33],
  },
};

/** 发色调色板：每种发色包含主色、阴影色和高光色 */
export const HAIR_PALETTES: Record<
  HairColorName,
  { main: string; shadow: string; highlight: string }
> = {
  black:  { main: '#1a1a2e', shadow: '#0f0f1a', highlight: '#2a2a4e' },
  brown:  { main: '#5d4037', shadow: '#3e2723', highlight: '#7a5a4f' },
  blonde: { main: '#f9d71c', shadow: '#e1b80d', highlight: '#fff176' },
  red:    { main: '#c62828', shadow: '#8e0000', highlight: '#ef5350' },
  blue:   { main: '#4fc3f7', shadow: '#039be5', highlight: '#b3e5fc' },
  pink:   { main: '#f48fb1', shadow: '#ec407a', highlight: '#f8bbd0' },
  white:  { main: '#e0e0e0', shadow: '#bdbdbd', highlight: '#ffffff' },
};

/** T恤可选颜色列表 */
export const SHIRT_COLORS: string[] = [
  '#EF5350', '#EC407A', '#AB47BC', '#7E57C2',
  '#5C6BC0', '#42A5F5', '#29B6F6', '#26C6DA',
  '#26A69A', '#66BB6A', '#9CCC65', '#D4E157',
  '#FFEE58', '#FFCA28', '#FFA726', '#FF7043',
];

/**
 * 计算两个 RGB 颜色之间的欧氏距离。
 * @param a - 第一个颜色 [r, g, b]
 * @param b - 第二个颜色 [r, g, b]
 * @returns 欧氏距离值
 */
function euclideanDistance(
  a: [number, number, number],
  b: [number, number, number],
): number {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * 根据采样到的 RGB 值，匹配最接近的预置肤色。
 * @param r - 红色通道 (0-255)
 * @param g - 绿色通道 (0-255)
 * @param b - 蓝色通道 (0-255)
 * @returns 最接近的 SkinTone 枚举值
 */
export function closestSkinTone(r: number, g: number, b: number): SkinTone {
  const sample: [number, number, number] = [r, g, b];

  let bestTone: SkinTone = 'medium';
  let bestDist = Infinity;

  const toneEntries: Array<[SkinTone, [number, number, number]]> = [
    ['fair', SKIN_PALETTES.fair.rgb],
    ['light', SKIN_PALETTES.light.rgb],
    ['medium', SKIN_PALETTES.medium.rgb],
    ['tan', SKIN_PALETTES.tan.rgb],
    ['deep', SKIN_PALETTES.deep.rgb],
  ];

  for (const [tone, rgb] of toneEntries) {
    const dist = euclideanDistance(sample, rgb);
    if (dist < bestDist) {
      bestDist = dist;
      bestTone = tone;
    }
  }

  return bestTone;
}

/**
 * 将 HEX 颜色字符串解析为 RGB 数组。
 * @param hex - 十六进制颜色字符串（如 '#FF0000'）
 * @returns RGB 数组 [r, g, b]
 */
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [r, g, b];
}

/**
 * 根据采样到的 RGB 值，匹配最接近的预置发色名称。
 * @param r - 红色通道 (0-255)
 * @param g - 绿色通道 (0-255)
 * @param b - 蓝色通道 (0-255)
 * @returns 最接近的发色名称（如 'black', 'brown' 等）
 */
export function getHairColorName(r: number, g: number, b: number): HairColorName {
  const sample: [number, number, number] = [r, g, b];

  let bestName: HairColorName = 'black';
  let bestDist = Infinity;

  for (const [name, palette] of Object.entries(HAIR_PALETTES) as Array<[HairColorName, typeof HAIR_PALETTES[HairColorName]]>) {
    const rgb = hexToRgb(palette.main);
    const dist = euclideanDistance(sample, rgb);
    if (dist < bestDist) {
      bestDist = dist;
      bestName = name;
    }
  }

  return bestName;
}
