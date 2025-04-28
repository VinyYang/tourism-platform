import http from './http'; // 使用配置好的http实例
import { Itinerary } from './itinerary'; // Assuming Itinerary type is available
import { AxiosError } from 'axios';

// Define the expected response types (align with Itineraries.tsx)
interface ApiScenicInfo {
    scenic_id: number; // 通常是主键
    name: string;
    description?: string;
    location?: [number, number] | null; // 根据后端是否返回调整
    city?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    is_custom?: boolean; // 添加自定义景点标识
    
    // 添加可能的额外字段
    lat?: number; // 某些后端可能使用lat而不是latitude
    lng?: number; // 某些后端可能使用lng而不是longitude
    coordinates?: [number, number] | null; // 某些后端可能使用coordinates字段
    position?: [number, number] | null; // 某些后端可能使用position字段
    geo?: { lat: number, lng: number } | null; // 某些后端可能使用geo对象
    // 添加后端 Scenic 模型返回的其他有用字段
}

// 代表后端格式化后的 spots 数组中的元素结构
export interface ApiRouteSpotInfo {
    spot_id: number;
    order_number: number;
    name: string;
    description?: string;
    location: [number, number] | null;
    latitude?: number | null;
    longitude?: number | null;
    
    // 添加可能的额外坐标字段
    lat?: number | null;
    lng?: number | null;
    coordinates?: [number, number] | null;
    position?: [number, number] | null;
    geo?: { lat: number, lng: number } | null;
    
    scenicSpot: ApiScenicInfo;
}

export interface ApiFeaturedRoute {
    featured_route_id: number;
    name: string;
    description: string;
    image_url: string | null;
    category: string | null;
    difficulty: string | null;
    spots: ApiRouteSpotInfo[]; // <--- 修改：使用新的嵌套结构类型
    is_active: boolean;
    // created_at/updated_at 等其他字段根据需要添加
}

// 这个列表项类型保持不变，因为它通常不包含 spots
export interface ApiFeaturedRouteListItem {
    featured_route_id: number;
    name: string;
    description: string;
    image_url: string | null;
    category: string | null;
    difficulty: string | null;
    is_active: boolean;
}

// 管理后台创建/编辑精选路线的接口
interface FeaturedRouteFormData {
    name: string;
    description: string;
    image_url: string; // 使用图片URL而非上传图片
    category?: string;
    difficulty?: string;
    is_active?: boolean;
    spots?: Array<{
        scenic_id?: number; // 可选的，未提供时表示自定义景点
        name?: string;     // 自定义景点必需，已有景点可选
        description?: string; // 自定义景点的描述
        order_number: number;
        latitude?: number | null;
        longitude?: number | null;
    }>;
}

// 公共API
export const getPublicFeaturedRoutes = async (): Promise<ApiFeaturedRouteListItem[]> => {
    try {
        // http模块已经配置了baseURL为/api/v1，所以这里不需要再加前缀
        // 注意：http模块的拦截器会直接返回response.data
        const responseData = await http.get('/featured-routes');
        
        // 记录原始响应
        console.log("获取精选路线 - 原始响应:", responseData);
        
        // 将responseData视为任意对象类型，解决TypeScript索引签名报错
        const data = responseData as Record<string, any>;
        
        // 增强的响应格式处理逻辑
        // 情况1: responseData 本身是数组
        if (Array.isArray(data)) {
            console.log("标准响应格式: 直接获得数组，长度:", data.length);
            return data as ApiFeaturedRouteListItem[];
        }
        // 情况2: responseData 是包含数组的对象
        else if (data && typeof data === 'object') {
            // 检查是否有data字段且是数组
            if (data.data && Array.isArray(data.data)) {
                console.log("嵌套响应格式: responseData.data 是数组，长度:", data.data.length);
                return data.data as ApiFeaturedRouteListItem[];
            }
            
            // 尝试查找responseData中的任何数组属性
            for (const key in data) {
                if (Array.isArray(data[key])) {
                    console.log(`找到数组属性 responseData.${key}，长度:`, data[key].length);
                    return data[key] as ApiFeaturedRouteListItem[];
                }
            }
        }
        
        // 所有尝试都失败，记录错误并返回空数组
        console.warn("无法从响应中提取精选路线数据，响应格式异常:", data);
        console.warn("响应类型:", typeof data);
        return [];
    } catch (error) {
        console.error("获取精选路线数据失败:", error);
        return []; // 错误时返回空数组避免UI崩溃
    }
};

