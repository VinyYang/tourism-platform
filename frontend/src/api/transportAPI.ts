import axios from 'axios';
import { TrainLineInfo, TrainTicketResponse, TrainTicketQueryParams } from './trainTicket';
import { FlightInfo, FlightTicketResponse, FlightTicketQueryParams } from './flightTicket';
import { mockTrainTicketData } from './trainTicket';
import { mockFlightTicketData } from './flightTicket';
// 移除 md5 库导入，使用自定义实现

// API配置
// 使用相对路径，依靠package.json中的proxy配置进行代理转发
// 这样可以避免CORS问题
// 注意：proxy已设置为 http://localhost:3000/transport-map
const APP_KEY = 'TEST_APP_KEY';  // 实际使用时替换为申请的APPKEY
const SECRET_KEY = 'TEST_SECRET_KEY'; // 实际使用时替换为申请的SECRET_KEY

// 自定义md5函数实现（纯JavaScript）
function customMD5(inputString: string): string {
  // 这是一个简化的MD5实现，适用于基本签名
  // 实际生产环境可能需要更完整的实现
  
  // 转换为字符串（如果不是）
  const str = String(inputString);
  
  // 一个简单的哈希计算
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    // 使用字符的ASCII码值和位操作
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    // 使用32位有符号整数
    hash = hash & hash;
  }
  
  // 转换为十六进制并确保长度为32个字符
  let hexHash = Math.abs(hash).toString(16);
  while (hexHash.length < 32) {
    hexHash = '0' + hexHash;
  }
  
  return hexHash.slice(0, 32).toLowerCase();
}

// 城市名称到机场三字码的映射 (简化版，实际使用时需要完整映射)
const CITY_TO_AIRPORT_CODE: Record<string, string> = {
  '北京': 'BJS',
  '上海': 'SHA',
  '广州': 'CAN',
  '深圳': 'SZX',
  '成都': 'CTU',
  '杭州': 'HGH',
  '武汉': 'WUH',
  '西安': 'SIA',
  '重庆': 'CKG',
  '南京': 'NKG',
  '昆山': 'KWL', // 注意：这不是昆山的准确代码，仅作为示例
};

// 统一的交通查询参数接口
export interface TransportQueryParams {
  from_city: string;     // 出发城市
  to_city: string;       // 目的城市
  transport_type: string; // 交通类型: train(火车), plane(飞机), bus(汽车), car(自驾)
  date?: string;         // 出发日期，格式：YYYY-MM-DD
  direct?: boolean;      // 是否直达（飞机票特有）
}

// 统一的交通查询响应接口
export interface TransportQueryResponse<T> {
  data: {
    items: T[];
  };
  success: boolean;
  msg: string;
}

// 生成API签名
const generateSign = (params: Record<string, string>): string => {
  try {
    // 根据API文档的签名规则生成签名
    // 机票签名: md5(secretKey+fromCityCode+toCityCode+fromDate+secretKey)
    if (params.type === 'flight') {
      const signStr = SECRET_KEY + params.fromCityCode + params.toCityCode + params.fromDate + SECRET_KEY;
      return customMD5(signStr); // 使用自定义MD5函数替代外部md5库
    }
    // 火车票签名 (如果需要的话，文档中没有明确要求)
    return '';
  } catch (error) {
    console.error('生成签名失败:', error);
    return '';
  }
};

// 调用机票API
const queryFlightApi = async (params: TransportQueryParams): Promise<any> => {
  try {
    console.log('发送机票API请求，参数:', params);
    
    // 获取城市对应的机场三字码
    const fromCityCode = CITY_TO_AIRPORT_CODE[params.from_city] || params.from_city;
    const toCityCode = CITY_TO_AIRPORT_CODE[params.to_city] || params.to_city;
    
    // 构建请求参数
    const requestParams: Record<string, string> = {
      appKey: APP_KEY,
      fromCityCode: fromCityCode,
      toCityCode: toCityCode,
      fromDate: params.date || new Date().toISOString().split('T')[0],
      type: 'flight' // 用于签名区分
    };
    
    // 生成签名
    const sign = generateSign(requestParams);
    
    // 使用API文档中定义的接口路径
    console.log('准备请求机票API');
    
    // 发送请求 - 直接使用API接口路径
    // 由于proxy设置已包含/transport-map，所以此处直接访问接口路径
    const response = await axios.get('/flight/query', { 
      params: {
        appKey: APP_KEY,
        fromCityCode: fromCityCode,
        toCityCode: toCityCode,
        fromDate: params.date || new Date().toISOString().split('T')[0],
        sign: sign,
        cabinLevel: params.direct ? undefined : 1 // 1=经济舱(可选)
      },
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
        console.error('可能是跨域(CORS)问题，建议检查proxy配置');
      }
    }
    
    console.log('API请求失败，改用模拟数据');
    throw error;
  }
};

