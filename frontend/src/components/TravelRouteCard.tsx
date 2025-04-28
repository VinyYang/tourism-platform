import React from 'react';
import { Button, Tag, Tooltip } from 'antd';
import { ClockCircleOutlined, FireOutlined, RightOutlined } from '@ant-design/icons';
import './TravelRouteCard.css';

// 路线景点接口
export interface RouteSpot {
    id: string;
    name: string;
    description?: string;
}

// 旅行路线信息接口
export interface TravelRouteInfo {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    category: string;
    durationHours: number;
    difficulty: 'easy' | 'medium' | 'hard';
    spots: RouteSpot[];
}

// 组件Props接口
interface TravelRouteCardProps {
    route: TravelRouteInfo;
    onClick?: (routeId: string) => void;
}

const TravelRouteCard: React.FC<TravelRouteCardProps> = ({ route, onClick }) => {
    // 获取难度对应的颜色
    const getDifficultyColor = (difficulty: string): string => {
        switch (difficulty) {
            case 'easy':
                return '#52c41a';
            case 'medium':
                return '#faad14';
            case 'hard':
                return '#f5222d';
            default:
                return '#52c41a';
        }
    };

    // 获取难度对应的文本
    const getDifficultyText = (difficulty: string): string => {
        switch (difficulty) {
            case 'easy':
                return '轻松';
            case 'medium':
                return '中等';
            case 'hard':
                return '困难';
            default:
                return '轻松';
        }
    };

    // 处理卡片点击
    const handleCardClick = () => {
        if (onClick) {
            onClick(route.id);
        }
    };

    // 最多显示3个景点，超过则显示 +X
    const visibleSpots = route.spots.slice(0, 3);
    const hasMoreSpots = route.spots.length > 3;
    const moreSpotCount = route.spots.length - 3;

    return (
        <div className="travel-route-card" onClick={handleCardClick}>
            <div
                className="route-image"
                style={{ backgroundImage: `url(${route.imageUrl})` }}
            >
                <div className="route-badge">{route.category}</div>
            </div>

            <div className="route-content">
                <h3>{route.name}</h3>
                <p className="route-description">{route.description}</p>

                <div className="route-info">
                    <div className="info-item">
                        <ClockCircleOutlined />
                        <span>{route.durationHours} 小时</span>
                    </div>
                    <div className="info-item">
                        <FireOutlined style={{ color: getDifficultyColor(route.difficulty) }} />
                        <span style={{ color: getDifficultyColor(route.difficulty) }}>
                            {getDifficultyText(route.difficulty)}
                        </span>
                    </div>
                </div>

                <div className="route-spots">
                    {visibleSpots.map((spot, index) => (
                        <React.Fragment key={spot.id}>
                            <Tooltip title={spot.description || spot.name}>
                                <div className="route-spot">{spot.name}</div>
                            </Tooltip>
                            {index < visibleSpots.length - 1 && (
                                <span className="spot-arrow">
                                    <RightOutlined />
                                </span>
                            )}
                        </React.Fragment>
                    ))}
                    {hasMoreSpots && (
                        <Tooltip title={`还有${moreSpotCount}个景点`}>
                            <Tag color="blue">+{moreSpotCount}</Tag>
                        </Tooltip>
                    )}
                </div>

                <Button type="primary" className="view-route-btn">
                    查看路线
                </Button>
            </div>
        </div>
    );
};

export default TravelRouteCard; 