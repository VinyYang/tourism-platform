import axios from 'axios';

// 设置基础URL
const API_PORT = process.env.REACT_APP_API_PORT || '3001';
const BASE_URL = process.env.REACT_APP_API_URL || `http://localhost:${API_PORT}/api/v1`;

// 创建axios实例
const instance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// 添加请求拦截器
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 城市地理数据接口
export interface CityGeoData {
  id: number;
  name: string;
  province: string;
  longitude: number;
  latitude: number;
  level: string; // 城市等级，如：省会、一线城市等
  population?: number;
  description?: string;
}

// 热门城市接口
export interface PopularCity {
  name: string;
  count: number; // 热度值/计数
}

// 城市搜索参数
export interface CitySearchParams {
  name?: string;
  province?: string;
  level?: string;
  limit?: number;
}

// 地理数据API接口
const geoDataAPI = {
  // 获取城市列表
  getCities: async (params?: CitySearchParams): Promise<CityGeoData[]> => {
    try {
      const response = await instance.get('/cities', { params });
      return response.data;
    } catch (error) {
      console.error('获取城市列表失败:', error);
      // 模拟数据，实际项目中应该连接到真实后端
      return mockCities.filter(city => {
        if (params?.name && !city.name.includes(params.name)) return false;
        if (params?.province && city.province !== params.province) return false;
        if (params?.level && city.level !== params.level) return false;
        return true;
      }).slice(0, params?.limit || 100);
    }
  },

  // 获取城市详情
  getCityById: async (id: number): Promise<CityGeoData> => {
    try {
      const response = await instance.get(`/cities/${id}`);
      return response.data;
    } catch (error) {
      console.error(`获取城市详情失败:`, error);
      // 模拟数据
      const city = mockCities.find(c => c.id === id);
      if (!city) throw new Error('城市不存在');
      return city;
    }
  },

  // 获取热门城市
  getPopularCities: async (limit: number = 10): Promise<PopularCity[]> => {
    try {
      const response = await instance.get('/scenics/cities/popular', { params: { limit } });
      
      // 处理不同的响应格式：检查data是否在response.data中
      const responseData = response.data.data || response.data;
      
      // 转换为期望的格式
      if (Array.isArray(responseData)) {
        return responseData.map(city => {
          // 如果返回的是我们后端API的格式
          if (city.name && (city.count !== undefined || typeof city === 'object')) {
            // 如果已经是正确格式或有count字段，直接返回
            if (city.count !== undefined) {
              return { name: city.name, count: city.count };
            }
            // 否则，使用id作为count（作为替代）
            return { name: city.name, count: city.id || Math.floor(Math.random() * 1000) };
          }
          // 如果是字符串数组，创建对象
          return { name: typeof city === 'string' ? city : city.name, count: Math.floor(Math.random() * 1000) };
        });
      }
      
      // 如果不是数组，返回空数组
      console.error('热门城市API返回了非数组数据:', responseData);
      return [];
    } catch (error) {
      console.error('获取热门城市失败:', error);
      // 模拟数据
      return mockCities
        .slice(0, limit)
        .map(city => ({ name: city.name, count: Math.floor(Math.random() * 1000) }))
        .sort((a, b) => b.count - a.count);
    }
  },

  // 根据城市名称获取坐标
  getCityCoordinates: async (cityName: string): Promise<[number, number] | null> => {
    try {
      const response = await instance.get('/cities/coordinates', { params: { name: cityName } });
      return response.data;
    } catch (error) {
      console.error(`获取城市坐标失败:`, error);
      // 模拟数据
      const city = mockCities.find(c => c.name === cityName);
      return city ? [city.longitude, city.latitude] : null;
    }
  },

  // 获取省份列表
  getProvinces: async (): Promise<string[]> => {
    try {
      const response = await instance.get('/provinces');
      return response.data;
    } catch (error) {
      console.error('获取省份列表失败:', error);
      // 从模拟数据中提取省份
      return [...new Set(mockCities.map(city => city.province))];
    }
  }
};

// 模拟数据（实际项目中应该使用API获取数据）
const mockCities: CityGeoData[] = [
  {
    id: 1,
    name: '北京',
    province: '北京市',
    longitude: 116.405285,
    latitude: 39.904989,
    level: '一线城市',
    population: 21893095,
    description: '中国首都，政治、文化中心'
  },
  {
    id: 2,
    name: '上海',
    province: '上海市',
    longitude: 121.472644,
    latitude: 31.231706,
    level: '一线城市',
    population: 24870895,
    description: '中国最大城市，国际金融中心'
  },
  {
    id: 3,
    name: '广州',
    province: '广东省',
    longitude: 113.280637,
    latitude: 23.125178,
    level: '一线城市',
    population: 15305581,
    description: '粤港澳大湾区核心城市'
  },
  {
    id: 4,
    name: '深圳',
    province: '广东省',
    longitude: 114.085947,
    latitude: 22.547,
    level: '一线城市',
    population: 13026600,
    description: '中国科技创新中心'
  },
  {
    id: 5,
    name: '杭州',
    province: '浙江省',
    longitude: 120.153576,
    latitude: 30.287459,
    level: '新一线城市',
    population: 10360000,
    description: '电子商务中心，风景名胜'
  },
  {
    id: 6,
    name: '南京',
    province: '江苏省',
    longitude: 118.767413,
    latitude: 32.041544,
    level: '新一线城市',
    population: 8507000,
    description: '六朝古都，历史文化名城'
  },
  {
    id: 7,
    name: '成都',
    province: '四川省',
    longitude: 104.065735,
    latitude: 30.659462,
    level: '新一线城市',
    population: 16330000,
    description: '历史文化名城，美食之都'
  },
  {
    id: 8,
    name: '重庆',
    province: '重庆市',
    longitude: 106.504962,
    latitude: 29.533155,
    level: '新一线城市',
    population: 31243200,
    description: '山城，长江上游经济中心'
  },
  {
    id: 9,
    name: '西安',
    province: '陕西省',
    longitude: 108.948024,
    latitude: 34.263161,
    level: '新一线城市',
    population: 10108000,
    description: '古都，丝绸之路起点'
  },
  {
    id: 10,
    name: '武汉',
    province: '湖北省',
    longitude: 114.298572,
    latitude: 30.584355,
    level: '新一线城市',
    population: 10892900,
    description: '华中地区中心城市'
  }
];

export default geoDataAPI; 