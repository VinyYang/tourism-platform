const { FeaturedRoute, FeaturedRouteSpot, Scenic, sequelize } = require('../models');
const { CustomizedItinerary, ItineraryItem } = require('../models');
const { Op } = require('sequelize');
const { getCoordinatesFromAddress } = require('../utils/geocoder');

// Helper function for error handling
const handleError = (res, error, message = '操作失败') => {
  console.error(message, error);
  res.status(500).json({ success: false, message: `${message}: ${error.message}` });
};

// --- Admin Controllers --- 

exports.adminGetAllFeaturedRoutes = async (req, res, next) => {
    try {
        const routes = await FeaturedRoute.findAll({ order: [['created_at', 'DESC']] });
        res.json(routes);
    } catch (err) {
        next(err);
    }
};

exports.adminCreateFeaturedRoute = async (req, res, next) => {
    const { name, description, image_url, category, difficulty, is_active = true } = req.body;
    if (!name) {
        return res.status(400).json({ message: '路线名称不能为空' });
    }
    try {
        const newRoute = await FeaturedRoute.create({ name, description, image_url, category, difficulty, is_active });
        res.status(201).json(newRoute);
    } catch (err) {
        next(err);
    }
};

exports.adminGetFeaturedRouteById = async (req, res, next) => {
    const { id } = req.params;
    console.log(`>>> 开始获取精选路线详情: ID=${id}`);
    
    try {
        // 查询路线信息，包含相关景点，并按order_number排序
        const route = await FeaturedRoute.findOne({
            where: { featured_route_id: id },
            include: [{
                model: FeaturedRouteSpot,
                as: 'spots',
                include: [{
                    model: Scenic,
                    as: 'scenicSpot',
                    // 明确指定要查询的字段，避免查询不存在的字段
                    attributes: [
                        'scenic_id', 'name', 'city', 'address', 'description', 
                        'open_time', 'ticket_price', 'images', 'label', 
                        'hot_score', 'latitude', 'longitude', 
                        'created_at', 'updated_at'
                    ]
                }],
                // 确保景点按order_number排序
                order: [['order_number', 'ASC']]
            }]
        });

        if (!route) {
            console.log(`精选路线未找到: ID=${id}`);
            return res.status(404).json({ 
                success: false, 
                message: '精选路线未找到' 
            });
        }

        console.log(`找到精选路线: "${route.name}", 包含${route.spots?.length || 0}个景点`);
        
        // 规范化路线数据，确保统一格式
        const formattedRoute = {
            ...route.get({ plain: true }),
            // 确保 spots 是数组
            spots: route.spots || []
        };

        // 统一处理景点数据
        formattedRoute.spots = formattedRoute.spots.map(rs => {
            // 检查是否为自定义景点 - 不再依赖is_custom字段，改为判断scenic_id是否存在
            const isCustomSpot = !rs.scenic_id;
            
            if (!isCustomSpot && rs.scenic_id) {
                // 标准景点数据处理
                console.log(`处理标准景点: ID=${rs.scenic_id}, 名称="${rs.scenicSpot?.name || '未知'}"`);
                
                // 确定坐标，优先使用关联表中的经纬度
                const hasCustomCoordinates = rs.longitude != null && rs.latitude != null;
                const hasScenicCoordinates = rs.scenicSpot?.longitude != null && rs.scenicSpot?.latitude != null;
                
                let location = null;
                if (hasCustomCoordinates) {
                    location = [parseFloat(rs.longitude), parseFloat(rs.latitude)];
                    console.log(`使用自定义坐标: [${location[0]}, ${location[1]}]`);
                } else if (hasScenicCoordinates) {
                    location = [parseFloat(rs.scenicSpot.longitude), parseFloat(rs.scenicSpot.latitude)];
                    console.log(`使用景点原始坐标: [${location[0]}, ${location[1]}]`);
                } else {
                    console.log(`景点"${rs.scenicSpot?.name || '未知'}"缺少坐标信息`);
                }
                
                const scenicSpotData = {
                    scenic_id: rs.scenicSpot?.scenic_id,
                    name: rs.scenicSpot?.name,
                    city: rs.scenicSpot?.city,
                    address: rs.scenicSpot?.address,
                    location: location,
                    latitude: location ? location[1] : null,  // 确保同时提供单独的字段
                    longitude: location ? location[0] : null, // 确保同时提供单独的字段
                    description: rs.scenicSpot?.description, 
                    imageUrl: rs.scenicSpot?.images?.length > 0 ? rs.scenicSpot.images[0] : null,
                    is_custom: false
                };
                
                return {
                    spot_id: rs.featured_route_spot_id,
                    order_number: rs.order_number,
                    is_custom: false,
                    latitude: location ? location[1] : null,
                    longitude: location ? location[0] : null,
                    scenicSpot: scenicSpotData
                };
            } else {
                // 自定义景点数据处理
                console.log(`处理自定义景点: 名称="${rs.spot_name || '未命名景点'}"`);
                
                // 确定自定义景点坐标
                let location = null;
                if (rs.longitude != null && rs.latitude != null) {
                    location = [parseFloat(rs.longitude), parseFloat(rs.latitude)];
                    console.log(`自定义景点坐标: [${location[0]}, ${location[1]}]`);
                } else {
                    console.log(`自定义景点"${rs.spot_name || '未命名景点'}"缺少坐标信息`);
                }
                
                return {
                    spot_id: rs.featured_route_spot_id,
                    order_number: rs.order_number,
                    is_custom: true,
                    latitude: location ? location[1] : null,
                    longitude: location ? location[0] : null,
                    scenicSpot: {
                        scenic_id: null,
                        name: rs.spot_name || '未命名景点',
                        description: rs.spot_description || '',
                        location: location,
                        latitude: location ? location[1] : null,
                        longitude: location ? location[0] : null,
                        imageUrl: null,
                        is_custom: true
                    }
                };
            }
        });

        // 验证所有景点数据格式是否一致
        const spotsMissingCoordinates = formattedRoute.spots.filter(spot => 
            !spot.scenicSpot.location || 
            !Array.isArray(spot.scenicSpot.location) || 
            spot.scenicSpot.location.length !== 2
        );
        
        if (spotsMissingCoordinates.length > 0) {
            console.log(`警告: ${spotsMissingCoordinates.length}/${formattedRoute.spots.length}个景点缺少有效坐标`);
        }
        
        // 响应成功
        console.log(`成功处理精选路线 ID=${id} 的请求`);
        res.json({
            success: true,
            data: formattedRoute
        });
    } catch (err) {
        console.error(`获取精选路线详情失败: ID=${id}`, err);
        next(err);
    }
};

