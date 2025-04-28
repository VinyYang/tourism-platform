/**
 * 行程模板项目接口
 * 定义模板中单个行程项的结构
 */
export interface TemplateItem {
  id: string;
  name: string;
  type: 'scenic' | 'hotel' | 'transport' | 'custom' | 'activity';
  description?: string;
  startTime?: string;
  endTime?: string;
  duration?: number; // 单位：分钟
  image?: string;
  defaultPrice?: number;
}

/**
 * 行程模板天接口
 * 定义模板中单日行程的结构
 */
export interface TemplateDay {
  dayNumber: number;
  title?: string;
  description?: string;
  items: TemplateItem[];
}

/**
 * 行程模板接口
 * 定义完整的行程模板结构
 */
export interface ItineraryTemplate {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  duration: number; // 天数
  type: 'weekend' | 'holiday' | 'family' | 'business' | 'custom';
  estimatedBudget?: number;
  targetCity?: string;
  popularity: number; // 1-5的等级，表示受欢迎程度
  tags: string[]; // 标签列表，如"美食"、"购物"、"历史"等
  days: TemplateDay[];
  createdAt: string;
  updatedAt: string;
}

/**
 * 预设的行程模板列表
 * 常见行程类型的默认模板集合
 */
export const DEFAULT_TEMPLATES: ItineraryTemplate[] = [
  // 周末短途模板
  {
    id: 'template-weekend-trip',
    name: '周末休闲游',
    description: '适合周末短途旅行的轻松行程安排',
    imageUrl: '/images/templates/weekend.jpg',
    duration: 2,
    type: 'weekend',
    estimatedBudget: 1500,
    popularity: 5,
    tags: ['休闲', '周末', '短途'],
    days: [
      {
        dayNumber: 1,
        title: '第一天',
        description: '景点游览与美食体验',
        items: [
          {
            id: 'template-item-1',
            name: '酒店办理入住',
            type: 'hotel',
            startTime: '14:00',
            endTime: '15:00',
            description: '抵达目的地，办理酒店入住'
          },
          {
            id: 'template-item-2',
            name: '景点游览',
            type: 'scenic',
            startTime: '15:30',
            endTime: '17:30',
            description: '参观当地知名景点'
          },
          {
            id: 'template-item-3',
            name: '晚餐',
            type: 'custom',
            startTime: '18:00',
            endTime: '19:30',
            description: '品尝当地特色美食'
          }
        ]
      },
      {
        dayNumber: 2,
        title: '第二天',
        description: '自由活动与返程',
        items: [
          {
            id: 'template-item-4',
            name: '早餐',
            type: 'custom',
            startTime: '08:00',
            endTime: '09:00',
            description: '酒店早餐'
          },
          {
            id: 'template-item-5',
            name: '自由活动',
            type: 'custom',
            startTime: '09:30',
            endTime: '12:00',
            description: '自由购物或休闲'
          },
          {
            id: 'template-item-6',
            name: '返程',
            type: 'transport',
            startTime: '15:00',
            endTime: '17:00',
            description: '办理退房，返回出发地'
          }
        ]
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  
  // 家庭亲子游模板
  {
    id: 'template-family-trip',
    name: '家庭亲子游',
    description: '适合带孩子出行的家庭亲子行程安排',
    imageUrl: '/images/templates/family.jpg',
    duration: 3,
    type: 'family',
    estimatedBudget: 4000,
    popularity: 4,
    tags: ['亲子', '家庭', '休闲'],
    days: [
      {
        dayNumber: 1,
        title: '第一天',
        description: '抵达目的地，休息调整',
        items: [
          {
            id: 'template-family-1',
            name: '抵达目的地',
            type: 'transport',
            startTime: '10:00',
            endTime: '12:00',
            description: '抵达目的地'
          },
          {
            id: 'template-family-2',
            name: '酒店入住',
            type: 'hotel',
            startTime: '14:00',
            endTime: '15:00',
            description: '办理入住，稍作休息'
          },
          {
            id: 'template-family-3',
            name: '附近公园散步',
            type: 'activity',
            startTime: '16:00',
            endTime: '17:30',
            description: '在酒店附近公园散步，让孩子放松精力'
          }
        ]
      },
      {
        dayNumber: 2,
        title: '第二天',
        description: '主题乐园一日游',
        items: [
          {
            id: 'template-family-4',
            name: '主题乐园',
            type: 'scenic',
            startTime: '09:00',
            endTime: '17:00',
            description: '全天游玩主题乐园',
            defaultPrice: 1200
          }
        ]
      },
      {
        dayNumber: 3,
        title: '第三天',
        description: '科技馆参观与返程',
        items: [
          {
            id: 'template-family-5',
            name: '科技馆参观',
            type: 'scenic',
            startTime: '09:30',
            endTime: '12:00',
            description: '参观科技馆，增长知识',
            defaultPrice: 200
          },
          {
            id: 'template-family-6',
            name: '返程',
            type: 'transport',
            startTime: '15:00',
            endTime: '17:00',
            description: '办理退房，返回出发地'
          }
        ]
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  
  // 商务行程模板
  {
    id: 'template-business-trip',
    name: '商务出差',
    description: '高效紧凑的商务出差行程安排',
    imageUrl: '/images/templates/business.jpg',
    duration: 2,
    type: 'business',
    estimatedBudget: 3000,
    popularity: 3,
    tags: ['商务', '高效', '出差'],
    days: [
      {
        dayNumber: 1,
        title: '第一天',
        description: '抵达与准备',
        items: [
          {
            id: 'template-business-1',
            name: '抵达目的地',
            type: 'transport',
            startTime: '08:00',
            endTime: '10:00',
            description: '抵达目的地'
          },
          {
            id: 'template-business-2',
            name: '酒店入住',
            type: 'hotel',
            startTime: '12:00',
            endTime: '13:00',
            description: '入住商务酒店'
          },
          {
            id: 'template-business-3',
            name: '商务会议',
            type: 'custom',
            startTime: '14:00',
            endTime: '17:00',
            description: '参加商务会议或洽谈'
          }
        ]
      },
      {
        dayNumber: 2,
        title: '第二天',
        description: '会议与返程',
        items: [
          {
            id: 'template-business-4',
            name: '早餐会议',
            type: 'custom',
            startTime: '08:00',
            endTime: '09:30',
            description: '酒店早餐会议'
          },
          {
            id: 'template-business-5',
            name: '项目考察',
            type: 'custom',
            startTime: '10:00',
            endTime: '12:00',
            description: '项目现场考察'
          },
          {
            id: 'template-business-6',
            name: '返程',
            type: 'transport',
            startTime: '15:00',
            endTime: '17:00',
            description: '办理退房，返回出发地'
          }
        ]
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]; 