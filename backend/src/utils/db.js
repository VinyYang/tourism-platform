/**
 * 数据库连接配置模块
 * 真实数据库连接版本
 */

const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

// 加载环境变量 - 明确指定.env文件路径
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// 从环境变量获取数据库配置
const {
    DB_HOST = 'localhost',
    DB_PORT = '3306',
    DB_NAME = '016_yhy',
    DB_USER = 'root',
    DB_PASSWORD = '1111',
    NODE_ENV = 'development'
} = process.env;

// 输出调试信息
console.log('数据库连接参数:', {
    host: DB_HOST,
    port: DB_PORT,
    database: DB_NAME,
    username: DB_USER,
    password: DB_PASSWORD ? '******' : undefined
});

// 创建Sequelize实例
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    host: DB_HOST,
    port: parseInt(DB_PORT, 10),
    dialect: 'mysql',
    timezone: '+08:00',
    logging: NODE_ENV === 'development' ? console.log : false,
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    define: {
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

/**
 * 测试数据库连接
 * @returns {Promise<boolean>} 连接成功返回true，连接失败返回false
 */
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('数据库连接成功');
        return true;
    } catch (error) {
        console.error('数据库连接失败:', error.message);
        return false;
    }
};

// 同步数据库模型
const syncModels = async () => {
    try {
        if (NODE_ENV === 'development') {
            await sequelize.sync({ alter: true });
            console.log('数据库模型同步完成');
        } else {
            console.log('生产环境不自动同步数据库模型');
        }
    } catch (error) {
        console.error('数据库模型同步失败:', error.message);
        throw error;
    }
};

// 导出
module.exports = {
    sequelize,
    testConnection,
    syncModels
}; 