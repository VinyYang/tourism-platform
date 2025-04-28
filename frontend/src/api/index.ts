/**
 * API模块集中导出
 * 方便在应用中统一引入
 */

// 导入各个API模块
import authAPI from './auth';
import strategyAPI from './strategy';
import reviewAPI from './review';
import scenicAPI from './scenic';
import hotelAPI from './hotel';
import orderAPI from './order';
import userAPI from './user';
import bookingAPI from './booking';
import itineraryAPI from './itinerary';
import transportAPI from './transport';
import adminAPI from './admin';

// 统一导出
export {
  authAPI,
  strategyAPI,
  reviewAPI,
  scenicAPI,
  hotelAPI,
  orderAPI,
  userAPI,
  bookingAPI,
  itineraryAPI,
  transportAPI,
  adminAPI
};

// 为了兼容现有代码中的别名导入
export {
  strategyAPI as commentAPI, // 临时兼容
};

// 默认导出所有API
export default {
  authAPI,
  strategyAPI,
  reviewAPI,
  scenicAPI,
  hotelAPI,
  orderAPI,
  userAPI,
  bookingAPI,
  itineraryAPI,
  transportAPI,
  adminAPI
}; 