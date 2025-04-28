import axiosInstance from './axiosInstance'; // 假设你有一个配置好的 axios 实例

const API_URL = ''; // 基础 URL已在axiosInstance中配置，这里不需要重复

// 获取公共精选路线 (启用状态)
export const getEnabledFeaturedRoutes = async () => {
  try {
    const response = await axiosInstance.get(`${API_URL}/featured-routes`);
    return response.data; // 后端返回 { success: boolean, data: any[], message: string }
  } catch (error) {
    console.error('Error fetching enabled featured routes:', error.response || error);
    throw error.response?.data || { success: false, message: '获取公共精选路线失败' };
  }
};

// 添加getPublicFeaturedRoutes作为getEnabledFeaturedRoutes的别名，解决API调用不一致的问题
export const getPublicFeaturedRoutes = getEnabledFeaturedRoutes;

// 获取单个公共精选路线详情
export const getPublicFeaturedRouteById = async (id) => {
  try {
    const response = await axiosInstance.get(`${API_URL}/featured-routes/${id}`);
    console.log(`获取路线ID=${id}的原始响应:`, response);

    // 处理响应数据
    let data = response.data;
    
    // 如果响应是标准格式 {success: true, data: {...}}
    if (data && data.success === true && data.data) {
      data = data.data;
    }

    // 验证和处理spots数据
    if (!data.spots) {
      console.warn(`路线ID=${id}缺少spots数组，设置为空数组`);
      data.spots = [];
    } else if (!Array.isArray(data.spots)) {
      console.warn(`路线ID=${id}的spots不是数组，设置为空数组`);
      data.spots = [];
    } else {
      // 确保每个spot都有必要的数据结构
      data.spots = data.spots.map(spot => {
        if (!spot || typeof spot !== 'object') {
          return null;
        }

        // 确保scenicSpot对象存在
        if (!spot.scenicSpot || typeof spot.scenicSpot !== 'object') {
          spot.scenicSpot = {
            name: spot.name || '未命名景点',
            description: spot.description || '',
            location: spot.location || null
          };
        }

        // 处理坐标数据
        // 1. 直接的经纬度
        if (spot.latitude && spot.longitude) {
          spot.location = [parseFloat(spot.longitude), parseFloat(spot.latitude)];
        }
        // 2. scenicSpot中的经纬度
        else if (spot.scenicSpot.latitude && spot.scenicSpot.longitude) {
          spot.location = [parseFloat(spot.scenicSpot.longitude), parseFloat(spot.scenicSpot.latitude)];
        }
        // 3. location数组
        else if (Array.isArray(spot.location) && spot.location.length === 2) {
          spot.location = spot.location.map(coord => parseFloat(coord));
        }
        // 4. scenicSpot中的location数组
        else if (Array.isArray(spot.scenicSpot.location) && spot.scenicSpot.location.length === 2) {
          spot.location = spot.scenicSpot.location.map(coord => parseFloat(coord));
        }

        return spot;
      }).filter(spot => spot !== null);

      console.log(`路线ID=${id}处理后的spots数据:`, data.spots);
    }

    return data;
  } catch (error) {
    console.error(`获取路线ID=${id}详情失败:`, error.response || error);
    throw error.response?.data || { success: false, message: '获取精选路线详情失败' };
  }
};

