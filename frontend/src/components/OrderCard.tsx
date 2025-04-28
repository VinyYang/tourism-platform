import React, { useState } from 'react';
import { Button, Tag, message, Modal, Tooltip } from 'antd';
import { CopyOutlined, ShareAltOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { Booking } from '../api/order';
import { useTranslation } from 'react-i18next';
import './OrderCard.css';

// 新增：统一的占位图片 URL
const PLACEHOLDER_IMAGE_URL = 'https://www.bing.com/th/id/OIP.SN37cIgAP7CASsPSaVPZjAHaHa?w=173&h=180&c=7&r=0&o=5&dpr=2&pid=1.7';

interface OrderCardProps {
    order: Booking;
    onCancel: (orderId: number) => void;
    onReview: (orderId: string | number, title: string) => void;
    isLoading: boolean;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onCancel, onReview, isLoading }) => {
    const { t } = useTranslation();
    const [shareModalVisible, setShareModalVisible] = useState(false);
    const [shareLink, setShareLink] = useState('');
    
    // 增强版格式化日期的函数
    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return '未知日期';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '无效日期';
            
            // 使用toLocaleDateString格式化为YYYY-MM-DD格式
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (error) {
            console.error('日期格式化错误:', error);
            return '无效日期';
        }
    };
    
    // 格式化时间的函数（包含时分秒）
    const formatDateTime = (dateString: string | undefined) => {
        if (!dateString) return '未知日期';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '无效日期';
            
            // 格式化为YYYY-MM-DD HH:MM:SS格式
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        } catch (error) {
            console.error('日期时间格式化错误:', error);
            return '未知时间';
        }
    };
    
    // 获取订单标题，优先显示景点或酒店名称，确保不显示undefined
    const orderTitle = (() => {
        // 首先尝试获取景点名称
        if (order.Scenic && order.Scenic.name) {
            return order.Scenic.name;
        }
        // 然后尝试获取酒店名称
        if (order.Hotel && order.Hotel.name) {
            return order.Hotel.name;
        }
        // 如果是景点类型订单但没有景点数据，显示景点类型
        if (order.booking_type === 'scenic') {
            return `景点订单 ${order.booking_id || ''}`;
        }
        // 如果是酒店类型订单但没有酒店数据，显示酒店类型
        if (order.booking_type === 'hotel') {
            return `酒店订单 ${order.booking_id || ''}`;
        }
        // 兜底显示订单ID
        return `订单 ${order.booking_id || '未知'}`;
    })();
    
    // 获取订单图片，优先显示景点或酒店图片
    let orderImage = PLACEHOLDER_IMAGE_URL; // 使用新的占位符 URL
    try {
        // 安全地解析图片 - 景点
        if (order.Scenic && order.Scenic.images) {
            let imageList = [];
            
            // 尝试各种可能的图片格式
            if (Array.isArray(order.Scenic.images)) {
                imageList = order.Scenic.images;
            } else if (typeof order.Scenic.images === 'string') {
                try {
                    // 尝试解析JSON字符串
                    const parsed = JSON.parse(order.Scenic.images);
                    imageList = Array.isArray(parsed) ? parsed : [order.Scenic.images];
                } catch {
                    // 如果解析失败，就将字符串作为单个图片路径使用
                    imageList = [order.Scenic.images];
                }
            }
            
            // 使用第一个有效图片
            if (imageList.length > 0 && imageList[0]) {
                orderImage = imageList[0];
            }
        } 
        // 安全地解析图片 - 酒店
        else if (order.Hotel && order.Hotel.images) {
            let imageList = [];
            
            // 尝试各种可能的图片格式
            if (Array.isArray(order.Hotel.images)) {
                imageList = order.Hotel.images;
            } else if (typeof order.Hotel.images === 'string') {
                try {
                    // 尝试解析JSON字符串
                    const parsed = JSON.parse(order.Hotel.images);
                    imageList = Array.isArray(parsed) ? parsed : [order.Hotel.images];
                } catch {
                    // 如果解析失败，就将字符串作为单个图片路径使用
                    imageList = [order.Hotel.images];
                }
            }
            
            // 使用第一个有效图片
            if (imageList.length > 0 && imageList[0]) {
                orderImage = imageList[0];
            }
        }
    } catch (error) {
        console.error('解析订单图片出错:', error, '使用默认图片');
        // 使用默认图片
    }
    
    // 添加错误处理，当图片加载失败时使用备用图片
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        e.currentTarget.src = PLACEHOLDER_IMAGE_URL; // 使用新的占位符 URL
    };
    
    // 复制订单号功能
    const copyOrderNumber = () => {
        const orderNumber = `ORD${order.booking_id || ''}`;
        navigator.clipboard.writeText(orderNumber)
            .then(() => {
                message.success('订单号已复制到剪贴板');
            })
            .catch(err => {
                console.error('复制失败:', err);
                message.error('复制失败，请手动复制');
            });
    };
    
    // 分享订单功能
    const shareOrder = async () => {
        try {
            // 这里应该调用API获取分享链接
            // const response = await userAPI.shareOrder(order.booking_id);
            // setShareLink(response.data.shareData.link);
            
            // 模拟API响应
            setShareLink(`https://yourwebsite.com/share/order/${btoa(`${order.booking_id}-${Date.now()}`)}`);
            setShareModalVisible(true);
        } catch (error) {
            console.error('获取分享链接失败:', error);
            message.error('获取分享链接失败，请稍后重试');
        }
    };
    
    // 状态标签的颜色和显示文本
    let statusColor = 'default';
    let displayText = '未知状态';
    const status = order.status;
    
    // 如果订单对象包含statusInfo属性，使用它来设置状态显示
    if (order.statusInfo) {
        statusColor = order.statusInfo.color;
        displayText = order.statusInfo.text;
    } else {
        // 兼容没有statusInfo的情况，使用默认映射
        switch(status) {
            case 'pending':
                statusColor = 'orange';
                displayText = '待处理';
                break;
            case 'processing':
                statusColor = 'blue';
                displayText = '处理中';
                break;
            case 'confirmed':
                statusColor = 'cyan';
                displayText = '已确认/待出行';
                break;
            case 'completed':
                statusColor = 'green';
                displayText = '已完成';
                break;
            case 'cancelled':
                statusColor = 'grey';
                displayText = '已取消';
                break;
            case 'refunding':
                statusColor = 'purple';
                displayText = '退款中';
                break;
            case 'refunded':
                statusColor = 'red';
                displayText = '已退款';
                break;
        }
    }
    
    // 根据订单类型获取类型标签文本和颜色
    const getOrderTypeTag = () => {
        if (order.booking_type === 'scenic') {
            return { text: '景点门票', color: '#108ee9' };
        } else if (order.booking_type === 'hotel') {
            return { text: '酒店住宿', color: '#87d068' };
        } else if (order.booking_type === 'flight') {
            return { text: '机票', color: '#722ed1' };
        } else {
            return { text: '未知类型', color: '#d9d9d9' };
        }
    };
    
    const orderTypeTag = getOrderTypeTag();
    
    // 格式化订单日期显示
    const getFormattedDateRange = () => {
        if (order.booking_type === 'hotel') {
            // 酒店显示入住至退房日期
            if (order.start_date && order.end_date) {
                return `${formatDate(order.start_date)} 至 ${formatDate(order.end_date)} (共${calculateDays(order.start_date, order.end_date)}晚)`;
            } else if (order.start_date) {
                return formatDate(order.start_date);
            }
        } else if (order.booking_type === 'scenic') {
            // 景点只显示参观日期
            if (order.start_date) {
                return formatDate(order.start_date);
            }
        }
        return '未知日期';
    };
    
    // 计算两个日期之间的天数
    const calculateDays = (startDate: string, endDate: string): number => {
        try {
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
            
            // 计算相差的毫秒数并转换为天数
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays || 1; // 如果计算结果为0，返回1
        } catch (error) {
            console.error('计算天数错误:', error);
            return 1;
        }
    };
    
    return (
        <div className={`order-card ${order.status}`}>
            <div className="order-image">
                <img src={orderImage} alt={orderTitle} onError={handleImageError} />
            </div>
            <div className="order-details">
                <div className="order-header">
                    <Tag color={orderTypeTag.color} className="order-type-badge">{orderTypeTag.text}</Tag>
                    <div className="order-title">{orderTitle}</div>
                    <Tag color={statusColor}>{displayText}</Tag>
                </div>
                <div className="order-info">
                    <div className="order-number">
                        订单号: <strong>ORD{order.booking_id || '未知'}</strong>
                        <Tooltip title="复制订单号">
                            <Button
                                type="text"
                                icon={<CopyOutlined />}
                                onClick={copyOrderNumber}
                                size="small"
                            />
                        </Tooltip>
                    </div>
                    <span>人数: {order.num_people || 0}人</span>
                    <span>日期: {getFormattedDateRange()}</span>
                    <span>总价: <span className="order-price">￥{(order.total_price || 0).toFixed(2)}</span></span>
                    <span>创建时间: {formatDateTime(order.created_at)}</span>
                </div>
                <div className="order-actions">
                    <Tooltip title="分享订单">
                        <Button
                            type="text"
                            icon={<ShareAltOutlined />}
                            onClick={shareOrder}
                            size="small"
                        />
                    </Tooltip>
                    
                    {(order.status === 'pending' || order.status === 'confirmed') && order.booking_id && (
                        <Button
                            danger
                            loading={isLoading}
                            size="small"
                            onClick={() => onCancel(order.booking_id)}
                        >
                            取消订单
                        </Button>
                    )}
                    
                    {order.status === 'completed' && order.booking_id && (
                        <Button
                            type="primary"
                            size="small"
                            onClick={() => onReview(order.booking_id.toString(), orderTitle)}
                        >
                            评价
                        </Button>
                    )}
                    
                    {order.booking_id ? (
                        <Link to={`/user/orders/${order.booking_id}`} className="view-order-link">
                            <Button size="small">查看详情</Button>
                        </Link>
                    ) : (
                        <Button size="small" disabled title="订单ID无效">查看详情</Button>
                    )}
                </div>
            </div>
            
            <Modal
                title="分享订单"
                open={shareModalVisible}
                onCancel={() => setShareModalVisible(false)}
                footer={[
                    <Button key="copy" type="primary" onClick={() => {
                        navigator.clipboard.writeText(shareLink)
                            .then(() => message.success('分享链接已复制'))
                            .catch(() => message.error('复制失败，请手动复制'));
                    }}>
                        复制链接
                    </Button>,
                    <Button key="close" onClick={() => setShareModalVisible(false)}>
                        关闭
                    </Button>
                ]}
            >
                <p>将以下链接分享给朋友，他们可以查看您的订单信息：</p>
                <div className="share-link-container">
                    <input 
                        type="text" 
                        value={shareLink} 
                        readOnly 
                        className="share-link-input"
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                </div>
                <p className="share-note">注意：分享链接有效期为7天，请勿分享给不信任的人。</p>
            </Modal>
        </div>
    );
};

export default OrderCard; 