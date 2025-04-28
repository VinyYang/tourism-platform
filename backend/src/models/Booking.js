const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class Booking extends Model {}

    Booking.init({
        booking_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        scenic_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        hotel_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        room_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        flight_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        booking_type: {
            type: DataTypes.ENUM('scenic', 'hotel', 'itinerary', 'flight'),
            allowNull: false,
            field: 'booking_type'
        },
        start_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: 'start_date'
        },
        end_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: 'end_date'
        },
        num_people: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'num_people'
        },
        total_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            field: 'total_price'
        },
        passenger_info: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'passenger_info',
            comment: 'JSON格式的乘客信息，包含姓名、证件类型、证件号等'
        },
        status: {
            type: DataTypes.ENUM('pending', 'processing', 'confirmed', 'completed', 'cancelled', 'refunding', 'refunded'),
            allowNull: false,
            defaultValue: 'pending'
        },
        payment_status: {
            type: DataTypes.ENUM('unpaid', 'paid', 'refunded', 'refund_pending'),
            allowNull: false,
            defaultValue: 'unpaid',
            field: 'payment_status'
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
        modelName: 'Booking',
        tableName: 'Booking',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });

    Booking.associate = (models) => {
        Booking.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
        Booking.belongsTo(models.Scenic, { foreignKey: 'scenic_id', as: 'Scenic' });
        Booking.belongsTo(models.Hotel, { foreignKey: 'hotel_id', as: 'Hotel' });
        Booking.belongsTo(models.Room, { foreignKey: 'room_id', as: 'Room' });
        if (models.Flight) {
            Booking.belongsTo(models.Flight, { foreignKey: 'flight_id', as: 'Flight' });
        }
    };

    return Booking;
}; 