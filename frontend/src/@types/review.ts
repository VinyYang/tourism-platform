import { User } from './user';

// 定义评论状态类型
export type ReviewStatus = 'pending' | 'approved' | 'rejected';

// 评论基础接口 (对应后端 Review 模型字段)
export interface Review {
    review_id: number;
    user_id: number;
    item_type: 'strategy' | 'scenic' | 'hotel';
    // 根据 item_type 确定关联的 ID
    item_id: number; // 通用 ID 字段，具体含义由 item_type 决定
    strategy_id?: number; // 可选，如果 item_type 是 'strategy'
    scenic_id?: number; // 可选，如果 item_type 是 'scenic'
    hotel_id?: number; // 可选，如果 item_type 是 'hotel'
    rating: number;
    content: string;
    status: ReviewStatus;
    admin_reply?: string | null;
    created_at: string;
    updated_at?: string;
    // 关联的作者信息 (可能来自 include)
    author?: Pick<User, 'user_id' | 'username' | 'avatar'>;
    // 后台管理可能需要的关联用户信息
    user?: Pick<User, 'user_id' | 'username' | 'email' | 'role' | 'status'>;
    // 后台管理可能需要的关联项目信息
    // scenic?: { scenic_id: number; name: string };
    // hotel?: { hotel_id: number; name: string };
    // strategy?: { strategy_id: number; title: string };
}

// 获取评论列表的查询参数接口
export interface ReviewQueryParams {
    page?: number;
    pageSize?: number;
    userId?: number;
    itemType?: 'strategy' | 'scenic' | 'hotel';
    itemId?: number;
    status?: ReviewStatus;
    minRating?: number;
    maxRating?: number;
    sortBy?: string; // 例如 'created_at', 'rating'
    sortOrder?: 'asc' | 'desc';
}

// 创建评论的 Payload 接口
export interface ReviewCreatePayload {
    item_type: 'strategy' | 'scenic' | 'hotel';
    item_id: number;
    content: string;
    rating: number;
    // user_id 通常从认证信息中获取，不需要前端传递
}

// 更新评论状态的 Payload 接口 (后台管理用)
export interface ReviewUpdateStatusPayload {
    status: ReviewStatus;
    admin_reply?: string;
}

// 分页响应接口
export interface PaginatedResponse<T> {
    success: boolean;
    message?: string;
    data: T[];
    meta: {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    };
} 