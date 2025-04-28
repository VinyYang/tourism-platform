/**
 * 攻略控制器
 * 处理攻略相关的 API 请求
 */

const { Op } = require('sequelize');
// const { sequelize } = require('../config/db.js'); // 不再需要单独导入 sequelize
// const Strategy = require('../models/Strategy')(sequelize);
// const User = require('../models/User')(sequelize); // 需要关联 User 获取作者信息
// const Scenic = require('../models/Scenic')(sequelize); // 需要关联 Scenic 获取相关景点
// const UserPreference = require('../models/UserPreference')(sequelize);
// const CustomizedItinerary = require('../models/CustomizedItinerary')(sequelize);
// const ItineraryItem = require('../models/ItineraryItem')(sequelize);
// const Hotel = require('../models/Hotel')(sequelize);
// const Review = require('../models/Review')(sequelize);
// const StrategyLike = require('../models/StrategyLike')(sequelize);
// const Favorite = require('../models/Favorite')(sequelize); // 需要 Favorite 处理收藏

// 从 models/index.js 导入已关联的模型
const { 
    Strategy, 
    User, 
    Scenic, 
    Review, 
    StrategyLike, 
    Favorite, 
    sequelize // 如果需要直接使用 sequelize 方法
} = require('../models');

// 辅助函数：格式化攻略数据
const formatStrategyData = (strategy, author = null, favoriteCount = 0) => {
    let tagsArray = [];
    if (strategy.tags && typeof strategy.tags === 'string') {
        tagsArray = strategy.tags.split(',').map(t => t.trim()).filter(Boolean);
    }

    const formatted = {
        id: strategy.strategy_id,
        title: strategy.title,
        summary: strategy.content.substring(0, 100) + '...', // 截取部分内容作为摘要
        content: strategy.content,
        coverImage: strategy.cover_image,
        createdAt: strategy.created_at,
        viewCount: strategy.view_count,
        likeCount: strategy.like_count,
        // commentCount: 0, // 需要关联查询或单独计算
        favoriteCount: favoriteCount,
        type: strategy.type,
        city: strategy.city,
        tags: tagsArray,
        author: author ? {
            id: author.user_id,
            username: author.username,
            avatar: author.avatar
        } : null,
        // 兼容旧字段
        authorName: author ? author.username : '匿名',
        authorAvatar: author ? author.avatar : 'https://placehold.co/50'
    };
    return formatted;
};

// 获取攻略列表
exports.getStrategies = async (req, res, next) => {
    const { page = 1, limit = 10, keyword, city, type, tag, sortBy } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = { status: 'published' }; // 只获取已发布的
    if (keyword) {
        whereClause[Op.or] = [
            { title: { [Op.like]: `%${keyword}%` } },
            { content: { [Op.like]: `%${keyword}%` } }
        ];
    }
    if (city) {
        whereClause.city = city;
    }
    if (type) {
        whereClause.type = type;
    }
    if (tag) {
        whereClause.tags = { [Op.like]: `%${tag}%` }; // 模糊匹配
    }

    // 排序逻辑
    const order = [];
    const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';
    switch (sortBy) {
        case 'time':
            order.push(['created_at', sortOrder]);
            break;
        case 'views':
            order.push(['view_count', sortOrder]);
            break;
        case 'likes':
            order.push(['like_count', sortOrder]);
            break;
        default: // 默认按创建时间降序
            order.push(['created_at', 'DESC']);
            break;
    }
    order.push(['strategy_id', 'ASC']); // 保证排序稳定性

    try {
        const { count, rows } = await Strategy.findAndCountAll({
            where: whereClause,
            include: [
                { model: User, as: 'author', attributes: ['user_id', 'username', 'avatar'] }, // 关联作者信息
                { model: Favorite, attributes: [] } // 关联 Favorite 用于计数，但不选择任何字段
            ],
            limit: parseInt(limit),
            offset: offset,
            order: order,
            group: ['Strategy.strategy_id'] // 需要 group by 才能正确计数 hasMany 关联
        });

        // 由于 group by，count 可能不是总数，需要重新查询总数
        const totalCount = await Strategy.count({ where: whereClause });

        // 格式化数据，手动计算 favoriteCount
        const formattedStrategies = rows.map(strategy => {
            // 手动计算 favoriteCount (如果 include Favorite)
            const favoriteCount = strategy.Favorites ? strategy.Favorites.length : 0; 
            return formatStrategyData(strategy, strategy.author, favoriteCount);
        });

        res.json({
            strategies: formattedStrategies, // 兼容旧 key
            items: formattedStrategies,
            total: totalCount, // 使用重新查询的总数
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalCount / parseInt(limit))
        });
    } catch (err) {
        console.error("获取攻略列表失败:", err);
        next(err);
    }
};