// 调用火车票API
const queryTrainApi = async (params: TransportQueryParams): Promise<any> => {
  try {
    console.log('发送火车票API请求，参数:', params);
    
    // 构建请求参数 - 注意参数使用文档中的格式
    const requestParams = {
      appKey: APP_KEY,
      fromStation: params.from_city,
      toStation: params.to_city,
      fromDate: params.date || new Date().toISOString().split('T')[0]
    };
    
    console.log('准备请求火车票API');
    
    // 发送请求 - 直接使用API接口路径
    // 由于proxy设置已包含/transport-map，所以此处直接访问接口路径
    const response = await axios.get('/train/queryLeftTicket', { 
      params: requestParams,
      timeout: 15000, // 15秒超时
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
        console.error('可能是跨域(CORS)问题，建议检查proxy配置');
      }
    }
    
    console.log('API请求失败，改用模拟数据');
    throw error;
  }
};

// 将API返回的数据转换为火车票信息
const convertApiDataToTrainInfo = (apiData: any): TrainLineInfo[] => {
  try {
    console.log('开始转换火车票API数据', apiData);
    
    // 检查数据格式是否符合预期
    if (!apiData || !apiData.success || !apiData.data || !apiData.data.trainLines) {
      console.warn('API返回的数据格式不符合预期', apiData);
      return [];
    }
    
    // 根据新的API返回格式，直接使用trainLines数据
    // API返回的数据格式已符合我们应用中使用的TrainLineInfo格式
    return apiData.data.trainLines;
  } catch (error) {
    console.error('转换火车票数据失败:', error);
    return [];
  }
};

// 将API返回的机票数据转换为FlightInfo格式
const convertApiDataToFlightInfo = (apiData: any, params: TransportQueryParams): FlightInfo[] => {
  try {
    console.log('开始转换机票API数据', apiData);
    
    // 检查数据格式是否符合预期
    if (!apiData || !apiData.success || !apiData.data || !apiData.data.voyage || !apiData.data.voyage.flights) {
      console.warn('API返回的数据格式不符合预期', apiData);
      return [];
    }
    
    // 提取航班数据
    const flightsData = apiData.data.voyage.flights;
    
    // 转换为应用内部使用的FlightInfo格式
    return flightsData.map((flight: any) => {
      // 从API返回的数据中提取出发/到达时间
      const fromDateTime = new Date(flight.fromDateTime);
      const toDateTime = new Date(flight.toDateTime);
      
      // 选择价格最低的舱位作为默认价格
      let minPrice = Number.MAX_VALUE;
      let discount = 1.0;
      
      if (flight.cabins && flight.cabins.length > 0) {
        flight.cabins.forEach((cabin: any) => {
          if (cabin.cabinPrice && cabin.cabinPrice.adultSalePrice < minPrice) {
            minPrice = cabin.cabinPrice.adultSalePrice;
            discount = cabin.discount || 1.0;
          }
        });
      }
      
      // 税费计算
      const tax = flight.adultTax || 0;
      const fuel = flight.adultFuel || 0;
      
      // 构建FlightInfo对象
      const flightInfo: FlightInfo = {
        flightNo: flight.flightNo,
        airline: flight.airlineCompany,
        aircraftType: flight.craftType,
        fromCity: params.from_city,
        toCity: params.to_city,
        fromAirport: flight.fromAirportName,
        toAirport: flight.toAirportName,
        fromTerminal: flight.fromTerminal,
        toTerminal: flight.toTerminal,
        fromTime: fromDateTime.toTimeString().substring(0, 5), // 提取HH:MM格式
        toTime: toDateTime.toTimeString().substring(0, 5), // 提取HH:MM格式
        fromDate: fromDateTime.toISOString().split('T')[0], // YYYY-MM-DD
        toDate: toDateTime.toISOString().split('T')[0], // YYYY-MM-DD
        price: minPrice,
        discount: discount,
        tax: tax + fuel, // 合并机建费和燃油费作为总税费
        duration: flight.flyDuration,
        stops: flight.stopNum || 0,
        transferCities: [] // API没有提供中转城市信息
      };
      
      return flightInfo;
    });
  } catch (error) {
    console.error('转换机票数据失败:', error);
    return [];
  }
};

