const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class ItineraryItem extends Model {}

    ItineraryItem.init({
        item_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        itinerary_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        day_number: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'day_number'
        },
        item_type: {
            type: DataTypes.ENUM('scenic', 'hotel', 'transport', 'activity'),
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
        transport_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        image: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        location: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        start_time: {
            type: DataTypes.TIME,
            allowNull: true,
            field: 'start_time'
        },
        end_time: {
            type: DataTypes.TIME,
            allowNull: true,
            field: 'end_time'
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        order_number: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'order_number'
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
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
        modelName: 'ItineraryItem',
        tableName: 'itineraryitem',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });

    ItineraryItem.associate = (models) => {
        ItineraryItem.belongsTo(models.CustomizedItinerary, { foreignKey: 'itinerary_id' });
        ItineraryItem.belongsTo(models.Scenic, { foreignKey: 'scenic_id' });
        ItineraryItem.belongsTo(models.Hotel, { foreignKey: 'hotel_id' });
        ItineraryItem.belongsTo(models.Transport, { foreignKey: 'transport_id' });
    };

    return ItineraryItem;
}; 