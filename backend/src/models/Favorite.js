const { DataTypes, Model } = require('sequelize');
// 移除旧的导入
// const { sequelize } = require('../utils/db');

module.exports = (sequelize) => { // 导出函数
    class Favorite extends Model {}

    Favorite.init({
        favorite_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            // references: { model: 'User', key: 'user_id' } // 关联在 associate 中定义
        },
        item_type: {
            type: DataTypes.ENUM('scenic', 'hotel', 'strategy'),
            allowNull: false,
            field: 'item_type'
        },
        scenic_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            // references: { model: 'Scenic', key: 'scenic_id' }
        },
        hotel_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            // references: { model: 'Hotel', key: 'hotel_id' }
        },
        strategy_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            // references: { model: 'Strategy', key: 'strategy_id' }
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: 'created_at'
        }
    }, {
        sequelize,
        modelName: 'Favorite',
        tableName: 'Favorite',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false, // 没有更新时间字段
        // underscored: true, // schema 和模型定义一致
        indexes: [
            { fields: ['user_id'] },
            { fields: ['item_type'] },
            { 
                unique: true,
                // 确保 unique 约束中的字段名与数据库列名一致
                fields: ['user_id', 'item_type', 'scenic_id', 'hotel_id', 'strategy_id'] 
            }
        ]
    });

    Favorite.associate = (models) => {
        // 一个收藏记录属于一个用户
        Favorite.belongsTo(models.User, { foreignKey: 'user_id' });
        // 一个收藏记录可能关联一个景点
        Favorite.belongsTo(models.Scenic, { foreignKey: 'scenic_id' });
        // 一个收藏记录可能关联一个酒店
        Favorite.belongsTo(models.Hotel, { foreignKey: 'hotel_id' });
        // 一个收藏记录可能关联一个攻略
        Favorite.belongsTo(models.Strategy, { foreignKey: 'strategy_id' });
    };

    return Favorite;
}; 