// 获取攻略详情
exports.getStrategyById = async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user?.id;

    try {
        const strategy = await Strategy.findByPk(id, {
            include: [
                { model: User, as: 'author', attributes: ['user_id', 'username', 'avatar'] },
                {
                    model: Review,
                    as: 'comments', // 使用模型定义的别名
                    where: { item_type: 'strategy' }, // 移除status字段，只保留item_type筛选
                    required: false, // 使用 left join，即使没有评论也返回攻略
                    include: [
                        { model: User, as: 'author', attributes: ['user_id', 'username', 'avatar'] } // 包含评论的作者信息
                    ],
                    order: [['created_at', 'DESC']], // 按创建时间降序排序评论
                    limit: 10 // 可以限制初始加载的评论数量，或进行分页
                }
            ]
        });

        if (!strategy || strategy.status !== 'published') {
            return res.status(404).json({ message: '攻略不存在或未发布', code: 404 });
        }

        // 更新浏览量
        strategy.increment('view_count').catch(console.error);

        // 获取点赞和收藏状态 (需要 userId)
        let isLiked = false;
        let isFavorite = false;
        if (userId) {
            const like = await StrategyLike.findOne({ where: { user_id: userId, strategy_id: id } });
            isLiked = !!like;
            const favorite = await Favorite.findOne({ where: { user_id: userId, strategy_id: id, item_type: 'strategy' } });
            isFavorite = !!favorite;
        }

        // 获取评论总数
        const commentCount = await Review.count({ where: { strategy_id: id, item_type: 'strategy' } });
        // 获取收藏总数
        const favoriteCount = await Favorite.count({ where: { strategy_id: id, item_type: 'strategy' } });

        // 获取相关景点
        const relatedScenics = await Scenic.findAll({
            where: { city: strategy.city },
            order: [['hot_score', 'DESC']],
            limit: 3
        });

        // 格式化评论
        const formattedComments = (strategy.comments || []).map(comment => ({
            id: comment.review_id,
            content: comment.content,
            rating: comment.rating,
            createdAt: comment.created_at,
            author: comment.author ? {
                id: comment.author.user_id,
                username: comment.author.username,
                avatar: comment.author.avatar
            } : null
        }));

        // 格式化攻略数据, 传入 strategy.author
        const formattedStrategy = formatStrategyData(strategy, strategy.author);

        // 创建适合前端的响应格式，确保包含必要的id字段
        const responseData = {
            id: strategy.strategy_id, // 确保有id字段
            strategy_id: strategy.strategy_id, // 同时保留原始字段名
            title: strategy.title,
            summary: strategy.content ? strategy.content.substring(0, 100) + '...' : '', 
            content: strategy.content,
            coverImage: strategy.cover_image, // 前端期望的格式
            cover_image: strategy.cover_image, // 保留原始字段名
            createdAt: strategy.created_at,
            created_at: strategy.created_at, // 保留原始字段名
            viewCount: strategy.view_count + 1, // 使用数据库更新后的值
            view_count: strategy.view_count + 1, // 保留原始字段名
            likeCount: strategy.like_count,
            like_count: strategy.like_count, // 保留原始字段名
            commentCount: commentCount,
            favoriteCount: favoriteCount,
            isLiked,
            isFavorite,
            type: strategy.type,
            city: strategy.city,
            tags: strategy.tags ? strategy.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
            author: strategy.author ? {
                id: strategy.author.user_id,
                username: strategy.author.username,
                avatar: strategy.author.avatar
            } : null,
            // 兼容旧字段
            authorName: strategy.author ? strategy.author.username : '匿名',
            authorAvatar: strategy.author ? strategy.author.avatar : 'https://placehold.co/50',
            relatedScenics: relatedScenics.map(s => ({ 
                id: s.scenic_id,
                name: s.name,
                // 安全地处理 images 字段，假设它可能是数组或字符串
                coverImage: (Array.isArray(s.images) && s.images.length > 0) ? s.images[0] : (typeof s.images === 'string' ? s.images : ''), 
                city: s.city,
                price: s.ticket_price,
                rating: s.hot_score // 使用 hot_score
            })), 
            comments: formattedComments
        };

        // 输出调试日志
        console.log('攻略详情响应:', {
            id: responseData.id, 
            strategy_id: responseData.strategy_id,
            title: responseData.title
        });

        res.json(responseData);
    } catch (err) {
        console.error(`获取攻略详情 ${id} 失败:`, err);
        next(err);
    }
};

