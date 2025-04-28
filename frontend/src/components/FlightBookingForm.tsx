import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Button, Form, Input, Select, InputNumber, Spin, Divider, message, Typography, Row, Col, Alert } from 'antd';
import { UserOutlined, IdcardOutlined, PhoneOutlined, MailOutlined, ClockCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import bookingAPI, { CreateFlightBookingRequest } from '../api/order';
import { FlightInfo } from '../api/flightTicket';
import dayjs from 'dayjs';
import './FlightBookingForm.css';

const { Title, Text } = Typography;
const { Option } = Select;

/**
 * 机票预订表单组件
 */
const FlightBookingForm: React.FC = () => {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, user, checkAuthStatus, refreshTokenIfNeeded } = useAuth();
    
    // 从路由状态中获取航班信息
    const flightInfo: FlightInfo | undefined = location.state?.flightInfo;
    
    // 状态管理
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [quantity, setQuantity] = useState<number>(1);
    const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
    
    // 初始化时检查航班信息和用户登录状态
    useEffect(() => {
        console.log('FlightBookingForm组件挂载，航班信息:', flightInfo);
        
        if (!flightInfo) {
            message.error('航班信息缺失，请重新选择航班');
            navigate('/transport-map');
            return;
        }
        
        // 设置默认的乘坐日期为航班的出发日期
        if (flightInfo.fromDate) {
            setSelectedDate(flightInfo.fromDate);
        }
        
        // 如果用户已登录，预填联系信息
        if (isAuthenticated && user) {
            form.setFieldsValue({
                passengerName: user.username || '',
                contactPhone: '',
                contactEmail: user.email || ''
            });
        }
        
        setLoading(false);
    }, [flightInfo, form, isAuthenticated, user, navigate]);

    // 处理乘客数量变更
    const handleQuantityChange = (value: number | null) => {
        setQuantity(value || 1);
    };
    
    // 计算总价
    const calculateTotalPrice = (): number => {
        if (!flightInfo) return 0;
        return flightInfo.price * quantity;
    };

    // 提交预订表单
    const handleSubmit = async (values: any) => {
        console.log('开始提交机票预订表单，参数:', { 
            flightInfo,
            quantity, 
            isAuthenticated, 
            formValues: values
        });
        
        if (!flightInfo) {
            message.error('航班信息缺失，请重新选择航班');
            return;
        }

        if (!isAuthenticated) {
            message.error('请先登录再进行预订');
            navigate('/login', { state: { from: '/flight-booking' } });
            return;
        }

        // 提交前刷新token (如果需要)
        try {
            console.log('提交订单前尝试刷新token');
            const refreshed = await refreshTokenIfNeeded();
            if (!refreshed) {
                console.warn('Token无法刷新，但将继续尝试验证');
            } else {
                console.log('Token成功刷新或无需刷新');
            }
        } catch (refreshError) {
            console.error('刷新token时出错:', refreshError);
        }

        // 验证token并确保用户认证状态是最新的
        try {
            console.log('提交订单前验证认证状态');
            const isAuthValid = await checkAuthStatus();
            if (!isAuthValid) {
                console.error('认证检查失败，token可能已失效');
                message.error('登录状态已过期，请重新登录');
                navigate('/login', { state: { from: '/flight-booking' } });
                return;
            }
            console.log('认证状态有效，继续提交订单');
        } catch (authError) {
            console.error('验证认证状态时出错:', authError);
            message.error('验证用户登录状态时出错，请重新登录');
            navigate('/login');
            return;
        }

        try {
            setSubmitting(true);

            // 构建预订数据
            const bookingData: CreateFlightBookingRequest = {
                booking_type: 'flight',
                flight_id: parseInt(flightInfo.flightNo.replace(/[^0-9]/g, '')) || 0,
                flight_no: flightInfo.flightNo,
                airline: flightInfo.airline,
                from_city: flightInfo.fromCity,
                to_city: flightInfo.toCity,
                departure_time: `${flightInfo.fromDate} ${flightInfo.fromTime}`,
                arrival_time: `${flightInfo.toDate} ${flightInfo.toTime}`,
                start_date: selectedDate,
                end_date: selectedDate,
                num_people: quantity,
                passenger_name: values.passengerName,
                passenger_id_type: values.idType,
                passenger_id_no: values.idNumber,
                contact_phone: values.contactPhone,
                contact_email: values.contactEmail,
                price: flightInfo.price
            };

            console.log('提交预订数据:', bookingData);
            
            // 添加token日志记录
            const token = localStorage.getItem('token');
            console.log('使用的认证Token:', token ? `${token.substring(0, 10)}...` : '无token');

            // 调用API创建预订
            const response = await bookingAPI.createFlightBooking(bookingData);
            const newBooking = response.booking;

            message.success('机票预订成功！正在跳转到支付页面...');

            // 导航到支付页面，使用booking_id
            navigate(`/payment/${newBooking.booking_id}`);
        } catch (error: any) {
            console.error('预订失败:', error);
            
            if (error.response) {
                console.error('- 预订响应状态:', error.response.status);
                console.error('- 预订响应数据:', error.response.data);
                
                if (error.response.status === 401) {
                    console.error('- 认证失败(401)，可能是token无效或已过期');
                    message.error('登录已过期，请重新登录');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    navigate('/login', { state: { from: '/flight-booking' } });
                } else {
                    message.error(error.response?.data?.message || '预订失败，请稍后重试');
                }
            } else if (error.request) {
                console.error('- 已发送请求但未收到响应，可能是网络问题');
                message.error('网络连接异常，请检查网络后重试');
            } else {
                console.error('- 设置请求时出错:', error.message);
                message.error('预订请求异常，请稍后重试');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // 渲染预订表单
    const renderBookingForm = () => {
        if (!flightInfo) return (
            <Alert
                message="航班信息缺失"
                description="未能获取到航班信息，请返回地图页面重新选择航班。"
                type="error"
                showIcon
                action={
                    <Button type="primary" onClick={() => navigate('/transport-map')}>
                        返回地图
                    </Button>
                }
            />
        );
        
        return (
            <Card className="flight-booking-form-card" title={<Title level={4}>机票预订</Title>}>
                <div className="booking-flight-info">
                    <div className="booking-flight-header">
                        <div className="flight-airline">
                            <Text strong>{flightInfo.airline}</Text>
                            <Text type="secondary">{flightInfo.flightNo}</Text>
                        </div>
                        <Text className="flight-price" type="danger">¥{flightInfo.price.toFixed(2)}</Text>
                    </div>
                    
                    <div className="booking-flight-route">
                        <div className="flight-departure">
                            <Text strong>{flightInfo.fromTime}</Text>
                            <Text>{flightInfo.fromCity}</Text>
                            <Text type="secondary">{flightInfo.fromAirport}</Text>
                        </div>
                        
                        <div className="flight-duration">
                            <div className="flight-arrow"></div>
                            <Text type="secondary"><ClockCircleOutlined /> {flightInfo.duration}</Text>
                        </div>
                        
                        <div className="flight-arrival">
                            <Text strong>{flightInfo.toTime}</Text>
                            <Text>{flightInfo.toCity}</Text>
                            <Text type="secondary">{flightInfo.toAirport}</Text>
                        </div>
                    </div>
                    
                    <div className="booking-flight-details">
                        <div className="flight-detail-item">
                            <Text type="secondary">出发日期:</Text>
                            <Text>{flightInfo.fromDate}</Text>
                        </div>
                        <div className="flight-detail-item">
                            <Text type="secondary">到达日期:</Text>
                            <Text>{flightInfo.toDate}</Text>
                        </div>
                        <div className="flight-detail-item">
                            <Text type="secondary">航班类型:</Text>
                            <Text>{flightInfo.stops === 0 ? '直飞' : `${flightInfo.stops}次中转`}</Text>
                        </div>
                        {flightInfo.punctualityRate && (
                            <div className="flight-detail-item">
                                <Text type="secondary">准点率:</Text>
                                <Text>{flightInfo.punctualityRate}%</Text>
                            </div>
                        )}
                    </div>
                </div>

                <Divider />

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    requiredMark={false}
                    className="flight-booking-form"
                >
                    <Title level={5}>乘客信息</Title>
                    
                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item
                                label="乘客姓名"
                                name="passengerName"
                                rules={[{ required: true, message: '请输入乘客姓名' }]}
                            >
                                <Input 
                                    prefix={<UserOutlined />} 
                                    placeholder="请填写乘客真实姓名，需与证件一致" 
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    
                    <Row gutter={16}>
                        <Col xs={24} sm={8}>
                            <Form.Item
                                label="证件类型"
                                name="idType"
                                initialValue="id_card"
                                rules={[{ required: true, message: '请选择证件类型' }]}
                            >
                                <Select>
                                    <Option value="id_card">身份证</Option>
                                    <Option value="passport">护照</Option>
                                    <Option value="other">其他证件</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={16}>
                            <Form.Item
                                label="证件号码"
                                name="idNumber"
                                rules={[
                                    { required: true, message: '请输入证件号码' },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            const idType = getFieldValue('idType');
                                            if (!value) return Promise.resolve();
                                            
                                            if (idType === 'id_card') {
                                                // 简单的身份证验证
                                                const idCardReg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
                                                if (!idCardReg.test(value)) {
                                                    return Promise.reject(new Error('请输入有效的身份证号码'));
                                                }
                                            }
                                            return Promise.resolve();
                                        },
                                    }),
                                ]}
                            >
                                <Input 
                                    prefix={<IdcardOutlined />} 
                                    placeholder="请填写证件号码" 
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    
                    <Divider />
                    
                    <Title level={5}>联系人信息</Title>
                    
                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                label="联系电话"
                                name="contactPhone"
                                rules={[
                                    { required: true, message: '请输入联系电话' },
                                    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' }
                                ]}
                            >
                                <Input 
                                    prefix={<PhoneOutlined />} 
                                    placeholder="请输入手机号码" 
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                label="电子邮箱"
                                name="contactEmail"
                                rules={[
                                    { type: 'email', message: '请输入有效的邮箱地址' }
                                ]}
                            >
                                <Input 
                                    prefix={<MailOutlined />} 
                                    placeholder="请输入邮箱（选填）" 
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    
                    <Divider />
                    
                    <Title level={5}>预订信息</Title>
                    
                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                label="乘客数量"
                                name="passengerCount"
                                initialValue={1}
                                rules={[{ required: true, message: '请选择乘客数量' }]}
                            >
                                <InputNumber 
                                    min={1} 
                                    max={9} 
                                    defaultValue={1} 
                                    onChange={handleQuantityChange}
                                    className="booking-quantity-input"
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                label="特殊需求"
                                name="specialRequirements"
                            >
                                <Input placeholder="如有特殊需求请注明（选填）" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <div className="booking-summary">
                        <div className="booking-summary-item">
                            <span>单价:</span>
                            <span>¥{flightInfo.price.toFixed(2)}</span>
                        </div>
                        <div className="booking-summary-item">
                            <span>乘客:</span>
                            <span>{quantity} 人</span>
                        </div>
                        {flightInfo.tax && (
                            <div className="booking-summary-item">
                                <span>税费:</span>
                                <span>¥{flightInfo.tax.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="booking-summary-item booking-summary-total">
                            <span>总计:</span>
                            <span>¥{calculateTotalPrice().toFixed(2)}</span>
                        </div>
                    </div>

                    <Alert
                        message="预订须知"
                        description={
                            <ul className="booking-notices">
                                <li>请确保乘客姓名与证件信息一致，否则可能无法登机</li>
                                <li>预订成功后，请在30分钟内完成支付，否则订单将自动取消</li>
                                <li>退改签规则请参考航空公司相关政策</li>
                            </ul>
                        }
                        type="info"
                        showIcon
                        className="booking-notice-alert"
                    />

                    <Form.Item>
                        <Button 
                            type="primary" 
                            htmlType="submit" 
                            loading={submitting}
                            className="booking-submit-btn"
                            block
                        >
                            确认预订
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        );
    };

    return (
        <div className="flight-booking-form-container">
            {loading ? (
                <Card className="flight-booking-form-card flight-booking-loading">
                    <Spin size="large" tip="加载中..." />
                </Card>
            ) : renderBookingForm()}
        </div>
    );
};

export default FlightBookingForm; 