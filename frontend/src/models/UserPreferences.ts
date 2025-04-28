/**
 * 用户偏好设置接口
 * 定义用户行程创建相关的偏好设置
 */
export interface UserPreferences {
  // 默认行程天数
  defaultDuration: number;
  // 默认预算（元）
  defaultBudget: number;
  // 常用目的地 (最多保存5个)
  frequentDestinations: string[];
  // 偏好的行程类型
  preferredTripType: 'leisure' | 'business' | 'family' | 'adventure' | 'custom';
  // 上次创建行程的时间
  lastCreatedAt?: string;
  // 是否启用自动保存
  enableAutoSave: boolean;
  // 是否使用引导式创建
  useGuidedCreation?: boolean;
  // 上次使用的目的地
  lastUsedDestination?: string;
  // 偏好目的地列表
  preferredDestinations: string[];
  // 上次使用的预算
  lastUsedBudget?: number;
}

/**
 * 默认用户偏好
 * 当用户没有设置偏好或首次使用时的默认值
 */
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  defaultDuration: 3,
  defaultBudget: 3000,
  frequentDestinations: [],
  preferredDestinations: [],
  preferredTripType: 'leisure',
  enableAutoSave: true,
  useGuidedCreation: false
}; 