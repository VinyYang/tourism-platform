/**
 * 地图数据处理辅助函数
 */

import { ApiFeaturedRoute, ApiRouteSpotInfo } from '../api/featuredRoute';

/**
 * 从路线景点中提取有效的位置坐标
 * 考虑多种可能的坐标字段名
 */
export const extractCoordinates = (spot: any): [number, number] | null => {
  // 直接坐标字段
  if (spot.longitude && spot.latitude) {
    return [Number(spot.longitude), Number(spot.latitude)];
  }
  
  // 替代字段名
  if (spot.lng && spot.lat) {
    return [Number(spot.lng), Number(spot.lat)];
  }
  
  // 单一location数组字段
  if (spot.location && Array.isArray(spot.location) && spot.location.length === 2) {
    return [Number(spot.location[0]), Number(spot.location[1])];
  }

  // coordinates数组字段
  if (spot.coordinates && Array.isArray(spot.coordinates) && spot.coordinates.length === 2) {
    return [Number(spot.coordinates[0]), Number(spot.coordinates[1])];
  }
  
  // 嵌套在scenicSpot中的字段
  if (spot.scenicSpot) {
    // 嵌套的直接字段
    if (spot.scenicSpot.longitude && spot.scenicSpot.latitude) {
      return [Number(spot.scenicSpot.longitude), Number(spot.scenicSpot.latitude)];
    }
    
    // 嵌套的替代字段
    if (spot.scenicSpot.lng && spot.scenicSpot.lat) {
      return [Number(spot.scenicSpot.lng), Number(spot.scenicSpot.lat)];
    }
    
    // 嵌套的location数组
    if (spot.scenicSpot.location && Array.isArray(spot.scenicSpot.location) && spot.scenicSpot.location.length === 2) {
      return [Number(spot.scenicSpot.location[0]), Number(spot.scenicSpot.location[1])];
    }

    // 嵌套的coordinates数组
    if (spot.scenicSpot.coordinates && Array.isArray(spot.scenicSpot.coordinates) && spot.scenicSpot.coordinates.length === 2) {
      return [Number(spot.scenicSpot.coordinates[0]), Number(spot.scenicSpot.coordinates[1])];
    }
  }
  
  // 没有有效坐标
  return null;
};

/**
 * 为ChinaMap组件准备精选路线的景点数据
 * @param route 精选路线数据
 * @returns 适合ChinaMap组件的景点数据
 */
export const prepareFeaturedRouteSpotsForMap = (route: ApiFeaturedRoute) => {
  if (!route.spots || !Array.isArray(route.spots)) {
    return [];
  }
  
  return route.spots.map((spot, index) => {
    const coordinates = extractCoordinates(spot);
    
    return {
      id: spot.spot_id || index,
      name: spot.scenicSpot?.name || 'Unknown Spot',
      order_number: spot.order_number || index + 1,
      latitude: coordinates ? coordinates[1] : null,
      longitude: coordinates ? coordinates[0] : null,
      description: spot.scenicSpot?.description || ''
    };
  }).filter(spot => spot.latitude !== null && spot.longitude !== null);
};

/**
 * 获取两个坐标点之间的距离（公里）
 * 使用Haversine公式计算球面距离
 */
export const calculateDistance = (
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number => {
  const R = 6371; // 地球半径，单位为公里
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * 根据景点顺序对路线景点进行排序
 */
export const sortRouteSpotsByOrder = (spots: ApiRouteSpotInfo[]): ApiRouteSpotInfo[] => {
  return [...spots].sort((a, b) => (a.order_number || 0) - (b.order_number || 0));
};

export default {
  extractCoordinates,
  prepareFeaturedRouteSpotsForMap,
  calculateDistance,
  sortRouteSpotsByOrder
}; 