exports.adminUpdateFeaturedRoute = async (req, res, next) => {
    const { routeId } = req.params;
    const { name, description, image_url, category, difficulty, is_active } = req.body;

    try {
        const route = await FeaturedRoute.findByPk(routeId);
        if (!route) {
            return res.status(404).json({ message: '精选路线未找到' });
        }

        if (name !== undefined) route.name = name;
        if (description !== undefined) route.description = description;
        if (image_url !== undefined) route.image_url = image_url;
        if (category !== undefined) route.category = category;
        if (difficulty !== undefined) route.difficulty = difficulty;
        if (is_active !== undefined) route.is_active = !!is_active;

        await route.save();
        res.json(route);
    } catch (err) {
        next(err);
    }
};

exports.adminDeleteFeaturedRoute = async (req, res, next) => {
    const { routeId } = req.params;
    try {
        const route = await FeaturedRoute.findByPk(routeId);
        if (!route) {
            return res.status(404).json({ message: '精选路线未找到' });
        }
        await route.destroy(); // Cascade should delete FeaturedRouteSpot entries
        res.status(200).json({ message: '精选路线已删除' });
    } catch (err) {
        next(err);
    }
};

exports.adminAddSpotToFeaturedRoute = async (req, res, next) => {
    const { routeId } = req.params;
    const { scenic_id, order_number, spot_name, spot_description, latitude, longitude } = req.body;
    
    console.log(`添加景点到精选路线: 路线ID=${routeId}`);

    if (order_number === undefined || order_number === null) {
        return res.status(400).json({ 
            success: false, 
            message: '必须提供景点顺序 (order_number)' 
        });
    }
    
    // 判断是标准景点还是自定义景点
    const isCustomSpot = !scenic_id;
    
    // 自定义景点必须提供名称
    if (isCustomSpot && !spot_name) {
        return res.status(400).json({ 
            success: false, 
            message: '自定义景点必须提供名称 (spot_name)' 
        });
    }

    const transaction = await sequelize.transaction();
    
    try {
        // 查询路线是否存在
        const route = await FeaturedRoute.findByPk(routeId, { transaction });
        if (!route) {
            await transaction.rollback();
            return res.status(404).json({ 
                success: false, 
                message: '精选路线未找到' 
            });
        }

        // 如果是标准景点，验证景点存在
        if (!isCustomSpot) {
            const scenic = await Scenic.findByPk(scenic_id, { transaction });
            if (!scenic) {
                await transaction.rollback();
                return res.status(404).json({ 
                    success: false, 
                    message: '景点未找到' 
                });
            }
        }

        // 检查序号唯一性
        const existingSpotWithSameOrder = await FeaturedRouteSpot.findOne({
            where: {
                featured_route_id: routeId,
                order_number
            },
            transaction
        });

        if (existingSpotWithSameOrder) {
            // 如果已有相同序号的景点，则需要调整所有大于等于此序号的景点顺序
            await FeaturedRouteSpot.increment('order_number', {
                where: {
                    featured_route_id: routeId,
                    order_number: { [Op.gte]: order_number }
                },
                transaction
            });
        }

        // 准备景点数据
        const spotData = {
            featured_route_id: routeId,
            order_number: order_number,
            scenic_id: isCustomSpot ? null : scenic_id,
            // 移除is_custom字段
            latitude: latitude || null,
            longitude: longitude || null
        };
        
        // 对于自定义景点，添加额外字段
        if (isCustomSpot) {
            spotData.spot_name = spot_name;
            spotData.spot_description = spot_description || '';
        }
        
        console.log(`创建${isCustomSpot ? '自定义' : '标准'}景点:`, spotData);
        
        // 创建关联
        const newSpot = await FeaturedRouteSpot.create(spotData, { transaction });

        // 提交事务
        await transaction.commit();
        
        console.log(`成功添加景点到路线: 景点ID=${newSpot.featured_route_spot_id}`);
        
        // 返回成功响应
        res.status(201).json({ 
            success: true, 
            message: `已成功添加${isCustomSpot ? '自定义' : ''}景点到路线`, 
            data: newSpot 
        });

    } catch (err) {
        await transaction.rollback();
        console.error(`添加景点到路线失败: 路线ID=${routeId}`, err);
        next(err);
    }
};

