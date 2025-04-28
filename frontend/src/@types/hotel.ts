/**
 * 酒店相关类型定义
 */

// 酒店地理位置接口
export interface HotelLocation {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    province?: string;
    country?: string;
    zip_code?: string;
}

// 酒店政策接口
export interface HotelPolicies {
    checkIn?: string;
    checkOut?: string;
    cancellation?: string;
    children?: string;
    pets?: string;
    extraBed?: string;
    payment?: string[];
}

// 酒店房间接口
export interface HotelRoom {
    id?: number;
    hotel_id?: number;
    name?: string;
    type?: string; // 兼容name/type两种字段名
    description?: string;
    price?: number;
    discount_price?: number;
    capacity?: number;
    maxOccupancy?: number; // 兼容capacity/maxOccupancy两种字段名
    beds?: string;
    size?: string;
    images?: string[] | string;
    facilities?: string[] | string;
    amenities?: string[] | string; // 兼容facilities/amenities两种字段名
    remaining?: number;
    breakfast_included?: boolean;
}

// 酒店评论接口
export interface HotelReview {
    id?: number;
    hotel_id?: number;
    user_id?: number;
    username?: string;
    userName?: string; // 兼容username/userName两种字段名
    avatar?: string;
    rating?: number;
    score?: number; // 兼容rating/score两种字段名
    content?: string;
    comment?: string; // 兼容content/comment两种字段名
    visit_date?: string;
    visit_type?: string;
    createdAt?: string;
    created_at?: string; // 兼容createdAt/created_at两种字段名
    admin_reply?: string;
}

// 酒店基本信息接口
export interface Hotel {
    id: number;
    hotel_id?: number; // 兼容可能的不同字段名
    name: string;
    stars: number;
    city: string;
    address: string;
    description?: string;
    images: string[] | string; // 支持数组或逗号分隔的字符串
    cover_image?: string;
    price: number; // 起始价格
    price_range?: string;
    rating?: number;
    score?: number; // 兼容rating字段
    facilities?: string[] | string;
    amenities?: string[] | string; // 兼容facilities字段
    location?: string | HotelLocation; // 支持字符串地址或位置对象
    policies?: HotelPolicies;
    tags?: string[] | string;
    distance_from_center?: number; // 距离市中心距离(km)
    created_at?: string;
    updated_at?: string;
}

// 酒店详情接口，扩展基本信息
export interface HotelDetail extends Hotel {
    rooms?: HotelRoom[];
    reviews?: HotelReview[];
    nearby_scenics?: any[]; // 附近景点
    services?: string[] | string;
}

// 酒店列表查询参数
export interface HotelFilter {
    keyword?: string;
    city?: string;
    stars?: number;
    priceMin?: number;
    priceMax?: number;
    amenities?: string[] | string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    pageSize?: number;
}

// 酒店搜索响应
export interface HotelSearchResponse {
    success: boolean;
    data: {
        items?: Hotel[];
        hotels?: Hotel[];
        total?: number;
        page?: number;
        pageSize?: number;
    };
    message?: string;
} 