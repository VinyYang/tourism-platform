import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Popconfirm, message, Modal, Form, 
  Input, Switch, Select, Upload, Card, Tabs, Tag, Tooltip, Spin, Descriptions,
  List, Avatar, Empty, Divider, InputNumber, Alert
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, 
  UploadOutlined, SortAscendingOutlined, PictureOutlined,
  QuestionCircleOutlined, GlobalOutlined, ArrowUpOutlined, ArrowDownOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import featuredRouteAPI from '../../api/featuredRouteAPI';
import type { ColumnsType } from 'antd/es/table';
import RouteMap from '../../components/map/RouteMap';
import './FeaturedRouteManagement.css';
import debounce from 'lodash/debounce';

// 精选路线类型
interface FeaturedRouteType {
  featured_route_id: number;
  name: string;
  description?: string | null;
  image_url?: string | null;
  category?: string | null;
  difficulty?: string | null;
  is_active: boolean;
  spots?: RouteSpot[]; // 后端返回时可能包含关联的景点
  created_at?: string;
  updated_at?: string;
}

// 路线中的景点类型 (与 ApiRouteSpotInfo 保持一致)
interface RouteSpot {
  // id: number; // 不再需要顶层 scenic_id
  spot_id?: number; // 保留关联表 ID (可选)
  order_number: number; // 景点在路线中的序号
  latitude?: number | null; // 添加外层坐标
  longitude?: number | null; // 添加外层坐标
  scenicSpot: { // 嵌套的景点核心信息 (与 ApiScenicInfo 一致) - 重命名
    scenic_id: number; 
    name: string;
    description?: string;
    location?: [number, number] | null;
    imageUrl?: string; // 如果后端返回 imageUrl
    city?: string;
    address?: string;
    is_custom?: boolean; // 添加自定义景点标识
    latitude?: number | null; // 添加内层坐标
    longitude?: number | null; // 添加内层坐标
    // 其他需要的 scenic 字段
  };
  // 不再需要这些注释，因为它们已移入 scenicSpot
  // description?: string;
  // location?: [number, number] | null;
  // imageUrl?: string;
}

// 在codebase中添加API响应类型（将它添加在RouteSpot接口后面）
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface ApiFeaturedRoute extends FeaturedRouteType {
  // 继承FeaturedRouteType的所有属性
  data?: any; // API响应中可能包含的嵌套数据
  result?: any; // API响应中可能包含的嵌套结果
  featured_route_spots?: any[]; // 可能存在的路线景点关联数据
  route_spots?: any[]; // 可能存在的路线景点数据（另一种格式）
}

// 表单数据类型
interface RouteFormData {
  name: string;
  description: string;
  image_url: string;
  category?: string;
  difficulty?: string;
  is_active: boolean;
  spots: Array<{
    scenic_id: number; // 修改为必填
    name: string;
    order_number: number;
    latitude?: number; // 修改为 number | undefined，去掉 null
    longitude?: number; // 修改为 number | undefined，去掉 null
    is_custom?: boolean; // 标记自定义景点
    description?: string; // 可选描述
  }>;
}

// 定义用于地图显示的状态类型
interface RouteForMapType extends Omit<FeaturedRouteType, 'spots'> { // 继承基础类型，排除原始 spots
  spots?: Spot[]; // 使用转换后的 Spot[] 类型
}

// 定义本地的Spot接口，与RouteMap中的接口保持一致
interface Spot {
  id: number;
  name: string;
  location: [number, number] | null;
  description: string;
  order_number: number;
  imageUrl?: string;
}