exports.adminUpdateFeaturedRouteSpotsOrder = async (req, res, next) => {
    const { routeId } = req.params;
    const spotsOrder = req.body; // Expects an array: [{ scenic_id: number, order_number: number }]

    if (!Array.isArray(spotsOrder)) {
        return res.status(400).json({ message: '请求体应为一个包含景点顺序信息的数组' });
    }

    const transaction = await sequelize.transaction();
    try {
        const route = await FeaturedRoute.findByPk(routeId, { transaction });
        if (!route) {
            await transaction.rollback();
            return res.status(404).json({ message: '精选路线未找到' });
        }

        // Validate input array format
        for (const spot of spotsOrder) {
            if (spot.scenic_id === undefined || spot.order_number === undefined) {
                 await transaction.rollback();
                return res.status(400).json({ message: '数组中的每个对象必须包含 scenic_id 和 order_number' });
            }
        }

        // Simple approach: Delete existing and bulk create new ones
        await FeaturedRouteSpot.destroy({ where: { featured_route_id: routeId }, transaction });

        const newSpotsData = spotsOrder.map(spot => ({
            featured_route_id: routeId,
            scenic_id: spot.scenic_id,
            order_number: spot.order_number
        })); 

        await FeaturedRouteSpot.bulkCreate(newSpotsData, { transaction });

        await transaction.commit();
        res.status(200).json({ message: '景点顺序已更新' });

    } catch (err) {
        await transaction.rollback();
         // Handle potential unique constraint violations from bulkCreate
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: '更新失败：顺序编号或景点在此路线中重复。' });
        }
        next(err);
    }
};

exports.adminRemoveSpotFromFeaturedRoute = async (req, res, next) => {
    const { routeId, scenicId } = req.params;
    try {
        const deletedCount = await FeaturedRouteSpot.destroy({
            where: { featured_route_id: routeId, scenic_id: scenicId }
        });
        if (deletedCount === 0) {
            return res.status(404).json({ message: '未找到要移除的景点关联' });
        }
        res.status(200).json({ message: '景点已从路线中移除' });
    } catch (err) {
        next(err);
    }
};


