'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. 添加精选路线
    const featuredRoutes = [
      {
        name: '红色经典革命路线',
        description: '探访中国革命历史胜地，感受革命先辈的光辉历程，追寻红色记忆。',
        image_url: 'https://img1.baidu.com/it/u=2187441659,3336694771&fm=253&fmt=auto&app=138&f=JPEG?w=800&h=500',
        category: '红色文化',
        difficulty: 'easy',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: '古都文化之旅',
        description: '漫步古都长安，领略千年文化底蕴，感受中华文明的灿烂辉煌。',
        image_url: 'https://img0.baidu.com/it/u=3822471505,3621824102&fm=253&fmt=auto&app=120&f=JPEG?w=800&h=500',
        category: '历史文化',
        difficulty: 'medium',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: '江南水乡文化体验',
        description: '徜徉江南水乡，探访古镇园林，体验江南独特的人文风情。',
        image_url: 'https://img1.baidu.com/it/u=3400045045,3534496176&fm=253&fmt=auto&app=138&f=JPEG?w=750&h=500',
        category: '江南文化',
        difficulty: 'easy',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];
    
    await queryInterface.bulkInsert('FeaturedRoute', featuredRoutes);
    
    // 2. 获取刚插入的路线和已有的景点
    const routes = await queryInterface.sequelize.query(
      `SELECT featured_route_id, name FROM FeaturedRoute ORDER BY featured_route_id`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    
    const scenics = await queryInterface.sequelize.query(
      `SELECT scenic_id, name, latitude, longitude FROM Scenic LIMIT 15`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    
    if (!scenics || scenics.length === 0) {
      console.warn('没有找到景点数据，请先添加景点数据');
      return;
    }
    
    // 3. 为路线添加景点
    const routeSpots = [];
    
    // 红色经典路线使用前5个景点
    const redRouteId = routes[0].featured_route_id;
    for (let i = 0; i < Math.min(5, scenics.length); i++) {
      routeSpots.push({
        featured_route_id: redRouteId,
        scenic_id: scenics[i].scenic_id,
        order_number: i + 1,
        latitude: scenics[i].latitude,
        longitude: scenics[i].longitude,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
    
    // 古都文化之旅使用第6-10个景点
    const ancientRouteId = routes[1].featured_route_id;
    for (let i = 5; i < Math.min(10, scenics.length); i++) {
      routeSpots.push({
        featured_route_id: ancientRouteId,
        scenic_id: scenics[i].scenic_id,
        order_number: i - 4,
        latitude: scenics[i].latitude,
        longitude: scenics[i].longitude,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
    
    // 江南水乡文化体验使用第11-15个景点
    const waterTownRouteId = routes[2].featured_route_id;
    for (let i = 10; i < Math.min(15, scenics.length); i++) {
      routeSpots.push({
        featured_route_id: waterTownRouteId,
        scenic_id: scenics[i].scenic_id,
        order_number: i - 9,
        latitude: scenics[i].latitude,
        longitude: scenics[i].longitude,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
    
    if (routeSpots.length > 0) {
      await queryInterface.bulkInsert('FeaturedRouteSpot', routeSpots);
    }
  },

  down: async (queryInterface, Sequelize) => {
    // 删除数据 (按照与创建相反的顺序)
    await queryInterface.bulkDelete('FeaturedRouteSpot', null, {});
    await queryInterface.bulkDelete('FeaturedRoute', null, {});
  }
}; 