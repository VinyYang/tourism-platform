import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Input, Select, Button, Card, Rate, Empty, Pagination, Tag, Row, Col, Skeleton, Alert, Tooltip, Tabs, Collapse, Drawer, Space } from 'antd';
import { SearchOutlined, EnvironmentOutlined, InfoCircleOutlined, HistoryOutlined, GlobalOutlined, CrownOutlined, AppstoreOutlined, BankOutlined, CompassOutlined, FilterOutlined, ReloadOutlined, CloseOutlined } from '@ant-design/icons';
import scenicAPI, { ScenicItem, ScenicSearchParams, ScenicRegionOption } from '../api/scenic';
import './Scenic.css';
import { useTranslation } from 'react-i18next';
import { Typography } from 'antd';
import { StarFilled } from '@ant-design/icons';
import TimeAxisInteractive from '../components/TimeAxisInteractive';
import CulturalFormInteractive from '../components/CulturalFormInteractive';

const { Option } = Select;
const { Search } = Input;
const { TabPane } = Tabs;
const { Panel } = Collapse;

// 添加fallbackImage常量
const fallbackImage = 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&auto=format&fit=crop';

// 文化价值等级定义
enum CulturalValueLevel {
  NATIONAL = 'national',
  PROVINCIAL = 'provincial',
  MUNICIPAL = 'municipal',
  GENERAL = 'general'
}

// 文化价值等级数据
const culturalValueLevels = [
  {
    value: CulturalValueLevel.NATIONAL,
    label: '国家级文化遗产',
    color: '#f5222d'
  },
  {
    value: CulturalValueLevel.PROVINCIAL,
    label: '省级文化遗产',
    color: '#fa8c16'
  },
  {
    value: CulturalValueLevel.MUNICIPAL,
    label: '市级文化遗产',
    color: '#52c41a'
  },
  {
    value: CulturalValueLevel.GENERAL,
    label: '一般文化景点',
    color: '#1890ff'
  }
];

// --- 优化文化旅游筛选维度数据 ---
// 1. 华夏文明演进 (时间轴)
const timeAxisOptions = [
    { value: 'prehistoric', label: '史前文明', icon: <HistoryOutlined />, description: '包括半坡、河姆渡等史前文明遗址' },
    { value: 'ancient', label: '古代文明 (夏商周-明清)', icon: <HistoryOutlined />, description: '从夏商周到明清的古代文明' },
    { value: 'modern', label: '近现代历程 (1840-1949)', icon: <HistoryOutlined />, description: '红色文化、工业遗产等' },
    { value: 'contemporary', label: '当代创新', icon: <HistoryOutlined />, description: '现代艺术、科技文化' },
];

// 2. 地域文化矩阵 (空间轴) - 默认值，将被API数据替换
const defaultRegionOptions = [
    { value: 'guangfu', label: '广府文化', icon: <GlobalOutlined />, description: '岭南特色文化' },
    { value: 'jiangnan', label: '江南文化', icon: <GlobalOutlined />, description: '江南地区特色文化' },
    { value: 'bashu', label: '巴蜀文化', icon: <GlobalOutlined />, description: '四川盆地特色文化' },
    { value: 'guandong', label: '关东文化', icon: <GlobalOutlined />, description: '东北地区特色文化' },
    { value: 'xiyu', label: '西域文化', icon: <GlobalOutlined />, description: '新疆等西北地区特色文化' },
];

// 3. 文化形态体系
const culturalFormOptions = [
    { value: 'material', label: '物质文化遗产', icon: <CrownOutlined />, description: '建筑、遗址、文物等' },
    { value: 'intangible', label: '非物质文化遗产', icon: <CrownOutlined />, description: '技艺、民俗、节庆等' },
];

// 4. 二级主题体系（特色标签）
const secondaryThemes = [
    { value: 'red_culture', label: '红色文化', parentTheme: 'modern', icon: <AppstoreOutlined /> },
    { value: 'religious', label: '宗教文化', parentTheme: 'all', icon: <AppstoreOutlined /> },
    { value: 'food', label: '饮食文化', parentTheme: 'all', icon: <AppstoreOutlined /> },
    { value: 'industrial', label: '工业文明', parentTheme: 'modern', icon: <AppstoreOutlined /> },
    { value: 'literature', label: '文学艺术', parentTheme: 'all', icon: <AppstoreOutlined /> },
];

