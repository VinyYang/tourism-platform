import axios from 'axios';

// 设置基础URL，指向后端 booking API
// 注意: 确保后端服务运行在 3001 端口或相应的环境变量设置
const API_PORT = process.env.REACT_APP_API_PORT || '3001'; // 假设后端运行在3001
const baseURL = process.env.REACT_APP_API_URL || `http://localhost:${API_PORT}/api/v1`;

console.log('API 配置:', { baseURL, API_PORT });

// 创建axios实例
const apiClient = axios.create({
    baseURL,
    timeout: 10000, // 10秒超时
});

// 请求拦截器添加token
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    
    // 增强token处理逻辑
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        // 验证token格式合法性
        if (token.split('.').length !== 3) {
            console.error('发现无效格式的TOKEN！', token.substring(0, 10) + '...');
        } else {
            console.log('TOKEN格式有效，使用这个token发送请求');
        }
    } else {
        console.warn('WARNING: 请求未携带认证TOKEN！');
    }
    
    // 添加详细日志记录
    console.log(`订单API请求: ${config.method?.toUpperCase()} ${config.url}`, { 
        baseURL: config.baseURL,
        headers: {
            ...config.headers,
            Authorization: token ? `Bearer ${token.substring(0, 10)}...` : '未设置'
        },
        params: config.params,
        data: config.data,
        hasToken: !!token
    });
    
    return config;
}, error => {
    console.error('请求拦截器错误:', error);
    return Promise.reject(error);
});

// 响应拦截器添加日志
apiClient.interceptors.response.use(
    response => {
        console.log('API 响应成功:', { 
            url: response.config.url, 
            status: response.status,
            data: response.data 
        });
        return response;
    },
    error => {
        console.error('API 响应错误:', { 
            url: error.config?.url,
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
        });
        
        // 特别处理401错误
        if (error.response?.status === 401) {
            console.error('认证失败(401)，token可能无效或已过期，建议清除token并重新登录');
        }
        
        return Promise.reject(error);
    }
);

// --- 与后端 Booking 模型对应的接口定义 ---

// 后端返回的景点简要信息接口 (用于订单关联)
export interface AssociatedScenic {
    scenic_id: number;
    name: string;
    city: string;
    images: string[]; // 假设后端返回解析好的数组
}

// 后端返回的酒店简要信息接口 (用于订单关联)
export interface AssociatedHotel {
    hotel_id: number;
    name: string;
    city: string;
    images: string[]; // 假设后端返回解析好的数组
}

// 后端返回的用户简要信息接口 (用于订单详情关联)
export interface AssociatedUser {
    user_id: number;
    username: string;
    email: string;
}

export interface TimelineItem {
    time: string; // 时间点
    status: string; // 状态标识
    title: string; // 标题
    description: string; // 描述
}

export interface StatusInfo {
    text: string; // 状态文本
    color: string; // 状态颜色
}

// 后端返回的航班简要信息接口 (用于订单关联)
export interface AssociatedFlight {
    flight_id: number;
    flight_no: string;
    airline: string;
    from_city: string;
    to_city: string;
    departure_time: string;
    arrival_time: string;
    price: number;
}

// 与后端 Booking 模型匹配的订单接口
export interface Booking {
    booking_id: number;
    user_id: number;
    scenic_id: number | null;
    hotel_id: number | null;
    flight_id?: number | null; // 航班ID
    booking_type: 'scenic' | 'hotel' | 'itinerary' | 'flight';
    start_date: string; // 或者 Date 类型，取决于转换
    end_date: string;   // 或者 Date 类型
    num_people: number;
    total_price: number; // 注意：现在由后端计算
    status: 'pending' | 'processing' | 'confirmed' | 'completed' | 'cancelled' | 'refunding' | 'refunded';
    payment_status: 'unpaid' | 'paid' | 'refunded' | 'refund_pending';
    created_at: string; // 或者 Date
    updated_at: string; // 或者 Date
    Scenic?: AssociatedScenic | null; // 关联的景点信息 (可选)
    Hotel?: AssociatedHotel | null;   // 关联的酒店信息 (可选)
    Flight?: AssociatedFlight | null; // 关联的航班信息 (可选)
    User?: AssociatedUser | null;     // 关联的用户信息 (可选, 用于详情)
    timeline?: TimelineItem[]; // 订单时间轴 (可选)
    statusInfo?: StatusInfo; // 状态信息 (可选)
}

