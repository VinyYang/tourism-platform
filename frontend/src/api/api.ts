import axios from 'axios';

// 创建API基础URL
const BASE_URL = process.env.REACT_APP_API_URL || '/api';

// 创建axios实例
export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10秒超时
});

// 请求拦截器 - 添加认证token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器 - 统一错误处理
api.interceptors.response.use(
  response => response,
  error => {
    // 可在此处添加全局错误处理
    return Promise.reject(error);
  }
);

export default api; 