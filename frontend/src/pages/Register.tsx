import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { message } from 'antd';
import authAPI from '../api/auth';
import './Auth.css';

const Register: React.FC = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    
    const navigate = useNavigate();
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    const validateForm = (): boolean => {
        // 验证用户名长度
        if (formData.username.length < 3) {
            setError('用户名至少需要3个字符');
            return false;
        }
        
        // 验证邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('请输入有效的电子邮箱地址');
            return false;
        }
        
        // 验证密码长度
        if (formData.password.length < 6) {
            setError('密码至少需要6个字符');
            return false;
        }
        
        // 验证两次密码是否一致
        if (formData.password !== formData.confirmPassword) {
            setError('两次输入的密码不一致');
            return false;
        }
        
        return true;
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        // 表单验证
        if (!validateForm()) {
            return;
        }
        
        setLoading(true);
        
        try {
            // 调用注册API
            const response = await authAPI.register({
                username: formData.username,
                email: formData.email,
                password: formData.password,
                confirmPassword: formData.confirmPassword
            });
            
            // 显示成功消息
            message.success('注册成功，请登录');
            
            // 注册成功，跳转到登录页
            navigate('/login');
        } catch (err: any) {
            // 处理错误
            if (err.response) {
                // 服务器返回错误
                switch (err.response.status) {
                    case 400:
                        if (err.response.data.message.includes('username')) {
                            setError('该用户名已被使用');
                        } else if (err.response.data.message.includes('email')) {
                            setError('该邮箱已被注册');
                        } else {
                            setError(err.response.data.message || '注册失败，请检查输入信息');
                        }
                        break;
                    default:
                        setError('注册失败，请稍后再试');
                }
            } else if (err.request) {
                // 请求发送但未收到响应
                setError('服务器无响应，请检查网络连接');
            } else {
                // 请求设置有误
                setError('注册请求异常，请稍后再试');
            }
            console.error('Registration error:', err);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h2>注册</h2>
                    <p>创建一个新账号，开始您的旅行之旅</p>
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
                        <label htmlFor="email">电子邮箱</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="请输入电子邮箱"
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
                    
                    <div className="form-group">
                        <label htmlFor="confirmPassword">确认密码</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            placeholder="请再次输入密码"
                        />
                    </div>
                    
                    <div className="form-agreement">
                        <input type="checkbox" id="agreement" required />
                        <label htmlFor="agreement">
                            我已阅读并同意 <Link to="/terms">服务条款</Link> 和 <Link to="/privacy">隐私政策</Link>
                        </label>
                    </div>
                    
                    <button 
                        type="submit" 
                        className="auth-button" 
                        disabled={loading}
                    >
                        {loading ? '注册中...' : '注册'}
                    </button>
                </form>
                
                <div className="auth-footer">
                    <p>已有账号？ <Link to="/login">立即登录</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Register; 