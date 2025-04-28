import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    Row, Col, Card, Button, Tabs, Input, Select, 
    Empty, Spin, Pagination, Popconfirm, message, Tag, Tooltip, Typography, Divider, Modal, Space, List
} from 'antd';
import { 
    PlusOutlined, SearchOutlined, EditOutlined, 
    DeleteOutlined, ShareAltOutlined, CopyOutlined, 
    CalendarOutlined, EyeOutlined, EnvironmentOutlined,
    BankOutlined, CompassOutlined, GlobalOutlined,
    ClockCircleOutlined, FireOutlined, RightOutlined,
    UserOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import itineraryAPI, { Itinerary, ItinerarySearchParams, ItineraryItem, ItinerarySearchResponse } from '../api/itinerary';
import RouteMapModal from '../components/map/RouteMapModal';
import './Itineraries.css';
import dayjs from 'dayjs';
import featuredRouteAPI, { ApiFeaturedRoute, ApiFeaturedRouteListItem, ApiRouteSpotInfo } from '../api/featuredRoute';
import RouteMap, { Spot } from '../components/map/RouteMap'; // 导入组件和 Spot 类型

// 添加自定义样式
const mapModalStyle = `
.map-modal .ant-modal-body {
  height: 650px !important;
  padding: 0 !important;
  overflow: hidden !important;
}

.map-modal .route-map-container {
  height: 100% !important;
  width: 100% !important;
  position: relative !important;
}

.map-modal .amap-container {
  height: 100% !important;
  width: 100% !important;
  position: relative !important;
}

.amap-logo {
  right: 0 !important;
  left: auto !important;
}

.amap-copyright {
  right: 70px !important;
  left: auto !important;
}
`;

// Utility function to calculate days from dates
const calculateDays = (startDate?: string | null | undefined, endDate?: string | null | undefined): number => {
    if (!startDate || !endDate) return 0;
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    if (!start.isValid() || !end.isValid() || end.isBefore(start)) return 0;
    return end.diff(start, 'day') + 1;
};

// 为知名景点提供默认坐标映射
const DEFAULT_LOCATIONS: Record<string, [number, number]> = {
  // 北京景点
  "鸟巢 (国家体育场)": [116.3972, 39.9939],
  "水立方 (国家游泳中心)": [116.3903, 39.9931],
  "南锣鼓巷": [116.4037, 39.9359],
  "故宫": [116.3972, 39.9163],
  "天安门": [116.3949, 39.9057],
  "颐和园": [116.2758, 39.9997],
  "圆明园": [116.3079, 40.0067],
  "长城": [116.0169, 40.3213],
  "天坛": [116.4122, 39.8808],
  
  // 上海景点
  "外滩": [121.4902, 31.2392],
  "东方明珠": [121.4997, 31.2396],
  "上海迪士尼": [121.6667, 31.1444],
  "豫园": [121.4927, 31.2276],
  "南京路": [121.4769, 31.2367],
  
  // 其他城市景点
  "西湖": [120.1438, 30.2365],
  "黄山": [118.1683, 30.1343],
  "桂林山水": [110.2866, 25.2788],
  "兵马俑": [109.2784, 34.3835],
  "长江三峡": [110.8464, 30.9599],
  "张家界": [110.5449, 29.3468],
  "九寨沟": [103.9156, 33.1903],
  "乐山大佛": [103.7706, 29.5693],
  "泰山": [117.1207, 36.2631],
  "布达拉宫": [91.1175, 29.6569],
  "敦煌莫高窟": [94.8178, 40.1437],
};

// 通过名称模糊匹配获取默认坐标
const getDefaultLocationByName = (name: string): [number, number] | null => {
  // 1. 直接匹配
  if (name in DEFAULT_LOCATIONS) {
    console.log(`为景点"${name}"找到精确默认坐标`);
    return DEFAULT_LOCATIONS[name];
  }
  
  // 2. 模糊匹配 - 查找名称中包含关键词的景点
  for (const [key, location] of Object.entries(DEFAULT_LOCATIONS)) {
    if (name.includes(key) || key.includes(name)) {
      console.log(`为景点"${name}"找到模糊匹配的默认坐标(匹配"${key}")`);
      return location;
    }
  }
  
  // 3. 关键词匹配
  const keywords = name.split(/\s+|[,，、(（)）]/);
  for (const keyword of keywords) {
    if (keyword.length > 1) { // 只匹配长度>1的关键词，避免匹配单个字符
      for (const [key, location] of Object.entries(DEFAULT_LOCATIONS)) {
        if (key.includes(keyword)) {
          console.log(`为景点"${name}"通过关键词"${keyword}"找到默认坐标(匹配"${key}")`);
          return location;
        }
      }
    }
  }
  
  // 没有找到匹配
  return null;
};

// 改进transformSpotsForMap函数，确保正确处理location数据
const transformSpotsForMap = (spots: ApiRouteSpotInfo[] | undefined): Spot[] => {
  console.log('==== 转换地图数据开始 ====');
  console.log('原始数据:', spots);
  
  // 先检查数据是否为空或无效
  if (!spots || !Array.isArray(spots) || spots.length === 0) {
    console.error('传入的spots数据无效:', spots);
    return [];
  }
  
  const result: Spot[] = [];
  
  spots.forEach((spot, index) => {
    if (!spot) {
      console.warn(`景点${index}缺失核心信息`);
      return;
    }
    const scenicSpot = spot.scenicSpot || {};
    // 优先 scenicSpot 字段
    const name = scenicSpot.name || spot.name || `未命名景点`;
    const description = scenicSpot.description || spot.description || '无描述';
    // 初始化location变量
    let location: [number, number] | null = null;
    if (scenicSpot.location && Array.isArray(scenicSpot.location) && scenicSpot.location.length === 2) {
      location = scenicSpot.location;
    } else if (spot.latitude && spot.longitude) {
      location = [Number(spot.longitude), Number(spot.latitude)];
    } else if (scenicSpot.latitude && scenicSpot.longitude) {
      location = [Number(scenicSpot.longitude), Number(scenicSpot.latitude)];
    }
    const spotObj: Spot = {
      id: spot.spot_id || index,
      name,
      description,
      location,
      order_number: spot.order_number || index + 1,
      scenicSpot: scenicSpot // 保留完整的scenicSpot对象以供其他组件使用
    };
    result.push(spotObj);
  });
  
  console.log('转换后的数据:', result);
  return result;
};

// 辅助函数：检查是否有有效的坐标
const hasValidCoordinates = (lat: any, lng: any): boolean => {
  return lat !== undefined && lat !== null && lng !== undefined && lng !== null;
};

const Itineraries: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, user } = useAuth();
    const queryClient = useQueryClient();
    
    // 解析URL参数
    const queryParams = new URLSearchParams(location.search);
    const tabParam = queryParams.get('tab');
    const routeIdParam = queryParams.get('routeId');
    
    // State for UI controls (pagination, search, sort, tab)
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(9);
    const [searchKeyword, setSearchKeyword] = useState<string>('');
    const [sortBy, setSortBy] = useState<'newest' | 'popularity'>('newest');
    const [activeTab, setActiveTab] = useState<string>(tabParam === 'culture' ? 'culture' : 'public');
    const [routeId, setRouteId] = useState<string | null>(routeIdParam);
    const [featuredRouteToShow, setFeaturedRouteToShow] = useState<ApiFeaturedRoute | null>(null);
    
    // 添加应用路线的加载状态
    const [loadingApplyRoute, setLoadingApplyRoute] = useState<boolean>(false);
    
    // Checklist Item 7: Add state for modal visibility and selected route
    const [isMapModalVisible, setIsMapModalVisible] = useState<boolean>(false);
    const [selectedRouteForMap, setSelectedRouteForMap] = useState<ApiFeaturedRouteListItem | ApiFeaturedRoute | null>(null);
    
    // 模态框相关状态
    const [isDetailModalVisible, setIsDetailModalVisible] = useState<boolean>(false);
    const [featuredRouteDetail, setFeaturedRouteDetail] = useState<ApiFeaturedRoute | null>(null);
    const [loadingRouteDetail, setLoadingRouteDetail] = useState<boolean>(false);
    
    // 动态添加地图模态框样式
    useEffect(() => {
        const styleElement = document.createElement('style');
        styleElement.textContent = mapModalStyle;
        document.head.appendChild(styleElement);
        
        return () => {
            document.head.removeChild(styleElement);
        };
    }, []);

    // useQuery for fetching itineraries
    const queryKey = ['itineraries', { 
        activeTab, 
        currentPage, 
        pageSize, 
        searchKeyword, 
        sortBy, 
        userId: activeTab === 'culture' && !featuredRouteToShow ? user?.id : undefined,
        isPublic: activeTab === 'public' ? true : undefined,
        isCultural: activeTab === 'public' ? true : undefined
    }];

    const { 
        data: itinerariesData, 
        isPending,
        isError, 
        error,
        refetch 
    } = useQuery<ItinerarySearchResponse, Error>({
        queryKey: queryKey,
        queryFn: async () => {
            if (activeTab === 'culture' && (!isAuthenticated || featuredRouteToShow)) {
                return { itineraries: [], total: 0, currentPage: 1, totalPages: 0 }; 
            }
            const params: ItinerarySearchParams = {
                 keyword: searchKeyword || undefined,
                 page: currentPage,
                 pageSize,
                 sortBy,
                 isPublic: activeTab === 'public' ? true : undefined,
                 userId: activeTab === 'culture' && user ? user.id : undefined,
                 isCultural: activeTab === 'public' ? true : undefined
             };
             const response = await itineraryAPI.getItineraries(params); 
             return { 
                 itineraries: Array.isArray(response.itineraries) ? response.itineraries : [],
                 total: typeof response.total === 'number' ? response.total : 0,
                 currentPage: response.currentPage ?? 1,
                 totalPages: response.totalPages ?? 0
             };
        },
        enabled: (activeTab === 'culture' && !!isAuthenticated && !featuredRouteToShow) || activeTab === 'public',
    });

    // 修改精选路线查询配置
    const { 
        data: publicRoutesData, 
        isLoading: isLoadingPublicRoutes, 
        isError: isErrorPublicRoutes, 
        error: errorPublicRoutes,
        refetch: refetchPublicRoutes
    } = useQuery<ApiFeaturedRouteListItem[], Error>({
        queryKey: ['featuredRoutes'],
        queryFn: async () => {
            console.log("开始获取精选路线数据");
            try {
                const response = await featuredRouteAPI.getPublicFeaturedRoutes();
                console.log("获取精选路线数据成功:", response);
                // 确保返回有效的数组
                if (!response || !Array.isArray(response)) {
                    console.warn("精选路线响应不是数组:", response);
                    return [];
                }
                return response;
            } catch (error) {
                console.error("获取精选路线数据失败:", error);
                throw error;
            }
        },
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
        retry: 1, // 失败时重试1次
        refetchOnWindowFocus: false, // 窗口聚焦时不重新获取
    });

    // 将useEffect移动到变量声明之后
    useEffect(() => {
        if (publicRoutesData) {
            console.log("精选路线数据详情:", publicRoutesData);
            console.log("精选路线数据类型:", typeof publicRoutesData, Array.isArray(publicRoutesData));
            console.log("精选路线数据长度:", publicRoutesData.length);
        }
    }, [publicRoutesData]);

    // API call for featured route detail (when routeIdParam is present for culture tab)
    const { 
        data: featuredRouteDetailData, 
        isLoading: isLoadingFeaturedDetail, 
        isError: isFeaturedDetailError, // Renamed for clarity
        error: featuredDetailError, // Renamed for clarity
        // Removed refetch as it might not be needed directly
    } = useQuery<ApiFeaturedRoute, Error>({
        queryKey: ['featuredRouteDetail', routeId], 
        queryFn: async () => {
            if (!routeId) throw new Error('No Route ID for detail fetch');
            console.log("开始获取精选路线详情数据，ID:", routeId);
            try {
                const response = await featuredRouteAPI.getPublicFeaturedRouteById(routeId);
                console.log("获取精选路线详情成功:", response);
                return response;
            } catch (error) {
                console.error("获取精选路线详情失败:", error);
                throw error;
            }
        },
        enabled: !!routeId && activeTab === 'culture',
        retry: 1, // Retry once on error
        // Removed onSuccess and onError callbacks
    });

    // Checklist Item 2 & 4: Handle query success/error in useEffect
    useEffect(() => {
        if (activeTab === 'culture' && featuredRouteDetailData) {
            setFeaturedRouteToShow(featuredRouteDetailData);
        }
    }, [activeTab, featuredRouteDetailData]);

    useEffect(() => {
        if (activeTab === 'culture' && isFeaturedDetailError) {
            console.error("Failed to fetch featured route detail:", featuredDetailError);
            message.error(`加载精选路线失败: ${featuredDetailError?.message || '请检查网络连接或稍后重试'}`);
            
            // 仅在特定错误时才跳转到公共页面
            if (featuredDetailError?.message?.includes('404')) {
                message.warning('精选路线可能不存在或未启用，请联系管理员');
            }
            
            // 清理状态
            setRouteId(null);
            setFeaturedRouteToShow(null);
        }
    }, [activeTab, isFeaturedDetailError, featuredDetailError]);

    // 使用useEffect处理从URL参数初始化，以及处理浏览器历史导航
    useEffect(() => {
        if (location.search) {
            const params = new URLSearchParams(location.search);
            
            // 1. 处理tab参数
            const tabParam = params.get('tab');
            if (tabParam && (tabParam === 'culture' || tabParam === 'public')) {
                setActiveTab(tabParam);
            }
            
            // 2. 处理modalView参数
            const modalViewParam = params.get('modalView');
            if (modalViewParam === 'route-detail' && featuredRouteDetail) {
                // 如果已有详情数据且参数指示显示详情模态框
                setIsDetailModalVisible(true);
            } else if (modalViewParam === 'route-map' && selectedRouteForMap) {
                // 如果已有地图数据且参数指示显示地图模态框
                setIsMapModalVisible(true);
            } 
            // 3. 处理routeId参数 (仅当无modalView参数时，避免重复加载)
            else if (!modalViewParam) {
                const routeIdParam = params.get('routeId');
                if (routeIdParam) {
                    const parsedRouteId = parseInt(routeIdParam, 10);
                    if (!isNaN(parsedRouteId)) {
                        // 直接通过模态框显示详情
                        handleViewDetailModal(parsedRouteId);
                        // 更新URL移除routeId参数，以避免后续刷新时自动弹出
                        const newParams = new URLSearchParams(params);
                        newParams.delete('routeId');
                        navigate({ search: newParams.toString() }, { replace: true });
                    }
                }
            }
        }
    }, [location.search, featuredRouteDetail, selectedRouteForMap]);

    // 监听浏览器返回按钮，关闭模态框
    useEffect(() => {
        const handlePopState = () => {
            if (isDetailModalVisible) {
                setIsDetailModalVisible(false);
                setFeaturedRouteDetail(null);
            }
            if (isMapModalVisible) {
                setIsMapModalVisible(false);
                setSelectedRouteForMap(null);
            }
        };
        
        window.addEventListener('popstate', handlePopState);
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [isDetailModalVisible, isMapModalVisible]);

    useEffect(() => {
        if (!isAuthenticated && activeTab === 'culture') {
            setActiveTab('public');
            setCurrentPage(1);
        }
    }, [isAuthenticated, activeTab]);

    useEffect(() => {
        console.log('Itineraries.tsx: useEffect triggered refetch due to queryKey change or mount.');
        refetch();
    }, [queryKey, refetch]);

    const itineraries = itinerariesData?.itineraries || [];
    const totalItineraries = itinerariesData?.total || 0;

    const deleteMutation = useMutation({
        mutationFn: (id: number) => itineraryAPI.deleteItinerary(id),
        onSuccess: () => {
            message.success('行程已删除');
            queryClient.invalidateQueries({ queryKey: ['itineraries'] }); 
        },
        onError: (err: Error) => {
            console.error('删除行程失败:', err);
            message.error(`删除行程失败: ${err.message || '请稍后重试'}`);
        }
    });

    const cloneMutation = useMutation({
        mutationFn: (id: number) => itineraryAPI.cloneItinerary(id),
        onSuccess: () => {
            message.success('行程已复制到您的行程列表');
            queryClient.invalidateQueries({ queryKey: ['itineraries', { activeTab: 'culture' }] });
        },
        onError: (err: Error) => {
            console.error('复制行程失败:', err);
            message.error(`复制行程失败: ${err.message || '请稍后重试'}`);
        }
    });

    const shareMutation = useMutation({
        mutationFn: (id: number) => itineraryAPI.shareItinerary(id),
        onSuccess: (data) => {
             if (navigator.clipboard) {
                navigator.clipboard.writeText(data.shareUrl)
                    .then(() => message.success('分享链接已复制到剪贴板'))
                    .catch(err => {
                        console.error('复制到剪贴板失败:', err);
                        message.info(`分享链接: ${data.shareUrl}`); 
                    });
            } else {
                 message.info(`分享链接: ${data.shareUrl}`);
            }
        },
        onError: (err: Error) => {
            console.error('分享行程失败:', err);
            message.error(`分享行程失败: ${err.message || '请稍后重试'}`);
        }
    });
    
    const handleTabChange = (key: string) => {
        setActiveTab(key);
        setCurrentPage(1);
        // 关闭详情模态框（如果打开）
        setIsDetailModalVisible(false);
        setFeaturedRouteDetail(null);
        
        // 更新URL，移除routeId参数
        const params = new URLSearchParams();
        params.set('tab', key);
        navigate({ search: params.toString() });
    };
    
    const handleSearch = (value: string) => {
        setSearchKeyword(value);
        setCurrentPage(1);
    };
    
    const handleSortChange = (value: 'newest' | 'popularity') => {
        setSortBy(value);
        setCurrentPage(1);
    };
    
    const handlePageChange = (page: number, size?: number) => {
        setCurrentPage(page);
        if (size && size !== pageSize) {
            setPageSize(size);
            setCurrentPage(1);
        }
    };
    
    const handleCreateItinerary = () => {
        if (!isAuthenticated) {
            message.warning('请先登录后再创建行程');
            navigate('/login', { state: { from: '/itineraries/create' } });
            return;
        }
        navigate('/itineraries/create');
    };
    
    const handleEditItinerary = (id: number) => {
        navigate(`/itineraries/${id}`);
    };
    
    const handleViewItinerary = (id: number) => {
        navigate(`/itineraries/${id}`);
    };
    
    const handleDeleteItinerary = (id: number) => {
        deleteMutation.mutate(id);
    };
    
    const handleShareItinerary = (id: number) => {
        shareMutation.mutate(id);
    };
    
    const handleCloneItinerary = (id: number) => {
        if (!isAuthenticated) {
            message.warning('请先登录后再复制行程');
            navigate('/login', { state: { from: '/itineraries' } });
            return;
        }
        cloneMutation.mutate(id);
    };
    
    const formatDateRange = (startDate?: string | null, endDate?: string | null) => {
        if (!startDate || !endDate) {
            return '日期未定';
        }
        const start = dayjs(startDate).format('YYYY/MM/DD');
        const end = dayjs(endDate).format('YYYY/MM/DD');
        if (start === end) {
            return start;
        }
        return `${start} - ${end}`;
    };
    
    const renderItineraryCard = (itinerary: Itinerary, isOwner: boolean) => {
        if (!itinerary || typeof itinerary.id === 'undefined') {
            console.warn("Attempted to render invalid itinerary object:", itinerary);
            return null;
        }

        const culturalTags = activeTab === 'culture' ? (
            <Tag color="#722ed1" className="cultural-route-tag">
                <BankOutlined /> 文化路线
            </Tag>
        ) : null;

        return (
            <Col xs={24} sm={12} md={8} key={itinerary.id} className="itinerary-col">
                <Card
                    hoverable
                    cover={
                        <div className="itinerary-card-cover" onClick={() => handleViewItinerary(itinerary.id)}>
                            <img 
                                alt={itinerary.title} 
                                src={itinerary.cover || '/images/placeholders/default.jpg'}
                                className="itinerary-cover-image"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    if (target.src !== '/images/placeholders/default.jpg') {
                                        target.src = '/images/placeholders/default.jpg';
                                    }
                                }}
                            />
                            <div className="itinerary-days-badge">
                                <CalendarOutlined /> {calculateDays(itinerary.startDate, itinerary.endDate)}天
                            </div>
                            {!itinerary.isPublic && (
                                <Tag color="orange" className="itinerary-privacy-badge">
                                    私密
                                </Tag>
                            )}
                            {culturalTags}
                        </div>
                    }
                    className={`itinerary-card ${activeTab === 'culture' ? 'cultural-card' : ''}`}
                    actions={isOwner ? [
                        <Tooltip title="编辑"> 
                            <EditOutlined key="edit" onClick={() => handleEditItinerary(itinerary.id)} />
                        </Tooltip>,
                        <Popconfirm
                            title="确定要删除这个行程吗？"
                            onConfirm={() => handleDeleteItinerary(itinerary.id)}
                            okText="确定"
                            cancelText="取消"
                            disabled={deleteMutation.isPending && deleteMutation.variables === itinerary.id} 
                        >
                             <Tooltip title="删除">
                                <Button 
                                    type="text" 
                                    danger 
                                    icon={<DeleteOutlined />} 
                                    key="delete" 
                                    loading={deleteMutation.isPending && deleteMutation.variables === itinerary.id} 
                                />
                            </Tooltip>
                        </Popconfirm>,
                         <Tooltip title="分享">
                            <Button 
                                type="text"
                                icon={<ShareAltOutlined />} 
                                key="share" 
                                onClick={() => handleShareItinerary(itinerary.id)} 
                                loading={shareMutation.isPending && shareMutation.variables === itinerary.id}
                                disabled={shareMutation.isPending && shareMutation.variables === itinerary.id}
                            />
                        </Tooltip>
                    ] : [
                        <Tooltip title="查看">
                            <EyeOutlined key="view" onClick={() => handleViewItinerary(itinerary.id)} />
                        </Tooltip>,
                         <Tooltip title="复制行程">
                            <Button 
                                type="text"
                                icon={<CopyOutlined />} 
                                key="copy" 
                                onClick={() => handleCloneItinerary(itinerary.id)} 
                                loading={cloneMutation.isPending && cloneMutation.variables === itinerary.id}
                                disabled={cloneMutation.isPending && cloneMutation.variables === itinerary.id || !isAuthenticated}
                            />
                        </Tooltip>,
                         <Tooltip title="分享">
                             <Button 
                                type="text"
                                icon={<ShareAltOutlined />} 
                                key="share" 
                                onClick={() => handleShareItinerary(itinerary.id)} 
                                loading={shareMutation.isPending && shareMutation.variables === itinerary.id}
                                disabled={shareMutation.isPending && shareMutation.variables === itinerary.id}
                            />
                         </Tooltip>
                    ]}
                >
                    <Card.Meta
                        title={
                            <div className="itinerary-title" onClick={() => handleViewItinerary(itinerary.id)}>
                                {itinerary.title || "未命名行程"} 
                            </div>
                        }
                        description={
                            <div className="itinerary-description">
                                <div className="itinerary-dates">
                                    {itinerary.city && <Tag><EnvironmentOutlined /> {itinerary.city}</Tag>}
                                    {formatDateRange(itinerary.startDate, itinerary.endDate)}
                                </div>
                                {(itinerary.items && itinerary.items.length > 0 || itinerary.daysList && itinerary.daysList.some(d => d.items.length > 0)) && (
                                    <div className="itinerary-places">
                                        {(() => {
                                            const allItems = itinerary.daysList 
                                                ? itinerary.daysList.flatMap(day => day.items || []) 
                                                : (itinerary.items || []);
                                            
                                            const itemsWithName = allItems.filter((item): item is ItineraryItem & { name: string } => !!item?.name); 
                                            
                                            if (itemsWithName.length === 0) return <Typography.Text type="secondary">暂无项目</Typography.Text>;

                                            return (
                                                <>
                                                    {itemsWithName.slice(0, 3).map((item, index) => (
                                                        <Tag 
                                                            key={item.id ? `item-${item.id}-${index}` : `item-idx-${index}`} 
                                                            color={activeTab === 'culture' ? 'purple' : 'blue'}
                                                        >
                                                            {item.name}
                                                        </Tag> 
                                                    ))}
                                                    {itemsWithName.length > 3 && (
                                                        <Tag>+{itemsWithName.length - 3}</Tag>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
                        }
                    />
                </Card>
            </Col>
        );
    };
    
    const getDifficultyColor = (difficulty: string): string => {
        switch (difficulty) {
            case 'easy': return '#52c41a';
            case 'medium': return '#faad14';
            case 'hard': return '#f5222d';
            default: return '#52c41a';
        }
    };

    const getDifficultyText = (difficulty: string): string => {
        switch (difficulty) {
            case 'easy': return '轻松';
            case 'medium': return '中等';
            case 'hard': return '困难';
            default: return '轻松';
        }
    };

    // Checklist Item 12: Add mutation for applying featured route
    const applyRouteMutation = useMutation({ 
        mutationFn: featuredRouteAPI.applyFeaturedRoute,
        onSuccess: (data: { id: number; title: string }) => { // data is what the backend returns { id, title }
            // Checklist Item 14: Success handling
            message.success(`路线 "${data.title}" 已成功应用并创建为您的新行程!`);
            queryClient.invalidateQueries({ queryKey: ['itineraries', { activeTab: 'culture' }] }); // Invalidate user's itineraries
            navigate(`/itineraries/${data.id}`); // Navigate to the new itinerary detail/edit page
        },
        onError: (error: Error) => {
            // Checklist Item 15: Error handling
            console.error("Error applying featured route:", error);
            message.error(`应用路线失败: ${error.message || '请稍后重试'}`);
        },
    });

    const renderContent = () => {
        if (featuredRouteToShow) {
            const route = featuredRouteToShow;
            const visibleSpots = route.spots.slice(0, 5);
            const hasMoreSpots = route.spots.length > 5;
            const moreSpotCount = route.spots.length - 5;

            return (
                <div className="featured-route-detail-view">
                     <Row gutter={[24, 24]}>
                        <Col xs={24} md={10}>
                             <img 
                                src={route.image_url || '/images/placeholders/default.jpg'} 
                                alt={route.name} 
                                className="featured-route-detail-image"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    if (target.src !== '/images/placeholders/default.jpg') {
                                        target.src = '/images/placeholders/default.jpg';
                                    }
                                }}
                             />
                        </Col>
                        <Col xs={24} md={14}>
                            <Typography.Title level={2} className="featured-route-detail-name">{route.name}</Typography.Title>
                             <Tag color="purple" className="featured-route-detail-category"><BankOutlined /> {route.category || '综合'}</Tag>
                            <Divider />
                            <Typography.Paragraph className="featured-route-detail-description">
                                {route.description}
                            </Typography.Paragraph>
                            
                            <div className="route-info" style={{ marginBottom: '24px' }}>
                                <span className="info-item">
                                    <ClockCircleOutlined /> 
                                    <span> 时长信息暂无 </span>
                                </span>
                                <span className="info-item" style={{ color: getDifficultyColor(route.difficulty || '') }}>
                                    <FireOutlined /> 
                                    {`难度: ${route.difficulty ? getDifficultyText(route.difficulty) : '未知'}`}
                                </span>
                            </div>

                            <Typography.Title level={4}>主要景点</Typography.Title>
                            {route.spots && route.spots.length > 0 ? (
                                <div className="route-spots detail-spots">
                                    {route.spots.map((spot, index) => (
                                        <React.Fragment key={spot.scenicSpot.scenic_id || spot.spot_id || index}>
                                            <Tooltip title={spot.scenicSpot.description || spot.scenicSpot.name}>
                                                <Tag className="route-spot detail-spot">{spot.scenicSpot.name}</Tag>
                                            </Tooltip>
                                            {index < route.spots.length - 1 && (
                                                <span className="spot-arrow"><RightOutlined /></span>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </div>
                            ) : (
                                <Typography.Text type="secondary">暂无景点信息</Typography.Text>
                            )}
                            <Divider />
                             <Button 
                                type="primary" 
                                size="large"
                                icon={<CopyOutlined />}
                                onClick={() => handleApplyFeaturedRoute(route.featured_route_id)}
                                className="apply-route-btn detail-apply-btn"
                                loading={applyRouteMutation.isPending}
                                disabled={applyRouteMutation.isPending}
                            >
                                应用此路线到我的行程
                            </Button>
                        </Col>
                    </Row>
                </div>
            );
        }

        if (isPending) {
            return <div style={{ textAlign: 'center', padding: '50px 0' }}><Spin size="large" /></div>;
        }
        if (isError) {
            return <Empty description={`加载行程失败: ${error?.message || '请稍后重试'}`} />;
        }
        if (!itineraries || itineraries.length === 0) {
             const description = activeTab === 'culture' 
                ? (isAuthenticated ? '您还没有创建任何文化路线' : '请先登录查看文化路线') 
                : '暂无公开行程';
            return <Empty description={description} />;
        }

        return (
            <>
                <Row gutter={[16, 16]}>
                    {itineraries.map(itinerary => renderItineraryCard(itinerary, activeTab === 'culture'))} 
                </Row>
                {totalItineraries > pageSize && (
                    <Pagination
                        current={currentPage}
                        pageSize={pageSize}
                        total={totalItineraries}
                        onChange={handlePageChange}
                        showSizeChanger={false}
                        style={{ marginTop: '20px', textAlign: 'center' }}
                    />
                )}
            </>
        );
    };
    
    // 修复handleShowMapModal函数，接受数字参数而非字符串
    const handleShowMapModal = useCallback(async (routeId: number | string) => {
        console.log(`显示路线ID: ${routeId} 的地图`);
        
        try {
            // 显示加载中消息
            const loadingMessage = message.loading('正在加载路线地图数据...', 0);
            
            // 确保routeId是有效的数字
            const numericRouteId = Number(routeId);
            if (isNaN(numericRouteId)) {
                message.error(`无效的路线ID: ${routeId}`);
                loadingMessage();
                return;
            }
            
            // 获取路线详情 - 始终从API获取最新数据
            console.log(`调用API获取路线ID: ${numericRouteId} 的详情`);
            const routeDetail = await featuredRouteAPI.getPublicFeaturedRouteById(numericRouteId);
            
            // 关闭加载消息
            loadingMessage();
            
            console.log('获取到的路线详情:', routeDetail);
            
            // 验证路线数据格式
            if (!routeDetail) {
                message.error('获取路线数据失败');
                return;
            }
            
            // 检查spots数据
            if (!routeDetail.spots) {
                console.error('该路线缺少spots数组数据:', routeDetail);
                message.warning('此路线缺少景点位置数据结构，地图可能无法正常显示');
            } else if (!Array.isArray(routeDetail.spots)) {
                console.error('该路线的spots不是数组:', routeDetail);
                message.warning('此路线的景点数据格式不正确');
            } else if (routeDetail.spots.length === 0) {
                console.warn('该路线的spots数组为空:', routeDetail);
                message.warning('此路线没有包含任何景点');
            } else {
                console.log('路线包含 ' + routeDetail.spots.length + ' 个景点');
                // 验证spots里是否每个元素都包含必要的坐标信息
                const validSpotsCount = routeDetail.spots.filter(spot => {
                    if (!spot) return false;
                    
                    // 检查所有可能包含坐标的位置
                    return (
                        // 直接的坐标字段
                        (hasValidCoordinates(spot.latitude, spot.longitude)) ||
                        // scenicSpot中的坐标
                        (spot.scenicSpot?.location && 
                         Array.isArray(spot.scenicSpot.location) && 
                         spot.scenicSpot.location.length === 2) ||
                        (hasValidCoordinates(spot.scenicSpot?.latitude, spot.scenicSpot?.longitude)) ||
                        // 其他可能的格式
                        (spot.scenicSpot?.coordinates && 
                         Array.isArray(spot.scenicSpot.coordinates) && 
                         spot.scenicSpot.coordinates.length === 2) ||
                        (spot.scenicSpot?.position && 
                         Array.isArray(spot.scenicSpot.position) && 
                         spot.scenicSpot.position.length === 2) ||
                        (spot.scenicSpot?.geo && 
                         hasValidCoordinates(spot.scenicSpot.geo.lat, spot.scenicSpot.geo.lng)) ||
                        // 通过名称可以查找到默认坐标
                        (spot.scenicSpot?.name && getDefaultLocationByName(spot.scenicSpot.name) !== null)
                    );
                }).length;
                
                console.log(`路线有 ${routeDetail.spots.length} 个景点，其中 ${validSpotsCount} 个有有效坐标`);
                
                if (validSpotsCount === 0) {
                    message.warning('此路线的所有景点均缺少有效坐标信息，地图可能无法正常显示');
                } else if (validSpotsCount < routeDetail.spots.length) {
                    message.info(`路线包含 ${routeDetail.spots.length} 个景点，但只有 ${validSpotsCount} 个具有有效坐标`);
                }
            }
            
            // 更新选中的路线
            setSelectedRouteForMap(routeDetail);
            
            // 更新浏览器历史以支持返回按钮
            window.history.pushState(
                { selectedRouteId: numericRouteId },
                '',
                `${window.location.pathname}?map=${numericRouteId}`
            );
            
            // 设置模态框显示状态
            setIsMapModalVisible(true);
            
        } catch (error) {
            console.error('加载路线数据失败:', error);
            // 显示更详细的错误信息
            if (error instanceof Error) {
                if (error.message.includes('404') || error.message.includes('找不到')) {
                    message.error(`找不到ID为 ${routeId} 的路线`);
                } else if (error.message.includes('网络') || error.message.includes('Network')) {
                    message.error('网络连接错误，请检查您的网络连接');
                } else {
                    message.error(`加载路线数据失败: ${error.message}`);
                }
            } else {
                message.error('加载路线数据失败，请稍后重试');
            }
        }
    }, []);
    
    // 修复浏览器历史记录处理相关的代码
    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            const state = event.state as { selectedRouteId?: string | number } | null;
            
            if (state && state.selectedRouteId) {
                // 如果返回到的状态包含路线ID，重新获取路线信息并显示地图
                console.log('从历史记录恢复地图:', state.selectedRouteId);
                handleShowMapModal(state.selectedRouteId);
            } else {
                // 如果返回到的状态不包含路线ID，关闭地图
                console.log('从历史记录关闭地图');
                setIsMapModalVisible(false);
                setSelectedRouteForMap(null);
            }
        };
        
        window.addEventListener('popstate', handlePopState);
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [handleShowMapModal]);

    // 处理应用路线的函数
    const handleApplyFeaturedRoute = async (routeId: number) => {
        console.log(`应用推荐路线ID: ${routeId}`);
        
        // 显示加载状态
        setLoadingApplyRoute(true);
        
        try {
            // 显示加载消息
            const loadingMessage = message.loading('正在应用路线到您的行程...', 0);
            
            // 确保路线ID是有效数字
            const numericRouteId = Number(routeId);
            if (isNaN(numericRouteId)) {
                message.error(`无效的路线ID: ${routeId}`);
                loadingMessage();
                setLoadingApplyRoute(false);
                return;
            }
            
            // 直接调用API应用路线
            console.log(`调用API应用路线ID: ${numericRouteId}`);
            const applyResponse = await featuredRouteAPI.applyFeaturedRoute(numericRouteId);
            
            // 关闭加载消息
            loadingMessage();
            
            console.log('应用路线响应:', applyResponse);
            
            // 验证响应数据
            if (!applyResponse || !applyResponse.id) {
                message.error('应用路线失败，服务器返回的数据不完整');
                setLoadingApplyRoute(false);
                return;
            }
            
            // 显示成功消息
            message.success(`已成功应用路线"${applyResponse.title || '未命名'}"到您的行程`);
            
            // 刷新行程列表
            queryClient.invalidateQueries({ queryKey: ['itineraries'] });
            
            // 导航到新创建的行程
            navigate(`/itineraries/${applyResponse.id}`);
        } catch (error) {
            console.error('应用路线时出错:', error);
            message.error(`应用路线失败: ${error instanceof Error ? error.message : '服务器错误'}`);
        } finally {
            setLoadingApplyRoute(false);
        }
    };

    // 添加查看详情模态框的处理函数
    const handleViewDetailModal = async (routeId: number) => {
        setLoadingRouteDetail(true);
        try {
            // 显示加载消息
            const loadingMessage = message.loading('正在加载路线详情...', 0);
            
            // 确保routeId是有效的数字
            const numericRouteId = Number(routeId);
            if (isNaN(numericRouteId)) {
                message.error(`无效的路线ID: ${routeId}`);
                loadingMessage();
                setLoadingRouteDetail(false);
                return;
            }
            
            console.log(`调用API获取路线ID: ${numericRouteId} 的详情`);
            const detailData = await featuredRouteAPI.getPublicFeaturedRouteById(numericRouteId);
            
            // 关闭加载消息
            loadingMessage();
            
            console.log('获取到的详情数据:', detailData);
            
            // 验证详情数据是否有效
            if (!detailData || !detailData.name) {
                message.error('获取到的路线数据不完整');
                setLoadingRouteDetail(false);
                return;
            }
            
            setFeaturedRouteDetail(detailData);
            setIsDetailModalVisible(true);
            
            // 添加到浏览器历史记录，以支持返回按钮关闭模态框
            const currentParams = new URLSearchParams(location.search);
            currentParams.set('modalView', 'route-detail');
            // 使用replace避免创建新历史记录项
            navigate({ search: currentParams.toString() }, { replace: false });
        } catch (error) {
            console.error('获取路线详情失败:', error);
            message.error(`获取路线详情失败: ${error instanceof Error ? error.message : '请稍后重试'}`);
        } finally {
            setLoadingRouteDetail(false);
        }
    };

    // 关闭详情模态框
    const handleCloseDetailModal = () => {
        setIsDetailModalVisible(false);
        setFeaturedRouteDetail(null);
        
        // 返回上一页，触发浏览器的返回按钮
        // 如果是从URL参数打开的，则不执行返回
        const currentParams = new URLSearchParams(location.search);
        if (currentParams.has('modalView')) {
            currentParams.delete('modalView');
            navigate({ search: currentParams.toString() }, { replace: true });
        } else {
            // 不使用navigate(-1)的原因是避免重新加载页面
            window.history.back();
        }
    };

    const renderFeaturedRouteCard = (route: ApiFeaturedRouteListItem) => {
        console.log("渲染路线卡片:", route);
        // 确保路线对象包含必要的字段，提供合理的默认值
        const routeId = route.featured_route_id;
        const routeName = route.name || '未命名路线';
        const routeDesc = route.description || '暂无描述';
        const routeImage = route.image_url || '/images/placeholders/default.jpg';
        const routeCategory = route.category || '综合';
        const routeDifficulty = route.difficulty || 'unknown';
        
        return (
            <Col xs={24} md={12} key={routeId} className="featured-route-col">
                <Card
                    hoverable
                    className="featured-route-card"
                    cover={
                        <div className="featured-route-image" style={{ backgroundImage: `url(${routeImage})` }}>
                            <div className="route-category-badge">{routeCategory}</div>
                        </div>
                    }
                    onClick={() => handleViewDetailModal(routeId)}
                >
                    <h3 className="route-name">{routeName}</h3>
                    <p className="route-description">{routeDesc}</p>
                    
                    <div className="route-info">
                        <div className="info-item">
                            <FireOutlined style={{ color: getDifficultyColor(routeDifficulty) }} />
                            <span style={{ color: getDifficultyColor(routeDifficulty) }}>
                                {getDifficultyText(routeDifficulty)}
                            </span>
                        </div>
                    </div>
                    
                    <div className="route-spots-placeholder">查看详情以获取景点信息</div> 
                    
                    <div className="route-actions">
                        <Button 
                            type="primary" 
                            onClick={(e) => {
                                e.stopPropagation(); // 防止触发卡片点击事件
                                handleApplyFeaturedRoute(routeId);
                            }}
                            className="apply-route-btn"
                            icon={<CopyOutlined />}
                            loading={applyRouteMutation.isPending && applyRouteMutation.variables === routeId}
                            disabled={applyRouteMutation.isPending}
                        >
                            应用此路线
                        </Button>
                        <div>
                            <Button 
                                type="link" 
                                onClick={(e) => {
                                    e.stopPropagation(); // 防止触发卡片点击
                                    handleViewDetailModal(routeId); // 使用模态框代替导航到详情页
                                }}
                                icon={<EyeOutlined />}
                            >
                                查看详情
                            </Button>
                            <Button 
                                icon={<GlobalOutlined />} 
                                onClick={(e) => {
                                    e.stopPropagation(); // 防止触发卡片点击
                                    handleShowMapModal(Number(routeId));
                                }}
                            >
                                查看地图
                            </Button>
                        </div>
                    </div>
                </Card>
            </Col>
        );
    };

    const renderFeaturedRoutes = () => {
        if (isLoadingPublicRoutes) {
            return <div style={{ textAlign: 'center', padding: '50px 0' }}><Spin size="large" tip="加载精选路线中..." /></div>;
        }
        
        if (isErrorPublicRoutes) {
            return (
                <div className="error-container" style={{ textAlign: 'center', padding: '30px' }}>
                    <Empty 
                        description={
                            <span>
                                加载精选路线失败: {errorPublicRoutes?.message || '请稍后重试'}
                                <br/>
                                <Button 
                                    onClick={() => refetchPublicRoutes()} 
                                    style={{ marginTop: '10px' }}
                                >
                                    重试
                                </Button>
                            </span>
                        } 
                    />
                </div>
            );
        }
        
        console.log('精选路线数据:', publicRoutesData);
        
        // 确保publicRoutesData是有效数组
        const routesToRender = publicRoutesData && Array.isArray(publicRoutesData) ? publicRoutesData : []; 
        
        // 添加临时测试按钮
        const testButton = (
            <Button 
                onClick={async () => {
                    try {
                        const data = await featuredRouteAPI.getPublicFeaturedRoutes();
                        console.log("直接API调用结果:", data);
                        message.success(`成功获取 ${data?.length || 0} 条路线数据`);
                        // 刷新路线数据
                        refetchPublicRoutes();
                    } catch (err: any) { // 添加类型断言为any
                        console.error("API调用失败:", err);
                        message.error("API调用失败:" + (err.message || String(err)));
                    }
                }}
                style={{ marginBottom: '15px' }}
            >
                测试API
            </Button>
        );
        
        if (routesToRender.length === 0) {
            return (
                <div>
                    {testButton}
                    <Empty description="暂无精选文化路线" />
                </div>
            );
        }

        return (
            <div className="featured-routes-container">
                {testButton}
                <div className="featured-routes-description">
                    <h3><BankOutlined /> 特色文化路线推荐</h3>
                    <p>这里展示了平台上精心设计的文化主题路线...</p>
                </div>
                
                <Row gutter={[16, 24]}>
                    {/* Map over the fetched data */} 
                    {routesToRender.map(route => renderFeaturedRouteCard(route))}
                </Row>
            </div>
        );
    };

    // 渲染详情模态框内容
    const renderDetailModalContent = () => {
        if (loadingRouteDetail) {
            return (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <Spin tip="正在加载路线详情..." />
                </div>
            );
        }
        
        if (!featuredRouteDetail) {
            return <Empty description="未找到路线详情" />;
        }
        
        const route = featuredRouteDetail;
        
        return (
            <div className="featured-route-detail-modal">
                <Row gutter={[24, 24]}>
                    <Col xs={24} md={10}>
                        <img 
                            src={route.image_url || '/images/placeholders/default.jpg'} 
                            alt={route.name} 
                            className="featured-route-detail-image"
                            style={{ width: '100%', borderRadius: '8px' }}
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (target.src !== '/images/placeholders/default.jpg') {
                                    target.src = '/images/placeholders/default.jpg';
                                }
                            }}
                        />
                        <div className="route-meta-info" style={{ marginTop: '16px' }}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <div className="route-tags">
                                    <Tag color="purple" className="featured-route-detail-category">
                                        <BankOutlined /> {route.category || '综合'}
                                    </Tag>
                                    <Tag color={getDifficultyColor(route.difficulty || '')} className="featured-route-detail-difficulty">
                                        <span style={{ marginLeft: 4 }}><FireOutlined /> {getDifficultyText(route.difficulty || '未知')}</span>
                                    </Tag>
                                </div>
                            </Space>
                        </div>
                    </Col>
                    <Col xs={24} md={14}>
                        <Typography.Title level={3} className="featured-route-detail-name">
                            {route.name}
                        </Typography.Title>
                        <Divider />
                        <Typography.Paragraph className="featured-route-detail-description">
                            {route.description || '暂无路线描述'}
                        </Typography.Paragraph>
                        <Typography.Title level={4}>路线节点</Typography.Title>
                        {route.spots && route.spots.length > 0 ? (
                            <List
                                itemLayout="horizontal"
                                dataSource={route.spots}
                                renderItem={(spot, idx) => {
                                    const nodeName = spot.scenicSpot?.name || spot.name || '未命名节点';
                                    const nodeDesc = spot.scenicSpot?.description || spot.description || '无描述';
                                    return (
                                        <List.Item>
                                            <List.Item.Meta
                                                title={<span><Tag color="blue">{idx + 1}</Tag> {nodeName}</span>}
                                                description={nodeDesc}
                                            />
                                        </List.Item>
                                    );
                                }}
                            />
                        ) : (
                            <Typography.Text type="secondary">暂无节点信息</Typography.Text>
                        )}
                    </Col>
                </Row>
            </div>
        );
    };

    // 添加useEffect来处理地图模态框打开后的事件
    useEffect(() => {
        if (isMapModalVisible) {
            // 确保模态框打开后重新渲染地图
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
                
                // 再次延迟触发窗口大小调整事件
                setTimeout(() => {
                    window.dispatchEvent(new Event('resize'));
                }, 300);
            }, 100);
        }
    }, [isMapModalVisible]);

    // 在组件加载时检查URL参数是否有map，如果有则显示地图
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const mapParam = urlParams.get('map');
        if (mapParam) {
            console.log('URL中检测到地图参数:', mapParam);
            handleShowMapModal(Number(mapParam));
        }
    }, [handleShowMapModal]);

    return (
        <div className="itineraries-container">
            <div className="itineraries-header">
                <h1>{activeTab === 'culture' ? '文化路线' : '行程规划'}</h1>
                <p>{activeTab === 'culture' 
                    ? '探索中国各地文化特色，体验不同区域的人文风情' 
                    : '规划您的完美旅行，轻松安排景点和行程'}</p>
                
                <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    className="create-itinerary-btn"
                    onClick={handleCreateItinerary}
                >
                    {activeTab === 'culture' ? '创建文化路线' : '创建行程'}
                </Button>
            </div>
            
            <div className="itineraries-toolbar">
                <div className="search-container">
                    <Input.Search
                        placeholder={activeTab === 'culture' ? "搜索文化路线名称或城市" : "搜索行程标题或城市"}
                        allowClear
                        enterButton={<SearchOutlined />}
                        onSearch={handleSearch}
                        value={searchKeyword}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchKeyword(e.target.value)}
                    />
                </div>
                
                <div className="sort-container">
                    <span className="sort-label">排序: </span>
                    <Select 
                        value={sortBy} 
                        onChange={handleSortChange}
                        style={{ width: 120 }}
                    >
                        <Select.Option value="newest">最新</Select.Option>
                        <Select.Option value="popularity">最热门</Select.Option>
                    </Select>
                </div>
            </div>
            
            <div className="itineraries-content">
                <Tabs 
                    activeKey={activeTab} 
                    onChange={handleTabChange}
                    className="itineraries-tabs"
                    items={[ 
                        {
                            key: 'culture',
                            label: (
                                <span>
                                    <BankOutlined /> 文化路线
                                </span>
                            ),
                            children: renderContent(), 
                            disabled: !isAuthenticated && !featuredRouteToShow
                        },
                        {
                            key: 'public',
                            label: (
                                <span>
                                    <GlobalOutlined /> 精选文化路线
                                </span>
                            ),
                            children: renderFeaturedRoutes()
                        }
                    ]}
                />
            </div>

            {/* 添加精选路线详情模态框 */}
            <Modal
                title={featuredRouteDetail ? `${featuredRouteDetail.name} - 路线详情` : '路线详情'}
                open={isDetailModalVisible}
                onCancel={handleCloseDetailModal}
                footer={null}
                width={800}
                destroyOnClose={true}
            >
                {renderDetailModalContent()}
            </Modal>

            {/* 地图模态框 */}
            <Modal
                title={selectedRouteForMap ? `${selectedRouteForMap.name} - 路线地图` : '路线地图'}
                open={isMapModalVisible}
                onCancel={() => {
                    console.log('关闭地图模态框');
                    setIsMapModalVisible(false);
                    setSelectedRouteForMap(null);
                    
                    // 更新浏览器历史
                    const url = new URL(window.location.href);
                    url.searchParams.delete('map');
                    window.history.replaceState({}, '', url.toString());
                }}
                footer={null}
                width={1000}
                style={{ 
                    top: 20
                }}
                styles={{
                    body: { 
                        height: 650,
                        padding: 0,
                        overflow: 'hidden',
                        position: 'relative'
                    }
                }}
                destroyOnClose={true}
                className="map-modal"
                afterOpenChange={(visible) => {
                    if (visible) {
                        // 确保模态框打开后重新渲染地图 - 使用更可靠的方式
                        console.log('Modal opened, dispatching resize event...');
                        // 延迟触发 resize 事件，确保地图容器已渲染完成
                        setTimeout(() => {
                           window.dispatchEvent(new Event('resize'));
                           console.log('Dispatched resize event after 150ms delay');
                        }, 150); // 稍微增加延迟以确保DOM更新
                    }
                }}
            >
                {selectedRouteForMap ? (
                    <div style={{ 
                        height: '100%', 
                        width: '100%', 
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0
                    }}>
                        {/* 
                            检查是否有有效的spots数据，优化类型检查逻辑 
                        */}
                        {selectedRouteForMap && 
                         'spots' in selectedRouteForMap && 
                         Array.isArray((selectedRouteForMap as ApiFeaturedRoute).spots) && 
                         (selectedRouteForMap as ApiFeaturedRoute).spots.length > 0 ? (
                            <RouteMap
                                spots={transformSpotsForMap((selectedRouteForMap as ApiFeaturedRoute).spots)}
                                routeName={selectedRouteForMap.name}
                                category={selectedRouteForMap.category}
                                difficulty={selectedRouteForMap.difficulty}
                                key={`map-${selectedRouteForMap.featured_route_id}-${Date.now()}`} // 添加key确保组件重新挂载
                            />
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px 0', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                <Empty description="路线没有包含任何有效的景点位置" />
                                <div style={{marginTop: '16px'}}>
                                    {/* 显示路线数据情况，便于调试 */}
                                    <Typography.Text type="secondary">
                                        {selectedRouteForMap && 'spots' in selectedRouteForMap 
                                            ? `路线有 ${(selectedRouteForMap as ApiFeaturedRoute).spots?.length || 0} 个景点，但坐标数据无效`
                                            : '路线数据格式不包含景点信息'}
                                    </Typography.Text>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '40px 0',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center' 
                    }}>
                        <Spin tip="正在加载路线详情..." />
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Itineraries; 