import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, Link } from 'react-router-dom';
import { ConfigProvider, Spin, theme as antdTheme } from 'antd'; // 导入 antd 主题配置
import zhCN from 'antd/locale/zh_CN'; // 导入中文语言包
import { useAuth, AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';
import { ThemeProvider, useTheme } from './context/ThemeContext'; // 导入主题上下文
import './App.css';

// 导航栏组件
import Navbar from './components/Navbar';
// 页面组件
import Home from './pages/Home';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import Forbidden from './pages/Forbidden';
import Scenic from './pages/Scenic';
import Strategies from './pages/Strategies';
import StrategyCreate from './pages/StrategyCreate'; // 取消注释
import Hotels from './pages/Hotels';
import UserCenter from './pages/UserCenter';
import ScenicDetail from './pages/ScenicDetail';
import BookingForm from './components/BookingForm';
import Payment from './pages/Payment';
import ItineraryPlanner from './pages/ItineraryPlanner';
import Itineraries from './pages/Itineraries';
import HotelDetail from './pages/HotelDetail';
import TransportMap from './pages/TransportMap'; // 导入TransportMap组件
import FlightBookingPage from './pages/FlightBookingPage'; // 修正路径: 移除不存在的 Booking 目录
import PriceReport from './pages/PriceReport'; // 导入价格报表组件
import OrderDetail from './pages/OrderDetail'; // 导入订单详情页组件
import CulturalDnaTest from './pages/CulturalDnaTest'; // <-- 新增导入
import Notifications from './pages/Notifications';
import StrategyDetail from './pages/StrategyDetail'; // 导入攻略详情组件

// 后台管理组件
import Dashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import ScenicManagement from './pages/admin/ScenicManagement';
import HotelManagement from './pages/admin/HotelManagement';
import OrderManagement from './pages/admin/OrderManagement';
import StrategyManagement from './pages/admin/StrategyManagement';
import ReviewManagement from './pages/admin/ReviewManagement';
import SettingsPage from './pages/admin/SettingsPage';

// 管理员页面 - 懒加载
const FeaturedRouteManagement = lazy(() => import('./pages/admin/FeaturedRouteManagement'));

// 新增：前端布局组件
const FrontendLayout: React.FC = () => (
    <>
        <Navbar />
        <main className="content">
            <Outlet /> {/* 子路由将渲染在这里 */}
        </main>
        <footer className="footer">
            <div className="footer-content">
                <div className="footer-section">
                    <h3 className="footer-title">旅游服务平台</h3>
                    <p>您的旅行规划专家，随时随地为您提供优质旅游服务</p>
                    <div className="social-links">
                        <span title="微信"><i className="fab fa-weixin"></i></span>
                        <span title="微博"><i className="fab fa-weibo"></i></span>
                        <span title="QQ"><i className="fab fa-qq"></i></span>
                    </div>
                </div>
                <div className="footer-section">
                    <h3 className="footer-title">快速链接</h3>
                    <ul className="footer-links">
                        <li><Link to="/">首页</Link></li>
                        <li><Link to="/scenic">景点</Link></li>
                        <li><Link to="/strategies">攻略</Link></li>
                        <li><Link to="/hotels">酒店</Link></li>
                        <li><Link to="/transport-map">交通</Link></li>
                        <li><Link to="/price-report">价格分析</Link></li>
                        <li><Link to="/itineraries">文化路线</Link></li>
                        <li><Link to="/about">关于我们</Link></li>
                    </ul>
                </div>
                <div className="footer-section">
                    <h3 className="footer-title">热门目的地</h3>
                    <ul className="footer-links">
                        <li><Link to="/scenic?city=北京">北京</Link></li>
                        <li><Link to="/scenic?city=上海">上海</Link></li>
                        <li><Link to="/scenic?city=成都">成都</Link></li>
                        <li><Link to="/scenic?city=三亚">三亚</Link></li>
                        <li><Link to="/scenic?city=重庆">重庆</Link></li>
                    </ul>
                </div>
                <div className="footer-section">
                    <h3 className="footer-title">联系我们</h3>
                    <p><i className="fas fa-phone"></i> 400-123-4567</p>
                    <p><i className="fas fa-envelope"></i> contact@travelplatform.com</p>
                    <p><i className="fas fa-map-marker-alt"></i> 北京市海淀区中关村大街1号</p>
                </div>
            </div>
            <div className="footer-bottom">
                <p>&copy; 2023 旅游服务平台 版权所有 | <Link to="/privacy">隐私政策</Link> | <Link to="/terms">使用条款</Link></p>
            </div>
        </footer>
    </>
);

// 主题切换包装器
const ThemedApp: React.FC = () => {
    const { theme } = useTheme();
    const { defaultAlgorithm, darkAlgorithm } = antdTheme;

    return (
        <ConfigProvider locale={zhCN} theme={{
            algorithm: theme === 'dark' ? darkAlgorithm : defaultAlgorithm,
            token: {
                // 可选：自定义主题 Token
                // colorPrimary: '#00b96b',
            },
            components: {
                // 可选：自定义组件样式
                // Button: {
                //   colorPrimary: '#ff4d4f'
                // }
            }
        }}>
            <Suspense fallback={<Spin size="large" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }} />}>
                <Routes>
                    {/* 公共布局路由 (使用 FrontendLayout) */}
                    <Route path="/" element={<FrontendLayout />}>
                        {/* 首页 */}
                        <Route index element={<Home />} />
                        
                        {/* 认证相关页面 */}
                        <Route path="login" element={<Login />} />
                        <Route path="register" element={<Register />} />
                        
                        {/* 基本信息页面 */}
                        <Route path="scenic" element={<Scenic />} />
                        <Route path="strategies" element={<Strategies />} />
                        <Route path="hotels" element={<Hotels />} />
                        <Route path="about" element={<About />} />
                        <Route path="transport-map" element={<TransportMap />} />
                        <Route path="price-report" element={<PriceReport />} />
                        <Route path="cultural-dna" element={<CulturalDnaTest />} /> {/* 修改路径以匹配导航 */}
                        <Route path="notifications" element={<Notifications />} />
                        
                        {/* 详情页路由 */}
                        <Route path="scenic/:id" element={<ScenicDetail />} />
                        <Route path="hotels/:id" element={<HotelDetail />} />
                        <Route path="strategy/:id" element={<StrategyDetail />} />
                        <Route path="order/:id" element={<OrderDetail />} />
                        {/* 路线详情页已集成到模态框中，不再需要独立路由 */}

                        {/* 功能页面 */}
                        <Route path="itinerary" element={<ItineraryPlanner />} />
                        <Route path="flight-booking" element={<FlightBookingPage />} />
                        
                        {/* 添加缺失的路由 */}
                        <Route path="itineraries" element={<Itineraries />} />
                        <Route path="itineraries/create" element={<ItineraryPlanner />} />
                        <Route path="itineraries/:id" element={<ProtectedRoute><ItineraryPlanner /></ProtectedRoute>} />
                        <Route path="strategies/create" element={<StrategyCreate />} />

                        {/* 新增：预订页面路由 */}
                        <Route path="booking/:scenicId" element={<ProtectedRoute><BookingForm /></ProtectedRoute>} />
                        <Route path="booking/hotel/:hotelId" element={<ProtectedRoute><BookingForm /></ProtectedRoute>} />

                        {/* 新增：支付页面路由 */}
                        <Route path="payment/:bookingId" element={<ProtectedRoute><Payment /></ProtectedRoute>} />

                        {/* 用户中心路由 (需要登录) */}
                        <Route path="user" element={<ProtectedRoute><UserCenter /></ProtectedRoute>} /> {/* 修改路径以匹配导航 */}
                        <Route path="user/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} /> {/* 添加订单详情路由 */}
                        <Route path="my-itineraries" element={<ProtectedRoute><Itineraries /></ProtectedRoute>} />

                        {/* 公共区域的 404 */}
                        <Route path="*" element={<NotFound />} />
                    </Route>

                    {/* 管理员布局路由 */}
                    <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminLayout /></ProtectedRoute>}>
                        <Route index element={<Navigate to="dashboard" replace />} />
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="users" element={<UserManagement />} />
                        <Route path="scenics" element={<ScenicManagement />} />
                        <Route path="hotels" element={<HotelManagement />} />
                        <Route path="strategies" element={<StrategyManagement />} />
                        <Route path="orders" element={<OrderManagement />} />
                        <Route path="reviews" element={<ReviewManagement />} />
                        <Route path="featured-routes" element={<FeaturedRouteManagement />} />
                        <Route path="settings" element={<SettingsPage />} />
                        {/* 管理员区域的 404 */}
                        <Route path="*" element={<NotFound />} />
                    </Route>
                </Routes>
            </Suspense>
        </ConfigProvider>
    );
};

// 最终导出的 App 组件，包含所有 Provider
const App: React.FC = () => {
    return (
        <AuthProvider>
            <ThemeProvider>
                <ThemedApp />
            </ThemeProvider>
        </AuthProvider>
    );
};

export default App; 