/**
 * 定制行程控制器
 */
const { Op } = require('sequelize');
const { sequelize } = require('../config/db.js');
const db = require('../models');
const CustomizedItinerary = db.CustomizedItinerary;
const ItineraryItem = db.ItineraryItem;
const Scenic = db.Scenic;
const Hotel = db.Hotel;
const Transport = db.Transport;

// 获取用户的所有定制行程列表 或 公开行程列表
exports.getItineraries = async (req, res, next) => {
    // 从 query 中解构所需参数
    const { 
        page = 1, 
        limit = 10, 
        isPublic, // string 'true' or undefined
        sortBy = 'newest', // 'newest' or 'popularity' (暂时按更新时间)
        keyword 
    } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {}; // 初始化 where 条件
    let order = [['created_at', 'DESC']]; // 默认排序

    if (isPublic === 'true') {
        // 获取公开的、已发布的行程
        where.is_public = true;
        where.status = 'published';
    } else {
        // 获取当前用户的行程（需要认证中间件确保 req.user 存在）
        if (!req.user || !req.user.id) {
            // 如果是获取用户行程但用户未登录，返回错误或空列表
            // 为保持与前端逻辑一致（前端会阻止未登录用户访问'my' tab），这里假设 protect 中间件已处理
             return res.status(401).json({ message: '用户未登录' }); 
             // 或者返回空列表: return res.json({ items: [], total: 0, page: 1, totalPages: 0 });
        }
        where.user_id = req.user.id;
    }

    // 处理搜索关键词
    if (keyword && typeof keyword === 'string' && keyword.trim() !== '') {
        const searchTerm = `%${keyword.trim()}%`;
        where[Op.or] = [
            { title: { [Op.like]: searchTerm } },
            { city: { [Op.like]: searchTerm } }
            // 可以根据需要添加更多搜索字段，如 description
            // { description: { [Op.like]: searchTerm } } 
        ];
    }

    // 处理排序 (暂时将 popularity 映射为按更新时间排序)
    if (sortBy === 'popularity') {
        order = [['updated_at', 'DESC']];
    } // else 保持默认按创建时间

    try {
        const { count, rows } = await CustomizedItinerary.findAndCountAll({
            where, // 使用动态构建的 where 条件
            limit: parseInt(limit),
            offset: offset,
            order, // 使用动态构建的 order 条件
            // 可以考虑只选择列表需要的字段以提高效率
            // attributes: ['itinerary_id', 'title', 'city', 'start_date', 'end_date', 'cover', 'is_public', 'status', 'created_at', 'updated_at'],
            // 如果需要显示第一张图片或总天数，可能需要更复杂的查询或在模型层面处理
        });

        // 将 snake_case 转换为 camelCase 以匹配前端
        const mappedRows = rows.map(row => ({
            id: row.itinerary_id,
            userId: row.user_id,
            title: row.title,
            description: row.description,
            city: row.city,
            startDate: row.start_date,
            endDate: row.end_date,
            cover: row.cover,
            isPublic: row.is_public,
            status: row.status,
            estimatedBudget: row.estimated_budget, // 确保前端处理可能的字符串或数字
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            // 如果需要包含 items 或 daysList，也需要在此处转换
        }));

        // 返回转换后的数据
        res.json({ 
            itineraries: mappedRows, // 使用转换后的 camelCase 数据
            total: count, 
            currentPage: parseInt(page), 
            totalPages: Math.ceil(count / parseInt(limit)) 
        });
    } catch (err) {
        console.error('获取行程列表失败:', err);
        next(err);
    }
};

