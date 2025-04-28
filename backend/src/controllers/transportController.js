/**
 * 交通模块控制器
 * @module controllers/transportController
 */
const { Op } = require('sequelize');
const { sequelize } = require('../config/db.js');
const Transport = require('../models/Transport')(sequelize);

/**
 * 获取交通信息列表
 * @param {Object} req - 请求对象，支持筛选参数：from_city, to_city, transport_type, price_min, price_max
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
exports.getTransports = async (req, res, next) => {
    try {
        const { 
            from_city, 
            to_city, 
            transport_type, 
            price_min, 
            price_max,
            page = 1,
            limit = 10,
            sort_by = 'price',
            sort_order = 'asc'
        } = req.query;

        // 构建查询条件
        const where = {};
        if (from_city) where.from_city = from_city;
        if (to_city) where.to_city = to_city;
        if (transport_type) where.transport_type = transport_type;
        
        // 价格区间
        if (price_min || price_max) {
            where.price = {};
            if (price_min) where.price[Op.gte] = parseFloat(price_min);
            if (price_max) where.price[Op.lte] = parseFloat(price_max);
        }

        // 排序选项
        const order = [[sort_by, sort_order.toUpperCase()]];
        
        // 分页计算
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        // 执行查询
        const { count, rows } = await Transport.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset,
            order
        });

        // 将数据格式化为前端期望的格式
        const formattedTransports = rows.map(transport => ({
            id: transport.transport_id,
            type: transport.transport_type,
            fromCity: transport.from_city,
            toCity: transport.to_city,
            company: transport.company,
            price: transport.price,
            duration: transport.duration,
            createdAt: transport.created_at
        }));

        res.json({
            items: formattedTransports,
            total: count,
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit))
        });
    } catch (err) {
        console.error('获取交通信息列表失败:', err);
        next(err);
    }
};

/**
 * 获取单个交通信息详情
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
exports.getTransportById = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const transport = await Transport.findByPk(id);
        
        if (!transport) {
            return res.status(404).json({ message: '交通信息不存在' });
        }
        
        // 格式化数据
        const formattedTransport = {
            id: transport.transport_id,
            type: transport.transport_type,
            fromCity: transport.from_city,
            toCity: transport.to_city,
            company: transport.company,
            price: transport.price,
            duration: transport.duration,
            createdAt: transport.created_at,
            updatedAt: transport.updated_at
        };
        
        res.json(formattedTransport);
    } catch (err) {
        console.error(`获取交通信息 ${req.params.id} 详情失败:`, err);
        next(err);
    }
};

/**
 * 创建新的交通信息（仅管理员）
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
exports.createTransport = async (req, res, next) => {
    try {
        const { 
            transport_type, 
            from_city, 
            to_city, 
            company, 
            price, 
            duration 
        } = req.body;
        
        // 验证必填字段
        if (!transport_type || !from_city || !to_city || !price || !duration) {
            return res.status(400).json({ 
                message: '请提供交通类型、出发城市、目的地城市、价格和时长' 
            });
        }
        
        // 创建新交通信息
        const newTransport = await Transport.create({
            transport_type,
            from_city,
            to_city,
            company,
            price,
            duration
        });
        
        const formattedTransport = {
            id: newTransport.transport_id,
            type: newTransport.transport_type,
            fromCity: newTransport.from_city,
            toCity: newTransport.to_city,
            company: newTransport.company,
            price: newTransport.price,
            duration: newTransport.duration,
            createdAt: newTransport.created_at
        };
        
        res.status(201).json(formattedTransport);
    } catch (err) {
        console.error('创建交通信息失败:', err);
        next(err);
    }
};

/**
 * 更新交通信息（仅管理员）
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
exports.updateTransport = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { 
            transport_type, 
            from_city, 
            to_city, 
            company, 
            price, 
            duration 
        } = req.body;
        
        // 验证交通信息是否存在
        const transport = await Transport.findByPk(id);
        if (!transport) {
            return res.status(404).json({ message: '交通信息不存在' });
        }
        
        // 更新字段
        if (transport_type !== undefined) transport.transport_type = transport_type;
        if (from_city !== undefined) transport.from_city = from_city;
        if (to_city !== undefined) transport.to_city = to_city;
        if (company !== undefined) transport.company = company;
        if (price !== undefined) transport.price = price;
        if (duration !== undefined) transport.duration = duration;
        
        await transport.save();
        
        const formattedTransport = {
            id: transport.transport_id,
            type: transport.transport_type,
            fromCity: transport.from_city,
            toCity: transport.to_city,
            company: transport.company,
            price: transport.price,
            duration: transport.duration,
            updatedAt: transport.updated_at
        };
        
        res.json(formattedTransport);
    } catch (err) {
        console.error(`更新交通信息 ${req.params.id} 失败:`, err);
        next(err);
    }
};

/**
 * 删除交通信息（仅管理员）
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
exports.deleteTransport = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        // 验证交通信息是否存在
        const transport = await Transport.findByPk(id);
        if (!transport) {
            return res.status(404).json({ message: '交通信息不存在' });
        }
        
        await transport.destroy();
        
        res.status(200).json({
            success: true,
            message: '交通信息已成功删除'
        });
    } catch (err) {
        console.error(`删除交通信息 ${req.params.id} 失败:`, err);
        next(err);
    }
};

/**
 * 获取火车票信息
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
exports.getTrainTickets = async (req, res, next) => {
    try {
        const { date, from, to, trainCode } = req.query;
        
        // 在实际项目中，这里应该调用您的火车票API
        // 本例中使用模拟数据
        
        // 模拟延迟
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 生成模拟数据
        const data = {
            success: true,
            returnCode: 200,
            data: generateMockTrainTickets(from, to, date, trainCode)
        };
        
        res.json(data);
    } catch (err) {
        console.error('获取火车票信息失败:', err);
        next(err);
    }
};

/**
 * 获取热门列车路线
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
exports.getHotTrainRoutes = async (req, res, next) => {
    try {
        const { limit = 5 } = req.query;
        
        // 热门路线模拟数据
        const hotRoutes = [
            { from: '北京', to: '上海', count: 9876, avgPrice: 553 },
            { from: '广州', to: '北京', count: 8654, avgPrice: 780 },
            { from: '上海', to: '成都', count: 7890, avgPrice: 620 },
            { from: '深圳', to: '武汉', count: 6789, avgPrice: 410 },
            { from: '杭州', to: '西安', count: 6543, avgPrice: 430 },
            { from: '成都', to: '重庆', count: 5987, avgPrice: 120 },
            { from: '武汉', to: '广州', count: 5876, avgPrice: 380 },
            { from: '天津', to: '哈尔滨', count: 5432, avgPrice: 650 },
            { from: '南京', to: '长沙', count: 4987, avgPrice: 320 },
            { from: '西安', to: '昆明', count: 4876, avgPrice: 570 }
        ];
        
        res.json(hotRoutes.slice(0, parseInt(limit)));
    } catch (err) {
        console.error('获取热门列车路线失败:', err);
        next(err);
    }
};

/**
 * 生成模拟火车票数据
 * 仅用于开发和测试
 */
