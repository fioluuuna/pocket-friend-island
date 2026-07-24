/**
 * 匹配结果卡片组件
 * @description 像素风格匹配结果展示，显示对方名字、匹配分数、匹配等级、
 *              共同标签、互补标签、匹配理由和协作画像。提供"查看小岛"和"稍后再说"按钮。
 * @module components/MatchCard
 */

import type { MatchResult } from '../types';
import { MATCH_TIER_LABELS, MATCH_TIER_COLORS, COLLABORATION_STYLE_LABELS } from '../types';
import { PixelButton } from './PixelButton';

/** MatchCard 组件属性 */
interface MatchCardProps {
  /** 匹配结果数据 */
  match: MatchResult;
  /** 查看小岛回调 */
  onViewIsland: (playerId: string) => void;
  /** 稍后再说回调 */
  onDismiss: (playerId: string) => void;
}

/** 匹配等级对应分数颜色渐变 */
const TIER_GRADIENTS: Record<string, string> = {
  high: 'linear-gradient(135deg, #EF5350, #FF7043)',
  medium: 'linear-gradient(135deg, #FFD54F, #FFB74D)',
  low: 'linear-gradient(135deg, #A5D6A7, #81C784)',
};

/**
 * 匹配结果卡片
 *
 * @param props - 组件属性
 * @returns 匹配结果卡片 JSX
 *
 * @example
 * ```tsx
 * <MatchCard
 *   match={matchResult}
 *   onViewIsland={(id) => navigate(`/island/${id}`)}
 *   onDismiss={(id) => console.log('dismissed', id)}
 * />
 * ```
 */
export function MatchCard({
  match,
  onViewIsland,
  onDismiss,
}: MatchCardProps): React.JSX.Element {
  const { player, score, tier, commonInterests, complementaryInterests, reason, collaborationPortrait } = match;
  const tierColor = MATCH_TIER_COLORS[tier];

  const cardStyle: React.CSSProperties = {
    fontFamily: "'Press Start 2P', monospace",
    backgroundColor: '#FFFDE7',
    border: '4px solid #5D4037',
    boxShadow: '6px 6px 0px #3E2723',
    padding: '20px',
    maxWidth: 360,
    width: '100%',
    boxSizing: 'border-box',
    position: 'relative',
  };

  const innerBorderStyle: React.CSSProperties = {
    border: '2px dashed #BCAAA4',
    padding: '12px',
    marginTop: '8px',
  };

  const scoreStyle: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: 'bold' as const,
    color: tierColor,
    textShadow: `2px 2px 0px ${tierColor}40`,
    margin: '8px 0',
  };

  const tagContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '6px',
    margin: '6px 0',
  };

  const tagStyle: React.CSSProperties = {
    fontSize: '7px',
    padding: '4px 6px',
    backgroundColor: '#E8F5E9',
    border: '2px solid #66BB6A',
    color: '#2E7D32',
  };

  const compTagStyle: React.CSSProperties = {
    fontSize: '7px',
    padding: '4px 6px',
    backgroundColor: '#E3F2FD',
    border: '2px solid #42A5F5',
    color: '#1565C0',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '8px',
    color: '#5D4037',
    margin: '10px 0 4px 0',
  };

  return (
    <div style={cardStyle}>
      {/* 标题栏 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '2px solid #5D4037',
        paddingBottom: '8px',
        marginBottom: '8px',
      }}>
        <span style={{ fontSize: '12px', color: '#333' }}>
          {player.displayName}
        </span>
        <span style={{
          fontSize: '8px',
          padding: '3px 8px',
          backgroundColor: tierColor,
          color: tier === 'medium' ? '#333' : '#FFF',
          border: '2px solid #5D4037',
        }}>
          {MATCH_TIER_LABELS[tier]}
        </span>
      </div>

      {/* 匹配分数 */}
      <div style={{ textAlign: 'center' }}>
        <span style={scoreStyle}>{score}</span>
        <span style={{ fontSize: '8px', color: '#888' }}>/ 100</span>
      </div>

      <div style={innerBorderStyle}>
        {/* 协作画像 */}
        <div style={sectionTitleStyle}>协作画像</div>
        <div style={{
          fontSize: '10px',
          color: '#7B1FA2',
          marginBottom: '8px',
        }}>
          {collaborationPortrait}
        </div>

        {/* 共同标签 */}
        {commonInterests.length > 0 && (
          <>
            <div style={sectionTitleStyle}>共同标签</div>
            <div style={tagContainerStyle}>
              {commonInterests.map((tag) => (
                <span key={tag} style={tagStyle}>{tag}</span>
              ))}
            </div>
          </>
        )}

        {/* 互补标签 */}
        {complementaryInterests.length > 0 && (
          <>
            <div style={sectionTitleStyle}>互补标签</div>
            <div style={tagContainerStyle}>
              {complementaryInterests.map((tag) => (
                <span key={tag} style={compTagStyle}>{tag}</span>
              ))}
            </div>
          </>
        )}

        {/* 匹配理由 */}
        <div style={sectionTitleStyle}>匹配理由</div>
        <p style={{
          fontSize: '8px',
          lineHeight: 1.8,
          color: '#555',
          margin: '4px 0',
        }}>
          {reason}
        </p>
      </div>

      {/* 操作按钮 */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginTop: '14px',
        justifyContent: 'center',
      }}>
        <PixelButton variant="primary" onClick={() => onViewIsland(player.id)}>
          查看小岛
        </PixelButton>
        <PixelButton variant="secondary" onClick={() => onDismiss(player.id)}>
          稍后再说
        </PixelButton>
      </div>
    </div>
  );
}