/**
 * Fetches the detail of a specific public featured route.
 * @param {string | number} routeId - The ID of the route.
 * @returns {Promise<ApiFeaturedRoute>}
 */
export const getPublicFeaturedRouteById = async (routeId: string | number): Promise<ApiFeaturedRoute> => {
    if (!routeId) {
        throw new Error('Route ID is required to fetch details.');
    }
    try {
        console.log(`正在获取路线ID=${routeId}的详情`);
        // 注意：http模块的拦截器会直接返回response.data
        const responseData = await http.get(`/featured-routes/${routeId}`);
        console.log(`路线ID=${routeId}的原始响应:`, responseData);
        
        // 添加详细日志分析
        console.log(`===== 详细分析路线ID=${routeId}的响应数据 =====`);
        if (responseData && typeof responseData === 'object') {
            // 使用类型断言，将responseData视为任意对象
            const typedResponse = responseData as Record<string, any>;
            
            // 检查是否有spots字段
            if ('spots' in typedResponse) {
                const spots = typedResponse.spots as any[];
                console.log(`发现spots字段，包含${spots?.length || 0}个景点`);
                // 分析第一个景点的数据结构
                if (spots && spots.length > 0) {
                    const firstSpot = spots[0] as Record<string, any>;
                    console.log('第一个景点数据结构:', firstSpot);
                    console.log('景点坐标信息:');
                    console.log('- 直接坐标:', firstSpot.latitude, firstSpot.longitude);
                    console.log('- scenicSpot:', firstSpot.scenicSpot);
                    if (firstSpot.scenicSpot) {
                        const scenicSpot = firstSpot.scenicSpot as Record<string, any>;
                        console.log('- scenicSpot.location:', scenicSpot.location);
                        console.log('- scenicSpot坐标:', scenicSpot.latitude, scenicSpot.longitude);
                    }
                }
            } else {
                console.log('未找到spots字段，检查其他可能的路径');
                // 检查是否在其他嵌套对象中
                Object.keys(typedResponse).forEach(key => {
                    const nestedObj = typedResponse[key];
                    if (nestedObj && typeof nestedObj === 'object' && 'spots' in nestedObj) {
                        console.log(`在${key}字段中找到spots数组`);
                    }
                });
            }
        }
        
        // 将responseData视为任意对象类型处理
        const data = responseData as Record<string, any>;
        
        // 增强数据解析逻辑，处理不同的响应格式
        // 情况1: 标准响应 {success: true, data: {...}}
        if (data && data.success === true && data.data) {
            console.log("标准格式响应: {success: true, data: {...}}");
            
            // 验证spots字段
            const result = data.data as ApiFeaturedRoute;
            const spots = result.spots;
            
            // 确保spots是一个有效的数组
            if (spots === undefined || spots === null) {
                console.warn('spots字段为undefined或null，设置为空数组');
                result.spots = [];
            } else if (!Array.isArray(spots)) {
                console.warn('spots字段不是数组，设置为空数组');
                result.spots = [];
            } else {
                // 确保spots数组中每个景点都有有效的结构
                result.spots = spots.filter(spot => spot !== null && typeof spot === 'object');
                
                if (result.spots.length < spots.length) {
                    console.warn(`过滤掉 ${spots.length - result.spots.length} 个无效的景点数据`);
                }
            }
            
            return result;
        } 
        // 情况2: 响应本身就是路线对象 (常见情况)
        else if (data && typeof data === 'object' && !Array.isArray(data)) {
            // 验证对象是否有必要字段，确保它看起来像路线对象
            if ('featured_route_id' in data || 'name' in data || 'spots' in data) {
                console.log("响应本身是路线对象");
                // 确保返回的对象符合ApiFeaturedRoute类型所需的结构
                const spots = data.spots;
                
                // 处理spots数据
                let processedSpots: ApiRouteSpotInfo[] = [];
                
                if (spots === undefined || spots === null) {
                    console.warn('spots字段为undefined或null，设置为空数组');
                } else if (!Array.isArray(spots)) {
                    console.warn('spots字段不是数组，设置为空数组');
                } else {
                    // 过滤掉无效的景点数据
                    processedSpots = spots.filter(spot => spot !== null && typeof spot === 'object');
                    
                    if (processedSpots.length < spots.length) {
                        console.warn(`过滤掉 ${spots.length - processedSpots.length} 个无效的景点数据`);
                    }
                }
                
                const result: ApiFeaturedRoute = {
                    featured_route_id: data.featured_route_id || 0,
                    name: data.name || '',
                    description: data.description || '',
                    image_url: data.image_url || null,
                    category: data.category || null,
                    difficulty: data.difficulty || null,
                    spots: processedSpots,
                    is_active: data.is_active !== false
                };
                return result;
            }
        }
        // 情况3: 嵌套对象中包含路线数据
        else if (data && typeof data === 'object') {
            // 尝试从任何嵌套对象中找到路线数据
            for (const key in data) {
                if (typeof data[key] === 'object' && data[key] !== null) {
                    const possibleRoute = data[key] as Record<string, any>;
                    if ('featured_route_id' in possibleRoute || 'name' in possibleRoute || 'spots' in possibleRoute) {
                        console.log(`发现路线对象在responseData.${key}`);
                        
                        // 处理spots数据
                        const spots = possibleRoute.spots;
                        let processedSpots: ApiRouteSpotInfo[] = [];
                        
                        if (spots === undefined || spots === null) {
                            console.warn('spots字段为undefined或null，设置为空数组');
                        } else if (!Array.isArray(spots)) {
                            console.warn('spots字段不是数组，设置为空数组');
                        } else {
                            // 过滤掉无效的景点数据
                            processedSpots = spots.filter(spot => spot !== null && typeof spot === 'object');
                            
                            if (processedSpots.length < spots.length) {
                                console.warn(`过滤掉 ${spots.length - processedSpots.length} 个无效的景点数据`);
                            }
                        }
                        
                        // 确保返回的对象符合ApiFeaturedRoute类型
                        const result: ApiFeaturedRoute = {
                            featured_route_id: possibleRoute.featured_route_id || 0,
                            name: possibleRoute.name || '',
                            description: possibleRoute.description || '',
                            image_url: possibleRoute.image_url || null,
                            category: possibleRoute.category || null,
                            difficulty: possibleRoute.difficulty || null,
                            spots: processedSpots,
                            is_active: possibleRoute.is_active !== false
                        };
                        return result;
                    }
                }
            }
        }
            
        // 所有尝试都失败
        console.warn("路线详情数据格式异常:", data);
        // 返回最小化的数据结构，避免空对象错误
        return {
            featured_route_id: parseInt(routeId.toString()) || 0,
            name: '无法解析的路线',
            description: '无法从API响应解析路线数据',
            image_url: null,
            category: null,
            difficulty: null,
            spots: [],
            is_active: false
        };
    } catch (error) {
        console.error(`获取路线(ID=${routeId})详情失败:`, error);
        throw error; // 重新抛出错误，让调用者处理
    }
};

