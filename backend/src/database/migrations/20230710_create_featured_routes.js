'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 创建精选路线表
    await queryInterface.createTable('FeaturedRoute', {
      featured_route_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      image_url: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      category: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      difficulty: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: 'e.g., easy, medium, hard'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: '控制前端是否可见'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    // 创建精选路线与景点关联表
    await queryInterface.createTable('FeaturedRouteSpot', {
      featured_route_spot_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      featured_route_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'FeaturedRoute',
          key: 'featured_route_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      scenic_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Scenic',
          key: 'scenic_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      order_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '景点在路线中的顺序'
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: true,
        comment: '景点在路线中的纬度坐标（可能与景点本身的坐标不同）'
      },
      longitude: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: true,
        comment: '景点在路线中的经度坐标（可能与景点本身的坐标不同）'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    // 添加唯一索引
    await queryInterface.addIndex('FeaturedRouteSpot', ['featured_route_id', 'order_number'], {
      name: 'uk_route_spot_order',
      unique: true
    });
    await queryInterface.addIndex('FeaturedRouteSpot', ['featured_route_id', 'scenic_id'], {
      name: 'uk_route_scenic',
      unique: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    // 先删除子表，再删除主表
    await queryInterface.dropTable('FeaturedRouteSpot');
    await queryInterface.dropTable('FeaturedRoute');
  }
}; 