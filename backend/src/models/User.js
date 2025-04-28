/**
 * User模型 - 定义用户数据结构
 */

const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcryptjs');
// const { sequelize } = require('../utils/db'); // 移除旧的导入

module.exports = (sequelize) => { // 导出函数，接收 sequelize 实例
    /**
     * 用户模型定义，对应数据库中的User表
     */
    class User extends Model {
        // 检查密码是否正确
        async checkPassword(password) {
            // 添加日志：打印传入 checkPassword 的明文密码和实例的哈希值
            console.log('>>> [User.model] Inside checkPassword method.');
            console.log('>>> [User.model] Plain password received:', password);
            console.log('>>> [User.model] Hash to compare against:', this.password);
            return await bcrypt.compare(password, this.password);
        }
    }

    User.init({
        // 用户ID
        user_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        // 用户名
        username: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: {
                    msg: '用户名不能为空'
                },
                len: {
                    args: [2, 50],
                    msg: '用户名长度应为2-50个字符'
                }
            }
        },
        // 密码（加密存储）
        password: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: '密码不能为空'
                }
            }
        },
        // 电子邮箱
        email: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: {
                    msg: '请输入有效的电子邮箱地址'
                }
            }
        },
        // 手机号码
        phone: {
            type: DataTypes.STRING(20),
            allowNull: true
        },
        // 用户角色
        role: {
            type: DataTypes.ENUM('user', 'advisor', 'admin'),
            allowNull: false,
            defaultValue: 'user'
        },
        // 新增：用户状态 (active: 正常, muted: 禁言)
        status: {
            type: DataTypes.ENUM('active', 'muted'),
            allowNull: false,
            defaultValue: 'active'
        },
        // 头像URL
        avatar: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        // 创建时间
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: 'created_at' // 保持与 schema.sql 一致
        },
        // 更新时间
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: 'updated_at' // 保持与 schema.sql 一致
        },
        // --- 新增文化基因标签字段 ---
        cultural_dna_tags: {
            type: DataTypes.TEXT,
            allowNull: true, // 允许为空，用户可能未进行测试
            comment: '存储用户的文化基因标签，例如 timeAxis:ancient,region:jiangnan,secondaryThemes:literature_art'
        }
        // --- 结束新增字段 ---
    }, {
        sequelize, // 使用传入的 sequelize 实例
        modelName: 'User',
        tableName: 'User', // 明确表名与数据库匹配
        timestamps: true,
        createdAt: 'created_at', // 确保与数据库字段匹配
        updatedAt: 'updated_at', // 确保与数据库字段匹配
        // underscored: true, // 移除或确认是否需要，schema 中未使用下划线命名法
        hooks: {
            // 保存密码前进行加密
            beforeCreate: async (user) => {
                if (user.password) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            },
            beforeUpdate: async (user) => {
                if (user.changed('password')) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            }
        }
    });

    // 定义模型关联关系 - 移到模型初始化之后
    User.associate = (models) => {
        User.hasMany(models.Strategy, { foreignKey: 'user_id', as: 'strategies' });
        User.hasMany(models.Favorite, { foreignKey: 'user_id', as: 'favorites' });
        User.hasOne(models.UserPreference, { foreignKey: 'user_id', as: 'preference' });
        User.hasMany(models.CustomizedItinerary, { foreignKey: 'user_id', as: 'itineraries' });
        User.hasMany(models.Booking, { foreignKey: 'user_id', as: 'bookings' });
        User.belongsToMany(models.Strategy, { 
            through: models.StrategyLike, 
            foreignKey: 'user_id',
            otherKey: 'strategy_id',
            as: 'likedStrategies' 
        });
        // User.hasMany(models.Review, { foreignKey: 'user_id', as: 'reviews' });
        // User.belongsToMany(models.Strategy, { through: models.Favorite, foreignKey: 'user_id', otherKey: 'strategy_id', as: 'favoriteStrategies' });
        // User.belongsToMany(models.Scenic, { through: models.Favorite, foreignKey: 'user_id', otherKey: 'scenic_id', as: 'favoriteScenics' });
        // User.belongsToMany(models.Hotel, { through: models.Favorite, foreignKey: 'user_id', otherKey: 'hotel_id', as: 'favoriteHotels' });
    };

    return User; // 返回定义好的模型
}; 