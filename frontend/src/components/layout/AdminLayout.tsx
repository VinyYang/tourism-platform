import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, message, Button } from 'antd';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
    DashboardOutlined,
    UserOutlined,
    EnvironmentOutlined, // 用于景点
    HomeOutlined,       // 用于酒店
    BookOutlined,       // 用于攻略
    ShoppingCartOutlined, // 用于订单
    SettingOutlined,    // 用于设置
    AppstoreAddOutlined, // 新增：用于精选路线
    CommentOutlined,    // 用于评论
    LogoutOutlined,
    DownOutlined,
    LoginOutlined
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext'; // 导入 AuthContext
import userAPI from '../../api/user'; // 修正导入文件名为 user

const { Header, Content, Sider, Footer } = Layout;

// 定义菜单项类型
interface MenuItem {
    key: string;
    icon?: React.ReactNode;
    label: React.ReactNode;
    children?: MenuItem[];
}

function getItem(label: React.ReactNode, key: string, icon?: React.ReactNode, children?: MenuItem[]): MenuItem {
    return {
        key,
        icon,
        children,
        label,
    } as MenuItem;
}

const AdminLayout: React.FC = () => {
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout, isAuthenticated } = useAuth(); // 使用 AuthContext
    const [username, setUsername] = useState<string>('管理员');
    const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined); // 头像URL

    // 动态生成菜单项
    const menuItems: MenuItem[] = [
        getItem(<Link to="dashboard">仪表盘</Link>, '/admin/dashboard', <DashboardOutlined />),
        getItem('用户管理', '/admin/users', <UserOutlined />),
        getItem('景点管理', '/admin/scenics', <EnvironmentOutlined />),
        getItem('酒店管理', '/admin/hotels', <HomeOutlined />),
        getItem('攻略管理', '/admin/strategies', <BookOutlined />),
        getItem('订单管理', '/admin/orders', <ShoppingCartOutlined />),
        getItem('评论管理', '/admin/reviews', <CommentOutlined />),
        getItem(<Link to="featured-routes">精选管理</Link>, '/admin/featured-routes', <AppstoreAddOutlined />), // <-- 添加项
        getItem('设置', '/admin/settings', <SettingOutlined />),
    ];

    // 获取当前用户信息以显示用户名和头像
    useEffect(() => {
        const fetchUserInfo = async () => {
            if (isAuthenticated && user && user.id) {
                try {
                    const response = await userAPI.getProfile();
                    if (response.status === 200 && response.data) {
                        setUsername(response.data.username || '管理员');
                        // 假设后端返回的头像 URL 在 avatar 字段
                        // 如果 URL 是相对路径，需要拼接成完整 URL
                        if (response.data.avatar && response.data.avatar.startsWith('/uploads')) {
                            setAvatarUrl(`http://localhost:3001${response.data.avatar}`); // 替换为你的后端地址
                        } else {
                            setAvatarUrl(response.data.avatar); // 假设是完整URL
                        }
                    } else {
                        console.warn('获取用户信息失败:', response.status, response.data?.message);
                    }
                } catch (error) {
                    console.error('获取用户信息时出错:', error);
                }
            }
        };

        fetchUserInfo();
    }, [isAuthenticated, user]);


    const handleLogout = () => {
        logout();
        message.success('您已成功退出');
        navigate('/login'); // 退出后跳转到登录页
    };

    // 用户下拉菜单
    const userMenu = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: <Link to="/user">个人中心</Link>,
        },
        {
            key: 'home',
            icon: <HomeOutlined />,
            label: <Link to="/">返回前台</Link>,
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: '退出登录',
            onClick: handleLogout,
        },
    ];

    // 处理菜单点击事件，导航到对应路由
    const handleMenuClick = ({ key }: { key: string }) => {
        navigate(key);
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
                <div style={{ height: '32px', margin: '16px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '6px', textAlign: 'center', lineHeight: '32px', color: 'white', overflow: 'hidden' }}>
                    {collapsed ? '管理' : '后台管理系统'}
                </div>
                <Menu
                    theme="dark"
                    selectedKeys={[location.pathname]} // 根据当前路径高亮菜单
                    mode="inline"
                    items={menuItems}
                    onClick={handleMenuClick} // 添加点击处理
                />
            </Sider>
            <Layout className="site-layout">
                <Header className="site-layout-background" style={{ padding: '0 16px', background: '#fff', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                     {isAuthenticated ? (
                        <Dropdown menu={{ items: userMenu }} trigger={['click']}>
                            <a onClick={e => e.preventDefault()} style={{ display: 'inline-flex', alignItems: 'center' }}>
                                <Avatar src={avatarUrl} icon={<UserOutlined />} style={{ marginRight: 8 }} />
                                <span style={{ marginRight: 4 }}>{username}</span>
                                <DownOutlined />
                            </a>
                        </Dropdown>
                     ) : (
                         <Button type="text" icon={<LoginOutlined />} onClick={() => navigate('/login')}>登录</Button>
                     )}
                </Header>
                <Content style={{ margin: '16px' }}>
                    <div className="site-layout-background" style={{ padding: 24, minHeight: 360, background: '#fff', borderRadius: '8px' }}>
                        {/* 子路由的内容将在这里渲染 */}
                        <Outlet />
                    </div>
                </Content>
                <Footer style={{ textAlign: 'center' }}>
                    旅游信息平台后台管理 ©{new Date().getFullYear()}
                </Footer>
            </Layout>
        </Layout>
    );
};

export default AdminLayout; 