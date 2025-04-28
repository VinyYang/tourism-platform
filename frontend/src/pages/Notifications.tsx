import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, List, Typography, Empty, Card, Divider, Spin } from 'antd';
import { BellOutlined, ArrowLeftOutlined, InboxOutlined, ShoppingOutlined } from '@ant-design/icons';
import { useNotifications } from '../context/NotificationContext';
import './NotFound.css'; // 复用部分样式

const { Title, Text } = Typography;

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, hasUnreadNotifications } = useNotifications();

  // 如果没有通知，显示空状态
  if (notifications.length === 0) {
    return (
      <div className="not-found-container">
        <Card style={{ width: '100%', maxWidth: 800, margin: '0 auto' }}>
          <Empty
            image={<InboxOutlined style={{ fontSize: 64, color: '#1890ff' }} />}
            description="暂无通知消息"
          >
            <Button type="primary" onClick={() => navigate('/')}>
              返回首页
            </Button>
          </Empty>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '20px auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(-1)}
          style={{ marginRight: 10 }}
        />
        <Title level={4} style={{ margin: 0 }}>
          <BellOutlined style={{ marginRight: 10 }} />
          消息通知
        </Title>
      </div>
      
      <Divider style={{ margin: '10px 0 20px' }} />
      
      <List
        itemLayout="horizontal"
        dataSource={notifications}
        renderItem={(item) => (
          <List.Item style={{ 
            backgroundColor: item.read ? 'transparent' : 'rgba(24, 144, 255, 0.05)',
            padding: '12px 20px',
            marginBottom: 8,
            borderRadius: 8,
            border: '1px solid #f0f0f0'
          }}>
            <List.Item.Meta
              avatar={
                item.type === 'order' ? 
                <ShoppingOutlined style={{ fontSize: 24, color: '#1890ff' }} /> :
                <BellOutlined style={{ fontSize: 24, color: '#1890ff' }} />
              }
              title={
                <Text strong style={{ fontSize: 16 }}>
                  {item.message}
                </Text>
              }
              description={
                <Text type="secondary">
                  {new Date(item.timestamp).toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );
};

export default Notifications; 