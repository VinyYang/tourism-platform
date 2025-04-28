const express = require('express');
const scenicController = require('../controllers/scenicController');
const { protect, authorize } = require('../middlewares/auth'); // 导入 authorize
const admin = authorize('admin'); // 创建 admin 中间件
// const { validateScenicQuery } = require('../validators/scenicValidator'); // 可选：导入输入验证规则

const router = express.Router();

// GET /api/v1/scenics - 获取景点列表 (支持分页、排序、筛选查询参数)
router.get(
    '/', 
    // validateScenicQuery, // 可选：应用输入验证中间件
    scenicController.getScenics
);

// GET /api/v1/scenics/cultural-regions - 获取景点地域文化分类
router.get('/cultural-regions', scenicController.getScenicCulturalRegions);

// GET /api/v1/scenics/hot - 获取热门景点
router.get('/hot', scenicController.getHotScenics);

// GET /api/v1/scenics/cities - 获取城市列表
router.get('/cities', scenicController.getCities);

// 新增：GET /api/v1/scenics/cities/popular - 获取热门城市列表
router.get('/cities/popular', scenicController.getPopularCities);

// GET /api/v1/scenics/labels - 获取标签列表
router.get('/labels', scenicController.getLabels);

// GET /api/v1/scenics/:id - 获取景点详情 (注意：特定路由应放在参数路由之前)
router.get('/:id', scenicController.getScenicDetail);

// POST /api/v1/scenics/:id/reviews - 提交景点评价
router.post('/:id/reviews', protect, scenicController.submitReview);

// Admin routes (protected)
router.post('/', protect, admin, scenicController.createScenic);
router.put('/:id', protect, admin, scenicController.updateScenic);
router.delete('/:id', protect, admin, scenicController.deleteScenic);

// Route for getting filter options (if exists)
// router.get('/filters', scenicController.getScenicFilters);

// 其他路由（例如获取详情、创建、更新、删除）可以后续添加
// router.get('/:scenicId', scenicController.getScenicDetail);
// router.post('/', scenicController.createScenic);
// router.put('/:scenicId', scenicController.updateScenic);
// router.delete('/:scenicId', scenicController.deleteScenic);

module.exports = router; 