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

/**
 * 用户控制器
 * 处理用户相关（非认证）的 API 请求
 */
const { Op } = require('sequelize');
// 修改: 使用统一的模型导入方式
const db = require('../models');
const User = db.User;
const Booking = db.Booking;
const Favorite = db.Favorite;
const Review = db.Review;
const Scenic = db.Scenic;
const Hotel = db.Hotel;
const Strategy = db.Strategy;
const UserPreference = db.UserPreference;
const Room = db.Room;

// 辅助函数：格式化收藏项目
const formatFavoriteItem = (favorite) => {
    let itemData = null;
    if (favorite.item_type === 'scenic' && favorite.Scenic) {
        itemData = {
            id: favorite.Scenic.scenic_id,
            name: favorite.Scenic.name,
            city: favorite.Scenic.city,
            coverImage: favorite.Scenic.images ? safeJsonParse(favorite.Scenic.images)[0] : '',
            price: favorite.Scenic.ticket_price,
            rating: favorite.Scenic.hot_score, // 或其他评分字段
            summary: favorite.Scenic.description.substring(0, 50) + '...',
        };
    } else if (favorite.item_type === 'hotel' && favorite.Hotel) {
        itemData = {
            id: favorite.Hotel.hotel_id,
            name: favorite.Hotel.name,
            city: favorite.Hotel.city,
            coverImage: favorite.Hotel.images ? safeJsonParse(favorite.Hotel.images)[0] : '',
            price: favorite.Hotel.avg_price,
            rating: favorite.Hotel.stars, // 使用酒店星级作为评分
            summary: favorite.Hotel.description ? favorite.Hotel.description.substring(0, 50) + '...' : '暂无描述',
        };
    } else if (favorite.item_type === 'strategy' && favorite.Strategy) {
        itemData = {
            id: favorite.Strategy.strategy_id,
            name: favorite.Strategy.title,
            city: favorite.Strategy.city || '全国',
            coverImage: favorite.Strategy.cover_image || 'https://placehold.co/300',
            rating: 5.0, // 旅游攻略暂无评分机制
            summary: favorite.Strategy.summary || '暂无摘要'
        };
    } else {
        // 未知类型或找不到关联项目
        itemData = {
            id: favorite.favorite_id,
            name: '未知收藏项',
            city: '未知',
            coverImage: 'https://placehold.co/300?text=Unknown',
            rating: 0,
            summary: '该收藏项可能已被删除'
        };
    }

    return {
        id: favorite.favorite_id,
        type: favorite.item_type,
        createdAt: favorite.created_at,
        ...itemData
    };
};

// 获取当前用户信息 (已在 authController 实现)
// exports.getMe = async (req, res, next) => { ... };

// 更新用户信息
exports.updateMe = async (req, res, next) => {
    const { username, email, avatar, phone } = req.body;
    const userId = req.user.id;

    try {
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: '用户不存在', code: 404 });
        }

        // 检查 email 或 username 是否已被其他用户使用 (如果允许修改)
        if (email && email !== user.email) {
            const existingEmail = await User.findOne({ where: { email } });
            if (existingEmail) {
                return res.status(400).json({ message: '该邮箱已被注册', code: 400 });
            }
        }
        if (username && username !== user.username) {
            const existingUsername = await User.findOne({ where: { username } });
            if (existingUsername) {
                return res.status(400).json({ message: '用户名已存在', code: 400 });
            }
        }

        // 更新用户信息
        user.username = username || user.username;
        user.email = email || user.email;
        user.avatar = avatar || user.avatar;
        user.phone = phone || user.phone;

        await user.save();

        res.json({
            id: user.user_id,
            username: user.username,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            phone: user.phone,
            createdAt: user.created_at
        });
    } catch (err) {
        console.error('更新用户信息失败:', err);
        next(err);
    }
};

// 更改密码
exports.updatePassword = async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: '请提供当前密码和新密码', code: 400 });
    }

    try {
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: '用户不存在', code: 404 });
        }

        // 验证当前密码
        const isMatch = await user.checkPassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ message: '当前密码不正确', code: 401 });
        }

        // 更新密码 (模型的 hook 会自动哈希)
        user.password = newPassword;
        await user.save();

        res.json({ message: '密码已成功更新' });
    } catch (err) {
        console.error('更新密码失败:', err);
        next(err);
    }
};

