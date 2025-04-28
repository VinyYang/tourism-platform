import React, { useState } from 'react';
import { 
    Card, 
    Typography, 
    List, 
    Button, 
    Popconfirm, 
    Form, 
    Input,
    TimePicker, 
    Space,
    message
} from 'antd';
import { 
    DeleteOutlined, 
    ArrowUpOutlined, 
    ArrowDownOutlined,
    PlusOutlined,
    DragOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import './ItineraryDay.css';

const { Title, Text } = Typography;
const { TextArea } = Input;

export interface ItineraryItem {
    id: string;
    type: 'attraction' | 'restaurant' | 'hotel' | 'transport' | 'activity' | 'custom' | 'meal' | 'accommodation';
    title: string;
    description?: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    imageUrl?: string;
    cost?: number;
    notes?: string;
    attractionId?: string;
}

export interface ItineraryDayData {
    dayNumber: number;
    date: string;
    items: ItineraryItem[];
    notes?: string;
}

interface ItineraryDayProps {
    day: ItineraryDayData;
    onUpdate?: (dayNumber: number, updatedDay: ItineraryDayData) => void;
    onRemove?: (dayNumber: number) => void;
    onMoveUp?: (dayNumber: number) => void;
    onMoveDown?: (dayNumber: number) => void;
    canMoveUp?: boolean;
    canMoveDown?: boolean;
    onItemsChange?: (items: ItineraryItem[]) => void;
    title?: string;
    dayIndex?: number;
    dayNumber?: number;
    onAddItem?: () => void;
    onUpdateItem?: (itemIndex: number, item: ItineraryItem) => void;
    onRemoveItem?: (itemIndex: number) => void;
    onMoveItem?: (fromIndex: number, toIndex: number) => void;
    onMoveToDay?: (itemIndex: number, toDayIndex: number) => void;
    key?: number | string;
    totalDays?: number;
}

const ItineraryDay: React.FC<ItineraryDayProps> = ({
    day,
    onUpdate,
    onRemove,
    onMoveUp,
    onMoveDown,
    canMoveUp,
    canMoveDown,
    onItemsChange,
    title,
    dayIndex,
    onAddItem,
    onUpdateItem,
    onRemoveItem,
    onMoveItem,
    onMoveToDay
}) => {
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [form] = Form.useForm();
    const [showAddCustom, setShowAddCustom] = useState(false);
    const [customForm] = Form.useForm();

    // 格式化日期
    const formattedDate = dayjs(day.date).format('YYYY年MM月DD日');
    
    // 处理项目更新
    const handleItemUpdate = (updatedItem: ItineraryItem) => {
        const updatedItems = day.items.map(item => 
            item.id === updatedItem.id ? updatedItem : item
        );
        
        if (onUpdate) {
            onUpdate(day.dayNumber, {
                ...day,
                items: updatedItems
            });
        }
        
        // 调用onItemsChange回调
        if (onItemsChange) {
            onItemsChange(updatedItems);
        }
        
        setEditingItemId(null);
    };
    
    // 处理项目删除
    const handleItemDelete = (itemId: string) => {
        const itemIndex = day.items.findIndex(item => item.id === itemId);
        const updatedItems = day.items.filter(item => item.id !== itemId);
        
        // 使用新的onRemoveItem属性
        if (onRemoveItem && itemIndex !== -1) {
            onRemoveItem(itemIndex);
        } else if (onUpdate) {
            onUpdate(day.dayNumber, {
                ...day,
                items: updatedItems
            });
        }
        
        // 调用onItemsChange回调
        if (onItemsChange) {
            onItemsChange(updatedItems);
        }
    };
    
    // 处理项目顺序调整
    const handleMoveItem = (itemId: string, direction: 'up' | 'down') => {
        const currentIndex = day.items.findIndex(item => item.id === itemId);
        if (currentIndex === -1) return;
        
        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        
        if (newIndex < 0 || newIndex >= day.items.length) return;
        
        // 使用新的onMoveItem属性
        if (onMoveItem) {
            onMoveItem(currentIndex, newIndex);
            return;
        }
        
        // 原有的交换逻辑
        const newItems = [...day.items];
        [newItems[currentIndex], newItems[newIndex]] = [newItems[newIndex], newItems[currentIndex]];
        
        if (onUpdate) {
            onUpdate(day.dayNumber, {
                ...day,
                items: newItems
            });
        }
        
        // 调用onItemsChange回调
        if (onItemsChange) {
            onItemsChange(newItems);
        }
    };
    
    // 编辑项目
    const startEditing = (item: ItineraryItem) => {
        setEditingItemId(item.id);
        form.setFieldsValue({
            title: item.title,
            description: item.description,
            startTime: item.startTime ? dayjs(item.startTime, 'HH:mm') : null,
            endTime: item.endTime ? dayjs(item.endTime, 'HH:mm') : null,
            location: item.location,
            cost: item.cost,
            notes: item.notes
        });
    };
    
    // 保存编辑
    const saveEdit = () => {
        form.validateFields()
            .then(values => {
                const editedItem = day.items.find(item => item.id === editingItemId);
                if (!editedItem) return;
                
                const updatedItem = {
                    ...editedItem,
                    title: values.title,
                    description: values.description,
                    startTime: values.startTime ? values.startTime.format('HH:mm') : undefined,
                    endTime: values.endTime ? values.endTime.format('HH:mm') : undefined,
                    location: values.location,
                    cost: values.cost ? parseFloat(values.cost) : undefined,
                    notes: values.notes
                };
                
                // 使用新的onUpdateItem回调
                const itemIndex = day.items.findIndex(item => item.id === editingItemId);
                if (onUpdateItem && itemIndex !== -1) {
                    onUpdateItem(itemIndex, updatedItem);
                } else {
                    handleItemUpdate(updatedItem);
                }
            })
            .catch(error => {
                console.error('表单验证失败:', error);
            });
    };
    
    // 取消编辑
    const cancelEdit = () => {
        setEditingItemId(null);
    };
    
    // 添加自定义项目
    const handleAddCustomItem = () => {
        customForm.validateFields()
            .then(values => {
                const newItem: ItineraryItem = {
                    id: `custom-${Date.now()}`,
                    type: values.type || 'custom',
                    title: values.title,
                    description: values.description,
                    startTime: values.startTime ? values.startTime.format('HH:mm') : undefined,
                    endTime: values.endTime ? values.endTime.format('HH:mm') : undefined,
                    location: values.location,
                    cost: values.cost ? parseFloat(values.cost) : undefined,
                    notes: values.notes
                };
                
                if (onUpdate) {
                    onUpdate(day.dayNumber, {
                        ...day,
                        items: [...day.items, newItem]
                    });
                }
                
                // 调用onItemsChange回调
                if (onItemsChange) {
                    onItemsChange([...day.items, newItem]);
                }
                
                customForm.resetFields();
                setShowAddCustom(false);
                message.success('已添加自定义项目');
            })
            .catch(error => {
                console.error('表单验证失败:', error);
            });
    };
    
    // 更新日期备注
    const updateDayNotes = (notes: string) => {
        if (onUpdate) {
            onUpdate(day.dayNumber, {
                ...day,
                notes
            });
        }
    };
    
    // 渲染项目内容
    const renderItemContent = (item: ItineraryItem) => {
        if (editingItemId === item.id) {
            return (
                <Form
                    form={form}
                    layout="vertical"
                    className="item-edit-form"
                >
                    <Form.Item
                        name="title"
                        label="标题"
                        rules={[{ required: true, message: '请输入标题' }]}
                    >
                        <Input />
                    </Form.Item>
                    
                    <Space style={{ width: '100%' }}>
                        <Form.Item
                            name="startTime"
                            label="开始时间"
                            style={{ marginBottom: 0 }}
                        >
                            <TimePicker format="HH:mm" placeholder="开始时间" />
                        </Form.Item>
                        
                        <Form.Item
                            name="endTime"
                            label="结束时间"
                            style={{ marginBottom: 0 }}
                        >
                            <TimePicker format="HH:mm" placeholder="结束时间" />
                        </Form.Item>
                    </Space>
                    
                    <Form.Item
                        name="location"
                        label="地点"
                    >
                        <Input />
                    </Form.Item>
                    
                    <Form.Item
                        name="description"
                        label="描述"
                    >
                        <TextArea rows={2} />
                    </Form.Item>
                    
                    <Form.Item
                        name="cost"
                        label="费用"
                    >
                        <Input type="number" prefix="¥" />
                    </Form.Item>
                    
                    <Form.Item
                        name="notes"
                        label="备注"
                    >
                        <TextArea rows={2} />
                    </Form.Item>
                    
                    <div className="edit-actions">
                        <Button type="primary" onClick={saveEdit}>保存</Button>
                        <Button onClick={cancelEdit}>取消</Button>
                    </div>
                </Form>
            );
        }
        
        return (
            <div className="itinerary-item-content">
                {item.imageUrl && (
                    <div className="item-image-container">
                        <img src={item.imageUrl} alt={item.title} className="item-image" />
                    </div>
                )}
                
                <div className="item-details">
                    <div className="item-time-title">
                        {(item.startTime || item.endTime) && (
                            <Text type="secondary" className="item-time">
                                {item.startTime && item.startTime}
                                {item.startTime && item.endTime && ' - '}
                                {item.endTime && item.endTime}
                            </Text>
                        )}
                        <Text strong className="item-title">{item.title}</Text>
                    </div>
                    
                    {item.location && (
                        <div className="item-location">
                            <Text type="secondary">{item.location}</Text>
                        </div>
                    )}
                    
                    {item.description && (
                        <div className="item-description">
                            <Text>{item.description}</Text>
                        </div>
                    )}
                    
                    {item.cost !== undefined && (
                        <div className="item-cost">
                            <Text type="secondary">费用: ¥{item.cost.toFixed(2)}</Text>
                        </div>
                    )}
                    
                    {item.notes && (
                        <div className="item-notes">
                            <Text type="secondary" italic>备注: {item.notes}</Text>
                        </div>
                    )}
                </div>
            </div>
        );
    };
    
    // 添加自定义项目表单
    const renderAddCustomForm = () => {
        if (!showAddCustom) return null;
        
        return (
            <div className="add-custom-form-container">
                <Form
                    form={customForm}
                    layout="vertical"
                    className="custom-item-form"
                >
                    <Form.Item
                        name="title"
                        label="标题"
                        rules={[{ required: true, message: '请输入标题' }]}
                    >
                        <Input placeholder="输入项目标题" />
                    </Form.Item>
                    
                    <Form.Item
                        name="type"
                        label="类型"
                        initialValue="custom"
                    >
                        <Input.Group compact>
                            <Button.Group>
                                <Button 
                                    type={customForm.getFieldValue('type') === 'custom' ? 'primary' : 'default'}
                                    onClick={() => customForm.setFieldsValue({ type: 'custom' })}
                                >
                                    自定义
                                </Button>
                                <Button 
                                    type={customForm.getFieldValue('type') === 'transport' ? 'primary' : 'default'}
                                    onClick={() => customForm.setFieldsValue({ type: 'transport' })}
                                >
                                    交通
                                </Button>
                                <Button 
                                    type={customForm.getFieldValue('type') === 'meal' ? 'primary' : 'default'}
                                    onClick={() => customForm.setFieldsValue({ type: 'meal' })}
                                >
                                    用餐
                                </Button>
                                <Button 
                                    type={customForm.getFieldValue('type') === 'accommodation' ? 'primary' : 'default'}
                                    onClick={() => customForm.setFieldsValue({ type: 'accommodation' })}
                                >
                                    住宿
                                </Button>
                            </Button.Group>
                        </Input.Group>
                    </Form.Item>
                    
                    <Space style={{ width: '100%' }}>
                        <Form.Item
                            name="startTime"
                            label="开始时间"
                        >
                            <TimePicker format="HH:mm" placeholder="开始时间" />
                        </Form.Item>
                        
                        <Form.Item
                            name="endTime"
                            label="结束时间"
                        >
                            <TimePicker format="HH:mm" placeholder="结束时间" />
                        </Form.Item>
                    </Space>
                    
                    <Form.Item
                        name="location"
                        label="地点"
                    >
                        <Input placeholder="输入地点" />
                    </Form.Item>
                    
                    <Form.Item
                        name="description"
                        label="描述"
                    >
                        <TextArea rows={2} placeholder="输入描述信息" />
                    </Form.Item>
                    
                    <Form.Item
                        name="cost"
                        label="费用"
                    >
                        <Input type="number" prefix="¥" placeholder="0.00" />
                    </Form.Item>
                    
                    <Form.Item
                        name="notes"
                        label="备注"
                    >
                        <TextArea rows={2} placeholder="输入备注信息" />
                    </Form.Item>
                    
                    <div className="form-actions">
                        <Button type="primary" onClick={handleAddCustomItem}>添加</Button>
                        <Button onClick={() => setShowAddCustom(false)}>取消</Button>
                    </div>
                </Form>
            </div>
        );
    };
    
    return (
        <Card 
            className="itinerary-day-card"
            title={
                <div className="day-header">
                    <div className="day-title">
                        <DragOutlined className="drag-handle" />
                        <Title level={4} style={{ margin: 0 }}>第 {day.dayNumber} 天</Title>
                        <Text type="secondary">{formattedDate}</Text>
                    </div>
                    <div className="day-actions">
                        {onMoveUp && (
                            <Button 
                                type="text" 
                                icon={<ArrowUpOutlined />} 
                                disabled={!canMoveUp}
                                onClick={() => onMoveUp(day.dayNumber)}
                                title="上移"
                            />
                        )}
                        {onMoveDown && (
                            <Button 
                                type="text" 
                                icon={<ArrowDownOutlined />} 
                                disabled={!canMoveDown}
                                onClick={() => onMoveDown(day.dayNumber)}
                                title="下移"
                            />
                        )}
                        <Popconfirm
                            title="确定要删除这一天吗？"
                            description="删除后无法恢复"
                            onConfirm={() => onRemove && onRemove(day.dayNumber)}
                            okText="确定"
                            cancelText="取消"
                        >
                            <Button 
                                type="text" 
                                danger 
                                icon={<DeleteOutlined />}
                                title="删除"
                            />
                        </Popconfirm>
                    </div>
                </div>
            }
            bordered={false}
        >
            <div className="day-content">
                {day.items.length === 0 ? (
                    <div className="empty-day-message">
                        <Text type="secondary">这一天还没有安排行程，点击下方"添加项目"按钮添加行程项目</Text>
                    </div>
                ) : (
                    <List
                        className="day-items-list"
                        itemLayout="horizontal"
                        dataSource={day.items}
                        renderItem={item => (
                            <List.Item
                                key={item.id}
                                className={`itinerary-item ${item.type}`}
                                actions={editingItemId !== item.id ? [
                                    <Button 
                                        type="text" 
                                        icon={<ArrowUpOutlined />} 
                                        onClick={() => handleMoveItem(item.id, 'up')}
                                        disabled={day.items.indexOf(item) === 0}
                                        title="上移"
                                    />,
                                    <Button 
                                        type="text" 
                                        icon={<ArrowDownOutlined />} 
                                        onClick={() => handleMoveItem(item.id, 'down')}
                                        disabled={day.items.indexOf(item) === day.items.length - 1}
                                        title="下移"
                                    />,
                                    <Button 
                                        type="text" 
                                        onClick={() => startEditing(item)}
                                        title="编辑"
                                    >
                                        编辑
                                    </Button>,
                                    <Button 
                                        type="text" 
                                        danger 
                                        icon={<DeleteOutlined />} 
                                        onClick={() => handleItemDelete(item.id)}
                                        title="删除"
                                    />
                                ] : []}
                            >
                                {renderItemContent(item)}
                            </List.Item>
                        )}
                    />
                )}
                
                {renderAddCustomForm()}
                
                <div className="day-footer">
                    {!showAddCustom && (
                        <Button 
                            type="dashed" 
                            icon={<PlusOutlined />} 
                            onClick={() => onAddItem ? onAddItem() : setShowAddCustom(true)}
                            style={{ width: '100%' }}
                        >
                            添加项目
                        </Button>
                    )}
                    
                    <div className="day-notes">
                        <TextArea
                            placeholder="添加当天备注..."
                            autoSize={{ minRows: 2 }}
                            value={day.notes || ''}
                            onChange={e => updateDayNotes(e.target.value)}
                            className="day-notes-input"
                        />
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default ItineraryDay; 