import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card, Button, Form, Input, DatePicker, InputNumber, Spin, Divider, message, Typography, Row, Col } from 'antd';
import { useAuth } from '../context/AuthContext';
import scenicAPI, { ScenicDetail, ApiResponse } from '../api/scenic';
import hotelAPI, { HotelDetail, HotelRoom } from '../api/hotel';
import bookingAPI, { CreateBookingRequest } from '../api/order';
import './BookingForm.css';
import dayjs from 'dayjs'; // Import dayjs for date formatting

const { Title, Text } = Typography;

/**
 * 预订表单组件 - 支持景点和酒店预订
 */
const BookingForm: React.FC = () => {
    console.log('[BookingForm] Component rendering started'); // 添加日志
    // 从路由参数中获取预订目标ID
    const { scenicId, hotelId } = useParams<{ scenicId: string; hotelId: string }>();
    const [searchParams] = useSearchParams();
    const roomId = searchParams.get('roomId');
    
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const { isAuthenticated, user, checkAuthStatus, refreshTokenIfNeeded } = useAuth();
    
    // 根据路由参数判断预订类型
    const bookingType = hotelId ? 'hotel' : 'scenic';
    const targetId = hotelId || scenicId;
    
    // 状态管理
    const [scenic, setScenic] = useState<ScenicDetail | null>(null);
    const [hotel, setHotel] = useState<HotelDetail | null>(null);
    const [selectedRoom, setSelectedRoom] = useState<HotelRoom | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [quantity, setQuantity] = useState<number>(1);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [submitting, setSubmitting] = useState<boolean>(false);

    // 组件挂载时记录路由参数
    useEffect(() => {
        console.log('BookingForm组件挂载，路由参数:', { scenicId, hotelId, roomId, bookingType, targetId });
        
        if (!targetId) {
            console.error(`路由参数${bookingType}Id缺失`);
            message.error('无效的预订目标ID');
            navigate(bookingType === 'hotel' ? '/hotels' : '/scenic');
        }
    }, [scenicId, hotelId, roomId, bookingType, targetId, navigate]);

    // 加载预订目标详情数据
    useEffect(() => {
        const fetchTargetDetail = async () => {
            if (!targetId) {
                return;
            }

            try {
                setLoading(true);
                console.log(`获取${bookingType === 'hotel' ? '酒店' : '景点'}详情，ID:`, targetId);
                
                if (bookingType === 'hotel') {
                    // 获取酒店详情
                    const response = await hotelAPI.getHotelDetail(parseInt(targetId));
                    console.log('获取酒店详情响应:', response.data);
                    
                    // 处理酒店数据，确保price字段始终有值
                    const hotelData: HotelDetail = {
                        ...response.data,
                        // 确保价格字段存在，如果undefined则提供默认值0
                        price: response.data.price !== undefined ? response.data.price : 0
                    };
                    
                    console.log('处理后的酒店数据:', hotelData);
                    setHotel(hotelData);
                    
                    // 如果有指定房间ID，查找并设置选定的房间
                    if (roomId && hotelData.rooms && hotelData.rooms.length > 0) {
                        const room = hotelData.rooms.find(r => r.id === parseInt(roomId) || r.id.toString() === roomId);
                        if (room) {
                            console.log('找到指定的房间:', room);
                            setSelectedRoom(room);
                        } else {
                            console.warn(`未找到ID为${roomId}的房间，使用默认房间`);
                            // 使用第一个可用房间作为默认
                            const availableRoom = hotelData.rooms.find(r => r.available);
                            if (availableRoom) {
                                setSelectedRoom(availableRoom);
                            }
                        }
                    } else if (hotelData.rooms && hotelData.rooms.length > 0) {
                        // 如果没有指定房间ID，使用第一个可用的房间
                        const availableRoom = hotelData.rooms.find(r => r.available);
                        if (availableRoom) {
                            setSelectedRoom(availableRoom);
                        }
                    }
                    
                    // 设置默认入住和离店日期（今天和明天）
                    const today = dayjs();
                    const tomorrow = today.add(1, 'day');
                    setStartDate(today.format('YYYY-MM-DD'));
                    setEndDate(tomorrow.format('YYYY-MM-DD'));
                    
                } else {
                    // 获取景点详情
                    console.log(`[BookingForm] useEffect: Attempting to fetch scenic details for ID: ${targetId}`);
                    const response = await scenicAPI.getScenicDetail(parseInt(targetId));
                    console.log('[BookingForm] useEffect: scenicAPI.getScenicDetail raw response received');
                    console.log('获取景点详情响应:', response);

                    // 添加内部 try-catch 来隔离处理和状态更新错误
                    try {
                        console.log('[BookingForm] useEffect: Attempting to process response.data');
                        if (!response || !response.data) {
                             console.error('[BookingForm] useEffect: Invalid response or response.data is null/undefined!');
                             throw new Error('获取到的景点数据无效');
                        }
                        console.log('[BookingForm] useEffect: response.data to process:', response.data);

                        // 处理不同格式的API响应
                        let scenicDetail: ScenicDetail;
                        
                        // 检查response.data是否符合ApiResponse<ScenicDetail>格式
                        const isApiResponseFormat = 
                            response.data && 
                            typeof response.data === 'object' && 
                            'success' in response.data && 
                            'data' in response.data;
                        
                        if (isApiResponseFormat) {
                            // 新的API格式 - 嵌套结构
                            const apiResponse = response.data as ApiResponse<ScenicDetail>;
                            scenicDetail = apiResponse.data;
                        } else {
                            // 兼容旧格式 - 直接结构
                            scenicDetail = response.data as ScenicDetail;
                        }
                        
                        // 确保所有必需字段都存在
                        const scenicData: ScenicDetail = {
                            ...scenicDetail,
                            // 确保价格字段存在，优先使用price，其次使用ticket_price
                            price: scenicDetail.price !== undefined ? scenicDetail.price :
                                   scenicDetail.ticket_price !== undefined ? scenicDetail.ticket_price :
                                   scenicDetail.ticketPrice !== undefined ? scenicDetail.ticketPrice : 0
                        };

                        console.log('[BookingForm] useEffect: scenicData processed successfully');
                        console.log('处理后的景点数据:', scenicData);
                        setScenic(scenicData);
                        console.log('[BookingForm] useEffect: setScenic called successfully');

                        // 设置默认游览日期（今天）
                        const today = dayjs();
                        setStartDate(today.format('YYYY-MM-DD'));
                        setEndDate(today.format('YYYY-MM-DD'));
                        console.log('[BookingForm] useEffect: Dates set successfully');

                    } catch (processingError) {
                         console.error('[BookingForm] useEffect: Error processing scenic data or updating state:', processingError);
                         message.error('处理景点数据时出错，请稍后重试');
                         // 可以在这里设置一个错误状态，以便UI显示错误信息
                    }
                }
                
                // 如果用户已登录，预填联系信息
                if (isAuthenticated && user) {
                    // 从用户对象中获取用户名
                    form.setFieldsValue({
                        contactName: user.username || '',
                        contactPhone: '' // 用户对象中没有手机号字段，需要用户手动输入
                    });
                }
            } catch (error) {
                console.error(`获取${bookingType}详情失败:`, error);
                message.error(`获取${bookingType === 'hotel' ? '酒店' : '景点'}详情失败，请稍后重试`);
            } finally {
                setLoading(false);
            }
        };

        fetchTargetDetail();
    }, [targetId, bookingType, roomId, form, isAuthenticated, user]);

    // 处理数量变更
    const handleQuantityChange = (value: number | null) => {
        setQuantity(value || 1);
    };

    // 处理日期变更
    const handleDateChange = (dates: any, dateStrings: string | string[]) => {
        if (bookingType === 'hotel' && Array.isArray(dateStrings) && dateStrings.length === 2) {
            // 酒店预订，设置入住和离店日期
            setStartDate(dateStrings[0]);
            setEndDate(dateStrings[1]);
        } else if (typeof dateStrings === 'string') {
            // 景点预订，设置游览日期
            setStartDate(dateStrings);
            setEndDate(dateStrings);
        }
    };

    // 提交预订表单
    const handleSubmit = async (values: any) => {
        console.log('开始提交预订表单，参数:', { 
            bookingType,
            targetId, 
            roomId,
            startDate,
            endDate,
            quantity, 
            isAuthenticated, 
            target: bookingType === 'hotel' ? 
                (hotel ? { id: hotel.id, name: hotel.name, price: hotel.price, selectedRoom } : null) : 
                (scenic ? { id: scenic.id, name: scenic.name, price: scenic.price } : null)
        });
        
        if (!targetId) {
            console.error('提交订单时目标ID缺失');
            message.error(`无效的${bookingType === 'hotel' ? '酒店' : '景点'}ID`);
            return;
        }

        if (!startDate) {
            message.error(bookingType === 'hotel' ? '请选择入住日期' : '请选择游览日期');
            return;
        }

        if (bookingType === 'hotel' && !endDate) {
            message.error('请选择离店日期');
            return;
        }

        if (bookingType === 'hotel' && !selectedRoom) {
            message.error('请选择房间');
            return;
        }

        if (!isAuthenticated) {
            message.error('请先登录再进行预订');
            navigate('/login', { state: { from: `/booking/${bookingType === 'hotel' ? 'hotel/' : ''}${targetId}${roomId ? `?roomId=${roomId}` : ''}` } });
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
            // 即使刷新失败，也继续后续验证
        }

        // 验证token并确保用户认证状态是最新的
        try {
            console.log('提交订单前验证认证状态');
            const isAuthValid = await checkAuthStatus();
            if (!isAuthValid) {
                console.error('认证检查失败，token可能已失效');
                message.error('登录状态已过期，请重新登录');
                navigate('/login', { state: { from: `/booking/${bookingType === 'hotel' ? 'hotel/' : ''}${targetId}${roomId ? `?roomId=${roomId}` : ''}` } });
                return;
            }
            console.log('认证状态有效，继续提交订单');
        } catch (authError) {
            console.error('验证认证状态时出错:', authError);
            message.error('验证用户登录状态时出错，请重新登录');
            navigate('/login');
            return;
        }

        // 检查价格是否有效
        const price = bookingType === 'hotel' ? 
                    (selectedRoom?.price !== undefined ? selectedRoom.price : 
                     hotel?.price !== undefined ? hotel.price : null) : 
                    (scenic?.price !== undefined ? scenic.price : 
                     scenic?.ticket_price !== undefined ? scenic.ticket_price : null);
                    
        if (price === null) {
            message.error(`无法获取${bookingType === 'hotel' ? '酒店' : '景点'}价格信息，请稍后再试`);
            return;
        }

        try {
            setSubmitting(true);

            // 构建预订数据，确保所有必需字段都存在
            const bookingData: CreateBookingRequest = {
                booking_type: bookingType,
                start_date: startDate,
                end_date: endDate,
                num_people: quantity
            };

            // 根据预订类型设置不同的目标ID
            if (bookingType === 'hotel') {
                bookingData.hotel_id = parseInt(targetId);
                
                // 扩展CreateBookingRequest接口以适应需求
                const apiData = {
                    ...bookingData,
                    room_id: selectedRoom ? selectedRoom.id : undefined
                };

                console.log('提交预订数据:', apiData);
                
                // 添加token日志记录
                const token = localStorage.getItem('token');
                console.log('使用的认证Token:', token ? `${token.substring(0, 10)}...` : '无token');

                // 调用API创建预订
                const response = await bookingAPI.createBooking(apiData as CreateBookingRequest);
                const newBooking = response.booking; // 从响应中获取预订对象

                message.success('预订成功！正在跳转到支付页面...');

                // 导航到支付页面，使用booking_id
                navigate(`/payment/${newBooking.booking_id}`);
            } else {
                bookingData.scenic_id = parseInt(targetId);
                
                console.log('提交预订数据:', bookingData);
                
                // 添加token日志记录
                const token = localStorage.getItem('token');
                console.log('使用的认证Token:', token ? `${token.substring(0, 10)}...` : '无token');

                // 调用API创建预订
                const response = await bookingAPI.createBooking(bookingData);
                const newBooking = response.booking; // 从响应中获取预订对象

                message.success('预订成功！正在跳转到支付页面...');

                // 导航到支付页面，使用booking_id
                navigate(`/payment/${newBooking.booking_id}`);
            }

        } catch (error: any) {
            console.error('预订失败:', error);
            // 增强错误日志，显示更多错误详情
            if (error.response) {
                console.error('- 预订响应状态:', error.response.status);
                console.error('- 预订响应数据:', error.response.data);
                
                if (error.response.status === 401) {
                    console.error('- 认证失败(401)，可能是token无效或已过期');
                    message.error('登录已过期，请重新登录');
                    // 清除本地存储的无效token
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    navigate('/login', { state: { from: `/booking/${bookingType === 'hotel' ? 'hotel/' : ''}${targetId}${roomId ? `?roomId=${roomId}` : ''}` } });
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

    // 获取图片URL的辅助函数
    const getFirstImageUrl = (imagesData: string[] | string | undefined): string => {
        if (!imagesData) return '';
        
        if (Array.isArray(imagesData) && imagesData.length > 0) {
            return imagesData[0];
        } else if (typeof imagesData === 'string') {
            return imagesData;
        }
        
        return '';
    };
    
    // 渲染预订表单
    const renderBookingForm = () => {
        // 根据预订类型决定渲染内容
        const targetItem = bookingType === 'hotel' ? hotel : scenic;
        if (!targetItem) return null;
        
        // 准备显示数据
        const title = bookingType === 'hotel' ? '酒店预订' : '景点门票预订';
        const itemName = targetItem.name;
        const itemImage = bookingType === 'hotel' ? 
                        (hotel?.coverImage || getFirstImageUrl(hotel?.images)) : 
                        (scenic?.coverImage || getFirstImageUrl(scenic?.images));
        const itemLocation = `${targetItem.city} · ${targetItem.address}`;
        
        // 根据选定的房间或默认价格获取价格信息
        const itemPrice = bookingType === 'hotel' ? 
                        (selectedRoom?.price !== undefined ? `¥${selectedRoom.price}` :
                         hotel?.price !== undefined ? `¥${hotel.price}` : '价格待定') : 
                        (scenic?.price !== undefined ? `¥${scenic.price}` : 
                         scenic?.ticket_price !== undefined ? `¥${scenic.ticket_price}` : '价格待定');
                         
        const priceUnit = bookingType === 'hotel' ? '/晚' : '/人';
        
        // 计算总价
        const calculateTotalPrice = () => {
            let price = 0;
            if (bookingType === 'hotel') {
                // 使用选定房间的价格，如果没有则使用酒店默认价格
                const roomPrice = selectedRoom?.price !== undefined ? selectedRoom.price : 
                                 hotel?.price !== undefined ? hotel.price : 0;
                
                if (roomPrice) {
                    // 计算入住天数
                    const startDateObj = dayjs(startDate);
                    const endDateObj = dayjs(endDate);
                    const days = endDateObj.diff(startDateObj, 'day') || 1; // 至少1天
                    price = roomPrice * days;
                }
            } else if (scenic?.price !== undefined) {
                price = scenic.price * quantity;
            } else if (scenic?.ticket_price !== undefined) {
                price = scenic.ticket_price * quantity;
            }
            return price.toFixed(2);
        };
        
        return (
            <Card className="booking-form-card" title={<Title level={4}>{title}</Title>}>
                <div className="booking-product-info">
                    <div className="booking-product-image">
                        <img 
                            src={itemImage} 
                            alt={itemName} 
                        />
                    </div>
                    <div className="booking-product-details">
                        <Title level={4}>{itemName}</Title>
                        <Text type="secondary" className="booking-product-location">
                            {itemLocation}
                        </Text>
                        {bookingType === 'hotel' && selectedRoom && (
                            <Text className="booking-product-room">
                                已选房型: {selectedRoom.name}
                            </Text>
                        )}
                        <Text className="booking-product-price">
                            {itemPrice} <small>{priceUnit}</small>
                        </Text>
                    </div>
                </div>

                <Divider />

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    requiredMark={false}
                    className="booking-form"
                >
                    <Row gutter={16}>
                        {bookingType === 'hotel' ? (
                            // 酒店预订日期选择（入住和离店）
                            <Col span={24}>
                                <Form.Item
                                    label="入住/离店日期"
                                    name="stayPeriod"
                                    rules={[{ required: true, message: '请选择入住和离店日期' }]}
                                >
                                    <DatePicker.RangePicker 
                                        className="booking-date-picker" 
                                        onChange={handleDateChange}
                                        placeholder={['入住日期', '离店日期']}
                                        disabledDate={(current) => {
                                            // 禁用今天之前的日期
                                            return current && current.valueOf() < Date.now() - 24 * 60 * 60 * 1000;
                                        }}
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>
                            </Col>
                        ) : (
                            // 景点预订日期选择（游览日期）
                            <Col xs={24} sm={12}>
                                <Form.Item
                                    label="游览日期"
                                    name="visitDate"
                                    rules={[{ required: true, message: '请选择游览日期' }]}
                                >
                                    <DatePicker 
                                        className="booking-date-picker" 
                                        onChange={handleDateChange}
                                        placeholder="选择日期"
                                        disabledDate={(current) => {
                                            // 禁用今天之前的日期
                                            return current && current.valueOf() < Date.now();
                                        }}
                                    />
                                </Form.Item>
                            </Col>
                        )}
                        
                        <Col xs={24} sm={bookingType === 'hotel' ? 24 : 12}>
                            <Form.Item
                                label={bookingType === 'hotel' ? '入住人数' : '门票数量'}
                                name="quantity"
                                initialValue={1}
                                rules={[{ required: true, message: `请选择${bookingType === 'hotel' ? '入住人数' : '门票数量'}` }]}
                            >
                                <InputNumber 
                                    min={1} 
                                    max={10} 
                                    defaultValue={1} 
                                    onChange={handleQuantityChange}
                                    className="booking-quantity-input"
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        label="联系人姓名"
                        name="contactName"
                        rules={[{ required: true, message: '请输入联系人姓名' }]}
                    >
                        <Input placeholder="请输入您的姓名" />
                    </Form.Item>

                    <Form.Item
                        label="联系电话"
                        name="contactPhone"
                        rules={[
                            { required: true, message: '请输入联系电话' },
                            { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' }
                        ]}
                    >
                        <Input placeholder="请输入您的手机号码" />
                    </Form.Item>

                    <Form.Item
                        label="备注"
                        name="remarks"
                    >
                        <Input.TextArea 
                            placeholder="如有特殊要求，请在此说明" 
                            rows={3}
                        />
                    </Form.Item>

                    <Divider />

                    <div className="booking-summary">
                        <div className="booking-summary-item">
                            <span>单价:</span>
                            <span>{itemPrice}</span>
                        </div>
                        {bookingType === 'hotel' && startDate && endDate && (
                            <div className="booking-summary-item">
                                <span>入住时长:</span>
                                <span>{dayjs(endDate).diff(dayjs(startDate), 'day') || 1} 晚</span>
                            </div>
                        )}
                        {bookingType !== 'hotel' && (
                            <div className="booking-summary-item">
                                <span>数量:</span>
                                <span>{quantity} 人</span>
                            </div>
                        )}
                        <div className="booking-summary-item booking-summary-total">
                            <span>总计:</span>
                            <span>¥{calculateTotalPrice()}</span>
                        </div>
                    </div>

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
        <div className="booking-form-container">
            {loading ? (
                <Card className="booking-form-card booking-loading">
                    <Spin size="large" tip="加载中..." />
                </Card>
            ) : bookingType === 'hotel' ? (
                hotel ? renderBookingForm() : (
                    <Card className="booking-form-card">
                        <div className="booking-error">
                            <Title level={4}>未找到酒店信息</Title>
                            <Button type="primary" onClick={() => navigate('/hotels')}>
                                返回酒店列表
                            </Button>
                        </div>
                    </Card>
                )
            ) : (
                scenic ? renderBookingForm() : (
                    <Card className="booking-form-card">
                        <div className="booking-error">
                            <Title level={4}>未找到景点信息</Title>
                            <Button type="primary" onClick={() => navigate('/scenic')}>
                                返回景点列表
                            </Button>
                        </div>
                    </Card>
                )
            )}
        </div>
    );
};

export default BookingForm;