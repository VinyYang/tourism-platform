import axios from 'axios';
// import culturalAPI from './cultural'; // 移除导入
// import type { RegionData as ImportedRegionData } from './cultural'; // 移除导入

// --- 添加枚举定义 ---
// 仅保留价值等级枚举
enum CulturalValueLevel {
    NATIONAL = 'national',
    PROVINCIAL = 'provincial',
    MUNICIPAL = 'municipal',
    GENERAL = 'general'
}
// --- 结束添加枚举定义 ---

// 设置基础URL，明确指向3001端口的后端服务
// 如果.env文件中有配置值则使用配置值，否则使用默认值
const API_PORT = process.env.REACT_APP_API_PORT || '3001';
const BASE_URL = process.env.REACT_APP_API_URL || `http://localhost:${API_PORT}/api/v1`;

// 打印API配置信息，帮助诊断问题
console.log('景点API配置信息:');
console.log(`API_PORT: ${API_PORT}`);
console.log(`BASE_URL: ${BASE_URL}`);
console.log('- 环境变量REACT_APP_API_URL:', process.env.REACT_APP_API_URL || '未设置');
console.log('- 环境变量REACT_APP_API_PORT:', process.env.REACT_APP_API_PORT || '未设置');

// 创建axios实例
const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000, // 增加超时时间到15秒
    withCredentials: false, // 确保跨域请求不发送凭证
});

// 添加请求拦截器
api.interceptors.request.use(
    (config) => {
        console.log('发送请求:', config.method?.toUpperCase(), config.url);
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error('请求错误:', error);
        return Promise.reject(error);
    }
);

// 添加响应拦截器
api.interceptors.response.use(
    (response) => {
        console.log('API响应成功:', response.config.url, response.status);
        // 检查响应数据格式
        if (response.data && typeof response.data === 'object') {
            return response;
        } else {
            console.warn('API响应数据格式异常:', response.config.url, response.data);
            // 格式化响应以符合前端预期
            const formattedResponse = {
                ...response,
                data: {
                    items: [],
                    total: 0,
                    message: '服务器返回数据格式异常'
                }
            };
            return formattedResponse;
        }
    },
    async (error) => {
        const originalRequest = error.config;
        console.error('API响应错误:', originalRequest?.url, error.message);
        
        // 如果是网络错误且未重试过
        if (error.message.includes('Network Error') && !originalRequest._retry) {
            originalRequest._retry = true;
            console.log('检测到网络错误，尝试切换端口...');
            
            // 尝试切换端口
            const currentPort = originalRequest.baseURL?.includes('3000') ? '3000' : '3001';
            const newPort = currentPort === '3000' ? '3001' : '3000';
            const newBaseURL = `http://localhost:${newPort}/api/v1`;
            
            console.log(`尝试切换到端口 ${newPort}`);
            
            try {
                // 测试新端口是否可用
                await axios.get(`${newBaseURL}/health`);
                
                // 更新baseURL并重试请求
                api.defaults.baseURL = newBaseURL;
                console.log(`成功切换到端口 ${newPort}, 重试请求`);
                return api(originalRequest);
            } catch (retryError) {
                console.error('备用端口也无法访问:', retryError);
                // 返回格式化的错误响应，确保前端可以正确处理
                return Promise.resolve({
                    data: {
                        items: [],
                        total: 0,
                        message: '无法连接到服务器，请检查网络连接'
                    }
                });
            }
        }
        
        // 格式化通用错误响应
        if (error.response) {
            console.error('服务器响应错误:', error.response.status, error.response.data);
            // 尝试从错误响应中提取有用信息
            const errorMessage = error.response.data?.message || `服务器错误 (${error.response.status})`;
            return Promise.resolve({
                data: {
                    items: [],
                    total: 0,
                    message: errorMessage
                }
            });
        }
        
        // 超时或其他错误
        return Promise.resolve({
            data: {
                items: [],
                total: 0,
                message: error.message || '请求失败，请稍后重试'
            }
        });
    }
);

