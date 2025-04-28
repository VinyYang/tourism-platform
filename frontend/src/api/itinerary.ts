import api from './config';
import axios from 'axios';
import { message } from 'antd';
// Import dependent types
import { ScenicItem } from './scenic'; 
import { Hotel } from './hotel';
import { Transport } from './transport';

// 行程天数的项目
// 确保此接口只包含 dayNumber 和必需的 items
export interface ItineraryDay {
    dayNumber: number;
    items: ItineraryItem[];
}

// 定义 API 返回的单天结构（如果与前端不同）
// 确认 ApiItineraryDay 结构是否与清理后的 ItineraryDay 一致
export interface ApiItineraryDay {
    dayNumber: number;
    items: ItineraryItem[];
}

// 行程项目（景点、酒店、交通、活动/自定义）
export interface ItineraryItem {
    id: number;
    itemId: number | string;
    itemType: 'scenic' | 'hotel' | 'transport' | 'activity' | 'custom';
    name: string;
    image?: string;
    location?: string;
    startTime?: string;
    endTime?: string;
    notes?: string;
    order: number;
    scenic_id?: number;
    hotel_id?: number;
    transport_id?: number;
    day_number?: number;
    Scenic?: ScenicItem | null;
    Hotel?: Hotel | null;
    Transport?: Transport | null;
    price?: number | string | null;
}

// 行程计划 (Aligning more with backend CustomizedItinerary + structure)
export interface Itinerary {
    id: number;
    userId?: number;
    title: string;
    description?: string;
    city?: string;
    startDate: string | null;
    endDate: string | null;
    cover?: string;
    customUrl?: string;  // 添加自定义URL字段
    isPublic: boolean;
    status?: 'draft' | 'published';
    estimatedBudget?: number | null;
    createdAt?: string;
    updatedAt?: string;
    items?: ItineraryItem[];
    daysList?: ApiItineraryDay[];
}

// 行程搜索参数
export interface ItinerarySearchParams {
    keyword?: string;
    page?: number;
    pageSize?: number;
    sortBy?: 'newest' | 'popularity';
    userId?: number;   // 按用户ID筛选
    isPublic?: boolean; // 是否只看公开的
    region?: string;    // 按文化区域筛选
    isCultural?: boolean; // 是否只查询文化路线类型的行程
}

// 行程搜索响应
export interface ItinerarySearchResponse {
    itineraries: Itinerary[];
    total: number;
    currentPage: number;
    totalPages: number;
}

// ItineraryAPI接口定义
export interface ItineraryAPI {
    getItineraries: (params: ItinerarySearchParams) => Promise<ItinerarySearchResponse>;
    getItineraryDetail: (id: number) => Promise<Itinerary>;
    getItineraryByCustomUrl: (customUrl: string) => Promise<Itinerary>;
    createItinerary: (data: Partial<Itinerary> & { daysList?: ApiItineraryDay[] }) => Promise<Itinerary>;
    updateItinerary: (id: number, data: Partial<Itinerary> & { daysList?: ApiItineraryDay[] }) => Promise<Itinerary>;
    deleteItinerary: (id: number) => Promise<{ success: boolean }>;
    addItemToDay: (itineraryId: number, itemData: any) => Promise<ItineraryItem>;
    updateItineraryItem: (itineraryId: number, itemId: number, data: Partial<ItineraryItem>) => Promise<ItineraryItem>;
    deleteItineraryItem: (itineraryId: number, itemId: number) => Promise<{ success: boolean }>;
    reorderItems: (itineraryId: number, dayNumber: number, itemsOrder: { item_id: number; order_number: number }[]) => Promise<ItineraryItem[]>;
    moveItemToDay: (itineraryId: number, sourceDayId: number, targetDayId: number, itemId: number, newOrder: number) => Promise<{ sourceDay: ItineraryDay; targetDay: ItineraryDay }>;
    cloneItinerary: (id: number) => Promise<Itinerary>;
    shareItinerary: (id: number) => Promise<{ shareUrl: string }>;
    exportItineraryToPdf: (id: number) => Promise<Blob>;
    exportItineraryToImage: (id: number) => Promise<Blob>;
}

