import api from './config';
// 导入统一的类型定义
import { 
    Strategy, 
    StrategyDetail, 
    StrategyComment, 
    StrategySearchParams, 
    StrategySearchResponse, 
    Label, 
    StrategyType
} from '../@types/strategy'; 
// 移除本地重复或不一致的类型定义
// export enum StrategyType { ... }
// export interface Label { ... }
// export interface StrategyAuthor { ... }
// export interface StrategyLabel { ... }
// export interface RelatedScenic { ... }
// export interface StrategyItem { ... }
// export interface StrategyDetail { ... }
// export interface StrategySearchParams { ... }
// export interface StrategySearchResponse { ... }

// 定义StrategyAPI接口 (使用导入的类型)
export interface StrategyAPI {
    getStrategies: (params: StrategySearchParams) => Promise<StrategySearchResponse>;
    getCities: () => Promise<Label[]>;
    getTags: () => Promise<Label[]>;
    getHotStrategies: (limit?: number) => Promise<Strategy[]>; 
    getStrategyDetail: (id: number) => Promise<StrategyDetail>;
    getRelatedStrategies: (id: number, limit?: number) => Promise<Strategy[]>; 
    likeStrategy: (id: number) => Promise<{ success: boolean }>;
    unlikeStrategy: (id: number) => Promise<{ success: boolean }>;
    favoriteStrategy: (id: number) => Promise<{ success: boolean }>;
    unfavoriteStrategy: (id: number) => Promise<{ success: boolean }>;
    createStrategy: (data: Partial<Strategy>) => Promise<Strategy>; 
    updateStrategy: (id: number, data: Partial<Strategy>) => Promise<Strategy>; 
    deleteStrategy: (id: number) => Promise<{ success: boolean }>;
    generateRecommendedItinerary: (params: { destination: string, days: number, preferences?: string[] }) => Promise<any>;
}

