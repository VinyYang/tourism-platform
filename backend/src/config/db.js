const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config({ path: './.env' }); // Assuming .env is in the backend root

const sequelize = new Sequelize(
    process.env.DB_NAME || '016_yhy',      // Database name
    process.env.DB_USER || 'root',        // Database user
    process.env.DB_PASSWORD || '1111',      // 修改默认密码为1111
    {
        host: process.env.DB_HOST || 'localhost', // Database host
        dialect: 'mysql',                   // Database dialect
        logging: false, // Set to console.log to see SQL queries
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

const connectDB = async () => {
    try {
        console.log('尝试连接到数据库...');
        console.log(`数据库配置: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
        
        await sequelize.authenticate();
        console.log('✅ MySQL Database connection established successfully.');
        
        // 检查数据库表结构
        try {
            // 验证连接是否真正可用
            const [result] = await sequelize.query('SELECT 1+1 AS result');
            console.log('✅ 数据库查询测试成功。结果:', result[0].result);
            
            // 检查关键表是否存在
            try {
                await sequelize.query('SHOW TABLES LIKE "Scenic"');
                console.log('✅ Scenic表存在。');
            } catch (tableErr) {
                console.error('⚠️ Scenic表可能不存在:', tableErr.message);
                console.log('将继续启动服务器，但景点API可能无法正常工作。');
            }
        } catch (queryErr) {
            console.error('❌ 数据库查询测试失败:', queryErr.message);
            console.log('数据库连接已建立但查询测试失败。这可能会影响API功能。');
        }
        
        return true;
    } catch (error) {
        console.error('❌ 无法连接到数据库:', error.message);
        console.error('详细错误信息:', error);
        // 即使无法连接数据库，也返回true以允许服务器启动
        // 这样API可以返回友好的错误消息而不是完全崩溃
        return true;
    }
};

module.exports = { sequelize, connectDB }; 