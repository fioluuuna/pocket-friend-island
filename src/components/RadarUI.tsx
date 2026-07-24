/**
 * 雷达扫描 UI 组件
 * @description CSS 实现的圆形雷达，带旋转扫描线动画，中心闪烁点，
 *              检测到的设备按 matchTier 显示不同颜色（high=红，medium=黄）。
 * @module components/RadarUI
 */

import type { CSSProperties } from 'react';
import type { ProximityEvent } from '../types';

/** 雷达检测到的设备信息 */
interface RadarDevice extends ProximityEvent {
  /** 匹配等级 */
  matchTier: 'high' | 'medium' | 'low';
}

/** RadarUI 组件属性 */
interface RadarUIProps {
  /** 检测到的设备列表 */
  devices: RadarDevice[];
  /** 雷达尺寸（像素） */
  size?: number;
  /** 是否正在扫描 */
  scanning?: boolean;
}

/** 匹配等级对应雷达点颜色 */
const DEVICE_COLORS: Record<string, string> = {
  high: '#EF5350',
  medium: '#FFD54F',
  low: '#A5D6A7',
};

/**
 * 雷达扫描 UI
 *
 * @param props - 组件属性
 * @returns 雷达 UI JSX
 *
 * @example
 * ```tsx
 * <RadarUI devices={detectedDevices} scanning={true} size={200} />
 * ```
 */
export function RadarUI({
  devices,
  size = 200,
  scanning = true,
}: RadarUIProps): React.JSX.Element {
  const center = size / 2;

  /**
   * 将设备距离映射为雷达上的角度和半径位置
   * @param distanceMeters - 设备距离（米）
   * @param index - 设备索引（用于分散角度）
   */
  const getDevicePosition = (
    distanceMeters: number,
    index: number
  ): { x: number; y: number } => {
    // 距离越远越靠近边缘，最大 10 米
    const ratio = Math.min(distanceMeters / 10, 1);
    const radius = ratio * (center - 20);
    // 按索引均匀分布角度
    const angle = (index * 2.3) + (Date.now() * 0.001);
    return {
      x: center + Math.cos(angle) * radius,
      y: center + Math.sin(angle) * radius,
    };
  };

  const containerStyle: CSSProperties = {
    position: 'relative',
    width: size,
    height: size,
    borderRadius: '50%',
    border: '3px solid #37474F',
    boxShadow: '4px 4px 0px #263238',
    overflow: 'hidden',
    backgroundColor: '#1B5E20',
  };

  // 同心圆网格
  const rings = [0.33, 0.66, 1.0];

  return (
    <div style={containerStyle}>
      {/* 背景网格线 - 十字线 */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: 0,
        right: 0,
        height: '1px',
        backgroundColor: 'rgba(76, 175, 80, 0.4)',
      }} />
      <div style={{
        position: 'absolute',
        left: '50%',
        top: 0,
        bottom: 0,
        width: '1px',
        backgroundColor: 'rgba(76, 175, 80, 0.4)',
      }} />

      {/* 同心圆 */}
      {rings.map((ratio) => (
        <div
          key={ratio}
          style={{
            position: 'absolute',
            top: `${(1 - ratio) * 50}%`,
            left: `${(1 - ratio) * 50}%`,
            width: `${ratio * 100}%`,
            height: `${ratio * 100}%`,
            borderRadius: '50%',
            border: '1px solid rgba(76, 175, 80, 0.3)',
          }}
        />
      ))}

      {/* 旋转扫描线 */}
      {scanning && (
        <div
          className="radar-sweep"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '50%',
            height: '2px',
            transformOrigin: '0 0',
            animation: 'radar-rotate 2s linear infinite',
          }}
        >
          {/* 扫描线尾迹 */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '2px',
            background: 'linear-gradient(90deg, rgba(76,175,80,0.8), rgba(76,175,80,0))',
          }} />
        </div>
      )}

      {/* 中心闪烁点 */}
      <div
        className="radar-center-blink"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 8,
          height: 8,
          marginTop: -4,
          marginLeft: -4,
          backgroundColor: '#4CAF50',
          border: '1px solid #81C784',
          animation: 'blink 1s ease-in-out infinite',
          zIndex: 10,
        }}
      />

      {/* 检测到的设备点 */}
      {devices.map((device, index) => {
        const pos = getDevicePosition(device.distanceMeters, index);
        const color = DEVICE_COLORS[device.matchTier] ?? DEVICE_COLORS.low;

        return (
          <div
            key={device.deviceId}
            className="radar-device-dot"
            style={{
              position: 'absolute',
              left: pos.x - 4,
              top: pos.y - 4,
              width: 8,
              height: 8,
              backgroundColor: color,
              border: '1px solid #FFFFFF',
              borderRadius: '50%',
              zIndex: 5,
              animation: 'blink 1.5s ease-in-out infinite',
              animationDelay: `${index * 0.3}s`,
            }}
          />
        );
      })}
    </div>
  );
}
