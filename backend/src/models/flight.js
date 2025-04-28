const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class Flight extends Model {}

    Flight.init({
        flight_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        flight_no: {
            type: DataTypes.STRING(20),
            allowNull: false,
        },
        airline: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        from_city: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        to_city: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        from_airport: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        to_airport: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        from_terminal: {
            type: DataTypes.STRING(10),
            allowNull: true,
        },
        to_terminal: {
            type: DataTypes.STRING(10),
            allowNull: true,
        },
        departure_time: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        arrival_time: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        discount: {
            type: DataTypes.FLOAT,
            allowNull: true,
        },
        tax: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
        punctuality_rate: {
            type: DataTypes.FLOAT,
            allowNull: true,
        },
        duration: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        stops: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        transfer_cities: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'JSON格式的中转城市列表',
        },
        aircraft_type: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        }
    }, {
        sequelize,
        modelName: 'Flight',
        tableName: 'Flight',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });

    Flight.associate = (models) => {
        Flight.hasMany(models.Booking, { foreignKey: 'flight_id', as: 'bookings' });
    };

    return Flight;
}; 