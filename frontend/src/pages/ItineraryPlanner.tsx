import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
    Row, Col, Card, Button, Input, DatePicker, 
    Spin, message, Modal, Divider, Typography, Tooltip, 
    Empty, Drawer, List, Tag, Popconfirm, Layout, InputNumber, Switch, Select, Space, Form, Statistic
} from 'antd';
import { 
    PlusOutlined, MinusOutlined, CalendarOutlined, 
    SaveOutlined, ShareAltOutlined, SearchOutlined, 
    ExportOutlined, EditOutlined, DeleteOutlined, InfoCircleOutlined,
    EyeOutlined, CopyOutlined, EnvironmentOutlined, ClockCircleOutlined,
    HomeOutlined, CarOutlined
} from '@ant-design/icons';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useDrag, useDrop, DropTargetMonitor } from 'react-dnd';
import moment from 'moment';
import dayjs from 'dayjs';
import { Dayjs } from 'dayjs';
import type { RangePickerProps } from 'antd/es/date-picker';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// import ItineraryDayComponent, { ItineraryItem as ComponentItineraryItem, ItineraryDayData } from '../components/itinerary/ItineraryDayComponent'; // 组件缺失，暂时注释
import { useAuth } from '../context/AuthContext';
import scenicAPI, { ScenicItem } from '../api/scenic';
import hotelAPI, { Hotel } from '../api/hotel';
import transportAPI, { TransportSearchParams, Transport } from '../api/transport'; // 确保导入 TransportSearchParams
import itineraryAPI, { 
    Itinerary as ApiItinerary,
    ItineraryItem as ApiItineraryItem,
    ItineraryDay as ApiItineraryDay
} from '../api/itinerary';
import api from '../api/config';  // 添加这行导入
import { 
  getUserPreferences, 
  updatePreferencesFromItinerary, 
  recordItineraryCreation, 
  recordDestination 
} from '../services/preferenceService';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './ItineraryPlanner.css';

// 导入缺失的类型和函数
import { ItineraryTemplate } from '../models/ItineraryTemplates'; 
import { GuidedCreationResult } from '../components/itinerary/GuidedCreation'; 

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Content } = Layout;
const { TextArea } = Input;

// 创建ItemTypes对象 - 直接在文件中定义，不需要单独的文件
const ItemTypes = {
    CARD: 'card',
    ITEM: 'item'
};

// 定义组件内部使用的ItineraryItem类型
interface ComponentItineraryItem {
    id: string;
    type: 'attraction' | 'restaurant' | 'hotel' | 'transport' | 'activity' | 'custom' | 'accommodation';
    title: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    imageUrl?: string;
    notes?: string;
    attractionId?: string;
}

// Type for the state, might need adjustments based on ApiItinerary
type PlannerItineraryState = Partial<ApiItinerary> & { days: PlannerItineraryDay[] };

// Type for the day state within the planner (might differ slightly from ApiItineraryDay)
interface PlannerItineraryDay {
    date: string;
    items: PlannerItineraryItem[];
}

// Type for the item state within the planner (might differ slightly from ApiItineraryItem)
interface PlannerItineraryItem {
    id: string; // Keep string ID for local state management
    title: string;
    type: 'attraction' | 'restaurant' | 'hotel' | 'transport' | 'activity' | 'custom';
    time?: string;
    duration?: number;
    location?: string;
    note?: string;
    imageUrl?: string;
    address?: string;
    attractionId?: string; // Keep this if it's used locally
    // Add other fields corresponding to ApiItineraryItem if necessary
}

// Adjust convertApiItineraryToFrontend to return PlannerItineraryState or compatible type
const convertApiItineraryToFrontend = (apiData: ApiItinerary): ApiItinerary => {
    // API 返回的已经是目标类型，只需确保日期是 Date 对象（如果状态需要）
    // 但我们已将状态日期改为 string，所以无需转换
    return apiData;
};

// 修改 convertFrontendItineraryToApi 函数，确保生成 daysList 字段
const convertFrontendItineraryToApi = (frontendData: ItineraryState): Partial<ApiItinerary> & { daysList?: ApiItineraryDay[] } => {
    // 记录发送到API的日期数据
    console.log('发送到API的日期数据:', {
        startDate: frontendData.startDate,
        endDate: frontendData.endDate,
        tempStartDate: frontendData.tempStartDate,
        tempEndDate: frontendData.tempEndDate
    });

    // 创建一个 API 期望的格式对象
    const apiData: Partial<ApiItinerary> & { daysList?: ApiItineraryDay[] } = {
        id: frontendData.id ? Number(frontendData.id) : undefined,
        title: frontendData.title || '未命名行程', // 确保title不为空
        // 确保使用临时存储的日期或当前状态日期
        startDate: frontendData.startDate || frontendData.tempStartDate, 
        endDate: frontendData.endDate || frontendData.tempEndDate,     
        cover: frontendData.cover,
        isPublic: frontendData.isPublic ?? false, // 使用默认值
        // 使用映射属性名
        description: frontendData.notes,
        city: frontendData.destination,
        estimatedBudget: frontendData.budget,
        status: frontendData.status || 'draft',
        // 转换为正确的 daysList 格式，而不是 items
        daysList: frontendData.days.map((day: DayPlan) => ({
            dayNumber: day.dayNumber,
            items: day.items.map((item: DisplayItem, itemIndex: number) => {
                // 改进ID转换逻辑
                let itemId: number | string = 0;
                // 检查originalId是否有效
                if (item.originalId !== undefined && item.originalId !== null) {
                    if (typeof item.originalId === 'number') {
                        itemId = item.originalId;
                    } else if (typeof item.originalId === 'string' && !isNaN(Number(item.originalId))) {
                        itemId = Number(item.originalId);
                    } else {
                        // 如果不是有效数字，使用0或其他默认值
                        itemId = 0;
                    }
                }
                
                // 对item.id的处理
                let id = 0;
                if (item.dbItemId) {
                    // 如果有数据库项ID，优先使用
                    id = item.dbItemId;
                } else if (typeof item.id === 'string') {
                    if (item.id.startsWith('temp')) {
                        id = 0; // 临时ID，使用0
                    } else {
                    // 尝试从item-123格式提取数字
                    const matches = item.id.match(/item-(\d+)/);
                    id = matches ? Number(matches[1]) : 0;
                    }
                }
                
                // ADDED: Process startTime to handle time ranges (e.g., "07:30-17:30")
                let processedStartTime = item.startTime || ''; // Default to empty string
                if (typeof item.startTime === 'string' && item.startTime.includes('-')) {
                    const parts = item.startTime.split('-');
                    if (parts.length > 0) {
                        processedStartTime = parts[0].trim();
                        // Optional: Basic validation if needed, e.g., regex for HH:MM
                    }
                }
                // END ADDED
                
                // 确保必填字段
                return {
                    id: id,
                    itemId: itemId || 0,  // 确保不为undefined
                    itemType: item.type || 'custom',  // 确保有类型，默认为custom
                    name: item.name || '未命名项目',
                    image: item.image || '',
                    location: item.address || '',
                    startTime: processedStartTime, // Use processed start time
                    endTime: item.endTime || '',
                    notes: item.description || '',
                    order: itemIndex + 1  // 确保从1开始的序号
                };
            })
        }))
    };

    // 确保daysList不为空
    if (!apiData.daysList || apiData.daysList.length === 0) {
        apiData.daysList = [{
            dayNumber: 1,
            items: []
        }];
    }

    // 调试输出
    console.log('转换后的API数据:', JSON.stringify(apiData, null, 2));

    // 过滤掉undefined值
    Object.keys(apiData).forEach(key => {
        const typedKey = key as keyof typeof apiData;
        if (apiData[typedKey] === undefined) {
            delete apiData[typedKey];
        }
    });

    return apiData;
};

// 适配器函数：将API的ItineraryItem转换为组件需要的ItineraryItem类型
const adaptApiItemToComponentItem = (apiItem: ApiItineraryItem): ComponentItineraryItem => {
    return {
        id: apiItem.id?.toString() || `temp-${Date.now()}`,
        type: (apiItem.itemType === 'scenic' || apiItem.itemType === 'hotel') 
            ? (apiItem.itemType === 'scenic' ? 'attraction' : 'accommodation') 
            : 'custom',
        title: apiItem.name,
        location: apiItem.location,
        imageUrl: apiItem.image,
        startTime: apiItem.startTime,
        endTime: apiItem.endTime,
        notes: apiItem.notes
    };
};

// 适配器函数：将组件的ItineraryItem转换为API需要的ItineraryItem类型
const adaptComponentItemToApiItem = (componentItem: ComponentItineraryItem): ApiItineraryItem => {
    return {
        id: parseInt(componentItem.id) || 0,
        itemId: componentItem.attractionId ? parseInt(componentItem.attractionId) : 0,
        itemType: componentItem.type === 'attraction' ? 'scenic' : 'hotel',
        name: componentItem.title,
        image: componentItem.imageUrl || '',
        location: componentItem.location || '',
        startTime: componentItem.startTime,
        endTime: componentItem.endTime,
        notes: componentItem.notes,
        order: 0 // 默认顺序，需要在使用时设置
    };
};

