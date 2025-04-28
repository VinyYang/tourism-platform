/**
 * 图片处理相关类型定义
 */

import React from 'react';

/**
 * 图片类型枚举
 */
export enum ImageType {
  AVATAR = 'avatar',
  THUMBNAIL = 'thumbnail',
  COVER = 'cover',
  STRATEGY = 'strategy',
  STRATEGY_COVER = 'strategyCover',
  SCENIC = 'scenic',
  HOTEL = 'hotel',
  ROOM = 'room',
  PAYMENT = 'payment',
  LOGO = 'logo'
}

/**
 * 图片加载状态枚举
 */
export enum ImageLoadingStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  LOADED = 'loaded',
  ERROR = 'error'
}

/**
 * 图片尺寸接口
 */
export interface ImageSize {
  width: number;
  height: number;
}

/**
 * 图片服务配置接口
 */
export interface ImageServiceConfig {
  placeholderBaseUrl: string;
  defaultWidth: number;
  defaultHeight: number;
  preferLocalPlaceholders: boolean;
  useCDN: boolean;
  useWebP: boolean;
  lazyLoading: boolean;
}

/**
 * 安全图片组件属性接口
 */
export interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string | undefined;
  alt?: string;
  fallbackSrc?: string;
  placeholderType?: ImageType;
  showSkeleton?: boolean;
  skeletonHeight?: number | string;
  skeletonWidth?: number | string;
  fallbackText?: string;
  lazy?: boolean;
  threshold?: number;
  blur?: boolean;
  blurAmount?: number;
  onLoadingChange?: (status: ImageLoadingStatus) => void;
}

/**
 * 图片骨架屏组件属性接口
 */
export interface ImageSkeletonProps {
  width?: number | string;
  height?: number | string;
  type?: ImageType;
  shape?: 'square' | 'rounded' | 'circle';
  animation?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 图片Hook返回值接口
 */
export interface UseImageResult {
  status: ImageLoadingStatus;
  imageUrl: string;
  handleError: () => void;
  handleLoad: () => void;
  retry: () => void;
  ref: React.RefObject<HTMLImageElement>;
}

/**
 * 图片Hook配置接口
 */
export interface UseImageOptions {
  src: string;
  fallbackSrc?: string;
  placeholderType?: ImageType;
  fallbackText?: string;
  maxRetries?: number;
}

/**
 * 图片服务接口
 */
export interface ImageService {
  getSafeImageUrl(url?: string, type?: ImageType): string;
  createPlaceholderUrl(text: string, width?: number, height?: number): string;
  getOptimizedUrl(url: string, options?: ImageOptimizationOptions): string;
  preloadImage(url: string): Promise<HTMLImageElement>;
  getLocalPlaceholder(type: ImageType): string;
  getDefaultText(type?: ImageType): string;
  getDefaultWidth(type?: ImageType): number;
  getDefaultHeight(type?: ImageType): number;
  handleImageError(e: React.SyntheticEvent<HTMLImageElement>, text?: string, width?: number, height?: number): void;
  handleImageErrorByType(e: React.SyntheticEvent<HTMLImageElement>, type: ImageType): void;
  getRandomHotelImage(): string;
}

/**
 * 图片优化选项接口
 */
export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'auto';
  fit?: 'cover' | 'contain' | 'fill';
} 