// 创建新的定制行程 (手动)
exports.createItinerary = async (req, res, next) => {
    const userId = req.user.id;
    // 允许只传 title，其他字段可以后续补充
    const { title, description, city, startDate, endDate, estimatedBudget, isPublic = false, daysList, status = 'draft', customUrl, cover } = req.body; // 添加 customUrl 和 cover

    // 修改验证逻辑，仅要求 title 必填
    if (!title) {
        return res.status(400).json({ message: '请提供行程标题' });
    }

    // 使用事务确保行程和行程项的创建是原子操作
    const transaction = await sequelize.transaction();
    let committed = false;

    try {
        // 创建行程基本信息
        const newItinerary = await CustomizedItinerary.create({
            user_id: userId,
            title,
            description,
            city, // 允许为空
            start_date: startDate || null, // 如果未提供，设为 null
            end_date: endDate || null, // 如果未提供，设为 null
            estimated_budget: estimatedBudget || null, // 如果未提供，设为 null
            is_public: isPublic,
            status: status, // 保存状态
            custom_url: customUrl || null, // 添加自定义URL
            cover: cover || null // 添加封面图片
        }, { transaction });
        
        // 如果有daysList数据，创建行程项
        if (daysList && Array.isArray(daysList) && daysList.length > 0) {
            const itineraryItemsData = []; // 重命名变量以示区分
            
            // 遍历每一天
            for (const day of daysList) {
                const { dayNumber, items } = day;
                
                if (items && Array.isArray(items) && items.length > 0) {
                    // 遍历当天的每个项目
                    for (const item of items) {
                        // 验证 itemId (如果需要外键关联)
                        let scenicId = null;
                        let hotelId = null;
                        let transportId = null;
                        const itemId = item.itemId; // 原始 ID

                        if (itemId) { // 仅当 itemId 存在时进行验证
                            const numericItemId = parseInt(itemId);
                            if (!isNaN(numericItemId) && numericItemId > 0) {
                                try {
                                    if (item.itemType === 'scenic') {
                                        // 可选：查询 Scenic 表确认 ID 存在
                                        // const scenicExists = await Scenic.findByPk(numericItemId, { transaction });
                                        // if (scenicExists) scenicId = numericItemId;
                                        scenicId = numericItemId; // 暂时不强制查询
                                    } else if (item.itemType === 'hotel') {
                                        // 可选：查询 Hotel 表确认 ID 存在
                                        // const hotelExists = await Hotel.findByPk(numericItemId, { transaction });
                                        // if (hotelExists) hotelId = numericItemId;
                                        hotelId = numericItemId; // 暂时不强制查询
                                    } else if (item.itemType === 'transport') {
                                        // 可选：查询 Transport 表确认 ID 存在
                                        // const transportExists = await Transport.findByPk(numericItemId, { transaction });
                                        // if (transportExists) transportId = numericItemId;
                                        transportId = numericItemId; // 暂时不强制查询
                                    }
                                } catch (validationError) {
                                    console.warn(`验证 itemId ${itemId} (${item.itemType}) 时出错:`, validationError);
                                    // 验证失败，保持 ID 为 null
                                }
                            } else {
                                console.warn(`无效的 itemId ${itemId} (${item.itemType})，将设置为 null`);
                            }
                        } 

                        // --- 开始添加的代码 ---
                        let dbItemType = item.itemType; // 获取前端传来的类型
                        const validItemTypes = ['scenic', 'hotel', 'transport', 'activity']; // 定义模型允许的类型

                        // 检查类型是否有效
                        if (!validItemTypes.includes(dbItemType)) {
                            // 如果类型无效，记录警告并设置默认值
                            console.warn(`[itineraryController] Received invalid itemType '${dbItemType}' for item '${item.name || '(no name)'}'. Defaulting to 'activity'.`);
                            dbItemType = 'activity'; // 将无效类型映射为 'activity'
                        }
                        // --- 结束添加的代码 ---

                        // 构建行程项数据，包含新字段
                        const itemData = {
                            itinerary_id: newItinerary.itinerary_id,
                            day_number: dayNumber,
                            item_type: dbItemType, // <-- 修改这里，使用 dbItemType
                            name: item.name || null, // 从前端获取 name
                            image: Array.isArray(item.image) ? (item.image[0] || null) : (item.image || null),
                            location: item.location || null, // 从前端获取 location
                            scenic_id: scenicId,
                            hotel_id: hotelId,
                            transport_id: transportId,
                            notes: item.notes || null,
                            start_time: item.startTime || null,
                            end_time: item.endTime || null,
                            order_number: item.order,
                            price: item.price ?? null // 添加 price 字段
                        };
                        
                        itineraryItemsData.push(itemData);
                    }
                }
            }
            
            // 批量创建行程项
            if (itineraryItemsData.length > 0) {
                await ItineraryItem.bulkCreate(itineraryItemsData, { transaction });
            }
        }
        
        // 提交事务
        console.log('准备提交事务 (Create) for itinerary ID:', 'new');
        await transaction.commit();
        committed = true;
        console.log('事务提交成功 (Create) for itinerary ID:', newItinerary?.itinerary_id);
        
        // 查询完整的行程信息（包括刚创建的行程项）
        const completeItinerary = await CustomizedItinerary.findByPk(newItinerary.itinerary_id, {
            include: [
                {
                    model: ItineraryItem,
                    as: 'items',
                    include: [
                        { 
                            model: Scenic, 
                            required: false,
                            attributes: [
                                'scenic_id', 'name', 'city', 'address', 'description', 
                                'open_time', 'ticket_price', 'images', 'label', 'hot_score', 
                                'latitude', 'longitude', 'is_custom', 
                                'created_at', 'updated_at'
                            ]
                        },
                        { model: Hotel, required: false },
                        { model: Transport, required: false }
                    ]
                }
            ],
            order: [
                [{ model: ItineraryItem, as: 'items' }, 'day_number', 'ASC'],
                [{ model: ItineraryItem, as: 'items' }, 'order_number', 'ASC']
            ]
        });
        
        // Checklist item 5: Convert flat 'items' array to nested 'daysList'
        const formattedItinerary = formatItineraryResponse(completeItinerary);
        
        res.status(201).json(formattedItinerary);
    } catch (err) {
        // 如果出错且事务未提交，回滚事务
        if (!committed && transaction) {
            console.log('准备回滚事务 (Create) for itinerary ID:', 'new', '错误:', err.message);
            await transaction.rollback();
            console.log('事务回滚完成 (Create) for itinerary ID:', 'new');
        }
        console.error('创建定制行程失败:', err.message, err.original ? JSON.stringify(err.original) : '');
        next(err);
    }
};

