/**
 * 管理员路由 - 处理管理员相关的API请求
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const adminController = require('../controllers/adminController');

// ---> 导入配置好的 Multer 中间件 < ---
const uploadMiddleware = require('../config/multerConfig');

// ---> 恢复全局中间件 < ---
// 所有管理员路由都需要身份验证和管理员权限
router.use(protect);
router.use(authorize('admin'));

// 仪表盘统计数据
// ---> 移除单独的保护 < ---
router.get('/dashboard', adminController.getDashboardStats);

// 用户管理
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.get('/users/:user_id', adminController.getUserById);
router.put('/users/:user_id', adminController.updateUser);
router.delete('/users/:user_id', adminController.deleteUser);

// --- 图片上传路由 --- 
router.post(
    '/upload/image-fs',
    // ---> 移除临时日志 < ---
    // (req, res, next) => { ... },
    // ---> 移除单独的保护 (现在由全局 router.use 处理) < ---
    // protect, authorize('admin'), 
    uploadMiddleware.single('image'), 
    adminController.uploadImageToFileSystem
);

// ---> 移除其他路由的单独保护 < ---
// 景点管理
router.get('/scenics', adminController.getScenics);
router.post('/scenics', adminController.createScenic);
router.get('/scenics/:id', adminController.getScenicById);
router.put('/scenics/:id', adminController.updateScenic);
router.delete('/scenics/:id', adminController.deleteScenic);

// 景点坐标统计
router.get('/scenics-coordinate-stats', adminController.getScenicSpotCoordinateStats);

// 酒店管理
router.get('/hotels', adminController.getHotels);
router.post('/hotels', adminController.createHotel);
router.get('/hotels/:id', adminController.getHotelById);
router.put('/hotels/:id', adminController.updateHotel);
router.delete('/hotels/:id', adminController.deleteHotel);

// 订单管理
router.get('/orders', adminController.getOrders);
router.get('/orders/:id', adminController.getOrderById);
router.put('/orders/:id/status', adminController.updateOrderStatus);

// 评论管理
router.get('/reviews', adminController.getReviews);
router.delete('/reviews/:id', adminController.deleteReview);
router.put('/reviews/:id/status', adminController.updateReviewStatus);

// 攻略管理
router.get('/strategies', adminController.getStrategies);
router.post('/strategies', adminController.createStrategy);
router.get('/strategies/:id', adminController.getStrategyById);
router.put('/strategies/:id', adminController.updateStrategy);
router.delete('/strategies/:id', adminController.deleteStrategy);

module.exports = router; 