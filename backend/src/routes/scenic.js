const express = require('express');
const router = express.Router();
const scenicController = require('../controllers/scenicController');
const { protect, authorize } = require('../middleware/auth');

// 获取景点列表
router.get('/scenics', scenicController.getScenics);

// 获取景点详情
router.get('/scenics/:id', scenicController.getScenicDetail);

// 获取热门景点
router.get('/scenics/hot', scenicController.getHotScenics);

// 获取城市列表
router.get('/cities', scenicController.getCities);

// 获取标签列表
router.get('/tags', scenicController.getLabels);

// 获取景点筛选条件
router.get('/scenic/filters', scenicController.getScenicFilters);

// 新增：搜索景点API（用于路线景点选择）
router.get('/scenic/search', scenicController.searchScenicSpots);

// 管理员接口 (需要权限验证)
router.post('/scenics', protect, authorize('admin'), scenicController.createScenic);
router.put('/scenics/:id', protect, authorize('admin'), scenicController.updateScenic);
router.delete('/scenics/:id', protect, authorize('admin'), scenicController.deleteScenic);

module.exports = router; 