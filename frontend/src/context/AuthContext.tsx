import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { message } from 'antd';
import authAPI from '../api/auth';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // 需要安装这个依赖: npm install jwt-decode

interface User {
    id: number;
    username: string;
    email: string;
    role: 'user' | 'advisor' | 'admin';
    avatar?: string;
    phone?: string; // 添加可选的 phone 属性
}

interface JwtPayload {
    id: number;
    role: string;
    exp: number; // 过期时间
    iat: number; // 签发时间
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    loading: boolean;
    login: (username: string, password: string) => Promise<any>;
    register: (username: string, email: string, password: string, confirmPassword: string) => Promise<void>;
    logout: () => void;
    checkAuthStatus: () => Promise<boolean>;
    refreshTokenIfNeeded: () => Promise<boolean>; // 新增方法
    updateUserContext: (updatedUserData: Partial<User>) => void; // 添加 updateUserContext 签名
}

interface AuthProviderProps {
    children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const navigate = useNavigate();

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

    // 新增：刷新token的方法
    const refreshTokenIfNeeded = async (): Promise<boolean> => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                return false;
            }

            // 检查token是否接近过期
            if (isTokenExpiring(token)) {
                console.log('Token即将过期，尝试刷新');
                
                // 调用刷新token的API
                const response = await authAPI.refreshToken(token);
                
                if (response.data && response.data.token) {
                    // 更新存储的token
                    localStorage.setItem('token', response.data.token);
                    // 可选：更新用户信息
                    if (response.data.user) {
                        localStorage.setItem('user', JSON.stringify(response.data.user));
                        setUser(response.data.user);
                    }
                    console.log('Token刷新成功');
                    return true;
                }
            }
            
            // token还有效，不需要刷新
            return true;
        } catch (error) {
            console.error('刷新token失败:', error);
            // 如果刷新失败，可能需要用户重新登录
            return false;
        }
    };

    // 检查用户认证状态的函数
    const checkAuthStatus = async (): Promise<boolean> => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.log('本地没有存储token，用户未登录');
                return false;
            }

            // 检查token格式是否正确
            if (token.split('.').length !== 3) {
                console.error('Token格式无效');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setUser(null);
                setIsAuthenticated(false);
                return false;
            }

            // 可选：如果token即将过期，尝试刷新
            if (isTokenExpiring(token)) {
                const refreshed = await refreshTokenIfNeeded();
                if (!refreshed) {
                    console.log('Token刷新失败，需要重新登录');
                    return false;
                }
            }

            // 验证token有效性
            console.log('验证token有效性');
            const response = await authAPI.validateToken(token);
            
            // 如果服务器验证成功
            if (response.data && response.data.valid) {
                // 获取本地存储的用户信息，如果没有则使用响应中的用户信息
                const storedUser = localStorage.getItem('user');
                const userInfo = storedUser ? JSON.parse(storedUser) : response.data.user;
                
                // 设置用户和认证状态
                setUser(userInfo);
                setIsAuthenticated(true);
                console.log('Token验证成功，用户已登录');
                return true;
            } else {
                // 清除无效的认证信息
                console.error('服务器验证token无效');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setUser(null);
                setIsAuthenticated(false);
                return false;
            }
        } catch (error) {
            console.error('验证token时出错:', error);
            // 清除无效的认证信息
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            setIsAuthenticated(false);
            return false;
        }
    };

    // 初始化: 检查本地存储中是否有token
    useEffect(() => {
        const initAuth = async () => {
            try {
                await checkAuthStatus();
            } catch (error) {
                console.error('初始化认证状态时出错:', error);
                // 确保在出错时用户处于未认证状态
                setIsAuthenticated(false);
                setUser(null);
            } finally {
                // 无论结果如何，都标记加载完成
                setLoading(false);
            }
        };
        
        initAuth();
    }, []);

    // 登录函数
    const login = async (username: string, password: string) => {
        try {
            setLoading(true);
            const response = await authAPI.login({ username, password });
            
            // 保存token和用户信息
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            
            // 更新状态
            setUser(response.data.user);
            setIsAuthenticated(true);
            
            message.success('登录成功');
            return response.data;
        } catch (error: any) {
            // 更详细的错误处理
            const errorMessage = error?.response?.data?.message || '登录失败，请检查网络连接';
            message.error(errorMessage);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // 注册函数
    const register = async (username: string, email: string, password: string, confirmPassword: string) => {
        try {
            setLoading(true);
            await authAPI.register({ username, email, password, confirmPassword });
            message.success('注册成功，请登录');
        } catch (error: any) {
            // 更详细的错误处理
            const errorMessage = error?.response?.data?.message || '注册失败，请检查网络连接';
            message.error(errorMessage);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // 统一的登出函数
    const logout = () => {
        // 清除本地存储
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // 更新状态
        setUser(null);
        setIsAuthenticated(false);
        
        // 显示消息
        message.success('已退出登录');
        
        // 重定向到登录页
        navigate('/login');
    };

    // 实现 updateUserContext 函数
    const updateUserContext = (updatedUserData: Partial<User>) => {
        setUser((prevUser) => {
            if (!prevUser) return null; // 如果之前没有用户信息，则不更新
            // 确保更新的数据也符合 User 类型
            const newUser: User = { 
                ...prevUser, 
                ...updatedUserData 
            };
            // 更新 localStorage
            localStorage.setItem('user', JSON.stringify(newUser));
            return newUser;
        });
    };

    const value = {
        isAuthenticated,
        user,
        loading,
        login,
        register,
        logout,
        checkAuthStatus,
        refreshTokenIfNeeded,
        updateUserContext // 将 updateUserContext 添加到 context 值中
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext; 