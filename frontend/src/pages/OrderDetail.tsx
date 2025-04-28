import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, Button, Tag, Descriptions, Card, message, Modal, Divider, Row, Col, Typography, Empty, Result } from 'antd';
import { ArrowLeftOutlined, ExclamationCircleOutlined, LoadingOutlined, ReloadOutlined, RollbackOutlined } from '@ant-design/icons';
import bookingAPI from '../api/order';
import OrderTimeline from '../components/OrderTimeline';
import moment from 'moment';
import './OrderDetail.css';

const { Title, Text } = Typography;
const { confirm } = Modal;

// 状态颜色映射
const statusMap: Record<string, { text: string, color: string }> = {
    'pending': { text: '待支付', color: 'orange' },
    'processing': { text: '处理中', color: 'blue' },
    'confirmed': { text: '已确认', color: 'cyan' },
    'completed': { text: '已完成', color: 'green' },
    'cancelled': { text: '已取消', color: 'grey' },
    'refunding': { text: '退款中', color: 'purple' },
    'refunded': { text: '已退款', color: 'red' }
};

// 计算日期差异的函数
const calculateDateDifference = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 0;
    const start = moment(startDate);
    const end = moment(endDate);
    return end.diff(start, 'days');
};

// 安全获取嵌套属性的辅助函数
const safeGet = (obj: any, path: string, defaultValue: any = undefined) => {
    // 处理对象为null或undefined的情况
    if (obj === null || obj === undefined) {
        return defaultValue;
    }
    
    // 处理ID字段的特殊情况 - 优先使用booking_id，否则使用id
    if (path === 'booking_id' && obj.id !== undefined && obj.booking_id === undefined) {
        return obj.id;
    }
    
    // 处理用户ID字段的特殊情况 - 优先使用user_id，否则使用userId
    if (path === 'user_id' && obj.userId !== undefined && obj.user_id === undefined) {
        return obj.userId;
    }
    
    // 处理totalPrice和total_price字段兼容
    if (path === 'total_price' && obj.totalPrice !== undefined && obj.total_price === undefined) {
        return obj.totalPrice;
    }
    
    const travel = (regexp: RegExp) =>
        String.prototype.split
            .call(path, regexp)
            .filter(Boolean)
            .reduce((res, key) => (res !== null && res !== undefined ? res[key] : res), obj);
    const result = travel(/[,[\].]+?/) || travel(/[,[\].]+?/);
    return result === undefined || result === null ? defaultValue : result;
};

// 格式化金额的辅助函数
const formatPrice = (price: number | string | undefined | null): string => {
    if (price === undefined || price === null) return '0.00';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
};

const OrderDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [cancelLoading, setCancelLoading] = useState<boolean>(false);

    useEffect(() => {
        console.log(`[OrderDetail] Component mounted or id changed: ${id}`);
        fetchOrderDetail();
    }, [id]);

    const fetchOrderDetail = async () => {
        if (!id) {
            console.error('[OrderDetail] No order ID provided in URL');
            setError('订单ID缺失，无法查看详情');
            setLoading(false);
            return;
        }
        
        setLoading(true);
        setError(null);
        
        try {
            console.log(`[OrderDetail] Fetching order details for ID: ${id}`);
            // 尝试清除URL路径中可能的非数字字符
            const cleanId = id.toString().replace(/\D/g, '');
            console.log(`[OrderDetail] Cleaned ID for API call: ${cleanId}`);
            
            const response = await bookingAPI.getBookingById(Number(cleanId));
            console.log('[OrderDetail] API response:', response);
            
            // 处理响应格式 - BookingDetailResponse中包含booking字段
            let orderData = null;
            if (response && response.booking) {
                console.log('[OrderDetail] Found order in response.booking');
                orderData = response.booking;
            } else {
                console.error('[OrderDetail] Invalid response format:', response);
                setError('无法获取订单详情，响应格式不正确');
                setLoading(false);
                return;
            }
            
            console.log('[OrderDetail] Order data processed:', orderData);
            setOrder(orderData);
        } catch (err: any) {
            console.error('[OrderDetail] Error fetching order details:', err);
            const errorMsg = err.response?.status === 404
                ? '订单不存在或已被删除'
                : err.response?.data?.message || '获取订单详情失败，请稍后再试';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        confirm({
            title: '确认取消订单？',
            icon: <ExclamationCircleOutlined />,
            content: '取消后无法恢复，确定要继续吗？',
            onOk: async () => {
                setCancelLoading(true);
                try {
                    await bookingAPI.cancelBooking(Number(id));
                    message.success('订单已成功取消');
                    // 刷新订单详情
                    fetchOrderDetail();
                } catch (err: any) {
                    message.error('取消订单失败: ' + (err.message || '未知错误'));
                } finally {
                    setCancelLoading(false);
                }
            }
        });
    };

    const handleReview = () => {
        // 根据实际需求跳转到评价页面或打开评价表单
        navigate(`/review/create?orderId=${id}`);
    };

    const handleGoBack = () => {
        navigate(-1); // 返回上一页
    };

    // 确保订单有booking_id
    useEffect(() => {
        if (order && !order.booking_id && order.id) {
            console.log('[OrderDetail] 使用id字段作为booking_id:', order.id);
            setOrder({
                ...order,
                booking_id: order.id
            });
        }
    }, [order]);

    // 渲染加载状态
    if (loading) {
        return (
            <div className="order-detail-loading">
                <Card className="loading-card">
                    <Spin 
                        size="large" 
                        indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />}
                        tip="正在加载订单详情..." 
                    />
                    <p className="loading-text">请稍候，正在获取最新订单信息</p>
                </Card>
            </div>
        );
    }

    // 渲染错误状态
    if (error) {
        return (
            <div className="order-detail-error">
                <Result
                    status="warning"
                    title="无法加载订单详情"
                    subTitle={error}
                    extra={[
                        <Button 
                            key="retry" 
                            type="primary" 
                            icon={<ReloadOutlined />} 
                            onClick={fetchOrderDetail}
                        >
                            重新加载
                        </Button>,
                        <Button 
                            key="back" 
                            icon={<RollbackOutlined />} 
                            onClick={handleGoBack}
                        >
                            返回上一页
                        </Button>,
                    ]}
                />
            </div>
        );
    }

    // 额外的数据验证，确保必要字段存在
    if (!order || !order.booking_id) {
        return (
            <div className="order-detail-error">
                <Result
                    status="error"
                    title="订单数据无效"
                    subTitle="无法显示订单详情，请确认订单ID是否正确"
                    extra={[
                        <Button 
                            key="retry" 
                            type="primary" 
                            icon={<ReloadOutlined />} 
                            onClick={fetchOrderDetail}
                        >
                            重新加载
                        </Button>,
                        <Button 
                            key="back" 
                            icon={<RollbackOutlined />} 
                            onClick={handleGoBack}
                        >
                            返回上一页
                        </Button>,
                    ]}
                />
            </div>
        );
    }

    // 计算住宿天数（如果是酒店订单）
    const stayDays = order.start_date && order.end_date 
        ? calculateDateDifference(order.start_date, order.end_date) 
        : 1;
        
    // 获取状态信息，使用安全访问
    const status = safeGet(order, 'status', 'pending');
    const statusInfo = safeGet(order, 'statusInfo', null) || statusMap[status] || { text: '未知状态', color: 'default' };
    
    console.log('订单数据:', order);
    console.log('状态信息:', statusInfo);

    // 确定订单项目标题，使用安全访问
    const orderTitle = order.booking_type === 'hotel'
        ? (safeGet(order, 'Hotel.name', null) || '酒店预订')
        : order.booking_type === 'scenic'
        ? (safeGet(order, 'Scenic.name', null) || '景点门票')
        : order.booking_type === 'flight'
        ? (safeGet(order, 'Flight.airline', '') + ' ' + safeGet(order, 'Flight.flight_no', '')) || '机票预订'
        : '未知预订';

    return (
        <div className="order-detail-container">
            <Card className="order-detail-card">
                <div className="order-detail-header">
                    <Button 
                        icon={<ArrowLeftOutlined />} 
                        onClick={handleGoBack}
                        className="back-button"
                    >
                        返回
                    </Button>
                    <Title level={4}>订单详情</Title>
                </div>

                <div className="order-detail-status">
                    <Tag color={statusInfo.color} className="status-tag">
                        {statusInfo.text}
                    </Tag>
                </div>

                <div className="order-basic-info">
                    <Descriptions 
                        column={{ xxl: 3, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }} 
                        bordered
                        labelStyle={{ fontWeight: 'bold' }}
                    >
                        <Descriptions.Item label="订单号">ORD{safeGet(order, 'booking_id', '未知')}</Descriptions.Item>
                        <Descriptions.Item label="预订类型">
                            {safeGet(order, 'booking_type', '') === 'scenic' ? '景点门票' : 
                             safeGet(order, 'booking_type', '') === 'hotel' ? '酒店住宿' : 
                             safeGet(order, 'booking_type', '') === 'flight' ? '机票预订' : '未知类型'}
                        </Descriptions.Item>
                        <Descriptions.Item label="预订项目">{orderTitle}</Descriptions.Item>
                        <Descriptions.Item label="预订日期">
                            {safeGet(order, 'start_date', '未知')}
                            {safeGet(order, 'booking_type', '') === 'hotel' && safeGet(order, 'end_date', '') && (
                                <> 至 {safeGet(order, 'end_date', '')} (共{stayDays}晚)</>
                            )}
                        </Descriptions.Item>
                        <Descriptions.Item label="预订人数">{safeGet(order, 'num_people', 0)}人</Descriptions.Item>
                        <Descriptions.Item label="总金额">
                            <span className="order-price">¥{formatPrice(safeGet(order, 'total_price', 0))}</span>
                        </Descriptions.Item>
                        <Descriptions.Item label="创建时间">
                            {safeGet(order, 'created_at', '') ? 
                                moment(safeGet(order, 'created_at', '')).isValid() ? 
                                    moment(safeGet(order, 'created_at', '')).format('YYYY-MM-DD HH:mm:ss') : 
                                    '无效日期' : 
                                '未知'}
                        </Descriptions.Item>
                        {safeGet(order, 'updated_at', '') && moment(safeGet(order, 'updated_at', '')).isValid() && (
                            <Descriptions.Item label="更新时间">
                                {moment(safeGet(order, 'updated_at', '')).format('YYYY-MM-DD HH:mm:ss')}
                            </Descriptions.Item>
                        )}
                    </Descriptions>
                </div>

                <Divider orientation="left">订单详情</Divider>

                {safeGet(order, 'booking_type', '') === 'hotel' ? (
                    <div className="hotel-detail">
                        <Row gutter={[16, 16]}>
                            <Col span={24} md={12}>
                                <Card title="酒店信息" size="small">
                                    <p><strong>酒店名称:</strong> {safeGet(order, 'Hotel.name', '未知')}</p>
                                    <p><strong>酒店地址:</strong> {safeGet(order, 'Hotel.address', '未知')}</p>
                                    <p><strong>房间类型:</strong> {safeGet(order, 'Room.name', '标准房间')}</p>
                                    <p><strong>入住时间:</strong> {safeGet(order, 'start_date', '未知')} {safeGet(order, 'start_date', '') ? '14:00后' : ''}</p>
                                    <p><strong>退房时间:</strong> {safeGet(order, 'end_date', '未知')} {safeGet(order, 'end_date', '') ? '12:00前' : ''}</p>
                                    <p><strong>住宿天数:</strong> {stayDays}晚</p>
                                </Card>
                            </Col>
                            <Col span={24} md={12}>
                                <Card title="费用明细" size="small">
                                    <p><strong>房间单价:</strong> ¥{formatPrice(safeGet(order, 'Room.price', 0))}/晚</p>
                                    <p><strong>入住天数:</strong> {stayDays}晚</p>
                                    <p><strong>房间数量:</strong> 1间</p>
                                    <Divider style={{ margin: '8px 0' }} />
                                    <p><strong>总价:</strong> <span className="order-price">¥{formatPrice(safeGet(order, 'total_price', 0))}</span></p>
                                </Card>
                            </Col>
                        </Row>
                    </div>
                ) : safeGet(order, 'booking_type', '') === 'scenic' ? (
                    <div className="scenic-detail">
                        <Row gutter={[16, 16]}>
                            <Col span={24} md={12}>
                                <Card title="景点信息" size="small">
                                    <p><strong>景点名称:</strong> {safeGet(order, 'Scenic.name', '未知')}</p>
                                    <p><strong>景点地址:</strong> {safeGet(order, 'Scenic.address', '未知')}</p>
                                    <p><strong>参观日期:</strong> {safeGet(order, 'start_date', '未知')}</p>
                                    <p><strong>门票类型:</strong> 标准门票</p>
                                </Card>
                            </Col>
                            <Col span={24} md={12}>
                                <Card title="费用明细" size="small">
                                    <p><strong>门票单价:</strong> ¥{formatPrice(safeGet(order, 'Scenic.price', 0))}/人</p>
                                    <p><strong>人数:</strong> {safeGet(order, 'num_people', 0)}人</p>
                                    <Divider style={{ margin: '8px 0' }} />
                                    <p><strong>总价:</strong> <span className="order-price">¥{formatPrice(safeGet(order, 'total_price', 0))}</span></p>
                                </Card>
                            </Col>
                        </Row>
                    </div>
                ) : safeGet(order, 'booking_type', '') === 'flight' ? (
                    <div className="flight-detail">
                        <Row gutter={[16, 16]}>
                            <Col span={24} md={12}>
                                <Card title="航班信息" size="small">
                                    <p><strong>航空公司:</strong> {safeGet(order, 'Flight.airline', '未知')}</p>
                                    <p><strong>航班号:</strong> {safeGet(order, 'Flight.flight_no', '未知')}</p>
                                    <p><strong>出发城市:</strong> {safeGet(order, 'Flight.from_city', '未知')}</p>
                                    <p><strong>到达城市:</strong> {safeGet(order, 'Flight.to_city', '未知')}</p>
                                    <p><strong>出发时间:</strong> {safeGet(order, 'Flight.departure_time', '未知')}</p>
                                    <p><strong>到达时间:</strong> {safeGet(order, 'Flight.arrival_time', '未知')}</p>
                                </Card>
                            </Col>
                            <Col span={24} md={12}>
                                <Card title="乘客信息" size="small">
                                    {order.passenger_info ? (
                                        <>
                                            <p><strong>乘客姓名:</strong> {safeGet(JSON.parse(order.passenger_info), 'name', '未知')}</p>
                                            <p><strong>证件类型:</strong> {
                                                safeGet(JSON.parse(order.passenger_info), 'id_type', '') === 'id_card' ? '身份证' :
                                                safeGet(JSON.parse(order.passenger_info), 'id_type', '') === 'passport' ? '护照' :
                                                '其他证件'
                                            }</p>
                                            <p><strong>证件号码:</strong> {safeGet(JSON.parse(order.passenger_info), 'id_no', '未知')}</p>
                                            <p><strong>联系电话:</strong> {safeGet(JSON.parse(order.passenger_info), 'contact_phone', '未知')}</p>
                                            {safeGet(JSON.parse(order.passenger_info), 'contact_email', '') && (
                                                <p><strong>联系邮箱:</strong> {safeGet(JSON.parse(order.passenger_info), 'contact_email', '')}</p>
                                            )}
                                        </>
                                    ) : (
                                        <p>乘客信息不可用</p>
                                    )}
                                    <Divider style={{ margin: '8px 0' }} />
                                    <p><strong>机票单价:</strong> ¥{formatPrice(safeGet(order, 'Flight.price', order.total_price / order.num_people))}/人</p>
                                    <p><strong>人数:</strong> {safeGet(order, 'num_people', 0)}人</p>
                                    <Divider style={{ margin: '8px 0' }} />
                                    <p><strong>总价:</strong> <span className="order-price">¥{formatPrice(safeGet(order, 'total_price', 0))}</span></p>
                                </Card>
                            </Col>
                        </Row>
                    </div>
                ) : (
                    <Empty description="无法显示订单详情，订单类型未知" />
                )}

                {safeGet(order, 'remarks', '') && (
                    <>
                        <Divider orientation="left">备注信息</Divider>
                        <div className="order-remarks">
                            <Text>{safeGet(order, 'remarks', '')}</Text>
                        </div>
                    </>
                )}

                {safeGet(order, 'timeline', []).length > 0 && (
                    <>
                        <Divider orientation="left">订单状态记录</Divider>
                        <OrderTimeline items={safeGet(order, 'timeline', [])} collapsed={false} />
                    </>
                )}

                <div className="order-actions">
                    <Row gutter={16} justify="end">
                        {(safeGet(order, 'status', '') === 'pending' || safeGet(order, 'status', '') === 'confirmed') && (
                            <Col>
                                <Button 
                                    danger 
                                    loading={cancelLoading}
                                    onClick={handleCancel}
                                    icon={<ExclamationCircleOutlined />}
                                    size="middle"
                                >
                                    取消订单
                                </Button>
                            </Col>
                        )}
                        {safeGet(order, 'status', '') === 'completed' && (
                            <Col>
                                <Button 
                                    type="primary"
                                    onClick={handleReview}
                                    size="middle"
                                >
                                    评价订单
                                </Button>
                            </Col>
                        )}
                        {safeGet(order, 'status', '') === 'pending' && safeGet(order, 'booking_id', '') && (
                            <Col>
                                <Button 
                                    type="primary"
                                    onClick={() => navigate(`/payment/${safeGet(order, 'booking_id', '')}`)}
                                    size="middle"
                                >
                                    去支付
                                </Button>
                            </Col>
                        )}
                        <Col>
                            <Button
                                onClick={handleGoBack}
                                icon={<ArrowLeftOutlined />}
                                size="middle"
                            >
                                返回上一页
                            </Button>
                        </Col>
                        <Col>
                            <Button
                                onClick={() => navigate('/user?tab=orders')}
                                size="middle"
                            >
                                返回订单列表
                            </Button>
                        </Col>
                    </Row>
                </div>
            </Card>
        </div>
    );
};

export default OrderDetail; 