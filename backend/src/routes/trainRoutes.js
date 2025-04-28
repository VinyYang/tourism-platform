/**
 * 火车票路由模块
 * 定义与火车票相关的API端点
 * @module routes/trainRoutes
 */

const express = require('express');
const trainTicketController = require('../controllers/trainTicketController');
const { protect } = require('../middlewares/auth.js');

const router = express.Router();

// GET /api/v1/train/stations - 搜索车站信息（公开API，无需登录）
router.get('/stations', trainTicketController.searchStations);

// POST /api/v1/train/search - 搜索火车票
router.post('/search', protect, trainTicketController.searchTrainTickets);

// 仅管理员可访问的路由
router.use(protect);

// POST /api/v1/train/clear-cache - 清除过期缓存（管理员专用）
router.post('/clear-cache', (req, res, next) => {
  // 简单验证是否管理员
  if (req.user && req.user.role === 'admin') {
    return trainTicketController.clearExpiredCache(req, res, next);
  }
  return res.status(403).json({
    success: false,
    returnCode: 403,
    errorMsg: '权限不足，只有管理员可以执行此操作'
  });
});

module.exports = router; 