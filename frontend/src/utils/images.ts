/**
 * 图片处理工具函数
 * @deprecated 此模块已废弃，请使用 services/imageService 代替
 */

import imageService from '../services/imageService';
import { ImageType } from '../types/image.types';

/**
 * 获取安全的图片URL，替换掉不可用的占位图服务
 * @param url 原始URL
 * @param defaultText 默认文本
 * @returns 处理后的URL
 * @deprecated 请使用 imageService.getSafeImageUrl 代替
 */
export const getSafeImageUrl = (url: string | undefined, defaultText: string = '无图片'): string => {
    console.warn('Deprecated: getSafeImageUrl 已废弃，请使用 imageService.getSafeImageUrl 代替');
    
    if (!url) {
        return imageService.createPlaceholderUrl(defaultText);
    }
    
    return imageService.getSafeImageUrl(url);
};

/**
 * 根据文本生成占位图URL
 * @param text 显示的文本
 * @param width 宽度
 * @param height 高度
 * @returns 占位图URL
 * @deprecated 请使用 imageService.createPlaceholderUrl 代替
 */
export const createPlaceholderUrl = (text: string, width: number = 300, height: number = 200): string => {
    console.warn('Deprecated: createPlaceholderUrl 已废弃，请使用 imageService.createPlaceholderUrl 代替');
    return imageService.createPlaceholderUrl(text, width, height);
};

/**
 * 处理图片加载错误，提供默认占位图
 * @param e 错误事件
 * @param text 默认文本
 * @param width 宽度
 * @param height 高度
 * @deprecated 请使用 imageService.handleImageError 代替
 */
export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>, text: string = '图片加载失败', width: number = 300, height: number = 200): void => {
    console.warn('Deprecated: handleImageError 已废弃，请使用 imageService.handleImageError 代替');
    
    // 直接实现功能，不依赖imageService.handleImageError
    const target = e.target as HTMLImageElement;
    target.src = imageService.createPlaceholderUrl(text, width, height);
};

export default {
    getSafeImageUrl,
    createPlaceholderUrl,
    handleImageError
}; 