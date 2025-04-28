/**
 * 图片骨架屏组件
 * 在图片加载过程中显示的骨架屏
 */

import React from 'react';
import { Skeleton } from 'antd';
import { ImageSkeletonProps, ImageType } from '../../types/image.types';
import { PLACEHOLDER_CONFIG } from '../../services/imageServiceConfig';
import './ImageSkeleton.css';

/**
 * 图片骨架屏组件
 * @param props 组件属性
 * @returns 骨架屏组件
 */
const ImageSkeleton: React.FC<ImageSkeletonProps> = ({
  width,
  height,
  type,
  shape = 'rounded',
  animation = true,
  className = '',
  style = {}
}) => {
  // 根据类型获取默认尺寸
  const getDefaultSize = () => {
    if (!type) {
      return {
        width: PLACEHOLDER_CONFIG.DEFAULT_WIDTH,
        height: PLACEHOLDER_CONFIG.DEFAULT_HEIGHT
      };
    }
    
    // 使用枚举的值作为键
    const typeKey: keyof typeof PLACEHOLDER_CONFIG.SIZES = type.toString() as any;
    
    // 安全访问配置
    const size = PLACEHOLDER_CONFIG.SIZES[typeKey];
    
    return {
      width: size?.width || PLACEHOLDER_CONFIG.DEFAULT_WIDTH,
      height: size?.height || PLACEHOLDER_CONFIG.DEFAULT_HEIGHT
    };
  };
  
  // 获取最终尺寸
  const defaultSize = getDefaultSize();
  const finalWidth = width || defaultSize.width;
  const finalHeight = height || defaultSize.height;
  
  // 计算纵横比
  const aspectRatio = `${finalWidth} / ${finalHeight}`;
  
  // 根据类型选择不同的骨架屏样式
  const getSkeletonClass = () => {
    let baseClass = 'image-skeleton';
    
    // 添加形状类
    switch (shape) {
      case 'circle':
        baseClass += ' image-skeleton-circle';
        break;
      case 'rounded':
        baseClass += ' image-skeleton-rounded';
        break;
      default:
        baseClass += ' image-skeleton-square';
    }
    
    // 添加类型特定类
    if (type) {
      baseClass += ` image-skeleton-${type.toString().toLowerCase()}`;
    }
    
    // 添加动画类
    if (animation) {
      baseClass += ' image-skeleton-animate';
    }
    
    // 添加自定义类
    if (className) {
      baseClass += ` ${className}`;
    }
    
    return baseClass;
  };
  
  // 特殊类型处理
  if (type === ImageType.AVATAR) {
    return (
      <Skeleton.Avatar
        active={animation}
        size={typeof finalWidth === 'number' ? finalWidth : 'default'}
        className={`${getSkeletonClass()} image-skeleton-avatar`}
        style={{
          ...style,
          width: finalWidth,
          height: finalHeight
        }}
      />
    );
  }
  
  // 通用图片骨架屏
  return (
    <div
      className={getSkeletonClass()}
      style={{
        ...style,
        width: finalWidth,
        height: finalHeight,
        aspectRatio
      }}
    />
  );
};

export default ImageSkeleton; 