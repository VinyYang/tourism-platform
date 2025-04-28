/**
 * 订单控制器
 * 处理与订单相关的业务逻辑
 * @module controllers/bookingController
 */

const db = require('../models');
const Booking = db.Booking;
const Scenic = db.Scenic;
const Hotel = db.Hotel;
const User = db.User;
const Room = db.Room;

/**
 * 创建新订单
 * @param {object} req - Express请求对象
 * @param {object} res - Express响应对象
 * @param {function} next - Express下一个中间件
 * @returns {Promise<void>}
 */
exports.createBooking = async (req, res, next) => {
    // 从请求体中解构订单信息
    const {
        scenic_id,
        hotel_id,
        room_id,
        flight_id,
        flight_no,
        airline,
        from_city,
        to_city,
        departure_time,
        arrival_time,
        booking_type, // 'scenic', 'hotel', 'flight', or potentially 'itinerary'
        start_date,
        end_date,
        num_people,
        passenger_name,
        passenger_id_type,
        passenger_id_no,
        contact_phone,
        contact_email
    } = req.body;

    // 从认证中间件获取用户ID
    const user_id = req.user?.id;

    // 基本数据验证
    if (!user_id) {
        return res.status(401).json({ message: '用户未登录或认证信息缺失' });
    }
    if (!booking_type || !start_date || !end_date || !num_people || num_people <= 0) {
        return res.status(400).json({ message: '缺少必要的订单信息或信息无效 (booking_type, start_date, end_date, num_people)' });
    }
    if (booking_type === 'scenic' && !scenic_id) {
        return res.status(400).json({ message: '景点订单必须包含 scenic_id' });
    }
    if (booking_type === 'hotel' && !hotel_id) {
        return res.status(400).json({ message: '酒店订单必须包含 hotel_id' });
    }
    if (booking_type === 'hotel' && !room_id) {
        return res.status(400).json({ message: '酒店订单必须包含 room_id' });
    }
    if (booking_type === 'flight' && !flight_id) {
        return res.status(400).json({ message: '机票订单必须包含 flight_id' });
    }
    if (booking_type === 'flight' && (!passenger_name || !passenger_id_no)) {
        return res.status(400).json({ message: '机票订单必须包含乘客信息 (passenger_name, passenger_id_no)' });
    }
    
    // 验证日期有效性
    const startDateObj = new Date(start_date);
    const endDateObj = new Date(end_date);
    
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        return res.status(400).json({ message: '无效的日期格式' });
    }
    
    if (startDateObj > endDateObj) {
        return res.status(400).json({ message: '开始日期不能晚于结束日期' });
    }

    // 定义天数计算常量，将其移到外部作用域
    const oneDay = 24 * 60 * 60 * 1000; // 一天的毫秒数

    let calculated_total_price = 0;
    let scenicInfo = null;
    let hotelInfo = null;
    let roomInfo = null;
    let flightInfo = null;
    let diffDays = 1; // 默认至少1天，提升作用域到外部

    try {
        // 根据订单类型计算价格
        if (booking_type === 'scenic') {
            // 查询景点信息获取票价
            scenicInfo = await Scenic.findByPk(scenic_id, {
                attributes: ['scenic_id', 'name', 'ticket_price']
            });
            if (!scenicInfo || scenicInfo.ticket_price == null) {
                return res.status(404).json({ message: '找不到指定的景点信息或景点无票价' });
            }
            // 计算总价 = 票价 * 人数
            calculated_total_price = scenicInfo.ticket_price * num_people;
        } else if (booking_type === 'hotel') {
            // 实现酒店订单价格计算
            // 1. 查询 Room 表获取价格
            roomInfo = await Room.findByPk(room_id, {
                attributes: ['room_id', 'name', 'price', 'max_occupancy']
            });
            
            if (!roomInfo || roomInfo.price == null) {
                return res.status(404).json({ message: '找不到指定的房间信息或房间无价格' });
            }
            
            // 验证入住人数不超过房间最大容纳人数
            if (roomInfo.max_occupancy && num_people > roomInfo.max_occupancy) {
                return res.status(400).json({ 
                    message: `入住人数超过房间最大容纳人数 (${roomInfo.max_occupancy}人)` 
                });
            }
            
            // 2. 计算入住天数 (end_date - start_date)
            diffDays = Math.round(Math.abs((endDateObj - startDateObj) / oneDay)) || 1; // 至少1天
            
            // 3. calculated_total_price = room_price * num_nights
            calculated_total_price = roomInfo.price * diffDays;
            
            // 获取酒店信息以便在响应中返回
            hotelInfo = await Hotel.findByPk(hotel_id, {
                attributes: ['hotel_id', 'name']
            });
            
            if (!hotelInfo) {
                return res.status(404).json({ message: '找不到指定的酒店信息' });
            }
        } else if (booking_type === 'flight') {
            // 机票订单价格计算
            // 机票订单通常直接使用传入的价格信息，因为机票价格实时变动
            // 但在实际系统中，应该根据航班ID从数据库中查询当前价格
            
            // 这里假设前端传递了价格信息，在实际应用中需要实现安全检查
            const flightPrice = req.body.price || 0;
            
            if (!flightPrice || flightPrice <= 0) {
                return res.status(400).json({ message: '无效的机票价格' });
            }
            
            // 机票订单总价 = 票价 * 人数
            calculated_total_price = flightPrice * num_people;
            
            // 为了安全起见，应该记录航班详情
            flightInfo = {
                flight_id,
                flight_no,
                airline,
                from_city,
                to_city,
                departure_time,
                arrival_time,
                price: flightPrice
            };
        } else {
            // 其他类型订单 (例如 itinerary) 暂时不支持价格计算
            return res.status(400).json({ message: `不支持的订单类型: ${booking_type}` });
        }

        // 确保价格有效
        if (calculated_total_price < 0) {
            return res.status(400).json({ message: '计算出的订单总价无效' });
        }

        // 创建订单数据对象，使用后端计算的价格
        const bookingData = {
            user_id,
            scenic_id: booking_type === 'scenic' ? scenic_id : null,
            hotel_id: booking_type === 'hotel' ? hotel_id : null,
            room_id: booking_type === 'hotel' ? room_id : null,
            flight_id: booking_type === 'flight' ? flight_id : null,
            booking_type,
            start_date,
            end_date,
            num_people,
            total_price: calculated_total_price, // 使用后端计算的价格
            status: 'pending',
            payment_status: 'unpaid'
        };
        
        // 对于机票订单，添加乘客信息
        if (booking_type === 'flight') {
            bookingData.passenger_info = JSON.stringify({
                name: passenger_name,
                id_type: passenger_id_type || 'id_card',
                id_no: passenger_id_no,
                contact_phone,
                contact_email
            });
        }

        // 使用 Sequelize 创建订单记录
        const newBooking = await Booking.create(bookingData);

        // 返回成功响应，根据订单类型返回不同的详情
        res.status(201).json({
            message: '订单创建成功',
            booking: newBooking,
            price_details: booking_type === 'hotel' ? {
                room_price: roomInfo.price,
                nights: diffDays,
                hotel_name: hotelInfo.name,
                room_name: roomInfo.name
            } : booking_type === 'scenic' ? {
                ticket_price: scenicInfo.ticket_price,
                people: num_people,
                scenic_name: scenicInfo.name
            } : booking_type === 'flight' ? {
                flight_no: flight_no,
                airline: airline,
                from_city: from_city,
                to_city: to_city,
                departure_time: departure_time,
                arrival_time: arrival_time,
                price: calculated_total_price / num_people,
                people: num_people
            } : null
        });

    } catch (error) {
        console.error('创建订单时出错:', error);
        if (error.name === 'SequelizeValidationError') {
            const errors = error.errors.map(err => ({ field: err.path, message: err.message }));
            return res.status(400).json({ message: '订单数据验证失败', errors });
        }
        res.status(500).json({ message: '服务器内部错误，无法创建订单' });
    }
};

