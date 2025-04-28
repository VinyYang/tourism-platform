const { DataTypes, Model } = require('sequelize');
// 移除旧的导入
// const { sequelize } = require('../utils/db');

module.exports = (sequelize) => { // 导出函数
    class Transport extends Model {}

    Transport.init({
        transport_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        transport_type: {
            type: DataTypes.ENUM('plane', 'train', 'bus', 'car'),
            allowNull: false,
            field: 'transport_type'
        },
        from_city: {
            type: DataTypes.STRING(50),
            allowNull: false,
            field: 'from_city'
        },
        to_city: {
            type: DataTypes.STRING(50),
            allowNull: false,
            field: 'to_city'
        },
        company: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        duration: {
            type: DataTypes.INTEGER,
            allowNull: false
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
        sequelize,
        modelName: 'Transport',
        tableName: 'transport', // 改为小写以匹配数据库
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        // underscored: true, // schema 和模型定义一致
        // indexes: [
        //     { fields: ['from_city'] },
        //     { fields: ['to_city'] }
        // ]
    });

    Transport.associate = (models) => {
        // 交通信息可以被包含在多个行程项中
        Transport.hasMany(models.ItineraryItem, { foreignKey: 'transport_id' });
    };

    return Transport;
}; 