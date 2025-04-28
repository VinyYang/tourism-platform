import React, { useState, useEffect } from 'react';
import { Form, Input, Button, DatePicker, Select, Card, Divider, message, Row, Col, Space } from 'antd';
import { PlusOutlined, MinusCircleOutlined, SaveOutlined, ShareAltOutlined } from '@ant-design/icons';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import moment from 'moment';
import dayjs, { Dayjs } from 'dayjs';
import ItineraryDay from './ItineraryDay';
import { useAuth } from '../context/AuthContext';
import './ItineraryForm.css';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

// 定义行程类型接口
export interface Itinerary {
    id?: string;
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    days: ItineraryDay[];
    isPublic: boolean;
    createdBy?: string;
    createdAt?: string;
    updatedAt?: string;
}

// 定义行程天的类型接口
export interface ItineraryDay {
    id: string;
    dayIndex: number;
    dayNumber: number;
    date: string;
    items: ItineraryItem[];
}

// 定义行程项的类型接口
export interface ItineraryItem {
    id: string;
    title: string;
    type: 'attraction' | 'restaurant' | 'hotel' | 'transport' | 'activity' | 'custom' | 'meal' | 'accommodation';
    time?: string;
    duration?: number;
    location?: string;
    address?: string;
    imageUrl?: string;
    notes?: string;
    cost?: number;
}

interface ItineraryFormProps {
    initialItinerary?: Itinerary;
    onSave?: (itinerary: Itinerary) => void;
}

/**
 * 行程表单组件，用于创建和编辑完整的行程计划
 */
