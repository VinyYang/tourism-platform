import React, { useState } from 'react';
import { Modal, Input, List, Avatar, Button, Empty, Spin, Row, Col, Card, Space } from 'antd';
import { SearchOutlined, PlusOutlined, EnvironmentOutlined, DollarOutlined } from '@ant-design/icons';
import { ScenicItem } from '../api/scenic';
import CitySelector from './common/CitySelector';

const { Search } = Input;

interface ScenicSelectorProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (scenic: ScenicItem) => void;
    title?: string;
}

/**
 * 景点选择器组件
 * 用于在行程规划中选择景点
 */
const ScenicSelector: React.FC<ScenicSelectorProps> = ({
    visible,
    onClose,
    onSelect,
    title = '选择景点'
}) => {
    const [searchValue, setSearchValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<ScenicItem[]>([]);
    const [searched, setSearched] = useState(false);
    // 添加城市筛选状态
    const [filterCity, setFilterCity] = useState<string>('');

    // 修改搜索景点方法，支持城市筛选
    const handleSearch = async (value: string) => {
        if (!value.trim() && !filterCity) return;
        
        setLoading(true);
        setSearchValue(value);
        setSearched(true);
        
        try {
            // 这里应该调用实际的API，暂时使用模拟数据
            setTimeout(() => {
                // 添加必需的属性到模拟数据
                const mockResults: ScenicItem[] = [
                    {
                        id: 1,
                        name: '故宫博物院',
                        city: '北京',
                        address: '北京市东城区景山前街4号',
                        description: '中国明清两代的皇家宫殿，世界上现存规模最大、保存最为完整的木质结构古建筑之一。',
                        openTime: '8:30-17:00',
                        ticketPrice: 80,
                        images: ['https://placehold.co/300x200?text=故宫'],
                        label: '历史,文化,博物馆',
                        hotScore: 100,
                        coverImage: 'https://placehold.co/300x200?text=故宫',
                        price: 80,
                        score: 4.8,
                        labels: ['历史', '文化', '博物馆']
                    },
                    {
                        id: 2,
                        name: '天安门广场',
                        city: '北京',
                        address: '北京市东城区长安街',
                        description: '世界上最大的城市广场之一，中华人民共和国的象征。',
                        openTime: '全天开放',
                        ticketPrice: 0,
                        images: ['https://placehold.co/300x200?text=天安门广场'],
                        label: '历史,地标',
                        hotScore: 95,
                        coverImage: 'https://placehold.co/300x200?text=天安门广场',
                        price: 0,
                        score: 4.7,
                        labels: ['历史', '地标']
                    },
                    {
                        id: 3,
                        name: '颐和园',
                        city: '北京',
                        address: '北京市海淀区新建宫门路19号',
                        description: '中国清朝时期的皇家园林，是保存最完整的一座皇家行宫御苑。',
                        openTime: '6:30-18:00',
                        ticketPrice: 60,
                        images: ['https://placehold.co/300x200?text=颐和园'],
                        label: '园林,历史,文化',
                        hotScore: 90,
                        coverImage: 'https://placehold.co/300x200?text=颐和园',
                        price: 60,
                        score: 4.9,
                        labels: ['园林', '历史', '文化']
                    },
                    {
                        id: 4,
                        name: '外滩',
                        city: '上海',
                        address: '上海市黄浦区中山东一路',
                        description: '上海的标志性景点，沿黄浦江畔延伸的一条风景线。',
                        openTime: '全天开放',
                        ticketPrice: 0,
                        images: ['https://placehold.co/300x200?text=外滩'],
                        label: '地标,夜景',
                        hotScore: 95,
                        coverImage: 'https://placehold.co/300x200?text=外滩',
                        price: 0,
                        score: 4.8,
                        labels: ['地标', '夜景']
                    },
                    {
                        id: 5,
                        name: '西湖',
                        city: '杭州',
                        address: '浙江省杭州市西湖区',
                        description: '中国最著名的旅游胜地之一，有"人间天堂"的美誉。',
                        openTime: '全天开放',
                        ticketPrice: 0,
                        images: ['https://placehold.co/300x200?text=西湖'],
                        label: '自然,湖泊',
                        hotScore: 98,
                        coverImage: 'https://placehold.co/300x200?text=西湖',
                        price: 0,
                        score: 4.9,
                        labels: ['自然', '湖泊']
                    }
                ];
                
                // 根据搜索条件和城市筛选
                let filteredResults = mockResults;
                
                // 应用城市筛选
                if (filterCity) {
                    filteredResults = filteredResults.filter(item => 
                        item.city === filterCity
                    );
                }
                
                // 应用关键词筛选
                if (value.trim()) {
                    filteredResults = filteredResults.filter(item => 
                        item.name.includes(value) || 
                        item.address.includes(value) ||
                        (item.labels && Array.isArray(item.labels) && 
                         item.labels.some(label => label.includes(value)))
                    );
                }
                
                setResults(filteredResults);
                setLoading(false);
            }, 500);
        } catch (error) {
            console.error('搜索景点失败:', error);
            setLoading(false);
        }
    };

    // 选择景点
    const handleSelect = (scenic: ScenicItem) => {
        onSelect(scenic);
        onClose();
    };

    // 处理城市变更
    const handleCityChange = (city: string) => {
        setFilterCity(city);
        handleSearch(searchValue); // 使用当前搜索词和新城市重新搜索
    };

    return (
        <Modal
            title={title}
            open={visible}
            onCancel={onClose}
            footer={null}
            width={800}
            bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}
        >
            <Space direction="vertical" style={{ width: '100%', marginBottom: '20px' }}>
                <div className="city-filter" style={{ marginBottom: '10px' }}>
                    <CitySelector
                        value={filterCity}
                        onChange={handleCityChange}
                        placeholder="按城市筛选"
                        style={{ width: '100%' }}
                        allowClear
                    />
                </div>
                <Search
                    placeholder="输入景点名称或地址"
                    onSearch={(value) => handleSearch(value)}
                    enterButton={<><SearchOutlined /> 搜索</>}
                    size="large"
                    className="scenic-search-input"
                    loading={loading}
                />
            </Space>
            
            {loading ? (
                <div className="scenic-list-loading">
                    <Spin size="large" tip="搜索中..." />
                </div>
            ) : results.length > 0 ? (
                <Row gutter={[16, 16]} className="scenic-list">
                    {results.map(scenic => (
                        <Col xs={24} sm={12} key={scenic.id}>
                            <Card 
                                hoverable 
                                className="scenic-card"
                                onClick={() => handleSelect(scenic)}
                            >
                                <div className="scenic-card-content">
                                    <div className="scenic-card-image">
                                        <img src={scenic.coverImage} alt={scenic.name} />
                                    </div>
                                    <div className="scenic-card-info">
                                        <h3>{scenic.name}</h3>
                                        <p className="scenic-location">
                                            <EnvironmentOutlined /> {scenic.city} - {scenic.address}
                                        </p>
                                        <p className="scenic-price">
                                            <DollarOutlined /> {
                                                // 修改价格显示逻辑，与主页保持一致
                                                scenic.price === 0 ? '免费' : 
                                                scenic.price ? `¥${scenic.price}` : 
                                                scenic.ticket_price === 0 ? '免费' :
                                                scenic.ticket_price ? `¥${scenic.ticket_price}` : '价格待定'
                                            }
                                        </p>
                                        <div className="scenic-labels">
                                            {scenic.labels && Array.isArray(scenic.labels) ? (scenic.labels as string[]).map((label: string) => (
                                                <span key={label} className="scenic-label">{label}</span>
                                            )) : scenic.labels && typeof scenic.labels === 'string' && scenic.labels ? (
                                                <span className="scenic-label">{scenic.labels}</span>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>
            ) : searched ? (
                <Empty 
                    description="未找到符合条件的景点" 
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    className="scenic-empty-results"
                />
            ) : (
                <div className="scenic-search-tip">
                    <p>请输入关键词搜索景点</p>
                </div>
            )}
            
            <div className="scenic-selector-footer">
                <Button 
                    icon={<PlusOutlined />} 
                    type="dashed" 
                    block
                    onClick={() => handleSelect({
                        id: -1,
                        name: searchValue || '自定义景点',
                        city: '',
                        address: '',
                        description: '自定义添加的景点',
                        openTime: '未知',
                        ticketPrice: 0,
                        images: [],
                        label: '',
                        hotScore: 0,
                        coverImage: '',
                        price: 0,
                        score: 0,
                        labels: []
                    })}
                >
                    添加自定义项目
                </Button>
            </div>
        </Modal>
    );
};

export default ScenicSelector; 