// 行政区域查询API

// 行政区划信息类型
export interface DistrictItem {
  name: string;            // 行政区名称
  adcode: string;          // 行政区编码
  level: string;           // 行政级别：country、province、city、district
  center: [number, number]; // 中心点经纬度
  citycode?: string[] | string;        // 城市编码，支持字符串或字符串数组
  districts?: DistrictItem[]; // 子行政区列表
}

// API返回结果类型
export interface DistrictSearchResult {
  status: string;         // 返回状态：'complete'表示成功
  info: string;           // 状态信息：'OK'表示正常
  districts: DistrictItem[]; // 行政区列表
}

// 查询参数类型
export interface DistrictSearchParams {
  keywords?: string;     // 查询关键字
  subdistrict?: number;  // 子行政区获取深度，0-3
  level?: 'country' | 'province' | 'city' | 'district'; // 行政区级别
  extensions?: 'base' | 'all'; // 返回数据详略：base为基本数据，all为详细信息
}

// 默认查询参数
const defaultParams: DistrictSearchParams = {
  subdistrict: 1,
  extensions: 'base',
};

// 区域查询结果的本地缓存
const districtCache: Record<string, {
  data: DistrictItem[];
  timestamp: number;
}> = {};

// 缓存有效期（24小时，单位：毫秒）
const CACHE_EXPIRY = 24 * 60 * 60 * 1000;

// 中国省份备用数据
const fallbackProvinces: DistrictItem[] = [
  { name: '北京市', adcode: '110000', level: 'province', center: [116.405285, 39.904989] },
  { name: '天津市', adcode: '120000', level: 'province', center: [117.190182, 39.125596] },
  { name: '河北省', adcode: '130000', level: 'province', center: [114.502461, 38.045474] },
  { name: '山西省', adcode: '140000', level: 'province', center: [112.549248, 37.857014] },
  { name: '内蒙古自治区', adcode: '150000', level: 'province', center: [111.670801, 40.818311] },
  { name: '辽宁省', adcode: '210000', level: 'province', center: [123.429096, 41.796767] },
  { name: '吉林省', adcode: '220000', level: 'province', center: [125.3245, 43.886841] },
  { name: '黑龙江省', adcode: '230000', level: 'province', center: [126.642464, 45.756967] },
  { name: '上海市', adcode: '310000', level: 'province', center: [121.472644, 31.231706] },
  { name: '江苏省', adcode: '320000', level: 'province', center: [118.767413, 32.041544] },
  { name: '浙江省', adcode: '330000', level: 'province', center: [120.153576, 30.287459] },
  { name: '安徽省', adcode: '340000', level: 'province', center: [117.283042, 31.86119] },
  { name: '福建省', adcode: '350000', level: 'province', center: [119.306239, 26.075302] },
  { name: '江西省', adcode: '360000', level: 'province', center: [115.892151, 28.676493] },
  { name: '山东省', adcode: '370000', level: 'province', center: [117.000923, 36.675807] },
  { name: '河南省', adcode: '410000', level: 'province', center: [113.665412, 34.757975] },
  { name: '湖北省', adcode: '420000', level: 'province', center: [114.298572, 30.584355] },
  { name: '湖南省', adcode: '430000', level: 'province', center: [112.982279, 28.19409] },
  { name: '广东省', adcode: '440000', level: 'province', center: [113.280637, 23.125178] },
  { name: '广西壮族自治区', adcode: '450000', level: 'province', center: [108.320004, 22.82402] },
  { name: '海南省', adcode: '460000', level: 'province', center: [110.33119, 20.031971] },
  { name: '重庆市', adcode: '500000', level: 'province', center: [106.504962, 29.533155] },
  { name: '四川省', adcode: '510000', level: 'province', center: [104.065735, 30.659462] },
  { name: '贵州省', adcode: '520000', level: 'province', center: [106.713478, 26.578343] },
  { name: '云南省', adcode: '530000', level: 'province', center: [102.712251, 25.040609] },
  { name: '西藏自治区', adcode: '540000', level: 'province', center: [91.132212, 29.660361] },
  { name: '陕西省', adcode: '610000', level: 'province', center: [108.948024, 34.263161] },
  { name: '甘肃省', adcode: '620000', level: 'province', center: [103.823557, 36.058039] },
  { name: '青海省', adcode: '630000', level: 'province', center: [101.778916, 36.623178] },
  { name: '宁夏回族自治区', adcode: '640000', level: 'province', center: [106.278179, 38.46637] },
  { name: '新疆维吾尔自治区', adcode: '650000', level: 'province', center: [87.617733, 43.792818] },
  { name: '台湾省', adcode: '710000', level: 'province', center: [121.509062, 25.044332] },
  { name: '香港特别行政区', adcode: '810000', level: 'province', center: [114.173355, 22.320048] },
  { name: '澳门特别行政区', adcode: '820000', level: 'province', center: [113.54909, 22.198951] }
];

