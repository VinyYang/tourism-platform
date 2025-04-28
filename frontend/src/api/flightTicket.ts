import axios from 'axios';

// API配置
const FLIGHT_API_BASE_URL = 'https://api.example.com';  // 实际使用时替换为真实API域名
const APP_KEY = 'YOUR_APP_KEY';  // 实际使用时替换为申请的APPKEY

// 城市名称到城市编码的映射
export const CITY_CODE_MAP: Record<string, string> = {
  '北京': 'BJS',
  '上海': 'SHA',
  '广州': 'CAN',
  '深圳': 'SZX',
  '成都': 'CTU',
  '杭州': 'HGH',
  '武汉': 'WUH',
  '西安': 'SIA',
  '重庆': 'CKG',
  '青岛': 'TAO',
  '长沙': 'CSX',
  '南京': 'NKG',
  '厦门': 'XMN',
  '昆明': 'KMG',
  '大连': 'DLC',
  '天津': 'TSN',
  '郑州': 'CGO',
  '三亚': 'SYX',
  '济南': 'TNA',
  '福州': 'FOC',
  '南宁': 'NNG',
  '昆山': 'KWL', // 注意：这不是昆山的准确代码，仅作为示例
};

// 航班信息接口
export interface FlightInfo {
  flightNo: string;          // 航班号
  airline: string;           // 航空公司
  aircraftType?: string;     // 机型
  fromCity: string;          // 出发城市
  toCity: string;            // 目的城市
  fromAirport?: string;      // 出发机场
  toAirport?: string;        // 到达机场
  fromTerminal?: string;     // 出发航站楼
  toTerminal?: string;       // 到达航站楼
  fromTime: string;          // 出发时间
  toTime: string;            // 到达时间
  fromDate: string;          // 出发日期
  toDate: string;            // 到达日期
  price: number;             // 价格
  discount?: number;         // 折扣
  tax?: number;              // 税费
  punctualityRate?: number;  // 准点率
  duration: string;          // 飞行时间
  stops: number;             // 经停次数
  transferCities?: string[]; // 经停城市
}

// 机票查询响应接口
export interface FlightTicketResponse {
  data: {
    flights: FlightInfo[];
  };
  success: boolean;
  msg: string;
}

// 机票查询参数接口
export interface FlightTicketQueryParams {
  fromCity: string;           // 出发城市
  toCity: string;             // 目的城市
  fromDate: string;           // 出发日期，格式：YYYY-MM-DD
  direct?: boolean;           // 是否直飞
}

