const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class StrategyLike extends Model {}

    StrategyLike.init({
        like_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            // references: { model: 'User', key: 'user_id' } // 由 associate 定义
        },
        strategy_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            // references: { model: 'Strategy', key: 'strategy_id' } // 由 associate 定义
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: 'created_at'
        }
    }, {
        sequelize,
        modelName: 'StrategyLike',
        tableName: 'strategylike',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
        indexes: [
            { unique: true, fields: ['user_id', 'strategy_id'] }
        ]
    });

    // StrategyLike 通常不需要 associate 方法，关联在 User/Strategy 中定义

    return StrategyLike;
}; 