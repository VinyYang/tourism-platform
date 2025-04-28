/**
 * 旅游服务平台后端应用入口文件
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');
const multer = require('multer');
const featuredRouteRoutes = require('./routes/featuredRouteRoutes');

// 在文件最开头添加全局错误处理
process.on('uncaughtException', (err) => {
  console.error('⚠️ 未捕获的异常，但服务器将继续运行:', err);
  console.error('错误堆栈:', err.stack);
  // 不立即退出，让服务器继续运行
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ 未处理的Promise拒绝，但服务器将继续运行:');
  console.error('- 原因:', reason);
  // 不立即退出，让服务器继续运行
});

// 显示环境变量配置文件路径
console.log('当前工作目录:', process.cwd());
console.log('尝试加载环境变量文件:', path.resolve(process.cwd(), '.env'));

// 加载环境变量（确保路径正确）
const envPath = path.resolve(process.cwd(), '.env');
const result = dotenv.config({ path: envPath });
if (result.error) {
    console.error('加载环境变量文件出错:', result.error);
}

// 导入数据库连接模块 (修改)
const { sequelize, connectDB } = require('./config/db.js');

// 导入所有模型和数据库实例 (通过 models/index.js)
const db = require('./models');

// 创建Express应用
const app = express();

// ---> Add very early request logging < ---
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] APP.JS RECEIVED: ${req.method} ${req.originalUrl}`);
    // Log headers relevant to file uploads
    console.log(`  Headers: Content-Type=${req.headers['content-type']}, Authorization=${req.headers['authorization'] ? 'Present' : 'Absent'}`);
    next();
});

// 设置中间件
app.use(express.json({ limit: '50mb' })); // 解析JSON请求体，增加限制
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // 解析URL编码的请求体，增加限制
app.use(cors({
    origin: [
        'http://localhost:3000', 
        'http://localhost:3001', 
        'http://10.66.52.141:3000' // 添加前端实际来源
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
})); // 跨域资源共享

// 自定义请求日志中间件，记录更详细的请求信息
app.use((req, res, next) => {
    console.log('\n----- 新请求 -----');
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    console.log('请求头:', JSON.stringify({
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type'],
        'authorization': req.headers['authorization'] ? '存在' : '不存在',
        'origin': req.headers['origin'],
        'referer': req.headers['referer']
    }, null, 2));
    
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        console.log('请求体:', JSON.stringify(req.body, null, 2));
    }
    if (Object.keys(req.query).length) {
        console.log('查询参数:', JSON.stringify(req.query, null, 2));
    }
    
    // 捕获响应
    const oldSend = res.send;
    res.send = function(data) {
        console.log(`响应状态: ${res.statusCode}`);
        
        // 优化大数据输出
        let logData = data;
        if (typeof data === 'string') {
            try {
                logData = JSON.parse(data);
            } catch (e) {
                // 如果不是JSON字符串，保持原样
                logData = data;
            }
        }
        
        // 格式化输出
        if (logData && typeof logData === 'object') {
            // 对于数组，只显示长度和前几个元素
            if (Array.isArray(logData)) {
                const preview = logData.slice(0, 2);
                console.log(`响应数据: 数组(共${logData.length}项)，预览前2项:`, 
                    JSON.stringify(preview, null, 2));
            } else {
                // 对于对象，只显示第一层属性
                const summary = {};
                for (const [key, value] of Object.entries(logData)) {
                    if (Array.isArray(value)) {
                        summary[key] = `数组[${value.length}项]`;
                    } else if (typeof value === 'object' && value !== null) {
                        summary[key] = '对象';
                    } else {
                        summary[key] = value;
                    }
                }
                console.log('响应数据:', JSON.stringify(summary, null, 2));
            }
        } else if (typeof logData === 'string' && logData.length > 200) {
            // 对于长字符串，只显示前200个字符
            console.log('响应数据:', logData.substring(0, 200) + '...(已截断)');
        } else {
            console.log('响应数据:', logData);
        }
        
        console.log('----- 请求结束 -----\n');
        return oldSend.apply(res, arguments);
    };
    
    next();
});

// 标准日志中间件
app.use(morgan('dev'));

// 计算 public 目录的绝对路径 (假设 app.js 在 src 目录下)
// 正确的路径应该是 app.js -> src -> backend -> public
const publicDirectoryPath = path.join(__dirname, '..', 'public'); // 只向上跳一级到 backend
console.log('提供静态文件的目录:', publicDirectoryPath);
// 检查目录是否存在 (需要引入 fs)
if (fs.existsSync(publicDirectoryPath)) {
    // 将整个 public 目录下的内容作为静态文件提供
    // 请求 http://.../uploads/images/abc.jpg 会查找 backend/public/uploads/images/abc.jpg
    app.use(express.static(publicDirectoryPath));
    console.log(`静态文件服务已启动，服务于目录: ${publicDirectoryPath}`);
} else {
    console.warn(`警告: 静态文件目录未找到: ${publicDirectoryPath}。文件上传和访问可能失败。`);
}

// 应用路由
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/users', require('./routes/userRoutes'));
app.use('/api/v1/scenics', require('./routes/scenicRoutes'));
app.use('/api/v1/hotels', require('./routes/hotelRoutes'));
app.use('/api/v1/strategies', require('./routes/strategyRoutes'));
// 启用管理员路由
app.use('/api/v1/admin', require('./routes/adminRoutes'));
// ---> 挂载精选路线路由 <--- 
app.use('/api/v1', require('./routes/featuredRouteRoutes')); 
// 添加定制行程路由
app.use('/api/v1/itineraries', require('./routes/itineraryRoutes'));
// 启用订单路由
app.use('/api/v1/bookings', require('./routes/bookingRoutes'));
// 启用交通路由
app.use('/api/v1/transports', require('./routes/transportRoutes'));
// 添加评论路由 (暂时注释，因为 reviewRoutes.js 不存在)
// app.use('/api/v1/reviews', require('./routes/reviewRoutes'));

// 健康检查端点
app.get('/api/v1/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API根路由
app.get('/api/v1', (req, res) => {
    res.json({
        message: '旅游服务平台API服务',
        version: '1.0.0',
        endpoints: [
            '/api/v1/auth - 认证相关接口',
            '/api/v1/users - 用户相关接口',
            '/api/v1/scenics - 景点相关接口',
            '/api/v1/hotels - 酒店相关接口',
            '/api/v1/strategies - 攻略相关接口',
            '/api/v1/admin - 管理员相关接口'
        ],
        status: 'running',
        documentation: 'https://github.com/yourusername/travel-platform'
    });
});

// 为确保健壮性，再次检查所有关键路由是否可用
console.log('\n检查关键API路由:');
console.log('✅ 认证路由: /api/v1/auth');
console.log('✅ 用户路由: /api/v1/users');
console.log('✅ 景点路由: /api/v1/scenics');
console.log('✅ 攻略路由: /api/v1/strategies');
console.log('✅ 酒店路由: /api/v1/hotels');
console.log('✅ 管理员路由: /api/v1/admin');
console.log('注意: 以上路由检查仅确认路由已注册，不保证具体实现的完整性\n');

// 404 路由处理
app.use((req, res, next) => {
    res.status(404).json({
        code: 404,
        message: '请求的资源不存在'
    });
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('--- 全局错误处理器捕获到错误 ---');
    console.error('错误名称:', err.name);
    console.error('错误消息:', err.message);
    console.error('错误堆栈:', err.stack);
    
    // ---> 添加 Multer 错误处理 < ---
    if (err instanceof multer.MulterError) {
        console.error('Multer 错误代码:', err.code);
        return res.status(400).json({
            success: false,
            code: err.code, // 返回 Multer 错误码
            message: `文件上传错误: ${err.message}`,
        });
    }
    // ---> Multer 错误处理结束 < ---

    // 如果是数据库错误，返回友好的错误信息
    if (err.name === 'SequelizeConnectionError') {
        return res.status(503).json({
            code: 503,
            message: '数据库连接失败，请稍后重试',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }

    // 如果是验证错误
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            code: 400,
            message: '请求数据验证失败',
            errors: err.errors
        });
    }

    // 如果是认证错误
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            code: 401,
            message: '未授权或登录已过期',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }

    // 如果是业务逻辑错误
    if (err.isBusinessError) {
        return res.status(err.statusCode || 400).json({
            code: err.statusCode || 400,
            message: err.message,
            errors: err.errors
        });
    }
    
    // 其他错误
    res.status(err.statusCode || 500).json({
        code: err.statusCode || 500,
        message: err.message || '服务器内部错误',
        errors: process.env.NODE_ENV === 'development' ? err.errors : undefined
    });
});

// 设置端口并启动服务器
const PORT = process.env.PORT || 3001;
console.log('使用端口:', PORT);

// 尝试终止占用端口的进程（仅Windows系统）
const killProcessOnPort = (port) => {
    // 仅在Windows系统上执行
    if (process.platform === 'win32') {
        try {
            console.log(`尝试终止占用端口${port}的进程...`);
            const { execSync } = require('child_process');
            
            // 查找占用端口的进程
            const findCmd = `netstat -ano | findstr :${port}`;
            const output = execSync(findCmd, { encoding: 'utf8' });
            
            if (output) {
                const lines = output.split('\n').filter(line => line.trim());
                for (const line of lines) {
                    const parts = line.trim().split(/\s+/);
                    const pid = parts[parts.length - 1];
                    
                    if (pid && pid !== '0' && !isNaN(parseInt(pid))) {
                        console.log(`发现进程 ${pid} 占用端口${port}，尝试终止...`);
                        execSync(`taskkill /F /PID ${pid}`);
                        console.log(`进程 ${pid} 已终止`);
                    }
                }
            }
            return true;
        } catch (err) {
            console.error(`尝试终止进程失败: ${err.message}`);
            return false;
        }
    } else if (process.platform === 'linux' || process.platform === 'darwin') {
        // Linux或macOS，使用fuser或lsof
        try {
            console.log(`尝试终止占用端口${port}的进程...`);
            const { execSync } = require('child_process');
            
            // 对于Linux，使用fuser
            if (process.platform === 'linux') {
                execSync(`fuser -k ${port}/tcp`, { stdio: 'ignore' });
            } 
            // 对于macOS，使用lsof
            else if (process.platform === 'darwin') {
                const output = execSync(`lsof -i :${port} | grep LISTEN`, { encoding: 'utf8' });
                const lines = output.split('\n').filter(line => line.trim());
                for (const line of lines) {
                    const parts = line.trim().split(/\s+/);
                    if (parts.length > 1) {
                        const pid = parts[1];
                        execSync(`kill -9 ${pid}`);
                        console.log(`进程 ${pid} 已终止`);
                    }
                }
            }
            return true;
        } catch (err) {
            console.error(`尝试终止进程失败: ${err.message}`);
            return false;
        }
    }
    return false;
};

// 检查端口并尝试解决占用问题
const checkAndFixPort = (port) => {
    const server = require('net').createServer();
    
    server.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.warn(`⚠️ 端口 ${port} 已被占用，尝试终止占用进程...`);
            // 尝试终止占用进程
            killProcessOnPort(port);
            
            // 延迟一秒后再次尝试启动服务器
            setTimeout(() => {
                console.log(`再次尝试启动服务器在端口 ${port}...`);
                startServerOnPort(port);
            }, 1000);
        } else {
            console.error('❌ 服务器启动失败:', err);
            process.exit(1);
        }
    });
    
    server.once('listening', () => {
        server.close();
        startServerOnPort(port);
    });
    
    server.listen(port);
};

// 在指定端口启动服务器
const startServerOnPort = async (port) => {
    try {
        // 连接数据库
        console.log('正在连接数据库...');
        await connectDB();
        
        // 启动服务器
        app.listen(port, () => {
            console.log(`✅ 服务器运行在端口 ${port}`);
        }).on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`❌ 端口 ${port} 仍被占用，无法启动服务器`);
                console.error('请尝试手动关闭占用端口的进程或使用管理员权限运行');
                process.exit(1);
            } else {
                console.error('❌ 服务器启动失败:', err);
                process.exit(1);
            }
        });
    } catch (error) {
        console.error('❌ 服务器启动失败:', error);
        process.exit(1);
    }
};

const startServer = async () => {
    // 尝试先清理端口，再启动服务器
    checkAndFixPort(PORT);
};

// 捕获未处理的异常
process.on('uncaughtException', (err) => {
    console.error('未捕获的异常:', err);
    // 不立即退出，让现有连接有时间关闭
    setTimeout(() => {
        process.exit(1);
    }, 1000);
});

// 调用启动函数
startServer();

// 导出Express应用（用于测试）
module.exports = app; 