// 5. 动态主题组合
const dynamicThemes = [
    { 
        value: 'silk_road', 
        label: '海上丝路走廊', 
        description: '整合广府文化、宗教文化和饮食文化的丝路之旅',
        combinations: ['guangfu', 'religious', 'food']
    },
    { 
        value: 'tang_song', 
        label: '唐宋风华之旅', 
        description: '体验唐宋时期的文学、艺术和饮食文化',
        combinations: ['ancient', 'literature', 'food']
    },
    { 
        value: 'guangfu_heritage', 
        label: '广府非遗之旅', 
        description: '探索广府地区的非物质文化遗产',
        combinations: ['guangfu', 'intangible']
    },
];

// --- 结束新增数据 ---

// 辅助函数：根据图标名称字符串获取 Antd Icon 组件
const getIconComponent = (iconName?: string) => {
    if (!iconName) return null;
    // 需要导入所有可能用到的 Antd Icons
    const icons: { [key: string]: React.ComponentType<any> } = {
        HistoryOutlined,
        GlobalOutlined,
        CrownOutlined,
        AppstoreOutlined,
        EnvironmentOutlined,
        InfoCircleOutlined,
        BankOutlined,
        CompassOutlined,
        // ...添加其他可能用到的图标
    };
    const IconComponent = icons[iconName];
    return IconComponent ? <IconComponent /> : null;
};