// 模拟数据，当API不可用时使用
export const mockFlightTicketData = (params: FlightTicketQueryParams): FlightTicketResponse => {
  // 创建一些基础示例数据
  const fromHour = Math.floor(Math.random() * 12) + 7; // 7-18点
  const toHour = (fromHour + Math.floor(Math.random() * 5) + 2) % 24; // 飞行2-6小时
  
  const fromTimeStr = `${fromHour.toString().padStart(2, '0')}:${Math.floor(Math.random() * 6) * 10}`;
  const toTimeStr = `${toHour.toString().padStart(2, '0')}:${Math.floor(Math.random() * 6) * 10}`;
  
  const durationHours = (toHour < fromHour ? toHour + 24 : toHour) - fromHour;
  const durationMinutes = Math.floor(Math.random() * 6) * 10;
  
  const airlineList = ['中国国航', '南方航空', '东方航空', '海南航空', '深圳航空', '厦门航空'];
  const airline = airlineList[Math.floor(Math.random() * airlineList.length)];
  
  const mockDirectFlight: FlightInfo = {
    flightNo: `${airline.substring(0, 1)}H${Math.floor(Math.random() * 9000) + 1000}`,
    airline: airline,
    aircraftType: ['波音737', '波音787', '空客A320', '空客A330'][Math.floor(Math.random() * 4)],
    fromCity: params.fromCity,
    toCity: params.toCity,
    fromAirport: `${params.fromCity}国际机场`,
    toAirport: `${params.toCity}国际机场`,
    fromTerminal: `T${Math.floor(Math.random() * 3) + 1}`,
    toTerminal: `T${Math.floor(Math.random() * 3) + 1}`,
    fromTime: fromTimeStr,
    toTime: toTimeStr,
    fromDate: params.fromDate,
    toDate: params.fromDate, // 简化，假设当天到达
    price: Math.floor(Math.random() * 1000) + 500,
    discount: Math.floor(Math.random() * 5) / 10 + 0.5, // 0.5-0.9折
    tax: Math.floor(Math.random() * 100) + 50,
    punctualityRate: Math.floor(Math.random() * 40) + 60, // 60%-99%
    duration: `${durationHours}小时${durationMinutes}分钟`,
    stops: 0,
    transferCities: []
  };

  const mockTransferFlight: FlightInfo = {
    flightNo: `${airlineList[Math.floor(Math.random() * airlineList.length)].substring(0, 1)}H${Math.floor(Math.random() * 9000) + 1000}`,
    airline: airlineList[Math.floor(Math.random() * airlineList.length)],
    aircraftType: ['波音737', '波音787', '空客A320', '空客A330'][Math.floor(Math.random() * 4)],
    fromCity: params.fromCity,
    toCity: params.toCity,
    fromAirport: `${params.fromCity}国际机场`,
    toAirport: `${params.toCity}国际机场`,
    fromTime: `${(fromHour + 1) % 24}:${Math.floor(Math.random() * 6) * 10}`,
    toTime: `${(toHour + 2) % 24}:${Math.floor(Math.random() * 6) * 10}`,
    fromDate: params.fromDate,
    toDate: params.fromDate, // 简化，假设当天到达
    price: Math.floor(Math.random() * 800) + 300, // 中转航班通常更便宜
    discount: Math.floor(Math.random() * 5) / 10 + 0.5, // 0.5-0.9折
    tax: Math.floor(Math.random() * 100) + 50,
    punctualityRate: Math.floor(Math.random() * 40) + 60, // 60%-99%
    duration: `${durationHours + 3}小时${durationMinutes}分钟`, // 中转需要更多时间
    stops: 1,
    transferCities: ['上海', '西安', '成都', '广州'][Math.floor(Math.random() * 4)] !== params.fromCity && 
                   ['上海', '西安', '成都', '广州'][Math.floor(Math.random() * 4)] !== params.toCity ? 
                   [['上海', '西安', '成都', '广州'][Math.floor(Math.random() * 4)]] : ['北京']
  };

  // 返回模拟数据，基于是否直飞参数
  let flights = [];
  if (params.direct) {
    flights = [mockDirectFlight, {...mockDirectFlight, 
      flightNo: `${airlineList[Math.floor(Math.random() * airlineList.length)].substring(0, 1)}H${Math.floor(Math.random() * 9000) + 1000}`,
      airline: airlineList[Math.floor(Math.random() * airlineList.length)],
      fromTime: `${(fromHour + 4) % 24}:${Math.floor(Math.random() * 6) * 10}`,
      toTime: `${(toHour + 4) % 24}:${Math.floor(Math.random() * 6) * 10}`,
      price: Math.floor(Math.random() * 1000) + 500,
    }];
  } else {
    flights = [mockDirectFlight, mockTransferFlight, {...mockDirectFlight, 
      flightNo: `${airlineList[Math.floor(Math.random() * airlineList.length)].substring(0, 1)}H${Math.floor(Math.random() * 9000) + 1000}`,
      airline: airlineList[Math.floor(Math.random() * airlineList.length)],
      fromTime: `${(fromHour + 4) % 24}:${Math.floor(Math.random() * 6) * 10}`,
      toTime: `${(toHour + 4) % 24}:${Math.floor(Math.random() * 6) * 10}`,
      price: Math.floor(Math.random() * 1000) + 500,
    }];
  }

  console.log('生成模拟机票数据:', flights.length, '条记录');
  return {
    data: {
      flights
    },
    success: true,
    msg: "请求成功（模拟数据）"
  };
};