// --- Interfaces matching ItineraryBuilder for consistency ---
// (Copied from ItineraryBuilder for consistency)
export interface DisplayItem {
    id: string; // Frontend unique ID (item-${ItineraryItem.id} or custom-${timestamp})
    dbItemId?: number; // Store the actual ItineraryItem.id from the DB if it exists
    originalId: number | string; // Original Scenic/Hotel/Transport ID or custom timestamp
    name: string;
    type: 'scenic' | 'hotel' | 'transport' | 'custom' | 'activity'; 
    image?: string;
    price?: number; // 价格字段，用于计算预算
    address?: string; // Mapped to backend ItineraryItem.location (ensure mapping is correct)
    location?: string; // Explicitly add location to match backend potentially? Or keep using address. Let's assume address maps to location for now.
    description?: string; // Mapped to backend ItineraryItem.notes
    startTime?: string;
    endTime?: string;
    // duration?: number; // Backend ItineraryItem doesn't have duration
    rating?: number; // Not directly in backend ItineraryItem
    // Transport specific fields might need to be fetched separately if needed
    transportType?: string; // From backend Transport.type
    departureTime?: string; // Added for transport
    arrivalTime?: string; // Added for transport
}

export interface DayPlan {
    date: string; // YYYY-MM-DD, calculated based on startDate and dayNumber
    dayNumber: number; // Corresponds to backend ItineraryItem.day_number
    items: DisplayItem[];
}

// Frontend state matching ItineraryBuilder
export interface ItineraryState {
    id?: number; // Backend Itinerary ID
    title: string;
    startDate?: string; // Make nullable/optional
    endDate?: string; // Make nullable/optional
    days: DayPlan[]; // Use DayPlan structure matching ItineraryBuilder
    budget?: number; // Make nullable/optional, Maps to backend estimatedBudget
    notes?: string; // Maps to backend description
    destination?: string; // Make nullable/optional, Maps to backend city
    isPublic: boolean;
    status?: 'draft' | 'published'; // Add status
    cover?: string;
    userId?: number;
    createdAt?: string;
    updatedAt?: string;
    // 添加临时日期字段
    tempStartDate?: string;
    tempEndDate?: string;
}

// Utility function to calculate days from dates (copied from Itineraries.tsx)
const calculateDays = (startDate?: string, endDate?: string): number => {
    if (!startDate || !endDate) return 0;
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    if (!start.isValid() || !end.isValid() || end.isBefore(start)) return 0;
    return end.diff(start, 'day') + 1;
};

// Function to adapt backend Itinerary data to frontend ItineraryState
const adaptApiToFrontend = (apiData: ApiItinerary, tempStartDate?: string, tempEndDate?: string): ItineraryState => {
    // 将API返回的数据转换为前端状态格式
    console.log('从API获取的行程数据:', JSON.stringify(apiData, null, 2));

    // 首先构建一个基本的行程状态对象
    const frontendData: ItineraryState = {
        id: apiData.id,
        title: apiData.title || '未命名行程',
        // 修改日期逻辑，优先使用API返回的日期，如果为null则使用临时保存的日期
        startDate: apiData.startDate || tempStartDate || undefined,
        endDate: apiData.endDate || tempEndDate || undefined,
        // 修改 budget 赋值逻辑，确保为 number 类型或 undefined
        budget: apiData.estimatedBudget !== null && apiData.estimatedBudget !== undefined 
                ? (parseFloat(String(apiData.estimatedBudget)) || undefined) 
                : undefined,
        notes: apiData.description || '',
        destination: apiData.city || '',
        isPublic: apiData.isPublic || false,
        status: apiData.status || 'draft',
        cover: apiData.cover || '',
        userId: apiData.userId,
        createdAt: apiData.createdAt,
        updatedAt: apiData.updatedAt,
        days: [], // 将在下面填充
        // 保存临时日期到状态
        tempStartDate,
        tempEndDate
    };

    // 处理天数和行程项数据 (Now assumes daysList is always present from backend)
    if (apiData.daysList && Array.isArray(apiData.daysList)) {
        frontendData.days = apiData.daysList.map(day => {
            // 修改日期计算逻辑，使用临时日期变量，确保date总是字符串
            let dateStr: string;
            
            const effectiveStartDate = frontendData.startDate || tempStartDate;
            
            if (day.dayNumber === 1 && effectiveStartDate) {
                dateStr = effectiveStartDate;
            } else if (effectiveStartDate) {
                dateStr = dayjs(effectiveStartDate).add(day.dayNumber - 1, 'day').format('YYYY-MM-DD');
            } else {
                dateStr = `第 ${day.dayNumber} 天`;
            }
            
            return {
                date: dateStr, // 现在一定是字符串
                dayNumber: day.dayNumber,
                items: (day.items || []).map(item => ({
                    // Checklist item 7: Use item.id (from DB) or a fallback for unique key
                    id: `item-${item.id || Math.random().toString(36).substring(2, 9)}`,
                    dbItemId: item.id, // Keep dbItemId if needed elsewhere
                    originalId: item.itemId || 0,
                    name: item.name || '未命名项目',
                    type: item.itemType,
                    image: item.image || '',
                    address: item.location || '',
                    description: item.notes || '',
                    startTime: item.startTime || '',
                    endTime: item.endTime || '',
                    // 修复价格提取逻辑，添加类型断言来解决 TypeScript 错误
                    price: (() => {
                        let rawPrice: string | number | null | undefined = null;
                        if (item.itemType === 'scenic' && item.Scenic) {
                            rawPrice = item.Scenic.ticket_price;
                        } else if (item.itemType === 'hotel' && item.Hotel) {
                            rawPrice = item.Hotel.price;
                        } else if (item.itemType === 'transport' && item.Transport) {
                            // 假设 Transport 也有一个 price 字段
                            rawPrice = item.Transport.price; 
                        } else if (item.price != null) { 
                            // 如果上述嵌套对象中没有找到价格，尝试使用顶层 price 字段（如果存在）
                            rawPrice = item.price;
                        }

                        if (rawPrice !== null && rawPrice !== undefined) {
                            const parsedPrice = parseFloat(String(rawPrice));
                            return isNaN(parsedPrice) ? 0 : parsedPrice;
                        }
                        return 0; // 如果没有找到价格或价格无效，默认为 0
                    })(),
                }))
            };
        });
    } else {
        // 如果daysList不存在或为空，创建默认天
        console.log('API返回的数据没有行程项或daysList，创建默认天');
        
        const daysCount = calculateDays(frontendData.startDate, frontendData.endDate) || 1;
        
        frontendData.days = Array.from({ length: daysCount }, (_, i) => {
        const dayNumber = i + 1;
        let dateStr: string;
        
        const effectiveStartDate = frontendData.startDate || tempStartDate;
        
        if (dayNumber === 1 && effectiveStartDate) {
            dateStr = effectiveStartDate;
        } else if (effectiveStartDate) {
            dateStr = dayjs(effectiveStartDate).add(i, 'day').format('YYYY-MM-DD');
        } else {
            dateStr = `第 ${dayNumber} 天`;
        }
        
        return {
            date: dateStr,
            dayNumber,
            items: []
        };
    });
    }

    // 确保至少有一天
    if (frontendData.days.length === 0) {
        const defaultDate = frontendData.startDate || tempStartDate || dayjs().format('YYYY-MM-DD');
        frontendData.days = [{
            date: defaultDate,
            dayNumber: 1,
            items: []
        }];
    }

    console.log('转换后的前端行程数据:', JSON.stringify(frontendData, null, 2));
    return frontendData;
};

// 添加计算总花费的函数
const calculateTotalCost = (days: DayPlan[]): number => {
    if (!days) return 0;
    
    return days.reduce((total, day) => {
        if (!day || !day.items) return total;
        return total + day.items.reduce((dayTotal, item) => {
            const price = typeof item.price === 'number' ? item.price : 0;
            return dayTotal + price;
        }, 0);
    }, 0);
};

// 计算单天花费
const calculateDayCost = (items: DisplayItem[]): number => {
    if (!items) return 0;
    
    return items.reduce((total, item) => {
        const price = typeof item.price === 'number' ? item.price : 0;
        return total + price;
    }, 0);
};

