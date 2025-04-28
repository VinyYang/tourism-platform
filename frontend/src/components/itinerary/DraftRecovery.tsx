import React from 'react';
import { Modal, Button, Typography, Space, Divider, Card, Tag, Row, Col } from 'antd';
import { 
  ClockCircleOutlined, 
  FileOutlined, 
  EnvironmentOutlined, 
  CalendarOutlined, 
  InfoCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { ItineraryState, DayPlan } from '../../pages/ItineraryPlanner';

const { Title, Text, Paragraph } = Typography;

interface DraftRecoveryProps {
  visible: boolean;
  draftData: ItineraryState;
  onRecoverDraft: () => void;
  onIgnoreDraft: () => void;
  onClose: () => void;
}

/**
 * 草稿恢复组件
 * 显示未保存的行程草稿，供用户选择恢复或忽略
 */
const DraftRecovery: React.FC<DraftRecoveryProps> = ({
  visible,
  draftData,
  onRecoverDraft,
  onIgnoreDraft,
  onClose
}) => {
  // 计算草稿中的天数和项目数
  const daysCount = draftData?.days?.length || 0;
  const itemsCount = draftData?.days?.reduce((total: number, day: DayPlan) => total + day.items.length, 0) || 0;
  
  // 格式化更新时间
  const formattedUpdateTime = draftData?.updatedAt 
    ? dayjs(draftData.updatedAt).format('YYYY-MM-DD HH:mm')
    : '未知时间';
  
  return (
    <Modal
      title="发现未保存的行程草稿"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="ignore" onClick={onIgnoreDraft}>
          忽略草稿
        </Button>,
        <Button key="recover" type="primary" onClick={onRecoverDraft}>
          恢复草稿
        </Button>,
      ]}
      width={600}
    >
      <Paragraph>
        <InfoCircleOutlined style={{ marginRight: 8, color: '#1890ff' }} />
        系统检测到您有一个未保存的行程草稿，是否要恢复继续编辑？
      </Paragraph>
      
      <Card style={{ marginTop: 16, marginBottom: 16 }}>
        <Row gutter={[16, 8]}>
          <Col span={24}>
            <Title level={4}>{draftData.title || '未命名行程'}</Title>
            {draftData.status && (
              <Tag color={draftData.status === 'published' ? 'green' : 'orange'}>
                {draftData.status === 'published' ? '已发布' : '草稿'}
              </Tag>
            )}
          </Col>
          
          {draftData.destination && (
            <Col span={12}>
              <Space>
                <EnvironmentOutlined />
                <Text>目的地：{draftData.destination}</Text>
              </Space>
            </Col>
          )}
          
          {draftData.startDate && draftData.endDate && (
            <Col span={12}>
              <Space>
                <CalendarOutlined />
                <Text>日期：{draftData.startDate} 至 {draftData.endDate}</Text>
              </Space>
            </Col>
          )}
          
          <Col span={12}>
            <Space>
              <FileOutlined />
              <Text>计划天数：{daysCount}天，共{itemsCount}个项目</Text>
            </Space>
          </Col>
          
          <Col span={12}>
            <Space>
              <ClockCircleOutlined />
              <Text>上次编辑：{formattedUpdateTime}</Text>
            </Space>
          </Col>
        </Row>
        
        {draftData.notes && (
          <>
            <Divider style={{ margin: '12px 0' }} />
            <Paragraph ellipsis={{ rows: 2 }}>
              <Text type="secondary">备注：{draftData.notes}</Text>
            </Paragraph>
          </>
        )}
      </Card>
      
      <Paragraph type="secondary">
        • 选择"恢复草稿"将加载上次未完成的编辑内容<br />
        • 选择"忽略草稿"将创建全新的行程，草稿将被丢弃<br />
        • 草稿数据仅保存在您的浏览器中，不会上传到服务器
      </Paragraph>
    </Modal>
  );
};

export default DraftRecovery; 