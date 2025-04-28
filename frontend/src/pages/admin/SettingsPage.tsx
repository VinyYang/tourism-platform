import React from 'react';
import { Alert, Card, Typography } from 'antd';
import './AdminPages.css'; // 可以复用通用样式

const { Title } = Typography;

const SettingsPage: React.FC = () => {
    return (
        <div className="admin-page">
            <Card bordered={false}>
                 <Title level={4}>系统设置</Title>
                <Alert
                    message="功能开发中"
                    description="系统设置功能正在规划和开发中，未来将允许配置网站基础信息、API密钥等。"
                    type="info"
                    showIcon
                />
                 {/* 未来在这里添加配置表单 */}
            </Card>
        </div>
    );
};

export default SettingsPage;
