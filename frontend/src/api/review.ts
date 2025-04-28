import api from './config';
import { ReviewQueryParams, ReviewCreatePayload, Review, PaginatedResponse } from '../@types/review'; // 假设 review 类型定义在 @types/review.ts
import { User } from '../@types/user'; // 需要 User 类型定义

// 前端评论接口，与后端 Review 模型对应
// 注意：这里的类型需要与 @types/review.ts 中定义的保持一致
export interface FrontendReview extends Omit<Review, 'user' | 'author'> { // 排除可能冲突的字段
    id: number; // 确保有 id
    author: Pick<User, 'user_id' | 'username' | 'avatar'> | null;
    createdAt: string; // 统一为 string
}

interface ReviewAPI {
    getReviewsForItem: (
        itemType: 'strategy' | 'scenic' | 'hotel',
        itemId: number,
        params?: ReviewQueryParams
    ) => Promise<PaginatedResponse<FrontendReview>>; // 返回前端适配的评论类型

    createReview: (
        payload: ReviewCreatePayload
    ) => Promise<{ success: boolean; message?: string; data?: FrontendReview }>; // 返回前端适配的评论类型

    // 添加删除评论的方法
    deleteReview: (
        reviewId: number | undefined
    ) => Promise<{ success: boolean; message?: string }>;
}

const reviewAPI: ReviewAPI = {
    // 获取指定项目（攻略、景点、酒店）的评论列表
    getReviewsForItem: async (itemType, itemId, params) => {
        try {
            // 调整 API 端点以匹配后端路由结构
            // 例如: /api/v1/strategies/:id/comments, /api/v1/scenics/:id/reviews, /api/v1/hotels/:id/reviews
            let endpoint = '';
            if (itemType === 'strategy') {
                endpoint = `/strategies/${itemId}/comments`;
            } else if (itemType === 'scenic') {
                endpoint = `/scenics/${itemId}/reviews`; // 确认后端路由
            } else if (itemType === 'hotel') {
                endpoint = `/hotels/${itemId}/reviews`; // 确认后端路由
            } else {
                throw new Error('Invalid item type for reviews');
            }

            const response = await api.get(endpoint, { params });
            // 假设后端直接返回分页结构 { reviews: [], total: number, page: number, totalPages: number }
            // 需要根据后端实际返回结构调整数据转换
            const backendData = response.data;
            return {
                success: true,
                data: backendData.reviews.map((review: any) => {
                    // 确保id和review_id都存在
                    const reviewId = review.review_id || review.id;
                    return {
                        id: reviewId, // 确保id字段存在
                        review_id: reviewId, // 确保review_id字段存在
                        content: review.content,
                        rating: review.rating,
                        createdAt: review.created_at || review.date, // 兼容不同日期字段
                        author: review.author || {
                            user_id: review.user_id || review.userId,
                            username: review.username || review.userName,
                            avatar: review.avatar
                        }, // 处理可能的 author 结构差异
                        // 其他需要的字段...
                        item_id: review.item_id,
                        item_type: review.item_type,
                        user_id: review.user_id,
                        status: review.status,
                        admin_reply: review.admin_reply,
                        updated_at: review.updated_at
                    };
                }),
                meta: {
                    total: backendData.total || 0,
                    page: backendData.page || params?.page || 1,
                    pageSize: backendData.pageSize || params?.pageSize || 10, // 需要后端返回 pageSize 或从请求获取
                    totalPages: backendData.totalPages || Math.ceil((backendData.total || 0) / (params?.pageSize || 10)),
                }
            };
        } catch (error: any) {
            console.error(`获取 ${itemType} ${itemId} 评论失败:`, error);
            return {
                success: false,
                message: error.response?.data?.message || `加载评论失败 (${itemType} ${itemId})`,
                data: [],
                meta: { total: 0, page: params?.page || 1, pageSize: params?.pageSize || 10, totalPages: 0 }
            };
        }
    },

    // 创建评论
    createReview: async (payload): Promise<{ success: boolean; message?: string; data?: FrontendReview }> => {
        try {
            // 调整 API 端点以匹配后端路由结构
            let endpoint = '';
            if (payload.item_type === 'strategy') {
                endpoint = `/strategies/${payload.item_id}/comments`;
            } else if (payload.item_type === 'scenic') {
                endpoint = `/scenics/${payload.item_id}/reviews`; // 确认后端路由
            } else if (payload.item_type === 'hotel') {
                endpoint = `/hotels/${payload.item_id}/reviews`; // 确认后端路由
            } else {
                throw new Error('Invalid item type for review creation');
            }

            const response = await api.post(endpoint, payload);
            const newReviewData = response.data; // 假设后端返回的数据结构接近 Review

            // 构造符合 FrontendReview 类型的 data 对象
            const formattedData: FrontendReview = {
                // 字段来自 Review 接口 (通过 Omit 继承)
                review_id: newReviewData.review_id || newReviewData.id, // 必须有 review_id
                user_id: newReviewData.user_id,
                item_type: newReviewData.item_type,
                item_id: newReviewData.item_id,
                strategy_id: newReviewData.strategy_id,
                scenic_id: newReviewData.scenic_id,
                hotel_id: newReviewData.hotel_id,
                rating: newReviewData.rating,
                content: newReviewData.content,
                status: newReviewData.status || 'pending', // 提供默认状态
                admin_reply: newReviewData.admin_reply,
                created_at: newReviewData.created_at || newReviewData.date || new Date().toISOString(), // 必须有 created_at
                updated_at: newReviewData.updated_at,
                // 字段是 FrontendReview 特有的
                id: newReviewData.review_id || newReviewData.id, // id 字段
                author: newReviewData.author || null, // author 字段
                createdAt: newReviewData.created_at || newReviewData.date || new Date().toISOString(), // createdAt 字段
            };

            return {
                success: true,
                message: '评论已提交', 
                data: formattedData // 返回符合 FrontendReview 的对象
            };
        } catch (error: any) {
            console.error('创建评论失败:', error);
            return {
                success: false,
                message: error.response?.data?.message || '评论提交失败'
                // data 字段保持 undefined
            };
        }
    },

    // 删除评论
    deleteReview: async (reviewId: number | undefined): Promise<{ success: boolean; message?: string }> => {
        try {
            // 确保ID有效
            if (!reviewId) {
                console.error('删除评论失败: 评论ID无效', reviewId);
                return {
                    success: false,
                    message: '评论ID无效，无法删除'
                };
            }
            
            // 记录日志，方便调试
            console.log('准备删除评论，ID:', reviewId);
            
            // 由于目前后端没有普通用户删除评论的专门端点，暂时使用管理员删除评论的端点
            // 注意：在实际生产环境中应该使用专门的用户删除评论接口，后端需要验证评论所有权
            const response = await api.delete(`/admin/reviews/${reviewId}`);
            
            return {
                success: response.data.success,
                message: response.data.message || '评论已成功删除'
            };
        } catch (error: any) {
            console.error('删除评论失败:', error);
            return {
                success: false,
                message: error.response?.data?.message || '删除评论失败'
            };
        }
    },
};

export default reviewAPI; 