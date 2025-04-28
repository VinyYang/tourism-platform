import React, { useState } from 'react';
import { Table, Tag, Button, Select, DatePicker, Input, Form, Row, Col, Card, Tooltip, Space } from 'antd';
import { Train, TrainFilter, TrainSort } from '../api/train';
import dayjs from 'dayjs';
import { SearchOutlined, ClockCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';
import './TrainList.css';

const { Option } = Select;

// 定义组件Props接口
interface TrainListProps {
  trainList: Train[];
  loading: boolean;
  filters?: {
    filter: TrainFilter[];
    sort: TrainSort[];
  };
  onSearch: (values: any) => void;
  onViewDetail?: (train: Train) => void;
}

const TrainList: React.FC<TrainListProps> = ({
  trainList,
  loading,
  filters,
  onSearch,
  onViewDetail
}) => {
  // 状态定义
  const [form] = Form.useForm();
  const [selectedFilters, setSelectedFilters] = useState<Record<string, any>>({});

  // 处理筛选条件变化
  const handleFilterChange = (filterId: string, value: any) => {
    setSelectedFilters({
      ...selectedFilters,
      [filterId]: value
    });
  };

  // 处理搜索表单提交
  const handleSearchSubmit = (values: any) => {
    // 格式化日期
    if (values.departureDate) {
      values.departureDate = dayjs(values.departureDate).format('YYYY-MM-DD');
    }
    onSearch(values);
  };

  // 渲染座位价格和余票信息
  const renderSeatInfo = (prices: Train['prices']) => {
    return (
      <div className="seat-info">
        {prices.map((price, index) => (
          <div key={index} className="seat-row">
            <span className="seat-name">{price.seatName}</span>
            <span className="seat-price">¥{price.price}</span>
            <span className="seat-left">
              {price.leftNumber > 0 ? 
                (price.leftNumber === 99 ? 
                  <Tag color="green">有票</Tag> : 
                  <Tag color="blue">{price.leftNumber}张</Tag>
                ) : 
                <Tag color="red">无票</Tag>
              }
            </span>
          </div>
        ))}
      </div>
    );
  };

  // 表格列定义
  const columns = [
    {
      title: '车次',
      dataIndex: 'trainNum',
      key: 'trainNum',
      render: (text: string, record: Train) => (
        <div>
          <div className="train-number">{text}</div>
          <div className="train-type">{record.trainTypeName}</div>
        </div>
      ),
    },
    {
      title: '出发站',
      dataIndex: 'departStationName',
      key: 'departStationName',
      render: (text: string, record: Train) => (
        <div>
          <div className="station-time">{record.departDepartTime}</div>
          <div className="station-name">{text}</div>
        </div>
      ),
    },
    {
      title: '到达站',
      dataIndex: 'destStationName',
      key: 'destStationName',
      render: (text: string, record: Train) => (
        <div>
          <div className="station-time">{record.destArriveTime}</div>
          <div className="station-name">{text}</div>
        </div>
      ),
    },
    {
      title: '历时',
      dataIndex: 'durationStr',
      key: 'durationStr',
      render: (text: string) => (
        <div className="duration">
          <ClockCircleOutlined /> {text}
        </div>
      ),
    },
    {
      title: '座位票价',
      dataIndex: 'prices',
      key: 'prices',
      render: renderSeatInfo,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Train) => (
        <Button 
          type="primary" 
          onClick={() => onViewDetail && onViewDetail(record)}
        >
          查看详情
        </Button>
      ),
    },
  ];

  return (
    <div className="train-list-container">
      {/* 搜索表单 */}
      <Card className="search-card" title="火车票查询">
        <Form
          form={form}
          name="trainSearch"
          onFinish={handleSearchSubmit}
          layout="horizontal"
          initialValues={{
            departureDate: dayjs(),
          }}
        >
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name="departureCityName"
                rules={[{ required: true, message: '请输入出发城市' }]}
              >
                <Input 
                  prefix={<EnvironmentOutlined />} 
                  placeholder="出发城市" 
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="arrivalCityName"
                rules={[{ required: true, message: '请输入到达城市' }]}
              >
                <Input 
                  prefix={<EnvironmentOutlined />} 
                  placeholder="到达城市" 
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="departureDate"
                rules={[{ required: true, message: '请选择出发日期' }]}
              >
                <DatePicker style={{ width: '100%' }} placeholder="出发日期" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  icon={<SearchOutlined />}
                  loading={loading}
                  block
                >
                  查询
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* 筛选条件 */}
      {filters && filters.filter && filters.filter.length > 0 && (
        <Card className="filter-card" size="small">
          <Row gutter={[16, 8]}>
            {filters.filter.map(filter => (
              <Col key={filter.id} span={6}>
                <div className="filter-item">
                  <span className="filter-label">{filter.name}:</span>
                  <Select
                    style={{ width: '70%' }}
                    placeholder={`选择${filter.name}`}
                    allowClear
                    onChange={(value) => handleFilterChange(filter.id, value)}
                    value={selectedFilters[filter.id]}
                  >
                    {filter.pros.map(pro => (
                      <Option key={pro.id} value={pro.id}>
                        {pro.name}
                      </Option>
                    ))}
                  </Select>
                </div>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* 火车票列表 */}
      <Table
        columns={columns}
        dataSource={trainList}
        rowKey="trainId"
        loading={loading}
        pagination={{ pageSize: 10 }}
        className="train-table"
      />
    </div>
  );
};

export default TrainList; 