// 后端分页信息接口
export interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit?: number; // 添加 limit 属性以匹配后端和前端逻辑
    pageSize?: number; // 保留以兼容 Ant Design Pagination 组件
    itemsPerPage?: number; // 保留以兼容可能的旧后端响应
}

// 获取订单列表响应接口 (匹配后端 getUserBookings)
export interface BookingListResponse {
    message: string;
    bookings: Booking[];
    pagination: PaginationInfo;
}

// 获取单个订单详情响应接口 (匹配后端 getBookingById)
export interface BookingDetailResponse {
    message: string;
    booking: Booking;
}

// 创建机票订单的请求参数接口
export interface CreateFlightBookingRequest extends CreateBookingRequest {
    flight_id: number;      // 航班ID
    flight_no: string;      // 航班号
    airline: string;        // 航空公司
    from_city: string;      // 出发城市
    to_city: string;        // 目的城市
    departure_time: string; // 起飞时间
    arrival_time: string;   // 到达时间
    passenger_name: string; // 乘客姓名
    passenger_id_type: 'id_card' | 'passport' | 'other'; // 证件类型
    passenger_id_no: string; // 证件号码
    contact_phone: string;   // 联系电话
    contact_email?: string;  // 联系邮箱
    price: number;          // 票价
}

// 创建订单请求接口 (匹配后端 createBooking)
export interface CreateBookingRequest {
    scenic_id?: number; // 景点ID (景点订单必需)
    hotel_id?: number;  // 酒店ID (酒店订单必需)
    room_id?: number;   // 酒店房间ID (酒店订单必需)
    flight_id?: number; // 航班ID (机票订单必需)
    booking_type: 'scenic' | 'hotel' | 'flight'; // 支持机票订单类型
    start_date: string; // e.g., 'YYYY-MM-DD'
    end_date: string;   // e.g., 'YYYY-MM-DD'
    num_people: number;
    // total_price 不再由前端发送
}

// 创建订单响应接口 (匹配后端 createBooking)
export interface CreateBookingResponse {
    message: string;
    booking: Booking; // 返回新创建的订单
}

// 取消订单响应接口 (匹配后端 cancelBooking)
export interface CancelBookingResponse {
    message: string;
    booking: Booking; // 返回更新后的订单
}

// 更新订单状态请求接口 (匹配后端 updateBookingStatus - 管理员用)
export interface UpdateBookingStatusRequest {
    status?: 'pending' | 'processing' | 'confirmed' | 'completed' | 'cancelled' | 'refunding' | 'refunded';
    payment_status?: 'unpaid' | 'paid' | 'refunded' | 'refund_pending';
}

// 更新订单状态响应接口 (匹配后端 updateBookingStatus)
export interface UpdateBookingStatusResponse {
    message: string;
    booking: Booking;
}

// 添加订单状态枚举
export enum OrderStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    CONFIRMED = 'confirmed',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    REFUNDING = 'refunding',
    REFUNDED = 'refunded'
}

// 添加订单项接口
export interface OrderItem {
    id: number;
    scenicId?: number;
    hotelId?: number;
    flightId?: number;    // 航班ID
    scenicName?: string;
    hotelName?: string;
    flightNo?: string;    // 航班号
    airline?: string;     // 航空公司
    fromCity?: string;    // 出发城市
    toCity?: string;      // 目的城市
    price: number;
    quantity: number;
}

