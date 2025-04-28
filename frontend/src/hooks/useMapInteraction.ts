import { useState, useRef, useCallback, useEffect } from 'react';
// 移除 echarts 导入
// import * as echarts from 'echarts';
import { Transport } from '../api/transport';

interface UseMapInteractionOptions {
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
}

interface MapInteraction {
  selectedCities: string[];
  transportType: string;
  priceRange: [number, number];
  showRoutes: boolean;
  // 修改类型定义
  chartInstance: React.MutableRefObject<any>;
  selectedTransport: Transport | null;
  
  setSelectedCities: (cities: string[]) => void;
  setTransportType: (type: string) => void;
  setPriceRange: (range: [number, number]) => void;
  setShowRoutes: (show: boolean) => void;
  setSelectedTransport: (transport: Transport | null) => void;
  
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  focusOnCity: (cityName: string) => void;
  handleCityClick: (cityName: string) => void;
}

/**
 * 自定义钩子，用于管理地图交互状态和操作
 */
const useMapInteraction = (options: UseMapInteractionOptions = {}): MapInteraction => {
  const {
    initialZoom = 5,
    minZoom = 3,
    maxZoom = 10
  } = options;
  
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [transportType, setTransportType] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [showRoutes, setShowRoutes] = useState<boolean>(true);
  const [selectedTransport, setSelectedTransport] = useState<Transport | null>(null);
  const [zoom, setZoom] = useState<number>(initialZoom);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  
  // ECharts实例引用
  const chartInstance = useRef<any>(null);
  
  // 放大地图
  const zoomIn = useCallback(() => {
    if (zoom < maxZoom) {
      setZoom(prev => prev + 1);
      
      // 如果有高德地图实例，则调用其放大方法
      if (window.AMap && chartInstance.current) {
        try {
          chartInstance.current.zoomIn();
        } catch (error) {
          console.error('地图放大失败:', error);
        }
      }
    }
  }, [zoom, maxZoom]);
  
  // 缩小地图
  const zoomOut = useCallback(() => {
    if (zoom > minZoom) {
      setZoom(prev => prev - 1);
      
      // 如果有高德地图实例，则调用其缩小方法
      if (window.AMap && chartInstance.current) {
        try {
          chartInstance.current.zoomOut();
        } catch (error) {
          console.error('地图缩小失败:', error);
        }
      }
    }
  }, [zoom, minZoom]);
  
  // 重置地图视图
  const resetView = useCallback(() => {
    setZoom(initialZoom);
    setSelectedCity(null);
    
    // 如果有高德地图实例，则重置视图
    if (window.AMap && chartInstance.current) {
      try {
        chartInstance.current.setZoom(initialZoom);
        chartInstance.current.setCenter([104.297104, 35.86166]); // 中国中心点
      } catch (error) {
        console.error('重置地图视图失败:', error);
      }
    }
  }, [initialZoom]);
  
  // 聚焦到特定城市
  const focusOnCity = useCallback((cityName: string) => {
    setSelectedCity(cityName);
    setZoom(8); // 放大到城市级别
    
    // 这里使用本地状态管理，高德地图实例会在 ChinaMap 组件内部处理聚焦
    // 实际地图聚焦操作由 ChinaMap 组件中的 addCityMarkers 和 useEffect 钩子处理
  }, []);
  
  // 处理城市点击事件
  const handleCityClick = useCallback((cityName: string) => {
    if (!selectedCities.includes(cityName)) {
      // 如果已选择了两个城市，则替换第一个
      if (selectedCities.length >= 2) {
        setSelectedCities([selectedCities[1], cityName]);
      } else {
        setSelectedCities([...selectedCities, cityName]);
      }
    }
  }, [selectedCities]);
  
  // 清除选中的交通方式
  useEffect(() => {
    if (transportType !== 'all' && selectedTransport && selectedTransport.type !== transportType) {
      setSelectedTransport(null);
    }
  }, [transportType, selectedTransport]);
  
  return {
    selectedCities,
    transportType,
    priceRange,
    showRoutes,
    chartInstance,
    selectedTransport,
    
    setSelectedCities,
    setTransportType,
    setPriceRange,
    setShowRoutes,
    setSelectedTransport,
    
    zoomIn,
    zoomOut,
    resetView,
    focusOnCity,
    handleCityClick
  };
};

export default useMapInteraction; 