// 获取热门攻略
exports.getHotStrategies = async (req, res, next) => {
    const { limit = 6 } = req.query;
    try {
        const hotStrategies = await Strategy.findAll({
            where: { status: 'published' },
            include: [
                { model: User, as: 'author', attributes: ['user_id', 'username', 'avatar'] }
            ],
            order: [['view_count', 'DESC'], ['like_count', 'DESC'], ['created_at', 'DESC']],
            limit: parseInt(limit)
        });
        // 修改返回数据格式，加上data属性包裹数组
        res.json({
            success: true,
            data: hotStrategies.map(strategy => formatStrategyData(strategy, strategy.author))
        });
    } catch (err) {
        console.error("获取热门攻略失败:", err);
        next(err);
    }
};

// 获取相关攻略 (简化逻辑：获取同城攻略)
exports.getRelatedStrategies = async (req, res, next) => {
    const { id } = req.params;
    const { limit = 4 } = req.query;
    try {
        const currentStrategy = await Strategy.findByPk(id, { attributes: ['city'] });
        if (!currentStrategy) {
            return res.json([]); // 如果原攻略不存在，返回空
        }

        const relatedStrategies = await Strategy.findAll({
            where: {
                status: 'published',
                city: currentStrategy.city,
                strategy_id: { [Op.ne]: id } // 排除自身
            },
            include: [
                { model: User, as: 'author', attributes: ['user_id', 'username', 'avatar'] }
            ],
            order: sequelize.random(), // 随机获取同城攻略
            limit: parseInt(limit)
        });
        res.json(relatedStrategies.map(strategy => formatStrategyData(strategy, strategy.author)));
    } catch (err) {
        console.error(`获取相关攻略 ${id} 失败:`, err);
        next(err);
    }
};

// 获取攻略城市
exports.getCities = async (req, res, next) => {
    console.log('>>> 进入 getCities 处理函数'); // 添加日志点 1
    try {
        console.log('>>> 调用 Strategy.findAll 获取 cities'); // 添加日志点 2
        let cities = [];
        
        try {
            // 尝试从数据库获取城市列表
            const dbCities = await Strategy.findAll({
                attributes: [[sequelize.fn('DISTINCT', sequelize.col('city')), 'name']],
                where: { status: 'published' },
                order: [['name', 'ASC']],
                raw: true
            });
            console.log('>>> Strategy.findAll 获取 cities 成功'); // 添加日志点 3
            
            // 转换格式为 {id, name} 结构
            cities = dbCities.map((city, index) => ({ id: index + 1, name: city.name }));
        } catch (err) {
            console.error("从数据库获取城市失败，使用默认数据:", err);
            // 提供默认城市列表
            cities = [
                { id: 1, name: '北京' },
                { id: 2, name: '上海' },
                { id: 3, name: '杭州' },
                { id: 4, name: '成都' },
                { id: 5, name: '三亚' },
                { id: 6, name: '重庆' }
            ];
        }
        
        // 确保返回格式一致的数据
        res.json(cities);
    } catch (err) {
        console.error("获取攻略城市失败:", err);
        // 出错时也返回默认数据，避免前端报错
        res.json([
            { id: 1, name: '北京' },
            { id: 2, name: '上海' },
            { id: 3, name: '杭州' }
        ]);
    } finally {
        console.log('<<< 离开 getCities 处理函数'); // 添加日志点 4
    }
};

// 获取攻略标签
exports.getTags = async (req, res, next) => {
    console.log('>>> 进入 getTags 处理函数'); // 添加日志
    try {
        console.log('>>> 调用 Strategy.findAll 获取 tags'); // 添加日志
        let tags = [];
        
        try {
            // 尝试从数据库获取标签列表
            const dbTags = await Strategy.findAll({
                attributes: [[sequelize.fn('DISTINCT', sequelize.col('tags')), 'name']],
                where: { status: 'published' },
                order: [['name', 'ASC']],
                raw: true
            });
            console.log('>>> Strategy.findAll 获取 tags 成功'); // 添加日志
            
            // 转换格式为 {id, name} 结构
            tags = dbTags.map((tag, index) => ({ id: index + 1, name: tag.name }));
        } catch (err) {
            console.error("从数据库获取标签失败，使用默认数据:", err);
            // 提供默认标签列表
            tags = [
                { id: 1, name: '亲子' },
                { id: 2, name: '娱乐' },
                { id: 3, name: '文化' },
                { id: 4, name: '美食' },
                { id: 5, name: '自然' },
                { id: 6, name: '购物' }
            ];
        }
        
        // 确保返回格式一致的数据
        res.json(tags);
    } catch (err) {
        console.error("获取攻略标签失败:", err);
        // 出错时也返回默认数据，避免前端报错
        res.json([
            { id: 1, name: '亲子' },
            { id: 2, name: '娱乐' },
            { id: 3, name: '文化' }
        ]);
    } finally {
        console.log('<<< 离开 getTags 处理函数'); // 添加日志
    }
};

