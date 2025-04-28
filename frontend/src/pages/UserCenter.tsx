import React, { useState, useEffect, FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { message, Modal, Upload, Button, Pagination, Spin, Empty, Tag, Popconfirm, Switch, Select, Card, Typography, Input } from 'antd';
import { UploadOutlined, ExclamationCircleOutlined, SettingOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import userAPI from '../api/user';
import { Booking, PaginationInfo } from '../api/order';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import ReviewModal from '../components/ReviewModal';
import OrderCard from '../components/OrderCard';
import OrderTimeline from '../components/OrderTimeline';
import './UserCenter.css';

// 定义类型
interface User {
    id: number;
    username: string;
    email: string;
    avatar: string;
    phone: string;
}

interface FavoriteItem {
    id: number;
    type: 'scenic' | 'hotel' | 'strategy';
    title: string;
    image: string;
    description: string;
}

// 标签类型
type TabType = 'profile' | 'orders' | 'favorites' | 'settings';

// 在组件外部或者组件内部定义订单筛选器类型
type OrderFilterType = 'all' | 'pending' | 'processing' | 'confirmed' | 'completed' | 'cancelled' | 'refunding' | 'refunded';

const { Title, Text } = Typography;
const { Option } = Select;

const UserCenter: React.FC = () => {
    const location = useLocation();
    const { t } = useTranslation();
    const { theme, toggleTheme } = useTheme();
    const { language, changeLanguage } = useLanguage();
    const { user: contextUser, updateUserContext } = useAuth();

    // 从URL查询参数获取活动标签
    const queryParams = new URLSearchParams(location.search);
    const tabFromQuery = queryParams.get('tab') as TabType | null;
    
    // 状态管理
    const [loading, setLoading] = useState<boolean>(true);
    const [loadingOrders, setLoadingOrders] = useState<boolean>(false);
    const [loadingFavorites, setLoadingFavorites] = useState<boolean>(false);
    const [loadingAction, setLoadingAction] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<TabType>(() => {
        const initialTab = tabFromQuery === 'orders' ? 'orders' :
                           tabFromQuery === 'favorites' ? 'favorites' :
                           tabFromQuery === 'settings' ? 'settings' :
                           'profile';
        return initialTab;
    });
    const [orders, setOrders] = useState<Booking[]>([]);
    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
    const [orderFilter, setOrderFilter] = useState<OrderFilterType>('all');
    
    // 表单状态
    const [formData, setFormData] = useState({
        email: '',
        phone: ''
    });
    
    // 密码修改表单状态
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    
    // 密码修改模态框状态
    const [passwordModalVisible, setPasswordModalVisible] = useState(false);
    
    // 头像 URL 输入状态
    const [avatarUrlInput, setAvatarUrlInput] = useState<string>('');
    
    // 分页状态
    const [orderPagination, setOrderPagination] = useState<PaginationInfo>({
        currentPage: 1,
        itemsPerPage: 5,
        totalItems: 0,
        totalPages: 1,
    });
    
    const [favoritesPagination, setFavoritesPagination] = useState({
        current: 1,
        pageSize: 6,
        total: 0
    });
    
    // 错误状态
    const [error, setError] = useState<string | null>(null);
    const [orderError, setOrderError] = useState<string | null>(null);
    const [favoriteError, setFavoriteError] = useState<string | null>(null);
    
    // 新增评价相关状态
    const [reviewModalVisible, setReviewModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<{id: string | number, title: string} | null>(null);
    
    // 获取用户资料的函数
    const fetchUserProfile = async () => {
        try {
            const profileResponse = await userAPI.getProfile();
            const apiData = profileResponse.data;
            
            console.log('获取到用户资料:', apiData);
            
            // 更新表单数据
            setFormData({
                email: apiData.email || '',
                phone: apiData.phone || ''
            });
            
            console.log('设置表单数据:', {
                email: apiData.email || '',
                phone: apiData.phone || ''
            });
            
            // 初始化头像输入框的值，优先使用 context 的值，其次是 API 返回值
            setAvatarUrlInput(contextUser?.avatar || apiData.avatar || '');

        } catch (err) {
            console.error('获取用户资料失败', err);
            setError('获取用户资料失败，请稍后重试');
        }
    };
    
    // 获取订单列表的函数
    const fetchUserOrders = async (page = 1, limitValue = 5) => {
        setLoadingOrders(true);
        setOrderError(null);
        try {
            // 调用 userAPI.getOrders，传递参数对象 { page, limit }
            console.log(`[UserCenter] fetchUserOrders: Fetching page ${page} with limit ${limitValue}`);
            const ordersResponse = await userAPI.getOrders({ page, limit: limitValue });
            
            console.log('[UserCenter] fetchUserOrders: Raw API response:', ordersResponse);

            // 假设 userAPI.getOrders 返回 { data: { orders: [], total: number, page: number, totalPages: number } }
            if (ordersResponse.data && ordersResponse.data.orders && ordersResponse.data.total !== undefined) {
                console.log('[UserCenter] fetchUserOrders: Received valid orders data', ordersResponse.data);
                
                // 格式化订单数据，确保所有必要属性都存在
                // 使用显式 any 类型来避免严格类型检查错误
                const formattedOrders = ordersResponse.data.orders.map((order: any) => {
                    // 创建返回对象，确保每个字段都有默认值
                    const bookingId = order.booking_id || (order.id ? Number(order.id) : 0);
                    const totalPrice = order.total_price || (order.totalAmount ? Number(order.totalAmount) : 0);
                    
                    return {
                        ...order,
                        // 确保关键字段都有默认值
                        booking_id: bookingId,
                        status: order.status || 'pending',
                        booking_type: order.booking_type || 'unknown',
                        Scenic: order.Scenic || null,
                        Hotel: order.Hotel || null,
                        total_price: totalPrice,
                        timeline: order.timeline || []
                    };
                });
                
                console.log('[UserCenter] fetchUserOrders: Formatted orders:', formattedOrders);
                setOrders(formattedOrders);
                
                // 适配后端可能不同的分页字段名
                const backendPagination = ordersResponse.data;
                const pagination: PaginationInfo = {
                    currentPage: backendPagination.page,
                    totalPages: backendPagination.totalPages,
                    totalItems: backendPagination.total,
                    // Keep both pageSize and itemsPerPage for compatibility if needed, but prioritize backend value if available
                    pageSize: backendPagination.limit || limitValue, // Use backend limit if provided
                    itemsPerPage: backendPagination.limit || limitValue,
                };
                console.log('[UserCenter] fetchUserOrders: Updating pagination state', pagination);
                setOrderPagination(pagination);
            } else {
                console.error('[UserCenter] fetchUserOrders: Invalid order data format:', ordersResponse);
                message.error('获取订单数据失败: 返回格式错误');
                setOrders([]);
                // Reset pagination with the requested limitValue
                setOrderPagination(prev => ({
                     ...prev, 
                     currentPage: 1, 
                     totalItems: 0, 
                     totalPages: 1, 
                     pageSize: limitValue, 
                     itemsPerPage: limitValue 
                }));
            }
            
        } catch (err: any) {
            console.error('[UserCenter] fetchUserOrders: Error fetching orders', err);
            if (err.response && err.response.status === 401) {
                 setOrderError('获取订单列表失败: 您可能需要重新登录。');
            } else {
                setOrderError(`获取订单列表失败: ${err.response?.data?.message || err.message || '请稍后重试'}`);
            }
            setOrders([]); // 出错时清空列表
            // Reset pagination on error with the requested limitValue
            setOrderPagination({ 
                currentPage: 1, 
                itemsPerPage: limitValue, 
                totalItems: 0, 
                totalPages: 1, 
                pageSize: limitValue 
            });
        } finally {
            setLoadingOrders(false);
        }
    };
    
    // 获取收藏列表的函数
    const fetchUserFavorites = async (page = 1, size = 6) => {
        setLoadingFavorites(true);
        setFavoriteError(null);
        try {
            const favoritesResponse = await userAPI.getFavorites({ page, pageSize: size });
             if (favoritesResponse.data && favoritesResponse.data.favorites) {
                 setFavorites(favoritesResponse.data.favorites);
                 setFavoritesPagination({
                     current: favoritesResponse.data.page || 1,
                     pageSize: size,
                     total: favoritesResponse.data.total || 0
                 });
             } else {
                 console.error('获取收藏列表数据格式无效:', favoritesResponse);
                 setFavorites([]);
                 setFavoritesPagination({ current: 1, pageSize: size, total: 0 });
             }
        } catch (err) {
            console.error('获取收藏列表失败', err);
            setFavoriteError('获取收藏列表失败，请稍后重试');
        } finally {
            setLoadingFavorites(false);
        }
    };
    
    // 主 useEffect，根据 activeTab 获取数据
    useEffect(() => {
        setLoading(true);
        setError(null);
        setOrderError(null);
        setFavoriteError(null);
        console.log(`[UserCenter] useEffect triggered for activeTab: ${activeTab}`);

        const loadData = async () => {
            if (activeTab === 'profile') {
                await fetchUserProfile();
            } else if (activeTab === 'orders') {
                const currentLimit = orderPagination.pageSize || orderPagination.itemsPerPage || 5; 
                console.log(`[UserCenter] useEffect (orders): Calling fetchUserOrders with page ${orderPagination.currentPage}, limit ${currentLimit}`);
                await fetchUserOrders(orderPagination.currentPage, currentLimit);
            } else if (activeTab === 'favorites') {
                await fetchUserFavorites(favoritesPagination.current, favoritesPagination.pageSize);
            } else if (activeTab === 'settings') {
                console.log('[UserCenter] Loading data for settings tab (nothing to fetch).');
                setLoading(false);
            }
             if (activeTab !== 'settings') {
                 setLoading(false);
             }
        };

        loadData();
    }, [activeTab]); // Dependency array includes activeTab
    
    // 确保在 contextUser 加载后初始化表单和头像输入
    useEffect(() => {
        if (contextUser) {
            setFormData({
                email: contextUser.email || '',
                phone: contextUser.phone || ''
            });
            setAvatarUrlInput(contextUser.avatar || '');
        }
    }, [contextUser]);

    // 处理订单分页变化的函数
    const handleOrderPageChange = (page: number, pageSizeFromPagination?: number) => {
        // Antd Pagination passes the new page size as the second argument when changed
        // We map this to our limitValue
        const newLimit = pageSizeFromPagination || orderPagination.pageSize || orderPagination.itemsPerPage || 5;
        console.log(`[UserCenter] handleOrderPageChange: Page changed to ${page}, pageSize (limit) to ${newLimit}`);
        // Fetch new data first
        fetchUserOrders(page, newLimit);
        // Update state to reflect the change in UI (Pagination component)
        setOrderPagination(prev => ({ 
            ...prev, 
            currentPage: page, 
            pageSize: newLimit, // Update pageSize for Antd Pagination
            itemsPerPage: newLimit // Keep consistent if used elsewhere
        }));
    };
    
    // 处理收藏分页变化的函数 (如果需要)
    const handleFavoritePageChange = (page: number, pageSize?: number) => {
        const newPageSize = pageSize || favoritesPagination.pageSize;
        fetchUserFavorites(page, newPageSize);
    };
    
    // 处理表单输入变化
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };
    
    // 处理密码表单输入变化
    const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordForm({
            ...passwordForm,
            [name]: value
        });
    };
    
    // 头像 URL 输入框的处理函数
    const handleAvatarUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAvatarUrlInput(e.target.value);
    };
    
    // 提交个人资料表单
    const handleProfileSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        if (!contextUser) {
            message.error('无法获取用户信息，请稍后重试');
            return;
        }

        // 表单验证
        if (!formData.email || !formData.phone) {
            message.error('请填写完整信息');
            return;
        }
        
        // 邮箱格式验证
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            message.error('请输入有效的邮箱地址');
            return;
        }
        
        // 手机号格式验证
        const phoneRegex = /^1[3-9]\d{9}$/;
        if (!phoneRegex.test(formData.phone)) {
            message.error('请输入有效的手机号码');
            return;
        }
        
        setLoadingAction(true);
        
        try {
            const updatedProfileData = {
                username: contextUser.username,
                email: formData.email,
                phone: formData.phone,
                avatar: avatarUrlInput
            };

            await userAPI.updateProfile(updatedProfileData);
            
            // 调用 updateUserContext 更新全局状态
            const updatedContextData: Partial<User> = {
                email: formData.email,
                avatar: avatarUrlInput
            };
            if (formData.phone !== undefined) {
                 updatedContextData.phone = formData.phone;
            }
            updateUserContext(updatedContextData);

            message.success('个人资料更新成功');
        } catch (err) {
            console.error('更新个人资料失败', err);
            message.error('更新个人资料失败，请稍后重试');
        } finally {
            setLoadingAction(false);
        }
    };
    
    // 提交密码修改
    const handlePasswordSubmit = async () => {
        // 表单验证
        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            message.error('请填写完整信息');
            return;
        }
        
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            message.error('两次输入的新密码不一致');
            return;
        }
        
        if (passwordForm.newPassword.length < 8) {
            message.error('新密码长度不能少于8个字符');
            return;
        }
        
        setLoadingAction(true);
        
        try {
            // 实际应用中取消下面的注释
            // await userAPI.changePassword({
            //     currentPassword: passwordForm.currentPassword,
            //     newPassword: passwordForm.newPassword
            // });
            
            // 模拟API请求
            setTimeout(() => {
                message.success('密码修改成功');
                setPasswordModalVisible(false);
                setPasswordForm({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                setLoadingAction(false);
            }, 1000);
        } catch (err) {
            console.error('修改密码失败', err);
            message.error('修改密码失败，请确认当前密码是否正确');
            setLoadingAction(false);
        }
    };
    
    // 取消订单
    const handleCancelOrder = async (bookingId: number) => {
        try {
            setLoadingAction(true);
            await userAPI.cancelOrder(bookingId);
            message.success('订单已取消');
            // 刷新订单列表 using the current limit
            const currentLimit = orderPagination.pageSize || orderPagination.itemsPerPage || 5;
            console.log(`[UserCenter] handleCancelOrder: Refreshing orders, page ${orderPagination.currentPage}, limit ${currentLimit}`);
            fetchUserOrders(orderPagination.currentPage, currentLimit);
        } catch (err: any) {
            console.error('[UserCenter] handleCancelOrder: Error cancelling order', err);
            message.error(err.response?.data?.message || '取消订单失败，请稍后重试');
        } finally {
            setLoadingAction(false);
        }
    };
    
    // 删除收藏项
    const removeFavorite = async (id: number) => {
        setLoadingAction(true);
        
        try {
            await userAPI.removeFavorite(id);
            // 更新本地状态
            setFavorites(favorites.filter(item => item.id !== id));
            // 更新分页总数 (可选，如果后端不在删除后返回新总数)
             setFavoritesPagination(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
            message.success('已从收藏中移除');
        } catch (err) {
            console.error('移除收藏失败', err);
            message.error('移除收藏失败，请稍后重试');
        } finally {
            setLoadingAction(false);
        }
    };
    
    // 退出登录
    const handleLogout = () => {
        Modal.confirm({
            title: '确认退出登录',
            icon: <ExclamationCircleOutlined />,
            content: '确定要退出当前账号吗？',
            onOk: () => {
                // 清除本地存储的token
                localStorage.removeItem('token');
                // 重定向到登录页
                window.location.href = '/login';
            }
        });
    };
    
    // 根据状态筛选订单
    const filteredOrders = orders.filter(order => {
        if (orderFilter === 'all') return true;
        return order.status === orderFilter;
    });
    
    // 打开评价模态框
    const handleOpenReviewModal = (orderId: string | number, orderTitle: string) => {
        setSelectedOrder({id: orderId, title: orderTitle});
        setReviewModalVisible(true);
    };
    
    // 评价成功回调
    const handleReviewSuccess = () => {
        // 在实际应用中，这里可以刷新订单数据或标记订单已评价
        message.success('感谢您的评价！');
    };
    
    // 渲染用户信息标签页内容
    const renderProfileTab = () => {
        if (!contextUser) {
            return <div className="loading"><Spin /> <p>加载用户信息...</p></div>;
        }

        return (
            <div className="profile-section">
                <div className="user-header">
                    <div className="user-info">
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
                            <img
                                src={avatarUrlInput || '/images/placeholder-avatar.png'}
                                alt="头像预览"
                                className="avatar-preview-image"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/images/placeholder-avatar.png';
                                }}
                                style={{ 
                                    width: '100px', 
                                    height: '100px', 
                                    objectFit: 'cover', 
                                    borderRadius: '50%', 
                                    border: '1px solid #ddd',
                                    marginRight: '15px'
                                }}
                            />
                            <h2 className="username" style={{ margin: 0 }}>{contextUser.username}</h2>
                        </div>
                        <div className="avatar-url-input" style={{ marginTop: '20px', paddingLeft: '20px' }}>
                            <label htmlFor="avatar-url">头像图片URL：</label>
                            <Input
                                id="avatar-url"
                                placeholder="请输入有效的图片URL地址"
                                value={avatarUrlInput}
                                onChange={handleAvatarUrlChange}
                                style={{ marginBottom: '10px', width: '100%', marginTop: '8px' }}
                            />
                            <div className="avatar-tip">
                                提示：输入完整的图片URL后，头像将自动更新
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="profile-details">
                    <h3>{t('userCenter.profile')}</h3>
                    <form className="profile-form" onSubmit={handleProfileSubmit}>
                        <div className="form-group">
                            <label>用户名</label>
                            <input type="text" value={contextUser.username} disabled />
                        </div>
                        <div className="form-group">
                            <label>邮箱</label>
                            <input 
                                type="email" 
                                name="email"
                                value={formData.email} 
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>手机号</label>
                            <input 
                                type="text" 
                                name="phone"
                                value={formData.phone} 
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="form-action">
                            <button 
                                className="save-profile" 
                                type="submit"
                                disabled={loadingAction}
                            >
                                {loadingAction ? '保存中...' : '保存修改'}
                            </button>
                        </div>
                    </form>
                </div>
                
                <div className="security-section">
                    <h3>账号安全</h3>
                    <div className="security-options">
                        <button 
                            className="change-password"
                            onClick={() => setPasswordModalVisible(true)}
                        >
                            修改密码
                        </button>
                        <button 
                            className="logout"
                            onClick={handleLogout}
                        >
                            退出登录
                        </button>
                    </div>
                </div>
                
                <Modal
                    title="修改密码"
                    open={passwordModalVisible}
                    onOk={handlePasswordSubmit}
                    onCancel={() => setPasswordModalVisible(false)}
                    confirmLoading={loadingAction}
                >
                    <div className="password-form">
                        <div className="form-group">
                            <label>当前密码</label>
                            <input 
                                type="password" 
                                name="currentPassword"
                                value={passwordForm.currentPassword}
                                onChange={handlePasswordInputChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>新密码</label>
                            <input 
                                type="password" 
                                name="newPassword"
                                value={passwordForm.newPassword}
                                onChange={handlePasswordInputChange}
                                required
                                minLength={8}
                            />
                        </div>
                        <div className="form-group">
                            <label>确认新密码</label>
                            <input 
                                type="password" 
                                name="confirmPassword"
                                value={passwordForm.confirmPassword}
                                onChange={handlePasswordInputChange}
                                required
                            />
                        </div>
                    </div>
                </Modal>
            </div>
        );
    };
    
    // 渲染订单标签页内容
    const renderOrdersTab = () => {
        // 筛选订单逻辑
        const filteredOrders = orders.filter(order => 
            orderFilter === 'all' || order.status === orderFilter
        );

        return (
            <div className="orders-section">
                <h2>{t('userCenter.orders')}</h2>
                <div className="filter-buttons">
                    <button
                        className={`filter-button ${orderFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setOrderFilter('all')}
                    >
                        全部订单
                    </button>
                    <button
                        className={`filter-button ${orderFilter === 'pending' ? 'active' : ''}`}
                        onClick={() => setOrderFilter('pending')}
                    >
                        待处理
                    </button>
                    <button
                        className={`filter-button ${orderFilter === 'processing' ? 'active' : ''}`}
                        onClick={() => setOrderFilter('processing')}
                    >
                        处理中
                    </button>
                    <button
                        className={`filter-button ${orderFilter === 'confirmed' ? 'active' : ''}`}
                        onClick={() => setOrderFilter('confirmed')}
                    >
                        待出行
                    </button>
                    <button
                        className={`filter-button ${orderFilter === 'completed' ? 'active' : ''}`}
                        onClick={() => setOrderFilter('completed')}
                    >
                        已完成
                    </button>
                    <button
                        className={`filter-button ${orderFilter === 'cancelled' ? 'active' : ''}`}
                        onClick={() => setOrderFilter('cancelled')}
                    >
                        已取消
                    </button>
                </div>
                
                {loadingOrders ? (
                    <div className="loading"><Spin /> <p>加载订单中...</p></div>
                ) : orderError ? (
                    <div className="error-message">
                        <p>{orderError}</p>
                        <Button onClick={() => {
                            const currentLimit = orderPagination.pageSize || orderPagination.itemsPerPage || 5;
                            console.log(`[UserCenter] renderOrdersTab (Retry): Calling fetchUserOrders with page ${orderPagination.currentPage}, limit ${currentLimit}`);
                            fetchUserOrders(orderPagination.currentPage, currentLimit);
                        }}>{t('retry')}</Button>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="no-orders">
                        <Empty description={orderFilter === 'all' ? '您还没有任何订单' : '暂无该状态的订单'} />
                    </div>
                ) : (
                    <div className="orders-list">
                        {filteredOrders.map((booking) => (
                            <React.Fragment key={booking.booking_id}>
                                <OrderCard
                                    order={booking}
                                    onCancel={handleCancelOrder}
                                    onReview={handleOpenReviewModal}
                                    isLoading={loadingAction}
                                />
                                {booking.timeline && booking.timeline.length > 0 && (
                                    <OrderTimeline 
                                        items={booking.timeline} 
                                        collapsed={true}
                                    />
                                )}
                            </React.Fragment>
                        ))}
                        
                        <div className="pagination-container">
                            <Pagination
                                current={orderPagination.currentPage}
                                pageSize={orderPagination.pageSize || orderPagination.itemsPerPage || 5}
                                total={orderPagination.totalItems}
                                onChange={handleOrderPageChange}
                                hideOnSinglePage={true}
                                showSizeChanger 
                                pageSizeOptions={['5', '10', '20']} 
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    };
    
    // 渲染收藏标签页内容
    const renderFavoritesTab = () => (
        <div className="favorites-section">
            <h2>{t('userCenter.favorites')}</h2>
            {favorites.length === 0 ? (
                <div className="no-favorites">
                    <Empty description={t('noFavorites')} />
                </div>
            ) : (
                <>
                    <div className="favorites-grid">
                        {favorites.map((item) => (
                            <div className="favorite-card" key={item.id}>
                                <div className="favorite-image">
                                    <img src={item.image} alt={item.title} />
                                    <div className="favorite-type">
                                        {item.type === 'scenic' && '景点'}
                                        {item.type === 'hotel' && '酒店'}
                                        {item.type === 'strategy' && '攻略'}
                                    </div>
                                    <button 
                                        className="remove-favorite"
                                        onClick={() => removeFavorite(item.id)}
                                        disabled={loadingAction}
                                    >
                                        ×
                                    </button>
                                </div>
                                <div className="favorite-info">
                                    <h3 className="favorite-title">{item.title}</h3>
                                    <p className="favorite-description">{item.description}</p>
                                    <Link 
                                        to={`/${item.type}/${item.id}`} 
                                        className="view-favorite"
                                    >
                                        查看详情
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="pagination-container">
                        <Pagination
                            current={favoritesPagination.current}
                            pageSize={favoritesPagination.pageSize}
                            total={favoritesPagination.total || favorites.length}
                            onChange={handleFavoritePageChange}
                            hideOnSinglePage={true}
                        />
                    </div>
                </>
            )}
        </div>
    );
    
    const setActiveTabAndLog = (tab: TabType) => {
        console.log(`[UserCenter] Setting activeTab to: ${tab}`);
        setActiveTab(tab);
    };

    // --- 新增：渲染系统设置标签页内容 ---
    const renderSettingsTab = () => {
        console.log('[UserCenter] Rendering Settings Tab Content. Theme:', theme, 'Language:', language);
        return (
            <div className="settings-section" style={{ maxWidth: 600, margin: '0 auto' }}>
                <Title level={3} style={{ textAlign: 'center', marginBottom: 30 }}>
                     {t('userCenter.settings')}
                 </Title>
                <Card>
                    <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text strong>{t('settings.theme')}:</Text>
                        <Switch
                            checkedChildren={t('settings.dark')}
                            unCheckedChildren={t('settings.light')}
                            checked={theme === 'dark'}
                            onChange={toggleTheme}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text strong>{t('settings.language')}:</Text>
                        <Select
                            value={language}
                            style={{ width: 120 }}
                            onChange={changeLanguage}
                        >
                            <Option value="zh">中文</Option>
                            <Option value="en">English</Option>
                        </Select>
                    </div>
                </Card>
            </div>
        );
    };
    // --- 结束：渲染系统设置标签页内容 ---

    console.log(`[UserCenter] Rendering component. Current activeTab: ${activeTab}, Loading: ${loading}, Error: ${error}`);
    console.log('Rendering UserCenter - Current contextUser:', contextUser);
    console.log('Rendering UserCenter - Current avatarUrlInput:', avatarUrlInput);

    return (
        <div className="user-center-container">
            <div className="user-center-header">
                <h1>{t('userCenter.title')}</h1>
            </div>
            
            {error ? (
                <div className="error-message">
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()}>重试</button>
                </div>
            ) : loading && !contextUser ? (
                <div className="loading">
                    <Spin size="large" />
                    <p>{t('loading')}</p>
                </div>
            ) : (
                <div className="user-center-content">
                    <>
                        <div className="tabs-navigation">
                            <button 
                                className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
                                onClick={() => setActiveTabAndLog('profile')}
                            >
                                 {t('userCenter.profile')}
                            </button>
                            <button 
                                className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`}
                                onClick={() => setActiveTabAndLog('orders')}
                            >
                                {t('userCenter.orders')}
                            </button>
                            <button 
                                className={`tab-button ${activeTab === 'favorites' ? 'active' : ''}`}
                                onClick={() => setActiveTabAndLog('favorites')}
                            >
                                {t('userCenter.favorites')}
                            </button>
                            <button
                                className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
                                onClick={() => setActiveTabAndLog('settings')}
                            >
                                 <SettingOutlined /> {t('userCenter.settings')}
                            </button>
                        </div>
                        
                        <div className="tab-content">
                            {activeTab === 'profile' && renderProfileTab()}
                            {activeTab === 'orders' && renderOrdersTab()}
                            {activeTab === 'favorites' && renderFavoritesTab()}
                            {activeTab === 'settings' && renderSettingsTab()}
                        </div>
                    </>
                </div>
            )}
            
            {selectedOrder && (
                <ReviewModal
                    visible={reviewModalVisible}
                    orderId={selectedOrder.id}
                    orderTitle={selectedOrder.title}
                    onClose={() => {
                        setReviewModalVisible(false);
                        setSelectedOrder(null);
                    }}
                    onSuccess={handleReviewSuccess}
                />
            )}
        </div>
    );
};

export default UserCenter;