// 行程API接口
const itineraryAPI: ItineraryAPI = {
    // 获取行程列表
    getItineraries: async (params: ItinerarySearchParams): Promise<ItinerarySearchResponse> => {
        try {
            const response = await api.get('/itineraries', { params });
            return response.data;
        } catch (error) {
            console.error('获取行程列表失败:', error);
            throw error;
        }
    },

    // 获取行程详情
    getItineraryDetail: async (id: number): Promise<Itinerary> => {
        console.log(`开始请求行程详情: ID=${id}`);
        try {
            const response = await api.get(`/itineraries/${id}`);
            console.log(`成功获取行程详情: ID=${id}`, response.data);
            return response.data;
        } catch (error) {
            console.error(`获取行程详情失败: ID=${id}`, error);
            
            // 详细错误处理
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                const errorData = error.response?.data;
                
                // 根据不同状态码提供详细日志
                if (status === 401) {
                    console.error('认证失败: 用户未登录或令牌已过期');
                    message.error('请先登录再查看行程详情');
                } else if (status === 403) {
                    console.error('权限错误: 无权访问该行程');
                    message.error('您没有权限查看此行程');
                } else if (status === 404) {
                    console.error('资源不存在: 行程未找到');
                    message.error('请求的行程不存在');
                } else if (status === 500) {
                    console.error('服务器错误:', errorData);
                    message.error('服务器处理请求时出错，请稍后重试');
                }
                
                // 详细日志记录
                console.error('错误响应详情:', {
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data,
                    config: {
                        url: error.config?.url,
                        method: error.config?.method,
                        headers: error.config?.headers
                    }
                });
            }
            
            throw error;
        }
    },

    // 创建行程
    createItinerary: async (data: Partial<Itinerary> & { daysList?: ApiItineraryDay[] }): Promise<Itinerary> => {
        try {
            // 确保字段名映射正确
            const payload = {
                title: data.title || '未命名行程',
                description: data.description, // 前端notes -> 后端description
                city: data.city,             // 前端destination -> 后端city  
                startDate: data.startDate,
                endDate: data.endDate,
                estimatedBudget: data.estimatedBudget, // 前端budget -> 后端estimatedBudget
                isPublic: data.isPublic ?? false,
                status: data.status || 'draft',
                daysList: data.daysList?.map(day => ({
                    dayNumber: day.dayNumber,
                    items: day.items.map(item => {
                        // Checklist item 5: Ensure return type allows partial fields
                        const itemPayload: Partial<ItineraryItem> = {
                            // Checklist item 3: Remove id field for creation
                            // id: isNaN(Number(item.id)) ? 0 : Number(item.id),
                            itemType: item.itemType,
                            name: item.name || '未命名项目',
                            image: item.image || '',
                            location: item.location || '',
                            startTime: item.startTime || '',
                            endTime: item.endTime || '',
                            notes: item.notes || '',
                            order: item.order || 0,
                        };

                        // Checklist item 4: Conditionally include itemId
                        if (item.itemType !== 'custom') {
                            const numericItemId = Number(item.itemId);
                            if (!isNaN(numericItemId)) {
                                itemPayload.itemId = numericItemId;
                            } else {
                                // Optional: Log a warning if a non-custom item has an invalid itemId
                                console.warn(`Invalid or missing itemId for non-custom item:`, item);
                                // Depending on backend, might need to send null instead of omitting
                                // itemPayload.itemId = null;
                            }
                        }
                        // Else (item.itemType === 'custom'), itemId is omitted

                        return itemPayload;
                    })
                })) || [], // 确保daysList不为undefined
            };
            
            // 移除undefined值但保留空数组
            Object.keys(payload).forEach(key => {
                const typedKey = key as keyof typeof payload;
                if (payload[typedKey] === undefined) {
                    delete payload[typedKey];
                }
            });

            // 确保日期字段有效
            if (payload.startDate === undefined || payload.startDate === null) {
                delete payload.startDate;
            }
            if (payload.endDate === undefined || payload.endDate === null) {
                delete payload.endDate;
            }

            console.log('发送到后端的行程数据:', JSON.stringify(payload, null, 2));
            const response = await api.post<Itinerary>('/itineraries', payload);
            return response.data;
        } catch (error) {
            console.error('创建行程失败:', error);
            if (axios.isAxiosError(error) && error.response) {
                const errorData = error.response.data;
                const errorMessage = typeof errorData === 'string' ? errorData : (errorData?.message || error.message);
                console.error('后端响应错误:', errorData);
                message.error(`创建行程失败: ${errorMessage}`);
            } else if (error instanceof Error) {
                message.error(`创建行程失败: ${error.message}`);
            } else {
                message.error('创建行程失败: 未知错误');
            }
            throw error;
        }
    },

    // 更新行程
    updateItinerary: async (id: number, data: Partial<Itinerary> & { daysList?: ApiItineraryDay[] }): Promise<Itinerary> => {
        try {
            const payload = {
                title: data.title,
                description: data.description,
                city: data.city,
                startDate: data.startDate,
                endDate: data.endDate,
                estimatedBudget: data.estimatedBudget,
                isPublic: data.isPublic,
                status: data.status,
                daysList: data.daysList?.map(day => ({
                    dayNumber: day.dayNumber,
                    items: day.items.map(item => ({
                        id: item.id,
                        itemId: item.itemId,
                        itemType: item.itemType,
                        name: item.name,
                        image: item.image,
                        location: item.location,
                        startTime: item.startTime,
                        endTime: item.endTime,
                        notes: item.notes,
                        order: item.order,
                    }))
                })),
            };
            Object.keys(payload).forEach(key => {
                const typedKey = key as keyof typeof payload;
                if (payload[typedKey] === undefined) {
                    delete payload[typedKey];
                }
            });
            
            const response = await api.put<Itinerary>(`/itineraries/${id}`, payload);
            return response.data;
        } catch (error) {
            console.error('更新行程失败:', error);
            throw error;
        }
    },

    // 删除行程
    deleteItinerary: async (id: number): Promise<{ success: boolean }> => {
        try {
            const response = await api.delete(`/itineraries/${id}`);
            return response.data;
        } catch (error) {
            console.error('删除行程失败:', error);
            throw error;
        }
    },

    // 添加行程项
    addItemToDay: async (
        itineraryId: number, 
        itemData: any
    ): Promise<ItineraryItem> => {
        try {
            const response = await api.post(
                `/itineraries/${itineraryId}/items`, 
                itemData
            );
            return response.data;
        } catch (error) {
            console.error('添加行程项失败:', error);
            throw error;
        }
    },

    // 更新行程项目
    updateItineraryItem: async (
        itineraryId: number,
        itemId: number,
        data: Partial<ItineraryItem>
    ): Promise<ItineraryItem> => {
        try {
            const response = await api.put(
                `/itineraries/${itineraryId}/items/${itemId}`,
                data
            );
            return response.data;
        } catch (error) {
            console.error('更新行程项目失败:', error);
            throw error;
        }
    },

    // 删除行程项目
    deleteItineraryItem: async (
        itineraryId: number,
        itemId: number
    ): Promise<{ success: boolean }> => {
        try {
            const response = await api.delete(
                `/itineraries/${itineraryId}/items/${itemId}`
            );
            return response.data;
        } catch (error) {
            console.error('删除行程项目失败:', error);
            throw error;
        }
    },

    // 调整行程项目顺序
    reorderItems: async (
        itineraryId: number,
        dayNumber: number,
        itemsOrder: { item_id: number; order_number: number }[]
    ): Promise<ItineraryItem[]> => {
        try {
            const response = await api.post(
                `/itineraries/${itineraryId}/days/${dayNumber}/reorder`,
                { items: itemsOrder }
            );
            return response.data;
        } catch (error) {
            console.error('调整行程项目顺序失败:', error);
            throw error;
        }
    },

    // 把项目从一天移动到另一天
    moveItemToDay: async (
        itineraryId: number,
        sourceDayId: number,
        targetDayId: number,
        itemId: number,
        newOrder: number
    ): Promise<{ sourceDay: ItineraryDay; targetDay: ItineraryDay }> => {
        try {
            const response = await api.post(
                `/itineraries/${itineraryId}/move-item`,
                {
                    sourceDayId,
                    targetDayId,
                    itemId,
                    newOrder
                }
            );
            return response.data;
        } catch (error) {
            console.error('移动行程项目失败:', error);
            throw error;
        }
    },

    // 复制行程
    cloneItinerary: async (id: number): Promise<Itinerary> => {
        try {
            const response = await api.post(`/itineraries/${id}/clone`);
            return response.data;
        } catch (error) {
            console.error('复制行程失败:', error);
            throw error;
        }
    },

    // 分享行程
    shareItinerary: async (id: number): Promise<{ shareUrl: string }> => {
        try {
            const response = await api.post(`/itineraries/${id}/share`);
            return response.data;
        } catch (error) {
            console.error('分享行程失败:', error);
            throw error;
        }
    },

    // 导出行程为PDF
    exportItineraryToPdf: async (id: number): Promise<Blob> => {
        try {
            const response = await api.get(`/itineraries/${id}/export/pdf`, {
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            console.error('导出行程为PDF失败:', error);
            throw error;
        }
    },

    // 导出行程为图片
    exportItineraryToImage: async (id: number): Promise<Blob> => {
        try {
            const response = await api.get(`/itineraries/${id}/export/image`, {
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            console.error('导出行程为图片失败:', error);
            throw error;
        }
    },

    // 通过自定义URL获取行程
    getItineraryByCustomUrl: async (customUrl: string): Promise<Itinerary> => {
        console.log(`开始请求自定义URL行程: URL=${customUrl}`);
        try {
            const response = await api.get(`/itineraries/custom/${customUrl}`);
            console.log(`成功获取自定义URL行程: URL=${customUrl}`, response.data);
            return response.data;
        } catch (error) {
            console.error(`通过自定义URL获取行程失败: URL=${customUrl}`, error);
            
            // 详细错误处理
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                const errorData = error.response?.data;
                
                // 根据不同状态码提供详细日志
                if (status === 401) {
                    console.error('认证失败: 用户未登录或令牌已过期');
                    message.error('请先登录再查看行程详情');
                } else if (status === 403) {
                    console.error('权限错误: 无权访问该行程');
                    message.error('您没有权限查看此行程');
                } else if (status === 404) {
                    console.error('资源不存在: 自定义URL行程未找到');
                    message.error('请求的行程不存在');
                } else if (status === 500) {
                    console.error('服务器错误:', errorData);
                    message.error('服务器处理请求时出错，请稍后重试');
                }
            }
            
            throw error;
        }
    }
};

export default itineraryAPI; 