// 获取用户订单列表
exports.getOrders = async (req, res, next) => {
    const { status, page = 1, limit = 10 } = req.query;
    const userId = req.user.id;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = { user_id: userId };
    if (status) {
        whereClause.status = status;
    }

    try {
        const { count, rows } = await Booking.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: offset,
            order: [['created_at', 'DESC']],
            include: [
                { model: Scenic, as: 'Scenic', required: false, attributes: ['scenic_id', 'name', 'images'] },
                { model: Hotel, as: 'Hotel', required: false, attributes: ['hotel_id', 'name', 'images'] },
                { model: Room, as: 'Room', required: false, attributes: ['room_id', 'name', 'price'] }
            ]
        });

        const formattedOrders = rows.map(order => {
            let itemDetails = {};
            
            if (order.booking_type === 'scenic' && order.Scenic) {
                itemDetails = {
                    id: order.Scenic.scenic_id,
                    name: order.Scenic.name,
                    image: order.Scenic.images ? safeJsonParse(order.Scenic.images)[0] : '',
                    price: order.total_price / (order.num_people || 1) // 单价
                };
            } else if (order.booking_type === 'hotel' && order.Hotel) {
                // 计算入住天数
                const oneDay = 24 * 60 * 60 * 1000; // 一天的毫秒数
                const startDate = new Date(order.start_date);
                const endDate = new Date(order.end_date);
                const diffDays = Math.round(Math.abs((endDate - startDate) / oneDay)) || 1; // 至少1天
                
                itemDetails = {
                    id: order.Hotel.hotel_id,
                    name: order.Hotel.name,
                    image: order.Hotel.images ? safeJsonParse(order.Hotel.images)[0] : '',
                    price: order.Room ? order.Room.price : (order.total_price / diffDays),
                    days: diffDays,
                    roomName: order.Room ? order.Room.name : '标准房'
                };
            } else {
                 itemDetails = {
                    id: 1,
                    name: `${order.booking_type} 预订`,
                    image: 'https://placehold.co/100',
                    price: order.total_price
                };
            }

            // 根据状态设置中文显示名称和状态类别
            let statusInfo = {
                text: '未知状态',
                color: 'default'
            };
            
            switch(order.status) {
                case 'pending':
                    statusInfo = { text: '待处理', color: 'orange' };
                    break;
                case 'processing':
                    statusInfo = { text: '处理中', color: 'blue' };
                    break;
                case 'confirmed':
                    statusInfo = { text: '已确认/待出行', color: 'cyan' };
                    break;
                case 'completed':
                    statusInfo = { text: '已完成', color: 'green' };
                    break;
                case 'cancelled':
                    statusInfo = { text: '已取消', color: 'grey' };
                    break;
                case 'refunding':
                    statusInfo = { text: '退款中', color: 'purple' };
                    break;
                case 'refunded':
                    statusInfo = { text: '已退款', color: 'red' };
                    break;
            }

            return {
                id: order.booking_id,
                orderNumber: `ORD${order.booking_id}`,
                createTime: order.created_at,
                status: order.status,
                statusInfo: statusInfo,
                totalAmount: order.total_price,
                items: [{
                     ...itemDetails,
                     quantity: order.booking_type === 'hotel' ? itemDetails.days : (order.num_people || 1),
                     price: itemDetails.price
                 }], 
                paymentMethod: order.payment_status,
                timeline: getOrderTimeline(order)
            };
        });

        res.json({
            orders: formattedOrders,
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit))
        });
    } catch (err) {
        console.error('获取订单列表失败:', err);
        next(err);
    }
};

