import type { CollaborationStyle, SocialRhythm, CollaborationProfile } from "../types";

/**
 * 8种协作风格的中文标签
 */
export const STYLE_LABELS: Record<CollaborationStyle, string> = {
  navigator: "领航者",
  builder: "建造者",
  connector: "连接者",
  insighter: "洞察者",
  harmonizer: "调和者",
  sprinter: "冲刺者",
  guardian: "守护者",
  explorer: "探路者",
};

/**
 * 4种社交节奏的中文标签
 */
export const RHYTHM_LABELS: Record<SocialRhythm, string> = {
  icebreaker: "破冰者",
  natural: "自然型",
  signalwaiter: "信号等待者",
  observer: "观察者",
};

/**
 * 协作风格兼容矩阵 (8x8)
 * 行和列顺序: navigator, builder, connector, insighter, harmonizer, sprinter, guardian, explorer
 * 分值范围: 0-35
 * 高度适配(互补): 28-35 | 中性适配: 14-27 | 低适配: 0-13
 */
const STYLE_MATRIX: number[][] = [
  /* nav  */ [ 15,  35,  22,  25,  20,  32,  18,  26],
  /* bld  */ [ 35,  15,  20,  18,  22,  30,  24,  20],
  /* con  */ [ 22,  20,  15,  33,  30,  18,  14,  25],
  /* ins  */ [ 25,  18,  33,  15,  20,  16,  20,  29],
  /* har  */ [ 20,  22,  30,  20,  15,  14,  22,  18],
  /* spr  */ [ 32,  30,  18,  16,  14,  15,   8,  22],
  /* grd  */ [ 18,  24,  14,  20,  22,   8,  15,  16],
  /* exp  */ [ 26,  20,  25,  29,  18,  22,  16,  15],
];

/**
 * 社交节奏兼容矩阵 (4x4)
 * 行和列顺序: icebreaker, natural, signalwaiter, observer
 * 分值范围: 0-15
 */
const RHYTHM_MATRIX: number[][] = [
  /* ice */  [ 15,  13,   7,   8],
  /* nat */  [ 13,  14,  12,  10],
  /* sig */  [  7,  12,   6,  10],
  /* obs */  [  8,  10,  10,   5],
];

/** 协作风格索引映射 */
const STYLE_ORDER: CollaborationStyle[] = [
  "navigator", "builder", "connector", "insighter",
  "harmonizer", "sprinter", "guardian", "explorer",
];

/** 社交节奏索引映射 */
const RHYTHM_ORDER: SocialRhythm[] = [
  "icebreaker", "natural", "signalwaiter", "observer",
];

/**
 * 获取两种协作风格之间的兼容分
 * @param a - 协作风格 A
 * @param b - 协作风格 B
 * @returns 兼容分 0-35
 */
export function getStyleCompatibility(
  a: CollaborationStyle,
  b: CollaborationStyle
): number {
  const rowIdx = STYLE_ORDER.indexOf(a);
  const colIdx = STYLE_ORDER.indexOf(b);
  if (rowIdx === -1 || colIdx === -1) {
    return 15; // 未知风格默认返回中性分
  }
  return STYLE_MATRIX[rowIdx]![colIdx]!;
}

/**
 * 获取两种社交节奏之间的兼容分
 * @param a - 社交节奏 A
 * @param b - 社交节奏 B
 * @returns 兼容分 0-15
 */
export function getRhythmCompatibility(
  a: SocialRhythm,
  b: SocialRhythm
): number {
  const rowIdx = RHYTHM_ORDER.indexOf(a);
  const colIdx = RHYTHM_ORDER.indexOf(b);
  if (rowIdx === -1 || colIdx === -1) {
    return 10; // 未知节奏默认返回中性分
  }
  return RHYTHM_MATRIX[rowIdx]![colIdx]!;
}

/**
 * 计算两个协作画像之间的综合适配分
 * @param profileA - 协作画像 A
 * @param profileB - 协作画像 B
 * @returns 包含风格分(0-35)、节奏分(0-15)、总分(0-50)的对象
 */
export function getCollaborationScore(
  profileA: CollaborationProfile,
  profileB: CollaborationProfile
): { styleScore: number; rhythmScore: number; total: number } {
  const styleScore = getStyleCompatibility(profileA.style, profileB.style);
  const rhythmScore = getRhythmCompatibility(profileA.rhythm, profileB.rhythm);
  return {
    styleScore,
    rhythmScore,
    total: styleScore + rhythmScore,
  };
}
