import React, { useEffect, useState, useRef, useCallback } from 'react';
// 暂时移除 echarts 相关导入
// import ReactECharts from 'echarts-for-react';
// import * as echarts from 'echarts';
import { message, Card, Empty, Spin } from 'antd';
// 移除axios导入，如果不需要的话
// import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import transportAPI from '../../api/transportAPI'; // 导入新的统一交通API
import { TrainLineInfo, TrainSeatInfo, SleeperSeatInfo } from '../../api/trainTicket';
import { FlightInfo } from '../../api/flightTicket';
import TrainTicketCard from './TrainTicketCard';
import FlightTicketCard from './FlightTicketCard';
import dayjs from 'dayjs';
import AMapLoader from '@amap/amap-jsapi-loader';
import './ChinaMapStyles.css'; // 导入自定义样式表
import { LeftOutlined, RightOutlined, WarningOutlined } from '@ant-design/icons';

// 为 window 对象添加 _AMapSecurityConfig 类型定义
declare global {
  interface Window {
    _AMapSecurityConfig?: {
      securityJsCode: string;
    };
  }
}

// 确保不会加载百度地图API
// 百度地图API已被替换为高德地图API，请勿重新引入百度地图API

// 交通类型常量定义
const TRANSPORT_TYPE = {
  ALL: 'ALL',
  PLANE: 'PLANE',
  TRAIN: 'TRAIN',
  BUS: 'BUS',
  CAR: 'CAR'
};

// 中国地图组件接口
interface ChinaMapProps {
  selectedCity?: string;
  targetCity?: string;
  transportType?: string;
  onCitySelect?: (city: string) => void;
  showRoutes?: boolean;
  selectedDate?: string;
  featuredRouteSpots?: Array<{
    id: number;
    name: string;
    order_number: number;
    latitude?: number | null;
    longitude?: number | null;
    description?: string;
  }>;
  routeName?: string;
}

// 添加简单直线绘制函数作为降级方案
const drawSimpleLine = (
  mapInstance: AMap.Map,
  fromCity: { name: string, location: [number, number] },
  toCity: { name: string, location: [number, number] },
  style: AMap.PolylineOptions,
  routeLineRef: React.MutableRefObject<AMap.Polyline | null>
) => {
  console.log('使用简单直线作为降级方案，连接:', fromCity.name, '到', toCity.name);
  
  // 确保路线引用是干净的
  if (routeLineRef.current) {
    try {
      routeLineRef.current.setMap(null);
    } catch (e) {
      console.warn('移除现有路线失败:', e);
    }
    routeLineRef.current = null;
  }
  
  if (!window.AMap) {
      console.error('AMap not loaded, cannot draw simple line.');
      return;
  }
  
  try {
    // 使用两点画直线
    const path = [
        new window.AMap.LngLat(fromCity.location[0], fromCity.location[1]),
        new window.AMap.LngLat(toCity.location[0], toCity.location[1])
    ];
    routeLineRef.current = new window.AMap.Polyline({
      path,
      ...style,
      lineJoin: 'round',
      lineCap: 'round',
      showDir: true
    });
    
    // 确保在访问前检查null
    if (routeLineRef.current) {
      routeLineRef.current.setMap(mapInstance);
      mapInstance.setFitView([routeLineRef.current]);
    }
    
    console.log('简单直线绘制成功');
  } catch (error: any) {
    console.error('简单直线绘制失败:', error);
    // 最终降级：不显示任何路线，只调整视图包含两个城市
    try {
      mapInstance.setFitView([
        new window.AMap.Marker({ position: new window.AMap.LngLat(fromCity.location[0], fromCity.location[1]) }),
        new window.AMap.Marker({ position: new window.AMap.LngLat(toCity.location[0], toCity.location[1]) })
      ]);
    } catch (viewError: any) {
      console.error('调整视野失败:', viewError);
    }
  }
};

// 添加贝塞尔曲线绘制函数，提供更自然的路线外观
const drawBezierCurve = (
  mapInstance: AMap.Map,
  fromCity: { name: string, location: [number, number] },
  toCity: { name: string, location: [number, number] },
  style: AMap.PolylineOptions,
  routeLineRef: React.MutableRefObject<AMap.Polyline | null>,
  transportType: string
) => {
  console.log('使用贝塞尔曲线作为降级方案，连接:', fromCity.name, '到', toCity.name);
  
  // 确保路线引用是干净的
  if (routeLineRef.current) {
    try {
      routeLineRef.current.setMap(null);
    } catch (e) {
      console.warn('移除现有路线失败:', e);
    }
    routeLineRef.current = null;
  }
  
  if (!window.AMap) {
      console.error('AMap not loaded, cannot draw Bezier curve.');
      return;
  }
  
  try {
    // 根据交通类型创建不同的曲线控制点
    const fromLngLat = new window.AMap.LngLat(fromCity.location[0], fromCity.location[1]);
    const toLngLat = new window.AMap.LngLat(toCity.location[0], toCity.location[1]);
    
    // 计算中点和距离
    const midPoint = new window.AMap.LngLat((fromLngLat.getLng() + toLngLat.getLng()) / 2, (fromLngLat.getLat() + toLngLat.getLat()) / 2);
    let distance = 0;
    if (window.AMap.GeometryUtil) {
        distance = window.AMap.GeometryUtil.distance(fromLngLat, toLngLat);
    } else {
        console.warn('AMap.GeometryUtil not available, distance calculation might be inaccurate.');
    }
    
    // 控制点偏移量根据距离和交通类型调整
    let offsetRatio = 0.2; // 默认偏移比例
    if (transportType === TRANSPORT_TYPE.PLANE) {
      offsetRatio = 0.3; // 飞机路线弯曲更明显
    } else if (transportType === TRANSPORT_TYPE.TRAIN) {
      offsetRatio = 0.15; // 火车路线稍微弯曲
    }
    
    // 控制点坐标 (垂直于连线方向偏移)
    const deltaLng = toLngLat.getLng() - fromLngLat.getLng();
    const deltaLat = toLngLat.getLat() - fromLngLat.getLat();
    const norm = Math.sqrt(deltaLng * deltaLng + deltaLat * deltaLat);
    
    // 计算控制点
    let controlLng, controlLat;
    const degreeDistance = Math.sqrt(Math.pow(deltaLng, 2) + Math.pow(deltaLat, 2));

    if (norm > 1e-6) {
      controlLng = midPoint.getLng() + (deltaLat / norm) * degreeDistance * offsetRatio;
      controlLat = midPoint.getLat() - (deltaLng / norm) * degreeDistance * offsetRatio;
    } else {
      // 避免除以零或非常接近的点
      controlLng = midPoint.getLng();
      controlLat = midPoint.getLat() + degreeDistance * offsetRatio;
    }
    const controlPoint = new window.AMap.LngLat(controlLng, controlLat);
    
    // 生成贝塞尔曲线路径
    const bezierCurve = new window.AMap.BezierCurve({
        map: mapInstance,
        path: [
          [fromLngLat.getLng(), fromLngLat.getLat()],
          [controlPoint.getLng(), controlPoint.getLat()],
          [toLngLat.getLng(), toLngLat.getLat()]
        ] as any, // 使用类型断言解决类型问题
        ...style,
    });

    // Get the points from the Bezier curve to create a styled Polyline
    const path: AMap.LngLat[] = [];
    const pointCount = 50; // 控制点的数量

    for (let i = 0; i <= pointCount; i++) {
        const t = i / pointCount;
        const fromLng = fromCity.location[0];
        const fromLat = fromCity.location[1];
        const toLng = toCity.location[0];
        const toLat = toCity.location[1];
        const ctrlLng = controlPoint.getLng();
        const ctrlLat = controlPoint.getLat();

        const lng = Math.pow(1 - t, 2) * fromLng +
                   2 * (1 - t) * t * ctrlLng +
                   Math.pow(t, 2) * toLng;
        const lat = Math.pow(1 - t, 2) * fromLat +
                   2 * (1 - t) * t * ctrlLat +
                   Math.pow(t, 2) * toLat;
        path.push(new window.AMap.LngLat(lng, lat));
    }

    // 销毁临时的 BezierCurve 对象 (如果创建了)
    routeLineRef.current = new window.AMap.Polyline({
      path,
      ...style,
      lineJoin: 'round',
      lineCap: 'round',
      showDir: true
    });
    
    // 确保在访问前检查null
    if (routeLineRef.current) {
      routeLineRef.current.setMap(mapInstance);
      mapInstance.setFitView([routeLineRef.current]);
    }
    
    console.log('贝塞尔曲线绘制成功');
  } catch (error: any) {
    console.error('贝塞尔曲线绘制失败:', error);
    // 降级到简单直线
    drawSimpleLine(mapInstance, fromCity, toCity, style as AMap.PolylineOptions, routeLineRef);
  }
};