// 生成推荐行程
exports.generateRecommendedItinerary = async (req, res, next) => {
    const userId = req.user.id;
    const { city, startDate, endDate } = req.body;

    if (!city || !startDate || !endDate) {
        return res.status(400).json({ message: '请提供城市、开始日期和结束日期' });
    }

    try {
        // 检查用户偏好是否存在
        const preference = await UserPreference.findOne({ where: { user_id: userId } });
        if (!preference || !preference.interest) {
            return res.status(400).json({ message: '请先设置您的旅行兴趣偏好' });
        }

        // 调用存储过程
        // 注意：直接调用存储过程可能因数据库权限或 Sequelize 版本而异
        // 方法一：使用 sequelize.query
        const results = await sequelize.query(
            'CALL GenerateItinerary(:userId, :startDate, :endDate, :city)',
            {
                replacements: { userId, startDate, endDate, city },
                type: sequelize.QueryTypes.RAW // 获取原始结果
            }
        );

        // 存储过程可能返回包含 itinerary_id 的结果集
        const newItineraryId = results && results[0] ? results[0].itinerary_id : null;

        if (!newItineraryId) {
            throw new Error('存储过程未能成功生成行程');
        }
        
        // 可以选择返回新生成的行程 ID 或整个行程对象
        // 返回 ID
        // res.status(201).json({ itineraryId: newItineraryId, message: '智能推荐攻略已生成' });

        // 返回完整行程对象 (需要额外查询)
        const newItinerary = await CustomizedItinerary.findByPk(newItineraryId, {
            include: [
                { model: ItineraryItem, include: [Scenic, Hotel] } // 关联查询行程项及详情
            ]
        });
        // TODO: 格式化 newItinerary 数据
        res.status(201).json({ itinerary: newItinerary, message: '智能推荐攻略已生成' });

    } catch (err) {
        console.error('生成推荐行程失败:', err);
        // 特别处理存储过程执行错误
        if (err.original && err.original.sqlMessage) {
             return res.status(500).json({ message: `数据库错误: ${err.original.sqlMessage}` });
        }
        next(err);
    }
};

// 点赞攻略
exports.likeStrategy = async (req, res, next) => {
    const { id: strategyId } = req.params;
    const userId = req.user.id;

    try {
        const strategy = await Strategy.findByPk(strategyId);
        if (!strategy) {
            return res.status(404).json({ message: '攻略不存在' });
        }

        // 使用 findOrCreate 防止重复点赞
        const [like, created] = await StrategyLike.findOrCreate({
            where: { user_id: userId, strategy_id: strategyId },
            defaults: { user_id: userId, strategy_id: strategyId }
        });

        if (!created) {
            return res.status(409).json({ message: '您已点赞过该攻略' });
        }

        // 更新攻略的点赞数
        // 使用 increment 原子操作增加计数
        await strategy.increment('like_count');

        res.status(201).json({ success: true, message: '点赞成功', likeCount: strategy.like_count + 1 });

    } catch (err) {
        console.error(`点赞攻略 ${strategyId} 失败:`, err);
        next(err);
    }
};

// 取消点赞
exports.unlikeStrategy = async (req, res, next) => {
    const { id: strategyId } = req.params;
    const userId = req.user.id;

    try {
        const strategy = await Strategy.findByPk(strategyId);
        if (!strategy) {
             // 即使攻略不存在，也可能需要删除点赞记录 (如果之前点赞过)
             // 但通常认为攻略不存在时，点赞也无意义
            return res.status(404).json({ message: '攻略不存在' });
        }

        // 删除点赞记录
        const deletedCount = await StrategyLike.destroy({
            where: { user_id: userId, strategy_id: strategyId }
        });

        if (deletedCount === 0) {
            return res.status(404).json({ message: '您尚未点赞该攻略' });
        }

        // 更新攻略的点赞数 (原子操作递减)
        // 确保 like_count 不会变为负数 (虽然理论上不应该)
        await strategy.decrement('like_count', { where: { like_count: { [Op.gt]: 0 } } });

        res.json({ success: true, message: '取消点赞成功', likeCount: Math.max(0, strategy.like_count - 1) });

    } catch (err) {
        console.error(`取消点赞攻略 ${strategyId} 失败:`, err);
        next(err);
    }
};