const ItineraryPlanner: React.FC = () => {
    // ALL useState definitions should be here, at the very top
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [itinerary, setItinerary] = useState<ItineraryState | null>(null);
    const [searchDrawerVisible, setSearchDrawerVisible] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [searchResults, setSearchResults] = useState<DisplayItem[]>([]);
    const [searchLoading, setSearchLoading] = useState<boolean>(false);
    const [searching, setSearching] = useState<boolean>(false);
    const [searchType, setSearchType] = useState<'scenic' | 'hotel' | 'transport'>('scenic');
    const [activeDay, setActiveDay] = useState<number | null>(null);
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    const [budgetExceeded, setBudgetExceeded] = useState<boolean>(false);
    const [autoBudget, setAutoBudget] = useState<boolean>(true);
    const [customBudget, setCustomBudget] = useState<number | null>(null);
    const [initialLoading, setInitialLoading] = useState<boolean>(true);
    const [selectedDayForAdd, setSelectedDayForAdd] = useState<number | null>(null);
    const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
    const [editItemModalVisible, setEditItemModalVisible] = useState<boolean>(false);
    const [editingItem, setEditingItem] = useState<{ dayIndex: number; itemIndex: number; item: DisplayItem } | null>(null);
    const [apiConnected, setApiConnected] = useState<boolean>(true);
    const [isManualSaving, setIsManualSaving] = useState<boolean>(false); // Checklist item 1: Add manual saving flag state
    // 添加临时存储日期的状态
    const [tempStartDate, setTempStartDate] = useState<string | undefined>(undefined);
    const [tempEndDate, setTempEndDate] = useState<string | undefined>(undefined);

    // Hooks like useParams, useNavigate, useLocation, useAuth, useForm can come next
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, user } = useAuth();
    const [editForm] = Form.useForm();
    const [editItemForm] = Form.useForm();
    const queryClient = useQueryClient(); // Checklist item 8: Add this line

    // THEN, all the useCallback function definitions
    const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
      let timeout: ReturnType<typeof setTimeout> | null = null;
      const debounced = (...args: Parameters<F>) => {
        if (timeout !== null) {
          clearTimeout(timeout);
          timeout = null;
        }
        timeout = setTimeout(() => func(...args), waitFor);
      };
      return debounced as (...args: Parameters<F>) => ReturnType<F>;
    }

    const autoSave = useCallback(async () => {
        // Checklist item 1: Check manual saving flag
        if (isManualSaving || !itinerary?.id || saving || !itinerary.title || !isAuthenticated) return; 
        console.log("Attempting auto-save...");
        try {
            // 注意：这里的 setSaving(true) 可能会导致 UI 锁定，考虑更细致的处理
            // setSaving(true); 
            const apiItinerary = convertFrontendItineraryToApi(itinerary as ItineraryState);
            await itineraryAPI.updateItinerary(itinerary.id, apiItinerary);
            setLastSaved(dayjs().format('YYYY-MM-DD HH:mm:ss'));
            console.log("Auto-save successful.");
        } catch (error) {
            console.error('自动保存失败:', error);
        } finally {
            // setSaving(false);
        }
    }, [itinerary, saving, isAuthenticated, isManualSaving]);
    const autoSaveDebounced = useCallback(debounce(autoSave, 2000), [autoSave]);

    // MOVED handleAddDay definition here
    const handleAddDay = useCallback(() => {
        setItinerary(prev => {
            if (!prev || !prev.endDate) {
                message.warning('请先设置行程结束日期');
                return prev;
            }
            const currentEndDate = dayjs(prev.endDate);
            const newEndDate = currentEndDate.add(1, 'day');
            const lastDayNumber = prev.days.length > 0 ? prev.days[prev.days.length - 1].dayNumber : 0;
            const newDayPlan: DayPlan = {
                date: newEndDate.format('YYYY-MM-DD'),
                dayNumber: lastDayNumber + 1,
                items: []
            };
            const newState = {
                ...prev,
                endDate: newEndDate.format('YYYY-MM-DD'),
                days: [...prev.days, newDayPlan]
            };
            // Trigger auto-save after state update logic completes
            // Note: autoSaveDebounced captures state at definition time.
            // It might be better to trigger save based on useEffect watching itinerary.
            // However, for simplicity now, we call it here.
            autoSaveDebounced(); 
            return newState;
        });
    }, [setItinerary, autoSaveDebounced]);
    // END MOVED

    const updateItineraryInfo = useCallback((key: keyof ItineraryState, value: any) => {
        setItinerary(prev => {
            if (!prev) return null;
            return { ...prev, [key]: value }; 
        });
         if (key !== 'days') { 
             autoSaveDebounced();
         }
    }, [autoSaveDebounced, setItinerary]);

    const loadItinerary = useCallback(async () => {
        if (!id || id === 'create') { 
            console.log('创建新行程模式，跳过加载');
            setInitialLoading(false); 
            return; 
        }
        
        console.log(`开始加载行程: ID=${id}`);
        setInitialLoading(true);
        
        try {
            // 验证ID是否为有效数字
            const numericId = parseInt(id);
            if (isNaN(numericId)) {
                console.error(`无效的行程ID: ${id}`);
                message.error("无效的行程ID");
                navigate('/itineraries'); 
                return;
            }
            
            // 验证用户认证状态
            if (!isAuthenticated) {
                console.warn('用户未登录，无法加载行程');
                message.warning('请先登录后查看行程');
                navigate('/login', { state: { from: `/itineraries/${id}` } });
                return;
            }
            
            // 显示加载中状态
            message.loading({ content: '正在加载行程...', key: 'loadItinerary' });
            
            // 调用API获取行程详情
            console.log(`正在从API获取行程: ID=${numericId}`);
            const data = await itineraryAPI.getItineraryDetail(numericId);
            
            // 清除加载提示
            message.success({ content: '加载行程成功', key: 'loadItinerary', duration: 1 });
            
            console.log(`行程加载成功: ID=${numericId}, 标题="${data.title}"`);
            
            // 转换数据并更新状态
            const frontendData = adaptApiToFrontend(data, tempStartDate, tempEndDate);
            console.log('转换后的前端行程数据:', frontendData);
            
            // 保存现有的临时日期
            frontendData.tempStartDate = tempStartDate;
            frontendData.tempEndDate = tempEndDate;
            
            // 如果API返回日期为空但临时日期有值，使用临时日期
            if (!frontendData.startDate && tempStartDate) {
                frontendData.startDate = tempStartDate;
            }
            if (!frontendData.endDate && tempEndDate) {
                frontendData.endDate = tempEndDate;
            }
            
            setItinerary(frontendData);
            
            // 更新最后保存时间
            setLastSaved(data.updatedAt ? dayjs(data.updatedAt).format('YYYY-MM-DD HH:mm:ss') : null);
            
        } catch (error: any) {
            console.error(`===== 加载行程失败: ID=${id} =====`);
            console.error('错误详情:', error);
            
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                
                if (status === 401) {
                    console.error('认证失败，用户未登录或令牌无效');
                    message.error('请先登录后查看行程');
                    // 保存当前URL，登录后返回
                    navigate('/login', { state: { from: `/itineraries/${id}` } });
                } else if (status === 403) {
                    console.error('权限错误，无权访问该行程');
                    message.error('您无权查看此行程');
                    navigate('/itineraries');
                } else if (status === 404) {
                    console.error('行程不存在');
                    message.error('请求的行程不存在');
                    navigate('/itineraries');
                } else {
                    // 一般性错误或服务器错误
                    const errorMsg = error.response?.data?.message || '加载行程失败，请稍后重试';
                    message.error(errorMsg);
                    console.error('服务器返回的错误信息:', error.response?.data);
                    navigate('/itineraries');
                }
            } else {
                // 非Axios错误
                message.error('加载行程失败，请稍后重试');
                navigate('/itineraries');
            }
        } finally {
            setInitialLoading(false);
            // 确保加载消息被关闭
            message.destroy('loadItinerary');
        }
    }, [id, navigate, setItinerary, setLastSaved, setInitialLoading, isAuthenticated, tempStartDate, tempEndDate]);

    const initializeNewItinerary = useCallback((templateData: ItineraryTemplate | null = null, guidedData: GuidedCreationResult | null = null) => {
         try {
             const userPreferences = getUserPreferences();
             const defaultDuration = userPreferences.defaultDuration || 3;
             const startDate = dayjs().format('YYYY-MM-DD');
             const endDate = dayjs().add(defaultDuration - 1, 'day').format('YYYY-MM-DD');
             
             // 保存日期到临时状态
             setTempStartDate(startDate);
             setTempEndDate(endDate);
             
             const initialDays: DayPlan[] = [];
             for (let i = 0; i < defaultDuration; i++) {
                 initialDays.push({ date: dayjs(startDate).add(i, 'day').format('YYYY-MM-DD'), dayNumber: i + 1, items: [] });
             }
             let destination = '目的地';
             if (userPreferences.lastUsedDestination) { destination = userPreferences.lastUsedDestination; } 
             else if (userPreferences.preferredDestinations?.length > 0) { destination = userPreferences.preferredDestinations[0]; }
             const budget = userPreferences.lastUsedBudget || userPreferences.defaultBudget || 0;
            const newItinerary: ItineraryState = { 
                 title: '未命名行程', 
                 startDate, 
                 endDate, 
                 days: initialDays, 
                 budget, 
                 notes: '', 
                 destination, 
                 isPublic: false, 
                 status: 'draft', 
                 cover: '',
                 tempStartDate: startDate,
                 tempEndDate: endDate
             }; 
            setItinerary(newItinerary);
            console.log('新行程初始化成功:', JSON.stringify(newItinerary, null, 2));
        } catch (error) {
            console.error('初始化新行程时出错:', error);
            const startDate = dayjs().format('YYYY-MM-DD');
            const endDate = dayjs().add(2, 'day').format('YYYY-MM-DD');
            
            // 即使出错也保存日期到临时状态
            setTempStartDate(startDate);
            setTempEndDate(endDate);
            
            const fallbackItinerary: ItineraryState = {
                 title: '未命名行程', 
                 startDate, 
                 endDate, 
                 days: [{ date: startDate, dayNumber: 1, items: [] }], 
                 isPublic: false, 
                 status: 'draft',
                 tempStartDate: startDate,
                 tempEndDate: endDate
             };
            setItinerary(fallbackItinerary);
            message.error('初始化行程时出错，已创建基本行程');
        } finally {
            setInitialLoading(false);
        }
    }, [setItinerary, setInitialLoading, setTempStartDate, setTempEndDate]);

    const checkApiConnection = useCallback(async () => {
        try {
            // 调用一个简单的API端点来检查连接
            await api.get('/health');
            setApiConnected(true);
            return true;
        } catch (error) {
            console.error('API连接检查失败:', error);
            setApiConnected(false);
            return false;
        }
    }, [setApiConnected]);

    const handleDateRangeChange: RangePickerProps['onChange'] = useCallback((dates: [Dayjs | null, Dayjs | null] | null, dateStrings: [string, string]) => {
        setItinerary(prev => {
            if (!prev) return null; // Should not happen if picker is active

            let newStartDate: string | undefined = undefined;
            let newEndDate: string | undefined = undefined;
            let newDays: DayPlan[] = prev.days || []; // Start with existing days

            if (dates && dates[0] && dates[1]) {
                newStartDate = dates[0].format('YYYY-MM-DD');
                newEndDate = dates[1].format('YYYY-MM-DD');
                
                // 保存日期到临时状态
                setTempStartDate(newStartDate);
                setTempEndDate(newEndDate);
                
                const currentDays = prev.days || [];
                const newNumberOfDays = calculateDays(newStartDate, newEndDate);

                const generatedDays: DayPlan[] = [];
                for (let i = 0; i < newNumberOfDays; i++) {
                    const dayNumber = i + 1;
                    const date = dates[0].add(i, 'day').format('YYYY-MM-DD');
                    // Try to preserve items from existing days based on dayNumber
                    const existingDay = currentDays.find(d => d.dayNumber === dayNumber);
                    generatedDays.push({
                        date: date,
                        dayNumber: dayNumber,
                        items: existingDay ? existingDay.items : []
                    });
                }
                newDays = generatedDays;
            } else {
                // Handle case where dates are cleared
                newStartDate = undefined;
                newEndDate = undefined;
                // 清除临时状态中的日期
                setTempStartDate(undefined);
                setTempEndDate(undefined);
                // Keep existing items but mark date as TBD
                newDays = prev.days?.map(d => ({ ...d, date: `第 ${d.dayNumber} 天` })) || [];
            }

            // Single state update
            return { 
                ...prev, 
                startDate: newStartDate, 
                endDate: newEndDate, 
                days: newDays 
            };
        });

        // 添加自动保存触发器
        autoSaveDebounced(); 
    }, [setItinerary, autoSaveDebounced]); // 添加autoSaveDebounced作为依赖项

    const saveItinerary = useCallback(async (publish: boolean = false) => {
        if (!isAuthenticated) {
            message.warning('请先登录');
            navigate('/login', { state: { from: `/itineraries${itinerary?.id ? `/${itinerary.id}` : '/create'}` } });
            return;
        }
        if (!itinerary) {
            message.error('没有行程数据可保存');
            return;
        }
        // Checklist item 1: Set manual saving flag
        setIsManualSaving(true); 
        const requiredFields = [];
        if (!itinerary.title) requiredFields.push('行程标题');
        let currentItinerary = {...itinerary};
        
        // 确保使用临时存储的日期（如果有）
        if (tempStartDate && !currentItinerary.startDate) {
            currentItinerary.startDate = tempStartDate;
        }
        if (tempEndDate && !currentItinerary.endDate) {
            currentItinerary.endDate = tempEndDate;
        }
        
        console.log('保存前的行程数据:', {
            id: currentItinerary.id,
            title: currentItinerary.title,
            startDate: currentItinerary.startDate,
            endDate: currentItinerary.endDate,
            tempStartDate,
            tempEndDate
        });
        
        if (!currentItinerary.days || currentItinerary.days.length === 0) {
            const today = dayjs().format('YYYY-MM-DD');
            const newDay: DayPlan = { date: today, dayNumber: 1, items: [] };
            currentItinerary = {
                ...currentItinerary,
                days: [newDay],
                startDate: currentItinerary.startDate || tempStartDate || today,
                endDate: currentItinerary.endDate || tempEndDate || today
            };
            setItinerary(currentItinerary); // Update state directly
        }
        if (publish) {
            if (!currentItinerary.startDate && !tempStartDate) requiredFields.push('行程日期(开始)');
            if (!currentItinerary.endDate && !tempEndDate) requiredFields.push('行程日期(结束)');
            if (!currentItinerary.destination) requiredFields.push('目的地城市');
        }
        if (requiredFields.length > 0) {
            message.warning(`${publish ? '无法发布' : '保存草稿失败'}，请填写: ${requiredFields.join(', ')}`);
            return;
        }
        // MODIFIED: Determine status and isPublic based on publish flag
        const targetStatus = publish ? 'published' : 'draft';
        const targetIsPublic = publish; // Save = false (private/draft), Publish = true (public)
        // END MODIFIED

        if (saving) return;
        setSaving(true);
        message.loading({ content: publish ? '正在发布行程...' : '正在保存行程...', key: 'saveItinerary' });
        try {
            // MODIFIED: Use targetStatus and targetIsPublic in the state to save
             const stateToSave: ItineraryState = { 
                ...currentItinerary, 
                 status: targetStatus, 
                 isPublic: targetIsPublic,
                 // 确保使用临时存储的日期
                 startDate: currentItinerary.startDate || tempStartDate,
                 endDate: currentItinerary.endDate || tempEndDate
             };
            // END MODIFIED
            const apiItinerary = convertFrontendItineraryToApi(stateToSave as ItineraryState);
            // 添加日志：记录准备发送的数据
            console.log('[PLANNER] Preparing to save/publish. Data sent to API:', JSON.stringify(apiItinerary, null, 2));
            let response: ApiItinerary;
            try {
            if (currentItinerary.id && currentItinerary.id > 0) {
                    console.log(`更新行程 ID:${currentItinerary.id}`);
                response = await itineraryAPI.updateItinerary(currentItinerary.id, apiItinerary);
                 console.log('[DEBUG] Update API Response:', JSON.stringify(response, null, 2)); // <-- 添加日志
            } else {
                    console.log('创建新行程');
                response = await itineraryAPI.createItinerary(apiItinerary);
                 console.log('[DEBUG] Create API Response:', JSON.stringify(response, null, 2)); // <-- 添加日志
            }
            
             // Directly use the response assuming it matches ApiItinerary structure (camelCase or snake_case handled by adaptApiToFrontend)
             const responseData = response; 

             // 检查API返回的日期字段，如果为null但有临时存储的日期，则使用临时日期
             if ((!responseData.startDate || responseData.startDate === 'null') && tempStartDate) {
                 console.log('[DEBUG] API返回的startDate为空，使用临时存储的日期:', tempStartDate);
                 responseData.startDate = tempStartDate;
             }
             
             if ((!responseData.endDate || responseData.endDate === 'null') && tempEndDate) {
                 console.log('[DEBUG] API返回的endDate为空，使用临时存储的日期:', tempEndDate);
                 responseData.endDate = tempEndDate;
             }

             // Checklist item 2 (Fix): Check for itinerary_id from raw response OR id
             // Safely access potential snake_case property
             const responseId = (responseData as any).itinerary_id ?? responseData.id; 
             if (!responseData || responseId === undefined || responseId === null) {
                 console.error('[DEBUG] API response is invalid or missing ID:', responseData);
                 // Even if API returns 2xx, if content is wrong, treat as failure
                 throw new Error('保存成功但服务器返回数据无效'); 
             }
             console.log('[DEBUG] Response ID is valid:', responseId); // <-- Use responseId

            message.success({ content: publish ? '行程发布成功' : '行程保存成功', key: 'saveItinerary' });
            setLastSaved(dayjs().format('YYYY-MM-DD HH:mm:ss'));

            // 使用adaptApiToFrontend处理API返回的数据，传入临时日期
            const updatedState = adaptApiToFrontend(responseData as ApiItinerary, tempStartDate, tempEndDate);
            console.log('[DEBUG] State after adaptApiToFrontend with adapted data:', JSON.stringify(updatedState, null, 2)); 

            // 再次确保更新后的状态保留了日期信息
            if (!updatedState.startDate && tempStartDate) {
                console.log('[DEBUG] 转换后的startDate为空，使用临时存储的日期:', tempStartDate);
                updatedState.startDate = tempStartDate;
            }
            
            if (!updatedState.endDate && tempEndDate) {
                console.log('[DEBUG] 转换后的endDate为空，使用临时存储的日期:', tempEndDate);
                updatedState.endDate = tempEndDate;
            }

            // 将临时日期保存到状态中
            updatedState.tempStartDate = tempStartDate;
            updatedState.tempEndDate = tempEndDate;

            // Checklist item 4: Keep invalidating list cache (if needed)
            queryClient.invalidateQueries({ queryKey: ['itineraries'] });
            console.log("Invalidated 'itineraries' query cache.");

            updatePreferencesFromItinerary(updatedState);

            // Use adapted ID for comparison and navigation
            if (!currentItinerary.id || currentItinerary.id !== responseId) { 
                console.log('[DEBUG] 导航到新行程:', responseId); 
                setItinerary(updatedState); // Update state before navigating
                navigate(`/itineraries/${responseId}`, { 
                    replace: true, 
                    state: { itineraryData: updatedState } 
                });
                console.log(`新行程已创建/ID已更新，ID: ${responseId}，页面已跳转`);
            } else {
                setItinerary(updatedState);
                console.log(`行程已更新，ID: ${responseId}`);
            }
            } catch (error) {
                // 添加日志：记录API调用本身的错误
                console.error('[PLANNER] API call failed:', error);
                if (error instanceof Error && error.message.includes('Network Error')) {
                     message.error({ content: '网络连接失败，请检查网络连接并重试', key: 'saveItinerary' });
                    try {
                        const key = `itinerary_backup_${Date.now()}`;
                        localStorage.setItem(key, JSON.stringify(currentItinerary));
                        message.info('已将行程备份到本地，请恢复网络连接后重试');
                    } catch (storageError) { console.error('备份到本地存储失败:', storageError); }
                } else { throw error; }
            }
        } catch (error) {
             // 添加日志：记录整个保存/发布流程的错误
             console.error('[PLANNER] Save/Publish process failed:', error);
             if (axios.isAxiosError(error)) {
                 const errorData = error.response?.data;
                const errorMessage = typeof errorData === 'string' ? errorData : (errorData?.message || '后端错误');
                message.error({ content: `${publish ? '发布' : '保存'}行程失败: ${errorMessage}`, key: 'saveItinerary' });
            } else if (error instanceof Error) {
                message.error({ content: `${publish ? '发布' : '保存'}行程失败: ${error.message}`, key: 'saveItinerary' });
                         } else {
                message.error({ content: `${publish ? '发布' : '保存'}行程失败: 未知错误`, key: 'saveItinerary' });
            }
        } finally {
            setSaving(false);
            // Checklist item 1: Clear manual saving flag
            setIsManualSaving(false); 
        }
    }, [isAuthenticated, itinerary, saving, navigate, loadItinerary, setItinerary, setSaving, setLastSaved, updatePreferencesFromItinerary, queryClient, setIsManualSaving, tempStartDate, tempEndDate]); // 添加tempStartDate, tempEndDate到依赖数组

    const updateItineraryItem = useCallback((dayIndex: number, itemIndex: number, updatedData: Partial<DisplayItem>) => {
        if (!itinerary) return;
        const newDaysList = [...itinerary.days];
        if (dayIndex >= 0 && dayIndex < newDaysList.length) {
            const items = [...newDaysList[dayIndex].items];
            if (itemIndex >= 0 && itemIndex < items.length) {
                items[itemIndex] = { ...items[itemIndex], ...updatedData };
                newDaysList[dayIndex] = { ...newDaysList[dayIndex], items };
        setItinerary(prev => {
            if (!prev) return null;
            return { ...prev, days: newDaysList };
        });
                autoSaveDebounced(); // Trigger auto-save
            }
        }
    }, [itinerary, autoSaveDebounced, setItinerary]);

    const exportToPDF = useCallback(async () => {
        const element = document.getElementById('itinerary-export-container');
        // 只检查element和itinerary是否存在，不检查itinerary.id
        if (!element || !itinerary) {
            message.error('无法导出，找不到行程内容');
            return;
        }
        message.loading({ content: '正在生成PDF...', key: 'exportPdf' });
        try {
            const canvas = await html2canvas(element, { scale: 2, logging: false, useCORS: true });
            const imgData = canvas.toDataURL('image/jpeg', 0.8);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            const imgX = (pdfWidth - imgWidth * ratio) / 2;
            const imgY = 10;
            pdf.addImage(imgData, 'JPEG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
            pdf.save(`行程_${itinerary.title || '未命名'}.pdf`);
            message.success({ content: 'PDF已导出', key: 'exportPdf' });
        } catch (error) {
            console.error('导出PDF失败:', error);
            message.error({ content: '导出PDF失败，请重试', key: 'exportPdf' });
        }
    }, [itinerary]);

    const exportToImage = useCallback(async () => {
        const element = document.getElementById('itinerary-export-container');
        // 只检查element和itinerary是否存在，不检查itinerary.id
        if (!element || !itinerary) {
            message.error('无法导出，找不到行程内容');
            return;
        }
        message.loading({ content: '正在生成图片...', key: 'exportImage' });
        try {
            const canvas = await html2canvas(element, { scale: 2, logging: false, useCORS: true });
            const imgData = canvas.toDataURL('image/jpeg', 0.8);
            const link = document.createElement('a');
            link.href = imgData;
            link.download = `行程_${itinerary.title || '未命名'}.jpg`;
            link.click();
            message.success({ content: '图片已导出', key: 'exportImage' });
        } catch (error) {
            console.error('导出图片失败:', error);
            message.error({ content: '导出图片失败，请重试', key: 'exportImage' });
        }
    }, [itinerary]);

    const exportItinerary = useCallback(() => {
        // 移除对itinerary.id的检查
        Modal.info({
            title: '导出行程',
            content: (
                <div>
                    <p>选择导出格式：</p>
                    <div className="export-buttons">
                        <Button type="primary" onClick={() => { Modal.destroyAll(); exportToPDF(); }}> PDF </Button>
                        <Button onClick={() => { Modal.destroyAll(); exportToImage(); }}> 图片 </Button>
                    </div>
                </div>
            ),
            onOk() {}
        });
    }, [exportToPDF, exportToImage]);

    const removeItineraryItem = useCallback((dayIndex: number, itemIndex: number) => {
        if (!itinerary) return;
        const newDaysList = [...itinerary.days];
        if (dayIndex >= 0 && dayIndex < newDaysList.length && itemIndex >= 0 && itemIndex < newDaysList[dayIndex].items.length) {
            const items = [...newDaysList[dayIndex].items];
            items.splice(itemIndex, 1);
            newDaysList[dayIndex] = { ...newDaysList[dayIndex], items };
            setItinerary(prev => {
                if (!prev) return null;
                return { ...prev, days: newDaysList };
            });
            autoSaveDebounced(); // Trigger auto-save
        }
    }, [itinerary, autoSaveDebounced, setItinerary]);

    const addCustomItem = useCallback((dayIndex: number) => {
        if (!itinerary) return;
        const newDaysList = [...itinerary.days];
        if (dayIndex >= 0 && dayIndex < newDaysList.length) {
            newDaysList[dayIndex] = {
                ...newDaysList[dayIndex],
                items: [...newDaysList[dayIndex].items, {
                    id: `temp-${Date.now()}`,
                    originalId: `custom-${Date.now()}`, // Use timestamp for originalId of custom items
                    type: 'custom',
                    name: '未命名项目',
                    image: '', // Changed from imageUrl
                    address: '', // Use address
                    description: '', // Use description
                    startTime: '',
                    endTime: '',
                    price: 0
                }]
            };
            setItinerary(prev => {
                if (!prev) return null;
                return { ...prev, days: newDaysList };
            });
            autoSaveDebounced(); // Trigger auto-save
        }
    }, [itinerary, autoSaveDebounced, setItinerary]);

    const moveItineraryItem = useCallback((dayIndex: number, fromIndex: number, toIndex: number) => {
        if (!itinerary) return;
        const newDaysList = [...itinerary.days];
        if (dayIndex >= 0 && dayIndex < newDaysList.length && fromIndex >= 0 && fromIndex < newDaysList[dayIndex].items.length && toIndex >= 0 && toIndex < newDaysList[dayIndex].items.length) {
            const items = [...newDaysList[dayIndex].items];
            const [movedItem] = items.splice(fromIndex, 1);
            items.splice(toIndex, 0, movedItem);
            newDaysList[dayIndex] = { ...newDaysList[dayIndex], items };
            setItinerary(prev => {
                if (!prev) return null;
                return { ...prev, days: newDaysList };
            });
            autoSaveDebounced(); // Trigger auto-save
        }
    }, [itinerary, autoSaveDebounced, setItinerary]);

    const moveItemToAnotherDay = useCallback((fromDayIndex: number, toDayIndex: number, itemIndex: number) => {
        if (!itinerary) return;
        const newDaysList = [...itinerary.days];
        if (fromDayIndex >= 0 && fromDayIndex < newDaysList.length && toDayIndex >= 0 && toDayIndex < newDaysList.length && itemIndex >= 0 && itemIndex < newDaysList[fromDayIndex].items.length) {
            const items = [...newDaysList[fromDayIndex].items];
            const [movedItem] = items.splice(itemIndex, 1);
            newDaysList[toDayIndex] = {
                ...newDaysList[toDayIndex],
                items: [...newDaysList[toDayIndex].items, movedItem]
            };
            newDaysList[fromDayIndex] = { ...newDaysList[fromDayIndex], items };
            setItinerary(prev => {
                if (!prev) return null;
                return { ...prev, days: newDaysList };
            });
            autoSaveDebounced(); // Trigger auto-save
        }
    }, [itinerary, autoSaveDebounced, setItinerary]);

    const addToItinerary = useCallback((item: any, dayIndex: number) => {
        if (!itinerary) return;
        const newDaysList = [...itinerary.days];
        if (dayIndex >= 0 && dayIndex < newDaysList.length) {
            newDaysList[dayIndex] = {
                ...newDaysList[dayIndex],
                items: [...newDaysList[dayIndex].items, item]
            };
            setItinerary(prev => {
                if (!prev) return null;
                return { ...prev, days: newDaysList };
            });
            autoSaveDebounced(); // Trigger auto-save
        }
    }, [itinerary, autoSaveDebounced, setItinerary]);

    const handleEditItem = useCallback((dayIndex: number, itemIndex: number) => {
        if (!itinerary) return;
        const newDaysList = [...itinerary.days];
        if (dayIndex >= 0 && dayIndex < newDaysList.length && itemIndex >= 0 && itemIndex < newDaysList[dayIndex].items.length) {
            const item = newDaysList[dayIndex].items[itemIndex];
            setEditingItem({ dayIndex, itemIndex, item });
            editItemForm.setFieldsValue({
                name: item.name,
                // 修改：确保使用 location 键，但值优先来自 address
                location: item.address || item.location || '',
                description: item.description,
                startTime: item.startTime,
                endTime: item.endTime,
                price: item.price
            });
            setEditItemModalVisible(true);
        }
    }, [itinerary, editItemForm, setEditingItem, setEditItemModalVisible]);

    const handleSaveItemInfo = useCallback(() => {
        if (!editingItem) return; // 早检查
        const { dayIndex, itemIndex, item } = editingItem;
        const formValues = editItemForm.getFieldsValue(); // 获取表单所有值
        const updatedItem: DisplayItem = { // 明确类型以帮助检查
            ...item,
            ...formValues, // 应用表单值
             // 修改：如果表单字段是 location，手动同步到 address
            address: formValues.location || item.address || '' 
        };
        updateItineraryItem(dayIndex, itemIndex, updatedItem);
        setEditItemModalVisible(false);
        setEditingItem(null); // 使用 setEditingItem
        // ... message.success ...
    }, [editingItem, editItemForm, updateItineraryItem, setEditItemModalVisible, setEditingItem]);

    const deleteItinerary = useCallback(async () => {
        if (!itinerary?.id) return;
        try {
            await itineraryAPI.deleteItinerary(itinerary.id);
            setItinerary(null);
            setLastSaved(null);
            navigate('/itineraries');
        } catch (error) {
            console.error('删除行程失败:', error);
            message.error('删除行程失败，请重试');
        }
    }, [itinerary?.id, navigate, setItinerary, setLastSaved]);

    const searchItems = useCallback(async (query: string, type: 'scenic' | 'hotel' | 'transport' = 'scenic') => {
        if (!itinerary) return;
        setSearchLoading(true);
        setSearchResults([]); // Clear previous results
        try {
            let rawResults: any[] = [];
            let adaptedResults: DisplayItem[] = [];

            if (type === 'scenic') {
                const response = await scenicAPI.getScenics({ keyword: query });
                rawResults = response.data.items || [];
                adaptedResults = rawResults.map((item: ScenicItem): DisplayItem => {
                    // --- Start Time Parsing Logic ---
                    const rawTime = item.openTime || item.open_time || '';
                    let startTime = '';
                    let endTime = '';
                    if (rawTime) {
                        // 尝试匹配 HH:MM 或 HH:MM-HH:MM 格式，忽略前缀字符
                        const timeRegex = /(\d{1,2}:\d{2})\s*(?:-\s*(\d{1,2}:\d{2}))?/;
                        const match = rawTime.match(timeRegex);
                        if (match) {
                            // 修正 L1066：添加缺失的参数 t
                            const validateTime = (t: string | undefined): string => { 
                                 if (!t) return '';
                                 // 简单校验格式 HH:MM 或 H:MM
                                 return /^\d{1,2}:\d{2}$/.test(t) ? t : '';
                            }
                            startTime = validateTime(match[1]); // 捕获组 1 是开始时间
                            endTime = validateTime(match[2]);   // 捕获组 2 是可选的结束时间
                        }
                    }
                    // --- End Time Parsing Logic ---

                    return {
                        id: `scenic-${item.id || item.scenic_id}`,
                        dbItemId: item.id || item.scenic_id,
                        originalId: item.id || item.scenic_id || 0,
                        name: item.name || '未知景点',
                        type: 'scenic',
                        image: Array.isArray(item.images) ? item.images[0] : (typeof item.images === 'string' ? item.images.split(',')[0] : item.coverImage || item.cover_image || ''),
                        price: item.ticketPrice ?? item.ticket_price ?? item.price ?? 0,
                        address: item.address || '', // 确认这里使用的是 address
                        description: item.description || '',
                        rating: item.rating ?? item.score ?? item.hotScore ?? item.hot_score,
                        startTime: startTime, // 使用解析后的 startTime
                        endTime: endTime      // 使用解析后的 endTime
                    };
                });
            } else if (type === 'hotel') {
                const response = await hotelAPI.getHotels({ keyword: query });
                // Adjust based on actual response structure (items or hotels)
                rawResults = response.data.items || response.data.hotels || [];
                adaptedResults = rawResults.map((item: Hotel): DisplayItem => ({
                    id: `hotel-${item.id}`,
                    dbItemId: item.id,
                    originalId: item.id || 0,
                    name: item.name || '未知酒店',
                    type: 'hotel',
                    image: Array.isArray(item.images) ? item.images[0] : (typeof item.images === 'string' ? item.images.split(',')[0] : item.coverImage || ''),
                    price: item.price ?? 0,
                    address: item.address || (typeof item.location === 'string' ? item.location : item.location?.address) || '',
                    location: typeof item.location === 'object' ? item.location.address : item.location, // Keep if available
                    description: item.description || '',
                    rating: item.rating ?? item.score,
                    // stars: item.stars, // Keep if needed, but not in DisplayItem
                }));
            } else if (type === 'transport') {
                // Decide search param: keyword for general search? Or from_city/to_city?
                // Example: search by matching either from or to city with the query
                const response = await transportAPI.getTransports({ from_city: query }); // Example: search by departure city
                // You might want a more flexible search, e.g., searching by keyword against company, fromCity, toCity
                // const response = await transportAPI.getTransports({ keyword: query }); // If backend supports keyword search
                rawResults = response.items || []; // Assuming response.items is the array from TransportSearchResponse
                adaptedResults = rawResults.map((item: Transport): DisplayItem => ({
                    id: `transport-${item.id}`,
                    dbItemId: item.id,
                    originalId: item.id || 0,
                    name: `${item.fromCity || '?'} - ${item.toCity || '?'} (${item.type})`,
                    type: 'transport',
                    image: '', // Transport usually doesn't have a representative image
                    price: item.price ?? 0,
                    address: `${item.fromCity || '?'} -> ${item.toCity || '?'}`, // Use address for location display
                    description: `公司: ${item.company || '未知'}, 时长: ${item.duration || '?'}分钟`,
                    transportType: item.type,
                    // Check if Transport interface includes departure/arrival time or if details need fetching
                    // departureTime: item.departureTime, // Assign if available in Transport interface
                    // arrivalTime: item.arrivalTime, // Assign if available in Transport interface
                }));
            }

            setSearchResults(adaptedResults); // 修正 L1106：将 adaptedResults 设置到 searchResults 状态
        } catch (error) {
            console.error(`搜索 ${type} 失败:`, error);
            // 修正 L1164：将 'transport' 字符串与 type 变量比较
            if (axios.isAxiosError(error) && error.response?.status === 404 && type === 'transport') {
                 message.info(`未找到从 "${query}" 出发的交通信息，尝试搜索目的地?`);
            } else {
                 message.error(`搜索 ${type} 失败，请重试`);
            }
            setSearchResults([]); // Clear results on error
        } finally {
            setSearchLoading(false);
        }
    }, [itinerary, setSearchLoading, setSearchResults]); // Added dependencies

    const handleAutoBudgetChange = useCallback((checked: boolean) => {
        setAutoBudget(checked);
        if (checked) {
            const totalCost = calculateTotalCost(itinerary?.days || []);
            updateItineraryInfo('budget', totalCost);
        } else if (customBudget !== null) {
            updateItineraryInfo('budget', customBudget);
        }
    }, [itinerary?.days, customBudget, updateItineraryInfo, setAutoBudget]);

    const handleCustomBudgetChange = useCallback((value: number | null) => {
        setCustomBudget(value);
        if (!autoBudget) {
            updateItineraryInfo('budget', value);
        }
    }, [autoBudget, updateItineraryInfo, setCustomBudget]);

    // DraggableItem 组件定义
    interface DraggableItemProps {
        item: DisplayItem;
        index: number;
        moveItem: (dragIndex: number, hoverIndex: number) => void;
        onRemove: () => void;
        onEdit: () => void;
        onMoveToDay: (targetDay: number) => void;
        currentDayIndex: number;
        totalDays: number;
    }
    const DraggableItem: React.FC<DraggableItemProps> = ({ 
        item, index, moveItem, onRemove, onEdit, onMoveToDay, currentDayIndex, totalDays 
    }) => {
        const ref = React.useRef<HTMLDivElement>(null);
        
        interface DragItem {
            index: number;
            type: string;
        }
        
        const [{ handlerId }, drop] = useDrop<DragItem, void, { handlerId: string | symbol | null }>({
            accept: ItemTypes.CARD,
            collect(monitor) {
                return {
                    handlerId: monitor.getHandlerId(),
                };
            },
            hover(draggedItem: DragItem, monitor: DropTargetMonitor) {
                if (!ref.current) {
            return;
        }
                const dragIndex = draggedItem.index;
                const hoverIndex = index;
        
                if (dragIndex === hoverIndex) {
                    return;
                }
        
                const hoverBoundingRect = ref.current?.getBoundingClientRect();
                const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
                const clientOffset = monitor.getClientOffset();
                const hoverClientY = clientOffset!.y - hoverBoundingRect.top;
        
                if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
                    return;
                }
                if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
                    return;
                }
        
                moveItem(dragIndex, hoverIndex);
                draggedItem.index = hoverIndex;
            },
        });
        
        const [{ isDragging }, drag] = useDrag({
            type: ItemTypes.CARD,
            item: () => ({ 
                index,
                type: ItemTypes.CARD
            }),
            collect: (monitor) => ({
                isDragging: monitor.isDragging(),
            }),
        });
        
        drag(drop(ref));
        
        // Options for moving to other days
        const dayOptions = Array.from({ length: totalDays }, (_, i) => i)
            .filter(i => i !== currentDayIndex)
            .map(i => ({ value: i, label: `移动到第 ${i + 1} 天` }));
        
        return (
            <div ref={ref} style={{ opacity: isDragging ? 0.5 : 1, marginBottom: 8, padding: '10px', border: '1px solid #d9d9d9', borderRadius: '4px', background: '#fff', cursor: 'move' }} data-handler-id={handlerId}>
                <Row justify="space-between" align="top">
                    <Col flex="auto">
                        <Space align="start">
                            {item.image && <img src={item.image} alt={item.name} style={{ width: 60, height: 60, objectFit: 'cover', marginRight: 10, borderRadius: '4px' }} />}
                            <div>
                                <Text strong>{item.name}</Text> <Tag>{item.type}</Tag> <br />
                                {(item.startTime || item.endTime) && 
                                    <><ClockCircleOutlined style={{ marginRight: 4 }} /><Text type="secondary">{item.startTime || '未定'} - {item.endTime || '未定'}</Text><br /></>}
                                {item.address && <><EnvironmentOutlined style={{ marginRight: 4 }} /><Text type="secondary" ellipsis style={{ maxWidth: '300px' }}>{item.address}</Text><br /></>}
                                {item.description && <Text type="secondary">备注: {item.description}</Text>}
                            </div>
                        </Space>
                    </Col>
                    <Col>
                        <Space direction="vertical" align="end">
                            <Space>
                                <Tooltip title="编辑">
                                    <Button icon={<EditOutlined />} onClick={onEdit} size="small" type="text" />
                                </Tooltip>
                                <Popconfirm title="确定移除此项吗?" onConfirm={onRemove} okText="移除" cancelText="取消">
                                    <Tooltip title="移除">
                                        <Button icon={<MinusOutlined />} size="small" type="text" danger />
                                    </Tooltip>
                                </Popconfirm>
                            </Space>
                            {totalDays > 1 && (
                                <Select 
                                    placeholder="移动到..." 
                                    options={dayOptions} 
                                    onChange={(value) => onMoveToDay(value)}
                                    style={{ width: 120 }} 
                                    size="small"
                                    disabled={dayOptions.length === 0}
                                />
                            )}
                        </Space>
                    </Col>
                </Row>
            </div>
        );
    };

    // DayPlannerCard 组件定义 (依赖 DayPlan, DisplayItem, DraggableItem, moveItineraryItem)
    interface DayPlannerCardProps {
        day: DayPlan;
        dayIndex: number;
        onRemoveItem: (itemIndex: number) => void;
        onAddCustomItem: () => void;
        onMoveItem: (fromIndex: number, toIndex: number) => void;
        onSearchAndAdd: () => void;
        onUpdateItem: (itemIndex: number) => void;
        onMoveToAnotherDay: (itemIndex: number, targetDayIndex: number) => void;
        totalDays: number;
    }
    const DayPlannerCard: React.FC<DayPlannerCardProps> = ({ 
        day, dayIndex, onRemoveItem, onAddCustomItem, onMoveItem, onSearchAndAdd, onUpdateItem, onMoveToAnotherDay, totalDays 
    }) => {
        const internalMoveItem = (dragIndex: number, hoverIndex: number) => {
            onMoveItem(dragIndex, hoverIndex);
        };
        
        // Calculate cost for this specific day
        const dayCost = calculateDayCost(day.items);

        return (
            <Card 
                title={
                    <Row justify="space-between" align="middle">
                        <Col>
                            <Typography.Title level={5} style={{ margin: 0 }}>
                                第 {day.dayNumber} 天 - {dayjs(day.date).isValid() ? dayjs(day.date).format('YYYY年MM月DD日 dddd') : day.date}
                            </Typography.Title>
                        </Col>
                        <Col>
                            <Text type="secondary">本日花费: ¥{dayCost.toFixed(2)}</Text>
                        </Col>
                    </Row>
                } 
                style={{ marginBottom: 16 }} 
                className="day-planner-card" // Added class name for potential styling
                size="small"
                extra={
                    <Space>
                         <Button 
                            icon={<PlusOutlined />} 
                            onClick={onAddCustomItem} 
                            size="small"
                        >
                            添加自定义项
                        </Button>
                        <Button 
                            icon={<SearchOutlined />} 
                            onClick={onSearchAndAdd} 
                            size="small"
                        >
                            搜索添加
                        </Button>
                    </Space>
                }
            >
                {day.items && day.items.length > 0 ? (
                    day.items.map((item, itemIndex) => (
                        <DraggableItem
                            key={item.id} // Use frontend unique ID as key
                            index={itemIndex}
                            item={item}
                            moveItem={(dragIndex, hoverIndex) => internalMoveItem(dragIndex, hoverIndex)}
                            onRemove={() => onRemoveItem(itemIndex)}
                            onEdit={() => onUpdateItem(itemIndex)}
                            onMoveToDay={(targetDay) => onMoveToAnotherDay(itemIndex, targetDay)}
                            currentDayIndex={dayIndex}
                            totalDays={totalDays}
                        />
                    ))
                ) : (
                    <Empty description="暂无安排" style={{ padding: '20px 0' }} />
                )}
            </Card>
        );
    };

    // THEN, the useEffect hooks
    useEffect(() => {
        const initCheck = async () => {
            const connected = await checkApiConnection();
            if (!connected) {
                message.error('无法连接到服务器，请检查网络连接');
            }
            
            // 如果需要访问受保护的路由但未登录
            if (!isAuthenticated && id !== 'create' && id !== undefined) { // 修正条件，允许 undefined
                message.warning('请先登录以访问您的行程');
                navigate('/login', { state: { from: `/itineraries${id ? `/${id}` : '/create'}` } });
                return;
            }
        };
        
        initCheck();
    }, [isAuthenticated, id, navigate, checkApiConnection]);

    useEffect(() => {
        console.log('ItineraryPlanner useEffect - id:', id, 'isAuthenticated:', isAuthenticated, 'location.state:', location.state); 
        
        if (id === 'create' || id === undefined) {
            if (!isAuthenticated) {
                message.warning('请先登录后再创建行程');
                navigate('/login', { state: { from: '/itineraries/create' } });
            return;
        }
            const userPrefs = getUserPreferences();
            if (userPrefs.useGuidedCreation) {
                initializeNewItinerary(); // 调用移动后的函数
            } else {
                initializeNewItinerary(); // 调用移动后的函数
                // setInitialLoading(false); // initializeNewItinerary 内部会设置
            }
        } else if (id) {
            const numericId = parseInt(id);
            if (location.state?.itineraryData && location.state.itineraryData.id === numericId) {
                console.log('使用 navigate 传递的 itineraryData 初始化组件:', location.state.itineraryData);
                setItinerary(location.state.itineraryData);
                setLastSaved(location.state.itineraryData.updatedAt ? dayjs(location.state.itineraryData.updatedAt).format('YYYY-MM-DD HH:mm:ss') : null);
                setInitialLoading(false);
                window.history.replaceState({}, '');
            } else {
                if (!isNaN(numericId)) {
                    loadItinerary(); // 调用移动后的函数
                } else {
                    message.error("无效的行程ID");
                    navigate('/itineraries'); 
                    setInitialLoading(false); 
                }
            }
        }
    }, [id, isAuthenticated, navigate, location.state, loadItinerary, initializeNewItinerary]); // 添加 loadItinerary, initializeNewItinerary 到依赖

    useEffect(() => {
        console.log('ItineraryPlanner - 当前状态:', { 
            id, 
            isAuthenticated, 
            hasToken: !!localStorage.getItem('token'),
            pathname: window.location.pathname,
            currentUser: user
        });
    }, [id, isAuthenticated, user]);

    useEffect(() => {
        if (itinerary?.days) {
            const totalCost = calculateTotalCost(itinerary.days);
            // 只有在 autoBudget 启用且计算出的花费与当前预算不同时才更新预算
            // 直接调用 setItinerary 以避免触发 updateItineraryInfo 中的 autoSave
            if (autoBudget && itinerary.budget !== totalCost) {
                setItinerary(prev => prev ? { ...prev, budget: totalCost } : null); 
            }
            // 检查是否超预算（这个逻辑可以保留）
            setBudgetExceeded(itinerary.budget !== undefined && itinerary.budget !== null && totalCost > itinerary.budget);
        }
    // 依赖项保持不变或精简为 [itinerary?.days, itinerary?.budget, autoBudget, setBudgetExceeded] 理论上可行，
    // 但为了安全，先保留原有的，主要靠内部逻辑判断阻止循环。
    // }, [itinerary?.days, itinerary?.budget, autoBudget, updateItineraryInfo, setBudgetExceeded]);
    // 修正依赖项，移除 updateItineraryInfo，因为它不再被直接调用
    // 添加 setItinerary 作为依赖项（虽然通常不必要，但明确些）
    }, [itinerary?.days, itinerary?.budget, autoBudget, setBudgetExceeded, setItinerary]);

    // THEN, the conditional returns for loading/empty state
    if (initialLoading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>;
    }

    if (!itinerary) {
         // This case should ideally be handled by the useEffect logic directing to create or erroring out
        return <div style={{ padding: '20px' }}><Empty description="无法加载行程数据" /></div>;
    }

    // FINALLY, the main JSX return
    return (
        <DndProvider backend={HTML5Backend}>
        <Layout className="itinerary-planner" id="itinerary-export-container">
            {/* 添加顶部工具栏，包含保存按钮 */}
            <div style={{ padding: '16px 24px', background: '#fff', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography.Title level={4} style={{ margin: 0 }}>
                    {itinerary.id ? '编辑行程' : '创建新行程'}
                </Typography.Title>
                <Space>
                    {lastSaved && (
                        <Text type="secondary" style={{ marginRight: 16 }}>
                            上次保存: {lastSaved}
                        </Text>
                    )}
                    <Button 
                        type="primary"
                        icon={<SaveOutlined />}
                        onClick={() => saveItinerary(false)}
                        loading={saving}
                    >
                        保存行程
                    </Button>
                    <Button 
                        onClick={() => saveItinerary(true)}
                        icon={<ShareAltOutlined />}
                        disabled={saving}
                    >
                        发布行程
                    </Button>
                    {/* 移除条件判断，确保导出按钮始终可见 */}
                    <Button 
                        onClick={exportItinerary}
                        icon={<ExportOutlined />}
                    >
                        导出
                    </Button>
                </Space>
            </div>
            
            <Content style={{ padding: '0 24px', marginTop: 16 }}>
                <Card variant="borderless" className="itinerary-content"> {/* Checklist item 11: Changed bordered={false} to variant="borderless" */}
                    {initialLoading ? <div style={{ textAlign: 'center', padding: '40px 0' }}><Spin size="large" /></div> : (
                    <>
                        {/* 标题输入 */}
                        <Row gutter={[16, 16]}>
                            <Col span={24}>
                                <Input 
                                    placeholder="未命名行程" 
                                    value={itinerary.title} 
                                    onChange={(e) => updateItineraryInfo('title', e.target.value)}
                                    size="large"
                                    style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: 16 }}
                                />
                            </Col>
                        </Row>
                        
                        {/* 日期和预算分开为两个卡片 */}
                        <Row gutter={[16, 16]}>
                            {/* 日期选择卡片 */}
                            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                                <Card 
                                    title={<><CalendarOutlined /> 行程日期</>} 
                                    size="small"
                                    className="info-card"
                                >
                                    <RangePicker 
                                        value={itinerary.startDate && itinerary.endDate ? 
                                                [dayjs(itinerary.startDate), dayjs(itinerary.endDate)] : null} 
                                        onChange={handleDateRangeChange}
                                        format="YYYY-MM-DD"
                                        placeholder={['开始日期', '结束日期']}
                                        style={{ width: '100%' }}
                                    />
                                </Card>
                            </Col>
                            
                            {/* 预算设置卡片 */}
                            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                                <Card 
                                    title={<><span style={{ color: budgetExceeded ? '#cf1322' : '#3f8600' }}>￥</span> 行程预算</>} 
                                    size="small"
                                    className="info-card"
                                    styles={{ body: { padding: '12px 24px' } }} /* Checklist item 12: Changed bodyStyle to styles.body */
                                >
                                    <Row align="middle" gutter={[16, 0]}>
                                        <Col span={12}>
                                            <Statistic 
                                                title={<span style={{ fontSize: '14px' }}>预估总预算</span>}
                                                prefix="¥" 
                                                value={itinerary.budget ?? 0} 
                                                precision={2}
                                                valueStyle={{ 
                                                    color: budgetExceeded ? '#cf1322' : '#3f8600',
                                                    fontSize: '20px'
                                                }} 
                                            />
                                            {budgetExceeded && 
                                                <Tooltip title="当前行程项花费已超出预算!">
                                                    <Tag color="error" style={{ marginTop: 4 }}>
                                                        <InfoCircleOutlined /> 超出预算
                                                    </Tag>
                                                </Tooltip>
                                            }
                                        </Col>
                                        <Col span={12}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <div>
                                                    <Switch 
                                                        checked={autoBudget} 
                                                        onChange={handleAutoBudgetChange} 
                                                        size="small" 
                                                    /> 
                                                    <Text style={{ marginLeft: 8 }}>自动计算</Text>
                                                </div>
                                                
                                                {!autoBudget && (
                                                    <InputNumber
                                                        prefix="¥"
                                                        value={customBudget ?? itinerary.budget ?? 3000}
                                                        onChange={handleCustomBudgetChange}
                                                        min={0}
                                                        step={100}
                                                        style={{ width: '100%' }}
                                                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                        parser={value => {
                                                            const parsed = parseFloat(value!.replace(/\$\s?|(,*)/g, ''));
                                                            return isNaN(parsed) ? 0 : parsed;
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        </Col>
                                    </Row>
                                </Card>
                            </Col>
                        </Row>

                        <Divider style={{ margin: '16px 0' }} />

                        {/* Itinerary Days */}
                        {itinerary.days.length > 0 ? (
                            itinerary.days.map((day, index) => (
                                 <DayPlannerCard
                                    key={`${day.date}-${index}`}
                                    day={day}
                                    dayIndex={index}
                                    onRemoveItem={(itemIndex: number) => removeItineraryItem(index, itemIndex)}
                                    onAddCustomItem={() => addCustomItem(index)}
                                    onMoveItem={(fromIndex: number, toIndex: number) => moveItineraryItem(index, fromIndex, toIndex)}
                                    onSearchAndAdd={() => { setSelectedDayForAdd(index); setSearchDrawerVisible(true); }}
                                    onUpdateItem={(itemIndex: number) => handleEditItem(index, itemIndex)}
                                    onMoveToAnotherDay={(itemIndex: number, targetDayIndex: number) => moveItemToAnotherDay(index, targetDayIndex, itemIndex)}
                                    totalDays={itinerary.days.length}
                                 />
                            ))
                        ) : (
                            <Empty description={<span>暂无行程安排，请先 <Text strong>选择日期范围</Text> 或 <Button type="link" onClick={() => addCustomItem(0)} style={{padding:0}}>手动添加第一天</Button></span>} />
                        )}
                        
                        {/* Add Day Button - Enabled if dates are selected, triggers handleAddDay */}
                        {itinerary.startDate && itinerary.endDate && (
                           <Button 
                               type="dashed" 
                               onClick={handleAddDay} // Changed onClick handler
                               icon={<PlusOutlined />}
                               style={{ marginTop: 16, width: '100%' }}
                               // Removed disabled attribute
                           >
                               添加一天
                           </Button>
                        )}
                    </>
                    )}
                </Card>
            </Content>
            
            {/* 搜索抽屉 */}
            <Drawer
                title="添加景点/酒店/交通"
                placement="right"
                onClose={() => setSearchDrawerVisible(false)}
                open={searchDrawerVisible}
                width={520}
                extra={
                    <Space>
                        <Button onClick={() => setSearchDrawerVisible(false)}>取消</Button>
                    </Space>
                }
            >
                <div className="search-drawer-content">
                    <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
                        <Select 
                            value={searchType} 
                            onChange={setSearchType} 
                            style={{ width: '100%' }}
                            options={[
                                { value: 'scenic', label: '景点' },
                                { value: 'hotel', label: '酒店' },
                                { value: 'transport', label: '交通' }
                            ]}
                        />
                        <Input.Search
                            placeholder="输入关键词搜索..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onSearch={(value) => searchItems(value, searchType)}
                            enterButton
                            loading={searching}
                        />
                    </Space>
                    
                    <div style={{ flex: 1, overflow: 'auto' }}>
                        {searching ? (
                            <div className="search-loading">
                                <Spin size="large" />
                            </div>
                        ) : searchResults.length === 0 ? (
                            <div className="search-placeholder">
                                <Empty description={searchQuery ? "未找到相关结果" : "输入关键词搜索"} />
                            </div>
                        ) : (
                            <List
                                dataSource={searchResults}
                                renderItem={(item) => (
                                    <List.Item
                                        key={`${item.type}-${item.id}`}
                                        actions={[
                                            <Button 
                                                type="primary" 
                                                size="small" 
                                                onClick={() => addToItinerary(item, selectedDayForAdd || 0)}
                                            >
                                                添加
                                            </Button>
                                        ]}
                                    >
                                        <List.Item.Meta
                                            avatar={item.image ? (
                                                <img 
                                                    src={item.image} 
                                                    alt={item.name} 
                                                    className="search-result-image"
                                                    style={{ width: 60, height: 60, objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <div 
                                                    className="search-result-image-placeholder"
                                                    style={{ width: 60, height: 60, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                >
                                                    {item.type === 'scenic' ? <EnvironmentOutlined /> : item.type === 'hotel' ? <HomeOutlined /> : <CarOutlined />}
                                                </div>
                                            )}
                                            title={<>{item.name} {item.price ? <Tag color="green">¥{item.price}</Tag> : null}</>}
                                            description={
                                                <>
                                                    <div>{item.address}</div>
                                                    {item.description && <div>{item.description}</div>}
                                                    {item.type === 'transport' && (
                                                        <div>
                                                            {/* Check if departureTime/arrivalTime exist before displaying */}
                                                            {(item.departureTime || item.arrivalTime) ? 
                                                                `${item.departureTime || '?'} - ${item.arrivalTime || '?'}` : null}
                                                        </div>
                                                    )}
                                                </>
                                            }
                                        />
                                    </List.Item>
                                )}
                            />
                        )}
                    </div>
                </div>
            </Drawer>
            
            {/* Checklist item 1: Add Edit Item Modal */}
            <Modal
                title="编辑行程项" /* Checklist item 2 */
                open={editItemModalVisible} /* Checklist item 2 */
                onOk={handleSaveItemInfo} /* Checklist item 2 */
                onCancel={() => { setEditItemModalVisible(false); setEditingItem(null); }} /* Checklist item 2 */
                destroyOnClose={true} /* Checklist item 2 */
                okText="保存" /* Checklist item 2 */
                cancelText="取消" /* Checklist item 2 */
            >
                {/* Checklist item 3: Add Form */}
                <Form
                    form={editItemForm} /* Checklist item 4 */
                    layout="vertical" /* Checklist item 4 */
                >
                    {/* Checklist item 5: Name Field */}
                    <Form.Item
                        label="名称"
                        name="name"
                        rules={[{ required: true, message: '请输入项目名称!' }]}
                    >
                        <Input placeholder="请输入项目名称" />
                    </Form.Item>
                    
                    {/* Checklist item 6: Location/Address Field */}
                    <Form.Item
                        label="地点/地址"
                        name="location"
                    >
                        <Input placeholder="请输入地点或地址" />
                    </Form.Item>
                    
                    {/* Checklist item 7: Description Field */}
                    <Form.Item
                        label="备注"
                        name="description"
                    >
                        <TextArea placeholder="请输入备注信息" rows={3} />
                    </Form.Item>
                    
                    {/* Checklist item 8: Start Time Field */}
                    <Form.Item
                        label="开始时间"
                        name="startTime"
                    >
                        <Input placeholder="HH:MM 格式, 例如 09:00" />
                    </Form.Item>
                    
                    {/* Checklist item 9: End Time Field */}
                    <Form.Item
                        label="结束时间"
                        name="endTime"
                    >
                        <Input placeholder="HH:MM 格式, 例如 17:30" />
                    </Form.Item>
                    
                    {/* Checklist item 10: Price Field */}
                    <Form.Item
                        label="价格"
                        name="price"
                    >
                        <InputNumber prefix="¥" min={0} style={{ width: '100%' }} placeholder="请输入价格" />
                    </Form.Item>
                </Form>
            </Modal>
            
        </Layout>
        </DndProvider>
    );
};

export default ItineraryPlanner; 