import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Input, Select, Radio, Button, Pagination, Tag, Skeleton, Empty, Spin, notification, message, Space } from 'antd';
import { SearchOutlined, EyeOutlined, LikeOutlined, BookOutlined, FilterOutlined, SortAscendingOutlined, PlusOutlined } from '@ant-design/icons';
import strategyAPI, { StrategyType, Strategy, StrategySearchParams, Label } from '../api/strategy';
import { useAuth } from '../context/AuthContext';
import './Strategies.css';

const { Option } = Select;
const { Search } = Input;

// 使用URL搜索参数保持状态的查询字符串钩子
const useQueryParams = () => {
    const { search } = useLocation();
    const navigate = useNavigate();
    const params = new URLSearchParams(search);
    
    const updateParams = useCallback((updates: Record<string, string | null>) => {
        const newParams = new URLSearchParams(search);
        
        Object.entries(updates).forEach(([key, value]) => {
            if (value === null) {
                newParams.delete(key);
            } else {
                newParams.set(key, value);
            }
        });
        
        navigate({ search: newParams.toString() }, { replace: true });
    }, [search, navigate]);
    
    return { params, updateParams };
};

const Strategies: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { params, updateParams } = useQueryParams();
    
    // 从URL参数中获取初始状态
    const initialKeyword = params.get('keyword') || '';
    const initialCity = params.get('city') || '';
    const initialType = params.get('type') || '';
    const initialTag = params.get('tag') || '';
    const initialSortBy = (params.get('sortBy') as 'newest' | 'hottest' | 'mostViewed') || 'newest';
    const initialPage = parseInt(params.get('page') || '1', 10);
    const initialPageSize = parseInt(params.get('pageSize') || '10', 10);
    
    // 状态管理
    const [strategies, setStrategies] = useState<Strategy[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(initialPage);
    const [pageSize, setPageSize] = useState<number>(initialPageSize);
    
    // 筛选条件状态
    const [searchKeyword, setSearchKeyword] = useState<string>(initialKeyword);
    const [selectedCity, setSelectedCity] = useState<string>(initialCity);
    const [selectedType, setSelectedType] = useState<StrategyType | ''>(initialType as StrategyType | '');
    const [selectedTag, setSelectedTag] = useState<string>(initialTag);
    const [sortBy, setSortBy] = useState<'newest' | 'hottest' | 'mostViewed'>(initialSortBy);
    
    // 标签和城市数据
    const [cities, setCities] = useState<Label[]>([]);
    const [tags, setTags] = useState<Label[]>([]);
    const [showFilters, setShowFilters] = useState<boolean>(!!initialCity || !!initialType || !!initialTag);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    
    // 获取攻略列表数据
    const fetchStrategies = useCallback(async () => {
        setLoading(true);
        setIsLoading(true);
        
        try {
            const params: StrategySearchParams = {
                page: currentPage,
                limit: pageSize,
                sortBy,
                keyword: searchKeyword || undefined,
                city: selectedCity || undefined,
                type: selectedType || undefined,
                tag: selectedTag || undefined
            };
            
            console.log('发送攻略请求参数:', params);
            const response = await strategyAPI.getStrategies(params);
            console.log('获取攻略响应数据:', response);
            
            // 改进响应处理逻辑
            if (response) {
                // 记录一下实际收到的数据结构
                const hasItems = Array.isArray(response.items);
                const hasStrategies = Array.isArray(response.strategies);
                console.log('响应数据结构检查:', {
                    hasItems,
                    hasStrategies,
                    totalCount: response.total
                });
                
                if (hasItems && response.items.length > 0) {
                    console.log('使用items字段中的数据');
                    setStrategies(response.items);
                    setTotalCount(response.total || 0);
                } else if (hasStrategies && response.strategies.length > 0) {
                    console.log('使用strategies字段中的数据');
                    setStrategies(response.strategies);
                    setTotalCount(response.total || 0);
                } else {
                    console.error('获取攻略列表失败: 响应中没有有效的数据数组', response);
                    message.error('获取攻略列表失败，没有找到有效数据');
                    setStrategies([]);
                    setTotalCount(0);
                }
            } else {
                console.error('获取攻略列表失败: 响应为空');
                message.error('获取攻略列表失败，服务器无响应');
                setStrategies([]);
                setTotalCount(0);
            }
        } catch (error) {
            console.error('获取攻略列表失败:', error);
            message.error('获取攻略列表失败，请刷新重试');
            setStrategies([]);
            setTotalCount(0);
        } finally {
            setLoading(false);
            setIsLoading(false);
        }
    }, [currentPage, pageSize, sortBy, searchKeyword, selectedCity, selectedType, selectedTag]);
    
    // 获取城市和标签数据
    useEffect(() => {
        const fetchFilterData = async () => {
            try {
                const [citiesData, tagsData] = await Promise.all([
                    strategyAPI.getCities(),
                    strategyAPI.getTags()
                ]);
                setCities(citiesData);
                setTags(tagsData);
            } catch (error) {
                console.error('获取筛选数据失败:', error);
                message.error('获取筛选数据失败，请刷新页面重试');
            }
        };
        
        fetchFilterData();
    }, []);
    
    // 更新URL参数
    useEffect(() => {
        updateParams({
            keyword: searchKeyword || null,
            city: selectedCity || null,
            type: selectedType || null,
            tag: selectedTag || null,
            sortBy,
            page: currentPage.toString(),
            pageSize: pageSize.toString()
        });
    }, [searchKeyword, selectedCity, selectedType, selectedTag, sortBy, currentPage, pageSize, updateParams]);
    
    // 当URL参数变化或组件挂载时获取数据
    useEffect(() => {
        console.log('触发攻略数据获取:', {
            page: currentPage,
            pageSize,
            sortBy,
            keyword: searchKeyword,
            city: selectedCity,
            type: selectedType,
            tag: selectedTag
        });
        fetchStrategies();
    }, [fetchStrategies]);
    
    // 处理搜索
    const handleSearch = (value: string) => {
        setSearchKeyword(value);
        setCurrentPage(1); // 重置页码
    };
    
    // 处理页码变更
    const handlePageChange = (page: number, size?: number) => {
        setCurrentPage(page);
        if (size && size !== pageSize) {
            setPageSize(size);
        }
    };
    
    // 处理筛选条件重置
    const handleResetFilters = () => {
        setSelectedCity('');
        setSelectedType('');
        setSelectedTag('');
        setSearchKeyword('');
        setSortBy('newest');
        setCurrentPage(1);
    };
    
    // 点击攻略卡片导航到详情页
    const navigateToDetail = (id: number | undefined) => {
        if (!id) {
            console.error('导航错误：攻略ID未定义');
            message.error('无法查看攻略详情，ID不存在');
            return;
        }
        console.log('导航到攻略详情页', id);
        navigate(`/strategies/${id}`);
    };
    
    // 导航到创建攻略页面
    const navigateToCreate = () => {
        if (!isAuthenticated) {
            message.warning('请先登录后再发布攻略');
            navigate('/login', { state: { from: '/strategies/create' } });
            return;
        }
        navigate('/strategies/create');
    };
    
    // 格式化日期
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    };
    
    // 格式化数字（超过1000显示为1k, 处理 undefined）
    const formatNumber = (num: number | undefined | null): string => {
        if (num === null || num === undefined) {
            return '0'; // 或者返回 '-' 或 ''
        }
        return num >= 1000 ? (num / 1000).toFixed(1) + 'k' : num.toString();
    };
    
    // 获取攻略类型中文名称 (适配 Enum)
    const getStrategyTypeName = (type: StrategyType | undefined | string): string => {
        if (!type) return '未知类型';
        switch (type) {
            // 使用 Enum 成员
            case StrategyType.ARTICLE:
                return '文章'; // 根据 Enum 值调整显示名称
            case StrategyType.TRAVEL_NOTE:
                return '游记'; // 根据 Enum 值调整显示名称
            // 移除其他不再使用的 case
            default:
                // 尝试从值反向查找 Enum 名称 (如果需要)
                const enumKey = Object.keys(StrategyType).find(key => StrategyType[key as keyof typeof StrategyType] === type);
                return enumKey || type.toString();
        }
    };
    
    return (
        <div className="strategies-container">
            <div className="strategies-header">
                <h1>旅游攻略</h1>
                <p>发现最受欢迎的旅游攻略，规划您的完美旅程</p>
                
                <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    className="create-strategy-btn"
                    onClick={navigateToCreate}
                >
                    发布攻略
                </Button>
            </div>
            
            <div className="strategies-toolbar">
                <div className="search-container">
                    <Search
                        placeholder="搜索攻略标题、城市或内容"
                        allowClear
                        enterButton={<SearchOutlined />}
                        size="large"
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        onSearch={handleSearch}
                        className="strategy-search"
                        loading={isLoading}
                    />
                </div>
                
                <div className="filter-trigger">
                    <Button 
                        type={showFilters ? "primary" : "default"}
                        icon={<FilterOutlined />}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        {showFilters ? '收起筛选' : '展开筛选'}
                    </Button>
                </div>
            </div>
            
            {showFilters && (
                <div className="filter-section">
                    <div className="filter-row">
                        <div className="filter-item">
                            <span className="filter-label">城市:</span>
                            <Select
                                allowClear
                                placeholder="选择城市"
                                style={{ width: '100%' }}
                                value={selectedCity}
                                onChange={(value) => {
                                    setSelectedCity(value);
                                    setCurrentPage(1);
                                }}
                                loading={cities.length === 0}
                                showSearch
                                optionFilterProp="children"
                            >
                                {cities.map(city => (
                                    <Option key={city.id} value={city.name}>{city.name}</Option>
                                ))}
                            </Select>
                        </div>
                        
                        <div className="filter-item">
                            <span className="filter-label">攻略类型:</span>
                            <Select
                                allowClear
                                placeholder="选择类型"
                                style={{ width: '100%' }}
                                value={selectedType}
                                onChange={(value) => {
                                    setSelectedType(value as StrategyType);
                                    setCurrentPage(1);
                                }}
                            >
                                {/* 使用 Object.keys 遍历 Enum */} 
                                {Object.keys(StrategyType).map(key => {
                                     const typeValue = StrategyType[key as keyof typeof StrategyType];
                                     return (
                                         <Option key={key} value={typeValue}>{getStrategyTypeName(typeValue)}</Option>
                                     );
                                })}
                            </Select>
                        </div>
                        
                        <div className="filter-item">
                            <span className="filter-label">标签:</span>
                            <Select
                                allowClear
                                placeholder="选择标签"
                                style={{ width: '100%' }}
                                value={selectedTag}
                                onChange={(value) => {
                                    setSelectedTag(value);
                                    setCurrentPage(1);
                                }}
                                loading={tags.length === 0}
                                showSearch
                                optionFilterProp="children"
                            >
                                {tags.map(tag => (
                                    <Option key={tag.id} value={tag.name}>{tag.name}</Option>
                                ))}
                            </Select>
                        </div>
                    </div>
                    
                    <div className="filter-row">
                        <div className="filter-item">
                            <span className="filter-label">排序:</span>
                            <Radio.Group 
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                optionType="button"
                                buttonStyle="solid"
                            >
                                <Radio.Button value="newest">最新</Radio.Button>
                                <Radio.Button value="hottest">热门</Radio.Button>
                                <Radio.Button value="mostViewed">最多浏览</Radio.Button>
                            </Radio.Group>
                        </div>
                        
                        <div className="filter-actions">
                            <Button onClick={handleResetFilters}>
                                重置筛选
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="strategies-content">
                {loading ? (
                    <div className="strategies-list">
                        {[...Array(5)].map((_, index) => (
                            <div className="strategy-card skeleton" key={index}>
                                <div className="strategy-image">
                                    <Skeleton.Image active style={{ width: '100%', height: '100%' }} />
                                </div>
                                <div className="strategy-content">
                                    <Skeleton active title paragraph={{ rows: 3 }} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : strategies.length === 0 ? (
                    <Empty 
                        description={
                            <>
                                <p>没有找到符合条件的攻略</p>
                                {searchKeyword || selectedCity || selectedType || selectedTag ? (
                                    <Button type="primary" onClick={handleResetFilters}>清除筛选条件</Button>
                                ) : (
                                    <Button type="primary" onClick={navigateToCreate}>立即发布攻略</Button>
                                )}
                            </>
                        }
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        className="no-results"
                    />
                ) : (
                    <>
                        <div className="strategies-list">
                            {strategies.map(strategy => (
                                <div 
                                    className="strategy-card" 
                                    key={strategy.strategy_id || strategy.id}
                                    onClick={() => navigateToDetail(strategy.strategy_id || strategy.id)}
                                >
                                    <div className="strategy-image">
                                        <img 
                                            src={strategy.cover_image || strategy.coverImage}
                                            alt={strategy.title} 
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = 'https://placehold.co/300x200?text=旅游攻略';
                                            }}
                                            loading="lazy"
                                        />
                                        <div className="strategy-type-badge">
                                            {getStrategyTypeName(strategy.type)}
                                        </div>
                                    </div>
                                    
                                    <div className="strategy-content">
                                        <h2 className="strategy-title">{strategy.title}</h2>
                                        
                                        <div className="strategy-meta">
                                            <div className="strategy-author">
                                                {(strategy.author?.avatar || strategy.authorAvatar) && (
                                                    <img 
                                                        src={strategy.author?.avatar || strategy.authorAvatar} 
                                                        alt={strategy.author?.username || strategy.authorName}
                                                        className="author-avatar" 
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.src = 'https://placehold.co/32x32?text=用户';
                                                        }}
                                                    />
                                                )}
                                                <span>{strategy.author?.username || strategy.authorName}</span>
                                            </div>
                                            <span className="strategy-date">{formatDate(strategy.created_at || strategy.createdAt || '')}</span>
                                        </div>
                                        
                                        <p className="strategy-summary">{strategy.summary}</p>
                                        
                                        <div className="strategy-tags">
                                            <Tag color="blue">{strategy.city}</Tag>
                                            {strategy.tags && typeof strategy.tags === 'string' && strategy.tags.split(',').slice(0, 3).map((tag: string, index: number) => (
                                                <Tag key={index}>{tag.trim()}</Tag>
                                            ))}
                                            {strategy.tags && Array.isArray(strategy.tags) && strategy.tags.slice(0, 3).map((tag: string, index: number) => (
                                                <Tag key={index}>{tag}</Tag>
                                            ))}
                                            {strategy.tags && ((typeof strategy.tags === 'string' && strategy.tags.split(',').length > 3) || 
                                                             (Array.isArray(strategy.tags) && strategy.tags.length > 3)) && (
                                                <Tag>...</Tag>
                                            )}
                                        </div>
                                        
                                        <div className="strategy-footer">
                                            <div className="strategy-stats">
                                                <span className="views">
                                                    <EyeOutlined /> {formatNumber(strategy.view_count ?? strategy.viewCount ?? 0)}
                                                </span>
                                                <span className="likes">
                                                    <LikeOutlined /> {formatNumber(strategy.like_count ?? strategy.likeCount ?? 0)}
                                                </span>
                                                <span className="favorites">
                                                    <BookOutlined /> {formatNumber(strategy.favoriteCount ?? 0)}
                                                </span>
                                            </div>
                                            <span className="read-more">阅读更多</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="pagination-container">
                            <Pagination
                                current={currentPage}
                                pageSize={pageSize}
                                total={totalCount}
                                onChange={handlePageChange}
                                showSizeChanger
                                showQuickJumper
                                showTotal={(total) => `共 ${total} 篇攻略`}
                                responsive
                                pageSizeOptions={['5', '10', '20', '50']}
                                disabled={loading}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Strategies; 