import React, { useState, useEffect, useRef } from 'react';
// 导入 API 函数和类型
import scenicAPI, { ScenicItem } from '../api/scenic'; // 导入 scenicAPI 和 ScenicItem 类型
import strategyAPI, { Strategy } from '../api/strategy'; // 导入 strategyAPI 和 Strategy 类型
// 导入 react-router-dom 的 useNavigate
import { useNavigate } from 'react-router-dom';
// 导入 antd 的组件
import { message, App, Tag, Modal, Button, Row, Col } from 'antd';
import { 
    EyeOutlined, 
    LikeOutlined, 
    CloseOutlined, 
    GlobalOutlined, 
    CompassOutlined, 
    EnvironmentOutlined 
} from '@ant-design/icons';
import './Home.css';
// 导入中国地理数据相关函数
import { getPopularCities, CityInfo } from '../data/chinaGeoData';
// 导入城市选择器组件
import CitySelector from '../components/common/CitySelector';
import CityCard from '../components/CityCard';
import FeaturedStrategyCard from '../components/FeaturedStrategyCard';
import TravelRouteCard, { TravelRouteInfo } from '../components/TravelRouteCard';

// 文化主题类型定义
export enum CulturalTheme {
  // 按主题分类
  HISTORICAL_CULTURE = 'historical_culture', // 新增：历史时期文化
  REGIONAL_CULTURE = 'regional_culture', // 新增：地域特色文化

  // 具体主题
  ANCIENT_CIVILIZATION = 'ancient_civilization',
  ETHNIC_CULTURE = 'ethnic_culture',
  LITERATURE_ART = 'literature_art',
  RELIGIOUS_CULTURE = 'religious_culture',
  FOOD_CULTURE = 'food_culture',
  INDUSTRIAL_CIVILIZATION = 'industrial_civilization',
  
  // 子类型
  RED_CULTURE = 'red_culture', // 属于历史时期文化
  CANTONESE_CULTURE = 'cantonese_culture' // 属于地域特色文化
}

// 文化主题接口
interface CulturalThemeData {
    id: number;
    code: string;
    name: string;
    description: string;
    image: string;
    color: string;
    subThemes?: SubTheme[];
}

// 文化主题数据
const culturalThemes = [
  {
    id: 1,
    code: CulturalTheme.HISTORICAL_CULTURE,
    name: '历史时期文化',
    description: '探索中国不同历史时期的特色文化',
    image: 'https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg',
    color: '#e74c3c',
    subThemes: [
      {
        id: 101,
        code: CulturalTheme.RED_CULTURE,
        name: '红色文化',
        description: '探索中国革命历史，传承红色基因'
      },
      {
        id: 102,
        code: CulturalTheme.ANCIENT_CIVILIZATION,
        name: '古代文明',
        description: '探索中华文明起源，感受历史变迁'
      },
      {
        id: 103,
        code: CulturalTheme.INDUSTRIAL_CIVILIZATION,
        name: '工业文明',
        description: '参观工业遗址，见证近代发展历程'
      }
    ]
  },
  {
    id: 2,
    code: CulturalTheme.REGIONAL_CULTURE,
    name: '地域特色文化',
    description: '体验中国不同地区的特色文化魅力',
    image: 'https://images.pexels.com/photos/2187662/pexels-photo-2187662.jpeg',
    color: '#f39c12',
    subThemes: [
      {
        id: 201,
        code: CulturalTheme.CANTONESE_CULTURE,
        name: '广府文化',
        description: '体验岭南风情，感受广府特色魅力'
      },
      {
        id: 202,
        code: CulturalTheme.ETHNIC_CULTURE,
        name: '民族文化',
        description: '领略多元民族风情，体验传统民俗活动'
      }
    ]
  },
  {
    id: 3,
    code: CulturalTheme.LITERATURE_ART,
    name: '文学艺术',
    description: '寻访文人足迹，欣赏传统艺术魅力',
    image: 'https://images.pexels.com/photos/1850022/pexels-photo-1850022.jpeg',
    color: '#3498db'
  },
  {
    id: 4,
    code: CulturalTheme.RELIGIOUS_CULTURE,
    name: '宗教文化',
    description: '探访宗教圣地，感受精神净土',
    image: 'https://images.pexels.com/photos/1008155/pexels-photo-1008155.jpeg',
    color: '#9b59b6'
  },
  {
    id: 5,
    code: CulturalTheme.FOOD_CULTURE,
    name: '饮食文化',
    description: '品味地方美食，了解舌尖上的文化',
    image: 'https://images.pexels.com/photos/3054690/pexels-photo-3054690.jpeg',
    color: '#e67e22'
  }
];

