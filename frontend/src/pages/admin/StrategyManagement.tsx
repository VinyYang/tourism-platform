import React, { useState, useEffect, useCallback } from 'react';
import { 
    Table, Button, Space, Input, Select, Form, 
    Modal, message, Popconfirm, Card, Typography, Spin, 
    Tag, Avatar, Image, InputNumber, Descriptions
} from 'antd';
import { 
    SearchOutlined, PlusOutlined, EditOutlined, 
    DeleteOutlined, ReloadOutlined, EyeOutlined
} from '@ant-design/icons';
import moment from 'moment';
import adminAPI from '../../api/admin'; 
import { Strategy } from '../../@types/strategy'; 
import { User } from '../../@types/user'; // 引入 User 用于显示作者信息
import type { StrategySearchParams } from '../../api/admin';
import type { TablePaginationConfig, SorterResult, FilterValue, TableCurrentDataSource } from 'antd/es/table/interface'; 
import './AdminPages.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// 攻略状态映射 (使用更新后的状态)
const strategyStatusMap: Record<string, { color: string; text: string }> = {
    draft: { color: 'default', text: '草稿' },
    published: { color: 'green', text: '已发布' },
    // archived: { color: 'orange', text: '已归档' }, // 移除后端不存在的状态
};

/**
 * 攻略管理页面
 */