export interface ScenicItem {
    id: number;
    name: string;
    city: string;
    address: string;
    description: string;
    openTime: string;
    ticketPrice: number;
    images: string[] | string; // 可能是字符串数组或逗号分隔的字符串
    label: string | string[]; // 修改为支持字符串或字符串数组
    hotScore: number;
    // 添加后端可能返回的字段
    scenic_id?: number; // 后端可能使用scenic_id
    open_time?: string; // 后端可能使用open_time
    ticket_price?: number; // 后端可能使用ticket_price
    hot_score?: number; // 后端可能使用hot_score
    cover_image?: string; // 后端可能使用cover_image
    coverImage?: string;
    price?: number;
    score?: number;
    rating?: number; // 添加rating字段
    labels?: string[] | string; // 修改为支持字符串或字符串数组

    // 添加文化旅游相关字段
    culturalDescription?: string;
}

export interface ScenicDetail extends ScenicItem {
    coverImage: string;
    price?: number;
    features: string[];
    nearbySpots: {
        id: number;
        name: string;
        distance: string;
    }[];
    reviews: {
        id: number;
        userId: number;
        username: string;
        avatar?: string;
        content: string;
        rating: number;
        createdAt: string;
    }[];
    adcode?: string;
}

export interface ScenicSearchParams {
    city?: string;
    keyword?: string;
    label?: string;
    priceRange?: [number, number];
    page?: number;
    pageSize?: number;
    limit?: number;
    sortBy?: 'price' | 'popularity' | 'rating';
    sortOrder?: 'asc' | 'desc';
    province?: string;
    district?: string;
    adcode?: string;
    timeAxis?: string; // 时间轴: prehistoric, ancient, modern, contemporary
    region?: string;   // 地域文化: guangfu, jiangnan, bashu, guandong, xiyu
    culturalForm?: string; // 文化形态: material, intangible
    secondaryThemes?: string; // 特色标签 (逗号分隔): red_culture,religious_culture,...
}

export interface ScenicSearchResponse {
    items: ScenicItem[];
    total: number;
    page: number;
    pageSize: number;
    message?: string; // 添加message字段，后端可能包含此字段
}

// --- 添加接口定义 ---
// 使用从cultural.ts导入的RegionData，不再需要重复定义
// 地域文化分类选项接口
export interface ScenicRegionOption {
    value: string;
    label: string;
    icon?: string; // 后端返回图标名称字符串
    description?: string;
}

// --- 结束添加接口定义 ---

// 添加API响应格式的接口定义
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

