import { ApiSpot, MapSpot } from '../@types/spot';
import { extractCoordinates } from './coordinates';

/**
 * 将API返回的景点数据转换为地图使用的格式
 */
export const transformSpotsForMap = (spots: ApiSpot[] | undefined | null): MapSpot[] => {
  if (!spots || !Array.isArray(spots)) {
    console.warn('[transformSpotsForMap] 传入的spots为空或不是数组');
    return [];
  }

  console.log('[transformSpotsForMap] 开始转换景点数据，原始数据:', spots);
  
  const processedSpots = spots.map((spot, index) => {
    if (!spot) {
      console.warn(`[transformSpotsForMap] 景点${index}数据无效`);
      return null;
    }

    // 提取ID
    const id = spot.spot_id || spot.id || spot.scenic_id || 
              (spot.scenicSpot?.scenic_id) || 
              index;

    // 提取名称
    const name = spot.name || 
                spot.scenicSpot?.name ||
                `景点${id}`;

    // 提取描述
    const description = spot.description || 
                       spot.scenicSpot?.description ||
                       '';

    // 提取顺序号
    const order_number = spot.order_number || index + 1;

    // 提取图片URL
    const imageUrl = spot.imageUrl || 
                    spot.scenicSpot?.imageUrl ||
                    undefined;

    // 提取坐标
    const location = extractCoordinates(spot);

    // 返回转换后的数据
    const mapSpot: MapSpot = {
      id,
      name,
      description,
      order_number,
      location,
      imageUrl,
      scenicSpot: spot.scenicSpot
    };

    return mapSpot;
  }).filter((spot): spot is NonNullable<MapSpot> => spot !== null);

  console.log(`[transformSpotsForMap] 转换完成，得到 ${processedSpots.length} 个有效景点`);
  return processedSpots;
};

/**
 * 按顺序号排序景点
 */
export const sortSpotsByOrder = <T extends { order_number?: number }>(spots: T[]): T[] => {
  return [...spots].sort((a, b) => (a.order_number || 0) - (b.order_number || 0));
};

/**
 * 验证景点数据的完整性
 */
export const validateSpotData = (spot: ApiSpot): boolean => {
  if (!spot) return false;

  // 验证必需字段
  if (!spot.name) {
    console.warn('景点缺少名称');
    return false;
  }

  // 验证坐标
  const hasCoordinates = extractCoordinates(spot) !== null;
  if (!hasCoordinates) {
    console.warn(`景点"${spot.name}"缺少有效坐标`);
    return false;
  }

  return true;
}; 