// Function to apply a featured route (creates a new itinerary for the user)
export const applyFeaturedRoute = async (routeId: number): Promise<{ id: number; title: string }> => {
    try {
        const responseData = await http.post(`/featured-routes/${routeId}/apply`);
        
        // 将responseData视为任意对象类型处理
        const data = responseData as Record<string, any>;
        
        // Check response structure and return only the data part on success
        if (data && data.success === true && data.data) {
            return data.data as { id: number; title: string }; // Return { id, title }
        } else if (data && data.success === false) {
            // If backend explicitly signals failure, throw its message
            throw new Error(data.message || '应用路线失败 (来自 API)');
        } else {
            // Handle unexpected response structure
            console.warn('应用路线 API 响应结构意外:', data);
            // Attempt a fallback if data seems okay directly (less ideal)
            if (data && typeof data.id === 'number' && typeof data.title === 'string') {
                 console.warn('回退：直接使用 response.data');
                 return { id: data.id, title: data.title };
            }
            throw new Error('应用路线 API 返回了意外的响应结构');
        }
    } catch (error: any) {
        console.error('API Error applying featured route:', error);
        // Improved error message extraction
        let errorMessage = '应用路线时发生未知错误';
        if (error.response && error.response.data && error.response.data.message) {
            // Error from backend response
            errorMessage = error.response.data.message;
        } else if (error.message && !error.message.includes('Network Error')) {
             // Error message from Axios or thrown in try block
            errorMessage = error.message;
        } else if (error.message && error.message.includes('Network Error')) {
             errorMessage = '网络错误，无法连接到服务器';
        } else if (typeof error === 'string') {
            errorMessage = error;
        }
        throw new Error(errorMessage);
    }
};

