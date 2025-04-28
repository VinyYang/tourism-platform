/**
 * 认证中间件 - 用于保护需要身份验证的路由
 * 真实JWT实现版本
 */

const jwt = require('jsonwebtoken');
// 导入 sequelize 实例
const { sequelize } = require('../config/db.js');
// 导入并初始化 User 模型
const User = require('../models/User')(sequelize);

/**
 * 保护路由中间件 - 要求用户必须登录
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
exports.protect = async (req, res, next) => {
    try {
        // 从请求头中获取令牌
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        // 检查令牌是否存在
        if (!token) {
            return res.status(401).json({
                code: 401,
                message: '未授权，请登录'
            });
        }

        try {
            // 验证令牌
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // 从数据库获取用户
            const user = await User.findByPk(decoded.id);
            
            if (!user) {
                return res.status(401).json({
                    code: 401,
                    message: '令牌对应的用户不存在'
                });
            }

            // 将用户信息添加到请求对象
            req.user = {
                id: user.user_id,
                user_id: user.user_id,
                role: user.role
            };
            // 添加日志记录
            console.log('Protect middleware: User authenticated, req.user.id:', req.user.id);
            
            next();
        } catch (error) {
            // JWT验证失败
            return res.status(401).json({
                code: 401,
                message: '令牌无效或已过期'
            });
        }
    } catch (error) {
        console.error('认证中间件错误:', error);
        res.status(500).json({
            code: 500,
            message: '服务器错误'
        });
    }
};

/**
 * 角色授权中间件 - 限制特定角色的用户访问
 * @param {...string} roles - 允许访问的角色列表
 * @returns {Function} Express中间件函数
 */
exports.authorize = (...roles) => {
    return (req, res, next) => {
        // 检查用户是否存在角色
        if (!req.user || !req.user.role) {
            return res.status(403).json({
                code: 403,
                message: '无权访问此资源'
            });
        }

        // 检查用户角色是否在允许的角色列表中
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                code: 403,
                message: `用户角色 ${req.user.role} 无权访问此资源`
            });
        }

        next();
    };
}; 