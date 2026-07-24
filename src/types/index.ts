// ===== 基础类型 =====

/** 坐标系统类型 */
export type CoordinateSystem = "wgs84" | "gcj02";

/** 定位数据来源 */
export type LocationSource = "native" | "jacoo" | "simulated";

// ===== 协作画像类型（来自 PRD） =====

/** 8种协作风格 */
export type CollaborationStyle =
  | "navigator"    // 领航者
  | "builder"      // 建造者
  | "connector"    // 连接者
  | "insighter"    // 洞察者
  | "harmonizer"   // 调和者
  | "sprinter"     // 冲刺者
  | "guardian"     // 守护者
  | "explorer";    // 探路者

/** 4种社交节奏 */
export type SocialRhythm =
  | "icebreaker"    // 破冰者
  | "natural"       // 自然型
  | "signalwaiter"  // 信号等待者
  | "observer";     // 观察者

/** 协作画像，由协作风格和社交节奏组成 */
export interface CollaborationProfile {
  style: CollaborationStyle;
  rhythm: SocialRhythm;
}

// ===== 匹配分数 =====

/** 完整匹配分数，由协作画像适配分和标签匹配分组成 */
export interface MatchScore {
  /** 0-100 综合匹配分 */
  total: number;
  /** 0-50 协作画像适配分 */
  collaborationScore: number;
  /** 0-50 标签匹配分 */
  tagScore: number;
  /** 0-25 重合标签分 */
  tagOverlapScore: number;
  /** 0-25 互补标签分 */
  tagComplementScore: number;
  /** 0-35 协作风格兼容分 */
  styleCompatibility: number;
  /** 0-15 社交节奏兼容分 */
  rhythmCompatibility: number;
}

/** 匹配等级：>=70 high, 40-69 medium, <40 low */
export type MatchTier = "high" | "medium" | "low";

// ===== 玩家画像 =====

/** 玩家画像，包含基本信息、兴趣标签和协作画像 */
export interface PlayerProfile {
  id: string;
  displayName: string;
  /** 最多5个兴趣标签 */
  interests: string[];
  collaboration: CollaborationProfile;
  discoverable: boolean;
  /** 发现半径（米） */
  discoveryRadiusMeters: number;
}

// ===== 匹配结果（用于 UI 展示的扁平结构） =====

/** 附近匹配结果 */
export interface NearbyMatch {
  player: PlayerProfile;
  distanceMeters: number;
  score: MatchScore;
  tier: MatchTier;
  sharedInterests: string[];
  complementInterests: string[];
  reason: string;
}

/** 匹配结果（App.tsx 使用的 UI 友好结构，兼容子代理3的 MatchResult） */
export interface MatchResult {
  /** 对方玩家 */
  player: PlayerProfile;
  /** 匹配总分 0-100 */
  score: number;
  /** 匹配等级 */
  tier: MatchTier;
  /** 共同标签 */
  commonInterests: string[];
  /** 互补标签 */
  complementaryInterests: string[];
  /** 匹配理由 */
  reason: string;
  /** 协作画像描述 */
  collaborationPortrait: string;
}

// ===== 像素头像 =====

/** 脸型 */
export type FaceShape = "round" | "oval" | "square" | "long" | "heart";

/** 眼睛大小 */
export type EyeSize = "big" | "medium" | "small";

/** 发型 */
export type HairStyle = "short" | "long" | "curly" | "bald" | "ponytail";

/** 肤色 */
export type SkinTone = "fair" | "light" | "medium" | "tan" | "deep";

/** 像素渲染器支持的发色桶 */
export type HairColorName =
  | "black"
  | "brown"
  | "blonde"
  | "red"
  | "blue"
  | "pink"
  | "white";

/** 性别表达相关视觉特征 */
export interface GenderPresentationFeatures {
  hasBeard: boolean;
  hasMakeup: boolean;
  hasGlasses: boolean;
}

/** 特征提取失败或低置信度时展示给用户的提示 */
export interface FeatureDetectionWarning {
  field: keyof FaceFeatures | "image" | "landmarks";
  message: string;
}

