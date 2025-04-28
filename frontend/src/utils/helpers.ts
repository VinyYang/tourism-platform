// 辅助函数文件

import imageService from '../services/imageService';

/**
 * 生成安全的占位图URL
 * 替换via.placeholder.com为placehold.co
 * @param url 原始URL
 * @returns 安全的URL
 * @deprecated 请使用 imageService.getSafeImageUrl 代替
 */
export const getPlaceholderUrl = (url: string): string => {
    console.warn('Deprecated: getPlaceholderUrl 已废弃，请使用 imageService.getSafeImageUrl 代替');
    return imageService.getSafeImageUrl(url);
};

/**
 * 根据文本生成占位图URL
 * @param text 显示文本
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
 * 安全格式化日期
 * @param dateString 日期字符串
 * @param format 格式化选项
 * @returns 格式化后的日期字符串
 */
export const formatDate = (dateString: string, format: 'short' | 'full' = 'short'): string => {
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        
        if (format === 'short') {
            return date.toLocaleDateString('zh-CN');
        } else {
            return date.toLocaleString('zh-CN');
        }
    } catch (error) {
        console.error('日期格式化错误:', error);
        return dateString;
    }
};

/**
 * 安全获取对象属性
 * @param obj 对象
 * @param path 属性路径
 * @param defaultValue 默认值
 */
export const safeGet = <T, D = undefined>(
    obj: any, 
    path: string, 
    defaultValue: D
): T | D => {
    try {
        const keys = path.split('.');
        let result = obj;
        
        for (const key of keys) {
            if (result === undefined || result === null) {
                return defaultValue;
            }
            result = result[key];
        }
        
        return (result === undefined || result === null) ? defaultValue : result;
    } catch (e) {
        return defaultValue;
    }
}; 