/**
 * 封装高德地图行政区划查询方法
 */
class DistrictAPI {
  /**
   * 搜索行政区划信息
   * @param params 查询参数
   * @returns Promise<DistrictItem[]> 返回行政区信息
   */
  searchDistrict = async (params: DistrictSearchParams): Promise<DistrictItem[]> => {
    // 生成缓存键
    const cacheKey = JSON.stringify(params);
    
    // 检查缓存是否有效
    const cache = districtCache[cacheKey];
    const now = Date.now();
    if (cache && (now - cache.timestamp) < CACHE_EXPIRY) {
      console.log('使用缓存的行政区划数据:', params.keywords || '中国');
      return cache.data;
    }
    
    try {
      // 确保AMap已加载
      if (!window.AMap) {
        console.warn('高德地图API未加载，使用备用数据');
        if (params.keywords === '中国' && params.level === 'country') {
          return [{ 
            name: '中国', 
            adcode: '100000', 
            level: 'country', 
            center: [116.3683244, 39.915085],
            districts: fallbackProvinces 
          }];
        }
        throw new Error('高德地图API未加载');
      }
      
      // 返回一个Promise，包装高德地图的回调函数
      return new Promise((resolve, reject) => {
        // 使用 AMap.plugin 加载
        AMap.plugin('AMap.DistrictSearch', () => {
          try {
            // Diagnostic Step: Try using window.AMap inside callback
            const districtSearch = new (window.AMap as any).DistrictSearch({ // Use window.AMap temporarily
              ...defaultParams,
              ...params,
            });

            // Add explicit types for the callback parameters based on docs/types
            districtSearch.search(params.keywords || '中国', (status: AMap.DistrictSearch.SearchStatus, result: AMap.DistrictSearch.SearchResult | string) => {
              if (status === 'complete' && typeof result !== 'string' && result.info === 'OK') {
                // 递归转换函数，将AMap.DistrictSearch.DistrictItem转换为DistrictItem
                const convertDistrictItem = (item: AMap.DistrictSearch.DistrictItem): DistrictItem => {
                  return {
                    name: item.name,
                    adcode: item.adcode,
                    level: item.level,
                    center: [item.center.getLng(), item.center.getLat()],
                    citycode: item.citycode,
                    districts: item.districts ? item.districts.map(convertDistrictItem) : undefined
                  };
                };

                // 转换并更新缓存
                const convertedItems = result.districtList.map(convertDistrictItem);
                districtCache[cacheKey] = {
                  data: convertedItems,
                  timestamp: now
                };
                resolve(convertedItems);
              } else {
                // Handle cases where result might be a string (error message)
                const errorInfo = typeof result === 'string' ? result : result.info;
                reject(new Error(`行政区查询失败: ${errorInfo}`));
              }
            });
          } catch (pluginError) {
            console.error('Error creating or using DistrictSearch plugin:', pluginError);
            reject(pluginError);
          }
        });
      });
    } catch (error) {
      console.error('行政区查询异常:', error);
      throw error;
    }
  }
  