// 添加自定义信息窗口内容创建函数
const createInfoWindowContent = (cityName: string, isCitySelected: boolean, isTargetCity: boolean) => {
  // 根据城市状态确定标题样式和图标
  let statusText = '';
  let bgColorClass = '';
  
  if (isCitySelected) {
    statusText = '出发城市';
    bgColorClass = 'style="background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%) !important;"';
  } else if (isTargetCity) {
    statusText = '目的地城市';
    bgColorClass = 'style="background: linear-gradient(135deg, #fa8c16 0%, #d46b08 100%) !important;"';
  } else {
    statusText = '可选择的城市';
  }
  
  // 城市描述 - 可以从一个城市描述映射表中获取或使用固定描述
  const cityDesc = getCityDescription(cityName);
  
  // 构建HTML内容 - 按照CSS选择器要求的结构安排
  return `
    <div>
      <div></div>
      <div ${bgColorClass}>
        <span>${cityName}</span>
        <span>${cityName.length > 0 ? cityName[0] : ''}</span>
      </div>
      <div>${cityDesc}</div>
      <div>
        <!-- "点击查看详情"文字已被CSS隐藏，这里只是占位 -->
        <span></span>
      </div>
    </div>
  `;
};

// 添加一个城市描述获取函数
const getCityDescription = (cityName: string): string => {
  const cityDescriptions: Record<string, string> = {
    '北京': '中国首都，拥有丰富的历史文化遗产和现代都市风貌。',
    '上海': '中国最大的经济中心，国际化大都市。',
    '广州': '中国南方的经济、文化中心，粤菜美食之都。',
    '深圳': '中国改革开放的窗口，科技创新中心。',
    '南京': '六朝古都，历史文化底蕴深厚。',
    '杭州': '风景秀丽的城市，"上有天堂，下有苏杭"。',
    '武汉': '长江经济带中心城市，九省通衢。',
    '成都': '休闲之都，熊猫故乡，美食天堂。',
    '重庆': '山城，长江上游经济中心，火锅之都。',
    '西安': '古丝绸之路起点，十三朝古都。',
    '桂林': '山水甲天下，风景优美的旅游胜地。',
    '丽江': '世界文化遗产，古城风光秀丽。',
    '西宁': '青海省省会，青藏高原重要城市。',
    '拉萨': '西藏自治区首府，藏文化中心。',
    '乌鲁木齐': '新疆维吾尔自治区首府，亚欧大陆腹地。',
    '香港': '国际金融中心，东西方文化交融的大都市。'
  };
  
  return cityDescriptions[cityName] || `${cityName}是中国著名城市，拥有独特的人文风景和美食文化。`;
};

