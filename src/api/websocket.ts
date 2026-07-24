/**
 * WebSocket 连接管理（Placeholder）
 * @description 管理 Pocket Friend 后端的 WebSocket 连接，
 *              支持匹配事件和捕捉事件的回调注册。
 * @module api/websocket
 */

/** WebSocket 消息类型 */
interface WSMessage {
  type: 'match' | 'capture' | 'ping' | 'pong';
  payload: Record<string, unknown>;
}

/**
 * Pocket Friend WebSocket 连接管理器
 *
 * @example
 * ```typescript
 * const ws = new PocketFriendWS();
 * ws.onMatch((data) => console.log('New match!', data));
 * ws.onCapture((data) => console.log('Captured!', data));
 * ws.connect('wss://api.pocketfriend.dev/ws');
 * // ... 使用后
 * ws.disconnect();
 * ```
 */
export class PocketFriendWS {
  /** WebSocket 实例 */
  private ws: WebSocket | null = null;

  /** 匹配事件回调 */
  private matchCallback: ((data: Record<string, unknown>) => void) | null = null;

  /** 捕捉事件回调 */
  private captureCallback: ((data: Record<string, unknown>) => void) | null = null;

  /**
   * 建立 WebSocket 连接
   * @param url - WebSocket 服务器地址
   */
  connect(url: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return; // 已连接
    }

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('[PocketFriendWS] Connected to', url);
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const message: WSMessage = JSON.parse(event.data as string);

        switch (message.type) {
          case 'match':
            if (this.matchCallback) {
              this.matchCallback(message.payload);
            }
            break;
          case 'capture':
            if (this.captureCallback) {
              this.captureCallback(message.payload);
            }
            break;
          case 'ping':
            this.sendPong();
            break;
          default:
            console.warn('[PocketFriendWS] Unknown message type:', message.type);
        }
      } catch {
        console.error('[PocketFriendWS] Failed to parse message:', event.data);
      }
    };

    this.ws.onclose = () => {
      console.log('[PocketFriendWS] Disconnected');
      this.ws = null;
    };

    this.ws.onerror = (error: Event) => {
      console.error('[PocketFriendWS] Error:', error);
    };
  }

  /**
   * 断开 WebSocket 连接
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.matchCallback = null;
    this.captureCallback = null;
  }

  /**
   * 注册匹配事件回调
   * @param callback - 匹配事件回调函数
   */
  onMatch(callback: (data: Record<string, unknown>) => void): void {
    this.matchCallback = callback;
  }

  /**
   * 注册捕捉事件回调
   * @param callback - 捕捉事件回调函数
   */
  onCapture(callback: (data: Record<string, unknown>) => void): void {
    this.captureCallback = callback;
  }

  /**
   * 发送 pong 响应
   */
  private sendPong(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'pong', payload: {} }));
    }
  }
}
