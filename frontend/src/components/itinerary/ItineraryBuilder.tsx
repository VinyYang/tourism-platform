import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Layout, Row, Col, Card, Input, Button, Tabs, Tag, DatePicker, 
    Spin, Empty, Divider, Typography, message, Modal, InputNumber, Select, Space, Tooltip, Popconfirm, Switch, Form, Radio, Upload
} from 'antd';
import type { RangePickerProps } from 'antd/es/date-picker';
import { 
    SearchOutlined, PlusOutlined, EnvironmentOutlined, 
    ClockCircleOutlined, SaveOutlined, ExportOutlined, 
    ShareAltOutlined, DollarOutlined, DeleteOutlined, FilePdfOutlined, UploadOutlined, PictureOutlined
} from '@ant-design/icons';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/zh-cn';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import scenicAPI, { ScenicItem, ScenicSearchResponse, ScenicSearchParams } from '../../api/scenic';
import hotelAPI, { Hotel, HotelSearchResponse, HotelSearchParams } from '../../api/hotel';
import transportAPI, { Transport, TransportSearchResponse, TransportSearchParams, TransportType } from '../../api/transport';
import itineraryAPI, { 
    Itinerary as ApiItinerary, 
    ItineraryItem as ApiItineraryItem, 
    ItineraryDay as ApiItineraryDay 
} from '../../api/itinerary';
import commonAPI from '../../api/common';
import './ItineraryBuilder.css';

dayjs.locale('zh-cn');

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

// 定义前端使用的类型
interface DisplayItem {
    id: string; // 前端唯一ID (item-${ItineraryItem.id} 或 custom-${timestamp})
    dbItemId?: number; // 存储数据库中的 ItineraryItem.id (如果存在)
    originalId: number | string; // 原始的景点/酒店/交通ID或自定义时间戳
    name: string;
    type: 'scenic' | 'hotel' | 'transport' | 'custom' | 'activity'; 
    image?: string;
    price?: number; // 不直接在后端 ItineraryItem 中，可能来自相关实体
    address?: string; // 从 ItineraryItem.location 映射
    description?: string; // 从 ItineraryItem.notes 映射
    startTime?: string;
    endTime?: string;
    duration?: number; // 后端 ItineraryItem 没有持续时间
    rating?: number; // 不直接在后端 ItineraryItem 中
    transportType?: string; // 来自后端 Transport.type
}

interface DayPlan {
    date: string; // YYYY-MM-DD，根据 startDate 和 dayNumber 计算
    dayNumber: number; // 对应于后端 ItineraryItem.day_number
    items: DisplayItem[];
}

// 前端状态接口
interface ItineraryState {
    id?: number; // 后端 Itinerary ID
    title: string;
    startDate: string | null; // Allow null
    endDate: string | null;   // Allow null
    days: DayPlan[]; // 使用 DayPlan 结构
    budget: number | null; // Allow null, 映射到后端 estimatedBudget
    notes: string; // 映射到后端 description
    destination?: string; // 映射到后端 city
    isPublic: boolean;
    cover?: string;
    customUrl?: string; // 添加自定义URL字段
    userId?: number;
    createdAt?: string;
    updatedAt?: string;
}

// 定义 API 请求负载的接口
interface ApiItineraryPayload extends Partial<ApiItinerary> {
    daysList?: ApiItineraryDay[];
}

