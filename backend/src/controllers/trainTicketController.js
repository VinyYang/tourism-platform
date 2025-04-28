/**
 * 火车票控制器 - 处理火车票搜索相关的请求
 * @module controllers/trainTicketController
 */

const { sequelize } = require('../config/db.js');
const TrainTicketCache = require('../models/TrainTicketCache')(sequelize);
const { callTrainSearchAPI, convertNameToCode, isValidStationCode, generateMockTrainResponse } = require('../utils/apiUtils');
const { Op } = require('sequelize');
const crypto = require('crypto');

/**
 * 生成搜索键（用于缓存匹配）
 * @param {Object} params - 搜索参数
 * @returns {string} - 唯一搜索键
 */
const generateSearchKey = (params) => {
  const str = `${params.trainDate}_${params.fromStation}_${params.toStation}_${params.trainCode || ''}`;
  return crypto.createHash('md5').update(str).digest('hex');
};

/**
 * 从缓存中获取搜索结果
 * @param {Object} params - 搜索参数
 * @returns {Promise<Object|null>} - 缓存结果，未找到则返回null
 */
const getFromCache = async (params) => {
  try {
    const searchKey = generateSearchKey(params);
    const now = new Date();
    
    const cachedResult = await TrainTicketCache.findOne({
      where: {
        search_key: searchKey,
        expires_at: { [Op.gt]: now }
      }
    });
    
    if (cachedResult) {
      console.log('从缓存中获取到火车票搜索结果');
      return JSON.parse(cachedResult.result_data);
    }
    
    return null;
  } catch (error) {
    console.error('检查缓存失败:', error);
    return null;
  }
};

/**
 * 将搜索结果保存到缓存
 * @param {Object} params - 搜索参数
 * @param {Object} result - API返回结果
 */
const saveToCache = async (params, result) => {
  try {
    const searchKey = generateSearchKey(params);
    
    // 设置缓存过期时间（2小时）
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 2);
    
    // 保存或更新缓存
    await TrainTicketCache.upsert({
      train_date: params.trainDate,
      from_station: params.fromStation,
      to_station: params.toStation,
      train_code: params.trainCode || null,
      search_key: searchKey,
      result_data: JSON.stringify(result),
      created_at: new Date(),
      expires_at: expiresAt
    });
    
    console.log('火车票搜索结果已保存到缓存');
  } catch (error) {
    console.error('保存缓存失败:', error);
    // 缓存失败不影响主流程，只打印错误
  }
};

/**
 * 搜索火车票
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件函数
 */
exports.searchTrainTickets = async (req, res, next) => {
  try {
    // 验证请求参数
    const { trainDate, fromStation, toStation, trainCode } = req.body;
    
    if (!trainDate || !fromStation || !toStation) {
      return res.status(400).json({
        success: false,
        returnCode: 400,
        errorMsg: '缺少必要参数：trainDate, fromStation, toStation'
      });
    }

    // 转换站点名称
    const fromStationCode = convertNameToCode(fromStation);
    const toStationCode = convertNameToCode(toStation);
    
    // 验证站点代码有效性
    if (!isValidStationCode(fromStationCode)) {
      return res.status(400).json({
        success: false,
        returnCode: 400,
        errorMsg: `无法识别的出发站点: ${fromStation}`
      });
    }
    
    if (!isValidStationCode(toStationCode)) {
      return res.status(400).json({
        success: false,
        returnCode: 400,
        errorMsg: `无法识别的到达站点: ${toStation}`
      });
    }
    
    // 构建查询参数
    const searchParams = {
      trainDate,
      fromStation: fromStationCode, // 使用转换后的站点代码
      toStation: toStationCode,     // 使用转换后的站点代码
      trainCode: trainCode || ''
    };
    
    console.log('火车票搜索请求参数:', searchParams);
    
    // 尝试从缓存获取
    const cachedResult = await getFromCache(searchParams);
    if (cachedResult) {
      return res.json(cachedResult);
    }
    
    // 缓存未命中，调用外部API
    console.log('缓存未命中，开始调用外部API');
    
    // 根据环境变量决定是否使用模拟数据
    let apiResult;
    if (process.env.USE_MOCK_TRAIN_API === 'true') {
      console.log('使用模拟数据');
      apiResult = generateMockTrainResponse(searchParams);
    } else {
      apiResult = await callTrainSearchAPI(searchParams);
    }
    
    // 如果API响应成功，则保存到缓存
    if (apiResult && apiResult.success) {
      await saveToCache(searchParams, apiResult);
    }
    
    // 返回API响应给客户端
    res.json(apiResult);
  } catch (error) {
    console.error('搜索火车票失败:', error);
    
    // 构建错误响应
    res.status(500).json({
      success: false,
      returnCode: 500,
      errorMsg: '搜索火车票时发生错误: ' + error.message
    });
  }
};

/**
 * 清除过期缓存
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件函数
 */
exports.clearExpiredCache = async (req, res, next) => {
  try {
    const now = new Date();
    
    // 删除所有过期缓存
    const result = await TrainTicketCache.destroy({
      where: {
        expires_at: { [Op.lt]: now }
      }
    });
    
    res.json({
      success: true,
      message: `已清除 ${result} 条过期缓存`
    });
  } catch (error) {
    console.error('清除过期缓存失败:', error);
    next(error);
  }
};

/**
 * 搜索车站信息
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.searchStations = async (req, res) => {
  try {
    const { keyword } = req.query;
    const { STATION_CODE_MAP } = require('../utils/stationCodeMap');
    
    if (!keyword) {
      // 如果没有关键词，返回热门站点
      const hotStations = [
        '北京', '上海', '广州', '深圳', '成都', '杭州', '南京', 
        '武汉', '西安', '重庆', '天津', '长沙', '青岛', '大连'
      ];
      
      const results = hotStations.map(name => ({
        name,
        code: STATION_CODE_MAP[name],
        isHot: true
      }));
      
      return res.json({
        success: true,
        data: results
      });
    }
    
    // 如果有关键词，进行搜索
    const results = Object.keys(STATION_CODE_MAP)
      .filter(name => 
        name.includes(keyword) || 
        STATION_CODE_MAP[name].toLowerCase().includes(keyword.toLowerCase())
      )
      .map(name => ({
        name,
        code: STATION_CODE_MAP[name]
      }))
      .slice(0, 20); // 限制返回数量
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('搜索车站信息失败:', error);
    res.status(500).json({
      success: false,
      errorMsg: '搜索车站信息失败: ' + error.message
    });
  }
}; 