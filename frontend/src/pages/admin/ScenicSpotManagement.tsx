import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  message, 
  Space, 
  Tabs, 
  Table, 
  Tag, 
  Progress,
  Select,
  Modal,
  notification,
  Alert
} from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  EnvironmentOutlined, 
  WarningOutlined,
  PlusOutlined,
  ImportOutlined
} from '@ant-design/icons';
import adminAPI, { CoordinateStats } from '../../api/admin';
import { Scenic } from '../../@types/scenic';
import { useNavigate, useParams } from 'react-router-dom';
import './ScenicSpotManagement.css';

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

// 地图组件，用于在地图上选择位置
const MapComponent = ({ value = {}, onChange }: any) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  
  useEffect(() => {
    // 防止重复加载
    if (window.AMap && mapLoaded) return;
    
    // 加载高德地图SDK
    const script = document.createElement('script');
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${process.env.REACT_APP_AMAP_KEY}`;
    script.async = true;
    script.onload = () => {
      setMapLoaded(true);
      initMap();
    };
    
    document.head.appendChild(script);
    
    return () => {
      // 清理地图实例
      if (mapInstance) {
        mapInstance.destroy();
      }
    };
  }, []);
  
  // 初始化地图
  const initMap = () => {
    if (!window.AMap) return;
    
    const map = new window.AMap.Map('scenic-spot-map', {
      zoom: 11,
      center: value.longitude && value.latitude 
        ? [value.longitude, value.latitude] 
        : [116.397428, 39.90923], // 默认为北京
    });
    
    setMapInstance(map);
    
    // 如果有初始坐标，添加标记
    if (value.longitude && value.latitude) {
      addMarker([value.longitude, value.latitude]);
    }
    
    // 点击地图添加标记
    map.on('click', (e: any) => {
      const lnglat: [number, number] = [e.lnglat.getLng(), e.lnglat.getLat()];
      addMarker(lnglat);
      
      if (onChange) {
        onChange({
          longitude: lnglat[0],
          latitude: lnglat[1]
        });
      }
      
      // 地理编码获取地址信息
      if (window.AMap.service) {
        const geocoder = new window.AMap.Geocoder();
        geocoder.getAddress(lnglat, (status: string, result: any) => {
          if (status === 'complete' && result.regeocode) {
            message.info(`位置: ${result.regeocode.formattedAddress}`);
          }
        });
      }
    });
  };
  
  // 添加标记
  const addMarker = (lnglat: [number, number]) => {
    if (!mapInstance) return;
    
    // 移除现有标记
    if (marker) {
      mapInstance.remove(marker);
    }
    
    // 创建新标记
    const newMarker = new window.AMap.Marker({
      position: new window.AMap.LngLat(lnglat[0], lnglat[1]),
      draggable: true, // 可拖动
      cursor: 'move',
      animation: 'AMAP_ANIMATION_DROP'
    });
    
    mapInstance.add(newMarker);
    setMarker(newMarker);
    
    // 拖动标记更新坐标
    newMarker.on('dragend', (e: any) => {
      const position = newMarker.getPosition();
      if (onChange) {
        onChange({
          longitude: position.getLng(),
          latitude: position.getLat()
        });
      }
    });
  };
  
  return (
    <div>
      <div 
        id="scenic-spot-map" 
        style={{ 
          height: '400px', 
          marginBottom: '16px', 
          border: '1px solid #d9d9d9',
          borderRadius: '2px'
        }}
      ></div>
      <Alert
        message="使用提示"
        description="点击地图选择位置，或拖动标记调整位置。精确的坐标可以在下方经纬度输入框中直接输入。"
        type="info"
        showIcon
      />
    </div>
  );
};

// 景点编辑表单
const ScenicSpotForm = ({ initialValues, onFinish, loading }: any) => {
  const [form] = Form.useForm();
  
  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    }
  }, [initialValues, form]);
  
  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={(values) => {
        onFinish(values);
      }}
    >
      <Form.Item
        name="name"
        label="景点名称"
        rules={[{ required: true, message: '请输入景点名称' }]}
      >
        <Input placeholder="请输入景点名称" />
      </Form.Item>
      
      <Form.Item
        name="city"
        label="所在城市"
        rules={[{ required: true, message: '请输入所在城市' }]}
      >
        <Input placeholder="请输入所在城市" />
      </Form.Item>
      
      <Form.Item
        name="address"
        label="详细地址"
        rules={[{ required: true, message: '请输入详细地址' }]}
      >
        <Input placeholder="请输入详细地址" />
      </Form.Item>
      
      <Card title="位置信息" style={{ marginBottom: 16 }}>
        <Form.Item
          name="coordinates"
          label="地图选点"
        >
          <MapComponent />
        </Form.Item>
        
        <Space style={{ display: 'flex', marginBottom: 8 }}>
          <Form.Item
            name="longitude"
            label="经度"
            rules={[{ required: true, message: '请输入经度' }]}
          >
            <Input type="number" step="0.000001" placeholder="例如: 116.3972" />
          </Form.Item>
          
          <Form.Item
            name="latitude"
            label="纬度"
            rules={[{ required: true, message: '请输入纬度' }]}
          >
            <Input type="number" step="0.000001" placeholder="例如: 39.9075" />
          </Form.Item>
        </Space>
      </Card>
      
      <Form.Item
        name="description"
        label="景点描述"
      >
        <TextArea rows={4} placeholder="请输入景点描述" />
      </Form.Item>
      
      <Form.Item
        name="image_url"
        label="图片URL"
      >
        <Input placeholder="请输入图片URL" />
      </Form.Item>
      
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          保存
        </Button>
      </Form.Item>
    </Form>
  );
};

// 景点列表组件
const ScenicSpotList = () => {
  const [spots, setSpots] = useState<Scenic[]>([]);
  const [loading, setLoading] = useState(false);
  const [coordinateStats, setCoordinateStats] = useState<CoordinateStats>({
    totalCount: 0,
    missingCoordinatesCount: 0,
    completionRate: "0",
    recentMissingCoordinates: []
  });
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchSpots();
    fetchCoordinateStats();
  }, []);
  
  const fetchSpots = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getScenics();
      setSpots(response.data.data || []);
    } catch (error) {
      message.error('获取景点列表失败');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchCoordinateStats = async () => {
    try {
      const response = await adminAPI.getScenicSpotCoordinateStats();
      if (response && response.data) {
        setCoordinateStats(response.data.data);
      }
    } catch (error) {
      console.error('获取坐标统计数据失败:', error);
    }
  };
  
  const handleEdit = (id: number) => {
    navigate(`/admin/scenics/edit/${id}`);
  };
  
  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个景点吗？此操作不可恢复。',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await adminAPI.deleteScenic(id);
          message.success('删除成功');
          fetchSpots();
        } catch (error) {
          message.error('删除失败');
        }
      }
    });
  };
  
  const handleCreate = () => {
    navigate('/admin/scenics/create');
  };
  
  const handleImport = () => {
    navigate('/admin/scenics/import');
  };
  
  const columns = [
    {
      title: 'ID',
      dataIndex: 'scenic_id',
      key: 'scenic_id',
      width: 80
    },
    {
      title: '景点名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '城市',
      dataIndex: 'city',
      key: 'city',
      width: 120
    },
    {
      title: '坐标',
      key: 'coordinates',
      width: 180,
      render: (text: any, record: any) => {
        const hasCoordinates = 
          (record.latitude != null && record.longitude != null) || 
          (record.location && Array.isArray(record.location) && record.location.length === 2);
        
        const coordinates = hasCoordinates
          ? (record.location && Array.isArray(record.location) && record.location.length === 2)
            ? `${record.location[1].toFixed(4)}, ${record.location[0].toFixed(4)}`
            : `${record.latitude.toFixed(4)}, ${record.longitude.toFixed(4)}`
          : '无坐标数据';
        
        return (
          <span>
            {hasCoordinates ? (
              <Tag color="green" icon={<EnvironmentOutlined />}>
                {coordinates}
              </Tag>
            ) : (
              <Tag color="red" icon={<WarningOutlined />}>
                {coordinates}
              </Tag>
            )}
          </span>
        );
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (text: any, record: any) => (
        <Space size="small">
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            size="small"
            onClick={() => handleEdit(record.scenic_id)}
          >
            编辑
          </Button>
          <Button 
            danger 
            icon={<DeleteOutlined />} 
            size="small"
            onClick={() => handleDelete(record.scenic_id)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ];
  
  return (
    <div>
      <Card 
        title="景点坐标数据统计" 
        style={{ marginBottom: 16 }}
        extra={
          <Space>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              新增景点
            </Button>
            <Button 
              type="default" 
              icon={<ImportOutlined />}
              onClick={handleImport}
            >
              批量导入
            </Button>
          </Space>
        }
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div>总景点数: {coordinateStats.totalCount}</div>
            <div>缺少坐标的景点数: {coordinateStats.missingCoordinatesCount}</div>
          </div>
          <div style={{ width: '50%' }}>
            <div>坐标数据完整率:</div>
            <Progress 
              percent={parseFloat(coordinateStats.completionRate)} 
              status={parseFloat(coordinateStats.completionRate) < 80 ? 'exception' : 'active'} 
              format={percent => `${percent?.toFixed(2)}%`}
            />
          </div>
        </div>
        
        {coordinateStats.missingCoordinatesCount > 0 && (
          <Alert
            message="存在缺少坐标的景点"
            description={`有 ${coordinateStats.missingCoordinatesCount} 个景点缺少坐标数据，这可能导致地图显示异常。请及时添加坐标数据。`}
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            action={
              <Button size="small" type="primary">
                批量添加
              </Button>
            }
          />
        )}
      </Card>
      
      <Table 
        columns={columns} 
        dataSource={spots} 
        rowKey="scenic_id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

// 景点编辑页面
const ScenicSpotEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [spot, setSpot] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  
  useEffect(() => {
    if (id && id !== 'create') {
      fetchSpot(parseInt(id));
    }
  }, [id]);
  
  const fetchSpot = async (spotId: number) => {
    setLoading(true);
    try {
      const response = await adminAPI.getScenicById(spotId);
      const spotData = response.data.data;
      
      // 确保coordinates字段正确设置
      if (spotData) {
        if (spotData.location && Array.isArray(spotData.location) && spotData.location.length === 2) {
          spotData.longitude = spotData.location[0];
          spotData.latitude = spotData.location[1];
        } else if (spotData.longitude != null && spotData.latitude != null) {
          spotData.location = [spotData.longitude, spotData.latitude];
        }
        
        // 设置coordinates字段供地图组件使用
        spotData.coordinates = {
          longitude: spotData.longitude ?? 0,
          latitude: spotData.latitude ?? 0
        };
      }
      
      setSpot(spotData);
    } catch (error) {
      message.error('获取景点数据失败');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSave = async (values: any) => {
    setSaveLoading(true);
    try {
      // 处理坐标数据
      const coordinatesFromMap = values.coordinates || {};
      const longitude = values.longitude || coordinatesFromMap.longitude;
      const latitude = values.latitude || coordinatesFromMap.latitude;
      
      // 验证坐标
      if (!longitude || !latitude) {
        message.error('请提供有效的坐标数据');
        setSaveLoading(false);
        return;
      }
      
      const location = [parseFloat(longitude), parseFloat(latitude)];
      
      // 组装保存数据
      const saveData = {
        ...values,
        longitude: parseFloat(longitude),
        latitude: parseFloat(latitude),
        location
      };
      
      delete saveData.coordinates; // 移除辅助字段
      
      // 创建或更新
      if (id && id !== 'create') {
        await adminAPI.updateScenic(parseInt(id), saveData);
        message.success('更新成功');
      } else {
        await adminAPI.createScenic(saveData);
        message.success('创建成功');
      }
      
      navigate('/admin/scenics');
    } catch (error: any) {
      message.error(`保存失败: ${error.message}`);
    } finally {
      setSaveLoading(false);
    }
  };
  
  return (
    <Card 
      title={id && id !== 'create' ? '编辑景点' : '新增景点'} 
      loading={loading && id !== 'create'}
    >
      <ScenicSpotForm 
        initialValues={spot} 
        onFinish={handleSave} 
        loading={saveLoading}
      />
    </Card>
  );
};

// 批量导入组件
const ScenicSpotImport = () => {
  // 这里实现批量导入功能
  return (
    <Card title="批量导入景点数据">
      <p>此功能开发中...</p>
    </Card>
  );
};

// 主组件
const ScenicSpotManagement = () => {
  const { action, id } = useParams<{ action?: string, id?: string }>();
  
  // 根据路由参数显示不同内容
  if (action === 'edit' || action === 'create') {
    return <ScenicSpotEdit />;
  } else if (action === 'import') {
    return <ScenicSpotImport />;
  }
  
  return (
    <div className="scenic-management-container">
      <h2>景点管理</h2>
      <ScenicSpotList />
    </div>
  );
};

export default ScenicSpotManagement; 