/**
 * 用户路由
 * 处理用户信息、订单、收藏等用户相关功能
 */

const express = require('express');
const { protect } = require('../middlewares/auth');
const userController = require('../controllers/userController'); // 导入控制器
const router = express.Router();

// 所有路由都需要登录保护
router.use(protect);

/**
 * 获取当前用户信息
 * @route GET /api/v1/users/me
 * @access 私有
 */
// 注意: 获取用户信息 /me 通常在 authController 中实现
// router.get('/me', userController.getMe);

/**
 * 更新用户信息
 * @route PUT /api/v1/users/me
 * @access 私有
 */
router.put('/me', userController.updateMe);

/**
 * 更改密码
 * @route PUT /api/v1/users/password
 * @access 私有
 */
router.put('/password', userController.updatePassword);

/**
 * 获取用户订单列表
 * @route GET /api/v1/users/orders
 * @access 私有
 */
router.get('/orders', userController.getOrders);

/**
 * 分享订单
 * @route GET /api/v1/users/orders/:orderId/share
 * @access 私有
 */
router.get('/orders/:orderId/share', userController.shareOrder);

/**
 * 获取订单详情
 * @route GET /api/v1/users/orders/:id
 * @access 私有
 */
router.get('/orders/:id', userController.getOrderById);

/**
 * 取消订单
 * @route PUT /api/v1/users/orders/:id/cancel
 * @access 私有
 */
router.put('/orders/:id/cancel', userController.cancelOrder);

/**
 * 获取用户收藏列表
 * @route GET /api/v1/users/favorites
 * @access 私有
 */
router.get('/favorites', userController.getFavorites);

/**
 * 添加收藏
 * @route POST /api/v1/users/favorites
 * @access 私有
 */
router.post('/favorites', userController.addFavorite);

/**
 * 删除收藏
 * @route DELETE /api/v1/users/favorites/:id
 * @access 私有
 */
router.delete('/favorites/:id', userController.deleteFavorite);

/**
 * 获取用户评论列表
 * @route GET /api/v1/users/reviews
 * @access 私有
 */
router.get('/reviews', userController.getReviews);

/**
 * 获取用户偏好
 * @route GET /api/v1/users/me/preferences
 * @access 私有
 */
router.get('/me/preferences', userController.getPreferences);

/**
 * 更新用户偏好
 * @route PUT /api/v1/users/me/preferences
 * @access 私有
 */
router.put('/me/preferences', userController.updatePreferences);

// --- 新增路由：更新用户文化基因 --- 
/**
 * 更新当前用户的文化基因标签
 * @route PUT /api/v1/users/me/cultural-dna
 * @access 私有
 */
router.put('/me/cultural-dna', userController.updateCulturalDna);
// --- 结束新增路由 ---

module.exports = router; 