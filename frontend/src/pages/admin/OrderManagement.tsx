import React, { useState, useEffect, useCallback } from 'react';
import {
    Table, Button, Space, Input, Select, Form, 
    Modal, message, Popconfirm, Card, Typography, Spin, 
    Tag, DatePicker, InputNumber, Tooltip, Descriptions
} from 'antd';
import { 
    SearchOutlined, ReloadOutlined, EyeOutlined 
} from '@ant-design/icons';
import moment from 'moment';
import adminAPI from '../../api/admin';
import { Booking, BookingStatus } from '../../api/admin'; // 使用 admin.ts 中定义的类型
import { User } from '../../@types/user'; // <--- 添加对 User 类型的导入
import type { OrderSearchParams } from '../../api/admin';
import type { TablePaginationConfig, SorterResult, FilterValue, TableCurrentDataSource } from 'antd/es/table/interface';
import './AdminPages.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// 订单状态显示映射
const statusMap: Record<BookingStatus, { color: string; text: string }> = {
    pending: { color: 'orange', text: '待处理' },
    confirmed: { color: 'blue', text: '已确认' },
    completed: { color: 'green', text: '已完成' },
    cancelled: { color: 'red', text: '已取消' }
};

/**
 * 订单管理页面
 */
const OrderManagement: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [orders, setOrders] = useState<Booking[]>([]);
    const [pagination, setPagination] = useState<TablePaginationConfig>({
        current: 1,
        pageSize: 10,
        total: 0,
        showSizeChanger: true,
        showTotal: (total) => `总共 ${total} 条记录`,
    });
    const [searchParams, setSearchParams] = useState<OrderSearchParams>({});
    const [searchForm] = Form.useForm();
    const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false);
    const [selectedOrder, setSelectedOrder] = useState<Booking | null>(null);
    const [statusUpdateLoading, setStatusUpdateLoading] = useState<Record<number, boolean>>({}); // 单独记录状态更新loading

    // 加载订单数据的函数
    const fetchOrders = useCallback(async (params: OrderSearchParams = {}) => {
        setLoading(true);
        try {
            const queryParams: OrderSearchParams = {
                page: pagination.current,
                pageSize: pagination.pageSize,
                sortBy: searchParams.sortBy,
                sortOrder: searchParams.sortOrder,
                userId: searchParams.userId,
                status: searchParams.status,
                startDate: searchParams.startDate,
                endDate: searchParams.endDate,
                ...params,
            };

            Object.keys(queryParams).forEach(key => {
                const typedKey = key as keyof OrderSearchParams;
                if (queryParams[typedKey] === '' || queryParams[typedKey] === null || queryParams[typedKey] === undefined) {
                    delete queryParams[typedKey];
                }
            });

            console.log('Fetching orders with params:', queryParams);
            const response = await adminAPI.getOrders(queryParams);

            if (response.data.success) {
                setOrders(response.data.data);
                setPagination(prev => ({
                    ...prev,
                    current: response.data.meta.page,
                    pageSize: response.data.meta.pageSize,
                    total: response.data.meta.total,
                }));
                setSearchParams({
                    page: response.data.meta.page,
                    pageSize: response.data.meta.pageSize,
                    userId: queryParams.userId,
                    status: queryParams.status,
                    startDate: queryParams.startDate,
                    endDate: queryParams.endDate,
                    sortBy: queryParams.sortBy,
                    sortOrder: queryParams.sortOrder,
                });
            } else {
                message.error(response.data.message || '获取订单列表失败');
            }
        } catch (error: any) {
            console.error('获取订单列表异常:', error);
            message.error(`获取订单列表失败: ${error.response?.data?.message || error.message || '未知错误'}`);
        } finally {
            setLoading(false);
        }
    }, [pagination.current, pagination.pageSize]); // 依赖项

    // 初始加载
    useEffect(() => {
        fetchOrders({ page: 1 });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 处理订单状态更新
    const handleUpdateStatus = async (bookingId: number, newStatus: BookingStatus) => {
        setStatusUpdateLoading(prev => ({ ...prev, [bookingId]: true }));
        try {
            const response = await adminAPI.updateOrderStatus(bookingId, { status: newStatus });
            if (response.data.success) {
                message.success('订单状态更新成功');
                // 更新本地数据或重新获取当前页
                setOrders(prevOrders => prevOrders.map(order => 
                    order.booking_id === bookingId ? { ...order, status: newStatus } : order
                ));
                // 或者 fetchOrders({ page: searchParams.page }); 
            } else {
                message.error(response.data.message || '更新订单状态失败');
            }
        } catch (error: any) {
             console.error('更新订单状态异常:', error);
            message.error(`更新订单状态失败: ${error.response?.data?.message || error.message || '未知错误'}`);
        } finally {
             setStatusUpdateLoading(prev => ({ ...prev, [bookingId]: false }));
        }
    };

    // 表格列定义
    const columns = [
        {
            title: '订单ID',
            dataIndex: 'booking_id',
            key: 'booking_id',
            sorter: true,
        },
        {
            title: '用户信息',
            dataIndex: 'user',
            key: 'user',
            render: (user?: Pick<User, 'user_id' | 'username' | 'email'>) => (
                user ? (
                    <Tooltip title={`ID: ${user.user_id}`}>
                        <div>{user.username}</div>
                        <div style={{ color: 'gray', fontSize: '12px' }}>{user.email}</div>
                    </Tooltip>
                ) : '-'
            ),
            // 用户信息列通常不直接排序，如果需要按用户名/邮箱排序，后端需支持
        },
        // 可以添加关联项目信息列 (item_id, item_type)，但需要后端在getOrders时返回更多信息
        // {
        //     title: '关联项目',
        //     key: 'item',
        //     render: (text: any, record: Booking) => 
        //         `${record.item_type || 'N/A'} (ID: ${record.item_id || 'N/A'})`
        // },
        {
            title: '总金额 (¥)',
            dataIndex: 'total_amount',
            key: 'total_amount',
            render: (amount: number) => `¥ ${(amount !== null && amount !== undefined) ? Number(amount).toFixed(2) : '0.00'}`,
            sorter: true,
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            render: (status: BookingStatus, record: Booking) => (
                <Select 
                    defaultValue={status}
                    style={{ width: 100 }}
                    onChange={(value) => handleUpdateStatus(record.booking_id, value as BookingStatus)}
                    loading={statusUpdateLoading[record.booking_id]}
                    disabled={loading || statusUpdateLoading[record.booking_id]}
                >
                    {Object.entries(statusMap).map(([key, { text }]) => (
                        <Option key={key} value={key}>{text}</Option>
                    ))}
                </Select>
            ),
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
            render: (text: string, record: Booking) => (
                <Space size="small">
                    <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => showOrderDetail(record.booking_id)}
                    >
                        详情
                    </Button>
                    {/* 可能需要其他操作，如备注等 */}
                </Space>
            )
        }
    ];

    // 处理表格变化
    const handleTableChange = (
        newPagination: TablePaginationConfig,
        filters: Record<string, FilterValue | null>,
        sorter: SorterResult<Booking> | SorterResult<Booking>[],
        extra: TableCurrentDataSource<Booking>
    ) => {
         const sortParams: Partial<OrderSearchParams> = {};
        if (!Array.isArray(sorter)) {
            if (sorter.field && sorter.order) {
                sortParams.sortBy = sorter.field as string;
                sortParams.sortOrder = sorter.order === 'ascend' ? 'asc' : 'desc';
            } else {
                sortParams.sortBy = undefined;
                sortParams.sortOrder = undefined;
            }
        }
        
        fetchOrders({
            page: newPagination.current,
            pageSize: newPagination.pageSize,
            sortBy: sortParams.sortBy,
            sortOrder: sortParams.sortOrder,
            // 保留当前筛选
            userId: searchParams.userId,
            status: searchParams.status,
            startDate: searchParams.startDate,
            endDate: searchParams.endDate,
        });
    };

    // 处理搜索
    const handleSearch = (values: any) => {
        const { dateRange, ...restValues } = values;
        const searchData: OrderSearchParams = {
            ...restValues,
            startDate: dateRange?.[0]?.format('YYYY-MM-DD'),
            endDate: dateRange?.[1]?.format('YYYY-MM-DD'),
            page: 1, // 重置到第一页
        };
        fetchOrders(searchData);
    };

    // 重置搜索
    const handleResetSearch = () => {
        searchForm.resetFields();
        fetchOrders({ 
            page: 1, 
            userId: undefined,
            status: undefined,
            startDate: undefined,
            endDate: undefined,
            // 保留排序
            sortBy: searchParams.sortBy,
            sortOrder: searchParams.sortOrder,
        });
    };

    // 显示订单详情 Modal
    const showOrderDetail = async (bookingId: number) => {
        setLoading(true); // 使用全局 loading
        try {
            const response = await adminAPI.getOrderById(bookingId);
            if(response.data.success) {
                setSelectedOrder(response.data.data);
                setDetailModalVisible(true);
            } else {
                message.error(response.data.message || '获取订单详情失败');
            }
        } catch (error: any) {
            console.error('获取订单详情异常:', error);
            message.error(`获取订单详情失败: ${error.response?.data?.message || error.message || '未知错误'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-page">
            <Card bordered={false}>
                <Title level={4}>订单管理</Title>

                 {/* 搜索表单 */}
                <Form
                    form={searchForm}
                    layout="inline"
                    onFinish={handleSearch}
                    style={{ marginBottom: 20, flexWrap: 'wrap' }}
                >
                    <Form.Item name="userId">
                        <InputNumber placeholder="用户ID" style={{ width: 120 }}/>
                    </Form.Item>
                     <Form.Item name="status">
                        <Select placeholder="订单状态" allowClear style={{ width: 120 }}>
                             {Object.entries(statusMap).map(([key, { text }]) => (
                                <Option key={key} value={key}>{text}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="dateRange">
                        <RangePicker placeholder={['开始日期', '结束日期']} />
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
                    <Button icon={<ReloadOutlined />} onClick={() => fetchOrders(searchParams)} disabled={loading}>
                        刷新
                    </Button>
                </Space>

                 {/* 订单表格 */}
                <Spin spinning={loading}>
                    <Table
                        rowKey="booking_id"
                        columns={columns}
                        dataSource={orders}
                        pagination={pagination}
                        loading={loading}
                        onChange={handleTableChange}
                        scroll={{ x: 'max-content' }}
                    />
                </Spin>
            </Card>

             {/* 订单详情 Modal */}
            <Modal
                title={`订单详情 (ID: ${selectedOrder?.booking_id})`}
                visible={detailModalVisible}
                onCancel={() => setDetailModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setDetailModalVisible(false)}>
                        关闭
                    </Button>,
                ]}
                width={600}
            >
                {selectedOrder ? (
                    <Descriptions bordered column={1} size="small">
                        <Descriptions.Item label="订单ID">{selectedOrder.booking_id}</Descriptions.Item>
                        <Descriptions.Item label="用户ID">{selectedOrder.user_id}</Descriptions.Item>
                        <Descriptions.Item label="用户名">{selectedOrder.user?.username || 'N/A'}</Descriptions.Item>
                        <Descriptions.Item label="用户邮箱">{selectedOrder.user?.email || 'N/A'}</Descriptions.Item>
                        <Descriptions.Item label="订单状态">
                            <Tag color={statusMap[selectedOrder.status]?.color}>
                                {statusMap[selectedOrder.status]?.text || selectedOrder.status}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="总金额">¥ {selectedOrder.total_amount?.toFixed(2)}</Descriptions.Item>
                        <Descriptions.Item label="创建时间">{moment(selectedOrder.created_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
                        <Descriptions.Item label="更新时间">{selectedOrder.updated_at ? moment(selectedOrder.updated_at).format('YYYY-MM-DD HH:mm:ss') : '-'}</Descriptions.Item>
                        <Descriptions.Item label="备注">{selectedOrder.remarks || '-'}</Descriptions.Item>
                         {/* 可以根据需要展示更多关联信息，如 items */}
                    </Descriptions>
                ) : (
                    <p>无法加载订单详情。</p>
                )}
            </Modal>

        </div>
    );
};

export default OrderManagement; 