// 定义城市卡片数据结构
interface CityCardData {
    id: number; // 使用景点 ID 作为 key
    name: string; // 城市名称
    image?: string; // 景点封面作为城市图片
    description: string; // 可以自定义描述，或使用景点描述
    province?: string; // 所属省份
}

// 定义子主题结构
interface SubTheme {
    id: number;
    code: string;
    name: string;
    description: string;
}

// 定义默认城市图片映射
const cityImageMap: Record<string, string> = {
    '北京': 'https://images.pexels.com/photos/2412603/pexels-photo-2412603.jpeg',
    '上海': 'https://images.pexels.com/photos/2227942/pexels-photo-2227942.jpeg?auto=compress&cs=tinysrgb&w=1200',
    '广州': 'https://cdn.pixabay.com/photo/2020/05/16/05/29/canton-5176043_1280.jpg',
    '深圳': 'https://cdn.pixabay.com/photo/2019/12/08/14/35/shenzhen-4681267_1280.jpg',
    '杭州': 'https://cdn.pixabay.com/photo/2017/03/08/14/22/west-lake-2126888_1280.jpg',
    '南京': 'https://cdn.pixabay.com/photo/2017/09/26/07/54/nanjing-2787946_1280.jpg',
    '成都': 'https://cdn.pixabay.com/photo/2016/09/03/12/13/giant-1641560_1280.jpg',
    '武汉': 'https://cdn.pixabay.com/photo/2020/04/28/00/59/wuhan-5102207_1280.jpg',
    '西安': 'https://cdn.pixabay.com/photo/2016/03/10/02/32/china-1247764_1280.jpg',
    '重庆': 'https://cdn.pixabay.com/photo/2021/04/06/14/46/city-6156596_1280.jpg',
    '厦门': 'https://cdn.pixabay.com/photo/2018/07/04/11/57/city-3515960_1280.jpg',
    '青岛': 'https://cdn.pixabay.com/photo/2016/08/05/03/25/qingdao-1571518_1280.jpg',
    '三亚': 'https://cdn.pixabay.com/photo/2021/12/28/00/46/sanya-6898400_1280.jpg',
    '桂林': 'https://cdn.pixabay.com/photo/2022/06/06/02/01/terraced-fields-7245132_1280.jpg',
    '丽江': 'https://cdn.pixabay.com/photo/2022/04/06/07/22/snow-mountain-7114997_1280.jpg',
    '长沙': 'https://cdn.pixabay.com/photo/2017/01/03/04/23/changsha-1948535_1280.jpg'
  };
  
  
  

