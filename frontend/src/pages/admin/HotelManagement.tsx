import React, { useState, useEffect, useCallback } from 'react';
import { 
    Table, Button, Space, Input, Select, Form, 
    Modal, message, Popconfirm, Card, Typography, Spin, 
    Rate, InputNumber, Tag, Avatar, Image, Row, Col
} from 'antd';
import { 
    SearchOutlined, PlusOutlined, EditOutlined, 
    DeleteOutlined, ReloadOutlined, StarOutlined
} from '@ant-design/icons';
import moment from 'moment';
import adminAPI from '../../api/admin'; 
import { Hotel } from '../../@types/hotel'; 
import type { HotelSearchParams } from '../../api/admin'; // Import search params type
import type { TablePaginationConfig, SorterResult, FilterValue, TableCurrentDataSource } from 'antd/es/table/interface'; 
import './AdminPages.css'; // 使用通用的管理页面样式

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

/**
 * 酒店管理页面
 */
const HotelManagement: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [hotels, setHotels] = useState<Hotel[]>([]);
    const [pagination, setPagination] = useState<TablePaginationConfig>({ 
        current: 1,
        pageSize: 10,
        total: 0,
        showSizeChanger: true,
        showTotal: (total) => `总共 ${total} 条记录`,
    });
    const [searchParams, setSearchParams] = useState<HotelSearchParams>({}); 
    const [searchForm] = Form.useForm();
    const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
    const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
    const [editForm] = Form.useForm();
    const [createForm] = Form.useForm();
    const [currentHotel, setCurrentHotel] = useState<Hotel | null>(null);

    // 加载酒店数据的函数
    const fetchHotels = useCallback(async (params: HotelSearchParams = {}) => {
        setLoading(true);
        try {
            const queryParams: HotelSearchParams = {
                page: pagination.current,
                pageSize: pagination.pageSize,
                sortBy: searchParams.sortBy,
                sortOrder: searchParams.sortOrder,
                keyword: searchParams.keyword,
                city: searchParams.city,
                stars: searchParams.stars,
                priceMin: searchParams.priceMin,
                priceMax: searchParams.priceMax,
                ...params, 
            };

            Object.keys(queryParams).forEach(key => {
                const typedKey = key as keyof HotelSearchParams;
                if (queryParams[typedKey] === '' || queryParams[typedKey] === null || queryParams[typedKey] === undefined) {
                    delete queryParams[typedKey];
                }
            });

            console.log('Fetching hotels with params:', queryParams);
            const response = await adminAPI.getHotels(queryParams);
            
            if (response.data.success) {
                setHotels(response.data.data);
                setPagination(prev => ({
                    ...prev,
                    current: response.data.meta.page,
                    pageSize: response.data.meta.pageSize,
                    total: response.data.meta.total,
                }));
                setSearchParams({
                    page: response.data.meta.page,
                    pageSize: response.data.meta.pageSize,
                    keyword: queryParams.keyword,
                    city: queryParams.city,
                    stars: queryParams.stars,
                    priceMin: queryParams.priceMin,
                    priceMax: queryParams.priceMax,
                    sortBy: queryParams.sortBy,
                    sortOrder: queryParams.sortOrder,
                });
            } else {
                message.error(response.data.message || '获取酒店列表失败');
            }
        } catch (error: any) {
            console.error('获取酒店列表异常:', error);
            message.error(`获取酒店列表失败: ${error.response?.data?.message || error.message || '未知错误'}`);
        } finally {
            setLoading(false);
        }
    }, [pagination.current, pagination.pageSize]); // 移除 searchParams 依赖

    // 初始加载
    useEffect(() => {
        fetchHotels({ page: 1 });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 表格列定义
    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            sorter: true, 
        },
        {
            title: '酒店名称',
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: Hotel) => (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                     <Image 
                        width={60}
                        height={40}
                        src={record.cover_image || 'https://placehold.co/60x40?text=Hotel'} 
                        alt={text}
                        preview={false} // 点击不放大
                        style={{ objectFit: 'cover', marginRight: 8, borderRadius: '4px' }}
                        fallback='https://placehold.co/60x40?text=Error' // 加载失败时的占位图
                    />
                    <Text style={{ flex: 1 }}>{text}</Text>
                </div>
            ),
            sorter: true,
        },
        {
            title: '城市',
            dataIndex: 'city',
            key: 'city',
            sorter: true,
        },
        {
            title: '星级',
            dataIndex: 'stars',
            key: 'stars',
            render: (stars: number) => <Rate disabled defaultValue={stars} count={stars} character={<StarOutlined />} style={{ fontSize: 14 }} />,
            sorter: true,
        },
        {
            title: '评分',
            dataIndex: 'rating', // 或 'score'
            key: 'rating',
            render: (rating?: number) => rating ? rating.toFixed(1) : '-',
            sorter: true,
        },
        {
            title: '均价(¥)',
            dataIndex: 'avg_price',
            key: 'avg_price',
            render: (price?: number) => {
                if (price === null || price === undefined) return '-';
                return !isNaN(Number(price)) ? `¥ ${Number(price).toFixed(2)}` : '-';
            },
            sorter: true,
        },
        {
            title: '类型',
            dataIndex: 'type',
            key: 'type',
            render: (type?: string) => type ? <Tag>{type}</Tag> : '-',
        },
        {
            title: '创建时间',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (text?: string) => text ? moment(text).format('YYYY-MM-DD HH:mm') : '-',
            sorter: true,
        },
        {
            title: '操作',
            key: 'action',
            render: (text: string, record: Hotel) => (
                <Space size="small">
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleEditHotel(record)}
                    >
                        编辑
                    </Button>
                    <Popconfirm
                        title="确定要删除此酒店吗？"
                        onConfirm={() => handleDeleteHotel(record.id)} 
                        okText="确定"
                        cancelText="取消"
                    >
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                        >
                            删除
                        </Button>
                    </Popconfirm>
                </Space>
            )
        }
    ];

    // 处理表格变化
    const handleTableChange = (
        newPagination: TablePaginationConfig,
        filters: Record<string, FilterValue | null>,
        sorter: SorterResult<Hotel> | SorterResult<Hotel>[],
        extra: TableCurrentDataSource<Hotel>
    ) => {
        const sortParams: Partial<HotelSearchParams> = {};
        if (!Array.isArray(sorter)) {
            if (sorter.field && sorter.order) {
                sortParams.sortBy = sorter.field as string;
                sortParams.sortOrder = sorter.order === 'ascend' ? 'asc' : 'desc';
            } else {
                sortParams.sortBy = undefined;
                sortParams.sortOrder = undefined;
            }
        }
        
        fetchHotels({
            page: newPagination.current,
            pageSize: newPagination.pageSize,
            sortBy: sortParams.sortBy,
            sortOrder: sortParams.sortOrder,
            keyword: searchParams.keyword,
            city: searchParams.city,
            stars: searchParams.stars,
            priceMin: searchParams.priceMin,
            priceMax: searchParams.priceMax,
        });
    };

    // 处理搜索
    const handleSearch = (values: any) => {
        fetchHotels({ 
            ...values, 
            page: 1 // 搜索时重置到第一页
        });
    };

    // 重置搜索
    const handleResetSearch = () => {
        searchForm.resetFields();
        fetchHotels({ 
            page: 1, 
            keyword: undefined,
            city: undefined,
            stars: undefined,
            priceMin: undefined,
            priceMax: undefined,
            // 保留排序
            sortBy: searchParams.sortBy,
            sortOrder: searchParams.sortOrder,
        });
    };

    // 打开编辑 Modal
    const handleEditHotel = (hotel: Hotel) => {
        setCurrentHotel(hotel);
        // 填充表单，注意需要处理 images/facilities/amenities/policies/location 的格式
        editForm.setFieldsValue({
            ...hotel,
            images: Array.isArray(hotel.images) ? hotel.images.join('\n') : hotel.images, // 多行文本框显示
            facilities: Array.isArray(hotel.facilities) ? hotel.facilities.join('\n') : hotel.facilities,
            amenities: Array.isArray(hotel.amenities) ? hotel.amenities.join('\n') : hotel.amenities,
            policies: typeof hotel.policies === 'object' ? JSON.stringify(hotel.policies, null, 2) : hotel.policies,
            location: typeof hotel.location === 'object' ? JSON.stringify(hotel.location, null, 2) : hotel.location,
        });
        setEditModalVisible(true);
    };

    // 删除酒店
    const handleDeleteHotel = async (hotelId: number) => {
        setLoading(true);
        try {
            const response = await adminAPI.deleteHotel(hotelId);
            if (response.data.success) {
                message.success('酒店删除成功');
                const currentPage = searchParams.page || 1;
                if (hotels.length === 1 && currentPage > 1) {
                    fetchHotels({ page: currentPage - 1 });
                } else {
                    fetchHotels({ page: currentPage });
                }
            } else {
                message.error(response.data.message || '删除酒店失败');
                setLoading(false); 
            }
        } catch (error: any) {
            console.error('删除酒店异常:', error);
            message.error(`删除酒店失败: ${error.response?.data?.message || error.message || '未知错误'}`);
            setLoading(false);
        }
    };

    // 提交编辑表单
    const handleEditSubmit = async () => {
        try {
            const values = await editForm.validateFields();
            if (!currentHotel) return;
            setLoading(true);

            const updatedHotelData: Partial<Hotel> = {
                ...values,
                // 处理需要转换格式的字段
                images: values.images?.split('\n').map((s:string) => s.trim()).filter(Boolean) || [],
                facilities: values.facilities?.split('\n').map((s:string) => s.trim()).filter(Boolean) || [],
                amenities: values.amenities?.split('\n').map((s:string) => s.trim()).filter(Boolean) || [],
                policies: values.policies ? JSON.parse(values.policies) : undefined,
                location: values.location ? JSON.parse(values.location) : undefined,
            };

            const response = await adminAPI.updateHotel(currentHotel.id, updatedHotelData);
            if (response.data.success) {
                message.success('酒店信息更新成功');
                setEditModalVisible(false);
                fetchHotels({ page: searchParams.page });
            } else {
                message.error(response.data.message || '更新酒店信息失败');
                setLoading(false); 
            }
        } catch (error: any) {
            console.error('更新酒店异常:', error);
            if (error.name === 'SyntaxError') {
                 message.error('更新失败：Policies 或 Location 字段包含无效的 JSON 格式。');
            } else if (error.errorFields) {
                 message.error('请检查表单输入项');
            } else {
                 message.error(`更新酒店失败: ${error.response?.data?.message || error.message || '未知错误'}`);
            }
             setLoading(false);
        }
    };

    // 打开新建 Modal
    const handleCreateHotel = () => {
        createForm.resetFields();
        setCreateModalVisible(true);
    };

    // 提交新建表单
    const handleCreateSubmit = async () => {
        try {
            const values = await createForm.validateFields();
            setLoading(true);
            const newHotelData: Partial<Hotel> = { 
                ...values,
                images: values.images?.split('\n').map((s:string) => s.trim()).filter(Boolean) || [],
                facilities: values.facilities?.split('\n').map((s:string) => s.trim()).filter(Boolean) || [],
                amenities: values.amenities?.split('\n').map((s:string) => s.trim()).filter(Boolean) || [],
                policies: values.policies ? JSON.parse(values.policies) : undefined,
                location: values.location ? JSON.parse(values.location) : undefined,
            };

            const response = await adminAPI.createHotel(newHotelData);
            if (response.data.success) {
                message.success('酒店创建成功');
                setCreateModalVisible(false);
                fetchHotels({ page: 1 });
            } else {
                message.error(response.data.message || '创建酒店失败');
                setLoading(false);
            }
        } catch (error: any) {
            console.error('创建酒店异常:', error);
             if (error.name === 'SyntaxError') {
                 message.error('创建失败：Policies 或 Location 字段包含无效的 JSON 格式。');
            } else if (error.errorFields) {
                 message.error('请检查表单输入项');
            } else {
                 message.error(`创建酒店失败: ${error.response?.data?.message || error.message || '未知错误'}`);
            }
             setLoading(false);
        }
    };

    return (
        <div className="admin-page">
            <Card bordered={false}>
                <Title level={4}>酒店管理</Title>
                
                {/* 搜索表单 */}
                <Form
                    form={searchForm}
                    layout="inline"
                    onFinish={handleSearch}
                    style={{ marginBottom: 20, flexWrap: 'wrap' }} // 允许换行
                >
                    <Form.Item name="keyword">
                        <Input placeholder="酒店名称/地址/描述" prefix={<SearchOutlined />} allowClear />
                    </Form.Item>
                    <Form.Item name="city">
                        <Input placeholder="城市" allowClear />
                    </Form.Item>
                    <Form.Item name="stars">
                        <Select placeholder="星级" allowClear style={{ width: 100 }}>
                            {[1, 2, 3, 4, 5].map(s => <Option key={s} value={s}>{s}星</Option>)}
                        </Select>
                    </Form.Item>
                    <Form.Item name="priceMin">
                        <InputNumber placeholder="最低价" min={0} style={{ width: 100 }}/>
                    </Form.Item>
                    <Form.Item name="priceMax">
                         <InputNumber placeholder="最高价" min={0} style={{ width: 100 }}/>
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading}>查询</Button>
                    </Form.Item>
                    <Form.Item>
                        <Button onClick={handleResetSearch} disabled={loading}>重置</Button>
                    </Form.Item>
                </Form>

                {/* 操作按钮 */}
                <Space style={{ marginBottom: 16 }}>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateHotel}>
                        添加酒店
                    </Button>
                    <Button icon={<ReloadOutlined />} onClick={() => fetchHotels(searchParams)} disabled={loading}>
                        刷新
                    </Button>
                </Space>

                {/* 酒店表格 */}
                <Spin spinning={loading}>
                    <Table
                        rowKey="id"
                        columns={columns}
                        dataSource={hotels}
                        pagination={pagination}
                        loading={loading}
                        onChange={handleTableChange}
                        scroll={{ x: 'max-content' }}
                    />
                </Spin>
            </Card>

            {/* 编辑/新建 Modal 公用部分 */}
            <Modal
                title={currentHotel ? '编辑酒店信息' : '添加新酒店'}
                visible={editModalVisible || createModalVisible}
                onOk={currentHotel ? handleEditSubmit : handleCreateSubmit}
                onCancel={() => {
                    setEditModalVisible(false);
                    setCreateModalVisible(false);
                    setCurrentHotel(null);
                }}
                confirmLoading={loading}
                destroyOnClose
                width={800} // 加宽 Modal
            >
                <Form 
                    form={currentHotel ? editForm : createForm} 
                    layout="vertical"
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="name" label="酒店名称" rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                             <Form.Item name="city" label="城市" rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="address" label="详细地址" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Row gutter={16}>
                         <Col span={8}>
                            <Form.Item name="type" label="酒店类型">
                                <Input placeholder="例如：经济型, 商务型, 度假村"/>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="avg_price" label="平均价格(¥)" rules={[{ type: 'number', min: 0 }]}>
                                <InputNumber style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                         <Col span={8}>
                            <Form.Item name="stars" label="星级" rules={[{ type: 'integer', min: 1, max: 5 }]}>
                                <InputNumber style={{ width: '100%' }} placeholder="1-5"/>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="description" label="酒店描述">
                        <TextArea rows={4} />
                    </Form.Item>
                     <Form.Item name="rating" label="评分" rules={[{ type: 'number', min: 0, max: 5 }]}>
                        <InputNumber step={0.1} placeholder="0.0 - 5.0"/>
                    </Form.Item>
                    <Form.Item name="cover_image" label="封面图片 URL">
                        <Input placeholder="酒店列表展示的主图 URL"/>
                    </Form.Item>
                    <Form.Item name="images" label="酒店图片 URL (每行一个)">
                        <TextArea rows={3} placeholder="输入多个图片 URL，每行一个"/>
                    </Form.Item>
                    <Form.Item name="facilities" label="设施 (每行一个)">
                         <TextArea rows={3} placeholder="例如：免费Wifi\n停车场\n游泳池"/>
                    </Form.Item>
                     <Form.Item name="amenities" label="便利设施 (每行一个)">
                         <TextArea rows={3} placeholder="兼容字段，可留空或填写如：洗漱用品\n吹风机"/>
                    </Form.Item>
                    <Form.Item name="policies" label="酒店政策 (JSON格式)">
                         <TextArea rows={4} placeholder='输入 JSON 字符串，例如：{
  "checkIn": "14:00",
  "checkOut": "12:00",
  "pets": "不允许携带宠物"
}'/>
                    </Form.Item>
                    <Form.Item name="location" label="地理位置 (JSON格式)">
                         <TextArea rows={3} placeholder='输入 JSON 字符串，例如：{
  "latitude": 30.657,
  "longitude": 104.066
}'/>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default HotelManagement; 