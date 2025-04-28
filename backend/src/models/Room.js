const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class Room extends Model {}

    Room.init({
        room_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        hotel_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Hotel', key: 'hotel_id' }
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        beds: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        size: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        max_occupancy: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        images: {
            type: DataTypes.JSON,
            allowNull: true
        },
        facilities: {
            type: DataTypes.JSON,
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
        sequelize,
        modelName: 'Room',
        tableName: 'room',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        // underscored: true // 如果需要
    });

    Room.associate = (models) => {
        // 一个房间属于一个酒店
        Room.belongsTo(models.Hotel, { foreignKey: 'hotel_id' });
    };

    return Room;
}; 