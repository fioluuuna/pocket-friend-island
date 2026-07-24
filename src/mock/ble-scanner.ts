/**
 * 模拟 BLE 扫描器
 * @description 模拟蓝牙低功耗扫描行为，定时随机选取模拟玩家生成近距离检测事件。
 *              仅触发距离在 10 米以内的设备。
 * @module mock/ble-scanner
 */

import type { ProximityEvent } from '../types';
import { MOCK_PLAYERS } from './mock-players';

/**
 * 模拟 BLE 扫描器
 * @extends EventTarget
 *
 * @example
 * ```typescript
 * const scanner = new MockBLEScanner();
 * scanner.addEventListener('scan', (e) => {
 *   const events = (e as CustomEvent<ProximityEvent[]>).detail;
 *   console.log('Detected:', events);
 * });
 * scanner.startScan(3000);
 * ```
 */
export class MockBLEScanner extends EventTarget {
  /** 定时器 ID */
  private intervalId: ReturnType<typeof setInterval> | null = null;

  /**
   * 开始模拟 BLE 扫描
   * @description 每 intervalMs 毫秒触发一次 scan 事件，
   *              随机选取 0-3 个模拟玩家，随机生成 1-15 米距离，
   *              只触发 distanceMeters <= 10 的设备。
   * @param intervalMs - 扫描间隔（毫秒），默认 3000
   */
  startScan(intervalMs: number = 3000): void {
    if (this.intervalId !== null) {
      // 已在扫描中，不再重复启动
      return;
    }

    this.intervalId = setInterval(() => {
      // 随机选取 0-3 个模拟玩家
      const count = Math.floor(Math.random() * 4);
      const shuffled = [...MOCK_PLAYERS].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, count);

      // 生成近距离事件（过滤 10 米以内）
      const events: ProximityEvent[] = selected
        .map((player) => ({
          deviceId: player.id,
          distanceMeters: Math.round(Math.random() * 15 * 10) / 10,
          rssi: -Math.floor(Math.random() * 60) - 40,
          timestamp: Date.now(),
        }))
        .filter((evt) => evt.distanceMeters <= 10);

      // 触发 scan 事件
      if (events.length > 0) {
        this.dispatchEvent(
          new CustomEvent<ProximityEvent[]>('scan', { detail: events })
        );
      }
    }, intervalMs);
  }

  /**
   * 停止模拟 BLE 扫描
   */
  stopScan(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
