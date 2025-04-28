import axios from 'axios';

// API配置
const TRAIN_API_BASE_URL = 'https://api.example.com';  // 实际使用时替换为真实API域名
const APP_KEY = 'YOUR_APP_KEY';  // 实际使用时替换为申请的APPKEY

export interface TrainSeatInfo {
  seatType: number;
  seatTypeName: string;
  ticketPrice: number;
  leftTicketNum: number;
  otherSeats: SleeperSeatInfo[] | null;
}

export interface SleeperSeatInfo {
  sleeperType: number;
  sleeperTypeName: string;
  ticketPrice: number;
}

export interface TrainLineInfo {
  trainCode: string;
  trainNo: string;
  fromStation: string;
  toStation: string;
  fromTime: string;
  toTime: string;
  fromDateTime: string;
  toDateTime: string;
  arrive_days: string;
  runTime: string;
  trainsType: number;
  trainsTypeName: string;
  beginStation: string;
  beginTime: string | null;
  endStation: string;
  endTime: string | null;
  isSupportChooseSleeper: boolean;
  note: string;
  transferQueryExtraParams: any;
  sequence: number;
  Seats: TrainSeatInfo[];
}

export interface TrainTicketResponse {
  data: {
    trainLines: TrainLineInfo[];
  };
  success: boolean;
  msg: string;
}

export interface TrainTicketQueryParams {
  fromStation: string;
  toStation: string;
  fromDate: string; // 格式：YYYY-MM-DD
}

// 模拟数据，当API不可用时使用
export const mockTrainTicketData = (params: TrainTicketQueryParams): TrainTicketResponse => {
  console.log('生成火车票模拟数据, 参数:', params);
  
  // 创建一些基础示例数据
  const mockHighSpeedTrain: TrainLineInfo = {
    trainCode: `G${Math.floor(Math.random() * 9000) + 1000}`,
    trainNo: `5f000G${Math.floor(Math.random() * 90000) + 10000}`,
    fromStation: params.fromStation,
    toStation: params.toStation,
    fromTime: "08:30",
    toTime: "10:45",
    fromDateTime: `${params.fromDate} 08:30`,
    toDateTime: `${params.fromDate} 10:45`,
    arrive_days: "0",
    runTime: "02:15",
    trainsType: 1,
    trainsTypeName: "高铁",
    beginStation: "北京",
    beginTime: "06:30",
    endStation: "上海",
    endTime: "14:20",
    isSupportChooseSleeper: false,
    note: "",
    transferQueryExtraParams: null,
    sequence: 0,
    Seats: [
      {
        seatType: 1,
        seatTypeName: "商务座",
        ticketPrice: 553.0,
        leftTicketNum: Math.floor(Math.random() * 20),
        otherSeats: null
      },
      {
        seatType: 3,
        seatTypeName: "一等座",
        ticketPrice: 325.0,
        leftTicketNum: Math.floor(Math.random() * 50),
        otherSeats: null
      },
      {
        seatType: 4,
        seatTypeName: "二等座",
        ticketPrice: 208.0,
        leftTicketNum: Math.floor(Math.random() * 100) + 20,
        otherSeats: null
      }
    ]
  };

  const mockNormalTrain: TrainLineInfo = {
    trainCode: `K${Math.floor(Math.random() * 900) + 100}`,
    trainNo: `760000K${Math.floor(Math.random() * 9000) + 1000}K`,
    fromStation: params.fromStation,
    toStation: params.toStation,
    fromTime: "18:40",
    toTime: "07:20",
    fromDateTime: `${params.fromDate} 18:40`,
    toDateTime: `${params.fromDate} 07:20`,
    arrive_days: "1",
    runTime: "12:40",
    trainsType: 5,
    trainsTypeName: "快速",
    beginStation: "广州",
    beginTime: "12:30",
    endStation: "哈尔滨",
    endTime: "16:40",
    isSupportChooseSleeper: true,
    note: "",
    transferQueryExtraParams: null,
    sequence: 0,
    Seats: [
      {
        seatType: 10,
        seatTypeName: "硬座",
        ticketPrice: 158.0,
        leftTicketNum: Math.floor(Math.random() * 120) + 30,
        otherSeats: null
      },
      {
        seatType: 8,
        seatTypeName: "硬卧",
        ticketPrice: 280.0,
        leftTicketNum: Math.floor(Math.random() * 60) + 10,
        otherSeats: [
          {
            sleeperType: 3,
            sleeperTypeName: "上铺",
            ticketPrice: 280.0
          },
          {
            sleeperType: 2,
            sleeperTypeName: "中铺",
            ticketPrice: 290.0
          },
          {
            sleeperType: 1,
            sleeperTypeName: "下铺",
            ticketPrice: 300.0
          }
        ]
      },
      {
        seatType: 6,
        seatTypeName: "软卧",
        ticketPrice: 445.0,
        leftTicketNum: Math.floor(Math.random() * 20) + 1,
        otherSeats: [
          {
            sleeperType: 3,
            sleeperTypeName: "上铺",
            ticketPrice: 445.0
          },
          {
            sleeperType: 1,
            sleeperTypeName: "下铺",
            ticketPrice: 465.0
          }
        ]
      }
    ]
  };

  // 返回模拟数据
  const result = {
    data: {
      trainLines: [mockHighSpeedTrain, mockNormalTrain]
    },
    success: true,
    msg: "请求成功（模拟数据）"
  };
  
  console.log('火车票模拟数据生成完成，返回', result.data.trainLines.length, '条记录');
  return result;
};

