const express = require('express');
const cityController = require('../controllers/cityController');

const router = express.Router();

// GET /api/v1/cities/popular - 获取热门城市列表
router.get('/popular', cityController.getPopularCities);

module.exports = router; 