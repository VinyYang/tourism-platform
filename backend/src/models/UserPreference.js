const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class UserPreference extends Model {}

    UserPreference.init({
        preference_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
        },
        interest: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        preferred_cities: {
            type: DataTypes.JSON,
            allowNull: false,
            field: 'preferred_cities'
        },
        budget_range: {
            type: DataTypes.STRING(50),
            allowNull: false,
            field: 'budget_range'
        },
        travel_style: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: 'travel_style'
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
        modelName: 'UserPreference',
        tableName: 'UserPreference',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
        ]
    });

    UserPreference.associate = (models) => {
        UserPreference.belongsTo(models.User, { foreignKey: 'user_id' });
    };

    return UserPreference;
}; 