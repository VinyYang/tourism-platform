import React from 'react';
import { Card, Table, Tabs, Tag, Space, Collapse, Badge, Tooltip, Typography, Button } from 'antd';
import { ClockCircleOutlined, EnvironmentOutlined, InfoCircleOutlined, DollarOutlined } from '@ant-design/icons';
import { FlightInfo } from '../../api/flightTicket';
import './FlightTicketCard.css'; // 需要单独创建这个CSS文件

const { TabPane } = Tabs;
const { Panel } = Collapse;
const { Text } = Typography;

interface FlightTicketCardProps {
  flights: FlightInfo[];
  onSelectFlight?: (flight: FlightInfo) => void;
}

const FlightTicketCard: React.FC<FlightTicketCardProps> = ({ flights, onSelectFlight }) => {
  // 获取航空公司对应的标签颜色
  const getAirlineColor = (airline: string): string => {
    const colorMap: Record<string, string> = {
      '中国国航': 'blue',
      '东方航空': 'red',
      '南方航空': 'volcano',
      '海南航空': 'gold',
      '深圳航空': 'green',
      '厦门航空': 'cyan',
    };
    return colorMap[airline] || 'default';
  };

  // 获取经停次数对应标签颜色
  const getStopsColor = (stops: number): string => {
    if (stops === 0) return 'success';
    if (stops === 1) return 'warning';
    return 'error';
  };

  // 格式化价格
  const formatPrice = (price: number, discount?: number): React.ReactNode => {
    if (discount) {
      return (
        <Space direction="vertical" size={0}>
          <Text type="danger" strong>¥{price.toFixed(2)}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>{(discount * 10).toFixed(1)}折</Text>
        </Space>
      );
    }
    return <Text type="danger" strong>¥{price.toFixed(2)}</Text>;
  };

  // 格式化时间
  const formatDuration = (durationStr: string): string => {
    return durationStr;
  };

  // 航班信息面板
  const renderFlightPanel = (flight: FlightInfo) => {
    return (
      <Card.Grid style={{ width: '100%', padding: 0 }} hoverable={false}>
        <div className="flight-info">
          <div className="airline-info">
            <Tag color={getAirlineColor(flight.airline)}>
              {flight.airline}
            </Tag>
            <span className="flight-no">{flight.flightNo}</span>
            {flight.aircraftType && <Text type="secondary" style={{ marginLeft: 8 }}>{flight.aircraftType}</Text>}
          </div>
          
          <div className="time-route">
            <div className="time-info">
              <div className="departure">
                <div className="time">{flight.fromTime}</div>
                <div className="airport">{flight.fromAirport}</div>
                {flight.fromTerminal && <div className="terminal">T{flight.fromTerminal}</div>}
              </div>
              
              <div className="duration">
                <div className="time">
                  <ClockCircleOutlined /> {formatDuration(flight.duration)}
                </div>
                <div className="line">
                  {flight.stops > 0 ? (
                    <Tag color={getStopsColor(flight.stops)}>
                      {flight.stops}次经停
                    </Tag>
                  ) : (
                    <Tag color="success">直飞</Tag>
                  )}
                </div>
              </div>
              
              <div className="arrival">
                <div className="time">{flight.toTime}</div>
                <div className="airport">{flight.toAirport}</div>
                {flight.toTerminal && <div className="terminal">T{flight.toTerminal}</div>}
              </div>
            </div>
            
            {flight.stops > 0 && flight.transferCities && flight.transferCities.length > 0 && (
              <div className="transfer-info">
                <Text type="secondary">经停：{flight.transferCities.join('、')}</Text>
              </div>
            )}
          </div>
          
          <div className="price-info">
            {formatPrice(flight.price, flight.discount)}
            <div className="action-buttons">
              <Button 
                type="primary"
                size="small"
                onClick={() => onSelectFlight && onSelectFlight(flight)}
                className="book-btn"
              >
                预订
              </Button>
              <div className="select-btn" onClick={() => onSelectFlight && onSelectFlight(flight)}>
                选择
              </div>
            </div>
          </div>
        </div>
        
        <Collapse ghost>
          <Panel header="航班详情" key="details">
            <table className="flight-details">
              <tbody>
                {flight.punctualityRate && (
                  <tr>
                    <td>准点率：</td>
                    <td>
                      <Badge 
                        status={flight.punctualityRate > 80 ? "success" : flight.punctualityRate > 60 ? "warning" : "error"} 
                        text={`${flight.punctualityRate}%`} 
                      />
                    </td>
                  </tr>
                )}
                {flight.tax && (
                  <tr>
                    <td>税费：</td>
                    <td>¥{flight.tax.toFixed(2)}</td>
                  </tr>
                )}
                <tr>
                  <td>出发日期：</td>
                  <td>{flight.fromDate}</td>
                </tr>
                <tr>
                  <td>到达日期：</td>
                  <td>{flight.toDate}</td>
                </tr>
              </tbody>
            </table>
          </Panel>
        </Collapse>
      </Card.Grid>
    );
  };

  if (flights.length === 0) {
    return (
      <Card title="机票信息" className="flight-ticket-card">
        <div className="empty-tickets">
          暂无符合条件的机票信息，请尝试调整查询条件
        </div>
      </Card>
    );
  }

  // 将航班按类型分组
  const directFlights = flights.filter(flight => flight.stops === 0);
  const transferFlights = flights.filter(flight => flight.stops > 0);

  return (
    <Card title="机票信息" className="flight-ticket-card">
      <Tabs defaultActiveKey="all">
        <TabPane tab="全部航班" key="all">
          <Card className="flights-list-card" bordered={false}>
            {flights.map((flight, index) => (
              <div key={`${flight.flightNo}-${index}`} onClick={() => onSelectFlight && onSelectFlight(flight)}>
                {renderFlightPanel(flight)}
              </div>
            ))}
          </Card>
        </TabPane>
        
        <TabPane tab="直飞航班" key="direct">
          <Card className="flights-list-card" bordered={false}>
            {directFlights.length > 0 ? (
              directFlights.map((flight, index) => (
                <div key={`${flight.flightNo}-direct-${index}`} onClick={() => onSelectFlight && onSelectFlight(flight)}>
                  {renderFlightPanel(flight)}
                </div>
              ))
            ) : (
              <div className="empty-tickets">暂无直飞航班</div>
            )}
          </Card>
        </TabPane>
        
        <TabPane tab="中转航班" key="transfer">
          <Card className="flights-list-card" bordered={false}>
            {transferFlights.length > 0 ? (
              transferFlights.map((flight, index) => (
                <div key={`${flight.flightNo}-transfer-${index}`} onClick={() => onSelectFlight && onSelectFlight(flight)}>
                  {renderFlightPanel(flight)}
                </div>
              ))
            ) : (
              <div className="empty-tickets">暂无中转航班</div>
            )}
          </Card>
        </TabPane>
      </Tabs>
    </Card>
  );
};

export default FlightTicketCard; 