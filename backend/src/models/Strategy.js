const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class Strategy extends Model {}

    Strategy.init({
        strategy_id: {
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
        content: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        city: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        cover_image: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'cover_image'
        },
        tags: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        view_count: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: 'view_count'
        },
        like_count: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: 'like_count'
        },
        type: {
            type: DataTypes.ENUM('article', 'travel_note'),
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('draft', 'published'),
            allowNull: false,
            defaultValue: 'published'
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
        modelName: 'Strategy',
        tableName: 'Strategy',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });

    // 定义模型关联关系 - 移到模型初始化之后
    Strategy.associate = (models) => {
        // 一个攻略属于一个用户 (作者)
        Strategy.belongsTo(models.User, {
            foreignKey: 'user_id',
            targetKey: 'user_id',
            as: 'author'
        });
        // 一个攻略可以被多次收藏
        Strategy.hasMany(models.Favorite, { foreignKey: 'strategy_id' });
        // 一个攻略可以被多个用户点赞 (通过 StrategyLike 表)
        Strategy.belongsToMany(models.User, { 
            through: models.StrategyLike, 
            foreignKey: 'strategy_id',
            otherKey: 'user_id',
            as: 'likedByUsers' 
        });
        // 一个攻略可以有多个评论
        Strategy.hasMany(models.Review, { foreignKey: 'strategy_id', as: 'comments' });
        // 一个攻略可以被多个用户收藏 (通过 Favorite 表)
        // Strategy.belongsToMany(models.User, { through: models.Favorite, foreignKey: 'strategy_id', otherKey: 'user_id', as: 'favoritedByUsers' });
    };

    return Strategy;
}; 