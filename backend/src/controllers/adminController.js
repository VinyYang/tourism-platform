/**
 * 管理员控制器 - 处理管理员相关的API请求
 */

const { Op } = require('sequelize');
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs'); // 引入 fs 模块用于检查和创建目录
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/db.js');

// 正确的导入方式：通过 models/index.js 获取所有已关联的模型
const db = require('../models'); 
const { User, Scenic, Hotel, Strategy, Booking, Review } = db; // 从 db 对象中解构出需要的模型
// Sequelize 实例不需要单独导入了，db 对象中包含了 db.sequelize
// const { sequelize } = require('../config/db.js');
// 移除旧的、错误的模型导入
// const User = require('../models/User')(sequelize);
// const Scenic = require('../models/Scenic')(sequelize);
// const Hotel = require('../models/Hotel')(sequelize);
// const Strategy = require('../models/Strategy')(sequelize);
// const Booking = require('../models/Booking')(sequelize);
// const Review = require('../models/Review')(sequelize);

/**
 * 安全解析JSON字符串的辅助函数
 * 如果是URL或解析失败，则返回包含原始字符串的数组
 * @param {string} str - 需要解析的字符串
 * @returns {Array} - 解析结果或包含原始字符串的数组
 */
const safeJsonParse = (str) => {
    if (!str) return [];
    
    // 如果是URL字符串或普通字符串，直接包装成数组返回
    if (typeof str === 'string' && (str.startsWith('http') || !str.startsWith('['))) {
        return [str];
    }
    
    try {
        return JSON.parse(str);
    } catch (err) {
        console.warn('JSON解析失败，使用原始字符串:', str);
        // 如果解析失败，可能是逗号分隔的字符串
        if (typeof str === 'string' && str.includes(',')) {
            return str.split(',').map(item => item.trim()).filter(Boolean);
        }
        return [str]; // 解析失败时返回包含原始字符串的数组
    }
};

/**
 * 获取仪表盘统计数据
 * @route GET /api/v1/admin/dashboard
 * @access 仅限管理员
 */
