import React from 'react';
import { Typography, Divider, Card, Row, Col, Alert } from 'antd';
import TrainTicketSearch from '../components/transport/TrainTicketSearch';
import './TrainTicket.css';

const { Title, Paragraph } = Typography;

const TrainTicket: React.FC = () => {
  return (
    <div className="train-ticket-page">
      <Typography className="page-header">
        <Title level={2}>火车票查询</Title>
        <Paragraph>
          查询全国各地的火车票信息，包括高铁、动车、普通列车等，为您的出行提供便利。
        </Paragraph>
      </Typography>

      <Divider />

      <TrainTicketSearch />

      <Row gutter={[16, 16]} className="info-section">
        <Col xs={24} md={12}>
          <Card title="使用说明" className="info-card">
            <Paragraph>
              <strong>1. 车站代码查询：</strong> 输入城市名称拼音首字母或简码，如北京(BJH)、上海(SHH)等。
            </Paragraph>
            <Paragraph>
              <strong>2. 乘车日期：</strong> 选择您计划出行的日期，可查询未来15天内的车票信息。
            </Paragraph>
            <Paragraph>
              <strong>3. 车次查询：</strong> 如果您只想查询特定车次，可以在车次输入框中填写，如G123。
            </Paragraph>
            <Paragraph>
              <strong>4. 席别说明：</strong> 查询结果会显示各类型座位的余票情况和价格，点击行可展开更多详情。
            </Paragraph>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="温馨提示" className="info-card">
            <Alert
              message="数据来源说明"
              description="本系统提供的车票信息仅供参考，请以铁路官方售票系统为准。实际购票请前往12306官网或车站窗口。"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Alert
              message="出行建议"
              description="请提前购票，特别是节假日期间。建议您关注列车时刻变更，并留足候车时间。"
              type="warning"
              showIcon
            />
          </Card>
        </Col>
      </Row>

      <Card title="热门路线" className="popular-routes-card">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <div className="route-item">
              <div className="route-cities">北京 → 上海</div>
              <div className="route-info">高铁2小时，普通列车16小时</div>
            </div>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <div className="route-item">
              <div className="route-cities">广州 → 深圳</div>
              <div className="route-info">高铁30分钟，普通列车1.5小时</div>
            </div>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <div className="route-item">
              <div className="route-cities">上海 → 杭州</div>
              <div className="route-info">高铁1小时，普通列车3小时</div>
            </div>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <div className="route-item">
              <div className="route-cities">北京 → 天津</div>
              <div className="route-info">高铁30分钟，普通列车2小时</div>
            </div>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <div className="route-item">
              <div className="route-cities">武汉 → 长沙</div>
              <div className="route-info">高铁1.5小时，普通列车5小时</div>
            </div>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <div className="route-item">
              <div className="route-cities">成都 → 重庆</div>
              <div className="route-info">高铁1.5小时，普通列车4小时</div>
            </div>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <div className="route-item">
              <div className="route-cities">西安 → 洛阳</div>
              <div className="route-info">高铁1.5小时，普通列车5小时</div>
            </div>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <div className="route-item">
              <div className="route-cities">南京 → 苏州</div>
              <div className="route-info">高铁1小时，普通列车2.5小时</div>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default TrainTicket; 