/**
 * Extracts deterministic avatar features from MediaPipe Face Mesh landmarks and
 * optional image pixels. Every fallback is explicit and carried back to the UI.
 */

import type {
  EyeSize,
  FaceFeatures,
  FaceShape,
  FeatureDetectionWarning,
  HairColorName,
  HairStyle,
  SkinTone,
} from '../types';
import { closestSkinTone, getHairColorName, HAIR_PALETTES, SHIRT_COLORS, SKIN_PALETTES } from './pixel-palettes';

export type Landmark = { x: number; y: number; z: number };

const DEFAULT_SKIN_RGB: [number, number, number] = SKIN_PALETTES.light.rgb;
const DEFAULT_HAIR_RGB: [number, number, number] = [93, 64, 55];
const DEFAULT_FEATURES: FaceFeatures = {
  shape: 'oval',
  eyeSize: 'medium',
  skinTone: 'light',
  hairStyle: 'short',
  hasGlasses: false,
  hasBeard: false,
  hasMakeup: false,
  genderPresentation: {
    hasBeard: false,
    hasMakeup: false,
    hasGlasses: false,
  },
  eyeDistance: 0.5,
  skinRGB: DEFAULT_SKIN_RGB,
  hairRGB: DEFAULT_HAIR_RGB,
  hairColor: 'brown',
  shirtColor: SHIRT_COLORS[5],
  usedFallback: true,
  warnings: [],
};

/** Explicit deterministic defaults for no-face/no-pixel fallback paths. */
export function getDefaultFaceFeatures(message = '未能可靠提取照片特征，已使用固定默认像素小人。'): FaceFeatures {
  return {
    ...DEFAULT_FEATURES,
    genderPresentation: { ...DEFAULT_FEATURES.genderPresentation! },
    warnings: [{ field: 'image', message }],
  };
}

export function extractFeaturesFromLandmarks(
  landmarks: Array<Landmark>,
  imageWidth: number,
  imageHeight: number,
  imageData?: ImageData,
): FaceFeatures {
  const warnings: FeatureDetectionWarning[] = [];

  if (!hasRequiredLandmarks(landmarks)) {
    return getDefaultFaceFeatures('人脸关键点不完整，已使用固定默认特征。');
  }

  const shape = detectFaceShape(landmarks);
  const eyeSize = detectEyeSize(landmarks);
  const eyeDistance = detectEyeDistance(landmarks);

  const skinResult = detectSkinTone(landmarks, imageWidth, imageHeight, imageData);
  warnings.push(...skinResult.warnings);

  const hairResult = detectHairColor(landmarks, imageWidth, imageHeight, imageData, skinResult.skinRGB);
  warnings.push(...hairResult.warnings);

  const hasGlasses = detectGlasses(landmarks, imageWidth, imageHeight, imageData);
  const hasBeard = detectBeard(landmarks, imageWidth, imageHeight, imageData, skinResult.skinRGB);
  const hasMakeup = detectMakeup(landmarks, imageWidth, imageHeight, imageData, skinResult.skinRGB);
  const hairStyle = detectHairStyle(landmarks, imageWidth, imageHeight, imageData, hairResult.hairColor);

  return {
    shape,
    eyeSize,
    skinTone: skinResult.skinTone,
    hairStyle,
    hasGlasses,
    hasBeard,
    hasMakeup,
    genderPresentation: {
      hasBeard,
      hasMakeup,
      hasGlasses,
    },
    eyeDistance,
    skinRGB: skinResult.skinRGB,
    hairRGB: hairResult.hairRGB,
    hairColor: hairResult.hairColor,
    shirtColor: deterministicShirtColor({
      shape,
      eyeSize,
      skinTone: skinResult.skinTone,
      hairColor: hairResult.hairColor,
      hasGlasses,
      hasBeard,
      hasMakeup,
    }),
    usedFallback: warnings.length > 0,
    warnings,
  };
}

