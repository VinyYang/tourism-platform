/**
 * 订单路由模块
 * 定义与订单相关的API端点
 * @module routes/bookingRoutes
 */

const express = require('express');
const bookingController = require('../controllers/bookingController');
const { protect } = require('../middlewares/auth.js'); // 导入正确的函数名

const router = express.Router();

// 应用认证中间件，以下所有路由都需要用户登录
router.use(protect); // 使用正确的函数名

// POST /api/v1/bookings - 创建新订单
router.post('/', bookingController.createBooking);

// GET /api/v1/bookings - 获取当前用户的订单列表
router.get('/', bookingController.getUserBookings);

// GET /api/v1/bookings/:id - 获取单个订单详情
router.get('/:id', bookingController.getBookingById);

// PUT /api/v1/bookings/:id/cancel - 取消订单
router.put('/:id/cancel', bookingController.cancelBooking);

// PUT /api/v1/bookings/:id/status - 更新订单状态 (可能需要管理员权限，具体权限在控制器中处理)
// 注意：这个路由可能需要更精细的权限控制，例如仅限管理员或支付回调服务调用
router.put('/:id/status', bookingController.updateBookingStatus);

module.exports = router;