  /**
   * 获取所有省份信息
   * @returns Promise<DistrictItem[]> 返回省份列表
   */
  getProvinces = async (): Promise<DistrictItem[]> => {
    try {
      const result = await this.searchDistrict({
        keywords: '中国',
        subdistrict: 1,
        level: 'country'
      });
      
      // 检查结果是否有效
      if (!result || !Array.isArray(result) || result.length === 0) {
        console.warn('API返回的省份数据无效，使用备用数据');
        return fallbackProvinces;
      }
      
      // 检查中国是否是第一个结果，以及它是否包含districts属性
      const chinaDistricts = result[0]?.districts;
      if (!chinaDistricts || !Array.isArray(chinaDistricts) || chinaDistricts.length === 0) {
        console.warn('API返回的省份列表为空，使用备用数据');
        return fallbackProvinces;
      }
      
      return chinaDistricts;
    } catch (error) {
      console.error('获取省份列表失败:', error);
      console.warn('由于API错误，使用备用省份数据');
      return fallbackProvinces;
    }
  }
  
  /**
   * 获取指定省份的城市列表
   * @param provinceName 省份名称或编码
   * @returns Promise<DistrictItem[]> 返回城市列表
   */
  getCitiesByProvince = async (provinceName: string): Promise<DistrictItem[]> => {
    try {
      const result = await this.searchDistrict({
        keywords: provinceName,
        subdistrict: 1,
        level: 'province'
      });
      
      // 检查结果是否有效
      if (!result || !Array.isArray(result) || result.length === 0 || !result[0]?.districts) {
        console.warn(`API返回的${provinceName}城市数据无效，寻找备用数据`);
        // 从备用省份数据中查找
        const fallbackProvince = fallbackProvinces.find(p => p.name.includes(provinceName));
        if (fallbackProvince && fallbackProvince.districts) {
          return fallbackProvince.districts;
        }
        // 如果无法找到匹配的省份，返回空数组
        return [];
      }
      
      // 返回该省份下的城市列表
      return result[0].districts || [];
    } catch (error) {
      console.error(`获取${provinceName}的城市列表失败:`, error);
      throw error;
    }
  }
  
  /**
   * 获取指定城市的区县列表
   * @param cityName 城市名称或编码
   * @returns Promise<DistrictItem[]> 返回区县列表
   */
  getDistrictsByCity = async (cityName: string): Promise<DistrictItem[]> => {
    try {
      const result = await this.searchDistrict({
        keywords: cityName,
        subdistrict: 1,
        level: 'city'
      });
      
      // 检查结果是否有效
      if (!result || !Array.isArray(result) || result.length === 0 || !result[0]?.districts) {
        console.warn(`API返回的${cityName}区县数据无效，返回空数组`);
        return [];
      }
      
      // 返回该城市下的区县列表
      return result[0].districts || [];
    } catch (error) {
      console.error(`获取${cityName}的区县列表失败:`, error);
      throw error;
    }
  }
  
  /**
   * 根据关键字搜索行政区
   * @param keyword 搜索关键字
   * @returns Promise<DistrictItem[]> 返回匹配的行政区列表
   */
  searchByKeyword = async (keyword: string): Promise<DistrictItem[]> => {
    if (!keyword || keyword.trim().length === 0) {
      return [];
    }

    try {
      const result = await this.searchDistrict({
        keywords: keyword,
        subdistrict: 0
      });

      return result || []; // Ensure return path in try block
    } catch (error) {
      // Corrected the console.error and added fallback return
      console.error(`搜索行政区 "${keyword}" 失败:`, error);
      // 搜索失败时尝试从备用数据中进行模糊匹配 (Original fallback logic)
      const normalizedKeyword = keyword.trim().toLowerCase();
      const matchedProvinces = fallbackProvinces.filter(p =>
        p.name.toLowerCase().includes(normalizedKeyword)
      );
      return matchedProvinces; // Ensure return path in catch block
    }
  }
}

// Removed the incorrect trailing part from the previous edit
export default new DistrictAPI();