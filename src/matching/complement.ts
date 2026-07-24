/**
 * 互补标签规则表
 * 每条规则定义一组互相互补的标签对
 * key 是标签名（小写），value 是与其互补的标签数组
 *
 * 覆盖三大类别：
 * - 技术类: 前端/后端, 硬件/软件, AI/硬件, 嵌入式/云服务 等
 * - 创作类: 设计/开发, 音乐/编程, 摄影/视频, 文案/设计 等
 * - 需求类: 产品/技术, 运营/产品, 数据/产品 等
 */
export const COMPLEMENTARY_PAIRS: Record<string, string[]> = {
  // ===== 技术类互补 =====
  "前端": ["后端"],
  "后端": ["前端"],
  "硬件": ["软件", "ai", "嵌入式开发"],
  "软件": ["硬件"],
  "ai": ["硬件", "产品设计"],
  "嵌入式开发": ["云服务", "硬件"],
  "云服务": ["嵌入式开发"],
  "全栈": [],

  // ===== 创作类互补 =====
  "设计": ["开发", "文案"],
  "开发": ["设计"],
  "音乐": ["编程"],
  "编程": ["音乐", "设计"],
  "摄影": ["视频"],
  "视频": ["摄影"],
  "文案": ["设计", "数据"],

  // ===== 需求类互补 =====
  "产品设计": ["技术", "ai", "运营"],
  "运营": ["产品设计", "数据分析"],
  "数据分析": ["运营", "文案", "产品设计"],
  "产品经理": ["技术开发"],
  "技术开发": ["产品经理"],
  "黑客松": ["嵌入式开发", "ai"],
  "创业": ["产品设计", "技术开发"],
};

/**
 * 计算两组标签的互补度
 * 统计 A 和 B 之间存在多少互补对，除以 min(|A|, |B|)
 * @param tagsA - 标签集合 A
 * @param tagsB - 标签集合 B
 * @returns 互补度 0-1
 */
export function calculateComplementScore(
  tagsA: string[],
  tagsB: string[]
): number {
  const pairs = getComplementPairs(tagsA, tagsB);
  const minTags = Math.min(tagsA.length, tagsB.length);
  if (minTags === 0) {
    return 0;
  }
  return pairs.length / minTags;
}

/**
 * 获取两组标签之间的互补标签对
 * @param tagsA - 标签集合 A
 * @param tagsB - 标签集合 B
 * @returns 互补标签对数组，每对为 [标签A, 标签B]
 */
export function getComplementPairs(
  tagsA: string[],
  tagsB: string[]
): string[][] {
  const normalizedB = new Set(tagsB.map((t) => t.toLowerCase()));
  const pairs: string[][] = [];

  for (const tagA of tagsA) {
    const lowerA = tagA.toLowerCase();
    const complements = COMPLEMENTARY_PAIRS[lowerA];
    if (!complements) {
      continue;
    }
    for (const comp of complements) {
      if (normalizedB.has(comp.toLowerCase())) {
        const matchedTag = tagsB.find(
          (t) => t.toLowerCase() === comp.toLowerCase()
        );
        pairs.push([tagA, matchedTag ?? comp]);
      }
    }
  }

  return pairs;
}