export function euclideanDistance(
  a: [number, number, number],
  b: [number, number, number],
): number {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

export function getLandmarkDistance(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function samplePixelColor(
  imageData: ImageData,
  x: number,
  y: number,
  width: number,
): [number, number, number] {
  const px = Math.max(0, Math.min(Math.floor(x), width - 1));
  const maxH = Math.floor(imageData.data.length / 4 / width) - 1;
  const py = Math.max(0, Math.min(Math.floor(y), maxH));
  const idx = (py * width + px) * 4;
  return [
    imageData.data[idx],
    imageData.data[idx + 1],
    imageData.data[idx + 2],
  ];
}

function hasRequiredLandmarks(landmarks: Array<Landmark>): boolean {
  return landmarks.length > 454 && [10, 33, 61, 133, 152, 168, 172, 199, 234, 263, 291, 362, 397, 454].every((idx) => Boolean(landmarks[idx]));
}

function detectFaceShape(landmarks: Array<Landmark>): FaceShape {
  const cheekWidth = getLandmarkDistance(landmarks[454], landmarks[234]);
  const jawWidth = getLandmarkDistance(landmarks[397], landmarks[172]);
  const faceHeight = getLandmarkDistance(landmarks[152], landmarks[10]);
  const widthHeightRatio = cheekWidth / Math.max(faceHeight, 0.001);
  const jawRatio = jawWidth / Math.max(cheekWidth, 0.001);

  if (jawRatio > 0.82 && widthHeightRatio > 0.68) return 'square';
  if (widthHeightRatio >= 0.82) return 'round';
  if (widthHeightRatio < 0.64) return 'long';
  return 'oval';
}

function detectEyeSize(landmarks: Array<Landmark>): EyeSize {
  const faceWidth = getLandmarkDistance(landmarks[454], landmarks[234]);
  const leftEyeWidth = getLandmarkDistance(landmarks[33], landmarks[133]);
  const rightEyeWidth = getLandmarkDistance(landmarks[362], landmarks[263]);
  const ratio = ((leftEyeWidth + rightEyeWidth) / 2) / Math.max(faceWidth, 0.001);

  if (ratio >= 0.24) return 'big';
  if (ratio >= 0.18) return 'medium';
  return 'small';
}

function detectEyeDistance(landmarks: Array<Landmark>): number {
  const faceWidth = getLandmarkDistance(landmarks[454], landmarks[234]);
  const innerDistance = getLandmarkDistance(landmarks[133], landmarks[362]);
  const rawRatio = innerDistance / Math.max(faceWidth, 0.001);
  return clamp((rawRatio - 0.24) / 0.28, 0, 1);
}

function detectSkinTone(
  landmarks: Array<Landmark>,
  imageWidth: number,
  imageHeight: number,
  imageData?: ImageData,
): { skinTone: SkinTone; skinRGB: [number, number, number]; warnings: FeatureDetectionWarning[] } {
  if (!imageData) {
    return {
      skinTone: 'light',
      skinRGB: DEFAULT_SKIN_RGB,
      warnings: [{ field: 'skinTone', message: '未读取到照片像素，肤色使用固定默认值。' }],
    };
  }

  const samples = sampleLandmarkCluster(imageData, imageWidth, imageHeight, landmarks, [
    { idx: 50, dx: 0, dy: 0 },
    { idx: 101, dx: 0, dy: 0 },
    { idx: 205, dx: 0, dy: 0 },
    { idx: 425, dx: 0, dy: 0 },
    { idx: 280, dx: 0, dy: 0 },
    { idx: 199, dx: 0, dy: 0 },
  ]).filter(isLikelySkinPixel);

  if (samples.length < 3) {
    return {
      skinTone: 'light',
      skinRGB: DEFAULT_SKIN_RGB,
      warnings: [{ field: 'skinTone', message: '肤色采样点不足，已使用固定默认肤色。' }],
    };
  }

  const skinRGB = averageColor(samples);
  return {
    skinTone: closestSkinTone(...skinRGB),
    skinRGB,
    warnings: [],
  };
}

function detectHairColor(
  landmarks: Array<Landmark>,
  imageWidth: number,
  imageHeight: number,
  imageData: ImageData | undefined,
  skinRGB: [number, number, number],
): { hairColor: HairColorName; hairRGB: [number, number, number]; warnings: FeatureDetectionWarning[] } {
  if (!imageData) {
    return {
      hairColor: 'brown',
      hairRGB: DEFAULT_HAIR_RGB,
      warnings: [{ field: 'hairColor', message: '未读取到照片像素，发色使用固定默认棕色。' }],
    };
  }

  const forehead = landmarks[10];
  const faceWidthPx = getLandmarkDistance(landmarks[454], landmarks[234]) * imageWidth;
  const faceHeightPx = getLandmarkDistance(landmarks[152], landmarks[10]) * imageHeight;
  const centerX = forehead.x * imageWidth;
  const topY = forehead.y * imageHeight;
  const samples: Array<[number, number, number]> = [];
  const xOffsets = [-0.26, -0.18, -0.1, 0, 0.1, 0.18, 0.26];
  const yOffsets = [-0.28, -0.22, -0.16, -0.1, -0.05];

  for (const yRatio of yOffsets) {
    for (const xRatio of xOffsets) {
      const color = samplePixelColor(
        imageData,
        centerX + faceWidthPx * xRatio,
        topY + faceHeightPx * yRatio,
        imageWidth,
      );

      if (isHairCandidate(color, skinRGB)) {
        samples.push(color);
      }
    }
  }

  if (samples.length < 3) {
    return {
      hairColor: 'brown',
      hairRGB: DEFAULT_HAIR_RGB,
      warnings: [{ field: 'hairColor', message: '发色采样点不足，已使用固定默认棕色。' }],
    };
  }

  const hairRGB = averageDominantColor(samples);
  return {
    hairColor: classifyHairColor(hairRGB),
    hairRGB,
    warnings: [],
  };
}

function detectHairStyle(
  landmarks: Array<Landmark>,
  imageWidth: number,
  imageHeight: number,
  imageData: ImageData | undefined,
  hairColor: HairColorName,
): HairStyle {
  if (!imageData || hairColor === 'white') return 'short';

  const leftCheek = landmarks[234];
  const rightCheek = landmarks[454];
  const chin = landmarks[152];
  const sampleY = (leftCheek.y + chin.y) * 0.5 * imageHeight;
  const leftColor = samplePixelColor(imageData, leftCheek.x * imageWidth - 5, sampleY, imageWidth);
  const rightColor = samplePixelColor(imageData, rightCheek.x * imageWidth + 5, sampleY, imageWidth);
  const hairMain = hexToRgb(HAIR_PALETTES[hairColor].main);

  const sideHair = euclideanDistance(leftColor, hairMain) < 95 || euclideanDistance(rightColor, hairMain) < 95;
  return sideHair ? 'long' : 'short';
}

function detectGlasses(
  landmarks: Array<Landmark>,
  imageWidth: number,
  imageHeight: number,
  imageData?: ImageData,
): boolean {
  if (!imageData) return false;

  const bridge = landmarks[168];
  const leftInner = landmarks[133];
  const rightInner = landmarks[362];
  const samples = [
    samplePixelColor(imageData, bridge.x * imageWidth, bridge.y * imageHeight, imageWidth),
    samplePixelColor(imageData, leftInner.x * imageWidth, leftInner.y * imageHeight, imageWidth),
    samplePixelColor(imageData, rightInner.x * imageWidth, rightInner.y * imageHeight, imageWidth),
  ];

  return samples.filter(isDarkPixel).length >= 2;
}

function detectBeard(
  landmarks: Array<Landmark>,
  imageWidth: number,
  imageHeight: number,
  imageData: ImageData | undefined,
  skinRGB: [number, number, number],
): boolean {
  if (!imageData) return false;

  const mouthCenterX = ((landmarks[61].x + landmarks[291].x) / 2) * imageWidth;
  const lowerFaceY = ((landmarks[199].y + landmarks[152].y) / 2) * imageHeight;
  const faceWidthPx = getLandmarkDistance(landmarks[454], landmarks[234]) * imageWidth;
  const samples: Array<[number, number, number]> = [];

  for (const dx of [-0.16, -0.08, 0, 0.08, 0.16]) {
    samples.push(samplePixelColor(imageData, mouthCenterX + faceWidthPx * dx, lowerFaceY, imageWidth));
  }

  return samples.filter((color) => isDarkPixel(color) && euclideanDistance(color, skinRGB) > 55).length >= 3;
}

function detectMakeup(
  landmarks: Array<Landmark>,
  imageWidth: number,
  imageHeight: number,
  imageData: ImageData | undefined,
  skinRGB: [number, number, number],
): boolean {
  if (!imageData) return false;

  const lipSamples = [13, 14, 61, 291]
    .filter((idx) => landmarks[idx])
    .map((idx) => samplePixelColor(imageData, landmarks[idx].x * imageWidth, landmarks[idx].y * imageHeight, imageWidth));

  return lipSamples.some((color) => {
    const redDominance = color[0] - Math.max(color[1], color[2]);
    return redDominance > 28 && euclideanDistance(color, skinRGB) > 45;
  });
}

function sampleLandmarkCluster(
  imageData: ImageData,
  imageWidth: number,
  imageHeight: number,
  landmarks: Array<Landmark>,
  points: Array<{ idx: number; dx: number; dy: number }>,
): Array<[number, number, number]> {
  const samples: Array<[number, number, number]> = [];
  for (const point of points) {
    const landmark = landmarks[point.idx];
    if (!landmark) continue;
    samples.push(samplePixelColor(
      imageData,
      landmark.x * imageWidth + point.dx,
      landmark.y * imageHeight + point.dy,
      imageWidth,
    ));
  }
  return samples;
}

function isLikelySkinPixel(color: [number, number, number]): boolean {
  const [r, g, b] = color;
  return r > 55 && g > 35 && b > 20 && r >= b && r - b > 10 && Math.abs(r - g) < 95;
}

function isHairCandidate(color: [number, number, number], skinRGB: [number, number, number]): boolean {
  if (euclideanDistance(color, skinRGB) < 42) return false;
  const [r, g, b] = color;
  const saturation = Math.max(r, g, b) - Math.min(r, g, b);
  const brightness = (r + g + b) / 3;
  return brightness < 230 && (brightness < 120 || saturation > 28);
}

function isDarkPixel(color: [number, number, number]): boolean {
  return (color[0] + color[1] + color[2]) / 3 < 95;
}

function classifyHairColor(color: [number, number, number]): HairColorName {
  const [r, g, b] = color;
  const saturation = Math.max(r, g, b) - Math.min(r, g, b);
  const brightness = (r + g + b) / 3;

  if (brightness < 52) return 'black';
  if (r > g + 28 && r > b + 35 && saturation > 45) return 'red';
  if (b > r + 25 && b > g + 10) return 'blue';
  if (r > 180 && b > 130 && g < 165) return 'pink';
  if (r > 185 && g > 155 && b < 115) return 'blonde';
  if (brightness > 190 && saturation < 35) return 'white';
  return getHairColorName(...color);
}

function averageColor(colors: Array<[number, number, number]>): [number, number, number] {
  const totals = colors.reduce(
    (acc, color) => [acc[0] + color[0], acc[1] + color[1], acc[2] + color[2]] as [number, number, number],
    [0, 0, 0] as [number, number, number],
  );
  return [
    Math.round(totals[0] / colors.length),
    Math.round(totals[1] / colors.length),
    Math.round(totals[2] / colors.length),
  ];
}

function averageDominantColor(colors: Array<[number, number, number]>): [number, number, number] {
  const sorted = [...colors].sort((a, b) => colorScore(b) - colorScore(a));
  return averageColor(sorted.slice(0, Math.max(3, Math.ceil(sorted.length * 0.55))));
}

function colorScore(color: [number, number, number]): number {
  const saturation = Math.max(...color) - Math.min(...color);
  const darkness = 255 - (color[0] + color[1] + color[2]) / 3;
  return saturation * 1.4 + darkness;
}

function deterministicShirtColor(input: {
  shape: FaceShape;
  eyeSize: EyeSize;
  skinTone: SkinTone;
  hairColor: HairColorName;
  hasGlasses: boolean;
  hasBeard: boolean;
  hasMakeup: boolean;
}): string {
  const seed = `${input.shape}|${input.eyeSize}|${input.skinTone}|${input.hairColor}|${input.hasGlasses}|${input.hasBeard}|${input.hasMakeup}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return SHIRT_COLORS[hash % SHIRT_COLORS.length];
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
