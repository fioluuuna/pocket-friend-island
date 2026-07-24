import { describe, it, expect } from "vitest";
import { calculateMatchScore } from "../engine";
import type { PlayerProfile } from "../../types";

/** 创建测试用玩家画像 */
function makePlayer(
  overrides: Partial<PlayerProfile> & { id: string }
): PlayerProfile {
  return {
    displayName: "Test Player",
    interests: [],
    collaboration: { style: "guardian", rhythm: "natural" },
    discoverable: true,
    discoveryRadiusMeters: 100,
    ...overrides,
  };
}

describe("calculateMatchScore", () => {
  it("高匹配：互补协作风格 + 重合标签 + 互补标签 => total >= 70", () => {
    const playerA = makePlayer({
      id: "a",
      displayName: "领航者Alice",
      collaboration: { style: "navigator", rhythm: "icebreaker" },
      interests: ["硬件", "AI", "产品设计", "黑客松"],
    });
    const playerB = makePlayer({
      id: "b",
      displayName: "建造者Bob",
      collaboration: { style: "builder", rhythm: "natural" },
      interests: ["硬件", "AI", "前端", "创业"],
    });

    const result = calculateMatchScore(playerA, playerB, 5);

    // navigator x builder = 35 (style), icebreaker x natural = 13 (rhythm) => collab = 48
    // shared: 硬件, AI => 10 overlap
    // complement: 硬件 -> AI (in playerB) => 1 pair, AI -> 硬件 (in playerB) => 1 pair
    // 产品设计 -> 技术 (no in B), AI -> 硬件 (already)
    // complement pairs count >= 2 => 10 complement score
    expect(result.score.collaborationScore).toBe(48); // 35 + 13
    expect(result.tier).toBe("high");
    expect(result.score.total).toBeGreaterThanOrEqual(70);
  });

  it("纯协作匹配：无共同标签但协作风格互补 => collaborationScore 高", () => {
    const playerA = makePlayer({
      id: "a",
      collaboration: { style: "insighter", rhythm: "icebreaker" },
      interests: ["音乐"],
    });
    const playerB = makePlayer({
      id: "b",
      collaboration: { style: "connector", rhythm: "natural" },
      interests: ["摄影"],
    });

    const result = calculateMatchScore(playerA, playerB, 10);

    // insighter x connector = 33 (style), icebreaker x natural = 13 (rhythm) => collab = 46
    // No shared tags, no complement pairs (音乐 complements 编程, 摄影 complements 视频)
    expect(result.score.collaborationScore).toBe(46);
    expect(result.score.tagOverlapScore).toBe(0);
    expect(result.score.collaborationScore).toBeGreaterThan(result.score.tagScore);
  });

  it("纯标签匹配：无协作画像互补但标签重合+互补 => tagScore 高", () => {
    const playerA = makePlayer({
      id: "a",
      collaboration: { style: "guardian", rhythm: "signalwaiter" },
      interests: ["前端", "设计", "AI", "摄影", "文案"],
    });
    const playerB = makePlayer({
      id: "b",
      collaboration: { style: "sprinter", rhythm: "observer" },
      interests: ["前端", "后端", "设计", "开发", "视频"],
    });

    const result = calculateMatchScore(playerA, playerB, 3);

    // guardian x sprinter = 8 (style), signalwaiter x observer = 10 (rhythm) => collab = 18
    // shared: 前端, 设计 => 2 * 5 = 10 overlap
    // complement: 前端<->后端, 设计<->开发, 摄影<->视频, AI<->开发 => 4 pairs * 5 = 20 (or similar, capped at 25)
    // tagScore = 10 + min(20, 25) = 30 (or depends on complement rules)
    expect(result.score.styleCompatibility).toBe(8);
    expect(result.score.tagScore).toBe(30);
    expect(result.score.tagScore).toBeGreaterThan(result.score.collaborationScore);
  });

  it("低匹配：无重合无互补，协作风格不兼容 => total < 40", () => {
    const playerA = makePlayer({
      id: "a",
      collaboration: { style: "guardian", rhythm: "signalwaiter" },
      interests: ["音乐"],
    });
    const playerB = makePlayer({
      id: "b",
      collaboration: { style: "sprinter", rhythm: "observer" },
      interests: ["园艺"],
    });

    const result = calculateMatchScore(playerA, playerB, 15);

    // guardian x sprinter = 8, signalwaiter x observer = 10 => collab = 18
    // No shared, no complement => tagScore = 0
    expect(result.score.total).toBe(18);
    expect(result.score.total).toBeLessThan(40);
    expect(result.tier).toBe("low");
    expect(result.reason).toBe("附近发现了新伙伴");
  });

  it("空标签 => tagScore = 0", () => {
    const playerA = makePlayer({
      id: "a",
      collaboration: { style: "navigator", rhythm: "natural" },
      interests: [],
    });
    const playerB = makePlayer({
      id: "b",
      collaboration: { style: "builder", rhythm: "natural" },
      interests: [],
    });

    const result = calculateMatchScore(playerA, playerB, 8);

    expect(result.score.tagScore).toBe(0);
    expect(result.score.tagOverlapScore).toBe(0);
    expect(result.score.tagComplementScore).toBe(0);
    expect(result.sharedInterests).toHaveLength(0);
    expect(result.complementInterests).toHaveLength(0);
  });

  it("默认协作画像 (guardian + natural) 边界测试", () => {
    const playerA = makePlayer({
      id: "a",
      displayName: "Guardian-A",
      collaboration: { style: "guardian", rhythm: "natural" },
      interests: ["硬件"],
    });
    const playerB = makePlayer({
      id: "b",
      displayName: "Guardian-B",
      collaboration: { style: "guardian", rhythm: "natural" },
      interests: ["硬件"],
    });

    const result = calculateMatchScore(playerA, playerB, 1);

    // guardian x guardian = 15 (style), natural x natural = 14 (rhythm) => collab = 29
    expect(result.score.styleCompatibility).toBe(15);
    expect(result.score.rhythmCompatibility).toBe(14);
    expect(result.score.collaborationScore).toBe(29);
    // shared: 硬件 => 5
    expect(result.score.tagOverlapScore).toBe(5);
    // 硬件 complements 软件/AI/嵌入式 (playerB doesn't have) => 0
    expect(result.score.tagComplementScore).toBe(0);
    expect(result.score.total).toBe(34);
    expect(result.tier).toBe("low");
  });
});