exports.getDashboardStats = async (req, res) => {
    try {
        // 用户统计
        const totalUsers = await User.count();
        const newUsers = await User.count({
            where: {
                created_at: {
                    [Op.gte]: new Date(new Date().setDate(new Date().getDate() - 30))
                }
            }
        });

        // 景点统计
        const totalScenics = await Scenic.count();

        // 酒店统计
        const totalHotels = await Hotel.count();

        // 订单统计
        const totalOrders = await Booking.count();
        const pendingOrders = await Booking.count({
            where: { status: 'pending' }
        });

        // 攻略统计
        const totalStrategies = await Strategy.count();

        // 收入统计（最近30天）
        const recentOrders = await Booking.findAll({
            where: {
                status: 'completed',
                created_at: {
                    [Op.gte]: new Date(new Date().setDate(new Date().getDate() - 30))
                }
            },
            attributes: ['total_price']
        });
        const recentRevenue = recentOrders.reduce((sum, order) => sum + order.total_price, 0);

        res.status(200).json({
            success: true,
            data: {
                users: {
                    total: totalUsers,
                    new: newUsers
                },
                scenics: {
                    total: totalScenics
                },
                hotels: {
                    total: totalHotels
                },
                orders: {
                    total: totalOrders,
                    pending: pendingOrders
                },
                strategies: {
                    total: totalStrategies
                },
                revenue: {
                    recent: recentRevenue
                }
            }
        });
    } catch (error) {
        console.error('获取仪表盘统计数据失败:', error);
        res.status(500).json({
            success: false,
            message: '获取仪表盘统计数据失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * 获取用户列表
 * @route GET /api/v1/admin/users
 * @access 仅限管理员
 */
exports.getUsers = async (req, res) => {
    try {
        const { 
            page = 1, 
            pageSize = 10, 
            keyword, 
            role, 
            sortBy = 'created_at', 
            sortOrder = 'desc'
        } = req.query;

        // 构建查询条件
        const whereClause = {};
        if (keyword) {
            whereClause[Op.or] = [
                { username: { [Op.like]: `%${keyword}%` } },
                { email: { [Op.like]: `%${keyword}%` } }
            ];
        }
        if (role) {
            whereClause.role = role;
        }

        // 构建排序条件
        const order = [[sortBy, sortOrder.toUpperCase()]];

        // 分页
        const offset = (page - 1) * pageSize;
        const limit = parseInt(pageSize, 10);

        // 查询用户
        const { count, rows } = await User.findAndCountAll({
            where: whereClause,
            order,
            offset,
            limit,
            attributes: { exclude: ['password'] }
        });

        res.status(200).json({
            success: true,
            data: rows,
            meta: {
                total: count,
                page: parseInt(page, 10),
                pageSize: limit
            }
        });
    } catch (error) {
        console.error('获取用户列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取用户列表失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * 创建用户
 * @route POST /api/v1/admin/users
 * @access 仅限管理员
 */
exports.createUser = async (req, res) => {
    try {
        // 验证请求数据
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '请求数据验证失败',
                errors: errors.array()
            });
        }

        const { username, email, password, role } = req.body;

        // 检查用户名是否已存在
        const existingUsername = await User.findOne({ where: { username } });
        if (existingUsername) {
            return res.status(400).json({
                success: false,
                message: '用户名已存在'
            });
        }

        // 检查邮箱是否已存在
        const existingEmail = await User.findOne({ where: { email } });
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: '该邮箱已被注册'
            });
        }

        // 创建新用户
        const newUser = await User.create({
            username,
            email,
            password,
            role: role || 'user',
            avatar: `https://placehold.co/150?text=${username}`
        });

        res.status(201).json({
            success: true,
            data: {
                id: newUser.user_id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role,
                avatar: newUser.avatar,
                createdAt: newUser.created_at
            }
        });
    } catch (error) {
        console.error('创建用户失败:', error);
        res.status(500).json({
            success: false,
            message: '创建用户失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * 根据ID获取用户
 * @route GET /api/v1/admin/users/:user_id
 * @access 仅限管理员
 */
exports.getUserById = async (req, res) => {
    try {
        const { user_id } = req.params; // 从 req.params.user_id 获取
        
        const user = await User.findByPk(user_id, { // 使用 user_id 查询
            attributes: { exclude: ['password'] }
        });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        
        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('获取用户详情失败:', error);
        res.status(500).json({
            success: false,
            message: '获取用户详情失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * 更新用户信息
 * @route PUT /api/v1/admin/users/:user_id
 * @access 仅限管理员
 */
exports.updateUser = async (req, res) => {
    try {
        // 验证请求数据
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '请求数据验证失败',
                errors: errors.array()
            });
        }

        const { user_id } = req.params;
        // 从请求体获取 status
        const { username, email, role, avatar, status } = req.body; 

        const user = await User.findByPk(user_id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 更新用户信息
        user.username = username || user.username;
        user.email = email || user.email;
        if (role && ['user', 'admin', 'advisor'].includes(role)) { // 验证 role 值
             user.role = role;
        }
        user.avatar = avatar !== undefined ? avatar : user.avatar;
        if (status && ['active', 'muted'].includes(status)) { // 验证 status 值
             user.status = status;
        }

        await user.save();

        res.status(200).json({
            success: true,
            data: {
                id: user.user_id,
                username: user.username,
                email: user.email,
                role: user.role,
                status: user.status, // 返回 status
                avatar: user.avatar,
                updatedAt: user.updated_at
            }
        });
    } catch (error) {
        console.error('更新用户失败:', error);
        res.status(500).json({
            success: false,
            message: '更新用户失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * 删除用户
 * @route DELETE /api/v1/admin/users/:user_id
 * @access 仅限管理员
 */
exports.deleteUser = async (req, res) => {
    try {
        const { user_id } = req.params; // 从 req.params.user_id 获取
        
        const user = await User.findByPk(user_id); // 使用 user_id 查询
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        
        // 防止删除最后一个管理员账户
        if (user.role === 'admin') {
            const adminCount = await User.count({ where: { role: 'admin' } });
            if (adminCount <= 1) {
                return res.status(400).json({
                    success: false,
                    message: '无法删除最后一个管理员账户'
                });
            }
        }
        
        await user.destroy();
        
        res.status(200).json({
            success: true,
            message: '用户已成功删除'
        });
    } catch (error) {
        console.error('删除用户失败:', error);
        // 检查是否是外键约束错误
        if (error.name === 'SequelizeForeignKeyConstraintError') {
             return res.status(400).json({
                 success: false,
                 message: '删除用户失败：该用户尚有关联数据（如订单、评论等），请先处理关联数据后再删除。'
             });
        }
        res.status(500).json({
            success: false,
            message: '删除用户失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * 获取景点列表
 * @route GET /api/v1/admin/scenics
 * @access 仅限管理员
 */
exports.getScenics = async (req, res) => {
    try {
        const { 
            page = 1, 
            pageSize = 10,
            keyword,
            city,
            priceMin,
            priceMax,
            sortBy = 'hot_score',
            sortOrder = 'desc'
        } = req.query;

        // 构建查询条件
        const whereClause = {};
        if (keyword) {
            whereClause[Op.or] = [
                { name: { [Op.like]: `%${keyword}%` } },
                { description: { [Op.like]: `%${keyword}%` } }
            ];
        }
        if (city) {
            whereClause.city = city;
        }
        if (priceMin !== undefined && priceMax !== undefined) {
            whereClause.ticket_price = {
                [Op.between]: [parseFloat(priceMin), parseFloat(priceMax)]
            };
        } else if (priceMin !== undefined) {
            whereClause.ticket_price = {
                [Op.gte]: parseFloat(priceMin)
            };
        } else if (priceMax !== undefined) {
            whereClause.ticket_price = {
                [Op.lte]: parseFloat(priceMax)
            };
        }

        // --- 新增：映射前端的 popularity 排序到后端的 hot_score ---
        let finalSortBy = sortBy;
        if (sortBy === 'popularity') {
            finalSortBy = 'hot_score';
        }
        // --------------------------------------------------------

        // 构建排序条件
        const order = [[finalSortBy, sortOrder.toUpperCase()]];

        // 分页
        const offset = (page - 1) * pageSize;
        const limit = parseInt(pageSize, 10);

        // 查询景点
        const { count, rows } = await Scenic.findAndCountAll({
            where: whereClause,
            order,
            offset,
            limit
        });

        res.status(200).json({
            success: true,
            data: rows,
            meta: {
                total: count,
                page: parseInt(page, 10),
                pageSize: limit
            }
        });
    } catch (error) {
        console.error('获取景点列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取景点列表失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * 创建景点
 * @route POST /api/v1/admin/scenics
 * @access 仅限管理员
 */
exports.createScenic = async (req, res, next) => {
    try {
        // 验证请求数据
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '请求数据验证失败',
                errors: errors.array()
            });
        }

        const { 
            name, 
            city, 
            address, 
            description, 
            ticket_price, 
            open_time, 
            images, // 期望是数组或 JSON 字符串
            label, // 期望是字符串 (逗号分隔或单个)
            hot_score
        } = req.body;

        // 处理 images - 确保存储为 JSON 字符串
        let imagesJson = '[]';
        if (images) {
            if (Array.isArray(images)) {
                imagesJson = JSON.stringify(images);
            } else if (typeof images === 'string') {
                // 如果是逗号分隔的字符串，转换为数组再 stringify
                if (images.includes(',')) {
                    imagesJson = JSON.stringify(images.split(',').map(s => s.trim()).filter(Boolean));
                } else {
                    // 可能是单个URL或JSON字符串
                    try {
                        // 尝试解析，如果是有效JSON就使用它
                        const parsed = JSON.parse(images);
                        imagesJson = Array.isArray(parsed) ? JSON.stringify(parsed) : JSON.stringify([images]);
                    } catch (e) {
                        // 不是有效的JSON，可能是单个URL
                        imagesJson = JSON.stringify([images]);
                    }
                }
            }
        }

        // 创建新景点
        const newScenic = await Scenic.create({
            name,
            city,
            address,
            description,
            ticket_price,
            open_time,
            images: imagesJson, // 存储 JSON 字符串
            label: label || '', // label 字段是字符串
            hot_score: hot_score || 0
        });

        res.status(201).json({
            success: true,
            data: newScenic
        });
    } catch (error) {
        console.error('创建景点失败:', error);
        res.status(500).json({
            success: false,
            message: '创建景点失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * 根据ID获取景点
 * @route GET /api/v1/admin/scenics/:id
 * @access 仅限管理员
 */
exports.getScenicById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const scenic = await Scenic.findByPk(id);
        
        if (!scenic) {
            return res.status(404).json({
                success: false,
                message: '景点不存在'
            });
        }
        
        res.status(200).json({
            success: true,
            data: scenic
        });
    } catch (error) {
        console.error('获取景点详情失败:', error);
        res.status(500).json({
            success: false,
            message: '获取景点详情失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * 更新景点
 * @route PUT /api/v1/admin/scenics/:id
 * @access 仅限管理员
 */
exports.updateScenic = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            name, 
            city, 
            address, 
            description, 
            ticket_price, 
            open_time, 
            images,
            label,
            hot_score
        } = req.body;
        
        const scenic = await Scenic.findByPk(id);
        
        if (!scenic) {
            return res.status(404).json({ success: false, message: '景点不存在' });
        }
        
        // 更新字段
        if (name !== undefined) scenic.name = name;
        if (city !== undefined) scenic.city = city;
        if (address !== undefined) scenic.address = address;
        if (description !== undefined) scenic.description = description;
        if (ticket_price !== undefined) scenic.ticket_price = ticket_price;
        if (open_time !== undefined) scenic.open_time = open_time;
        if (label !== undefined) scenic.label = label;
        if (hot_score !== undefined) scenic.hot_score = hot_score;
        
        // 处理 images 更新
        if (images !== undefined) {
             let imagesJson = '[]';
            if (images) {
                 try {
                    imagesJson = JSON.stringify(Array.isArray(images) ? images : JSON.parse(images));
                 } catch (e) {
                    if (typeof images === 'string') {
                         imagesJson = JSON.stringify(images.split(',').map(s => s.trim()).filter(Boolean));
                    } else {
                         console.warn('Invalid images format for scenic update:', images);
                    }
                 }
             }
             scenic.images = imagesJson;
        }
        
        await scenic.save();
        
        res.status(200).json({
            success: true,
            data: scenic
        });
    } catch (error) {
        console.error('更新景点失败:', error);
        res.status(500).json({
            success: false,
            message: '更新景点失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * 删除景点
 * @route DELETE /api/v1/admin/scenics/:id
 * @access 仅限管理员
 */
exports.deleteScenic = async (req, res) => {
    try {
        const { id } = req.params;
        
        const scenic = await Scenic.findByPk(id);
        
        if (!scenic) {
            return res.status(404).json({
                success: false,
                message: '景点不存在'
            });
        }
        
        await scenic.destroy();
        
        res.status(200).json({
            success: true,
            message: '景点已成功删除'
        });
    } catch (error) {
        console.error('删除景点失败:', error);
        res.status(500).json({
            success: false,
            message: '删除景点失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// 【酒店管理相关功能】

/**
 * 获取酒店列表
 * @route GET /api/v1/admin/hotels
 * @access 仅限管理员
 */
exports.getHotels = async (req, res) => {
    try {
        const { 
            page = 1, 
            pageSize = 10,
            keyword,
            city,
            priceMin,
            priceMax,
            stars,
            sortBy = 'avg_price',
            sortOrder = 'asc'
        } = req.query;

        // 构建查询条件
        const whereClause = {};
        if (keyword) {
            whereClause[Op.or] = [
                { name: { [Op.like]: `%${keyword}%` } },
                { description: { [Op.like]: `%${keyword}%` } },
                { address: { [Op.like]: `%${keyword}%` } }
            ];
        }
        if (city) {
            whereClause.city = city;
        }
        if (stars) {
            whereClause.stars = parseInt(stars, 10);
        }
        if (priceMin !== undefined && priceMax !== undefined) {
            whereClause.avg_price = {
                [Op.between]: [parseFloat(priceMin), parseFloat(priceMax)]
            };
        } else if (priceMin !== undefined) {
            whereClause.avg_price = {
                [Op.gte]: parseFloat(priceMin)
            };
        } else if (priceMax !== undefined) {
            whereClause.avg_price = {
                [Op.lte]: parseFloat(priceMax)
            };
        }

        // --- 新增：映射前端的 popularity 排序到后端的 hot_score ---
        let finalSortBy = sortBy;
        if (sortBy === 'popularity') {
            finalSortBy = 'hot_score';
        }
        // --------------------------------------------------------

        // 构建排序条件
        const order = [[finalSortBy, sortOrder.toUpperCase()]];

        // 分页
        const offset = (page - 1) * pageSize;
        const limit = parseInt(pageSize, 10);

        // 查询酒店
        const { count, rows } = await Hotel.findAndCountAll({
            where: whereClause,
            order,
            offset,
            limit
        });

        res.status(200).json({
            success: true,
            data: rows,
            meta: {
                total: count,
                page: parseInt(page, 10),
                pageSize: limit
            }
        });
    } catch (error) {
        console.error('获取酒店列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取酒店列表失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * 创建酒店
 * @route POST /api/v1/admin/hotels
 * @access 仅限管理员
 */
exports.createHotel = async (req, res) => {
    try {
        // 验证请求数据
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '请求数据验证失败',
                errors: errors.array()
            });
        }

        const { 
            name, 
            city, 
            address, 
            type,
            description, 
            avg_price,
            stars,
            rating,
            images, 
            cover_image,
            facilities,
            amenities,
            policies,
            location
        } = req.body;

        // 创建新酒店
        const newHotel = await Hotel.create({
            name,
            city,
            address,
            type,
            description,
            avg_price,
            stars,
            rating,
            images: Array.isArray(images) ? images.join(',') : images,
            cover_image,
            facilities: Array.isArray(facilities) ? facilities.join(',') : facilities,
            amenities: Array.isArray(amenities) ? amenities.join(',') : amenities,
            policies: typeof policies === 'object' ? JSON.stringify(policies) : policies,
            location: typeof location === 'object' ? JSON.stringify(location) : location
        });

        res.status(201).json({
            success: true,
            data: newHotel
        });
    } catch (error) {
        console.error('创建酒店失败:', error);
        res.status(500).json({
            success: false,
            message: '创建酒店失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * 根据ID获取酒店
 * @route GET /api/v1/admin/hotels/:id
 * @access 仅限管理员
 */
exports.getHotelById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const hotel = await Hotel.findByPk(id);
        
        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: '酒店不存在'
            });
        }
        
        res.status(200).json({
            success: true,
            data: hotel
        });
    } catch (error) {
        console.error('获取酒店详情失败:', error);
        res.status(500).json({
            success: false,
            message: '获取酒店详情失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * 更新酒店
 * @route PUT /api/v1/admin/hotels/:id
 * @access 仅限管理员
 */
exports.updateHotel = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            name, 
            city, 
            address, 
            type,
            description, 
            avg_price,
            stars,
            rating,
            images, 
            cover_image,
            facilities,
            amenities,
            policies,
            location
        } = req.body;
        
        const hotel = await Hotel.findByPk(id);
        
        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: '酒店不存在'
            });
        }
        
        // 更新字段
        if (name) hotel.name = name;
        if (city) hotel.city = city;
        if (address) hotel.address = address;
        if (type) hotel.type = type;
        if (description) hotel.description = description;
        if (avg_price !== undefined) hotel.avg_price = avg_price;
        if (stars !== undefined) hotel.stars = stars;
        if (rating !== undefined) hotel.rating = rating;
        if (images) {
            hotel.images = Array.isArray(images) ? images.join(',') : images;
        }
        if (cover_image) hotel.cover_image = cover_image;
        if (facilities) {
            hotel.facilities = Array.isArray(facilities) ? facilities.join(',') : facilities;
        }
        if (amenities) {
            hotel.amenities = Array.isArray(amenities) ? amenities.join(',') : amenities;
        }
        if (policies) {
            hotel.policies = typeof policies === 'object' ? JSON.stringify(policies) : policies;
        }
        if (location) {
            hotel.location = typeof location === 'object' ? JSON.stringify(location) : location;
        }
        
        await hotel.save();
        
        res.status(200).json({
            success: true,
            data: hotel
        });
    } catch (error) {
        console.error('更新酒店失败:', error);
        res.status(500).json({
            success: false,
            message: '更新酒店失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * 删除酒店
 * @route DELETE /api/v1/admin/hotels/:id
 * @access 仅限管理员
 */
exports.deleteHotel = async (req, res) => {
    try {
        const { id } = req.params;
        
        const hotel = await Hotel.findByPk(id);
        
        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: '酒店不存在'
            });
        }
        
        await hotel.destroy();
        
        res.status(200).json({
            success: true,
            message: '酒店已成功删除'
        });
    } catch (error) {
        console.error('删除酒店失败:', error);
        res.status(500).json({
            success: false,
            message: '删除酒店失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// 【订单管理相关功能】

/**
 * 获取订单列表
 * @route GET /api/v1/admin/orders
 * @access 仅限管理员
 */
exports.getOrders = async (req, res) => {
    try {
        const { 
            page = 1, 
            pageSize = 10,
            userId,
            status,
            startDate,
            endDate,
            sortBy = 'created_at',
            sortOrder = 'desc'
        } = req.query;

        // 构建查询条件
        const whereClause = {};
        if (userId) {
            whereClause.user_id = userId;
        }
        if (status) {
            whereClause.status = status;
        }

        // 日期范围
        if (startDate && endDate) {
            whereClause.created_at = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        } else if (startDate) {
            whereClause.created_at = {
                [Op.gte]: new Date(startDate)
            };
        } else if (endDate) {
            whereClause.created_at = {
                [Op.lte]: new Date(endDate)
            };
        }

        // 构建排序条件
        const order = [[sortBy, sortOrder.toUpperCase()]];

        // 分页
        const offset = (page - 1) * pageSize;
        const limit = parseInt(pageSize, 10);

        // 查询订单
        const { count, rows } = await Booking.findAndCountAll({
            where: whereClause,
            order,
            offset,
            limit,
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['user_id', 'username', 'email']
                }
            ]
        });

        res.status(200).json({
            success: true,
            data: rows,
            meta: {
                total: count,
                page: parseInt(page, 10),
                pageSize: limit
            }
        });
    } catch (error) {
        console.error('获取订单列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取订单列表失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * 根据ID获取订单
 * @route GET /api/v1/admin/orders/:id
 * @access 仅限管理员
 */
exports.getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const order = await Booking.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['user_id', 'username', 'email', 'phone']
                }
            ]
        });
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: '订单不存在'
            });
        }
        
        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('获取订单详情失败:', error);
        res.status(500).json({
            success: false,
            message: '获取订单详情失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * 更新订单状态
 * @route PUT /api/v1/admin/orders/:id/status
 * @access 仅限管理员
 */
exports.updateOrderStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const order = await Booking.findByPk(id);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: '订单不存在'
            });
        }
        
        // 验证 status 是否有效 (可选)
        if (status && !['pending', 'confirmed', 'cancelled'].includes(status)) {
            return res.status(400).json({ success: false, message: '无效的订单状态' });
        }

        // 更新状态
        order.status = status;
        
        await order.save();
        
        res.status(200).json({
            success: true,
            data: order,
            message: '订单状态已更新'
        });
    } catch (error) {
        console.error('更新订单状态失败:', error);
        res.status(500).json({
            success: false,
            message: '更新订单状态失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// 【评论管理相关功能】

/**
 * 获取评论列表
 * @route GET /api/v1/admin/reviews
 * @access 仅限管理员
 */
exports.getReviews = async (req, res) => {
    try {
        const { 
            page = 1, 
            pageSize = 10,
            userId,
            itemType,
            itemId,
            status,
            minRating,
            maxRating,
            sortBy = 'created_at',
            sortOrder = 'desc'
        } = req.query;

        // 构建查询条件
        const whereClause = {};
        if (userId) {
            whereClause.user_id = userId;
        }
        if (itemType) {
            whereClause.item_type = itemType;
        }
        if (itemId) {
            whereClause.item_id = itemId;
        }
        if (status) {
            whereClause.status = status;
        }
        if (minRating !== undefined && maxRating !== undefined) {
            whereClause.rating = {
                [Op.between]: [parseInt(minRating, 10), parseInt(maxRating, 10)]
            };
        } else if (minRating !== undefined) {
            whereClause.rating = {
                [Op.gte]: parseInt(minRating, 10)
            };
        } else if (maxRating !== undefined) {
            whereClause.rating = {
                [Op.lte]: parseInt(maxRating, 10)
            };
        }

        // 构建排序条件
        const order = [[sortBy, sortOrder.toUpperCase()]];

        // 分页
        const offset = (page - 1) * pageSize;
        const limit = parseInt(pageSize, 10);

        // 查询评论
        const { count, rows } = await Review.findAndCountAll({
            where: whereClause,
            order,
            offset,
            limit,
            include: [
                {
                    model: User,
                    as: 'author',
                    attributes: ['user_id', 'username', 'avatar']
                }
            ]
        });

        res.status(200).json({
            success: true,
            data: rows,
            meta: {
                total: count,
                page: parseInt(page, 10),
                pageSize: limit
            }
        });
    } catch (error) {
        console.error('获取评论列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取评论列表失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * 删除评论
 * @route DELETE /api/v1/admin/reviews/:id
 * @access 仅限管理员
 */
exports.deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        
        const review = await Review.findByPk(id);
        
        if (!review) {
            return res.status(404).json({
                success: false,
                message: '评论不存在'
            });
        }
        
        await review.destroy();
        
        res.status(200).json({
            success: true,
            message: '评论已成功删除'
        });
    } catch (error) {
        console.error('删除评论失败:', error);
        res.status(500).json({
            success: false,
            message: '删除评论失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * 更新评论状态
 * @route PUT /api/v1/admin/reviews/:id/status
 * @access 仅限管理员
 */
exports.updateReviewStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, admin_reply } = req.body;
        
        const review = await Review.findByPk(id);
        
        if (!review) {
            return res.status(404).json({
                success: false,
                message: '评论不存在'
            });
        }
        
        // 更新状态和回复
        if (status) {
            review.status = status;
        }
        if (admin_reply) {
            review.admin_reply = admin_reply;
        }
        
        await review.save();
        
        res.status(200).json({
            success: true,
            data: review,
            message: '评论状态已更新'
        });
    } catch (error) {
        console.error('更新评论状态失败:', error);
        res.status(500).json({
            success: false,
            message: '更新评论状态失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// 【攻略管理相关功能】

/**
 * 获取攻略列表
 * @route GET /api/v1/admin/strategies
 * @access 仅限管理员
 */
exports.getStrategies = async (req, res) => {
    try {
        const { 
            page = 1, 
            pageSize = 10,
            keyword,
            userId,
            destination,
            status,
            sortBy = 'created_at',
            sortOrder = 'desc'
        } = req.query;

        // 构建查询条件
        const whereClause = {};
        if (keyword) {
            whereClause[Op.or] = [
                { title: { [Op.like]: `%${keyword}%` } },
                { content: { [Op.like]: `%${keyword}%` } },
                { summary: { [Op.like]: `%${keyword}%` } }
            ];
        }
        if (userId) {
            whereClause.user_id = userId;
        }
        if (destination) {
            whereClause.destination = destination;
        }
        if (status) {
            whereClause.status = status;
        }

        // 构建排序条件
        const order = [[sortBy, sortOrder.toUpperCase()]];

        // 分页
        const offset = (page - 1) * pageSize;
        const limit = parseInt(pageSize, 10);

        // 查询攻略
        const { count, rows } = await Strategy.findAndCountAll({
            where: whereClause,
            order,
            offset,
            limit,
            include: [
                {
                    model: User,
                    as: 'author',
                    attributes: ['user_id', 'username', 'avatar']
                }
            ]
        });

        res.status(200).json({
            success: true,
            data: rows,
            meta: {
                total: count,
                page: parseInt(page, 10),
                pageSize: limit
            }
        });
    } catch (error) {
        console.error('获取攻略列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取攻略列表失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * 创建攻略
 * @route POST /api/v1/admin/strategies
 * @access 仅限管理员
 */
exports.createStrategy = async (req, res, next) => {
    try {
        // 验证请求数据
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '请求数据验证失败',
                errors: errors.array()
            });
        }

        const {
            title, 
            content, 
            cover_image, 
            city, // 使用 schema 中的 city 字段
            tags, // 期望是数组或 JSON 字符串, 或者逗号分隔字符串
            type, // 使用 schema 中的 type 字段
            status, // 使用 schema 中的 status 字段
            userId // 可选，指定作者，否则用当前管理员
        } = req.body;

        // 处理 tags - 确保存储为字符串
        let tagsString = '';
        if (tags) {
            if (Array.isArray(tags)) {
                tagsString = tags.join(',');
            } else if (typeof tags === 'string') {
                tagsString = tags;
            } else {
                 console.warn('Invalid tags format for strategy creation:', tags);
            }
        }

        // 创建新攻略
        const newStrategy = await Strategy.create({
            title,
            content,
            cover_image: cover_image || '', // 提供默认值
            city: city || '', // 提供默认值
            tags: tagsString,
            type: type || 'article', // 提供默认值
            status: status || 'published', // 提供默认值
            user_id: userId || req.user.id, // 作者 ID
            view_count: 0, // 初始值
            like_count: 0 // 初始值
        });

        res.status(201).json({
            success: true,
            data: newStrategy
        });
    } catch (error) {
        console.error('创建攻略失败:', error);
        res.status(500).json({
            success: false,
            message: '创建攻略失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * 根据ID获取攻略
 * @route GET /api/v1/admin/strategies/:id
 * @access 仅限管理员
 */
exports.getStrategyById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const strategy = await Strategy.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'author',
                    attributes: ['user_id', 'username', 'avatar']
                }
            ]
        });
        
        if (!strategy) {
            return res.status(404).json({
                success: false,
                message: '攻略不存在'
            });
        }
        
        res.status(200).json({
            success: true,
            data: strategy
        });
    } catch (error) {
        console.error('获取攻略详情失败:', error);
        res.status(500).json({
            success: false,
            message: '获取攻略详情失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * 更新攻略
 * @route PUT /api/v1/admin/strategies/:id
 * @access 仅限管理员
 */
exports.updateStrategy = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            title, 
            content, 
            cover_image,
            city,
            tags,
            type,
            status
            // 移除不存在的字段: summary, destination, days, budget, season, travel_with, images, views, likes
        } = req.body;
        
        const strategy = await Strategy.findByPk(id);
        if (!strategy) {
            return res.status(404).json({ success: false, message: '攻略不存在' });
        }
        
        // 更新字段
        if (title !== undefined) strategy.title = title;
        if (content !== undefined) strategy.content = content;
        if (cover_image !== undefined) strategy.cover_image = cover_image;
        if (city !== undefined) strategy.city = city;
        if (type !== undefined) strategy.type = type;
        if (status !== undefined) strategy.status = status;
        
        // 处理 tags 更新
        if (tags !== undefined) {
            let tagsString = '';
            if (tags) {
                if (Array.isArray(tags)) {
                    tagsString = tags.join(',');
                } else if (typeof tags === 'string') {
                    tagsString = tags;
                } else {
                    console.warn('Invalid tags format for strategy update:', tags);
                }
            }
            strategy.tags = tagsString;
        }
        
        await strategy.save();
        
        res.status(200).json({
            success: true,
            data: strategy,
            message: '攻略已成功更新'
        });
    } catch (error) {
        console.error('更新攻略失败:', error);
        res.status(500).json({
            success: false,
            message: '更新攻略失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * 删除攻略
 * @route DELETE /api/v1/admin/strategies/:id
 * @access 仅限管理员
 */
exports.deleteStrategy = async (req, res) => {
    try {
        const { id } = req.params;
        
        const strategy = await Strategy.findByPk(id);
        
        if (!strategy) {
            return res.status(404).json({
                success: false,
                message: '攻略不存在'
            });
        }
        
        await strategy.destroy();
        
        res.status(200).json({
            success: true,
            message: '攻略已成功删除'
        });
    } catch (error) {
        console.error('删除攻略失败:', error);
        res.status(500).json({
            success: false,
            message: '删除攻略失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// --- 图片上传处理 --- 

/**
 * 处理图片上传到文件系统
 * @route POST /api/v1/upload/image-fs (或其他路由)
 * @access 登录用户 (或管理员)
 */
exports.uploadImageToFileSystem = (req, res, next) => {
    console.log('--- 进入 uploadImageToFileSystem 控制器 ---');
    // 检查 fileFilter 是否附加了错误
    if (req.fileFilterError) {
        console.error('文件类型错误:', req.fileFilterError.message);
        return res.status(400).json({ success: false, message: req.fileFilterError.message });
    }
    // 检查 multer 是否成功处理了文件 (文件是否存在)
    if (!req.file) {
        console.error('文件上传失败: req.file 未定义 (可能是 Multer 中间件错误或无文件上传)');
        // 注意：如果 Multer 内部出错（如磁盘写入失败），错误可能由全局错误处理捕获
        // 这里主要处理没有文件或文件被过滤的情况
        return res.status(400).json({ success: false, message: '没有检测到有效的图片文件或上传出错' });
    }

    try {
        console.log('文件对象 (req.file):', req.file);
        // 文件已由 multer 的 diskStorage 保存
        const relativePath = `/uploads/images/${req.file.filename}`;

        console.log(`文件已保存到: ${req.file.path}`);
        console.log(`将返回给前端的相对路径: ${relativePath}`);

        // 返回成功响应
        res.status(200).json({
            success: true,
            message: '图片上传成功 (文件系统)',
            path: relativePath
        });
        console.log('--- uploadImageToFileSystem 控制器成功结束 ---');

    } catch (error) {
        console.error('在 uploadImageToFileSystem 控制器内部发生错误:', error);
        // 将错误传递给全局错误处理中间件
        next(error);
        // 旧的处理方式 (可选，但推荐使用 next(error))
        // if (req.file && req.file.path) {
        //     fs.unlink(req.file.path, (unlinkErr) => {
        //         if (unlinkErr) console.error("删除上传失败的文件时出错:", unlinkErr);
        //     });
        // }
        // res.status(500).json({ success: false, message: '图片上传内部处理失败' });
    }
};

/**
 * 获取景点坐标统计信息
 * 管理员可以通过此接口监控缺少坐标数据的景点
 */
exports.getScenicSpotCoordinateStats = async (req, res) => {
  try {
    // 统计总景点数
    const totalCount = await Scenic.count();
    
    // 统计缺少坐标的景点数
    const missingCoordinatesCount = await Scenic.count({
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              { location: null },
              { location: { [Op.is]: null } }
            ]
          },
          {
            [Op.or]: [
              { latitude: null },
              { latitude: { [Op.is]: null } },
              { longitude: null },
              { longitude: { [Op.is]: null } }
            ]
          }
        ]
      }
    });
    
    // 计算坐标数据完整率
    const completionRate = totalCount > 0 
      ? ((totalCount - missingCoordinatesCount) / totalCount * 100).toFixed(2)
      : 0;
    
    // 查询最近添加的缺少坐标的景点
    const recentMissingCoordinates = await Scenic.findAll({
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              { location: null },
              { location: { [Op.is]: null } }
            ]
          },
          {
            [Op.or]: [
              { latitude: null },
              { latitude: { [Op.is]: null } },
              { longitude: null },
              { longitude: { [Op.is]: null } }
            ]
          }
        ]
      },
      order: [['created_at', 'DESC']],
      limit: 10,
      attributes: ['scenic_id', 'name', 'city', 'address', 'created_at', 'updated_at']
    });
    
    return res.json({
      success: true,
      data: {
        totalCount,
        missingCoordinatesCount,
        completionRate,
        recentMissingCoordinates
      }
    });
  } catch (error) {
    console.error('获取景点坐标统计信息失败:', error);
    return res.status(500).json({
      success: false,
      message: '获取统计信息失败: ' + error.message
    });
  }
}; 