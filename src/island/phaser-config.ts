/**
 * Phaser 3 游戏配置
 * @module island/phaser-config
 */

import Phaser from 'phaser';
import { IslandScene } from './scenes/IslandScene';

/**
 * 创建 Phaser 游戏配置对象
 * @description 800x600 像素画布，启用像素艺术渲染，天蓝色背景，Arcade 物理无重力
 */
export function createGameConfig(
  parent: string | HTMLElement
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: 800,
    height: 600,
    pixelArt: true,
    backgroundColor: '#87CEEB',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scene: [IslandScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  };
}
