import React, { useState, useEffect } from 'react';
import { 
    Card, 
    Button, 
    Input, 
    DatePicker, 
    Form, 
    message, 
    Skeleton, 
    Typography, 
    Divider,
    Modal,
    Space,
    Tabs,
    Tooltip
} from 'antd';
import { 
    PlusOutlined, 
    SaveOutlined, 
    ShareAltOutlined,
    DeleteOutlined,
    EditOutlined,
    CopyOutlined,
    DownloadOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { useParams, useNavigate } from 'react-router-dom';
import ItineraryDay from './ItineraryDay';
import { useAuth } from '../context/AuthContext';
import ScenicSelector from './ScenicSelector';
import './ItineraryEditor.css';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

// 行程项目接口定义
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
    time?: string;
}

// 行程计划接口定义
export interface Itinerary {
    id?: string;
    title: string;
    description: string;
    startDate: moment.Moment | null;
    endDate: moment.Moment | null;
    coverImage?: string;
    destination: string;
    days: ItineraryDayData[];
    isPublic: boolean;
    createdBy?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface ItineraryDayData {
    id: string;
    title: string;
    date?: string;
    dayNumber?: number;
    items: ItineraryItem[];
}

// 定义行程编辑器属性接口
interface ItineraryEditorProps {
    initialData?: {
        id?: string;
        title?: string;
        description?: string;
        days?: ItineraryDayData[];
        startDate?: string;
        endDate?: string;
    };
    onSave?: (data: any) => void;
}

/**
 * 行程编辑器组件
 * 用于创建和编辑多天行程计划
 */
const ItineraryEditor: React.FC<ItineraryEditorProps> = ({ initialData, onSave }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const [form] = Form.useForm();
    
    const [itinerary, setItinerary] = useState<Itinerary>({
        title: initialData?.title || '未命名行程',
        description: initialData?.description || '',
        startDate: initialData?.startDate ? moment(initialData.startDate) : null,
        endDate: initialData?.endDate ? moment(initialData.endDate) : null,
        destination: '',
        days: initialData?.days || [],
        isPublic: true
    });
    
    const [loading, setLoading] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<string>('editor');
    const [showScenicSelector, setShowScenicSelector] = useState<boolean>(false);
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false);
    const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
    
    // 加载行程数据
    useEffect(() => {
        if (id) {
            setLoading(true);
            // TODO: 实现从API加载行程数据的功能
            // 这里暂时使用模拟数据
            setTimeout(() => {
                const mockItinerary: Itinerary = {
                    id,
                    title: '北京3日游',
                    description: '探索北京的历史文化与现代魅力',
                    startDate: moment().add(10, 'days'),
                    endDate: moment().add(12, 'days'),
                    coverImage: 'https://example.com/beijing.jpg',
                    destination: '北京',
                    days: [
                        {
                            id: '1',
                            title: '第 1 天',
                            date: moment().add(10, 'days').format('YYYY-MM-DD'),
                            items: [
                                {
                                    id: '1',
                                    title: '故宫博物院',
                                    type: 'attraction',
                                    imageUrl: 'https://example.com/forbidden-city.jpg',
                                    location: '北京市东城区',
                                    time: '09:00-12:00',
                                    notes: '世界上现存规模最大、保存最为完整的木质结构古建筑之一'
                                },
                                {
                                    id: '2',
                                    title: '天安门广场',
                                    type: 'attraction',
                                    imageUrl: 'https://example.com/tiananmen.jpg',
                                    location: '北京市东城区',
                                    time: '14:00-16:00',
                                    notes: '世界上最大的城市广场之一'
                                }
                            ]
                        },
                        {
                            id: '2',
                            title: '第 2 天',
                            date: moment().add(11, 'days').format('YYYY-MM-DD'),
                            items: [
                                {
                                    id: '3',
                                    title: '长城',
                                    type: 'attraction',
                                    imageUrl: 'https://example.com/great-wall.jpg',
                                    location: '北京市怀柔区',
                                    time: '全天',
                                    notes: '中国古代伟大的防御工程'
                                }
                            ]
                        },
                        {
                            id: '3',
                            title: '第 3 天',
                            date: moment().add(12, 'days').format('YYYY-MM-DD'),
                            items: []
                        }
                    ],
                    isPublic: true,
                    createdBy: user?.id ? String(user.id) : undefined,
                    createdAt: '2023-06-01T10:00:00Z',
                    updatedAt: '2023-06-10T15:30:00Z'
                };
                
                setItinerary(mockItinerary);
                form.setFieldsValue({
                    title: mockItinerary.title,
                    description: mockItinerary.description,
                    dateRange: [mockItinerary.startDate, mockItinerary.endDate],
                    destination: mockItinerary.destination,
                    isPublic: mockItinerary.isPublic
                });
                setLoading(false);
            }, 1000);
        } else {
            // 创建新行程
            form.setFieldsValue({
                title: '',
                description: '',
                dateRange: null,
                destination: '',
                isPublic: true
            });
        }
    }, [id, form, user?.id]);
    
