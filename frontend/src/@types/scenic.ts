/**
 * 景点相关类型定义
 */

// 景点基本信息接口
export interface Scenic {
    id: number;
    scenic_id?: number; // 兼容后端可能使用的不同命名
    name: string;
    city: string;
    address: string;
    description?: string;
    ticket_price: number;
    open_time?: string;
    images: string[] | string; // 支持数组或逗号分隔的字符串
    cover_image?: string;
    label?: string[] | string; // 标签
    features?: string;
    hot_score?: number;
    rating?: number;
    score?: number; // 兼容rating字段
    created_at?: string;
    updated_at?: string;
    // 添加位置相关字段
    location?: [number, number] | null; // [longitude, latitude] 格式的位置坐标
    longitude?: number; // 经度
    latitude?: number; // 纬度
    coordinates?: {
        longitude: number;
        latitude: number;
    };
}

// 景点详情接口，扩展基本信息
export interface ScenicDetail extends Scenic {
    reviews?: ScenicReview[];
    nearby?: Scenic[];
    transportation?: string;
    tips?: string;
    facilities?: string[] | string;
    best_season?: string;
    visit_duration?: string;
}

// 景点评论接口
export interface ScenicReview {
    id: number;
    scenic_id: number;
    user_id: number;
    username?: string;
    avatar?: string;
    rating: number;
    content: string;
    images?: string[] | string;
    created_at: string;
    updated_at?: string;
}

// 景点列表查询参数
export interface ScenicFilter {
    keyword?: string;
    city?: string;
    minPrice?: number;
    maxPrice?: number;
    label?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    pageSize?: number;
}

// 景点搜索响应
export interface ScenicSearchResponse {
    success: boolean;
    data: {
        items?: Scenic[];
        scenics?: Scenic[];
        total?: number;
        page?: number;
        pageSize?: number;
    };
    message?: string;
} 