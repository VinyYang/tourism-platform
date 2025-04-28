import React, { useState, useEffect } from 'react';
import { Card, Tabs, Table, Spin, Typography, Select, Row, Col, Statistic, Space } from 'antd';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import scenicAPI from '../api/scenic';
import hotelAPI from '../api/hotel';
import { RiseOutlined, DollarOutlined } from '@ant-design/icons';
import './PriceReport.css';

const { Title, Paragraph } = Typography;
const { Option } = Select;

interface ScenicPrice {
  name: string;
  price: number;
  city: string;
  type: string;
}

interface HotelPrice {
  name: string;
  avg_price: number;
  city: string;
  stars: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const PriceReport: React.FC = () => {
  const [scenicData, setScenicData] = useState<ScenicPrice[]>([]);
  const [hotelData, setHotelData] = useState<HotelPrice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [starsFilter, setStarsFilter] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [scenicResponse, hotelResponse] = await Promise.all([
          scenicAPI.getScenics(),
          hotelAPI.getAllHotels(),
        ]);

        const scenics = (scenicResponse.data?.items || []).map((scenic: any) => ({
          name: scenic.name,
          price: parseFloat(scenic.price || scenic.ticketPrice || 0),
          city: scenic.city,
          type: scenic.type || scenic.label || '未分类'
        })).filter((item: { name: string; price: number; city: string; type: string }) => !isNaN(item.price));

        const hotels = (hotelResponse.data?.items || hotelResponse.data?.hotels || []).map((hotel: any) => ({
          name: hotel.name,
          avg_price: parseFloat(hotel.avg_price || hotel.price || 0),
          city: hotel.city,
          stars: hotel.stars || 0
        })).filter(item => !isNaN(item.avg_price));

        setScenicData(scenics);
        setHotelData(hotels);
      } catch (error) {
        console.error('Error fetching price data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 计算统计数据
  const getStatistics = (data: ScenicPrice[] | HotelPrice[]) => {
    if (data.length === 0) return { avg: 0, max: 0, min: 0 };
    
    const prices = data.map(item => {
      const price = 'price' in item ? item.price : item.avg_price;
      return isNaN(price) ? 0 : price;
    }).filter(price => price > 0);
    
    if (prices.length === 0) return { avg: 0, max: 0, min: 0 };
    
    const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const max = Math.max(...prices);
    const min = Math.min(...prices);
    
    return { avg: avg.toFixed(2), max, min };
  };

  const scenicStats = getStatistics(scenicData);
  const hotelStats = getStatistics(hotelData);

  // 按城市分组的数据
  const groupByCity = (data: ScenicPrice[] | HotelPrice[]) => {
    const result: any[] = [];
    const cityMap = new Map();

    data.forEach(item => {
      const price = 'price' in item ? item.price : item.avg_price;
      if (isNaN(price) || price <= 0) return;
      
      if (cityMap.has(item.city)) {
        cityMap.set(item.city, {
          count: cityMap.get(item.city).count + 1,
          total: cityMap.get(item.city).total + price
        });
      } else {
        cityMap.set(item.city, { count: 1, total: price });
      }
    });

    cityMap.forEach((value, key) => {
      result.push({
        city: key,
        avgPrice: (value.total / value.count).toFixed(2),
        count: value.count
      });
    });

    return result;
  };

  const scenicColumns = [
    { title: '景点名称', dataIndex: 'name', key: 'name' },
    { title: '所在城市', dataIndex: 'city', key: 'city' },
    { title: '类型', dataIndex: 'type', key: 'type' },
    { title: '价格 (¥)', dataIndex: 'price', key: 'price', sorter: (a: any, b: any) => a.price - b.price },
  ];

  const hotelColumns = [
    { title: '酒店名称', dataIndex: 'name', key: 'name' },
    { title: '所在城市', dataIndex: 'city', key: 'city' },
    { title: '星级', dataIndex: 'stars', key: 'stars', render: (stars: number) => '⭐'.repeat(stars) },
    { title: '平均价格 (¥)', dataIndex: 'avg_price', key: 'avg_price', sorter: (a: any, b: any) => a.avg_price - b.avg_price },
  ];

  // 筛选数据
  const filteredScenicData = scenicData.filter(item => {
    return (cityFilter === 'all' || item.city === cityFilter) && 
           (typeFilter === 'all' || item.type === typeFilter);
  });

  const filteredHotelData = hotelData.filter(item => {
    return (cityFilter === 'all' || item.city === cityFilter) && 
           (starsFilter === null || item.stars === starsFilter);
  });

  // 获取所有可用的城市选项
  const cities = Array.from(new Set([...scenicData.map(item => item.city), ...hotelData.map(item => item.city)]));
  const scenicTypes = Array.from(new Set(scenicData.map(item => item.type)));

  return (
    <div className="price-report-container">
      <Title level={2}>旅游价格分析报告</Title>
      <Paragraph className="report-intro">
        本报告分析了系统中所有景点和酒店的价格数据，提供价格对比和分布情况，帮助您做出更明智的旅行决策。
      </Paragraph>

      {loading ? (
        <div className="loading-container">
          <Spin size="large" />
          <p>正在加载价格数据...</p>
        </div>
      ) : (
        <Tabs defaultActiveKey="1" items={[
          {
            key: '1',
            label: '总览',
            children: (
              <>
                <Row gutter={24} className="stats-row">
                  <Col span={6}>
                    <Card>
                      <Statistic 
                        title="平均景点价格" 
                        value={scenicStats.avg} 
                        prefix={<DollarOutlined />} 
                        suffix="元"
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic 
                        title="平均酒店价格" 
                        value={hotelStats.avg} 
                        prefix={<DollarOutlined />} 
                        suffix="元"
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic 
                        title="最贵景点" 
                        value={scenicStats.max} 
                        prefix={<RiseOutlined />} 
                        suffix="元"
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic 
                        title="最贵酒店" 
                        value={hotelStats.max} 
                        prefix={<RiseOutlined />} 
                        suffix="元"
                      />
                    </Card>
                  </Col>
                </Row>

                <Row gutter={24} className="chart-row">
                  <Col span={12}>
                    <Card title="各城市景点平均价格">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={groupByCity(scenicData)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="city" />
                          <YAxis />
                          <Tooltip formatter={(value: number) => [`${value} 元`, '平均价格']} />
                          <Legend />
                          <Bar dataKey="avgPrice" fill="#8884d8" name="平均价格" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card title="各城市酒店平均价格">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={groupByCity(hotelData)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="city" />
                          <YAxis />
                          <Tooltip formatter={(value: number) => [`${value} 元`, '平均价格']} />
                          <Legend />
                          <Bar dataKey="avgPrice" fill="#82ca9d" name="平均价格" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Card>
                  </Col>
                </Row>
              </>
            )
          },
          {
            key: '2',
            label: '景点价格',
            children: (
              <>
                <Space className="filter-container">
                  <Select 
                    placeholder="选择城市" 
                    style={{ width: 150 }} 
                    onChange={(value) => setCityFilter(value)}
                    defaultValue="all"
                  >
                    <Option value="all">所有城市</Option>
                    {cities.map(city => (
                      <Option key={city} value={city}>{city}</Option>
                    ))}
                  </Select>
                  <Select 
                    placeholder="选择类型" 
                    style={{ width: 150 }} 
                    onChange={(value) => setTypeFilter(value)}
                    defaultValue="all"
                  >
                    <Option value="all">所有类型</Option>
                    {scenicTypes.map(type => (
                      <Option key={type} value={type}>{type}</Option>
                    ))}
                  </Select>
                </Space>

                <Row gutter={24} className="chart-row">
                  <Col span={12}>
                    <Card title="景点价格分布">
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={filteredScenicData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="price"
                            nameKey="name"
                            label={({ name, percent }: { name: string; percent: number }) => 
                              `${name}: ${(percent * 100).toFixed(0)}%`
                            }
                          >
                            {filteredScenicData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => [`${value} 元`, '价格']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card title="景点价格趋势">
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart
                          data={filteredScenicData.sort((a, b) => a.price - b.price)}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value: number) => [`${value} 元`, '价格']} />
                          <Area type="monotone" dataKey="price" stroke="#8884d8" fill="#8884d8" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Card>
                  </Col>
                </Row>

                <Card title="景点价格数据表" className="data-table">
                  <Table 
                    columns={scenicColumns} 
                    dataSource={filteredScenicData.map((item, index) => ({ ...item, key: index }))} 
                    pagination={{ pageSize: 10 }}
                  />
                </Card>
              </>
            )
          },
          {
            key: '3',
            label: '酒店价格',
            children: (
              <>
                <Space className="filter-container">
                  <Select 
                    placeholder="选择城市" 
                    style={{ width: 150 }} 
                    onChange={(value) => setCityFilter(value)}
                    defaultValue="all"
                  >
                    <Option value="all">所有城市</Option>
                    {cities.map(city => (
                      <Option key={city} value={city}>{city}</Option>
                    ))}
                  </Select>
                  <Select 
                    placeholder="选择星级" 
                    style={{ width: 150 }} 
                    onChange={(value) => setStarsFilter(value)}
                    defaultValue={null}
                  >
                    <Option value={null}>所有星级</Option>
                    {[1, 2, 3, 4, 5].map(star => (
                      <Option key={star} value={star}>{star} 星</Option>
                    ))}
                  </Select>
                </Space>

                <Row gutter={24} className="chart-row">
                  <Col span={12}>
                    <Card title="酒店价格分布">
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={filteredHotelData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#82ca9d"
                            dataKey="avg_price"
                            nameKey="name"
                            label={({ name, percent }: { name: string; percent: number }) => 
                              `${name}: ${(percent * 100).toFixed(0)}%`
                            }
                          >
                            {filteredHotelData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => [`${value} 元`, '平均价格']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card title="酒店价格趋势">
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart
                          data={filteredHotelData.sort((a, b) => a.avg_price - b.avg_price)}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value: number) => [`${value} 元`, '平均价格']} />
                          <Area type="monotone" dataKey="avg_price" stroke="#82ca9d" fill="#82ca9d" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Card>
                  </Col>
                </Row>

                <Card title="酒店价格数据表" className="data-table">
                  <Table 
                    columns={hotelColumns} 
                    dataSource={filteredHotelData.map((item, index) => ({ ...item, key: index }))} 
                    pagination={{ pageSize: 10 }}
                  />
                </Card>
              </>
            )
          }
        ]} />
      )}
    </div>
  );
};

export default PriceReport;
