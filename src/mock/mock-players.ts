/**
 * 模拟玩家数据
 * @description 10 个模拟玩家，涵盖各种协作风格和标签组合，用于开发和演示。
 * @module mock/mock-players
 */

import type { PlayerProfile } from '../types';

/** 模拟玩家列表 */
export const MOCK_PLAYERS: PlayerProfile[] = [
  {
    id: 'player-001',
    displayName: '阿杰',
    interests: ['硬件', 'AI', '找合伙人'],
    collaboration: { style: 'navigator', rhythm: 'icebreaker' },
    discoverable: true,
    discoveryRadiusMeters: 10,
  },
  {
    id: 'player-002',
    displayName: '小鱼',
    interests: ['工业设计', '像素美术', '嵌入式'],
    collaboration: { style: 'builder', rhythm: 'natural' },
    discoverable: true,
    discoveryRadiusMeters: 10,
  },
  {
    id: 'player-003',
    displayName: '阿凯',
    interests: ['后端', '前端', '全栈'],
    collaboration: { style: 'builder', rhythm: 'observer' },
    discoverable: true,
    discoveryRadiusMeters: 10,
  },
  {
    id: 'player-004',
    displayName: '小诺',
    interests: ['黑客松', '找合伙人', '有项目'],
    collaboration: { style: 'connector', rhythm: 'icebreaker' },
    discoverable: true,
    discoveryRadiusMeters: 10,
  },
  {
    id: 'player-005',
    displayName: '阿明',
    interests: ['AI大模型', '数据科学', 'Python'],
    collaboration: { style: 'insighter', rhythm: 'signalwaiter' },
    discoverable: true,
    discoveryRadiusMeters: 10,
  },
  {
    id: 'player-006',
    displayName: '小雨',
    interests: ['音乐制作', '视频剪辑', 'UI设计'],
    collaboration: { style: 'harmonizer', rhythm: 'natural' },
    discoverable: true,
    discoveryRadiusMeters: 10,
  },
  {
    id: 'player-007',
    displayName: '阿飞',
    interests: ['电路设计', '嵌入式', '硬件开发'],
    collaboration: { style: 'sprinter', rhythm: 'icebreaker' },
    discoverable: true,
    discoveryRadiusMeters: 10,
  },
  {
    id: 'player-008',
    displayName: '小静',
    interests: ['产品经理', '用户体验', '需求分析'],
    collaboration: { style: 'guardian', rhythm: 'observer' },
    discoverable: true,
    discoveryRadiusMeters: 10,
  },
  {
    id: 'player-009',
    displayName: '阿远',
    interests: ['独立游戏', '像素美术', 'AdventureX'],
    collaboration: { style: 'explorer', rhythm: 'signalwaiter' },
    discoverable: true,
    discoveryRadiusMeters: 10,
  },
  {
    id: 'player-010',
    displayName: '小微',
    interests: ['黑客松', '创业', '寻找共创'],
    collaboration: { style: 'connector', rhythm: 'natural' },
    discoverable: true,
    discoveryRadiusMeters: 10,
  },
];

/** 当前用户资料 */
export const MY_PROFILE: PlayerProfile = {
  id: 'me',
  displayName: '我',
  interests: ['硬件', 'AI', '找合伙人', '嵌入式', '黑客松'],
  collaboration: { style: 'builder', rhythm: 'natural' },
  discoverable: true,
  discoveryRadiusMeters: 10,
};