/**
 * 获取当前用户的订单列表
 * @param {object} req - Express请求对象
 * @param {object} res - Express响应对象
 * @param {function} next - Express下一个中间件
 * @returns {Promise<void>}
 */
exports.getUserBookings = async (req, res, next) => {
    // 从认证中间件获取用户ID
    const user_id = req.user?.id;

    // 检查用户ID是否存在
    if (!user_id) {
        return res.status(401).json({ message: '用户未登录或认证信息缺失' });
    }

    // 从查询参数获取分页信息 (可选)
    const page = parseInt(req.query.page, 10) || 1; // 默认第一页
    const limit = parseInt(req.query.limit, 10) || 10; // 默认每页10条
    const offset = (page - 1) * limit;

    try {
        // 查询当前用户的订单，并包含关联的景点和酒店信息
        // 使用 findAndCountAll 支持分页
        const { count, rows: bookings } = await Booking.findAndCountAll({
            where: { user_id },
            include: [
                {
                    model: Scenic,
                    as: 'Scenic',
                    required: false,
                    attributes: ['scenic_id', 'name', 'city', 'images'] // 选择性返回景点信息
                },
                {
                    model: Hotel,
                    as: 'Hotel',
                    required: false,
                    attributes: ['hotel_id', 'name', 'city', 'images'] // 选择性返回酒店信息
                },
                {
                    model: Room,
                    as: 'Room',
                    required: false,
                    attributes: ['room_id', 'name', 'price'] // 选择性返回房间信息
                }
            ],
            order: [['created_at', 'DESC']], // 按创建时间降序排序
            limit: limit,
            offset: offset
        });

        // 计算总页数
        const totalPages = Math.ceil(count / limit);

        // 返回订单列表和分页信息
        res.status(200).json({
            message: '获取用户订单列表成功',
            bookings,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: count,
                itemsPerPage: limit
            }
        });

    } catch (error) {
        // 记录详细错误日志
        console.error('获取用户订单列表时出错:', error);

        // 向客户端返回通用错误信息
        res.status(500).json({ message: '服务器内部错误，无法获取订单列表' });
    }
};

