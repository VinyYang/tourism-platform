import { User } from './user'; // 引入 User 类型

/**
 * 通用搜索参数接口
 * 可根据需要扩展 page, limit, sortBy, sortOrder 等
 */
export interface BaseSearchParams {
    page?: number;
    limit?: number; // 将 pageSize 重命名为 limit
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    // 可以根据需要添加其他通用参数
}

/**
 * 旅游攻略相关类型定义
 */

// --- Core Types ---

// 攻略状态 (与后端模型一致)
export type StrategyStatus = 'draft' | 'published';
// 攻略类型 (改为 Enum)
export enum StrategyType {
    ARTICLE = 'article',
    TRAVEL_NOTE = 'travel_note',
    // 如果之前有其他类型定义如 CITY_GUIDE 等，需要确认是否保留或映射
    // 为了修复当前错误，暂时只包含后端模型存在的类型
}

// 攻略基本信息接口 (与后端模型字段对应)
export interface Strategy {
    // 支持两种ID命名风格
    strategy_id?: number; // 后端数据库风格
    id?: number;         // 前端友好风格
    
    // 支持两种用户ID命名风格
    user_id?: number;    // 后端数据库风格
    userId?: number;     // 前端友好风格
    
    title: string;
    summary?: string; // 添加攻略摘要字段
    content: string;
    city: string; // 目的地/城市
    
    // 支持两种图片字段命名
    cover_image?: string; // 后端风格
    coverImage?: string;  // 前端风格
    
    // 标签支持字符串或数组格式
    tags?: string | string[]; // 可以是逗号分隔的字符串或者数组
    
    // 统计数据兼容两种命名
    view_count?: number; // 后端风格
    viewCount?: number;  // 前端风格
    like_count?: number; // 后端风格
    likeCount?: number;  // 前端风格
    
    type?: StrategyType; // 类型
    status?: StrategyStatus; // 状态，与后端模型一致
    
    // 时间字段兼容两种命名
    created_at?: string; // 后端风格
    createdAt?: string;  // 前端风格
    updated_at?: string; // 后端风格
    updatedAt?: string;  // 前端风格
    
    // 关联的作者信息
    author?: Pick<User, 'user_id' | 'username' | 'avatar'> | {
        id: number;
        username: string;
        avatar: string;
    };
    
    // 兼容直接作者字段
    authorName?: string;
    authorAvatar?: string;
    
    // 附加信息 (可能由 API 添加，如 getStrategyDetail)
    favoriteCount?: number; // 收藏数 (后端模型没有，但 API 可能计算)
    commentCount?: number; // 评论数 (后端模型没有，但 API 可能计算)
    isLiked?: boolean; // 当前用户是否点赞
    isFavorite?: boolean; // 当前用户是否收藏
}

// 攻略评论接口 (与后端 Review 模型及关联数据对应)
export interface StrategyComment {
    review_id: number; // 使用 review_id
    id?: number;       // 兼容前端风格的id
    user_id: number;
    item_id: number; // strategy_id
    item_type: 'strategy';
    rating: number;
    content: string;
    status: 'pending' | 'approved' | 'rejected'; // 假设的评论状态
    admin_reply?: string;
    created_at: string;
    updated_at?: string;
    author: Pick<User, 'user_id' | 'username' | 'avatar'>; // 评论的作者
}

// 攻略详情接口 (继承 Strategy，并添加详情字段)
export interface StrategyDetail extends Strategy {
    relatedScenics?: RelatedScenic[]; // 如果 API 返回 (取消注释)
    comments?: StrategyComment[]; // 如果 API 返回
    images?: string[] | string; // 添加图片数组属性
    backendId?: number; // 添加后端ID属性
    destination?: string; // 目的地，与city字段含义相似
    views?: number; // 查看次数，与view_count字段含义相似
    likes?: number; // 点赞数，与like_count字段含义相似
    favorites?: number; // 收藏数
    // relatedStrategies?: Strategy[]; // 如果 API 返回
}

// --- Helper Types (用于API参数或特殊场景) ---

// 标签/城市类型定义 (用于 getTags/getCities API 返回)
export interface Label {
    id?: number | string; // ID 可能不是数字
    name: string;
}

// 攻略搜索参数 (用于 getStrategies API)
export interface StrategySearchParams extends BaseSearchParams { // 继承 BaseSearchParams
    keyword?: string;
    userId?: number;
    city?: string; // 使用 city
    status?: StrategyStatus;
    tag?: string; // 单个标签筛选
    type?: StrategyType;
    // 移除 sortBy，使用 BaseSearchParams 中的 sortBy/sortOrder
}

// 攻略列表 API 响应结构 (与后端实际返回一致)
export interface StrategySearchResponse {
    strategies: Strategy[]; // 攻略列表
    items: Strategy[];      // 兼容字段
    total: number;          // 总数
    currentPage: number;    // 当前页
    totalPages: number;      // 总页数
    // 移除旧结构
    // success: boolean;
    // data: Strategy[];
    // meta: {
    //     total: number;
    //     page: number;
    //     limit: number; 
    // };
    // message?: string;
}

// 攻略每天行程接口
export interface StrategyDay {
    day: number;
    title?: string;
    description?: string;
    places?: StrategyPlace[];
    meals?: string;
    tips?: string;
    lodging?: string;
}

// 攻略地点接口
export interface StrategyPlace {
    id?: number;
    name: string;
    type?: 'scenic' | 'restaurant' | 'hotel' | 'shopping' | 'other';
    description?: string;
    images?: string[] | string;
    time_spent?: string; // 建议游玩时间
    cost?: number; // 预计花费
    tips?: string; // 小贴士
    address?: string;
    opening_hours?: string; // 开放时间
}

// 攻略列表查询参数
export interface StrategyFilter {
    keyword?: string;
    destination?: string;
    season?: string;
    travel_with?: string;
    days_min?: number;
    days_max?: number;
    budget?: string;
    tags?: string;
    user_id?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    pageSize?: number;
}

// 添加相关的景点基础接口 (根据需要扩展)
export interface RelatedScenic {
    id: number;
    name: string;
    coverImage?: string;
    city?: string; // 添加城市字段，与 StrategyDetail.tsx 中使用一致
    location?: string; // 添加 location 字段
    price?: number; // 添加 price 字段
    distance?: string; // 添加 distance 字段
    // 根据需要添加其他景点信息字段
} 