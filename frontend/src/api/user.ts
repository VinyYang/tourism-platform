import axios from 'axios';

// 设置基础URL，明确指向3001端口的后端服务
// 如果.env文件中有配置值则使用配置值，否则使用默认值
const API_PORT = process.env.REACT_APP_API_PORT || '3001';
const BASE_URL = process.env.REACT_APP_API_URL || `http://localhost:${API_PORT}/api/v1`;

// 用户资料接口
export interface UserProfileData {
    username: string;
    email: string;
    avatar?: string;
    phone?: string;
    bio?: string;
}

// 修改密码参数接口
export interface PasswordChangeData {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

// 订单查询参数接口
export interface OrderQueryParams {
    page?: number;
    limit?: number;
    status?: 'pending' | 'processing' | 'confirmed' | 'completed' | 'cancelled' | 'refunding' | 'refunded';
    startDate?: string;
    endDate?: string;
}

// 收藏项目接口
export interface FavoriteItemData {
    itemId: number;
    type: 'scenic' | 'hotel' | 'strategy';
}

// 新增：收藏查询参数接口
export interface FavoriteQueryParams {
    page?: number;
    pageSize?: number;
}

// 评价接口
export interface ReviewData {
    itemId: number;
    itemType: string;
    rating: number;
    content: string;
}

// 分享数据接口
export interface ShareData {
    title: string;
    description: string;
    link: string;
    token: string;
    expiresAt: string;
}

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

// 响应拦截器 - 处理常见错误
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // 未授权错误处理
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// 用户相关API
export const userAPI = {
    // 获取用户资料 (使用认证路由 /auth/me)
    getProfile: () => api.get('/auth/me'),
    
    // 更新用户资料 (使用用户路由下的 /me)
    updateProfile: (userData: UserProfileData) => api.put('/users/me', userData),
    
    // 修改密码 (使用用户路由下的 /password, 方法为 PUT)
    updatePassword: (passwordData: PasswordChangeData) => api.put('/users/password', passwordData),
    
    // 获取订单列表
    getOrders: (params: OrderQueryParams) => api.get('/users/orders', { params }),
    
    // 取消订单 (使用 PUT 方法)
    cancelOrder: (orderId: number | string) => api.put(`/users/orders/${orderId}/cancel`),
    
    // 分享订单 (新添加)
    shareOrder: (orderId: number | string) => api.get(`/users/orders/${orderId}/share`),
    
    // 获取收藏列表 (修改为接受参数)
    getFavorites: (params?: FavoriteQueryParams) => api.get('/users/favorites', { params }),
    
    // 添加收藏
    addFavorite: (item: FavoriteItemData) => api.post('/users/favorites', item),
    
    // 删除收藏
    removeFavorite: (favoriteId: number | string) => api.delete(`/users/favorites/${favoriteId}`),

    // 获取用户评论列表
    getReviews: () => api.get('/users/reviews'),

    // 添加评价
    addReview: (review: ReviewData) => api.post('/users/reviews', review),
    
    // --- 新增：保存用户文化基因 --- 
    saveCulturalDna: (dnaTags: string[]) => api.put('/users/me/cultural-dna', { dnaTags }),
    // --- 结束新增 ---
};

export default userAPI; 