const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class CustomizedItinerary extends Model {}

    CustomizedItinerary.init({
        itinerary_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        start_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: 'start_date'
        },
        end_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: 'end_date'
        },
        city: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        estimated_budget: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            field: 'estimated_budget'
        },
        is_public: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: 'is_public'
        },
        status: {
            type: DataTypes.ENUM('draft', 'published'),
            allowNull: false,
            defaultValue: 'draft',
            field: 'status'
        },
        custom_url: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'custom_url',
            unique: true
        },
        cover: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'cover'
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
        modelName: 'CustomizedItinerary',
        tableName: 'CustomizedItinerary',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });

    CustomizedItinerary.associate = (models) => {
        CustomizedItinerary.belongsTo(models.User, { foreignKey: 'user_id' });
        CustomizedItinerary.hasMany(models.ItineraryItem, { foreignKey: 'itinerary_id', as: 'items' });
    };

    return CustomizedItinerary;
}; 