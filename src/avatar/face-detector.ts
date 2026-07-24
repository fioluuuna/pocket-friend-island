/**
 * @module face-detector
 * @description MediaPipe Face Mesh 封装模块。
 * 使用动态 import 加载 @mediapipe/face_mesh，
 * 如果加载失败则降级返回 null 并输出警告。
 */

import type { FaceFeatures } from '../types';
import { extractFeaturesFromLandmarks, getDefaultFaceFeatures } from './feature-extractor';

/** FaceMesh 实例的类型接口 */
interface FaceMeshLike {
  setOptions(options: Record<string, unknown>): void;
  onResults(callback: (results: FaceMeshResults) => void): void;
  send(input: { image: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement }): Promise<void>;
  close(): void;
}

/** FaceMesh 结果类型 */
interface FaceMeshResults {
  multiFaceLandmarks: Array<Array<{ x: number; y: number; z: number }>>;
}

/** FaceMesh 实例缓存 */
let faceMeshInstance: FaceMeshLike | null = null;
/** 模型是否已加载 */
let modelLoaded = false;
/** 模型加载中的 Promise，防止重复初始化 */
let loadingPromise: Promise<void> | null = null;
/** 最近一次检测结果，用于 send 回调中传递 */
let lastDetectedFeatures: FaceFeatures | null = null;
/** 用于等待检测完成的 resolve 回调 */
let detectionResolve: ((features: FaceFeatures | null) => void) | null = null;
let pendingImageData: ImageData | undefined;
let pendingImageWidth = 1;
let pendingImageHeight = 1;

/**
 * 初始化 MediaPipe Face Mesh 模型。
 * 使用动态 import 加载，如果包不存在则降级处理。
 * @returns Promise，初始化完成时 resolve
 */
export async function initFaceDetector(): Promise<void> {
  if (modelLoaded) return;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async (): Promise<void> => {
    try {
      // 动态导入 @mediapipe/face_mesh
      const faceMeshModule = await import('@mediapipe/face_mesh' as string);

      const FaceMeshConstructor = faceMeshModule.FaceMesh ?? faceMeshModule.default;

      if (typeof FaceMeshConstructor !== 'function') {
        console.warn(
          '[face-detector] @mediapipe/face_mesh module does not export a FaceMesh constructor.',
        );
        return;
      }

      const faceMesh = new FaceMeshConstructor({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        },
      }) as FaceMeshLike;

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      faceMesh.onResults((results: FaceMeshResults): void => {
        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
          const landmarks = results.multiFaceLandmarks[0];
          lastDetectedFeatures = extractFeaturesFromLandmarks(
            landmarks,
            pendingImageWidth,
            pendingImageHeight,
            pendingImageData,
          );
        } else {
          lastDetectedFeatures = getDefaultFaceFeatures('未检测到人脸，已使用固定默认像素小人。');
        }

        if (detectionResolve) {
          detectionResolve(lastDetectedFeatures);
          detectionResolve = null;
        }
      });

      faceMeshInstance = faceMesh;
      modelLoaded = true;
    } catch (error) {
      console.warn(
        '[face-detector] Failed to load @mediapipe/face_mesh. Face detection is disabled.',
        error,
      );
    } finally {
      loadingPromise = null;
    }
  })();

  return loadingPromise;
}

/**
 * 检测图像中的人脸并返回提取的面部特征。
 * @param imageSource - 图片/视频/Canvas 元素
 * @returns FaceFeatures 对象，未检测到人脸时返回 null
 */
export async function detectFace(
  imageSource: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap,
): Promise<FaceFeatures | null> {
  await initFaceDetector();

  if (!faceMeshInstance || !modelLoaded) {
    return getDefaultFaceFeatures('人脸检测模型加载失败，已使用固定默认像素小人。');
  }

  try {
    const prepared = prepareImageForDetection(imageSource);
    pendingImageData = prepared.imageData;
    pendingImageWidth = prepared.width;
    pendingImageHeight = prepared.height;

    // 重置检测状态
    lastDetectedFeatures = null;

    // 创建 Promise 等待检测结果
    const resultPromise = new Promise<FaceFeatures | null>((resolve) => {
      detectionResolve = resolve;
    });

    // 发送图像给 FaceMesh 处理
    await faceMeshInstance.send({ image: prepared.canvas });

    // 等待 onResults 回调中 resolve
    const features = await resultPromise;
    return features;
  } catch (error) {
    console.warn('[face-detector] Face detection failed:', error);
    return getDefaultFaceFeatures('人脸检测过程失败，已使用固定默认像素小人。');
  } finally {
    pendingImageData = undefined;
    pendingImageWidth = 1;
    pendingImageHeight = 1;
  }
}

/**
 * 查询模型是否已加载完成。
 * @returns 模型加载状态
 */
export function isModelLoaded(): boolean {
  return modelLoaded;
}

function prepareImageForDetection(
  imageSource: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap,
): { canvas: HTMLCanvasElement; imageData: ImageData; width: number; height: number } {
  if (imageSource instanceof HTMLCanvasElement) {
    const ctx = imageSource.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('[face-detector] Failed to read source canvas.');
    return {
      canvas: imageSource,
      imageData: ctx.getImageData(0, 0, imageSource.width, imageSource.height),
      width: imageSource.width,
      height: imageSource.height,
    };
  }

  const width = getSourceWidth(imageSource);
  const height = getSourceHeight(imageSource);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('[face-detector] Failed to create detection canvas.');

  ctx.drawImage(imageSource, 0, 0, width, height);

  return {
    canvas,
    imageData: ctx.getImageData(0, 0, width, height),
    width,
    height,
  };
}

function getSourceWidth(source: HTMLImageElement | HTMLVideoElement | ImageBitmap): number {
  if (source instanceof HTMLImageElement) return source.naturalWidth || source.width;
  if (source instanceof HTMLVideoElement) return source.videoWidth || source.width;
  return source.width;
}

function getSourceHeight(source: HTMLImageElement | HTMLVideoElement | ImageBitmap): number {
  if (source instanceof HTMLImageElement) return source.naturalHeight || source.height;
  if (source instanceof HTMLVideoElement) return source.videoHeight || source.height;
  return source.height;
}