// Helper function to format itinerary response
const formatItineraryResponse = (itineraryInstance) => {
    if (!itineraryInstance) return null;
    
    // Sequelize instance to plain object
    const itinerary = itineraryInstance.get({ plain: true }); 
    
    if (!itinerary.items || !Array.isArray(itinerary.items)) {
        itinerary.daysList = []; // Ensure daysList exists even if no items
        delete itinerary.items; // Remove the original items array
        return itinerary;
    }
    
    const itemsByDay = {};
    itinerary.items.forEach(item => {
        const dayNum = item.day_number;
        if (!itemsByDay[dayNum]) {
            itemsByDay[dayNum] = [];
        }
        // Optionally remove associated model data if not needed by frontend
        // delete item.Scenic;
        // delete item.Hotel;
        // delete item.Transport;
        itemsByDay[dayNum].push(item);
    });
    
    itinerary.daysList = Object.entries(itemsByDay)
        .map(([dayNumber, items]) => ({
            dayNumber: parseInt(dayNumber),
            items: items.sort((a, b) => a.order_number - b.order_number) // Sort items within the day
        }))
        .sort((a, b) => a.dayNumber - b.dayNumber); // Sort days
        
    delete itinerary.items; // Remove the original flat items array
    
    return itinerary;
};

// 获取单个行程详情 (包括所有行程项)
exports.getItineraryById = async (req, res, next) => {
    const { id } = req.params;
    
    // 增加详细日志
    console.log(`===== 获取行程详情开始 =====`);
    console.log(`请求参数: 行程ID=${id}`);
    
    // 验证用户信息
    if (!req.user) {
        console.error(`获取行程详情错误: 用户未认证`);
        return res.status(401).json({ success: false, message: '用户未认证，请先登录' });
    }
    
    const userId = req.user.id;
    console.log(`当前用户ID: ${userId}`);

    try {
        // 首先尝试查找行程，不带用户限制，用于调试
        const anyItinerary = await CustomizedItinerary.findByPk(id);
        if (!anyItinerary) {
            console.error(`获取行程详情失败: 行程ID ${id} 不存在`);
            return res.status(404).json({ success: false, message: '行程不存在', error: 'not_found' });
        } else if (anyItinerary.user_id !== userId) {
            console.error(`获取行程详情失败: 行程ID ${id} 属于用户 ${anyItinerary.user_id}，当前用户 ${userId} 无权访问`);
            return res.status(403).json({ success: false, message: '无权访问此行程', error: 'permission_denied' });
        }
        
        // 正常流程：根据ID和用户ID查询行程
        const itinerary = await CustomizedItinerary.findOne({
            where: { itinerary_id: id, user_id: userId },
            include: [
                {
                    model: ItineraryItem, 
                    as: 'items',
                    include: [
                        // 修改查询方式，明确指定需要的字段，不直接使用location
                        { 
                            model: Scenic, 
                            required: false,
                            attributes: [
                                'scenic_id', 'name', 'city', 'address', 'description', 
                                'open_time', 'ticket_price', 'images', 'label', 'hot_score', 
                                'latitude', 'longitude', 'is_custom', 
                                'created_at', 'updated_at'
                            ]
                        },
                        { model: Hotel, required: false },
                        { model: Transport, required: false }
                    ]
                }
            ],
            order: [
                [ { model: ItineraryItem, as: 'items' }, 'day_number', 'ASC' ],
                [ { model: ItineraryItem, as: 'items' }, 'order_number', 'ASC' ]
            ]
        });

        // 正式判断行程是否存在
        if (!itinerary) {
            // 此时已知行程存在但用户无权访问，因为上面已经做过检查
            return res.status(403).json({ 
                success: false, 
                message: '无权访问此行程', 
                error: 'permission_denied' 
            });
        }

        // 格式化响应
        const formattedItinerary = formatItineraryResponse(itinerary);
        console.log(`获取行程详情成功: 行程ID=${id}, 标题="${formattedItinerary.title}"`);
        console.log(`===== 获取行程详情结束 =====`);
        
        res.json(formattedItinerary);
    } catch (err) {
        console.error(`===== 获取行程 ${id} 详情失败 =====`);
        console.error(`错误类型: ${err.name}`);
        console.error(`错误消息: ${err.message}`);
        console.error(`错误堆栈: ${err.stack}`);
        if (err.original) {
            console.error(`原始数据库错误: ${JSON.stringify(err.original)}`);
        }
        console.error(`===== 错误详情结束 =====`);
        
        // 返回友好的错误信息
        res.status(500).json({
            success: false,
            message: '获取行程详情时发生服务器错误',
            error: err.message
        });
    }
};

