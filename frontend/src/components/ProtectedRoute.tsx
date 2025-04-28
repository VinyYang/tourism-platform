import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: 'user' | 'advisor' | 'admin';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
    children, 
    requiredRole 
}) => {
    const { isAuthenticated, user, loading } = useAuth();
    const location = useLocation();

    // 正在加载认证状态 (由 AuthContext 控制)
    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh' 
            }}>
                <Spin size="large" tip="加载认证信息..." />
                <p style={{ marginTop: '20px', color: '#666' }}>
                    正在加载用户信息，请稍候...
                </p>
            </div>
        );
    }

    // 加载完成但未登录，重定向到登录页面
    if (!isAuthenticated) {
        // 保存当前路径，便于登录后返回
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 如果需要特定角色且用户角色不符
    if (requiredRole && user?.role !== requiredRole) {
        // 可以重定向到统一的无权限页面
        return <Navigate to="/forbidden" replace />;
    }

    // 已登录且角色符合（或不需要特定角色），渲染子组件
    return <>{children}</>;
};

export default ProtectedRoute; 