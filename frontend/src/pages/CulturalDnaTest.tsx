import React, { useState, useMemo } from 'react';
import { Button, Card, Radio, Space, Progress, Typography, Result, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import './CulturalDnaTest.css'; // 需要创建对应的 CSS 文件
// 假设 userAPI 和 saveCulturalDna 稍后会在 api/user.ts 中定义
import userAPI from '../api/user'; // 导入 userAPI

// --- 类型定义 ---
// 从 scenic.ts 或其他地方导入/复制枚举类型
enum CulturalTheme {
    RED_CULTURE = 'red_culture',
    ANCIENT_CIVILIZATION = 'ancient_civilization',
    ETHNIC_CULTURE = 'ethnic_culture',
    LITERATURE_ART = 'literature_art',
    RELIGIOUS_CULTURE = 'religious_culture',
    FOOD_CULTURE = 'food_culture',
    INDUSTRIAL_CIVILIZATION = 'industrial_civilization',
    CANTONESE_CULTURE = 'cantonese_culture'
}

enum TimeAxis {
    PREHISTORIC = 'prehistoric',
    ANCIENT = 'ancient',
    MODERN = 'modern',
    CONTEMPORARY = 'contemporary'
}

// 移除 Region 枚举
/*
enum Region {
    GUANGFU = 'guangfu',
    JIANGNAN = 'jiangnan',
    BASHU = 'bashu',
    GUANDONG = 'guandong',
    XIYU = 'xiyu'
}
*/

enum CulturalForm {
    MATERIAL = 'material',
    INTANGIBLE = 'intangible'
}

// 定义得分维度 (移除 region)
type ScoreDimension = 'timeAxis' | 'culturalForm' | 'secondaryThemes';

interface Option {
    text: string;
    scores: Partial<Record<ScoreDimension, Partial<Record<string, number>>>>; // 例如: { timeAxis: { ancient: 2 }, secondaryThemes: { literature_art: 1 } }
}

interface Question {
    id: number;
    text: string;
    options: Option[];
}

// --- 问卷数据 ---
const questions: Question[] = [
    {
        id: 1,
        text: '提起"历史"，您首先联想到的是哪个场景？',
        options: [
            { text: '宫殿楼阁，帝王将相的宏大叙事', scores: { timeAxis: { [TimeAxis.ANCIENT]: 2 }, culturalForm: { [CulturalForm.MATERIAL]: 1 } } },
            { text: '烽火硝烟，近代变革的慷慨悲歌', scores: { timeAxis: { [TimeAxis.MODERN]: 2 }, secondaryThemes: { [CulturalTheme.RED_CULTURE]: 1 } } },
            { text: '远古图腾，人类文明的朦胧曙光', scores: { timeAxis: { [TimeAxis.PREHISTORIC]: 2 } } },
            { text: '市井生活，寻常巷陌的烟火气息', scores: { culturalForm: { [CulturalForm.INTANGIBLE]: 1 }, secondaryThemes: { [CulturalTheme.FOOD_CULTURE]: 1 } } },
        ],
    },
    {
        id: 2,
        text: '旅行时，您更喜欢哪种体验？',
        options: [
            { text: '参观历史遗迹或博物馆，感受厚重底蕴', scores: { culturalForm: { [CulturalForm.MATERIAL]: 2 }, timeAxis: { [TimeAxis.ANCIENT]: 1 } } },
            // 移除 region 评分
            { text: '深入当地市集或村落，体验风土人情', scores: { culturalForm: { [CulturalForm.INTANGIBLE]: 2 }, secondaryThemes: { [CulturalTheme.ETHNIC_CULTURE]: 1 } } }, // 改为关联民族文化
            { text: '欣赏艺术表演或画廊，沉浸文艺氛围', scores: { secondaryThemes: { [CulturalTheme.LITERATURE_ART]: 2 } } },
            { text: '品尝特色美食，探索味蕾的边界', scores: { secondaryThemes: { [CulturalTheme.FOOD_CULTURE]: 2 } } },
        ],
    },
    {
        id: 3,
        text: '以下哪种地域文化描述更吸引您？',
        options: [
            // 移除 region 评分, 改为关联具体主题
            { text: '岭南水乡，兼容并包的商业气息 (广府)', scores: { secondaryThemes: { [CulturalTheme.CANTONESE_CULTURE]: 2 } } },
            { text: '小桥流水，温婉细腻的江南诗意', scores: { secondaryThemes: { [CulturalTheme.LITERATURE_ART]: 2, [CulturalTheme.ANCIENT_CIVILIZATION]: 1 } } }, // 假设关联文学艺术和古代文明
            { text: '雪国风光，豪迈爽朗的关东大地', scores: { secondaryThemes: { [CulturalTheme.ETHNIC_CULTURE]: 1 } } }, // 假设关联民族文化
            { text: '戈壁驼铃，神秘多元的西域色彩', scores: { secondaryThemes: { [CulturalTheme.ETHNIC_CULTURE]: 2 } } }, // 假设关联民族文化
        ],
    },
    // 可以添加更多问题...
];

const CulturalDnaTest: React.FC = () => {
    const navigate = useNavigate();
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
    const [answers, setAnswers] = useState<Record<number, number>>({}); // { questionId: optionIndex }
    // 移除 region 维度
    const [scores, setScores] = useState<Record<ScoreDimension, Record<string, number>>>({
        timeAxis: {},
        // region: {},
        culturalForm: {},
        secondaryThemes: {},
    });
    const [isFinished, setIsFinished] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);

    const handleOptionChange = (questionId: number, optionIndex: number) => {
        setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
    };

    const calculateScores = () => {
        // 移除 region 维度
        const finalScores: Record<ScoreDimension, Record<string, number>> = {
            timeAxis: {},
            // region: {},
            culturalForm: {},
            secondaryThemes: {},
        };

        questions.forEach(q => {
            const selectedOptionIndex = answers[q.id];
            if (selectedOptionIndex !== undefined) {
                const selectedOption = q.options[selectedOptionIndex];
                for (const dim in selectedOption.scores) {
                    const dimension = dim as ScoreDimension;
                    for (const tag in selectedOption.scores[dimension]) {
                        finalScores[dimension][tag] = (finalScores[dimension][tag] || 0) + (selectedOption.scores[dimension]?.[tag] || 0);
                    }
                }
            }
        });
        setScores(finalScores);
    };

    const handleNext = () => {
        if (answers[questions[currentQuestionIndex].id] === undefined) {
            message.warning('请先选择一个选项');
            return;
        }
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            calculateScores();
            setIsFinished(true);
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const getTopDimensions = useMemo(() => {
        if (!isFinished) return [];

        const allScores: { dimension: ScoreDimension, tag: string, score: number }[] = [];
        for (const dim in scores) {
            const dimension = dim as ScoreDimension;
            for (const tag in scores[dimension]) {
                allScores.push({ dimension, tag, score: scores[dimension][tag] });
            }
        }

        // 按分数排序，取前 N 个
        allScores.sort((a, b) => b.score - a.score);
        return allScores.slice(0, 3).map(item => `${item.dimension}:${item.tag}`); // 返回 "dimension:tag" 格式的字符串数组
    }, [scores, isFinished]);

    const handleSaveResults = async () => {
        setIsSaving(true);
        const dnaTags = getTopDimensions;
        if (dnaTags.length === 0) {
            message.error('无法计算结果，请重试');
            setIsSaving(false);
            return;
        }
        try {
            // --- 调用后端 API ---
            const response = await userAPI.saveCulturalDna(dnaTags); // 取消注释
            console.log('Save response:', response);
            message.success('文化基因已保存到您的档案！');
            // 可以在这里导航到用户中心或推荐页面
            // navigate('/profile'); // 假设有个人中心页
            // 模拟成功 (如果API调用成功，下面这行可以移除)
            // console.log('Simulating save success:', dnaTags);
            // setTimeout(() => setIsSaving(false), 1000);

        } catch (error) {
            console.error('保存文化基因失败:', error);
            message.error('保存失败，请稍后重试');
        } finally {
            setIsSaving(false); // 确保在成功或失败时都停止加载状态
        }
    };

    const currentQuestion = questions[currentQuestionIndex];
    const progressPercent = Math.round(((currentQuestionIndex + 1) / questions.length) * 100);

    // --- 添加调试日志 ---
    console.log('>>> [CulturalDnaTest] Rendering Question:');
    console.log('    Index:', currentQuestionIndex);
    console.log('    Question Data:', currentQuestion);
    // 确保 currentQuestion 存在再访问 options
    console.log('    Options Array:', currentQuestion?.options);
    // --- 结束调试日志 ---

    if (isFinished) {
        // --- 结果展示 ---
        // 这里可以根据 getTopDimensions 设计更丰富的展示
        const topTagsString = getTopDimensions.join(', ');
        return (
            <Result
                status="success"
                title="文化基因检测完成！"
                subTitle={`根据您的选择，您的文化偏好标签为：${topTagsString || '无明显偏好'}`}
                extra={[
                    <Button type="primary" key="save" onClick={handleSaveResults} loading={isSaving}>
                        保存结果到档案
                    </Button>,
                    <Button key="back" onClick={() => navigate('/')}>返回首页</Button>,
                    <Button key="retry" onClick={() => { setIsFinished(false); setCurrentQuestionIndex(0); setAnswers({}); setScores({ timeAxis: {}, /* region: {}, */ culturalForm: {}, secondaryThemes: {} }); }}>
                        重新测试
                    </Button>,
                ]}
            />
        );
    }

    return (
        <div className="cultural-dna-test-container">
            <Typography.Title level={2} style={{ textAlign: 'center', marginBottom: '20px' }}>文化基因检测</Typography.Title>
            <Progress percent={progressPercent} style={{ marginBottom: '30px' }} />
            <Card title={`问题 ${currentQuestionIndex + 1}/${questions.length}: ${currentQuestion.text}`}>
                <Radio.Group
                    onChange={(e) => handleOptionChange(currentQuestion.id, e.target.value)}
                    value={answers[currentQuestion.id]}
                    style={{ width: '100%' }}
                >
                    <Space direction="vertical" style={{ width: '100%' }}>
                        {/* --- 添加日志检查 map 是否执行以及 option 数据 --- */}
                        {currentQuestion?.options?.map((option, index) => {
                            console.log(`    Mapping option ${index}:`, option, 'Text:', option?.text);
                            return (
                                <Radio key={index} value={index} style={{ display: 'block', margin: '10px 0' }}>{option.text}</Radio>
                            );
                        })}
                    </Space>
                </Radio.Group>
            </Card>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
                <Button onClick={handlePrevious} disabled={currentQuestionIndex === 0}>
                    上一题
                </Button>
                <Button type="primary" onClick={handleNext}>
                    {currentQuestionIndex === questions.length - 1 ? '完成测试' : '下一题'}
                </Button>
            </div>
        </div>
    );
};

export default CulturalDnaTest; 