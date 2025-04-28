const axios = require('axios');
require('dotenv').config();

// 高德地图API密钥
const AMAP_KEY = process.env.AMAP_KEY || ''; // 从环境变量获取

/**
 * 使用高德地图API进行地理编码
 * @param {string} address 待编码的地址
 * @returns {Promise<{longitude: number, latitude: number} | null>} 坐标结果
 */
async function geocodeAddress(address) {
  if (!address) return null;
  
  if (!AMAP_KEY) {
    console.error('高德地图API密钥未配置');
    return null;
  }
  
  try {
    console.log(`正在为地址 "${address}" 获取坐标...`);
    
    const response = await axios.get(
      'https://restapi.amap.com/v3/geocode/geo',
      {
        params: {
          address: address,
          key: AMAP_KEY,
          output: 'JSON'
        }
      }
    );
    
    if (response.data.status === '1' && response.data.geocodes && response.data.geocodes.length > 0) {
      const location = response.data.geocodes[0].location.split(',');
      const result = {
        longitude: parseFloat(location[0]),
        latitude: parseFloat(location[1])
      };
      console.log(`地址 "${address}" 的坐标: [${result.longitude}, ${result.latitude}]`);
      return result;
    }
    
    console.warn(`未能找到地址 "${address}" 的坐标，API响应:`, response.data);
    return null;
  } catch (error) {
    console.error(`地理编码请求失败 (${address}):`, error.message);
    return null;
  }
}

/**
 * 批量地理编码
 * @param {Array<{id: any, address: string}>} addressList 地址列表，每项包含id和address
 * @param {number} delayMs 请求之间的延迟毫秒数，防止API限流
 * @returns {Promise<Array<{id: any, address: string, result: {longitude: number, latitude: number} | null}>>} 处理结果
 */
async function batchGeocodeAddresses(addressList, delayMs = 300) {
  const results = [];
  
  for (const item of addressList) {
    const coordinates = await geocodeAddress(item.address);
    results.push({
      id: item.id,
      address: item.address,
      result: coordinates
    });
    
    // 添加延迟避免API限流
    if (delayMs > 0 && addressList.length > 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return results;
}

module.exports = {
  geocodeAddress,
  batchGeocodeAddresses
}; 