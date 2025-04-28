import React, { useState, useEffect, useCallback } from 'react';
import { 
    Table, Tag, Button, Space, Input, Select, Form, 
    Modal, message, Popconfirm, Card, Typography, Spin,
    Row, Col, DatePicker, Avatar
} from 'antd';
import { 
    SearchOutlined, PlusOutlined, EditOutlined, 
    DeleteOutlined, UserOutlined, ExportOutlined, ReloadOutlined
} from '@ant-design/icons';
import moment from 'moment';
import adminAPI from '../../api/admin'; // 引入 adminAPI
import { User, UserStatus, UserRole } from '../../@types/user'; // 引入 User, UserStatus 和 UserRole 类型
import type { TablePaginationConfig, SorterResult, FilterValue, TableCurrentDataSource } from 'antd/es/table/interface'; // 引入更多 Antd 类型
import type { UserSearchParams as AdminUserSearchParams } from '../../api/admin'; // 重命名导入避免冲突
import './UserManagement.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker; // 保持，虽然当前搜索未使用，但可能后续添加

// 用户状态标签颜色和文本映射 (可以保留，但可能需要根据后端实际状态调整)
const statusMap: Record<string, { color: string; text: string }> = {
    // 注意：后端User模型似乎没有status字段，这里可能需要调整或移除
    active: { color: 'green', text: '正常' },
    inactive: { color: 'orange', text: '未激活' },
    locked: { color: 'red', text: '已锁定' }
};

// 用户角色映射 (保持，与后端模型一致)
const roleMap: Record<string, string> = {
    admin: '管理员',
    user: '普通用户',
    // 可以根据需要添加其他角色
};

// 用户状态显示映射
const userStatusMap: Record<UserStatus, { color: string; text: string }> = {
    active: { color: 'green', text: '正常' },
    muted: { color: 'orange', text: '已禁言' },
    // banned: { color: 'red', text: '已封禁' }, // 如果未来添加封禁状态
};

// 搜索参数类型 (与 adminAPI.getUsers 的参数一致)
interface UserSearchParams {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    keyword?: string;
    role?: string;
    status?: UserStatus;
    // 可以添加注册时间范围等其他搜索条件
    // registerDateStart?: string;
    // registerDateEnd?: string;
}


/**
 * 用户管理页面
 */
