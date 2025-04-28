import { ItineraryState } from '../pages/ItineraryPlanner';

// 缓存键名
const ITINERARY_DRAFT_KEY = 'travel-app-itinerary-draft';
const DRAFT_EXPIRATION_KEY = 'travel-app-draft-expiration';

// 草稿过期时间（24小时，单位：毫秒）
const DRAFT_EXPIRATION_TIME = 24 * 60 * 60 * 1000;

/**
 * 缓存行程草稿
 * @param itineraryData 行程数据
 */
export const cacheItineraryDraft = (itineraryData: ItineraryState): void => {
  try {
    // 不缓存已有ID的行程，只缓存新建的草稿
    if (itineraryData.id) {
      return;
    }
    
    // 设置过期时间
    const expiration = Date.now() + DRAFT_EXPIRATION_TIME;
    
    // 存储行程数据和过期时间
    localStorage.setItem(ITINERARY_DRAFT_KEY, JSON.stringify(itineraryData));
    localStorage.setItem(DRAFT_EXPIRATION_KEY, expiration.toString());
    
    console.log('行程草稿已缓存，将在24小时后过期');
  } catch (error) {
    console.error('缓存行程草稿失败:', error);
  }
};

/**
 * 获取缓存的行程草稿
 * @returns 缓存的行程草稿数据，如果不存在或已过期则返回null
 */
export const retrieveItineraryDraft = (): ItineraryState | null => {
  try {
    // 检查是否存在草稿和过期时间
    const draftData = localStorage.getItem(ITINERARY_DRAFT_KEY);
    const expirationTime = localStorage.getItem(DRAFT_EXPIRATION_KEY);
    
    if (!draftData || !expirationTime) {
      return null;
    }
    
    // 检查草稿是否过期
    const expirationTimestamp = parseInt(expirationTime, 10);
    if (Date.now() > expirationTimestamp) {
      // 草稿已过期，清除缓存
      clearItineraryDraft();
      return null;
    }
    
    // 解析并返回草稿数据
    return JSON.parse(draftData) as ItineraryState;
  } catch (error) {
    console.error('获取缓存行程草稿失败:', error);
    return null;
  }
};

/**
 * 清除缓存的行程草稿
 */
export const clearItineraryDraft = (): void => {
  try {
    localStorage.removeItem(ITINERARY_DRAFT_KEY);
    localStorage.removeItem(DRAFT_EXPIRATION_KEY);
  } catch (error) {
    console.error('清除缓存行程草稿失败:', error);
  }
};

/**
 * 检查是否有可恢复的草稿
 * @returns 是否存在可恢复的草稿
 */
export const hasDraftToRecover = (): boolean => {
  return retrieveItineraryDraft() !== null;
};

/**
 * 更新缓存的草稿过期时间
 * 每次编辑时调用此函数，延长草稿的过期时间
 */
export const extendDraftExpiration = (): void => {
  try {
    // 检查是否存在草稿
    if (!localStorage.getItem(ITINERARY_DRAFT_KEY)) {
      return;
    }
    
    // 设置新的过期时间
    const expiration = Date.now() + DRAFT_EXPIRATION_TIME;
    localStorage.setItem(DRAFT_EXPIRATION_KEY, expiration.toString());
  } catch (error) {
    console.error('更新草稿过期时间失败:', error);
  }
};

/**
 * 自动定时清理过期草稿
 * 应用启动时调用此函数进行一次清理
 */
export const cleanupExpiredDrafts = (): void => {
  try {
    const expirationTime = localStorage.getItem(DRAFT_EXPIRATION_KEY);
    
    if (expirationTime && Date.now() > parseInt(expirationTime, 10)) {
      clearItineraryDraft();
      console.log('已清理过期的行程草稿');
    }
  } catch (error) {
    console.error('清理过期草稿失败:', error);
  }
}; 