// 更新行程基本信息
exports.updateItinerary = async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.id;
    // 添加 status, startDate, endDate, city, estimatedBudget
    const { title, description, city, startDate, endDate, estimatedBudget, isPublic, status, daysList, customUrl, cover } = req.body;

    // 使用事务确保更新操作的原子性
    const transaction = await sequelize.transaction();
    let committed = false;
    let itinerary;

    try {
        itinerary = await CustomizedItinerary.findOne({
            where: { itinerary_id: id, user_id: userId }
        });

        if (!itinerary) {
            console.log('准备回滚事务 (Update - Not Found) for itinerary ID:', id);
            await transaction.rollback(); // 回滚因为找不到记录
            console.log('事务回滚完成 (Update - Not Found) for itinerary ID:', id);
            return res.status(404).json({ message: '行程不存在或无权修改' });
        }

        // 如果尝试将 status 更新为 'published'，进行完整性校验
        if (status === 'published' && itinerary.status !== 'published') {
            const missingFields = [];
            if (!itinerary.start_date && !startDate) missingFields.push('起止日期');
            if (!itinerary.end_date && !endDate) missingFields.push('起止日期'); // Check endDate too
            if (!itinerary.city && !city) missingFields.push('目的地城市');
            if (!itinerary.estimated_budget && !estimatedBudget) missingFields.push('预算');

            if (missingFields.length > 0) {
                console.log('准备回滚事务 (Update - Missing Fields) for itinerary ID:', id);
                await transaction.rollback(); // 回滚因为字段缺失
                console.log('事务回滚完成 (Update - Missing Fields) for itinerary ID:', id);
                return res.status(400).json({ message: `无法发布行程，请先填写: ${missingFields.join(', ')}` });
            }
        }

        // 更新行程基本信息
        if (title !== undefined) itinerary.title = title;
        if (description !== undefined) itinerary.description = description;
        if (city !== undefined) itinerary.city = city; // 允许更新 city
        if (startDate !== undefined && startDate !== null) itinerary.start_date = startDate; // 允许更新 startDate, 检查 null
        if (endDate !== undefined && endDate !== null) itinerary.end_date = endDate; // 允许更新 endDate, 检查 null
        if (estimatedBudget !== undefined && estimatedBudget !== null) itinerary.estimated_budget = estimatedBudget; // 允许更新 budget, 检查 null
        if (isPublic !== undefined) itinerary.is_public = !!isPublic; // 转换为布尔值
        if (status !== undefined && ['draft', 'published'].includes(status)) itinerary.status = status; // 允许更新 status
        if (customUrl !== undefined) itinerary.custom_url = customUrl || null; // 允许更新自定义URL
        if (cover !== undefined) itinerary.cover = cover || null; // 允许更新封面图片

        await itinerary.save({ transaction });

        // 如果提供了daysList，更新行程项 (逻辑与 createItinerary 类似)
        if (daysList && Array.isArray(daysList)) { // 允许空数组清空行程项
            // 处理策略：删除所有现有项，然后重新创建
            await ItineraryItem.destroy({
                where: { itinerary_id: id },
                transaction
            });

            if (daysList.length > 0) {
                const itineraryItemsData = []; // 重命名变量
                
                for (const day of daysList) {
                    const { dayNumber, items } = day;
                    
                    if (items && Array.isArray(items) && items.length > 0) {
                        for (const item of items) {
                             // 验证 itemId (逻辑同 createItinerary)
                            let scenicId = null;
                            let hotelId = null;
                            let transportId = null;
                            const itemId = item.itemId;

                            if (itemId) { 
                                const numericItemId = parseInt(itemId);
                                if (!isNaN(numericItemId) && numericItemId > 0) {
                                    try {
                                        if (item.itemType === 'scenic') scenicId = numericItemId;
                                        else if (item.itemType === 'hotel') hotelId = numericItemId;
                                        else if (item.itemType === 'transport') transportId = numericItemId;
                                        // 此处同样省略了强制查询存在性的逻辑
                                    } catch (validationError) {
                                        console.warn(`验证 itemId ${itemId} (${item.itemType}) 时出错:`, validationError);
                                    }
                                } else {
                                     console.warn(`无效的 itemId ${itemId} (${item.itemType})，将设置为 null`);
                                }
                            } 
                            // 构建行程项数据，包含新字段
                            const itemData = {
                                itinerary_id: id, // 使用当前行程 ID
                                day_number: dayNumber,
                                item_type: item.itemType,
                                name: item.name || null, // 从前端获取 name
                                image: Array.isArray(item.image) ? (item.image[0] || null) : (item.image || null),
                                location: item.location || null, // 从前端获取 location
                                scenic_id: scenicId,
                                hotel_id: hotelId,
                                transport_id: transportId,
                                notes: item.notes || null,
                                start_time: item.startTime || null,
                                end_time: item.endTime || null,
                                order_number: item.order,
                                price: item.price ?? null // 添加 price 字段
                            };
                            
                            itineraryItemsData.push(itemData);
                        }
                    }
                }
                
                if (itineraryItemsData.length > 0) {
                    await ItineraryItem.bulkCreate(itineraryItemsData, { transaction });
                }
            }
        }
        console.log('准备提交事务 (Update) for itinerary ID:', id);
        await transaction.commit();
        committed = true;
        console.log('事务提交成功 (Update) for itinerary ID:', id);

        // 获取更新后的完整行程信息
        const updatedItinerary = await CustomizedItinerary.findByPk(id, {
            include: [
                {
                    model: ItineraryItem,
                    as: 'items',
                    include: [
                        { 
                            model: Scenic, 
                            required: false,
                            attributes: [
                                'scenic_id', 'name', 'city', 'address', 'description', 
                                'open_time', 'ticket_price', 'images', 'label', 'hot_score', 
                                'latitude', 'longitude', 'is_custom', 
                                'created_at', 'updated_at'
                            ]
                        },
                        { model: Hotel, required: false },
                        { model: Transport, required: false }
                    ]
                }
            ],
            order: [
                [{ model: ItineraryItem, as: 'items' }, 'day_number', 'ASC'],
                [{ model: ItineraryItem, as: 'items' }, 'order_number', 'ASC']
            ]
        });

        // Checklist item 6: Convert flat 'items' array to nested 'daysList'
        const formattedItinerary = formatItineraryResponse(updatedItinerary);

        res.json(formattedItinerary); // 返回更新后的行程信息

    } catch (err) {
        // 只有在事务未提交时才回滚
        if (!committed && transaction) {
            console.log('准备回滚事务 (Update) for itinerary ID:', id, '错误:', err.message);
            await transaction.rollback();
            console.log('事务回滚完成 (Update) for itinerary ID:', id);
        }
        console.error(`更新行程 ${id} 失败:`, err.message, err.original ? JSON.stringify(err.original) : '');
        next(err);
    }
};

