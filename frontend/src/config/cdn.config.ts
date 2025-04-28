/**
 * CDN配置文件
 * 定义CDN地址和回退策略
 */

/**
 * 主CDN配置
 */
export const PRIMARY_CDN = {
  BASE_URL: '', // 默认为空，使用相对路径
  ENABLED: false, // 是否启用
  TIMEOUT: 3000, // 超时时间（毫秒）
  RETRY_COUNT: 2, // 重试次数
};

/**
 * 备用CDN配置
 */
export const BACKUP_CDN = {
  BASE_URL: 'https://cdn.example.com', // 备用CDN地址
  ENABLED: false, // 是否启用
  TIMEOUT: 5000, // 超时时间（毫秒）
};

/**
 * CDN资源类型
 */
export const RESOURCE_TYPES = {
  IMAGES: 'images',
  ICONS: 'icons',
  ASSETS: 'assets',
};

/**
 * CDN健康检查配置
 */
export const HEALTH_CHECK = {
  ENABLED: false, // 是否启用健康检查
  INTERVAL: 60000, // 检查间隔（毫秒）
  ENDPOINT: '/health.json', // 健康检查端点
};

/**
 * 获取CDN URL
 * @param path 资源路径
 * @param type 资源类型
 * @returns 完整的CDN URL
 */
export const getCdnUrl = (path: string, type: string = RESOURCE_TYPES.IMAGES): string => {
  // 如果路径已经是完整URL，直接返回
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // 如果主CDN启用，使用主CDN
  if (PRIMARY_CDN.ENABLED) {
    return `${PRIMARY_CDN.BASE_URL}/${type}/${path}`;
  }
  
  // 如果备用CDN启用，使用备用CDN
  if (BACKUP_CDN.ENABLED) {
    return `${BACKUP_CDN.BASE_URL}/${type}/${path}`;
  }
  
  // 默认使用相对路径
  return `/${type}/${path}`;
};

/**
 * 获取图片CDN URL
 * @param path 图片路径
 * @returns 完整的图片CDN URL
 */
export const getImageUrl = (path: string): string => {
  return getCdnUrl(path, RESOURCE_TYPES.IMAGES);
};

export default {
  PRIMARY_CDN,
  BACKUP_CDN,
  RESOURCE_TYPES,
  HEALTH_CHECK,
  getCdnUrl,
  getImageUrl,
}; 