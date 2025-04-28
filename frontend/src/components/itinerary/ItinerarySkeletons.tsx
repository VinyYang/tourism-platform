import React from 'react';
import { Skeleton, Card, Row, Col, Space, Divider } from 'antd';
import './ItinerarySkeletons.css';

interface ItinerarySkeletonProps {
  days?: number;
  withHeader?: boolean;
  withSidebar?: boolean;
}

/**
 * 行程头部骨架屏
 * 显示行程标题、日期和操作按钮的加载状态
 */
export const ItineraryHeaderSkeleton: React.FC = () => {
  return (
    <Card style={{ marginBottom: 16 }}>
      <Row justify="space-between" align="top">
        <Col>
          <Skeleton.Input style={{ width: 250, height: 32 }} active />
          <div style={{ marginTop: 8 }}>
            <Skeleton.Input style={{ width: 180, height: 20 }} active />
          </div>
        </Col>
        <Col>
          <Space>
            <Skeleton.Button active />
            <Skeleton.Button active />
            <Skeleton.Button active />
          </Space>
        </Col>
      </Row>
      
      <Divider />
      
      <Row gutter={16}>
        <Col>
          <Skeleton.Input style={{ width: 240, height: 32 }} active />
        </Col>
        <Col>
          <Skeleton.Input style={{ width: 120, height: 32 }} active />
        </Col>
      </Row>
    </Card>
  );
};

/**
 * 行程日卡片骨架屏
 * 显示单天行程的加载状态
 */
export const DayCardSkeleton: React.FC = () => {
  return (
    <Card style={{ marginBottom: 16 }} className="day-card-skeleton">
      <Skeleton.Input style={{ width: 150, height: 28 }} active />
      <div style={{ marginTop: 8, marginBottom: 16 }}>
        <Skeleton.Input style={{ width: 100, height: 16 }} active />
      </div>
      
      <div className="skeleton-item">
        <div className="item-left">
          <Skeleton.Avatar active size="large" shape="square" />
        </div>
        <div className="item-right">
          <Skeleton.Input style={{ width: '90%', height: 20 }} active />
          <div style={{ marginTop: 8 }}>
            <Skeleton.Input style={{ width: '60%', height: 16 }} active />
          </div>
        </div>
      </div>
      
      <div className="skeleton-item">
        <div className="item-left">
          <Skeleton.Avatar active size="large" shape="square" />
        </div>
        <div className="item-right">
          <Skeleton.Input style={{ width: '80%', height: 20 }} active />
          <div style={{ marginTop: 8 }}>
            <Skeleton.Input style={{ width: '50%', height: 16 }} active />
          </div>
        </div>
      </div>
      
      <div className="skeleton-item">
        <div className="item-left">
          <Skeleton.Avatar active size="large" shape="square" />
        </div>
        <div className="item-right">
          <Skeleton.Input style={{ width: '70%', height: 20 }} active />
          <div style={{ marginTop: 8 }}>
            <Skeleton.Input style={{ width: '40%', height: 16 }} active />
          </div>
        </div>
      </div>
    </Card>
  );
};

/**
 * 完整行程骨架屏
 * 显示整个行程页面的加载状态
 */
const ItinerarySkeleton: React.FC<ItinerarySkeletonProps> = ({ 
  days = 3, 
  withHeader = true,
  withSidebar = false
}) => {
  // 生成指定天数的骨架屏
  const renderDaySkeletons = () => {
    return Array(days).fill(0).map((_, index) => (
      <DayCardSkeleton key={`day-skeleton-${index}`} />
    ));
  };

  return (
    <div className="itinerary-skeleton-container">
      <Row gutter={16}>
        {withSidebar && (
          <Col span={6}>
            <Card>
              <Skeleton active paragraph={{ rows: 6 }} />
            </Card>
          </Col>
        )}
        
        <Col span={withSidebar ? 18 : 24}>
          {withHeader && <ItineraryHeaderSkeleton />}
          
          <div className="days-skeleton-container">
            {renderDaySkeletons()}
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default ItinerarySkeleton; 