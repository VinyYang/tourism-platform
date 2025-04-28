import React, { useState, useEffect, useCallback } from 'react';
import {
    Table, Button, Space, Input, Select, Form,
    Modal, message, Popconfirm, Card, Typography, Spin,
    Tag, Rate, InputNumber, Tooltip, Avatar,
    Descriptions
} from 'antd';
import {
    SearchOutlined, DeleteOutlined, ReloadOutlined, EditOutlined // Edit for Reply
} from '@ant-design/icons';
import moment from 'moment';
import adminAPI from '../../api/admin';
import { Review, ReviewStatus } from '../../api/admin'; // 使用 admin.ts 中定义的类型
import { User } from '../../@types/user';
import type { ReviewSearchParams } from '../../api/admin';
import type { TablePaginationConfig, SorterResult, FilterValue, TableCurrentDataSource } from 'antd/es/table/interface';
import './AdminPages.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// 评论状态显示映射
const reviewStatusMap: Record<ReviewStatus, { color: string; text: string }> = {
    pending: { color: 'orange', text: '待审核' },
    approved: { color: 'green', text: '已通过' },
    rejected: { color: 'red', text: '已拒绝' },
};

/**
 * 评论管理页面
 */
const ReviewManagement: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [pagination, setPagination] = useState<TablePaginationConfig>({
        current: 1,
        pageSize: 10,
        total: 0,
        showSizeChanger: true,
        showTotal: (total) => `总共 ${total} 条记录`,
    });
    const [searchParams, setSearchParams] = useState<ReviewSearchParams>({});
    const [searchForm] = Form.useForm();
    const [replyModalVisible, setReplyModalVisible] = useState<boolean>(false);
    const [currentReview, setCurrentReview] = useState<Review | null>(null);
    const [replyForm] = Form.useForm();
    const [statusUpdateLoading, setStatusUpdateLoading] = useState<Record<number, boolean>>({});

    // 加载评论数据的函数
    const fetchReviews = useCallback(async (params: ReviewSearchParams = {}) => {
        setLoading(true);
        try {
            const queryParams: ReviewSearchParams = {
                page: pagination.current,
                pageSize: pagination.pageSize,
                sortBy: searchParams.sortBy,
                sortOrder: searchParams.sortOrder,
                userId: searchParams.userId,
                itemType: searchParams.itemType,
                itemId: searchParams.itemId,
                status: searchParams.status,
                minRating: searchParams.minRating,
                maxRating: searchParams.maxRating,
                ...params,
            };

            Object.keys(queryParams).forEach(key => {
                const typedKey = key as keyof ReviewSearchParams;
                if (queryParams[typedKey] === '' || queryParams[typedKey] === null || queryParams[typedKey] === undefined) {
                    delete queryParams[typedKey];
                }
            });

            console.log('Fetching reviews with params:', queryParams);
            const response = await adminAPI.getReviews(queryParams);

            if (response.data.success) {
                setReviews(response.data.data);
                setPagination(prev => ({
                    ...prev,
                    current: response.data.meta.page,
                    pageSize: response.data.meta.pageSize,
                    total: response.data.meta.total,
                }));
                setSearchParams(queryParams); // Store current params
            } else {
                message.error(response.data.message || '获取评论列表失败');
            }
        } catch (error: any) {
            console.error('获取评论列表异常:', error);
            message.error(`获取评论列表失败: ${error.response?.data?.message || error.message || '未知错误'}`);
        } finally {
            setLoading(false);
        }
    }, [pagination.current, pagination.pageSize]); // Dependencies

    // 初始加载
    useEffect(() => {
        fetchReviews({ page: 1 });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 处理评论状态和回复更新
    const handleUpdateReview = async (reviewId: number, status?: ReviewStatus, admin_reply?: string) => {
        setStatusUpdateLoading(prev => ({ ...prev, [reviewId]: true }));
        const updateData: { status?: ReviewStatus; admin_reply?: string } = {};
        if (status) updateData.status = status;
        if (admin_reply !== undefined) updateData.admin_reply = admin_reply; // Allow empty reply

        try {
            const response = await adminAPI.updateReviewStatus(reviewId, updateData);
            if (response.data.success) {
                message.success('评论更新成功');
                 // Optimistic update or refetch
                setReviews(prevReviews => prevReviews.map(review =>
                    review.review_id === reviewId
                        ? { ...review, ...updateData } // Update local state
                        : review
                ));
                if (replyModalVisible) {
                    setReplyModalVisible(false); // Close modal if open
                }
            } else {
                message.error(response.data.message || '更新评论失败');
            }
        } catch (error: any) {
             console.error('更新评论异常:', error);
            message.error(`更新评论失败: ${error.response?.data?.message || error.message || '未知错误'}`);
        } finally {
             setStatusUpdateLoading(prev => ({ ...prev, [reviewId]: false }));
        }
    };

     // 删除评论
    const handleDeleteReview = async (reviewId: number) => {
        setLoading(true);
        try {
            const response = await adminAPI.deleteReview(reviewId);
            if (response.data.success) {
                message.success('评论删除成功');
                const currentPage = searchParams.page || 1;
                if (reviews.length === 1 && currentPage > 1) {
                    fetchReviews({ page: currentPage - 1 });
                } else {
                    fetchReviews({ page: currentPage });
                }
            } else {
                message.error(response.data.message || '删除评论失败');
                setLoading(false);
            }
        } catch (error: any) {
            console.error('删除评论异常:', error);
            message.error(`删除评论失败: ${error.response?.data?.message || error.message || '未知错误'}`);
            setLoading(false);
        }
    };

    // 打开回复 Modal
    const showReplyModal = (review: Review) => {
        setCurrentReview(review);
        replyForm.setFieldsValue({ admin_reply: review.admin_reply || '' });
        setReplyModalVisible(true);
    };

     // 提交回复
    const handleReplySubmit = async () => {
        if (!currentReview) return;
        try {
            const values = await replyForm.validateFields();
            handleUpdateReview(currentReview.review_id, undefined, values.admin_reply);
        } catch (error) {
             console.log('回复表单验证失败:', error);
        }
    };

    // 表格列定义
    const columns = [
        {
            title: 'ID',
            dataIndex: 'review_id',
            key: 'review_id',
            sorter: true,
        },
         {
            title: '用户',
            dataIndex: 'user',
            key: 'user',
            render: (user?: Pick<User, 'user_id' | 'username' | 'avatar'>) => (
                 user ? (
                    <Tooltip title={`ID: ${user.user_id}`}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar src={user.avatar || `https://placehold.co/30?text=${user.username?.charAt(0)}`} size="small" style={{ marginRight: 8 }} />
                            <Text>{user.username}</Text>
                        </div>
                    </Tooltip>
                 ) : '-'
            ),
        },
        {
            title: '评分',
            dataIndex: 'rating',
            key: 'rating',
            render: (rating: number) => <Rate disabled defaultValue={rating} style={{ fontSize: 14 }} />,
            sorter: true,
        },
        {
            title: '内容',
            dataIndex: 'content',
            key: 'content',
            ellipsis: true, // 超出显示省略号
            render: (text: string) => (
                <Tooltip title={text}>
                    <div style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {text}
                    </div>
                </Tooltip>
            )
        },
         {
            title: '关联项目',
            key: 'item',
            render: (text: any, record: Review) =>
                `${record.item_type || 'N/A'} (ID: ${record.item_id || 'N/A'})`
            // 关联项目的名称可能需要后端 getReviews API 返回
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
             render: (status: ReviewStatus, record: Review) => (
                <Select
                    defaultValue={status}
                    style={{ width: 100 }}
                    onChange={(value) => handleUpdateReview(record.review_id, value as ReviewStatus, undefined)}
                    loading={statusUpdateLoading[record.review_id]}
                    disabled={loading || statusUpdateLoading[record.review_id]}
                >
                    {Object.entries(reviewStatusMap).map(([key, { text }]) => (
                        <Option key={key} value={key}>{text}</Option>
                    ))}
                </Select>
            ),
            sorter: true,
        },
         {
            title: '管理员回复',
            dataIndex: 'admin_reply',
            key: 'admin_reply',
            ellipsis: true,
             render: (text: string, record: Review) => (
                 text ? (
                    <Tooltip title={text}>
                        <Text style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}>{text}</Text>
                    </Tooltip>
                 ) : (
                     <Button type="link" size="small" onClick={() => showReplyModal(record)} icon={<EditOutlined />}>
                         回复
                     </Button>
                 )
             )
        },
        {
            title: '评论时间',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (text?: string) => text ? moment(text).format('YYYY-MM-DD HH:mm') : '-',
            sorter: true,
        },
        {
            title: '操作',
            key: 'action',
            render: (text: string, record: Review) => (
                <Space size="small">
                    <Button type="link" size="small" onClick={() => showReplyModal(record)}>
                        {record.admin_reply ? '编辑回复' : '回复'}
                    </Button>
                    <Popconfirm
                        title="确定要删除此评论吗？"
                        onConfirm={() => handleDeleteReview(record.review_id)}
                        okText="确定"
                        cancelText="取消"
                    >
                        <Button type="link" danger size="small">
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
        sorter: SorterResult<Review> | SorterResult<Review>[],
        extra: TableCurrentDataSource<Review>
    ) => {
        const sortParams: Partial<ReviewSearchParams> = {};
        if (!Array.isArray(sorter)) {
            if (sorter.field && sorter.order) {
                // 确认后端 Review 模型支持按哪些字段排序
                const validSortFields = ['review_id', 'rating', 'status', 'created_at'];
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

        fetchReviews({
            page: newPagination.current,
            pageSize: newPagination.pageSize,
            sortBy: sortParams.sortBy,
            sortOrder: sortParams.sortOrder,
            // 保留筛选条件
            userId: searchParams.userId,
            itemType: searchParams.itemType,
            itemId: searchParams.itemId,
            status: searchParams.status,
            minRating: searchParams.minRating,
            maxRating: searchParams.maxRating,
        });
    };

    // 处理搜索
    const handleSearch = (values: any) => {
        fetchReviews({ ...values, page: 1 });
    };

    // 重置搜索
    const handleResetSearch = () => {
        searchForm.resetFields();
        fetchReviews({
            page: 1,
            userId: undefined,
            itemType: undefined,
            itemId: undefined,
            status: undefined,
            minRating: undefined,
            maxRating: undefined,
            sortBy: searchParams.sortBy,
            sortOrder: searchParams.sortOrder,
        });
    };

    return (
        <div className="admin-page">
            <Card bordered={false}>
                <Title level={4}>评论管理</Title>

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
                     <Form.Item name="itemType">
                        <Select placeholder="项目类型" allowClear style={{ width: 120 }}>
                            <Option value="scenic">景点</Option>
                            <Option value="hotel">酒店</Option>
                            <Option value="strategy">攻略</Option>
                        </Select>
                    </Form.Item>
                     <Form.Item name="itemId">
                        <InputNumber placeholder="项目ID" style={{ width: 120 }}/>
                    </Form.Item>
                     <Form.Item name="status">
                        <Select placeholder="状态" allowClear style={{ width: 120 }}>
                            {Object.entries(reviewStatusMap).map(([key, { text }]) => (
                                <Option key={key} value={key}>{text}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                     <Form.Item name="minRating">
                         <InputNumber placeholder="最低评分" min={1} max={5} style={{ width: 100 }}/>
                     </Form.Item>
                     <Form.Item name="maxRating">
                          <InputNumber placeholder="最高评分" min={1} max={5} style={{ width: 100 }}/>
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
                    <Button icon={<ReloadOutlined />} onClick={() => fetchReviews(searchParams)} disabled={loading}>
                        刷新
                    </Button>
                    {/* 可以添加批量审核/删除按钮 */}
                </Space>

                {/* 评论表格 */}
                 <Spin spinning={loading}>
                    <Table
                        rowKey="review_id" // 假设主键是 review_id
                        columns={columns}
                        dataSource={reviews}
                        pagination={pagination}
                        loading={loading}
                        onChange={handleTableChange}
                        scroll={{ x: 'max-content' }}
                    />
                </Spin>
            </Card>

             {/* 回复 Modal */}
             <Modal
                title={`回复评论 (ID: ${currentReview?.review_id})`}
                visible={replyModalVisible}
                onOk={handleReplySubmit}
                onCancel={() => setReplyModalVisible(false)}
                confirmLoading={statusUpdateLoading[currentReview?.review_id || 0]}
                destroyOnClose
             >
                 <Form form={replyForm} layout="vertical">
                     <Descriptions bordered column={1} size="small" style={{ marginBottom: 16 }}>
                          <Descriptions.Item label="用户">{currentReview?.user?.username}</Descriptions.Item>
                          <Descriptions.Item label="评分"><Rate disabled defaultValue={currentReview?.rating} style={{ fontSize: 14 }}/></Descriptions.Item>
                          <Descriptions.Item label="评论内容">{currentReview?.content}</Descriptions.Item>
                     </Descriptions>
                     <Form.Item
                         name="admin_reply"
                         label="管理员回复"
                         rules={[{ required: true, message: '请输入回复内容' }]}
                      >
                         <TextArea rows={4} placeholder="输入对用户评论的回复..." />
                     </Form.Item>
                 </Form>
             </Modal>

        </div>
    );
};

export default ReviewManagement;
