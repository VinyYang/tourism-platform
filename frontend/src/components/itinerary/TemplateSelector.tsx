import React, { useState } from 'react';
import { Row, Col, Card, Typography, Button, Tag, Modal, Tooltip, Badge, Divider } from 'antd';
import { 
  CheckOutlined, 
  StarFilled, 
  CalendarOutlined, 
  WalletOutlined, 
  PlusOutlined, 
  InfoCircleOutlined, 
  ArrowRightOutlined
} from '@ant-design/icons';
import { ItineraryTemplate, DEFAULT_TEMPLATES } from '../../models/ItineraryTemplates';

const { Title, Text, Paragraph } = Typography;

interface TemplateSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelectTemplate: (template: ItineraryTemplate | null) => void;
  templates?: ItineraryTemplate[]; // 可选，使用传入的模板列表，否则使用默认列表
}

/**
 * 行程模板选择器组件
 * 用于在创建新行程时选择预设的行程模板
 */
const TemplateSelector: React.FC<TemplateSelectorProps> = ({ 
  visible, 
  onClose, 
  onSelectTemplate,
  templates = DEFAULT_TEMPLATES
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<ItineraryTemplate | null>(null);
  const [templateDetailsVisible, setTemplateDetailsVisible] = useState(false);

  // 处理模板选择
  const handleTemplateSelect = (template: ItineraryTemplate) => {
    setSelectedTemplate(template);
  };

  // 确认选择模板
  const handleConfirmSelection = () => {
    onSelectTemplate(selectedTemplate);
    onClose();
  };

  // 查看模板详情
  const showTemplateDetails = (template: ItineraryTemplate) => {
    setSelectedTemplate(template);
    setTemplateDetailsVisible(true);
  };

  // 从头开始创建(不使用模板)
  const handleCreateFromScratch = () => {
    onSelectTemplate(null);
    onClose();
  };

  // 渲染星级评分
  const renderPopularityStars = (popularity: number) => {
    return Array(5).fill(0).map((_, index) => (
      <StarFilled 
        key={index} 
        style={{ 
          marginRight: 2,
          fontSize: 12,
          color: index < popularity ? '#fadb14' : '#f0f0f0'
        }} 
      />
    ));
  };

  // 模板详情弹窗
  const renderTemplateDetailsModal = () => {
    if (!selectedTemplate) return null;

    return (
      <Modal
        title={`${selectedTemplate.name} - 行程详情`}
        open={templateDetailsVisible}
        onCancel={() => setTemplateDetailsVisible(false)}
        footer={[
          <Button key="back" onClick={() => setTemplateDetailsVisible(false)}>
            返回
          </Button>,
          <Button 
            key="select" 
            type="primary" 
            onClick={() => {
              setTemplateDetailsVisible(false);
              handleConfirmSelection();
            }}
          >
            使用此模板
          </Button>,
        ]}
        width={700}
      >
        <div className="template-details">
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <img 
                src={selectedTemplate.imageUrl} 
                alt={selectedTemplate.name} 
                style={{ width: '100%', borderRadius: 8 }} 
              />
              <div style={{ marginTop: 16 }}>
                <Text strong>基本信息：</Text>
                <div><CalendarOutlined /> 行程天数：{selectedTemplate.duration}天</div>
                {selectedTemplate.estimatedBudget && (
                  <div><WalletOutlined /> 参考预算：¥{selectedTemplate.estimatedBudget}</div>
                )}
                <div style={{ marginTop: 8 }}>
                  {selectedTemplate.tags.map(tag => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </div>
                <div style={{ marginTop: 8 }}>
                  受欢迎度：{renderPopularityStars(selectedTemplate.popularity)}
                </div>
              </div>
            </Col>
            <Col span={16}>
              <Title level={4}>{selectedTemplate.name}</Title>
              <Paragraph>{selectedTemplate.description}</Paragraph>
              
              <Divider orientation="left">行程安排</Divider>
              {selectedTemplate.days.map(day => (
                <div key={day.dayNumber} style={{ marginBottom: 16 }}>
                  <Text strong>{`第${day.dayNumber}天：${day.title || ''}`}</Text>
                  {day.description && <div><Text type="secondary">{day.description}</Text></div>}
                  <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                    {day.items.map(item => (
                      <li key={item.id}>
                        <Text>{item.name}</Text>
                        {item.startTime && item.endTime && (
                          <Text type="secondary"> ({item.startTime}-{item.endTime})</Text>
                        )}
                        {item.description && (
                          <div><Text type="secondary" style={{ fontSize: 12 }}>{item.description}</Text></div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </Col>
          </Row>
        </div>
      </Modal>
    );
  };

  return (
    <Modal
      title="选择行程模板"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="scratch" onClick={handleCreateFromScratch}>
          从头开始创建
        </Button>,
        <Button 
          key="confirm" 
          type="primary" 
          disabled={!selectedTemplate} 
          onClick={handleConfirmSelection}
        >
          使用选中模板
        </Button>,
      ]}
      width={800}
    >
      <Paragraph>
        选择一个模板快速开始您的行程规划，或者选择"从头开始创建"自定义您的行程。
      </Paragraph>
      
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {templates.map(template => (
          <Col key={template.id} xs={24} sm={12} md={8}>
            <Badge.Ribbon 
              text={template.type === 'weekend' ? '周末游' : 
                    template.type === 'family' ? '亲子游' : 
                    template.type === 'business' ? '商务' : '长假'}
              color={template.type === 'weekend' ? 'blue' : 
                     template.type === 'family' ? 'green' :
                     template.type === 'business' ? 'purple' : 'orange'}
            >
              <Card
                hoverable
                cover={
                  <div style={{ position: 'relative', height: 120, overflow: 'hidden' }}>
                    <img 
                      alt={template.name} 
                      src={template.imageUrl}
                      style={{ width: '100%', objectFit: 'cover', height: '100%' }}
                    />
                  </div>
                }
                className={`template-card ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                style={{ 
                  border: selectedTemplate?.id === template.id ? '2px solid #1890ff' : '1px solid #f0f0f0',
                  position: 'relative'
                }}
                bodyStyle={{ padding: 12 }}
                onClick={() => handleTemplateSelect(template)}
              >
                {selectedTemplate?.id === template.id && (
                  <div 
                    style={{ 
                      position: 'absolute', 
                      top: 8, 
                      right: 8, 
                      backgroundColor: '#1890ff',
                      color: 'white',
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    <CheckOutlined />
                  </div>
                )}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Title level={5} style={{ margin: 0 }}>{template.name}</Title>
                    <Tooltip title="查看详情">
                      <Button 
                        type="text" 
                        size="small" 
                        icon={<InfoCircleOutlined />} 
                        onClick={(e) => {
                          e.stopPropagation();
                          showTemplateDetails(template);
                        }}
                      />
                    </Tooltip>
                  </div>
                  <div style={{ margin: '8px 0' }}>
                    {renderPopularityStars(template.popularity)}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text type="secondary"><CalendarOutlined /> {template.duration}天</Text>
                    {template.estimatedBudget && (
                      <Text type="secondary"><WalletOutlined /> ¥{template.estimatedBudget}</Text>
                    )}
                  </div>
                  <div style={{ height: 40, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>{template.description}</Text>
                  </div>
                </div>
              </Card>
            </Badge.Ribbon>
          </Col>
        ))}
        
        {/* 从零开始 */}
        <Col xs={24} sm={12} md={8}>
          <Card
            hoverable
            className="template-card"
            style={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              borderStyle: 'dashed'
            }}
            onClick={handleCreateFromScratch}
          >
            <div style={{ textAlign: 'center', padding: 20 }}>
              <PlusOutlined style={{ fontSize: 32, color: '#1890ff', marginBottom: 8 }} />
              <Title level={5}>从头开始创建</Title>
              <Text type="secondary">完全自定义您的行程</Text>
            </div>
          </Card>
        </Col>
      </Row>
      
      {renderTemplateDetailsModal()}
    </Modal>
  );
};

export default TemplateSelector; 