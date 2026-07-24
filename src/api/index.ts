/**
 * API 模块 barrel export
 * @module api
 */

export { fetchNearbyPlayers, uploadPhoto, reportProximity } from './client';
export { PocketFriendWS } from './websocket';
export { generateSeedreamPixelAvatar, SEEDREAM_MAPLESTORY_PROMPT } from './doubao-seedream';
export type { SeedreamGenerationResult } from './doubao-seedream';