/**
 * 获取单个订单详情
 * @param {object} req - Express请求对象
 * @param {object} res - Express响应对象
 * @param {function} next - Express下一个中间件
 * @returns {Promise<void>}
 */
exports.getBookingById = async (req, res, next) => {
    // 从请求参数获取订单ID
    const { id: booking_id } = req.params;
    // 从认证中间件获取用户ID
    const user_id = req.user?.id;

    // 检查用户ID是否存在
    if (!user_id) {
        return res.status(401).json({ message: '用户未登录或认证信息缺失' });
    }

    // 定义天数计算常量
    const oneDay = 24 * 60 * 60 * 1000; // 一天的毫秒数

    try {
        // 查询特定ID的订单，并包含关联的详细信息
        const booking = await Booking.findOne({
            where: { booking_id },
            include: [
                {
                    model: Scenic, // 包含景点信息
                    as: 'Scenic',
                    required: false,
                    attributes: { exclude: ['created_at', 'updated_at'] } // 排除时间戳
                },
                {
                    model: Hotel, // 包含酒店信息
                    as: 'Hotel',
                    required: false,
                    attributes: { exclude: ['created_at', 'updated_at'] }
                },
                {
                    model: Room, // 包含房间信息
                    as: 'Room',
                    required: false,
                    attributes: { exclude: ['created_at', 'updated_at'] }
                },
                {
                    model: User, // 包含用户信息 (可选，看是否需要展示)
                    as: 'user',
                    required: false,
                    attributes: ['user_id', 'username', 'email'] // 只选择部分用户字段
                }
            ]
        });

        // 检查订单是否存在
        if (!booking) {
            return res.status(404).json({ message: '找不到指定的订单' });
        }

        // 验证订单是否属于当前用户
        // 注意：如果需要管理员也能查看，需要添加额外的权限判断 (e.g., req.user.role === 'admin')
        if (booking.user_id !== user_id) {
            return res.status(403).json({ message: '无权访问此订单' });
        }

        // 添加价格详情信息
        let priceDetails = null;
        if (booking.booking_type === 'hotel' && booking.Room) {
            const startDate = new Date(booking.start_date);
            const endDate = new Date(booking.end_date);
            const diffDays = Math.round(Math.abs((endDate - startDate) / oneDay)) || 1; // 至少1天
            
            priceDetails = {
                room_price: booking.Room.price,
                nights: diffDays,
                hotel_name: booking.Hotel?.name || '未知酒店',
                room_name: booking.Room.name
            };
        } else if (booking.booking_type === 'scenic' && booking.Scenic) {
            priceDetails = {
                ticket_price: booking.Scenic.ticket_price,
                people: booking.num_people,
                scenic_name: booking.Scenic.name
            };
        }

        // 返回订单详情
        res.status(200).json({
            message: '获取订单详情成功',
            booking,
            price_details: priceDetails
        });

    } catch (error) {
        // 记录详细错误日志
        console.error(`获取订单详情 (ID: ${booking_id}) 时出错:`, error);

        // 向客户端返回通用错误信息
        res.status(500).json({ message: '服务器内部错误，无法获取订单详情' });
    }
};

