/**
 * 像素小人头像预览组件
 * @description 将传入的 canvas 渲染为图片显示，支持缩放和特征标签展示。
 * @module components/AvatarPreview
 */

import { useMemo } from 'react';

/** AvatarPreview 组件属性 */
interface AvatarPreviewProps {
  /** 包含像素小人图像的 canvas 元素 */
  canvas: HTMLCanvasElement;
  /** 显示尺寸（像素），默认 64 */
  size?: number;
  /** 特征标签文字列表 */
  tags?: string[];
}

/**
 * 像素小人头像预览
 *
 * @param props - 组件属性
 * @returns 头像预览 JSX
 *
 * @example
 * ```tsx
 * const canvas = generatePixelPerson(player);
 * <AvatarPreview canvas={canvas} size={80} tags={['硬件', 'AI']} />
 * ```
 */
export function AvatarPreview({
  canvas,
  size = 64,
  tags = [],
}: AvatarPreviewProps): React.JSX.Element {
  /** 将 canvas 转换为 data URL */
  const dataUrl = useMemo(() => {
    return canvas.toDataURL('image/png');
  }, [canvas]);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
  };

  const imageStyle: React.CSSProperties = {
    width: size,
    height: size,
    imageRendering: 'pixelated' as React.CSSProperties['imageRendering'],
    border: '3px solid #5D4037',
    boxShadow: '3px 3px 0px #3E2723',
    backgroundColor: '#87CEEB',
  };

  const tagsContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '3px',
    justifyContent: 'center',
    maxWidth: size + 20,
  };

  const tagStyle: React.CSSProperties = {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '6px',
    padding: '2px 4px',
    backgroundColor: '#FFF8E1',
    border: '1px solid #FFB74D',
    color: '#E65100',
    lineHeight: 1.4,
  };

  return (
    <div style={containerStyle}>
      <img
        src={dataUrl}
        alt="Pixel avatar"
        style={imageStyle}
        width={size}
        height={size}
      />
      {tags.length > 0 && (
        <div style={tagsContainerStyle}>
          {tags.map((tag) => (
            <span key={tag} style={tagStyle}>
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
