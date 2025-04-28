import React from 'react';
import { Timeline, Card, Button } from 'antd';
import { 
    ClockCircleOutlined, 
    CheckCircleOutlined,
    SyncOutlined,
    CloseCircleOutlined,
    DollarCircleOutlined,
    RollbackOutlined
} from '@ant-design/icons';
import './OrderTimeline.css';

// 定义时间轴项的接口
export interface TimelineItem {
    time: string; // 时间点
    status: string; // 状态标识
    title: string; // 标题
    description: string; // 描述
}

interface OrderTimelineProps {
    items: TimelineItem[];
    collapsed?: boolean; // 是否折叠显示
}

const OrderTimeline: React.FC<OrderTimelineProps> = ({ items, collapsed = false }) => {
    const [isCollapsed, setIsCollapsed] = React.useState(collapsed);
    
    // 状态图标映射
    const getStatusIcon = (status: string) => {
        switch(status) {
            case 'created':
                return <ClockCircleOutlined style={{ color: '#1890ff' }} />;
            case 'processing':
                return <SyncOutlined spin style={{ color: '#1890ff' }} />;
            case 'confirmed':
                return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
            case 'completed':
                return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
            case 'cancelled':
                return <CloseCircleOutlined style={{ color: '#f5222d' }} />;
            case 'refunding':
                return <RollbackOutlined style={{ color: '#722ed1' }} />;
            case 'refunded':
                return <DollarCircleOutlined style={{ color: '#fa8c16' }} />;
            default:
                return <ClockCircleOutlined />;
        }
    };
    
    // 可见的时间轴项
    const visibleItems = isCollapsed ? [items[0], items[items.length - 1]] : items;
    
    // 准备Timeline的items属性
    const timelineItems = visibleItems.map((item, index) => ({
        key: index.toString(),
        dot: getStatusIcon(item.status),
        color: getStatusColor(item.status),
        children: (
            <div className="timeline-item">
                <div className="timeline-title">
                    <strong>{item.title}</strong>
                    <span className="timeline-time">{item.time}</span>
                </div>
                <div className="timeline-description">{item.description}</div>
            </div>
        )
    }));
    
    // 如果折叠状态且有超过2个项目，添加中间的折叠提示
    if (isCollapsed && items.length > 2) {
        timelineItems.splice(1, 0, {
            key: 'collapse',
            dot: <span className="timeline-collapse-dot">{items.length - 2}</span>,
            color: 'gray',
            children: (
                <div className="timeline-collapse-text">
                    点击"查看完整进度"展开全部{items.length}个节点
                </div>
            )
        });
    }
    
    return (
        <Card className="order-timeline-card">
            <div className="timeline-header">
                <h3>订单进度</h3>
                {items.length > 2 && (
                    <Button 
                        type="link" 
                        onClick={() => setIsCollapsed(!isCollapsed)}
                    >
                        {isCollapsed ? '查看完整进度' : '收起'}
                    </Button>
                )}
            </div>
            
            <Timeline items={timelineItems} />
        </Card>
    );
};

// 根据状态获取颜色
const getStatusColor = (status: string): string => {
    switch(status) {
        case 'created':
            return 'blue';
        case 'processing':
            return 'blue';
        case 'confirmed':
            return 'green';
        case 'completed':
            return 'green';
        case 'cancelled':
            return 'red';
        case 'refunding':
            return 'purple';
        case 'refunded':
            return 'orange';
        default:
            return 'gray';
    }
};

export default OrderTimeline; 