    // 处理日期范围变化
    const handleDateRangeChange = (dates: any) => {
        if (!dates || dates.length !== 2) {
            setItinerary(prev => ({
                ...prev,
                startDate: null,
                endDate: null,
                days: []
            }));
            return;
        }
        
        const [startDate, endDate] = dates;
        const diffDays = endDate.diff(startDate, 'days') + 1;
        
        // 根据日期范围创建天数数组
        const newDays: ItineraryDayData[] = [];
        for (let i = 0; i < diffDays; i++) {
            const date = moment(startDate).add(i, 'days');
            const existingDay = itinerary.days.find(d => d.id === `day-${i + 1}`);
            
            newDays.push({
                id: `day-${i + 1}`,
                title: `第 ${i + 1} 天`,
                date: date.format('YYYY-MM-DD'),
                items: existingDay ? existingDay.items : []
            });
        }
        
        setItinerary(prev => ({
            ...prev,
            startDate,
            endDate,
            days: newDays
        }));
    };
    
    // 处理行程基本信息变化
    const handleInfoChange = (changedValues: any) => {
        const newValues = { ...form.getFieldsValue(), ...changedValues };
        
        if (newValues.dateRange) {
            // 日期范围在handleDateRangeChange中已处理
            return;
        }
        
        setItinerary(prev => ({
            ...prev,
            title: newValues.title || prev.title,
            description: newValues.description || prev.description,
            destination: newValues.destination || prev.destination,
            isPublic: newValues.isPublic !== undefined ? newValues.isPublic : prev.isPublic
        }));
    };
    
    // 更新某一天的行程项目
    const updateDayItems = (dayId: string, newItems: ItineraryItem[]) => {
        const newDays = [...itinerary.days];
        const dayIndex = newDays.findIndex(d => d.id === dayId);
        if (dayIndex !== -1) {
            newDays[dayIndex].items = newItems;
            setItinerary(prev => ({
                ...prev,
                days: newDays
            }));
        }
    };
    
    // 打开景点选择器
    const openScenicSelector = (dayIndex: number) => {
        setSelectedDay(dayIndex);
        setShowScenicSelector(true);
    };
    
    // 添加景点到行程
    const addScenicToItinerary = (scenic: any) => {
        if (selectedDay !== null) {
            const newItem = {
                id: `temp-${Date.now()}`, // 临时ID，保存时会替换
                title: scenic.name, // 使用title替代name
                type: 'attraction' as const,
                imageUrl: scenic.coverImage || 'https://placehold.co/80x80',
                location: scenic.address || scenic.city,
                time: '待定',
                notes: ''
            };
            
            const dayIndex = selectedDay;
            const newDays = [...itinerary.days];
            newDays[dayIndex].items = [...newDays[dayIndex].items, newItem];
            
            setItinerary(prev => ({
                ...prev,
                days: newDays
            }));
            
            message.success(`已添加${scenic.name}到第${dayIndex + 1}天行程`);
        }
        setShowScenicSelector(false);
    };
    
