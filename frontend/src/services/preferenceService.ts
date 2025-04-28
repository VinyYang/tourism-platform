import { UserPreferences, DEFAULT_USER_PREFERENCES } from '../models/UserPreferences';

// 本地存储键名
const USER_PREFERENCES_KEY = 'travel-app-user-preferences';

/**
 * 获取用户偏好设置
 * 首次使用时返回默认设置
 */
export const getUserPreferences = (): UserPreferences => {
  try {
    const storedPreferences = localStorage.getItem(USER_PREFERENCES_KEY);
    if (storedPreferences) {
      return JSON.parse(storedPreferences) as UserPreferences;
    }
  } catch (error) {
    console.error('读取用户偏好设置失败:', error);
  }
  return { ...DEFAULT_USER_PREFERENCES };
};

/**
 * 保存用户偏好设置
 * @param preferences 要保存的偏好设置
 */
export const saveUserPreferences = (preferences: UserPreferences): void => {
  try {
    localStorage.setItem(USER_PREFERENCES_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('保存用户偏好设置失败:', error);
  }
};

/**
 * 更新部分用户偏好设置
 * @param partialPreferences 部分偏好设置
 */
export const updateUserPreferences = (partialPreferences: Partial<UserPreferences>): UserPreferences => {
  const currentPreferences = getUserPreferences();
  const updatedPreferences = {
    ...currentPreferences,
    ...partialPreferences
  };
  saveUserPreferences(updatedPreferences);
  return updatedPreferences;
};

/**
 * 记录用户目的地选择
 * 最多保存5个常用目的地
 * @param destination 目的地名称
 */
export const recordDestination = (destination: string): void => {
  if (!destination.trim()) return;
  
  const currentPreferences = getUserPreferences();
  const currentDestinations = currentPreferences.frequentDestinations || [];
  
  // 如果已存在，先移除再添加到最前面
  const newDestinations = currentDestinations.filter(d => d !== destination);
  newDestinations.unshift(destination);
  
  // 保留最多5个
  const limitedDestinations = newDestinations.slice(0, 5);
  
  updateUserPreferences({
    frequentDestinations: limitedDestinations
  });
};

/**
 * 记录行程创建相关数据
 * 保存用户选择的天数、预算和目的地
 * @param duration 行程天数
 * @param budget 行程预算
 * @param destination 目的地
 */
export const recordItineraryCreation = (
  duration: number, 
  budget: number, 
  destination?: string
): void => {
  const updates: Partial<UserPreferences> = {
    defaultDuration: duration,
    defaultBudget: budget,
    lastCreatedAt: new Date().toISOString()
  };
  
  if (destination) {
    recordDestination(destination);
  }
  
  updateUserPreferences(updates);
};

/**
 * 从现有行程更新用户偏好设置
 * @param itinerary 行程对象
 */
export const updatePreferencesFromItinerary = (itinerary: any): void => {
  if (!itinerary) return;
  
  // 计算行程天数
  let duration = 0;
  if (itinerary.startDate && itinerary.endDate) {
    const start = new Date(itinerary.startDate);
    const end = new Date(itinerary.endDate);
    duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  } else if (itinerary.days && Array.isArray(itinerary.days)) {
    duration = itinerary.days.length;
  }
  
  // 获取行程预算
  const budget = itinerary.budget || 0;
  
  // 获取目的地
  const destination = itinerary.destination || '';
  
  // 记录行程创建数据
  if (duration > 0) {
    recordItineraryCreation(duration, budget, destination);
  }
}; 