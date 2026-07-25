/**
 * Pocket Friend Island - 主应用组件
 * @description 四个视图切换（island / matching / profile / avatar），管理附近匹配和居民状态，
 *              MockBLEScanner 自动启动扫描，收到 scan 事件后使用匹配引擎计算匹配分数。
 * @module App
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { IslandSceneComponent } from './island';
import { RadarUI } from './components';
import { MatchCard } from './components';
import { PixelButton } from './components';
import { MockBLEScanner } from './mock';
import { MOCK_PLAYERS, MY_PROFILE } from './mock';
import { calculateMatchScore } from './matching';
import {
  type PlayerProfile,
  type MatchResult,
  type ProximityEvent,
  COLLABORATION_STYLE_LABELS,
} from './types';
import { TestAvatar } from './TestAvatar';
import { PhotoPixelLite } from './PhotoPixelLite';

/** 应用视图类型 */
type AppView = 'island' | 'matching' | 'profile' | 'avatar';

/** 雷达检测设备信息（扩展匹配等级） */
interface RadarDevice extends ProximityEvent {
  matchTier: 'high' | 'medium' | 'low';
}

/**
 * 主应用组件
 *
 * @returns 应用根 JSX
 */
export function App(): React.JSX.Element {
  if (window.location.pathname === '/photo-pixel-lite') {
    return <PhotoPixelLite />;
  }

  /** 当前视图 */
  const [currentView, setCurrentView] = useState<AppView>('island');
  /** 附近检测到的设备（雷达显示用） */
  const [radarDevices, setRadarDevices] = useState<RadarDevice[]>([]);
  /** 匹配结果列表 */
  const [nearbyMatches, setNearbyMatches] = useState<MatchResult[]>([]);
  /** 小岛上的居民列表 */
  const [residents, setResidents] = useState<PlayerProfile[]>([]);
  /** BLE 扫描器引用 */
  const scannerRef = useRef<MockBLEScanner | null>(null);

  /**
   * 使用匹配引擎计算两个玩家之间的匹配分数
   * 将引擎的 MatchResult 转换为 UI 友好的 MatchResult 格式
   * @param playerA - 玩家 A 的资料
   * @param playerB - 玩家 B 的资料
   * @param distance - 距离（米）
   * @returns UI 友好的匹配结果
   */
  const calculateMatch = useCallback(
    (playerA: PlayerProfile, playerB: PlayerProfile, distance: number = 5): MatchResult => {
      // 调用匹配引擎（来自 src/matching/engine.ts）
      const engineResult = calculateMatchScore(playerA, playerB, distance);

      // 转换为 UI 友好的 MatchResult 格式
      const portrait = `${COLLABORATION_STYLE_LABELS[playerA.collaboration.style]} x ${COLLABORATION_STYLE_LABELS[playerB.collaboration.style]}`;

      return {
        player: playerB,
        score: engineResult.score.total,
        tier: engineResult.tier,
        commonInterests: engineResult.sharedInterests,
        complementaryInterests: engineResult.complementInterests,
        reason: engineResult.reason,
        collaborationPortrait: portrait,
      };
    },
    []
  );

  /**
   * 处理 BLE 扫描事件
   */
  useEffect(() => {
    const scanner = new MockBLEScanner();
    scannerRef.current = scanner;

    const handleScan = (event: Event) => {
      const events = (event as CustomEvent<ProximityEvent[]>).detail;

      // 更新雷达设备（附加匹配等级）
      const newRadarDevices: RadarDevice[] = events.map((evt) => {
        const player = MOCK_PLAYERS.find((p) => p.id === evt.deviceId);
        if (!player) return { ...evt, matchTier: 'low' as const };

        const match = calculateMatch(MY_PROFILE, player, evt.distanceMeters);
        return {
          ...evt,
          matchTier: match.tier,
        };
      });
      setRadarDevices(newRadarDevices);

      // 计算匹配结果
      const newMatches: MatchResult[] = events
        .map((evt) => MOCK_PLAYERS.find((p) => p.id === evt.deviceId))
        .filter((p): p is PlayerProfile => p !== undefined)
        .map((player) => {
          const proxEvent = events.find((e) => e.deviceId === player.id);
          return calculateMatch(MY_PROFILE, player, proxEvent?.distanceMeters ?? 5);
        });

      // 合并并去重（保留最高分）
      setNearbyMatches((prev) => {
        const merged = [...prev];
        newMatches.forEach((match) => {
          const idx = merged.findIndex((m) => m.player.id === match.player.id);
          if (idx >= 0) {
            if (match.score > merged[idx].score) {
              merged[idx] = match;
            }
          } else {
            merged.push(match);
          }
        });
        return merged;
      });

      // 更新居民列表（匹配 >= medium 的加入小岛）
      const newResidents = newMatches
        .filter((m) => m.tier === 'high' || m.tier === 'medium')
        .map((m) => m.player);
      setResidents((prev) => {
        const ids = new Set([...prev.map((r) => r.id), ...newResidents.map((r) => r.id)]);
        return Array.from(ids)
          .map((id) => [...prev, ...newResidents].find((r) => r.id === id)!)
          .filter(Boolean);
      });
    };

    scanner.addEventListener('scan', handleScan);
    scanner.startScan(3000);

    return () => {
      scanner.removeEventListener('scan', handleScan);
      scanner.stopScan();
      scannerRef.current = null;
    };
  }, [calculateMatch]);

  /**
   * 当有高匹配时自动切换到 matching 视图
   */
  useEffect(() => {
    const highMatch = nearbyMatches.find((m) => m.tier === 'high');
    if (highMatch && currentView === 'island') {
      setCurrentView('matching');
    }
  }, [nearbyMatches, currentView]);

  /**
   * 查看小岛
   */
  const handleViewIsland = useCallback((playerId: string) => {
    const player = MOCK_PLAYERS.find((p) => p.id === playerId);
    if (player) {
      setResidents((prev) => [...prev, player]);
      setCurrentView('island');
    }
  }, []);

  /**
   * 稍后再说（关闭匹配卡片）
   */
  const handleDismiss = useCallback((playerId: string) => {
    setNearbyMatches((prev) => prev.filter((m) => m.player.id !== playerId));
    if (nearbyMatches.length <= 1) {
      setCurrentView('island');
    }
  }, [nearbyMatches.length]);

  const getNavStyle = (view: AppView): React.CSSProperties => ({
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '8px',
    padding: '8px 12px',
    border: '3px solid #5D4037',
    background: currentView === view ? '#4FC3F7' : '#FFFDE7',
    color: currentView === view ? '#FFFFFF' : '#3E2723',
    cursor: 'pointer',
    boxShadow: '3px 3px 0px #3E2723',
    transition: 'transform 0.1s',
    outline: 'none',
  });

  return (
    <div className="app-container">
      {/* 顶部标题 */}
      <header className="app-header">
        <span className="app-title">Pocket Friend Island</span>
        <PixelButton variant="secondary" onClick={() => setCurrentView('profile')}>
          我的档案
        </PixelButton>
      </header>

      {/* 主视图区域 */}
      <main className="view-panel" style={{ paddingBottom: '60px' }}>
        {currentView === 'island' && (
          <>
            <IslandSceneComponent residents={residents} />
            {/* 雷达面板 */}
            <div className="radar-panel">
              <RadarUI
                devices={radarDevices}
                size={160}
                scanning={true}
              />
              <span className="radar-label">
                {radarDevices.length} 设备
              </span>
            </div>
          </>
        )}

        {currentView === 'matching' && (
          <div className="match-list">
            {nearbyMatches.length === 0 ? (
              <div style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: '10px',
                color: '#795548',
                textAlign: 'center',
                padding: '40px 0',
              }}>
                暂无匹配结果...
                <br />
                请等待更多玩家出现
              </div>
            ) : (
              nearbyMatches.map((match) => (
                <MatchCard
                  key={match.player.id}
                  match={match}
                  onViewIsland={handleViewIsland}
                  onDismiss={handleDismiss}
                />
              ))
            )}
          </div>
        )}

        {currentView === 'profile' && (
          <div className="pixel-card" style={{ maxWidth: 400, width: '100%' }}>
            <h2 style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '12px',
              color: '#3E2723',
              margin: '0 0 16px 0',
            }}>
              我的档案
            </h2>

            <div style={{
              fontSize: '10px',
              lineHeight: 2.2,
              color: '#5D4037',
            }}>
              <p>名称：{MY_PROFILE.displayName}</p>
              <p>
                协作风格：{COLLABORATION_STYLE_LABELS[MY_PROFILE.collaboration.style]}
              </p>
              <p>
                兴趣标签：
                {MY_PROFILE.interests.map((tag) => (
                  <span
                    key={tag}
                    className="pixel-tag pixel-tag--common"
                    style={{ marginRight: '4px' }}
                  >
                    {tag}
                  </span>
                ))}
              </p>
            </div>

            <div style={{ marginTop: '16px' }}>
              <PixelButton variant="secondary" onClick={() => setCurrentView('island')}>
                返回小岛
              </PixelButton>
            </div>
          </div>
        )}

        {currentView === 'avatar' && (
          <TestAvatar />
        )}
      </main>

      {/* 底部导航 */}
      <nav className="app-nav">
        {(['island', 'matching', 'profile', 'avatar'] as const).map((view) => (
          <button
            key={view}
            style={getNavStyle(view)}
            onClick={() => setCurrentView(view)}
          >
            {view === 'island' ? '小岛' : view === 'matching' ? '匹配' : view === 'profile' ? '档案' : '造人'}
          </button>
        ))}
      </nav>
    </div>
  );
}
