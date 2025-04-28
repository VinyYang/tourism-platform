/**
 * 酒店路由
 * 处理酒店列表、详情、评论、收藏等功能
 */

const express = require('express');
const { protect } = require('../middlewares/auth');
const hotelController = require('../controllers/hotelController');
const router = express.Router();

/**
 * 获取酒店列表
 * @route GET /api/v1/hotels
 * @access 公开
 */
router.get('/', hotelController.getHotels);

/**
 * 获取热门酒店 (控制器中未实现此特定逻辑)
 * @route GET /api/v1/hotels/hot 
 * @access 公开
 */
// router.get('/hot', hotelController.getHotHotels); // 控制器无此函数，暂时注释

/**
 * 获取城市列表 (控制器中未实现此特定逻辑)
 * @route GET /api/v1/hotels/cities
 * @access 公开
 */
router.get('/cities', hotelController.getHotelCities);

/**
 * 获取酒店类型列表
 * @route GET /api/v1/hotels/types
 * @access 公开
 */
router.get('/types', hotelController.getHotelTypes);

/**
 * 获取酒店设施列表
 * @route GET /api/v1/hotels/facilities
 * @access 公开
 */
router.get('/facilities', hotelController.getHotelFacilities);

/**
 * 获取酒店详情
 * @route GET /api/v1/hotels/:id
 * @access 公开
 */
router.get('/:id', hotelController.getHotelById);

/**
 * 获取酒店评论
 * @route GET /api/v1/hotels/:id/reviews
 * @access 公开
 */
router.get('/:id/reviews', (req, res) => {
    const { id } = req.params;
    const { page = 1, limit = 10, rating } = req.query;
    
    // 模拟评论总数
    const total = 23;
    
    // 生成模拟评论数据
    const reviews = Array.from({ length: Math.min(limit, total - (page - 1) * limit) }, (_, i) => {
        const reviewIndex = (page - 1) * limit + i;
        const reviewRating = rating ? parseInt(rating) : Math.floor(Math.random() * 2) + 4;
        
        return {
            id: reviewIndex + 1,
            userId: reviewIndex + 100,
            userName: `用户${reviewIndex + 100}`,
            username: `用户${reviewIndex + 100}`,
            avatar: `https://i.pravatar.cc/150?img=${reviewIndex + 1}`,
            rating: reviewRating,
            comment: `这是第 ${reviewIndex + 1} 条评论。酒店环境很好，服务态度也不错，下次还会选择这家酒店。`,
            content: `这是第 ${reviewIndex + 1} 条评论。酒店环境很好，服务态度也不错，下次还会选择这家酒店。`,
            date: new Date(Date.now() - reviewIndex * 86400000).toISOString(),
            createdAt: new Date(Date.now() - reviewIndex * 86400000).toISOString(),
            tags: ['环境好', '服务好', '位置佳', '性价比高', '设施新'].slice(0, Math.floor(Math.random() * 3) + 1)
        };
    });
    
    res.json({
        reviews,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit)
    });
});

/**
 * 提交酒店评论
 * @route POST /api/v1/hotels/:id/reviews
 * @access 私有
 */
router.post('/:id/reviews', protect, (req, res) => {
    const { rating, comment, tags } = req.body;
    
    // 验证参数
    if (!rating || !comment) {
        return res.status(400).json({ message: '评分和评论内容不能为空' });
    }
    
    // 模拟创建评论
    const newReview = {
        id: Date.now(),
        userId: req.user.id,
        userName: req.user.username,
        username: req.user.username,
        avatar: req.user.avatar || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
        rating,
        comment,
        content: comment,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        tags: tags || []
    };
    
    res.status(201).json(newReview);
});

/**
 * 收藏酒店
 * @route POST /api/v1/hotels/:id/favorite
 * @access 私有
 */
router.post('/:id/favorite', protect, (req, res) => {
    const { id } = req.params;
    
    res.json({
        success: true,
        message: '酒店已成功收藏'
    });
});

/**
 * 取消收藏酒店
 * @route DELETE /api/v1/hotels/:id/favorite
 * @access 私有
 */
router.delete('/:id/favorite', protect, (req, res) => {
    const { id } = req.params;
    
    res.json({
        success: true,
        message: '已取消收藏'
    });
});

/**
 * 获取相似酒店
 * @route GET /api/v1/hotels/:id/similar
 * @access 公开
 */
router.get('/:id/similar', (req, res) => {
    const { id } = req.params;
    const { limit = 4 } = req.query;
    
    // 生成模拟相似酒店数据
    const similarHotels = Array.from({ length: parseInt(limit) }, (_, i) => ({
        id: parseInt(id) + 100 + i,
        name: `相似酒店 ${i + 1}`,
        address: `北京市朝阳区酒店大道${i + 101}号`,
        city: '北京',
        price: Math.floor(Math.random() * 500) + 300,
        discountPrice: Math.floor((Math.random() * 500) + 300) * 0.8,
        coverImage: `https://images.unsplash.com/photo-${1550000000000 + i * 1000000}?w=500&auto=format&fit=crop`,
        stars: Math.floor(Math.random() * 2) + 3,
        score: (Math.random() * 1.5 + 3.5).toFixed(1),
        reviewCount: Math.floor(Math.random() * 300) + 50,
        distance: (Math.random() * 3).toFixed(1)
    }));
    
    res.json(similarHotels);
});

module.exports = router; 