// 删除行程
exports.deleteItinerary = async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        // 验证行程是否存在且属于当前用户
        const itinerary = await CustomizedItinerary.findOne({ 
            where: { itinerary_id: id, user_id: userId },
            attributes: ['itinerary_id'] 
        });
        if (!itinerary) {
            return res.status(404).json({ message: '行程不存在或无权删除' });
        }

        // 删除行程及其所有行程项 (由数据库外键 CASCADE 约束自动处理)
        const deletedCount = await CustomizedItinerary.destroy({
            where: { itinerary_id: id, user_id: userId }
        });
        
        // ItineraryItem 会因为 CustomizedItinerary 设置了 ON DELETE CASCADE 而自动删除
        // 如果没有设置级联删除，则需要先手动删除 ItineraryItem:
        // await ItineraryItem.destroy({ where: { itinerary_id: id } });
        // await itinerary.destroy();

        if (deletedCount === 0) {
            // 理论上前面已经检查过，这里应该不会发生
            return res.status(404).json({ message: '行程不存在或无权删除' });
        }

        res.status(200).json({ success: true, message: '行程已成功删除' });

    } catch (err) {
        console.error(`删除行程 ${id} 失败:`, err);
        next(err);
    }
};

// 添加行程项
exports.addItineraryItem = async (req, res, next) => {
    const { id: itineraryId } = req.params; // 行程 ID
    const userId = req.user.id;
    const { 
        day_number, 
        item_type, 
        scenic_id, 
        hotel_id, 
        transport_id, 
        activity_description, // 如果 item_type 是 'activity'
        start_time, 
        end_time, 
        notes, 
        order_number 
    } = req.body;

    // 基本验证
    if (!day_number || !item_type || !order_number) {
        return res.status(400).json({ message: '缺少必要的行程项信息 (天数、类型、顺序)' });
    }
    if (!['scenic', 'hotel', 'transport', 'activity'].includes(item_type)) {
        return res.status(400).json({ message: '无效的行程项类型' });
    }
    if (item_type === 'scenic' && !scenic_id) return res.status(400).json({ message: '景点类型需提供 scenic_id' });
    if (item_type === 'hotel' && !hotel_id) return res.status(400).json({ message: '酒店类型需提供 hotel_id' });
    if (item_type === 'transport' && !transport_id) return res.status(400).json({ message: '交通类型需提供 transport_id' });
    if (item_type === 'activity' && !activity_description) return res.status(400).json({ message: '活动类型需提供描述' });

    try {
        // 验证行程是否存在且属于当前用户
        const itinerary = await CustomizedItinerary.findOne({ 
            where: { itinerary_id: itineraryId, user_id: userId }
        });
        if (!itinerary) {
            return res.status(404).json({ message: '行程不存在或无权修改' });
        }

        // 验证关联项是否存在 (可选但推荐)
        if (item_type === 'scenic' && !(await Scenic.findByPk(scenic_id))) return res.status(404).json({ message: '关联的景点不存在' });
        if (item_type === 'hotel' && !(await Hotel.findByPk(hotel_id))) return res.status(404).json({ message: '关联的酒店不存在' });
        // if (item_type === 'transport' && !(await Transport.findByPk(transport_id))) return res.status(404).json({ message: '关联的交通方式不存在' });

        const newItemData = {
            itinerary_id: parseInt(itineraryId), // 确保是数字
            day_number: parseInt(day_number),
            item_type,
            scenic_id: item_type === 'scenic' ? parseInt(scenic_id) : null,
            hotel_id: item_type === 'hotel' ? parseInt(hotel_id) : null,
            transport_id: item_type === 'transport' ? parseInt(transport_id) : null,
            notes: item_type === 'activity' ? activity_description : notes, // 活动类型用 notes 存描述
            start_time: start_time || null,
            end_time: end_time || null,
            order_number: parseInt(order_number),
            price: req.body.price ?? null // 修正变量引用
        };

        const newItem = await ItineraryItem.create(newItemData);

        // 查询新建的 item 并包含关联数据返回 (可选)
        const newItemWithDetails = await ItineraryItem.findByPk(newItem.item_id, {
            include: [
                { 
                    model: Scenic, 
                    required: false,
                    attributes: [
                        'scenic_id', 'name', 'city', 'address', 'description', 
                        'open_time', 'ticket_price', 'images', 'label', 'hot_score', 
                        'latitude', 'longitude', 'is_custom', 
                        'created_at', 'updated_at'
                    ]
                },
                { model: Hotel, required: false },
                { model: Transport, required: false }
            ]
        });

        // TODO: 格式化 newItemWithDetails
        res.status(201).json(newItemWithDetails);

    } catch (err) {
        console.error(`向行程 ${itineraryId} 添加项失败:`, err);
        next(err);
    }
};

