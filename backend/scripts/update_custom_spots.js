/**
 * 更新FeaturedRouteSpot表中的is_custom字段
 * 规则：scenic_id为null的是自定义景点，设置is_custom为true
 *      scenic_id不为null的是标准景点，设置is_custom为false
 */

const { FeaturedRouteSpot, sequelize } = require('../src/models');

(async () => {
  try {
    console.log('开始更新FeaturedRouteSpot表的is_custom字段...');
    
    // 更新所有scenic_id为空的记录，设置is_custom为true
    const result1 = await FeaturedRouteSpot.update(
      { is_custom: true },
      { where: { scenic_id: null } }
    );
    console.log(`已更新 ${result1[0]} 条记录，将scenic_id为null的景点标记为自定义景点`);
    
    // 更新所有非空scenic_id的记录，设置is_custom为false
    const result2 = await FeaturedRouteSpot.update(
      { is_custom: false },
      { where: sequelize.literal('scenic_id IS NOT NULL') }
    );
    console.log(`已更新 ${result2[0]} 条记录，将关联景点的is_custom设为false`);
    
    console.log('数据更新完成！');
    process.exit(0);
  } catch (err) {
    console.error('更新数据失败:', err);
    process.exit(1);
  }
})(); 