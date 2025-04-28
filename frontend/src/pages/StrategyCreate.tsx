import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Select, Button, Upload, message, Row, Col, Card, Divider, Tag, Space } from 'antd';
import { UploadOutlined, PlusOutlined } from '@ant-design/icons';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import strategyAPI, { StrategyType, Label, Strategy } from '../api/strategy';
import CitySelector from '../components/common/CitySelector';
import './StrategyCreate.css';

const { Option } = Select;
const { TextArea } = Input;

// 将 getStrategyTypeName 移到组件外部或顶部
const getStrategyTypeName = (type: StrategyType | string): string => {
    switch (type) {
        case StrategyType.ARTICLE:
            return '文章';
        case StrategyType.TRAVEL_NOTE:
            return '游记';
        default:
            const enumKey = Object.keys(StrategyType).find(key => StrategyType[key as keyof typeof StrategyType] === type);
            return enumKey || type.toString();
    }
};

const StrategyCreate: React.FC = () => {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState<boolean>(false);
    const [cities, setCities] = useState<Label[]>([]);
    const [tags, setTags] = useState<Label[]>([]);
    const [content, setContent] = useState<string>('');
    const [coverImage, setCoverImage] = useState<string>('');
    const [inputVisible, setInputVisible] = useState<boolean>(false);
    const [inputValue, setInputValue] = useState<string>('');
    const [customTags, setCustomTags] = useState<string[]>([]);
    
    // 加载城市和标签数据
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [citiesData, tagsData] = await Promise.all([
                    strategyAPI.getCities(),
                    strategyAPI.getTags()
                ]);
                setCities(citiesData);
                setTags(tagsData);
            } catch (error) {
                console.error('加载数据失败:', error);
                message.error('加载城市和标签数据失败');
            }
        };
        
        fetchData();
    }, []);
    
    // 富文本编辑器配置
    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'indent': '-1' }, { 'indent': '+1' }],
            ['link', 'image'],
            ['clean']
        ],
    };
    
    const formats = [
        'header',
        'bold', 'italic', 'underline', 'strike', 'blockquote',
        'list', 'bullet', 'indent',
        'link', 'image'
    ];
    
    // 处理表单提交
    const handleSubmit = async (values: any) => {
        if (!content || content === '<p><br></p>') {
            message.error('请填写攻略内容');
            return;
        }
        
        // 如果没有上传封面，使用默认图片
        const finalCoverImage = coverImage || `https://placehold.co/800x400?text=${encodeURIComponent(values.title || '旅游攻略')}`;
        
        setLoading(true);
        
        try {
            // 结合表单数据和内容
            const strategyData: Partial<Strategy> = {
                title: values.title,
                summary: values.summary,
                content: content,
                cover_image: finalCoverImage,
                type: values.type,
                city: values.city,
                tags: values.tags ? values.tags.join(',') : '',
            };
            
            await strategyAPI.createStrategy(strategyData);
            message.success('攻略创建成功');
            navigate('/strategies');
        } catch (error) {
            console.error('创建攻略失败:', error);
            message.error('创建攻略失败，请重试');
        } finally {
            setLoading(false);
        }
    };
    
    // 处理封面图片上传
    const handleCoverUpload = (info: any) => {
        if (info.file.status === 'done') {
            // 获取上传成功后的图片URL
            const imageUrl = info.file.response.url || info.file.response.path;
            console.log('图片上传成功，URL:', imageUrl);
            
            // 设置封面图片
            setCoverImage(imageUrl);
            message.success('封面图片上传成功');
        } else if (info.file.status === 'error') {
            console.error('图片上传失败:', info.file.error);
            message.error('封面图片上传失败，但您仍可以继续创建攻略');
        }
    };
    
    // 自定义标签相关函数
    const handleClose = (removedTag: string) => {
        const newTags = customTags.filter(tag => tag !== removedTag);
        setCustomTags(newTags);
    };
    
    const showInput = () => {
        setInputVisible(true);
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };
    
    const handleInputConfirm = () => {
        if (inputValue && !customTags.includes(inputValue)) {
            setCustomTags([...customTags, inputValue]);
        }
        setInputVisible(false);
        setInputValue('');
    };
    
    // 取消创建
    const handleCancel = () => {
        if (window.confirm('确定要取消创建攻略吗？所有已输入的内容将被丢弃。')) {
            navigate('/strategies');
        }
    };
    
    return (
        <div className="strategy-create-container">
            <Card 
                title="创建旅游攻略" 
                className="strategy-create-card"
                extra={
                    <Space>
                        <Button onClick={handleCancel}>取消</Button>
                        <Button type="primary" onClick={() => form.submit()} loading={loading}>发布攻略</Button>
                    </Space>
                }
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    requiredMark={false}
                >
                    <Row gutter={24}>
                        <Col span={16}>
                            <Form.Item
                                name="title"
                                label="攻略标题"
                                rules={[
                                    { required: true, message: '请输入攻略标题' },
                                    { max: 100, message: '标题不能超过100个字符' }
                                ]}
                            >
                                <Input placeholder="给您的攻略起个吸引人的标题" maxLength={100} showCount />
                            </Form.Item>
                        </Col>
                        
                        <Col span={8}>
                            <Form.Item
                                name="type"
                                label="攻略类型"
                                rules={[{ required: true, message: '请选择攻略类型!' }]}
                            >
                                <Select placeholder="选择攻略类型">
                                    {/* 使用 Object.keys 遍历 Enum */} 
                                    {Object.keys(StrategyType).map(key => {
                                        const typeValue = StrategyType[key as keyof typeof StrategyType];
                                        return (
                                            <Option key={key} value={typeValue}>{getStrategyTypeName(typeValue)}</Option>
                                        );
                                    })}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    
                    <Row gutter={24}>
                        <Col span={12}>
                            <Form.Item
                                name="city"
                                label="目的地/城市"
                                rules={[{ required: true, message: '请选择目的地城市' }]}
                            >
                                <CitySelector
                                    placeholder="选择目的地城市"
                                    style={{ width: '100%' }}
                                    mode="cascader"
                                    level="city"
                                />
                            </Form.Item>
                        </Col>
                        
                        <Col span={12}>
                            <Form.Item
                                name="tags"
                                label="标签"
                            >
                                <Select 
                                    mode="multiple" 
                                    placeholder="选择相关标签"
                                    optionFilterProp="children"
                                >
                                    {tags.map(tag => (
                                        <Option key={tag.id} value={tag.name}>{tag.name}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                            
                            <div className="custom-tags">
                                <div className="custom-tags-title">自定义标签:</div>
                                <div className="custom-tags-content">
                                    {customTags.map(tag => (
                                        <Tag 
                                            key={tag} 
                                            closable 
                                            onClose={() => handleClose(tag)}
                                            style={{ marginBottom: 8 }}
                                        >
                                            {tag}
                                        </Tag>
                                    ))}
                                    {inputVisible ? (
                                        <Input
                                            type="text"
                                            size="small"
                                            style={{ width: 78 }}
                                            value={inputValue}
                                            onChange={handleInputChange}
                                            onBlur={handleInputConfirm}
                                            onPressEnter={handleInputConfirm}
                                            autoFocus
                                        />
                                    ) : (
                                        <Tag onClick={showInput} style={{ background: '#fff', borderStyle: 'dashed' }}>
                                            <PlusOutlined /> 新标签
                                        </Tag>
                                    )}
                                </div>
                            </div>
                        </Col>
                    </Row>
                    
                    <Form.Item
                        name="summary"
                        label="攻略摘要"
                        rules={[
                            { required: true, message: '请输入攻略摘要' },
                            { max: 300, message: '摘要不能超过300个字符' }
                        ]}
                    >
                        <TextArea 
                            placeholder="简短介绍您的攻略内容（300字以内）" 
                            autoSize={{ minRows: 3, maxRows: 6 }}
                            maxLength={300}
                            showCount
                        />
                    </Form.Item>
                    
                    <Form.Item
                        name="coverImage"
                        label="攻略封面 (可选)"
                        rules={[{ required: false }]}
                    >
                        <Upload
                            name="file"
                            listType="picture-card"
                            className="cover-uploader"
                            showUploadList={true}
                            action="/api/v1/upload"
                            onChange={handleCoverUpload}
                            maxCount={1}
                        >
                            <div>
                                <UploadOutlined />
                                <div style={{ marginTop: 8 }}>上传封面</div>
                            </div>
                        </Upload>
                        <div className="upload-hint">推荐尺寸: 1200x800，最大文件大小: 2MB</div>
                    </Form.Item>
                    
                    <Divider orientation="left">攻略正文</Divider>
                    
                    <div className="editor-container">
                        <ReactQuill
                            theme="snow"
                            modules={modules}
                            formats={formats}
                            value={content}
                            onChange={setContent}
                            placeholder="详细描述您的旅行体验、建议和心得..."
                        />
                        <div className="editor-hint">支持文本格式化、插入图片等功能</div>
                    </div>
                    
                    <div className="form-actions">
                        <Button type="primary" htmlType="submit" loading={loading}>
                            发布攻略
                        </Button>
                        <Button onClick={handleCancel} style={{ marginLeft: 16 }}>
                            取消
                        </Button>
                    </div>
                </Form>
            </Card>
        </div>
    );
};

export default StrategyCreate;

// 确保被视为模块
export {}; 