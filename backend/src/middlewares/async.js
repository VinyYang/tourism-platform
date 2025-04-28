/**
 * 异步处理中间件
 * 包装异步控制器函数，统一处理错误
 * @param {Function} fn - 异步控制器函数
 * @returns {Function} - Express中间件函数
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler; 