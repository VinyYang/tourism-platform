import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Typography, Tag, Button, Spin, message, Empty, Descriptions, List, Space } from 'antd';
import { ArrowLeftOutlined, CompassOutlined, EnvironmentOutlined } from '@ant-design/icons';
import ChinaMap from '../components/map/ChinaMap';
import featuredRouteAPI, { ApiFeaturedRoute } from '../api/featuredRoute';
import { prepareFeaturedRouteSpotsForMap, sortRouteSpotsByOrder } from '../utils/mapHelpers';
import './Itineraries.css'; // 重用相同的样式表

const { Title, Text, Paragraph } = Typography;

const FeaturedRouteDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [routeDetail, setRouteDetail] = useState<ApiFeaturedRoute | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [mapSpots, setMapSpots] = useState<any[]>([]);

  useEffect(() => {
    const fetchRouteDetail = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        console.log('获取精选路线详情, ID:', id);
        const data = await featuredRouteAPI.getPublicFeaturedRouteById(id);
        console.log('获取到的精选路线详情:', data);
        
        // 保存原始数据
        setRouteDetail(data);
        
        // 使用辅助函数处理景点数据以适配地图组件
        if (data.spots && Array.isArray(data.spots)) {
          // 先排序，保证展示顺序正确
          const sortedSpots = sortRouteSpotsByOrder(data.spots);
          // 准备适用于地图组件的数据格式
          const preparedSpots = prepareFeaturedRouteSpotsForMap({...data, spots: sortedSpots});
          console.log('处理后的地图景点数据:', preparedSpots);
          setMapSpots(preparedSpots);
        }
      } catch (err: any) {
        console.error('获取精选路线详情失败:', err);
        setError(err.message || '获取路线详情失败');
        message.error('获取路线详情失败');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRouteDetail();
  }, [id]);

  // 处理返回按钮点击
  const handleBack = () => {
    navigate(-1); // 返回上一页
  };

  // 处理应用路线
  const handleApplyRoute = async () => {
    if (!id) return;
    
    try {
      message.loading('正在应用路线...', 1);
      await featuredRouteAPI.applyFeaturedRoute(Number(id));
      message.success('路线已应用，即将跳转到行程规划页面');
      navigate('/itineraries');
    } catch (err) {
      console.error('应用路线失败:', err);
      message.error('应用路线失败，请稍后重试');
    }
  };

  // 渲染加载状态
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="正在加载路线详情..." />
      </div>
    );
  }

  // 渲染错误状态
  if (error) {
    return (
      <div style={{ padding: '50px' }}>
        <Empty
          description={
            <span>
              加载路线详情失败：{error}
              <br />
              <Button type="primary" onClick={handleBack} style={{ marginTop: 16 }}>
                返回
              </Button>
            </span>
          }
        />
      </div>
    );
  }

  // 渲染空数据状态
  if (!routeDetail) {
    return (
      <div style={{ padding: '50px' }}>
        <Empty description="未找到路线详情">
          <Button type="primary" onClick={handleBack}>
            返回
          </Button>
        </Empty>
      </div>
    );
  }

  // 对路线景点进行排序，确保显示顺序正确
  const orderedSpots = routeDetail.spots ? sortRouteSpotsByOrder(routeDetail.spots) : [];
  
  // 检查是否有有效的地图数据
  const hasValidMapData = mapSpots.length > 0;

  return (
    <div className="featured-route-detail-page">
      <div className="page-header">
        <Button icon={<ArrowLeftOutlined />} onClick={handleBack} type="link" size="large">
          返回
        </Button>
        <Title level={2}>{routeDetail.name}</Title>
        <div className="route-tags">
          {routeDetail.category && <Tag color="blue">{routeDetail.category}</Tag>}
          {routeDetail.difficulty && <Tag color="orange">{routeDetail.difficulty}</Tag>}
        </div>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <Card title="路线信息" className="route-info-card">
            <Paragraph>{routeDetail.description}</Paragraph>
            
            {routeDetail.image_url && (
              <div className="route-image-container">
                <img 
                  src={routeDetail.image_url} 
                  alt={routeDetail.name} 
                  className="route-cover-image"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/placeholders/default.jpg';
                  }}
                />
              </div>
            )}
            
            <Button 
              type="primary" 
              onClick={handleApplyRoute} 
              style={{ marginTop: 16, width: '100%' }}
            >
              应用此路线
            </Button>
          </Card>
          
          <Card title="路线景点" style={{ marginTop: 16 }}>
            <List
              dataSource={orderedSpots}
              renderItem={(spot, index) => (
                <List.Item>
                  <Space>
                    <Tag color="blue">{spot.order_number || index + 1}</Tag>
                    <Text strong>{spot.scenicSpot?.name || '未命名景点'}</Text>
                  </Space>
                </List.Item>
              )}
              locale={{ emptyText: '此路线暂无景点信息' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} lg={16}>
          <Card 
            title="路线地图" 
            className="route-map-card"
            extra={
              !hasValidMapData ? 
              <Tag color="warning">景点缺少坐标数据，无法显示完整地图</Tag> : 
              null
            }
          >
            <div style={{ height: '600px', width: '100%' }}>
              {hasValidMapData ? (
                <ChinaMap 
                  featuredRouteSpots={mapSpots}
                  routeName={routeDetail.name}
                />
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Empty 
                    description="无法显示地图，所有景点均缺少位置坐标" 
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default FeaturedRouteDetail; 