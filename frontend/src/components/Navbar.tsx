import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Dropdown, Avatar, Badge, Button, Tooltip, message } from 'antd';
import { 
    UserOutlined, DownOutlined, LoginOutlined, UserAddOutlined,
    SettingOutlined, LogoutOutlined, HeartOutlined, FileTextOutlined,
    BellOutlined, CompassOutlined, AppstoreOutlined, BookOutlined,
    FireOutlined, HistoryOutlined, TeamOutlined, BankOutlined,
    QuestionCircleOutlined, MenuOutlined, MoreOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import './Navbar.css';

const Navbar: React.FC = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const { hasUnreadNotifications, markAllAsRead } = useNotifications();
    const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
    const [showMoreMenu, setShowMoreMenu] = useState<boolean>(false);
    const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 992);
    const navigate = useNavigate();
    const location = useLocation();
    const moreMenuRef = useRef<HTMLDivElement>(null);

    // 监听窗口大小变化
    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        if (typeof window !== 'undefined') {
            setWindowWidth(window.innerWidth);
            window.addEventListener('resize', handleResize);
        }

        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('resize', handleResize);
            }
        };
    }, []);
    
    // 监听点击事件，点击外部区域时关闭更多菜单
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
                setShowMoreMenu(false);
            }
        };

        if (typeof document !== 'undefined') {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            if (typeof document !== 'undefined') {
                document.removeEventListener('mousedown', handleClickOutside);
            }
        };
    }, []);

    // 关闭移动菜单（如果点击了导航链接）
    const handleNavLinkClick = () => {
        setMobileMenuOpen(false);
        setShowMoreMenu(false);
    };

    // 判断是否显示更多菜单按钮
    const shouldShowMoreMenu = () => {
        return windowWidth < 992;
    };

    // 处理退出登录
    const handleLogout = () => {
        logout();
        navigate('/');
        message.success('您已成功退出登录');
    };

    // 处理登录按钮点击
    const handleLoginClick = () => {
        // 记录当前页面路径，便于登录后返回
        navigate('/login', { state: { from: location.pathname } });
    };

    // 新增 - 处理创建行程按钮
    const handleCreateItinerary = () => {
        if (!isAuthenticated) {
            message.warning('请先登录');
            navigate('/login', { state: { from: '/itineraries/create' } });
            return;
        }
        navigate('/itineraries/create');
        setMobileMenuOpen(false);
    };

    // 新增 - 处理创建攻略按钮
    const handleCreateStrategy = () => {
        if (!isAuthenticated) {
            message.warning('请先登录');
            navigate('/login', { state: { from: '/strategies/create' } });
            return;
        }
        navigate('/strategies/create');
        setMobileMenuOpen(false);
    };

    // 处理通知图标点击
    const handleNotificationClick = () => {
        // 标记所有通知为已读
        markAllAsRead();
        navigate('/notifications');
    };

    // 用户下拉菜单
    const userMenuItems = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: '个人中心',
            onClick: () => navigate('/user')
        },
        {
            key: 'cultural-dna',
            icon: <QuestionCircleOutlined />,
            label: '文化基因检测',
            onClick: () => navigate('/cultural-dna')
        },
        {
            key: 'orders',
            icon: <FileTextOutlined />,
            label: '我的订单',
            onClick: () => navigate('/user?tab=orders')
        },
        {
            key: 'favorites',
            icon: <HeartOutlined />,
            label: '我的收藏',
            onClick: () => navigate('/user?tab=favorites')
        },
        {
            key: 'itineraries',
            icon: <CompassOutlined />,
            label: '我的行程',
            onClick: () => navigate('/itineraries')
        },
        {
            key: 'strategies',
            icon: <AppstoreOutlined />,
            label: '我的攻略',
            onClick: () => navigate('/strategies')
        },
        // 新增：后台管理入口，仅管理员可见
        ...(user?.role === 'admin' ? [{
            key: 'admin-panel',
            icon: <SettingOutlined />,
            label: '后台管理',
            onClick: () => navigate('/admin')
        }] : []),
        // 使用标准分隔符，只有type属性
        { type: 'divider' as const },
        {
            key: 'settings',
            icon: <SettingOutlined />,
            label: '账号设置',
            onClick: () => navigate('/user?tab=settings')
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: '退出登录',
            danger: true,
            onClick: handleLogout
        }
    ];

    // 主导航菜单项 - 全部水平显示
    const navItems = [
        { path: '/', label: '首页' },
        { path: '/scenic', label: '景点' },
        { path: '/strategies', label: '文化攻略' },
        { path: '/hotels', label: '住宿' },
        { path: '/transport-map', label: '交通' },
        { path: '/itineraries', label: '文化路线' },
        { path: '/price-report', label: '价格分析' },
    ];

    return (
        <nav className="navbar">
            <div className="navbar-container">
                {/* Logo 区域 */}
                <div className="navbar-logo">
                    <NavLink to="/">文化旅游体验平台</NavLink>
                </div>
                
                {/* 移动端菜单按钮 */}
                <div 
                    className={`mobile-menu-toggle ${mobileMenuOpen ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                
                {/* 主导航菜单 */}
                <ul className={`navbar-menu ${mobileMenuOpen ? 'active' : ''}`}>
                    {/* 所有导航项水平排列 */}
                    {navItems.map(item => (
                        <li key={item.path} className="navbar-item">
                            <NavLink 
                                to={item.path}
                                className={({isActive}) => isActive ? 'active' : ''}
                                onClick={handleNavLinkClick}
                            >
                                {item.label}
                            </NavLink>
                        </li>
                    ))}
                    {/* Plan Step 6 & 7: Add Create Itinerary Button */}
                    <li key="create-itinerary-button" className="navbar-item">
                        <Tooltip title="创建文化路线">
                            <Button 
                                type="primary" 
                                icon={<CompassOutlined />}
                                onClick={handleCreateItinerary}
                                size="small"
                            >
                                创建路线
                            </Button>
                        </Tooltip>
                    </li>
                    {/* Plan Step 8 & 9: Add Create Strategy Button */}
                    <li key="create-strategy-button" className="navbar-item">
                        <Tooltip title="写文化攻略">
                            <Button
                                icon={<AppstoreOutlined />}
                                onClick={handleCreateStrategy}
                                size="small"
                            >
                                写攻略
                            </Button>
                        </Tooltip>
                    </li>
                </ul>
                
                {/* 用户认证/信息区域 */}
                <div className="navbar-auth">
                    {isAuthenticated ? (
                        <div className="user-info">
                            {/* 通知图标 - 只有在有未读通知时才显示红点 */}
                            <Badge dot={hasUnreadNotifications} offset={[-2, 3]} className="notification-badge">
                                <BellOutlined 
                                    className="notification-icon" 
                                    onClick={handleNotificationClick}
                                />
                            </Badge>
                            
                            <Dropdown
                                menu={{ items: userMenuItems }}
                                trigger={['click']}
                                placement="bottomRight"
                                overlayClassName="user-dropdown-menu"
                            >
                                <div className="user-avatar-container">
                                    {user?.avatar ? (
                                        <div 
                                            className="user-avatar-custom"
                                            style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '50%',
                                                backgroundImage: `url(${user.avatar})`,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                                border: '2px solid #f0f0f0',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0
                                            }}
                                        />
                                    ) : (
                                        <div 
                                            className="user-avatar-custom"
                                            style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '50%',
                                                backgroundColor: '#e6f7ff',
                                                color: '#1890ff',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: '2px solid #f0f0f0',
                                                flexShrink: 0
                                            }}
                                        >
                                            <UserOutlined />
                                        </div>
                                    )}
                                    <span className="user-name">{user?.username || '用户'}</span>
                                    <DownOutlined className="dropdown-icon" />
                                </div>
                            </Dropdown>
                        </div>
                    ) : (
                        <div className="auth-buttons">
                            <Button 
                                icon={<LoginOutlined />} 
                                type="default"
                                size="small"
                                onClick={handleLoginClick}
                            >
                                登录
                            </Button>
                            <Button 
                                icon={<UserAddOutlined />}
                                type="primary"
                                size="small"
                                onClick={() => navigate('/register')}
                            >
                                注册
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar; 