/**
 * 取消订单
 * @param {object} req - Express请求对象
 * @param {object} res - Express响应对象
 * @param {function} next - Express下一个中间件
 * @returns {Promise<void>}
 */
exports.cancelBooking = async (req, res, next) => {
    // 从请求参数获取订单ID
    const { id: booking_id } = req.params;
    // 从认证中间件获取用户ID
    const user_id = req.user?.id;

    // 检查用户ID是否存在
    if (!user_id) {
        return res.status(401).json({ message: '用户未登录或认证信息缺失' });
    }

    try {
        // 查询要取消的订单
        const booking = await Booking.findOne({ where: { booking_id } });

        // 检查订单是否存在
        if (!booking) {
            return res.status(404).json({ message: '找不到要取消的订单' });
        }

        // 验证订单是否属于当前用户
        if (booking.user_id !== user_id) {
            // 管理员可能有权取消任何订单，这里可以添加角色判断
            // if (req.user.role !== 'admin') {
            return res.status(403).json({ message: '无权取消此订单' });
            // }
        }

        // 检查订单状态是否允许取消
        // 通常 'pending' (待确认/待支付) 和 'confirmed' (已确认/已支付) 状态可以取消
        const cancellableStatuses = ['pending', 'confirmed'];
        if (!cancellableStatuses.includes(booking.status)) {
            return res.status(400).json({ message: `订单当前状态 (${booking.status}) 不允许取消` });
        }

        // 更新订单状态为 'cancelled'
        // 同时可以考虑更新支付状态，例如设为 'refund_pending' 或保持原样，取决于业务逻辑
        await booking.update({ status: 'cancelled' });

        // --- 退款逻辑占位符 ---
        // TODO: 如果订单已支付 (booking.payment_status === 'paid')，此处应触发退款流程。
        // 退款流程通常包括：
        // 1. 调用支付网关（如 Stripe, PayPal, 支付宝, 微信支付）的退款 API。
        // 2. 处理支付网关的同步/异步响应。
        // 3. 根据退款结果更新订单的 payment_status (例如设置为 'refunded', 'refund_pending', 或 'refund_failed')。
        // 4. 可能需要记录详细的退款交易信息。
        // 由于涉及第三方服务集成和具体业务规则，此处暂时留空。
        if (booking.payment_status === 'paid') {
            console.warn(`警告: 订单 ${booking_id} 已支付但取消，退款逻辑尚未实现。`);
            // 可以考虑在此处将 payment_status 更新为 'refund_pending'，表示退款正在处理中
            // await booking.update({ payment_status: 'refund_pending' });
        }
        // --- 退款逻辑结束 ---

        // 返回成功响应
        res.status(200).json({ message: '订单已成功取消', booking }); // 返回更新后的订单信息

    } catch (error) {
        // 记录详细错误日志
        console.error(`取消订单 (ID: ${booking_id}) 时出错:`, error);

        // 向客户端返回通用错误信息
        res.status(500).json({ message: '服务器内部错误，无法取消订单' });
    }
};

