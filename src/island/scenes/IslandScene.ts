/**
 * 小岛游戏主场景
 * @description 使用纯 Canvas 绘制像素风格小岛场景，包含天空、云朵、草地小岛、
 *              树木、房屋、中心设备图标和瀑布动画。支持动态添加居民像素小人。
 * @module island/scenes/IslandScene
 */

import Phaser from 'phaser';
import { IslandBackground } from '../sprites/IslandBackground';
import { ResidentSprite, type ResidentData } from '../sprites/ResidentSprite';

/**
 * 小岛主场景
 * @extends Phaser.Scene
 */
export class IslandScene extends Phaser.Scene {
  /** 离屏 canvas 用于背景绘制 */
  private bgCanvas: HTMLCanvasElement = document.createElement('canvas');
  /** 瀑布动画帧计数器 */
  private waterfallFrame = 0;
  /** 瀑布纹理 key */
  private waterfallTextureKey = 'waterfall';
  /** 背景纹理 key */
  private bgTextureKey = 'island-bg';
  /** 云朵精灵组 */
  private clouds: Phaser.GameObjects.Image[] = [];
  /** 瀑布精灵 */
  private waterfallSprite: Phaser.GameObjects.Image | null = null;
  /** 居民精灵映射 */
  private residents: Map<string, ResidentSprite> = new Map();
  /** 是否已初始化 */
  private initialized = false;

  constructor() {
    super({ key: 'IslandScene' });
  }

  /**
   * 场景创建 - 绘制完整的小岛场景
   */
  create(): void {
    // 绘制离屏背景
    this.drawBackground();

    // 注册背景纹理
    this.textures.addCanvas(this.bgTextureKey, this.bgCanvas);
    this.add.image(400, 300, this.bgTextureKey);

    // 初始化瀑布动画
    this.initWaterfall();

    // 初始化云朵动画
    this.initClouds();

    this.initialized = true;
  }

  /**
   * 每帧更新 - 驱动瀑布和云朵动画
   */
  update(_time: number, delta: number): void {
    // 瀑布动画更新（每 200ms 切换帧）
    this.waterfallFrame += delta * 0.005;
    this.updateWaterfall();

    // 云朵漂移
    this.updateClouds(delta);
  }

  /**
   * 绘制完整背景到离屏 canvas
   */
  private drawBackground(): void {
    this.bgCanvas.width = 800;
    this.bgCanvas.height = 600;
    const ctx = this.bgCanvas.getContext('2d');
    if (!ctx) return;

    // 天空
    IslandBackground.drawSky(ctx, 800, 600);

    // 静态云朵
    IslandBackground.drawCloud(ctx, 80, 40);
    IslandBackground.drawCloud(ctx, 550, 70);
    IslandBackground.drawCloud(ctx, 320, 25);

    // 小岛（中心偏下）
    IslandBackground.drawIsland(ctx, 400, 360);

    // 树木
    IslandBackground.drawTree(ctx, 260, 340);
    IslandBackground.drawTree(ctx, 520, 345);
    IslandBackground.drawTree(ctx, 180, 355);

    // 房子 1 - 粉色屋顶 + 米色墙
    IslandBackground.drawHouse(ctx, 310, 390, '#F48FB1', '#FFF8E1');

    // 房子 2 - 蓝色屋顶 + 白色墙
    IslandBackground.drawHouse(ctx, 460, 385, '#4FC3F7', '#FFFFFF');

    // 中心设备图标（发光项链）
    this.drawDeviceIcon(ctx, 400, 320);
  }

  /**
   * 绘制中心发光 Pocket Friend 项链设备图标
   * @param ctx - Canvas 渲染上下文
   * @param cx - 中心 X
   * @param cy - 中心 Y
   */
  private drawDeviceIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    const px = 4;

    // 外发光效果
    ctx.fillStyle = 'rgba(79, 195, 247, 0.2)';
    for (let i = 3; i >= 0; i--) {
      const size = px * (8 + i * 2);
      ctx.fillRect(cx - size / 2, cy - size / 2, size, size);
    }

    // 设备主体（圆角矩形）
    ctx.fillStyle = '#37474F';
    ctx.fillRect(cx - px * 3, cy - px * 4, px * 6, px * 8);
    ctx.fillRect(cx - px * 4, cy - px * 3, px * 8, px * 6);