const ItineraryBuilder: React.FC = () => {
    const { id: itineraryIdParam } = useParams<{ id?: string }>();
    const navigate = useNavigate();

    // --- Utility Functions (Defined inside component) ---
    const calculateDays = (startDate?: string | null, endDate?: string | null): number => {
        if (!startDate || !endDate) return 0;
        const start = dayjs(startDate);
        const end = dayjs(endDate);
        if (!start.isValid() || !end.isValid() || end.isBefore(start)) return 1;
        return end.diff(start, 'day') + 1;
    };

    // Function to adapt backend Itinerary data to frontend ItineraryState
    const adaptApiToFrontend = (apiData: ApiItinerary): ItineraryState => {
        const dayMap = new Map<number, DisplayItem[]>();
        (apiData.items || []).forEach(item => {
            const dayNumber = (item as any).day_number;
            if (typeof dayNumber !== 'number') { console.warn('Item missing day_number:', item); return; }
            if (!dayMap.has(dayNumber)) { dayMap.set(dayNumber, []); }
            // Ensure item.id exists and is a number before using it for dbItemId
            const dbItemId = typeof item.id === 'number' ? item.id : undefined;

            // --- New Price Extraction Logic ---
            let extractedPrice: number | undefined = undefined;
            const itemAny = item as any; // Helper for easier access

            if (item.itemType === 'scenic' && itemAny.Scenic?.ticket_price) {
                const scenicPrice = parseFloat(itemAny.Scenic.ticket_price);
                if (!isNaN(scenicPrice)) {
                    extractedPrice = scenicPrice;
                }
            } else if (item.itemType === 'hotel' && itemAny.Hotel?.price) { // Assuming Hotel price is in Hotel.price
                const hotelPrice = parseFloat(itemAny.Hotel.price);
                 if (!isNaN(hotelPrice)) {
                    extractedPrice = hotelPrice;
                }
            } else if (item.itemType === 'transport' && itemAny.price) { // Assuming Transport price is top-level based on previous search logic
                const transportPrice = parseFloat(itemAny.price);
                 if (!isNaN(transportPrice)) {
                    extractedPrice = transportPrice;
                 }
            }
            // --- End New Price Extraction Logic ---

            const displayItem: DisplayItem = {
                id: `item-${dbItemId ?? Date.now()}`, // Use dbItemId or fallback to timestamp
                dbItemId: dbItemId,
                originalId: item.itemId,
                type: item.itemType === 'activity' ? 'custom' : item.itemType,
                name: item.name || '未命名',
                image: item.image,
                address: item.location,
                description: item.notes,
                startTime: item.startTime,
                endTime: item.endTime,
                transportType: item.itemType === 'transport' ? itemAny.transport_details?.type : undefined,
                 price: extractedPrice, // USE EXTRACTED PRICE
                 rating: item.itemType === 'scenic' ? itemAny.Scenic?.score :
                         item.itemType === 'hotel' ? (itemAny.Hotel?.rating || itemAny.Hotel?.score) :
                         undefined,
                duration: itemAny.duration, // Keep duration if exists
            };
            dayMap.get(dayNumber)?.push(displayItem);
        });
        // Sort items within each day by order
        dayMap.forEach(items => items.sort((a, b) => {
            // Add null checks for apiData.items and find results
            const itemA = apiData.items?.find(apiItem => apiItem.id === a.dbItemId);
            const itemB = apiData.items?.find(apiItem => apiItem.id === b.dbItemId);
            const orderA = itemA?.order ?? 0;
            const orderB = itemB?.order ?? 0;
            return orderA - orderB;
        }));
        const dayPlans: DayPlan[] = [];
        const start = dayjs(apiData.startDate);
        const totalDays = calculateDays(apiData.startDate, apiData.endDate);
        for (let i = 0; i < totalDays; i++) {
            const dayNumber = i + 1;
            const date = start.add(i, 'day').format('YYYY-MM-DD');
            dayPlans.push({ date, dayNumber, items: dayMap.get(dayNumber) || [] });
        }
        return {
            id: apiData.id,
            title: apiData.title,
            startDate: apiData.startDate,
            endDate: apiData.endDate,
            days: dayPlans,
            budget: isNaN(parseFloat(String(apiData.estimatedBudget))) ? null : parseFloat(String(apiData.estimatedBudget)),
            notes: apiData.description ?? '', // Use nullish coalescing
            destination: apiData.city,
            isPublic: apiData.isPublic,
            cover: apiData.cover,
            customUrl: apiData.customUrl,
            userId: apiData.userId,
            createdAt: apiData.createdAt,
            updatedAt: apiData.updatedAt,
        };
    };

    // State definitions
    const [isInitialLoading, setIsInitialLoading] = useState<boolean>(!!itineraryIdParam);
    const [loadingRecommendations, setLoadingRecommendations] = useState<boolean>(false);
    const [searchLoading, setSearchLoading] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [itinerary, setItinerary] = useState<ItineraryState | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [searchType, setSearchType] = useState<string>('scenic');
    const [searchResults, setSearchResults] = useState<DisplayItem[]>([]);
    const [recommendations, setRecommendations] = useState<DisplayItem[]>([]);
    const [budgetExceeded, setBudgetExceeded] = useState<boolean>(false);

    // Initial empty state for new itineraries - ensure all required fields are present
    const initialNewItineraryState: ItineraryState = {
        // id is optional
        title: '新建行程',
        startDate: dayjs().format('YYYY-MM-DD'),
        endDate: dayjs().add(2, 'day').format('YYYY-MM-DD'),
        days: [],
        budget: 3000,
        notes: '',
        isPublic: false,
        destination: '',
        cover: '',
        customUrl: '',
        // userId, createdAt, updatedAt are optional
    };

    // Helper to generate initial DayPlan structure
    const generateInitialDays = (startDate: string | null, endDate: string | null): DayPlan[] => {
        if (!startDate || !endDate) {
            return [];
        }
        const start = dayjs(startDate);
        const end = dayjs(endDate);
        const daysDiff = calculateDays(startDate, endDate);
        const days: DayPlan[] = [];
        for (let i = 0; i < daysDiff; i++) {
            days.push({
                date: start.add(i, 'day').format('YYYY-MM-DD'),
                dayNumber: i + 1, // Add dayNumber
                items: []
            });
        }
        return days;
    };

    // Effect to load or initialize itinerary
    useEffect(() => {
        const itineraryId = itineraryIdParam ? parseInt(itineraryIdParam, 10) : undefined;
        if (itineraryId && !isNaN(itineraryId)) {
            setIsInitialLoading(true);
            itineraryAPI.getItineraryDetail(itineraryId)
                .then(apiData => {
                    setItinerary(adaptApiToFrontend(apiData));
                })
                .catch(err => {
                    console.error('获取行程详情失败:', err);
                    message.error('加载行程失败');
                    navigate('/itineraries');
                })
                .finally(() => setIsInitialLoading(false));
        } else {
             const initialDays = generateInitialDays(initialNewItineraryState.startDate, initialNewItineraryState.endDate);
             // Ensure the object passed to setItinerary matches ItineraryState
             setItinerary({...initialNewItineraryState, days: initialDays });
             setIsInitialLoading(false);
        }
    }, [itineraryIdParam, navigate]); // Dependencies are correct

    // Effect to load recommendations (runs once after initial state is set)
    useEffect(() => {
        if (itinerary) { // Check if itinerary is not null
            loadRecommendations();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [itinerary?.id]); // Use optional chaining

    // Effect to check budget
    useEffect(() => {
        if (itinerary) { // Check if itinerary is not null
            checkBudget();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [itinerary?.days, itinerary?.budget]); // Use optional chaining

    // --- Helper Functions ---
    // (Define ALL helper functions used by the component here, before useEffect and return)

    // Function to initialize days based on start/end dates
    const initializeDays = (startDate: string | null, endDate: string | null) => {
        // Handle null dates
        if (!startDate || !endDate) {
            setItinerary((prev: ItineraryState | null) => {
                if (!prev) return null;
                return { ...prev, days: [] }; // Just clear days if dates are null
            });
            return;
        }

        const start = dayjs(startDate);
        const end = dayjs(endDate);
        if (end.isBefore(start)) {
            message.error('结束日期不能早于开始日期');
            // Revert to valid state or simply don't update
            // Need to check if itinerary is not null before updating
            setItinerary((prev: ItineraryState | null) => {
                if (!prev) return null; // If prev is null, return null
                // Ensure the returned object matches ItineraryState completely
                return {
                    ...prev, // Spread existing properties
                    endDate: startDate, // Revert end date
                    // Ensure days property is always DayPlan[]
                    days: prev.days.length > 0 ? prev.days : generateInitialDays(startDate, startDate) // Revert to one day or keep existing
                };
            });
            return;
        }

        // Check itinerary before accessing its properties
        if (!itinerary) return;

        const daysDiff = calculateDays(startDate, endDate);
        const newDays: DayPlan[] = [];
        // Use optional chaining and provide a default empty Map if itinerary or days is null/undefined
        const currentDaysMap = new Map(itinerary.days?.map((day: DayPlan) => [day.date, day.items]) ?? []);

        for (let i = 0; i < daysDiff; i++) {
            const date = start.add(i, 'day').format('YYYY-MM-DD');
            // Ensure items property is always DisplayItem[]
            const items = currentDaysMap.get(date) || [];
            // Add dayNumber when pushing
            newDays.push({ date, dayNumber: i + 1, items });
        }

        // Ensure the object passed to setItinerary matches ItineraryState
        setItinerary((prev: ItineraryState | null) => {
            if (!prev) return null; // If prev is null, return null
            // Ensure all required fields are present
            return {
                ...prev,
                startDate, // Update startDate
                endDate,   // Update endDate
                days: newDays // Update days
            };
        });
    };

    // Function to load recommendations
    const loadRecommendations = async () => {
        if (!itinerary?.destination) return; // Check if destination exists
        setLoadingRecommendations(true);
        try {
            // Example: Fetch scenic spots for the destination city
            const params: ScenicSearchParams = { city: itinerary.destination, page: 1, pageSize: 5, sortBy: 'rating', sortOrder: 'desc' };
            const response = await scenicAPI.getScenics(params);
            // 使用 response.data 访问响应中的数据
            const recItems: DisplayItem[] = response.data.items.map((scenic: ScenicItem) => ({
                id: `rec-scenic-${scenic.id}`,
                originalId: scenic.id,
                name: scenic.name,
                type: 'scenic',
                image: (Array.isArray(scenic.images) ? scenic.images[0] : scenic.images) || '', // Handle image format
                address: scenic.address || scenic.city || '', // 修改为使用 address 字段
                description: scenic.description,
                price: typeof scenic.price === 'number' ? scenic.price : undefined,
                rating: typeof scenic.score === 'number' ? scenic.score : undefined,
                // Add dbItemId if needed later
            }));
            setRecommendations(recItems);
        } catch (error) {
            console.error('加载推荐失败:', error);
            // message.error('加载推荐失败'); // Maybe too noisy
        } finally {
            setLoadingRecommendations(false);
        }
    };

    // Function to handle search
    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }
        setSearchLoading(true);
        setSearchResults([]); // Clear previous results
        try {
            let results: DisplayItem[] = [];
            const commonParams = { keyword: searchQuery, page: 1, limit: 10 };

            switch (searchType) {
                case 'scenic':
                    // 使用 getScenics 替换不存在的 searchScenics
                    const scenicResponse = await scenicAPI.getScenics({ 
                        ...commonParams, 
                        city: itinerary?.destination 
                    });
                    results = (scenicResponse.data.items as ScenicItem[]).map(item => ({
                        id: `search-scenic-${item.id}`, 
                        originalId: item.id, 
                        name: item.name, 
                        type: 'scenic',
                        image: (Array.isArray(item.images) ? item.images[0] : item.images) || '',
                        address: item.address || item.city || '', // 使用 address 替换 location
                        price: item.price, 
                        rating: item.score,
                        description: item.description
                    }));
                    break;
                case 'hotel':
                    // 使用 getHotels 替换不存在的 searchHotels
                    const hotelResponse = await hotelAPI.getHotels({ 
                        ...commonParams, 
                        city: itinerary?.destination 
                    });
                    results = (hotelResponse.data.items as Hotel[]).map(item => ({
                        id: `search-hotel-${item.id}`, 
                        originalId: item.id, 
                        name: item.name, 
                        type: 'hotel',
                        image: (Array.isArray(item.images) ? item.images[0] : item.images) || '',
                        address: item.address || '', // 直接使用 address 字段
                        price: item.price, 
                        rating: typeof item.rating === 'number' ? item.rating : 
                               typeof item.score === 'number' ? item.score : undefined, // 确保类型一致
                        description: item.description
                    }));
                    break;
                case 'transport':
                    // 使用适当的交通搜索方法
                    const origin = itinerary?.destination || ''; 
                    const destination = searchQuery;
                    // 使用正确的 API 方法获取交通信息
                    const transports = await transportAPI.searchTransportBetweenCities(origin, destination);
                    results = transports.map(item => ({
                        id: `search-transport-${item.id}`, 
                        originalId: item.id, 
                        name: `${item.type}: ${item.fromCity} -> ${item.toCity}`, // 使用正确的字段名
                        type: 'transport',
                        price: item.price, 
                        transportType: item.type,
                        description: `出发城市: ${item.fromCity}, 到达城市: ${item.toCity}, 时长: ${item.duration}小时`, // 使用正确的字段名
                        duration: item.duration
                    }));
                    break;
            }
            setSearchResults(results);
        } catch (error) {
            console.error('搜索失败:', error);
            message.error('搜索失败');
        } finally {
            setSearchLoading(false);
        }
    };

    // Function to add a custom item (Placeholder - needs implementation)
    const addCustomItem = () => {
        Modal.confirm({
            title: '添加自定义项目',
            content: (
                // Form to collect custom item details (name, time, notes etc.)
                // For simplicity, we'll just add a basic item
                <Input placeholder="自定义项目名称" id="custom-item-name" />
            ),
            onOk: () => {
                const name = (document.getElementById('custom-item-name') as HTMLInputElement)?.value || '自定义项目';
                const newItem: DisplayItem = {
                    id: `custom-${Date.now()}`,
                    originalId: `custom-${Date.now()}`,
                    name: name,
                    type: 'custom',
                };

                // Add to the first day for simplicity
                const dayIndex = 0;
                setItinerary((prev: ItineraryState | null) => {
                    if (!prev || !prev.days || prev.days.length === 0) return prev; // Check prev and days
                    const newDays = [...prev.days];
                    // Ensure items exists before pushing
                    if (!newDays[dayIndex].items) {
                         newDays[dayIndex].items = [];
                    }
                    newDays[dayIndex].items.push(newItem);
                    // Ensure the returned object matches ItineraryState completely
                    return { ...prev, days: newDays };
                });
                message.success(`已添加自定义项目: ${name}`);
            },
        });
    };

    // Drag and Drop handler
    const handleDragEnd = (result: DropResult) => {
        const { source, destination } = result;
        if (!destination) return; // Dropped outside a droppable area

        // Check if itinerary and days exist
        if (!itinerary || !itinerary.days) return;

        // Dropping within the same list (reordering day items)
        if (source.droppableId === destination.droppableId && source.droppableId.startsWith('day-')) {
            const dayIndex = parseInt(destination.droppableId.split('-')[1], 10);
            if (isNaN(dayIndex) || dayIndex < 0 || dayIndex >= itinerary.days.length) return;

            const newDays = JSON.parse(JSON.stringify(itinerary.days)) as DayPlan[];
            const dayItems = newDays[dayIndex].items;
            const [removed] = dayItems.splice(source.index, 1);
            dayItems.splice(destination.index, 0, removed);

            setItinerary((prev: ItineraryState | null) => {
                if (!prev) return null;
                return { ...prev, days: newDays };
            });
        }
        // Moving from recommendations/search results to a day list
        else if ((source.droppableId === 'recommendations' || source.droppableId === 'searchResults') && destination.droppableId.startsWith('day-')) {
            const destDayIndex = parseInt(destination.droppableId.split('-')[1], 10);
            if (isNaN(destDayIndex) || destDayIndex < 0 || destDayIndex >= itinerary.days.length) return;

            const sourceList = source.droppableId === 'recommendations' ? recommendations : searchResults;
            const itemToAdd = JSON.parse(JSON.stringify(sourceList[source.index])) as DisplayItem;
            itemToAdd.id = `${itemToAdd.type}-${itemToAdd.originalId}-${Date.now()}`; // Ensure unique ID in itinerary

            const newDays = JSON.parse(JSON.stringify(itinerary.days)) as DayPlan[];
            // Ensure items array exists
            if (!newDays[destDayIndex].items) {
                 newDays[destDayIndex].items = [];
            }
            newDays[destDayIndex].items.splice(destination.index, 0, itemToAdd);

            setItinerary((prev: ItineraryState | null) => {
                if (!prev) return null;
                return { ...prev, days: newDays };
            });
            message.success(`已添加 ${itemToAdd.name} 到第 ${destDayIndex + 1} 天`);
        }
        // Moving from one day list to another day list
        else if (source.droppableId.startsWith('day-') && destination.droppableId.startsWith('day-')) {
            const sourceDayIndex = parseInt(source.droppableId.split('-')[1], 10);
            const destDayIndex = parseInt(destination.droppableId.split('-')[1], 10);

            if (isNaN(sourceDayIndex) || sourceDayIndex < 0 || sourceDayIndex >= itinerary.days.length ||
                isNaN(destDayIndex) || destDayIndex < 0 || destDayIndex >= itinerary.days.length) return;

            const newDays = JSON.parse(JSON.stringify(itinerary.days)) as DayPlan[];
            // Ensure source and destination day items arrays exist
            if (!newDays[sourceDayIndex].items || !newDays[destDayIndex].items) return;

            const [removedItem] = newDays[sourceDayIndex].items.splice(source.index, 1);
            if (removedItem) {
                newDays[destDayIndex].items.splice(destination.index, 0, removedItem);
                setItinerary((prev: ItineraryState | null) => {
                    if (!prev) return null;
                    return { ...prev, days: newDays };
                });
            }
        }
    };

    // Remove an item from a specific day
    const removeItemFromDay = (dayIndex: number, itemIndex: number) => {
        // Check itinerary and days validity
        if (!itinerary || !itinerary.days || dayIndex < 0 || dayIndex >= itinerary.days.length || !itinerary.days[dayIndex].items || itemIndex < 0 || itemIndex >= itinerary.days[dayIndex].items.length) {
            message.error('无法移除项目：索引无效');
            return;
        }

        const newDays = JSON.parse(JSON.stringify(itinerary.days)) as DayPlan[];
        const removedItem = newDays[dayIndex].items.splice(itemIndex, 1);
        if (removedItem.length > 0) {
            setItinerary((prev: ItineraryState | null) => {
                if (!prev) return null;
                return { ...prev, days: newDays };
            });
            message.success(`已移除项目: ${removedItem[0].name}`);
        } else {
            message.error('移除项目失败');
        }
    };

    // Edit time for an item
    const editItemTime = (dayIndex: number, itemIndex: number) => {
         // Check itinerary and days validity
        if (!itinerary || !itinerary.days || dayIndex < 0 || dayIndex >= itinerary.days.length || !itinerary.days[dayIndex].items || itemIndex < 0 || itemIndex >= itinerary.days[dayIndex].items.length) {
            message.error('无法编辑项目：索引无效');
            return;
        }
        const item = itinerary.days[dayIndex].items[itemIndex];

        // State for the modal inputs
        let tempStartTime = item.startTime || '09:00';
        let tempEndTime = item.endTime || '';
        let tempDuration = item.duration?.toString() || '1'; // Default duration 1 hour

        Modal.confirm({
            title: `编辑 "${item.name}" 的时间`,
            icon: <ClockCircleOutlined />,
            content: (
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Space>
                        <Text>开始时间:</Text>
                        <DatePicker
                            defaultValue={tempStartTime ? dayjs(tempStartTime, 'HH:mm') : undefined}
                            format="HH:mm"
                            onChange={(date, dateString) => tempStartTime = dateString as string}
                            style={{ width: '100%' }}
                        />
                    </Space>
                     <Space>
                        <Text>结束时间:</Text>
                         <DatePicker
                             defaultValue={tempEndTime ? dayjs(tempEndTime, 'HH:mm') : undefined}
                             format="HH:mm"
                             onChange={(date, dateString) => tempEndTime = dateString as string}
                             style={{ width: '100%' }}
                         />
                     </Space>
                    <Space>
                        <Text>持续时长 (小时):</Text>
                        <InputNumber
                            min={0.5}
                            max={24}
                            step={0.5}
                            defaultValue={parseFloat(tempDuration)}
                            onChange={(value) => tempDuration = value?.toString() ?? '1'}
                         />
                    </Space>
                </Space>
            ),
            onOk() {
                 // Re-check indices after modal interaction, although unlikely to change here
                if (!itinerary || !itinerary.days || dayIndex >= itinerary.days.length || itemIndex >= itinerary.days[dayIndex].items.length) {
                    message.error('编辑失败：行程已更新');
                    return;
                }

                const newDays = JSON.parse(JSON.stringify(itinerary.days)) as DayPlan[];
                 // Double check item exists at index
                if (!newDays[dayIndex] || !newDays[dayIndex].items || !newDays[dayIndex].items[itemIndex]) {
                     message.error('编辑失败：项目不存在');
                     return;
                }

                const duration = parseFloat(tempDuration);
                newDays[dayIndex].items[itemIndex] = {
                    ...newDays[dayIndex].items[itemIndex],
                    startTime: tempStartTime,
                    endTime: tempEndTime,
                    duration: isNaN(duration) ? 1 : duration, // Ensure duration is a number
                };

                setItinerary((prev: ItineraryState | null) => {
                    if (!prev) return null;
                    return { ...prev, days: newDays };
                });
                message.success('已更新项目时间');
            },
            okText: '确认修改',
            cancelText: '取消',
        });
    };

    // Calculate total cost - DEFINED HERE
    const calculateTotalCost = (): number => {
        // Check itinerary and days validity
        if (!itinerary || !itinerary.days) {
            return 0;
        }
        return itinerary.days.reduce((total: number, day: DayPlan) => {
            // Check day and items validity
            if (!day || !day.items) return total;
            return total + day.items.reduce((dayTotal: number, item: DisplayItem) => {
                 // Ensure item.price is a number
                const price = typeof item.price === 'number' ? item.price : 0;
                return dayTotal + price;
            }, 0);
        }, 0);
    };

    // Check budget against total cost
    const checkBudget = () => {
        // Check itinerary validity
        if (!itinerary) return;

        const totalCost = calculateTotalCost(); // Calls the function defined above
        // Use nullish coalescing for budget
        const budget = itinerary.budget ?? 0;
        const isExceeded = budget > 0 && totalCost > budget;

        if (isExceeded && !budgetExceeded) {
            // Ensure budget is treated as a number
            message.warning(`当前行程总花费 ¥${totalCost.toFixed(2)} 已超出预算 ¥${budget.toFixed(2)}！`, 5);
        }
        setBudgetExceeded(isExceeded);
    };

    // Handler for Date Range Picker change
    const handleDateRangeChange: RangePickerProps['onChange'] = (dates, dateStrings) => {
        // Check if dates are cleared
        if (!dates || !dates[0] || !dates[1] || !dateStrings || dateStrings.length !== 2 || !dateStrings[0] || !dateStrings[1]) {
            // Set dates to null in state if cleared
            setItinerary((prev: ItineraryState | null) => {
                if (!prev) return null;
                return {
                    ...prev,
                    startDate: null, // Set to null
                    endDate: null,   // Set to null
                    days: [] // Also clear or adjust days if needed
                };
            });
            initializeDays(null, null); // Re-initialize with null dates
            return; // Exit early
        }

        const [startDate, endDate] = dateStrings;

        // Update state using the functional form of setItinerary
        setItinerary((prev: ItineraryState | null) => {
            // If previous state is null, return null or initialize a new state if appropriate
            if (!prev) {
                 // Decide how to handle this case: return null or create a new state if appropriate
                 // Creating a new state might be unexpected. Returning null is safer.
                 return null;
                // Or initialize based on new dates:
                // const newDays = generateInitialDays(startDate, endDate);
                // return { ...initialNewItineraryState, startDate, endDate, days: newDays };
            }
            // Ensure the returned object matches ItineraryState completely
            return {
                ...prev,
                startDate,
                endDate,
                // Keep existing days or re-initialize if necessary
                 // days: prev.days // Option 1: Keep existing days
                 // days: generateInitialDays(startDate, endDate) // Option 2: Regenerate based on new dates
                 // Option 3 (Current): Let initializeDays handle it after state update
            };
        });
        // Call initializeDays AFTER the state has been updated (useEffect might be better)
        // However, calling it directly might be intended. Pass current or new dates.
        initializeDays(startDate, endDate);
    };

    // Handler for Budget InputNumber change
    const handleBudgetChange = (value: number | null) => {
        setItinerary((prev: ItineraryState | null) => {
            if (!prev) return null;
            return {
                ...prev,
                // Ensure budget is number or null
                budget: typeof value === 'number' ? value : null
            };
        });
    };

    // Function to save the itinerary
    const saveItinerary = async () => {
        if (!itinerary) {
            message.error('没有行程数据可保存');
            return;
        }
        setSaving(true);
        message.loading({ content: '正在保存行程...', key: 'saveItinerary' });

        try {
            // Create payload from state
            const apiPayload: ApiItineraryPayload = {
                 id: itinerary.id,
                 title: itinerary.title,
                 startDate: itinerary.startDate,
                 endDate: itinerary.endDate,
                 estimatedBudget: itinerary.budget,
                 description: itinerary.notes,
                 city: itinerary.destination,
                 isPublic: itinerary.isPublic,
                 cover: itinerary.cover,
                 customUrl: itinerary.customUrl,
                 daysList: itinerary.days.map((dayPlan: DayPlan) => ({
                     dayNumber: dayPlan.dayNumber,
                     items: dayPlan.items.map((dispItem: DisplayItem, index: number) => ({
                         id: dispItem.dbItemId ?? 0, // Ensure id is number
                         itemId: typeof dispItem.originalId === 'number' ? dispItem.originalId : 0,
                         itemType: dispItem.type === 'custom' ? 'activity' : dispItem.type,
                         name: dispItem.name,
                         image: dispItem.image || '',
                         location: dispItem.address || '',
                         startTime: dispItem.startTime,
                         endTime: dispItem.endTime,
                         notes: dispItem.description || '',
                         order: index + 1,
                         price: dispItem.price // 添加 price 字段
                     }))
                 }))
             };

            // --- Pre-save Data Validation/Normalization ---
            // Convert empty string dates to null
            if (apiPayload.startDate === '') {
                apiPayload.startDate = null;
            }
            if (apiPayload.endDate === '') {
                apiPayload.endDate = null;
            }

            // Ensure budget is number or null
            if (apiPayload.estimatedBudget !== null && typeof apiPayload.estimatedBudget !== 'number') {
                const parsedBudget = parseFloat(String(apiPayload.estimatedBudget));
                apiPayload.estimatedBudget = isNaN(parsedBudget) ? null : parsedBudget;
            }

            // Log the final payload before sending (Optional: remove after debugging)
            console.log('Final API Payload:', apiPayload);

            let response: ApiItinerary;
            let currentItineraryId = itinerary.id;

            if (currentItineraryId && currentItineraryId > 0) {
                // 更新现有行程
                response = await itineraryAPI.updateItinerary(currentItineraryId, apiPayload);
                message.success({ content: '行程更新成功！', key: 'saveItinerary', duration: 2 });
            } else {
                // 创建新行程
                response = await itineraryAPI.createItinerary(apiPayload);
                currentItineraryId = response.id; // 获取新创建的行程ID
                // 更新前端状态，设置新ID
                setItinerary((prev: ItineraryState | null) => {
                    if (!prev) return null; // 虽然此处不应为null，但仍需检查
                    return { ...prev, id: currentItineraryId };
                });
                message.success({ content: '行程创建成功！', key: 'saveItinerary', duration: 2 });
                // 导航到新行程页面
                if (currentItineraryId) {
                    navigate(`/itineraries/${currentItineraryId}`, { replace: true });
                }
            }
        } catch (error) {
            console.error('保存行程失败:', error);
            message.error({ content: `保存行程失败: ${error instanceof Error ? error.message : '未知错误'}`, key: 'saveItinerary', duration: 3 });
        } finally {
            setSaving(false);
        }
    };

    // Function to export itinerary to PDF
    const exportToPDF = async () => {
         // Check itinerary validity
        if (!itinerary) {
            message.error('没有行程数据可导出');
            return;
        }

        message.loading({ content: '正在生成PDF...', key: 'pdfExport' });
        try {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            let position = 15; // Initial vertical position

            // 添加封面图片（如果存在）
            if (itinerary.cover) {
                try {
                    // 创建一个图片元素以获取图片尺寸
                    const img = new Image();
                    img.src = itinerary.cover;
                    
                    await new Promise((resolve, reject) => {
                        img.onload = resolve;
                        img.onerror = reject;
                    });
                    
                    // 计算图片尺寸，使其适应页面宽度
                    const imgWidth = pdfWidth - 20; // 留出页面边距
                    const imgHeight = (img.height * imgWidth) / img.width;
                    
                    // 如果图片高度太大，限制其高度
                    const maxHeight = 100;
                    const finalHeight = Math.min(imgHeight, maxHeight);
                    const finalWidth = finalHeight === maxHeight ? (img.width * maxHeight) / img.height : imgWidth;
                    
                    // 添加图片到PDF
                    pdf.addImage(itinerary.cover, 'JPEG', (pdfWidth - finalWidth) / 2, position, finalWidth, finalHeight);
                    
                    // 调整位置以容纳图片
                    position += finalHeight + 10;
                } catch (error) {
                    console.error('添加封面图片失败:', error);
                    // 发生错误时不中断PDF导出过程
                }
            }

            // Title
            pdf.setFontSize(18);
            pdf.text(itinerary.title || '旅游攻略', pdfWidth / 2, position, { align: 'center' });
            position += 15;

            // Basic Info: Date Range, Budget
            pdf.setFontSize(10);
            pdf.text(`日期: ${itinerary.startDate || 'N/A'} 到 ${itinerary.endDate || 'N/A'}`, 10, position);
            pdf.text(`预算: ¥${(itinerary.budget ?? 0).toFixed(2)}`, pdfWidth - 10, position, { align: 'right' });
            position += 10;

            // Destination & Notes (if they exist)
            if (itinerary.destination) {
                 pdf.text(`目的地: ${itinerary.destination}`, 10, position);
                 position += 5;
             }
             if (itinerary.notes) {
                 pdf.text(`备注: ${itinerary.notes}`, 10, position);
                 position += 5;
             }
            position += 5; // Add some space before days


             // --- Add Days and Items ---
            for (const day of itinerary.days) {
                if (position > 260) { // Check if new page is needed before starting a new day
                    pdf.addPage();
                    position = 15;
                }

                pdf.setFontSize(14);
                pdf.setFont('helvetica', 'bold');
                pdf.text(`第 ${day.dayNumber} 天 (${day.date})`, 10, position);
                pdf.setFont('helvetica', 'normal');
                position += 8;

                 if (day.items.length === 0) {
                     pdf.setFontSize(10);
                     pdf.setTextColor(150);
                     pdf.text('- 无安排 -', 15, position);
                     pdf.setTextColor(0);
                     position += 7;
                 } else {
                     for (const item of day.items) {
                         if (position > 270) { // Check if new page is needed before adding an item
                             pdf.addPage();
                             position = 15;
                              // Optionally repeat day header on new page
                              pdf.setFontSize(12);
                              pdf.setFont('helvetica', 'bold');
                              pdf.text(`第 ${day.dayNumber} 天 (${day.date}) -续`, 10, position);
                              pdf.setFont('helvetica', 'normal');
                              position += 8;
                         }

                         pdf.setFontSize(11);
                         pdf.setFont('helvetica', 'bold');
                         pdf.text(item.name, 15, position);
                         pdf.setFont('helvetica', 'normal');
                         position += 5;

                         pdf.setFontSize(9);
                         let itemDetails = [];
                         if (item.type !== 'custom') itemDetails.push(`类型: ${item.type}`);
                         if (item.startTime) itemDetails.push(`时间: ${item.startTime}${item.endTime ? ' - '+item.endTime : ''}`);
                         else if (item.duration) itemDetails.push(`时长: ${item.duration} 小时`);
                         if (item.address) itemDetails.push(`地点: ${item.address}`);
                         if (typeof item.price === 'number') {
                             itemDetails.push(`费用: ¥${item.price.toFixed(2)}`);
                         } else if (item.price) {
                             itemDetails.push(`费用: ¥${Number(item.price).toFixed(2)}`);
                         }
                         if (typeof item.rating === 'number') itemDetails.push(`评分: ${item.rating.toFixed(1)}`);

                         if (itemDetails.length > 0) {
                             pdf.text(itemDetails.join(' | '), 20, position);
                             position += 4;
                         }
                         if (item.description) {
                             // Handle multi-line descriptions potentially
                             const splitDesc = pdf.splitTextToSize(item.description, pdfWidth - 30); // Wrap text
                             pdf.text(splitDesc, 20, position);
                             position += (splitDesc.length * 3.5); // Adjust position based on lines
                         }
                         position += 3; // Space between items
                     }
                 }
                position += 5; // Space between days
            }

            // 添加水印
            const addWatermark = () => {
                const pageCount = pdf.getNumberOfPages();
                
                for (let i = 1; i <= pageCount; i++) {
                    pdf.setPage(i);
                    
                    // 使用更简单的方法添加水印文本
                    // 设置水印文本样式
                    pdf.setTextColor(200, 200, 200); // 浅灰色
                    pdf.setFontSize(24);
                    pdf.setFont('helvetica', 'italic');
                    
                    // 在不同位置添加多个水印文本以覆盖整个页面
                    const text = '旅行行程规划';
                    
                    // 在页面中心添加水印
                    pdf.text(text, pdfWidth / 2, pdfHeight / 2, { 
                        align: 'center'
                    });
                    
                    // 在四个角落添加水印
                    pdf.text(text, 20, 40);
                    pdf.text(text, pdfWidth - 20, 40, { align: 'right' });
                    pdf.text(text, 20, pdfHeight - 40);
                    pdf.text(text, pdfWidth - 20, pdfHeight - 40, { align: 'right' });
                    
                    // 重置文本属性
                    pdf.setTextColor(0);
                    pdf.setFont('helvetica', 'normal');
                    pdf.setFontSize(8);
                }
            };
            
            // 调用添加水印函数
            addWatermark();

            // --- Add Footer ---
            const pageCount = pdf.getNumberOfPages();
            pdf.setFontSize(8);
            pdf.setTextColor(150);
            
            for (let i = 1; i <= pageCount; i++) {
                pdf.setPage(i);
                // 页码信息
                pdf.text(`页 ${i} / ${pageCount}`, pdfWidth / 2, 287, { align: 'center' });
                
                // 左侧版权信息
                pdf.text('© ' + new Date().getFullYear() + ' 旅行规划系统', 10, 287);
                
                // 右侧生成时间信息
                pdf.text(`生成于: ${dayjs().format('YYYY-MM-DD HH:mm')}`, pdfWidth - 10, 287, { align: 'right' });
            }


            // Save the PDF
            pdf.save(`${itinerary.title || '旅游攻略'}.pdf`);
            message.success({ content: 'PDF导出成功', key: 'pdfExport', duration: 2 });
        } catch (error) {
            console.error('导出PDF失败:', error);
            message.error({ content: '导出PDF失败', key: 'pdfExport', duration: 2 });
        }
    };

    // 更新处理封面图片上传的函数，使用commonAPI.uploadImage
    const handleCoverUpload = async (info: any) => {
        if (info.file.status === 'uploading') {
            // 可以在这里显示上传中的状态
            return;
        }
        
        if (info.file.status === 'done') {
            // 成功状态 - 这里不再需要处理，因为我们会使用beforeUpload
            return;
        }
        
        if (info.file.status === 'error') {
            message.error('封面图片上传失败');
        }
    };
    
    // 添加beforeUpload函数，拦截默认上传并使用我们的API
    const beforeUpload = async (file: File) => {
        // 验证文件类型
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            message.error('只能上传图片文件!');
            return Upload.LIST_IGNORE;
        }
        
        // 验证文件大小（限制为5MB）
        const isLt5M = file.size / 1024 / 1024 < 5;
        if (!isLt5M) {
            message.error('图片大小不能超过5MB!');
            return Upload.LIST_IGNORE;
        }
        
        try {
            // 显示上传中的消息
            const loadingMsg = message.loading('正在上传封面图片...', 0);
            
            // 使用我们的通用上传API
            const result = await commonAPI.uploadImage(file);
            
            // 关闭loading消息
            loadingMsg();
            
            if (result.success) {
                // 更新itinerary状态中的cover字段
                setItinerary(prev => prev ? {...prev, cover: result.url} : null);
                message.success('封面图片上传成功');
            } else {
                message.error(`封面图片上传失败: ${result.message}`);
            }
        } catch (error) {
            message.error(`上传失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
        
        // 返回false，阻止Upload组件的默认上传行为
        return false;
    };

    // 移除封面图片
    const removeCover = () => {
        setItinerary(prev => prev ? {...prev, cover: undefined} : null);
        message.success('封面图片已移除');
    };

    // --- Render Helper Functions ---
    // (Optional: Could extract parts of JSX into functions for clarity)
    const renderItemCard = (item: DisplayItem, dayIndex: number, itemIndex: number) => (
        <Card
            size="small"
            key={item.id}
            style={{ marginBottom: 8 }}
            title={<Typography.Text ellipsis={{ tooltip: item.name }}>{item.name}</Typography.Text>}
            extra={(
                <Space size="small">
                    <Tooltip title="编辑时间">
                        <Button icon={<ClockCircleOutlined />} size="small" type="text" onClick={() => editItemTime(dayIndex, itemIndex)} />
                    </Tooltip>
                     {/* TODO: Add edit button for other details */}
                     {/* <Tooltip title="编辑详情"><Button icon={<EditOutlined />} size="small" type="text" onClick={() => editItemDetails(dayIndex, itemIndex)} /></Tooltip> */}
                    <Popconfirm
                        title="确认删除此项目吗?"
                        onConfirm={() => removeItemFromDay(dayIndex, itemIndex)}
                        okText="确认"
                        cancelText="取消"
                    >
                        <Tooltip title="删除项目">
                            <Button icon={<DeleteOutlined />} size="small" type="text" danger />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            )}
        >
            {/* Content of the item card */}
            <Row gutter={8}>
                 {item.image && (
                     <Col flex="60px">
                         <img src={item.image} alt={item.name} style={{ width: '100%', height: 40, objectFit: 'cover', borderRadius: 4 }} />
                     </Col>
                 )}
                <Col flex="auto">
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {item.type !== 'custom' && <Tag>{item.type}</Tag>}
                        {item.startTime && `${item.startTime}${item.endTime ? ' - '+item.endTime : ''}`}
                        {item.startTime && item.address && ' | '}
                        {item.address && <Typography.Text ellipsis={{ tooltip: item.address }} style={{ fontSize: 12 }}>{item.address}</Typography.Text>}
                    </Text>
                     {item.description && <Text type="secondary" style={{ fontSize: 12, display: 'block' }} ellipsis>{item.description}</Text>}
                </Col>
            </Row>
        </Card>
    );

    // --- Main Component Return JSX ---
    // Add loading state for initial load AND check if itinerary is null
    if (isInitialLoading || !itinerary) {
        return (
            <Layout style={{ minHeight: '100vh' }}>
                <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Spin size="large" tip="正在加载行程..." />
                </Content>
            </Layout>
        );
    }

    return (
        <Layout className="itinerary-builder">
            <Header className="builder-header">
                <Row justify="space-between" align="middle">
                    <Col>
                        <Input 
                            value={itinerary.title}
                            onChange={(e) => setItinerary(prev => prev ? {...prev, title: e.target.value} : null)} 
                            placeholder="行程标题" 
                            style={{ width: 300, marginRight: 16 }} 
                        />
                         <Input 
                            value={itinerary.destination || ''}
                            onChange={(e) => setItinerary(prev => prev ? {...prev, destination: e.target.value} : null)} 
                            placeholder="目的地城市" 
                            style={{ width: 200, marginRight: 16 }} 
                        />
                    </Col>
                    <Col>
                        <Space>
                            <Tooltip title="设置封面图片">
                                <Upload
                                    name="file"
                                    showUploadList={false}
                                    beforeUpload={beforeUpload}
                                    onChange={handleCoverUpload}
                                >
                                    <Button icon={<PictureOutlined />}>
                                        {itinerary.cover ? '更换封面' : '添加封面'}
                                    </Button>
                                </Upload>
                            </Tooltip>
                            {itinerary.cover && (
                                <Tooltip title="移除封面图片">
                                    <Button icon={<DeleteOutlined />} onClick={removeCover}>
                                        移除封面
                                    </Button>
                                </Tooltip>
                            )}
                            <Tooltip title="分享行程">
                                <Button icon={<ShareAltOutlined />} disabled>分享</Button>
                            </Tooltip>
                            <Tooltip title="导出为 PDF">
                                <Button icon={<ExportOutlined />} onClick={exportToPDF}>导出</Button>
                            </Tooltip>
                             <Tooltip title="保存行程">
                                <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={saveItinerary}>保存</Button>
                             </Tooltip>
                        </Space>
                    </Col>
                </Row>
            </Header>
            <Layout>
                <Sider width={300} className="recommendations-sider">
                    {/* Search Section */}
                    <div style={{ padding: '16px' }}>
                        <Input.Group compact>
                            <Select defaultValue="scenic" style={{ width: '30%' }} onChange={setSearchType}>
                                <Select.Option value="scenic">景点</Select.Option>
                                <Select.Option value="hotel">酒店</Select.Option>
                                <Select.Option value="transport">交通</Select.Option>
                            </Select>
                            <Input 
                                style={{ width: '70%' }} 
                                placeholder={`搜索${searchType === 'scenic' ? '景点' : searchType === 'hotel' ? '酒店' : '交通'}`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onPressEnter={handleSearch}
                                suffix={<SearchOutlined onClick={handleSearch} style={{ cursor: 'pointer' }} />} 
                            />
                        </Input.Group>
                        <Divider />
                        {searchLoading && <Spin tip="搜索中..." />}
                        {!searchLoading && searchResults.length > 0 && (
                             <>
                                 <Title level={5}>搜索结果</Title>
                                 <Droppable droppableId="searchResults" isDropDisabled={true}>
                                     {(provided) => (
                                         <div {...provided.droppableProps} ref={provided.innerRef}>
                                             {searchResults.map((item, index) => (
                                                 <Draggable key={item.id} draggableId={item.id} index={index}>
                                                     {(provided) => (
                                                         <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} >
                                                             <Card size="small" style={{ marginBottom: 8 }}>
                                                                 <Text strong>{item.name}</Text>
                                                                 <div><Text type="secondary">{item.address}</Text></div>
                                                                 {/* Add more details as needed */}
                                                             </Card>
                                                         </div>
                                                     )}
                                                 </Draggable>
                                             ))}
                                             {provided.placeholder}
                                         </div>
                                     )}
                                 </Droppable>
                             </>
                        )}
                        {!searchLoading && searchResults.length === 0 && <Text type="secondary">输入关键词搜索</Text>}
                        <Divider />
                        {/* Recommendations Section */}
                         <Title level={5}>推荐项目</Title>
                         {loadingRecommendations && <Spin tip="加载推荐..." />}
                         {!loadingRecommendations && recommendations.length > 0 && (
                             <Droppable droppableId="recommendations" isDropDisabled={true}>
                                {(provided) => (
                                    <div {...provided.droppableProps} ref={provided.innerRef}>
                                        {recommendations.map((item, index) => (
                                            <Draggable key={item.id} draggableId={item.id} index={index}>
                                                {(provided) => (
                                                     <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} >
                                                        <Card size="small" style={{ marginBottom: 8 }}>
                                                             <Text strong>{item.name}</Text>
                                                             <div><Text type="secondary">{item.address}</Text></div>
                                                            {/* Add more details */}\
                                                        </Card>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                         )}
                         {!loadingRecommendations && recommendations.length === 0 && <Text type="secondary">暂无推荐</Text>}
                    </div>
                </Sider>
                <Content className="itinerary-content">
                    {/* 添加封面图片预览区域 */}
                    {itinerary.cover && (
                        <div className="itinerary-cover-preview" style={{ marginBottom: 16, textAlign: 'center' }}>
                            <img 
                                src={itinerary.cover} 
                                alt="行程封面" 
                                style={{ 
                                    width: '100%', 
                                    maxHeight: 200, 
                                    objectFit: 'cover', 
                                    borderRadius: 8 
                                }} 
                            />
                        </div>
                    )}
                    
                    <Card bordered={false}>
                        <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
                            <Col>
                                <RangePicker 
                                    value={itinerary.startDate && itinerary.endDate ? [dayjs(itinerary.startDate), dayjs(itinerary.endDate)] : null}
                                    onChange={handleDateRangeChange}
                                    allowClear={true} // Explicitly allow clearing
                                />
                            </Col>
                            <Col>
                                <InputNumber
                                    prefix="¥"
                                    placeholder="预算"
                                    style={{ width: 150 }}
                                    value={itinerary.budget}
                                    onChange={handleBudgetChange} // Use the new handler
                                    min={0}
                                />
                            </Col>
                            <Col>
                                <Input.TextArea 
                                    rows={1}
                                    placeholder="备注或描述"
                                    value={itinerary.notes}
                                    onChange={(e) => setItinerary(prev => prev ? {...prev, notes: e.target.value} : null)}
                                    style={{ width: 300 }}
                                />
                            </Col>
                             <Col>
                                <Switch 
                                    checkedChildren="公开"
                                    unCheckedChildren="私密"
                                    checked={itinerary.isPublic}
                                    onChange={(checked) => setItinerary(prev => prev ? {...prev, isPublic: checked} : null)}
                                />
                            </Col>
                        </Row>
                        <Divider />
                        <DragDropContext onDragEnd={handleDragEnd}>
                            <Tabs 
                                defaultActiveKey="1"
                                tabPosition="top" 
                                className="day-tabs"
                                tabBarExtraContent={(
                                    <Button icon={<PlusOutlined />} onClick={addCustomItem}>添加自定义项目</Button>
                                )}
                            >
                                {itinerary.days.map((dayPlan, dayIndex) => (
                                    <TabPane tab={`第 ${dayPlan.dayNumber} 天 (${dayPlan.date})`} key={dayPlan.dayNumber.toString()}>
                                        <Droppable droppableId={`day-${dayPlan.dayNumber}`}>
                                            {(provided, snapshot) => (
                                                <div 
                                                    ref={provided.innerRef} 
                                                    {...provided.droppableProps}
                                                    style={{
                                                        background: snapshot.isDraggingOver ? 'lightblue' : 'transparent',
                                                        padding: 8,
                                                        minHeight: 400, // Ensure drop area is large enough
                                                    }}
                                                >
                                                    {dayPlan.items.length === 0 && <Empty description="拖拽左侧项目或添加自定义项目到此处" />}
                                                    {dayPlan.items.map((item, itemIndex) => (
                                                        <Draggable key={item.id} draggableId={item.id} index={itemIndex}>
                                                            {(provided) => renderItemCard(item, dayIndex, itemIndex)}
                                                        </Draggable>
                                                    ))}
                                                    {provided.placeholder}
                                                </div>
                                            )}
                                        </Droppable>
                                    </TabPane>
                                ))}
                            </Tabs>
                        </DragDropContext>
                        <Divider />
                        <Row justify='end'>
                            <Col>
                                <Title level={5}>
                                    当前总花费估算: ¥{calculateTotalCost().toFixed(2)}
                                    {budgetExceeded && <Tag color='error' style={{ marginLeft: 8 }}>超出预算</Tag>}
                                </Title>
                            </Col>
                        </Row>
                    </Card>
                </Content>
            </Layout>
        </Layout>
    );
};

export default ItineraryBuilder; 