import axios from 'axios';

// 设置基础URL，支持3000或3001端口
const API_PORT = process.env.REACT_APP_API_PORT || '3001';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || `http://localhost:${API_PORT}/api/v1`;

// 创建axios实例
const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
});

// 请求拦截器添加token
instance.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// 订单状态枚举
export enum BookingStatus {
    PENDING = 'pending',     // 待支付
    PAID = 'paid',           // 已支付
    CONFIRMED = 'confirmed', // 已确认
    COMPLETED = 'completed', // 已完成
    CANCELLED = 'cancelled', // 已取消
    REFUNDING = 'refunding', // 退款中
    REFUNDED = 'refunded',   // 已退款
}

// 订单类型接口
export interface Booking {
    id: string;
    userId: string;
    scenicId: string;
    scenicName: string;
    ticketPrice: number;
    quantity: number;
    totalAmount: number;
    visitDate: string;
    contactName: string;
    contactPhone: string;
    contactEmail: string;
    status: BookingStatus;
    createdAt: string;
    updatedAt: string;
    paymentId?: string;
    paymentMethod?: string;
    paymentTime?: string;
}

// 创建订单的请求参数接口
export interface CreateBookingParams {
    scenicId: string;
    quantity: number;
    visitDate: string;
    contactName: string;
    contactPhone: string;
    contactEmail: string;
}

// 分页请求参数接口
export interface PaginationParams {
    page?: number;
    limit?: number;
}

// 订单列表响应接口
export interface BookingsResponse {
    total: number;
    page: number;
    limit: number;
    data: Booking[];
}

// 订单API服务对象
const bookingAPI = {
    // 创建订单
    createBooking: async (params: CreateBookingParams): Promise<Booking> => {
        const response = await instance.post('/bookings', params);
        return response.data;
    },

    // 获取订单详情
    getBookingDetail: async (id: string): Promise<Booking> => {
        const response = await instance.get(`/bookings/${id}`);
        return response.data;
    },

    // 获取用户的订单列表
    getUserBookings: async (params?: PaginationParams): Promise<BookingsResponse> => {
        const response = await instance.get('/bookings/user', { params });
        return response.data;
    },

    // 取消订单
    cancelBooking: async (id: string): Promise<Booking> => {
        const response = await instance.put(`/bookings/${id}/cancel`);
        return response.data;
    },

    // 支付订单
    payBooking: async (id: string, paymentMethod: string): Promise<Booking> => {
        const response = await instance.put(`/bookings/${id}/status`, { 
            status: 'confirmed',
            payment_status: 'paid'
        });
        return response.data;
    },

    // 申请退款
    requestRefund: async (id: string, reason: string): Promise<Booking> => {
        const response = await instance.put(`/bookings/${id}/refund`, { reason });
        return response.data;
    },
};

export default bookingAPI; 