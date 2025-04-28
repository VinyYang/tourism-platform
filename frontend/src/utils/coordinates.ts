import { Coordinates } from '../@types/spot';

/**
 * 验证坐标是否有效
 */
export const isValidCoordinate = (value: number): boolean => {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
};

/**
 * 验证经度是否有效 (-180 到 180)
 */
export const isValidLongitude = (lon: number): boolean => {
  return isValidCoordinate(lon) && lon >= -180 && lon <= 180;
};

/**
 * 验证纬度是否有效 (-90 到 90)
 */
export const isValidLatitude = (lat: number): boolean => {
  return isValidCoordinate(lat) && lat >= -90 && lat <= 90;
};

/**
 * 验证坐标数组是否有效
 */
export const isValidCoordinates = (coords: any): coords is Coordinates => {
  if (!Array.isArray(coords) || coords.length !== 2) {
    return false;
  }
  return isValidLongitude(coords[0]) && isValidLatitude(coords[1]);
};

/**
 * 从各种可能的格式中提取坐标
 */
export const extractCoordinates = (data: any): Coordinates | null => {
  // 直接的经纬度字段
  if (isValidLongitude(data?.longitude) && isValidLatitude(data?.latitude)) {
    return [data.longitude, data.latitude];
  }

  // lng/lat 字段
  if (isValidLongitude(data?.lng) && isValidLatitude(data?.lat)) {
    return [data.lng, data.lat];
  }

  // location 数组
  if (data?.location && isValidCoordinates(data.location)) {
    return data.location;
  }

  // coordinates 数组
  if (data?.coordinates && isValidCoordinates(data.coordinates)) {
    return data.coordinates;
  }

  // position 数组
  if (data?.position && isValidCoordinates(data.position)) {
    return data.position;
  }

  // geo 对象
  if (data?.geo && isValidLongitude(data.geo.lng) && isValidLatitude(data.geo.lat)) {
    return [data.geo.lng, data.geo.lat];
  }

  // scenicSpot 中的坐标
  if (data?.scenicSpot) {
    const scenicCoords = extractCoordinates(data.scenicSpot);
    if (scenicCoords) {
      return scenicCoords;
    }
  }

  return null;
};

/**
 * 格式化坐标为字符串
 */
export const formatCoordinates = (coords: Coordinates | null): string => {
  if (!coords) return '无坐标';
  return `${coords[1].toFixed(6)}, ${coords[0].toFixed(6)}`;
};

/**
 * 解析坐标字符串
 * 支持格式：
 * - "lat,lng"
 * - "[lng,lat]"
 * - "{lat:xx,lng:xx}"
 */
export const parseCoordinatesString = (str: string): Coordinates | null => {
  try {
    // 尝试解析 JSON
    if (str.startsWith('{') || str.startsWith('[')) {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) {
        return isValidCoordinates(parsed) ? parsed : null;
      }
      if (typeof parsed === 'object' && parsed !== null) {
        return extractCoordinates(parsed);
      }
    }

    // 解析 "lat,lng" 格式
    const parts = str.split(',').map(part => parseFloat(part.trim()));
    if (parts.length === 2 && isValidLatitude(parts[0]) && isValidLongitude(parts[1])) {
      return [parts[1], parts[0]]; // 转换为 [lng,lat] 格式
    }
  } catch (e) {
    console.warn('解析坐标字符串失败:', e);
  }
  return null;
}; 