// 定义旅游路线数据
const travelRoutes: TravelRouteInfo[] = [
    {
        id: '1',
        name: '长征精神之旅',
        description: '重走长征路，感受革命历程，传承红色基因',
        imageUrl: 'https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg',
        category: '红色文化',
        durationHours: 168,
        difficulty: 'medium',
        spots: [
            { id: '1-1', name: '瑞金', description: '中华苏维埃共和国临时中央政府所在地' },
            { id: '1-2', name: '遵义', description: '遵义会议旧址，中国革命的转折点' },
            { id: '1-3', name: '娄山关', description: '红军长征中的著名战场' },
            { id: '1-4', name: '懋功会师纪念碑', description: '红一、红四方面军会师纪念地' },
            { id: '1-5', name: '延安', description: '革命圣地，中共中央长期驻地' }
        ]
    },
    {
        id: '2',
        name: '岭南古建筑之旅',
        description: '探访岭南建筑风格，体验广府人文情怀',
        imageUrl: 'https://images.pexels.com/photos/2187662/pexels-photo-2187662.jpeg',
        category: '广府文化',
        durationHours: 72,
        difficulty: 'easy',
        spots: [
            { id: '2-1', name: '陈家祠', description: '清代岭南建筑艺术的典范' },
            { id: '2-2', name: '光孝寺', description: '广州最古老的寺庙，始建于东晋' },
            { id: '2-3', name: '余荫山房', description: '清代广东四大名园之一' },
            { id: '2-4', name: '梁园', description: '岭南园林建筑的经典之作' },
            { id: '2-5', name: '西关大屋', description: '广州传统民居建筑' }
        ]
    },
    {
        id: '3',
        name: '丝路文明探索',
        description: '探寻丝绸之路的历史遗迹，体验东西方文化交融',
        imageUrl: 'https://images.pexels.com/photos/2387319/pexels-photo-2387319.jpeg',
        category: '古代文明',
        durationHours: 240,
        difficulty: 'medium',
        spots: [
            { id: '3-1', name: '西安', description: '古丝绸之路的东方起点' },
            { id: '3-2', name: '敦煌', description: '世界文化遗产莫高窟所在地' },
            { id: '3-3', name: '吐鲁番', description: '古代丝绸之路北道重镇' },
            { id: '3-4', name: '喀什', description: '丝绸之路上的重要商贸城市' }
        ]
    },
    {
        id: '4',
        name: '江南水乡文化之旅',
        description: '感受江南水乡风情，领略文人墨客笔下的诗意江南',
        imageUrl: 'https://images.pexels.com/photos/1440476/pexels-photo-1440476.jpeg',
        category: '文学艺术',
        durationHours: 144,
        difficulty: 'easy',
        spots: [
            { id: '4-1', name: '苏州', description: '园林之城，古典文化底蕴深厚' },
            { id: '4-2', name: '杭州', description: '西湖十景，文人墨客的灵感源泉' },
            { id: '4-3', name: '乌镇', description: '典型的江南水乡古镇' },
            { id: '4-4', name: '周庄', description: '被誉为"中国第一水乡"' },
            { id: '4-5', name: '南京', description: '六朝古都，文化遗产丰富' }
        ]
    },
    {
        id: '5',
        name: '民族风情探索',
        description: '走进少数民族村寨，体验多元民族风情',
        imageUrl: 'https://images.pexels.com/photos/1659438/pexels-photo-1659438.jpeg',
        category: '民族文化',
        durationHours: 192,
        difficulty: 'medium',
        spots: [
            { id: '5-1', name: '丽江', description: '纳西族古城，世界文化遗产' },
            { id: '5-2', name: '香格里拉', description: '藏族文化体验地' },
            { id: '5-3', name: '腾冲', description: '多民族聚居地，温泉之乡' },
            { id: '5-4', name: '西双版纳', description: '傣族文化圣地' }
        ]
    },
    {
        id: '6',
        name: '佛教圣地巡礼',
        description: '探访中国佛教四大名山，感悟佛教智慧',
        imageUrl: 'https://images.pexels.com/photos/2846700/pexels-photo-2846700.jpeg',
        category: '宗教文化',
        durationHours: 288,
        difficulty: 'hard',
        spots: [
            { id: '6-1', name: '五台山', description: '文殊菩萨道场' },
            { id: '6-2', name: '峨眉山', description: '普贤菩萨道场' },
            { id: '6-3', name: '九华山', description: '地藏菩萨道场' },
            { id: '6-4', name: '普陀山', description: '观音菩萨道场' }
        ]
    }
];

