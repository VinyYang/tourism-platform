'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 移除is_custom字段
    await queryInterface.removeColumn('FeaturedRouteSpot', 'is_custom');
    
    console.log('已从FeaturedRouteSpot表中移除is_custom字段');
  },

  down: async (queryInterface, Sequelize) => {
    // 如果需要回滚，重新添加is_custom字段
    await queryInterface.addColumn('FeaturedRouteSpot', 'is_custom', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      after: 'spot_description',
      comment: '是否为自定义景点，当scenic_id为空时此字段应为true'
    });
    
    console.log('已重新添加is_custom字段到FeaturedRouteSpot表');
    
    // 更新数据
    await queryInterface.sequelize.query(`
      UPDATE FeaturedRouteSpot SET is_custom = true WHERE scenic_id IS NULL;
      UPDATE FeaturedRouteSpot SET is_custom = false WHERE scenic_id IS NOT NULL;
    `);
    
    console.log('已更新is_custom字段的值');
  }
}; 