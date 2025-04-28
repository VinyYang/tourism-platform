'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class FeaturedRouteSpot extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // 定义与 FeaturedRoute 的多对一关系
      FeaturedRouteSpot.belongsTo(models.FeaturedRoute, {
        foreignKey: 'featured_route_id',
        as: 'featuredRoute' // 可通过 'featuredRoute' 别名访问关联的路线
      });

      // 定义与 Scenic 的多对一关系 (允许为空)
      FeaturedRouteSpot.belongsTo(models.Scenic, {
        foreignKey: 'scenic_id',
        as: 'scenicSpot', // 统一使用 'scenicSpot' 别名访问关联的景点
        constraints: false // 允许外键为空
      });
    }
  }
  FeaturedRouteSpot.init({
    featured_route_spot_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    featured_route_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'FeaturedRoute', // 引用 FeaturedRoute 表
        key: 'featured_route_id'
      }
    },
    scenic_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // 可为空，以支持自定义景点
      references: {
        model: 'Scenic', // 引用 Scenic 表
        key: 'scenic_id'
      }
    },
    // 自定义景点所需字段
    spot_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '自定义景点名称，当scenic_id为空时使用'
    },
    spot_description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '自定义景点描述'
    },
    order_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '景点在路线中的顺序'
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
      comment: '景点在路线中的纬度坐标（可能与景点本身的坐标不同）'
    },
    longitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
      comment: '景点在路线中的经度坐标（可能与景点本身的坐标不同）'
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
      onUpdate : DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'FeaturedRouteSpot',
    tableName: 'FeaturedRouteSpot',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true, // 启用下划线命名
    indexes: [ // 更新索引
      {
        unique: true,
        fields: ['featured_route_id', 'order_number'],
        name: 'uk_route_spot_order'
      }
    ],
    comment: '精选路线与景点的关联表，支持关联已有景点或自定义景点'
  });
  return FeaturedRouteSpot;
}; 