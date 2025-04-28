/**
 * 图片服务配置文件
 * 集中管理图片处理相关的配置
 */

// 定义类型接口
interface SizeConfig {
  width: number;
  height: number;
}

interface SizesMap {
  [key: string]: SizeConfig | undefined;
  avatar: SizeConfig;
  thumbnail: SizeConfig;
  cover: SizeConfig;
  strategy: SizeConfig;
  scenic: SizeConfig;
  hotel: SizeConfig;
  room: SizeConfig;
  payment: SizeConfig;
  logo: SizeConfig;
}

interface TextsMap {
  [key: string]: string | undefined;
  avatar: string;
  strategy: string;
  strategyCover: string;
  scenic: string;
  hotel: string;
  room: string;
  thumbnail: string;
  payment: string;
  logo: string;
}

interface FilesMap {
  [key: string]: string | undefined;
  user: string;
  strategy: string;
  scenic: string;
  hotel: string;
  payment: string;
  alipay: string;
  wechat: string;
  unionpay: string;
}

// 酒店默认图片URL数组
export const DEFAULT_HOTEL_IMAGES = [
  'https://pic4.zhimg.com/v2-955d4422a7a9fb557798d27dd7d39dc6_r.jpg?source=172ae18b',
  'https://th.bing.com/th/id/R.3a3748ae287fe6df6f6da7a7912ca72f?rik=GTG4bHFp%2fQrD0w&pid=ImgRaw&r=0',
  'https://th.bing.com/th/id/R.c15a8580ca1b0377c693ee821f63a0da?rik=VPnV0lKB%2bcq5Ag&pid=ImgRaw&r=0',
  'https://th.bing.com/th/id/R.fc72689449d0769bd7c7c9f28ea957f2?rik=IbpUD3K0SsZbqA&riu=http%3a%2f%2fwww.dfhspace.com%2fuploads%2f20210106%2f0be5d78d7419c56cfeb9f4fefbb49daf.jpg&ehk=66TMAjM5Uqa6ciLL%2baAbM%2bvLihI5dpO5Nj7T7%2bM2I7Y%3d&risl=&pid=ImgRaw&r=0'
];

// 默认景点图片URL
export const DEFAULT_SCENIC_IMAGE = 'https://th.bing.com/th/id/R.10c59a6bbe5d106587c91bab159bb416?rik=PA9u5SN2wgi%2fiQ&pid=ImgRaw&r=0';

// 默认攻略封面URL
export const DEFAULT_STRATEGY_COVER = 'https://img-s.msn.cn/tenant/amp/entityid/AA11MZ4O?w=0&h=0&q=60&m=6&f=jpg&u=t';

/**
 * 占位图服务配置
 */
export const PLACEHOLDER_CONFIG = {
  // 占位图服务的基础URL
  BASE_URL: 'https://placehold.co',
  
  // 旧占位图服务URL，用于迁移替换
  LEGACY_BASE_URL: 'https://via.placeholder.com',
  
  // 默认尺寸
  DEFAULT_WIDTH: 300,
  DEFAULT_HEIGHT: 200,
  
  // 不同类型资源的默认尺寸
  SIZES: {
    avatar: { width: 40, height: 40 },
    thumbnail: { width: 80, height: 60 },
    cover: { width: 1200, height: 400 },
    strategy: { width: 300, height: 150 },
    scenic: { width: 300, height: 200 },
    hotel: { width: 800, height: 600 },
    room: { width: 300, height: 200 },
    payment: { width: 80, height: 60 },
    logo: { width: 80, height: 40 }
  } as SizesMap,
  
  // 默认文本
  DEFAULT_TEXT: '无图片',
  
  // 不同类型资源的默认文本
  TEXTS: {
    avatar: '用户',
    strategy: '攻略图片',
    strategyCover: '攻略封面',
    scenic: '景点图片',
    hotel: '酒店图片',
    room: '房间图片',
    thumbnail: '缩略图',
    payment: '商品',
    logo: '图标'
  } as TextsMap
};

/**
 * 本地占位图配置
 */
export const LOCAL_PLACEHOLDERS = {
  BASE_PATH: '/images/placeholders',
  FILES: {
    user: 'user.svg',
    strategy: 'strategy.svg',
    scenic: 'scenic.svg',
    hotel: 'hotel.svg',
    payment: 'item.svg',
    alipay: 'alipay-logo.svg',
    wechat: 'wechat-logo.svg',
    unionpay: 'unionpay-logo.svg'
  } as FilesMap,
  // 是否优先使用本地占位图
  PREFER_LOCAL: true
};

/**
 * CDN配置
 */
export const CDN_CONFIG = {
  // CDN地址，按优先级排序
  URLS: [
    '', // 默认为空，使用相对路径
    'https://cdn.example.com' // 示例CDN地址
  ],
  // 自动重试次数
  MAX_RETRIES: 2,
  // 是否启用CDN
  ENABLED: false
};

/**
 * 图片优化配置
 */
export const IMAGE_OPTIMIZATION = {
  // 是否启用WebP
  USE_WEBP: true,
  // 是否启用懒加载
  LAZY_LOADING: true,
  // 是否使用响应式图片
  RESPONSIVE: true,
  // 图片质量（1-100）
  QUALITY: 85,
  // 加载中占位符颜色
  LOADING_PLACEHOLDER_COLOR: '#f0f2f5',
  // 模糊加载的模糊级别
  BLUR_LEVEL: 10
};

export default {
  PLACEHOLDER_CONFIG,
  LOCAL_PLACEHOLDERS,
  CDN_CONFIG,
  IMAGE_OPTIMIZATION,
  DEFAULT_HOTEL_IMAGES,
  DEFAULT_SCENIC_IMAGE,
  DEFAULT_STRATEGY_COVER
}; 