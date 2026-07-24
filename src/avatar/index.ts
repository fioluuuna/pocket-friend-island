/**
 * @module avatar
 * @description 像素小人生成模块的 barrel export。
 */

export { generatePixelAvatar, generatePixelAvatarFromFeatures, canvasToDataURL, generateRandomAvatar } from './pixel-generator';
export { initFaceDetector, detectFace, isModelLoaded } from './face-detector';
export { extractFeaturesFromLandmarks, euclideanDistance, getLandmarkDistance, samplePixelColor } from './feature-extractor';
export { SKIN_PALETTES, HAIR_PALETTES, SHIRT_COLORS, closestSkinTone, getHairColorName } from './pixel-palettes';
