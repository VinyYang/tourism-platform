import axios from 'axios';

// 设置基础URL，明确指向3001端口的后端服务
// 如果.env文件中有配置值则使用配置值，否则使用默认值
const API_PORT = process.env.REACT_APP_API_PORT || '3001';
const BASE_URL = process.env.REACT_APP_API_URL || `http://localhost:${API_PORT}/api/v1`;

// 创建axios实例
const axiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10秒超时
});

// 请求拦截器 - 添加认证token
axiosInstance.interceptors.request.use(
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

// 响应拦截器 - 处理常见错误
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            // 服务器返回错误状态码
            console.error('API Error:', error.response.status, error.response.data);
            
            // 处理401未授权错误，可能需要重新登录
            if (error.response.status === 401) {
                // 可以在这里添加重定向到登录页面的逻辑
                console.warn('未授权，请重新登录');
            }
        } else if (error.request) {
            // 请求已发送但没有收到响应
            console.error('Network Error:', error.request);
        } else {
            // 请求配置出错
            console.error('Request Error:', error.message);
        }
        
        return Promise.reject(error);
    }
);

export default axiosInstance; 