// --- Public Controllers --- 

exports.getPublicFeaturedRoutes = async (req, res, next) => {
    try {
        const routes = await FeaturedRoute.findAll({
            where: { is_active: true },
            order: [['created_at', 'DESC']], // Example ordering
            attributes: ['featured_route_id', 'name', 'description', 'image_url', 'category', 'difficulty', 'is_active'] // Select specific fields
        });
        res.json(routes);
    } catch (err) {
        next(err);
    }
};

exports.getPublicFeaturedRouteById = async (req, res, next) => {
    console.log(`获取精选路线详情: ID=${req.params.id}`);
    const { id } = req.params;
    try {
        const route = await FeaturedRoute.findOne({
            where: { featured_route_id: id, is_active: true },
            include: [{
                model: FeaturedRouteSpot,
                as: 'spots',
                include: [{
                    model: Scenic,
                    as: 'scenicSpot',
                    attributes: ['scenic_id', 'name', 'description', 'latitude', 'longitude', 'images', 'city', 'address'] // 明确只查询存在的字段
                }],
                attributes: ['featured_route_spot_id', 'order_number', 'latitude', 'longitude'] // 移除is_custom和不存在的字段
            }],
            order: [
                [{ model: FeaturedRouteSpot, as: 'spots' }, 'order_number', 'ASC']
            ]
        });

        if (!route) {
            return res.status(404).json({ message: '精选路线未找到或未激活' });
        }
        
        console.log(`找到精选路线: ${route.name}, 包含${route.spots?.length || 0}个景点`);

        // Format spots for public view with improved coordinate handling
        const formattedRoute = route.toJSON();
        formattedRoute.spots = formattedRoute.spots?.map(rs => {
            console.log(`处理景点: ${rs.scenicSpot?.name || '未命名景点'}`);
            
            // 确定坐标数据 - 按优先级获取
            let longitude = null;
            let latitude = null;
            let location = null;
            
            // 1. 首先检查FeaturedRouteSpot的坐标
            if (rs.longitude != null && rs.latitude != null) {
                longitude = rs.longitude;
                latitude = rs.latitude;
                location = [parseFloat(longitude), parseFloat(latitude)];
                console.log(`使用FeaturedRouteSpot.longitude/latitude: [${longitude}, ${latitude}]`);
            } 
            // 2. 如果FeaturedRouteSpot没有坐标，使用scenicSpot的坐标
            else if (rs.scenicSpot?.longitude != null && rs.scenicSpot?.latitude != null) {
                longitude = rs.scenicSpot.longitude;
                latitude = rs.scenicSpot.latitude;
                location = [parseFloat(longitude), parseFloat(latitude)];
                console.log(`使用scenicSpot.longitude/latitude: [${longitude}, ${latitude}]`);
            } 
            else {
                console.warn(`景点 "${rs.scenicSpot?.name || '未命名景点'}" 没有有效的坐标数据`);
            }
            
            // 判断是否为自定义景点
            const isCustom = !rs.scenicSpot?.scenic_id;
            
            return {
                spot_id: rs.featured_route_spot_id,
                order_number: rs.order_number,
                is_custom: isCustom,
                // 确保坐标数据一致性和可用性 - 同时提供单独字段和数组格式
                longitude: longitude,
                latitude: latitude,
                location: location,
                scenicSpot: {
                    scenic_id: rs.scenicSpot?.scenic_id,
                    name: rs.scenicSpot?.name,
                    description: rs.scenicSpot?.description,
                    // 在scenicSpot中也提供坐标数据，保持兼容性
                    location: location,
                    longitude: longitude,
                    latitude: latitude,
                    imageUrl: rs.scenicSpot?.images?.length > 0 ? rs.scenicSpot.images[0] : null,
                    city: rs.scenicSpot?.city,
                    address: rs.scenicSpot?.address
                }
            };
        }) || [];
        
        // 记录没有坐标的景点数量
        const spotsWithoutCoordinates = formattedRoute.spots.filter(spot => 
            spot.location === null || !Array.isArray(spot.location)
        );
        if (spotsWithoutCoordinates.length > 0) {
            console.warn(`警告: ${spotsWithoutCoordinates.length}/${formattedRoute.spots.length}个景点缺少有效坐标`);
        }
        
        // Respond with only necessary data for public view
        res.json({
            success: true,
            data: {
                 featured_route_id: formattedRoute.featured_route_id,
                 name: formattedRoute.name,
                 description: formattedRoute.description,
                 image_url: formattedRoute.image_url,
                 category: formattedRoute.category,
                 difficulty: formattedRoute.difficulty,
                 spots: formattedRoute.spots
            }
        });
    } catch (err) {
        console.error('获取精选路线详情失败:', err);
        next(err);
    }
};

