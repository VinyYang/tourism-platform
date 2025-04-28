const { DataTypes, Model } = require('sequelize');
// 移除旧的导入
// const { sequelize } = require('../utils/db');

module.exports = (sequelize) => { // 导出函数，接收 sequelize 实例
    class Scenic extends Model {
      // 添加实例方法，用于获取规范化的坐标数据
      getCoordinates() {
        // 优先使用location字段
        if (this.location && Array.isArray(this.location) && this.location.length === 2) {
          return {
            longitude: this.location[0],
            latitude: this.location[1],
            location: this.location
          };
        }
        // 其次使用longitude和latitude字段
        else if (this.longitude != null && this.latitude != null) {
          return {
            longitude: this.longitude,
            latitude: this.latitude,
            location: [this.longitude, this.latitude]
          };
        }
        // 如果没有坐标数据，返回null
        return null;
      }
    }

    Scenic.init({
      // 定义模型属性，对应数据库表的列
      scenic_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      city: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      address: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      open_time: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'open_time' // 明确数据库列名
      },
      ticket_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'ticket_price'
      },
      images: {
        type: DataTypes.JSON,
        allowNull: false
      },
      label: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      hot_score: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'hot_score'
      },
      // 添加location字段，用于存储GeoJSON格式的位置数据
      location: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: '位置坐标，格式为[longitude, latitude]'
      },
      latitude: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true
      },
      longitude: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at'
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'updated_at'
      }
    }, {
      sequelize, // 使用传入的 Sequelize 实例
      modelName: 'Scenic',
      tableName: 'Scenic', // 明确表名
      timestamps: true, // 启用时间戳 (createdAt, updatedAt)
      createdAt: 'created_at', // 映射 createdAt 到 created_at 列
      updatedAt: 'updated_at', // 映射 updatedAt 到 updated_at 列
      // underscored: true // schema.sql 中字段名大小写混合，模型定义也是，无需此项
      hooks: {
        // 在保存前自动同步坐标格式
        beforeSave: (instance, options) => {
          // 如果有经纬度但没有location数组，则自动生成
          if (instance.longitude != null && instance.latitude != null && 
              (!instance.location || !Array.isArray(instance.location) || instance.location.length !== 2)) {
            instance.location = [parseFloat(instance.longitude), parseFloat(instance.latitude)];
          }
          // 如果有location数组但没有经纬度，则自动提取
          else if (Array.isArray(instance.location) && instance.location.length === 2 && 
                  (instance.longitude == null || instance.latitude == null)) {
            instance.longitude = instance.location[0];
            instance.latitude = instance.location[1];
          }
        }
      }
    });

    // 定义模型关联关系
    Scenic.associate = (models) => {
        // 一个景点可以被多次收藏
        Scenic.hasMany(models.Favorite, { foreignKey: 'scenic_id' });
        // 一个景点可以出现在多个行程项中
        Scenic.hasMany(models.ItineraryItem, { foreignKey: 'scenic_id', as: 'itineraryItems' });
        // 新增：一个景点可以出现在多个精选路线中 (通过关联表)
        Scenic.hasMany(models.FeaturedRouteSpot, { foreignKey: 'scenic_id', as: 'featuredRouteSpots' });
        // 一个景点可以有多个评论
        // Scenic.hasMany(models.Review, { foreignKey: 'scenic_id', as: 'reviews' });
    };

    return Scenic;
}; 