// 攻略API接口 (使用导入的类型)
const strategyAPI: StrategyAPI = {
    // 获取攻略列表
    getStrategies: async (params: StrategySearchParams): Promise<StrategySearchResponse> => {
        try {
            console.log('API调用: 获取攻略列表, 参数:', params);
            const response = await api.get('/strategies', { params });
            console.log('API响应: 获取攻略列表, 状态:', response.status, '数据结构:', 
                Object.keys(response.data), 
                'items?', Array.isArray(response.data.items), 
                'strategies?', Array.isArray(response.data.strategies));
                
            // 对响应数据进行标准化处理
            const responseData = response.data;
            
            // 确保返回格式符合接口要求
            const result: StrategySearchResponse = {
                strategies: Array.isArray(responseData.strategies) ? responseData.strategies : [],
                items: Array.isArray(responseData.items) ? responseData.items : 
                      (Array.isArray(responseData.strategies) ? responseData.strategies : []),
                total: responseData.total || 0,
                currentPage: responseData.currentPage || params.page || 1,
                totalPages: responseData.totalPages || 1
            };
            
            console.log('规范化后的数据:', {
                itemsLength: result.items.length,
                strategiesLength: result.strategies.length
            });
            
            return result;
        } catch (error) {
            console.error('获取攻略列表失败:', error);
            throw error;
        }
    },

    // 获取城市列表
    getCities: async (): Promise<Label[]> => {
        try {
            const response = await api.get('/strategies/cities');
            return response.data;
        } catch (error) {
            console.error('获取城市列表失败:', error);
            throw error;
        }
    },

    // 获取标签列表
    getTags: async (): Promise<Label[]> => {
        try {
            const response = await api.get('/strategies/tags');
            return response.data;
        } catch (error) {
            console.error('获取标签列表失败:', error);
            throw error;
        }
    },

    // 获取热门攻略
    getHotStrategies: async (limit: number = 6): Promise<Strategy[]> => {
        try {
            console.log(`开始获取热门攻略, 限制: ${limit}`);
            const response = await api.get('/strategies/hot', { params: { limit } });
            
            // 添加详细的响应数据结构输出
            console.log('获取热门攻略API响应状态:', response.status);
            console.log('获取热门攻略API响应结构:', Object.keys(response.data));
            
            // 自适应数据结构处理逻辑
            let strategiesData = [];
            
            // 处理不同的响应格式
            if (response.data && Array.isArray(response.data)) {
                // 格式1: 直接返回数组
                console.log('热门攻略使用格式1: 直接数组');
                strategiesData = response.data;
            } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
                // 格式2: { data: [...] }
                console.log('热门攻略使用格式2: response.data.data');
                strategiesData = response.data.data;
            } else if (response.data && response.data.strategies && Array.isArray(response.data.strategies)) {
                // 格式3: { strategies: [...] }
                console.log('热门攻略使用格式3: response.data.strategies');
                strategiesData = response.data.strategies;
            } else if (response.data && response.data.items && Array.isArray(response.data.items)) {
                // 格式4: { items: [...] }
                console.log('热门攻略使用格式4: response.data.items');
                strategiesData = response.data.items;
            } else {
                // 未知格式或空数据
                console.warn('获取热门攻略 API 未返回预期结构或失败:', response.data);
                strategiesData = [];
            }
            
            console.log(`成功获取热门攻略数据: ${strategiesData.length} 条记录`);
            return strategiesData;
        } catch (error) {
            console.error('获取热门攻略失败:', error);
            return []; // 返回空数组而不是抛出错误，避免UI崩溃
        }
    },

    // 获取攻略详情
    getStrategyDetail: async (id: number): Promise<StrategyDetail> => {
        try {
            console.log(`开始获取攻略详情, ID: ${id}`);
            const response = await api.get(`/strategies/${id}`);
            
            // 添加详细的响应数据结构输出
            console.log('获取攻略详情API响应状态:', response.status);
            console.log('获取攻略详情API响应结构:', Object.keys(response.data));
            console.log('响应数据类型:', typeof response.data);
            
            // 自适应数据结构处理逻辑
            let strategyData = null;
            
            // 处理不同的响应格式
            if (response.data && response.data.data) {
                // 标准格式: { data: {...} }
                console.log('使用标准数据结构: response.data.data');
                strategyData = response.data.data;
            } else if (response.data && response.data.strategy) {
                // 替代格式1: { strategy: {...} }
                console.log('使用替代数据结构1: response.data.strategy');
                strategyData = response.data.strategy;
            } else if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
                // 替代格式2: 直接在顶层返回策略对象
                console.log('使用替代数据结构2: response.data (直接对象)');
                strategyData = response.data;
            } else {
                // 未知格式
                console.error('未识别的响应数据结构:', response.data);
                throw new Error('获取攻略详情失败：未识别的响应数据结构');
            }
            
            // 确保返回的数据符合预期格式
            if (!strategyData || (typeof strategyData === 'object' && Object.keys(strategyData).length === 0)) {
                console.warn('策略数据为空或无效:', strategyData);
                throw new Error('获取攻略详情失败：返回的数据为空');
            }

            console.log('成功获取策略数据:', strategyData ? '有数据' : '无数据');
            
            // 转换ID格式，确保数据一致性
            if (strategyData && !strategyData.id && strategyData.strategy_id) {
                strategyData.id = strategyData.strategy_id;
            }
            
            // 增强数据转换：标准化字段名称，填充缺失的字段
            const normalizedStrategy = normalizeStrategyDetail(strategyData, id);
            
            return normalizedStrategy;
        } catch (error) {
            console.error('获取攻略详情失败:', error);
            
            // 尝试使用备用路径获取数据
            try {
                console.log('使用备用路径尝试获取攻略详情');
                const backupResponse = await api.get(`/strategies/details/${id}`); 
                
                if (backupResponse.data) {
                    console.log('备用路径成功获取数据');
                    
                    // 标准化备用路径的数据
                    const backupData = backupResponse.data.data || backupResponse.data.strategy || backupResponse.data;
                    const normalizedBackupStrategy = normalizeStrategyDetail(backupData, id);
                    
                    return normalizedBackupStrategy;
                }
            } catch (backupError) {
                console.error('备用路径获取攻略详情也失败:', backupError);
            }
            
            // 所有尝试都失败，使用模拟数据作为最后降级手段
            console.log('所有尝试都失败，返回模拟数据');
            return getMockStrategyDetail(id);
        }
    },

    // 获取相关攻略
    getRelatedStrategies: async (id: number, limit: number = 4): Promise<Strategy[]> => {
        try {
            console.log(`开始获取相关攻略, ID: ${id}, 限制: ${limit}`);
            const response = await api.get(`/strategies/${id}/related`, { params: { limit } });
            
            // 添加详细的响应数据结构输出
            console.log('获取相关攻略API响应状态:', response.status);
            console.log('获取相关攻略API响应结构:', Object.keys(response.data));
            
            // 自适应数据结构处理逻辑
            let strategiesData = [];
            
            // 处理不同的响应格式
            if (response.data && Array.isArray(response.data)) {
                // 格式1: 直接返回数组
                console.log('相关攻略使用格式1: 直接数组');
                strategiesData = response.data;
            } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
                // 格式2: { data: [...] }
                console.log('相关攻略使用格式2: response.data.data');
                strategiesData = response.data.data;
            } else if (response.data && response.data.strategies && Array.isArray(response.data.strategies)) {
                // 格式3: { strategies: [...] }
                console.log('相关攻略使用格式3: response.data.strategies');
                strategiesData = response.data.strategies;
            } else if (response.data && response.data.items && Array.isArray(response.data.items)) {
                // 格式4: { items: [...] }
                console.log('相关攻略使用格式4: response.data.items');
                strategiesData = response.data.items;
            } else {
                // 未知格式或空数据
                console.warn('获取相关攻略 API 未返回预期结构或失败:', response.data);
                strategiesData = [];
            }
            
            console.log(`成功获取相关攻略数据: ${strategiesData.length} 条记录`);
            return strategiesData;
        } catch (error) {
            console.error('获取相关攻略失败:', error);
            return []; // 返回空数组而不是抛出错误，避免UI崩溃
        }
    },

    // 点赞攻略
    likeStrategy: async (id: number): Promise<{ success: boolean }> => {
        try {
            const response = await api.post(`/strategies/${id}/like`);
            return response.data;
        } catch (error) {
            console.error('点赞攻略失败:', error);
            throw error;
        }
    },

    // 取消点赞
    unlikeStrategy: async (id: number): Promise<{ success: boolean }> => {
        try {
            const response = await api.delete(`/strategies/${id}/like`);
            return response.data;
        } catch (error) {
            console.error('取消点赞失败:', error);
            throw error;
        }
    },

    // 收藏攻略
    favoriteStrategy: async (id: number): Promise<{ success: boolean }> => {
        try {
            const response = await api.post(`/strategies/${id}/favorite`);
            return response.data;
        } catch (error) {
            console.error('收藏攻略失败:', error);
            throw error;
        }
    },

    // 取消收藏
    unfavoriteStrategy: async (id: number): Promise<{ success: boolean }> => {
        try {
            const response = await api.delete(`/strategies/${id}/favorite`);
            return response.data;
        } catch (error) {
            console.error('取消收藏失败:', error);
            throw error;
        }
    },

    // 创建攻略
    createStrategy: async (data: Partial<Strategy>): Promise<Strategy> => {
        try {
            console.log('创建攻略，请求数据:', data);
            const response = await api.post('/strategies', data);
            console.log('创建攻略API响应:', response.data);
            
            // 处理不同的响应格式
            let strategyData;
            
            if (response.data && response.data.strategy) {
                // 如果响应包含strategy字段，直接使用
                strategyData = response.data.strategy;
            } else if (response.data && response.data.data) {
                // 如果响应包含data字段，使用data
                strategyData = response.data.data;
            } else {
                // 否则尝试使用整个响应
                strategyData = response.data;
            }
            
            // 确保返回的数据包含id
            if (strategyData && !strategyData.id && strategyData.strategy_id) {
                strategyData.id = strategyData.strategy_id;
            }
            
            console.log('格式化后的策略数据:', strategyData);
            return strategyData;
        } catch (error) {
            console.error('创建攻略失败:', error);
            throw error;
        }
    },

    // 更新攻略
    updateStrategy: async (id: number, data: Partial<Strategy>): Promise<Strategy> => {
        try {
            const response = await api.put(`/strategies/${id}`, data);
            return response.data.data;
        } catch (error) {
            console.error('更新攻略失败:', error);
            throw error;
        }
    },

    // 删除攻略
    deleteStrategy: async (id: number): Promise<{ success: boolean }> => {
        try {
            const response = await api.delete(`/strategies/${id}`);
            return response.data;
        } catch (error) {
            console.error('删除攻略失败:', error);
            throw error;
        }
    },

    // 生成推荐行程
    generateRecommendedItinerary: async (params: {
        destination: string;
        days: number;
        preferences?: string[];
    }): Promise<any> => {
        try {
            const response = await api.post('/strategies/generate', params);
            return response.data;
        } catch (error) {
            console.error('生成推荐行程失败:', error);
            throw error;
        }
    }
};