// 调用火车票API查询
const queryTrainTicketApi = async (params: TrainTicketQueryParams & { appKey: string }): Promise<any> => {
  try {
    console.log('发送火车票API请求，参数:', params);
    
    // 构建URL - 根据文档指定的接口地址
    const url = `${TRAIN_API_BASE_URL}/train/queryLeftTicket`;
    
    // 按照API文档创建请求参数
    const requestParams = {
      appKey: params.appKey,
      fromStation: params.fromStation,
      toStation: params.toStation,
      fromDate: params.fromDate
    };
    
    console.log('请求URL:', url);
    console.log('请求参数:', requestParams);
    
    const response = await axios.get(url, { 
      params: requestParams,
      timeout: 15000, // 增加超时时间到15秒
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log('火车票API响应:', response.data);
    return response.data;
  } catch (error) {
    console.error('查询火车票API失败:', error);
    
    // 详细记录错误信息
    if (axios.isAxiosError(error)) {
      console.error('请求详情:', {
        url: error.config?.url,
        method: error.config?.method,
        params: error.config?.params,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      // 如果是CORS错误，给出明确提示
      if (error.message.includes('CORS') || error.message.includes('Network Error')) {
        console.error('可能是跨域(CORS)问题，建议使用代理服务器');
      }
    }
    
    throw error;
  }
};

// 新增：火车票站点信息接口
export interface TrainStationInfo {
  stationName: string;
  stationCode: string;
  spell: string;
  pinyin: string;
}

// 新增：API参数类型
export interface TrainSearchParams {
  trainDate: string; // 格式：YYYY-MM-DD
  fromStation: string; // 出发站简码
  toStation: string; // 到达站简码
  trainCode?: string; // 可选车次号
}

// 新增：车票余票信息接口
export interface TrainTicketDetail {
  trainNo: string; // 列车号
  trainCode: string; // 车次
  startStationName: string; // 列车始发站名
  endStationName: string; // 列车终到站名
  fromStationCode: string; // 出发车站简码
  fromStationName: string; // 出发车站名
  toStationCode: string; // 到达车站简码
  toStationName: string; // 到达车站名
  startTime: string; // 出发时刻
  arriveTime: string; // 到达时刻
  arriveDays: string; // 到达天数
  runTime: string; // 历时
  canBuyNow: string; // 当前是否可以接受预定
  runTimeMinute: string; // 历时分钟合计
  trainStartDate: string; // 列车从始发站出发的日期
  accessByIdcard: string; // 是否可凭二代身份证直接进出站
  saleDateTime: string; // 车票开售时间
  
  // 各类型座位余票和价格信息
  gjrwNum: string; // 高级软卧余票数量
  gjrwPrice: string; // 高级软卧票价
  qtxbNum: string; // 其他席别余票数量
  qtxbPrice: string; // 其他席别对应的票价
  rwNum: string; // 软卧余票数量
  rwPrice: string; // 软卧票价
  rzNum: string; // 软座的余票数量
  rzPrice: string; // 软座的票价
  swzNum: string; // 商务座的余票数据
  swzPrice: string; // 商务座票价
  tdzNum: string; // 特等座的余票数量
  tdzPrice: string; // 特等座票价
  wzNum: string; // 无座的余票数量
  wzPrice: string; // 无座票价
  ywNum: string; // 硬卧的余票数量
  ywPrice: string; // 硬卧票价
  yzNum: string; // 硬座的余票数量
  yzPrice: string; // 硬座票价
  edzNum: string; // 二等座的余票数量
  edzPrice: string; // 二等座票价
  ydzNum: string; // 一等座的余票数量
  ydzPrice: string; // 一等座票价
  [key: string]: string; // 增加索引签名以适应其他可能的字段
}

// 新增：票价搜索响应
export interface TrainSearchResponse {
  success: boolean;
  returnCode: number;
  errorMsg?: string;
  data?: TrainTicketDetail[];
}

// 新增：途牛火车票API相关类型和接口
export interface TuniuTrainSeat {
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

export interface TuniuTrain {
  trainId: number;
  trainNum: string;
  trainType: number;
  trainTypeName: string;
  departStationName: string;
  destStationName: string;
  departDepartTime: string;
  destArriveTime: string;
  duration: number;
  prices: TuniuTrainSeat[];
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

export interface TuniuTrainResponse {
  code: number;
  data: {
    count: number;
    list: TuniuTrain[];
    filter: {
      filter: {
        id: string;
        name: string;
        pros: {
          id: number | string;
          name: string;
        }[];
      }[];
      sort: {
        type: number;
        id: number;
        name: string;
      }[];
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

// 新增：途牛火车票API调用函数
export const queryTuniuTrainTickets = async (
  departureDate: string,
  departureCityName: string,
  arrivalCityName: string
): Promise<TuniuTrainResponse> => {
  try {
    console.log('查询途牛火车票API，参数:', { departureDate, departureCityName, arrivalCityName });
    
    // 修正API路径
    const url = `${process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1'}/transports/proxy/train/tickets`;
    
    const response = await axios.get(url, {
      params: {
        'primary[departureDate]': departureDate,
        'primary[departureCityName]': departureCityName,
        'primary[arrivalCityName]': arrivalCityName
      },
      timeout: 15000 // 15秒超时
    });
    
    console.log('途牛火车票API响应:', response.data);
    return response.data;
  } catch (error) {
    console.error('查询途牛火车票API失败:', error);
    if (axios.isAxiosError(error)) {
      console.error('请求详情:', {
        url: error.config?.url,
        method: error.config?.method,
        params: error.config?.params,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
    }
    throw error;
  }
};

// 新增：将途牛API的火车票数据转换为我们应用中使用的TrainTicketDetail格式
export const convertTuniuTrainToTrainTicketDetail = (train: TuniuTrain): TrainTicketDetail => {
  // 初始化一个基础的TrainTicketDetail对象
  const result: TrainTicketDetail = {
    trainNo: train.trainId.toString(),
    trainCode: train.trainNum,
    startStationName: train.departStationName,
    endStationName: train.destStationName,
    fromStationCode: train.departStationId.toString(),
    fromStationName: train.departStationName,
    toStationCode: train.destStationId.toString(),
    toStationName: train.destStationName,
    startTime: train.departDepartTime,
    arriveTime: train.destArriveTime,
    arriveDays: train.durationDay.toString(),
    runTime: train.durationStr,
    canBuyNow: train.saleStatus === 0 ? "1" : "0",
    runTimeMinute: (train.duration / 60).toString(),
    trainStartDate: train.trainStartDate,
    accessByIdcard: train.accessByIdcard,
    saleDateTime: train.startSaleTime || "",
    
    // 初始化所有座位类型的余票和价格为默认值
    gjrwNum: "--", gjrwPrice: "--",
    qtxbNum: "--", qtxbPrice: "--",
    rwNum: "--", rwPrice: "--",
    rzNum: "--", rzPrice: "--",
    swzNum: "--", swzPrice: "--",
    tdzNum: "--", tdzPrice: "--",
    wzNum: "--", wzPrice: "--",
    ywNum: "--", ywPrice: "--",
    yzNum: "--", yzPrice: "--",
    edzNum: "--", edzPrice: "--",
    ydzNum: "--", ydzPrice: "--"
  };
  
  // 根据途牛API的座位类型映射到我们的格式
  train.prices.forEach(price => {
    switch(price.seatName) {
      case "商务座":
        result.swzNum = price.leftNumber.toString();
        result.swzPrice = price.price.toString();
        break;
      case "特等座":
        result.tdzNum = price.leftNumber.toString();
        result.tdzPrice = price.price.toString();
        break;
      case "一等座":
        result.ydzNum = price.leftNumber.toString();
        result.ydzPrice = price.price.toString();
        break;
      case "二等座":
        result.edzNum = price.leftNumber.toString();
        result.edzPrice = price.price.toString();
        break;
      case "硬座":
        result.yzNum = price.leftNumber.toString();
        result.yzPrice = price.price.toString();
        break;
      case "软座":
        result.rzNum = price.leftNumber.toString();
        result.rzPrice = price.price.toString();
        break;
      case "硬卧":
        result.ywNum = price.leftNumber.toString();
        result.ywPrice = price.price.toString();
        break;
      case "软卧":
        result.rwNum = price.leftNumber.toString();
        result.rwPrice = price.price.toString();
        break;
      case "高级软卧":
        result.gjrwNum = price.leftNumber.toString();
        result.gjrwPrice = price.price.toString();
        break;
      case "无座":
        result.wzNum = price.leftNumber.toString();
        result.wzPrice = price.price.toString();
        break;
      default:
        result.qtxbNum = price.leftNumber.toString();
        result.qtxbPrice = price.price.toString();
        break;
    }
  });
  
  return result;
};

const trainTicketAPI = {
  // 查询火车票信息
  queryTrainTickets: async (params: TrainTicketQueryParams): Promise<TrainTicketResponse> => {
    try {
      console.log('开始查询火车票信息, 参数:', params);
      
      // 检查API基础URL是否已配置
      if (TRAIN_API_BASE_URL.includes('example.com')) {
        console.log('API地址未配置，使用火车票模拟数据');
        return mockTrainTicketData(params);
      }
      
      // 添加appKey参数
      const queryParams = {
        ...params,
        appKey: APP_KEY
      };
      
      try {
        // 调用火车票API
        console.log('调用火车票API...');
        const apiResponse = await queryTrainTicketApi(queryParams);
        
        // 验证API响应
        if (apiResponse && apiResponse.success === true && apiResponse.data?.trainLines) {
          console.log('火车票API返回数据:', apiResponse.data.trainLines.length, '条记录');
          return apiResponse;
        } else {
          console.warn('火车票API返回的数据格式不符合预期:', apiResponse);
          throw new Error('API响应格式不符合预期');
        }
      } catch (apiError) {
        console.error('火车票API调用失败，使用模拟数据:', apiError);
        return mockTrainTicketData(params);
      }
    } catch (error) {
      console.error('查询火车票信息失败:', error);
      // 接口失败时使用模拟数据
      return mockTrainTicketData(params);
    }
  },
  
  // 新增：搜索火车票余票信息
  searchTrainTickets: async (params: TrainSearchParams): Promise<TrainSearchResponse> => {
    try {
      console.log('开始搜索火车票余票信息, 参数:', params);
      
      // 调用后端API
      const response = await axios.post('/api/v1/train/search', params, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 15000 // 15秒超时
      });
      
      console.log('余票搜索结果:', response.data);
      return response.data;
    } catch (error) {
      console.error('搜索火车票余票信息失败:', error);
      
      // 详细记录错误信息
      if (axios.isAxiosError(error)) {
        console.error('请求详情:', {
          url: error.config?.url,
          method: error.config?.method,
          params: error.config?.params,
          data: error.config?.data,
          status: error.response?.status,
          statusText: error.response?.statusText,
          responseData: error.response?.data
        });
      }
      
      // 返回错误响应
      return {
        success: false,
        returnCode: 500,
        errorMsg: error instanceof Error ? error.message : '未知错误'
      };
    }
  },
  
  // 新增：获取车站信息（可用于站点搜索或验证）
  // 注意：这个API在文档中没有明确定义，这里仅作为示例
  getStationInfo: async (keyword: string): Promise<TrainStationInfo[]> => {
    try {
      console.log('搜索车站信息, 关键词:', keyword);
      
      // 假设后端有一个获取车站信息的API
      const response = await axios.get('/api/v1/train/stations', {
        params: { keyword },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      return response.data.data || [];
    } catch (error) {
      console.error('获取车站信息失败:', error);
      return [];
    }
  },

  // 新增：使用途牛API搜索火车票
  searchTrainTicketsWithTuniu: async (params: TrainSearchParams): Promise<TrainSearchResponse> => {
    try {
      // 从车站代码获取城市名
      const departureCityName = params.fromStation; // 在实际应用中，你可能需要从代码映射到城市名
      const arrivalCityName = params.toStation;     // 同上
      
      const response = await queryTuniuTrainTickets(
        params.trainDate,
        departureCityName,
        arrivalCityName
      );
      
      if (response && response.code === 200 && response.data && response.data.list) {
        // 将途牛API响应转换为应用中使用的格式
        const trainTicketDetails = response.data.list.map(train => 
          convertTuniuTrainToTrainTicketDetail(train)
        );
        
        return {
          success: true,
          returnCode: 200,
          data: trainTicketDetails
        };
      } else {
        return {
          success: false,
          returnCode: response?.code || 500,
          errorMsg: '获取列车信息失败，请稍后重试'
        };
      }
    } catch (error) {
      console.error('使用途牛API搜索火车票失败:', error);
      return {
        success: false,
        returnCode: 500,
        errorMsg: error instanceof Error ? error.message : '未知错误'
      };
    }
  }
};

export default trainTicketAPI; 