/**
 * 更新订单状态 (例如，由支付回调或管理员操作)
 * @param {object} req - Express请求对象
 * @param {object} res - Express响应对象
 * @param {function} next - Express下一个中间件
 * @returns {Promise<void>}
 */
exports.updateBookingStatus = async (req, res, next) => {
    // 从请求参数获取订单ID
    const { id: booking_id } = req.params;
    // 从请求体获取要更新的状态
    const { status, payment_status } = req.body;
    // 从认证中间件获取用户信息 (包含角色)
    const user = req.user;

    // 验证请求体中至少包含一个要更新的状态
    if (!status && !payment_status) {
        return res.status(400).json({ message: '请求体必须包含要更新的 status 或 payment_status' });
    }

    try {
        // 查询要更新的订单
        const booking = await Booking.findOne({ where: { booking_id } });

        // 检查订单是否存在
        if (!booking) {
            return res.status(404).json({ message: '找不到要更新状态的订单' });
        }

        // 权限检查：
        // 1. 管理员可以更新任何订单状态
        // 2. 普通用户只能更新自己的订单，且仅限于支付相关的状态更新
        const isAdmin = user && user.role === 'admin';
        const isOwner = booking.user_id === user.id;
        
        if (!isAdmin && !isOwner) {
            return res.status(403).json({ message: '无权更新此订单的状态' });
        }
        
        // 普通用户只能进行有限的状态更新（如支付）
        if (!isAdmin && isOwner) {
            // 允许普通用户进行的状态更新（如支付）
            const allowedStatusChanges = {
                // 从待处理到已确认（支付）
                pending_to_confirmed: status === 'confirmed' && booking.status === 'pending' && payment_status === 'paid'
            };
            
            // 检查是否是允许的状态变更
            const isAllowedChange = Object.values(allowedStatusChanges).some(allowed => allowed);
            
            if (!isAllowedChange) {
                return res.status(403).json({ 
                    message: '您只能进行有限的订单状态更新，如支付操作',
                    details: '普通用户不能进行此类订单状态更新'
                });
            }
        }

        // （可选）验证传入的状态值是否合法
        const validStatuses = ['pending', 'processing', 'confirmed', 'completed', 'cancelled'];
        const validPaymentStatuses = ['unpaid', 'paid', 'refunded', 'refund_pending'];
        
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ message: `无效的订单状态: ${status}` });
        }
        if (payment_status && !validPaymentStatuses.includes(payment_status)) {
            return res.status(400).json({ message: `无效的支付状态: ${payment_status}` });
        }

        // 创建要更新的数据对象，只包含请求中提供的字段
        const updateData = {};
        if (status) {
            updateData.status = status;
        }
        if (payment_status) {
            updateData.payment_status = payment_status;
        }

        // 更新订单
        await booking.update(updateData);

        // 返回成功响应
        res.status(200).json({ 
            message: '订单状态已成功更新', 
            booking,
            updatedBy: isAdmin ? 'admin' : 'user' 
        });

    } catch (error) {
        // 记录详细错误日志
        console.error(`更新订单状态 (ID: ${booking_id}) 时出错:`, error);

        // 向客户端返回通用错误信息
        if (error.name === 'SequelizeValidationError') {
            const errors = error.errors.map(err => ({ field: err.path, message: err.message }));
            return res.status(400).json({ message: '订单状态数据验证失败', errors });
        }
        res.status(500).json({ message: '服务器内部错误，无法更新订单状态' });
    }
};

// 其他可能的控制器函数：
// - 管理员获取所有订单列表
// - 处理支付回调等 