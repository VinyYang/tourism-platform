const { Op, Sequelize, fn, col } = require('sequelize');
// 修改: 使用统一的模型导入方式
const db = require('../models');
const Scenic = db.Scenic;
const Review = db.Review; // <-- 1. 导入 Review 模型
const { validationResult } = require('express-validator'); // 如果需要输入验证
const { getCoordinatesFromAddress } = require('../utils/geocoder'); // Import the geocoder utility
const sequelize = require('sequelize');

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

// 辅助函数：将前端的排序参数转换为 Sequelize 的 order 格式
const getOrderOptions = (sortBy, sortOrder) => {
    const order = [];
    const direction = sortOrder && sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    switch (sortBy) {
        case 'price':
            order.push(['ticket_price', direction]);
            break;
        case 'rating': // 使用 hot_score 作为评分依据
            order.push(['hot_score', direction]);
            break;
        case 'popularity': // 默认按 hot_score 降序
        default:
            order.push(['hot_score', 'DESC']);
            break;
    }
    // 添加 ID 作为次要排序，确保稳定性
    order.push(['scenic_id', 'ASC']); 
    return order;
};

// 辅助函数：格式化景点数据以匹配前端期望
const formatScenicData = (scenic) => {
    // 确保 images 和 labels 是数组
    let imagesArray = [];
    if (scenic.images) {
        if (Array.isArray(scenic.images)) {
            imagesArray = scenic.images;
        } else if (typeof scenic.images === 'string') {
            imagesArray = safeJsonParse(scenic.images);
        } else {
             // 其他意外类型，给空数组
             imagesArray = [];
        }
    }

    let labelsArray = [];
    if (scenic.label) {
        if (Array.isArray(scenic.label)) {
            labelsArray = scenic.label;
        } else if (typeof scenic.label === 'string') {
            labelsArray = scenic.label.split(',').map(lbl => lbl.trim()).filter(Boolean);
        }
    }

    // 确保价格是有效数值
    const ticketPrice = scenic.ticket_price !== undefined ? parseFloat(scenic.ticket_price) : null;
    const safeTicketPrice = ticketPrice !== null && !isNaN(ticketPrice) ? ticketPrice : null;
    
    // 标准化城市名称，移除"市"后缀
    const normalizedCity = scenic.city ? scenic.city.replace(/市$/, '') : '';

    return {
        id: scenic.scenic_id,
        name: scenic.name,
        city: normalizedCity, // 使用标准化的城市名
        address: scenic.address,
        description: scenic.description,
        openTime: scenic.open_time, // 转换字段名
        ticketPrice: safeTicketPrice, // 使用安全解析的票价
        images: imagesArray, // 确保证是数组
        label: scenic.label, // 保留原始 label 字符串供筛选用?
        hotScore: scenic.hot_score,
        // 兼容前端可能使用的旧字段名
        coverImage: imagesArray.length > 0 ? imagesArray[0] : '', // 使用第一张图片作为封面
        price: safeTicketPrice, // 确保price字段与ticketPrice保持一致
        score: scenic.hot_score, // 直接使用 hot_score 作为 score，前端可能需要调整显示比例
        labels: labelsArray // 确保证是数组
    };
};

