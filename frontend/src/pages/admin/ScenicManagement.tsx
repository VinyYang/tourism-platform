import React, { useState, useEffect } from 'react';
import { Table, Space, Button, Modal, Form, Input, Select, InputNumber, message, Popconfirm, Tag, Upload } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import type { UploadChangeParam, RcFile, UploadFile } from 'antd/es/upload/interface';
import adminAPI from '../../api/admin';
import { Scenic } from '../../@types/scenic';
import './AdminPages.css';

const { Option } = Select;
const { TextArea } = Input;

// 定义表单值类型
interface ScenicFormValues {
    name: string;
    city: string;
    address: string;
    description: string;
    ticket_price: number;
    open_time?: string;
    images?: string;
    cover_image?: string | null;
    label?: string;
    features?: string;
    hot_score?: number;
}

const ScenicManagement: React.FC = () => {
    // 状态定义
    const [scenics, setScenics] = useState<Scenic[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [total, setTotal] = useState<number>(0);
    const [page, setPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [form] = Form.useForm<ScenicFormValues>();
    const [editingId, setEditingId] = useState<number | null>(null);
    const [cities, setCities] = useState<string[]>([]);
    const [keyword, setKeyword] = useState<string>('');
    const [coverImagePath, setCoverImagePath] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState<boolean>(false);

    // ---> 在组件作用域内定义 BACKEND_BASE_URL < ---
    const BACKEND_BASE_URL = process.env.REACT_APP_API_URL?.replace('/api/v1', '') || 'http://localhost:3001';

    // 加载景点数据
    const fetchScenics = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getScenics({
                page,
                pageSize,
                keyword,
                sortBy: 'created_at',
                sortOrder: 'desc'
            });
            // --- 加固：清洗数据，兼容id/scenic_id，过滤无id节点 ---
            let cleanData = (response.data && response.data.data) ? response.data.data.map(item => ({
                ...item,
                id: item.id ?? item.scenic_id
            })).filter(item => item.id !== undefined) : [];
            setScenics(cleanData);
            setTotal(response.data.meta.total);
        } catch (error) {
            message.error('获取景点数据失败');
            setScenics([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    // 加载城市数据
    const fetchCities = async () => {
        try {
            // 这里可以添加获取城市列表的API调用
            setCities(['北京', '上海', '广州', '深圳', '杭州', '成都', '重庆', '西安', '南京', '武汉']);
        } catch (error) {
            console.error('获取城市数据失败:', error);
        }
    };

    // 初始加载
    useEffect(() => {
        fetchScenics();
        fetchCities();
    }, [page, pageSize, keyword]);

    // 处理新增/编辑表单提交
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const apiData: Partial<Scenic> = {
                ...values,
                cover_image: values.cover_image === null ? undefined : values.cover_image,
            };
            console.log('准备发送到 API 的数据:', apiData);

            if (editingId != null) {
                await adminAPI.updateScenic(editingId, apiData);
                message.success('景点更新成功');
            } else {
                await adminAPI.createScenic(apiData);
                message.success('景点创建成功');
            }
            setIsModalVisible(false);
            setCoverImagePath(null);
            form.resetFields();
            setEditingId(null);
            fetchScenics();
        } catch (error: any) {
            console.error('操作失败:', error);
            message.error(`操作失败: ${error?.response?.data?.message || error?.message || '未知错误'}`);
        }
    };

    // 处理删除景点
    const handleDelete = async (id: number | undefined) => {
        if (id === undefined) {
            // --- 加固：前端直接移除无id节点 ---
            setScenics(prev => prev.filter(item => item.id !== undefined));
            message.success('已移除无效节点');
            return;
        }
        try {
            await adminAPI.deleteScenic(id);
            message.success('景点删除成功');
            fetchScenics();
        } catch (error) {
            console.error('删除失败:', error);
            message.error('删除失败');
        }
    };

    // 处理编辑景点
    const handleEdit = async (record: Scenic) => {
        setEditingId(record.id);
        form.setFieldsValue({
            name: record.name,
            city: record.city,
            address: record.address,
            description: record.description || '',
            ticket_price: record.ticket_price,
            open_time: record.open_time,
            images: Array.isArray(record.images) ? record.images.join(',') : record.images || '',
            cover_image: record.cover_image || null,
            label: Array.isArray(record.label) ? record.label.join(',') : record.label as string || '',
            features: record.features || '',
            hot_score: record.hot_score || 0
        });
        setCoverImagePath(record.cover_image || null);
        setIsModalVisible(true);
    };

    // 处理新增景点
    const handleAdd = () => {
        setEditingId(null);
        setCoverImagePath(null);
        form.resetFields();
        setIsModalVisible(true);
    };

    // 处理Modal关闭时重置editingId
    const handleModalCancel = () => {
        setIsModalVisible(false);
        setCoverImagePath(null);
        form.resetFields();
        setEditingId(null);
    };

    // 处理搜索
    const handleSearch = (value: string) => {
        setKeyword(value);
        setPage(1);
    };

    // 确保 handleCoverImageUpload 函数已定义
    const handleCoverImageUpload = (info: UploadChangeParam<UploadFile>) => {
        if (info.file.status === 'uploading') {
            setIsUploading(true);
            return;
        }
        if (info.file.status === 'done') {
            setIsUploading(false);
            const responsePath = info.file.response?.path;
            if (responsePath) {
                message.success(`${info.file.name} 上传成功`);
                setCoverImagePath(responsePath);
                form.setFieldsValue({ cover_image: responsePath });
            } else {
                message.error(`${info.file.name} 上传失败: ${info.file.response?.message || '未获取到路径'}`);
            }
        } else if (info.file.status === 'error') {
            setIsUploading(false);
            message.error(`${info.file.name} 上传失败: ${info.file.response?.message || '网络或服务器错误'}`);
        }
    };

    // 表格列定义
    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80
        },
        {
            title: '名称',
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: Scenic) => (
                <span>
                    {text}
                    {record.hot_score && record.hot_score > 80 && <Tag color="red" style={{ marginLeft: 8 }}>热门</Tag>}
                </span>
            )
        },
        {
            title: '城市',
            dataIndex: 'city',
            key: 'city',
            width: 100
        },
        {
            title: '票价',
            dataIndex: 'ticket_price',
            key: 'ticket_price',
            width: 100,
            render: (price: number) => `¥${price}`
        },
        {
            title: '开放时间',
            dataIndex: 'open_time',
            key: 'open_time',
            width: 150
        },
        {
            title: '标签',
            dataIndex: 'label',
            key: 'label',
            width: 200,
            render: (label: string | string[]) => {
                const labels = Array.isArray(label) ? label : (label ? label.split(',') : []);
                return (
                    <>
                        {labels.map((tag: string) => (
                            <Tag color="blue" key={tag}>
                                {tag}
                            </Tag>
                        ))}
                    </>
                );
            }
        },
        {
            title: '热度',
            dataIndex: 'hot_score',
            key: 'hot_score',
            width: 100,
            render: (score: number) => `${score || 0}分`
        },
        {
            title: '操作',
            key: 'action',
            width: 150,
            render: (_: any, record: Scenic) => (
                <Space size="middle">
                    <Button 
                        type="primary" 
                        icon={<EditOutlined />} 
                        size="small"
                        onClick={() => handleEdit(record)}
                    >
                        编辑
                    </Button>
                    <Popconfirm
                        title="确定要删除这个景点吗？"
                        onConfirm={() => handleDelete(record.id)}
                        okText="确定"
                        cancelText="取消"
                    >
                        <Button 
                            danger 
                            icon={<DeleteOutlined />} 
                            size="small"
                        >
                            删除
                        </Button>
                    </Popconfirm>
                </Space>
            )
        }
    ];

    // 修改 Upload 组件的 props: method 改为 'POST'
    const uploadProps = {
        name: 'image',
        action: '/api/v1/admin/upload/image-fs',
        method: 'POST' as const,
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        showUploadList: false,
        beforeUpload: (file: RcFile) => {
            const isImage = file.type.startsWith('image/');
            if (!isImage) {
                message.error('只能上传图片文件!');
            }
            const isLt5M = file.size / 1024 / 1024 < 5;
            if (!isLt5M) {
                message.error('图片大小不能超过 5MB!');
            }
            return isImage && isLt5M;
        },
        onChange: handleCoverImageUpload,
    };

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <h1>景点管理</h1>
                <div className="admin-page-actions">
                    <Input.Search
                        placeholder="搜索景点名称"
                        allowClear
                        onSearch={handleSearch}
                        style={{ width: 250, marginRight: 16 }}
                    />
                    <Button 
                        type="primary" 
                        icon={<PlusOutlined />}
                        onClick={handleAdd}
                    >
                        添加景点
                    </Button>
                </div>
            </div>

            <Table
                columns={columns}
                dataSource={scenics}
                rowKey="id"
                loading={loading}
                pagination={{
                    total,
                    current: page,
                    pageSize: pageSize,
                    onChange: (page, pageSize) => {
                        setPage(page);
                        if (pageSize) setPageSize(pageSize);
                    },
                    showSizeChanger: true,
                    showTotal: (total) => `共 ${total} 条记录`
                }}
            />

            <Modal
                title={editingId ? '编辑景点' : '新增景点'}
                open={isModalVisible}
                onCancel={handleModalCancel}
                onOk={handleSubmit}
                confirmLoading={isUploading}
                destroyOnClose
                width={600}
            >
                <Form form={form} layout="vertical" name="scenicForm">
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
                        rules={[{ required: true, message: '请选择所在城市' }]}
                    >
                        <Select placeholder="请选择城市">
                            {cities.map(city => (
                                <Option key={city} value={city}>{city}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                    
                    <Form.Item
                        name="address"
                        label="详细地址"
                        rules={[{ required: true, message: '请输入详细地址' }]}
                    >
                        <Input placeholder="请输入详细地址" />
                    </Form.Item>
                    
                    <Form.Item
                        name="description"
                        label="景点描述"
                        rules={[{ required: true, message: '请输入景点描述' }]}
                    >
                        <TextArea rows={4} placeholder="请输入景点描述" />
                    </Form.Item>
                    
                    <Form.Item
                        name="ticket_price"
                        label="票价"
                        rules={[{ required: true, message: '请输入票价' }]}
                    >
                        <InputNumber
                            min={0}
                            step={0.01}
                            precision={2}
                            style={{ width: '100%' }}
                            placeholder="请输入票价"
                            addonBefore="¥"
                        />
                    </Form.Item>
                    
                    <Form.Item
                        name="open_time"
                        label="开放时间"
                    >
                        <Input placeholder="例如：9:00-17:00" />
                    </Form.Item>
                    
                    <Form.Item
                        name="images"
                        label="图片链接"
                        help="多个图片链接使用逗号分隔"
                    >
                        <TextArea rows={3} placeholder="请输入图片链接，多个链接用逗号分隔" />
                    </Form.Item>
                    
                    <Form.Item label="封面图片">
                        <Upload {...uploadProps}>
                            <Button icon={<UploadOutlined />} loading={isUploading}>
                                {coverImagePath ? '更换封面' : '上传封面'}
                            </Button>
                        </Upload>
                        <div style={{ marginTop: 8, border: '1px solid #d9d9d9', padding: '4px', display: 'inline-block', minWidth: '100px', minHeight: '100px', textAlign: 'center', verticalAlign: 'middle' }}>
                            {coverImagePath ? (
                                <img
                                    src={`${BACKEND_BASE_URL}${coverImagePath}`}
                                    alt="封面预览"
                                    style={{ maxWidth: '200px', maxHeight: '200px', display: 'block' }}
                                />
                            ) : (
                                <span style={{ color: '#bfbfbf', lineHeight: '100px' }}>暂无图片</span>
                            )}
                        </div>
                        <Form.Item name="cover_image" noStyle>
                            <Input type="hidden" />
                        </Form.Item>
                    </Form.Item>
                    
                    <Form.Item
                        name="label"
                        label="标签"
                        help="多个标签使用逗号分隔"
                    >
                        <Input placeholder="请输入标签，如：自然风光,人文景观,历史古迹" />
                    </Form.Item>
                    
                    <Form.Item
                        name="features"
                        label="特色"
                    >
                        <TextArea rows={3} placeholder="请输入景点特色介绍" />
                    </Form.Item>
                    
                    <Form.Item
                        name="hot_score"
                        label="热度分数"
                    >
                        <InputNumber
                            min={0}
                            max={100}
                            style={{ width: '100%' }}
                            placeholder="请输入热度分数，0-100"
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ScenicManagement; 