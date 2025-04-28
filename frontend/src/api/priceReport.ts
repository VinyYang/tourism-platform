import http from './http';

/**
 * 价格数据API服务
 * 用于获取景点和酒店价格相关的数据
 * @module api/priceReport
 */

// 城市价格报告数据接口
export interface CityPriceReport {
  city: string;
  scenicPrices: {
    name: string;
    price: number;
    update_date: string;
  }[];
  hotelPrices: {
    name: string;
    stars: number;
    price: number;
    type: string;
    update_date: string;
  }[];
  hotelStats: {
    stars: number;
    avgPrice: number;
    count: number;
  }[];
}

// 热门城市价格对比数据接口
export interface HotCitiesPriceComparison {
  message: string;
  data: {
    city: string;
    hotelAvgPrice: number;
    scenicAvgPrice: number;
    hotelCount: number;
    scenicCount: number;
  }[];
}

// 房间类型价格分析数据接口
export interface RoomTypePriceAnalysis {
  message: string;
  city: string;
  data: {
    type: string;
    avgPrice: number;
    count: number;
  }[];
}

// 景点价格分布数据接口
export interface ScenicPriceDistribution {
  message: string;
  data: {
    range: string;
    count: number;
  }[];
}

// 价格数据更新统计信息接口
export interface PriceUpdateStats {
  message: string;
  data: {
    scenic: {
      total: number;
      updated: number;
      percent: number;
    };
    hotel: {
      total: number;
      updated: number;
      percent: number;
    };
    room: {
      total: number;
      updated: number;
      percent: number;
    };
  };
}

// 价格数据API服务对象
const priceReportAPI = {
  /**
   * 获取城市景点和酒店价格数据
   * @param city 城市名称
   * @returns Promise<CityPriceReport>
   */
  getCityPriceReport: (city: string): Promise<CityPriceReport> => {
    return http.get(`/price-report/city-report?city=${encodeURIComponent(city)}`);
  },

  /**
   * 获取热门城市的平均价格对比
   * @returns Promise<HotCitiesPriceComparison>
   */
  getHotCitiesPriceComparison: (): Promise<HotCitiesPriceComparison> => {
    return http.get('/price-report/hot-cities-comparison');
  },

  /**
   * 获取各类酒店房间的平均价格
   * @param city 可选的城市名称，用于筛选特定城市的数据
   * @returns Promise<RoomTypePriceAnalysis>
   */
  getRoomTypePriceAnalysis: (city?: string): Promise<RoomTypePriceAnalysis> => {
    const params = city ? `?city=${encodeURIComponent(city)}` : '';
    return http.get(`/price-report/room-type-analysis${params}`);
  },

  /**
   * 获取景点门票价格范围分布
   * @returns Promise<ScenicPriceDistribution>
   */
  getScenicPriceDistribution: (): Promise<ScenicPriceDistribution> => {
    return http.get('/price-report/scenic-price-distribution');
  },

  /**
   * 获取价格数据更新统计信息 (需要管理员权限)
   * @returns Promise<PriceUpdateStats>
   */
  getPriceUpdateStats: (): Promise<PriceUpdateStats> => {
    return http.get('/price-report/price-update-stats');
  }
};

export default priceReportAPI; 