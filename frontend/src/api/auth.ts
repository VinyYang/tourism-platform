import api from './config';

export interface LoginRequest {
    username: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    token: string;
    password: string;
    confirmPassword: string;
}

export interface AuthResponse {
    token: string;
    user: {
        id: number;
        username: string;
        email: string;
        role: 'user' | 'advisor' | 'admin';
        avatar?: string;
    };
}

// 认证API
const authAPI = {
    // 用户登录
    login: (data: LoginRequest) => 
        api.post<AuthResponse>('/auth/login', data),
    
    // 用户注册
    register: (data: RegisterRequest) => 
        api.post<AuthResponse>('/auth/register', data),
    
    // 忘记密码
    forgotPassword: (data: ForgotPasswordRequest) => 
        api.post('/auth/forgot-password', data),
    
    // 重置密码
    resetPassword: (data: ResetPasswordRequest) => 
        api.post('/auth/reset-password', data),
    
    // 验证token
    validateToken: (token: string) => 
        api.get('/auth/validate-token', {
            headers: { Authorization: `Bearer ${token}` }
        }),
    
    // 刷新token
    refreshToken: (token: string) => 
        api.post('/auth/refresh-token', {}, {
            headers: { Authorization: `Bearer ${token}` }
        }),
    
    // 检查用户名是否可用
    checkUsername: (username: string) => 
        api.get(`/auth/check-username?username=${username}`),
    
    // 检查邮箱是否可用
    checkEmail: (email: string) => 
        api.get(`/auth/check-email?email=${email}`)
};

export default authAPI; 