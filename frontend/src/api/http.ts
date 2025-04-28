import axios from 'axios';

// 设置基础URL，明确指向3001端口的后端服务
// 如果.env文件中有配置值则使用配置值，否则使用默认值
const API_PORT = process.env.REACT_APP_API_PORT || '3001';
const BASE_URL = process.env.REACT_APP_API_URL || `http://localhost:${API_PORT}/api/v1`;

// 创建axios实例
const http = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10秒超时
});

// 请求拦截器 - 添加认证token
http.interceptors.request.use(
    (config) => {
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

// 响应拦截器 - 处理错误
http.interceptors.response.use(
    (response) => response.data,
    (error) => {
        console.error('API请求错误:', error);
        return Promise.reject(error);
    }
);

export default http; 