// 辅助函数：生成订单时间轴数据
const getOrderTimeline = (order) => {
    const timeline = [
        {
            time: new Date(order.created_at).toLocaleString(),
            status: 'created',
            title: '订单创建',
            description: `订单号: ORD${order.booking_id} 已创建成功`
        }
    ];
    
    // 根据订单状态添加对应的时间轴项
    if (order.status !== 'pending') {
        // 模拟状态变更时间，实际应从订单历史记录表获取
        const statusChangeTime = new Date(new Date(order.created_at).getTime() + 3600000); // 创建1小时后
        
        if (order.status === 'processing' || order.status === 'confirmed' || 
            order.status === 'completed' || order.status === 'refunding' || 
            order.status === 'refunded') {
            timeline.push({
                time: statusChangeTime.toLocaleString(),
                status: 'processing',
                title: '订单处理中',
                description: '商家正在处理您的订单'
            });
        }
        
        if (order.status === 'confirmed' || order.status === 'completed' || 
            order.status === 'refunding' || order.status === 'refunded') {
            const confirmTime = new Date(statusChangeTime.getTime() + 7200000); // 处理2小时后
            timeline.push({
                time: confirmTime.toLocaleString(),
                status: 'confirmed',
                title: '订单已确认',
                description: '您的预订已确认'
            });
        }
        
        if (order.status === 'completed') {
            const completeTime = new Date(order.updated_at);
            timeline.push({
                time: completeTime.toLocaleString(),
                status: 'completed',
                title: '订单已完成',
                description: '感谢您的使用，期待您的评价'
            });
        }
        
        if (order.status === 'cancelled') {
            const cancelTime = new Date(order.updated_at);
            timeline.push({
                time: cancelTime.toLocaleString(),
                status: 'cancelled',
                title: '订单已取消',
                description: '订单已取消'
            });
        }
        
        if (order.status === 'refunding' || order.status === 'refunded') {
            const refundRequestTime = new Date(order.updated_at);
            timeline.push({
                time: refundRequestTime.toLocaleString(),
                status: 'refunding',
                title: '退款申请中',
                description: '您的退款申请正在处理'
            });
        }
        
        if (order.status === 'refunded') {
            const refundedTime = new Date(new Date(order.updated_at).getTime() + 86400000); // 退款申请1天后
            timeline.push({
                time: refundedTime.toLocaleString(),
                status: 'refunded',
                title: '退款完成',
                description: '退款已完成，资金将在1-3个工作日内退回您的支付账户'
            });
        }
    }
    
    return timeline;
};

// 分享订单
exports.shareOrder = async (req, res, next) => {
    const { orderId } = req.params;
    const userId = req.user.id;
    
    try {
        // 检查订单是否存在且属于当前用户
        const order = await Booking.findOne({
            where: { booking_id: orderId, user_id: userId },
            include: [
                { model: Scenic, as: 'Scenic', required: false },
                { model: Hotel, as: 'Hotel', required: false },
                { model: Room, as: 'Room', required: false }
            ]
        });
        
        if (!order) {
            return res.status(404).json({ message: '订单不存在或无权分享', code: 404 });
        }
        
        // 生成分享令牌 (实际应用中会使用更复杂的加密和有效期)
        const shareToken = Buffer.from(`${orderId}-${Date.now()}-${userId}`).toString('base64');
        
        // 构建分享链接
        const shareLink = `${req.protocol}://${req.get('host')}/share/order/${shareToken}`;
        
        // 构建分享内容
        const itemName = order.Scenic?.name || order.Hotel?.name || '旅行预订';
        const shareContent = {
            title: `我的${order.booking_type === 'scenic' ? '景点' : '酒店'}预订: ${itemName}`,
            description: `预订日期: ${order.start_date}${order.booking_type === 'hotel' ? ` 至 ${order.end_date}` : ''}`,
            link: shareLink,
            token: shareToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7天后过期
        };
        
        res.status(200).json({
            success: true,
            message: '分享链接生成成功',
            shareData: shareContent
        });
    } catch (err) {
        console.error('生成分享链接失败:', err);
        next(err);
    }
};