const ItineraryForm: React.FC<ItineraryFormProps> = ({ initialItinerary, onSave }) => {
    const [form] = Form.useForm();
    const { isAuthenticated, user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
    const [days, setDays] = useState<ItineraryDay[]>([]);

    // 当初始数据或日期变化时更新天数
    useEffect(() => {
        if (initialItinerary) {
            form.setFieldsValue({
                title: initialItinerary.title,
                description: initialItinerary.description,
                isPublic: initialItinerary.isPublic,
            });
            
            if (initialItinerary.startDate && initialItinerary.endDate) {
                const start = dayjs(initialItinerary.startDate);
                const end = dayjs(initialItinerary.endDate);
                setDateRange([start, end]);
                // 使用初始行程的天数数据
                setDays(initialItinerary.days);
            }
        }
    }, [initialItinerary, form]);

    // 当日期范围变化时，更新天数
    useEffect(() => {
        if (dateRange) {
            const [start, end] = dateRange;
            const dayCount = end.diff(start, 'days') + 1;
            
            // 保持现有天数的数据，只调整天数
            const newDays: ItineraryDay[] = [];
            
            for (let i = 0; i < dayCount; i++) {
                const existingDay = days.find(d => d.dayIndex === i);
                const currentDate = start.add(i, 'days');
                
                newDays.push(existingDay || {
                    id: `day-${i}-${Date.now()}`,
                    dayIndex: i,
                    dayNumber: i + 1,
                    date: currentDate.format('YYYY-MM-DD'),
                    items: [],
                });
            }
            
            setDays(newDays);
        }
    }, [dateRange]);

    /**
     * 处理日期范围变化
     */
    const handleDateRangeChange = (dates: any) => {
        if (!dates) {
            setDateRange(null);
            return;
        }
        
        setDateRange(dates as [Dayjs, Dayjs]);
    };

    /**
     * 处理拖拽结束事件
     */
    const handleDragEnd = (result: DropResult) => {
        const { source, destination } = result;

        // 如果目的地不存在，则拖拽被取消
        if (!destination) return;

        // 解析拖拽的来源和目的地
        const sourceDay = parseInt(source.droppableId.split('-')[1]);
        const destDay = parseInt(destination.droppableId.split('-')[1]);

        // 获取新的天数数组的深拷贝
        const newDays = JSON.parse(JSON.stringify(days));

        // 如果在同一天内移动
        if (sourceDay === destDay) {
            const dayItems = newDays.find((d: ItineraryDay) => d.dayIndex === sourceDay)?.items;
            if (dayItems) {
                const [movedItem] = dayItems.splice(source.index, 1);
                dayItems.splice(destination.index, 0, movedItem);
            }
        } else {
            // 跨天移动
            const sourceItems = newDays.find((d: ItineraryDay) => d.dayIndex === sourceDay)?.items;
            const destItems = newDays.find((d: ItineraryDay) => d.dayIndex === destDay)?.items;
            
            if (sourceItems && destItems) {
                const [movedItem] = sourceItems.splice(source.index, 1);
                destItems.splice(destination.index, 0, movedItem);
            }
        }

        setDays(newDays);
    };

    /**
     * 保存行程
     */
    const handleSaveItinerary = async (values: any) => {
        if (!isAuthenticated) {
            message.warning('请先登录后再保存行程');
            return;
        }

        if (!dateRange || dateRange.length !== 2) {
            message.error('请选择行程日期范围');
            return;
        }

        setLoading(true);

        try {
            const itinerary: Itinerary = {
                ...values,
                startDate: dateRange[0].format('YYYY-MM-DD'),
                endDate: dateRange[1].format('YYYY-MM-DD'),
                days: days,
                createdBy: user?.id,
            };

            if (initialItinerary?.id) {
                itinerary.id = initialItinerary.id;
            }

            // 调用父组件的保存方法
            if (onSave) {
                await onSave(itinerary);
                message.success('行程保存成功');
            }
        } catch (error) {
            console.error('保存行程失败:', error);
            message.error('保存行程失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    /**
     * 处理天内项目的更新
     */
    const handleDayItemsUpdate = (dayIndex: number, items: ItineraryItem[]) => {
        const newDays = [...days];
        const dayToUpdate = newDays.find(d => d.dayIndex === dayIndex);
        
        if (dayToUpdate) {
            dayToUpdate.items = items;
            setDays(newDays);
        }
    };

    return (
        <div className="itinerary-form-container">
            <Card className="itinerary-form-card">
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSaveItinerary}
                    initialValues={{
                        title: '',
                        description: '',
                        isPublic: true,
                        ...initialItinerary
                    }}
                >
                    <Form.Item
                        name="title"
                        label="行程标题"
                        rules={[{ required: true, message: '请输入行程标题' }]}
                    >
                        <Input placeholder="给您的行程起个名称" maxLength={50} />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="行程描述"
                    >
                        <TextArea 
                            placeholder="描述一下您的行程计划" 
                            autoSize={{ minRows: 2, maxRows: 6 }}
                            maxLength={500}
                        />
                    </Form.Item>

                    <Form.Item
                        name="dateRange"
                        label="行程日期"
                        rules={[{ required: true, message: '请选择行程日期范围' }]}
                    >
                        <RangePicker 
                            style={{ width: '100%' }}
                            value={dateRange}
                            onChange={handleDateRangeChange}
                            format="YYYY-MM-DD"
                        />
                    </Form.Item>

                    <Form.Item
                        name="isPublic"
                        label="是否公开"
                        valuePropName="checked"
                    >
                        <Select>
                            <Option value={true}>公开 - 所有人可见</Option>
                            <Option value={false}>私密 - 仅自己可见</Option>
                        </Select>
                    </Form.Item>

                    <Divider orientation="left">行程安排</Divider>

                    {dateRange ? (
                        <DragDropContext onDragEnd={handleDragEnd}>
                            {days.map((day, index) => {
                                const dayDate = dateRange[0].add(day.dayIndex, 'days');
                                const dayTitle = `第 ${day.dayIndex + 1} 天 (${dayDate.format('MM月DD日')})`;
                                
                                return (
                                    <ItineraryDay
                                        key={day.id}
                                        day={{
                                            dayNumber: day.dayNumber,
                                            date: day.date,
                                            items: day.items.map(item => ({
                                                ...item,
                                                type: item.type.toLowerCase() === 'attraction' ? 'attraction' :
                                                      item.type.toLowerCase() === 'restaurant' ? 'restaurant' :
                                                      item.type.toLowerCase() === 'hotel' ? 'hotel' :
                                                      item.type.toLowerCase() === 'transport' ? 'transport' :
                                                      item.type.toLowerCase() === 'activity' ? 'activity' : 'custom'
                                            }))
                                        }}
                                        title={dayTitle}
                                        onItemsChange={(items) => handleDayItemsUpdate(day.dayIndex, items)}
                                    />
                                );
                            })}
                        </DragDropContext>
                    ) : (
                        <div className="empty-itinerary">
                            <p>请选择行程日期范围以创建行程天数</p>
                        </div>
                    )}

                    <Divider />

                    <Row justify="end" gutter={16}>
                        <Col>
                            <Form.Item>
                                <Space>
                                    <Button 
                                        type="primary" 
                                        htmlType="submit" 
                                        icon={<SaveOutlined />}
                                        loading={loading}
                                    >
                                        保存行程
                                    </Button>
                                    <Button 
                                        icon={<ShareAltOutlined />}
                                        disabled={!initialItinerary?.id}
                                    >
                                        分享行程
                                    </Button>
                                </Space>
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Card>
        </div>
    );
};

export default ItineraryForm; 