/**
 * 交通路由模块
 * 定义与交通信息相关的API端点
 * @module routes/transportRoutes
 */

const express = require('express');
const transportController = require('../controllers/transportController');
const { protect, authorize } = require('../middlewares/auth.js'); // 导入正确的函数名
const proxyController = require('../controllers/proxyController');
// 修复路径不一致
// const { authenticateJWT, isAdmin } = require('../middleware/auth');

const router = express.Router();

// 先定义具体路径的公共路由，避免被通配符路由捕获
// 车次查询路由 - 公开访问
router.get('/train/tickets', transportController.getTrainTickets);
router.get('/train/hotRoutes', transportController.getHotTrainRoutes);

// 添加途牛火车票API代理路由 - 公开访问
router.get('/proxy/train/tickets', proxyController.proxyTuniuTrainTickets);

// 获取所有交通信息 (对所有登录用户开放)
router.get('/', protect, transportController.getTransports);

// 获取单个交通信息 (对所有登录用户开放) - 这是带参数的路由，应该在特定路径路由之后
router.get('/:id', protect, transportController.getTransportById);

// --- 以下路由需要管理员权限 ---

// 应用认证和管理员权限中间件 (注意 authorize 的用法)
router.use(protect, authorize('admin'));

// POST /api/v1/transports - 创建新交通信息 (限管理员)
router.post('/', transportController.createTransport);

// PUT /api/v1/transports/:id - 更新交通信息 (限管理员)
router.put('/:id', transportController.updateTransport);

// DELETE /api/v1/transports/:id - 删除交通信息 (限管理员)
router.delete('/:id', transportController.deleteTransport);

module.exports = router;