const ChinaMap: React.FC<ChinaMapProps> = ({
  selectedCity,
  targetCity,
  transportType,
  onCitySelect,
  showRoutes = true,
  selectedDate = dayjs().format('YYYY-MM-DD'), // 默认为当天
  featuredRouteSpots = [], // 默认为空数组
  routeName
}) => {
  const navigate = useNavigate();
  // 状态管理
  const [loading, setLoading] = useState<boolean>(true);
  const [initialized, setInitialized] = useState<boolean>(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<AMap.Map | null>(null);
  const markersRef = useRef<AMap.Marker[]>([]);
  const routeLineRef = useRef<AMap.Polyline | null>(null);
  
  // 添加票务面板显示状态
  const [showTicketPanel, setShowTicketPanel] = useState<boolean>(true);
  
  // 添加精选路线警告状态
  const [showRouteWarning, setShowRouteWarning] = useState<boolean>(false);
  const [warningMessage, setWarningMessage] = useState<string>('');
  
  // 火车票信息相关状态
  const [trainTickets, setTrainTickets] = useState<TrainLineInfo[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState<boolean>(false);
  
  // 机票信息相关状态
  const [flightTickets, setFlightTickets] = useState<FlightInfo[]>([]);
  const [isLoadingFlights, setIsLoadingFlights] = useState<boolean>(false);
  
  // 主要城市数据
  const majorCities: { name: string, location: [number, number] }[] = [
    { name: '北京', location: [116.407394, 39.904211] },
    { name: '上海', location: [121.473701, 31.230416] },
    { name: '广州', location: [113.264385, 23.129112] },
    { name: '深圳', location: [114.057868, 22.543099] },
    { name: '南京', location: [118.796877, 32.060255] },
    { name: '杭州', location: [120.209947, 30.245853] },
    { name: '武汉', location: [114.305393, 30.593099] },
    { name: '成都', location: [104.065735, 30.659462] },
    { name: '重庆', location: [106.551557, 29.563009] },
    { name: '西安', location: [108.948021, 34.263161] },
    { name: '桂林', location: [110.290194, 25.273566] },
    { name: '丽江', location: [100.233026, 26.872108] },
    { name: '西宁', location: [101.778228, 36.617144] },
    { name: '拉萨', location: [91.117212, 29.646923] },
    { name: '乌鲁木齐', location: [87.616848, 43.825592] },
    { name: '香港', location: [114.173355, 22.320048] }
  ];

  // 城市数据状态管理
  const [citiesData, setCitiesData] = useState(majorCities);

  // 在这里添加地图相关的引用
  const mapClickListenerRef = useRef<any>(null); // 添加地图点击事件引用
  const markerFromRef = useRef<AMap.Marker | null>(null); // 添加出发城市标记引用
  const markerToRef = useRef<AMap.Marker | null>(null); // 添加目的地城市标记引用

  // 抽取火车票查询逻辑
  const fetchTrainTickets = useCallback(async () => {
    if (!selectedCity || !targetCity) {
      console.log('缺少出发或目的地城市，无法查询火车票信息。');
      return;
    }
    
    setIsLoadingTickets(true);
    try {
      const response = await transportAPI.queryTrainTickets({
        fromStation: selectedCity,
        toStation: targetCity,
        fromDate: selectedDate
      });
      
      if (response && response.data && response.data.trainLines) {
        setTrainTickets(response.data.trainLines);
        console.log(`查询到 ${response.data.trainLines.length} 班火车线路。`);
      } else {
        console.warn('火车票数据格式异常:', response);
        // 使用硬编码的火车票数据
        const hardcodedTrains = getHardcodedTrains(selectedCity, targetCity);
        setTrainTickets(hardcodedTrains);
        console.log(`使用硬编码的 ${hardcodedTrains.length} 班火车线路。`);
      }
    } catch (error) {
      console.error('查询火车票信息失败:', error);
      message.error('查询火车票信息失败，使用硬编码数据');
      
      // 使用硬编码的火车票数据
      const hardcodedTrains = getHardcodedTrains(selectedCity, targetCity);
      setTrainTickets(hardcodedTrains);
      console.log(`使用硬编码的 ${hardcodedTrains.length} 班火车线路。`);
    } finally {
      setIsLoadingTickets(false);
    }
  }, [selectedCity, targetCity, selectedDate]);
  
  // 抽取机票查询逻辑
  const fetchFlightTickets = useCallback(async () => {
    if (!selectedCity || !targetCity) {
      console.log('缺少出发或目的地城市，无法查询机票信息。');
      return;
    }
    
    setIsLoadingFlights(true);
    try {
      const response = await transportAPI.queryFlightTickets({
        fromCity: selectedCity,
        toCity: targetCity,
        fromDate: selectedDate
      });
      
      if (response && response.data && response.data.flights) {
        setFlightTickets(response.data.flights);
        console.log(`查询到 ${response.data.flights.length} 个航班。`);
      } else {
        console.warn('机票数据格式异常:', response);
        // 使用硬编码的机票数据
        const hardcodedFlights = getHardcodedFlights(selectedCity, targetCity);
        setFlightTickets(hardcodedFlights);
        console.log(`使用硬编码的 ${hardcodedFlights.length} 个航班。`);
      }
    } catch (error) {
      console.error('查询机票信息失败:', error);
      message.error('查询机票信息失败，使用硬编码数据');
      
      // 使用硬编码的机票数据
      const hardcodedFlights = getHardcodedFlights(selectedCity, targetCity);
      setFlightTickets(hardcodedFlights);
      console.log(`使用硬编码的 ${hardcodedFlights.length} 个航班。`);
    } finally {
      setIsLoadingFlights(false);
    }
  }, [selectedCity, targetCity, selectedDate]);
  
  // 处理选择特定火车的函数
  const handleSelectTrain = useCallback((train: TrainLineInfo) => {
    // 可以在这里实现高亮显示选中火车的路线等功能
    message.info(`已选择 ${train.trainCode} 次列车`);
  }, []);
  
  // 处理选择特定航班的函数
  const handleSelectFlight = useCallback((flight: FlightInfo) => {
    // 可以在这里实现高亮显示选中航班的路线等功能
    message.info(`已选择 ${flight.airline} ${flight.flightNo} 航班，正在跳转至预订页面...`);
    
    // 导航到机票预订页面，并传递航班信息作为状态
    navigate('/flight-booking', { state: { flightInfo: flight } });
  }, [navigate]);

  // 加载高德地图SDK
  useEffect(() => {
    // Checklist Item 3: Use environment variables
    const amapJsKey = process.env.REACT_APP_AMAP_JS_KEY;
    const amapSecurityCode = process.env.REACT_APP_AMAP_SECURITY_CODE;

    if (!amapJsKey) {
        console.error('高德地图JS密钥未在环境变量中配置 (REACT_APP_AMAP_JS_KEY)');
        setLoading(false);
        message.error('地图配置错误，无法加载地图');
        return;
    }
    if (!amapSecurityCode) {
        console.warn('高德地图安全密钥未在环境变量中配置 (REACT_APP_AMAP_SECURITY_CODE)。地图可能存在安全问题');
        // 没有安全码仍然继续，但记录警告
    }

    // 设置安全密钥 (确保在加载脚本之前设置)
    if (amapSecurityCode) {
        window._AMapSecurityConfig = {
            securityJsCode: amapSecurityCode
        };
        console.log('设置高德地图安全密钥');
    }

    let isMounted = true;

    // 使用AMapLoader.load方法加载高德地图，而不是通过script标签
    const loadMap = async () => {
      if (window.AMap) {
        // 地图API已加载，直接初始化
        if (isMounted) {
          console.log('高德地图已加载，直接初始化');
          initializeMap();
        }
        return;
      }

      try {
        console.log('开始加载高德地图SDK...');
        await AMapLoader.load({
          key: amapJsKey,
          version: "2.0",
          plugins: [
            "AMap.Scale",
            "AMap.ToolBar",
            "AMap.Driving",
            "AMap.Transfer",
            "AMap.PlaceSearch",
            "AMap.Geocoder",
            "AMap.DistrictSearch",
            "AMap.BezierCurve" // 确保贝塞尔曲线插件加载
          ]
        });
        
        if (isMounted) {
          console.log('高德地图SDK加载成功');
          initializeMap();
        }
      } catch (error) {
        console.error('高德地图加载失败，详细错误:', error);
        if (isMounted) {
          setLoading(false);
          message.error('地图核心脚本加载失败，请检查网络或刷新页面重试');
        }
      }
    };

    loadMap();

    return () => {
        // 标记组件已卸载
        isMounted = false;
        console.log('地图组件即将卸载，清理资源');
        
        // 组件卸载时销毁地图实例
        const currentMap = mapInstanceRef.current;
        if (currentMap) {
            markersRef.current.forEach(marker => {
                try {
                    marker.setMap(null);
                } catch (e) {
                    console.warn('移除标记失败:', e);
                }
            });
            markersRef.current = [];
            
            if (routeLineRef.current) {
                try {
                    routeLineRef.current.setMap(null);
                } catch (e) {
                    console.warn('移除路线失败:', e);
                }
                routeLineRef.current = null;
            }
            
            try {
                currentMap.destroy();
                console.log('地图实例已销毁');
            } catch (e) {
                console.warn('销毁地图实例失败:', e);
            }
            mapInstanceRef.current = null;
        }
    };
  }, []); // 空依赖数组确保此效果只在挂载时运行一次

  // 监听选中的城市、目标城市或日期变化时查询交通信息
  useEffect(() => {
    if (!initialized) {
      console.log('地图尚未初始化，不执行交通信息查询');
      return;
    }
    
    // 处理transportType，确保有默认值
    const normalizedTransportType = transportType?.toUpperCase() || TRANSPORT_TYPE.ALL;
    console.log('交通类型变化，当前类型:', transportType, '(规范化后:', normalizedTransportType, ')');
    
    if (normalizedTransportType === TRANSPORT_TYPE.ALL) {
      console.log('全部交通模式，同时查询飞机和火车信息');
      // 在全部模式下，同时查询飞机和火车信息
      if (selectedCity && targetCity) {
        fetchTrainTickets();
        fetchFlightTickets();
        drawRoute();
      }
    } else if (normalizedTransportType === TRANSPORT_TYPE.TRAIN) {
      console.log('查询火车票信息...');
      fetchTrainTickets();
      setFlightTickets([]); // 清空机票数据
    } else if (normalizedTransportType === TRANSPORT_TYPE.PLANE) {
      console.log('查询机票信息...');
      fetchFlightTickets();
      setTrainTickets([]); // 清空火车票数据
    } else {
      console.log('其他交通类型:', normalizedTransportType);
      // 其他交通方式不查询票务信息，但仍然绘制路线
      if (selectedCity && targetCity) {
        drawRoute();
      }
    }
  }, [selectedCity, targetCity, selectedDate, transportType, initialized, fetchTrainTickets, fetchFlightTickets]);

  // 初始化地图
  const initializeMap = () => {
    if (!mapContainerRef.current) {
      console.error('Map container ref is not available.');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    try {
      if (!window.AMap) {
        console.error('AMap not loaded.');
        setLoading(false);
        message.error('地图加载失败，请刷新页面重试');
        return;
      }
        
      // 创建地图实例
      const map = new window.AMap.Map(mapContainerRef.current, {
          zoom: 5,
          center: new window.AMap.LngLat(104.297104, 35.86166), // 中国地图中心点
          mapStyle: 'amap://styles/normal', // 普通样式
          resizeEnable: true
      });

      // 添加控件
      try {
        // 高德地图2.0版本控件API变更，使用正确的方式创建控件
        if (window.AMap.plugin) {
          window.AMap.plugin(['AMap.Scale', 'AMap.ToolBar'], function() {
            // 加载完插件后创建控件实例
            const scale = new window.AMap.Scale({
              position: 'LB', // 左下角
              offset: new window.AMap.Pixel(10, 10)
            });
            const toolBar = new window.AMap.ToolBar({
              position: {
                right: '10px',
                bottom: '10px'
              } as any
            });
            
            map.addControl(scale);
            map.addControl(toolBar);
            console.log('地图控件加载成功');
          });
        } else {
          console.warn('AMap.plugin 方法不可用，无法加载控件');
        }
      } catch (controlError) {
        console.warn('添加地图控件失败，但地图仍可使用:', controlError);
        // 控件加载失败不阻止地图初始化
      }
      
      // 即使控件加载失败，仍然继续初始化地图
      mapInstanceRef.current = map;
      addCityMarkers();
      setInitialized(true);
      setLoading(false);
      
      // 添加错误捕获和恢复机制
      if (map && typeof map.on === 'function') {
          // 已有点击事件处理
          map.on('click', (e: any) => {
              // 地理编码查询增加错误处理
              try {
                const geocoder = new window.AMap.Geocoder();
                const lnglat: [number, number] = [e.lnglat.getLng(), e.lnglat.getLat()];
                geocoder.getAddress(lnglat, (status: string, result: any) => {
                    if (status === 'complete' && typeof result !== 'string' && result.info === 'OK' && result.regeocode) {
                        const address = result.regeocode;
                        const cityName = address.addressComponent.city || address.addressComponent.province;
                        if (cityName && onCitySelect) {
                            const formattedCityName = cityName.replace(/市$/, '');
                            onCitySelect(formattedCityName);
                        }
                    } else {
                        console.warn('地理编码查询失败:', status, result?.info);
                        message.warning('无法获取该位置的城市信息');
                    }
                });
              } catch (geocodeError) {
                console.error('地理编码处理错误:', geocodeError);
                message.error('地理编码查询失败');
              }
          });
          
          // 增加地图加载完成事件
          map.on('complete', () => {
            console.log('地图完全加载完成，可以使用了');
            // 可以在这里执行一些需要地图完全加载后的操作
          });
      } else {
          console.warn('地图实例或map.on方法不可用，无法添加事件监听');
      }
    } catch (error: any) {
        console.error('地图初始化详细错误:', error);
        setLoading(false);
        message.error('地图初始化失败，请刷新页面重试');
    }
  };

  // 修改添加城市标记的函数
  const addCityMarkers = () => {
    if (!mapInstanceRef.current || !window.AMap) {
      console.error('地图实例或AMap未准备好，无法添加标记');
      return;
    }
    
    console.log('开始添加城市/景点标记');
    const map = mapInstanceRef.current;
    
    // 清理现有标记
    markersRef.current.forEach(marker => {
      marker.setMap(null);
    });
    markersRef.current = [];
    
    // 优先处理精选路线景点
    if (featuredRouteSpots && featuredRouteSpots.length > 0) {
      console.log(`添加${featuredRouteSpots.length}个精选路线景点标记`);
      let hasValidCoordinates = false;
      let spotsWithCoordinates = 0;
      
      // 收集有效坐标的景点，并转换为AMap.LngLat数组用于设置地图视野
      const validMarkers: AMap.Marker[] = [];
      const validPositions: AMap.LngLat[] = [];
      
      // 使用默认位置中心（北京）
      const defaultCenter = new window.AMap.LngLat(116.407394, 39.904211);
      
      // 遍历所有景点，创建标记
      featuredRouteSpots.forEach((spot, index) => {
        // 检查是否有有效的坐标
        if (spot.latitude && spot.longitude) {
          hasValidCoordinates = true;
          spotsWithCoordinates++;
          
          try {
            // 创建自定义内容的标记
            const markerContent = document.createElement('div');
            markerContent.className = 'custom-marker';
            markerContent.innerHTML = `
              <div class="marker-icon">
                <div class="marker-label">${spot.order_number || index+1}</div>
              </div>
            `;
            
            // 创建标记
            const marker = new window.AMap.Marker({
              map: map,
              position: new window.AMap.LngLat(spot.longitude, spot.latitude),
              title: spot.name,
              offset: new window.AMap.Pixel(-15, -30),
              content: markerContent
            });
            
            // 创建信息窗口
            const infoWindow = new window.AMap.InfoWindow({
              content: `<div class="info-window">
                <h4>${spot.name}</h4>
                <p>序号: ${spot.order_number || index+1}</p>
                ${spot.description ? `<div class="spot-description">${spot.description}</div>` : ''}
              </div>`,
              offset: new window.AMap.Pixel(0, -30)
            });
            
            // 添加点击事件
            marker.on('click', () => {
              infoWindow.open(map, marker.getPosition());
            });
            
            // 添加悬停事件
            marker.on('mouseover', () => {
              infoWindow.open(map, marker.getPosition());
            });
            
            marker.on('mouseout', () => {
              setTimeout(() => {
                infoWindow.close();
              }, 300);
            });
            
            // 添加到标记数组
            markersRef.current.push(marker);
            validMarkers.push(marker);
            validPositions.push(new window.AMap.LngLat(spot.longitude, spot.latitude));
          } catch (error) {
            console.error(`创建景点"${spot.name}"的标记失败:`, error);
          }
        } else {
          console.warn(`景点"${spot.name}"缺少坐标信息，无法在地图上标记`);
        }
      });
      
      // 检查是否需要显示警告
      if (spotsWithCoordinates === 0) {
        setWarningMessage('所有景点都缺少位置坐标，无法在地图上显示路线。');
        setShowRouteWarning(true);
        
        // 如果没有有效坐标，设置地图中心为默认位置
        map.setCenter(defaultCenter);
        // 安全地设置缩放级别 - 使用any类型转换避免TypeScript错误
        (map as any).setZoom(5);
      } else if (spotsWithCoordinates < featuredRouteSpots.length) {
        setWarningMessage(`部分景点(${featuredRouteSpots.length - spotsWithCoordinates}/${featuredRouteSpots.length})缺少位置坐标，地图显示不完整。`);
        setShowRouteWarning(true);
        
        // 调整地图视野以包含所有有效标记
        if (validPositions.length > 0) {
          map.setFitView(validMarkers);
        }
      } else {
        // 所有点都有坐标，调整地图视野
        map.setFitView(validMarkers);
      }
      
      // 如果有多个有效坐标，尝试绘制路线
      if (validPositions.length > 1) {
        try {
          // 按order_number排序位置点
          const orderedPositions = [...validPositions].sort((a, b) => {
            const spotA = featuredRouteSpots.find(s => s.longitude === a.getLng() && s.latitude === a.getLat());
            const spotB = featuredRouteSpots.find(s => s.longitude === b.getLng() && s.latitude === b.getLat());
            return (spotA?.order_number || 0) - (spotB?.order_number || 0);
          });
          
          // 清理现有路线
          if (routeLineRef.current) {
            routeLineRef.current.setMap(null);
            routeLineRef.current = null;
          }
          
          // 尝试使用驾车路线规划
          if (window.AMap && window.AMap.Driving) {
            // 创建临时路线
            const tempPolyline = new window.AMap.Polyline({
              path: orderedPositions,
              strokeColor: '#1890ff',
              strokeWeight: 5,
              strokeOpacity: 0.8,
              strokeStyle: 'dashed',
              lineJoin: 'round',
              lineCap: 'round'
            });
            tempPolyline.setMap(map);
            routeLineRef.current = tempPolyline;
            
            try {
              // 异步获取驾车路线
              const driving = new window.AMap.Driving({
                map: map,
                hideMarkers: true
              });
              
              driving.search(
                orderedPositions[0],
                orderedPositions[orderedPositions.length - 1],
                { waypoints: orderedPositions.slice(1, -1) },
                (status: string, result: any) => {
                  if (status === 'complete' && result.routes && result.routes.length > 0) {
                    // 清除临时路线
                    if (routeLineRef.current) {
                      routeLineRef.current.setMap(null);
                      routeLineRef.current = null;
                    }
                    
                    // 显示新路线
                    const path = result.routes[0].steps.flatMap((step: any) => step.path);
                    const newPolyline = new window.AMap.Polyline({
                      path: path,
                      strokeColor: '#1890ff',
                      strokeWeight: 5,
                      strokeOpacity: 0.8,
                      strokeStyle: 'solid',
                      lineJoin: 'round',
                      lineCap: 'round'
                    });
                    newPolyline.setMap(map);
                    routeLineRef.current = newPolyline;
                  }
                }
              );
            } catch (drivingError) {
              console.error('驾车路线规划失败:', drivingError);
            }
          } else {
            // 降级为普通路线
            const polyline = new window.AMap.Polyline({
              path: orderedPositions,
              strokeColor: '#1890ff',
              strokeWeight: 5,
              strokeOpacity: 0.8,
              lineJoin: 'round',
              lineCap: 'round'
            });
            polyline.setMap(map);
            routeLineRef.current = polyline;
          }
        } catch (error) {
          console.error('绘制路线失败:', error);
        }
      }
      
      return;
    }
    
    // 原有代码保留，但移到else分支，在没有精选路线时才执行
    console.log('城市标记功能已移除');
  };

  // 初始化地图点击事件
  const initMapClickEvent = () => {
    if (!mapInstanceRef.current || !window.AMap) return;
    const map = mapInstanceRef.current;

    // 移除现有点击事件
    if (mapClickListenerRef.current) {
      map.off('click', mapClickListenerRef.current);
      mapClickListenerRef.current = null;
    }

    // 添加新的点击事件
    mapClickListenerRef.current = (e: any) => {
      const lngLat = e.lnglat;
      console.log('地图点击位置:', lngLat.getLng(), lngLat.getLat());
      
      // 根据坐标逆地理编码获取地点信息
      if (window.AMap && window.AMap.Geocoder) {
        const geocoder = new window.AMap.Geocoder();
        geocoder.getAddress([lngLat.getLng(), lngLat.getLat()], (status: string, result: any) => {
          if (status === 'complete' && result.regeocode) {
            const addressComponent = result.regeocode.addressComponent;
            const cityName = addressComponent.city || addressComponent.province;
            
            if (cityName && onCitySelect) {
              console.log('选择城市:', cityName);
              onCitySelect(cityName);
            } else {
              message.warning('无法识别点击位置的城市信息');
            }
          } else {
            message.warning('无法解析点击位置');
          }
        });
      }
    };

    map.on('click', mapClickListenerRef.current);
  };

  // 修改现有的useEffect钩子
  useEffect(() => {
    if (initialized) {
      // 有featuredRouteSpots时调用addCityMarkers处理景点
      if (featuredRouteSpots && featuredRouteSpots.length > 0) {
        addCityMarkers();
      }
      // 原有逻辑保留，处理交通路线
      else if (selectedCity && targetCity && showRoutes) {
        drawRoute();
      } else if (routeLineRef.current) {
        // 清除路线
        routeLineRef.current.setMap(null);
        routeLineRef.current = null;
      }
    }
  }, [selectedCity, targetCity, transportType, showRoutes, initialized, featuredRouteSpots]);

  // 添加初始化点击事件的useEffect钩子
  useEffect(() => {
    if (initialized) {
      initMapClickEvent();
    }
  }, [initialized]);

  // 修改绘制路线函数，使用高德地图的driving函数
  const drawRoute = () => {
    if (!mapInstanceRef.current || !window.AMap) {
      console.error('地图实例或AMap未准备好，无法绘制路线');
      return;
    }
    
    const map = mapInstanceRef.current;
    
    // 清理之前的线路
    if (routeLineRef.current) {
      try {
        routeLineRef.current.setMap(null);
      } catch (e) {
        console.warn('移除现有路线失败:', e);
      }
      routeLineRef.current = null;
    }

    // 创建临时标记来表示选择的城市
    if (markerFromRef.current) {
      markerFromRef.current.setMap(null);
      markerFromRef.current = null;
    }
    if (markerToRef.current) {
      markerToRef.current.setMap(null);
      markerToRef.current = null;
    }

    // 通过地理编码获取城市坐标
    if (window.AMap && window.AMap.Geocoder) {
      const geocoder = new window.AMap.Geocoder();
      
      // 获取出发城市坐标
      geocoder.getLocation(selectedCity, (status1: string, result1: any) => {
        if (status1 === 'complete' && result1.geocodes.length > 0) {
          const fromLoc = result1.geocodes[0].location;
          
          // 添加出发城市标记
          markerFromRef.current = new window.AMap.Marker({
            map: map,
            position: [fromLoc.lng, fromLoc.lat],
            title: `${selectedCity} (出发城市)`,
            icon: new window.AMap.Icon({
              size: new window.AMap.Size(25, 34),
              image: 'https://webapi.amap.com/theme/v1.3/markers/n/start.png',
              imageSize: new window.AMap.Size(25, 34)
            }),
            offset: new window.AMap.Pixel(-12, -34)
          });
          
          // 获取目的地城市坐标
          geocoder.getLocation(targetCity, (status2: string, result2: any) => {
            if (status2 === 'complete' && result2.geocodes.length > 0) {
              const toLoc = result2.geocodes[0].location;
              
              // 添加目的地城市标记
              markerToRef.current = new window.AMap.Marker({
                map: map,
                position: [toLoc.lng, toLoc.lat],
                title: `${targetCity} (目的地城市)`,
                icon: new window.AMap.Icon({
                  size: new window.AMap.Size(25, 34),
                  image: 'https://webapi.amap.com/theme/v1.3/markers/n/end.png',
                  imageSize: new window.AMap.Size(25, 34)
                }),
                offset: new window.AMap.Pixel(-12, -34)
              });
              
              // 根据交通类型决定使用哪种路线规划方式
              const normalizedTransportType = transportType?.toUpperCase() || TRANSPORT_TYPE.ALL;
              
              if (normalizedTransportType === TRANSPORT_TYPE.PLANE) {
                // 飞机使用贝塞尔曲线
                const routeStyle = {
                  strokeColor: getRouteColor(TRANSPORT_TYPE.PLANE),
                  strokeWeight: 6,
                  strokeOpacity: 0.8
                };
                drawBezierCurve(
                  map, 
                  { name: selectedCity || '出发地', location: [fromLoc.lng, fromLoc.lat] }, 
                  { name: targetCity || '目的地', location: [toLoc.lng, toLoc.lat] }, 
                  routeStyle, 
                  routeLineRef, 
                  TRANSPORT_TYPE.PLANE
                );
              } else {
                // 其他交通方式使用driving函数
                try {
                  // 使用高德地图的driving函数
                  const driving = new window.AMap.Driving({
                    map: map,
                    policy: normalizedTransportType === TRANSPORT_TYPE.TRAIN ? 'LEAST_DISTANCE' : 'LEAST_TIME',
                    hideMarkers: true // 隐藏默认标记，使用自定义标记
                  });
                  
                  // 设置超时计时器
                  let timeoutId = setTimeout(() => {
                    console.warn('路线查询超时，使用备选路线');
                    message.warning('路线查询超时，使用备选路线展示');
                    const routeStyle = {
                      strokeColor: getRouteColor(normalizedTransportType),
                      strokeWeight: 6,
                      strokeOpacity: 0.8
                    };
                    drawBezierCurve(
                      map, 
                      { name: selectedCity || '出发地', location: [fromLoc.lng, fromLoc.lat] }, 
                      { name: targetCity || '目的地', location: [toLoc.lng, toLoc.lat] }, 
                      routeStyle, 
                      routeLineRef, 
                      normalizedTransportType
                    );
                  }, 5000);
                  
                  // 查询路线
                  driving.search(
                    new window.AMap.LngLat(fromLoc.lng, fromLoc.lat),
                    new window.AMap.LngLat(toLoc.lng, toLoc.lat),
                    { waypoints: [] },
                    (status: string, result: any) => {
                      // 清除超时计时器
                      clearTimeout(timeoutId);
                      
                      if (status === 'complete' && result.routes && result.routes.length > 0) {
                        console.log('路线查询成功');
                        // 路线已被自动添加到地图上
                        // 保存路线引用以便后续清除
                        if (driving.getRoute) {
                          routeLineRef.current = driving.getRoute();
                        }
                        
                        // 调整视野以包含路线
                        map.setFitView();
                      } else {
                        console.warn('路线查询失败，使用备选路线');
                        const routeStyle = {
                          strokeColor: getRouteColor(normalizedTransportType),
                          strokeWeight: 6,
                          strokeOpacity: 0.8
                        };
                        drawBezierCurve(
                          map, 
                          { name: selectedCity || '出发地', location: [fromLoc.lng, fromLoc.lat] }, 
                          { name: targetCity || '目的地', location: [toLoc.lng, toLoc.lat] }, 
                          routeStyle, 
                          routeLineRef, 
                          normalizedTransportType
                        );
                      }
                    }
                  );
                } catch (error) {
                  console.error('路线查询出错:', error);
                  message.error('路线查询失败');
                }
              }
            } else {
              message.error(`无法获取${targetCity}的位置信息`);
            }
          });
        } else {
          message.error(`无法获取${selectedCity}的位置信息`);
        }
      });
    } else {
      message.error('地图组件未完全加载，无法查询位置');
    }
  };
  
  // 添加计算两点之间距离的函数(粗略计算)
  const calculateDistance = (point1: [number, number], point2: [number, number]): number => {
    const EARTH_RADIUS = 6371; // 地球半径，单位km
    const rad = (x: number) => x * Math.PI / 180;
    
    const lat1 = rad(point1[1]);
    const lon1 = rad(point1[0]);
    const lat2 = rad(point2[1]);
    const lon2 = rad(point2[0]);
    
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = EARTH_RADIUS * c;
    
    return distance;
  };

  // 修改路线绘制函数中的样式部分
  const getRouteColor = (type?: string) => {
    switch (type) {
      case TRANSPORT_TYPE.PLANE:
        return '#ff7f50'; // 珊瑚色
      case TRANSPORT_TYPE.TRAIN:
        return '#32cd32'; // 酸橙绿
      case TRANSPORT_TYPE.BUS:
        return '#4169e1'; // 皇家蓝
      case TRANSPORT_TYPE.CAR:
        return '#ffa500'; // 橙色
      case TRANSPORT_TYPE.ALL:
        return '#9370db'; // 紫色
      default:
        return '#1890ff'; // 默认蓝色
    }
  };

  // 修改硬编码火车票数据的函数
  const getHardcodedTrains = (from: string, to: string): TrainLineInfo[] => {
    // 根据出发地和目的地生成硬编码火车票数据
    const currentDate = new Date();
    const formattedDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
    
    // 生成随机票价和余票
    const getRandomPrice = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
    const getRandomTickets = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
    
    // 硬编码的火车类型和车次
    const trainTypes = [
      { type: 1, name: '高铁', codes: ['G1082', 'G2365', 'G521'] },
      { type: 2, name: '动车', codes: ['D3642', 'D927', 'D215'] },
      { type: 5, name: '快速', codes: ['K325', 'K1362', 'K529'] },
      { type: 4, name: '特快', codes: ['T189', 'T238', 'T107'] }
    ];
    
    const result: TrainLineInfo[] = [];
    
    // 为每种类型创建1-2个车次
    trainTypes.forEach(trainType => {
      // 每种类型随机生成1-2个车次
      const count = Math.floor(Math.random() * 2) + 1;
      for (let i = 0; i < count; i++) {
        const trainCode = trainType.codes[i % trainType.codes.length];
        const departureHour = Math.floor(Math.random() * 18) + 6; // 6:00 - 23:00
        const arriveHour = (departureHour + Math.floor(Math.random() * 10) + 2) % 24; // 出发时间后2-12小时
        
        let arriveDays = 0;
        if (arriveHour < departureHour) {
          arriveDays = 1;
        }
        
        // 创建座位信息
        const seats: TrainSeatInfo[] = [];
        if (trainType.type === 1 || trainType.type === 2) { // 高铁/动车
          seats.push({
            seatType: 1,
            seatTypeName: '商务座',
            ticketPrice: getRandomPrice(500, 800),
            leftTicketNum: getRandomTickets(0, 5),
            otherSeats: null
          });
          seats.push({
            seatType: 3,
            seatTypeName: '一等座',
            ticketPrice: getRandomPrice(300, 500),
            leftTicketNum: getRandomTickets(5, 50),
            otherSeats: null
          });
          seats.push({
            seatType: 4,
            seatTypeName: '二等座',
            ticketPrice: getRandomPrice(200, 300),
            leftTicketNum: getRandomTickets(10, 120),
            otherSeats: null
          });
        } else { // 普通列车
          seats.push({
            seatType: 10,
            seatTypeName: '硬座',
            ticketPrice: getRandomPrice(150, 200),
            leftTicketNum: getRandomTickets(10, 80),
            otherSeats: null
          });
          seats.push({
            seatType: 8,
            seatTypeName: '硬卧',
            ticketPrice: getRandomPrice(250, 350),
            leftTicketNum: getRandomTickets(5, 30),
            otherSeats: [
              { sleeperType: 1, sleeperTypeName: '下铺', ticketPrice: getRandomPrice(300, 330) },
              { sleeperType: 2, sleeperTypeName: '中铺', ticketPrice: getRandomPrice(280, 300) },
              { sleeperType: 3, sleeperTypeName: '上铺', ticketPrice: getRandomPrice(250, 280) }
            ]
          });
          seats.push({
            seatType: 6,
            seatTypeName: '软卧',
            ticketPrice: getRandomPrice(400, 500),
            leftTicketNum: getRandomTickets(0, 20),
            otherSeats: null
          });
        }
        
        // 生成运行时间
        const hours = Math.floor(Math.random() * 12) + 1;
        const minutes = Math.floor(Math.random() * 60);
        const runTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        
        const fromTimeStr = `${departureHour.toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`;
        const toTimeStr = `${arriveHour.toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`;
        
        // 添加火车信息
        result.push({
          trainCode,
          trainNo: `train_${trainCode}`,
          trainsType: trainType.type,
          trainsTypeName: trainType.name,
          fromStation: from,
          toStation: to,
          beginStation: from,
          endStation: to,
          runTime,
          fromTime: fromTimeStr,
          toTime: toTimeStr,
          fromDateTime: `${formattedDate} ${fromTimeStr}`,
          toDateTime: arriveDays ? 
            `${new Date(new Date(formattedDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]} ${toTimeStr}` : 
            `${formattedDate} ${toTimeStr}`,
          arrive_days: arriveDays.toString(),
          Seats: seats,
          beginTime: null,
          endTime: null,
          isSupportChooseSleeper: trainType.type > 2,
          note: "",
          transferQueryExtraParams: null,
          sequence: 0
        });
      }
    });
    
    return result;
  };
  
  // 添加获取硬编码机票数据的函数
  const getHardcodedFlights = (from: string, to: string): FlightInfo[] => {
    // 根据出发地和目的地生成硬编码机票数据
    const currentDate = new Date();
    const formattedDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
    
    // 硬编码的航空公司
    const airlines = [
      { name: '中国国航', codes: ['CA1234', 'CA5678', 'CA9012'] },
      { name: '东方航空', codes: ['MU3456', 'MU7890', 'MU1234'] },
      { name: '南方航空', codes: ['CZ5678', 'CZ9012', 'CZ3456'] },
      { name: '海南航空', codes: ['HU7890', 'HU1234', 'HU5678'] }
    ];
    
    const result: FlightInfo[] = [];
    
    // 为每个航空公司创建1-2个航班
    airlines.forEach(airline => {
      // 每个航空公司随机生成1-2个航班
      const count = Math.floor(Math.random() * 2) + 1;
      for (let i = 0; i < count; i++) {
        const flightNo = airline.codes[i % airline.codes.length];
        const departureHour = Math.floor(Math.random() * 18) + 6; // 6:00 - 23:00
        const arriveHour = (departureHour + Math.floor(Math.random() * 5) + 1) % 24; // 出发时间后1-6小时
        
        // 生成航班信息
        result.push({
          flightNo,
          airline: airline.name,
          fromCity: from,
          toCity: to,
          fromAirport: `${from}国际机场`,
          toAirport: `${to}国际机场`,
          fromDate: formattedDate,
          toDate: arriveHour < departureHour ? new Date(new Date(formattedDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] : formattedDate,
          fromTime: `${departureHour.toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
          toTime: `${arriveHour.toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
          duration: `${Math.floor(Math.random() * 5) + 1}小时${Math.floor(Math.random() * 60)}分钟`,
          price: Math.floor(Math.random() * 1000) + 500,
          discount: Math.random() * 0.3 + 0.7, // 0.7-1.0的折扣
          tax: Math.floor(Math.random() * 200) + 50,
          stops: Math.random() > 0.7 ? 1 : 0, // 30%的概率有一次经停
          transferCities: Math.random() > 0.7 ? [`中转城市${Math.floor(Math.random() * 10) + 1}`] : [],
          punctualityRate: Math.floor(Math.random() * 30) + 70, // 70%-100%的准点率
          aircraftType: `波音${Math.floor(Math.random() * 10) + 737}`,
          fromTerminal: String(Math.floor(Math.random() * 3) + 1),
          toTerminal: String(Math.floor(Math.random() * 3) + 1)
        });
      }
    });
    
    return result;
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {loading && (
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          zIndex: 1000
        }}>
          <Spin tip="地图加载中..." />
        </div>
      )}
      
      {/* 添加路线警告提示 */}
      {showRouteWarning && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          backgroundColor: '#fffbe6',
          border: '1px solid #ffe58f',
          padding: '8px 12px',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          alignItems: 'center',
          maxWidth: '80%'
        }}>
          <WarningOutlined style={{ color: '#faad14', marginRight: '8px' }} />
          <span>{warningMessage}</span>
        </div>
      )}
      
      {/* 添加地图使用指引提示 */}
      {!loading && !selectedCity && !featuredRouteSpots?.length && (
        <div className="map-guide">
          <h3>点击地图选择城市</h3>
          <p>先选择出发城市，再选择目的地城市</p>
        </div>
      )}
      
      {/* 添加精选路线名称显示 */}
      {!loading && routeName && (
        <div style={{
          position: 'absolute',
          top: showRouteWarning ? '60px' : '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 99,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '8px 16px',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          fontWeight: 'bold',
          fontSize: '16px'
        }}>
          {routeName}
        </div>
      )}
      
      <div 
        ref={mapContainerRef} 
        className="map-container"
      />

      {/* 显示票务信息 */}
      {selectedCity && targetCity && (
        <>
          {/* 隐藏/显示按钮 */}
          <button 
            className="toggle-ticket-panel-btn" 
            onClick={() => setShowTicketPanel(!showTicketPanel)}
            aria-label={showTicketPanel ? "隐藏票务信息" : "显示票务信息"}
            title={showTicketPanel ? "隐藏票务信息" : "显示票务信息"}
          >
            {showTicketPanel ? <RightOutlined /> : <LeftOutlined />}
          </button>
          
          {/* 票务信息面板 */}
          <div className={`ticket-panel ${showTicketPanel ? 'show' : 'hide'}`}>
            {/* 全部模式或火车模式显示火车票信息 */}
            {(transportType?.toUpperCase() === 'TRAIN' || transportType?.toUpperCase() === 'ALL' || !transportType) && (
              <div className="train-panel">
                {isLoadingTickets ? (
                  <Card loading title="火车票信息">正在加载火车票信息...</Card>
                ) : (
                  trainTickets.length > 0 ? (
                    <TrainTicketCard 
                      trainLines={trainTickets} 
                      onSelectTrain={handleSelectTrain}
                    />
                  ) : (
                    transportType?.toUpperCase() === 'TRAIN' && (
                      <Card title="火车票信息">
                        <Empty description={`未找到从 ${selectedCity} 到 ${targetCity} 的火车票信息`} />
                      </Card>
                    )
                  )
                )}
              </div>
            )}

            {/* 全部模式或飞机模式显示机票信息 */}
            {(transportType?.toUpperCase() === 'PLANE' || transportType?.toUpperCase() === 'ALL' || !transportType) && (
              <div className="flight-panel">
                {isLoadingFlights ? (
                  <Card loading title="机票信息">正在加载机票信息...</Card>
                ) : (
                  flightTickets.length > 0 ? (
                    <FlightTicketCard 
                      flights={flightTickets} 
                      onSelectFlight={handleSelectFlight}
                    />
                  ) : (
                    transportType?.toUpperCase() === 'PLANE' && (
                      <Card title="机票信息">
                        <Empty description={`未找到从 ${selectedCity} 到 ${targetCity} 的机票信息`} />
                      </Card>
                    )
                  )
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ChinaMap; 