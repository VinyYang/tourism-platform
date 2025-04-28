import React, { useState } from 'react';
import { 
  Modal, 
  Button, 
  Steps, 
  Form, 
  Input, 
  DatePicker, 
  Select, 
  InputNumber, 
  Radio, 
  Typography, 
  Space, 
  Divider 
} from 'antd';
import { 
  CalendarOutlined, 
  EnvironmentOutlined, 
  WalletOutlined, 
  UserOutlined, 
  SolutionOutlined, 
  CheckCircleOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { RangePickerProps } from 'antd/es/date-picker';
import { getUserPreferences, recordDestination } from '../../services/preferenceService';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { RangePicker } = DatePicker;
const { Option } = Select;

// 引导创建结果接口
export interface GuidedCreationResult {
  title: string;
  startDate: string;
  endDate: string;
  destination: string;
  budget?: number; 
  tripType: string;
  travelers: number;
  notes?: string;
}

interface GuidedCreationProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (result: GuidedCreationResult) => void;
}

// 城市选项列表
const POPULAR_CITIES = [
  { value: '北京', label: '北京' },
  { value: '上海', label: '上海' },
  { value: '广州', label: '广州' },
  { value: '深圳', label: '深圳' },
  { value: '杭州', label: '杭州' },
  { value: '成都', label: '成都' },
  { value: '重庆', label: '重庆' },
  { value: '西安', label: '西安' },
  { value: '厦门', label: '厦门' },
  { value: '三亚', label: '三亚' },
  { value: '苏州', label: '苏州' },
  { value: '丽江', label: '丽江' },
  { value: '桂林', label: '桂林' }
];

// 行程类型选项
const TRIP_TYPES = [
  { value: 'leisure', label: '休闲度假', icon: '🏖️', description: '放松身心，享受悠闲时光' },
  { value: 'adventure', label: '探险挑战', icon: '🧗', description: '尝试刺激活动，挑战自我' },
  { value: 'cultural', label: '文化体验', icon: '🏛️', description: '探索当地历史文化与艺术' },
  { value: 'food', label: '美食之旅', icon: '🍜', description: '品尝地道美食，体验舌尖上的旅行' },
  { value: 'shopping', label: '购物游览', icon: '🛍️', description: '享受购物乐趣，搜寻特色商品' },
  { value: 'business', label: '商务出行', icon: '💼', description: '高效规划商务行程' },
  { value: 'family', label: '亲子家庭', icon: '👨‍👩‍👧', description: '适合全家出游的友好体验' }
];

/**
 * 引导式行程创建组件
 * 通过步骤引导用户填写行程基本信息
 */
