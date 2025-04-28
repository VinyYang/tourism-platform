import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Steps, Divider, Typography, Descriptions, Radio, message, Result, Spin, Alert } from 'antd';
import { ShoppingCartOutlined, CreditCardOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import bookingAPI, { Order, OrderStatus } from '../api/order';
import { ImageType } from '../types/image.types';
import SafeImage from '../components/common/SafeImage';
import imageService from '../services/imageService';
import { useNotifications } from '../context/NotificationContext';
import './Payment.css';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

/**
 * 支付页面组件
 * 用于用户完成订单支付
 */
const Payment: React.FC = () => {
    const { bookingId } = useParams<{ bookingId: string }>();
    const orderId = bookingId; // 兼容性变量，确保代码其他部分可以继续使用
    
    // 添加调试日志
    console.log('Payment组件初始化：', { 
        bookingId, 
        url: window.location.href,
        path: window.location.pathname
    });
    
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { addNotification } = useNotifications();

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState<string>('alipay');
    const [processing, setProcessing] = useState<boolean>(false);
    const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [errorDetails, setErrorDetails] = useState<string | null>(null);

    // 检查用户是否登录，并加载订单数据
    useEffect(() => {
        if (!isAuthenticated) {
            message.warning('请先登录');
            navigate('/login', { state: { from: `/payment/${bookingId}` } });
            return;
        }

        const fetchBookingDetail = async () => {
            if (!bookingId) {
                setError('订单ID无效');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                console.log(`尝试获取订单ID: ${bookingId}的详情 (URL参数名为bookingId)`);
                
                // 确保订单ID为数字
                const id = parseInt(bookingId);
                if (isNaN(id)) {
                    throw new Error(`无效的订单ID格式: ${bookingId}`);
                }
                
                // 调用API获取订单详情
                const orderData = await bookingAPI.getOrderDetail(id);
                console.log('获取到订单数据:', orderData);
                
                // 检查订单状态
                if (!orderData || !orderData.status) {
                    setError('获取订单数据失败');
                    setErrorDetails('服务器返回的订单数据不完整或格式错误');
                    setLoading(false);
                    return;
                }
                
                // 确保订单ID存在
                if (!orderData.booking_id && orderData.id) {
                    // 如果只有id而没有booking_id，将id复制到booking_id
                    orderData.booking_id = orderData.id;
                } else if (!orderData.id && orderData.booking_id) {
                    // 如果只有booking_id而没有id，将booking_id复制到id
                    orderData.id = orderData.booking_id;
                }
                
                if (orderData.status !== OrderStatus.PENDING) {
                    setError(`此订单当前状态为 ${orderData.status}，无法支付`);
                    setErrorDetails('只有待支付状态(pending)的订单才能进行支付');
                    setOrder(orderData); // 仍然设置订单数据以便显示
                    setLoading(false);
                    return;
                }
                
                setOrder(orderData);
                setError(null);
                setErrorDetails(null);
            } catch (error: any) {
                console.error(`获取订单详情失败 (bookingId=${bookingId}):`, error);
                setError('获取订单详情失败');
                setErrorDetails(error.response?.data?.message || error.message || '无法连接到服务器，请稍后重试');
                if (error.response?.status === 404) {
                    setError('订单不存在');
                    setErrorDetails(`ID为${bookingId}的订单不存在或已被删除`);
                } else if (error.response?.status === 403) {
                    setError('无权访问此订单');
                    setErrorDetails('您无权查看或支付此订单');
                } else if (error.response?.status === 401) {
                    setError('登录状态已过期');
                    setErrorDetails('您的登录状态已过期，请重新登录');
                    // 重定向到登录页面
                    setTimeout(() => {
                        navigate('/login', { state: { from: `/payment/${bookingId}` } });
                    }, 2000);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchBookingDetail();
    }, [bookingId, navigate, isAuthenticated]);

    // 处理支付方式变更
    const handlePaymentMethodChange = (e: any) => {
        setPaymentMethod(e.target.value);
    };

    // 下一步
    const handleNextStep = () => {
        setCurrentStep(currentStep + 1);
    };

    // 上一步
    const handlePrevStep = () => {
        setCurrentStep(currentStep - 1);
    };

    // 提交支付
    const handleSubmitPayment = async () => {
        if (!order) return;

        setProcessing(true);
        
        try {
            // 使用booking_id而不是id
            const bookingId = order.booking_id || order.id;
            console.log(`正在提交订单 ${bookingId} 的支付请求...`);
            
            // Simulate payment processing delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // 调用支付API - 使用booking_id而不是id
            const response = await bookingAPI.payOrder(bookingId);
            console.log('支付API响应:', response);
            
            // 更新状态
            setPaymentSuccess(true);
            setCurrentStep(2);
            
            // 添加订单支付成功的消息通知
            const orderTitle = order.Scenic?.name || order.Hotel?.name || `订单 ${order.booking_id}`;
            addNotification(`您的${order.booking_type === 'scenic' ? '景点' : '酒店'}订单(${orderTitle})已支付成功`, 'order');
            
            message.success('支付成功！');
        } catch (error: any) {
            console.error('支付处理失败:', error);
            let errorMsg = '支付处理失败，请稍后重试';
            
            if (error.response?.status === 403) {
                errorMsg = '权限不足，无法完成支付';
            } else if (error.response?.data?.message) {
                errorMsg = error.response.data.message;
            }
            
            message.error(errorMsg);
            setError(errorMsg);
            setErrorDetails(error.response?.data?.details || '服务器处理支付请求时出错');
        } finally {
            setProcessing(false);
        }
    };

    // 查看订单详情
    const viewOrderDetail = () => {
        navigate(`/user/orders/${bookingId}`);
    };

    // 步骤内容
    const renderStepContent = () => {
        if (!order) return null;

        switch (currentStep) {
            case 0: // 确认订单
                const orderTitle = order.Scenic?.name || order.Hotel?.name || `订单 ${order.booking_id}`;
                const orderImageUrl = order.Scenic?.images?.[0] || order.Hotel?.images?.[0];

                return (
                    <div className="payment-confirm-step">
                        <Descriptions 
                            title="订单信息" 
                            layout="vertical" 
                            bordered
                            column={{ xs: 1, sm: 2 }}
                            className="payment-order-details"
                        >
                            <Descriptions.Item label="订单编号">{order.booking_id}</Descriptions.Item>
                            <Descriptions.Item label="下单时间">{new Date(order.created_at).toLocaleString('zh-CN')}</Descriptions.Item>
                            <Descriptions.Item label="订单类型">{order.booking_type === 'scenic' ? '景点' : '酒店'}</Descriptions.Item>
                            <Descriptions.Item label="人数">{order.num_people}</Descriptions.Item>
                            <Descriptions.Item label="日期" span={2}>
                                {order.start_date}
                                {order.booking_type === 'hotel' && ` 至 ${order.end_date}`}
                            </Descriptions.Item>
                        </Descriptions>

                        <Divider />

                        <div className="payment-items">
                            <Title level={5}>预订项目</Title>
                            <div className="payment-item">
                                <SafeImage 
                                    src={orderImageUrl || ''} 
                                    alt={orderTitle} 
                                    className="payment-item-image"
                                    placeholderType={ImageType.PAYMENT}
                                    fallbackText="Item"
                                />
                                <div className="payment-item-info">
                                    <Text strong>{orderTitle}</Text>
                                    <Text type="secondary">
                                        {order.booking_type === 'scenic' ? `游览日期: ${order.start_date}` : `入住: ${order.start_date} | 退房: ${order.end_date}`}
                                    </Text>
                                    <Text type="secondary">数量: {order.num_people}人</Text>
                                </div>
                            </div>
                        </div>

                        <Divider />

                        <div className="payment-total">
                            <Text strong>应付总额:</Text>
                            <Text strong className="payment-total-amount">¥{Number(order.total_price).toFixed(2)}</Text>
                        </div>

                        <div className="payment-actions">
                            <Button onClick={() => navigate('/user?tab=orders')}>取消</Button>
                            <Button type="primary" onClick={handleNextStep}>下一步</Button>
                        </div>
                    </div>
                );
            
            case 1: // 选择支付方式
                return (
                    <div className="payment-method-step">
                        <Title level={5}>请选择支付方式</Title>
                        
                        <Radio.Group 
                            onChange={handlePaymentMethodChange} 
                            value={paymentMethod}
                            className="payment-method-options"
                        >
                            <Radio value="alipay" className="payment-method-option">
                                <div className="payment-method-content">
                                    <SafeImage 
                                        src="https://th.bing.com/th/id/R.9710db5ab36d67b94c491fe9fb1223ab?rik=UHxTNvtYQJKc3Q&riu=http%3a%2f%2fwww.kuaipng.com%2fUploads%2fpic%2fw%2f2024%2f01-20%2f149784%2fwater_149784_698_698_.png&ehk=mh8TMdPyH1Cav3vFhYq39DeAkm9%2bzLDAr1usichN21I%3d&risl=&pid=ImgRaw&r=0" 
                                        alt="支付宝" 
                                        className="payment-method-logo"
                                        placeholderType={ImageType.LOGO}
                                        fallbackText="支付宝"
                                        style={{ objectFit: 'contain', backgroundColor: 'white', borderRadius: '4px' }}
                                    />
                                    <span>支付宝</span>
                                </div>
                            </Radio>
                            <Radio value="wechat" className="payment-method-option">
                                <div className="payment-method-content">
                                    <SafeImage 
                                        src="/images/wechat-logo.png" 
                                        alt="微信支付" 
                                        className="payment-method-logo"
                                        placeholderType={ImageType.LOGO}
                                        fallbackText="微信支付"
                                    />
                                    <span>微信支付</span>
                                </div>
                            </Radio>
                            <Radio value="unionpay" className="payment-method-option">
                                <div className="payment-method-content">
                                    <SafeImage 
                                        src="/images/unionpay-logo.png" 
                                        alt="银联" 
                                        className="payment-method-logo"
                                        placeholderType={ImageType.LOGO}
                                        fallbackText="银联"
                                    />
                                    <span>银联支付</span>
                                </div>
                            </Radio>
                        </Radio.Group>

                        <Divider />

                        <div className="payment-summary">
                            <Text>订单金额:</Text>
                            <Text strong className="payment-amount">¥{Number(order.total_price).toFixed(2)}</Text>
                        </div>

                        <Paragraph type="secondary" className="payment-note">
                            注意：此为演示系统，不会产生实际支付。
                        </Paragraph>

                        <div className="payment-actions">
                            <Button onClick={handlePrevStep}>上一步</Button>
                            <Button 
                                type="primary" 
                                onClick={handleSubmitPayment} 
                                loading={processing}
                            >
                                {processing ? '处理中...' : '确认支付'}
                            </Button>
                        </div>
                    </div>
                );
            
            case 2: // 支付完成
                return (
                    <div className="payment-result-step">
                        <Result
                            status="success"
                            title="支付成功"
                            subTitle={`订单号: ${order.booking_id}`}
                            extra={[
                                <Button type="primary" key="detail" onClick={viewOrderDetail}>
                                    查看订单详情
                                </Button>,
                                <Button key="home" onClick={() => navigate('/')}>
                                    返回首页
                                </Button>,
                            ]}
                        />
                    </div>
                );
            
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="payment-container">
                <Card className="payment-card payment-loading">
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <Spin size="large" />
                        <div style={{ marginTop: '10px' }}>加载中...</div>
                    </div>
                </Card>
            </div>
        );
    }

    if (error && !order) {
        return (
            <div className="payment-container">
                <Card className="payment-card">
                    <Result
                        status="error"
                        title={error}
                        subTitle={errorDetails || "请检查订单是否存在或尝试刷新页面"}
                        extra={[
                            <Button type="primary" key="orders" onClick={() => navigate('/user?tab=orders')}>
                                返回我的订单
                            </Button>,
                            <Button key="home" onClick={() => navigate('/')}>
                                返回首页
                            </Button>
                        ]}
                    />
                </Card>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="payment-container">
                <Card className="payment-card">
                    <Result
                        status="error"
                        title="无法加载订单"
                        subTitle="请检查订单是否存在或尝试刷新页面"
                        extra={
                            <Button type="primary" onClick={() => navigate('/user?tab=orders')}>
                                返回我的订单
                            </Button>
                        }
                    />
                </Card>
            </div>
        );
    }

    return (
        <div className="payment-container">
            <Card className="payment-card">
                {error && (
                    <Alert
                        message={error}
                        description={errorDetails}
                        type="warning"
                        showIcon
                        style={{ marginBottom: 16 }}
                        action={
                            <Button size="small" type="primary" onClick={() => navigate('/user?tab=orders')}>
                                返回订单列表
                            </Button>
                        }
                    />
                )}
                
                <div className="payment-header">
                    <Title level={3}>支付订单</Title>
                    <Steps current={currentStep} className="payment-steps">
                        <Step title="确认订单" icon={<ShoppingCartOutlined />} />
                        <Step title="付款" icon={<CreditCardOutlined />} />
                        <Step title="完成" icon={<CheckCircleOutlined />} />
                    </Steps>
                </div>

                <Divider />

                <div className="payment-content">
                    {!error && renderStepContent()}
                </div>
            </Card>
        </div>
    );
};

export default Payment; 