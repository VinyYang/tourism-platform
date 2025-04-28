import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { message } from 'antd';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Login: React.FC = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    
    const navigate = useNavigate();
    const location = useLocation();
    const { login, isAuthenticated } = useAuth();
    
    // 获取需要重定向的路径
    const getRedirectPath = () => {
        // 从location state中获取from路径
        const fromPath = location.state?.from?.pathname;
        
        // 从URL参数中获取return路径
        const searchParams = new URLSearchParams(location.search);
        const returnPath = searchParams.get('return');
        
        // 优先使用URL参数中的return路径，其次是state中的from路径，最后默认为首页
        return returnPath ? decodeURIComponent(returnPath) : (fromPath || '/');
    };
    
    // 如果用户已登录，直接重定向
    useEffect(() => {
        if (isAuthenticated) {
            const redirectPath = getRedirectPath();
            navigate(redirectPath, { replace: true });
        }
    }, [isAuthenticated, navigate, location]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        try {
            // 使用AuthContext的login方法
            await login(formData.username, formData.password);
            
            // 显示成功消息
            message.success('登录成功');
            
            // 重定向到相应页面
            const redirectPath = getRedirectPath();
            navigate(redirectPath, { replace: true });
        } catch (err: any) {
            // 处理错误
            if (err.response) {
                // 服务器返回错误
                switch (err.response.status) {
                    case 400:
                    case 401:
                        setError('用户名或密码错误');
                        break;
                    case 403:
                        setError('账号已被禁用，请联系管理员');
                        break;
                    default:
                        setError('登录失败，请稍后再试');
                }
            } else if (err.request) {
                // 请求发送但未收到响应
                setError('服务器无响应，请检查网络连接');
            } else {
                // 请求设置有误
                setError('登录请求异常，请稍后再试');
            }
            console.error('登录错误:', err);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h2>登录</h2>
                    <p>欢迎回来，请登录您的账号</p>
                </div>
                
                {error && <div className="auth-error">{error}</div>}
                
                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="username">用户名</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            placeholder="请输入用户名"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="password">密码</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder="请输入密码"
                        />
                    </div>
                    
                    <div className="form-options">
                        <div className="remember-me">
                            <input type="checkbox" id="remember" />
                            <label htmlFor="remember">记住我</label>
                        </div>
                        <Link to="/forgot-password" className="forgot-password">忘记密码？</Link>
                    </div>
                    
                    <button 
                        type="submit" 
                        className="auth-button" 
                        disabled={loading}
                    >
                        {loading ? '登录中...' : '登录'}
                    </button>
                </form>
                
                <div className="auth-footer">
                    <p>还没有账号？ <Link to="/register">立即注册</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Login;

 