// 应用精选路线（创建新行程）
export const applyFeaturedRoute = async (routeId) => {
  try {
    const response = await axiosInstance.post(`${API_URL}/featured-routes/${routeId}/apply`);
    const data = response.data;
    
    // 处理不同的响应结构
    if (data && data.success === true && data.data) {
      return data.data; // 返回 { id, title }
    } else if (data && data.success === false) {
      // 如果后端明确标识失败，抛出其消息
      throw new Error(data.message || '应用路线失败 (来自 API)');
    } else {
      // 处理意外的响应结构
      console.warn('应用路线 API 响应结构意外:', data);
      // 尝试直接使用数据（次优选择）
      if (data && typeof data.id === 'number' && typeof data.title === 'string') {
        console.warn('回退：直接使用 response.data');
        return { id: data.id, title: data.title };
      }
      throw new Error('应用路线 API 返回了意外的响应结构');
    }
  } catch (error) {
    console.error('API Error applying featured route:', error);
    // 改进的错误消息提取
    let errorMessage = '应用路线时发生未知错误';
    if (error.response && error.response.data && error.response.data.message) {
      // 来自后端响应的错误
      errorMessage = error.response.data.message;
    } else if (error.message && !error.message.includes('Network Error')) {
      // 来自Axios或在try块中抛出的错误消息
      errorMessage = error.message;
    } else if (error.message && error.message.includes('Network Error')) {
      errorMessage = '网络错误，无法连接到服务器';
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    throw new Error(errorMessage);
  }
};

// --- Admin API ---

// 获取所有精选路线 (管理员)
export const getAllFeaturedRoutesAdmin = async () => {
  try {
    console.log('正在请求精选路线...');
    const response = await axiosInstance.get(`${API_URL}/admin/featured-routes`);
    console.log('精选路线API响应:', response);
    
    // 格式化响应数据
    if (!response || !response.data) {
      console.error('API响应缺少data字段:', response);
      return [];
    }
    
    // 如果data字段有嵌套的data数组字段，返回内部数组
    if (response.data.data && Array.isArray(response.data.data)) {
      console.log(`返回${response.data.data.length}个精选路线`);
      return response.data.data;
    }
    
    // 如果整个data字段是数组，直接返回
    if (Array.isArray(response.data)) {
      console.log(`返回${response.data.length}个精选路线`);
      return response.data;
    }
    
    // 如果是其他格式，做适当转换
    console.warn('API返回了意外的数据格式:', response.data);
    return [];
  } catch (error) {
    console.error('获取管理员精选路线列表失败:', error.response || error);
    // 始终返回空数组而非抛出异常，以防止UI崩溃
    return [];
  }
};

// 根据 ID 获取精选路线详情 (管理员)
export const getFeaturedRouteByIdAdmin = async (id) => {
  try {
    const response = await axiosInstance.get(`${API_URL}/admin/featured-routes/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching featured route ${id} for admin:`, error.response || error);
    throw error.response?.data || { success: false, message: '获取精选路线详情失败' };
  }
};

/**
 * 创建新的精选路线 (管理员)
 * @param {object} routeData - 路线数据
 * @param {string} routeData.name
 * @param {string} [routeData.description]
 * @param {string} [routeData.image_url]
 * @param {string} [routeData.category]
 * @param {string} [routeData.difficulty]
 * @param {boolean} [routeData.is_active]
 * @param {Array<{scenic_id: number, order_number: number, latitude?: number, longitude?: number}>} routeData.spots - 景点列表及其顺序和坐标
 */
export const createFeaturedRoute = async (routeData) => {
  try {
    const response = await axiosInstance.post(`${API_URL}/admin/featured-routes`, routeData);
    return response.data;
  } catch (error) {
    console.error('Error creating featured route:', error.response || error);
    throw error.response?.data || { success: false, message: '创建精选路线失败' };
  }
};

/**
 * 更新精选路线 (管理员)
 * @param {number|string} id - 路线 ID
 * @param {object} routeData - 更新的路线数据
 * @param {string} [routeData.name]
 * @param {string} [routeData.description]
 * @param {string} [routeData.image_url]
 * @param {string} [routeData.category]
 * @param {string} [routeData.difficulty]
 * @param {boolean} [routeData.is_active]
 * @param {Array<{scenic_id: number, order_number: number, latitude?: number, longitude?: number}>} [routeData.spots] - 景点列表及其顺序和坐标
 */
export const updateFeaturedRouteAdmin = async (id, routeData) => {
  try {
    const response = await axiosInstance.put(`${API_URL}/admin/featured-routes/${id}`, routeData);
    return response.data;
  } catch (error) {
    console.error(`Error updating featured route ${id}:`, error.response || error);
    throw error.response?.data || { success: false, message: '更新精选路线失败' };
  }
};

// 删除精选路线 (管理员)
export const deleteFeaturedRouteAdmin = async (id) => {
  try {
    const response = await axiosInstance.delete(`${API_URL}/admin/featured-routes/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting featured route ${id}:`, error.response || error);
    throw error.response?.data || { success: false, message: '删除精选路线失败' };
  }
};

// 搜索景点 (用于路线编辑)
export const searchScenicSpots = async (query) => {
  try {
    const response = await axiosInstance.get(`${API_URL}/scenic/search?keyword=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    console.error('Error searching scenic spots:', error.response || error);
    throw error.response?.data || { success: false, message: '搜索景点失败' };
  }
};

// 将所有函数导出
const featuredRouteAPI = {
    getEnabledFeaturedRoutes,
    getPublicFeaturedRoutes,
    getPublicFeaturedRouteById,
    applyFeaturedRoute,
    getAllFeaturedRoutesAdmin,
    getFeaturedRouteByIdAdmin,
    createFeaturedRoute,
    updateFeaturedRouteAdmin,
    deleteFeaturedRouteAdmin,
    searchScenicSpots
};

export default featuredRouteAPI; 