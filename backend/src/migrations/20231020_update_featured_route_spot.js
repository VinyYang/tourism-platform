'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. 设置scenic_id可为空
    await queryInterface.changeColumn('FeaturedRouteSpot', 'scenic_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Scenic',
        key: 'scenic_id'
      }
    });

    // 2. 移除原有的联合唯一索引
    await queryInterface.removeIndex('FeaturedRouteSpot', 'uk_route_scenic');
    
    // 3. 添加新字段
    await queryInterface.addColumn('FeaturedRouteSpot', 'spot_name', {
      type: Sequelize.STRING(100),
      allowNull: true,
      after: 'scenic_id'
    });

    await queryInterface.addColumn('FeaturedRouteSpot', 'spot_description', {
      type: Sequelize.TEXT,
      allowNull: true,
      after: 'spot_name'
    });

    await queryInterface.addColumn('FeaturedRouteSpot', 'is_custom', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      after: 'spot_description'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // 还原修改 (如果需要回滚)
    // 1. 移除新添加的字段
    await queryInterface.removeColumn('FeaturedRouteSpot', 'is_custom');
    await queryInterface.removeColumn('FeaturedRouteSpot', 'spot_description');
    await queryInterface.removeColumn('FeaturedRouteSpot', 'spot_name');
    
    // 2. 重新添加联合唯一索引
    await queryInterface.addIndex('FeaturedRouteSpot', 
      ['featured_route_id', 'scenic_id'], 
      { 
        unique: true,
        name: 'uk_route_scenic'
      }
    );
    
    // 3. 将scenic_id设置回不可为空
    await queryInterface.changeColumn('FeaturedRouteSpot', 'scenic_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Scenic',
        key: 'scenic_id'
      }
    });
  }
}; 