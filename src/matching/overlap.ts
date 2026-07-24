/**
 * 计算两组标签的重合度
 * 公式: |A ∩ B| / min(|A|, |B|)
 * @param tagsA - 标签集合 A
 * @param tagsB - 标签集合 B
 * @returns 重合度 0-1
 */
export function calculateOverlapScore(tagsA: string[], tagsB: string[]): number {
  const normalizedA = tagsA.map((t) => t.toLowerCase());
  const normalizedB = tagsB.map((t) => t.toLowerCase());
  const setA = new Set(normalizedA);
  const setB = new Set(normalizedB);
  const intersection = normalizedA.filter((t) => setB.has(t));
  const minSize = Math.min(setA.size, setB.size);
  if (minSize === 0) {
    return 0;
  }
  return intersection.length / minSize;
}

/**
 * 获取两组标签的交集（重合标签）
 * @param tagsA - 标签集合 A
 * @param tagsB - 标签集合 B
 * @returns 重合标签数组
 */
export function getSharedTags(tagsA: string[], tagsB: string[]): string[] {
  const normalizedB = new Set(tagsB.map((t) => t.toLowerCase()));
  return tagsA.filter((t) => normalizedB.has(t.toLowerCase()));
}
