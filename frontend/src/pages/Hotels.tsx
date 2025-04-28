import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input, Select, Button, Checkbox, Slider, Card, Rate, Spin, Empty, Pagination, Tag, Row, Col, Space, Divider, Alert, Image } from 'antd';
import { EnvironmentOutlined, SearchOutlined } from '@ant-design/icons';
import hotelAPI, { Hotel, HotelSearchParams } from '../api/hotel';
import './Hotels.css';

const { Option } = Select;
const { Search } = Input;

// 定义价格范围类型
interface PriceRange {
    min: number;
    max: number;
    label: string;
}

// 定义价格范围选项
const PRICE_RANGES: PriceRange[] = [
    { min: 0, max: 300, label: '¥300以下' },
    { min: 301, max: 600, label: '¥301-600' },
    { min: 601, max: 1000, label: '¥601-1000' },
    { min: 1001, max: Infinity, label: '¥1000以上' }
];

const Hotels: React.FC = () => {
    const navigate = useNavigate();
    // 状态管理
    const [hotels, setHotels] = useState<Hotel[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [total, setTotal] = useState<number>(0);
    const [allCities, setAllCities] = useState<string[]>([]);
    const [allTypes, setAllTypes] = useState<string[]>([]);
    const [allFacilities, setAllFacilities] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    
    // 筛选条件状态 - 直接驱动 API 请求
    const [searchParams, setSearchParams] = useState<HotelSearchParams>({ 
        page: 1,
        pageSize: 12,
        sortBy: 'rating',
        sortOrder: 'desc'
    });

    // 本地 UI 筛选状态，用于触发 API 请求更新
    const [keyword, setKeyword] = useState<string>('');
    const [selectedCity, setSelectedCity] = useState<string>('');
    const [selectedType, setSelectedType] = useState<string>('');
    const [selectedPriceRangeIndex, setSelectedPriceRangeIndex] = useState<number>(-1);
    const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
    
    // 获取筛选数据（城市、类型、设施）
    useEffect(() => {
        const fetchFilterData = async () => {
            setError(null);
            try {
                const [citiesResponse, typesResponse, facilitiesResponse] = await Promise.all([
                    hotelAPI.getCities(),
                    hotelAPI.getTypes(),
                    hotelAPI.getFacilities()
                ]);
                
                const parseFilterData = (responseData: any): string[] => {
                    if (Array.isArray(responseData)) {
                        return responseData.map(item => String(item)).filter(Boolean);
                    } else if (responseData && typeof responseData === 'object') {
                        return Object.values(responseData).map(item => String(item)).filter(Boolean);
                    }
                    return [];
                };

                setAllCities(parseFilterData(citiesResponse.data));
                setAllTypes(parseFilterData(typesResponse.data));
                setAllFacilities(parseFilterData(facilitiesResponse.data));

            } catch (err: any) {
                console.error('获取筛选数据失败:', err);
                setError('加载筛选选项失败，请稍后重试。');
                if (allCities.length === 0) setAllCities(['北京', '上海', '杭州', '成都', '三亚', '重庆']);
                if (allTypes.length === 0) setAllTypes(['豪华酒店', '商务酒店', '度假酒店', '经济酒店', '民宿']);
                if (allFacilities.length === 0) setAllFacilities(['免费WiFi', '停车场', '游泳池', '健身中心', '餐厅', 'SPA', '行李寄存', '会议室']);
            }
        };
        
        fetchFilterData();
    }, []);
    
    // 获取酒店数据 - 依赖 searchParams
    useEffect(() => {
        const fetchHotels = async () => {
            setLoading(true);
            setError(null);
            console.log('发送酒店查询请求，参数:', searchParams);
            
            try {
                const response = await hotelAPI.getHotels(searchParams);
                console.log('酒店API响应:', response.data);
                
                let hotelItems: Hotel[] = [];
                let totalHotels = 0;
                
                if (response.data) {
                    const items = response.data.hotels || response.data.items;
                    if (Array.isArray(items)) {
                        hotelItems = items;
                        totalHotels = response.data.total || hotelItems.length;
                    } else if (Array.isArray(response.data)) {
                        hotelItems = response.data;
                        totalHotels = hotelItems.length;
                    } else {
                        console.warn('无法识别的酒店数据格式:', response.data);
                    }
                } else {
                    console.warn('未收到有效的酒店数据');
                }
                
                setHotels(hotelItems);
                setTotal(totalHotels);
                console.log('酒店数据处理完成，获取到', hotelItems.length, '条记录，总数', totalHotels);
                
            } catch (err: any) {
                console.error('获取酒店数据失败:', err);
                setError(`加载酒店列表失败: ${err.message || '未知错误'}`);
                setHotels([]);
                setTotal(0);
            } finally {
                setLoading(false);
            }
        };
        
        fetchHotels();
    }, [searchParams]);

    // 应用筛选条件 - 更新 searchParams 以触发 useEffect
    const applyFilters = () => {
        const newParams: HotelSearchParams = {
            ...searchParams,
            page: 1,
            keyword: keyword || undefined,
            city: selectedCity === 'all' ? undefined : selectedCity,
            type: selectedType === 'all' ? undefined : selectedType,
            facilities: selectedFacilities.length > 0 ? selectedFacilities : undefined,
        };
        if (selectedPriceRangeIndex >= 0) {
            const range = PRICE_RANGES[selectedPriceRangeIndex];
            newParams.priceRange = [range.min, range.max === Infinity ? 999999 : range.max];
        } else {
            delete newParams.priceRange;
        }
        setSearchParams(newParams);
    };

    // 重置筛选条件
    const clearFilters = () => {
        setKeyword('');
        setSelectedCity('all');
        setSelectedType('all');
        setSelectedPriceRangeIndex(-1);
        setSelectedFacilities([]);
        setSearchParams({
            page: 1,
            pageSize: 12,
            sortBy: 'rating',
            sortOrder: 'desc'
        });
    };

    // 处理页码变化
    const handlePageChange = (page: number, pageSize?: number) => {
        setSearchParams(prev => ({ ...prev, page, pageSize: pageSize || prev.pageSize }));
    };

    // 处理排序变化
    const handleSortChange = (value: string) => {
        let sortByValue: 'price' | 'rating' | 'popularity' = 'rating';
        let sortOrderValue: 'asc' | 'desc' = 'desc';

        switch (value) {
            case 'price-asc':
                sortByValue = 'price';
                sortOrderValue = 'asc';
                break;
            case 'price-desc':
                sortByValue = 'price';
                sortOrderValue = 'desc';
                break;
            case 'rating':
            default:
                sortByValue = 'rating';
                sortOrderValue = 'desc';
                break;
        }
        setSearchParams(prev => ({ ...prev, sortBy: sortByValue, sortOrder: sortOrderValue, page: 1 }));
    };
    
    // 切换设施选择 (仅更新本地状态，需要点击"应用筛选"生效)
    const toggleFacility = (facility: string) => {
        setSelectedFacilities(prev => 
            prev.includes(facility) ? prev.filter(f => f !== facility) : [...prev, facility]
        );
    };

    // 提取酒店卡片渲染函数
    const renderHotelCard = (hotel: Hotel) => {
        if (!hotel || !hotel.id) return null;
        
        const BACKEND_BASE_URL = process.env.REACT_APP_API_URL?.replace('/api/v1', '') || 'http://localhost:3001';
        let imageUrl: string | null = null;

        if (hotel.coverImage && typeof hotel.coverImage === 'string') {
            imageUrl = hotel.coverImage.startsWith('http') ? hotel.coverImage : `${BACKEND_BASE_URL}${hotel.coverImage.startsWith('/') ? '' : '/'}${hotel.coverImage}`;
        } 
        else if (hotel.images) {
            let firstImageSrc = '';
            if (Array.isArray(hotel.images) && hotel.images.length > 0 && typeof hotel.images[0] === 'string') {
                firstImageSrc = hotel.images[0];
            } else if (typeof hotel.images === 'string') {
                try {
                    const parsed = JSON.parse(hotel.images);
                    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
                        firstImageSrc = parsed[0];
                    }
                } catch (e) { /* 解析失败，忽略 */ }
            }
            if (firstImageSrc) {
                 imageUrl = firstImageSrc.startsWith('http') ? firstImageSrc : `${BACKEND_BASE_URL}${firstImageSrc.startsWith('/') ? '' : '/'}${firstImageSrc}`;
            }
        }
        
        let displayFacilities: string[] = [];
        const facilitiesSource = hotel.amenities || hotel.facilities;
        if (Array.isArray(facilitiesSource)) {
            displayFacilities = facilitiesSource.slice(0, 3);
        } else if (typeof facilitiesSource === 'string') {
            displayFacilities = facilitiesSource.split(',').map(f => f.trim()).filter(Boolean).slice(0, 3);
        }

        return (
            <Col xs={24} sm={12} md={8} lg={6} key={hotel.id}>
                <Card 
                    hoverable 
                    className="hotel-card" 
                    onClick={() => navigate(`/hotels/${hotel.id}`)}
                    cover={
                        imageUrl ? (
                            <Image 
                                alt={hotel.name}
                                src={imageUrl}
                                className="hotel-card-image" 
                                preview={false}
                                fallback="/images/placeholder.jpg"
                                style={{ height: 200, objectFit: 'cover' }}
                            />
                        ) : (
                            <div className="hotel-card-placeholder" style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0' }}>
                                <img src="https://picx1.zhimg.com/v2-0d3ffd77895a8f4eb7598ae5b52e0bf3_720w.jpg?source=172ae18b" alt="默认酒店图片" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                            </div>
                        )
                    }
                >
                    <Card.Meta
                        title={hotel.name}
                        description={
                            <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                <div className="hotel-card-location">
                                    <EnvironmentOutlined /> {hotel.city} - {hotel.address}
                                </div>
                                <div className="hotel-card-rating">
                                    {hotel.stars && <Rate disabled allowHalf defaultValue={hotel.stars} style={{ fontSize: 14, marginRight: 8 }} />} 
                                    {(hotel.rating || hotel.score) && <Tag color="blue">{Number(hotel.rating || hotel.score).toFixed(1)}分</Tag>}
                                </div>
                                <div className="hotel-card-price">
                                    {hotel.price_range ? (
                                        <Tag color="volcano">{hotel.price_range}</Tag>
                                    ) : hotel.price !== undefined && hotel.price !== null && !isNaN(hotel.price) && hotel.price > 0 ? (
                                        <span style={{ color: '#f5222d', fontWeight: 'bold' }}>¥{Number(hotel.price).toFixed(2)}<span style={{fontSize: '0.8em', color: '#8c8c8c'}}>起</span></span>
                                    ) : (
                                        <Tag>价格待定</Tag>
                                    )}
                                </div>
                                <div className="hotel-card-facilities">
                                    {displayFacilities.map((fac, index) => (
                                        <Tag key={index}>{fac}</Tag>
                                    ))}
                                    {displayFacilities.length > 0 && displayFacilities.length < (Array.isArray(facilitiesSource) ? facilitiesSource.length : (typeof facilitiesSource === 'string' ? facilitiesSource.split(',').length : 0)) && '...'} 
                                </div>
                            </Space>
                        }
                    />
                </Card>
            </Col>
        );
    };

    return (
        <div className="hotels-container">
            <div className="hotels-header">
                <h1>寻找理想住宿</h1>
                <p>多样化的酒店选择，满足您的出行需求</p>
            </div>
            
            <div className="hotels-content">
                <div className="hotels-sidebar">
                    <h3>筛选条件</h3>
                    <Divider style={{ margin: '12px 0'}} />
                    
                    <div className="filter-section">
                        <h4>城市</h4>
                        <Select 
                            value={selectedCity || 'all'}
                            onChange={value => setSelectedCity(value)} 
                            style={{ width: '100%' }}
                        >
                            <Option value="all">所有城市</Option>
                            {allCities.map(city => <Option key={city} value={city}>{city}</Option>)}
                        </Select>
                    </div>
                    
                    <div className="filter-section">
                        <h4>酒店类型</h4>
                        <Select 
                            value={selectedType || 'all'}
                            onChange={value => setSelectedType(value)} 
                            style={{ width: '100%' }}
                        >
                            <Option value="all">所有类型</Option>
                            {allTypes.map(type => <Option key={type} value={type}>{type}</Option>)}
                        </Select>
                    </div>

                    <div className="filter-section">
                        <h4>价格范围</h4>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Button 
                                block 
                                type={selectedPriceRangeIndex === -1 ? 'primary' : 'default'}
                                onClick={() => setSelectedPriceRangeIndex(-1)}
                            >
                                全部
                            </Button>
                            {PRICE_RANGES.map((range, index) => (
                                <Button 
                                    key={index} 
                                    block
                                    type={selectedPriceRangeIndex === index ? 'primary' : 'default'}
                                    onClick={() => setSelectedPriceRangeIndex(index)}
                                >
                                    {range.label}
                                </Button>
                            ))}
                        </Space>
                    </div>

                    <div className="filter-section">
                        <h4>设施服务</h4>
                        <Checkbox.Group 
                            style={{ width: '100%' }} 
                            value={selectedFacilities} 
                            onChange={values => setSelectedFacilities(values as string[])}
                        >
                            <Row gutter={[8, 8]}>
                                {allFacilities.map(facility => (
                                    <Col span={12} key={facility}>
                                        <Checkbox value={facility}>{facility}</Checkbox>
                                    </Col>
                                ))}
                            </Row>
                        </Checkbox.Group>
                    </div>
                    
                    <Divider style={{ margin: '12px 0'}} />
                    <Button type="primary" block onClick={applyFilters} icon={<SearchOutlined />}>应用筛选</Button>
                    <Button block onClick={clearFilters} style={{ marginTop: 8 }}>清除筛选</Button>
                </div>
                
                <div className="hotels-list-area">
                    <div className="hotels-toolbar">
                         <Search
                            placeholder="酒店名称、位置或描述"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            onSearch={applyFilters}
                            style={{ width: 300 }}
                            allowClear
                        />
                        <Space>
                            <span>排序方式:</span>
                            <Select value={searchParams.sortBy === 'price' ? `${searchParams.sortBy}-${searchParams.sortOrder}` : searchParams.sortBy} onChange={handleSortChange} style={{ width: 150 }}>
                                <Option value="rating">评分最高</Option>
                                <Option value="price-asc">价格从低到高</Option>
                                <Option value="price-desc">价格从高到低</Option>
                            </Select>
                        </Space>
                    </div>

                     {error && (
                        <Alert
                            message="加载错误"
                            description={error}
                            type="error"
                            showIcon
                            closable
                            onClose={() => setError(null)}
                            style={{ marginBottom: '20px' }}
                        />
                    )}

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '50px 0' }}><Spin size="large" /></div>
                    ) : hotels.length === 0 && !error ? (
                        <Empty description="未找到符合条件的酒店" style={{ marginTop: 50 }} />
                    ) : (
                        <>
                            <Row gutter={[16, 16]} className="hotel-list-row">
                                {hotels.map(hotel => renderHotelCard(hotel))}
                            </Row>
                            {total > (searchParams.pageSize ?? 12) && (
                                <Pagination
                                    current={searchParams.page}
                                    pageSize={searchParams.pageSize ?? 12}
                                    total={total}
                                    onChange={handlePageChange}
                                    showSizeChanger
                                    style={{ textAlign: 'center', marginTop: 24 }}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Hotels;