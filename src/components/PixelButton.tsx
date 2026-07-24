/**
 * 像素风格按钮组件
 * @description 16-bit RPG 风格按钮，3px 实线边框 + box-shadow 凸起效果，
 *              hover 上移 2px，active 下移 2px。支持 primary/secondary/danger 变体。
 * @module components/PixelButton
 */

import type { ButtonHTMLAttributes, ReactNode } from 'react';

/** 按钮变体类型 */
type ButtonVariant = 'primary' | 'secondary' | 'danger';

/** PixelButton 组件属性 */
interface PixelButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  /** 按钮变体 */
  variant?: ButtonVariant;
  /** 按钮内容 */
  children: ReactNode;
  /** 是否禁用 */
  disabled?: boolean;
  /** 点击回调 */
  onClick?: () => void;
}

/** 变体样式映射 */
const VARIANT_STYLES: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: '#4FC3F7',
    borderColor: '#0277BD',
    color: '#FFFFFF',
  },
  secondary: {
    backgroundColor: '#E0E0E0',
    borderColor: '#9E9E9E',
    color: '#333333',
  },
  danger: {
    backgroundColor: '#EF5350',
    borderColor: '#C62828',
    color: '#FFFFFF',
  },
};

/**
 * 像素风格按钮
 *
 * @param props - 按钮属性
 * @returns 像素风格按钮 JSX 元素
 *
 * @example
 * ```tsx
 * <PixelButton variant="primary" onClick={() => console.log('clicked')}>
 *   开始扫描
 * </PixelButton>
 * ```
 */
export function PixelButton({
  variant = 'primary',
  children,
  disabled = false,
  onClick,
  ...rest
}: PixelButtonProps): React.JSX.Element {
  const variantStyle = VARIANT_STYLES[variant];

  const baseStyle: React.CSSProperties = {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '10px',
    padding: '10px 16px',
    border: '3px solid',
    borderColor: variantStyle.borderColor,
    backgroundColor: disabled ? '#BDBDBD' : variantStyle.backgroundColor,
    color: disabled ? '#757575' : variantStyle.color,
    boxShadow: disabled
      ? 'none'
      : `4px 4px 0px ${variantStyle.borderColor}`,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'transform 0.1s, box-shadow 0.1s',
    transform: 'translate(0, 0)',
    outline: 'none',
    lineHeight: 1.4,
    letterSpacing: '0.5px',
    textTransform: 'none',
    whiteSpace: 'nowrap',
  };

  const handleMouseDown = () => {
    const btn = document.activeElement as HTMLButtonElement | null;
    if (btn && !disabled) {
      btn.style.transform = 'translate(2px, 2px)';
      btn.style.boxShadow = 'none';
    }
  };

  const handleMouseUp = () => {
    const btn = document.activeElement as HTMLButtonElement | null;
    if (btn && !disabled) {
      btn.style.transform = 'translate(0, 0)';
      btn.style.boxShadow = `4px 4px 0px ${variantStyle.borderColor}`;
    }
  };

  return (
    <button
      style={baseStyle}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      {...rest}
    >
      {children}
    </button>
  );
}
