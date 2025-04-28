const express = require('express');
const router = express.Router();
const priceReportController = require('../controllers/priceReportController');
const { authJwt } = require('../middleware');

/**
 * 价格数据报表路由
 * @module routes/priceReportRoutes
 */

// 获取城市景点和酒店价格数据
router.get('/city-report', priceReportController.getCityPriceReport);

// 获取热门城市的平均价格对比
router.get('/hot-cities-comparison', priceReportController.getHotCitiesPriceComparison);

// 获取各类酒店房间的平均价格
router.get('/room-type-analysis', priceReportController.getRoomTypePriceAnalysis);

// 获取景点门票价格范围分布
router.get('/scenic-price-distribution', priceReportController.getScenicPriceDistribution);

// 获取价格数据更新统计信息 (仅管理员可访问)
router.get('/price-update-stats', [authJwt.verifyToken, authJwt.isAdmin], priceReportController.getPriceUpdateStats);

module.exports = router; 