const GuidedCreation: React.FC<GuidedCreationProps> = ({ visible, onClose, onComplete }) => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const userPreferences = getUserPreferences();
  
  // 步骤内容定义
  const steps = [
    {
      title: '目的地',
      icon: <EnvironmentOutlined />,
      description: '您想去哪里?',
    },
    {
      title: '日期',
      icon: <CalendarOutlined />,
      description: '什么时候出行?',
    },
    {
      title: '行程类型',
      icon: <SolutionOutlined />,
      description: '行程偏好',
    },
    {
      title: '预算与人数',
      icon: <WalletOutlined />,
      description: '预算规划',
    },
    {
      title: '确认',
      icon: <CheckCircleOutlined />,
      description: '完成创建',
    },
  ];

  // 下一步
  const handleNext = async () => {
    try {
      // 验证当前步骤表单
      await form.validateFields();
      
      // 如果是最后一步，则完成创建
      if (currentStep === steps.length - 1) {
        handleComplete();
        return;
      }
      
      // 否则前进到下一步
      setCurrentStep(currentStep + 1);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 上一步
  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  // 完成创建
  const handleComplete = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      // 格式化日期
      const dateRange = values.dateRange || [];
      const formattedValues: GuidedCreationResult = {
        title: values.title || `${values.destination}之旅`,
        startDate: dateRange[0]?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD'),
        endDate: dateRange[1]?.format('YYYY-MM-DD') || dayjs().add(userPreferences.defaultDuration - 1, 'day').format('YYYY-MM-DD'),
        destination: values.destination,
        budget: values.budget,
        tripType: values.tripType || 'leisure',
        travelers: values.travelers || 1,
        notes: values.notes
      };
      
      // 记录目的地到用户偏好
      recordDestination(values.destination);
      
      // 调用完成回调
      onComplete(formattedValues);
    } catch (error) {
      console.error('完成创建失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 渲染步骤内容
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // 目的地
        return (
          <div style={{ padding: '20px 0' }}>
            <Title level={4}>您计划去哪里?</Title>
            <Paragraph>选择您的目的地城市，这将帮助我们提供更准确的行程建议。</Paragraph>
            
            <Form.Item 
              name="destination" 
              rules={[{ required: true, message: '请选择或输入目的地' }]}
              initialValue={userPreferences.frequentDestinations[0] || undefined}
            >
              <Select
                showSearch
                style={{ width: '100%' }}
                placeholder="选择或输入目的地城市"
                optionFilterProp="label"
                options={[
                  {
                    label: '常用目的地',
                    options: userPreferences.frequentDestinations.map(city => ({ value: city, label: city }))
                  },
                  {
                    label: '热门城市',
                    options: POPULAR_CITIES
                  }
                ]}
                allowClear
                autoFocus
              />
            </Form.Item>
          </div>
        );
        
      case 1: // 日期
        return (
          <div style={{ padding: '20px 0' }}>
            <Title level={4}>您计划什么时候出行?</Title>
            <Paragraph>选择您的出行日期和返回日期。</Paragraph>
            
            <Form.Item 
              name="dateRange" 
              rules={[{ required: true, message: '请选择出行日期' }]}
              initialValue={[dayjs(), dayjs().add(userPreferences.defaultDuration - 1, 'day')]}
            >
              <RangePicker 
                style={{ width: '100%' }} 
                format="YYYY-MM-DD"
                placeholder={['开始日期', '结束日期']}
                disabledDate={(current: any) => current && current < dayjs().startOf('day')}
              />
            </Form.Item>
          </div>
        );
        
      case 2: // 行程类型
        return (
          <div style={{ padding: '20px 0' }}>
            <Title level={4}>您期望的行程类型是?</Title>
            <Paragraph>选择一种行程类型，我们将为您定制相应的行程安排。</Paragraph>
            
            <Form.Item 
              name="tripType" 
              rules={[{ required: true, message: '请选择行程类型' }]}
              initialValue={userPreferences.preferredTripType}
            >
              <Radio.Group style={{ width: '100%' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  {TRIP_TYPES.map(type => (
                    <Radio key={type.value} value={type.value} style={{ width: '100%', marginRight: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: 8, fontSize: 20 }}>{type.icon}</span>
                        <div>
                          <div>{type.label}</div>
                          <div><Text type="secondary" style={{ fontSize: 12 }}>{type.description}</Text></div>
                        </div>
                      </div>
                    </Radio>
                  ))}
                </Space>
              </Radio.Group>
            </Form.Item>
          </div>
        );
        
      case 3: // 预算与人数
        return (
          <div style={{ padding: '20px 0' }}>
            <Title level={4}>预算与出行人数</Title>
            <Paragraph>设置您的行程预算和出行人数。</Paragraph>
            
            <Form.Item 
              label="预算总额(¥)" 
              name="budget"
              initialValue={userPreferences.defaultBudget}
            >
              <InputNumber 
                style={{ width: '100%' }} 
                min={0} 
                step={500}
                formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value?: string) => value ? Number(value.replace(/[^\d.]/g, '')) : 0}
                placeholder="输入您的总预算"
              />
            </Form.Item>
            
            <Form.Item 
              label="出行人数" 
              name="travelers"
              initialValue={1}
            >
              <InputNumber 
                style={{ width: '100%' }} 
                min={1} 
                max={20}
                placeholder="输入出行人数"
              />
            </Form.Item>
          </div>
        );
        
      case 4: // 确认
        return (
          <div style={{ padding: '20px 0' }}>
            <Title level={4}>行程概要</Title>
            <Paragraph>请确认以下信息，并为您的行程添加标题。</Paragraph>
            
            <Form.Item 
              label="行程标题" 
              name="title"
              initialValue={`${form.getFieldValue('destination') || ''}之旅`}
              rules={[{ required: true, message: '请输入行程标题' }]}
            >
              <Input placeholder="为您的行程取个名字" />
            </Form.Item>
            
            <Form.Item 
              label="备注" 
              name="notes"
            >
              <Input.TextArea 
                placeholder="添加任何关于此次行程的备注信息（可选）" 
                rows={3}
              />
            </Form.Item>
            
            <Divider />
            
            <div style={{ marginBottom: 16 }}>
              <Text strong>行程信息确认:</Text>
            </div>
            
            <div style={{ marginBottom: 8 }}>
              <Space>
                <EnvironmentOutlined />
                <Text>目的地:</Text>
                <Text strong>{form.getFieldValue('destination') || '-'}</Text>
              </Space>
            </div>
            
            <div style={{ marginBottom: 8 }}>
              <Space>
                <CalendarOutlined />
                <Text>日期:</Text>
                <Text strong>
                  {form.getFieldValue('dateRange')?.[0]?.format('YYYY-MM-DD')} 至 {form.getFieldValue('dateRange')?.[1]?.format('YYYY-MM-DD')}
                </Text>
              </Space>
            </div>
            
            <div style={{ marginBottom: 8 }}>
              <Space>
                <SolutionOutlined />
                <Text>行程类型:</Text>
                <Text strong>
                  {TRIP_TYPES.find(t => t.value === form.getFieldValue('tripType'))?.label || '-'}
                </Text>
              </Space>
            </div>
            
            <div style={{ marginBottom: 8 }}>
              <Space>
                <WalletOutlined />
                <Text>预算:</Text>
                <Text strong>
                  {form.getFieldValue('budget') ? `¥${form.getFieldValue('budget')}` : '未设置'}
                </Text>
              </Space>
            </div>
            
            <div style={{ marginBottom: 8 }}>
              <Space>
                <UserOutlined />
                <Text>出行人数:</Text>
                <Text strong>{form.getFieldValue('travelers') || 1}人</Text>
              </Space>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <Modal
      title="创建新行程"
      open={visible}
      onCancel={onClose}
      footer={[
        currentStep > 0 && (
          <Button key="back" onClick={handlePrevious}>
            上一步
          </Button>
        ),
        <Button 
          key="next" 
          type="primary" 
          onClick={handleNext}
          loading={loading}
        >
          {currentStep === steps.length - 1 ? '完成创建' : '下一步'}
        </Button>,
      ].filter(Boolean)}
      width={700}
    >
      <Steps current={currentStep}>
        {steps.map((step, index) => (
          <Step 
            key={index} 
            title={step.title} 
            description={step.description}
            icon={step.icon}
          />
        ))}
      </Steps>
      
      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: 20 }}
      >
        {renderStepContent()}
      </Form>
    </Modal>
  );
};

export default GuidedCreation; 