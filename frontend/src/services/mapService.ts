import axios from 'axios';
import { Transport } from '../api/transport';

// 城市地理坐标接口
export interface CityCoordinate {
  name: string;
  value: [number, number]; // [lng, lat]
  fullName?: string;
  province?: string;
}

// 热力图数据点接口
export interface HeatmapPoint {
  name: string;
  value: number;
  coordinate: [number, number];
}

/**
 * 地图服务，处理地图数据和相关操作
 */
const mapService = {
  /**
   * 获取中国主要城市坐标数据
   * 实际应用中应该从API获取或使用本地数据文件
   */
  getMajorCities: async (): Promise<CityCoordinate[]> => {
    try {
      // 实际应用中，应该从API获取数据
      // 这里为了演示，返回硬编码的数据
      return [
        { name: '北京', value: [116.405285, 39.904989], province: '北京市' },
        { name: '上海', value: [121.472644, 31.231706], province: '上海市' },
        { name: '广州', value: [113.280637, 23.125178], province: '广东省' },
        { name: '深圳', value: [114.085947, 22.547], province: '广东省' },
        { name: '杭州', value: [120.153576, 30.287459], province: '浙江省' },
        { name: '南京', value: [118.767413, 32.041544], province: '江苏省' },
        { name: '成都', value: [104.065735, 30.659462], province: '四川省' },
        { name: '重庆', value: [106.504962, 29.533155], province: '重庆市' },
        { name: '西安', value: [108.948024, 34.263161], province: '陕西省' },
        { name: '武汉', value: [114.298572, 30.584355], province: '湖北省' },
        { name: '天津', value: [117.190182, 39.125596], province: '天津市' },
        { name: '苏州', value: [120.619585, 31.299379], province: '江苏省' },
        { name: '青岛', value: [120.383428, 36.105215], province: '山东省' },
        { name: '大连', value: [121.618622, 38.91459], province: '辽宁省' },
        { name: '沈阳', value: [123.429096, 41.796767], province: '辽宁省' },
        { name: '哈尔滨', value: [126.642464, 45.756967], province: '黑龙江省' },
        { name: '长春', value: [125.3245, 43.886841], province: '吉林省' },
        { name: '南宁', value: [108.320004, 22.82402], province: '广西壮族自治区' },
        { name: '昆明', value: [102.712251, 25.040609], province: '云南省' },
        { name: '兰州', value: [103.823557, 36.058039], province: '甘肃省' }
      ];
    } catch (error) {
      console.error('获取城市坐标数据失败:', error);
      throw error;
    }
  },

  /**
   * 根据城市名称获取城市坐标
   */
  getCityCoordinateByName: async (cityName: string): Promise<CityCoordinate | null> => {
    try {
      const cities = await mapService.getMajorCities();
      return cities.find(city => city.name === cityName) || null;
    } catch (error) {
      console.error(`获取城市 ${cityName} 坐标失败:`, error);
      return null;
    }
  },

  /**
   * 生成两个城市之间的路线坐标
   */
  generateRouteBetweenCities: async (fromCity: string, toCity: string): Promise<[number, number][]> => {
    try {
      const fromCoord = await mapService.getCityCoordinateByName(fromCity);
      const toCoord = await mapService.getCityCoordinateByName(toCity);
      
      if (!fromCoord || !toCoord) {
        throw new Error('城市坐标不存在');
      }
      
      // 实际应用中，可以调用路线规划API获取真实路线
      // 这里简化为直线连接两个城市
      return [fromCoord.value, toCoord.value];
    } catch (error) {
      console.error(`生成 ${fromCity} 到 ${toCity} 的路线失败:`, error);
      throw error;
    }
  },

  /**
   * 转换交通数据为地图可视化数据
   */
  transformTransportsToMapData: async (transports: Transport[]): Promise<any[]> => {
    try {
      const cities = await mapService.getMajorCities();
      const cityMap = new Map(cities.map(city => [city.name, city.value]));
      
      return transports.map(transport => {
        const fromCoord = cityMap.get(transport.fromCity);
        const toCoord = cityMap.get(transport.toCity);
        
        if (!fromCoord || !toCoord) {
          console.warn(`城市坐标不存在: ${transport.fromCity} 或 ${transport.toCity}`);
          return null;
        }
        
        return {
          fromName: transport.fromCity,
          toName: transport.toCity,
          coords: [fromCoord, toCoord],
          value: transport.price,
          type: transport.type
        };
      }).filter(Boolean);
    } catch (error) {
      console.error('转换交通数据失败:', error);
      throw error;
    }
  },

  /**
   * 生成热门路线热力图数据
   */
  generateHeatmapData: async (transports: Transport[]): Promise<HeatmapPoint[]> => {
    // 统计每个城市的交通量
    const cityCountMap = new Map<string, number>();
    
    transports.forEach(transport => {
      cityCountMap.set(
        transport.fromCity, 
        (cityCountMap.get(transport.fromCity) || 0) + 1
      );
      cityCountMap.set(
        transport.toCity, 
        (cityCountMap.get(transport.toCity) || 0) + 1
      );
    });
    
    // 转换为热力图数据
    const cities = await mapService.getMajorCities();
    const heatmapData: HeatmapPoint[] = [];
    
    cityCountMap.forEach((count, cityName) => {
      const city = cities.find(c => c.name === cityName);
      if (city) {
        heatmapData.push({
          name: cityName,
          value: count,
          coordinate: city.value
        });
      }
    });
    
    return heatmapData;
  },
  
  /**
   * 加载中国地图GeoJSON数据
   */
  loadChinaMapData: async (): Promise<any> => {
    try {
      const response = await axios.get('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json');
      return response.data;
    } catch (error) {
      console.error('加载中国地图数据失败:', error);
      throw error;
    }
  }
};

export default mapService; 