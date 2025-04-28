/**
 * 酒店控制器
 * 处理酒店相关的数据请求和响应
 */

// 引入必要的模块和模型
const { Op } = require('sequelize');
const { sequelize } = require('../config/db.js');
const { User, Hotel, Review } = require('../models');
const { validationResult } = require('express-validator');
const Room = require('../models/Room')(sequelize);
const UserModel = require('../models/User')(sequelize);

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
        return [str]; // 解析失败时返回包含原始字符串的数组
    }
};

// 辅助函数：将前端的排序参数转换为 Sequelize 的 order 格式
const getHotelOrderOptions = (sortBy, sortOrder) => {
    const order = [];
    const direction = sortOrder && sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    switch (sortBy) {
        case 'price':
            // 使用新的 avg_price 字段进行排序
            order.push(['avg_price', direction]); 
            break;
        case 'rating': // 使用 stars 作为评分依据
            order.push(['stars', direction]);
            break;
        default: // 默认按 ID
            order.push(['hotel_id', 'ASC']);
            break;
    }
    order.push(['hotel_id', 'ASC']);
    return order;
};

// 辅助函数：格式化酒店数据 (基础信息)
const formatHotelBaseData = (hotel) => {
    // 解析 JSON 字段，提供默认空数组
    let imagesArray = [];
    if (hotel.images) {
        imagesArray = safeJsonParse(hotel.images);
    }

    let facilitiesArray = [];
    if (hotel.facilities) {
        facilitiesArray = safeJsonParse(hotel.facilities);
    }

    // 确保价格字段始终有有效数值
    const avgPrice = parseFloat(hotel.avg_price);
    const safeAvgPrice = !isNaN(avgPrice) ? avgPrice : 0;

    return {
        id: hotel.hotel_id,
        name: hotel.name,
        city: hotel.city,
        address: hotel.address,
        description: hotel.description,
        stars: hotel.stars,
        priceRange: hotel.price_range,
        avgPrice: safeAvgPrice, // 使用安全的avg_price
        type: hotel.type, // 添加 type
        images: imagesArray,
        facilities: facilitiesArray,
        rating: hotel.stars, 
        score: hotel.stars,  
        price: safeAvgPrice, // 默认使用安全的avg_price作为初始price
        amenities: facilitiesArray
    };
};

/**
 * 获取酒店列表
 * @param {Object} req - HTTP请求对象
 * @param {Object} res - HTTP响应对象
 * @param {Function} next - Express next middleware
 */
exports.getHotels = async (req, res, next) => {
    const {
        page = 1,
        pageSize = 10,
        city,
        keyword,
        priceMin,
        priceMax,
        starLevel,
        amenities,
        type, // 添加类型筛选
        sortBy = 'rating',
        sortOrder = 'desc'
    } = req.query;

    const limit = parseInt(pageSize, 10);
    const offset = (parseInt(page, 10) - 1) * limit;

    const whereClause = {};

    // 构建筛选条件
    if (keyword) {
        whereClause[Op.or] = [
            { name: { [Op.like]: `%${keyword}%` } },
            { description: { [Op.like]: `%${keyword}%` } }
        ];
    }
    if (city) {
        whereClause.city = city;
    }
    if (starLevel) {
        const stars = parseInt(starLevel, 10);
        if (!isNaN(stars)) {
            whereClause.stars = stars;
        }
    }
    // 使用 avg_price 进行价格筛选
    if (priceMin !== undefined && priceMax !== undefined) {
         const min = parseFloat(priceMin);
         const max = parseFloat(priceMax);
         if (!isNaN(min) && !isNaN(max)) {
             whereClause.avg_price = { [Op.between]: [min, max] };
         }
    } else if (priceMin !== undefined) {
        const min = parseFloat(priceMin);
        if (!isNaN(min)) {
            whereClause.avg_price = { [Op.gte]: min };
        }
    } else if (priceMax !== undefined) {
        const max = parseFloat(priceMax);
        if (!isNaN(max)) {
            whereClause.avg_price = { [Op.lte]: max };
        }
    }
    if (amenities) {
        const amenityList = amenities.split(',').map(a => a.trim()).filter(Boolean);
        if (amenityList.length > 0) {
            // 对 JSON 字段进行模糊匹配 (效率较低，且取决于 JSON 存储格式)
            // 可能需要使用数据库特定的 JSON 函数，如 JSON_CONTAINS
            // 简化示例：使用 LIKE 匹配
            whereClause.facilities = {
                [Op.and]: amenityList.map(amenity => ({ [Op.like]: `%"${amenity}"%` }))
            };
        }
    }
    if (type) { // 添加类型筛选
        whereClause.type = type;
    }

    try {
        const { count, rows } = await Hotel.findAndCountAll({
            where: whereClause,
            limit: limit,
            offset: offset,
            order: getHotelOrderOptions(sortBy, sortOrder)
        });

        const formattedHotels = rows.map(formatHotelBaseData); // 使用基础格式化

        res.status(200).json({
            message: '酒店列表获取成功',
            items: formattedHotels, 
            hotels: formattedHotels,
            total: count,
            page: parseInt(page, 10),
            pageSize: limit
        });

    } catch (err) {
        console.error('获取酒店列表失败:', err);
        next(err);
    }
};

