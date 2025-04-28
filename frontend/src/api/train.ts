import axios from 'axios';
import { message } from 'antd';

// 火车票座位类型接口
export interface TrainSeat {
  leftNumber: number;
  seatStatus: string;
  seat: number;
  price: number;
  stuPrice: number | null;
  promotionPrice: number;
  resId: number;
  detail: any[];
  priceMemo: string | null;
  seatName: string;
}

// 火车票信息接口
export interface Train {
  trainId: number;
  trainNum: string;
  trainType: number;
  trainTypeName: string;
  departStationName: string;
  destStationName: string;
  departDepartTime: string;
  destArriveTime: string;
  duration: number;
  prices: TrainSeat[];
  durationDay: number;
  departStationType: number;
  destStationType: number;
  saleStatus: number;
  departStationId: number;
  destStationId: number;
  startSaleTime: string;
  canChooseSeat: number;
  memo: string;
  departureCityCode: number;
  arrivalCityCode: number;
  departureCityName: string;
  arrivalCityName: string;
  upOrDown: number;
  trainStartDate: string;
  accessByIdcard: string;
  durationStr: string;
  departStationTypeName: string;
  destStationTypeName: string;
  sellOut: number;
}

// 火车票筛选条件接口
export interface TrainFilter {
  id: string;
  name: string;
  pros: {
    id: number | string;
    name: string;
  }[];
}

// 火车票排序选项接口
export interface TrainSort {
  type: number;
  id: number;
  name: string;
}

// 火车票API响应接口
export interface TrainResponse {
  code: number;
  data: {
    count: number;
    list: Train[];
    filter: {
      filter: TrainFilter[];
      sort: TrainSort[];
    };
    allTrainType: {
      list: {
        trainType: number;
        trainTypeName: string;
        trainTypeCode: string;
        link: string;
      }[];
      departureCityName: string;
      arrivalCityName: string;
    };
  };
}

// 定义API基础URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';

// 火车票API服务
const trainAPI = {
  // 获取火车票信息
  getTrainTickets: async (
    departureDate: string,
    departureCityName: string,
    arrivalCityName: string
  ): Promise<TrainResponse> => {
    try {
      // 由于途牛API是第三方API，我们需要通过后端代理来调用
      // 假设后端已经实现了代理转发接口
      const response = await axios.get(`${API_BASE_URL}/train/tickets`, {
        params: {
          departureDate,
          departureCityName,
          arrivalCityName
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('获取火车票信息失败:', error);
      message.error('获取火车票信息失败，请稍后重试');
      throw error;
    }
  },
  
  // 获取热门列车路线
  getHotTrainRoutes: async (limit: number = 5): Promise<any> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/train/hotRoutes`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('获取热门列车路线失败:', error);
      message.error('获取热门列车路线失败，请稍后重试');
      return [];
    }
  }
};

export default trainAPI; 