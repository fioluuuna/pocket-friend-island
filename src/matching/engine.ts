import type {
  PlayerProfile,
  MatchScore,
  MatchTier,
} from "../types";
import { getCollaborationScore, STYLE_LABELS } from "./collaboration-matrix";
import { getSharedTags } from "./overlap";
import { getComplementPairs } from "./complement";

/**
 * 计算匹配等级
 * @param score - 综合匹配分 (0-100)
 * @returns 匹配等级: high(>=70), medium(40-69), low(<40)
 */
export function getMatchTier(score: number): MatchTier {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

/** 匹配引擎结果 */
export interface MatchResult {
  score: MatchScore;
  sharedInterests: string[];
  complementInterests: string[];
  reason: string;
  tier: MatchTier;
}

/**
 * 计算两个玩家之间的综合匹配分
 *
 * 计算公式:
 * - 协作画像适配分 = getCollaborationScore().total (0-50)
 * - 重合标签分 = sharedTags.length * 5, 上限 25
 * - 互补标签分 = complementPairs.length * 5, 上限 25
 * - 标签匹配分 = 重合标签分 + 互补标签分 (0-50)
 * - 综合匹配分 = 协作画像适配分 + 标签匹配分 (0-100)
 *
 * @param profileA - 玩家画像 A
 * @param profileB - 玩家画像 B
 * @param _distanceMeters - 两人之间的距离（米）
 * @returns 完整匹配结果
 */
export function calculateMatchScore(
  profileA: PlayerProfile,
  profileB: PlayerProfile,
  _distanceMeters: number
): MatchResult {
  // 1. 协作画像适配分 (0-50)
  const collabResult = getCollaborationScore(
    profileA.collaboration,
    profileB.collaboration
  );
  const collaborationScore = collabResult.total;

  // 2. 标签匹配
  const sharedInterests = getSharedTags(profileA.interests, profileB.interests);
  const complementPairs = getComplementPairs(profileA.interests, profileB.interests);

  // 重合标签分: 每个 +5, 上限 25
  const tagOverlapScore = Math.min(sharedInterests.length * 5, 25);
  // 互补标签分: 每对 +5, 上限 25
  const tagComplementScore = Math.min(complementPairs.length * 5, 25);
  const tagScore = tagOverlapScore + tagComplementScore;

  // 3. 综合匹配分 (0-100)
  const total = collaborationScore + tagScore;

  // 4. 匹配等级
  const tier = getMatchTier(total);

  // 5. 构建完整分数对象
  const score: MatchScore = {
    total,
    collaborationScore,
    tagScore,
    tagOverlapScore,
    tagComplementScore,
    styleCompatibility: collabResult.styleScore,
    rhythmCompatibility: collabResult.rhythmScore,
  };

  // 6. 互补标签展示列表（扁平化）
  const complementInterests = complementPairs.flat();

  // 7. 生成匹配理由
  const reason = generateMatchReason({
    score,
    tier,
    sharedInterests,
    complementPairs,
    styleA: profileA.collaboration.style,
    styleB: profileB.collaboration.style,
  });

  return {
    score,
    sharedInterests,
    complementInterests,
    reason,
    tier,
  };
}

/** 用于生成理由的内部参数 */
interface ReasonParams {
  score: MatchScore;
  tier: MatchTier;
  sharedInterests: string[];
  complementPairs: string[][];
  styleA: string;
  styleB: string;
}

/**
 * 生成人类可读的匹配理由
 * @param params - 匹配参数
 * @returns 匹配理由文案
 */
export function generateMatchReason(params: ReasonParams): string {
  const { score, tier, sharedInterests, complementPairs, styleA, styleB } = params;

  if (tier === "high") {
    const labelA = STYLE_LABELS[styleA as keyof typeof STYLE_LABELS];
    const labelB = STYLE_LABELS[styleB as keyof typeof STYLE_LABELS];
    const stylePart =
      labelA && labelB
        ? `${labelA} x ${labelB} 互补协作`
        : "";

    const sharedPart =
      sharedInterests.length > 0
        ? `共同标签 ${sharedInterests.map((t) => `#${t}`).join(" ")}`
        : "";

    const compPart =
      complementPairs.length > 0
        ? `互补标签 ${complementPairs.map(([a, b]) => `#${a} ↔ #${b}`).join(" ")}`
        : "";

    const details = [stylePart, sharedPart, compPart].filter(Boolean).join("，");
    return details
      ? `你们是绝佳搭档！${details}，综合匹配分 ${score.total}`
      : `你们是绝佳搭档！综合匹配分 ${score.total}`;
  }

  if (tier === "medium") {
    if (sharedInterests.length > 0) {
      return `你们有 ${sharedInterests.length} 个共同标签：${sharedInterests.map((t) => `#${t}`).join(" ")}`;
    }
    if (complementPairs.length > 0) {
      return `你们有互补技能：${complementPairs.map(([a, b]) => `#${a} ↔ #${b}`).join(" ")}`;
    }
    return `你们的协作风格有一定兼容性，综合匹配分 ${score.total}`;
  }

  // tier === "low"
  return "附近发现了新伙伴";
}