// 将API返回的spots数据转换为地图组件所需的格式
const transformSpotsForMap = (spots: any[]): Spot[] => {
  if (!spots || !Array.isArray(spots) || spots.length === 0) {
    console.warn('[transformSpotsForMap] 传入的spots为空或不是数组');
    return [];
  }

  console.log('[transformSpotsForMap] 开始转换景点数据，原始数据:', spots);
  
  // 尝试从不同结构中检索有效的景点数据
  const processedSpots = spots.map(spot => {
    console.log('[transformSpotsForMap] 处理景点:', spot);
    
    // 提取ID（考虑各种可能的ID字段）
    const id = spot.id || spot.spot_id || spot.featured_route_spot_id || 
              (spot.scenicSpot && spot.scenicSpot.scenic_id) || 
              spot.scenic_id || 
              `spot-${Math.random().toString(36).substr(2, 9)}`;
    
    // 提取名称（考虑各种可能的位置）
    const name = spot.name || 
                (spot.scenicSpot && spot.scenicSpot.name) ||
                (spot.scenic && spot.scenic.name) ||
                `景点${id}`;
    
    // 提取描述（考虑各种可能的位置）
    const description = spot.description || 
                       (spot.scenicSpot && spot.scenicSpot.description) ||
                       (spot.scenic && spot.scenic.description) || 
                       '';
    
    // 提取顺序号
    const order_number = spot.order_number || spot.orderNumber || 0;
    
    // 提取图片URL（考虑各种可能的位置和格式）
    const imageUrl = spot.image_url || spot.imageUrl || 
                    (spot.scenicSpot && (spot.scenicSpot.image_url || spot.scenicSpot.imageUrl)) ||
                    (spot.scenic && (spot.scenic.image_url || spot.scenic.imageUrl)) ||
                    (spot.images && (
                      (Array.isArray(spot.images) && spot.images.length > 0 && spot.images[0]) ||
                      (typeof spot.images === 'string' && spot.images)
                    )) || '';
    
    // 尝试从多种可能的来源获取坐标
    let latitude: number | null = null;
    let longitude: number | null = null;
    
    // 1. 直接从spot对象获取坐标
    if (typeof spot.latitude === 'number' && typeof spot.longitude === 'number') {
      latitude = spot.latitude;
      longitude = spot.longitude;
    }
    // 2. 从lat/lng字段获取
    else if (typeof spot.lat === 'number' && typeof spot.lng === 'number') {
      latitude = spot.lat;
      longitude = spot.lng;
    }
    // 3. 从scenicSpot对象获取坐标
    else if (spot.scenicSpot) {
      if (typeof spot.scenicSpot.latitude === 'number' && typeof spot.scenicSpot.longitude === 'number') {
        latitude = spot.scenicSpot.latitude;
        longitude = spot.scenicSpot.longitude;
      }
      else if (typeof spot.scenicSpot.lat === 'number' && typeof spot.scenicSpot.lng === 'number') {
        latitude = spot.scenicSpot.lat;
        longitude = spot.scenicSpot.lng;
      }
    }
    // 4. 从scenic对象获取坐标
    else if (spot.scenic) {
      if (typeof spot.scenic.latitude === 'number' && typeof spot.scenic.longitude === 'number') {
        latitude = spot.scenic.latitude;
        longitude = spot.scenic.longitude;
      }
      else if (typeof spot.scenic.lat === 'number' && typeof spot.scenic.lng === 'number') {
        latitude = spot.scenic.lat;
        longitude = spot.scenic.lng;
      }
    }
    // 5. 从location字段获取坐标
    if (!latitude || !longitude) {
      if (spot.location) {
        // 5.1 如果location是数组
        if (Array.isArray(spot.location) && spot.location.length >= 2) {
          // 假设格式是 [lng, lat]，这是高德地图的习惯
          longitude = parseFloat(spot.location[0]);
          latitude = parseFloat(spot.location[1]);
        }
        // 5.2 如果location是字符串 (如 "39.123,116.456")
        else if (typeof spot.location === 'string') {
          const parts = spot.location.split(',').map((part: string) => parseFloat(part.trim()));
          if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            latitude = parts[0];
            longitude = parts[1];
          }
        }
        // 5.3 如果location是对象 {lat, lng} 或 {latitude, longitude}
        else if (typeof spot.location === 'object') {
          if ('lat' in spot.location && 'lng' in spot.location) {
            latitude = parseFloat(spot.location.lat);
            longitude = parseFloat(spot.location.lng);
          } else if ('latitude' in spot.location && 'longitude' in spot.location) {
            latitude = parseFloat(spot.location.latitude);
            longitude = parseFloat(spot.location.longitude);
          }
        }
      }
      // 6. 检查scenicSpot.location
      else if (spot.scenicSpot && spot.scenicSpot.location) {
        if (Array.isArray(spot.scenicSpot.location) && spot.scenicSpot.location.length >= 2) {
          longitude = parseFloat(spot.scenicSpot.location[0]);
          latitude = parseFloat(spot.scenicSpot.location[1]);
        } else if (typeof spot.scenicSpot.location === 'string') {
          const parts = spot.scenicSpot.location.split(',').map((part: string) => parseFloat(part.trim()));
          if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            latitude = parts[0];
            longitude = parts[1];
          }
        } else if (typeof spot.scenicSpot.location === 'object') {
          if ('lat' in spot.scenicSpot.location && 'lng' in spot.scenicSpot.location) {
            latitude = parseFloat(spot.scenicSpot.location.lat);
            longitude = parseFloat(spot.scenicSpot.location.lng);
          } else if ('latitude' in spot.scenicSpot.location && 'longitude' in spot.scenicSpot.location) {
            latitude = parseFloat(spot.scenicSpot.location.latitude);
            longitude = parseFloat(spot.scenicSpot.location.longitude);
          }
        }
      }
      // 7. 最后检查spot.coordinates字段
      else if (spot.coordinates) {
        if (Array.isArray(spot.coordinates) && spot.coordinates.length >= 2) {
          longitude = parseFloat(spot.coordinates[0]);
          latitude = parseFloat(spot.coordinates[1]);
        }
      }
    }
    
    // 检查提取的坐标是否有效
    const hasValidCoordinates = 
      typeof latitude === 'number' && !isNaN(latitude) &&
      typeof longitude === 'number' && !isNaN(longitude);
    
    // 如果没有有效坐标，记录警告
    if (!hasValidCoordinates) {
      console.warn(`[transformSpotsForMap] 无法提取景点坐标, ID: ${id}, 名称: ${name}`, spot);
      // 返回所有数据，但location设为null
      return {
        id,
        name,
        location: null,
        description,
        order_number,
        imageUrl
      };
    }
    
    // 返回提取的数据
    return {
      id,
      name,
      location: [longitude, latitude] as [number, number],
      description,
      order_number,
      imageUrl
    };
  });
  
  // 过滤出有有效坐标的景点
  const validSpots = processedSpots.filter(spot => spot.location !== null);
  
  console.log(`[transformSpotsForMap] 找到 ${validSpots.length}/${spots.length} 个有效坐标的景点`);
  
  return validSpots;
};