function generateMockTrainTickets(from, to, date, trainCode) {
    // 模拟常见列车类型
    const trainTypes = [
        { prefix: 'G', name: '高铁', speed: 'fast' },
        { prefix: 'D', name: '动车', speed: 'fast' },
        { prefix: 'K', name: '快速', speed: 'medium' },
        { prefix: 'T', name: '特快', speed: 'medium' },
        { prefix: 'Z', name: '直达', speed: 'medium' }
    ];
    
    // 生成随机列车数据
    const tickets = [];
    const count = trainCode ? 1 : Math.floor(Math.random() * 10) + 5;
    
    for (let i = 0; i < count; i++) {
        const trainType = trainTypes[Math.floor(Math.random() * trainTypes.length)];
        const ticketCode = trainCode || `${trainType.prefix}${Math.floor(Math.random() * 9000) + 1000}`;
        
        // 根据列车类型设置不同的发车时间和价格
        let departHour, arriveHour, runTime, prices;
        
        if (trainType.speed === 'fast') {
            departHour = Math.floor(Math.random() * 18) + 6; // 6:00 - 23:00
            runTime = Math.floor(Math.random() * 6) + 2; // 2-8小时
            prices = {
                swzNum: Math.random() > 0.3 ? String(Math.floor(Math.random() * 20)) : '--',
                swzPrice: '680',
                ydzNum: String(Math.floor(Math.random() * 50) + 10),
                ydzPrice: '350',
                edzNum: String(Math.floor(Math.random() * 100) + 50),
                edzPrice: '220',
                wzNum: Math.random() > 0.5 ? String(Math.floor(Math.random() * 50)) : '--',
                wzPrice: '220'
            };
        } else {
            departHour = Math.floor(Math.random() * 24);
            runTime = Math.floor(Math.random() * 12) + 6; // 6-18小时
            prices = {
                ywNum: String(Math.floor(Math.random() * 60) + 20),
                ywPrice: '280',
                yzNum: String(Math.floor(Math.random() * 100) + 50),
                yzPrice: '140',
                wzNum: String(Math.floor(Math.random() * 150) + 50),
                wzPrice: '120'
            };
        }
        
        arriveHour = (departHour + runTime) % 24;
        const arriveDays = departHour + runTime >= 24 ? '1' : '0';
        
        // 格式化时间
        const formatHour = (h) => {
            const hour = h.toString().padStart(2, '0');
            const minute = Math.floor(Math.random() * 6) * 10;
            return `${hour}:${minute.toString().padStart(2, '0')}`;
        };
        
        const departTime = formatHour(departHour);
        const arriveTime = formatHour(arriveHour);
        
        // 创建车票信息
        tickets.push({
            trainNo: `${Math.floor(Math.random() * 900000) + 100000}`,
            trainCode: ticketCode,
            startStationName: from,
            endStationName: to,
            fromStationCode: 'XXX',
            fromStationName: from,
            toStationCode: 'YYY',
            toStationName: to,
            startTime: departTime,
            arriveTime: arriveTime,
            arriveDays: arriveDays,
            runTime: `${runTime}小时${Math.floor(Math.random() * 60)}分`,
            canBuyNow: '1',
            runTimeMinute: String(runTime * 60 + Math.floor(Math.random() * 60)),
            trainStartDate: date || '2023-12-01',
            accessByIdcard: 'Y',
            saleDateTime: '',
            
            // 默认所有票价初始化为"--"
            gjrwNum: '--', gjrwPrice: '--',
            qtxbNum: '--', qtxbPrice: '--',
            rwNum: '--', rwPrice: '--',
            rzNum: '--', rzPrice: '--',
            swzNum: '--', swzPrice: '--',
            tdzNum: '--', tdzPrice: '--',
            wzNum: '--', wzPrice: '--',
            ywNum: '--', ywPrice: '--',
            yzNum: '--', yzPrice: '--',
            edzNum: '--', edzPrice: '--',
            ydzNum: '--', ydzPrice: '--',
            
            // 根据列车类型设置有效的票价
            ...prices
        });
    }
    
    return tickets;
}
