import React, { useState, useEffect } from 'react';
import { Row, Col, Card, message, Alert, Tabs } from 'antd';
import ChinaMap from '../components/map/ChinaMap';
import MapControls from '../components/map/MapControls';
import RouteVisualization from '../components/map/RouteVisualization';
import TrainTicketSearch from '../components/transport/TrainTicketSearch';
import useMapInteraction from '../hooks/useMapInteraction';
import transportAPI, { Transport, TransportType } from '../api/transport';
import geoDataAPI from '../api/geoData';

const { TabPane } = Tabs;

const TransportMap: React.FC = () => {
  // 状态管理
  const [transportType, setTransportType] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [showRoutes, setShowRoutes] = useState<boolean>(true);
  const [fromCity, setFromCity] = useState<string>('');
  const [toCity, setToCity] = useState<string>('');
  const [routes, setRoutes] = useState<Transport[]>([]);
  const [popularCities, setPopularCities] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('map');
  
  // 地图交互逻辑
  const { chartInstance, zoomIn, zoomOut, resetView, focusOnCity } = useMapInteraction();
  
  // 加载热门城市
  useEffect(() => {
    const fetchPopularCities = async () => {
      try {
        const citiesData = await geoDataAPI.getPopularCities();
        if (citiesData && citiesData.length > 0) {
          setPopularCities(citiesData.map((city: any) => city.name));
        }
      } catch (err) {
        console.error('获取热门城市失败:', err);
        // 设置默认城市列表，确保功能可用
        setPopularCities(['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '重庆']);
      }
    };
    
    fetchPopularCities();
  }, []);

  // 为移动设备添加CSS媒体查询
  useEffect(() => {
    // 创建样式表
    const styleSheet = document.createElement('style');
    styleSheet.type = 'text/css';
    styleSheet.innerText = `
      @media (max-width: 768px) {
        .mobile-only-notice {
          display: block !important;
        }
      }
    `;
    
    // 添加到document头部
    document.head.appendChild(styleSheet);
    
    // 清理函数
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);
  
  // 搜索交通路线
  useEffect(() => {
    const searchRoutes = async () => {
      if (!fromCity || !toCity) {
        setRoutes([]);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const data = await transportAPI.searchTransportBetweenCities(
          fromCity, 
          toCity, 
          transportType !== 'all' ? transportType as TransportType : undefined
        );
        
        setRoutes(data);
        
        if (data.length === 0) {
          message.info(`未找到从 ${fromCity} 到 ${toCity} 的交通路线`);
        }
      } catch (err: any) {
        console.error('搜索交通路线失败:', err);
        setError(err.message || '搜索交通路线失败，请稍后重试');
        setRoutes([]);
      } finally {
        setLoading(false);
      }
    };
    
    searchRoutes();
  }, [fromCity, toCity, transportType, priceRange]);
  
  // 处理城市选择（地图点击）
  const handleCitySelect = (cityName: string) => {
    // 如果还没有选择出发城市，则设置为出发城市
    if (!fromCity) {
      handleFromCityChange(cityName);
    } 
    // 如果已选择出发城市但未选择目的地城市，则设置为目的地城市
    else if (!toCity) {
      // 避免目的地和出发地相同
      if (cityName === fromCity) {
        message.warning('目的地城市不能与出发城市相同');
        return;
      }
      handleToCityChange(cityName);
    } 
    // 如果两个城市都已选择，更新出发城市，清空目的地城市
    else {
      handleFromCityChange(cityName);
      handleToCityChange('');
    }
  };

  // 处理出发城市变更
  const handleFromCityChange = (city: string) => {
    console.log('出发城市变更为:', city);
    setFromCity(city);
  };
  
  // 处理目的地城市变更
  const handleToCityChange = (city: string) => {
    console.log('目的地城市变更为:', city);
    setToCity(city);
  };

  // 处理路线选择
  const handleRouteSelect = (route: Transport) => {
    message.info(`已选择 ${route.type} 路线: ${fromCity} → ${toCity}`);
    setTransportType(route.type);
  };

  // 处理标签页切换
  const handleTabChange = (activeKey: string) => {
    setActiveTab(activeKey);
  };
  
  // 从路线查询切换到火车票查询
  const switchToTrainSearch = () => {
    setActiveTab('trainTicket');
  };
  
  return (
    <div className="transport-map-page">
      <div className="page-header">
        <h1>交通信息</h1>
      </div>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <MapControls 
            transportType={transportType}
            onTransportTypeChange={setTransportType}
            priceRange={priceRange}
            onPriceRangeChange={setPriceRange}
            showRoutes={showRoutes}
            onShowRoutesChange={setShowRoutes}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onReset={resetView}
            fromCity={fromCity}
            toCity={toCity}
            onFromCityChange={handleFromCityChange}
            onToCityChange={handleToCityChange}
            popularCities={popularCities}
          />
          
          {/* 添加操作指南卡片 */}
          <Card title="操作指南" style={{ marginTop: 16 }}>
            <p>1. 在地图上点击城市选择出发地</p>
            <p>2. 再次点击选择目的地</p>
            <p>3. 选择交通方式查看详情</p>
            {fromCity && <p><strong>当前出发城市:</strong> {fromCity}</p>}
            {toCity && <p><strong>当前目的地城市:</strong> {toCity}</p>}
            <p>4. 切换至火车票查询可查看更多火车票详情</p>
          </Card>
          
          {/* 移动端专属提示 */}
          <div className="mobile-only-notice" style={{ 
            display: 'none', 
            margin: '16px 0',
            padding: '10px',
            background: '#f5f5f5',
            borderRadius: '4px',
            textAlign: 'center'
          }}>
            <Alert
              message="提示"
              description="向右滑动查看地图和交通信息"
              type="info"
              showIcon
            />
          </div>
        </Col>
        
        <Col xs={24} md={18}>
          <Tabs activeKey={activeTab} onChange={handleTabChange} type="card">
            <TabPane tab="交通地图" key="map">
              <Row gutter={[0, 16]}>
                <Col span={24}>
                  <Card title="交通信息" className="map-card">
                    {error && (
                      <Alert
                        message="数据加载错误"
                        description={error}
                        type="error"
                        closable
                        className="map-error"
                      />
                    )}
                    
                    <div className="map-container" style={{ height: '500px' }}>
                      <ChinaMap
                        selectedCity={fromCity}
                        targetCity={toCity}
                        transportType={transportType === 'all' ? undefined : transportType}
                        onCitySelect={handleCitySelect}
                        showRoutes={showRoutes}
                      />
                    </div>
                  </Card>
                </Col>
                
                {/* 添加票务信息区域，使其与地图并列显示 */}
                {fromCity && toCity && (
                  <Col span={24}>
                    <Card 
                      title={`${fromCity} 到 ${toCity} 的交通信息`}
                      className="routes-card"
                      extra={
                        <a onClick={switchToTrainSearch}>
                          {transportType === 'train' || transportType === 'all' ? '查看火车票详情' : ''}
                        </a>
                      }
                    >
                      <RouteVisualization 
                        routes={routes}
                        fromCity={fromCity}
                        toCity={toCity}
                        onRouteSelect={handleRouteSelect}
                        onViewTrainTickets={switchToTrainSearch}
                      />
                    </Card>
                  </Col>
                )}
              </Row>
            </TabPane>
            
            <TabPane tab="火车票查询" key="trainTicket">
              <Card title="火车票余票查询" className="train-ticket-card">
                <div className="train-ticket-container">
                  <TrainTicketSearch 
                    initialFromStation={fromCity ? fromCity : undefined}
                    initialToStation={toCity ? toCity : undefined}
                  />
                </div>
              </Card>
            </TabPane>
          </Tabs>
        </Col>
      </Row>
    </div>
  );
};

export default TransportMap;