// 获取订单详情
exports.getOrderById = async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.id;

    console.log(`尝试获取订单详情 - 订单ID: ${id}, 用户ID: ${userId}`);

    if (!id || isNaN(parseInt(id))) {
        console.error(`无效的订单ID: ${id}`);
        return res.status(400).json({ message: '无效的订单ID', code: 400 });
    }

    try {
        console.log(`正在查询订单，参数: booking_id=${id}, user_id=${userId}`);
        
        // 首先尝试使用booking_id查询
        let order = await Booking.findOne({
            where: { booking_id: id, user_id: userId },
            include: [
                { model: Scenic, as: 'Scenic', required: false, attributes: ['scenic_id', 'name', 'address', 'images'] },
                { model: Hotel, as: 'Hotel', required: false, attributes: ['hotel_id', 'name', 'address', 'images'] },
                { model: Room, as: 'Room', required: false, attributes: ['room_id', 'name', 'price', 'beds', 'max_occupancy'] },
                { model: User, as: 'user', required: true, attributes: ['username', 'phone'] }
            ]
        });
        
        // 如果没找到，可能id是order_id或其他字段，则尝试其他查询
        if (!order) {
            console.log(`未找到booking_id=${id}的订单，尝试使用其他字段查询`);
            // 这里可以添加其他查询逻辑，比如使用其他字段查询
        }

        if (!order) {
            console.error(`未找到订单 - 订单ID: ${id}, 用户ID: ${userId}`);
            return res.status(404).json({ message: '订单不存在或无权访问', code: 404 });
        }

        console.log(`成功找到订单: ${JSON.stringify(order.toJSON())}`);

        let itemDetails = {};
        
        if (order.booking_type === 'scenic' && order.Scenic) {
            itemDetails = {
                id: order.Scenic.scenic_id,
                name: order.Scenic.name,
                address: order.Scenic.address,
                image: order.Scenic.images ? safeJsonParse(order.Scenic.images)[0] : '',
                quantity: order.num_people || 1,
                price: order.total_price / (order.num_people || 1), // 单价
                totalPrice: order.total_price
            };
        } else if (order.booking_type === 'hotel' && order.Hotel) {
            // 计算入住天数
            const oneDay = 24 * 60 * 60 * 1000; // 一天的毫秒数
            const startDate = new Date(order.start_date);
            const endDate = new Date(order.end_date);
            const nights = Math.round(Math.abs((endDate - startDate) / oneDay)) || 1; // 至少1天
            
            itemDetails = {
                id: order.Hotel.hotel_id,
                name: order.Hotel.name,
                address: order.Hotel.address,
                image: order.Hotel.images ? safeJsonParse(order.Hotel.images)[0] : '',
                quantity: nights,
                days: nights,
                roomName: order.Room ? order.Room.name : '标准房',
                roomDetails: order.Room ? {
                    beds: order.Room.beds,
                    maxOccupancy: order.Room.max_occupancy
                } : null,
                price: order.Room ? order.Room.price : (order.total_price / nights),
                totalPrice: order.total_price
            };
        } else {
            itemDetails = { 
                id: 1, 
                name: `${order.booking_type} 预订`, 
                quantity: 1, 
                price: order.total_price,
                totalPrice: order.total_price
            };
        }

        const formattedOrder = {
            id: order.booking_id,
            booking_id: order.booking_id, // 增加booking_id字段，确保前端兼容性
            orderNumber: `ORD${order.booking_id}`,
            createTime: order.created_at,
            createdAt: order.created_at, // 增加createdAt字段，确保前端兼容性
            status: order.status,
            payment_status: order.payment_status, // 增加payment_status字段，确保前端兼容性
            booking_type: order.booking_type, // 增加booking_type字段，确保前端兼容性
            total_price: order.total_price, // 增加total_price字段，确保前端兼容性
            totalAmount: order.total_price,
            items: [itemDetails],
            paymentMethod: order.payment_status,
            contactName: order.user.username,
            contactPhone: order.user.phone,
            visitorInfo: Array.from({ length: order.num_people || 1 }).map((_, i) => ({ name: `游客 ${i + 1}` })),
            checkIn: order.booking_type === 'hotel' ? order.start_date : null,
            checkOut: order.booking_type === 'hotel' ? order.end_date : null,
            visitDate: order.booking_type === 'scenic' ? order.start_date : null,
            start_date: order.start_date, // 增加start_date字段，确保前端兼容性
            end_date: order.end_date, // 增加end_date字段，确保前端兼容性
            num_people: order.num_people, // 增加num_people字段，确保前端兼容性
            remark: '无备注',
            // 确保关联数据一致性
            Scenic: order.Scenic,
            Hotel: order.Hotel
        };

        console.log(`返回格式化订单数据: ${JSON.stringify(formattedOrder)}`);
        res.json(formattedOrder);
    } catch (err) {
        console.error('获取订单详情失败:', err);
        next(err);
    }
};