// 景点API
const scenicAPI = {
    // 获取景点列表
    getScenics: async (params: ScenicSearchParams = {}) => {
        const startTime = Date.now();
        console.log('开始请求景点列表, 参数:', params);
        
        // 尝试使用各种端口的顺序
        const ports = ['', '3001', '3000'];
        let lastError = null;
        let responseData = null;
        
        // 尝试使用不同端口依次请求
        for (const port of ports) {
            try {
                let apiToUse = api;
                // 如果指定了特定端口，创建新的axios实例
                if (port) {
                    console.log(`尝试直接使用端口 ${port}`);
                    apiToUse = axios.create({
                        baseURL: `http://localhost:${port}/api/v1`,
                        headers: { 'Content-Type': 'application/json' },
                        timeout: 10000,
                        withCredentials: false,
                    });
                }
                
                const response = await apiToUse.get('/scenics', { params });
                
                // 检查响应是否有效
                if (response && response.data) {
                    responseData = response.data;
                    console.log(`成功从端口 ${port || '默认'} 获取数据`);
                    break; // 成功获取数据，跳出循环
                }
            } catch (error: any) {
                console.warn(`尝试使用端口 ${port || '默认'} 失败:`, error.message);
                lastError = error;
                // 继续尝试下一个端口
            }
        }
        
        // 如果所有端口都失败，尝试使用模拟数据
        if (!responseData) {
            console.warn('所有API请求尝试都失败，使用模拟数据');
            if (lastError) {
                console.error('最后一次错误:', lastError);
            }
            
            // 返回模拟数据作为降级方案
            return {
                data: {
                    items: getMockScenicData(),
                    total: 10,
                    message: '使用模拟数据 (API请求失败)'
                }
            };
        }
        
        console.log('API响应时间:', Date.now() - startTime, 'ms');
        console.log('响应数据结构:', Object.keys(responseData));
        
        // 统一处理各种可能的响应格式
        let items: ScenicItem[] = [];
        let total = 0;
        
        // 尝试处理各种可能的数据结构
        if (Array.isArray(responseData)) {
            // 格式1: 直接返回数组
            console.log('使用数据格式1: 直接数组');
            items = responseData;
            total = responseData.length;
        } else if (responseData.data && Array.isArray(responseData.data)) {
            // 格式2: { data: [...] }
            console.log('使用数据格式2: data数组');
            items = responseData.data;
            total = responseData.total || responseData.data.length;
        } else if (responseData.scenics && Array.isArray(responseData.scenics)) {
            // 格式3: { scenics: [...] }
            console.log('使用数据格式3: scenics数组');
            items = responseData.scenics;
            total = responseData.total || responseData.scenics.length;
        } else if (responseData.items && Array.isArray(responseData.items)) {
            // 格式4: { items: [...] }
            console.log('使用数据格式4: items数组');
            items = responseData.items;
            total = responseData.total || responseData.items.length;
        } else {
            // 未知格式
            console.warn('未知的数据格式:', responseData);
            // 降级为空数据
            items = [];
            total = 0;
        }
        
        // 标准化数据字段
        const normalizedItems = items.map(item => normalizeScenic(item));
        
        // 构造标准格式的响应
        return {
            data: {
                items: normalizedItems,
                total,
                message: responseData.message || ''
            }
        };
    },
    
    // 获取所有景点（用于价格分析）
    getAllScenics: async () => {
        try {
            // 返回 AxiosResponse<ScenicSearchResponse>
            return await api.get<ScenicSearchResponse>('/scenics', { 
                params: { 
                    pageSize: 1000,
                    sortBy: 'price'
                } 
            });
        } catch (error) {
            console.error('获取所有景点数据失败', error);
            const directAPI = axios.create({
                baseURL: 'http://localhost:3001/api/v1',
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            });
            // 返回 AxiosResponse<ScenicSearchResponse>
            return await directAPI.get<ScenicSearchResponse>('/scenics', { 
                params: { 
                    pageSize: 1000,
                    sortBy: 'price'
                } 
            });
        }
    },
    
    // 获取景点详情
    getScenicDetail: async (id: number | string) => {
        try {
            // 返回 AxiosResponse<ApiResponse<ScenicDetail> | ScenicDetail>
            return await api.get<ApiResponse<ScenicDetail> | ScenicDetail>(`/scenics/${id}`);
        } catch (error) {
            console.error('获取景点详情失败，尝试直接访问3001端口', error);
            const directAPI = axios.create({
                baseURL: 'http://localhost:3001/api/v1',
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            });
            // 返回 AxiosResponse<ApiResponse<ScenicDetail> | ScenicDetail>
            return await directAPI.get<ApiResponse<ScenicDetail> | ScenicDetail>(`/scenics/${id}`);
        }
    },
    
    // 获取热门景点
    getHotScenics: async (limit: number = 6) => {
        try {
            // 返回 AxiosResponse<{items: ScenicItem[]}>
            return await api.get<{items: ScenicItem[]}>('/scenics/hot', { params: { limit } });
        } catch (error) {
            console.error('获取热门景点失败，尝试直接访问3001端口', error);
            const directAPI = axios.create({
                baseURL: 'http://localhost:3001/api/v1',
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            });
            // 返回 AxiosResponse<{items: ScenicItem[]}>
            return await directAPI.get<{items: ScenicItem[]}>('/scenics/hot', { params: { limit } });
        }
    },
    
    // 获取城市列表
    getCities: async () => {
        try {
            // 获取标准化的城市列表（后端已处理）
            const response = await api.get('/scenics/cities');
            
            // 检查响应结构
            if (Array.isArray(response.data)) {
                // 如果后端直接返回数组
                return {
                    data: {
                        items: response.data,
                        total: response.data.length
                    }
                };
            } else {
                // 如果后端返回对象结构
                return response;
            }
        } catch (error) {
            console.error('获取城市列表失败，尝试直接访问3001端口', error);
            try {
                const directAPI = axios.create({
                    baseURL: 'http://localhost:3001/api/v1',
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 10000
                });
                
                // 获取后备数据
                const fallbackResponse = await directAPI.get('/scenics/cities');
                
                // 检查响应结构
                if (Array.isArray(fallbackResponse.data)) {
                    // 后端直接返回数组的情况
                    return {
                        data: {
                            items: fallbackResponse.data,
                            total: fallbackResponse.data.length
                        }
                    };
                } else {
                    // 后端返回对象结构的情况
                    return fallbackResponse;
                }
            } catch (fallbackError) {
                console.error('备用端口获取城市列表也失败', fallbackError);
                // 返回一个空结果以避免前端崩溃
                return {
                    data: {
                        items: [],
                        total: 0,
                        message: '无法获取城市列表'
                    }
                };
            }
        }
    },
    
    // 获取标签列表
    getLabels: async () => {
        try {
            // 返回 AxiosResponse<{items: string[]}>
            return await api.get<{items: string[]}>('/scenics/labels');
        } catch (error) {
            console.error('获取标签列表失败，尝试直接访问3001端口', error);
            const directAPI = axios.create({
                baseURL: 'http://localhost:3001/api/v1',
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            });
            // 返回 AxiosResponse<{items: string[]}>
            return await directAPI.get<{items: string[]}>('/scenics/labels');
        }
    },

    // 新增：获取景点地域文化分类
    getScenicCulturalRegions: async (): Promise<ScenicRegionOption[]> => {
        try {
            // 返回 AxiosResponse<{items: ScenicRegionOption[]}>
            const response = await api.get<{items: ScenicRegionOption[]}>('/scenics/cultural-regions');
            return response.data.items; // 直接返回地域文化选项数组
        } catch (error) {
            console.error('获取景点地域文化分类失败，尝试直接访问3001端口', error);
            const directAPI = axios.create({
                baseURL: 'http://localhost:3001/api/v1',
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            });
            // 返回 AxiosResponse<{items: ScenicRegionOption[]}>
            const response = await directAPI.get<{items: ScenicRegionOption[]}>('/scenics/cultural-regions');
            return response.data.items; // 直接返回地域文化选项数组
        }
    },

    // 提交景点评价
    submitReview: async (scenicId: number | string, reviewData: { rating: number; content: string }) => {
        try {
            // 返回 AxiosResponse<any> (假设后端返回成功信息)
            return await api.post(`/scenics/${scenicId}/reviews`, reviewData);
        } catch (error) {
            console.error('提交景点评价失败', error);
            throw error; // 重新抛出错误，让调用者处理
        }
    },
    
    // 添加景点到收藏
    addFavorite: (scenicId: number | string) => 
        api.post('/users/favorites', { itemType: 'scenic', scenicId }),
    
    // 从收藏中移除景点
    removeFavorite: (favoriteId: number | string) => 
        api.delete(`/users/favorites/${favoriteId}`),

    // 搜索景点
    searchScenics: async (params: ScenicSearchParams = {}) => {
        try {
            // 构建查询参数，包含行政区划参数
            const queryParams: Record<string, any> = {};
            
            if (params.keyword) queryParams.keyword = params.keyword;
            if (params.city) queryParams.city = params.city;
            if (params.province) queryParams.province = params.province;
            if (params.district) queryParams.district = params.district;
            if (params.adcode) queryParams.adcode = params.adcode;
            if (params.label) queryParams.label = params.label;
            if (params.page) queryParams.page = params.page;
            if (params.pageSize) queryParams.pageSize = params.pageSize;
            if (params.limit) queryParams.limit = params.limit;
            if (params.sortBy) queryParams.sortBy = params.sortBy;
            if (params.sortOrder) queryParams.sortOrder = params.sortOrder;
            
            if (params.priceRange && params.priceRange.length === 2) {
                queryParams.minPrice = params.priceRange[0];
                queryParams.maxPrice = params.priceRange[1];
            }
            
            const response = await api.get<ScenicSearchResponse>('/scenics/search', { params: queryParams });
            return response.data;
        } catch (error) {
            console.error('搜索景点失败:', error);
            return {
                items: [],
                total: 0,
                page: 1,
                pageSize: 10,
                message: error instanceof Error ? error.message : '未知错误'
            };
        }
    },

    // 获取筛选条件
    getScenicFilters: async () => {
        try {
            console.log('获取景点筛选条件');
            const response = await api.get('/scenic/filters');
            return response;
        } catch (error) {
            console.error('获取景点筛选条件失败:', error);
            return {
                data: {
                    success: false,
                    message: '获取筛选条件失败',
                    data: {
                        cities: [],
                        labels: [],
                        culturalValueLevels: [],
                        timeAxisOptions: [],
                        regionOptions: [],
                        culturalFormOptions: [],
                        secondaryThemes: []
                    }
                }
            };
        }
    },
};