    // 保存行程
    const saveItinerary = async () => {
        try {
            await form.validateFields();
            setSaving(true);
            
            // TODO: 实现保存行程的API调用
            // 这里暂时使用模拟数据
            
            setTimeout(() => {
                setSaving(false);
                message.success('行程保存成功');
                if (!id) {
                    // 如果是新建行程，保存后跳转到编辑页
                    navigate(`/itinerary/edit/mock-id-${Date.now()}`);
                }
            }, 1000);
        } catch (error) {
            console.error('保存行程失败:', error);
        }
    };
    
    // 删除行程
    const deleteItinerary = () => {
        setDeleteModalVisible(false);
        if (!id) return;
        
        // TODO: 实现删除行程的API调用
        message.success('行程已删除');
        navigate('/itineraries');
    };

    // 处理行程标题和描述的编辑
    const handleEditItinerary = () => {
        form.setFieldsValue({
            title: itinerary.title,
            description: itinerary.description,
            dateRange: itinerary.startDate && itinerary.endDate ? 
                [itinerary.startDate.format('YYYY-MM-DD'), itinerary.endDate.format('YYYY-MM-DD')] 
                : undefined
        });
        setEditModalVisible(true);
    };

    // 保存行程信息
    const handleSaveItineraryInfo = () => {
        form.validateFields().then(values => {
            setItinerary(prev => ({
                ...prev,
                title: values.title || prev.title,
                description: values.description || prev.description,
                destination: values.destination || prev.destination,
                isPublic: values.isPublic !== undefined ? values.isPublic : prev.isPublic
            }));
            setEditModalVisible(false);
            message.success('行程信息已更新');
        });
    };

    // 添加新的一天
    const addNewDay = () => {
        const newDay: ItineraryDayData = {
            id: `day-${Date.now()}`,
            title: `第 ${itinerary.days.length + 1} 天`,
            items: []
        };
        
        setItinerary(prev => ({
            ...prev,
            days: [...prev.days, newDay]
        }));
        message.success('已添加新的一天');
    };