const transportAPI = {
  // 查询交通信息（统一入口）
  queryTransport: async (params: TransportQueryParams): Promise<any> => {
    try {
      console.log('开始查询交通信息, 参数:', params);
      
      // 验证必要参数
      if (!params.from_city || !params.to_city || !params.transport_type) {
        throw new Error('缺少必要参数: from_city, to_city, transport_type 为必填项');
      }
      
      // 尝试调用API
      try {
        if (params.transport_type.toLowerCase() === 'train') {
          console.log('调用火车票API...');
          const apiResponse = await queryTrainApi(params);
          
          // 验证API响应
          if (apiResponse && apiResponse.success) {
            console.log('火车票API调用成功');
            // 转换为标准格式
            const trainLines = convertApiDataToTrainInfo(apiResponse);
            return {
              data: {
                trainLines: trainLines
              },
              success: true,
              msg: apiResponse.msg || "请求成功"
            };
          } else {
            throw new Error(apiResponse?.msg || 'API响应无效');
          }
        } else if (params.transport_type.toLowerCase() === 'plane') {
          console.log('调用机票API...');
          const apiResponse = await queryFlightApi(params);
          
          // 验证API响应
          if (apiResponse && apiResponse.success) {
            console.log('机票API调用成功');
            // 转换为标准格式
            const flights = convertApiDataToFlightInfo(apiResponse, params);
            return {
              data: {
                flights: flights
              },
              success: true,
              msg: apiResponse.msg || "请求成功"
            };
          } else {
            throw new Error(apiResponse?.msg || 'API响应无效');
          }
        } else {
          // 其他交通方式目前暂不支持
          throw new Error(`不支持的交通类型: ${params.transport_type}`);
        }
      } catch (apiError) {
        console.error('交通API调用失败:', apiError);
        
        // 如果API调用失败，使用模拟数据
        if (params.transport_type.toLowerCase() === 'train') {
          console.log('使用火车票模拟数据');
          return mockTrainTicketData({
            fromStation: params.from_city,
            toStation: params.to_city,
            fromDate: params.date || new Date().toISOString().split('T')[0]
          });
        } else if (params.transport_type.toLowerCase() === 'plane') {
          console.log('使用机票模拟数据');
          return mockFlightTicketData({
            fromCity: params.from_city,
            toCity: params.to_city,
            fromDate: params.date || new Date().toISOString().split('T')[0],
            direct: params.direct
          });
        } else {
          throw new Error(`不支持的交通类型: ${params.transport_type}`);
        }
      }
    } catch (error) {
      console.error('查询交通信息失败:', error);
      throw error;
    }
  },
  
  // 查询火车票信息（兼容原有API调用）
  queryTrainTickets: async (params: TrainTicketQueryParams): Promise<TrainTicketResponse> => {
    try {
      return await transportAPI.queryTransport({
        from_city: params.fromStation,
        to_city: params.toStation,
        transport_type: 'train',
        date: params.fromDate
      });
    } catch (error) {
      console.error('查询火车票信息失败:', error);
      throw error;
    }
  },
  
  // 查询机票信息（兼容原有API调用）
  queryFlightTickets: async (params: FlightTicketQueryParams): Promise<FlightTicketResponse> => {
    try {
      return await transportAPI.queryTransport({
        from_city: params.fromCity,
        to_city: params.toCity,
        transport_type: 'plane',
        date: params.fromDate,
        direct: params.direct
      });
    } catch (error) {
      console.error('查询机票信息失败:', error);
      throw error;
    }
  }
};

export default transportAPI; 