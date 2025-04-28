/**
 * @desc 代理控制器 - 用于转发API请求到第三方服务
 */

const axios = require('axios');
// 移除对asyncHandler的引用
// const asyncHandler = require('../middlewares/async');

// @desc    代理途牛火车票API请求
// @route   GET /api/v1/proxy/train/tickets
// @access  Public
// 改为直接使用普通的异步函数
exports.proxyTuniuTrainTickets = async (req, res) => {
  try {
    console.log('收到的原始查询参数:', req.query);
    
    // 提取查询参数（同时支持两种可能的格式）
    let departureDate, departureCityName, arrivalCityName;
    
    // 检查是否是嵌套格式 (primary.departureDate)
    if (req.query.primary && typeof req.query.primary === 'object') {
      departureDate = req.query.primary.departureDate;
      departureCityName = req.query.primary.departureCityName;
      arrivalCityName = req.query.primary.arrivalCityName;
    } 
    // 检查是否是平铺格式 (primary[departureDate])
    else {
      departureDate = req.query['primary[departureDate]'];
      departureCityName = req.query['primary[departureCityName]'];
      arrivalCityName = req.query['primary[arrivalCityName]'];
    }
    
    console.log('解析后的参数:', { departureDate, departureCityName, arrivalCityName });
    
    // 校验必填参数
    if (!departureDate || !departureCityName || !arrivalCityName) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '请提供必要的查询参数：发车日期(departureDate)、出发站(departureCityName)和到达站(arrivalCityName)'
      });
    }
    
    // 构建途牛API请求URL
    const tuniuApiUrl = 'https://huoche.tuniu.com/yii.php';
    
    // 转发请求到途牛API
    console.log('发送请求到途牛API，参数:', {
      r: 'train/trainTicket/getTickets',
      'primary[departureDate]': departureDate,
      'primary[departureCityName]': departureCityName, 
      'primary[arrivalCityName]': arrivalCityName
    });
    
    const response = await axios.get(tuniuApiUrl, {
      params: {
        r: 'train/trainTicket/getTickets',
        'primary[departureDate]': departureDate,
        'primary[departureCityName]': departureCityName,
        'primary[arrivalCityName]': arrivalCityName
      },
      timeout: 15000, // 15秒超时
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Referer': 'https://huoche.tuniu.com/'
      }
    });
    
    console.log('途牛API响应状态码:', response.status);
    // 返回API响应
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('途牛火车票API代理错误:', error);
    
    // 构建详细错误信息
    const errorDetails = {
      message: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    };
    
    // 如果是Axios错误，添加更多详细信息
    if (error.response) {
      errorDetails.status = error.response.status;
      errorDetails.data = error.response.data;
    }
    
    // 返回错误响应
    return res.status(500).json({
      success: false,
      code: 500,
      message: '调用途牛火车票API失败',
      error: errorDetails
    });
  }
}; 