const Home: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [activeTab, setActiveTab] = useState<string>('cities');
    // 添加状态来存储从 API 获取的数据
    const [popularCitiesData, setPopularCitiesData] = useState<CityCardData[]>([]);
    const [popularStrategiesData, setPopularStrategiesData] = useState<Strategy[]>([]);
    // 添加搜索框状态
    const [searchTerm, setSearchTerm] = useState<string>('');
    // 添加城市选择器状态
    const [selectedCity, setSelectedCity] = useState<string>('');
    // 添加文化主题选择器状态
    const [selectedTheme, setSelectedTheme] = useState<string>('');
    // 修改ref定义方式
    const themeRefs = useRef<Array<HTMLDivElement | null>>([]);
    // 添加模态框状态
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [activeTheme, setActiveTheme] = useState<CulturalThemeData | null>(null);
    // 获取导航函数
    const navigate = useNavigate();
    // 使用App.useApp获取消息实例
    const { message: messageApi } = App.useApp();

    useEffect(() => {
        // 定义异步函数来加载数据
        const fetchData = async () => {
            setLoading(true);
            try {
                // 并行获取热门景点和热门攻略
                const [hotScenicsResponse, hotStrategiesResponse] = await Promise.all([
                    scenicAPI.getHotScenics(15), // 获取更多热门景点作为城市代表
                    strategyAPI.getHotStrategies(4) // 获取热门攻略
                ]);

                // 1. 从chinaGeoData中获取热门城市
                const popularGeoData = getPopularCities();
                
                // 2. 创建一个城市Map，先用地理数据填充
                const cityMap = new Map<string, CityCardData>();
                popularGeoData.forEach((city, index) => {
                    cityMap.set(city.name, {
                        id: index + 1000, // 避免ID冲突
                        name: city.name,
                        province: city.province,
                        image: cityImageMap[city.name], // 使用预设的图片URL
                        description: `探索${city.name}的文化魅力`
                    });
                });

                // 3. 额外添加一些重要旅游城市
                const additionalTouristCities = ['厦门', '青岛', '三亚', '桂林', '丽江'];
                additionalTouristCities.forEach((cityName, index) => {
                    if (!cityMap.has(cityName)) {
                        cityMap.set(cityName, {
                            id: index + 2000, // 避免ID冲突
                            name: cityName,
                            image: cityImageMap[cityName], // 使用预设的图片URL
                            description: `探索${cityName}的文化魅力`
                        });
                    }
                });

                // 4. 用API返回的景点数据补充或更新
                if (hotScenicsResponse.data && Array.isArray(hotScenicsResponse.data)) {
                    const BACKEND_BASE_URL = process.env.REACT_APP_API_URL?.replace('/api/v1', '') || 'http://localhost:3001';
                    
                    hotScenicsResponse.data.forEach(scenic => {
                        const imageUrl = scenic.cover_image ? `${BACKEND_BASE_URL}${scenic.cover_image}` : null;
                        if (cityMap.has(scenic.city)) {
                            // 如果城市已存在且当前没有图片，则更新图片
                            const existingCity = cityMap.get(scenic.city)!;
                            if (!existingCity.image && imageUrl) {
                                existingCity.image = imageUrl;
                                cityMap.set(scenic.city, existingCity);
                            }
                        } else {
                            // 如果城市不存在，则添加
                            cityMap.set(scenic.city, {
                                id: scenic.id || scenic.scenic_id || Date.now(),
                                name: scenic.city,
                                image: imageUrl || undefined,
                                description: `探索${scenic.city}的文化魅力`
                            });
                        }
                    });
                } else {
                    console.warn('获取热门景点 API 未返回预期的数据结构:', hotScenicsResponse);
                }
                
                // 设置最终的城市数据（最多显示15个城市）
                setPopularCitiesData(Array.from(cityMap.values()).slice(0, 15));

                // 处理热门攻略数据
                if (hotStrategiesResponse && Array.isArray(hotStrategiesResponse)) {
                    setPopularStrategiesData(hotStrategiesResponse);
                } else {
                    console.warn('获取热门攻略 API 未返回预期的数据结构:', hotStrategiesResponse);
                    setPopularStrategiesData([]); // 设置为空数组或显示错误提示
                }

            } catch (error) {
                console.error('加载首页数据失败:', error);
                // 可以在这里设置错误状态，并在 UI 中显示提示
                
                // 即使API失败，也显示预设的城市数据
                const fallbackCities = Object.keys(cityImageMap).map((cityName, index) => ({
                    id: index + 3000,
                    name: cityName,
                    image: cityImageMap[cityName],
                    description: `探索${cityName}的文化魅力`
                }));
                setPopularCitiesData(fallbackCities);
            } finally {
                setLoading(false);
            }
        };

        fetchData(); // 调用加载数据的函数
    }, []); // 空依赖数组，仅在组件挂载时运行

    // 修改搜索提交处理函数
    const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault(); // 阻止表单默认提交行为
        const searchParams = new URLSearchParams();
        
        if (searchTerm.trim()) {
            searchParams.append('keyword', searchTerm.trim());
        }
        if (selectedCity) {
            searchParams.append('city', selectedCity);
        }
        if (selectedTheme) {
            searchParams.append('culturalTheme', selectedTheme);
        }
        
        // 跳转到景点搜索结果页，带上关键词、城市和文化主题
        navigate(`/scenic?${searchParams.toString()}`);
    };

    // 处理点击城市"探索"按钮的函数
    const handleExploreCity = (cityName: string) => {
        navigate(`/scenic?city=${encodeURIComponent(cityName)}`);
    };

    // 处理点击文化主题"探索"按钮的函数
    const handleExploreTheme = (themeCode: string) => {
        navigate(`/scenic?culturalTheme=${encodeURIComponent(themeCode)}`);
    };

    // 处理点击"查看攻略"按钮的函数
    const handleViewStrategy = (strategyId: number | undefined) => {
        if (!strategyId) {
            console.error('攻略ID未定义');
            messageApi.error('无法查看攻略详情，ID不存在');
            return;
        }
        navigate(`/strategies/${strategyId}`);
    };

    // 处理点击文化主题卡片，显示浮动模态框
    const handleThemeCardClick = (theme: CulturalThemeData) => {
        setActiveTheme(theme);
        setIsModalVisible(true);
    };

    // 处理关闭模态框
    const handleCloseModal = () => {
        setIsModalVisible(false);
    };

    // 处理点击模态框中的探索按钮
    const handleModalExplore = (themeCode: string) => {
        navigate(`/scenic?culturalTheme=${encodeURIComponent(themeCode)}`);
        setIsModalVisible(false);
    };

    // 处理查看旅游路线的函数
    const handleViewRoute = (routeId: string) => {
        navigate(`/itineraries?tab=culture&routeId=${routeId}`);
    };

    return (
        <App>
            <div className="home-container">
                <section className="hero-section">
                    <div className="hero-content">
                        <h1>探索中华文化，感受文明魅力</h1>
                        <p>发现令人惊叹的文化旅游目的地，规划您的精神之旅</p>
                        {/* 修改搜索框为表单，添加城市选择器和文化主题选择器 */}
                        <form className="search-box" onSubmit={handleSearchSubmit}>
                            <div className="search-inputs">
                                <CitySelector
                                    value={selectedCity}
                                    onChange={setSelectedCity}
                                    placeholder="选择城市"
                                    style={{ width: '150px', marginRight: '10px' }}
                                    size="large"
                                />
                                <select 
                                    className="theme-selector"
                                    value={selectedTheme}
                                    onChange={(e) => setSelectedTheme(e.target.value)}
                                    style={{ width: '150px', marginRight: '10px', height: '40px', borderRadius: '4px', border: '1px solid #d9d9d9' }}
                                >
                                    <option value="">选择文化主题</option>
                                    {culturalThemes.map(theme => (
                                        <option key={theme.id} value={theme.code}>{theme.name}</option>
                                    ))}
                                </select>
                                <input
                                    type="text"
                                    placeholder="搜索景点、文化体验或攻略"
                                    className="search-input"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button type="submit" className="search-button">搜索</button>
                        </form>
                    </div>
                </section>

                {loading ? (
                    <div className="loading">加载中...</div>
                ) : (
                    <>
                        {/* 文化景点探索部分 - 使用新的设计 */}
                        <section className="culture-explore-section">
                            <div className="section-title">
                                <h2>文化景点探索</h2>
                                <p>发现中国丰富的文化遗产，感受不同地区的历史与传统</p>
                            </div>
                            
                            <div className="culture-explore-cards">
                                {culturalThemes.map((theme, index) => (
                                    <div 
                                        className="culture-explore-card" 
                                        key={theme.id}
                                        ref={el => {
                                            themeRefs.current[index] = el;
                                            return undefined;
                                        }}
                                        onClick={() => handleThemeCardClick(theme)}
                                        style={{
                                            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${theme.image})`,
                                            borderBottomColor: theme.color
                                        }}
                                    >
                                        <div className="card-icon" style={{ backgroundColor: theme.color }}>
                                            {/* 可以根据主题类型添加对应图标 */}
                                        </div>
                                        <h3>{theme.name}</h3>
                                        <p>{theme.description}</p>
                                        <div className="card-overlay">
                                            <button 
                                                className="overlay-button"
                                                style={{ backgroundColor: theme.color }}
                                            >
                                                了解更多
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* 浮动模态框改为居中显示的模态框 */}
                            {isModalVisible && activeTheme && (
                                <>
                                    <div className="modal-backdrop" onClick={handleCloseModal}></div>
                                    <div className="culture-explore-modal">
                                        <div className="modal-content" style={{ borderTop: `4px solid ${activeTheme.color}` }}>
                                            <button 
                                                className="modal-close-btn" 
                                                onClick={handleCloseModal}
                                            >
                                                ×
                                            </button>
                                            <h3>{activeTheme.name}</h3>
                                            <div className="modal-description">
                                                <p>{activeTheme.description}</p>
                                                
                                                {/* 显示子主题列表 */}
                                                {activeTheme.subThemes && activeTheme.subThemes.length > 0 && (
                                                    <div className="subthemes-list">
                                                        <h4>包含以下文化主题:</h4>
                                                        <ul>
                                                            {activeTheme.subThemes.map((subTheme: SubTheme) => (
                                                                <li key={subTheme.id}>
                                                                    <a onClick={() => handleModalExplore(subTheme.code)}>
                                                                        {subTheme.name} - {subTheme.description}
                                                                    </a>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="option-cards">
                                                <div className="option-card" onClick={() => handleModalExplore(activeTheme.code)}>
                                                    <h3>景点游览</h3>
                                                    <p>探索与{activeTheme.name}相关的特色景点</p>
                                                </div>
                                                <div className="option-card" onClick={() => navigate(`/strategies?theme=${activeTheme.code}`)}>
                                                    <h3>特色攻略</h3>
                                                    <p>查看{activeTheme.name}主题的精选攻略</p>
                                                </div>
                                                <div className="option-card" onClick={() => navigate(`/routes?theme=${activeTheme.code}`)}>
                                                    <h3>推荐路线</h3>
                                                    <p>体验精心设计的{activeTheme.name}路线</p>
                                                </div>
                                            </div>
                                            <Button 
                                                type="primary" 
                                                size="large"
                                                block
                                                style={{ backgroundColor: activeTheme.color, borderColor: activeTheme.color }}
                                                onClick={() => handleModalExplore(activeTheme.code)}
                                            >
                                                开始探索
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </section>

                        <section className="tabs-section">
                            <div className="tabs-container">
                                <button
                                    className={`tab-button ${activeTab === 'cities' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('cities')}
                                >
                                    热门城市
                                </button>
                                <button
                                    className={`tab-button ${activeTab === 'strategies' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('strategies')}
                                >
                                    精选文化攻略
                                </button>
                            </div>

                            <div className="tab-content">
                                {activeTab === 'cities' && (
                                    <div className="cities-grid">
                                        {popularCitiesData.length > 0 ? (
                                            popularCitiesData.map(city => (
                                                <CityCard
                                                    key={city.id}
                                                    id={city.id}
                                                    name={city.name}
                                                    image={city.image}
                                                    description={city.description}
                                                    province={city.province}
                                                    onExplore={handleExploreCity}
                                                />
                                            ))
                                        ) : (
                                            <div className="empty-state">暂无城市数据</div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'strategies' && (
                                    <div className="strategies-grid">
                                        {popularStrategiesData.length > 0 ? (
                                            popularStrategiesData.map(strategy => {
                                                // 确定文化主题标签 (模拟数据，实际应从API获取)
                                                const culturalThemeTag = Math.floor(Math.random() * culturalThemes.length);
                                                const theme = culturalThemes[culturalThemeTag];
                                                
                                                return (
                                                    <FeaturedStrategyCard
                                                        key={strategy.id || strategy.strategy_id}
                                                        strategy={strategy}
                                                        theme={theme}
                                                        onView={handleViewStrategy}
                                                    />
                                                );
                                            })
                                        ) : (
                                            <div className="empty-state">暂无攻略数据</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="featured-routes-section">
                            <div className="travel-routes-header">
                                <h2>特色文化路线推荐</h2>
                                <div className="travel-routes-filters">
                                    {/* 这里可以添加筛选控件 */}
                                </div>
                            </div>
                            
                            <div className="travel-routes-grid">
                                {travelRoutes.map(route => (
                                    <TravelRouteCard 
                                        key={route.id}
                                        route={route}
                                        onClick={handleViewRoute}
                                    />
                                ))}
                            </div>
                        </section>
                    </>
                )}
            </div>
        </App>
    );
};

export default Home; 