/**
 * 获取酒店详情
 * @param {Object} req - HTTP请求对象
 * @param {Object} res - HTTP响应对象
 * @param {Function} next - Express next middleware
 */
exports.getHotelById = async (req, res, next) => {
    const { id } = req.params;
    try {
        const hotel = await Hotel.findByPk(id, {
            include: [
                {
                    model: Review,
                    as: 'reviews',
                    required: false,
                    include: [{ model: User, as: 'author', attributes: ['user_id', 'username', 'avatar'], required: false }],
                    order: [['created_at', 'DESC']],
                    limit: 5
                }
            ]
        });
        if (!hotel) {
            return res.status(404).json({ message: '酒店不存在', code: 404 });
        }
        
        // 获取酒店关联的真实房间数据
        const rooms = await Room.findAll({
            where: { hotel_id: id },
            order: [['price', 'ASC']]  // 按价格升序排序
        });
        
        // 格式化基础数据
        const formattedHotel = formatHotelBaseData(hotel);
        
        // 如果找到房间，则使用最低房间价格作为酒店价格
        if (rooms && rooms.length > 0) {
            // 设置酒店最低价格为房间最低价格
            formattedHotel.price = rooms[0].price;
        }
        
        // 格式化房间数据
        const formattedRooms = rooms.map(room => ({
            id: room.room_id,
            name: room.name || '标准房',
            description: room.description || `${room.size || ''} ${room.beds || ''}`.trim(),
            price: room.price,
            beds: room.beds || '未知',
            size: room.size || '未知',
            maxOccupancy: room.max_occupancy || 2,
            images: safeJsonParse(room.images),
            facilities: safeJsonParse(room.facilities),
            amenities: safeJsonParse(room.facilities),
            available: true
        }));

        const formattedReviews = (hotel.reviews || []).map(review => ({
            id: review.review_id,
            userId: review.user_id,
            username: review.author?.username || '匿名',
            avatar: review.author?.avatar || 'https://placehold.co/50',
            rating: review.rating,
            content: review.content,
            createdAt: review.created_at,
        }));

        const detailedHotel = {
            ...formattedHotel,
            rooms: formattedRooms,
            reviews: formattedReviews,
            policies: {
                checkIn: '14:00之后', checkOut: '12:00之前', children: '欢迎', pets: '不允许', cancellation: '免费取消'
            },
            location: {
                address: hotel.address, zipCode: '100000', latitude: 39.9, longitude: 116.3
            },
            nearbyAttractions: [
                { name: '附近景点1', distance: '1km' }
            ]
        };
        
        res.status(200).json(detailedHotel);
    } catch (err) {
        console.error(`获取酒店详情失败 (ID: ${id}):`, err);
        next(err);
    }
};