// 更新行程项
exports.updateItineraryItem = async (req, res, next) => {
    const { itineraryId, itemId } = req.params;
    const userId = req.user.id;
    const { 
        day_number, 
        item_type, // 通常不允许修改类型，但如果允许则需要验证
        scenic_id, 
        hotel_id, 
        transport_id,
        activity_description,
        start_time, 
        end_time, 
        notes, 
        order_number 
    } = req.body;

    try {
        // 验证行程是否存在且属于当前用户
        const itinerary = await CustomizedItinerary.findOne({ 
            where: { itinerary_id: itineraryId, user_id: userId },
            attributes: ['itinerary_id'] // 只需要 ID 确认存在和权限
        });
        if (!itinerary) {
            return res.status(404).json({ message: '行程不存在或无权修改' });
        }

        // 查找要更新的行程项
        const item = await ItineraryItem.findOne({
            where: { item_id: itemId, itinerary_id: itineraryId }
        });
        if (!item) {
            return res.status(404).json({ message: '行程项不存在' });
        }

        // 更新字段 (只更新传入的字段)
        if (day_number !== undefined) item.day_number = parseInt(day_number);
        // if (item_type !== undefined) item.item_type = item_type; // 考虑是否允许修改类型
        if (scenic_id !== undefined) item.scenic_id = item.item_type === 'scenic' ? parseInt(scenic_id) : null;
        if (hotel_id !== undefined) item.hotel_id = item.item_type === 'hotel' ? parseInt(hotel_id) : null;
        if (transport_id !== undefined) item.transport_id = item.item_type === 'transport' ? parseInt(transport_id) : null;
        if (start_time !== undefined) item.start_time = start_time || null;
        if (end_time !== undefined) item.end_time = end_time || null;
        // 如果是 activity 类型，notes 存的是描述
        const noteValue = item.item_type === 'activity' ? activity_description : notes;
        if (noteValue !== undefined) item.notes = noteValue;
        if (order_number !== undefined) item.order_number = parseInt(order_number);

        // 验证关联项是否存在 (如果 ID 发生变化)
        // ... (省略，类似 addItineraryItem 中的验证)

        await item.save();

        // 查询更新后的 item 并包含关联数据返回
        const updatedItemWithDetails = await ItineraryItem.findByPk(item.item_id, {
            include: [
                { 
                    model: Scenic, 
                    required: false,
                    attributes: [
                        'scenic_id', 'name', 'city', 'address', 'description', 
                        'open_time', 'ticket_price', 'images', 'label', 'hot_score', 
                        'latitude', 'longitude', 'is_custom', 
                        'created_at', 'updated_at'
                    ]
                },
                { model: Hotel, required: false },
                { model: Transport, required: false }
            ]
        });
        
        // TODO: 格式化 updatedItemWithDetails
        res.json(updatedItemWithDetails);

    } catch (err) {
        console.error(`更新行程项 ${itemId} 失败:`, err);
        next(err);
    }
};

