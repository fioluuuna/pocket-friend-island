/**
 * 小岛场景 React 组件
 * @description 在 useEffect 中创建 Phaser.Game 实例并挂载到 div 容器，
 *              cleanup 时销毁游戏实例。接收 residents 属性用于动态添加居民。
 * @module island/IslandScene
 */

import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { createGameConfig } from './phaser-config';
import type { PlayerProfile } from '../types';

/** IslandScene 组件属性 */
interface IslandSceneProps {
  /** 当前小岛上的居民列表 */
  residents?: PlayerProfile[];
}

/**
 * 小岛场景 React 包装组件
 *
 * @param props - 组件属性
 * @returns 渲染 Phaser 游戏画布的 div 容器
 *
 * @example
 * ```tsx
 * <IslandScene residents={nearbyPlayers} />
 * ```
 */
export function IslandSceneComponent({ residents }: IslandSceneProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 创建 Phaser 游戏实例
    const config = createGameConfig(containerRef.current);
    const game = new Phaser.Game(config);
    gameRef.current = game;

    return () => {
      // 清理：销毁游戏实例
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  // 当 residents 变化时，向场景添加居民精灵
  useEffect(() => {
    if (!gameRef.current || !residents) return;

    const scene = gameRef.current.scene.getScene('IslandScene');
    if (!scene) return;

    residents.forEach((resident) => {
      // 生成像素小人 canvas
      const canvas = generatePixelPerson(resident);
      const x = 200 + Math.random() * 400;
      const y = 320 + Math.random() * 40;

      // 调用场景的 addResident 方法
      if (typeof (scene as unknown as Record<string, unknown>).addResident === 'function') {
        (scene as unknown as {
          addResident: (
            id: string,
            x: number,
            y: number,
            canvas: HTMLCanvasElement,
            data: { id: string; displayName: string; interests: string[] }
          ) => void;
        }).addResident(
          resident.id,
          x,
          y,
          canvas,
          {
            id: resident.id,
            displayName: resident.displayName,
            interests: resident.interests,
          }
        );
      }
    });
  }, [residents]);

  return (
    <div
      id="island-container"
      ref={containerRef}
      style={{
        width: '100%',
        maxWidth: 800,
        height: 600,
        margin: '0 auto',
        imageRendering: 'pixelated' as const,
      }}
    />
  );
}

/**
 * 生成像素小人的 Canvas 图像
 * @param profile - 玩家资料（用于决定颜色）
 * @returns 包含像素小人图像的 HTMLCanvasElement
 */
function generatePixelPerson(profile: PlayerProfile): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 48;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const px = 4;

  // 根据协作风格选择颜色
  const colorMap: Record<string, { head: string; body: string; legs: string }> = {
    builder: { head: '#FFD54F', body: '#4FC3F7', legs: '#37474F' },
    navigator: { head: '#FFD54F', body: '#AB47BC', legs: '#37474F' },
    connector: { head: '#FFD54F', body: '#66BB6A', legs: '#37474F' },
    insighter: { head: '#FFD54F', body: '#5C6BC0', legs: '#37474F' },
    harmonizer: { head: '#FFD54F', body: '#F48FB1', legs: '#37474F' },
    sprinter: { head: '#FFD54F', body: '#FF7043', legs: '#37474F' },
    explorer: { head: '#FFD54F', body: '#26A69A', legs: '#37474F' },
    guardian: { head: '#FFD54F', body: '#78909C', legs: '#37474F' },
  };

  const colors = colorMap[profile.collaboration.style] ?? colorMap.builder;

  // 头部（肤色）
  ctx.fillStyle = colors.head;
  ctx.fillRect(8, 0, px * 4, px * 4);
  ctx.fillRect(4, px, px * 6, px * 2);

  // 眼睛（黑色像素点）
  ctx.fillStyle = '#000000';
  ctx.fillRect(px * 2, px * 2, px, px);
  ctx.fillRect(px * 5, px * 2, px, px);

  // 嘴巴
  ctx.fillStyle = '#E57373';
  ctx.fillRect(px * 3, px * 3, px * 2, px);

  // 身体
  ctx.fillStyle = colors.body;
  ctx.fillRect(4, px * 5, px * 6, px * 4);

  // 手臂
  ctx.fillStyle = colors.head;
  ctx.fillRect(0, px * 5, px, px * 3);
  ctx.fillRect(px * 7, px * 5, px, px * 3);

  // 腿
  ctx.fillStyle = colors.legs;
  ctx.fillRect(px * 2, px * 9, px * 2, px * 3);
  ctx.fillRect(px * 5, px * 9, px * 2, px * 3);

  return canvas;
}
