import axios from 'axios';
import { message } from 'antd';
import { jwtDecode } from 'jwt-decode';

// JWT载荷接口定义
interface JwtPayload {
    id: number;
    role: string;
    exp: number; // 过期时间戳
    iat: number; // 签发时间戳
}

// 统一的API配置
export const API_PORT = process.env.REACT_APP_API_PORT || '3001';
export const BASE_URL = process.env.REACT_APP_API_URL || `http://localhost:${API_PORT}/api/v1`;

// 创建统一的axios实例
const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000, // 15秒超时
    withCredentials: false, // 确保跨域请求不发送凭证
});

// 调试开关，控制是否打印API请求详情
const DEBUG = process.env.NODE_ENV === 'development';

// 检查token是否接近过期 (提前5分钟刷新)
const isTokenExpiring = (token: string): boolean => {
    try {
        const decoded = jwtDecode<JwtPayload>(token);
        const currentTime = Date.now() / 1000;
        // 如果token将在5分钟内过期，就认为它即将过期
        return decoded.exp - currentTime < 300;
    } catch (error) {
        console.error('解析token失败:', error);
        return true; // 解析出错，认为token已过期
    }
};

// 尝试刷新token
const refreshToken = async (token: string): Promise<string | null> => {
    try {
        if (DEBUG) {
            console.log('尝试刷新token');
        }
        const response = await axios.post(`${BASE_URL}/auth/refresh-token`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data && response.data.token) {
            if (DEBUG) {
                console.log('token刷新成功');
            }
            // 保存新token
            localStorage.setItem('token', response.data.token);
            // 可选：更新用户信息
            if (response.data.user) {
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }
            return response.data.token;
        }
        return null;
    } catch (error) {
        if (DEBUG) {
            console.error('刷新token失败:', error);
        }
        return null;
    }
};

// 请求拦截器
api.interceptors.request.use(
    async (config) => {
        const token = localStorage.getItem('token');
        
        if (token) {
            // 检查token长度，如果过大则尝试重新登录或提示用户
            if (token.length > 4000) { // 设置一个合理的最大长度限制
                console.error('Token 长度异常 (' + token.length + ' 字符)，可能导致请求头过大');
                message.error('登录令牌异常，请重新登录');
                // 清除当前 token
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                // If token is too long, don't attach it, regardless of the URL
                return config;
            }
            
            // 统一为所有请求添加Authorization头，不再特殊处理精选路线
            // 检查token是否即将过期
            if (isTokenExpiring(token)) {
                if (DEBUG) {
                    console.log('Token即将过期，尝试刷新');
                }
                const newToken = await refreshToken(token);
                if (newToken) {
                    config.headers.Authorization = `Bearer ${newToken}`;
                } else {
                    // If refresh fails, still attach the old token (unless it's invalid)
                    config.headers.Authorization = `Bearer ${token}`;
                }
            } else {
                // Attach token for non-expiring cases
                // Added check to ensure it's not a static asset, though this might be redundant now
                if (!config.url?.endsWith('.ico') && 
                    !config.url?.endsWith('.png') && 
                    !config.url?.endsWith('.jpg') && 
                    !config.url?.endsWith('.css') && 
                    !config.url?.endsWith('.js')) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            }
            
            // 检查token格式是否有效
            if (token.split('.').length !== 3) {
                console.error('警告：无效的token格式!');
            }

            // 检查token长度是否异常
            if (token.length > 1000) {
                console.warn('Token长度异常，可能导致请求头过大:', token.length);
            }
        }

        // 开发环境下打印请求详情
        if (DEBUG) {
            console.log(`🚀 发送请求: ${config.method?.toUpperCase()} ${config.url}`);
            if (config.params) {
                console.log('📝 参数:', config.params);
            }
            if (config.data) {
                console.log('📦 数据:', config.data);
            }
            // 打印token信息（部分展示）
            if (token) {
                const firstPart = token.length > 20 ? token.substring(0, 15) + '...' : token;
                console.log('🔑 带有token的请求:', firstPart);
            } else {
                console.log('⚠️ 无token请求');
            }
        }

        return config;
    },
    (error) => {
        console.error('请求错误:', error);
        return Promise.reject(error);
    }
);

// 响应拦截器
api.interceptors.response.use(
    (response) => {
        // 开发环境下打印响应详情
        if (DEBUG) {
            console.log(`✅ 收到响应: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.status);
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        const currentPath = window.location.pathname;
        
        // 开发环境下打印错误详情
        if (DEBUG) {
            console.error(`❌ 请求失败: ${originalRequest.method?.toUpperCase()} ${originalRequest.url}`, 
                error.response?.status, error.message);
        }
        
        // 处理401错误（未授权/token过期）
        if (error.response?.status === 401) {
            // 清除本地存储的认证信息
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // 排除登录相关页面，避免重定向循环
            const authPages = ['/login', '/register', '/forgot-password', '/reset-password'];
            if (!authPages.some(page => currentPath.startsWith(page))) {
                message.error('登录已过期或未授权，请重新登录');
                
                // 保存当前路径，便于登录后重定向回来
                const returnPath = encodeURIComponent(window.location.pathname + window.location.search);
                window.location.href = `/login?return=${returnPath}`;
            }
            return Promise.reject(error);
        }
        
        // 处理403错误（权限不足）
        if (error.response?.status === 403) {
            message.error('您没有访问该资源的权限');
            // 可以重定向到无权限页面
            // window.location.href = '/forbidden';
            return Promise.reject(error);
        }
        
        // 处理404错误（资源不存在）
        if (error.response?.status === 404) {
            message.error('请求的资源不存在');
            return Promise.reject(error);
        }
        
        // 处理500错误（服务器错误）
        if (error.response?.status >= 500) {
            message.error('服务器错误，请稍后再试');
            return Promise.reject(error);
        }
        
        // 处理网络错误
        if (error.message.includes('Network Error') && !originalRequest._retry) {
            originalRequest._retry = true;
            
            // 尝试切换端口
            const currentPort = originalRequest.baseURL?.includes('3000') ? '3000' : '3001';
            const newPort = currentPort === '3000' ? '3001' : '3000';
            const newBaseURL = `http://localhost:${newPort}/api/v1`;
            
            try {
                // 测试新端口是否可用
                await axios.get(`${newBaseURL}/health`, { timeout: 5000 });
                
                // 更新baseURL并重试请求
                api.defaults.baseURL = newBaseURL;
                console.log(`⚠️ 端口切换: ${currentPort} -> ${newPort}`);
                return api(originalRequest);
            } catch (retryError) {
                console.error('备用端口也无法访问:', retryError);
                message.error('服务器连接失败，请检查网络或服务器状态');
                throw error;
            }
        }
        
        return Promise.reject(error);
    }
);

export default api; 