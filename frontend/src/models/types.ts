/**
 * 行程项定义
 */
export interface DisplayItem {
  id: string;                       // 前端唯一ID (item-${ItineraryItem.id} 或 custom-${timestamp})
  dbItemId?: number;                // 数据库中的ItineraryItem.id
  originalId: number | string;      // 原始景点/酒店/交通ID或自定义时间戳
  name: string;
  type: 'scenic' | 'hotel' | 'transport' | 'custom' | 'activity';
  image?: string;
  price?: number;                   // 价格字段，用于计算预算
  address?: string;                 // 对应后端ItineraryItem.location
  location?: string;                // 冗余存储location
  description?: string;             // 对应后端ItineraryItem.notes
  startTime?: string;
  endTime?: string;
  rating?: number;                  // 评分
  transportType?: string;           // 交通类型
}

/**
 * 单日行程定义
 */
export interface DayPlan {
  date: string;                     // YYYY-MM-DD，基于startDate和dayNumber计算
  dayNumber: number;                // 对应后端ItineraryItem.day_number
  items: DisplayItem[];             // 当天行程项
}

/**
 * 前端行程状态定义
 */
export interface ItineraryState {
  id?: number;                      // 后端行程ID
  title: string;
  startDate?: string;
  endDate?: string;
  days: DayPlan[];
  budget?: number;                  // 对应后端estimatedBudget
  notes?: string;                   // 对应后端description
  destination?: string;             // 对应后端city
  isPublic: boolean;
  status?: 'draft' | 'published';
  cover?: string;
  userId?: number;
  createdAt?: string;
  updatedAt?: string;
} 