import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, message, Avatar, Dropdown } from 'antd';
import { 
    MenuUnfoldOutlined, 
    MenuFoldOutlined, 
    UserOutlined, 
    HomeOutlined,
    TeamOutlined,
    ShopOutlined,
    FileTextOutlined,
    ShoppingCartOutlined,
    SettingOutlined,
    LogoutOutlined,
    DashboardOutlined,
    PieChartOutlined,
    CommentOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation, Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AdminLayout.css';

const { Header, Sider, Content } = Layout;

interface AdminLayoutProps {
    children?: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = () => {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, user, logout } = useAuth();

    // 验证用户是否有管理员权限
    useEffect(() => {
        // 如果用户未登录或不是管理员，重定向到登录页面
        if (!isAuthenticated) {
            message.warning('请先登录');
            navigate('/login', { state: { from: location.pathname } });
        } else if (user && user.role !== 'admin') {
            message.error('您没有管理员权限');
            navigate('/forbidden');
        }
    }, [isAuthenticated, user, navigate, location.pathname]);

    // 菜单项
    const menuItems = [
        {
            key: '/admin',
            icon: <DashboardOutlined />,
            label: '控制面板',
        },
        {
            key: '/admin/users',
            icon: <TeamOutlined />,
            label: '用户管理',
        },
        {
            key: '/admin/scenics',
            icon: <ShopOutlined />,
            label: '景点管理',
        },
        {
            key: '/admin/hotels',
            icon: <HomeOutlined />,
            label: '酒店管理',
        },
        {
            key: '/admin/orders',
            icon: <ShoppingCartOutlined />,
            label: '订单管理',
        },
        {
            key: '/admin/strategies',
            icon: <FileTextOutlined />,
            label: '攻略管理',
        },
        {
            key: '/admin/comments',
            icon: <CommentOutlined />,
            label: '评论管理',
        },
    ];

    // 处理菜单点击事件
    const handleMenuClick = (info: { key: string }) => {
        navigate(info.key);
    };

    // 用户菜单选项
    const userMenuItems = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: <Link to="/user/profile">个人中心</Link>
        },
        {
            key: 'home',
            icon: <HomeOutlined />,
            label: <Link to="/">返回前台</Link>
        },
        {
            type: 'divider' as const
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: '退出登录',
            danger: true,
            onClick: () => {
                logout();
                navigate('/login');
                message.success('已退出登录');
            }
        }
    ];

    // 如果正在验证用户权限，不渲染内容
    if (!isAuthenticated || (user && user.role !== 'admin')) {
        return null;
    }

    return (
        <Layout className="admin-layout">
            <Sider 
                trigger={null} 
                collapsible 
                collapsed={collapsed}
                className="admin-sider"
            >
                <div className="admin-logo">
                    {collapsed ? '游管' : '旅游管理系统'}
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    onClick={handleMenuClick}
                    items={menuItems}
                />
            </Sider>
            <Layout className="admin-content-layout">
                <Header className="admin-header">
                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                        className="toggle-button"
                    />
                    <div className="admin-header-right">
                        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                            <div className="admin-user-info">
                                <Avatar 
                                    icon={<UserOutlined />}
                                    src={user?.avatar}
                                    className="admin-avatar"
                                />
                                {!collapsed && <span className="admin-username">{user?.username || '管理员'}</span>}
                            </div>
                        </Dropdown>
                    </div>
                </Header>
                <Content className="admin-content">
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};

export default AdminLayout; 