    // 屏幕（蓝色发光）
    ctx.fillStyle = '#4FC3F7';
    ctx.fillRect(cx - px * 2, cy - px * 3, px * 4, px * 4);
    ctx.fillStyle = '#81D4FA';
    ctx.fillRect(cx - px, cy - px * 2, px * 2, px * 2);

    // 项链绳
    ctx.fillStyle = '#FFD54F';
    ctx.fillRect(cx - px, cy - px * 6, px * 2, px);
    ctx.fillRect(cx + px, cy - px * 7, px, px);
    ctx.fillRect(cx + px * 2, cy - px * 6, px, px);
  }

  /**
   * 初始化瀑布精灵
   */
  private initWaterfall(): void {
    // 创建瀑布离屏 canvas
    const wfCanvas = document.createElement('canvas');
    wfCanvas.width = 40;
    wfCanvas.height = 60;
    const wfCtx = wfCanvas.getContext('2d');
    if (!wfCtx) return;

    IslandBackground.drawWaterfall(wfCtx, 8, 0, 0);

    if (!this.textures.exists(this.waterfallTextureKey)) {
      this.textures.addCanvas(this.waterfallTextureKey, wfCanvas);
    }

    this.waterfallSprite = this.add.image(160, 420, this.waterfallTextureKey);
  }

  /**
   * 更新瀑布动画帧
   */
  private updateWaterfall(): void {
    const frame = Math.floor(this.waterfallFrame) % 8;
    const wfCanvas = document.createElement('canvas');
    wfCanvas.width = 40;
    wfCanvas.height = 60;
    const wfCtx = wfCanvas.getContext('2d');
    if (!wfCtx) return;

    IslandBackground.drawWaterfall(wfCtx, 8, 0, frame);

    // 更新纹理：先移除旧纹理再重新添加
    if (this.textures.exists(this.waterfallTextureKey)) {
      this.textures.remove(this.waterfallTextureKey);
    }
    this.textures.addCanvas(this.waterfallTextureKey, wfCanvas);
    // 刷新已使用该纹理的精灵
    if (this.waterfallSprite) {
      this.waterfallSprite.setTexture(this.waterfallTextureKey);
    }
  }

  /**
   * 初始化云朵动画精灵
   */
  private initClouds(): void {
    const cloudPositions = [
      { x: 150, y: 80 },
      { x: 600, y: 50 },
      { x: 380, y: 110 },
    ];

    cloudPositions.forEach((pos) => {
      const cloudCanvas = document.createElement('canvas');
      cloudCanvas.width = 40;
      cloudCanvas.height = 24;
      const cCtx = cloudCanvas.getContext('2d');
      if (!cCtx) return;

      IslandBackground.drawCloud(cCtx, 0, 0);

      const key = `cloud-${pos.x}`;
      if (!this.textures.exists(key)) {
        this.textures.addCanvas(key, cloudCanvas);
      }

      const cloud = this.add.image(pos.x, pos.y, key);
      cloud.setAlpha(0.8);
      this.clouds.push(cloud);
    });
  }

  /**
   * 更新云朵漂移动画
   * @param delta - 帧间隔毫秒
   */
  private updateClouds(delta: number): void {
    this.clouds.forEach((cloud) => {
      cloud.x += delta * 0.01;
      // 循环回到左侧
      if (cloud.x > 850) {
        cloud.x = -50;
      }
    });
  }

  /**
   * 添加居民像素小人到小岛
   * @param id - 居民唯一 ID
   * @param x - 放置 X 坐标
   * @param y - 放置 Y 坐标
   * @param canvas - 包含像素小人图像的 canvas
   * @param data - 居民数据
   */
  addResident(
    id: string,
    x: number,
    y: number,
    canvas: HTMLCanvasElement,
    data: ResidentData
  ): ResidentSprite {
    // 如果已有同名居民则移除
    if (this.residents.has(id)) {
      const existing = this.residents.get(id)!;
      existing.destroy();
      this.residents.delete(id);
    }

    const resident = ResidentSprite.createFromCanvas(this, id, canvas, data);
    resident.setPosition(x, y);
    resident.playJumpInAnimation(x, y);
    this.residents.set(id, resident);

    return resident;
  }

  /**
   * 移除居民
   * @param id - 居民唯一 ID
   */
  removeResident(id: string): void {
    const resident = this.residents.get(id);
    if (resident) {
      resident.destroy();
      this.residents.delete(id);
    }
  }

  /**
   * 获取所有居民精灵
   * @returns 居民精灵数组
   */
  getResidents(): ResidentSprite[] {
    return Array.from(this.residents.values());
  }
}