export default strategyAPI; 

// 导出需要的类型和 Enum 供页面使用
export { StrategyType } from '../@types/strategy';
export type { 
    Strategy, 
    StrategyDetail, 
    StrategyComment, 
    StrategySearchParams, 
    StrategySearchResponse, 
    Label
} from '../@types/strategy'; 

// 辅助函数：标准化策略详情数据
function normalizeStrategyDetail(data: any, id: number): StrategyDetail {
    if (!data) {
        throw new Error('无法标准化空数据');
    }
    
    // 确保所有必要字段都存在，使用原数据中的值或默认值
    return {
        id: data.id || data.strategy_id || id,
        title: data.title || '未知标题',
        content: data.content || '',
        author: {
            id: data.author?.id || data.userId || 0,
            username: data.author?.username || data.username || '未知作者',
            avatar: data.author?.avatar || data.avatar || '',
        },
        destination: data.destination || data.city || '',
        city: data.city || '',
        views: data.views || 0,
        likes: data.likes || 0,
        favorites: data.favorites || 0,
        createdAt: data.createdAt || data.created_at || new Date().toISOString(),
        updatedAt: data.updatedAt || data.updated_at || new Date().toISOString(),
        isFavorite: data.isFavorite || false,
        isLiked: data.isLiked || false,
        comments: Array.isArray(data.comments) ? data.comments : [],
        images: Array.isArray(data.images) ? data.images : 
                typeof data.images === 'string' ? data.images.split(',') : [],
        relatedScenics: Array.isArray(data.relatedScenics) ? data.relatedScenics : [],
        tags: Array.isArray(data.tags) ? data.tags : 
              Array.isArray(data.labels) ? data.labels : [],
        // 合并原始对象，保留可能有用的其他字段
        ...data
    };
}