// 获取景点列表（包含分页、排序、筛选）
exports.getScenics = async (req, res, next) => {
    const { 
        city, 
        keyword, 
        label, 
        culturalValueLevel, 
        timeAxis, 
        region, 
        culturalForm, 
        secondaryThemes,
        page = 1, 
        limit = 12, 
        sortBy = 'hot_score', 
        sortOrder = 'desc' 
    } = req.query;
    
    try {
        console.log(`开始获取景点列表，参数:`, JSON.stringify(req.query));
        
        // 安全解析参数
        const parsedPage = parseInt(page, 10);
        const parsedLimit = parseInt(limit, 10);
        const safePage = isNaN(parsedPage) || parsedPage <= 0 ? 1 : parsedPage;
        const safeLimit = isNaN(parsedLimit) || parsedLimit <= 0 ? 12 : parsedLimit;
        const offset = (safePage - 1) * safeLimit;
        
        // 构建查询条件
        const where = {};
        
        // 城市筛选条件
        if (city) {
            // 标准化输入的城市名（移除"市"后缀）
            const normalizedCity = city.replace(/市$/, '');
            
            // 使用模糊匹配，支持带"市"和不带"市"的查询
            where.city = {
                [Op.or]: [
                    normalizedCity,                   // 精确匹配标准化后的名称
                    { [Op.like]: `${normalizedCity}%` }, // 前缀匹配（如"北京市"）
                    { [Op.like]: `%${normalizedCity}` }  // 后缀匹配（如可能的其他格式）
                ]
            };
        }
        
        // 关键词筛选条件，与城市条件是"与"的关系
        if (keyword) {
            where[Op.or] = [
                { name: { [Op.like]: `%${keyword}%` } },
                { description: { [Op.like]: `%${keyword}%` } },
                { label: { [Op.like]: `%${keyword}%` } }
            ];
        }
        
        // 标签筛选条件
        if (label) {
            where.label = { [Op.like]: `%${label}%` };
        }
        
        // 文化价值等级筛选
        if (culturalValueLevel) {
            // 这里假设数据库中有cultural_value_level字段，如果没有需要先添加此字段
            // 如果没有该字段，则跳过此条件而不是报错
            where.cultural_value_level = culturalValueLevel;
        }
        
        // 时间轴筛选（历史时期）
        if (timeAxis) {
            // 假设数据库中有time_axis字段
            // 如果没有该字段，则跳过此条件
            where.time_axis = timeAxis;
        }
        
        // 地域文化筛选
        if (region) {
            // 假设数据库中有region字段
            // 如果没有该字段，则跳过此条件
            where.region = region;
        }
        
        // 文化形态筛选
        if (culturalForm) {
            // 假设数据库中有cultural_form字段
            // 如果没有该字段，则跳过此条件
            where.cultural_form = culturalForm;
        }
        
        // 特色标签筛选
        if (secondaryThemes) {
            // 假设特色标签存储在label字段中
            where.label = { [Op.like]: `%${secondaryThemes}%` };
        }
        
        // 确定排序
        let order = [];
        const safeOrder = (sortOrder && sortOrder.toLowerCase() === 'asc') ? 'ASC' : 'DESC';
        
        if (sortBy === 'price' || sortBy === 'price_asc' || sortBy === 'price_desc') {
            order.push(['ticket_price', sortBy.includes('desc') ? 'DESC' : safeOrder]);
        } else if (sortBy === 'rating') {
            order.push(['hot_score', safeOrder]);
        } else {
            // 默认按热度降序
            order.push(['hot_score', 'DESC']);
        }
        
        // 添加ID作为次要排序，确保稳定性
        order.push(['scenic_id', 'ASC']);
        
        console.log(`执行景点查询，page=${safePage}, limit=${safeLimit}, 排序=${JSON.stringify(order)}`);
        console.log('查询条件:', JSON.stringify(where));
        
        // 尝试查询数据库
        let scenicData = { count: 0, rows: [] };
        try {
            scenicData = await Scenic.findAndCountAll({
                where,
                limit: safeLimit,
                offset,
                order
            });
            
            console.log(`成功获取${scenicData.rows.length}/${scenicData.count}条景点数据`);
        } catch (dbError) {
            console.error('数据库查询景点列表失败:', dbError);
            // 不抛出错误，继续处理，返回空结果
            scenicData = { count: 0, rows: [] };
        }
        
        // 安全格式化数据
        const formattedScenics = [];
        for (const scenic of scenicData.rows) {
            try {
                const formattedScenic = formatScenicData(scenic);
                formattedScenics.push(formattedScenic);
            } catch (formatError) {
                console.error(`格式化景点数据失败，景点ID: ${scenic.scenic_id || '未知'}:`, formatError);
                // 添加简化版
                formattedScenics.push({
                    id: scenic.scenic_id || 0,
                    name: scenic.name || '未知景点',
                    city: scenic.city || '未知城市',
                    address: scenic.address || '',
                    hotScore: scenic.hot_score || 0
                });
            }
        }
        
        // 返回标准化响应
        console.log(`返回${formattedScenics.length}条格式化景点数据`);
        
        res.status(200).json({ 
            success: true,
            items: formattedScenics, 
            total: scenicData.count, 
            page: safePage,
            pageSize: safeLimit,
            message: formattedScenics.length > 0 ? '成功获取景点列表' : '暂无符合条件的景点'
        });
    } catch (err) {
        console.error('获取景点列表处理失败:', err);
        // 避免500错误，返回友好的错误响应
        res.status(200).json({
            success: false,
            message: '获取景点列表失败，服务器内部错误',
            items: [],
            total: 0,
            page: 1,
            pageSize: 12,
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

// 获取景点详情
exports.getScenicDetail = async (req, res, next) => {
    try {
        const scenicId = req.params.id;
        console.log(`获取景点详情，ID: ${scenicId}`);
        
        // 默认空数据结构
        let detailData = {
            id: 0,
            name: '未知景点',
            city: '',
            address: '',
            description: '',
            openTime: '',
            ticketPrice: 0,
            price: 0,
            images: [],
            coverImage: null,
            hotScore: 0,
            label: '',
            nearbySpots: [],
            reviews: []
        };
        
        try {
            // 查询景点详情
            const scenic = await Scenic.findByPk(scenicId);
            
            if (!scenic) {
                console.log(`未找到ID为${scenicId}的景点`);
                return res.status(200).json({
                    success: false,
                    message: '未找到该景点',
                    data: detailData
                });
            }
            
            // --- 正确处理 images 字段 ---
            let imagesArray = [];
            if (scenic.images) {
                if (Array.isArray(scenic.images)) { // ORM 可能已经解析为数组
                    imagesArray = scenic.images;
                } else if (typeof scenic.images === 'string') {
                    imagesArray = safeJsonParse(scenic.images);
                }
                // 如果 scenic.images 不是数组也不是字符串，则 imagesArray 保持为空数组
            }
            // --- 结束处理 images 字段 ---

            // 确保价格是有效数值
            const ticketPrice = scenic.ticket_price !== undefined ? parseFloat(scenic.ticket_price) : null;
            const safeTicketPrice = ticketPrice !== null && !isNaN(ticketPrice) ? ticketPrice : null;

            // 构造响应数据
            detailData = {
                id: scenic.scenic_id,
                name: scenic.name,
                city: scenic.city,
                address: scenic.address,
                description: scenic.description,
                openTime: scenic.open_time, // 使用转换后的字段名
                ticketPrice: safeTicketPrice, // 使用安全解析的票价
                price: safeTicketPrice, // 确保price字段与ticketPrice保持一致
                images: imagesArray, // 使用处理后的数组
                // 使用第一张图片作为封面，如果 imagesArray 为空则为 null
                coverImage: imagesArray.length > 0 ? imagesArray[0] : null, 
                hotScore: scenic.hot_score,
                label: scenic.label,
                // 模拟数据：附近景点 (保留或根据实际逻辑修改)
                nearbySpots: [
                    { id: 1, name: '附近景点1', distance: '1.2公里' },
                    { id: 2, name: '附近景点2', distance: '2.5公里' },
                    { id: 3, name: '附近景点3', distance: '3.8公里' }
                ],
                // 模拟数据：评论 (保留或根据实际逻辑修改)
                reviews: [
                    { 
                        id: 1, 
                        userId: 101, 
                        username: '用户A', 
                        avatar: 'https://placehold.co/50', 
                        content: '很棒的景点，值得一游！',
                        rating: 5,
                        createdAt: '2023-05-20'
                    },
                    { 
                        id: 2, 
                        userId: 102, 
                        username: '用户B', 
                        avatar: 'https://placehold.co/50', 
                        content: '风景优美，服务一般。',
                        rating: 4,
                        createdAt: '2023-06-15'
                    }
                ]
            };
            
        } catch (dbError) {
            console.error(`数据库查询景点详情失败 (ID: ${scenicId}):`, dbError);
            // 使用默认空数据结构
        }
        
        // 返回成功响应，即使是空数据
        console.log(`返回景点详情数据，ID: ${scenicId}, 名称: ${detailData.name}`);
        res.status(200).json({
            success: true,
            data: detailData
        });
        
    } catch (err) {
        // 添加更详细的错误日志
        console.error(`获取景点详情处理失败 (ID: ${req.params.id}):`, err);
        // 避免500错误，返回友好的错误响应和默认数据
        res.status(200).json({
            success: false,
            message: '获取景点详情失败，服务器内部错误',
            data: {
                id: 0,
                name: '未知景点',
                city: '',
                address: '',
                description: '',
                openTime: '',
                ticketPrice: 0,
                images: [],
                coverImage: null,
                hotScore: 0,
                label: '',
                nearbySpots: [],
                reviews: []
            },
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

// 获取热门景点
exports.getHotScenics = async (req, res, next) => {
    const { limit = 6 } = req.query;
    
    try {
        console.log(`开始获取热门景点，限制数量: ${limit}`);
        
        // 确保limit是有效的数字
        const parsedLimit = parseInt(limit, 10);
        const safeLimit = isNaN(parsedLimit) || parsedLimit <= 0 ? 6 : parsedLimit;
        
        // 添加日志以帮助调试
        console.log(`执行热门景点查询，限制为 ${safeLimit} 条记录`);
        
        // 尝试获取热门景点
        let hotScenics = [];
        try {
            hotScenics = await Scenic.findAll({
                order: [['hot_score', 'DESC']],
                limit: safeLimit
            });
            
            console.log(`成功获取 ${hotScenics.length} 条热门景点记录`);
        } catch (dbError) {
            console.error('数据库查询热门景点失败:', dbError);
            // 不抛出错误，继续处理，返回空数组
            hotScenics = [];
        }
        
        // 防止hotScenics为null
        if (!hotScenics) {
            console.warn('热门景点查询返回null，使用空数组代替');
            hotScenics = [];
        }
        
        // 安全处理数据格式化
        const formattedScenics = [];
        for (const scenic of hotScenics) {
            try {
                const formattedScenic = formatScenicData(scenic);
                formattedScenics.push(formattedScenic);
            } catch (formatError) {
                console.error(`格式化景点数据失败，景点ID: ${scenic.scenic_id || '未知'}:`, formatError);
                // 如果格式化失败，使用简化数据
                formattedScenics.push({
                    id: scenic.scenic_id || 0,
                    name: scenic.name || '未知景点',
                    city: scenic.city || '未知城市',
                    hotScore: scenic.hot_score || 0
                });
            }
        }
        
        // 即使查询返回空结果也返回成功响应
        console.log(`最终返回 ${formattedScenics.length} 条格式化后的热门景点`);
        
        // 确保返回一个统一的数据格式
        res.status(200).json({
            success: true,
            message: formattedScenics.length > 0 ? '成功获取热门景点' : '暂无热门景点数据',
            data: formattedScenics,
            total: formattedScenics.length
        });
    } catch (err) {
        console.error('获取热门景点处理失败:', err);
        // 避免500错误，返回友好的错误响应
        res.status(200).json({
            success: false,
            message: '获取热门景点失败，服务器内部错误',
            data: [],
            total: 0,
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

// 获取城市列表
exports.getCities = async (req, res, next) => {
    try {
        console.log('获取城市列表开始');
        let cities = [];
        
        try {
            const results = await Scenic.findAll({
                attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('city')), 'city']],
                order: [['city', 'ASC']],
                raw: true
            });
            
            // 提取城市名称
            const rawCities = results.map(c => c.city).filter(Boolean);
            
            // 标准化城市名称（去除"市"后缀）
            const normalizedCities = rawCities.map(city => {
                // 使用正则移除"市"后缀
                return city.replace(/市$/, '');
            });
            
            // 去重
            cities = [...new Set(normalizedCities)].sort();
            
            console.log(`成功获取${cities.length}个城市（标准化处理后）`);
        } catch (dbError) {
            console.error('数据库查询城市列表失败:', dbError);
            // 使用空数组作为降级
            cities = [];
        }
        
        res.status(200).json(cities);
    } catch (err) {
        console.error('获取城市列表处理失败:', err);
        // 返回空数组而非错误
        res.status(200).json([]);
    }
};

// 获取标签列表
exports.getLabels = async (req, res, next) => {
    try {
        console.log('获取标签列表开始');
        let labels = [];
        
        try {
            const results = await Scenic.findAll({
                attributes: ['label'],
                raw: true
            });
            
            // 处理标签：去重、拆分
            const allLabels = new Set();
            
            results.forEach(item => {
                if (item && item.label && typeof item.label === 'string') {
                    item.label.split(',').forEach(label => {
                        const trimmedLabel = label.trim();
                        if (trimmedLabel) {
                            allLabels.add(trimmedLabel);
                        }
                    });
                }
            });
            
            labels = Array.from(allLabels).sort();
            console.log(`成功获取${labels.length}个标签`);
        } catch (dbError) {
            console.error('数据库查询标签列表失败:', dbError);
            // 使用空数组作为降级
            labels = [];
        }
        
        res.status(200).json(labels);
    } catch (err) {
        console.error('获取标签列表处理失败:', err);
        // 返回空数组而非错误
        res.status(200).json([]);
    }
};

// 新增：获取热门城市列表
exports.getPopularCities = async (req, res, next) => {
    // 从查询参数获取 limit，默认为 10
    let limit = parseInt(req.query.limit, 10);
    // 验证 limit 是否为有效正整数
    if (isNaN(limit) || limit <= 0) {
        limit = 10; // 无效则使用默认值
    }

    try {
        console.log(`获取热门城市列表，limit=${limit}`);
        let popularCities = [];
        
        try {
            // 获取原始城市数据
            const rawCities = await Scenic.findAll({
                attributes: [
                    'city',
                    // 统计每个城市的景点数量，别名为 scenicCount
                    [fn('COUNT', col('scenic_id')), 'scenicCount'] 
                ],
                group: ['city'], // 按城市分组
                order: [
                    // 按景点数量降序排列
                    [fn('COUNT', col('scenic_id')), 'DESC'] 
                ],
                raw: true // 获取原始数据
            });
            
            // 标准化城市名称和合并计数
            const cityCountMap = {};
            
            rawCities.forEach(item => {
                if (item && item.city) {
                    // 标准化城市名（去除"市"后缀）
                    const normalizedCity = item.city.replace(/市$/, '');
                    
                    // 如果已存在，增加计数；否则初始化
                    if (cityCountMap[normalizedCity]) {
                        cityCountMap[normalizedCity] += parseInt(item.scenicCount, 10);
                    } else {
                        cityCountMap[normalizedCity] = parseInt(item.scenicCount, 10);
                    }
                }
            });
            
            // 转换为数组并排序
            popularCities = Object.entries(cityCountMap)
                .map(([city, scenicCount]) => ({ city, scenicCount }))
                .sort((a, b) => b.scenicCount - a.scenicCount)
                .slice(0, limit); // 应用数量限制
            
            console.log(`成功获取${popularCities.length}个热门城市（标准化处理后）`);
        } catch (dbError) {
            console.error('数据库查询热门城市失败:', dbError);
            // 使用空数组作为降级结果
            popularCities = [];
        }

        res.status(200).json({
            success: true,
            data: popularCities,
            total: popularCities.length
        });
    } catch (err) {
        console.error('获取热门城市列表处理失败:', err);
        // 返回空数组而非错误
        res.status(200).json({
            success: false,
            message: '获取热门城市列表失败',
            data: [],
            total: 0
        });
    }
};

// 新增：提交景点评价
exports.submitReview = async (req, res, next) => {
    const scenicId = req.params.id; 
    const { rating, content } = req.body; 
    const userId = req.user.id; // 从 protect 中间件获取用户ID

    // 1. 输入验证
    if (rating === undefined || typeof rating !== 'number' || rating < 1 || rating > 5) {
        return res.status(400).json({ message: '评分必须是1到5之间的数字' });
    }
    if (!content || typeof content !== 'string' || content.trim() === '') {
        return res.status(400).json({ message: '评论内容不能为空' });
    }

    try {
        // 2. 检查景点是否存在
        const scenic = await Scenic.findByPk(scenicId);
        if (!scenic) {
            return res.status(404).json({ message: '未找到该景点' });
        }

        // 3. 创建评论
        const newReview = await Review.create({
            scenic_id: scenicId,
            user_id: userId,
            rating: rating,
            content: content.trim()
        });

        // 4. 返回成功响应
        res.status(201).json(newReview);

    } catch (err) {
        console.error(`提交景点评价失败 (Scenic ID: ${scenicId}, User ID: ${userId}):`, err);
        // 传递错误给下一个中间件
        next(err);
    }
};

// 获取景点详情
exports.getScenicById = async (req, res, next) => {
    const { id } = req.params;
    try {
        const scenic = await Scenic.findByPk(id);
        if (!scenic) {
            return res.status(404).json({
                code: 404,
                message: '景点不存在'
            });
        }
        res.status(200).json(formatScenicData(scenic));
    } catch (err) {
        console.error('获取景点详情失败:', err);
        next(err);
    }
};

// 新增：获取景点相关的地域文化分类
exports.getScenicCulturalRegions = async (req, res, next) => {
    // 这些数据可以从数据库查询，或者像之前 culturalController 那样硬编码
    // 这里为了简化，直接使用硬编码的数据
    const scenicCulturalRegions = [
        {
            value: 'guangfu',
            label: '广府文化',
            icon: 'BankOutlined', // 前端需要映射到 Antd 图标组件
            description: '岭南地区，开放包容，务实创新'
        },
        {
            value: 'jiangnan',
            label: '江南文化',
            icon: 'CompassOutlined',
            description: '精致典雅，园林水乡，丝竹茶艺'
        },
        {
            value: 'bashu',
            label: '巴蜀文化',
            icon: 'GlobalOutlined', // 假设用 GlobalOutlined
            description: '麻辣鲜香，三国遗迹，大熊猫故乡'
        },
        {
            value: 'guandong',
            label: '关东文化',
            icon: 'EnvironmentOutlined', // 假设用 EnvironmentOutlined
            description: '豪爽热情，融合满族、朝鲜族文化'
        },
        {
            value: 'xiyu',
            label: '西域文化',
            icon: 'InfoCircleOutlined', // 假设用 InfoCircleOutlined
            description: '丝路枢纽，多元宗教与民族融合'
        },
        {
            value: 'zhongyuan',
            label: '中原文化',
            icon: 'HistoryOutlined',
            description: '华夏摇篮，历史底蕴深厚，文化传承'
        },
        {
            value: 'jingjinji', // 修正 value 以匹配前端 Home.tsx (可能)
            label: '京津冀文化',
            icon: 'BankOutlined', // 假设
            description: '政治中心，宫廷与民间文化交织'
        },
        {
            value: 'minyue',
            label: '闽越文化',
            icon: 'BankOutlined', // 假设
            description: '海洋文化，宗教信仰，民俗传统'
        }
    ];

    try {
        res.status(200).json({
            message: '获取景点地域文化分类成功',
            items: scenicCulturalRegions
        });
    } catch (error) {
        console.error('获取景点地域文化分类失败:', error);
        next(error);
    }
};

// 获取景点筛选条件（例如：所有城市、标签）
exports.getScenicFilters = async (req, res, next) => {
    try {
        console.log('开始获取景点筛选条件');
        
        // 查询城市列表
        let cities = [];
        try {
            const cityResults = await Scenic.findAll({
                attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('city')), 'city']],
                order: [['city', 'ASC']],
                raw: true
            });
            
            // 提取城市名称
            const rawCities = cityResults.map(c => c.city).filter(Boolean);
            
            // 标准化城市名称（去除"市"后缀）
            const normalizedCities = rawCities.map(city => city.replace(/市$/, ''));
            
            // 去重
            cities = [...new Set(normalizedCities)].sort();
            
            console.log(`成功获取${cities.length}个城市`);
        } catch (dbError) {
            console.error('获取城市列表失败:', dbError);
            cities = [];
        }
        
        // 查询标签列表
        let labels = [];
        try {
            const labelResults = await Scenic.findAll({
                attributes: ['label'],
                raw: true
            });
            
            // 处理标签：去重、拆分
            const allLabels = new Set();
            
            labelResults.forEach(item => {
                if (item && item.label && typeof item.label === 'string') {
                    item.label.split(',').forEach(label => {
                        const trimmedLabel = label.trim();
                        if (trimmedLabel) {
                            allLabels.add(trimmedLabel);
                        }
                    });
                }
            });
            
            labels = Array.from(allLabels).sort();
            console.log(`成功获取${labels.length}个标签`);
        } catch (dbError) {
            console.error('获取标签列表失败:', dbError);
            labels = [];
        }
        
        // 文化价值等级（硬编码）
        const culturalValueLevels = [
            { value: 'national', label: '国家级文化遗产', color: '#f5222d' },
            { value: 'provincial', label: '省级文化遗产', color: '#fa8c16' },
            { value: 'municipal', label: '市级文化遗产', color: '#52c41a' },
            { value: 'general', label: '一般文化景点', color: '#1890ff' }
        ];
        
        // 时间轴选项（硬编码）
        const timeAxisOptions = [
            { value: 'prehistoric', label: '史前文明', icon: 'HistoryOutlined', description: '包括半坡、河姆渡等史前文明遗址' },
            { value: 'ancient', label: '古代文明 (夏商周-明清)', icon: 'HistoryOutlined', description: '从夏商周到明清的古代文明' },
            { value: 'modern', label: '近现代历程 (1840-1949)', icon: 'HistoryOutlined', description: '红色文化、工业遗产等' },
            { value: 'contemporary', label: '当代创新', icon: 'HistoryOutlined', description: '现代艺术、科技文化' }
        ];
        
        // 地域文化矩阵（硬编码）
        const regionOptions = [
            { value: 'guangfu', label: '广府文化', icon: 'GlobalOutlined', description: '岭南特色文化' },
            { value: 'jiangnan', label: '江南文化', icon: 'GlobalOutlined', description: '江南地区特色文化' },
            { value: 'bashu', label: '巴蜀文化', icon: 'GlobalOutlined', description: '四川盆地特色文化' },
            { value: 'guandong', label: '关东文化', icon: 'GlobalOutlined', description: '东北地区特色文化' },
            { value: 'xiyu', label: '西域文化', icon: 'GlobalOutlined', description: '新疆等西北地区特色文化' }
        ];
        
        // 文化形态体系（硬编码）
        const culturalFormOptions = [
            { value: 'material', label: '物质文化遗产', icon: 'CrownOutlined', description: '建筑、遗址、文物等' },
            { value: 'intangible', label: '非物质文化遗产', icon: 'CrownOutlined', description: '技艺、民俗、节庆等' }
        ];
        
        // 特色标签（硬编码）
        const secondaryThemes = [
            { value: 'red_culture', label: '红色文化', parentTheme: 'modern', icon: 'AppstoreOutlined' },
            { value: 'religious', label: '宗教文化', parentTheme: 'all', icon: 'AppstoreOutlined' },
            { value: 'food', label: '饮食文化', parentTheme: 'all', icon: 'AppstoreOutlined' },
            { value: 'industrial', label: '工业文明', parentTheme: 'modern', icon: 'AppstoreOutlined' },
            { value: 'literature', label: '文学艺术', parentTheme: 'all', icon: 'AppstoreOutlined' }
        ];
        
        const response = {
            cities,
            labels,
            culturalValueLevels,
            timeAxisOptions,
            regionOptions,
            culturalFormOptions,
            secondaryThemes
        };
        
        res.status(200).json({
            success: true,
            data: response,
            message: '成功获取筛选条件'
        });
    } catch (err) {
        console.error('获取筛选条件失败:', err);
        res.status(200).json({
            success: false,
            message: '获取筛选条件失败',
            data: {
                cities: [],
                labels: [],
                culturalValueLevels: [],
                timeAxisOptions: [],
                regionOptions: [],
                culturalFormOptions: [],
                secondaryThemes: []
            }
        });
    }
};

// 创建新景点 (Admin)
exports.createScenic = async (req, res, next) => {
    const { name, city, address, description, open_time, ticket_price, images, label, latitude, longitude } = req.body;

    // 基本验证
    if (!name || !city || !address || !description || !open_time || !ticket_price || !images || !label) {
        return res.status(400).json({ message: '缺少必要的景点信息' });
    }

    try {
        let scenicLatitude = latitude;
        let scenicLongitude = longitude;

        // 如果没有提供经纬度，但提供了地址，则尝试地理编码
        if ((scenicLatitude === undefined || scenicLongitude === undefined || scenicLatitude === null || scenicLongitude === null) && address) {
            console.log(`[ScenicController] Coordinates not provided for "${name}", attempting geocoding for address: "${address}"`);
            const coordinates = await getCoordinatesFromAddress(address);
            if (coordinates) {
                [scenicLongitude, scenicLatitude] = coordinates; // 返回的是 [经度, 纬度]
            }
        }

        const newScenic = await Scenic.create({
            name,
            city,
            address,
            description,
            open_time,
            ticket_price,
            images: images, // Sequelize 会自动处理 JSON 序列化
            label,
            latitude: scenicLatitude, // 使用获取到的或传入的纬度
            longitude: scenicLongitude, // 使用获取到的或传入的经度
            // hot_score 默认为 0
        });
        res.status(201).json(newScenic);
    } catch (err) {
        console.error('创建景点失败:', err);
        next(err);
    }
};

// 更新景点信息 (Admin)
exports.updateScenic = async (req, res, next) => {
    const { id } = req.params;
    const { name, city, address, description, open_time, ticket_price, images, label, latitude, longitude, hot_score } = req.body;

    try {
        const scenic = await Scenic.findByPk(id);
        if (!scenic) {
            return res.status(404).json({ message: '景点不存在' });
        }

        let scenicLatitude = latitude !== undefined ? latitude : scenic.latitude;
        let scenicLongitude = longitude !== undefined ? longitude : scenic.longitude;
        let needsGeocoding = false;

        // 检查是否需要重新地理编码：
        // 1. 地址已更改
        // 2. 未提供新坐标，但旧坐标为空
        if (address && address !== scenic.address) {
             needsGeocoding = true;
             console.log(`[ScenicController] Address changed for "${scenic.name}", will re-geocode.`);
        } else if ((latitude === undefined || longitude === undefined || latitude === null || longitude === null) && (!scenic.latitude || !scenic.longitude)) {
             needsGeocoding = true;
             console.log(`[ScenicController] Coordinates missing for "${scenic.name}", attempting geocoding.`);
        }
        
        if (needsGeocoding && address) { // 只在需要且有地址时编码
            const coordinates = await getCoordinatesFromAddress(address || scenic.address); // 优先用新地址
            if (coordinates) {
                [scenicLongitude, scenicLatitude] = coordinates;
            }
        }

        // 更新字段
        scenic.name = name !== undefined ? name : scenic.name;
        scenic.city = city !== undefined ? city : scenic.city;
        scenic.address = address !== undefined ? address : scenic.address;
        scenic.description = description !== undefined ? description : scenic.description;
        scenic.open_time = open_time !== undefined ? open_time : scenic.open_time;
        scenic.ticket_price = ticket_price !== undefined ? ticket_price : scenic.ticket_price;
        scenic.images = images !== undefined ? images : scenic.images;
        scenic.label = label !== undefined ? label : scenic.label;
        scenic.hot_score = hot_score !== undefined ? hot_score : scenic.hot_score;
        scenic.latitude = scenicLatitude; // 更新坐标
        scenic.longitude = scenicLongitude;

        await scenic.save();
        res.json(scenic);
    } catch (err) {
        console.error(`更新景点 ${id} 失败:`, err);
        next(err);
    }
};

// 删除景点 (Admin)
exports.deleteScenic = async (req, res, next) => {
    const { id } = req.params;
    try {
        const scenic = await Scenic.findByPk(id);
        if (!scenic) {
            return res.status(404).json({ message: '景点不存在' });
        }
        // TODO: 检查是否有其他关联（如 Booking）阻止删除？
        // FeatureRouteSpot 会级联删除
        await scenic.destroy();
        res.status(200).json({ message: '景点已删除' });
    } catch (err) {
        console.error(`删除景点 ${id} 失败:`, err);
        next(err);
    }
};

// 搜索景点，用于路线景点选择
exports.searchScenicSpots = async (req, res) => {
  try {
    const { keyword } = req.query;
    
    if (!keyword || keyword.length < 2) {
      return res.status(400).json({ 
        success: false, 
        message: '搜索关键词至少需要2个字符' 
      });
    }
    
    // 使用 Op.like 进行模糊搜索
    const results = await Scenic.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: `%${keyword}%` } },
          { city: { [Op.like]: `%${keyword}%` } },
          { address: { [Op.like]: `%${keyword}%` } }
        ]
      },
      attributes: [
        'scenic_id', 'name', 'city', 'address', 
        'latitude', 'longitude', 'description',
        [sequelize.fn('SUBSTRING_INDEX', sequelize.col('images'), ',', 1), 'imageUrl']
      ],
      limit: 10,
      order: [
        ['hot_score', 'DESC'],
        ['name', 'ASC']
      ]
    });
    
    // 格式化结果
    const formattedResults = results.map(scenic => {
      const item = scenic.toJSON();
      
      // 处理图片URL
      if (item.imageUrl) {
        try {
          // 如果images存储为JSON字符串，解析并获取第一张图片
          const parsedImages = JSON.parse(item.imageUrl.replace(/[\[\]]/g, '').split(',')[0]);
          item.imageUrl = parsedImages[0] || null;
        } catch (e) {
          // 如果解析失败，使用原始值或设为null
          item.imageUrl = item.imageUrl || null;
        }
      }
      
      // 添加location字段，方便前端使用
      if (item.longitude && item.latitude) {
        item.location = [item.longitude, item.latitude];
      } else {
        item.location = null;
      }
      
      return item;
    });
    
    res.status(200).json({
      success: true,
      data: formattedResults,
      message: `搜索到${formattedResults.length}个景点`
    });
    
  } catch (error) {
    console.error('搜索景点出错：', error);
    res.status(500).json({
      success: false,
      message: '搜索景点时发生错误',
      error: error.message
    });
  }
};

// 删除这个冗余的导出块
/*
// 导出所有控制器方法
exports.getScenics = exports.getScenics;
exports.getScenicDetail = exports.getScenicDetail;
exports.getHotScenics = exports.getHotScenics;
exports.getCities = exports.getCities; // 确保导出 getCities
exports.getLabels = exports.getLabels; // 确保导出 getLabels
exports.createScenic = exports.createScenic; // 确保导出 createScenic
exports.updateScenic = exports.updateScenic; // 确保导出 updateScenic
exports.deleteScenic = exports.deleteScenic; // 确保导出 deleteScenic
exports.submitReview = submitReview; // 导出新增的 submitReview
exports.getScenicCulturalRegions = exports.getScenicCulturalRegions; // 确保导出 getScenicCulturalRegions
*/ 