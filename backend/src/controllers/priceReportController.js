/**
 * 价格数据控制器
 * 用于提供景点和酒店价格相关的数据
 * @module controllers/priceReportController
 */

const { Op, Sequelize } = require('sequelize');
const db = require('../models');
const Scenic = db.Scenic;
const Hotel = db.Hotel;
const Room = db.Room;

/**
 * 获取城市景点和酒店价格数据
 * @param {object} req - Express请求对象
 * @param {object} res - Express响应对象
 * @param {function} next - Express下一个中间件
 * @returns {Promise<void>}
 */
exports.getCityPriceReport = async (req, res, next) => {
    try {
        const { city } = req.query;
        
        if (!city) {
            return res.status(400).json({ message: '城市参数必须提供' });
        }

        // 查询景点价格数据
        const scenicResult = await Scenic.findAll({
            attributes: [
                'name',
                'ticket_price',
                [Sequelize.fn('date_format', Sequelize.col('updated_at'), '%Y-%m-%d'), 'update_date']
            ],
            where: {
                city: city,
                ticket_price: { [Op.gt]: 0 }
            },
            order: [['ticket_price', 'DESC']],
            limit: 10
        });

        // 查询酒店价格数据
        const hotelResult = await Hotel.findAll({
            attributes: [
                'name',
                'stars',
                'avg_price',
                'type',
                [Sequelize.fn('date_format', Sequelize.col('updated_at'), '%Y-%m-%d'), 'update_date']
            ],
            where: {
                city: city,
                avg_price: { [Op.gt]: 0 }
            },
            order: [['stars', 'DESC'], ['avg_price', 'DESC']],
            limit: 10
        });

        // 查询各星级酒店的平均价格
        const hotelStatsResult = await Hotel.findAll({
            attributes: [
                'stars',
                [Sequelize.fn('AVG', Sequelize.col('avg_price')), 'avg_price'],
                [Sequelize.fn('COUNT', Sequelize.col('hotel_id')), 'count']
            ],
            where: {
                city: city,
                avg_price: { [Op.gt]: 0 }
            },
            group: ['stars'],
            order: [['stars', 'DESC']]
        });

        // 构造响应数据
        const responseData = {
            city: city,
            scenicPrices: scenicResult.map(item => ({
                name: item.name,
                price: item.ticket_price,
                update_date: item.dataValues.update_date
            })),
            hotelPrices: hotelResult.map(item => ({
                name: item.name,
                stars: item.stars,
                price: item.avg_price,
                type: item.type,
                update_date: item.dataValues.update_date
            })),
            hotelStats: hotelStatsResult.map(item => ({
                stars: item.stars,
                avgPrice: parseFloat(item.dataValues.avg_price).toFixed(2),
                count: item.dataValues.count
            }))
        };

        res.status(200).json(responseData);
    } catch (error) {
        console.error('获取城市价格数据出错:', error);
        next(error);
    }
};

/**
 * 获取热门城市的平均价格对比
 * @param {object} req - Express请求对象
 * @param {object} res - Express响应对象
 * @param {function} next - Express下一个中间件
 * @returns {Promise<void>}
 */
exports.getHotCitiesPriceComparison = async (req, res, next) => {
    try {
        // 定义要查询的热门城市列表
        const hotCities = ['北京', '上海', '广州', '深圳', '成都', '杭州', '西安', '三亚', '重庆', '南京'];
        
        // 获取每个城市的酒店平均价格和景点平均价格
        const result = await Promise.all(hotCities.map(async (city) => {
            // 查询酒店平均价格
            const hotelAvgPrice = await Hotel.findOne({
                attributes: [
                    [Sequelize.fn('AVG', Sequelize.col('avg_price')), 'avg_price']
                ],
                where: {
                    city: city,
                    avg_price: { [Op.gt]: 0 }
                },
                raw: true
            });

            // 查询景点平均价格
            const scenicAvgPrice = await Scenic.findOne({
                attributes: [
                    [Sequelize.fn('AVG', Sequelize.col('ticket_price')), 'avg_price']
                ],
                where: {
                    city: city,
                    ticket_price: { [Op.gt]: 0 }
                },
                raw: true
            });

            // 查询酒店数量
            const hotelCount = await Hotel.count({
                where: {
                    city: city,
                    avg_price: { [Op.gt]: 0 }
                }
            });

            // 查询景点数量
            const scenicCount = await Scenic.count({
                where: {
                    city: city,
                    ticket_price: { [Op.gt]: 0 }
                }
            });

            return {
                city,
                hotelAvgPrice: hotelAvgPrice.avg_price ? parseFloat(hotelAvgPrice.avg_price).toFixed(2) : 0,
                scenicAvgPrice: scenicAvgPrice.avg_price ? parseFloat(scenicAvgPrice.avg_price).toFixed(2) : 0,
                hotelCount,
                scenicCount
            };
        }));

        // 按酒店平均价格排序
        result.sort((a, b) => b.hotelAvgPrice - a.hotelAvgPrice);

        res.status(200).json({
            message: '热门城市价格对比数据获取成功',
            data: result
        });
    } catch (error) {
        console.error('获取热门城市价格对比数据出错:', error);
        next(error);
    }
};