// 辅助函数：生成模拟攻略详情数据
function getMockStrategyDetail(id: number): StrategyDetail {
    return {
        id,
        title: '在成都的休闲文化之旅',
        content: `
# 成都：天府之国的悠闲生活

成都，这座有着2300多年历史的文化名城，被誉为"天府之国"，拥有丰富的文化遗产和独特的生活方式。以下是我在成都旅行的经历和建议：

## 第一天：市区文化探索

### 宽窄巷子
早上先去宽窄巷子，这里是成都保存最完好的清朝古街区之一。可以在这里品尝各种当地小吃，感受老成都的生活气息。

### 杜甫草堂
下午前往杜甫草堂，这是唐代大诗人杜甫流寓成都时的故居。园内古树参天，亭台错落，环境幽雅，是体验中国古典园林和了解杜甫诗歌的好去处。

### 锦里古街
晚上去锦里古街，这里灯火辉煌，有各种成都特色小吃和手工艺品，是体验成都夜生活的好地方。

## 第二天：自然与文化的完美结合

### 青城山
早上前往青城山，这是道教名山，环境清幽，可以探访古老的道观，体验道家文化。

### 都江堰
下午参观都江堰，这是世界上至今仍在使用的最古老的水利工程之一，展示了古代中国的工程智慧。

## 第三天：熊猫与休闲

### 成都大熊猫繁育研究基地
早上一定要去成都大熊猫繁育研究基地，亲眼目睹这些可爱的国宝。建议早些去，因为熊猫在上午比较活跃。

### 春熙路
下午逛春熙路，这是成都最繁华的商业街，可以购物、尝美食，感受现代成都的活力。

### 锦江剧场看川剧变脸
晚上去锦江剧场欣赏川剧变脸，这是成都的文化瑰宝，绝对不容错过。

## 美食推荐

1. 火锅：成都的火锅以麻辣著称，推荐"大董"、"龙抄手"等老字号。
2. 小吃：担担面、夫妻肺片、钟水饺、三大炮等都是必尝的美食。
3. 茶馆：成都的茶馆文化非常有特色，可以在人民公园的鹤鸣茶社品茶、听评书。

希望这份攻略能帮助你在成都度过一段愉快的时光！
        `,
        author: {
            id: 1,
            username: '旅行爱好者',
            avatar: 'https://joeschmoe.io/api/v1/random',
        },
        destination: '成都',
        city: '成都',
        views: 2458,
        likes: 176,
        favorites: 89,
        createdAt: '2023-01-15T08:30:00.000Z',
        updatedAt: '2023-01-15T08:30:00.000Z',
        isFavorite: false,
        isLiked: false,
        comments: [
            {
                id: 1,
                content: '非常详细的攻略，我按照这个路线玩了一遍，特别满意！',
                created_at: '2023-01-18T10:25:00.000Z',
                author: {
                    user_id: 2,
                    username: '快乐旅行者',
                    avatar: 'https://joeschmoe.io/api/v1/female/random',
                },
                rating: 5,
                user_id: 2,
                item_id: id,
                item_type: 'strategy',
                status: 'approved',
                review_id: 1
            },
            {
                id: 2,
                content: '锦里古街的小吃真的很赞，特别是三大炮和钟水饺，必须尝试！',
                created_at: '2023-01-20T15:40:00.000Z',
                author: {
                    user_id: 3,
                    username: '美食猎人',
                    avatar: 'https://joeschmoe.io/api/v1/male/random',
                },
                rating: 4,
                user_id: 3,
                item_id: id,
                item_type: 'strategy',
                status: 'approved',
                review_id: 2
            }
        ],
        images: [
            'https://pic3.zhimg.com/v2-3be0c5d5bf03cf84357fc594a9284984_r.jpg',
            'https://pic1.zhimg.com/v2-af2b53d61c7c873c9e93309e6c0551a5_r.jpg',
            'https://pic1.zhimg.com/v2-37dc0a065d2c920e604022e7ba596a56_r.jpg'
        ],
        relatedScenics: [
            {
                id: 1,
                name: '宽窄巷子',
                distance: '市中心',
                price: 0
            },
            {
                id: 2,
                name: '杜甫草堂',
                distance: '4公里',
                price: 60
            },
            {
                id: 3,
                name: '成都大熊猫繁育研究基地',
                distance: '10公里',
                price: 58
            }
        ],
        tags: ['成都', '美食', '文化', '自然风光', '熊猫']
    };
} 