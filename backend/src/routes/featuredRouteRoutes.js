const express = require('express');
const router = express.Router();
const featuredRouteController = require('../controllers/featuredRouteController');
const { protect, authorize } = require('../middlewares/auth'); // 修复导入路径和函数名

// --- 公共路由 (无需认证) ---
// 获取所有已启用的精选路线
router.get('/featured-routes', featuredRouteController.getPublicFeaturedRoutes);

// 获取单个精选路线详情
router.get('/featured-routes/:id', featuredRouteController.getPublicFeaturedRouteById);

// --- 应用精选路线 ---
// 应用精选路线到用户行程 (需要用户认证)
router.post('/featured-routes/:id/apply', protect, featuredRouteController.applyFeaturedRouteToUser);

// --- 管理员路由 (需要管理员认证) ---
// 创建新的精选路线
router.post('/admin/featured-routes', protect, authorize('admin'), featuredRouteController.createFeaturedRoute);

// 获取所有精选路线 (管理员视图)
router.get('/admin/featured-routes', protect, authorize('admin'), featuredRouteController.getAllFeaturedRoutes);

// 获取单个精选路线详情 (管理员视图)
router.get('/admin/featured-routes/:id', protect, authorize('admin'), featuredRouteController.adminGetFeaturedRouteById);

// 更新精选路线
router.put('/admin/featured-routes/:id', protect, authorize('admin'), featuredRouteController.updateFeaturedRoute);

// 删除精选路线
router.delete('/admin/featured-routes/:id', protect, authorize('admin'), featuredRouteController.deleteFeaturedRoute);

module.exports = router; 