/**
 * 图片加载状态Hook
 * 用于管理图片加载状态和错误处理
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ImageType,
  ImageLoadingStatus,
  UseImageResult,
  UseImageOptions
} from '../types/image.types';
import imageService from '../services/imageService';
import { getDefaultText, getDefaultWidth, getDefaultHeight } from '../services/imageService';

/**
 * 使用带有错误处理的图片Hook
 * @param options 配置选项
 * @returns 图片状态和控制函数
 */
const useImageWithFallback = (options: UseImageOptions): UseImageResult => {
  const {
    src,
    fallbackSrc,
    placeholderType,
    fallbackText,
    maxRetries = 1
  } = options;

  // 图片元素引用
  const imgRef = useRef<HTMLImageElement>(null);
  
  // 状态管理
  const [status, setStatus] = useState<ImageLoadingStatus>(ImageLoadingStatus.IDLE);
  const [imageUrl, setImageUrl] = useState<string>(imageService.getSafeImageUrl(src, placeholderType));
  const [retryCount, setRetryCount] = useState<number>(0);
  
  // 重置状态
  const reset = useCallback(() => {
    setStatus(ImageLoadingStatus.IDLE);
    setImageUrl(imageService.getSafeImageUrl(src, placeholderType));
    setRetryCount(0);
  }, [src, placeholderType]);
  
  // 当源URL变更时重置状态
  useEffect(() => {
    reset();
  }, [src, reset]);
  
  // 处理加载开始
  useEffect(() => {
    if (status === ImageLoadingStatus.IDLE && imageUrl) {
      setStatus(ImageLoadingStatus.LOADING);
    }
  }, [imageUrl, status]);
  
  // 处理图片加载成功
  const handleLoad = useCallback(() => {
    setStatus(ImageLoadingStatus.LOADED);
  }, []);
  
  // 处理图片加载错误
  const handleError = useCallback(() => {
    // 如果有自定义的回退图片
    if (fallbackSrc) {
      setImageUrl(fallbackSrc);
      return;
    }
    
    // 如果有指定图片类型
    if (placeholderType) {
      // 先尝试使用本地占位图
      const localPlaceholder = imageService.getLocalPlaceholder(placeholderType);
      if (localPlaceholder) {
        setImageUrl(localPlaceholder);
        return;
      }
      
      // 否则生成对应类型的占位图
      const text = fallbackText || getDefaultText(placeholderType);
      const width = getDefaultWidth(placeholderType);
      const height = getDefaultHeight(placeholderType);
      setImageUrl(imageService.createPlaceholderUrl(text, width, height));
      return;
    }
    
    // 默认占位图
    setImageUrl(imageService.createPlaceholderUrl(fallbackText || '图片加载失败'));
    setStatus(ImageLoadingStatus.ERROR);
  }, [fallbackSrc, placeholderType, fallbackText]);
  
  // 重试加载图片
  const retry = useCallback(() => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      setStatus(ImageLoadingStatus.LOADING);
      setImageUrl(imageService.getSafeImageUrl(src, placeholderType));
    } else {
      handleError();
    }
  }, [retryCount, maxRetries, src, placeholderType, handleError]);
  
  // 设置图片元素的属性
  useEffect(() => {
    if (imgRef.current) {
      imgRef.current.onload = handleLoad;
      imgRef.current.onerror = retry;
    }
  }, [imgRef, handleLoad, retry]);
  
  return {
    status,
    imageUrl,
    handleError,
    handleLoad,
    retry,
    ref: imgRef as React.RefObject<HTMLImageElement>
  };
};

export default useImageWithFallback; 