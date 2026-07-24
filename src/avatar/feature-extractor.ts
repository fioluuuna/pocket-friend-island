/**
 * @module feature-extractor
 * @description 从 MediaPipe Face Mesh 468 关键点中提取 FaceFeatures。
 * 根据面部关键点的位置比例推算脸型、眼大小、肤色、发色等特征。
 */

import type {
  FaceFeatures,
  FaceShape,
  EyeSize,
  SkinTone,
  HairStyle,
} from '../types';
import { SKIN_PALETTES, closestSkinTone, getHairColorName } from './pixel-palettes';

/** MediaPipe Face Mesh 单个关键点 */
type Landmark = { x: number; y: number; z: number };

/**
 * 从 MediaPipe Face Mesh 468 个关键点中提取 FaceFeatures。
 * @param landmarks - 468 个面部关键点数组，坐标为归一化值 (0-1)
 * @param imageWidth - 原始图像宽度
 * @param imageHeight - 原始图像高度
 * @param imageData - 可选的 ImageData，用于采样肤色和发色像素
 * @returns 提取出的 FaceFeatures 对象
 */
export function extractFeaturesFromLandmarks(
  landmarks: Array<Landmark>,
  imageWidth: number,
  imageHeight: number,
  imageData?: ImageData,
): FaceFeatures {
  // 1. 脸型判断
  const faceShape = detectFaceShape(landmarks);

  // 2. 眼睛大小判断
  const eyeSize = detectEyeSize(landmarks);

  // 3. 眼间距
  const eyeDistance = detectEyeDistance(landmarks);

  // 4. 肤色
  const { skinTone, skinRGB } = detectSkinTone(landmarks, imageWidth, imageHeight, imageData);

  // 5. 发色
  const hairColor = detectHairColor(landmarks, imageWidth, imageHeight, imageData, skinRGB);

  // 6. 发型（MVP 阶段不自动检测，默认短发）
  const hairStyle: HairStyle = 'short';

  // 7. 眼镜检测
  const hasGlasses = detectGlasses(landmarks);

  // 8. 胡须检测（MVP 阶段默认无）
  const hasBeard = false;

  return {
    shape: faceShape,
    eyeSize,
    eyeDistance,
    skinTone,
    skinRGB,
    hasGlasses,
    hasBeard,
    hairStyle,
    hairColor,
  };
}

/**
 * 计算两个 RGB 颜色之间的欧氏距离。
 * @param a - 第一个颜色 [r, g, b]
 * @param b - 第二个颜色 [r, g, b]
 * @returns 欧氏距离值
 */