const StrategyManagement: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [strategies, setStrategies] = useState<Strategy[]>([]);
    const [pagination, setPagination] = useState<TablePaginationConfig>({ 
        current: 1,
        pageSize: 10,
        total: 0,
        showSizeChanger: true,
        showTotal: (total) => `总共 ${total} 条记录`,
    });
    const [searchParams, setSearchParams] = useState<StrategySearchParams>({}); 
    const [searchForm] = Form.useForm();
    const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
    const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
    const [editForm] = Form.useForm();
    const [createForm] = Form.useForm();
    const [currentStrategy, setCurrentStrategy] = useState<Strategy | null>(null);
    // 详情 Modal 相关状态
    const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false);
    const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);

    // 加载攻略数据的函数
    const fetchStrategies = useCallback(async (params: StrategySearchParams = {}) => {
        setLoading(true);
        try {
            const queryParams: StrategySearchParams = {
                page: pagination.current,
                pageSize: pagination.pageSize,
                sortBy: searchParams.sortBy,
                sortOrder: searchParams.sortOrder,
                keyword: searchParams.keyword,
                userId: searchParams.userId,
                city: searchParams.city,
                status: searchParams.status,
                ...params, 
            };

            Object.keys(queryParams).forEach(key => {
                const typedKey = key as keyof StrategySearchParams;
                if (queryParams[typedKey] === '' || queryParams[typedKey] === null || queryParams[typedKey] === undefined) {
                    delete queryParams[typedKey];
                }
            });

            console.log('Fetching strategies with params:', queryParams);
            const response = await adminAPI.getStrategies(queryParams);
            
            if (response.data.success) {
                setStrategies(response.data.data);
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
                    userId: queryParams.userId,
                    city: queryParams.city,
                    status: queryParams.status,
                    sortBy: queryParams.sortBy,
                    sortOrder: queryParams.sortOrder,
                });
            } else {
                message.error(response.data.message || '获取攻略列表失败');
            }
        } catch (error: any) {
            console.error('获取攻略列表异常:', error);
            message.error(`获取攻略列表失败: ${error.response?.data?.message || error.message || '未知错误'}`);
        } finally {
            setLoading(false);
        }
    }, [pagination.current, pagination.pageSize]);

    // 初始加载
    useEffect(() => {
        fetchStrategies({ page: 1 });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 表格列定义 (使用正确的字段名)
    const columns = [
        {
            title: 'ID',
            dataIndex: 'strategy_id', // 使用 strategy_id
            key: 'strategy_id',
            sorter: true, 
        },
        {
            title: '标题',
            dataIndex: 'title',
            key: 'title',
            render: (text: string, record: Strategy) => (
                 <div style={{ display: 'flex', alignItems: 'center' }}>
                     <Image 
                        width={60}
                        height={40}
                        src={record.cover_image || 'https://placehold.co/60x40?text=攻略'} 
                        alt={text}
                        preview={false}
                        style={{ objectFit: 'cover', marginRight: 8, borderRadius: '4px' }}
                        fallback='https://placehold.co/60x40?text=Error'
                    />
                    <Text style={{ flex: 1 }}>{text}</Text>
                 </div>
            ),
            sorter: true,
        },
        {
            title: '作者',
            dataIndex: 'author',
            key: 'author',
            render: (author?: Pick<User, 'user_id' | 'username' | 'avatar'>) => (
                author ? (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar src={author.avatar || `https://placehold.co/30?text=${author.username?.charAt(0)}`} size="small" style={{ marginRight: 8 }} />
                        <Text>{author.username}</Text>
                    </div>
                 ) : '-'
            ),
            // 通常不直接按作者对象排序
        },
        {
            title: '目的地/城市',
            dataIndex: 'city', // 使用 city
            key: 'city',
            sorter: true,
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            render: (status?: string) => status ? (
                <Tag color={strategyStatusMap[status]?.color || 'default'}>
                    {strategyStatusMap[status]?.text || status}
                </Tag>
            ) : '-',
            sorter: true,
        },
        {
            title: '浏览量',
            dataIndex: 'view_count', // 使用 view_count
            key: 'view_count',
            sorter: true,
        },
        {
            title: '点赞数',
            dataIndex: 'like_count', // 使用 like_count
            key: 'like_count',
            sorter: true,
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
            width: 180,
            render: (text: string, record: Strategy) => (
                <Space size="small">
                     <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => showStrategyDetail(record.strategy_id)} // 使用 strategy_id
                        size="small"
                    >
                        详情
                    </Button>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleEditStrategy(record)}
                        size="small"
                    >
                        编辑
                    </Button>
                    <Popconfirm
                        title="确定要删除此攻略吗？"
                        onConfirm={() => handleDeleteStrategy(record.strategy_id)} // 使用 strategy_id
                        okText="确定"
                        cancelText="取消"
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} size="small">
                            删除
                        </Button>
                    </Popconfirm>
                </Space>
            )
        }
    ];

    // 处理表格变化 (确保 sortBy 字段有效)
    const handleTableChange = (
        newPagination: TablePaginationConfig,
        filters: Record<string, FilterValue | null>,
        sorter: SorterResult<Strategy> | SorterResult<Strategy>[],
        extra: TableCurrentDataSource<Strategy>
    ) => {
        const sortParams: Partial<StrategySearchParams> = {};
        if (!Array.isArray(sorter)) {
            if (sorter.field && sorter.order) {
                // 更新有效排序字段列表
                const validSortFields = ['strategy_id', 'title', 'city', 'status', 'view_count', 'like_count', 'created_at']; 
                if (validSortFields.includes(sorter.field as string)) {
                    sortParams.sortBy = sorter.field as string;
                    sortParams.sortOrder = sorter.order === 'ascend' ? 'asc' : 'desc';
                } else {
                     message.warning(`暂不支持按 ${sorter.field} 排序`);
                     sortParams.sortBy = undefined;
                     sortParams.sortOrder = undefined;
                }
            } else {
                sortParams.sortBy = undefined;
                sortParams.sortOrder = undefined;
            }
        }
        
        fetchStrategies({
            page: newPagination.current,
            pageSize: newPagination.pageSize,
            sortBy: sortParams.sortBy,
            sortOrder: sortParams.sortOrder,
            // 保留筛选
            keyword: searchParams.keyword,
            userId: searchParams.userId,
            city: searchParams.city,
            status: searchParams.status,
        });
    };

    // 处理搜索 (使用 city 字段)
    const handleSearch = (values: any) => {
        const { destination, ...restValues } = values; // 取出 destination
        fetchStrategies({ ...restValues, city: destination, page: 1 }); // 使用 city 字段
    };

    // 重置搜索 (使用 city 字段)
    const handleResetSearch = () => {
        searchForm.resetFields();
        fetchStrategies({ 
            page: 1, 
            keyword: undefined,
            userId: undefined,
            city: undefined, // 使用 city
            status: undefined,
            sortBy: searchParams.sortBy,
            sortOrder: searchParams.sortOrder,
        });
    };

    // 显示攻略详情 Modal (使用正确的字段)
    const showStrategyDetail = async (strategyId?: number) => {
        if (!strategyId) return;
        setLoading(true);
        try {
            const response = await adminAPI.getStrategyById(strategyId);
            if(response.data.success) {
                setSelectedStrategy(response.data.data);
                setDetailModalVisible(true);
            } else {
                message.error(response.data.message || '获取攻略详情失败');
            }
        } catch (error: any) {
            console.error('获取攻略详情异常:', error);
            message.error(`获取攻略详情失败: ${error.response?.data?.message || error.message || '未知错误'}`);
        } finally {
            setLoading(false);
        }
    };

    // 打开编辑 Modal (使用 city 字段)
    const handleEditStrategy = (strategy: Strategy) => {
        setCurrentStrategy(strategy);
        editForm.setFieldsValue({
            ...strategy,
            city: strategy.city, // 用 city 填充 city 输入框
            tags: typeof strategy.tags === 'string' ? strategy.tags.split(',').join('\n') : '',
        });
        setEditModalVisible(true);
    };

    // 删除攻略
    const handleDeleteStrategy = async (strategyId?: number) => {
         if (!strategyId) return;
        setLoading(true);
        try {
            const response = await adminAPI.deleteStrategy(strategyId);
            if (response.data.success) {
                message.success('攻略删除成功');
                const currentPage = searchParams.page || 1;
                // 简单刷新当前页
                fetchStrategies({ page: currentPage });
            } else {
                message.error(response.data.message || '删除攻略失败');
                setLoading(false); 
            }
        } catch (error: any) {
            console.error('删除攻略异常:', error);
            message.error(`删除攻略失败: ${error.response?.data?.message || error.message || '未知错误'}`);
            setLoading(false);
        }
    };

    // 提交编辑表单 (使用 city 字段)
    const handleEditSubmit = async () => {
        try {
            const values = await editForm.validateFields();
            if (!currentStrategy?.strategy_id) return;
            setLoading(true);

            const { city, ...restValues } = values; // 取出 city
            const updatedStrategyData: Partial<Strategy> = {
                ...restValues,
                city: city, // 将 city 输入框的值赋给 city
                tags: values.tags?.split('\n').map((s:string) => s.trim()).filter(Boolean).join(',') || '',
            };
            delete updatedStrategyData.strategy_id;
            delete updatedStrategyData.author;

            const response = await adminAPI.updateStrategy(currentStrategy.strategy_id, updatedStrategyData);
            if (response.data.success) {
                message.success('攻略信息更新成功');
                setEditModalVisible(false);
                fetchStrategies({ page: searchParams.page });
            } else {
                message.error(response.data.message || '更新攻略信息失败');
                setLoading(false); 
            }
        } catch (error: any) {
            console.error('更新攻略异常:', error);
             if (error.errorFields) {
                 message.error('请检查表单输入项');
            } else {
                 message.error(`更新攻略失败: ${error.response?.data?.message || error.message || '未知错误'}`);
            }
             setLoading(false);
        }
    };

    // 打开新建 Modal
    const handleCreateStrategy = () => {
        createForm.resetFields();
        setCreateModalVisible(true);
    };

    // 提交新建表单 (使用 city 字段)
    const handleCreateSubmit = async () => {
        try {
            const values = await createForm.validateFields();
            setLoading(true);
            const { city, ...restValues } = values; // 取出 city
            const newStrategyData: Partial<Strategy> = { 
                ...restValues,
                city: city, // 将 city 输入框的值赋给 city
                tags: values.tags?.split('\n').map((s:string) => s.trim()).filter(Boolean).join(',') || '',
            };

            const response = await adminAPI.createStrategy(newStrategyData);
            if (response.data.success) {
                message.success('攻略创建成功');
                setCreateModalVisible(false);
                fetchStrategies({ page: 1 });
            } else {
                message.error(response.data.message || '创建攻略失败');
                setLoading(false);
            }
        } catch (error: any) {
            console.error('创建攻略异常:', error);
            if (error.errorFields) {
                 message.error('请检查表单输入项');
            } else {
                 message.error(`创建攻略失败: ${error.response?.data?.message || error.message || '未知错误'}`);
            }
             setLoading(false);
        }
    };

    return (
        <div className="admin-page">
            <Card bordered={false}>
                <Title level={4}>攻略管理</Title>
                
                {/* 搜索表单 (city 字段) */}
                <Form
                    form={searchForm}
                    layout="inline"
                    onFinish={handleSearch}
                    style={{ marginBottom: 20, flexWrap: 'wrap' }}
                >
                    <Form.Item name="keyword">
                        <Input placeholder="标题/内容/摘要" prefix={<SearchOutlined />} allowClear style={{ width: 180 }} />
                    </Form.Item>
                    <Form.Item name="userId">
                        <InputNumber placeholder="作者用户ID" style={{ width: 120 }}/>
                    </Form.Item>
                    <Form.Item name="city"> 
                         <Input placeholder="目的地/城市" allowClear style={{ width: 140 }}/>
                    </Form.Item>
                     <Form.Item name="status">
                        <Select placeholder="状态" allowClear style={{ width: 100 }}>
                            {Object.entries(strategyStatusMap).map(([key, { text }]) => (
                                <Option key={key} value={key}>{text}</Option>
                            ))}
                        </Select>
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
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateStrategy}>
                        添加攻略
                    </Button>
                    <Button icon={<ReloadOutlined />} onClick={() => fetchStrategies(searchParams)} disabled={loading}>
                        刷新
                    </Button>
                </Space>

                {/* 攻略表格 (使用 strategy_id) */}
                <Spin spinning={loading}>
                    <Table
                        rowKey="strategy_id"
                        columns={columns}
                        dataSource={strategies}
                        pagination={pagination}
                        loading={loading}
                        onChange={handleTableChange}
                        scroll={{ x: 'max-content' }}
                    />
                </Spin>
            </Card>

             {/* 编辑/新建攻略 Modal (city 字段) */}
            <Modal
                title={currentStrategy ? '编辑攻略' : '添加新攻略'}
                visible={editModalVisible || createModalVisible}
                onOk={currentStrategy ? handleEditSubmit : handleCreateSubmit}
                onCancel={() => {
                    setEditModalVisible(false);
                    setCreateModalVisible(false);
                    setCurrentStrategy(null);
                }}
                confirmLoading={loading}
                destroyOnClose
                width={800} 
                maskClosable={false}
            >
                 {/* 编辑/新建表单内容 - 需要包含 title, content, cover_image, city, tags, type, status 等字段 */}
                <Form 
                    form={currentStrategy ? editForm : createForm} 
                    layout="vertical"
                >
                    <Form.Item name="title" label="标题" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                     <Form.Item name="city" label="目的地/城市">
                        <Input />
                    </Form.Item>
                     <Form.Item name="status" label="状态">
                         <Select defaultValue="draft">
                             {Object.entries(strategyStatusMap).map(([key, { text }]) => (
                                <Option key={key} value={key}>{text}</Option>
                            ))}
                         </Select>
                     </Form.Item>
                     <Form.Item name="cover_image" label="封面图片 URL">
                         <Input placeholder="攻略列表和详情页展示的主图 URL"/>
                     </Form.Item>
                     <Form.Item name="tags" label="标签 (每行一个)">
                         <TextArea rows={2} placeholder="输入多个标签，每行一个"/>
                     </Form.Item>
                     {/* 富文本编辑器 - 需要引入并配置 Quill 或其他编辑器 */}
                     <Form.Item name="content" label="内容" rules={[{ required: true }]}>
                         <TextArea rows={10} placeholder="请输入攻略正文... (此处应为富文本编辑器)"/>
                     </Form.Item>
                     {/* 如果允许后台指定作者 */}
                     {/* <Form.Item name="userId" label="作者用户 ID (可选)">
                         <InputNumber style={{ width: '100%' }} />
                     </Form.Item> */}
                </Form>
            </Modal>

             {/* 攻略详情 Modal (使用正确的字段) */}
            <Modal
                title={`攻略详情 (ID: ${selectedStrategy?.strategy_id})`}
                visible={detailModalVisible}
                onCancel={() => setDetailModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setDetailModalVisible(false)}>
                        关闭
                    </Button>,
                ]}
                width={800}
                bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}
            >
                {selectedStrategy ? (
                    <Descriptions bordered column={1} size="small">
                         <Descriptions.Item label="ID">{selectedStrategy.strategy_id}</Descriptions.Item>
                         <Descriptions.Item label="标题">{selectedStrategy.title}</Descriptions.Item>
                         <Descriptions.Item label="作者">{selectedStrategy.author?.username || 'N/A'} (ID: {selectedStrategy.user_id})</Descriptions.Item>
                         <Descriptions.Item label="目的地/城市">{selectedStrategy.city || 'N/A'}</Descriptions.Item>
                         <Descriptions.Item label="状态">
                            <Tag color={strategyStatusMap[selectedStrategy.status || '']?.color || 'default'}>
                                {strategyStatusMap[selectedStrategy.status || '']?.text || selectedStrategy.status}
                            </Tag>
                         </Descriptions.Item>
                         <Descriptions.Item label="标签">{(typeof selectedStrategy.tags === 'string' ? selectedStrategy.tags.split(',').map(tag => <Tag key={tag}>{tag}</Tag>) : null ) || '无'}</Descriptions.Item>
                         <Descriptions.Item label="浏览量">{selectedStrategy.view_count ?? 0}</Descriptions.Item>
                         <Descriptions.Item label="点赞数">{selectedStrategy.like_count ?? 0}</Descriptions.Item>
                         <Descriptions.Item label="创建时间">{moment(selectedStrategy.created_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
                         <Descriptions.Item label="更新时间">{selectedStrategy.updated_at ? moment(selectedStrategy.updated_at).format('YYYY-MM-DD HH:mm:ss') : '-'}</Descriptions.Item>
                         <Descriptions.Item label="内容预览">
                             <div dangerouslySetInnerHTML={{ __html: selectedStrategy.content || '' }} />
                         </Descriptions.Item>
                     </Descriptions>
                ) : (
                    <p>无法加载攻略详情。</p>
                )}
            </Modal>
        </div>
    );
};

export default StrategyManagement; 