// 删除行程项
exports.deleteItineraryItem = async (req, res, next) => {
    const { itineraryId, itemId } = req.params;
    const userId = req.user.id;

    try {
        // 验证行程是否存在且属于当前用户
        const itinerary = await CustomizedItinerary.findOne({ 
            where: { itinerary_id: itineraryId, user_id: userId },
            attributes: ['itinerary_id'] // 只需要 ID 确认存在和权限
        });
        if (!itinerary) {
            return res.status(404).json({ message: '行程不存在或无权修改' });
        }

        // 删除行程项
        const deletedCount = await ItineraryItem.destroy({
            where: { item_id: itemId, itinerary_id: itineraryId }
        });

        if (deletedCount === 0) {
            return res.status(404).json({ message: '要删除的行程项不存在' });
        }

        res.status(200).json({ success: true, message: '行程项已删除' });

    } catch (err) {
        console.error(`删除行程项 ${itemId} 失败:`, err);
        next(err);
    }
};

// 通过自定义URL获取行程
exports.getItineraryByCustomUrl = async (req, res, next) => {
    const { customUrl } = req.params;
    
    console.log(`===== 通过自定义URL获取行程开始 =====`);
    console.log(`请求参数: 自定义URL=${customUrl}`);
    
    try {
        // 根据自定义URL查询行程
        const itinerary = await CustomizedItinerary.findOne({
            where: { custom_url: customUrl },
            include: [
                {
                    model: ItineraryItem, 
                    as: 'items',
                    include: [
                        { 
                            model: Scenic, 
                            required: false,
                            attributes: [
                                'scenic_id', 'name', 'city', 'address', 'description', 
                                'open_time', 'ticket_price', 'images', 'label', 'hot_score', 
                                'latitude', 'longitude', 'is_custom', 
                                'created_at', 'updated_at'
                            ]
                        },
                        { model: Hotel, required: false },
                        { model: Transport, required: false }
                    ]
                }
            ],
            order: [
                [ { model: ItineraryItem, as: 'items' }, 'day_number', 'ASC' ],
                [ { model: ItineraryItem, as: 'items' }, 'order_number', 'ASC' ]
            ]
        });

        // 判断行程是否存在
        if (!itinerary) {
            console.error(`通过自定义URL获取行程失败: URL=${customUrl} 不存在`);
            return res.status(404).json({ 
                success: false, 
                message: '未找到指定URL对应的行程', 
                error: 'not_found' 
            });
        }

        // 判断行程是否公开 (如果需要访问控制)
        if (!itinerary.is_public && (!req.user || req.user.id !== itinerary.user_id)) {
            console.error(`通过自定义URL获取行程失败: URL=${customUrl} 不是公开行程且用户无权限`);
            return res.status(403).json({ 
                success: false, 
                message: '无权访问此行程', 
                error: 'permission_denied' 
            });
        }

        // 格式化响应
        const formattedItinerary = formatItineraryResponse(itinerary);
        console.log(`通过自定义URL获取行程成功: URL=${customUrl}, 行程ID=${itinerary.itinerary_id}, 标题="${formattedItinerary.title}"`);
        console.log(`===== 通过自定义URL获取行程结束 =====`);
        
        res.json(formattedItinerary);
    } catch (err) {
        console.error(`===== 通过自定义URL获取行程 ${customUrl} 失败 =====`);
        console.error(`错误类型: ${err.name}`);
        console.error(`错误消息: ${err.message}`);
        console.error(`错误堆栈: ${err.stack}`);
        if (err.original) {
            console.error(`原始数据库错误: ${JSON.stringify(err.original)}`);
        }
        console.error(`===== 错误详情结束 =====`);
        
        // 返回友好的错误信息
        res.status(500).json({
            success: false,
            message: '获取行程详情时发生服务器错误',
            error: err.message
        });
    }
}; 