/**
 * 火车票缓存模型 - 用于缓存外部API的搜索结果
 * @module models/TrainTicketCache
 */

module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');

  const TrainTicketCache = sequelize.define('train_ticket_cache', {
    cache_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '缓存ID'
    },
    train_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: '乘车日期'
    },
    from_station: {
      type: DataTypes.STRING(10),
      allowNull: false,
      comment: '出发站简码'
    },
    to_station: {
      type: DataTypes.STRING(10),
      allowNull: false,
      comment: '到达站简码'
    },
    train_code: {
      type: DataTypes.STRING(10),
      allowNull: true,
      comment: '车次号'
    },
    search_key: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '搜索键（组合参数的哈希）'
    },
    result_data: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
      comment: '缓存的搜索结果（JSON字符串）'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: '创建时间'
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '过期时间'
    }
  }, {
    tableName: 'train_ticket_cache',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['search_key']
      },
      {
        fields: ['expires_at']
      },
      {
        fields: ['train_date', 'from_station', 'to_station']
      }
    ]
  });

  return TrainTicketCache;
}; 