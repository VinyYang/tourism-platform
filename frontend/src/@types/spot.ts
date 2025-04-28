/**
 * 统一的景点类型定义
 */

// 基础坐标类型
export type Coordinates = [number, number]; // [longitude, latitude]

// 基础景点接口
export interface BaseSpot {
  id: number;
  name: string;
  description?: string;
  order_number?: number;
}

// API响应中的景点数据
export interface ApiSpot extends BaseSpot {
  spot_id?: number;
  scenic_id?: number;
  latitude?: number | null;
  longitude?: number | null;
  location?: Coordinates | null;
  coordinates?: Coordinates | null;
  position?: Coordinates | null;
  geo?: {
    lat: number;
    lng: number;
  } | null;
  scenicSpot?: {
    scenic_id: number;
    name: string;
    description?: string;
    location?: Coordinates | null;
    latitude?: number | null;
    longitude?: number | null;
    imageUrl?: string;
    city?: string;
    address?: string;
    is_custom?: boolean;
  };
  imageUrl?: string | null;
}

// 用于地图显示的景点数据
export interface MapSpot extends BaseSpot {
  location: Coordinates | null; // 统一使用[longitude, latitude]格式
  imageUrl?: string;
  scenicSpot?: ApiSpot['scenicSpot']; // 保留原始景点信息以供显示
}

// 用于表单的景点数据
export interface FormSpot extends BaseSpot {
  scenic_id: number;
  latitude?: number;
  longitude?: number;
  is_custom?: boolean;
} 