import React, { useState, useEffect, useCallback } from 'react';
import { 
    Row, Col, Card, Statistic, List, Typography, Spin, 
    Table, Tag, Button, Divider, DatePicker,
    message
} from 'antd';
import { 
    TeamOutlined, ShopOutlined, FileTextOutlined, 
    ShoppingCartOutlined, ArrowUpOutlined, ArrowDownOutlined,
    EyeOutlined, CommentOutlined, UserOutlined
} from '@ant-design/icons';
import moment from 'moment';
import dayjs from 'dayjs';
import adminAPI from '../../api/admin';
import type { DashboardStats } from '../../api/admin';
import './Dashboard.css';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// 初始状态，所有值为 0 或空数组
const initialStats: DashboardStats = {
    users: { total: 0, new: 0 },
    scenics: { total: 0 },
    hotels: { total: 0 },
    orders: { total: 0, pending: 0 },
    strategies: { total: 0 },
    revenue: { recent: 0 },
};

/**
 * 管理后台的控制面板页面
 */
const Dashboard: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [stats, setStats] = useState<DashboardStats>(initialStats);

    // 获取仪表盘数据的函数
    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await adminAPI.getDashboardStats();
            if (response.data.success) {
                setStats(response.data.data); 
            } else {
                message.error(response.data.message || '获取仪表盘数据失败');
                 setStats(initialStats); // 出错时重置为初始状态
            }
            // TODO: 如果需要获取最近订单、热门景点等，在此处调用相应的 API
            // 例如: const ordersRes = await adminAPI.getOrders({ pageSize: 5, sortBy: 'created_at', sortOrder: 'desc' });
            // if (ordersRes.data.success) setRecentOrders(ordersRes.data.data);
            
        } catch (error: any) {
            console.error('获取仪表盘数据异常:', error);
            message.error(`获取仪表盘数据失败: ${error.response?.data?.message || error.message || '未知错误'}`);
            setStats(initialStats); // 出错时重置为初始状态
        } finally {
            setLoading(false);
        }
    }, []);

    // 初始加载数据
    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    return (
        <div className="admin-dashboard">
            <div className="admin-page-header">
                <div className="dashboard-header">
                    <Title level={4}>控制面板</Title>
                </div>
                <Text type="secondary">
                    欢迎访问旅游管理系统后台，这里展示了网站的核心数据概览
                </Text>
            </div>

            <Spin spinning={loading}>
                {/* 统计卡片 - 使用真实数据 */}
                <Row gutter={[16, 16]} className="stat-cards">
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="用户总数"
                                value={stats.users.total}
                                prefix={<TeamOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic title="新增用户(近30天)" value={stats.users.new} prefix={<UserOutlined />} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="景点总数"
                                value={stats.scenics.total}
                                prefix={<ShopOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic title="酒店总数" value={stats.hotels.total} prefix={<ShopOutlined />} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="订单总数"
                                value={stats.orders.total}
                                prefix={<ShoppingCartOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic title="待处理订单" value={stats.orders.pending} prefix={<ShoppingCartOutlined />} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="攻略总数"
                                value={stats.strategies.total}
                                prefix={<FileTextOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic title="近期收入(近30天)" value={stats.revenue.recent} prefix="¥" precision={2} />
                        </Card>
                    </Col>
                </Row>
            </Spin>
        </div>
    );
};

export default Dashboard; 