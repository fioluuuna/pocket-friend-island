/**
 * 像素居民精灵 - 继承 Phaser.GameObjects.Container
 * @description 表示小岛上的像素小人居民，支持 idle 浮动动画和跳入动画
 * @module island/sprites/ResidentSprite
 */

import Phaser from 'phaser';

/** 居民精灵存储的数据结构 */
export interface ResidentData {
  /** 居民唯一 ID */
  id: string;
  /** 显示名称 */
  displayName: string;
  /** 兴趣标签 */
  interests: string[];
}

/**
 * 像素居民精灵
 * @extends Phaser.GameObjects.Container
 */
export class ResidentSprite extends Phaser.GameObjects.Container {
  /** 居民数据 */
  private residentData: ResidentData;
  /** 精灵身体部分（用于动画） */
  private bodySprite: Phaser.GameObjects.Sprite;

  /**
   * 私有构造函数，请使用 {@link createFromCanvas} 静态方法创建实例
   * @param scene - Phaser 场景
   * @param x - X 坐标
   * @param y - Y 坐标
   * @param texture - 已生成的纹理 key
   * @param data - 居民数据
   */
  private constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    data: ResidentData
  ) {
    super(scene, x, y);

    this.residentData = data;

    // 创建精灵并添加到容器
    this.bodySprite = scene.add.sprite(0, 0, texture);
    this.bodySprite.setOrigin(0.5, 1);
    this.add(this.bodySprite);

    // 设置容器大小
    this.setSize(32, 48);
  }

  /**
   * 从 Canvas 创建居民精灵
   * @description 将传入的 canvas 内容注册为 Phaser 纹理，然后创建精灵
   * @param scene - Phaser 场景
   * @param id - 居民 ID（用作纹理 key）
   * @param canvas - 包含像素小人图形的 HTMLCanvasElement
   * @param data - 居民数据
   * @returns ResidentSprite 实例
   */
  static createFromCanvas(
    scene: Phaser.Scene,
    id: string,
    canvas: HTMLCanvasElement,
    data: ResidentData
  ): ResidentSprite {
    // 将 canvas 注册为纹理
    if (!scene.textures.exists(id)) {
      scene.textures.addSpriteSheet(
        id,
        canvas as any,
        { frameWidth: canvas.width, frameHeight: canvas.height }
      );
    }

    const sprite = new ResidentSprite(scene, 0, 0, id, data);
    scene.add.existing(sprite);
    return sprite;
  }

  /**
   * 播放待机浮动动画（上下浮动 2 像素，周期 2 秒）
   */
  playIdleAnimation(): void {
    this.scene.tweens.add({
      targets: this,
      y: this.y - 2,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * 播放跳入小岛动画（从上方弹跳落下）
   * @param x - 目标 X 坐标
   * @param y - 目标 Y 坐标
   */
  playJumpInAnimation(x: number, y: number): void {
    // 设置起始位置在目标上方
    this.setPosition(x, y - 100);

    this.scene.tweens.add({
      targets: this,
      y: y,
      duration: 800,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        // 跳入完成后播放待机动画
        this.playIdleAnimation();
      },
    });
  }

  /**
   * 设置/更新居民数据
   * @param data - 居民数据
   */
  setResidentData(data: Partial<ResidentData>): void {
    this.residentData = { ...this.residentData, ...data };
  }

  /**
   * 获取居民数据
   * @returns 居民数据
   */
  getResidentData(): ResidentData {
    return { ...this.residentData };
  }
}