    // 复制一天的行程
    const duplicateDay = (dayIndex: number) => {
        const dayToCopy = itinerary.days[dayIndex];
        const newDay: ItineraryDayData = {
            ...dayToCopy,
            id: `day-${Date.now()}`,
            title: `${dayToCopy.title} (复制)`,
            items: dayToCopy.items.map(item => ({...item, id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`}))
        };
        
        const newDays = [...itinerary.days];
        newDays.splice(dayIndex + 1, 0, newDay);
        setItinerary(prev => ({
            ...prev,
            days: newDays
        }));
        message.success('已复制行程天');
    };

    // 删除一天
    const removeDay = (dayIndex: number) => {
        Modal.confirm({
            title: '确认删除',
            content: `确定要删除"${itinerary.days[dayIndex].title}"及其所有景点吗？`,
            onOk: () => {
                const newDays = itinerary.days.filter((_, index) => index !== dayIndex);
                setItinerary(prev => ({
                    ...prev,
                    days: newDays
                }));
                message.success('已删除行程天');
            }
        });
    };

    // 处理拖拽结束事件
    const handleDragEnd = (result: DropResult) => {
        const { source, destination } = result;
        
        // 如果没有目标或拖放到相同位置，则不执行任何操作
        if (!destination || 
            (source.droppableId === destination.droppableId && source.index === destination.index)) {
            return;
        }
        
        // 在同一天内移动项目
        if (source.droppableId === destination.droppableId) {
            const dayIndex = itinerary.days.findIndex(d => d.id === source.droppableId);
            if (dayIndex === -1) return;
            
            const dayItems = [...itinerary.days[dayIndex].items];
            const [removed] = dayItems.splice(source.index, 1);
            dayItems.splice(destination.index, 0, removed);
            
            const newDays = [...itinerary.days];
            newDays[dayIndex].items = dayItems;
            setItinerary(prev => ({
                ...prev,
                days: newDays
            }));
        } 
        // 在不同天之间移动项目
        else {
            const sourceDayIndex = itinerary.days.findIndex(d => d.id === source.droppableId);
            const destDayIndex = itinerary.days.findIndex(d => d.id === destination.droppableId);
            
            if (sourceDayIndex === -1 || destDayIndex === -1) return;
            
            const sourceItems = [...itinerary.days[sourceDayIndex].items];
            const destItems = [...itinerary.days[destDayIndex].items];
            
            const [removed] = sourceItems.splice(source.index, 1);
            destItems.splice(destination.index, 0, removed);
            
            const newDays = [...itinerary.days];
            newDays[sourceDayIndex].items = sourceItems;
            newDays[destDayIndex].items = destItems;
            setItinerary(prev => ({
                ...prev,
                days: newDays
            }));
        }
    };

    // 分享行程
    const shareItinerary = () => {
        message.info('分享功能开发中');
    };

    // 导出行程
    const exportItinerary = () => {
        message.info('导出功能开发中');
    };

    return (
        <div className="itinerary-editor">
            <Card className="itinerary-editor-card">
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={[
                        {
                            key: 'editor',
                            label: '编辑行程',
                            children: (
                                <>
                                    {loading ? (
                                        <Skeleton active paragraph={{ rows: 10 }} />
                                    ) : (
                                        <>
                                            <Form
                                                form={form}
                                                layout="vertical"
                                                onValuesChange={handleInfoChange}
                                                initialValues={{
                                                    title: itinerary.title,
                                                    description: itinerary.description,
                                                    dateRange: itinerary.startDate && itinerary.endDate ? 
                                                        [itinerary.startDate.format('YYYY-MM-DD'), itinerary.endDate.format('YYYY-MM-DD')] 
                                                        : null,
                                                    destination: itinerary.destination,
                                                    isPublic: itinerary.isPublic
                                                }}
                                            >
                                                <div className="itinerary-header">
                                                    <div className="itinerary-basic-info">
                                                        <Form.Item
                                                            name="title"
                                                            label="行程标题"
                                                            rules={[{ required: true, message: '请输入行程标题' }]}
                                                        >
                                                            <Input placeholder="例如：北京3日游" />
                                                        </Form.Item>
                                                        
                                                        <Form.Item
                                                            name="destination"
                                                            label="目的地"
                                                            rules={[{ required: true, message: '请输入目的地' }]}
                                                        >
                                                            <Input placeholder="例如：北京" />
                                                        </Form.Item>
                                                        
                                                        <Form.Item
                                                            name="dateRange"
                                                            label="行程日期"
                                                            rules={[{ required: true, message: '请选择行程日期' }]}
                                                        >
                                                            <RangePicker 
                                                                style={{ width: '100%' }}
                                                                onChange={handleDateRangeChange}
                                                            />
                                                        </Form.Item>
                                                        
                                                        <Form.Item
                                                            name="description"
                                                            label="行程简介"
                                                        >
                                                            <TextArea 
                                                                rows={4} 
                                                                placeholder="简要描述您的行程计划..." 
                                                            />
                                                        </Form.Item>
                                                    </div>
                                                </div>
                                                
                                                <Divider orientation="left">行程安排</Divider>
                                                
                                                {itinerary.days.length > 0 ? (
                                                    <div className="itinerary-days">
                                                        <DragDropContext onDragEnd={handleDragEnd}>
                                                            {itinerary.days.map((day, index) => (
                                                                <div key={day.id} className="day-wrapper">
                                                                    <div className="day-header">
                                                                        <Text strong>{day.title}</Text>
                                                                        {day.date && <Text type="secondary">{day.date}</Text>}
                                                                        <div className="day-actions">
                                                                            <Tooltip title="复制此天">
                                                                                <Button 
                                                                                    type="text" 
                                                                                    size="small" 
                                                                                    icon={<CopyOutlined />} 
                                                                                    onClick={() => duplicateDay(index)} 
                                                                                />
                                                                            </Tooltip>
                                                                            <Tooltip title="删除此天">
                                                                                <Button 
                                                                                    type="text" 
                                                                                    size="small" 
                                                                                    danger 
                                                                                    icon={<DeleteOutlined />} 
                                                                                    onClick={() => removeDay(index)} 
                                                                                />
                                                                            </Tooltip>
                                                                        </div>
                                                                    </div>
                                                                    <ItineraryDay 
                                                                        day={{
                                                                            ...day,
                                                                            dayNumber: index + 1,
                                                                            date: day.date || ''  // 确保date不为undefined
                                                                        }} 
                                                                        onItemsChange={(items) => updateDayItems(day.id, items)}
                                                                        dayNumber={index + 1}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </DragDropContext>
                                                    </div>
                                                ) : (
                                                    <div className="no-days-message">
                                                        <Text type="secondary">请先选择行程日期范围</Text>
                                                    </div>
                                                )}
                                                
                                                <div className="itinerary-actions">
                                                    <Space>
                                                        <Button 
                                                            type="primary" 
                                                            icon={<SaveOutlined />}
                                                            onClick={saveItinerary}
                                                            loading={saving}
                                                        >
                                                            保存行程
                                                        </Button>
                                                        
                                                        {id && (
                                                            <>
                                                                <Button 
                                                                    icon={<ShareAltOutlined />}
                                                                >
                                                                    分享行程
                                                                </Button>
                                                                
                                                                <Button 
                                                                    danger
                                                                    icon={<DeleteOutlined />}
                                                                    onClick={() => setDeleteModalVisible(true)}
                                                                >
                                                                    删除行程
                                                                </Button>
                                                            </>
                                                        )}
                                                    </Space>
                                                </div>
                                            </Form>
                                        </>
                                    )}
                                </>
                            ),
                        },
                        {
                            key: 'preview',
                            label: '预览行程',
                            children: (
                                <div className="itinerary-preview">
                                    {/* TODO: 实现行程预览功能 */}
                                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                        <p>行程预览功能正在开发中...</p>
                                    </div>
                                </div>
                            ),
                        },
                    ]}
                />
            </Card>
            
            {/* 景点选择器模态框 */}
            <Modal
                title="添加景点到行程"
                open={showScenicSelector}
                footer={null}
                onCancel={() => setShowScenicSelector(false)}
                width={800}
                destroyOnClose
            >
                <ScenicSelector 
                    onSelect={addScenicToItinerary}
                    onClose={() => setShowScenicSelector(false)}
                    visible={showScenicSelector}
                />
            </Modal>
            
            {/* 删除确认模态框 */}
            <Modal
                title="确认删除"
                open={deleteModalVisible}
                onOk={deleteItinerary}
                onCancel={() => setDeleteModalVisible(false)}
                okText="确认删除"
                cancelText="取消"
            >
                <p>确定要删除此行程吗？此操作不可恢复。</p>
            </Modal>
            
            {/* 行程信息编辑模态框 */}
            <Modal
                title="编辑行程信息"
                open={editModalVisible}
                onOk={handleSaveItineraryInfo}
                onCancel={() => setEditModalVisible(false)}
            >
                <Form 
                    form={form}
                    layout="vertical"
                    initialValues={{
                        title: itinerary.title,
                        description: itinerary.description,
                        dateRange: itinerary.startDate && itinerary.endDate ? 
                            [itinerary.startDate.format('YYYY-MM-DD'), itinerary.endDate.format('YYYY-MM-DD')] 
                            : undefined
                    }}
                >
                    <Form.Item
                        name="title"
                        label="行程标题"
                        rules={[{ required: true, message: '请输入行程标题' }]}
                    >
                        <Input placeholder="例如：北京三日游" />
                    </Form.Item>
                    
                    <Form.Item
                        name="description"
                        label="行程描述"
                    >
                        <TextArea 
                            placeholder="简要描述此行程的特点和亮点" 
                            rows={4} 
                        />
                    </Form.Item>
                    
                    <Form.Item
                        name="dateRange"
                        label="行程日期"
                        help="选择行程的起止日期，系统将自动创建对应天数的行程"
                    >
                        <RangePicker style={{ width: '100%' }} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ItineraryEditor; 