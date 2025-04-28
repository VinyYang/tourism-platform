import axios from 'axios';

// 设置基础URL，支持3000或3001端口
const API_PORT = process.env.REACT_APP_API_PORT || '3001';
const BASE_URL = process.env.REACT_APP_API_URL || `http://localhost:${API_PORT}/api/v1`;

// 创建axios实例
const instance = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
});

// 添加请求拦截器，将token添加到请求头
instance.interceptors.request.use(
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

// 交通类型枚举
export enum TransportType {
    PLANE = 'plane',
    TRAIN = 'train',
    BUS = 'bus',
    CAR = 'car'
}

// 交通信息接口
export interface Transport {
    id: number;
    type: TransportType;
    fromCity: string;
    toCity: string;
    company: string;
    price: number;
    duration: number;
    createdAt?: string;
    updatedAt?: string;
    // 扩展属性，用于路线可视化
    departurePoint?: string;
    arrivalPoint?: string;
    distance?: number;
    details?: any;
}

// 交通信息搜索参数
export interface TransportSearchParams {
    from_city?: string;
    to_city?: string;
    transport_type?: TransportType;
    price_min?: number;
    price_max?: number;
    page?: number;
    limit?: number;
    sort_by?: 'price' | 'duration';
    sort_order?: 'asc' | 'desc';
}

// 交通信息搜索响应
export interface TransportSearchResponse {
    items: Transport[];
    total: number;
    currentPage: number;
    totalPages: number;
}

// 交通信息API接口
const transportAPI = {
    // 获取交通信息列表
    getTransports: async (params: TransportSearchParams): Promise<TransportSearchResponse> => {
        try {
            const response = await instance.get('/transports', { params });
            
            // 确保返回数据符合预期格式
            const data = response.data;
            // 如果后端返回格式不一致，进行适配处理
            if (!data.items && Array.isArray(data)) {
                return {
                    items: data,
                    total: data.length,
                    currentPage: 1,
                    totalPages: 1
                };
            }
            
            return data;
        } catch (error) {
            console.error('获取交通信息列表失败:', error);
            throw error;
        }
    },

    // 获取交通信息详情
    getTransportById: async (id: number): Promise<Transport> => {
        try {
            const response = await instance.get(`/transports/${id}`);
            return response.data;
        } catch (error) {
            console.error(`获取交通信息 ${id} 详情失败:`, error);
            throw error;
        }
    },

    // 获取交通类型列表
    getTransportTypes: async (): Promise<string[]> => {
        try {
            // 这里可以实现API调用，本例中直接返回枚举值
            return Object.values(TransportType);
        } catch (error) {
            console.error('获取交通类型列表失败:', error);
            throw error;
        }
    },

    // 创建新交通信息（仅限管理员）
    createTransport: async (data: Omit<Transport, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transport> => {
        try {
            // 转换字段名为后端期望的格式
            const requestData = {
                transport_type: data.type,
                from_city: data.fromCity,
                to_city: data.toCity,
                company: data.company,
                price: data.price,
                duration: data.duration
            };
            
            const response = await instance.post('/transports', requestData);
            return response.data;
        } catch (error) {
            console.error('创建交通信息失败:', error);
            throw error;
        }
    },

    // 更新交通信息（仅限管理员）
    updateTransport: async (id: number, data: Partial<Omit<Transport, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Transport> => {
        try {
            // 转换字段名为后端期望的格式
            const requestData: Record<string, any> = {};
            
            if (data.type !== undefined) requestData.transport_type = data.type;
            if (data.fromCity !== undefined) requestData.from_city = data.fromCity;
            if (data.toCity !== undefined) requestData.to_city = data.toCity;
            if (data.company !== undefined) requestData.company = data.company;
            if (data.price !== undefined) requestData.price = data.price;
            if (data.duration !== undefined) requestData.duration = data.duration;
            
            const response = await instance.put(`/transports/${id}`, requestData);
            return response.data;
        } catch (error) {
            console.error(`更新交通信息 ${id} 失败:`, error);
            throw error;
        }
    },

    // 删除交通信息（仅限管理员）
    deleteTransport: async (id: number): Promise<{ success: boolean; message: string }> => {
        try {
            const response = await instance.delete(`/transports/${id}`);
            return response.data;
        } catch (error) {
            console.error(`删除交通信息 ${id} 失败:`, error);
            throw error;
        }
    },
    
    // 查询两个城市间的交通选项
    searchTransportBetweenCities: async (fromCity: string, toCity: string, type?: TransportType): Promise<Transport[]> => {
        try {
            const params: TransportSearchParams = {
                from_city: fromCity,
                to_city: toCity
            };
            
            if (type) {
                params.transport_type = type;
            }
            
            const response = await transportAPI.getTransports(params);
            return response.items;
        } catch (error) {
            console.error(`查询 ${fromCity} 到 ${toCity} 的交通选项失败:`, error);
            throw error;
        }
    }
};

export default transportAPI; 