export default scenicAPI;

// 重新导出枚举和接口，方便外部使用
export { CulturalValueLevel };
// 移除对 ImportedRegionData 的重新导出
// export type { ImportedRegionData as RegionData }; 

// 添加辅助函数：标准化景点数据字段
function normalizeScenic(item: any): ScenicItem {
    // 检查item是否为null或undefined
    if (!item) {
        console.warn('尝试标准化空的景点数据');
        return {
            id: 0,
            name: '未知景点',
            city: '',
            address: '',
            description: '',
            openTime: '',
            ticketPrice: 0,
            images: [],
            label: [],
            hotScore: 0
        };
    }
    
    // 更详细的日志，帮助调试
    console.log('正在标准化景点数据:', JSON.stringify(item));
    
    // 处理ID (确保总是有一个有效的ID)
    const id = item.id || item.scenic_id || Date.now();
    
    // 处理images字段 (确保总是返回一个数组)
    let images = [];
    if (item.images) {
        if (Array.isArray(item.images)) {
            images = item.images;
        } else if (typeof item.images === 'string') {
            try {
                // 尝试解析JSON字符串
                const parsed = JSON.parse(item.images);
                images = Array.isArray(parsed) ? parsed : [item.images];
            } catch (e) {
                // 不是JSON，假设是逗号分隔的字符串
                images = item.images.split(',').map((img: string) => img.trim());
            }
        }
    } else if (item.cover_image || item.coverImage) {
        // 如果没有images但有cover_image，将其作为单元素数组
        images = [item.cover_image || item.coverImage];
    }
    
    // 处理标签字段 (确保总是返回一个数组)
    let labels = [];
    if (item.labels) {
        if (Array.isArray(item.labels)) {
            labels = item.labels;
        } else if (typeof item.labels === 'string') {
            labels = item.labels.split(',').map((l: string) => l.trim());
        }
    } else if (item.label) {
        if (Array.isArray(item.label)) {
            labels = item.label;
        } else if (typeof item.label === 'string') {
            labels = item.label.split(',').map((l: string) => l.trim());
        }
    }
    
    // 构建标准化的景点对象
    return {
        id: id,
        name: item.name || '未知景点',
        city: item.city || '',
        address: item.address || '',
        description: item.description || '',
        openTime: item.openTime || item.open_time || '',
        ticketPrice: item.ticketPrice || item.ticket_price || item.price || 0,
        images: images,
        label: labels,
        hotScore: item.hotScore || item.hot_score || item.score || item.rating || 0,
        
        // 保留一些原始字段，方便引用
        scenic_id: item.scenic_id,
        open_time: item.open_time,
        ticket_price: item.ticket_price,
        hot_score: item.hot_score,
        cover_image: item.cover_image,
        coverImage: item.coverImage,
        price: item.price,
        score: item.score,
        rating: item.rating,
        labels: labels,
        
        culturalDescription: item.culturalDescription || ''
    };
}

