/**
 * 身份验证控制器
 * 处理用户注册和登录等身份验证相关功能
 * 真实数据库和JWT实现版本
 */

const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// 导入 sequelize 实例
const { sequelize } = require('../config/db.js');
// 导入并初始化 User 模型
const User = require('../models/User')(sequelize);

/**
 * 生成JWT token
 * @param {Object} userData - 用户数据
 * @returns {string} JWT token
 */
const generateToken = (userData) => {
    return jwt.sign(userData, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

/**
 * 用户注册
 * @route POST /api/v1/auth/register
 * @access 公开
 */
exports.register = async (req, res) => {
    try {
        // 验证请求数据
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                code: 400,
                message: '请求数据验证失败',
                errors: errors.array().map(error => error.msg)
            });
        }

        const { username, email, password } = req.body;

        // 检查用户名是否已存在
        const existingUsername = await User.findOne({ where: { username } });
        if (existingUsername) {
            return res.status(400).json({
                code: 400,
                message: '用户名已存在'
            });
        }

        // 检查邮箱是否已存在
        const existingEmail = await User.findOne({ where: { email } });
        if (existingEmail) {
            return res.status(400).json({
                code: 400,
                message: '该邮箱已被注册'
            });
        }

        // 创建新用户
        const newUser = await User.create({
            username,
            email,
            password, // 密码会在模型的beforeCreate钩子中自动加密
            role: 'user', // 默认角色为普通用户
            avatar: `https://placehold.co/150?text=${username}`,
        });

        // 创建并返回JWT令牌
        const token = generateToken({
            id: newUser.user_id,
            role: newUser.role
        });

        res.status(201).json({
            token,
            user: {
                id: newUser.user_id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role,
                avatar: newUser.avatar
            }
        });
    } catch (error) {
        console.error('注册错误:', error);
        res.status(500).json({
            code: 500,
            message: '服务器错误',
            errors: [error.message]
        });
    }
};

/**
 * 用户登录
 * @route POST /api/v1/auth/login
 * @access 公开
 */
exports.login = async (req, res) => {
    try {
        // 验证请求数据
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                code: 400,
                message: '请求数据验证失败',
                errors: errors.array().map(error => error.msg)
            });
        }

        const { username, password } = req.body;

        // 查找用户
        const user = await User.findOne({ where: { username } });
        if (!user) {
            return res.status(401).json({
                code: 401,
                message: '用户名或密码错误'
            });
        }

        // 验证密码
        // 添加日志：打印待比较的明文密码和哈希值
        console.log('>>> [authController] Checking password for user:', user.username);
        console.log('>>> [authController] Input password:', password);
        console.log('>>> [authController] Stored hash:', user.password);
        const isPasswordMatch = await user.checkPassword(password);
        if (!isPasswordMatch) {
            console.log('>>> [authController] Password check failed.'); // 添加失败日志
            return res.status(401).json({
                code: 401,
                message: '用户名或密码错误'
            });
        }

        // 创建并返回JWT令牌
        const token = generateToken({
            id: user.user_id,
            role: user.role
        });

        res.status(200).json({
            token,
            user: {
                id: user.user_id,
                username: user.username,
                email: user.email,
                role: user.role,
                avatar: user.avatar
            }
        });
    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({
            code: 500,
            message: '服务器错误',
            errors: [error.message]
        });
    }
};

/**
 * 获取当前登录用户信息
 * @route GET /api/v1/auth/me
 * @access 私有
 */
exports.getMe = async (req, res) => {
    try {
        // 从请求中获取用户ID
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                code: 401,
                message: '未授权'
            });
        }

        // 查找用户
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                code: 404,
                message: '用户不存在'
            });
        }

        res.status(200).json({
            id: user.user_id,
            username: user.username,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            createdAt: user.created_at
        });
    } catch (error) {
        console.error('获取用户信息错误:', error);
        res.status(500).json({
            code: 500,
            message: '服务器错误',
            errors: [error.message]
        });
    }
}; 