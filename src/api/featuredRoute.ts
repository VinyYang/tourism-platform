import http from './http'; // 使用配置好的http实例
import { AxiosError } from 'axios';

// 定义API响应类型
interface ApiSpot {
    id: number;
    name: string;
    description: string;
    location: [number, number] | null;
    imageUrl?: string | null;
}

interface ApiFeaturedRoute {
    featured_route_id: number;
    name: string;
    description: string;
    image_url: string | null;
    category: string | null;
    difficulty: string | null;
    spots: ApiSpot[];
    is_active: boolean;
}

interface ApiFeaturedRouteListItem {
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
        scenic_id: number;
        order_number: number;
    }>;
}

/**
 * 获取所有精选路线(管理员视图)
 * @returns {Promise<ApiFeaturedRouteListItem[]>}
 */
const getAllFeaturedRoutesAdmin = async (): Promise<ApiFeaturedRouteListItem[]> => {
    try {
        // 模拟数据，实际应调用后端API
        return Promise.resolve([
            {
                featured_route_id: 1,
                name: '红色之旅',
                description: '探索革命历史',
                image_url: 'https://example.com/red-route.jpg',
                category: '红色文化',
                difficulty: 'easy',
                is_active: true
            },
            {
                featured_route_id: 2,
                name: '江南水乡',
                description: '古镇风情游',
                image_url: 'https://example.com/water-town.jpg',
                category: '江南文化',
                difficulty: 'medium',
                is_active: true
            }
        ]);
    } catch (error) {
        console.error("获取管理员精选路线列表失败:", error);
        throw error;
    }
};

/**
 * 获取精选路线详情(管理员视图)
 * @param {number} routeId - 路线ID
 * @returns {Promise<ApiFeaturedRoute>}
 */
const getFeaturedRouteByIdAdmin = async (routeId: number): Promise<ApiFeaturedRoute> => {
    try {
        // 模拟数据，实际应调用后端API
        return Promise.resolve({
            featured_route_id: routeId,
            name: routeId === 1 ? '红色之旅' : '江南水乡',
            description: routeId === 1 ? '探索革命历史' : '古镇风情游',
            image_url: routeId === 1 ? 'https://example.com/red-route.jpg' : 'https://example.com/water-town.jpg',
            category: routeId === 1 ? '红色文化' : '江南文化',
            difficulty: routeId === 1 ? 'easy' : 'medium',
            spots: [
                {
                    id: 101,
                    name: '示例景点1',
                    description: '景点描述',
                    location: [120.1, 30.2]
                },
                {
                    id: 102,
                    name: '示例景点2',
                    description: '景点描述',
                    location: [120.3, 30.4]
                }
            ],
            is_active: true
        });
    } catch (error) {
        console.error(`获取精选路线(ID:${routeId})详情失败:`, error);
        throw error;
    }
};

/**
 * 创建新的精选路线(管理员)
 * @param {FeaturedRouteFormData} routeData - 路线数据
 * @returns {Promise<ApiFeaturedRoute>}
 */
const createFeaturedRoute = async (routeData: FeaturedRouteFormData): Promise<ApiFeaturedRoute> => {
    try {
        // 模拟API调用
        console.log("创建路线数据:", routeData);
        return Promise.resolve({
            featured_route_id: Math.floor(Math.random() * 1000) + 10,
            name: routeData.name,
            description: routeData.description,
            image_url: routeData.image_url,
            category: routeData.category || null,
            difficulty: routeData.difficulty || null,
            spots: [],
            is_active: routeData.is_active || false
        });
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
const updateFeaturedRoute = async (routeId: number, routeData: FeaturedRouteFormData): Promise<ApiFeaturedRoute> => {
    try {
        // 模拟API调用
        console.log(`更新路线${routeId}数据:`, routeData);
        return Promise.resolve({
            featured_route_id: routeId,
            name: routeData.name,
            description: routeData.description,
            image_url: routeData.image_url,
            category: routeData.category || null,
            difficulty: routeData.difficulty || null,
            spots: [],
            is_active: routeData.is_active || false
        });
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
const deleteFeaturedRoute = async (routeId: number): Promise<{ success: boolean, message: string }> => {
    try {
        // 模拟API调用
        console.log(`删除路线${routeId}`);
        return Promise.resolve({
            success: true,
            message: `成功删除路线ID:${routeId}`
        });
    } catch (error) {
        console.error(`删除精选路线(ID:${routeId})失败:`, error);
        throw error;
    }
};

// 导出API
const featuredRouteAPI = {
    // 管理员API
    getAllFeaturedRoutesAdmin,
    getFeaturedRouteByIdAdmin,
    createFeaturedRoute,
    updateFeaturedRoute,
    deleteFeaturedRoute
};

export default featuredRouteAPI; 