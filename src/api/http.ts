import axios from 'axios';

// 创建axios实例
const http = axios.create({
  baseURL: '/api/v1', // 基础URL
  timeout: 10000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
http.interceptors.request.use(
  (config) => {
    // 从localStorage获取token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
http.interceptors.response.use(
  (response) => {
    // 直接返回数据
    return response;
  },
  (error) => {
    if (error.response) {
      // 处理401未授权
      if (error.response.status === 401) {
        console.error('用户认证失败，请重新登录');
        // 清除token并跳转到登录页
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      
      // 处理其他错误
      if (error.response.data && error.response.data.message) {
        console.error(`请求错误: ${error.response.data.message}`);
      }
    } else if (error.request) {
      console.error('无法连接到服务器，请检查网络连接');
    } else {
      console.error(`请求过程中出现错误: ${error.message}`);
    }
    return Promise.reject(error);
  }
);

export default http; 