// 收藏攻略
exports.favoriteStrategy = async (req, res, next) => {
    const { id: strategyId } = req.params;
    const userId = req.user.id;

    try {
        const strategy = await Strategy.findByPk(strategyId);
        if (!strategy) {
            return res.status(404).json({ message: '攻略不存在' });
        }

        // 使用 Favorite 控制器中的逻辑 (如果已抽取)
        // 或者直接在这里实现
        const favoriteData = { user_id: userId, item_type: 'strategy', strategy_id: strategyId };
        const [newFavorite, created] = await Favorite.findOrCreate({
            where: favoriteData,
            defaults: favoriteData
        });

        if (!created) {
            return res.status(409).json({ message: '您已收藏过该攻略' });
        }

        // TODO: 更新攻略的收藏数 (如果 Strategy 表有 favorite_count 字段)
        // await strategy.increment('favorite_count');

        res.status(201).json({ success: true, message: '收藏成功' }); // 返回简化信息

    } catch (err) {
        console.error(`收藏攻略 ${strategyId} 失败:`, err);
        next(err);
    }
};

// 取消收藏
exports.unfavoriteStrategy = async (req, res, next) => {
    const { id: strategyId } = req.params;
    const userId = req.user.id;

    try {
        const strategy = await Strategy.findByPk(strategyId);
        // if (!strategy) {
        //     // 即使攻略不存在，也可能需要删除收藏记录
        // }

        // 删除收藏记录
        const deletedCount = await Favorite.destroy({
            where: { user_id: userId, item_type: 'strategy', strategy_id: strategyId }
        });

        if (deletedCount === 0) {
            return res.status(404).json({ message: '您尚未收藏该攻略' });
        }

        // TODO: 更新攻略的收藏数 (如果需要)
        // if (strategy) {
        //     await strategy.decrement('favorite_count', { where: { favorite_count: { [Op.gt]: 0 } } });
        // }

        res.json({ success: true, message: '取消收藏成功' });

    } catch (err) {
        console.error(`取消收藏攻略 ${strategyId} 失败:`, err);
        next(err);
    }
};

// 添加评论
exports.addComment = async (req, res, next) => {
    const { id: strategyId } = req.params;
    const userId = req.user.id;
    const { content, rating } = req.body;

    if (!content || rating === undefined) {
        return res.status(400).json({ message: '请提供评论内容和评分' });
    }
    const parsedRating = parseFloat(rating);
    if (isNaN(parsedRating) || parsedRating < 0 || parsedRating > 5) {
        return res.status(400).json({ message: '评分必须是 0 到 5 之间的数字' });
    }

    try {
        const strategy = await Strategy.findByPk(strategyId);
        if (!strategy) {
            return res.status(404).json({ message: '攻略不存在' });
        }

        const newReview = await Review.create({
            user_id: userId,
            item_type: 'strategy',
            strategy_id: strategyId,
            content,
            rating: parsedRating
        });

        // TODO: 更新攻略的评论数 (如果需要)
        // await strategy.increment('comment_count');

        // 查询新评论并关联作者信息返回
        const reviewWithAuthor = await Review.findByPk(newReview.review_id, {
            include: [{ model: User, as: 'author', attributes: ['user_id', 'username', 'avatar'] }]
        });

        // 格式化评论
        const formattedComment = {
             id: reviewWithAuthor.review_id,
            content: reviewWithAuthor.content,
            rating: reviewWithAuthor.rating,
            createdAt: reviewWithAuthor.created_at,
            author: reviewWithAuthor.author ? {
                id: reviewWithAuthor.author.user_id,
                username: reviewWithAuthor.author.username,
                avatar: reviewWithAuthor.author.avatar
            } : null
        };

        res.status(201).json(formattedComment);

    } catch (err) {
        console.error(`添加评论到攻略 ${strategyId} 失败:`, err);
        next(err);
    }
};