/** 面部特征配置（含 avatar 模块扩展字段） */
export interface FaceFeatures {
  shape: FaceShape;
  eyeSize: EyeSize;
  skinTone: SkinTone;
  hairStyle: HairStyle;
  hasGlasses: boolean;
  hasBeard: boolean;
  /** 妆容/明显唇眼色彩提示 */
  hasMakeup?: boolean;
  /** 汇总后的性别表达视觉特征 */
  genderPresentation?: GenderPresentationFeatures;
  /** 眼间距归一化值 0-1（avatar 模块扩展） */
  eyeDistance?: number;
  /** 肤色 RGB 值（avatar 模块扩展） */
  skinRGB?: [number, number, number];
  /** 发色采样 RGB 值（avatar 模块扩展） */
  hairRGB?: [number, number, number];
  /** 发色名称（avatar 模块扩展） */
  hairColor?: HairColorName;
  /** 根据照片特征确定性派生出的衣服颜色 */
  shirtColor?: string;
  /** 是否使用过明确默认值 */
  usedFallback?: boolean;
  /** 展示给用户的默认值/低置信度说明 */
  warnings?: FeatureDetectionWarning[];
}

/** 像素小人完整配置（含 avatar 模块扩展字段） */
export interface PixelAvatarConfig {
  face: FaceFeatures;
  bodyColor: string;
  accessory: string;
  expression: "happy" | "neutral" | "excited" | "thinking";
  /** T恤颜色（avatar 模块扩展） */
  shirtColor?: string;
  /** 肤色快捷字段（avatar 模块扩展，与 face.skinTone 二选一） */
  skinTone?: SkinTone;
  /** 脸型快捷字段（avatar 模块扩展，与 face.shape 二选一） */
  faceShape?: FaceShape;
  /** 眼睛大小快捷字段（avatar 模块扩展，与 face.eyeSize 二选一） */
  eyeSize?: EyeSize;
  /** 发型快捷字段（avatar 模块扩展，与 face.hairStyle 二选一） */
  hairStyle?: HairStyle;
  /** 发色快捷字段（avatar 模块扩展） */
  hairColor?: HairColorName;
}

/** 岛上居民 */
export interface Resident {
  id: string;
  name: string;
  avatar: PixelAvatarConfig;
  position: { x: number; y: number };
  biography: string;
  discoveredAt: number;
  matchHistory: NearbyMatch[];
}

// ===== 硬件/BLE =====

/** BLE 近距离事件 */
export interface ProximityEvent {
  deviceId: string;
  rssi: number;
  distanceMeters: number;
  timestamp: number;
  data?: Uint8Array;
}

/** 地理坐标点 */
export interface GeoPoint {
  latitude: number;
  longitude: number;
  accuracy: number;
  system: CoordinateSystem;
  source: LocationSource;
  timestamp: number;
}

// ===== 测评 =====

/** 测评问题 */
export interface QuizQuestion {
  id: string;
  text: string;
  category: "style" | "rhythm";
  options: QuizAnswer[];
}

/** 测评答案选项 */
export interface QuizAnswer {
  id: string;
  text: string;
  styleWeight?: Partial<Record<CollaborationStyle, number>>;
  rhythmWeight?: Partial<Record<SocialRhythm, number>>;
}

// ===== 常量映射（来自子代理3） =====

/** 协作风格中文映射 */
export const COLLABORATION_STYLE_LABELS: Record<CollaborationStyle, string> = {
  builder: '建造者',
  navigator: '领航者',
  connector: '连接者',
  insighter: '洞察者',
  harmonizer: '调和者',
  sprinter: '冲刺者',
  explorer: '探索者',
  guardian: '守护者',
};

/** 社交节奏中文映射 */
export const SOCIAL_RHYTHM_LABELS: Record<SocialRhythm, string> = {
  icebreaker: '破冰者',
  natural: '自然型',
  observer: '观察者',
  signalwaiter: '信号等待者',
};

/** 匹配等级中文映射 */
export const MATCH_TIER_LABELS: Record<MatchTier, string> = {
  high: '高匹配',
  medium: '中匹配',
  low: '低匹配',
};

/** 匹配等级对应颜色 */
export const MATCH_TIER_COLORS: Record<MatchTier, string> = {
  high: '#EF5350',
  medium: '#FFD54F',
  low: '#A5D6A7',
};
