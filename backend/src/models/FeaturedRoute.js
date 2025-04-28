'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class FeaturedRoute extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // 定义与 FeaturedRouteSpot 的一对多关系
      FeaturedRoute.hasMany(models.FeaturedRouteSpot, {
        foreignKey: 'featured_route_id',
        as: 'spots' // 统一使用 'spots' 别名访问关联的景点
      });
      
      // 如果需要通过 FeaturedRouteSpot 间接访问 Scenic，可以在这里定义
      // FeaturedRoute.belongsToMany(models.Scenic, {
      //   through: models.FeaturedRouteSpot,
      //   foreignKey: 'featured_route_id',
      //   otherKey: 'scenic_id',
      //   as: 'scenicSpots'
      // });
    }
  }
  FeaturedRoute.init({
    featured_route_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    image_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    difficulty: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'e.g., easy, medium, hard'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: '控制前端是否可见'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      onUpdate : DataTypes.NOW // 注意: Sequelize 中通常这样表示 onUpdate
    }
  }, {
    sequelize,
    modelName: 'FeaturedRoute',
    tableName: 'FeaturedRoute', // 显式指定表名
    timestamps: true, // 启用时间戳 (createdAt, updatedAt)
    createdAt: 'created_at', // 映射 createdAt 到数据库字段
    updatedAt: 'updated_at', // 映射 updatedAt 到数据库字段
    underscored: true, // 如果你的表字段用下划线 (如 featured_route_id)，这个选项很有用
    comment: '精选路线表'
  });
  return FeaturedRoute;
}; 