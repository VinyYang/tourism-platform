import React, { useState, useEffect } from 'react';
import { Form, Button, DatePicker, Table, Card, message, Spin, Empty, Descriptions, Badge, AutoComplete, Switch, Tooltip } from 'antd';
import moment from 'moment';
import trainTicketAPI, { TrainSearchParams, TrainTicketDetail, TrainSearchResponse } from '../../api/trainTicket';
import stationMap, { StationInfo, getStationCodeByName, searchStations } from '../../data/trainStationMap';
import { InfoCircleOutlined } from '@ant-design/icons';
// import { TrainLineInfo, FlightInfo } from '../../types/transport';
// 从trainTicket API类型中导入，或者在本文件中定义
import CitySelector from '../common/CitySelector';
import './TrainTicketSearch.css';

// 确保这些类型在文件内部定义，避免导入不存在的模块
interface TrainLineInfo {
  train_code: string;      // 车次编号
  from_station: string;    // 出发站
  to_station: string;      // 到达站
  start_time: string;      // 出发时间
  arrive_time: string;     // 到达时间
  duration: string;        // 行程时间
  price: number;           // 价格
}

interface FlightInfo {
  flightNo: string;      // 航班号
  airline: string;       // 航空公司
  departure: string;     // 出发城市
  arrival: string;       // 到达城市
  departureTime: string; // 出发时间
  arrivalTime: string;   // 到达时间
  duration: string;      // 飞行时间
  price: number;         // 价格
}

// 站点代码映射（简单示例，实际应从数据库获取完整映射）
const CITY_TO_STATION_CODE: Record<string, string> = {
  '北京': 'BJP',
  '上海': 'SHH',
  '广州': 'GZQ',
  '深圳': 'SZQ',
  '成都': 'CDW',
  '杭州': 'HZH',
  '武汉': 'WHN',
  '西安': 'XAY',
  '重庆': 'CQW',
  '南京': 'NJH',
  '天津': 'TJP',
  '长沙': 'CSQ',
  '青岛': 'QDK',
  '大连': 'DLT',
  '沈阳': 'SYT',
  '厦门': 'XMS'
};

// 席别状态判断函数
const getTicketStatusBadge = (num: string) => {
  if (num === '--' || num === '') return { status: 'default', text: '无' };
  if (num === '无') return { status: 'error', text: '无票' };
  if (parseInt(num) === 0) return { status: 'error', text: '无票' };
  if (parseInt(num) < 10) return { status: 'warning', text: '紧张' };
  return { status: 'success', text: `${num}张` };
};

interface TrainTicketSearchProps {
  initialFromStation?: string;
  initialToStation?: string;
}

