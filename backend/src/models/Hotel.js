const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class Hotel extends Model {}

    Hotel.init({
        hotel_id: {
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
        stars: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        price_range: {
            type: DataTypes.STRING(50),
            allowNull: false,
            field: 'price_range'
        },
        avg_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        type: {
            type: DataTypes.ENUM('豪华酒店', '商务酒店', '度假酒店', '经济酒店', '公寓酒店', '精品酒店', '民宿', '其他'),
            allowNull: true
        },
        images: {
            type: DataTypes.JSON,
            allowNull: false
        },
        facilities: {
            type: DataTypes.JSON,
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
        modelName: 'Hotel',
        tableName: 'hotel',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });

    Hotel.associate = (models) => {
        Hotel.hasMany(models.Favorite, { foreignKey: 'hotel_id' });
        // 一个酒店可以出现在多个行程项中
        Hotel.hasMany(models.ItineraryItem, { foreignKey: 'hotel_id', as: 'itineraryItems' });
        // 一个酒店可以有多个预订记录
        Hotel.hasMany(models.Booking, { foreignKey: 'hotel_id' });
        // 添加与 Room 的关联
        Hotel.hasMany(models.Room, { foreignKey: 'hotel_id', as: 'rooms' });
        // 一个酒店可以有多个评论
        Hotel.hasMany(models.Review, { foreignKey: 'hotel_id', as: 'reviews' });
    };

    return Hotel;
}; 