// 添加订单接口，与Booking兼容
export interface Order extends Booking {
    id: number;
    userId: number;
    status: OrderStatus;
    items?: OrderItem[];
    totalPrice: number;
    createdAt: string;
}

// 订单相关的API服务 (与后端 booking API 对齐)
const bookingAPI = {
    /**
     * 创建新订单
     * @param bookingData 订单数据
     * @returns 创建的订单信息
     */
    createBooking: async (bookingData: CreateBookingRequest): Promise<CreateBookingResponse> => {
        console.log('调用createBooking API，数据:', bookingData);
        
        try {
            // 确保数据格式符合后端要求
            if (bookingData.scenic_id) {
                console.log(`创建景点预订，ID: ${bookingData.scenic_id}`);
            } else if (bookingData.hotel_id) {
                console.log(`创建酒店预订，ID: ${bookingData.hotel_id}`);
            } else {
                console.error('预订数据缺少目标ID');
                throw new Error('预订数据缺少目标ID');
            }
            
            // 直接使用后端接口路径
            const response = await apiClient.post('/bookings', bookingData);
            console.log('创建订单成功，响应:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('创建订单失败:', error);
            // 尝试输出更多错误信息
            if (error.response) {
                console.error('- 响应状态:', error.response.status);
                console.error('- 响应数据:', error.response.data);
            } else if (error.request) {
                console.error('- 请求已发送但未收到响应');
            } else {
                console.error('- 请求配置错误:', error.message);
            }
            throw error;
        }
    },

    /**
     * 获取当前用户的订单列表
     * @param page 当前页码
     * @param pageSize 每页数量 (对应后端的 limit)
     * @returns 订单列表响应
     */
    getUserBookings: async (page: number = 1, pageSize: number = 10): Promise<BookingListResponse> => {
        const response = await apiClient.get('/bookings', {
            params: { page, limit: pageSize } // 将 pageSize 映射到后端的 limit 参数
        });
        // 注意：这里假设后端返回的 pagination 对象包含 pageSize 字段
        // 如果后端仍然返回 itemsPerPage，需要在这里做转换或通知后端修改
        return response.data;
    },

    /**
     * 获取单个订单详情
     * @param bookingId 订单ID
     * @returns 订单详情响应
     */
    getBookingById: async (bookingId: number): Promise<BookingDetailResponse> => {
        try {
            // 订单ID有效性检查
            const validBookingId = Number(bookingId);
            if (isNaN(validBookingId) || validBookingId <= 0) {
                console.error(`[API] 无效的订单ID: ${bookingId}`);
                throw new Error(`无效的订单ID: ${bookingId}`);
            }
            
            // 尝试从预订API获取
            console.log(`[API] 尝试从预订API获取订单详情: ${validBookingId}`);
            try {
                const response = await apiClient.get(`/bookings/${validBookingId}`);
                console.log(`[API] 成功从预订API获取订单详情: ${validBookingId}`, response.data);
                return response.data;
            } catch (bookingError: any) {
                console.error(`[API] 从预订API获取订单失败 (${validBookingId}):`, bookingError.message);
                
                // 如果是404错误，尝试从用户订单API获取
                if (bookingError.response?.status === 404) {
                    console.log(`[API] 尝试从用户订单API获取: ${validBookingId}`);
                    try {
                        const userResponse = await apiClient.get(`/users/orders/${validBookingId}`);
                        console.log(`[API] 成功从用户订单API获取: ${validBookingId}`, userResponse.data);
                        return userResponse.data;
                    } catch (userError: any) {
                        console.error(`[API] 从用户订单API获取订单失败 (${validBookingId}):`, userError.message);
                        throw userError; // 如果两种方式都失败，则抛出最后的错误
                    }
                } else {
                    // 非404错误直接抛出
                    throw bookingError;
                }
            }
        } catch (error: any) {
            console.error(`[API] 获取订单详情最终失败 (${bookingId}):`, error.message);
            
            // 构造一个标准的错误响应，以便前端统一处理
            const errorResponse: BookingDetailResponse = {
                message: error.response?.data?.message || error.message || '获取订单详情失败',
                booking: {} as Booking // 空对象, 前端需处理
            };
            
            // 重新抛出一个包含更多信息的错误
            const enhancedError = new Error(errorResponse.message);
            (enhancedError as any).response = error.response;
            (enhancedError as any).errorData = errorResponse;
            throw enhancedError;
        }
    },

    /**
     * 取消订单
     * @param bookingId 订单ID
     * @returns 取消后的订单信息
     */
    cancelBooking: async (bookingId: number): Promise<CancelBookingResponse> => {
        const response = await apiClient.put(`/bookings/${bookingId}/cancel`); // 注意方法是 PUT, 路径是 /cancel
        return response.data;
    },

    /**
     * 更新订单状态 (仅限管理员)
     * @param bookingId 订单ID
     * @param statusData 状态更新数据
     * @returns 更新后的订单信息
     */
    updateBookingStatus: async (bookingId: number, statusData: UpdateBookingStatusRequest): Promise<UpdateBookingStatusResponse> => {
        const response = await apiClient.put(`/bookings/${bookingId}/status`, statusData); // 注意方法是 PUT, 路径是 /status
        return response.data;
    },

    /**
     * 创建新机票订单
     * @param bookingData 机票订单数据
     * @returns 创建的订单信息
     */
    createFlightBooking: async (bookingData: CreateFlightBookingRequest): Promise<CreateBookingResponse> => {
        console.log('调用createFlightBooking API，数据:', bookingData);
        
        try {
            // 确保数据格式符合后端要求
            if (!bookingData.flight_id) {
                console.error('预订数据缺少航班ID');
                throw new Error('预订数据缺少航班ID');
            }
            
            // 确保预订类型为flight
            bookingData.booking_type = 'flight';
            
            console.log(`创建机票预订，航班: ${bookingData.flight_no}, ${bookingData.from_city} -> ${bookingData.to_city}`);
            
            // 直接使用后端接口路径
            const response = await apiClient.post('/bookings', bookingData);
            console.log('创建机票订单成功，响应:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('创建机票订单失败:', error);
            // 尝试输出更多错误信息
            if (error.response) {
                console.error('- 响应状态:', error.response.status);
                console.error('- 响应数据:', error.response.data);
            } else if (error.request) {
                console.error('- 请求已发送但未收到响应');
            } else {
                console.error('- 请求配置错误:', error.message);
            }
            throw error;
        }
    },

    /**
     * 创建新订单（兼容旧API）
     * @param orderData 订单数据
     * @returns 创建的订单信息
     */
    createOrder: async (orderData: any): Promise<{ order: Order }> => {
        // 内部调用createBooking来保持一致性
        const response = await apiClient.post('/bookings', orderData);
        // 转换为旧的Order格式返回
        const booking = response.data.booking;
        return { 
            order: {
                ...booking,
                id: booking.booking_id,
                userId: booking.user_id,
                status: booking.status,
                totalPrice: booking.total_price,
                createdAt: booking.created_at,
                items: []
            } 
        };
    },

    /**
     * 获取订单详情（兼容旧API）
     * @param orderId 订单ID
     * @returns 订单详情
     */
    getOrderDetail: async (orderId: number): Promise<Order> => {
        try {
            const response = await apiClient.get(`/users/orders/${orderId}`);
            
            console.log('获取订单详情原始响应:', response.data);
            
            // 检查是否是新格式订单数据 (直接返回对象，而不是包含booking字段)
            if (response.data && response.data.id && !response.data.booking) {
                console.log('检测到新格式订单数据，进行格式转换');
                
                // 新格式订单数据
                const newFormatOrder = response.data;
                
                // 将新格式转换为旧格式
                const convertedBooking = {
                    booking_id: newFormatOrder.id || 0,
                    user_id: newFormatOrder.userId || 0,
                    scenic_id: newFormatOrder.scenicId || null,
                    hotel_id: newFormatOrder.hotelId || null,
                    booking_type: newFormatOrder.type || 'unknown',
                    start_date: newFormatOrder.startDate || '',
                    end_date: newFormatOrder.endDate || '',
                    num_people: newFormatOrder.quantity || 1,
                    total_price: parseFloat(newFormatOrder.totalAmount) || 0,
                    status: newFormatOrder.status || 'pending',
                    payment_status: newFormatOrder.paymentStatus || 'unpaid',
                    created_at: newFormatOrder.createTime || new Date().toISOString(),
                    updated_at: newFormatOrder.updateTime || '',
                    // 尝试转换关联数据
                    Scenic: newFormatOrder.scenicInfo ? {
                        scenic_id: newFormatOrder.scenicId,
                        name: newFormatOrder.scenicInfo.name || '未知景点',
                        city: newFormatOrder.scenicInfo.city || '未知城市',
                        images: newFormatOrder.scenicInfo.images || []
                    } : null,
                    Hotel: newFormatOrder.hotelInfo ? {
                        hotel_id: newFormatOrder.hotelId,
                        name: newFormatOrder.hotelInfo.name || '未知酒店',
                        city: newFormatOrder.hotelInfo.city || '未知城市',
                        images: newFormatOrder.hotelInfo.images || []
                    } : null,
                    User: null, // 用户信息通常不在订单详情中返回
                    timeline: newFormatOrder.timeline || [],
                    statusInfo: null
                };
                
                // 创建一个带默认值的安全对象
                const safeBooking = {
                    booking_id: convertedBooking.booking_id || 0,
                    user_id: convertedBooking.user_id || 0,
                    scenic_id: convertedBooking.scenic_id || null,
                    hotel_id: convertedBooking.hotel_id || null,
                    booking_type: convertedBooking.booking_type || 'unknown',
                    start_date: convertedBooking.start_date || '',
                    end_date: convertedBooking.end_date || '',
                    num_people: convertedBooking.num_people || 1,
                    total_price: convertedBooking.total_price || 0,
                    status: convertedBooking.status || 'pending',
                    payment_status: convertedBooking.payment_status || 'unpaid',
                    created_at: convertedBooking.created_at || new Date().toISOString(),
                    updated_at: convertedBooking.updated_at || '',
                    Scenic: convertedBooking.Scenic || null,
                    Hotel: convertedBooking.Hotel || null,
                    User: convertedBooking.User || null,
                    timeline: convertedBooking.timeline || [],
                    statusInfo: convertedBooking.statusInfo || null
                };
                
                console.log('转换后的订单数据:', safeBooking);
                
                // 转换为旧格式，并确保所有字段都有合理的默认值
                return {
                    ...safeBooking,
                    id: safeBooking.booking_id,
                    userId: safeBooking.user_id,
                    status: safeBooking.status as OrderStatus,
                    totalPrice: safeBooking.total_price,
                    createdAt: safeBooking.created_at,
                    items: [{
                        id: 1,
                        scenicId: safeBooking.scenic_id,
                        hotelId: safeBooking.hotel_id,
                        scenicName: safeBooking.Scenic?.name || '未知景点',
                        hotelName: safeBooking.Hotel?.name || '未知酒店',
                        price: safeBooking.total_price,
                        quantity: safeBooking.num_people
                    }],
                    statusInfo: safeBooking.statusInfo || undefined
                };
            }
            
            // 旧格式处理逻辑
            // 检查响应数据格式 - 修改判断逻辑，增加更多容错处理
            const responseData = response.data;
            
            // 如果响应直接是订单数据对象（没有嵌套在booking字段中）
            if (responseData && !responseData.booking) {
                console.log('检测到订单数据直接返回在响应中，不包含booking字段');
                
                // 创建一个带默认值的安全对象
                const safeBooking = {
                    booking_id: responseData.booking_id || responseData.id || 0,
                    user_id: responseData.user_id || responseData.userId || 0,
                    scenic_id: responseData.scenic_id || responseData.scenicId || null,
                    hotel_id: responseData.hotel_id || responseData.hotelId || null,
                    booking_type: responseData.booking_type || responseData.type || 'unknown',
                    start_date: responseData.start_date || responseData.startDate || '',
                    end_date: responseData.end_date || responseData.endDate || '',
                    num_people: responseData.num_people || responseData.quantity || 1,
                    total_price: responseData.total_price || responseData.totalPrice || responseData.totalAmount || 0,
                    status: responseData.status || 'pending',
                    payment_status: responseData.payment_status || responseData.paymentStatus || 'unpaid',
                    created_at: responseData.created_at || responseData.createdAt || responseData.createTime || new Date().toISOString(),
                    updated_at: responseData.updated_at || responseData.updatedAt || responseData.updateTime || '',
                    Scenic: responseData.Scenic || responseData.scenicInfo || null,
                    Hotel: responseData.Hotel || responseData.hotelInfo || null,
                    User: responseData.User || responseData.userInfo || null,
                    timeline: responseData.timeline || [],
                    statusInfo: responseData.statusInfo || null
                };
                
                // 转换为旧格式，并确保所有字段都有合理的默认值
                return {
                    ...safeBooking,
                    id: safeBooking.booking_id,
                    userId: safeBooking.user_id,
                    status: safeBooking.status as OrderStatus,
                    totalPrice: safeBooking.total_price,
                    createdAt: safeBooking.created_at,
                    items: [{
                        id: 1,
                        scenicId: safeBooking.scenic_id,
                        hotelId: safeBooking.hotel_id,
                        scenicName: safeBooking.Scenic?.name || '未知景点',
                        hotelName: safeBooking.Hotel?.name || '未知酒店',
                        price: safeBooking.total_price,
                        quantity: safeBooking.num_people
                    }],
                    statusInfo: safeBooking.statusInfo || undefined
                };
            }
            
            // 原有逻辑 - 响应中包含booking字段
            if (!responseData || !responseData.booking) {
                console.error('获取订单详情响应格式异常，尝试直接使用响应数据:', responseData);
                // 不再抛出错误，而是尝试使用responseData本身
                
                // 创建一个带默认值的安全对象
                const safeBooking = {
                    booking_id: responseData?.booking_id || responseData?.id || orderId,
                    user_id: responseData?.user_id || responseData?.userId || 0,
                    scenic_id: responseData?.scenic_id || responseData?.scenicId || null,
                    hotel_id: responseData?.hotel_id || responseData?.hotelId || null,
                    booking_type: responseData?.booking_type || responseData?.type || 'unknown',
                    start_date: responseData?.start_date || responseData?.startDate || '',
                    end_date: responseData?.end_date || responseData?.endDate || '',
                    num_people: responseData?.num_people || responseData?.quantity || 1,
                    total_price: responseData?.total_price || responseData?.totalPrice || 0,
                    status: responseData?.status || 'pending',
                    payment_status: responseData?.payment_status || responseData?.paymentStatus || 'unpaid',
                    created_at: responseData?.created_at || responseData?.createdAt || new Date().toISOString(),
                    updated_at: responseData?.updated_at || responseData?.updatedAt || '',
                    Scenic: responseData?.Scenic || null,
                    Hotel: responseData?.Hotel || null,
                    User: responseData?.User || null,
                    timeline: responseData?.timeline || [],
                    statusInfo: responseData?.statusInfo || null
                };
                
                return {
                    ...safeBooking,
                    id: safeBooking.booking_id,
                    userId: safeBooking.user_id,
                    status: safeBooking.status as OrderStatus,
                    totalPrice: safeBooking.total_price,
                    createdAt: safeBooking.created_at,
                    items: [{
                        id: 1,
                        scenicId: safeBooking.scenic_id,
                        hotelId: safeBooking.hotel_id,
                        scenicName: safeBooking.Scenic?.name || '未知景点',
                        hotelName: safeBooking.Hotel?.name || '未知酒店',
                        price: safeBooking.total_price,
                        quantity: safeBooking.num_people
                    }],
                    statusInfo: safeBooking.statusInfo || undefined
                };
            }
            
            const booking = responseData.booking;
            
            // 创建一个带默认值的安全对象
            const safeBooking = {
                booking_id: booking.booking_id || 0,
                user_id: booking.user_id || 0,
                scenic_id: booking.scenic_id || null,
                hotel_id: booking.hotel_id || null,
                booking_type: booking.booking_type || 'unknown',
                start_date: booking.start_date || '',
                end_date: booking.end_date || '',
                num_people: booking.num_people || 1,
                total_price: booking.total_price || 0,
                status: booking.status || 'pending',
                payment_status: booking.payment_status || 'unpaid',
                created_at: booking.created_at || new Date().toISOString(),
                updated_at: booking.updated_at || '',
                Scenic: booking.Scenic || null,
                Hotel: booking.Hotel || null,
                User: booking.User || null,
                timeline: booking.timeline || [],
                statusInfo: booking.statusInfo || null
            };
            
            // 转换为旧格式，并确保所有字段都有合理的默认值
            return {
                ...safeBooking,
                id: safeBooking.booking_id,
                userId: safeBooking.user_id,
                status: safeBooking.status as OrderStatus,
                totalPrice: safeBooking.total_price,
                createdAt: safeBooking.created_at,
                items: [{
                    id: 1,
                    scenicId: safeBooking.scenic_id,
                    hotelId: safeBooking.hotel_id,
                    scenicName: safeBooking.Scenic?.name || '未知景点',
                    hotelName: safeBooking.Hotel?.name || '未知酒店',
                    price: safeBooking.total_price,
                    quantity: safeBooking.num_people
                }],
                statusInfo: safeBooking.statusInfo || undefined
            };
        } catch (error) {
            console.error('获取订单详情失败:', error);
            // 重新抛出错误，让调用者处理
            throw error;
        }
    },

    /**
     * 支付订单（兼容旧API）
     * @param orderId 订单ID
     * @returns 支付结果
     */
    payOrder: async (orderId: number): Promise<any> => {
        try {
            // 确保orderId是数字
            const bookingId = Number(orderId);
            if (isNaN(bookingId)) {
                throw new Error(`无效的订单ID: ${orderId}`);
            }
            
            console.log(`尝试支付订单ID: ${bookingId} (原始参数值: ${orderId})`);
            
            // 调用后端API更新订单状态
            const response = await apiClient.put(`/bookings/${bookingId}/status`, {
                status: 'confirmed',
                payment_status: 'paid'
            });
            
            console.log('支付请求响应:', response.data);
            return response.data;
        } catch (error: any) {
            console.error(`支付订单失败 (订单ID: ${orderId}):`, error);
            console.error('错误响应详情:', error.response?.data);
            
            // 如果使用bookings路径失败，尝试使用orders路径
            if (error.response && (error.response.status === 404 || error.response.status === 400)) {
                try {
                    // 尝试备用路径
                    console.log(`尝试使用备用API路径支付订单 (订单ID: ${orderId})`);
                    const bookingId = Number(orderId);
                    const newResponse = await apiClient.put(`/orders/${bookingId}/pay`, {
                        status: 'confirmed',
                        paymentStatus: 'paid'
                    });
                    console.log('备用API支付请求响应:', newResponse.data);
                    return newResponse.data;
                } catch (newError: any) {
                    console.error(`备用API支付订单也失败 (订单ID: ${orderId}):`, newError);
                    console.error('备用API错误响应详情:', newError.response?.data);
                    throw newError; // 抛出新的错误，包含更多上下文
                }
            }
            
            // 如果不是404或400错误，直接抛出原始错误
            throw error;
        }
    }
};

// 导出新的 bookingAPI
export default bookingAPI; 