// 获取评论
exports.getComments = async (req, res, next) => {
    const { id: strategyId } = req.params;
    const { page = 1, pageSize = 5 } = req.query;
    const pageNum = parseInt(page);
    const limit = parseInt(pageSize);
    const offset = (pageNum - 1) * limit;

    try {
        // 查找攻略，确保存在
        const strategy = await Strategy.findByPk(strategyId);
        if (!strategy) {
            return res.status(404).json({ message: '攻略不存在' });
        }

        // 查找评论并计算总数
        const { count, rows } = await Review.findAndCountAll({
            where: { 
                strategy_id: strategyId,
                item_type: 'strategy'
            },
            include: [{ 
                model: User, 
                as: 'author', 
                attributes: ['user_id', 'username', 'avatar'] 
            }],
            order: [['created_at', 'DESC']],
            limit,
            offset
        });

        // 格式化评论列表
        const reviews = rows.map(review => ({
            review_id: review.review_id,
            content: review.content,
            rating: review.rating,
            created_at: review.created_at,
            updated_at: review.updated_at,
            user_id: review.user_id,
            item_type: review.item_type,
            item_id: review.strategy_id,
            strategy_id: review.strategy_id,
            status: review.status || 'approved',
            author: review.author ? {
                user_id: review.author.user_id,
                username: review.author.username,
                avatar: review.author.avatar || `https://placehold.co/50?text=${review.author.username.charAt(0)}`
            } : null
        }));

        // 返回带分页信息的评论列表
        res.json({
            reviews,
            total: count,
            page: pageNum,
            pageSize: limit,
            totalPages: Math.ceil(count / limit)
        });

    } catch (err) {
        console.error(`获取攻略 ${strategyId} 评论失败:`, err);
        next(err);
    }
};

// --- 添加新方法：创建攻略 ---
exports.createStrategy = async (req, res, next) => {
    const userId = req.user?.id;
    
    if (!userId) {
        return res.status(401).json({ message: '您必须登录才能创建攻略' });
    }
    
    const { title, content, summary, coverImage, city, type, tags } = req.body;
    
    // 基本验证
    if (!title || !content) {
        return res.status(400).json({ message: '攻略标题和内容不能为空' });
    }
    
    try {
        // 创建攻略记录
        const newStrategy = await Strategy.create({
            title,
            content,
            cover_image: coverImage,
            city: city || '未指定',
            type: type || 'travel_note', // 默认为旅行笔记
            tags: Array.isArray(tags) ? tags.join(',') : tags,
            user_id: userId,
            status: 'published', // 默认发布状态
            view_count: 0,
            like_count: 0
        });
        
        // 获取完整的攻略数据（包括作者信息）
        const createdStrategy = await Strategy.findByPk(newStrategy.strategy_id, {
            include: [
                { model: User, as: 'author', attributes: ['user_id', 'username', 'avatar'] }
            ]
        });
        
        if (!createdStrategy) {
            throw new Error('攻略创建成功但无法获取详情');
        }
        
        // 创建适合前端的响应格式
        const responseData = {
            id: createdStrategy.strategy_id,
            strategy_id: createdStrategy.strategy_id,
            title: createdStrategy.title,
            summary: summary || (createdStrategy.content ? createdStrategy.content.substring(0, 100) + '...' : ''),
            content: createdStrategy.content,
            coverImage: createdStrategy.cover_image,
            cover_image: createdStrategy.cover_image,
            createdAt: createdStrategy.created_at,
            created_at: createdStrategy.created_at,
            viewCount: 0,
            view_count: 0,
            likeCount: 0,
            like_count: 0,
            commentCount: 0,
            favoriteCount: 0,
            type: createdStrategy.type,
            city: createdStrategy.city,
            tags: createdStrategy.tags ? createdStrategy.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
            author: createdStrategy.author ? {
                id: createdStrategy.author.user_id,
                username: createdStrategy.author.username,
                avatar: createdStrategy.author.avatar
            } : null,
            authorName: createdStrategy.author ? createdStrategy.author.username : '匿名',
            authorAvatar: createdStrategy.author ? createdStrategy.author.avatar : 'https://placehold.co/50'
        };
        
        // 添加调试日志
        console.log('创建攻略成功:', {
            id: responseData.id,
            title: responseData.title,
            userId: userId
        });
        
        // 构造标准响应格式，确保与前端期望的一致
        return res.status(201).json({
            message: '攻略创建成功',
            success: true,
            strategy: responseData,
            data: responseData // 确保有data字段
        });
    } catch (err) {
        console.error('创建攻略失败:', err);
        next(err);
    }
}; 