/**
 * 获取酒店类型列表 (使用数据库查询)
 */
exports.getHotelTypes = async (req, res, next) => {
    try {
        const types = await Hotel.findAll({
            attributes: [[sequelize.fn('DISTINCT', sequelize.col('type')), 'type']],
            where: { type: { [Op.ne]: null } }, // 排除 null 值
            order: [['type', 'ASC']],
            raw: true
        });
        res.status(200).json(types.map(t => t.type));
    } catch (err) {
        console.error('获取酒店类型失败:', err);
        // 出错时返回空数组或默认值
        res.status(200).json(['豪华酒店', '商务酒店', '度假酒店', '经济酒店', '公寓酒店']); 
    }
};

/**
 * 获取酒店设施列表
 */
exports.getHotelFacilities = async (req, res, next) => {
    try {
        const hotelsWithFacilities = await Hotel.findAll({
            attributes: ['facilities'],
            where: { facilities: { [Op.ne]: null } },
            raw: true
        });
        const allFacilities = new Set();
        hotelsWithFacilities.forEach(hotel => {
            if (hotel.facilities) {
                const parsed = safeJsonParse(hotel.facilities);
                if (Array.isArray(parsed)) {
                    parsed.forEach(fac => {
                        if (typeof fac === 'string' && fac.trim()) {
                            allFacilities.add(fac.trim());
                        }
                    });
                }
            }
        });
        res.status(200).json(Array.from(allFacilities).sort());
    } catch (err) {
        console.error('获取设施列表失败:', err);
        next(err);
    }
};

// 新增：获取酒店城市列表
exports.getHotelCities = async (req, res, next) => {
    try {
        const cities = await Hotel.findAll({
            attributes: [[sequelize.fn('DISTINCT', sequelize.col('city')), 'city']], // 查询不重复的城市
            where: {
                city: {
                    [Op.ne]: null, // 排除 city 为 null 的情况
                    [Op.ne]: ''    // 排除 city 为空字符串的情况
                }
            },
            order: [['city', 'ASC']], // 按城市名称排序
            raw: true // 获取原始数据
        });
        // 从结果中提取城市名称数组
        const cityNames = cities.map(c => c.city).filter(Boolean); // 再次过滤以防万一
        res.status(200).json(cityNames);
    } catch (err) {
        console.error('获取酒店城市列表失败:', err);
        next(err); // 将错误传递给全局错误处理中间件
    }
};

// 可能还需要实现 getHotelTypes 和 getHotelFacilities，如果路由需要的话
// 获取酒店类型列表 (示例，需要根据实际模型调整)
exports.getHotelTypes = async (req, res, next) => {
    try {
        const types = await Hotel.findAll({
            attributes: [[sequelize.fn('DISTINCT', sequelize.col('type')), 'type']],
            where: { type: { [Op.ne]: null, [Op.ne]: '' } },
            order: [['type', 'ASC']],
            raw: true
        });
        res.status(200).json(types.map(t => t.type).filter(Boolean));
    } catch (err) {
        console.error('获取酒店类型列表失败:', err);
        next(err);
    }
};

// 获取设施列表 (示例，需要根据实际模型和数据存储方式调整)
exports.getHotelFacilities = async (req, res, next) => {
    try {
        const hotelsWithFacilities = await Hotel.findAll({
            attributes: ['facilities'],
            where: { facilities: { [Op.ne]: null } },
            raw: true
        });
        const allFacilities = new Set();
        hotelsWithFacilities.forEach(hotel => {
            if (hotel.facilities) {
                const parsed = safeJsonParse(hotel.facilities);
                if (Array.isArray(parsed)) {
                    parsed.forEach(fac => {
                        if (typeof fac === 'string' && fac.trim()) {
                            allFacilities.add(fac.trim());
                        }
                    });
                }
            }
        });
        res.status(200).json(Array.from(allFacilities).sort());
    } catch (err) {
        console.error('获取设施列表失败:', err);
        next(err);
    }
};

module.exports = exports; 