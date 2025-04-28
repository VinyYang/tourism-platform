import axios from 'axios';
import { User, UserRole } from '../@types/user';
import { Scenic } from '../@types/scenic';
import { Hotel } from '../@types/hotel';
import { Strategy } from '../@types/strategy';
import getAuthHeader from './auth';

// 设置基础URL，支持3000或3001端口
const API_PORT = process.env.REACT_APP_API_PORT || '3001';
const baseURL = process.env.REACT_APP_API_URL || `http://localhost:${API_PORT}/api/v1`;

// 创建axios实例
const api = axios.create({
    baseURL,
    timeout: 15000, // 15秒超时
    headers: {
        'Content-Type': 'application/json'
    }
});

// 请求拦截器：添加Authorization头
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});

// 响应拦截器：处理错误
api.interceptors.response.use(response => {
    return response;
}, error => {
    // 处理401未授权错误，重定向到登录页
    if (error.response && error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
    }
    return Promise.reject(error);
});

// 分页响应接口
interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    meta: {
        total: number;
        page: number;
        pageSize: number;
    };
    message?: string;
}

// 单个响应接口
interface SingleResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

// 统计数据接口 (添加 export)
export interface DashboardStats {
    users: {
        total: number;
        new: number;
    };
    scenics: {
        total: number;
    };
    hotels: {
        total: number;
    };
    orders: {
        total: number;
        pending: number;
    };
    strategies: {
        total: number;
    };
    revenue: {
        recent: number;
    };
}

