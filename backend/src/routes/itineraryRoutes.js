/**
 * 定制行程路由
 */
const express = require('express');
const { protect } = require('../middlewares/auth');
const itineraryController = require('../controllers/itineraryController');
const router = express.Router();

// 所有路由都需要登录保护
router.use(protect);

// 获取用户的所有行程列表
router.get('/', itineraryController.getItineraries);

// 创建新行程 (手动或推荐生成后保存的基础信息)
router.post('/', itineraryController.createItinerary);

// 通过自定义URL获取行程 (可以在getItineraryById之前，避免URL误识别为ID)
router.get('/custom/:customUrl', itineraryController.getItineraryByCustomUrl);

// 获取单个行程详情
router.get('/:id', itineraryController.getItineraryById);

// 更新行程基本信息
router.put('/:id', itineraryController.updateItinerary);

// 删除行程
router.delete('/:id', itineraryController.deleteItinerary);

// --- 行程项操作 --- 

// 向行程添加项
router.post('/:id/items', itineraryController.addItineraryItem);

// 更新行程中的某一项
router.put('/:id/items/:itemId', itineraryController.updateItineraryItem);

// 从行程中删除某一项
router.delete('/:id/items/:itemId', itineraryController.deleteItineraryItem);

// 以下路由暂未实现，先注释掉
// 重新排序行程项
// router.put('/:id/days/:dayNumber/reorder', itineraryController.reorderItems);

// 移动行程项到不同的天
// router.put('/:id/items/:itemId/move', itineraryController.moveItemToDay);

module.exports = router; 