// 取消订单
exports.cancelOrder = async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const [updatedCount] = await Booking.update(
            { status: 'cancelled' },
            { where: { booking_id: id, user_id: userId, status: 'pending' } }
        );

        if (updatedCount === 0) {
            return res.status(400).json({ message: '订单无法取消 (可能不存在、已处理或不属于您)', code: 400 });
        }

        res.json({
            id: parseInt(id),
            status: 'cancelled',
            message: '订单已成功取消'
        });
    } catch (err) {
        console.error('取消订单失败:', err);
        next(err);
    }
};

// 获取用户收藏列表
exports.getFavorites = async (req, res, next) => {
    const { type, page = 1, limit = 10 } = req.query;
    const userId = req.user.id;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = { user_id: userId };
    if (type && ['scenic', 'hotel', 'strategy'].includes(type)) {
        whereClause.item_type = type;
    }

    try {
        const { count, rows } = await Favorite.findAndCountAll({
            where: whereClause,
            include: [
                { model: Scenic, required: false },
                { model: Hotel, required: false },
                { model: Strategy, required: false }
            ],
            limit: parseInt(limit),
            offset: offset,
            order: [['created_at', 'DESC']]
        });

        const formattedFavorites = rows.map(formatFavoriteItem);

        res.json({
            favorites: formattedFavorites,
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit))
        });
    } catch (err) {
        console.error('获取收藏列表失败:', err);
        next(err);
    }
};

// 添加收藏
exports.addFavorite = async (req, res, next) => {
    const { itemType, itemId } = req.body;
    const userId = req.user.id;

    if (!itemType || !itemId || !['scenic', 'hotel', 'strategy'].includes(itemType)) {
        return res.status(400).json({ message: '无效的收藏类型或ID', code: 400 });
    }

    const favoriteData = { user_id: userId, item_type: itemType };
    if (itemType === 'scenic') favoriteData.scenic_id = itemId;
    if (itemType === 'hotel') favoriteData.hotel_id = itemId;
    if (itemType === 'strategy') favoriteData.strategy_id = itemId;

    try {
        let itemExists = false;
        if (itemType === 'scenic') itemExists = !!(await Scenic.findByPk(itemId));
        if (itemType === 'hotel') itemExists = !!(await Hotel.findByPk(itemId));
        if (itemType === 'strategy') itemExists = !!(await Strategy.findByPk(itemId));

        if (!itemExists) {
            return res.status(404).json({ message: '要收藏的项目不存在', code: 404 });
        }

        const [newFavorite, created] = await Favorite.findOrCreate({
            where: favoriteData,
            defaults: favoriteData
        });

        if (!created) {
            return res.status(409).json({ message: '您已收藏过此项目', code: 409, favorite: formatFavoriteItem(newFavorite) });
        }

        const favoriteWithDetails = await Favorite.findByPk(newFavorite.favorite_id, {
             include: [
                { model: Scenic, required: false },
                { model: Hotel, required: false },
                { model: Strategy, required: false }
            ]
        });

        res.status(201).json(formatFavoriteItem(favoriteWithDetails));
    } catch (err) {
        console.error('添加收藏失败:', err);
        next(err);
    }
};

// 删除收藏
exports.deleteFavorite = async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const deletedCount = await Favorite.destroy({
            where: { favorite_id: id, user_id: userId }
        });

        if (deletedCount === 0) {
            return res.status(404).json({ message: '收藏记录不存在或无权删除', code: 404 });
        }

        res.json({
            success: true,
            message: '收藏已成功删除'
        });
    } catch (err) {
        console.error('删除收藏失败:', err);
        next(err);
    }
};