const UserManagement: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [users, setUsers] = useState<User[]>([]); // 使用 User 类型
    // 移除 filteredUsers，数据过滤由后端完成
    const [pagination, setPagination] = useState<TablePaginationConfig>({ // 使用 Antd 类型
        current: 1,
        pageSize: 10,
        total: 0,
        showSizeChanger: true,
        showTotal: (total) => `总共 ${total} 条记录`,
    });
    const [searchParams, setSearchParams] = useState<UserSearchParams>({}); // 存储搜索和分页排序参数
    const [searchForm] = Form.useForm();
    const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
    const [createModalVisible, setCreateModalVisible] = useState<boolean>(false); // 新增用户 Modal
    const [editForm] = Form.useForm();
    const [createForm] = Form.useForm(); // 新增用户 Form
    const [currentUser, setCurrentUser] = useState<User | null>(null); // 编辑中的用户
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]); // 保持，用于批量操作（如果实现）

    // 加载用户数据的函数
    const fetchUsers = useCallback(async (params: UserSearchParams = {}) => {
        setLoading(true);
        try {
            // 合并分页和排序参数
            // 优先使用传入的 params (来自搜索/分页/排序变化)，然后是当前的 searchParams (用于保留未在 params 中指定的条件，如 keyword/role)，最后是默认的分页
            const queryParams: UserSearchParams = {
                page: pagination.current, // 默认页码
                pageSize: pagination.pageSize, // 默认大小
                sortBy: searchParams.sortBy, // 保留当前排序 (可能被 params 覆盖)
                sortOrder: searchParams.sortOrder, // 保留当前排序 (可能被 params 覆盖)
                keyword: searchParams.keyword, // 保留当前搜索 (可能被 params 覆盖)
                role: searchParams.role, // 保留当前角色 (可能被 params 覆盖)
                status: searchParams.status, // 保留当前状态 (可能被 params 覆盖)
                ...params, // 应用最新的参数 (会覆盖上面的默认值和保留值)
            };

            // 过滤掉空的搜索条件
            Object.keys(queryParams).forEach(key => {
                const typedKey = key as keyof UserSearchParams;
                if (queryParams[typedKey] === '' || queryParams[typedKey] === null || queryParams[typedKey] === undefined) {
                    delete queryParams[typedKey];
                }
            });


            console.log('Fetching users with params:', queryParams); // 调试日志
            const response = await adminAPI.getUsers(queryParams);

            if (response.data.success) {
                setUsers(response.data.data);
            setPagination(prev => ({
                ...prev,
                    current: response.data.meta.page,
                    pageSize: response.data.meta.pageSize,
                    total: response.data.meta.total,
                }));
                // 更新全局搜索参数状态，存储当前生效的参数 (包括分页)
                // 注意：这里存储的是 *实际使用的* queryParams，而不是传入的 params
                setSearchParams({
                    page: response.data.meta.page,
                    pageSize: response.data.meta.pageSize,
                    keyword: queryParams.keyword,
                    role: queryParams.role,
                    status: queryParams.status,
                    sortBy: queryParams.sortBy,
                    sortOrder: queryParams.sortOrder,
                });
            } else {
                message.error(response.data.message || '获取用户列表失败');
            }
        } catch (error: any) {
            console.error('获取用户列表异常:', error);
            message.error(`获取用户列表失败: ${error.response?.data?.message || error.message || '未知错误'}`);
        } finally {
            setLoading(false);
        }
    }, [pagination.current, pagination.pageSize]); 

    // 组件加载时获取初始数据
    useEffect(() => {
        fetchUsers({ page: 1 }); // 初始加载第一页
         // eslint-disable-next-line react-hooks/exhaustive-deps 
         // 忽略 fetchUsers 的变化，确保只在挂载时运行一次
    }, []);

    // 新增：处理角色变更
    const handleChangeRole = async (user: User, newRole: UserRole) => {
        if (user.role === newRole) return; // 角色未改变
        setLoading(true);
        try {
            const response = await adminAPI.updateUser(user.user_id, { role: newRole });
            if (response.data.success) {
                message.success(`用户 ${user.username} 角色已更新为 ${roleMap[newRole]}`);
                fetchUsers({ page: searchParams.page }); // 刷新当前页
            } else {
                message.error(response.data.message || '角色更新失败');
                setLoading(false);
            }
        } catch (error: any) {
            console.error('更新角色异常:', error);
            message.error(`更新角色失败: ${error.response?.data?.message || error.message || '未知错误'}`);
            setLoading(false);
        }
    };

    // 新增：处理状态变更 (禁言/解禁)
    const handleChangeStatus = async (user: User, newStatus: UserStatus) => {
        if (user.status === newStatus) return;
        setLoading(true);
        try {
            const response = await adminAPI.updateUser(user.user_id, { status: newStatus });
            if (response.data.success) {
                message.success(`用户 ${user.username} 状态已更新为 ${userStatusMap[newStatus].text}`);
                fetchUsers({ page: searchParams.page });
            } else {
                message.error(response.data.message || '状态更新失败');
                setLoading(false);
            }
        } catch (error: any) {
            console.error('更新状态异常:', error);
            message.error(`更新状态失败: ${error.response?.data?.message || error.message || '未知错误'}`);
            setLoading(false);
        }
    };

    // 表格列定义 (根据后端User模型调整)
    const columns = [
        {
            title: 'ID',
            dataIndex: 'user_id', // 改回 user_id
            key: 'user_id',
            sorter: true, // 开启后端排序
        },
        {
            title: '用户名',
            dataIndex: 'username',
            key: 'username',
            render: (text: string, record: User) => ( // 使用 User 类型
                <div className="user-info">
                    <Avatar 
                        src={record.avatar || `https://placehold.co/40?text=${text.charAt(0)}`} // 使用 Avatar 组件
                        alt={text}
                        className="user-avatar"
                    />
                    <div>
                        <div>{text}</div>
                        {/* 后端似乎没有nickname字段，暂时移除 */}
                        {/* <div className="user-nickname">{record.nickname}</div> */}
                    </div>
                </div>
            )
        },
        {
            title: '邮箱', // 将联系方式拆分
            dataIndex: 'email',
            key: 'email',
        },
        // { // 后端似乎没有phone字段，暂时移除
        //     title: '手机号',
        //     dataIndex: 'phone',
        //     key: 'phone',
        // },
        {
            title: '角色',
            dataIndex: 'role',
            key: 'role',
            render: (role: UserRole, record: User) => (
                <Select 
                    value={role} 
                    style={{ width: 100 }} 
                    onChange={(value) => handleChangeRole(record, value as UserRole)}
                    disabled={loading} // 禁用 Select 当表格 loading 时
                >
                    <Option value="user">普通用户</Option>
                    <Option value="admin">管理员</Option>
                    <Option value="advisor">顾问</Option> {/* 假设有顾问角色 */} 
                </Select>
            ),
            sorter: true,
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            render: (status?: UserStatus) => (
                status ? (
                    <Tag color={userStatusMap[status]?.color || 'default'}>
                        {userStatusMap[status]?.text || status}
                    </Tag>
                ) : <Tag>未知</Tag> // 处理 status 可能为 undefined 的情况
            ),
            // 暂不对 status 启用后端排序，如果需要，后端需支持
        },
        {
            title: '注册时间',
            dataIndex: 'created_at', // 后端字段为 created_at
            key: 'created_at',
            sorter: true, // 开启后端排序
            render: (text: string) => moment(text).format('YYYY-MM-DD HH:mm:ss'), // 格式化时间
        },
        // { // 后端似乎没有lastLoginTime字段，暂时移除
        //     title: '最后登录',
        //     dataIndex: 'lastLoginTime',
        //     key: 'lastLoginTime',
        //     sorter: true,
        //     render: (text: string) => moment(text).format('YYYY-MM-DD HH:mm:ss'),
        // },
        {
            title: '操作',
            key: 'action',
            render: (text: string, record: User) => (
                <Space size="small">
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleEditUser(record)}
                        size="small"
                    >
                        编辑
                    </Button>
                    {/* 添加禁言/解禁按钮 */} 
                    {record.status === 'active' ? (
                        <Popconfirm
                            title={`确定要禁言用户 ${record.username} 吗？`}
                            onConfirm={() => handleChangeStatus(record, 'muted')}
                            okText="确定"
                            cancelText="取消"
                        >
                             <Button type="text" danger size="small">禁言</Button>
                        </Popconfirm>
                    ) : (
                        <Popconfirm
                            title={`确定要解除用户 ${record.username} 的禁言吗？`}
                            onConfirm={() => handleChangeStatus(record, 'active')}
                             okText="确定"
                            cancelText="取消"
                        >
                             <Button type="text" size="small">解禁</Button>
                         </Popconfirm>
                    )}
                    {/* 保留删除按钮 */} 
                    <Popconfirm
                        title="确定要删除此用户吗？此操作不可恢复。"
                        onConfirm={() => handleDeleteUser(record.user_id)}
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

    // 处理表格变更（分页、筛选、排序）
    const handleTableChange = (
        newPagination: TablePaginationConfig,
        filters: Record<string, FilterValue | null>, // 使用正确的 FilterValue 类型
        sorter: SorterResult<User> | SorterResult<User>[],
        extra: TableCurrentDataSource<User> // 添加 extra 参数
    ) => {
        console.log('Table change:', newPagination, filters, sorter, extra); // 调试日志

        const sortParams: Partial<UserSearchParams> = {};
        if (!Array.isArray(sorter)) { // 处理单个排序
            if (sorter.field && sorter.order) {
                sortParams.sortBy = sorter.field as string;
                sortParams.sortOrder = sorter.order === 'ascend' ? 'asc' : 'desc';
            } else {
                // 清除排序条件 (如果 sorter.order 是 null/undefined)
                sortParams.sortBy = undefined;
                sortParams.sortOrder = undefined;
            }
        } // 暂不处理多列排序

        // 直接调用 fetchUsers，传递新的分页和排序参数
        fetchUsers({
            page: newPagination.current,
            pageSize: newPagination.pageSize,
            sortBy: sortParams.sortBy,
            sortOrder: sortParams.sortOrder,
            // 保留当前的搜索条件
            keyword: searchParams.keyword,
            role: searchParams.role,
            status: searchParams.status,
        });

        // 更新本地分页状态以立即反映UI变化 (可选，因为fetchUsers会更新)
        setPagination(prev => ({
            ...prev,
            current: newPagination.current,
            pageSize: newPagination.pageSize,
        }));
    };

    // 处理搜索
    const handleSearch = (values: any) => {
        console.log('Search values:', values); // 调试日志
        const { keyword, role, status } = values; // 添加 status
        const newSearchParams: UserSearchParams = {
            ...searchParams, // 保留之前的排序等参数
            page: 1, // 搜索时重置到第一页
            keyword: keyword?.trim() || undefined,
            role: role || undefined,
            status: status || undefined, // 添加 status
        };
        // setSearchParams(newSearchParams); // 更新全局搜索参数
        fetchUsers(newSearchParams); // 使用新的搜索条件获取数据
    };

    // 处理重置搜索
    const handleResetSearch = () => {
        searchForm.resetFields();
        const resetParams: UserSearchParams = {
            // 保留 pageSize, sortBy, sortOrder
            pageSize: pagination.pageSize,
            sortBy: searchParams.sortBy,
            sortOrder: searchParams.sortOrder,
            page: 1, // 重置到第一页
            keyword: undefined,
            role: undefined,
            status: undefined, // 添加 status
        };
        // setSearchParams(resetParams); // 更新全局搜索参数
        fetchUsers(resetParams); // 获取重置后的数据
    };

    // 处理编辑用户 - 打开 Modal 并填充表单
    const handleEditUser = (user: User) => {
        setCurrentUser(user);
        // 填充表单，注意 password 不应在此处显示或修改
        editForm.setFieldsValue({
            username: user.username,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
        });
        setEditModalVisible(true);
    };

    // 处理删除用户
    const handleDeleteUser = async (userId: number) => { // 参数名不变，但值现在是 user_id
        setLoading(true); // 开始加载状态，防止重复点击
        try {
            const response = await adminAPI.deleteUser(userId); // 调用 API 时传递 user_id
            if (response.data.success) {
                message.success('用户删除成功');
                // 刷新用户列表
                // 检查删除的是否是当前页最后一条，如果是则可能需要跳回前一页
                if (users.length === 1 && pagination.current && pagination.current > 1) {
                    fetchUsers({ page: pagination.current - 1 });
                } else {
                    fetchUsers();
                }
            } else {
                message.error(response.data.message || '删除用户失败');
            }
        } catch (error: any) {
            console.error('删除用户异常:', error);
            message.error(`删除用户失败: ${error.response?.data?.message || error.message || '未知错误'}`);
        } finally {
            setLoading(false); // 异常时需要手动结束 loading
        }
    };
    
    // 处理批量删除 (需要后端支持，当前 adminAPI 未提供)
    const handleBatchDelete = () => {
        if (selectedRowKeys.length === 0) {
            message.warning('请至少选择一个用户进行删除');
            return;
        }
        Modal.confirm({
            title: '确认批量删除',
            content: `确定要删除选中的 ${selectedRowKeys.length} 个用户吗？此操作不可恢复。`,
            okText: '确定',
            cancelText: '取消',
            onOk: async () => {
                message.info('批量删除功能暂未实现'); // 提示用户
                // setLoading(true);
                // try {
                //     // 调用批量删除API (例如: await adminAPI.batchDeleteUsers(selectedRowKeys))
                //     message.success('批量删除成功');
                //     setSelectedRowKeys([]); // 清空选择
                //     fetchUsers(); // 刷新列表
                // } catch (error: any) {
                //     console.error('批量删除用户异常:', error);
                //     message.error(`批量删除失败: ${error.response?.data?.message || error.message || '未知错误'}`);
                // } finally {
                //     setLoading(false);
                // }
            },
        });
    };

    // 处理编辑表单提交
    const handleEditSubmit = async () => {
        try {
            const values = await editForm.validateFields();
            if (!currentUser) return;

            setLoading(true); // 开始加载状态
            const updatedUserData: Partial<User> = {
                username: values.username,
                email: values.email,
                role: values.role,
                avatar: values.avatar,
            };

            const response = await adminAPI.updateUser(currentUser.user_id, updatedUserData); // 改回 user_id

            if (response.data.success) {
                message.success('用户信息更新成功');
            setEditModalVisible(false);
                fetchUsers({ page: searchParams.page });
            } else {
                message.error(response.data.message || '更新用户信息失败');
                 setLoading(false);
            }
        } catch (error: any) {
            if (error.name === 'AxiosError') { // Axios 错误处理
                 console.error('更新用户异常:', error);
                 message.error(`更新用户信息失败: ${error.response?.data?.message || error.message || '网络错误'}`);
            } else if (error.errorFields) { // Antd 表单验证错误
                console.log('表单验证失败:', error);
                message.error('请检查表单输入项');
            } else { // 其他未知错误
                console.error('更新用户未知异常:', error);
                message.error('更新用户信息时发生未知错误');
            }
             setLoading(false);
        }
    };

    // 处理新建用户 - 打开 Modal
    const handleCreateUser = () => {
        createForm.resetFields(); // 清空表单
        setCreateModalVisible(true);
    };

    // 处理新建用户表单提交
    const handleCreateSubmit = async () => {
        try {
            const values = await createForm.validateFields();
            setLoading(true);

            // 准备创建用户的数据，直接使用对象字面量，类型会由 adminAPI.createUser 推断
            const newUserData = {
                username: values.username,
                email: values.email,
                password: values.password, 
                role: values.role || 'user', // role 在 AdminCreateUserPayload 中是可选的
            };

            // 调用更新后的 adminAPI.createUser
            const response = await adminAPI.createUser(newUserData);

            if (response.data.success) {
                message.success('用户创建成功');
                setCreateModalVisible(false);
                fetchUsers({ page: 1 }); // 创建成功后跳转到第一页查看
            } else {
                message.error(response.data.message || '创建用户失败');
                 setLoading(false); // 失败时需要手动结束 loading
            }
        } catch (error: any) {
             if (error.name === 'AxiosError') {
                 console.error('创建用户异常:', error);
                 message.error(`创建用户失败: ${error.response?.data?.message || error.message || '网络错误'}`);
            } else if (error.errorFields) {
                console.log('表单验证失败:', error);
                // message.error('请检查表单输入项'); // antd 会自动提示
            } else {
                console.error('创建用户未知异常:', error);
                message.error('创建用户时发生未知错误');
            }
             setLoading(false); // 确保任何错误都结束 loading
        }
    };


    // 处理导出用户 (需要后端实现导出接口)
    const handleExportUsers = () => {
        message.info('导出功能暂未实现');
        // 实际项目中，这里可以生成导出链接或调用导出API
        // const exportParams = { ...searchParams }; // 使用当前搜索条件
        // delete exportParams.page;
        // delete exportParams.pageSize;
        // const queryString = new URLSearchParams(exportParams as any).toString();
        // window.open(`${baseURL}/admin/users/export?${queryString}`, '_blank');
    };

    // 行选择配置
    const rowSelection = {
        selectedRowKeys,
        onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
    };
    
    // 是否有选中项
    const hasSelected = selectedRowKeys.length > 0;

    return (
        <div className="user-management-page">
            <Card bordered={false}>
                <Title level={4}>用户管理</Title>

                {/* 搜索表单 */}
                <Form
                    form={searchForm}
                    layout="inline"
                    onFinish={handleSearch}
                    style={{ marginBottom: 20 }}
                >
                            <Form.Item name="keyword">
                                <Input
                            placeholder="输入用户名或邮箱搜索" 
                                    prefix={<SearchOutlined />}
                            allowClear
                                />
                            </Form.Item>
                            <Form.Item name="role">
                        <Select placeholder="按角色筛选" allowClear style={{ width: 120 }}>
                                    <Option value="user">普通用户</Option>
                                    <Option value="admin">管理员</Option>
                            {/* 添加其他角色 */}
                                </Select>
                            </Form.Item>
                            <Form.Item name="status">
                                <Select placeholder="按状态筛选" allowClear style={{ width: 100 }}>
                                    <Option value="active">正常</Option>
                                    <Option value="muted">已禁言</Option>
                                </Select>
                            </Form.Item>
                    {/* 可以添加日期范围选择器 */}
                    {/* <Form.Item name="dateRange">
                        <RangePicker />
                    </Form.Item> */}
                    <Form.Item>
                        <Button type="primary" htmlType="submit">
                            查询
                        </Button>
                            </Form.Item>
                    <Form.Item>
                        <Button onClick={handleResetSearch}>
                            重置
                                </Button>
                    </Form.Item>
                </Form>

            {/* 操作按钮区域 */}
                <Space style={{ marginBottom: 16 }}>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateUser}>
                        新建用户
                    </Button>
                    <Button icon={<ReloadOutlined />} onClick={() => fetchUsers(searchParams)}>
                        刷新
                    </Button>
                    <Button 
                        icon={<DeleteOutlined />} 
                        danger 
                        onClick={handleBatchDelete}
                        disabled={!hasSelected}
                    >
                        批量删除
                    </Button>
                    <Button icon={<ExportOutlined />} onClick={handleExportUsers}>
                        导出
                    </Button>
                </Space>
                 {hasSelected && (
                    <Text style={{ marginLeft: 8 }}>
                        已选择 {selectedRowKeys.length} 项
                    </Text>
                )}


            {/* 用户表格 */}
                <Spin spinning={loading}>
                <Table
                        rowKey="user_id" // 改回 user_id
                    columns={columns}
                        dataSource={users}
                    pagination={pagination}
                        loading={loading}
                        onChange={handleTableChange} // 处理分页、排序
                        rowSelection={rowSelection} // 启用行选择
                        scroll={{ x: 'max-content' }} // 横向滚动
                    />
                </Spin>
            </Card>

            {/* 编辑用户 Modal */}
            <Modal
                title="编辑用户信息"
                visible={editModalVisible}
                onOk={handleEditSubmit}
                onCancel={() => setEditModalVisible(false)}
                confirmLoading={loading} // 使用全局 loading 状态
                destroyOnClose // 关闭时销毁内部元素，确保表单状态正确
            >
                <Form form={editForm} layout="vertical">
                    <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item 
                        name="email" 
                        label="邮箱" 
                        rules={[
                            { required: true, message: '请输入邮箱' },
                            { type: 'email', message: '请输入有效的邮箱地址' }
                        ]}
                    >
                        <Input />
                    </Form.Item>
                     <Form.Item name="role" label="角色" rules={[{ required: true, message: '请选择用户角色' }]}>
                        <Select>
                            <Option value="admin">管理员</Option>
                            <Option value="user">普通用户</Option>
                            {/* 添加其他角色 */}
                        </Select>
                    </Form.Item>
                    {/* 可以添加头像、状态等其他编辑项 */}
                     <Form.Item name="avatar" label="头像 URL">
                        <Input placeholder="输入头像图片的URL" />
                    </Form.Item>
                    {/* <Form.Item name="status" label="状态">
                        <Select>
                            <Option value="active">正常</Option>
                            <Option value="inactive">未激活</Option>
                            <Option value="locked">已锁定</Option>
                        </Select>
                    </Form.Item> */}
                </Form>
            </Modal>

             {/* 新建用户 Modal */}
            <Modal
                title="新建用户"
                visible={createModalVisible}
                onOk={handleCreateSubmit}
                onCancel={() => setCreateModalVisible(false)}
                confirmLoading={loading}
                destroyOnClose
            >
                <Form form={createForm} layout="vertical">
                    <Form.Item 
                        name="username"
                        label="用户名"
                        rules={[{ required: true, message: '请输入用户名' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item 
                        name="email"
                        label="邮箱"
                        rules={[
                            { required: true, message: '请输入邮箱' },
                            { type: 'email', message: '请输入有效的邮箱地址' }
                        ]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item 
                        name="password" 
                        label="密码" 
                        rules={[{ required: true, message: '请输入初始密码' }]}
                    >
                        <Input.Password />
                    </Form.Item>
                     <Form.Item name="role" label="角色" initialValue="user">
                        <Select>
                            <Option value="admin">管理员</Option>
                            <Option value="user">普通用户</Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>

        </div>
    );
};

export default UserManagement; 