export function euclideanDistance(
  a: [number, number, number],
  b: [number, number, number],
): number {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * 计算两个关键点之间的像素距离。
 * @param a - 第一个关键点
 * @param b - 第二个关键点
 * @returns 欧氏距离（归一化坐标）
 */
export function getLandmarkDistance(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 从 ImageData 中采样指定坐标处的像素颜色。
 * @param imageData - 图像像素数据
 * @param x - 像素 X 坐标
 * @param y - 像素 Y 坐标
 * @param width - 图像宽度
 * @returns RGB 数组 [r, g, b]
 */
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

/**
 * 检测脸型：根据面部宽高比判断。
 * landmark 454 = 右侧脸边缘, 234 = 左侧脸边缘
 * landmark 152 = 下巴底, 10 = 额头顶
 */
function detectFaceShape(landmarks: Array<Landmark>): FaceShape {
  const faceWidth = getLandmarkDistance(landmarks[454], landmarks[234]);
  const faceHeight = getLandmarkDistance(landmarks[152], landmarks[10]);
  const ratio = faceWidth / faceHeight;

  if (ratio > 0.85) {
    return 'round';
  } else if (ratio >= 0.7) {
    return 'oval';
  } else {
    return 'long';
  }
}

/**
 * 检测眼睛大小：根据眼宽与脸宽的比例判断。
 * landmark 33 = 左眼外角, 133 = 左眼内角
 * landmark 263 = 右眼外角, 362 = 右眼内角
 */
function detectEyeSize(landmarks: Array<Landmark>): EyeSize {
  const faceWidth = getLandmarkDistance(landmarks[454], landmarks[234]);
  const leftEyeWidth = getLandmarkDistance(landmarks[33], landmarks[133]);
  const rightEyeWidth = getLandmarkDistance(landmarks[362], landmarks[263]);
  const avgEyeWidth = (leftEyeWidth + rightEyeWidth) / 2;
  const ratio = avgEyeWidth / faceWidth;

  if (ratio > 0.35) {
    return 'big';
  } else if (ratio >= 0.25) {
    return 'medium';
  } else {
    return 'small';
  }
}

/**
 * 检测眼间距：归一化到 0-1 范围。
 * landmark 33 = 左眼外角, 362 = 右眼外角
 */
function detectEyeDistance(landmarks: Array<Landmark>): number {
  const faceWidth = getLandmarkDistance(landmarks[454], landmarks[234]);
  const innerEyeDistance = Math.abs(landmarks[33].x - landmarks[362].x);

  // 归一化：将原始比例映射到 0-1
  const rawRatio = innerEyeDistance / faceWidth;
  // 通常内眼距/脸宽约 0.3-0.7，映射到 0-1
  return Math.max(0, Math.min(1, (rawRatio - 0.3) / 0.4));
}

/**
 * 检测肤色：从脸颊区域（landmark 116, 345 附近）采样像素颜色。
 */
function detectSkinTone(
  landmarks: Array<Landmark>,
  imageWidth: number,
  imageHeight: number,
  imageData?: ImageData,
): { skinTone: SkinTone; skinRGB: [number, number, number] } {
  const defaultRGB: [number, number, number] = [198, 134, 66]; // medium

  if (!imageData) {
    return { skinTone: 'medium', skinRGB: defaultRGB };
  }

  // 在脸颊区域采样多个点取平均值
  const cheekLandmarks = [
    landmarks[116],  // 左脸颊
    landmarks[345],  // 右脸颊
    landmarks[234],  // 左侧脸
    landmarks[454],  // 右侧脸
  ];

  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  let count = 0;

  for (const lm of cheekLandmarks) {
    const px = Math.round(lm.x * imageWidth);
    const py = Math.round(lm.y * imageHeight);
    const color = samplePixelColor(imageData, px, py, imageWidth);
    totalR += color[0];
    totalG += color[1];
    totalB += color[2];
    count++;
  }

  const avgR = Math.round(totalR / count);
  const avgG = Math.round(totalG / count);
  const avgB = Math.round(totalB / count);
  const skinRGB: [number, number, number] = [avgR, avgG, avgB];

  return {
    skinTone: closestSkinTone(avgR, avgG, avgB),
    skinRGB,
  };
}

/**
 * 检测发色：从头顶区域采样像素，排除肤色后取主要颜色。
 */
function detectHairColor(
  landmarks: Array<Landmark>,
  imageWidth: number,
  imageHeight: number,
  imageData?: ImageData,
  skinRGB?: [number, number, number],
): string {
  if (!imageData || !skinRGB) {
    return 'black';
  }

  // 头顶区域：landmark 10 上方若干像素
  const topLandmark = landmarks[10];
  const topPx = Math.round(topLandmark.x * imageWidth);
  const topPy = Math.round(topLandmark.y * imageHeight);

  // 采样头顶上方几个像素
  const sampleOffsets = [-2, -4, -6, -8, -10];
  const hairSamples: Array<[number, number, number]> = [];

  for (const offset of sampleOffsets) {
    const sampleY = topPy + offset;
    if (sampleY < 0) continue;

    const color = samplePixelColor(imageData, topPx, sampleY, imageWidth);

    // 排除肤色相近的像素
    const dist = euclideanDistance(color, skinRGB);
    if (dist > 60) {
      hairSamples.push(color);
    }
  }

  if (hairSamples.length === 0) {
    return 'black';
  }

  // 取平均值
  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  for (const c of hairSamples) {
    totalR += c[0];
    totalG += c[1];
    totalB += c[2];
  }
  const avgR = Math.round(totalR / hairSamples.length);
  const avgG = Math.round(totalG / hairSamples.length);
  const avgB = Math.round(totalB / hairSamples.length);

  return getHairColorName(avgR, avgG, avgB);
}

/**
 * 检测是否佩戴眼镜：通过鼻梁（landmark 168）与眼角的关键点距离判断。
 */
function detectGlasses(landmarks: Array<Landmark>): boolean {
  const noseBridge = landmarks[168];
  const leftInnerEye = landmarks[133];
  const rightInnerEye = landmarks[362];

  const leftDist = getLandmarkDistance(noseBridge, leftInnerEye);
  const rightDist = getLandmarkDistance(noseBridge, rightInnerEye);

  // 如果鼻梁到两眼内角的距离都大于阈值，判定为有眼镜
  const threshold = 0.02;
  return leftDist > threshold && rightDist > threshold;
}
