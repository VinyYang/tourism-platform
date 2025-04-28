const express = require('express');
// 引入各模块路由
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const scenicRoutes = require('./scenicRoutes');
const hotelRoutes = require('./hotelRoutes');
const roomRoutes = require('./roomRoutes');
const bookingRoutes = require('./bookingRoutes');
const reviewRoutes = require('./reviewRoutes');
const uploadRoutes = require('./uploadRoutes');
const favoriteRoutes = require('./favoriteRoutes');
const strategyRoutes = require('./strategyRoutes');
const searchRoutes = require('./searchRoutes');
const priceReportRoutes = require('./priceReportRoutes'); // 新增价格报表路由
const adminRoutes = require('./adminRoutes');
const trainRoutes = require('./trainRoutes'); // 新增火车票路由
const cityRoutes = require('./cityRoutes'); // 新增城市路由

const router = express.Router();

// 注册各模块路由
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/scenics', scenicRoutes);
router.use('/hotels', hotelRoutes);
router.use('/rooms', roomRoutes);
router.use('/bookings', bookingRoutes);
router.use('/reviews', reviewRoutes);
router.use('/upload', uploadRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/strategies', strategyRoutes);
router.use('/search', searchRoutes);
router.use('/price-report', priceReportRoutes); // 注册价格报表路由
router.use('/admin', adminRoutes);
router.use('/train', trainRoutes); // 注册火车票路由
router.use('/cities', cityRoutes); // 注册城市路由

module.exports = router; 