// --- Apply Featured Route Controller ---
exports.applyFeaturedRouteToUser = async (req, res, next) => {
    const userId = req.user.id;
    const { id: featuredRouteId } = req.params;
    
    console.log(`===== 应用精选路线开始 =====`);
    console.log(`用户ID: ${userId}, 精选路线ID: ${featuredRouteId}`);
    
    // 启动事务
    const transaction = await sequelize.transaction();
    
    try {
        // 1. 查询精选路线及其包含的景点
        console.log('查询精选路线及其景点信息...');
        const route = await FeaturedRoute.findOne({
            where: { featured_route_id: featuredRouteId, is_active: true },
            include: [{
                model: FeaturedRouteSpot,
                as: 'spots',
                include: [{
                    model: Scenic,
                    as: 'scenicSpot'
                }],
                order: [['order_number', 'ASC']]
            }]
        });

        if (!route) {
            console.error('应用精选路线失败: 精选路线未找到或未激活');
            await transaction.rollback();
            console.log('事务已回滚');
            return res.status(404).json({ success: false, message: '精选路线未找到或未激活' });
        }
        
        console.log('找到精选路线:', route.name);
        console.log('包含景点数量:', route.spots?.length || 0);

        // 2. 创建新的自定义行程
        console.log('准备创建新行程...');
        const itineraryData = {
            user_id: userId,
            title: route.name,
            description: route.description,
            is_public: false,
            city: route.spots?.[0]?.scenicSpot?.city || null,
            status: 'published',
            custom_url: `featured-route-${featuredRouteId}`, // 设置自定义URL，以精选路线ID为基础
            cover: route.image_url || null // 设置封面图片
        };
        
        console.log('创建行程数据:', JSON.stringify(itineraryData));
        const newItinerary = await CustomizedItinerary.create(itineraryData, { transaction });
        console.log('行程创建成功, ID:', newItinerary.itinerary_id);

        // 3. 创建行程项目
        console.log('准备创建行程项...');
        if (route.spots && route.spots.length > 0) {
            const itineraryItemsData = route.spots
                .filter(spot => {
                    if (!(spot.scenic_id && spot.scenicSpot)) {
                        console.warn('跳过无效景点:', spot);
                        return false;
                    }
                    return true;
                })
                .map((spot, index) => {
                    // 构建位置字符串
                    let locationStr = null;
                    if (spot.scenicSpot.latitude && spot.scenicSpot.longitude) {
                        locationStr = `${spot.scenicSpot.latitude},${spot.scenicSpot.longitude}`;
                    } else if (spot.latitude && spot.longitude) {
                        locationStr = `${spot.latitude},${spot.longitude}`;
                    }
                    
                    console.log(`处理景点: ${spot.scenicSpot.name}, 位置: ${locationStr || '无位置信息'}`);
                    
                    return {
                        itinerary_id: newItinerary.itinerary_id,
                        day_number: 1, // 默认都放在第一天
                        order_number: spot.order_number || index + 1,
                        item_type: 'scenic',
                        scenic_id: spot.scenic_id,
                        name: spot.scenicSpot.name,
                        image: spot.scenicSpot.images?.[0] || null,
                        location: locationStr,
                        notes: spot.scenicSpot.description
                    };
                });
            
            // 批量创建行程项
            if (itineraryItemsData.length > 0) {
                console.log('创建景点数量:', itineraryItemsData.length);
                await ItineraryItem.bulkCreate(itineraryItemsData, { transaction });
                console.log('所有景点创建成功');
            } else {
                console.warn('没有有效的景点可以添加到行程中');
            }
        } else {
            console.warn('精选路线没有包含任何景点');
        }

        // 4. 提交事务
        console.log('准备提交事务...');
        await transaction.commit();
        console.log('事务提交成功');

        // 5. 返回成功响应
        console.log(`应用精选路线成功: 路线ID=${featuredRouteId}, 新行程ID=${newItinerary.itinerary_id}`);
        console.log('===== 应用精选路线结束 =====');
        
        res.status(201).json({
            success: true,
            message: '精选路线已成功应用为新行程',
            data: {
                id: newItinerary.itinerary_id,
                title: newItinerary.title
            }
        });

    } catch (error) {
        console.error('===== 应用精选路线失败 =====');
        console.error('错误类型:', error.name);
        console.error('错误消息:', error.message);
        console.error('错误堆栈:', error.stack);
        if (error.original) {
            console.error('原始数据库错误:', JSON.stringify(error.original));
        }
        
        // 确保事务回滚
        if (transaction) {
            try {
                console.log('正在回滚事务...');
                await transaction.rollback();
                console.log('事务回滚成功');
            } catch (rollbackError) {
                console.error('事务回滚失败:', rollbackError);
            }
        }
        
        console.error('===== 错误详情结束 =====');
        
        // 返回友好的错误信息
        res.status(500).json({ 
            success: false, 
            message: '应用精选路线时发生服务器错误',
            error: error.message
        });
    }
};

