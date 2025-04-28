import axios from 'axios';

// 设置基础URL，明确指向3001端口的后端服务
// 如果.env文件中有配置值则使用配置值，否则使用默认值
const API_PORT = process.env.REACT_APP_API_PORT || '3001';
const BASE_URL = process.env.REACT_APP_API_URL || `http://localhost:${API_PORT}/api/v1`;

// 创建axios实例
const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10秒超时
});

// 请求拦截器 - 添加认证token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 定义酒店数据类型
export interface Hotel {
    id: number;
    name: string;
    city: string;
    address: string;
    type: string;
    price: number;
    rating: number;
    facilities?: string[] | string;  // 修改为支持字符串或字符串数组
    amenities?: string[] | string;   // 修改为支持字符串或字符串数组
    images: string[] | string;
    description: string;
    stars?: number;
    price_range?: string;
    location?: string | HotelLocation;
    coverImage?: string;
    policies?: HotelPolicies;
    score?: string | number;  // 与rating字段同义，增加兼容性
}

// 酒店政策类型
export interface HotelPolicies {
    checkIn: string;
    checkOut: string;
    children: string;
    pets: string;
    cancellation: string;
}

// 酒店详情位置类型
export interface HotelLocation {
    address: string;
    zipCode: string;
    latitude: number;
    longitude: number;
    nearbyAttractions: {
        name: string;
        distance: string;
    }[];
}

// 扩展酒店房间接口，兼容后端不同的字段命名
export interface HotelRoom {
    id: number;
    name?: string;
    type?: string;  // 后端可能使用type代替name
    description?: string;
    size?: string;
    beds?: string;
    price: number;
    capacity?: number;
    maxOccupancy?: number;  // 后端可能使用maxOccupancy代替capacity
    facilities?: string[];
    amenities?: string[];  // 后端可能使用amenities代替facilities
    images: string[] | string;
    available?: boolean;
}

// 扩展评论接口，兼容后端不同的字段命名
export interface HotelReview {
    id: number;
    userId: number;
    username?: string;
    userName?: string;  // 后端可能使用userName代替username
    avatar?: string;
    content?: string;
    comment?: string;  // 后端可能使用comment代替content
    rating: number;
    createdAt?: string;
    date?: string;  // 后端可能使用date代替createdAt
}

export interface HotelDetail extends Hotel {
    policies?: HotelPolicies;
    location?: HotelLocation;
    rooms: HotelRoom[];
    reviews: HotelReview[];
    nearbyAttractions: {
        id: number;
        name: string;
        distance: string;
        type: string;
    }[];
}

export interface HotelSearchParams {
    city?: string;
    keyword?: string;
    type?: string;
    priceRange?: [number, number];
    facilities?: string[];
    stars?: number;
    page?: number;
    pageSize?: number;
    sortBy?: 'price' | 'rating' | 'popularity';
    sortOrder?: 'asc' | 'desc';
}

export interface HotelSearchResponse {
    items?: Hotel[];  // 使用可选属性
    hotels?: Hotel[]; // 添加hotels属性，支持后端返回hotels字段
    total: number;
    page: number;
    pageSize: number;
    totalPages?: number; // 添加可能存在的totalPages字段
}

// 酒店API
const hotelAPI = {
    // 获取酒店列表
    getHotels: (params: HotelSearchParams = {}) => {
        // 手动构建查询参数以确保格式正确
        const queryParams: Record<string, any> = {};

        // 复制基本参数
        if (params.city) queryParams.city = params.city;
        if (params.keyword) queryParams.keyword = params.keyword;
        if (params.type) queryParams.type = params.type;
        if (params.stars) queryParams.stars = params.stars;
        if (params.page) queryParams.page = params.page;
        if (params.pageSize) queryParams.pageSize = params.pageSize;
        if (params.sortBy) queryParams.sortBy = params.sortBy;
        if (params.sortOrder) queryParams.sortOrder = params.sortOrder;
        
        // 特殊处理 facilities 数组 (如果后端期望逗号分隔字符串)
        if (params.facilities && Array.isArray(params.facilities)) {
            queryParams.amenities = params.facilities.join(','); // 后端 hotelController 使用 amenities 字段并期望字符串
        }
        
        // 处理 priceRange 数组为 priceMin 和 priceMax
        if (params.priceRange && params.priceRange.length === 2) {
            queryParams.priceMin = params.priceRange[0];
            // 如果 max 是 Infinity，则省略 priceMax，让后端处理上限
            if (params.priceRange[1] !== Infinity) {
                queryParams.priceMax = params.priceRange[1];
            }
        }
        
        // 发送请求
        return api.get<HotelSearchResponse>('/hotels', { params: queryParams });
    },
    
    // 获取所有酒店（用于价格分析）
    getAllHotels: async () => {
        try {
            // 获取所有酒店数据（不分页，用于数据分析）
            const response = await api.get<HotelSearchResponse>('/hotels', { 
                params: { 
                    pageSize: 1000,  // 使用较大的页面大小来获取所有数据
                    sortBy: 'price'
                } 
            });
            return response;
        } catch (error) {
            console.error('获取所有酒店数据失败', error);
            const directAPI = axios.create({
                baseURL: 'http://localhost:3001/api/v1',
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            });
            return await directAPI.get<HotelSearchResponse>('/hotels', { 
                params: { 
                    pageSize: 1000,
                    sortBy: 'price'
                } 
            });
        }
    },
    
    // 获取酒店详情
    getHotelDetail: (id: number | string) => 
        api.get<HotelDetail>(`/hotels/${id}`),
    
    // 获取热门酒店
    getHotHotels: (limit: number = 6) => 
        api.get<Hotel[]>('/hotels/hot', { params: { limit } }),
    
    // 获取城市列表
    getCities: () => 
        api.get<string[]>('/hotels/cities'),
    
    // 获取酒店类型列表
    getTypes: () => 
        api.get<string[]>('/hotels/types'),

    // 获取设施列表 
    getFacilities: () => 
        api.get<string[]>('/hotels/facilities'),
    
    // 提交酒店评价
    submitReview: (hotelId: number | string, review: { rating: number; content: string }) => 
        api.post(`/hotels/${hotelId}/reviews`, review),
    
    // 添加酒店到收藏
    addFavorite: (hotelId: number | string) => 
        api.post('/users/favorites', { itemType: 'hotel', hotelId }),
    
    // 从收藏中移除酒店
    removeFavorite: (favoriteId: number | string) => 
        api.delete(`/users/favorites/${favoriteId}`),

    // 预订酒店房间
    bookRoom: (hotelId: number | string, bookingData: {
        roomId: number;
        startDate: string;
        endDate: string;
        guestCount: number;
        specialRequests?: string;
    }) => {
        console.log('提交酒店预订:', { hotelId, ...bookingData });
        
        // 转换为后端API格式的数据
        const apiData = {
            hotel_id: hotelId,
            room_id: bookingData.roomId,
            booking_type: 'hotel',
            start_date: bookingData.startDate,
            end_date: bookingData.endDate,
            num_people: bookingData.guestCount,
            special_requests: bookingData.specialRequests
        };
        
        // 使用订单API创建预订
        return api.post(`/bookings`, apiData);
    },
};

export default hotelAPI; 