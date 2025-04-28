import React from 'react';
import { Tag, Avatar, Tooltip } from 'antd';
import { EyeOutlined, LikeOutlined, ClockCircleOutlined, UserOutlined, PushpinOutlined } from '@ant-design/icons';
import { Strategy } from '../@types/strategy';
import './FeaturedStrategyCard.css';

// 文化主题颜色映射
const themeColorMap: Record<string, string> = {
  red_culture: '#e74c3c',
  ancient_civilization: '#f39c12',
  ethnic_culture: '#27ae60',
  literature_art: '#3498db',
  religious_culture: '#9b59b6',
  food_culture: '#e67e22',
  industrial_civilization: '#34495e',
  cantonese_culture: '#c0392b',
};

// 计算阅读时间
const calculateReadTime = (content: string): number => {
  if (!content) return 1;
  // 假设平均阅读速度是每分钟300字
  const wordsCount = content.length;
  return Math.max(1, Math.ceil(wordsCount / 300));
};

interface FeaturedStrategyCardProps {
  strategy: Strategy;
  theme?: {
    name: string;
    code: string;
    color: string;
  };
  onView: (id: number | undefined) => void;
}

const FeaturedStrategyCard: React.FC<FeaturedStrategyCardProps> = ({ 
  strategy, 
  theme,
  onView 
}) => {
  const id = strategy.id || strategy.strategy_id;
  const coverImage = strategy.cover_image || strategy.coverImage;
  const viewCount = strategy.view_count || strategy.viewCount || 0;
  const likeCount = strategy.like_count || strategy.likeCount || 0;
  const tagsArray = typeof strategy.tags === 'string' 
    ? strategy.tags.split(',').map(tag => tag.trim()) 
    : (Array.isArray(strategy.tags) ? strategy.tags : []);
  
  // 估算阅读时间
  const readingTime = calculateReadTime(strategy.content);
  
  // 确定主题颜色
  const themeCode = theme?.code || (tagsArray.length > 0 ? tagsArray[0] : 'literature_art');
  const themeColor = theme?.color || themeColorMap[themeCode] || '#3498db';
  const themeName = theme?.name || '文化解读';
  
  // 获取作者信息
  const authorName = strategy.author?.username || strategy.authorName || '旅游达人';
  const authorAvatar = strategy.author?.avatar || strategy.authorAvatar;

  return (
    <div className="featured-strategy-card" style={{ '--theme-color': themeColor } as React.CSSProperties}>
      <div className="featured-strategy-card-cover">
        <div 
          className="featured-strategy-card-image" 
          style={{ backgroundImage: `url(${coverImage || 'https://picsum.photos/300/200'})` }}
        >
          <div className="featured-strategy-card-overlay">
            <button 
              className="view-strategy-btn"
              onClick={() => onView(id)}
            >
              查看攻略
            </button>
          </div>
        </div>
        <div className="featured-strategy-card-theme-tag" style={{ backgroundColor: themeColor }}>
          {themeName}
        </div>
      </div>
      
      <div className="featured-strategy-card-content">
        <div className="featured-strategy-card-tags">
          {tagsArray.slice(0, 2).map((tag, index) => (
            <Tag key={index} color={index === 0 ? themeColor : 'default'}>
              {tag}
            </Tag>
          ))}
          {strategy.city && (
            <Tag icon={<PushpinOutlined />} color="default">
              {strategy.city}
            </Tag>
          )}
        </div>
        
        <h3 className="featured-strategy-card-title" onClick={() => onView(id)}>
          {strategy.title}
        </h3>
        
        <p className="featured-strategy-card-summary">
          {strategy.summary || '暂无简介'}
        </p>
        
        <div className="featured-strategy-card-meta">
          <div className="featured-strategy-card-author">
            <Avatar 
              size="small" 
              src={authorAvatar} 
              icon={!authorAvatar ? <UserOutlined /> : undefined}
            />
            <span>{authorName}</span>
          </div>
          
          <div className="featured-strategy-card-stats">
            <Tooltip title={`阅读时间约 ${readingTime} 分钟`}>
              <span className="featured-strategy-card-stat">
                <ClockCircleOutlined /> {readingTime}分钟
              </span>
            </Tooltip>
            <span className="featured-strategy-card-stat">
              <EyeOutlined /> {viewCount}
            </span>
            <span className="featured-strategy-card-stat">
              <LikeOutlined /> {likeCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturedStrategyCard; 