// 调用航班API查询
const queryFlightTicketApi = async (params: FlightTicketQueryParams & { appKey: string }): Promise<any> => {
  try {
    console.log('发送机票API请求，参数:', params);
    
    // 获取城市编码
    const fromCityCode = CITY_CODE_MAP[params.fromCity];
    const toCityCode = CITY_CODE_MAP[params.toCity];
    
    if (!fromCityCode || !toCityCode) {
      console.warn(`城市代码获取失败: ${!fromCityCode ? params.fromCity : params.toCity}`);
      throw new Error(`无法找到城市代码: ${!fromCityCode ? params.fromCity : params.toCity}`);
    }
    
    // 按照API文档构建请求URL
    const url = `${FLIGHT_API_BASE_URL}/flight/query`;
    
    // 构建请求参数
    const requestParams = {
      appKey: params.appKey,
      fromCityCode: fromCityCode,
      toCityCode: toCityCode,
      fromDate: params.fromDate,
      direct: params.direct
    };
    
    console.log('请求URL:', url);
    console.log('请求参数:', requestParams);
    
    const response = await axios.get(url, {
      params: requestParams,
      timeout: 15000, // 15秒超时
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log('机票API响应:', response.data);
    return response.data;
  } catch (error) {
    console.error('查询机票API失败:', error);
    
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

// 转换API数据到FlightInfo格式
const convertApiDataToFlightInfo = (apiData: any, params: FlightTicketQueryParams): FlightInfo[] => {
  try {
    console.log('开始转换机票API数据', apiData);
    
    // 检查数据格式是否符合预期
    if (!apiData || !apiData.success || !apiData.data || !apiData.data.voyage || !apiData.data.voyage.flights) {
      console.warn('API返回的数据格式不符合预期');
      throw new Error('API响应格式不符合预期');
    }
    
    // 提取航班数据
    const flightsData = apiData.data.voyage.flights;
    
    // 转换为应用内部使用的FlightInfo格式
    return flightsData.map((flight: any) => {
      // 从API返回的数据中提取出发/到达时间
      const fromDateTime = new Date(flight.fromDateTime);
      const toDateTime = new Date(flight.toDateTime);
      
      // 构建FlightInfo对象
      const flightInfo: FlightInfo = {
        flightNo: flight.flightNo,
        airline: flight.airlineCompany,
        aircraftType: flight.craftType,
        fromCity: params.fromCity,
        toCity: params.toCity,
        fromAirport: flight.fromAirportName,
        toAirport: flight.toAirportName,
        fromTerminal: flight.fromTerminal,
        toTerminal: flight.toTerminal,
        fromTime: flight.fromDateTime ? flight.fromDateTime.split(' ')[1].substring(0, 5) : '',
        toTime: flight.toDateTime ? flight.toDateTime.split(' ')[1].substring(0, 5) : '',
        fromDate: params.fromDate,
        toDate: toDateTime.toISOString().split('T')[0],
        price: flight.cabins && flight.cabins.length > 0 ? 
              flight.cabins[0].cabinPrice.adultSalePrice + flight.adultTax + flight.adultFuel : 0,
        discount: flight.cabins && flight.cabins.length > 0 ? flight.cabins[0].discount : undefined,
        tax: flight.adultTax + flight.adultFuel,
        duration: flight.flyDuration,
        stops: flight.stopNum || 0,
        transferCities: []
      };
      
      return flightInfo;
    });
  } catch (error) {
    console.error('转换机票数据失败:', error);
    return [];
  }
};

const flightTicketAPI = {
  // 查询机票信息
  queryFlightTickets: async (params: FlightTicketQueryParams): Promise<FlightTicketResponse> => {
    try {
      console.log('开始查询机票信息, 参数:', params);
      
      // 检查API基础URL是否已配置
      if (FLIGHT_API_BASE_URL.includes('example.com')) {
        console.log('API地址未配置，使用机票模拟数据');
        return mockFlightTicketData(params);
      }
      
      // 添加appKey参数
      const queryParams = {
        ...params,
        appKey: APP_KEY
      };
      
      try {
        // 调用机票API
        console.log('调用机票API...');
        const apiResponse = await queryFlightTicketApi(queryParams);
        
        // 验证API响应
        if (apiResponse && apiResponse.success === true) {
          console.log('机票API调用成功');
          
          // 转换API数据到应用内部格式
          const flights = convertApiDataToFlightInfo(apiResponse, params);
          
          if (flights.length > 0) {
            console.log(`获取到${flights.length}条机票数据`);
            return {
              data: { flights },
              success: true,
              msg: "请求成功"
            };
          } else {
            console.warn('没有找到符合条件的机票');
            return {
              data: { flights: [] },
              success: true,
              msg: "没有找到符合条件的机票"
            };
          }
        } else {
          console.warn('机票API返回错误:', apiResponse);
          throw new Error('API响应失败: ' + (apiResponse?.msg || '未知错误'));
        }
      } catch (apiError) {
        console.error('机票API调用失败，使用模拟数据:', apiError);
        return mockFlightTicketData(params);
      }
    } catch (error) {
      console.error('查询机票信息失败:', error);
      // 当出现错误时使用模拟数据
      return mockFlightTicketData(params);
    }
  },
  
  // 获取城市代码
  getCityCode: (cityName: string): string => {
    const code = CITY_CODE_MAP[cityName] || '';
    if (!code) {
      console.warn(`无法找到城市"${cityName}"的代码`);
    }
    return code;
  }
};

export default flightTicketAPI; 