/**
 * 获取所有精选路线(管理员视图)
 * @returns {Promise<ApiFeaturedRouteListItem[]>}
 */
export const getAllFeaturedRoutesAdmin = async (): Promise<ApiFeaturedRouteListItem[]> => {
    try {
        const response = await http.get('/admin/featured-routes');
        // 后端直接返回数组，所以直接返回 response.data
        return response.data || [];
    } catch (error) {
        console.error("获取管理员精选路线列表失败:", error);
        throw error;
    }
};

/**
 * 获取精选路线详情(管理员视图)
 * @param {number} routeId - 路线ID
 * @returns {Promise<ApiFeaturedRoute | null>}
 */
export const getFeaturedRouteByIdAdmin = async (routeId: number): Promise<ApiFeaturedRoute | null> => {
    try {
        // 使用双重断言 (as unknown as Type) 来处理类型差异较大的情况
        const responseData = await http.get<ApiFeaturedRoute>(`/admin/featured-routes/${routeId}`) as unknown as ApiFeaturedRoute;
        return responseData; 
    } catch (error) {
        console.error(`获取精选路线(ID:${routeId})详情失败:`, error);
        return null; 
    }
};

/**
 * 创建新的精选路线(管理员)
 * @param {FeaturedRouteFormData} routeData - 路线数据
 * @returns {Promise<ApiFeaturedRoute>}
 */
export const createFeaturedRoute = async (routeData: FeaturedRouteFormData): Promise<ApiFeaturedRoute> => {
    try {
        const response = await http.post('/admin/featured-routes', routeData);
        return response.data.data || {};
    } catch (error) {
        console.error("创建精选路线失败:", error);
        throw error;
    }
};

/**
 * 更新精选路线(管理员)
 * @param {number} routeId - 路线ID
 * @param {FeaturedRouteFormData} routeData - 更新的路线数据
 * @returns {Promise<ApiFeaturedRoute>}
 */
export const updateFeaturedRoute = async (routeId: number, routeData: FeaturedRouteFormData): Promise<ApiFeaturedRoute> => {
    try {
        const response = await http.put(`/admin/featured-routes/${routeId}`, routeData);
        return response.data.data || {};
    } catch (error) {
        console.error(`更新精选路线(ID:${routeId})失败:`, error);
        throw error;
    }
};

/**
 * 删除精选路线(管理员)
 * @param {number} routeId - 路线ID
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const deleteFeaturedRoute = async (routeId: number): Promise<{ success: boolean, message: string }> => {
    try {
        const response = await http.delete(`/admin/featured-routes/${routeId}`);
        return response.data;
    } catch (error) {
        console.error(`删除精选路线(ID:${routeId})失败:`, error);
        throw error;
    }
};

// 同时保持对象导出以兼容现有代码
const featuredRouteAPI = {
    // 公共API
    getPublicFeaturedRoutes,
    getPublicFeaturedRouteById,
    applyFeaturedRoute,
    
    // 管理员API
    getAllFeaturedRoutesAdmin,
    getFeaturedRouteByIdAdmin,
    createFeaturedRoute,
    updateFeaturedRoute,
    deleteFeaturedRoute
};

export default featuredRouteAPI; 