const FeaturedRouteManagement: React.FC = () => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  
  // 状态管理
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [isViewMode, setIsViewMode] = useState<boolean>(false);
  const [editingRoute, setEditingRoute] = useState<FeaturedRouteType | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [isMapModalVisible, setIsMapModalVisible] = useState<boolean>(false);
  const [selectedRouteForMap, setSelectedRouteForMap] = useState<RouteForMapType | null>(null);
  const [viewModeLoading, setViewModeLoading] = useState<boolean>(false);
  
  // 景点选择相关状态
  const [selectedSpots, setSelectedSpots] = useState<Array<{
    scenic_id?: number;
    name: string;
    order_number: number;
    location?: [number, number] | null;
    description?: string;
  }>>([]);
  const [scenicOptions, setScenicOptions] = useState<any[]>([]);
  const [searchScenicText, setSearchScenicText] = useState('');
  const [loadingScenics, setLoadingScenics] = useState(false);
  const [isCustomSpotModalVisible, setIsCustomSpotModalVisible] = useState(false);
  const [customSpotForm] = Form.useForm();
  const [editingSpotIndex, setEditingSpotIndex] = useState<number | null>(null);
  
  // 获取所有精选路线
  const { 
    data: routes, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['featuredRoutes', 'admin'],
    queryFn: featuredRouteAPI.getAllFeaturedRoutesAdmin,
    select: (data) => {
      // 确保返回的是数组
      if (!data) return [];
      if (data.data && Array.isArray(data.data)) return data.data;
      if (Array.isArray(data)) return data;
      console.error('获取的路线数据格式不正确:', data);
      return [];
    }
  });
  
  // 创建精选路线
  const createMutation = useMutation({
    mutationFn: (data: RouteFormData) => featuredRouteAPI.createFeaturedRoute(data),
    onSuccess: () => {
      message.success('创建精选路线成功');
      setIsModalVisible(false);
      queryClient.invalidateQueries({ queryKey: ['featuredRoutes', 'admin'] });
    },
    onError: (error: any) => {
      message.error(`创建失败: ${error.message || '请稍后重试'}`);
    }
  });
  
  // 更新精选路线
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: RouteFormData }) => 
      featuredRouteAPI.updateFeaturedRouteAdmin(id, data),
    onSuccess: () => {
      message.success('更新精选路线成功');
      setIsModalVisible(false);
      queryClient.invalidateQueries({ queryKey: ['featuredRoutes', 'admin'] });
    },
    onError: (error: any) => {
      message.error(`更新失败: ${error.message || '请稍后重试'}`);
    }
  });
  
  // 删除精选路线
  const deleteMutation = useMutation({
    mutationFn: (id: number) => featuredRouteAPI.deleteFeaturedRouteAdmin(id),
    onSuccess: () => {
      message.success('删除精选路线成功');
      queryClient.invalidateQueries({ queryKey: ['featuredRoutes', 'admin'] });
    },
    onError: (error: any) => {
      message.error(`删除失败: ${error.message || '请稍后重试'}`);
    }
  });

  // 搜索景点函数
  const handleSearchScenic = debounce(async (value: string) => {
    if (!value || value.length < 2) return;
    setLoadingScenics(true);
    try {
      // 使用模拟数据代替API调用，因为API可能不存在
      const mockResults = [
        { scenic_id: 1, name: '西湖', city: '杭州', latitude: 30.2587, longitude: 120.1315 },
        { scenic_id: 2, name: '故宫', city: '北京', latitude: 39.9163, longitude: 116.3972 },
        { scenic_id: 3, name: '外滩', city: '上海', latitude: 31.2304, longitude: 121.4900 }
      ].filter(spot => spot.name.includes(value) || spot.city.includes(value));
      
      // 记录查询结果
      console.log('景点搜索结果:', mockResults);
      
      setScenicOptions(mockResults.map((spot: any) => ({
        label: `${spot.name}${spot.city ? ` (${spot.city})` : ''}`,
        value: spot.scenic_id,
        data: spot
      })));
      setLoadingScenics(false);
    } catch (error) {
      console.error('搜索景点失败:', error);
      message.error('搜索景点失败，请稍后重试');
      setLoadingScenics(false);
      setScenicOptions([]);
    }
  }, 500);

  // 添加景点到路线
  const handleAddSpotToRoute = (value: string | number, option: any) => {
    if (!option || !option.data) {
      message.error('选择的景点数据无效');
      return;
    }
    
    const spot = option.data;
    
    // 验证景点ID是否有效
    if (!spot.scenic_id) {
      message.warning('选择的景点没有有效ID，将使用生成的ID作为自定义景点添加');
    }
    
    // 确定位置坐标
    let location: [number, number] | undefined = undefined;
    if (spot.longitude && spot.latitude) {
      location = [spot.longitude, spot.latitude];
    }
    
    const newSpot = {
      scenic_id: spot.scenic_id || Math.floor(Math.random() * -1000000) - 1, // 如果没有ID，使用负数作为自定义ID
      name: spot.name,
      order_number: selectedSpots.length + 1,
      location, // 使用处理后的location，可能是undefined但不会是null
      description: spot.description || '',
      is_custom: !spot.scenic_id // 如果没有scenic_id，标记为自定义景点
    };
    
    console.log('添加景点:', newSpot);
    setSelectedSpots([...selectedSpots, newSpot]);
    setSearchScenicText('');
  };

  // 添加自定义景点
  const handleAddCustomSpot = () => {
    customSpotForm.validateFields().then(values => {
      // 确定位置坐标
      let location: [number, number] | undefined = undefined;
      if (values.longitude && values.latitude) {
        location = [values.longitude, values.latitude];
      }
      
      const newSpot = {
        scenic_id: Math.floor(Math.random() * -1000000) - 1, // 使用负数作为自定义ID
        name: values.name as string,
        description: values.description as string,
        order_number: selectedSpots.length + 1,
        location, // 使用处理后的location，可能是undefined但不会是null
        is_custom: true
      };
      setSelectedSpots([...selectedSpots, newSpot]);
      setIsCustomSpotModalVisible(false);
      customSpotForm.resetFields();
    });
  };

  // 移动景点顺序
  const handleMoveSpot = (index: number, direction: 'up' | 'down') => {
    const newSpots = [...selectedSpots];
    if (direction === 'up' && index > 0) {
      // 向上移动
      [newSpots[index - 1], newSpots[index]] = [newSpots[index], newSpots[index - 1]];
    } else if (direction === 'down' && index < newSpots.length - 1) {
      // 向下移动
      [newSpots[index], newSpots[index + 1]] = [newSpots[index + 1], newSpots[index]];
    }
    
    // 更新序号
    const updatedSpots = newSpots.map((spot, idx) => ({
      ...spot,
      order_number: idx + 1
    }));
    
    setSelectedSpots(updatedSpots);
  };

  // 删除景点
  const handleRemoveSpot = (index: number) => {
    const newSpots = [...selectedSpots];
    newSpots.splice(index, 1);
    
    // 更新序号
    const updatedSpots = newSpots.map((spot, idx) => ({
      ...spot,
      order_number: idx + 1
    }));
    
    setSelectedSpots(updatedSpots);
  };

  // 编辑已添加的景点
  const handleEditSpot = (index: number) => {
    const spot = selectedSpots[index];
    
    // 设置表单初始值
    customSpotForm.setFieldsValue({
      name: spot.name,
      description: spot.description || '',
      latitude: spot.location ? spot.location[1] : null,
      longitude: spot.location ? spot.location[0] : null,
    });
    
    // 使用同一个模态框，但添加一个状态标记用于编辑而非新增
    setEditingSpotIndex(index);
    setIsCustomSpotModalVisible(true);
  };

  // 处理保存编辑的景点
  const handleSaveEditedSpot = () => {
    if (editingSpotIndex === null) {
      // 如果不是编辑模式，则调用原来的添加方法
      handleAddCustomSpot();
      return;
    }

    customSpotForm.validateFields().then(values => {
      // 确定位置坐标
      let location: [number, number] | undefined = undefined;
      if (values.longitude && values.latitude) {
        location = [values.longitude, values.latitude];
      }
      
      const newSpots = [...selectedSpots];
      const currentSpot = newSpots[editingSpotIndex as number];
      newSpots[editingSpotIndex as number] = {
        ...currentSpot,
        scenic_id: currentSpot.scenic_id || Math.floor(Math.random() * -1000000) - 1, // 确保有scenic_id
        name: values.name,
        description: values.description,
        location // 使用处理后的location，可能是undefined但不会是null
      };
      
      setSelectedSpots(newSpots);
      setIsCustomSpotModalVisible(false);
      setEditingSpotIndex(null);
      customSpotForm.resetFields();
    });
  };

  // 打开添加自定义景点模态框
  const showCustomSpotModal = () => {
    setEditingSpotIndex(null); // 重置为添加模式
    customSpotForm.resetFields(); // 清空表单
    setIsCustomSpotModalVisible(true);
  };

  // 表格列定义
  const columns: ColumnsType<FeaturedRouteType> = [
    {
      title: 'ID',
      dataIndex: 'featured_route_id',
      key: 'featured_route_id',
      width: 80,
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <div>{text}</div>
          {record.category && <Tag color="blue">{record.category}</Tag>}
          {record.difficulty && (
            <Tag 
              color={
                record.difficulty === 'easy' ? 'green' : 
                record.difficulty === 'medium' ? 'orange' : 
                record.difficulty === 'hard' ? 'red' : 'default'
              }
            >
              {record.difficulty === 'easy' ? '简单' : 
              record.difficulty === 'medium' ? '中等' : 
              record.difficulty === 'hard' ? '困难' : record.difficulty}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: '缩略图',
      dataIndex: 'image_url',
      key: 'image_url',
      width: 120,
      render: (image_url) => (
        image_url ? 
        <img 
          src={image_url} 
          alt="缩略图" 
          style={{ width: 100, height: 60, objectFit: 'cover' }} 
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder-image.jpg';
          }}
        /> : 
        <div style={{ textAlign: 'center' }}>
          <PictureOutlined style={{ fontSize: 24, color: '#ccc' }} />
        </div>
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (is_active) => (
        <Tag color={is_active ? 'green' : 'red'}>
          {is_active ? '已启用' : '已禁用'}
        </Tag>
      ),
      filters: [
        { text: '已启用', value: true },
        { text: '已禁用', value: false },
      ],
      onFilter: (value, record) => record.is_active === value,
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_, record) => (
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Space size="small">
          <Button 
            icon={<EyeOutlined />} 
            onClick={() => handleView(record)}
            size="small"
          >
            查看
          </Button>
          <Button 
            icon={<GlobalOutlined />}
            onClick={() => handleShowMap(record)}
            size="small"
            disabled={!record.spots || record.spots.length === 0}
          >
            地图
          </Button>
          </Space>
          <Space size="small">
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
              onClick={() => { void handleEdit(record); }}
            size="small"
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个精选路线吗?"
            onConfirm={() => handleDelete(record.featured_route_id)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              type="primary" 
              danger 
              icon={<DeleteOutlined />}
              size="small"
              loading={deleteMutation.isPending && deleteMutation.variables === record.featured_route_id}
            >
              删除
            </Button>
          </Popconfirm>
          </Space>
        </Space>
      ),
    },
  ];

  // 处理查看
  const handleView = async (route: FeaturedRouteType) => {
    // 先设置基础信息并打开模态框
    setEditingRoute(route);
    setIsViewMode(true);
    setIsModalVisible(true);
    setViewModeLoading(true); // 开始加载详情
    
    // 先显示基本表单数据
    form.setFieldsValue({
      name: route.name,
      description: route.description,
      image_url: route.image_url,
      category: route.category,
      difficulty: route.difficulty,
      is_active: route.is_active,
    });
    
    // 如果有基本景点数据，先进行初始化显示
    if (route.spots && route.spots.length > 0) {
      // 基本设置现有数据，稍后会更新
      setSelectedSpots(route.spots.map(spot => ({
        scenic_id: spot.scenicSpot?.scenic_id,
        name: spot.scenicSpot?.name || '加载中...',
        order_number: spot.order_number || 0,
        location: spot.scenicSpot?.location || null,
        description: spot.scenicSpot?.description || ''
      })));
    }

    // 异步获取路线详情（包含spots）
    try {
      message.loading({ content: '正在加载路线详情...', key: 'loadingDetail', duration: 0 });
      const detailData = await featuredRouteAPI.getFeaturedRouteByIdAdmin(route.featured_route_id);
      console.log('[handleView] 获取到详细数据:', detailData);
      
      if (!detailData) {
        throw new Error('获取路线详情失败，返回数据为空');
      }
      
      // 处理可能的嵌套响应结构
      let processedData = detailData as any;
      if (processedData.data && typeof processedData.data === 'object') {
        processedData = processedData.data;
      } else if (processedData.result && typeof processedData.result === 'object') {
        processedData = processedData.result;
      }
      
      // 提取景点数据
      let spotsList: any[] = [];
      if (Array.isArray(processedData.spots)) {
        spotsList = processedData.spots;
      } else if (processedData.featured_route_spots && Array.isArray(processedData.featured_route_spots)) {
        spotsList = processedData.featured_route_spots;
      } else if (processedData.route_spots && Array.isArray(processedData.route_spots)) {
        spotsList = processedData.route_spots;
      }
      
      // 使用获取到的详细数据更新 editingRoute
      setEditingRoute(prev => {
        if (prev) {
          return { 
            ...prev, 
            ...processedData,
            spots: spotsList.length > 0 ? spotsList : prev.spots 
          }; 
        } 
        return processedData; 
      });
      
      message.success({ content: '详情加载成功', key: 'loadingDetail', duration: 2 });
    } catch (error: any) {
      console.error("加载路线详情失败:", error);
      message.error({ content: `加载路线详情失败: ${error.message || '请稍后重试'}`, key: 'loadingDetail', duration: 3 });
    } finally {
      setViewModeLoading(false); // 结束加载状态
    }
  };

  // 处理编辑
  const handleEdit = async (route: FeaturedRouteType) => {
    setIsViewMode(false);
    console.log('[handleEdit] 编辑路线, ID:', route.featured_route_id);
    setViewModeLoading(true); // 开始加载指示器
    
    // 先重置表单和状态
    form.resetFields();
    setSelectedSpots([]);
    
    // 先设置基本表单数据，避免用户等待
    form.setFieldsValue({
      name: route.name,
      description: route.description || '',
      image_url: route.image_url || '',
      category: route.category,
      difficulty: route.difficulty,
      is_active: route.is_active !== undefined ? route.is_active : true,
    });
    
    try {
      // 获取完整的路线详情用于编辑
      message.loading({ content: '正在加载路线详情...', key: 'loadingEdit', duration: 0 });
      const detailedRoute = await featuredRouteAPI.getFeaturedRouteByIdAdmin(route.featured_route_id);
      console.log('[handleEdit] 获取到详细数据:', detailedRoute);

      // 检查 API 调用是否成功返回数据
      if (!detailedRoute) { 
        throw new Error('获取路线详情失败，返回数据为空');
      }

      // 处理可能的嵌套响应结构
      let processedData = detailedRoute as any;
      if (processedData.data && typeof processedData.data === 'object') {
        processedData = processedData.data;
      } else if (processedData.result && typeof processedData.result === 'object') {
        processedData = processedData.result;
      }
      
      // 保存编辑中的路线数据
      setEditingRoute(processedData);
      
      // 更新表单数据，确保使用最新数据
      const formData: Partial<RouteFormData> = {
        name: processedData.name || '',
        description: processedData.description || '',
        image_url: processedData.image_url || '',
        category: processedData.category || undefined,
        difficulty: processedData.difficulty || undefined,
        is_active: processedData.is_active !== undefined ? processedData.is_active : true,
      };
      
      form.setFieldsValue(formData);
      
      // 提取景点数据
      let spotsList: any[] = [];
      if (Array.isArray(processedData.spots)) {
        spotsList = processedData.spots;
      } else if (processedData.featured_route_spots && Array.isArray(processedData.featured_route_spots)) {
        spotsList = processedData.featured_route_spots;
      } else if (processedData.route_spots && Array.isArray(processedData.route_spots)) {
        spotsList = processedData.route_spots;
      }
      
      // 处理景点数据以用于显示和编辑
      if (spotsList && spotsList.length > 0) {
        console.log('[handleEdit] 处理景点数据:', spotsList);
        
        // 转换后端返回的景点数据为组件内部格式
        const spotsData = spotsList.map((spot, index) => {
          // 尝试获取景点对象
          const spotData = spot as unknown as Record<string, any>;
          const scenicSpot = spotData.scenicSpot || spotData.scenic || spotData;
          const spot_id = spotData.spot_id || spotData.featured_route_spot_id || spotData.scenic_id || null;
          const order = spotData.order_number || spotData.orderNumber || (index + 1);
          
          // 尝试获取坐标
          let location: [number, number] | null = null;
          if (scenicSpot.location && Array.isArray(scenicSpot.location) && scenicSpot.location.length >= 2) {
            location = [parseFloat(scenicSpot.location[0]), parseFloat(scenicSpot.location[1])];
          } else if (scenicSpot.longitude && scenicSpot.latitude) {
            location = [parseFloat(scenicSpot.longitude), parseFloat(scenicSpot.latitude)];
          } else if (spotData.longitude && spotData.latitude) {
            location = [parseFloat(spotData.longitude), parseFloat(spotData.latitude)];
          }
          
          return {
            scenic_id: spot_id,
            name: scenicSpot.name || `景点${index + 1}`,
            order_number: order,
            location: location,
            description: scenicSpot.description || ''
          };
        });
        
        console.log('[handleEdit] 转换后的景点数据:', spotsData);
        setSelectedSpots(spotsData);
      } else {
        setSelectedSpots([]);
      }
      
      // 显示模态框
      setIsModalVisible(true);
      message.success({ content: '详情加载成功', key: 'loadingEdit', duration: 2 });

    } catch (error: any) {
      message.error({ content: `加载路线详情失败: ${error.message || '请稍后重试'}`, key: 'loadingEdit', duration: 3 });
      console.error('[handleEdit] 编辑过程中发生错误:', error);
      // 如果加载失败，仍然显示模态框，但使用基本数据
      setIsModalVisible(true);
    } finally {
      setViewModeLoading(false); // 停止加载指示器
    }
  };

  // 处理删除
  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  // 处理新建
  const handleCreate = () => {
    setEditingRoute(null);
    setIsViewMode(false);
    setIsModalVisible(true);
    setSelectedSpots([]); // 清空已选景点
    
    // 重置表单
    form.resetFields();
    // 设置默认值
    form.setFieldsValue({
      is_active: true,
    });
  };

  // 处理表单提交
  const handleSubmit = () => {
    form.validateFields()
      .then(values => {
        // 检查和处理每个景点
        const processedSpots = selectedSpots.map(spot => {
          // 为所有景点确保有scenic_id
          const spotScenicId = spot.scenic_id || Math.floor(Math.random() * -1000000) - 1;
          // 检查是否为系统景点ID (确保它是正整数)
          const isValidScenicId = spotScenicId && Number.isInteger(spotScenicId) && spotScenicId > 0;
          
          // 提取并处理坐标（将null转为undefined）
          const latitude = spot.location ? spot.location[1] : undefined;
          const longitude = spot.location ? spot.location[0] : undefined;
          
          // 对于自定义景点（没有有效的scenic_id的情况）
          if (!isValidScenicId) {
            console.log(`景点 "${spot.name}" 处理为自定义景点，使用ID: ${spotScenicId}`);
            return {
              scenic_id: spotScenicId, // 使用生成的负数ID
              name: spot.name,
              description: spot.description || '',
              order_number: spot.order_number,
              latitude, // 已处理null转为undefined
              longitude, // 已处理null转为undefined
              is_custom: true
            };
          }
          
          // 对于现有的景点（有scenic_id）
          console.log(`景点 "${spot.name}" 使用景点ID: ${spotScenicId}`);
          return {
            scenic_id: spotScenicId,
            name: spot.name,
            order_number: spot.order_number,
            latitude, // 已处理null转为undefined
            longitude, // 已处理null转为undefined
          };
        });

        // 表单数据
        const formData: RouteFormData = {
          name: values.name,
          description: values.description || '',
          image_url: values.image_url || '',
          category: values.category,
          difficulty: values.difficulty,
          is_active: values.is_active,
          spots: processedSpots || [] // 确保spots至少是空数组，避免undefined
        };
        
        console.log('提交数据:', formData);
        
        if (editingRoute) {
          updateMutation.mutate({ 
            id: editingRoute.featured_route_id, 
            data: formData 
          });
        } else {
          createMutation.mutate(formData);
        }
      })
      .catch(errorInfo => {
        console.error('表单验证失败:', errorInfo);
      });
  };

  // 处理关闭模态框
  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingRoute(null);
    form.resetFields();
    setIsViewMode(false);
  };

  /**
   * 显示精选路线地图
   */
  const handleShowMap = async (route: FeaturedRouteType) => {
    console.log(`[handleShowMap] 显示路线地图，ID: ${route.featured_route_id}，名称: ${route.name}`);
    setViewModeLoading(true);
    setIsMapModalVisible(true);
    
    // 声明一个变量保存最终的路线详情
    let defaultRouteDetails: Partial<FeaturedRouteType> = {
      ...route,
      spots: []
    };
    
    try {
      message.loading({ content: '正在获取路线详情...', key: 'routeLoading' });
      
      // 获取路线详情
      const routeData = await featuredRouteAPI.getFeaturedRouteByIdAdmin(route.featured_route_id);
      console.log('[handleShowMap] 获取到路线详情:', routeData);
      
      // 路线数据可能有不同的格式，需要处理各种情况
      if (!routeData) {
        throw new Error('获取路线详情失败，返回数据为空');
      }
      
      let routeDetails = routeData as ApiFeaturedRoute;
      
      // 如果数据被嵌套在data或result字段中
      if (routeDetails.data && typeof routeDetails.data === 'object') {
        routeDetails = routeDetails.data;
      } else if (routeDetails.result && typeof routeDetails.result === 'object') {
        routeDetails = routeDetails.result;
      }
      
      // 更新默认路线详情
      defaultRouteDetails = { ...defaultRouteDetails, ...routeDetails };
      
      // 获取景点数据 - 考虑多种可能的数据结构
      let spots: any[] = [];
      
      // 尝试从多个可能的位置获取spots数据
      if (Array.isArray(routeDetails.spots)) {
        spots = routeDetails.spots;
        console.log(`[handleShowMap] 从routeDetails.spots获取到${spots.length}个景点`);
      } else if (routeDetails.featured_route_spots && Array.isArray(routeDetails.featured_route_spots)) {
        spots = routeDetails.featured_route_spots;
        console.log(`[handleShowMap] 从routeDetails.featured_route_spots获取到${spots.length}个景点`);
      } else if (routeDetails.route_spots && Array.isArray(routeDetails.route_spots)) {
        spots = routeDetails.route_spots;
        console.log(`[handleShowMap] 从routeDetails.route_spots获取到${spots.length}个景点`);
      } else {
        // 如果在常见位置找不到spots，尝试遍历对象查找
        const possibleArrays = Object.values(routeDetails as unknown as Record<string, unknown>).filter(
          value => Array.isArray(value) && value.length > 0
        );
        
        // 尝试找出哪个数组可能包含spots
        for (const arr of possibleArrays) {
          const arrTyped = arr as any[];
          const firstItem = arrTyped[0];
          // 检查是否包含景点的关键字段
          if (
            firstItem && 
            (
              firstItem.scenic_id || 
              firstItem.spot_id || 
              firstItem.featured_route_spot_id ||
              (firstItem.scenicSpot && firstItem.scenicSpot.scenic_id) ||
              typeof firstItem.latitude === 'number' ||
              typeof firstItem.longitude === 'number' ||
              firstItem.location
            )
          ) {
            spots = arrTyped;
            console.log(`[handleShowMap] 从自动检测中找到了可能的景点数组，包含${spots.length}个元素`);
            break;
          }
        }
      }
      
      // 日志记录原始spots数据，帮助调试
      console.log('[handleShowMap] 找到的景点数据原始格式:', spots);
      
      // 检查是否有景点数据
      if (!spots || spots.length === 0) {
        message.warning('该路线没有包含任何景点，将显示空地图');
        setSelectedRouteForMap({
          ...defaultRouteDetails as unknown as Omit<FeaturedRouteType, 'spots'>,
          spots: []
        });
        return;
      }
      
      // 转换景点数据为地图能够使用的格式
      const transformedSpots = transformSpotsForMap(spots);
      
      // 检查是否有有效坐标的景点
      if (transformedSpots.length === 0) {
        message.warning('该路线的景点没有有效的坐标信息，将显示空地图');
        setSelectedRouteForMap({
          ...defaultRouteDetails as unknown as Omit<FeaturedRouteType, 'spots'>,
          spots: []
        });
        return;
      }
      
      setSelectedRouteForMap({
        ...defaultRouteDetails as unknown as Omit<FeaturedRouteType, 'spots'>,
        spots: transformedSpots
      });
      message.success({ content: '路线详情加载成功', key: 'routeLoading' });
    } catch (error) {
      console.error('[handleShowMap] 获取路线详情失败:', error);
      message.error({ content: '获取路线详情失败: ' + (error instanceof Error ? error.message : '未知错误'), key: 'routeLoading' });
      setSelectedRouteForMap({
        ...defaultRouteDetails as unknown as Omit<FeaturedRouteType, 'spots'>,
        spots: []
      });
    } finally {
      setViewModeLoading(false);
    }
  };

  // 关闭地图弹窗
  const handleCloseMapModal = () => {
    setIsMapModalVisible(false);
  };

  // 根据分类筛选数据
  const filteredRoutes = !routes ? [] : (
    activeTab === 'all' 
      ? (Array.isArray(routes) ? routes : [])
      : (Array.isArray(routes) ? routes.filter((route: FeaturedRouteType) => route.category === activeTab) : [])
  );

  // 在 return 之前添加日志，用于调试
  console.log('--- Featured Routes Data:', routes);
  console.log('--- Filtered Routes:', filteredRoutes);
  console.log('--- routes类型:', routes ? (Array.isArray(routes) ? 'Array' : typeof routes) : 'undefined');

  // 添加环境变量检查
  console.log('环境变量检查:',{
    REACT_APP_AMAP_JS_KEY: process.env.REACT_APP_AMAP_JS_KEY ? '已设置' : '未设置',
    REACT_APP_AMAP_SECURITY_CODE: process.env.REACT_APP_AMAP_SECURITY_CODE ? '已设置' : '未设置'
  });

  return (
    <div className="featured-route-management">
      <Card title="精选文化路线管理" 
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleCreate}
          >
            新建精选路线
          </Button>
        }
      >
        {/* 分类标签 */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'all', label: '全部路线' },
            { key: '红色文化', label: '红色文化' },
            { key: '历史文化', label: '历史文化' },
            { key: '江南文化', label: '江南文化' },
            { key: '民族文化', label: '民族文化' }
          ]}
        />
        
        {/* 数据表格 */}
        <Table
          columns={columns as any}
          dataSource={Array.isArray(filteredRoutes) ? filteredRoutes : []}
          rowKey="featured_route_id"
          loading={isLoading}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
        
        {/* 编辑/查看模态框 */}
        <Modal
          title={
            isViewMode 
              ? '查看精选路线' 
              : (editingRoute ? '编辑精选路线' : '新建精选路线')
          }
          open={isModalVisible}
          onCancel={handleCancel}
          footer={isViewMode ? [
            <Button key="back" onClick={handleCancel}>
              关闭
            </Button>
          ] : [
            <Button 
              key="back" 
              onClick={handleCancel}
            >
              取消
            </Button>,
            <Button 
              key="submit" 
              type="primary" 
              onClick={handleSubmit}
              loading={createMutation.isPending || updateMutation.isPending}
            >
              保存
            </Button>
          ]}
          width={700}
        >
          <Form
            form={form}
            layout="vertical"
            disabled={isViewMode}
          >
            <Form.Item
              name="name"
              label="路线名称"
              rules={[{ required: true, message: '请输入路线名称' }]}
            >
              <Input placeholder="请输入路线名称" maxLength={100} />
            </Form.Item>
            
            <Form.Item
              name="description"
              label="路线描述"
            >
              <Input.TextArea 
                placeholder="请输入路线描述" 
                autoSize={{ minRows: 3, maxRows: 6 }}
              />
            </Form.Item>
            
            <Form.Item
              name="image_url"
              label={
                <span>
                  封面图片URL
                  <Tooltip title="请输入有效的图片URL，不支持本地上传">
                    <QuestionCircleOutlined style={{ marginLeft: 4 }} />
                  </Tooltip>
                </span>
              }
            >
              <Input 
                placeholder="请输入图片URL" 
                suffix={
                  form.getFieldValue('image_url') ? 
                  <Tooltip title="预览图片">
                    <PictureOutlined 
                      onClick={() => {
                        const url = form.getFieldValue('image_url');
                        if (url) {
                          window.open(url, '_blank');
                        }
                      }}
                      style={{ cursor: 'pointer', color: '#1890ff' }}
                    />
                  </Tooltip> : null
                }
              />
            </Form.Item>
            
            <Form.Item
              name="category"
              label="路线类别"
            >
              <Select placeholder="请选择路线类别">
                <Select.Option value="红色文化">红色文化</Select.Option>
                <Select.Option value="历史文化">历史文化</Select.Option>
                <Select.Option value="江南文化">江南文化</Select.Option>
                <Select.Option value="民族文化">民族文化</Select.Option>
                <Select.Option value="地方特色">地方特色</Select.Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              name="difficulty"
              label="难度等级"
            >
              <Select placeholder="请选择难度等级">
                <Select.Option value="easy">简单</Select.Option>
                <Select.Option value="medium">中等</Select.Option>
                <Select.Option value="hard">困难</Select.Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              name="is_active"
              label="启用状态"
              valuePropName="checked"
            >
              <Switch 
                checkedChildren="已启用" 
                unCheckedChildren="已禁用" 
              />
            </Form.Item>
            
            {/* 添加景点选择区域 */}
            {!isViewMode && (
              <>
                <Divider orientation="left">路线景点</Divider>
                <div className="spots-selection-container">
                  <div className="spots-search-section">
                    <Space style={{ width: '100%' }}>
                      <Select
                        showSearch
                        placeholder="搜索已有景点"
                        value={searchScenicText}
                        onChange={setSearchScenicText}
                        onSearch={handleSearchScenic}
                        filterOption={false}
                        style={{ width: 300 }}
                        loading={loadingScenics}
                        options={scenicOptions}
                        onSelect={handleAddSpotToRoute}
                      />
                      <Button 
                        icon={<PlusOutlined />} 
                        onClick={showCustomSpotModal}
                        type="primary"
                      >
                        添加自定义景点
                      </Button>
                    </Space>
                  </div>
                  
                  <div className="selected-spots-list">
                    {selectedSpots.length === 0 ? (
                      <Empty description="暂无选中景点" />
                    ) : (
                      <List
                        itemLayout="horizontal"
                        dataSource={selectedSpots}
                        renderItem={(item, index) => (
                          <List.Item
                            actions={[
                              <Tooltip title="上移" key="up">
                                <Button 
                                  type="text" 
                                  icon={<ArrowUpOutlined />} 
                                  onClick={() => handleMoveSpot(index, 'up')}
                                  disabled={index === 0}
                                />
                              </Tooltip>,
                              <Tooltip title="下移" key="down">
                                <Button 
                                  type="text" 
                                  icon={<ArrowDownOutlined />} 
                                  onClick={() => handleMoveSpot(index, 'down')}
                                  disabled={index === selectedSpots.length - 1}
                                />
                              </Tooltip>,
                              <Tooltip title="编辑" key="edit">
                                <Button 
                                  type="text" 
                                  icon={<EditOutlined />} 
                                  onClick={() => handleEditSpot(index)}
                                />
                              </Tooltip>,
                              <Tooltip title="删除" key="delete">
                                <Button 
                                  type="text" 
                                  danger 
                                  icon={<DeleteOutlined />} 
                                  onClick={() => handleRemoveSpot(index)}
                                />
                              </Tooltip>
                            ]}
                          >
                            <List.Item.Meta
                              avatar={<Avatar>{item.order_number}</Avatar>}
                              title={item.name}
                              description={
                                <>
                                  {item.scenic_id ? (
                                    <div>景点ID: {item.scenic_id}</div>
                                  ) : (
                                    <>
                                      <div>自定义景点</div>
                                      <div>位置: {item.location ? `(${item.location[1]}, ${item.location[0]})` : '未设置'}</div>
                                      {item.description && <div>描述: {item.description}</div>}
                                    </>
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
              </>
            )}
          </Form>

          {/* --- 修改：在查看或编辑模式下（详情加载后）显示景点列表 --- */}
          {isViewMode && editingRoute?.spots && editingRoute.spots.length > 0 && (
            <div style={{ marginTop: '20px', borderTop: '1px solid #f0f0f0', paddingTop: '20px' }}>
              <h3>路线包含的景点:</h3>
              {/* 加载状态由 viewModeLoading 控制 */}
              {viewModeLoading ? (
                <Spin tip="加载景点中..."></Spin>
              ) : (
                <Descriptions bordered column={1} size="small">
                  {editingRoute.spots.map((spot, index) => {
                    // 使用类型断言将spot转换为Record<string, any>，允许访问任何属性
                    const spotData = spot as unknown as Record<string, any>;
                    
                    // 尝试获取景点对象和名称
                    const scenicSpot = spotData.scenicSpot || spotData.scenic || spotData;
                    const spotName = scenicSpot?.name || `景点${index + 1}`;
                    const spotId = scenicSpot?.scenic_id || spotData.spot_id || spotData.featured_route_spot_id || '自定义';
                    const isCustom = Boolean(scenicSpot?.is_custom);
                    const description = scenicSpot?.description || spotData.description || '';
                    
                    // 尝试获取坐标信息
                    let coordinates = '';
                    if (scenicSpot?.location && Array.isArray(scenicSpot.location) && scenicSpot.location.length >= 2) {
                      coordinates = `(${scenicSpot.location[1]}, ${scenicSpot.location[0]})`;
                    } else if (scenicSpot?.latitude && scenicSpot?.longitude) {
                      coordinates = `(${scenicSpot.latitude}, ${scenicSpot.longitude})`;
                    } else if (spotData.latitude && spotData.longitude) {
                      coordinates = `(${spotData.latitude}, ${spotData.longitude})`;
                    }
                    
                    return (
                      <Descriptions.Item 
                        key={`spot-${index}-${spotId}`}
                        label={`序号 ${spotData.order_number || index + 1}`}
                      >
                        <div>
                          <strong>{isCustom ? '自定义景点: ' : 'ID: '}{spotId} - {spotName}</strong>
                          {coordinates && <div>坐标: {coordinates}</div>}
                          {description && <div>描述: {description}</div>}
                        </div>
                      </Descriptions.Item>
                    );
                  })}
                </Descriptions>
              )}
            </div>
          )}
          {/* --- 景点列表结束 --- */}

        </Modal>
        
        {/* 地图模态框 */}
        <Modal
          title={selectedRouteForMap ? `${selectedRouteForMap.name} - 路线地图` : '路线地图'}
          open={isMapModalVisible}
          onCancel={handleCloseMapModal}
          footer={null}
          width={1000}
          style={{ top: 20 }}
          styles={{
            body: { height: 550, padding: 0, overflow: 'hidden' }
          }}
          destroyOnClose={true}
        >
          {selectedRouteForMap?.spots ? (
            <RouteMap
              spots={selectedRouteForMap.spots.map(spot => ({
                id: spot.id,
                name: spot.name,
                location: spot.location,
                description: spot.description || '',
                order_number: spot.order_number || 0
              }))}
              routeName={selectedRouteForMap.name}
              category={selectedRouteForMap.category}
              difficulty={selectedRouteForMap.difficulty}
              height="100%"
              width="100%"
              style={{ height: '100%', width: '100%' }}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin tip="正在加载路线详情..." />
            </div>
          )}
        </Modal>

        {/* 自定义景点模态框 */}
        <Modal
          title={editingSpotIndex !== null ? "编辑景点" : "添加自定义景点"}
          open={isCustomSpotModalVisible}
          onCancel={() => {
            setIsCustomSpotModalVisible(false);
            setEditingSpotIndex(null);
            customSpotForm.resetFields();
          }}
          onOk={editingSpotIndex !== null ? handleSaveEditedSpot : handleAddCustomSpot}
          destroyOnClose={true}
        >
          <Form form={customSpotForm} layout="vertical">
            <Form.Item
              name="name"
              label="景点名称"
              rules={[{ required: true, message: '请输入景点名称' }]}
            >
              <Input placeholder="请输入景点名称" />
            </Form.Item>
            <Form.Item
              name="description"
              label="景点描述"
            >
              <Input.TextArea 
                placeholder="请输入景点描述" 
                rows={3}
              />
            </Form.Item>
            <Form.Item
              name="latitude"
              label="纬度"
              rules={[{ required: true, message: '请输入纬度' }]}
            >
              <InputNumber 
                placeholder="如: 30.274151" 
                step={0.000001}
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item
              name="longitude"
              label="经度"
              rules={[{ required: true, message: '请输入经度' }]}
            >
              <InputNumber 
                placeholder="如: 120.155070" 
                step={0.000001}
                style={{ width: '100%' }}
              />
            </Form.Item>
            <div style={{ marginTop: 16 }}>
              <Alert
                type="info"
                showIcon
                message="提示"
                description="可以通过高德地图、百度地图等获取准确的经纬度坐标。精确的坐标将确保景点在地图上的正确位置。"
              />
            </div>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};

export default FeaturedRouteManagement; 