// 添加辅助函数：获取模拟数据
function getMockScenicData(): ScenicItem[] {
    return [
        {
            id: 1,
            name: '故宫博物院',
            city: '北京',
            address: '北京市东城区景山前街4号',
            description: '中国明清两代的皇家宫殿，是世界上现存规模最大、保存最为完整的木质结构古建筑之一。',
            openTime: '8:30-17:00',
            ticketPrice: 60,
            images: ['https://pic3.zhimg.com/v2-dd2c604f8644487a47b67f559d427f34_r.jpg'],
            label: ['文化', '历史', '博物馆'],
            hotScore: 4.8
        },
        {
            id: 2,
            name: '颐和园',
            city: '北京',
            address: '北京市海淀区新建宫门路19号',
            description: '中国清朝时期的皇家园林，是保存最完整的一座皇家行宫御苑。',
            openTime: '6:30-18:00',
            ticketPrice: 30,
            images: ['https://youimg1.c-ctrip.com/target/100a0y000000m353xAA14.jpg'],
            label: ['园林', '历史', '自然风光'],
            hotScore: 4.7
        },
        {
            id: 3,
            name: '西湖',
            city: '杭州',
            address: '浙江省杭州市西湖区',
            description: '中国十大风景名胜之一，有"人间天堂"的美誉。',
            openTime: '全天开放',
            ticketPrice: 0,
            images: ['https://youimg1.c-ctrip.com/target/100v10000000o9nu28F62.jpg'],
            label: ['自然风光', '湖泊', '文化'],
            hotScore: 4.9
        }
    ];
} 