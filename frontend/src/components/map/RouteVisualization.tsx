import React from 'react';
import { Card, Table, Tabs, Statistic, Row, Col, Badge, Button, Typography, Descriptions } from 'antd';
import { Transport, TransportType } from '../../api/transport';
import { 
  ClockCircleOutlined, 
  DollarOutlined, 
  EnvironmentOutlined,
  RocketOutlined,
  CarOutlined,
  NodeIndexOutlined,
  ThunderboltOutlined,
  SearchOutlined
} from '@ant-design/icons';
import './RouteVisualization.css';

const { TabPane } = Tabs;
const { Title, Text } = Typography;

interface RouteVisualizationProps {
  routes: Transport[];
  fromCity?: string;
  toCity?: string;
  onRouteSelect?: (route: Transport) => void;
  onViewTrainTickets?: (fromStation: string, toStation: string) => void;
}

// 内部使用的路线类型，与 Transport 接口兼容
interface RouteItem extends Transport {
  key: string;
}

const RouteVisualization: React.FC<RouteVisualizationProps> = ({
  routes,
  fromCity,
  toCity,
  onRouteSelect,
  onViewTrainTickets
}) => {
  // 获取每种交通方式的图标
  const getTransportIcon = (type: string) => {
    switch (type) {
      case TransportType.PLANE:
        return <RocketOutlined style={{ color: '#ff7f50' }} />;
      case TransportType.TRAIN:
        return <NodeIndexOutlined style={{ color: '#32cd32' }} />;
      case TransportType.BUS:
        return <ThunderboltOutlined style={{ color: '#4169e1' }} />;
      case TransportType.CAR:
        return <CarOutlined style={{ color: '#ffa500' }} />;
      default:
        return <EnvironmentOutlined />;
    }
  };

  // 获取交通类型文本
  const getTransportTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      [TransportType.PLANE]: '飞机',
      [TransportType.TRAIN]: '火车',
      [TransportType.BUS]: '大巴',
      [TransportType.CAR]: '汽车'
    };
    return typeMap[type] || type;
  };

  // 按交通类型分组路线
  const groupedRoutes = routes.reduce<Record<string, Transport[]>>((acc, route) => {
    if (!acc[route.type]) {
      acc[route.type] = [];
    }
    acc[route.type].push(route);
    return acc;
  }, {});

  // 格式化时间（分钟转为小时和分钟）
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}小时${mins > 0 ? ` ${mins}分钟` : ''}`;
    }
    return `${mins}分钟`;
  };

  // 表格列定义
  const getColumns = (type: string) => {
    // 基础列定义
    const baseColumns = [
      {
        title: '交通方式',
        dataIndex: 'type',
        key: 'type',
        render: (type: string) => (
          <span>
            {getTransportIcon(type)} {getTransportTypeText(type)}
          </span>
        )
      },
      {
        title: '公司/车次',
        dataIndex: 'company',
        key: 'company',
      },
      {
        title: '价格',
        dataIndex: 'price',
        key: 'price',
        render: (price: number) => `¥${price.toFixed(2)}`,
        sorter: (a: Transport, b: Transport) => a.price - b.price
      },
      {
        title: '时长',
        dataIndex: 'duration',
        key: 'duration',
        render: (duration: number) => formatDuration(duration),
        sorter: (a: Transport, b: Transport) => a.duration - b.duration
      }
    ];

    // 如果是火车，添加查看详情按钮
    if (type === TransportType.TRAIN) {
      baseColumns.push({
        title: '详情',
        key: 'action',
        render: (text: any, record: Transport) => (
          <Button 
            type="link" 
            icon={<SearchOutlined />} 
            onClick={(e) => {
              e.stopPropagation(); // 防止触发行点击事件
              if (onViewTrainTickets && record.departurePoint && record.arrivalPoint) {
                onViewTrainTickets(record.departurePoint, record.arrivalPoint);
              }
            }}
          >
            查询余票
          </Button>
        )
      } as any); // 使用类型断言避免类型错误
    }

    return baseColumns;
  };

  // 查找不同交通方式的最低价格和最短时间
  const findBestOptions = () => {
    if (routes.length === 0) return { cheapest: null, fastest: null };
    
    const cheapest = routes.reduce((prev, curr) => 
      prev.price < curr.price ? prev : curr
    );
    
    const fastest = routes.reduce((prev, curr) => 
      prev.duration < curr.duration ? prev : curr
    );
    
    return { cheapest, fastest };
  };

  const { cheapest, fastest } = findBestOptions();

  // 当没有路线数据时显示的内容
  if (routes.length === 0) {
    return (
      <Card title="路线信息" className="route-visualization">
        <div className="empty-routes">
          {fromCity && toCity 
            ? `没有找到从 ${fromCity} 到 ${toCity} 的交通信息`
            : '请选择出发城市和目的地城市查看路线信息'}
        </div>
      </Card>
    );
  }

  // 判断是否有火车路线
  const hasTrainRoutes = routes.some(route => route.type === TransportType.TRAIN);

  // 转换数据为表格格式
  const tableData: RouteItem[] = routes.map((r, index) => ({
    ...r,
    key: `${index}`,
    // 确保所有属性都有默认值
    from: r.departurePoint || r.fromCity,
    to: r.arrivalPoint || r.toCity,
    distance: r.distance || 0,
    details: r.details || {}
  }));

  // 计算总时长和总距离
  const totalDuration = routes.reduce((sum, r) => sum + r.duration, 0);
  const totalDistance = routes.reduce((sum, r) => sum + (r.distance || 0), 0);
  const totalPrice = routes.reduce((sum, r) => sum + r.price, 0);

  return (
    <Card title="路线信息" className="route-visualization">
      {/* 路线基本信息 */}
      {fromCity && toCity && (
        <div className="route-header">
          <h3>
            <EnvironmentOutlined /> {fromCity} 到 {toCity}
          </h3>
          <p className="route-summary">
            共找到 {routes.length} 条路线，{Object.keys(groupedRoutes).length} 种交通方式
            {hasTrainRoutes && onViewTrainTickets && routes[0].departurePoint && routes[routes.length - 1].arrivalPoint && (
              <Button 
                type="link" 
                onClick={() => onViewTrainTickets(routes[0].departurePoint!, routes[routes.length - 1].arrivalPoint!)}
                style={{ marginLeft: 8 }}
              >
                查看火车票详情
              </Button>
            )}
          </p>
        </div>
      )}

      {/* 最优选项统计 */}
      {cheapest && fastest && (
        <Row gutter={16} className="best-options">
          <Col span={12}>
            <Card size="small">
              <Statistic
                title="最便宜选项"
                value={cheapest.price}
                precision={2}
                valueStyle={{ color: '#3f8600' }}
                prefix={<DollarOutlined />}
                suffix="元"
              />
              <div className="option-detail">
                {getTransportIcon(cheapest.type)} {getTransportTypeText(cheapest.type)} · {formatDuration(cheapest.duration)}
              </div>
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small">
              <Statistic
                title="最快选项"
                value={formatDuration(fastest.duration)}
                valueStyle={{ color: '#cf1322' }}
                prefix={<ClockCircleOutlined />}
              />
              <div className="option-detail">
                {getTransportIcon(fastest.type)} {getTransportTypeText(fastest.type)} · ¥{fastest.price.toFixed(2)}
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* 分交通方式显示路线 */}
      <Tabs defaultActiveKey="all" className="routes-tabs">
        <TabPane tab="全部" key="all">
          <Table
            dataSource={tableData as Transport[]}
            columns={getColumns('all')}
            rowKey="key"
            pagination={{ pageSize: 5 }}
            onRow={(record) => ({
              onClick: () => onRouteSelect && onRouteSelect(record as Transport)
            })}
          />
        </TabPane>
        
        {Object.entries(groupedRoutes).map(([type, typeRoutes]) => (
          <TabPane 
            tab={
              <span>
                {getTransportIcon(type)} {getTransportTypeText(type)}
              </span>
            } 
            key={type}
          >
            <Table
              dataSource={tableData.filter(item => item.type === type) as Transport[]}
              columns={getColumns(type)}
              rowKey="key"
              pagination={{ pageSize: 5 }}
              onRow={(record) => ({
                onClick: () => onRouteSelect && onRouteSelect(record as Transport)
              })}
            />
          </TabPane>
        ))}
      </Tabs>

      <Row gutter={16} className="route-summary">
        <Col span={24}>
          <Card>
            <Descriptions bordered column={3}>
              <Descriptions.Item label="总时长">{totalDuration} 分钟</Descriptions.Item>
              <Descriptions.Item label="总距离">{totalDistance.toFixed(2)} 公里</Descriptions.Item>
              <Descriptions.Item label="总价格">¥{totalPrice.toFixed(2)}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </Card>
  );
};

export default RouteVisualization; 