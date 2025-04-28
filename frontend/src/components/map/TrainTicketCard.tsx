import React from 'react';
import { Card, Table, Tabs, Tag, Space, Collapse, Badge, Tooltip } from 'antd';
import { ClockCircleOutlined, EnvironmentOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { TrainLineInfo, TrainSeatInfo } from '../../api/trainTicket';
import './TrainTicketCard.css';

const { TabPane } = Tabs;
const { Panel } = Collapse;

interface TrainTicketCardProps {
  trainLines: TrainLineInfo[];
  onSelectTrain?: (train: TrainLineInfo) => void;
}

const TrainTicketCard: React.FC<TrainTicketCardProps> = ({ trainLines, onSelectTrain }) => {
  // 获取座位类型对应的标签颜色
  const getSeatTypeColor = (seatType: number): string => {
    const colorMap: Record<number, string> = {
      1: 'volcano',  // 商务座
      2: 'gold',     // 特等座
      3: 'orange',   // 一等座
      4: 'lime',     // 二等座
      5: 'green',    // 高级软卧
      6: 'cyan',     // 软卧
      7: 'blue',     // 动卧
      8: 'geekblue', // 硬卧
      9: 'purple',   // 软座
      10: 'magenta', // 硬座
      98: 'default', // 无座
    };
    return colorMap[seatType] || 'default';
  };

  // 获取火车类型对应的标签颜色
  const getTrainTypeColor = (trainType: number): string => {
    const colorMap: Record<number, string> = {
      1: 'red',      // 高铁
      2: 'orange',   // 动车
      3: 'green',    // 直达
      4: 'blue',     // 特快
      5: 'purple',   // 快速
      6: 'default',  // 其他
    };
    return colorMap[trainType] || 'default';
  };

  // 格式化时间
  const formatDuration = (durationStr: string): string => {
    const parts = durationStr.split(':');
    if (parts.length === 2) {
      const hours = parseInt(parts[0]);
      const minutes = parseInt(parts[1]);
      if (hours > 0) {
        return `${hours}小时${minutes > 0 ? ` ${minutes}分钟` : ''}`;
      }
      return `${minutes}分钟`;
    }
    return durationStr;
  };

  // 座位信息列
  const seatColumns = [
    {
      title: '席别',
      dataIndex: 'seatTypeName',
      key: 'seatTypeName',
      render: (text: string, record: TrainSeatInfo) => (
        <Tag color={getSeatTypeColor(record.seatType)}>{text}</Tag>
      )
    },
    {
      title: '票价',
      dataIndex: 'ticketPrice',
      key: 'ticketPrice',
      render: (price: number) => `¥${price.toFixed(2)}`
    },
    {
      title: '余票',
      dataIndex: 'leftTicketNum',
      key: 'leftTicketNum',
      render: (num: number) => (
        num === 0 ? <Badge status="error" text="无票" /> : 
        num < 10 ? <Badge status="warning" text={`${num}张`} /> : 
        <Badge status="success" text={`${num}张`} />
      )
    }
  ];

  // 铺位信息列
  const sleeperColumns = [
    {
      title: '铺位',
      dataIndex: 'sleeperTypeName',
      key: 'sleeperTypeName'
    },
    {
      title: '票价',
      dataIndex: 'ticketPrice',
      key: 'ticketPrice',
      render: (price: number) => `¥${price.toFixed(2)}`
    }
  ];

  if (trainLines.length === 0) {
    return (
      <Card title="火车票信息" className="train-ticket-card">
        <div className="empty-tickets">
          暂无符合条件的火车票信息，请尝试调整查询条件
        </div>
      </Card>
    );
  }

  return (
    <Card title="火车票信息" className="train-ticket-card">
      <Tabs defaultActiveKey="all">
        <TabPane tab="全部车次" key="all">
          {trainLines.map((train, index) => (
            <Card 
              key={`${train.trainCode}-${index}`}
              type="inner" 
              title={
                <Space>
                  <Tag color={getTrainTypeColor(train.trainsType)}>
                    {train.trainsTypeName}
                  </Tag>
                  <span className="train-code">{train.trainCode}</span>
                </Space>
              }
              style={{ marginBottom: 16 }}
              onClick={() => onSelectTrain && onSelectTrain(train)}
            >
              <div className="train-info">
                <div className="time-info">
                  <div className="departure">
                    <div className="time">{train.fromTime}</div>
                    <div className="station">{train.fromStation}</div>
                  </div>
                  <div className="duration">
                    <div className="time">
                      <ClockCircleOutlined /> {formatDuration(train.runTime)}
                    </div>
                    <div className="line">
                      {parseInt(train.arrive_days) > 0 && (
                        <Tooltip title={`${parseInt(train.arrive_days) + 1}天到达`}>
                          <Tag color="processing">+{train.arrive_days}</Tag>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                  <div className="arrival">
                    <div className="time">{train.toTime}</div>
                    <div className="station">{train.toStation}</div>
                  </div>
                </div>
                
                <Collapse ghost>
                  <Panel header="座位信息" key="seats">
                    <Table 
                      dataSource={train.Seats} 
                      columns={seatColumns}
                      rowKey={(record) => `${record.seatType}`}
                      pagination={false}
                      size="small"
                      expandable={{
                        expandedRowRender: record => 
                          record.otherSeats && record.otherSeats.length > 0 ? (
                            <Table 
                              dataSource={record.otherSeats}
                              columns={sleeperColumns}
                              rowKey={(record) => `${record.sleeperType}`}
                              pagination={false}
                              size="small"
                            />
                          ) : null,
                        expandRowByClick: true,
                        expandIcon: ({ expanded, onExpand, record }) => 
                          record.otherSeats && record.otherSeats.length > 0 ? (
                            <InfoCircleOutlined 
                              onClick={e => onExpand(record, e!)}
                              style={{ color: expanded ? '#1890ff' : '#999' }}
                            />
                          ) : null,
                      }}
                    />
                  </Panel>
                </Collapse>
                
                <div className="train-footer">
                  <Space>
                    <EnvironmentOutlined />
                    <span>{train.beginStation} → {train.endStation}</span>
                  </Space>
                </div>
              </div>
            </Card>
          ))}
        </TabPane>
        <TabPane tab="高铁动车" key="highSpeed">
          {trainLines.filter(train => train.trainsType === 1 || train.trainsType === 2).length > 0 ? (
            trainLines
              .filter(train => train.trainsType === 1 || train.trainsType === 2)
              .map((train, index) => (
                <Card 
                  key={`${train.trainCode}-${index}`}
                  type="inner" 
                  title={
                    <Space>
                      <Tag color={getTrainTypeColor(train.trainsType)}>
                        {train.trainsTypeName}
                      </Tag>
                      <span className="train-code">{train.trainCode}</span>
                    </Space>
                  }
                  style={{ marginBottom: 16 }}
                  onClick={() => onSelectTrain && onSelectTrain(train)}
                >
                  <div className="train-info">
                    <div className="time-info">
                      <div className="departure">
                        <div className="time">{train.fromTime}</div>
                        <div className="station">{train.fromStation}</div>
                      </div>
                      <div className="duration">
                        <div className="time">
                          <ClockCircleOutlined /> {formatDuration(train.runTime)}
                        </div>
                        <div className="line">
                          {parseInt(train.arrive_days) > 0 && (
                            <Tooltip title={`${parseInt(train.arrive_days) + 1}天到达`}>
                              <Tag color="processing">+{train.arrive_days}</Tag>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                      <div className="arrival">
                        <div className="time">{train.toTime}</div>
                        <div className="station">{train.toStation}</div>
                      </div>
                    </div>
                    
                    <Collapse ghost>
                      <Panel header="座位信息" key="seats">
                        <Table 
                          dataSource={train.Seats} 
                          columns={seatColumns}
                          rowKey={(record) => `${record.seatType}`}
                          pagination={false}
                          size="small"
                          expandable={{
                            expandedRowRender: record => 
                              record.otherSeats && record.otherSeats.length > 0 ? (
                                <Table 
                                  dataSource={record.otherSeats}
                                  columns={sleeperColumns}
                                  rowKey={(record) => `${record.sleeperType}`}
                                  pagination={false}
                                  size="small"
                                />
                              ) : null,
                            expandRowByClick: true,
                            expandIcon: ({ expanded, onExpand, record }) => 
                              record.otherSeats && record.otherSeats.length > 0 ? (
                                <InfoCircleOutlined 
                                  onClick={e => onExpand(record, e!)}
                                  style={{ color: expanded ? '#1890ff' : '#999' }}
                                />
                              ) : null,
                          }}
                        />
                      </Panel>
                    </Collapse>
                    
                    <div className="train-footer">
                      <Space>
                        <EnvironmentOutlined />
                        <span>{train.beginStation} → {train.endStation}</span>
                      </Space>
                    </div>
                  </div>
                </Card>
              ))
          ) : (
            <div className="empty-tickets">无高铁动车车次</div>
          )}
        </TabPane>
        <TabPane tab="普通车次" key="normal">
          {trainLines.filter(train => train.trainsType > 2).length > 0 ? (
            trainLines
              .filter(train => train.trainsType > 2)
              .map((train, index) => (
                <Card 
                  key={`${train.trainCode}-${index}`}
                  type="inner" 
                  title={
                    <Space>
                      <Tag color={getTrainTypeColor(train.trainsType)}>
                        {train.trainsTypeName}
                      </Tag>
                      <span className="train-code">{train.trainCode}</span>
                    </Space>
                  }
                  style={{ marginBottom: 16 }}
                  onClick={() => onSelectTrain && onSelectTrain(train)}
                >
                  <div className="train-info">
                    <div className="time-info">
                      <div className="departure">
                        <div className="time">{train.fromTime}</div>
                        <div className="station">{train.fromStation}</div>
                      </div>
                      <div className="duration">
                        <div className="time">
                          <ClockCircleOutlined /> {formatDuration(train.runTime)}
                        </div>
                        <div className="line">
                          {parseInt(train.arrive_days) > 0 && (
                            <Tooltip title={`${parseInt(train.arrive_days) + 1}天到达`}>
                              <Tag color="processing">+{train.arrive_days}</Tag>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                      <div className="arrival">
                        <div className="time">{train.toTime}</div>
                        <div className="station">{train.toStation}</div>
                      </div>
                    </div>
                    
                    <Collapse ghost>
                      <Panel header="座位信息" key="seats">
                        <Table 
                          dataSource={train.Seats} 
                          columns={seatColumns}
                          rowKey={(record) => `${record.seatType}`}
                          pagination={false}
                          size="small"
                          expandable={{
                            expandedRowRender: record => 
                              record.otherSeats && record.otherSeats.length > 0 ? (
                                <Table 
                                  dataSource={record.otherSeats}
                                  columns={sleeperColumns}
                                  rowKey={(record) => `${record.sleeperType}`}
                                  pagination={false}
                                  size="small"
                                />
                              ) : null,
                            expandRowByClick: true,
                            expandIcon: ({ expanded, onExpand, record }) => 
                              record.otherSeats && record.otherSeats.length > 0 ? (
                                <InfoCircleOutlined 
                                  onClick={e => onExpand(record, e!)}
                                  style={{ color: expanded ? '#1890ff' : '#999' }}
                                />
                              ) : null,
                          }}
                        />
                      </Panel>
                    </Collapse>
                    
                    <div className="train-footer">
                      <Space>
                        <EnvironmentOutlined />
                        <span>{train.beginStation} → {train.endStation}</span>
                      </Space>
                    </div>
                  </div>
                </Card>
              ))
          ) : (
            <div className="empty-tickets">无普通车次</div>
          )}
        </TabPane>
      </Tabs>
    </Card>
  );
};

export default TrainTicketCard; 