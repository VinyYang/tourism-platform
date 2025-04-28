/**
 * 文件上传路由
 * 处理文件上传相关的 API 请求
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const uploadController = require('../controllers/uploadController');
const uploadMiddleware = require('../config/multerConfig');

// 通用图片上传路由（无需登录）
router.post('/', uploadMiddleware.single('file'), uploadController.uploadImage);

// 需要登录的图片上传路由
router.post('/auth', protect, uploadMiddleware.single('file'), uploadController.uploadImage);

// 需要管理员权限的图片上传路由
// router.post('/admin', protect, authorize('admin'), uploadMiddleware.single('file'), uploadController.uploadImage);

module.exports = router; 