const Scenic: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();
    
    // 获取URL查询参数
    const urlParams = new URLSearchParams(location.search);
    const urlKeyword = urlParams.get('keyword') || '';
    const urlCity = urlParams.get('city') || '';
    const urlCulturalValueLevel = urlParams.get('culturalValueLevel') || '';
    // --- 获取新筛选参数的 URL 值 (如果需要在 URL 中持久化) ---
    const urlTimeAxis = urlParams.get('timeAxis') || '';
    const urlRegion = urlParams.get('region') || '';
    const urlCulturalForm = urlParams.get('culturalForm') || '';
    const urlSecondaryTheme = urlParams.get('secondaryTheme') || '';
    const urlDynamicTheme = urlParams.get('dynamicTheme') || '';
    
    // 状态管理
    const [scenicSpots, setScenicSpots] = useState<ScenicItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [total, setTotal] = useState<number>(0);
    const [cities, setCities] = useState<string[]>([]);
    const [labels, setLabels] = useState<string[]>([]);
    
    // 修改：地域文化选项状态，使用新的接口类型
    const [culturalRegionOptions, setCulturalRegionOptions] = useState<ScenicRegionOption[]>([]);
    const [regionDataLoading, setRegionDataLoading] = useState<boolean>(true);
    
    // 新增：当前活跃的主维度
    const [activeMainDimension, setActiveMainDimension] = useState<string>('region'); // 默认改为 region
    
    // 搜索和筛选参数
    const [searchParams, setSearchParams] = useState<ScenicSearchParams>({
        page: 1,
        pageSize: 12,
        sortBy: 'popularity',
        sortOrder: 'desc',
        keyword: urlKeyword,
        city: urlCity,
        // 移除文化价值等级
        // culturalValueLevel: urlCulturalValueLevel,
        // --- 初始化新筛选参数状态 ---
        timeAxis: urlTimeAxis,
        region: urlRegion,
        culturalForm: urlCulturalForm,
        secondaryThemes: urlSecondaryTheme,
    });
    
    // 本地搜索状态
    const [keyword, setKeyword] = useState<string>(urlKeyword);
    const [selectedCity, setSelectedCity] = useState<string>(urlCity);
    const [selectedLabel, setSelectedLabel] = useState<string>('');
    const [priceRange, setPriceRange] = useState<[number, number] | null>(null);
    // 移除文化价值等级状态
    // const [selectedValueLevel, setSelectedValueLevel] = useState<string>(urlCulturalValueLevel);

    // --- 添加新的筛选状态 ---
    const [selectedTimeAxis, setSelectedTimeAxis] = useState<string>(urlTimeAxis);
    const [selectedRegion, setSelectedRegion] = useState<string>(urlRegion);
    const [selectedCulturalForm, setSelectedCulturalForm] = useState<string>(urlCulturalForm);
    const [selectedSecondaryTheme, setSelectedSecondaryTheme] = useState<string>(urlSecondaryTheme);
    const [selectedDynamicTheme, setSelectedDynamicTheme] = useState<string>(urlDynamicTheme);

    // 添加高级筛选抽屉状态
    const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
    
    // 添加加载和错误重试状态
    const [isRetrying, setIsRetrying] = useState<boolean>(false);
    const [hasLoadError, setHasLoadError] = useState<boolean>(false);

    // 将数据获取逻辑提取到 useCallback 中
    const loadScenicData = useCallback(async () => {
        setLoading(true);
        setError(null);
        setHasLoadError(false);
        
        // 构造最终传递给 API 的参数
        const currentParams: ScenicSearchParams = {
            ...searchParams,
            timeAxis: selectedTimeAxis || undefined,
            region: selectedRegion || undefined,
            culturalForm: selectedCulturalForm || undefined,
            secondaryThemes: selectedSecondaryTheme || undefined,
            label: selectedLabel || undefined
        };
        // 移除空的参数
        Object.keys(currentParams).forEach(key => {
            if (currentParams[key as keyof ScenicSearchParams] === '' || currentParams[key as keyof ScenicSearchParams] === null || currentParams[key as keyof ScenicSearchParams] === undefined) {
                delete currentParams[key as keyof ScenicSearchParams];
            }
        });

        console.log('[Scenic Page] Fetching scenic spots with params:', currentParams);
        
        try {
            setIsRetrying(true);
            console.log(`[Scenic Page] 开始请求景点数据，目标URL: /scenics, 参数:`, JSON.stringify(currentParams));
            
            // 发起API请求
            const response = await scenicAPI.getScenics(currentParams);
            console.log(`[Scenic Page] 收到API响应:`, response);
            
            // 使用 response.data 访问 API 返回的数据结构
            const responseData = response.data;

            // 检查是否有消息字段，并且内容包含"模拟数据"
            const isMockData = responseData?.message && responseData.message.includes('模拟数据');
            if (isMockData) {
                setError(`注意: ${responseData.message}`);
            }

            // 检查items字段
            if (responseData && Array.isArray(responseData.items)) {
                const scenicData = responseData.items || []; 
                console.log(`[Scenic Page] 成功获取${scenicData.length}条景点数据`);
                setScenicSpots(scenicData);
                // 使用后端返回的 total 值
                setTotal(responseData.total || scenicData.length || 0);
                setHasLoadError(false);
            } else {
                console.warn('[Scenic Page] API响应为空或数据格式不正确:', responseData);
                setScenicSpots([]);
                setTotal(0);
                setHasLoadError(true);
            }
        } catch (error) {
            console.error('[Scenic Page] 获取景点数据失败:', error);
            setHasLoadError(true);
            setError('获取景点数据失败，请稍后重试');
            setScenicSpots([]);
            setTotal(0);
        } finally {
            setLoading(false);
            setIsRetrying(false);
        }
    }, [searchParams, selectedTimeAxis, selectedRegion, selectedCulturalForm, selectedSecondaryTheme, selectedLabel]);

    // 初始化获取筛选条件数据
    useEffect(() => {
        // 先获取筛选条件数据
        const fetchFilterData = async () => {
            try {
                console.log('[Scenic Page] 开始获取筛选条件数据');
                const response = await scenicAPI.getScenicFilters();
                console.log('[Scenic Page] 获取筛选条件成功:', response);
                
                // 确保数据正确
                if (response.data?.data) {
                    const filterData = response.data.data;
                
                    // 设置城市列表
                    if (Array.isArray(filterData.cities)) {
                        setCities(filterData.cities);
                    }
                    
                    // 设置标签列表
                    if (Array.isArray(filterData.labels)) {
                        setLabels(filterData.labels);
                    }
                    
                    // 如果有其他筛选数据，也可以设置
                    // 例如，设置文化区域选项
                    if (Array.isArray(filterData.regionOptions)) {
                        setCulturalRegionOptions(filterData.regionOptions);
                    }
                }
            } catch (error) {
                console.error('[Scenic Page] 获取筛选条件数据失败:', error);
                // 设置默认筛选选项
                setCities(['北京', '上海', '广州', '深圳', '成都', '西安', '杭州', '南京', '武汉', '重庆']);
                setLabels(['历史古迹', '自然风光', '现代建筑', '文化艺术', '休闲娱乐', '博物馆', '公园']);
            } finally {
                setRegionDataLoading(false);
            }
        };
        
        fetchFilterData();
        
        // 同时加载景点数据
        loadScenicData();
    }, [loadScenicData]);

    // 加载景点数据 - 现在调用 loadScenicData
    useEffect(() => {
        loadScenicData();
    }, [loadScenicData]); // useEffect 依赖于 loadScenicData 函数本身

    // 当选择动态主题时应用相应的筛选条件
    useEffect(() => {
        if (selectedDynamicTheme) {
            const theme = dynamicThemes.find(t => t.value === selectedDynamicTheme);
            if (theme) {
                // 根据动态主题的组合设置筛选条件
                theme.combinations.forEach(combo => {
                    const isTimeAxis = timeAxisOptions.some(t => t.value === combo);
                    // 修改：使用 culturalRegionOptions 检查
                    const isRegion = culturalRegionOptions.some(r => r.value === combo);
                    const isCulturalForm = culturalFormOptions.some(c => c.value === combo);
                    const isSecondaryTheme = secondaryThemes.some(s => s.value === combo);
                    
                    if (isTimeAxis) setSelectedTimeAxis(combo);
                    if (isRegion) setSelectedRegion(combo);
                    if (isCulturalForm) setSelectedCulturalForm(combo);
                    if (isSecondaryTheme) setSelectedSecondaryTheme(combo);
                });
            }
        } else {
            // 如果取消选择动态主题，可能需要重置相关筛选？ (根据需求决定)
            // setSelectedTimeAxis('');
            // setSelectedRegion('');
            // ...
        }
        // 依赖项中加入 culturalRegionOptions
    }, [selectedDynamicTheme, culturalRegionOptions]); // 添加依赖

    // 应用筛选条件
    const applyFilters = () => {
        console.log('应用以下筛选条件:');
        console.log('- 关键词:', keyword);
        console.log('- 城市:', selectedCity);
        console.log('- 标签:', selectedLabel);
        // 移除文化价值等级的日志
        // console.log('- 文化价值等级:', selectedValueLevel);
        console.log('- 历史时间轴:', selectedTimeAxis);
        console.log('- 地域文化:', selectedRegion);
        console.log('- 文化形态:', selectedCulturalForm);
        console.log('- 特色标签:', selectedSecondaryTheme);
        
        // 将所有筛选状态更新到searchParams
        setSearchParams({
            ...searchParams,
            page: 1, // 重置到第一页
            keyword: keyword,
            city: selectedCity,
            label: selectedLabel,
            // 移除文化价值等级
            // culturalValueLevel: selectedValueLevel,
            timeAxis: selectedTimeAxis,
            region: selectedRegion,
            culturalForm: selectedCulturalForm,
            secondaryThemes: selectedSecondaryTheme,
        });
        
        // 更新URL查询参数，便于分享和保存筛选状态
        const queryParams = new URLSearchParams();
        if (keyword) queryParams.set('keyword', keyword);
        if (selectedCity) queryParams.set('city', selectedCity);
        if (selectedLabel) queryParams.set('label', selectedLabel);
        // 移除文化价值等级的URL参数
        // if (selectedValueLevel) queryParams.set('culturalValueLevel', selectedValueLevel);
        if (selectedTimeAxis) queryParams.set('timeAxis', selectedTimeAxis);
        if (selectedRegion) queryParams.set('region', selectedRegion);
        if (selectedCulturalForm) queryParams.set('culturalForm', selectedCulturalForm);
        if (selectedSecondaryTheme) queryParams.set('secondaryTheme', selectedSecondaryTheme);
        
        // 更新URL但不刷新页面
        navigate({
            pathname: location.pathname,
            search: queryParams.toString()
        }, { replace: true });
        
        // 加载筛选后的数据
        loadScenicData();
    };

    // 重置筛选条件
    const resetFilters = () => {
        setKeyword('');
        setSelectedCity('');
        setSelectedLabel('');
        setPriceRange(null);
        // 移除文化价值等级重置
        // setSelectedValueLevel('');
        // 重置新增筛选状态
        setSelectedTimeAxis('');
        setSelectedRegion('');
        setSelectedCulturalForm('');
        setSelectedSecondaryTheme('');
        setSelectedDynamicTheme('');
        // 重置 searchParams
        setSearchParams({
            page: 1,
            pageSize: 12,
            sortBy: 'popularity',
            sortOrder: 'desc',
        });
        // 清空 URL 参数 (可选)
        // navigate('/scenic');
    };

    // 处理分页变化
    const handlePageChange = (page: number, pageSize?: number) => {
        setSearchParams(prevParams => ({
            ...prevParams,
            page,
            pageSize: pageSize || prevParams.pageSize
        }));
    };

    // 处理排序变化
    const handleSortChange = (value: string) => {
        let sortBy: 'price' | 'popularity' | 'rating' = 'popularity';
        let sortOrder: 'asc' | 'desc' = 'desc';
        
        switch (value) {
            case 'priceAsc':
                sortBy = 'price';
                sortOrder = 'asc';
                break;
            case 'priceDesc':
                sortBy = 'price';
                sortOrder = 'desc';
                break;
            case 'ratingDesc':
                sortBy = 'rating';
                sortOrder = 'desc';
                break;
            default:
                sortBy = 'popularity';
                sortOrder = 'desc';
        }
        
        setSearchParams({
            ...searchParams,
            sortBy,
            sortOrder
        });
    };

    // --- 新增：处理文化筛选维度的选择 --- 
    const handleTimeAxisChange = (value: string) => {
        setSelectedTimeAxis(value);
        setSelectedDynamicTheme(''); // 取消动态主题选择
    };
    const handleRegionChange = (value: string) => {
        setSelectedRegion(value);
        setSelectedDynamicTheme(''); // 取消动态主题选择
    };
    const handleCulturalFormChange = (value: string) => {
        setSelectedCulturalForm(value);
        setSelectedDynamicTheme(''); // 取消动态主题选择
    };
    const handleSecondaryThemeChange = (value: string) => {
        setSelectedSecondaryTheme(value);
        setSelectedDynamicTheme(''); // 取消动态主题选择
    };

    // 处理价格范围选择
    const handlePriceRangeChange = (value: string) => {
        let range: [number, number] | null = null;
        
        switch (value) {
            case 'free':
                range = [0, 0];
                break;
            case 'cheap':
                range = [1, 50];
                break;
            case 'medium':
                range = [51, 100];
                break;
            case 'expensive':
                range = [101, 500];
                break;
            case 'luxury':
                range = [501, 10000];
                break;
            default:
                range = null;
        }
        
        setPriceRange(range);
    };

    // 处理动态主题选择
    const handleDynamicThemeChange = (value: string) => {
        setSelectedDynamicTheme(value);
        
        // 重置其他筛选器，因为动态主题会覆盖它们
        if (value) {
            setSelectedTimeAxis('');
            setSelectedRegion('');
            setSelectedCulturalForm('');
            setSelectedSecondaryTheme('');
        }
    };
    
    // 渲染景点卡片
    const renderScenicCard = (scenic: ScenicItem) => {
        // 静态演示图片列表，确保始终有可用图片
        const DEMO_IMAGES = [
            'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1546543638-2703f004e5c5?w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1549144511-f099e773c147?w=800&auto=format&fit=crop'
        ];
        
        // 获取景点ID，兼容不同的字段名
        const scenicId = scenic.id || scenic.scenic_id || 0;
        
        // 根据景点ID选择一个固定的演示图片
        const getDemoImage = (id: number): string => {
            const index = id % DEMO_IMAGES.length;
            return DEMO_IMAGES[index];
        };
        
        // 获取后端基础 URL
        const BACKEND_BASE_URL = process.env.REACT_APP_API_URL?.replace('/api/v1', '') || 'http://localhost:3001';
        
        // 处理景点图片URL
        let imageUrl: string = getDemoImage(scenicId); // 使用统一的ID处理
        
        // 处理coverImage (首选)
        if (scenic.coverImage || scenic.cover_image) {
            const coverImg = scenic.coverImage || scenic.cover_image;
            if (coverImg && typeof coverImg === 'string') {
                if (coverImg.startsWith('http')) {
                    imageUrl = coverImg; // 如果是完整URL，直接使用
                } else {
                    // 假设是相对路径，拼接后端基础URL
                    imageUrl = `${BACKEND_BASE_URL}${coverImg.startsWith('/') ? '' : '/'}${coverImg}`;
                }
            }
        }
        // 如果没有coverImage但有images数组，使用第一个图片
        else if (scenic.images) {
            const imagesArray = Array.isArray(scenic.images) ? scenic.images : 
                               (typeof scenic.images === 'string' ? 
                                (scenic.images.startsWith('[') ? 
                                   JSON.parse(scenic.images) : 
                                   scenic.images.split(',')) : 
                                []);
            
            if (imagesArray.length > 0 && imagesArray[0]) {
                const firstImage = imagesArray[0].trim();
                if (firstImage.startsWith('http')) {
                    imageUrl = firstImage; // 如果是完整URL，直接使用
                } else {
                    // 假设是相对路径，拼接后端基础URL
                    imageUrl = `${BACKEND_BASE_URL}${firstImage.startsWith('/') ? '' : '/'}${firstImage}`;
                }
            }
        }
        
        const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
            e.currentTarget.src = fallbackImage;
            e.currentTarget.onerror = null;
        };
        
        // 渲染评分显示
        const scoreDisplay = () => {
            // 添加空值检查或默认值
            const score = scenic.score || scenic.rating || (scenic.hot_score || 0) / 10 || 0;
            return (
                <div className="scenic-score">
                    {score > 0 ? (
                        <>
                            <StarFilled style={{ color: '#fadb14', marginRight: 4 }} />
                            <span>{score.toFixed(1)}</span>
                        </>
                    ) : (
                        <span>暂无评分</span>
                    )}
                </div>
            );
        };
        
        // 渲染标签
        const renderLabels = (labels: string[] | string) => {
            let labelsArray: string[] = [];
            
            if (Array.isArray(labels)) {
                labelsArray = labels;
            } else if (typeof labels === 'string') {
                labelsArray = labels.split(',').map(l => l.trim()).filter(Boolean);
            }
            
            // 确保不渲染太多标签，避免UI拥挤
            const maxLabels = 2;
            const visibleLabels = labelsArray.slice(0, maxLabels);
            const moreLabels = labelsArray.length > maxLabels ? labelsArray.length - maxLabels : 0;
            
            return (
                <div className="scenic-labels">
                    {visibleLabels.map((label, index) => (
                        <Tag key={index} color="blue">{label}</Tag>
                    ))}
                    {moreLabels > 0 && (
                        <Tooltip title={labelsArray.slice(maxLabels).join(', ')}>
                            <Tag>+{moreLabels}个</Tag>
                        </Tooltip>
                    )}
                    {/* 移除文化价值等级标签
                    {scenic.culturalValueLevel && (
                        <Tag color={culturalValueLevels.find(l => l.value === scenic.culturalValueLevel)?.color || 'blue'}>
                            {culturalValueLevels.find(l => l.value === scenic.culturalValueLevel)?.label || scenic.culturalValueLevel}
                        </Tag>
                    )}
                    */}
                </div>
            );
        };
        
        const formatPrice = (price: number | undefined): React.ReactNode => {
            if (price === undefined) return <span className="price-unknown">价格待定</span>;
            if (price === 0) return <span className="price-free">免费</span>;
            return <span className="price">¥{price}</span>;
        };
        
        // 获取价格，兼容不同字段名
        const price = scenic.price || scenic.ticketPrice || scenic.ticket_price;
        
        return (
            <Card 
                hoverable
                className="scenic-card"
                cover={
                    <div className="scenic-card-cover" onClick={() => navigate(`/scenic/${scenicId}`)}>
                        <img 
                            alt={scenic.name} 
                            src={imageUrl} 
                            onError={handleImageError}
                        />
                        {formatPrice(price)}
                    </div>
                }
                onClick={() => navigate(`/scenic/${scenicId}`)}
            >
                <div className="scenic-card-content">
                    <div className="scenic-title-row">
                        <h3 className="scenic-name">{scenic.name}</h3>
                        {scoreDisplay()}
                    </div>
                    <div className="scenic-location">
                        <EnvironmentOutlined /> {scenic.city}{scenic.address ? ` · ${scenic.address}` : ''}
                    </div>
                    {renderLabels(scenic.labels || scenic.label || [])}
                    <div className="scenic-description">
                        {scenic.culturalDescription || scenic.description || `${scenic.name}位于${scenic.city}，是一处著名景点。`}
                    </div>
                </div>
            </Card>
        );
    };
    
    // 渲染筛选器侧边栏
    const renderSidebar = () => (
        <div className="scenic-sidebar">
            {/* 搜索框部分保持不变 */}
            <div className="search-box">
                <Search
                    placeholder={t('请输入景点名称、特色等关键词')}
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onSearch={applyFilters}
                    style={{ width: '100%' }}
                    enterButton
                />
            </div>
            
            {/* 移动版筛选按钮 - 仅在小屏幕显示 */}
            <Button 
                type="primary" 
                className="mobile-filter-button"
                icon={<FilterOutlined />}
                onClick={() => setShowAdvancedFilters(true)}
            >
                筛选选项
            </Button>

            {/* 使用折叠面板组织过滤选项 - 仅在大屏幕显示 */}
            <div className="desktop-filters">
                <Collapse 
                    defaultActiveKey={['city']} 
                    ghost
                    expandIconPosition="end"
                >
                    <Panel header={<h3><EnvironmentOutlined /> 城市筛选</h3>} key="city">
                        <Select
                            placeholder={t('选择城市')}
                            style={{ width: '100%' }}
                            value={selectedCity || undefined}
                            onChange={(value) => setSelectedCity(value)}
                            allowClear
                        >
                            {cities.map((city) => (
                                <Option key={city} value={city}>{city}</Option>
                            ))}
                        </Select>
                    </Panel>
                    
                    {/* 时间轴筛选 - 直接使用TimeAxisInteractive组件 */}
                    <Panel header={<h3><HistoryOutlined /> 历史时间轴</h3>} key="timeAxis">
                        <TimeAxisInteractive 
                            options={timeAxisOptions}
                            value={selectedTimeAxis}
                            onChange={handleTimeAxisChange}
                            title="华夏文明时间轴"
                        />
                    </Panel>
                    
                    {/* 使用标签云展示标签筛选 */}
                    <Panel header={<h3><AppstoreOutlined /> 标签筛选</h3>} key="tags">
                        <div className="tag-cloud">
                            {labels.map((label) => (
                                <Tag.CheckableTag
                                    key={label}
                                    checked={selectedLabel === label}
                                    onChange={(checked) => setSelectedLabel(checked ? label : '')}
                                >
                                    {label}
                                </Tag.CheckableTag>
                            ))}
                        </div>
                    </Panel>
                </Collapse>
            </div>
            
            {/* 过滤操作按钮 */}
            <div className="filter-actions">
                <Button type="primary" onClick={applyFilters} style={{ marginRight: 8 }}>
                    应用筛选
                </Button>
                <Button onClick={resetFilters}>
                    重置
                </Button>
            </div>
        </div>
    );

    // 加载状态骨架屏
    const renderSkeleton = () => (
        <Row gutter={[16, 16]}>
            {[...Array(searchParams.pageSize)].map((_, index) => (
                <Col key={index} xs={24} sm={12} lg={8}>
                    <Card><Skeleton active avatar paragraph={{ rows: 3 }} /></Card>
                </Col>
            ))}
        </Row>
    );
    
    // 手动重试加载数据
    const handleRetry = () => {
        setIsRetrying(true);
        loadScenicData();
    };
    
    // 错误状态显示
    if (error) {
        return (
            <div className="scenic-container">
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={24} md={6} lg={5} xl={4}>
                        {renderSidebar()}
                    </Col>
                    <Col xs={24} sm={24} md={18} lg={19} xl={20}>
                        <Alert
                            message="加载出错"
                            description={<>
                                {error}
                                <br />
                                {hasLoadError && (
                                    <Button 
                                        type="link" 
                                        onClick={handleRetry}
                                        style={{ padding: 0 }} 
                                    >
                                        点击重试
                                    </Button>
                                )}
                            </>}
                            type={hasLoadError ? "error" : "warning"}
                            showIcon
                            style={{ marginBottom: 16 }}
                        />
                    </Col>
                </Row>
            </div>
        );
    }

    // 主渲染逻辑
    return (
        <div className="scenic-page">
            <Row gutter={[24, 24]}>
                {/* 修改侧边栏列宽，提供更好的响应式布局 */}
                <Col xs={24} sm={24} md={8} lg={6} xl={5}>
                    {renderSidebar()}
                </Col>
                
                <Col xs={24} sm={24} md={16} lg={18} xl={19}>
                    <div className="content-area">
                        {/* 添加错误状态和重试机制 */}
                        {error && (
                            <Alert
                                message="加载提示"
                                description={
                                    <div>
                                        {error}
                                        {hasLoadError && (
                                            <Button 
                                                type="primary" 
                                                size="small" 
                                                icon={<ReloadOutlined />} 
                                                loading={isRetrying}
                                                onClick={handleRetry}
                                                style={{ marginLeft: 16 }}
                                            >
                                                重试
                                            </Button>
                                        )}
                                    </div>
                                }
                                type={hasLoadError ? "error" : "warning"}
                                showIcon
                                style={{ marginBottom: 16 }}
                            />
                        )}
                        
                        {/* 景点列表 */}
                        <Row gutter={[16, 16]}>
                            {loading ? (
                                // 使用骨架屏提供更好的加载体验
                                <>{Array(8).fill(null).map((_, index) => (
                                    <Col xs={24} sm={12} md={12} lg={8} xl={6} key={index}>
                                        {renderSkeleton()}
                                    </Col>
                                ))}</>
                            ) : scenicSpots.length > 0 ? (
                                scenicSpots.map((scenic) => (
                                    <Col xs={24} sm={12} md={12} lg={8} xl={6} key={scenic.id}>
                                        {renderScenicCard(scenic)}
                                    </Col>
                                ))
                            ) : (
                                <Col span={24}>
                                    <Empty
                                        description={hasLoadError ? "加载景点数据失败" : "没有找到符合条件的景点"}
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    />
                                </Col>
                            )}
                        </Row>
                        
                        {/* 分页 */}
                        {total > 0 && (
                            <div className="pagination-container">
                                <Pagination
                                    current={searchParams.page || 1}
                                    pageSize={searchParams.pageSize || 12}
                                    total={total}
                                    onChange={handlePageChange}
                                    showTotal={(total) => `共 ${total} 个景点`}
                                />
                            </div>
                        )}
                    </div>
                </Col>
            </Row>
            
            {/* 添加高级筛选抽屉 - 移动端使用 */}
            <Drawer
                title="筛选选项"
                placement="right"
                closable={true}
                onClose={() => setShowAdvancedFilters(false)}
                visible={showAdvancedFilters}
                width={320}
                className="filter-drawer"
                footer={
                    <Space>
                        <Button onClick={() => {
                            resetFilters();
                            setShowAdvancedFilters(false);
                        }}>
                            重置
                        </Button>
                        <Button type="primary" onClick={() => {
                            applyFilters();
                            setShowAdvancedFilters(false);
                        }}>
                            应用筛选
                        </Button>
                    </Space>
                }
            >
                {/* 城市筛选 */}
                <div className="drawer-section">
                    <h3><EnvironmentOutlined /> 城市筛选</h3>
                    <Select
                        placeholder={t('选择城市')}
                        style={{ width: '100%' }}
                        value={selectedCity || undefined}
                        onChange={(value) => setSelectedCity(value)}
                        allowClear
                    >
                        {cities.map((city) => (
                            <Option key={city} value={city}>{city}</Option>
                        ))}
                    </Select>
                </div>
                
                {/* 时间轴筛选 */}
                <div className="drawer-section">
                    <h3><HistoryOutlined /> 历史时间轴</h3>
                    <TimeAxisInteractive 
                        options={timeAxisOptions}
                        value={selectedTimeAxis}
                        onChange={handleTimeAxisChange}
                        title="华夏文明时间轴"
                    />
                </div>
                
                {/* 标签筛选 */}
                <div className="drawer-section">
                    <h3><AppstoreOutlined /> 标签筛选</h3>
                    <div className="tag-cloud">
                        {labels.map((label) => (
                            <Tag.CheckableTag
                                key={label}
                                checked={selectedLabel === label}
                                onChange={(checked) => setSelectedLabel(checked ? label : '')}
                            >
                                {label}
                            </Tag.CheckableTag>
                        ))}
                    </div>
                </div>
            </Drawer>
        </div>
    );
};

export default Scenic; 