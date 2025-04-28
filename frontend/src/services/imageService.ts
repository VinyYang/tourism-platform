/**
 * 统一图片服务
 * 整合并增强原有的图片处理工具函数
 */

import {
  ImageType,
  ImageService as IImageService,
  ImageOptimizationOptions
} from '../types/image.types';

import {
  PLACEHOLDER_CONFIG,
  LOCAL_PLACEHOLDERS,
  CDN_CONFIG,
  IMAGE_OPTIMIZATION,
  DEFAULT_HOTEL_IMAGES,
  DEFAULT_SCENIC_IMAGE,
  DEFAULT_STRATEGY_COVER
} from './imageServiceConfig';

/**
 * 获取安全的图片URL
 * 将旧占位图服务URL替换为新服务URL
 * @param url 原始URL
 * @param type 图片类型
 * @returns 处理后的URL
 */
export const getSafeImageUrl = (url?: string, type?: ImageType): string => {
  // 如果URL为空，根据不同类型返回特定的默认图片
  if (!url) {
    // 为不同类型返回特定默认图片
    if (type === ImageType.STRATEGY || type === ImageType.STRATEGY_COVER) {
      return DEFAULT_STRATEGY_COVER;
    } else if (type === ImageType.SCENIC) {
      return DEFAULT_SCENIC_IMAGE;
    } else if (type === ImageType.HOTEL || type === ImageType.ROOM) {
      // 从酒店图片数组中随机选择一张
      const randomIndex = Math.floor(Math.random() * DEFAULT_HOTEL_IMAGES.length);
      return DEFAULT_HOTEL_IMAGES[randomIndex];
    }
    
    // 其他类型或未指定类型使用传统的占位图方式
    return createPlaceholderUrl(
      getDefaultText(type),
      getDefaultWidth(type),
      getDefaultHeight(type)
    );
  }
  
  // 替换旧占位图服务为新服务
  if (url.includes(PLACEHOLDER_CONFIG.LEGACY_BASE_URL)) {
    return url.replace(
      PLACEHOLDER_CONFIG.LEGACY_BASE_URL,
      PLACEHOLDER_CONFIG.BASE_URL
    );
  }
  
  // 如果配置了优先使用本地占位图，且URL是占位图URL，则尝试使用本地占位图
  if (LOCAL_PLACEHOLDERS.PREFER_LOCAL && isPlaceholderUrl(url) && type) {
    const localPath = getLocalPlaceholder(type);
    if (localPath) return localPath;
  }
  
  return url;
};

/**
 * 判断URL是否是占位图URL
 * @param url 要检查的URL
 * @returns 是否是占位图URL
 */
export const isPlaceholderUrl = (url: string): boolean => {
  return (
    url.includes(PLACEHOLDER_CONFIG.BASE_URL) ||
    url.includes(PLACEHOLDER_CONFIG.LEGACY_BASE_URL)
  );
};

/**
 * 根据图片类型获取默认文本
 * @param type 图片类型
 * @returns 默认文本
 */
export const getDefaultText = (type?: ImageType): string => {
  if (!type) return PLACEHOLDER_CONFIG.DEFAULT_TEXT;
  
  const typeKey = type.toString();
  // 类型安全的访问TEXTS
  const texts = PLACEHOLDER_CONFIG.TEXTS as Record<string, string | undefined>;
  return texts[typeKey] || PLACEHOLDER_CONFIG.DEFAULT_TEXT;
};

/**
 * 根据图片类型获取默认宽度
 * @param type 图片类型
 * @returns 默认宽度
 */
export const getDefaultWidth = (type?: ImageType): number => {
  if (!type) return PLACEHOLDER_CONFIG.DEFAULT_WIDTH;
  
  const typeKey = type.toString();
  // 类型安全的访问SIZES
  const sizes = PLACEHOLDER_CONFIG.SIZES as Record<string, { width: number, height: number } | undefined>;
  const size = sizes[typeKey];
  return size?.width || PLACEHOLDER_CONFIG.DEFAULT_WIDTH;
};

/**
 * 根据图片类型获取默认高度
 * @param type 图片类型
 * @returns 默认高度
 */
export const getDefaultHeight = (type?: ImageType): number => {
  if (!type) return PLACEHOLDER_CONFIG.DEFAULT_HEIGHT;
  
  const typeKey = type.toString();
  // 类型安全的访问SIZES
  const sizes = PLACEHOLDER_CONFIG.SIZES as Record<string, { width: number, height: number } | undefined>;
  const size = sizes[typeKey];
  return size?.height || PLACEHOLDER_CONFIG.DEFAULT_HEIGHT;
};

/**
 * 获取本地占位图路径
 * @param type 图片类型
 * @returns 本地占位图路径
 */
