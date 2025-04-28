/**
 * API工具函数 - 处理外部API的签名、请求等操作
 * @module utils/apiUtils
 */

const axios = require('axios');
const crypto = require('crypto');
const { convertNameToCode, isValidStationCode } = require('./stationCodeMap');

// 配置信息（应从环境变量获取）
const API_KEY = process.env.TRAIN_API_KEY || 'testkey';
const SECRET_KEY = process.env.TRAIN_SECRET_KEY || 'testsecret';
const API_BASE_URL = process.env.TRAIN_API_URL || 'https://api.example.com';

/**
 * 生成MD5签名
 * @param {Object} params - 需要签名的参数
 * @returns {string} - MD5签名结果
 */
const generateMD5Sign = (input) => {
  return crypto.createHash('md5').update(input).digest('hex');
};

/**
 * 生成API签名
 * @param {Object} params - 请求参数
 * @returns {string} - 签名字符串
 */
const generateAPISign = (params) => {
  // 根据API文档，这里需要按照特定格式拼接参数进行签名
  // 具体实现根据文档定义的签名方式调整
  const baseString = SECRET_KEY + JSON.stringify(params) + SECRET_KEY;
  return generateMD5Sign(baseString);
};

/**
 * 生成时间戳（符合API要求的格式）
 * @returns {string} - 格式化的时间戳
 */
const generateTimestamp = () => {
  const now = new Date();
  return now.toISOString().split('T')[0]; // YYYY-MM-DD格式
};

/**
 * 调用火车票搜索API
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>} - API响应结果
 */
const callTrainSearchAPI = async (params) => {
  try {
    // 转换站点名称为站点代码
    const fromStationCode = convertNameToCode(params.fromStation);
    const toStationCode = convertNameToCode(params.toStation);
    
    // 验证转换结果
    if (!isValidStationCode(fromStationCode)) {
      throw new Error(`无法识别的出发站点: ${params.fromStation}`);
    }
    
    if (!isValidStationCode(toStationCode)) {
      throw new Error(`无法识别的到达站点: ${params.toStation}`);
    }
    
    // 记录转换结果
    console.log('站点名称转换:', {
      from: { original: params.fromStation, code: fromStationCode },
      to: { original: params.toStation, code: toStationCode }
    });
    
    // 构建业务参数
    const apiParams = {
      trainDate: params.trainDate,
      fromStation: fromStationCode,
      toStation: toStationCode,
      trainCode: params.trainCode || ''
    };
    
    // 构建系统参数
    const timestamp = generateTimestamp();
    const sign = generateAPISign(apiParams);
    
    // 按照API文档要求构建完整请求体
    const requestBody = {
      apiKey: API_KEY,
      sign: sign,
      timestamp: timestamp,
      data: apiParams  // 业务参数放在data字段中
    };

    console.log('调用火车票API请求参数:', JSON.stringify(requestBody));

    // 发送POST请求
    const response = await axios.post(`${API_BASE_URL}/train/search`, requestBody, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json'
      },
      timeout: 15000 // 增加超时时间到15秒
    });

    console.log('火车票API响应状态:', response.status);
    
    // 检查响应是否符合预期格式
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      return {
        success: true,
        returnCode: response.data.returnCode || 0,
        data: response.data.data
      };
    } else {
      // 格式不符合预期，尝试适配
      console.warn('API响应格式不符合预期，尝试适配:', response.data);
      return {
        success: !!response.data.success,
        returnCode: response.data.returnCode || 500,
        errorMsg: response.data.errorMsg || '响应格式不符合预期',
        data: Array.isArray(response.data.data) ? response.data.data : []
      };
    }
  } catch (error) {
    console.error('调用火车票API失败:', error.message);
    
    // 详细记录错误信息，便于调试
    if (axios.isAxiosError(error)) {
      console.error('API请求错误详情:', {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        data: error.config?.data,
        timeout: error.config?.timeout,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data
      });
      
      // 如果是CORS错误，给出明确提示
      if (error.message.includes('CORS') || error.message.includes('Network Error')) {
        console.error('可能是跨域(CORS)问题，请检查API域名配置和CORS策略');
      }
    }
    
    // 返回标准化的错误响应
    return {
      success: false,
      returnCode: 500,
      errorMsg: error.message || '调用外部API时发生错误',
      data: []
    };
  }
};

/**
 * 生成模拟的火车票API响应（仅用于开发测试）
 * @param {Object} params - 查询参数
 * @returns {Object} - 模拟的API响应
 */
const generateMockTrainResponse = (params) => {
  console.log('生成火车票API模拟响应:', params);
  
  // 创建一条模拟数据
  const mockData = {
    trainNo: "1100000K7507",
    trainCode: "K75",
    startStationName: "北京",
    endStationName: "上海",
    fromStationCode: params.fromStation,
    fromStationName: "南京",
    toStationCode: params.toStation,
    toStationName: "上海南",
    startTime: "00:58",
    arriveTime: "04:37",
    arriveDays: "0",
    runTime: "03:39",
    canBuyNow: "Y",
    runTimeMinute: "219",
    trainStartDate: params.trainDate.replace(/-/g, ''),
    accessByIdcard: "Y",
    saleDateTime: "1630",
    gjrwNum: "--",
    gjrwPrice: "--",
    qtxbNum: "--",
    qtxbPrice: "--",
    rwNum: "10",
    rwPrice: "140.5",
    rzNum: "--",
    rzPrice: "--",
    tdzNum: "--",
    tdzPrice: "--",
    wzNum: "59",
    wzPrice: "46.5",
    ywNum: "16",
    ywPrice: "92.5",
    yzNum: "13",
    yzPrice: "46.5",
    edzNum: "--",
    edzPrice: "--",
    ydzNum: "--",
    ydzPrice: "--",
    swzNum: "--",
    swzPrice: "--"
  };
  
  return {
    success: true,
    returnCode: 0,
    data: [mockData]
  };
};

module.exports = {
  generateAPISign,
  generateTimestamp,
  callTrainSearchAPI,
  convertNameToCode,
  isValidStationCode,
  generateMockTrainResponse
}; 