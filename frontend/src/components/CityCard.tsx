import React from 'react';
import { Tooltip } from 'antd';
import { EnvironmentOutlined, ArrowRightOutlined } from '@ant-design/icons';
import './CityCard.css';

interface CityCardProps {
  id: number;
  name: string;
  image?: string;
  description?: string;
  province?: string;
  scenicCount?: number;
  onExplore: (cityName: string) => void;
}

const CityCard: React.FC<CityCardProps> = ({
  id,
  name,
  image,
  description = '探索城市文化与景点',
  province,
  scenicCount,
  onExplore
}) => {
  // 默认背景图片，如果没有提供图片URL
  const defaultImage = `https://source.unsplash.com/300x200/?${encodeURIComponent(name)},city,travel`;
  
  return (
    <div className="city-card-container">
      <div className="city-card-background-wrapper">
        <div 
          className="city-card-background" 
          style={{ backgroundImage: `url(${image || defaultImage})` }}
        />
        <div className="city-card-overlay" />
      </div>
      
      <div className="city-card-content">
        <div className="city-card-header">
          <h3>{name}</h3>
          {province && <span className="city-card-province">{province}</span>}
        </div>
        
        <p className="city-card-description">{description}</p>
        
        <div className="city-card-footer">
          {scenicCount && (
            <div className="city-card-scenic-count">
              <Tooltip title={`${name}有${scenicCount}个景点可探索`}>
                <EnvironmentOutlined /> <span>{scenicCount}个景点</span>
              </Tooltip>
            </div>
          )}
          
          <button 
            className="city-card-explore-btn"
            onClick={() => onExplore(name)}
          >
            探索 <ArrowRightOutlined />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CityCard; 