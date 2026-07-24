/**
 * HTTP API 客户端（Placeholder）
 * @description 当前返回 mock 数据，后续可替换为真实 API 调用。
 * @module api/client
 */

import type { PlayerProfile } from '../types';
import { MOCK_PLAYERS } from '../mock/mock-players';

/**
 * 获取附近的玩家列表
 * @description placeholder 实现，返回模拟玩家数据
 * @returns 附近玩家资料列表
 */
export async function fetchNearbyPlayers(): Promise<PlayerProfile[]> {
  // TODO: 替换为真实 API 调用
  // const response = await fetch('/api/nearby');
  // return response.json();
  return MOCK_PLAYERS;
}

/**
 * 上传照片
 * @description placeholder 实现，返回模拟 URL
 * @param _file - 要上传的文件
 * @returns 上传后的文件 URL
 */
export async function uploadPhoto(_file: File): Promise<string> {
  // TODO: 替换为真实 API 调用
  // const formData = new FormData();
  // formData.append('photo', file);
  // const response = await fetch('/api/upload', { method: 'POST', body: formData });
  // return response.json();
  return 'mock-url';
}

/**
 * 上报近距离检测数据
 * @description placeholder 实现，静默成功
 * @param _data - 包含设备 ID、附近设备 ID 和距离的数据
 */
export async function reportProximity(
  _data: {
    deviceId: string;
    nearbyDeviceId: string;
    distance: number;
  }
): Promise<void> {
  // TODO: 替换为真实 API 调用
  // await fetch('/api/proximity', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(data),
  // });
}
