/**
 * 全局声明文件
 * 用于声明window对象上的自定义属性
 */

interface Window {
  /**
   * API测试状态标记，用于避免重复测试API连通性
   */
  _apiTestDone?: boolean;
} 