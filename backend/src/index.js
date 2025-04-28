require('dotenv').config();
const app = require('./app');
const { testConnection, syncModels } = require('./utils/db');

const PORT = process.env.PORT || 3001;

// 启动服务器
const startServer = async () => {
    try {
        // 测试数据库连接
        const isConnected = await testConnection();
        if (!isConnected) {
            console.warn('数据库连接失败，将使用模拟数据');
        } else {
            // 同步数据库模型
            await syncModels();
        }

        // 启动服务器
        app.listen(PORT, () => {
            console.log(`服务器运行在 http://localhost:${PORT}`);
            console.log('数据库状态:', isConnected ? '已连接' : '未连接（使用模拟数据）');
        });
    } catch (error) {
        console.error('服务器启动失败:', error);
        process.exit(1);
    }
};

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('收到 SIGTERM 信号，准备关闭服务器');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('收到 SIGINT 信号，准备关闭服务器');
    process.exit(0);
});

// 启动服务器
startServer(); 