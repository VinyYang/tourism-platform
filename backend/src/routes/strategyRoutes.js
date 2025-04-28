/**
 * 旅游攻略路由
 * 处理攻略列表、详情、评论、收藏、点赞等功能
 */

const express = require('express');
const { protect } = require('../middlewares/auth');
const strategyController = require('../controllers/strategyController');
const router = express.Router();

/**
 * 获取攻略列表
 * @route GET /api/v1/strategies
 * @access 公开
 */
router.get('/', strategyController.getStrategies);

/**
 * 创建新攻略
 * @route POST /api/v1/strategies
 * @access 私有
 */
router.post('/', protect, strategyController.createStrategy);

/**
 * 获取热门攻略
 * @route GET /api/v1/strategies/hot
 * @access 公开
 */
router.get('/hot', strategyController.getHotStrategies);

/**
 * 获取攻略标签
 * @route GET /api/v1/strategies/tags
 * @access 公开
 */
router.get('/tags', strategyController.getTags);

/**
 * 获取攻略城市
 * @route GET /api/v1/strategies/cities
 * @access 公开
 */
router.get('/cities', strategyController.getCities);

/**
 * 生成推荐行程
 * @route POST /api/v1/strategies/generate
 * @access 私有
 */
router.post('/generate', protect, strategyController.generateRecommendedItinerary);

/**
 * 获取攻略详情
 * 注意：此路由应放在具体路由之后，以避免匹配 'hot', 'tags', 'cities' 等
 * @route GET /api/v1/strategies/:id
 * @access 公开
 */
// 注意: protect 中间件可选，用于获取登录用户状态以判断点赞/收藏
router.get('/:id', protect, strategyController.getStrategyById);

/**
 * 获取相关攻略
 * @route GET /api/v1/strategies/:id/related
 * @access 公开
 */
router.get('/:id/related', strategyController.getRelatedStrategies);

/**
 * 点赞攻略
 * @route POST /api/v1/strategies/:id/like
 * @access 私有
 */
router.post('/:id/like', protect, strategyController.likeStrategy);

/**
 * 取消点赞
 * @route DELETE /api/v1/strategies/:id/like
 * @access 私有
 */
router.delete('/:id/like', protect, strategyController.unlikeStrategy);

/**
 * 收藏攻略
 * @route POST /api/v1/strategies/:id/favorite
 * @access 私有
 */
router.post('/:id/favorite', protect, strategyController.favoriteStrategy);

/**
 * 取消收藏
 * @route DELETE /api/v1/strategies/:id/favorite
 * @access 私有
 */
router.delete('/:id/favorite', protect, strategyController.unfavoriteStrategy);

/**
 * 添加评论
 * @route POST /api/v1/strategies/:id/comments
 * @access 私有
 */
router.post('/:id/comments', protect, strategyController.addComment);

/**
 * 获取评论列表
 * @route GET /api/v1/strategies/:id/comments
 * @access 公开
 */
router.get('/:id/comments', strategyController.getComments);

module.exports = router; 