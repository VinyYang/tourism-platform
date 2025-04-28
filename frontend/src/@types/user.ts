/**
 * 用户相关类型定义
 */

// 用户角色枚举
export type UserRole = 'user' | 'advisor' | 'admin';

// 用户状态枚举 (与后端模型一致)
export type UserStatus = 'active' | 'muted';

// 用户基本信息接口
export interface User {
    user_id: number;
    username: string;
    email: string;
    role: UserRole;
    status?: UserStatus; // 添加 status 字段
    avatar?: string;
    phone?: string;
    created_at?: string;
    updated_at?: string;
}

// 用户详情信息接口，扩展基本信息
export interface UserDetail extends User {
    preferences?: UserPreference;
    bookings?: any[]; // 用户的预订列表
    reviews?: any[]; // 用户的评论列表
    favorites?: any[]; // 用户的收藏列表
}

// 用户偏好设置接口
export interface UserPreference {
    id?: number;
    user_id?: number;
    preferred_cities?: string | string[]; // 偏好城市
    travel_styles?: string | string[]; // 旅行风格
    budget_range?: string; // 预算范围
    notification_enabled?: boolean; // 是否启用通知
    theme?: string; // UI主题
}

// 用户注册请求数据
export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    confirm_password: string;
    phone?: string;
}

// 用户登录请求数据
export interface LoginRequest {
    username: string;
    password: string;
    remember?: boolean;
}

// 用户登录响应数据
export interface AuthResponse {
    token: string;
    user: User;
}

// 用户列表筛选条件
export interface UserFilter {
    keyword?: string;
    role?: UserRole;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    pageSize?: number;
} 