// 检查清单项 4: 创建精选路线
exports.createFeaturedRoute = async (req, res) => {
  const { name, description, image_url, category, difficulty, is_active = true, spots } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: '名称不能为空' });
  }

  const t = await sequelize.transaction();
  try {
    // 1. 创建 FeaturedRoute
    const newRoute = await FeaturedRoute.create({
      name,
      description,
      image_url,
      category,
      difficulty,
      is_active
    }, { transaction: t });

    // 2. 处理景点数据
    if (spots && spots.length > 0) {
      const routeSpotsData = [];
      
      for (const spot of spots) {
        let spotData = {
          featured_route_id: newRoute.featured_route_id,
          order_number: spot.order_number,
          latitude: spot.latitude || null,
          longitude: spot.longitude || null
        };

        // 统一处理景点
        if (spot.scenic_id) {
          // 使用已有景点
          spotData.scenic_id = spot.scenic_id;
        } else {
          // 使用自定义景点
          if (!spot.name) {
            await t.rollback();
            return res.status(400).json({ 
              success: false, 
              message: '未提供景点ID时必须提供景点名称' 
            });
          }
          spotData.scenic_id = null;
          spotData.spot_name = spot.name;
          spotData.spot_description = spot.description || '';
        }
        
        routeSpotsData.push(spotData);
      }

      // 批量创建景点关联
      await FeaturedRouteSpot.bulkCreate(routeSpotsData, { transaction: t });
    }

    await t.commit();
    
    // 返回创建的路线
    const result = await FeaturedRoute.findByPk(newRoute.featured_route_id, {
      include: [{
        model: FeaturedRouteSpot,
        as: 'spots',
        include: [{
          model: Scenic,
          as: 'scenicSpot',
          attributes: ['scenic_id', 'name', 'description', 'latitude', 'longitude', 'images']
        }],
        order: [['order_number', 'ASC']]
      }]
    });

    res.status(201).json({ success: true, data: result, message: '精选路线创建成功' });
  } catch (error) {
    await t.rollback();
    handleError(res, error, '创建精选路线失败');
  }
};

// 检查清单项 5: 获取所有精选路线 (区分管理员和公共)
exports.getAllFeaturedRoutes = async (req, res) => {
  try {
    const isAdmin = req.path.startsWith('/api/admin'); // 根据路径判断是否是管理员请求
    const whereCondition = isAdmin ? {} : { is_active: true }; // 公共只获取启用的

    const routes = await FeaturedRoute.findAll({
      where: whereCondition,
      include: [{
        model: FeaturedRouteSpot,
        as: 'spots',
        attributes: ['featured_route_spot_id', 'order_number', 'scenic_id'], // 减少数据量
        include: [{
          model: Scenic,
          as: 'scenicSpot',
          attributes: ['scenic_id', 'name', 'city'] // 只选择必要的字段，避免查询不存在的字段
        }],
        order: [['order_number', 'ASC']] // 确保关联的景点有序
      }],
      order: [['updated_at', 'DESC']] // 按更新时间排序
    });

    res.status(200).json({ success: true, data: routes, message: '获取精选路线列表成功' });

  } catch (error) {
    handleError(res, error, '获取精选路线列表失败');
  }
};

