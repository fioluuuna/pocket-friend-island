/**
 * @module face-detector
 * @description MediaPipe Face Mesh 封装模块。
 * 使用动态 import 加载 @mediapipe/face_mesh，
 * 如果加载失败则降级返回 null 并输出警告。
 */

import type { FaceFeatures } from '../types';
import { extractFeaturesFromLandmarks } from './feature-extractor';

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
          lastDetectedFeatures = extractFeaturesFromLandmarks(landmarks, 1, 1);
        } else {
          lastDetectedFeatures = null;
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
  imageSource: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
): Promise<FaceFeatures | null> {
  await initFaceDetector();

  if (!faceMeshInstance || !modelLoaded) {
    return null;
  }

  try {
    // 重置检测状态
    lastDetectedFeatures = null;

    // 创建 Promise 等待检测结果
    const resultPromise = new Promise<FaceFeatures | null>((resolve) => {
      detectionResolve = resolve;
    });

    // 发送图像给 FaceMesh 处理
    await faceMeshInstance.send({ image: imageSource });

    // 等待 onResults 回调中 resolve
    const features = await resultPromise;
    return features;
  } catch (error) {
    console.warn('[face-detector] Face detection failed:', error);
    return null;
  }
}

/**
 * 查询模型是否已加载完成。
 * @returns 模型加载状态
 */
export function isModelLoaded(): boolean {
  return modelLoaded;
}
