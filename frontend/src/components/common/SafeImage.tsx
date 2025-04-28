/**
 * 安全图片组件
 * 封装图片加载错误处理和状态管理
 */

import React, { useState, useEffect, useCallback } from 'react';
import { SafeImageProps, ImageLoadingStatus } from '../../types/image.types';
import useImageWithFallback from '../../hooks/useImageWithFallback';
import ImageSkeleton from './ImageSkeleton';
import imageService from '../../services/imageService';
import './SafeImage.css';

/**
 * 安全图片组件
 * @param props 组件属性
 * @returns 组件
 */
const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  fallbackSrc,
  placeholderType,
  showSkeleton = true,
  skeletonHeight,
  skeletonWidth,
  fallbackText,
  lazy = true,
  threshold = 0.1,
  blur = false,
  blurAmount = 5,
  onLoadingChange,
  className = '',
  style = {},
  ...restProps
}) => {
  // 使用图片加载Hook
  const {
    status,
    imageUrl,
    handleError,
    handleLoad,
    retry,
    ref
  } = useImageWithFallback({
    src: src || '',
    fallbackSrc,
    placeholderType,
    fallbackText
  });
  
  // 状态管理
  const [isVisible, setIsVisible] = useState<boolean>(!lazy);
  
  // 处理图片加载状态变化
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(status);
    }
  }, [status, onLoadingChange]);
  
  // 延迟加载处理
  useEffect(() => {
    if (!lazy || isVisible) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => {
      observer.disconnect();
    };
  }, [lazy, isVisible, ref, threshold]);
  
  // 创建样式类
  const getImageClass = useCallback(() => {
    let imageClass = 'safe-image';
    
    // 添加状态类
    switch (status) {
      case ImageLoadingStatus.LOADING:
        imageClass += ' safe-image-loading';
        break;
      case ImageLoadingStatus.LOADED:
        imageClass += ' safe-image-loaded';
        break;
      case ImageLoadingStatus.ERROR:
        imageClass += ' safe-image-error';
        break;
    }
    
    // 添加模糊效果
    if (blur && status === ImageLoadingStatus.LOADING) {
      imageClass += ' safe-image-blur';
    }
    
    // 添加自定义类
    if (className) {
      imageClass += ` ${className}`;
    }
    
    return imageClass;
  }, [status, blur, className]);
  
  // 创建样式对象
  const getImageStyle = useCallback(() => {
    const imageStyle = { ...style };
    
    // 添加模糊效果
    if (blur && status === ImageLoadingStatus.LOADING) {
      imageStyle.filter = `blur(${blurAmount}px)`;
    }
    
    return imageStyle;
  }, [style, blur, status, blurAmount]);
  
  // 渲染骨架屏
  const renderSkeleton = () => {
    if (!showSkeleton || status !== ImageLoadingStatus.LOADING) {
      return null;
    }
    
    return (
      <ImageSkeleton
        width={skeletonWidth}
        height={skeletonHeight}
        type={placeholderType}
      />
    );
  };
  
  // 渲染图片
  const renderImage = () => {
    if (!isVisible) {
      // 渲染占位元素
      return (
        <div
          ref={ref as React.RefObject<HTMLDivElement>}
          className="safe-image-placeholder"
          style={{
            width: skeletonWidth,
            height: skeletonHeight
          }}
        />
      );
    }
    
    if (status === ImageLoadingStatus.LOADING && showSkeleton) {
      return null; // 骨架屏会在外层渲染
    }
    
    return (
      <img
        ref={ref}
        src={imageUrl}
        alt={alt || ''}
        onError={handleError}
        onLoad={handleLoad}
        className={getImageClass()}
        style={getImageStyle()}
        {...restProps}
      />
    );
  };
  
  return (
    <div className="safe-image-container">
      {renderSkeleton()}
      {renderImage()}
    </div>
  );
};

export default SafeImage; 