// 检查清单项 6: 根据 ID 获取单个精选路线详情
exports.getFeaturedRouteById = async (req, res) => {
  const { id } = req.params;
  try {
    const route = await FeaturedRoute.findByPk(id, {
      include: [{
        model: FeaturedRouteSpot,
        as: 'spots',
        include: [{
          model: Scenic,
          as: 'scenicSpot', // 确保与模型关联别名一致
          // 可以包含更多景点详情，但避免不存在的字段
          attributes: ['scenic_id', 'name', 'description', 'address', 'city', 'images', 'hot_score', 'label', 'latitude', 'longitude'] 
        }],
        order: [['order_number', 'ASC']]
      }]
    });

    if (!route) {
      return res.status(404).json({ success: false, message: '未找到指定的精选路线' });
    }

    res.status(200).json({ success: true, data: route, message: '获取精选路线详情成功' });

  } catch (error) {
    handleError(res, error, '获取精选路线详情失败');
  }
};

// 检查清单项 7: 更新精选路线
exports.updateFeaturedRoute = async (req, res) => {
  const { id } = req.params;
  const { name, description, image_url, category, difficulty, is_active, spots } = req.body;

  const t = await sequelize.transaction();
  try {
    // 1. 确认路线存在
    const route = await FeaturedRoute.findByPk(id, { transaction: t });
    if (!route) {
      await t.rollback();
      return res.status(404).json({ success: false, message: '未找到要更新的精选路线' });
    }

    // 2. 更新路线基础信息
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (category !== undefined) updateData.category = category;
    if (difficulty !== undefined) updateData.difficulty = difficulty;
    if (is_active !== undefined) updateData.is_active = is_active;

    await FeaturedRoute.update(updateData, {
      where: { featured_route_id: id },
      transaction: t
    });

    // 3. 如果提供了 spots，则更新关联的景点
    if (spots) {
      // 3.1 删除旧的关联
      await FeaturedRouteSpot.destroy({
        where: { featured_route_id: id },
        transaction: t
      });

      // 3.2 创建新的关联
      const routeSpotsData = [];
      
      for (const spot of spots) {
        let spotData = {
          featured_route_id: id,
          order_number: spot.order_number,
          latitude: spot.latitude || null,
          longitude: spot.longitude || null
        };

        // 统一处理景点
        if (spot.scenic_id) {
          // 使用已有景点
          spotData.scenic_id = spot.scenic_id;
        } else {
          // 使用自定义景点
          if (!spot.name) {
            await t.rollback();
            return res.status(400).json({ 
              success: false, 
              message: '未提供景点ID时必须提供景点名称' 
            });
          }
          spotData.scenic_id = null;
          spotData.spot_name = spot.name;
          spotData.spot_description = spot.description || '';
        }
        
        routeSpotsData.push(spotData);
      }

      await FeaturedRouteSpot.bulkCreate(routeSpotsData, { transaction: t });
    }

    // 提交事务
    await t.commit();

    // 返回更新后的路线及其景点信息
    const updatedResult = await FeaturedRoute.findByPk(id, {
        include: [{
            model: FeaturedRouteSpot,
            as: 'spots',
            include: [{
                model: Scenic,
                as: 'scenicSpot',
                attributes: ['scenic_id', 'name', 'description', 'city', 'images', 'latitude', 'longitude']
            }],
            order: [['order_number', 'ASC']]
        }]
    });

    res.status(200).json({ success: true, message: '精选路线更新成功', data: updatedResult });

  } catch (error) {
    await t.rollback();
    handleError(res, error, '更新精选路线失败');
  }
};

// 检查清单项 8: 删除精选路线
exports.deleteFeaturedRoute = async (req, res) => {
  const { id } = req.params;
  const t = await sequelize.transaction();
  try {
    const route = await FeaturedRoute.findByPk(id, { transaction: t });
    if (!route) {
      await t.rollback();
      return res.status(404).json({ success: false, message: '未找到要删除的精选路线' });
    }

    // 删除 FeaturedRoute，由于设置了 ON DELETE CASCADE，关联的 FeaturedRouteSpot 会自动删除
    await route.destroy({ transaction: t });

    await t.commit();
    res.status(200).json({ success: true, message: '精选路线删除成功' });

  } catch (error) {
    await t.rollback();
    handleError(res, error, '删除精选路线失败');
  }
}; 