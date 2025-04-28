import React from 'react';
import { Card, Descriptions, Button, Divider, Tag, Space } from 'antd';
import { 
  ClockCircleOutlined, 
  DollarOutlined, 
  ArrowRightOutlined,
  InfoCircleOutlined 
} from '@ant-design/icons';
import { Transport, TransportType } from '../../api/transport';

interface TransportInfoCardProps {
  transport: Transport;
  onClose?: () => void;
  onAddToItinerary?: (transport: Transport) => void;
}

const TransportInfoCard: React.FC<TransportInfoCardProps> = ({
  transport,
  onClose,
  onAddToItinerary
}) => {
  // 获取交通类型文本
  const getTransportTypeText = (type: string): string => {
    const typeMap: Record<string, string> = {
      [TransportType.PLANE]: '飞机',
      [TransportType.TRAIN]: '火车',
      [TransportType.BUS]: '大巴',
      [TransportType.CAR]: '汽车'
    };
    return typeMap[type] || type;
  };

  // 获取交通类型标签颜色
  const getTransportTypeColor = (type: string): string => {
    const colorMap: Record<string, string> = {
      [TransportType.PLANE]: 'orange',
      [TransportType.TRAIN]: 'green',
      [TransportType.BUS]: 'blue',
      [TransportType.CAR]: 'gold'
    };
    return colorMap[type] || 'default';
  };

  // 格式化时间（分钟转为小时和分钟）
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}小时${mins > 0 ? ` ${mins}分钟` : ''}`;
    }
    return `${mins}分钟`;
  };

  return (
    <Card 
      title={
        <Space>
          <Tag color={getTransportTypeColor(transport.type)}>
            {getTransportTypeText(transport.type)}
          </Tag>
          <span>{transport.fromCity} <ArrowRightOutlined /> {transport.toCity}</span>
        </Space>
      }
      extra={<Button type="text" onClick={onClose}>关闭</Button>}
      className="transport-info-card"
    >
      <Descriptions column={1} size="small">
        <Descriptions.Item label="公司/车次">
          {transport.company || '-'}
        </Descriptions.Item>
        
        <Descriptions.Item label="价格">
          <Space>
            <DollarOutlined />
            <span className="price">¥{transport.price.toFixed(2)}</span>
          </Space>
        </Descriptions.Item>
        
        <Descriptions.Item label="时长">
          <Space>
            <ClockCircleOutlined />
            <span>{formatDuration(transport.duration)}</span>
          </Space>
        </Descriptions.Item>
      </Descriptions>

      <Divider />

      <div className="transport-info-actions">
        <Button 
          type="primary" 
          onClick={() => onAddToItinerary && onAddToItinerary(transport)}
        >
          添加到行程
        </Button>
        
        <Button type="link">
          <InfoCircleOutlined /> 详细信息
        </Button>
      </div>

      <div className="transport-info-tips">
        <p className="tip-text">
          <InfoCircleOutlined /> 提示：添加到行程后可在行程规划器中查看完整旅行安排
        </p>
      </div>
    </Card>
  );
};

export default TransportInfoCard; 