// 主组件 - 使用参数默认值代替defaultProps
const TrainTicketSearch: React.FC<TrainTicketSearchProps> = ({ 
  initialFromStation = undefined, 
  initialToStation = undefined 
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [ticketData, setTicketData] = useState<TrainTicketDetail[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState<TrainSearchParams | null>(null);
  const [useTuniuAPI, setUseTuniuAPI] = useState<boolean>(false);
  
  // 站点搜索选项
  const [fromStationOptions, setFromStationOptions] = useState<{value: string, label: React.ReactNode}[]>([]);
  const [toStationOptions, setToStationOptions] = useState<{value: string, label: React.ReactNode}[]>([]);
  
  // 初始化时加载热门站点选项
  useEffect(() => {
    const hotStations = stationMap.getHotStations();
    const options = hotStations.map(station => ({
      value: station.name,
      label: (
        <div className="station-option">
          <div className="station-name">{station.name}</div>
          <div className="station-code">{station.code}</div>
        </div>
      )
    }));
    
    setFromStationOptions(options);
    setToStationOptions(options);
  }, []);

  // 当初始值改变时，更新表单
  useEffect(() => {    
    if (initialFromStation) {
      form.setFieldsValue({ fromStation: initialFromStation });
    }
    
    if (initialToStation) {
      form.setFieldsValue({ toStation: initialToStation });
    }
  }, [initialFromStation, initialToStation, form]);

  // 自动搜索（当初始站点都有值时）
  useEffect(() => {
    if (initialFromStation && initialToStation) {
      const tomorrow = moment().add(1, 'days');
      
      handleSearch({
        fromStation: initialFromStation,
        toStation: initialToStation,
        trainDate: tomorrow
      });
    }
  }, [initialFromStation, initialToStation]);
  
  // 站点搜索处理函数
  const handleStationSearch = (searchText: string, setter: React.Dispatch<React.SetStateAction<{value: string, label: React.ReactNode}[]>>) => {
    const matchedStations = searchStations(searchText);
    
    const options = matchedStations.map(station => ({
      value: station.name,
      label: (
        <div className="station-option">
          <div className="station-name">{station.name}</div>
          <div className="station-code">{station.code}</div>
        </div>
      )
    }));
    
    setter(options);
  };

  // 格式化价格显示
  const formatPrice = (price: string) => {
    if (price === '--' || !price) return '--';
    try {
      return `¥${parseFloat(price).toFixed(1)}`;
    } catch (e) {
      return price;
    }
  };

  // 处理表单提交
  const handleSearch = async (values: any) => {
    if (!values.trainDate) {
      message.error('请选择乘车日期');
      return;
    }
    
    // 验证站点输入有效性
    const fromStationCode = useTuniuAPI ? values.fromStation : getStationCodeByName(values.fromStation);
    const toStationCode = useTuniuAPI ? values.toStation : getStationCodeByName(values.toStation);
    
    if (!useTuniuAPI) {
      if (!fromStationCode) {
        message.error(`无法识别出发站点: ${values.fromStation}，请从下拉列表中选择有效站点`);
        return;
      }
      
      if (!toStationCode) {
        message.error(`无法识别到达站点: ${values.toStation}，请从下拉列表中选择有效站点`);
        return;
      }
    }

    setLoading(true);
    setError(null);
    
    try {
      // 构建搜索参数
      const searchParams: TrainSearchParams = {
        trainDate: values.trainDate.format('YYYY-MM-DD'),
        fromStation: fromStationCode || values.fromStation, 
        toStation: toStationCode || values.toStation,
        trainCode: values.trainCode || undefined
      };
      
      // 保存原始的站点名称和代码，用于显示
      const displayParams = {
        ...searchParams,
        fromStationName: values.fromStation,
        toStationName: values.toStation,
      };
      
      setSearchParams(displayParams);
      console.log('搜索参数:', searchParams, '使用途牛API:', useTuniuAPI);
      
      // 调用API - 根据选择使用不同的API
      let response: TrainSearchResponse;
      if (useTuniuAPI) {
        response = await trainTicketAPI.searchTrainTicketsWithTuniu(searchParams);
      } else {
        response = await trainTicketAPI.searchTrainTickets(searchParams);
      }
      
      if (response.success && response.data) {
        setTicketData(response.data);
        if (response.data.length === 0) {
          message.info('未找到符合条件的车次，请尝试更换日期或站点');
        }
      } else {
        setError(response.errorMsg || '搜索失败，请稍后重试');
        setTicketData([]);
      }
    } catch (err) {
      console.error('搜索失败:', err);
      setError(err instanceof Error ? err.message : '搜索过程中发生未知错误');
      setTicketData([]);
    } finally {
      setLoading(false);
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '车次',
      dataIndex: 'trainCode',
      key: 'trainCode',
      fixed: 'left' as const,
      width: 90,
      render: (text: string) => <b>{text}</b>
    },
    {
      title: '出发站',
      dataIndex: 'fromStationName',
      key: 'fromStationName',
      width: 100
    },
    {
      title: '到达站',
      dataIndex: 'toStationName',
      key: 'toStationName',
      width: 100
    },
    {
      title: '出发时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 90
    },
    {
      title: '到达时间',
      dataIndex: 'arriveTime',
      key: 'arriveTime',
      width: 90,
      render: (text: string, record: TrainTicketDetail) => (
        <span>
          {text}
          {record.arriveDays !== '0' && <sup style={{ color: '#ff4d4f' }}>+{record.arriveDays}</sup>}
        </span>
      )
    },
    {
      title: '历时',
      dataIndex: 'runTime',
      key: 'runTime',
      width: 90
    },
    {
      title: '商务座',
      dataIndex: 'swzNum',
      key: 'swzNum',
      width: 80,
      render: (text: string, record: TrainTicketDetail) => {
        const status = getTicketStatusBadge(text);
        return (
          <div>
            <Badge status={status.status as any} text={status.text} />
            {record.swzPrice && record.swzPrice !== '--' && <div className="seat-price">{formatPrice(record.swzPrice)}</div>}
          </div>
        );
      }
    },
    {
      title: '一等座',
      dataIndex: 'ydzNum',
      key: 'ydzNum',
      width: 80,
      render: (text: string, record: TrainTicketDetail) => {
        const status = getTicketStatusBadge(text);
        return (
          <div>
            <Badge status={status.status as any} text={status.text} />
            {record.ydzPrice && record.ydzPrice !== '--' && <div className="seat-price">{formatPrice(record.ydzPrice)}</div>}
          </div>
        );
      }
    },
    {
      title: '二等座',
      dataIndex: 'edzNum',
      key: 'edzNum',
      width: 80,
      render: (text: string, record: TrainTicketDetail) => {
        const status = getTicketStatusBadge(text);
        return (
          <div>
            <Badge status={status.status as any} text={status.text} />
            {record.edzPrice && record.edzPrice !== '--' && <div className="seat-price">{formatPrice(record.edzPrice)}</div>}
          </div>
        );
      }
    },
    {
      title: '软卧',
      dataIndex: 'rwNum',
      key: 'rwNum',
      width: 80,
      render: (text: string, record: TrainTicketDetail) => {
        const status = getTicketStatusBadge(text);
        return (
          <div>
            <Badge status={status.status as any} text={status.text} />
            {record.rwPrice && record.rwPrice !== '--' && <div className="seat-price">{formatPrice(record.rwPrice)}</div>}
          </div>
        );
      }
    },
    {
      title: '硬卧',
      dataIndex: 'ywNum',
      key: 'ywNum',
      width: 80,
      render: (text: string, record: TrainTicketDetail) => {
        const status = getTicketStatusBadge(text);
        return (
          <div>
            <Badge status={status.status as any} text={status.text} />
            {record.ywPrice && record.ywPrice !== '--' && <div className="seat-price">{formatPrice(record.ywPrice)}</div>}
          </div>
        );
      }
    },
    {
      title: '硬座',
      dataIndex: 'yzNum',
      key: 'yzNum',
      width: 80,
      render: (text: string, record: TrainTicketDetail) => {
        const status = getTicketStatusBadge(text);
        return (
          <div>
            <Badge status={status.status as any} text={status.text} />
            {record.yzPrice && record.yzPrice !== '--' && <div className="seat-price">{formatPrice(record.yzPrice)}</div>}
          </div>
        );
      }
    },
    {
      title: '无座',
      dataIndex: 'wzNum',
      key: 'wzNum',
      width: 80,
      render: (text: string, record: TrainTicketDetail) => {
        const status = getTicketStatusBadge(text);
        return (
          <div>
            <Badge status={status.status as any} text={status.text} />
            {record.wzPrice && record.wzPrice !== '--' && <div className="seat-price">{formatPrice(record.wzPrice)}</div>}
          </div>
        );
      }
    }
  ];

  // 车票详情展示
  const renderTrainDetails = (record: TrainTicketDetail) => (
    <Descriptions column={4} bordered size="small" className="train-details">
      <Descriptions.Item label="车次" span={1}>{record.trainCode}</Descriptions.Item>
      <Descriptions.Item label="列车运行时间" span={1}>{record.runTime}</Descriptions.Item>
      <Descriptions.Item label="始发站" span={1}>{record.startStationName}</Descriptions.Item>
      <Descriptions.Item label="终点站" span={1}>{record.endStationName}</Descriptions.Item>
      
      <Descriptions.Item label="出发站" span={1}>{record.fromStationName}</Descriptions.Item>
      <Descriptions.Item label="出发时间" span={1}>{record.startTime}</Descriptions.Item>
      <Descriptions.Item label="到达站" span={1}>{record.toStationName}</Descriptions.Item>
      <Descriptions.Item label="到达时间" span={1}>
        {record.arriveTime}
        {record.arriveDays !== '0' && <sup style={{ color: '#ff4d4f' }}> +{record.arriveDays}天</sup>}
      </Descriptions.Item>
      
      <Descriptions.Item label="可否订票" span={2}>
        {record.canBuyNow === 'Y' ? 
          <Badge status="success" text="可预订" /> : 
          <Badge status="error" text="暂不可订" />
        }
      </Descriptions.Item>
      <Descriptions.Item label="二代身份证进出站" span={2}>
        {record.accessByIdcard === 'Y' ? 
          <Badge status="success" text="支持" /> : 
          <Badge status="warning" text="不支持" />
        }
      </Descriptions.Item>
    </Descriptions>
  );

  return (
    <div className="train-ticket-search">
      <Card title="火车票查询" className="search-card">
        <Form
          form={form}
          name="trainSearch"
          onFinish={handleSearch}
          layout="vertical"
          initialValues={{
            trainDate: moment().add(1, 'days'),
            fromStation: initialFromStation,
            toStation: initialToStation
          }}
        >
          <div className="api-selector">
            <Switch 
              checked={useTuniuAPI} 
              onChange={setUseTuniuAPI} 
              checkedChildren="途牛API" 
              unCheckedChildren="标准API" 
            />
            <Tooltip title="切换到途牛API可获取更丰富的列车信息">
              <InfoCircleOutlined style={{ marginLeft: 8 }} />
            </Tooltip>
          </div>
          
          <div className="train-search-form">
            <Form.Item
              name="fromStation"
              label="出发站"
              className="station-form-item"
              rules={[{ required: true, message: '请输入出发站' }]}
            >
              {useTuniuAPI ? (
                <CitySelector
                  placeholder="城市名称，如：北京、上海"
                  style={{ width: '100%' }}
                  mode="autocomplete"
                  level="city"
                />
              ) : (
                <AutoComplete
                  placeholder="车站名称，如：北京西、上海"
                  style={{ width: '100%' }}
                  options={fromStationOptions}
                  onSearch={(text) => handleStationSearch(text, setFromStationOptions)}
                />
              )}
            </Form.Item>

            <Form.Item
              name="toStation"
              label="到达站"
              className="station-form-item"
              rules={[{ required: true, message: '请输入到达站' }]}
            >
              {useTuniuAPI ? (
                <CitySelector
                  placeholder="城市名称，如：北京、上海"
                  style={{ width: '100%' }}
                  mode="autocomplete"
                  level="city"
                />
              ) : (
                <AutoComplete
                  placeholder="车站名称，如：北京西、上海"
                  style={{ width: '100%' }}
                  options={toStationOptions}
                  onSearch={(text) => handleStationSearch(text, setToStationOptions)}
                />
              )}
            </Form.Item>

            <Form.Item 
              label="乘车日期" 
              name="trainDate" 
              initialValue={moment().add(1, 'days')}
              rules={[{ required: true, message: '请选择乘车日期' }]}
              className="date-form-item"
            >
              <DatePicker 
                format="YYYY-MM-DD" 
                disabledDate={(current) => current && current < moment().startOf('day')}
                style={{ width: 150 }}
              />
            </Form.Item>
            
            <Form.Item 
              label="车次" 
              name="trainCode"
              className="train-code-form-item"
            >
              <AutoComplete 
                placeholder="选填，如G101" 
                style={{ width: 120 }}
                allowClear
              />
            </Form.Item>
          </div>
          
          <Form.Item className="search-button-item">
            <Button type="primary" htmlType="submit" loading={loading}>
              查询
            </Button>
          </Form.Item>
        </Form>
        
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}
      </Card>
      
      <div className="search-results">
        {loading ? (
          <div className="loading-container">
            <Spin tip="正在查询车票信息..." />
          </div>
        ) : (
          <>
            {ticketData.length > 0 ? (
              <Card 
                title={searchParams ? `${searchParams.fromStation} → ${searchParams.toStation} (${searchParams.trainDate})` : '查询结果'} 
                className="results-card"
              >
                <Table
                  dataSource={ticketData}
                  columns={columns}
                  rowKey="trainNo"
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: 1100 }}
                  expandable={{
                    expandedRowRender: renderTrainDetails
                  }}
                />
              </Card>
            ) : (
              searchParams && (
                <Empty 
                  description="暂无符合条件的列车" 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TrainTicketSearch; 