// 搜索参数基础接口
interface BaseSearchParams {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

// 用户搜索参数 (添加 export)
export interface UserSearchParams extends BaseSearchParams {
    keyword?: string;
    role?: string;
}

// 景点搜索参数
interface ScenicSearchParams extends BaseSearchParams {
    keyword?: string;
    city?: string;
    priceMin?: number;
    priceMax?: number;
}

// 酒店搜索参数
export interface HotelSearchParams extends BaseSearchParams {
    keyword?: string;
    city?: string;
    priceMin?: number;
    priceMax?: number;
    stars?: number;
}

// 订单状态类型 (移到这里)
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

// 订单搜索参数 (添加 export)
export interface OrderSearchParams extends BaseSearchParams {
    userId?: number;
    status?: BookingStatus; // 使用类型别名
    startDate?: string;
    endDate?: string;
}

// --- 新增：评论相关类型定义 ---
// 假设评论状态 (需要根据后端 Review 模型确认)
export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface Review {
    review_id: number; // 假设主键是 review_id
    user_id: number;
    item_id: number; // 关联的项目ID (景点/酒店/攻略)
    item_type: string; // 关联的项目类型
    rating: number;
    content: string;
    status: ReviewStatus;
    admin_reply?: string;
    created_at: string;
    updated_at?: string;
    // 关联的用户信息
    user?: Pick<User, 'user_id' | 'username' | 'avatar'>;
    // 关联的项目信息 (可选，根据 API 返回情况添加)
    // scenic?: Pick<Scenic, 'scenic_id' | 'name'>;
    // hotel?: Pick<Hotel, 'id' | 'name'>;
    // strategy?: Pick<Strategy, 'strategy_id' | 'title'>;
}

// 评论搜索参数 (添加 export)
export interface ReviewSearchParams extends BaseSearchParams {
    userId?: number;
    itemType?: string;
    itemId?: number;
    status?: ReviewStatus; // 使用类型别名
    minRating?: number;
    maxRating?: number;
}

// 攻略搜索参数
export interface StrategySearchParams extends BaseSearchParams {
    keyword?: string;
    userId?: number;
    city?: string;
    status?: string;
}

// 新增：管理员创建用户时的数据结构
interface AdminCreateUserPayload {
    username: string;
    email: string;
    password: string;
    role?: UserRole; // role 是可选的，后端有默认值 'user'
}

// --- 新增：订单/预订类型定义 ---
export interface Booking {
    booking_id: number;
    user_id: number;
    item_id?: number; 
    item_type?: string; 
    status: BookingStatus;
    total_amount: number;
    created_at: string;
    updated_at?: string;
    remarks?: string;
    // 关联的用户信息 (从 getOrders API 获取时可能包含)
    user?: Pick<User, 'user_id' | 'username' | 'email'>; // 只包含部分用户信息
}

// 坐标统计数据接口
export interface CoordinateStats {
    totalCount: number;
    missingCoordinatesCount: number;
    completionRate: string;
    recentMissingCoordinates: Array<{
        scenic_id: number;
        name: string;
        city: string;
        address: string;
        created_at: string;
        updated_at: string;
    }>;
}

// 管理员API
const adminAPI = {
    // 仪表盘
    getDashboardStats: () => api.get<SingleResponse<DashboardStats>>('/admin/dashboard'),

    // 用户管理
    getUsers: (params: UserSearchParams = {}) => 
        api.get<PaginatedResponse<User>>('/admin/users', { params }),
    getUserById: (user_id: number) => 
        api.get<SingleResponse<User>>(`/admin/users/${user_id}`),
    createUser: (userData: AdminCreateUserPayload) => 
        api.post<SingleResponse<User>>('/admin/users', userData),
    updateUser: (user_id: number, userData: Partial<User>) => 
        api.put<SingleResponse<User>>(`/admin/users/${user_id}`, userData),
    deleteUser: (user_id: number) => 
        api.delete<SingleResponse<{ success: boolean }>>(`/admin/users/${user_id}`),

    // 景点管理 (补全)
    getScenics: (params: ScenicSearchParams = {}) => 
        api.get<PaginatedResponse<Scenic>>('/admin/scenics', { params }),
    getScenicById: (id: number) => 
        api.get<SingleResponse<Scenic>>(`/admin/scenics/${id}`),
    createScenic: (scenicData: Partial<Scenic>) => {
        // 处理坐标数据确保正确传输
        const processedData = processScenicCoordinates(scenicData);
        console.log('创建景点数据:', processedData);
        return api.post<SingleResponse<Scenic>>('/admin/scenics', processedData);
    },
    updateScenic: (id: number, scenicData: Partial<Scenic>) => {
        // 处理坐标数据确保正确传输
        const processedData = processScenicCoordinates(scenicData);
        console.log('更新景点数据:', processedData);
        return api.put<SingleResponse<Scenic>>(`/admin/scenics/${id}`, processedData);
    },
    deleteScenic: (id: number) => 
        api.delete<SingleResponse<{ success: boolean }>>(`/admin/scenics/${id}`),
    // 景点坐标统计
    getScenicSpotCoordinateStats: () => 
        api.get<SingleResponse<CoordinateStats>>('/admin/scenics-coordinate-stats'),

    // 酒店管理 (补全)
    getHotels: (params: HotelSearchParams = {}) => 
        api.get<PaginatedResponse<Hotel>>('/admin/hotels', { params }),
    getHotelById: (id: number) => 
        api.get<SingleResponse<Hotel>>(`/admin/hotels/${id}`),
    createHotel: (hotelData: Partial<Hotel>) => 
        api.post<SingleResponse<Hotel>>('/admin/hotels', hotelData),
    updateHotel: (id: number, hotelData: Partial<Hotel>) => 
        api.put<SingleResponse<Hotel>>(`/admin/hotels/${id}`, hotelData),
    deleteHotel: (id: number) => 
        api.delete<SingleResponse<{ success: boolean }>>(`/admin/hotels/${id}`),

    // 订单管理 (补全)
    getOrders: (params: OrderSearchParams = {}) => 
        api.get<PaginatedResponse<Booking>>('/admin/orders', { params }),
    getOrderById: (id: number) => 
        api.get<SingleResponse<Booking>>(`/admin/orders/${id}`),
    updateOrderStatus: (id: number, statusData: { status: BookingStatus, remarks?: string }) => 
        api.put<SingleResponse<Booking>>(`/admin/orders/${id}/status`, statusData),

    // 评论管理 (补全)
    getReviews: (params: ReviewSearchParams = {}) => 
        api.get<PaginatedResponse<Review>>('/admin/reviews', { params }),
    deleteReview: (id: number) => 
        api.delete<SingleResponse<{ success: boolean }>>(`/admin/reviews/${id}`),
    updateReviewStatus: (id: number, statusData: { status?: ReviewStatus, admin_reply?: string }) => 
        api.put<SingleResponse<Review>>(`/admin/reviews/${id}/status`, statusData),

    // 攻略管理 (补全)
    getStrategies: (params: StrategySearchParams = {}) => 
        api.get<PaginatedResponse<Strategy>>('/admin/strategies', { params }),
    getStrategyById: (id: number) => 
        api.get<SingleResponse<Strategy>>(`/admin/strategies/${id}`),
    createStrategy: (strategyData: Partial<Strategy>) => 
        api.post<SingleResponse<Strategy>>('/admin/strategies', strategyData),
    updateStrategy: (id: number, strategyData: Partial<Strategy>) => 
        api.put<SingleResponse<Strategy>>(`/admin/strategies/${id}`, strategyData),
    deleteStrategy: (id: number) => 
        api.delete<SingleResponse<{ success: boolean }>>(`/admin/strategies/${id}`),

    // ---> 新增图片上传 API 函数 < ---
    /**
     * 上传单个图片文件到服务器文件系统
     * @param file 要上传的文件对象
     * @param onUploadProgress 可选的回调函数，用于跟踪上传进度
     * @returns Promise，包含成功信息和图片的相对路径 { success: boolean, message: string, path: string }
     */
    uploadImageFs: async (file: File | Blob, onUploadProgress?: (progressEvent: any) => void): Promise<{ success: boolean; message: string; path: string }> => {
        const formData = new FormData();
        // 'image' 必须与后端 multer.single('image') 的字段名匹配
        formData.append('image', file);

        try {
            // 使用配置好的 axios 实例 (api) 发送 POST 请求
            // 注意 URL 是 /admin/upload/image-fs
            const response = await api.post('/admin/upload/image-fs', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: onUploadProgress, // 传递进度回调
            });
            // 假设后端成功时返回 { success: true, message: '...', path: '...' }
            return response.data;
        } catch (error: any) {
            console.error('图片上传 API 调用失败:', error);
            // 抛出或处理错误，确保包含后端返回的错误信息（如果可用）
            throw new Error(error.response?.data?.message || error.message || '图片上传失败');
        }
    },
};

/**
 * 处理景点数据，确保坐标信息正确格式化
 * @param scenicData 景点数据
 * @returns 处理后的数据
 */
function processScenicCoordinates(scenicData: Partial<Scenic>): Partial<Scenic> {
  const processedData = { ...scenicData };
  
  // 如果提供了经纬度但没有提供location，则构建location
  if (processedData.longitude !== undefined && processedData.latitude !== undefined && !processedData.location) {
    processedData.location = [processedData.longitude, processedData.latitude];
  }
  
  // 如果提供了location但没有经纬度，则提取经纬度
  if (processedData.location && Array.isArray(processedData.location)) {
    if (processedData.longitude === undefined) {
      processedData.longitude = processedData.location[0];
    }
    if (processedData.latitude === undefined) {
      processedData.latitude = processedData.location[1];
    }
  }
  
  return processedData;
}

export default adminAPI;