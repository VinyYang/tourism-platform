/**
 * 身份验证路由
 * 处理用户注册、登录和获取用户信息等身份验证相关路由
 */

const express = require('express');
const { body } = require('express-validator');
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const jwt = require('jsonwebtoken'); // 引入 jwt
const { sequelize } = require('../config/db.js'); // 引入 sequelize
const User = require('../models/User')(sequelize); // 引入 User 模型

const router = express.Router();

/**
 * 用户注册路由
 * @route POST /api/v1/auth/register
 * @access 公开
 */
router.post(
    '/register',
    [
        // 用户名验证
        body('username')
            .notEmpty().withMessage('用户名不能为空')
            .isLength({ min: 2, max: 50 }).withMessage('用户名长度应为2-50个字符'),
        
        // 邮箱验证
        body('email')
            .notEmpty().withMessage('邮箱不能为空')
            .isEmail().withMessage('请输入有效的电子邮箱地址'),
        
        // 密码验证
        body('password')
            .notEmpty().withMessage('密码不能为空')
            .isLength({ min: 6 }).withMessage('密码长度至少为6个字符'),
        
        // 手机号验证（可选）
        body('phone')
            .optional()
            .isMobilePhone('zh-CN').withMessage('请输入有效的手机号码')
    ],
    register
);

/**
 * 用户登录路由
 * @route POST /api/v1/auth/login
 * @access 公开
 */
router.post(
    '/login',
    [
        // 用户名验证
        body('username')
            .notEmpty().withMessage('用户名不能为空'),
        
        // 密码验证
        body('password')
            .notEmpty().withMessage('密码不能为空')
    ],
    login
);

/**
 * 获取当前登录用户信息路由
 * @route GET /api/v1/auth/me
 * @access 私有
 */
router.get('/me', protect, getMe);

/**
 * 验证token有效性
 * @route GET /api/v1/auth/validate-token
 * @access 公开 (验证请求头中的 Token)
 */
router.get('/validate-token', async (req, res) => { // 移除 protect 中间件，添加 async
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({
            valid: false,
            message: '未提供 Token'
        });
    }

    try {
        // 验证令牌
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 查找用户以确认用户存在且获取最新信息 (可选但推荐)
        const user = await User.findByPk(decoded.id, {
            attributes: ['user_id', 'role'] // 只获取必要信息
        });

        if (!user) {
             return res.status(401).json({
                valid: false,
                message: 'Token 对应的用户不存在'
            });
        }

        // Token 有效且用户存在
        res.status(200).json({
            valid: true,
            user: { // 返回与 protect 中间件一致的用户信息结构
                id: user.user_id,
                role: user.role
            }
        });
    } catch (error) {
        // JWT验证失败 (例如过期或签名无效)
        res.status(401).json({
            valid: false,
            message: 'Token 无效或已过期'
        });
    }
});

/**
 * 刷新token
 * @route POST /api/v1/auth/refresh-token
 * @access 公开 (但需要旧token)
 */
router.post('/refresh-token', async (req, res) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: '未提供 Token'
        });
    }

    try {
        // 尝试验证token，即使已过期
        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            ignoreExpiration: true // 忽略过期时间，允许刷新已过期的token
        });
        
        // 查找用户确认存在
        const user = await User.findByPk(decoded.id, {
            attributes: ['user_id', 'username', 'email', 'role', 'avatar'] 
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Token 对应的用户不存在'
            });
        }

        // 生成新的token
        const newToken = jwt.sign(
            { id: user.user_id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        // 返回新token和用户信息
        res.status(200).json({
            success: true,
            message: 'Token 刷新成功',
            token: newToken,
            user: {
                id: user.user_id,
                username: user.username,
                email: user.email,
                role: user.role,
                avatar: user.avatar
            }
        });
    } catch (error) {
        console.error('刷新token出错:', error);
        // 如果解析token都失败，则无法刷新
        res.status(401).json({
            success: false,
            message: 'Token 无效，无法刷新'
        });
    }
});

module.exports = router; 