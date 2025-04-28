const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class Review extends Model {}

    Review.init({
        review_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        item_type: {
            type: DataTypes.ENUM('scenic', 'hotel', 'strategy', 'booking'),
            allowNull: false,
            field: 'item_type'
        },
        scenic_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        hotel_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        strategy_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        booking_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        rating: {
            type: DataTypes.DECIMAL(2, 1),
            allowNull: false,
            validate: {
                min: 0,
                max: 5
            }
        },
        content: {
            type: DataTypes.TEXT,
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
        modelName: 'Review',
        tableName: 'Review',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });

    Review.associate = (models) => {
        Review.belongsTo(models.User, { foreignKey: 'user_id', as: 'author' });
        Review.belongsTo(models.Scenic, { foreignKey: 'scenic_id' });
        Review.belongsTo(models.Hotel, { foreignKey: 'hotel_id' });
        Review.belongsTo(models.Strategy, { foreignKey: 'strategy_id' });
        Review.belongsTo(models.Booking, { foreignKey: 'booking_id' });
    };

    return Review;
}; 