/**
 * 获取各类酒店房间的平均价格
 * @param {object} req - Express请求对象
 * @param {object} res - Express响应对象
 * @param {function} next - Express下一个中间件
 * @returns {Promise<void>}
 */
exports.getRoomTypePriceAnalysis = async (req, res, next) => {
    try {
        const { city } = req.query;

        const whereClause = {};
        if (city) {
            // 通过关联查询城市
            whereClause['$Hotel.city$'] = city;
        }

        // 定义房间类型
        const roomTypes = [
            { pattern: '%标准%', label: '标准房' },
            { pattern: '%双床%', label: '双床房' },
            { pattern: '%大床%', label: '大床房' },
            { pattern: '%豪华%', label: '豪华房' },
            { pattern: '%套房%', label: '套房' },
            { pattern: '%行政%', label: '行政房' },
            { pattern: '%家庭%', label: '家庭房' }
        ];

        // 获取每种房型的价格数据
        const result = await Promise.all(roomTypes.map(async (type) => {
            const query = {
                attributes: [
                    [Sequelize.fn('AVG', Sequelize.col('price')), 'avg_price'],
                    [Sequelize.fn('COUNT', Sequelize.col('room_id')), 'count']
                ],
                where: {
                    name: { [Op.like]: type.pattern },
                    price: { [Op.gt]: 0 },
                    ...whereClause
                },
                include: [{
                    model: db.Hotel,
                    as: 'Hotel',
                    attributes: []
                }],
                raw: true
            };

            const roomData = await Room.findOne(query);

            return {
                type: type.label,
                avgPrice: roomData.avg_price ? parseFloat(roomData.avg_price).toFixed(2) : 0,
                count: roomData.count || 0
            };
        }));

        // 按平均价格排序
        result.sort((a, b) => b.avgPrice - a.avgPrice);

        res.status(200).json({
            message: '房间类型价格分析数据获取成功',
            city: city || '全国',
            data: result
        });
    } catch (error) {
        console.error('获取房间类型价格分析数据出错:', error);
        next(error);
    }
};

/**
 * 获取景点门票价格范围分布
 * @param {object} req - Express请求对象
 * @param {object} res - Express响应对象
 * @param {function} next - Express下一个中间件
 * @returns {Promise<void>}
 */
exports.getScenicPriceDistribution = async (req, res, next) => {
    try {
        // 定义价格范围
        const priceRanges = [
            { min: 0, max: 50, label: '50元以下' },
            { min: 50, max: 100, label: '50-100元' },
            { min: 100, max: 150, label: '100-150元' },
            { min: 150, max: 200, label: '150-200元' },
            { min: 200, max: 1000, label: '200元以上' }
        ];

        // 获取每个价格范围的景点数量
        const result = await Promise.all(priceRanges.map(async (range) => {
            const count = await Scenic.count({
                where: {
                    ticket_price: { 
                        [Op.gt]: range.min,
                        [Op.lte]: range.max
                    }
                }
            });

            return {
                range: range.label,
                count
            };
        }));

        res.status(200).json({
            message: '景点票价分布数据获取成功',
            data: result
        });
    } catch (error) {
        console.error('获取景点票价分布数据出错:', error);
        next(error);
    }
};

/**
 * 获取价格数据更新统计信息
 * @param {object} req - Express请求对象
 * @param {object} res - Express响应对象
 * @param {function} next - Express下一个中间件
 * @returns {Promise<void>}
 */
exports.getPriceUpdateStats = async (req, res, next) => {
    try {
        // 获取景点价格数据统计
        const scenicStats = await Scenic.findOne({
            attributes: [
                [Sequelize.fn('COUNT', Sequelize.col('scenic_id')), 'total'],
                [Sequelize.fn('COUNT', Sequelize.literal('CASE WHEN ticket_price > 0 THEN 1 END')), 'updated']
            ],
            raw: true
        });

        // 获取酒店价格数据统计
        const hotelStats = await Hotel.findOne({
            attributes: [
                [Sequelize.fn('COUNT', Sequelize.col('hotel_id')), 'total'],
                [Sequelize.fn('COUNT', Sequelize.literal('CASE WHEN avg_price > 0 THEN 1 END')), 'updated']
            ],
            raw: true
        });

        // 获取房间价格数据统计
        const roomStats = await Room.findOne({
            attributes: [
                [Sequelize.fn('COUNT', Sequelize.col('room_id')), 'total'],
                [Sequelize.fn('COUNT', Sequelize.literal('CASE WHEN price > 0 THEN 1 END')), 'updated']
            ],
            raw: true
        });

        res.status(200).json({
            message: '价格数据更新统计获取成功',
            data: {
                scenic: {
                    total: scenicStats.total,
                    updated: scenicStats.updated,
                    percent: ((scenicStats.updated / scenicStats.total) * 100).toFixed(2)
                },
                hotel: {
                    total: hotelStats.total,
                    updated: hotelStats.updated,
                    percent: ((hotelStats.updated / hotelStats.total) * 100).toFixed(2)
                },
                room: {
                    total: roomStats.total,
                    updated: roomStats.updated,
                    percent: ((roomStats.updated / roomStats.total) * 100).toFixed(2)
                }
            }
        });
    } catch (error) {
        console.error('获取价格数据更新统计出错:', error);
        next(error);
    }
}; 