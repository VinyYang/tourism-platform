/**
 * 景点坐标数据迁移脚本
 * 用于更新已有景点的坐标信息
 * 
 * 使用方法: node src/scripts/updateCoordinates.js
 */

require('dotenv').config();
const { sequelize, Scenic } = require('../models');
const { geocodeAddress } = require('../utils/geocoding');

// 延迟函数，避免API限流
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// 主函数
async function updateScenicSpotCoordinates() {
  try {
    console.log('开始更新景点坐标数据...');
    
    // 查找所有没有坐标的景点
    const spotsWithoutCoordinates = await Scenic.findAll({
      where: sequelize.literal('(latitude IS NULL OR longitude IS NULL) AND (location IS NULL)'),
      raw: false
    });
    
    console.log(`找到 ${spotsWithoutCoordinates.length} 个缺少坐标的景点`);
    
    let successCount = 0;
    let failCount = 0;
    
    // 遍历处理每个景点
    for (const spot of spotsWithoutCoordinates) {
      try {
        // 构建完整地址
        const addressToGeocode = spot.address || `${spot.city}${spot.name}`;
        
        console.log(`[${spot.scenic_id}] 正在为 "${spot.name}" 获取坐标，地址: ${addressToGeocode}`);
        
        // 调用地理编码工具获取坐标
        const coordinates = await geocodeAddress(addressToGeocode);
        
        if (coordinates) {
          // 更新景点坐标
          spot.location = [coordinates.longitude, coordinates.latitude];
          spot.longitude = coordinates.longitude;
          spot.latitude = coordinates.latitude;
          await spot.save();
          console.log(`✅ 已更新景点 "${spot.name}" 的坐标: [${coordinates.longitude}, ${coordinates.latitude}]`);
          successCount++;
        } else {
          console.log(`❌ 无法获取景点 "${spot.name}" 的坐标`);
          failCount++;
        }
        
        // 防止API限流
        await delay(300);
      } catch (error) {
        console.error(`处理景点 "${spot.name}" 时出错:`, error.message);
        failCount++;
      }
    }
    
    console.log('\n坐标更新完成');
    console.log(`成功更新: ${successCount} 个景点`);
    console.log(`更新失败: ${failCount} 个景点`);
    console.log(`剩余未处理: ${spotsWithoutCoordinates.length - successCount - failCount} 个景点`);
    
  } catch (error) {
    console.error('更新坐标数据失败:', error);
  } finally {
    // 关闭数据库连接
    await sequelize.close();
    console.log('数据库连接已关闭');
  }
}

// 执行主函数
updateScenicSpotCoordinates(); 