export const getLocalPlaceholder = (type: ImageType): string => {
  const typeKey = type.toString();
  
  // 将枚举映射到配置的文件名
  let fileKey: string;
  switch (type) {
    case ImageType.AVATAR:
      fileKey = 'user';
      break;
    case ImageType.STRATEGY:
    case ImageType.STRATEGY_COVER:
      fileKey = 'strategy';
      break;
    case ImageType.SCENIC:
      fileKey = 'scenic';
      break;
    case ImageType.HOTEL:
    case ImageType.ROOM:
      fileKey = 'hotel';
      break;
    case ImageType.PAYMENT:
      fileKey = 'payment';
      break;
    case ImageType.LOGO:
      // 检查是否有特定的logo类型
      return ''; // 使用在线占位图
    default:
      return ''; // 使用在线占位图
  }
  
  // 类型安全的访问FILES
  const files = LOCAL_PLACEHOLDERS.FILES as Record<string, string | undefined>;
  const fileName = files[fileKey];
  if (!fileName) return '';
  
  return `${LOCAL_PLACEHOLDERS.BASE_PATH}/${fileName}`;
};

/**
 * 根据文本生成占位图URL
 * @param text 显示的文本
 * @param width 宽度
 * @param height 高度
 * @returns 占位图URL
 */
export const createPlaceholderUrl = (
  text: string = PLACEHOLDER_CONFIG.DEFAULT_TEXT,
  width: number = PLACEHOLDER_CONFIG.DEFAULT_WIDTH,
  height: number = PLACEHOLDER_CONFIG.DEFAULT_HEIGHT
): string => {
  const encodedText = encodeURIComponent(text);
  return `${PLACEHOLDER_CONFIG.BASE_URL}/${width}x${height}?text=${encodedText}`;
};

/**
 * 获取经过优化的图片URL
 * @param url 原始URL
 * @param options 优化选项
 * @returns 优化后的URL
 */
export const getOptimizedUrl = (url: string, options: ImageOptimizationOptions = {}): string => {
  // 如果是占位图或本地图片，不进行优化
  if (isPlaceholderUrl(url) || url.startsWith('/')) {
    return url;
  }
  
  // 如果CDN未启用，返回原URL
  if (!CDN_CONFIG.ENABLED) {
    return url;
  }
  
  // TODO: 实现图片优化逻辑，例如添加CDN参数等
  
  return url;
};

/**
 * 预加载图片
 * @param url 图片URL
 * @returns 加载完成的Promise
 */
export const preloadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};

/**
 * 处理图片加载错误
 * @param e 错误事件
 * @param text 默认文本
 * @param width 宽度
 * @param height 高度
 */
export const handleImageError = (
  e: React.SyntheticEvent<HTMLImageElement>,
  text: string = PLACEHOLDER_CONFIG.DEFAULT_TEXT,
  width: number = PLACEHOLDER_CONFIG.DEFAULT_WIDTH,
  height: number = PLACEHOLDER_CONFIG.DEFAULT_HEIGHT
): void => {
  const target = e.target as HTMLImageElement;
  target.src = createPlaceholderUrl(text, width, height);
};

/**
 * 处理图片错误（基于图片类型）
 * @param e 错误事件
 * @param type 图片类型
 */
export const handleImageErrorByType = (
  e: React.SyntheticEvent<HTMLImageElement>,
  type: ImageType
): void => {
  const target = e.target as HTMLImageElement;
  
  // 根据不同类型设置特定的默认图片
  if (type === ImageType.STRATEGY || type === ImageType.STRATEGY_COVER) {
    target.src = DEFAULT_STRATEGY_COVER;
    return;
  } else if (type === ImageType.SCENIC) {
    target.src = DEFAULT_SCENIC_IMAGE;
    return;
  } else if (type === ImageType.HOTEL || type === ImageType.ROOM) {
    // 从酒店图片数组中随机选择一张
    const randomIndex = Math.floor(Math.random() * DEFAULT_HOTEL_IMAGES.length);
    target.src = DEFAULT_HOTEL_IMAGES[randomIndex];
    return;
  }
  
  // 尝试使用本地占位图
  if (LOCAL_PLACEHOLDERS.PREFER_LOCAL) {
    const localPath = getLocalPlaceholder(type);
    if (localPath) {
      target.src = localPath;
      return;
    }
  }
  
  // 使用在线占位图作为最后的后备选项
  target.src = createPlaceholderUrl(
    getDefaultText(type),
    getDefaultWidth(type),
    getDefaultHeight(type)
  );
};

/**
 * 获取随机酒店图片URL
 * @returns 随机酒店图片URL
 */
export const getRandomHotelImage = (): string => {
  const randomIndex = Math.floor(Math.random() * DEFAULT_HOTEL_IMAGES.length);
  return DEFAULT_HOTEL_IMAGES[randomIndex];
};

// 导出图片服务实例
const imageService: IImageService = {
  getSafeImageUrl,
  createPlaceholderUrl,
  getOptimizedUrl,
  preloadImage,
  getLocalPlaceholder,
  getDefaultText,
  getDefaultWidth,
  getDefaultHeight,
  handleImageError,
  handleImageErrorByType,
  getRandomHotelImage
};

export default imageService; 