// 获取用户评论列表
exports.getReviews = async (req, res, next) => {
    const { type, page = 1, limit = 10 } = req.query;
    const userId = req.user.id;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = { user_id: userId };
    if (type && ['scenic', 'hotel', 'strategy'].includes(type)) {
        whereClause.item_type = type;
    }

    try {
        const { count, rows } = await Review.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: offset,
            order: [['created_at', 'DESC']],
            include: [
                { model: Scenic, required: false, attributes: ['scenic_id', 'name'] },
                { model: Hotel, required: false, attributes: ['hotel_id', 'name'] },
                { model: Strategy, required: false, attributes: ['strategy_id', 'title'] }
            ]
        });

        const formattedReviews = rows.map(review => {
            let itemName = '未知项目';
            if (review.item_type === 'scenic' && review.Scenic) itemName = review.Scenic.name;
            else if (review.item_type === 'hotel' && review.Hotel) itemName = review.Hotel.name;
            else if (review.item_type === 'strategy' && review.Strategy) itemName = review.Strategy.title;

            return {
                id: review.review_id,
                itemType: review.item_type,
                itemId: review.scenic_id || review.hotel_id || review.strategy_id || review.booking_id,
                content: review.content,
                rating: review.rating,
                createdAt: review.created_at,
                itemName: itemName
            };
        });

        res.json({
            reviews: formattedReviews,
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit))
        });
    } catch (err) {
        console.error('获取评论列表失败:', err);
        next(err);
    }
};

// 获取用户偏好
exports.getPreferences = async (req, res, next) => {
    const userId = req.user.id;
    try {
        const preferences = await UserPreference.findOne({ where: { user_id: userId } });
        if (!preferences) {
            return res.json({ 
                interest: '', 
                preferred_cities: [], 
                budget_range: '', 
                travel_style: '' 
            });
        }
        res.json(preferences);
    } catch (err) {
        console.error('获取用户偏好失败:', err);
        next(err);
    }
};

// 更新用户偏好
exports.updatePreferences = async (req, res, next) => {
    const userId = req.user.id;
    const { interest, preferred_cities, budget_range, travel_style } = req.body;

    if (interest === undefined || preferred_cities === undefined || budget_range === undefined || travel_style === undefined) {
         return res.status(400).json({ message: '请提供所有偏好字段' });
    }

    try {
        const [preferences, created] = await UserPreference.findOrCreate({
            where: { user_id: userId },
            defaults: {
                user_id: userId,
                interest: interest || '',
                preferred_cities: preferred_cities || [],
                budget_range: budget_range || '',
                travel_style: travel_style || ''
            }
        });

        if (!created) {
            preferences.interest = interest || preferences.interest;
            preferences.preferred_cities = preferred_cities || preferences.preferred_cities;
            preferences.budget_range = budget_range || preferences.budget_range;
            preferences.travel_style = travel_style || preferences.travel_style;
            await preferences.save();
        }

        res.json(preferences);
    } catch (err) {
        console.error('更新用户偏好失败:', err);
        next(err);
    }
};

// --- 新增：更新用户文化基因 --- 
/**
 * 更新当前用户的文化基因标签
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 * @param {Function} next - Express next 中间件
 */
exports.updateCulturalDna = async (req, res, next) => {
    // 确认从认证中间件获取的用户 ID 字段名 (假设是 user_id)
    const userId = req.user?.user_id;
    const { dnaTags } = req.body;

    if (!userId) {
        return res.status(401).json({ message: '用户未认证', code: 401 });
    }

    // 验证输入数据
    if (!Array.isArray(dnaTags) || !dnaTags.every(tag => typeof tag === 'string')) {
        return res.status(400).json({ message: '无效的 dnaTags 格式，应为字符串数组', code: 400 });
    }

    try {
        const user = await User.findByPk(userId);
        if (!user) {
            // 理论上认证过的用户应该存在，但也可能出现边缘情况
            return res.status(404).json({ message: '用户不存在', code: 404 });
        }

        // 将标签数组转换为逗号分隔的字符串存储
        const tagsString = dnaTags.join(',');

        // 更新用户的 cultural_dna_tags 字段
        await User.update({ cultural_dna_tags: tagsString }, {
            where: { user_id: userId }
        });

        console.log(`>>> [User.controller] User ${userId} cultural DNA updated: ${tagsString}`);
        res.status(200).json({ message: '文化基因已成功更新' });

    } catch (err) {
        console.error(`更新用户 ${userId} 文化基因失败:`, err);
        next(err); // 交给全局错误处理中间件
    }
};
// --- 结束新增 --- 

module.exports = exports; 