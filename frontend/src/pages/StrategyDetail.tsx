import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
    Row, Col, Skeleton, Tag, Divider, Button, Avatar, Card, 
    Typography, Space, message, Input, List, Tooltip, Modal,
    Rate,
    Popconfirm,
    Form,
    Empty,
    Alert
} from 'antd';
import { Comment } from '@ant-design/compatible';
import { 
    EyeOutlined, LikeOutlined, LikeFilled,
    MessageOutlined, ShareAltOutlined, BookOutlined, BookFilled,
    EnvironmentOutlined, ClockCircleOutlined, DollarOutlined, UserOutlined,
    ReloadOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import strategyAPI from '../api/strategy';
import reviewAPI from '../api/review';
import { Strategy } from '../@types/strategy';
import { StrategyDetail as StrategyDetailType, StrategyComment, Label } from '../@types/strategy';
import { RelatedScenic } from '../@types/strategy'; // 导入 RelatedScenic
import './StrategyDetail.css';
import SafeImage from '../components/common/SafeImage';
import { ImageType } from '../types/image.types';
import { formatDate } from '../utils/helpers';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// 定义请求状态类型
interface RequestStatus {
    loading: boolean;
    error: string | null;
    retryCount: number;
}

// 防抖函数
const useDebounce = <T extends (...args: any[]) => any>(
    callback: T,
    delay: number = 500
) => {
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    
    return useCallback((...args: Parameters<T>) => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        
        timerRef.current = setTimeout(() => {
            callback(...args);
        }, delay);
    }, [callback, delay]);
};

const StrategyDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    
    // 添加强制刷新状态
    const [forceRefresh, setForceRefresh] = useState<number>(0);
    // 添加加载超时状态
    const [loadingTimeout, setLoadingTimeout] = useState<boolean>(false);
    // 添加超时计时器引用
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    // 状态
    const [strategy, setStrategy] = useState<StrategyDetailType | null>(null);
    const [relatedStrategies, setRelatedStrategies] = useState<Strategy[]>([]);
    const [loading, setLoading] = useState<boolean>(true); // 默认为加载状态
    const [commentContent, setCommentContent] = useState<string>('');
    const [commentRating, setCommentRating] = useState<number>(0);
    const [submittingComment, setSubmittingComment] = useState<boolean>(false);
    const [isFavorite, setIsFavorite] = useState<boolean>(false);
    const [isLiked, setIsLiked] = useState<boolean>(false);
    const [favoriteLoading, setFavoriteLoading] = useState<boolean>(false);
    const [likeLoading, setLikeLoading] = useState<boolean>(false);
    const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
    
    // 添加强制刷新加载状态
    const [manualRefreshing, setManualRefreshing] = useState<boolean>(false);
    // 添加模拟数据标志
    const [isMockData, setIsMockData] = useState<boolean>(false);
    
    // 请求状态 - 为每种请求类型创建单独的状态变量
    const [strategyRequestStatus, setStrategyRequestStatus] = useState<RequestStatus>({
        loading: false,
        error: null,
        retryCount: 0
    });
    const [relatedRequestStatus, setRelatedRequestStatus] = useState<RequestStatus>({
        loading: false,
        error: null,
        retryCount: 0
    });
    const [commentsRequestStatus, setCommentsRequestStatus] = useState<RequestStatus>({
        loading: false,
        error: null,
        retryCount: 0
    });
    
    // 新增评论相关状态
    const [commentsPagination, setCommentsPagination] = useState({ current: 1, pageSize: 5, total: 0 });
    const [comments, setComments] = useState<StrategyComment[]>([]);
    
    // 使用useRef跟踪组件是否已挂载
    const isMounted = useRef<boolean>(false);
    
    // 加载攻略详情 - 单独处理主攻略数据
    const fetchStrategyDetail = useCallback(async () => {
        if (!id) {
            message.error('攻略ID无效');
            navigate('/strategies');
            return;
        }
        
        // 防止重复请求
        if (strategyRequestStatus.loading && !manualRefreshing) {
            console.log('已经在加载攻略详情，跳过重复请求');
            return;
        }
        
        try {
            console.log('开始加载攻略详情, ID:', id);
            setStrategyRequestStatus(prev => ({ ...prev, loading: true, error: null }));
            
            // 设置超时计时器，确保即使API未响应也能退出loading状态
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            
            timeoutRef.current = setTimeout(() => {
                if (isMounted.current) {
                    console.log('加载攻略详情超时，强制退出loading状态');
                    setLoadingTimeout(true);
                    setLoading(false);
                    setStrategyRequestStatus(prev => ({ 
                        ...prev, 
                        loading: false, 
                        error: '加载超时，请尝试刷新页面' 
                    }));
                }
            }, 10000); // 10秒超时
            
            try {
                const strategyData = await strategyAPI.getStrategyDetail(Number(id));
                console.log('攻略详情数据获取成功:', strategyData ? '有数据' : '无数据');
                
                if (isMounted.current) {
                    // 确保清除超时计时器
                    if (timeoutRef.current) {
                        clearTimeout(timeoutRef.current);
                        timeoutRef.current = null;
                    }
                    
                    // 检查是否为模拟数据
                    // 假设模拟数据的特征是没有真实的后端ID
                    setIsMockData(strategyData.title.includes('成都的休闲文化之旅') && !strategyData?.backendId);
                    
                    // 增强数据验证：确保数据有效，防止设置null或undefined
                    if (strategyData && typeof strategyData === 'object' && 
                        // 确保至少有必要的字段
                        (strategyData.title || strategyData.content)) {
                        
                        console.log('更新攻略详情状态，数据有效');
                        setStrategy(strategyData);
                        
                        // 设置收藏和点赞状态
                        if (isAuthenticated) {
                            setIsFavorite(strategyData.isFavorite ?? false);
                            setIsLiked(strategyData.isLiked ?? false);
                        }
                        
                        // 确保loading状态被重置
                        setLoading(false);
                        setManualRefreshing(false);
                    } else {
                        console.warn('服务器返回的数据无效:', strategyData);
                        throw new Error('获取攻略详情失败，返回的数据为空或无效');
                    }
                    
                    setStrategyRequestStatus(prev => ({ 
                        ...prev, 
                        loading: false,
                        retryCount: 0
                    }));
                }
            } catch (apiError: any) {
                throw apiError; // 将API错误重新抛出，以统一处理
            }
        } catch (error: any) {
            console.error('获取攻略详情失败:', error);
            
            if (isMounted.current) {
                // 确保清除超时计时器
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                    timeoutRef.current = null;
                }
                
                // 生成更有意义的错误消息
                let errorMessage = '获取攻略详情失败，请稍后重试';
                
                if (error.message && error.message.includes('数据为空')) {
                    errorMessage = '攻略不存在或数据格式错误';
                } else if (error.response?.status === 404) {
                    errorMessage = '攻略不存在或已被删除';
                } else if (error.response?.data?.message) {
                    errorMessage = error.response.data.message;
                } else if (error.message) {
                    errorMessage = error.message;
                }
                
                message.error(errorMessage);
                
                setStrategyRequestStatus(prev => ({ 
                    ...prev, 
                    loading: false, 
                    error: errorMessage,
                    retryCount: prev.retryCount + 1
                }));
                
                // 即使失败也需要关闭loading状态
                setLoading(false);
                setManualRefreshing(false);
                
                // 修改重试逻辑，防止循环
                if (strategyRequestStatus.retryCount < 3) {
                    console.log(`尝试重试 (${strategyRequestStatus.retryCount + 1}/3)`);
                    const nextRetryCount = strategyRequestStatus.retryCount + 1;
                    
                    setTimeout(() => {
                        if (isMounted.current) {
                            // 直接调用API而不是递归调用fetchStrategyDetail
                            strategyAPI.getStrategyDetail(Number(id))
                                .then(data => {
                                    if (isMounted.current) {
                                        // 确保数据有效
                                        if (data && (data.title || data.content)) {
                                            setStrategy(data);
                                            setStrategyRequestStatus(prev => ({ 
                                                ...prev, 
                                                loading: false,
                                                error: null,
                                                retryCount: 0
                                            }));
                                        } else {
                                            setStrategyRequestStatus(prev => ({ 
                                                ...prev, 
                                                loading: false,
                                                error: '数据格式错误，请手动刷新',
                                                retryCount: nextRetryCount
                                            }));
                                        }
                                    }
                                })
                                .catch(() => {
                                    if (isMounted.current) {
                                        setStrategyRequestStatus(prev => ({ 
                                            ...prev, 
                                            loading: false,
                                            error: '重试失败，请手动刷新',
                                            retryCount: nextRetryCount
                                        }));
                                    }
                                });
                        }
                    }, 2000); // 2秒后重试
                }
            }
        }
    }, [id, strategyRequestStatus.loading, strategyRequestStatus.retryCount, navigate, isAuthenticated, manualRefreshing]);
    
    // 加载相关攻略 - 单独处理相关攻略数据
    const fetchRelatedStrategies = useCallback(async () => {
        if (!id) return;
        
        // 防止重复请求
        if (relatedRequestStatus.loading) {
            return;
        }
        
        try {
            setRelatedRequestStatus(prev => ({ ...prev, loading: true, error: null }));
            
            const relatedData = await strategyAPI.getRelatedStrategies(Number(id));
            
            if (isMounted.current) {
                setRelatedStrategies(relatedData);
                setRelatedRequestStatus(prev => ({ 
                    ...prev, 
                    loading: false,
                    retryCount: 0 // 重置重试计数
                }));
            }
        } catch (error: any) {
            console.error('获取相关攻略失败:', error);
            
            if (isMounted.current) {
                const errorMessage = error.response?.data?.message || '获取相关攻略失败，请稍后重试';
                
                setRelatedRequestStatus(prev => ({ 
                    ...prev, 
                    loading: false, 
                    error: errorMessage,
                    retryCount: prev.retryCount + 1
                }));
                
                // 修改重试逻辑，防止循环
                if (relatedRequestStatus.retryCount < 3) {
                    const nextRetryCount = relatedRequestStatus.retryCount + 1;
                    
                    setTimeout(() => {
                        if (isMounted.current) {
                            // 直接调用API而不是递归调用fetchRelatedStrategies
                            strategyAPI.getRelatedStrategies(Number(id))
                                .then(data => {
                                    if (isMounted.current) {
                                        setRelatedStrategies(data);
                                        setRelatedRequestStatus(prev => ({ 
                                            ...prev, 
                                            loading: false,
                                            error: null,
                                            retryCount: 0
                                        }));
                                    }
                                })
                                .catch(() => {
                                    if (isMounted.current) {
                                        setRelatedRequestStatus(prev => ({ 
                                            ...prev, 
                                            loading: false,
                                            error: '获取相关攻略失败',
                                            retryCount: nextRetryCount
                                        }));
                                    }
                                });
                        }
                    }, 2000);
                }
            }
        }
    }, [id, relatedRequestStatus.loading, relatedRequestStatus.retryCount]);
    
    // 加载评论 - 优化评论加载
    const fetchComments = useCallback(async (page = 1, pageSize = 10) => {
        if (!id) return;
        
        // 防止重复请求
        if (commentsRequestStatus.loading) {
            return;
        }
        
        try {
            setCommentsRequestStatus(prev => ({ ...prev, loading: true, error: null }));
            
            // 调用真实的 reviewAPI 获取评论
            const response = await reviewAPI.getReviewsForItem('strategy', Number(id), { page, pageSize });
            
            if (isMounted.current) {
                if (response.success) {
                    // 注意: 确认 response.data 的类型与 StrategyComment[] 兼容
                    setComments(response.data as unknown as StrategyComment[]);
                    setCommentsPagination({
                        current: response.meta.page,
                        pageSize: response.meta.pageSize,
                        total: response.meta.total
                    });
                } else {
                    setComments([]);
                }
                
                setCommentsRequestStatus(prev => ({ 
                    ...prev, 
                    loading: false,
                    retryCount: 0 // 重置重试计数
                }));
            }
        } catch (error: any) {
            console.error('获取评论失败:', error);
            
            if (isMounted.current) {
                const errorMessage = error.response?.data?.message || '加载评论失败，请稍后重试';
                
                setCommentsRequestStatus(prev => ({ 
                    ...prev, 
                    loading: false, 
                    error: errorMessage,
                    retryCount: prev.retryCount + 1
                }));
                
                // 修改重试逻辑，防止循环
                if (commentsRequestStatus.retryCount < 3) {
                    const nextRetryCount = commentsRequestStatus.retryCount + 1;
                    
                    setTimeout(() => {
                        if (isMounted.current) {
                            // 直接调用API而不是递归调用fetchComments
                            reviewAPI.getReviewsForItem('strategy', Number(id), { page, pageSize })
                                .then(response => {
                                    if (isMounted.current) {
                                        if (response.success) {
                                            setComments(response.data as unknown as StrategyComment[]);
                                            setCommentsPagination({
                                                current: response.meta.page,
                                                pageSize: response.meta.pageSize,
                                                total: response.meta.total
                                            });
                                            setCommentsRequestStatus(prev => ({ 
                                                ...prev, 
                                                loading: false,
                                                error: null,
                                                retryCount: 0
                                            }));
                                        } else {
                                            setCommentsRequestStatus(prev => ({ 
                                                ...prev, 
                                                loading: false,
                                                error: '评论加载失败',
                                                retryCount: nextRetryCount
                                            }));
                                        }
                                    }
                                })
                                .catch(() => {
                                    if (isMounted.current) {
                                        setCommentsRequestStatus(prev => ({ 
                                            ...prev, 
                                            loading: false,
                                            error: '评论重试加载失败',
                                            retryCount: nextRetryCount
                                        }));
                                    }
                                });
                        }
                    }, 2000);
                }
            }
        }
    }, [id, commentsRequestStatus.loading, commentsRequestStatus.retryCount]);
    
    // 使用防抖处理的评论获取函数
    const debouncedFetchComments = useDebounce(fetchComments, 300);
    
    // 处理评论分页变化
    const handleCommentPageChange = (page: number, pageSize?: number) => {
        if (commentsRequestStatus.loading) return;
        debouncedFetchComments(page, pageSize || commentsPagination.pageSize);
    };

    // 初始加载数据 - 重构此useEffect
    useEffect(() => {
        console.log('组件挂载或强制刷新，开始加载数据, forceRefresh:', forceRefresh);
        isMounted.current = true;
        
        // 重置加载超时状态
        setLoadingTimeout(false);
        
        // 强制设置loading为true，确保显示骨架屏
        setLoading(true);
        
        // 清除之前的计时器
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        
        // 分别加载各种数据，避免一个请求失败影响其他请求
        fetchStrategyDetail();
        fetchRelatedStrategies();
        fetchComments(1);
        
        // 添加额外的超时保护，最多15秒后强制退出loading状态
        const maxLoadingTimer = setTimeout(() => {
            if (isMounted.current && loading && !strategy) {
                console.log('达到最大加载时间，强制退出loading状态');
                setLoading(false);
                setLoadingTimeout(true);
            }
        }, 15000);
        
        // 组件卸载时清理
        return () => {
            console.log('组件卸载，清理资源');
            isMounted.current = false;
            
            // 清除所有计时器
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            clearTimeout(maxLoadingTimer);
        };
    }, [forceRefresh]); // 仅依赖forceRefresh，移除其他依赖
    
    // 监听加载状态变化 - 简化此useEffect逻辑
    useEffect(() => {
        // 仅在请求状态变化时更新全局加载状态，不触发新的请求
        const isAnyLoading = strategyRequestStatus.loading || relatedRequestStatus.loading;
        
        // 只在控制台输出日志，不触发额外的操作
        console.log('加载状态变化:', isAnyLoading ? '加载中' : '加载完成');
        
        // 如果不再加载且有数据，则更新加载状态
        if (!isAnyLoading && strategy) {
            setLoading(false);
        }
        // 如果不再加载但没有数据且有错误，也更新加载状态
        else if (!isAnyLoading && !strategy && strategyRequestStatus.error) {
            setLoading(false);
        }
    }, [strategyRequestStatus.loading, relatedRequestStatus.loading, strategyRequestStatus.error, strategy]);
    
    // 格式化日期字符串
    const formatDateString = (dateString: string | undefined) => {
        if (!dateString) return '';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
        } catch (error) {
            console.error('日期格式化错误:', error);
            return '';
        }
    };
    
    // 格式化评论日期（相对时间）
    const formatCommentDate = (dateString: string) => {
        const now = new Date();
        const commentDate = new Date(dateString);
        const diffMs = now.getTime() - commentDate.getTime();
        const diffSec = Math.round(diffMs / 1000);
        const diffMin = Math.round(diffSec / 60);
        const diffHour = Math.round(diffMin / 60);
        const diffDay = Math.round(diffHour / 24);
        
        if (diffSec < 60) {
            return '刚刚';
        } else if (diffMin < 60) {
            return `${diffMin}分钟前`;
        } else if (diffHour < 24) {
            return `${diffHour}小时前`;
        } else if (diffDay < 30) {
            return `${diffDay}天前`;
        } else {
            return formatDateString(dateString);
        }
    };
    
    // 收藏或取消收藏攻略
    const handleToggleFavorite = async () => {
        if (!isAuthenticated) {
            setShowLoginModal(true);
            return;
        }
        
        if (favoriteLoading) return;
        
        try {
            setFavoriteLoading(true);
            
            // 保存当前状态，以便在API请求失败时恢复
            const currentState = isFavorite;
            
            // 使用乐观更新模式
            setIsFavorite(!isFavorite);
            setStrategy((prev: StrategyDetailType | null) => prev ? {...prev, favoriteCount: (prev.favoriteCount || 0) + (isFavorite ? -1 : 1)} : null);
            
            // 实际调用API
            if (!isFavorite) {
                await strategyAPI.favoriteStrategy(Number(id));
            } else {
                await strategyAPI.unfavoriteStrategy(Number(id));
            }
        } catch (error) {
            console.error('收藏操作失败:', error);
            message.error('操作失败，请稍后重试');
            
            // 恢复到操作前的状态
            setIsFavorite(isFavorite);
            setStrategy((prev: StrategyDetailType | null) => prev ? {...prev, favoriteCount: (prev.favoriteCount || 0) - (isFavorite ? -1 : 1)} : null);
        } finally {
            setFavoriteLoading(false);
        }
    };
    
    // 点赞或取消点赞攻略
    const handleToggleLike = async () => {
        if (!isAuthenticated) {
            setShowLoginModal(true);
            return;
        }
        
        if (likeLoading) return;
        
        try {
            setLikeLoading(true);
            
            // 保存当前状态，以便在API请求失败时恢复
            const currentState = isLiked;
            
            // 使用乐观更新模式
            setIsLiked(!isLiked);
            setStrategy((prev: StrategyDetailType | null) => prev ? {...prev, like_count: (prev.like_count || 0) + (isLiked ? -1 : 1)} : null);
            
            // 实际调用API
            if (!isLiked) {
                await strategyAPI.likeStrategy(Number(id));
            } else {
                await strategyAPI.unlikeStrategy(Number(id));
            }
        } catch (error) {
            console.error('点赞操作失败:', error);
            message.error('操作失败，请稍后重试');
            
            // 恢复到操作前的状态
            setIsLiked(isLiked);
            setStrategy((prev: StrategyDetailType | null) => prev ? {...prev, like_count: (prev.like_count || 0) - (isLiked ? -1 : 1)} : null);
        } finally {
            setLikeLoading(false);
        }
    };
    
    // 提交评论
    const handleSubmitComment = async () => {
        if (!commentContent.trim()) {
            message.warning('评论内容不能为空');
            return;
        }
        
        if (submittingComment) return;
        
        try {
            setSubmittingComment(true);
            
            // 调用真实的 reviewAPI 创建评论
            const response = await reviewAPI.createReview({
                item_id: Number(id), // 确保 id 是 number 类型
                item_type: 'strategy',
                content: commentContent,
                rating: commentRating || 5 // 使用用户选择的评分或默认值
            });
            
            if (response.success) {
                message.success('评论发表成功');
                setCommentContent('');
                setCommentRating(0);
                // 重新加载评论，显示最新评论
                fetchComments(1);
            } else {
                message.error(response.message || '评论发表失败');
            }
        } catch (error) {
            console.error('提交评论失败:', error);
            message.error('提交评论失败，请稍后重试');
        } finally {
            setSubmittingComment(false);
        }
    };
    
    // 处理删除评论
    const handleDeleteComment = async (commentId: number | undefined) => {
        if (!isAuthenticated) return; // 仅登录用户可尝试删除自己的评论 (如果允许)
        
        // 添加防护措施，确保commentId有效
        if (!commentId) {
            message.error('评论ID无效，无法删除');
            return;
        }
        
        try {
            const response = await reviewAPI.deleteReview(commentId);
            if (response.success) {
                message.success(response.message || '评论已删除');
                // 重新加载当前页评论
                fetchComments(commentsPagination.current);
            } else {
                message.error(response.message || '删除评论失败');
            }
        } catch (error) {
            console.error('删除评论失败:', error);
            message.error('删除评论失败');
        }
    };
    
    // 前往登录页面
    const goToLogin = () => {
        setShowLoginModal(false);
        navigate('/login', { state: { from: `/strategies/${id}` } });
    };
    
    // 修改refreshData函数，添加手动刷新功能
    const refreshData = () => {
        console.log('手动刷新数据');
        // 强制重新加载所有数据
        setManualRefreshing(true);
        setForceRefresh(prev => prev + 1);
        
        // 重置状态
        setStrategyRequestStatus({
            loading: false,
            error: null,
            retryCount: 0
        });
        setRelatedRequestStatus({
            loading: false,
            error: null,
            retryCount: 0
        });
        setCommentsRequestStatus({
            loading: false,
            error: null,
            retryCount: 0
        });
        
        // 启动各种数据加载
        fetchStrategyDetail();
        
        // 如果策略数据已加载，同时刷新相关内容
        if (strategy?.id) {
            // 加载相关攻略
            fetchRelatedStrategies();
            // 加载评论
            fetchComments();
        }
    };
    
    // 渲染评论区域 (使用新的 comments state 和 StrategyComment)
    const renderComments = () => {
        const isLoading = commentsRequestStatus.loading;
        
        // 使用新的 comments state 判断
        if (!comments || comments.length === 0 && !isLoading) { 
            return <Text type="secondary" style={{ display: 'block', textAlign: 'center', padding: '20px 0' }}>暂无评论，快来抢沙发吧！</Text>;
        }
        
        return (
            <List
                loading={isLoading} // 使用评论加载状态
                dataSource={comments} // 使用 comments state
                itemLayout="horizontal"
                pagination={{
                    current: commentsPagination.current,
                    pageSize: commentsPagination.pageSize,
                    total: commentsPagination.total,
                    onChange: handleCommentPageChange, // 使用分页处理函数
                    hideOnSinglePage: true,
                    simple: true,
                }}
                renderItem={(comment: StrategyComment) => ( // 使用 StrategyComment
                   <Comment // 使用 antd 的 Comment 组件
                        key={comment.review_id} // 使用 review_id
                        author={<a>{comment.author?.username || '匿名用户'}</a>} // 使用 comment.author 访问作者信息
                        avatar={<Avatar src={comment.author?.avatar} icon={<UserOutlined />} />} // 使用 comment.author 访问作者信息
                        content={
                            <> 
                                {/* 显示评分 */}
                                <Rate disabled value={comment.rating} style={{ marginRight: 8 }}/> 
                                <Text>{comment.content}</Text>
                            </>
                        }
                        datetime={comment.created_at ? new Date(comment.created_at).toLocaleString() : ''} // 简单格式化
                        actions={
                            // 使用 comment.user_id 访问评论作者 ID
                            // 注意: StrategyComment 类型中可能没有 user_id, 需确认
                            isAuthenticated && user?.id === comment.author?.user_id ? // 检查 author.user_id
                            [<Popconfirm
                                title="确定删除这条评论吗？"
                                onConfirm={() => {
                                    // 优先使用review_id，如果不存在则尝试使用id
                                    const commentId = comment.review_id || comment.id;
                                    console.log('删除评论，ID:', commentId, '评论对象:', comment);
                                    // 添加类型检查，确保commentId存在且是数字类型
                                    if (typeof commentId === 'number') {
                                        handleDeleteComment(commentId);
                                    } else {
                                        message.error('评论ID无效，无法删除');
                                    }
                                }}
                                okText="确定"
                                cancelText="取消"
                             >
                                <Button type="link" danger size="small">删除</Button>
                            </Popconfirm>] 
                            : []
                        }
                    />
                )}
            />
        );
    };
    
    // 渲染评论表单
    const renderCommentForm = () => (
        <Card className="comment-form-card">
            <Title level={5}>发表评论</Title>
            <Form.Item label="为攻略打分" required style={{ marginBottom: 8 }}>
                <Rate 
                    allowHalf 
                    value={commentRating} 
                    onChange={setCommentRating} 
                    style={{ fontSize: 20 }}
                />
            </Form.Item>
            <Form.Item style={{ marginBottom: 8 }}>
                <TextArea 
                    rows={4} 
                    placeholder="输入你的评论内容..."
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                />
            </Form.Item>
            <Form.Item>
                 <Button 
                    type="primary" 
                    onClick={handleSubmitComment} 
                    loading={submittingComment}
                    disabled={!isAuthenticated}
                >
                    {isAuthenticated ? '发布评论' : '请先登录'}
                </Button>
            </Form.Item>
        </Card>
    );
    
    // 渲染相关景点
    const renderRelatedScenics = () => {
        if (!strategy || !strategy.relatedScenics || !strategy.relatedScenics.length) return null;
        
        return (
            <div className="related-scenics-section">
                <Title level={4} className="section-title">
                    <EnvironmentOutlined /> 相关景点
                </Title>
                
                <Row gutter={[16, 16]}>
                    {strategy.relatedScenics.map((scenic: RelatedScenic) => (
                        <Col xs={12} sm={8} md={6} key={scenic.id}>
                            <Card
                                hoverable
                                cover={
                                    <SafeImage 
                                        alt={scenic.name} 
                                        src={scenic.coverImage || ''}
                                        placeholderType={ImageType.SCENIC}
                                        fallbackText="景点图片"
                                    />
                                }
                                onClick={() => navigate(`/scenic/${scenic.id}`)}
                                className="scenic-card"
                            >
                                <Card.Meta
                                    title={scenic.name}
                                    description={
                                        <>
                                            <div className="scenic-location">
                                                <EnvironmentOutlined /> {scenic.location || scenic.city || '未知位置'}
                                            </div>
                                            <div className="scenic-price">
                                                <DollarOutlined /> ¥{scenic.price}/人
                                            </div>
                                        </>
                                    }
                                />
                            </Card>
                        </Col>
                    ))}
                </Row>
            </div>
        );
    };
    
    // 渲染相关攻略
    const renderRelatedStrategies = () => {
        const isLoading = relatedRequestStatus.loading;
        const hasError = relatedRequestStatus.error !== null;
        
        if (isLoading) {
            return (
                <div className="related-strategies-section">
                    <Title level={4} className="section-title">
                        <ClockCircleOutlined /> 相关攻略
                    </Title>
                    <Row gutter={[16, 16]}>
                        {[1, 2, 3].map((item) => (
                            <Col xs={24} sm={12} md={8} key={item}>
                                <Card loading className="related-strategy-card" />
                            </Col>
                        ))}
                    </Row>
                </div>
            );
        }
        
        if (hasError) {
            return (
                <div className="related-strategies-section">
                    <Title level={4} className="section-title">
                        <ClockCircleOutlined /> 相关攻略
                    </Title>
                    <Card className="error-card">
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <Text type="danger">{relatedRequestStatus.error}</Text>
                            <div style={{ marginTop: 16 }}>
                                <Button 
                                    type="primary" 
                                    icon={<ReloadOutlined />} 
                                    onClick={() => fetchRelatedStrategies()}
                                >
                                    重试
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            );
        }
        
        if (!relatedStrategies.length) {
            return (
                <div className="related-strategies-section">
                    <Title level={4} className="section-title">
                        <ClockCircleOutlined /> 相关攻略
                    </Title>
                    <Empty description="暂无相关攻略" />
                </div>
            );
        }
        
        return (
            <div className="related-strategies-section">
                <Title level={4} className="section-title">
                    <ClockCircleOutlined /> 相关攻略
                </Title>
                
                <Row gutter={[16, 16]}>
                    {relatedStrategies.map((item: Strategy) => (
                        <Col xs={24} sm={12} md={8} key={item.strategy_id}>
                            <Card
                                hoverable
                                cover={
                                    <div className="strategy-card-cover">
                                        <SafeImage 
                                            alt={item.title} 
                                            src={item.cover_image || ''}
                                            placeholderType={ImageType.STRATEGY}
                                            fallbackText="攻略图片"
                                        />
                                    </div>
                                }
                                onClick={() => navigate(`/strategies/${item.strategy_id}`)}
                                className="related-strategy-card"
                            >
                                <Card.Meta
                                    title={item.title}
                                    description={
                                        <div className="related-strategy-info">
                                            <Text type="secondary">{item.city}</Text>
                                            <Text type="secondary">
                                                <EyeOutlined /> {item.view_count || 0}
                                            </Text>
                                        </div>
                                    }
                                />
                            </Card>
                        </Col>
                    ))}
                </Row>
            </div>
        );
    };
    
    // 处理tags属性，确保它总是数组类型
    const formatTags = (tags: string | string[] | undefined): string[] => {
        if (!tags) return [];
        if (typeof tags === 'string') {
            // 如果是逗号分隔的字符串，分割为数组
            return tags.split(',').map(tag => tag.trim()).filter(Boolean);
        }
        return tags;
    };
    
    // 渲染内容区域
    const renderContent = () => {
        // 处理加载和错误状态
        if (loading && !strategy) {
            return (
                <Card bordered={false} className="strategy-detail-card">
                    <Skeleton active avatar paragraph={{ rows: 10 }} />
                </Card>
            );
        }

        if (strategyRequestStatus.error && !strategy) {
            return (
                <Card bordered={false} className="strategy-detail-card error-card">
                    <div className="error-message">
                        <div className="error-icon">
                            <InfoCircleOutlined />
                        </div>
                        <Typography.Title level={3}>加载攻略失败</Typography.Title>
                        <Typography.Paragraph>{strategyRequestStatus.error}</Typography.Paragraph>
                        <Button 
                            type="primary" 
                            onClick={refreshData}
                            loading={manualRefreshing}
                            icon={<ReloadOutlined />}
                        >
                            重新加载
                        </Button>
                    </div>
                </Card>
            );
        }

        // 确保策略数据存在
        if (!strategy) {
            return (
                <Card bordered={false} className="strategy-detail-card error-card">
                    <Empty 
                        description="攻略数据不存在或已被删除" 
                        image={Empty.PRESENTED_IMAGE_SIMPLE} 
                    />
                    <div style={{ textAlign: 'center', marginTop: 16 }}>
                        <Button type="primary" onClick={() => navigate('/strategies')}>
                            返回攻略列表
                        </Button>
                    </div>
                </Card>
            );
        }

        return (
            <div className="strategy-content">
                {/* 显示模拟数据警告 */}
                {isMockData && (
                    <Alert
                        message="模拟数据提示"
                        description="当前显示的是模拟数据，可能与实际内容不符。API连接失败时会显示此内容作为替代。"
                        type="warning"
                        showIcon
                        closable
                        style={{ marginBottom: 16 }}
                        action={
                            <Button 
                                size="small" 
                                type="primary"
                                onClick={refreshData}
                                loading={manualRefreshing}
                            >
                                重试加载
                            </Button>
                        }
                    />
                )}

                {/* 标题区域 */}
                <Card bordered={false} className="strategy-detail-card">
                    <div className="strategy-header">
                        <Typography.Title level={2}>{strategy.title}</Typography.Title>

                        <div className="strategy-meta">
                            <div className="author-info">
                                <Avatar 
                                    src={strategy.author?.avatar} 
                                    icon={!strategy.author?.avatar && <UserOutlined />} 
                                />
                                <span className="author-name">{strategy.author?.username || '佚名'}</span>
                            </div>

                            <div className="strategy-stats">
                                <Tooltip title="浏览量">
                                    <span className="stat-item"><EyeOutlined /> {strategy.view_count || 0}</span>
                                </Tooltip>
                                <Tooltip title="点赞数">
                                    <span className="stat-item">
                                        {isLiked ? <LikeFilled style={{ color: '#1890ff' }} /> : <LikeOutlined />} {strategy.like_count || 0}
                                    </span>
                                </Tooltip>
                                <Tooltip title="收藏数">
                                    <span className="stat-item">
                                        {isFavorite ? <BookFilled style={{ color: '#1890ff' }} /> : <BookOutlined />} {strategy.favoriteCount || 0}
                                    </span>
                                </Tooltip>
                                <Tooltip title="发布时间">
                                    <span className="stat-item">
                                        <ClockCircleOutlined /> {formatDateString(strategy.created_at)}
                                    </span>
                                </Tooltip>
                                {strategy.city && (
                                    <Tooltip title="城市">
                                        <span className="stat-item">
                                            <EnvironmentOutlined /> {strategy.city}
                                        </span>
                                    </Tooltip>
                                )}
                            </div>
                        </div>

                        {/* 标签区域 */}
                        {strategy.tags && (
                            <div className="strategy-tags">
                                {formatTags(strategy.tags).map((tag: string, index: number) => (
                                    <Tag key={index} color="blue">{tag}</Tag>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 内容区域 */}
                    <Divider />

                    <div className="strategy-body">
                        {/* 处理Markdown或富文本内容 */}
                        <div className="strategy-content-text" dangerouslySetInnerHTML={{ __html: strategy.content }} />
                        
                        {/* 图片区域 */}
                        {strategy.images && strategy.images.length > 0 && (
                            <div className="strategy-images">
                                <Row gutter={[16, 16]}>
                                    {Array.isArray(strategy.images) ? (
                                        strategy.images.map((image: string | ImageType, index: number) => (
                                            <Col key={index} xs={24} sm={12} md={8}>
                                                <SafeImage 
                                                    src={typeof image === 'string' ? image : (image as any).url} 
                                                    alt={`攻略图片 ${index + 1}`} 
                                                    className="strategy-image"
                                                    fallbackSrc="https://via.placeholder.com/400x300?text=图片加载失败"
                                                />
                                            </Col>
                                        ))
                                    ) : (
                                        <Col span={24}>
                                            <SafeImage 
                                                src={strategy.images} 
                                                alt="攻略图片" 
                                                className="strategy-image"
                                                fallbackSrc="https://via.placeholder.com/400x300?text=图片加载失败"
                                            />
                                        </Col>
                                    )}
                                </Row>
                            </div>
                        )}
                    </div>

                    {/* 行动按钮 */}
                    <div className="strategy-actions">
                        <Button 
                            icon={isLiked ? <LikeFilled /> : <LikeOutlined />} 
                            onClick={handleToggleLike}
                            loading={likeLoading}
                            type={isLiked ? "primary" : "default"}
                        >
                            {isLiked ? '已点赞' : '点赞'}
                        </Button>
                        <Button 
                            icon={isFavorite ? <BookFilled /> : <BookOutlined />} 
                            onClick={handleToggleFavorite}
                            loading={favoriteLoading}
                            type={isFavorite ? "primary" : "default"}
                        >
                            {isFavorite ? '已收藏' : '收藏'}
                        </Button>
                        <Button icon={<ShareAltOutlined />}>分享</Button>
                        <Button 
                            icon={<ReloadOutlined />} 
                            onClick={refreshData} 
                            loading={manualRefreshing}
                        >
                            刷新
                        </Button>
                    </div>
                </Card>
               
                {/* 相关景点 */}
                {strategy.relatedScenics && strategy.relatedScenics.length > 0 && (
                    <Card 
                        title="相关景点" 
                        bordered={false} 
                        className="strategy-detail-card"
                        extra={
                            <Link to={`/scenic?keyword=${strategy.city || ''}`}>
                                查看更多景点
                            </Link>
                        }
                    >
                        {renderRelatedScenics()}
                    </Card>
                )}

                {/* 相关攻略 */}
                {relatedStrategies.length > 0 && (
                    <Card 
                        title="相关攻略" 
                        bordered={false} 
                        className="strategy-detail-card"
                        extra={
                            <Link to="/strategies">查看更多攻略</Link>
                        }
                    >
                        {renderRelatedStrategies()}
                    </Card>
                )}

                {/* 评论区 */}
                <Card 
                    title="攻略评论" 
                    bordered={false} 
                    className="strategy-detail-card"
                    extra={
                        <Typography.Text type="secondary">
                            共 {commentsPagination.total} 条评论
                        </Typography.Text>
                    }
                >
                    {renderCommentForm()}
                    {renderComments()}
                </Card>
            </div>
        );
    };
    
    return (
        <div className="strategy-detail-container">
            <Row gutter={[24, 24]}>
                <Col xs={24} sm={24} md={24} lg={18} xl={18}>
                    {renderContent()}
                </Col>
                <Col xs={24} sm={24} md={24} lg={6} xl={6}>
                    {/* 侧边栏内容 */}
                    <div className="strategy-sidebar">
                        {/* 作者信息卡片 */}
                        {strategy && strategy.author && (
                            <Card bordered={false} className="author-card">
                                <div className="author-header">
                                    <Avatar 
                                        size={64} 
                                        src={strategy.author.avatar} 
                                        icon={!strategy.author.avatar && <UserOutlined />}
                                    />
                                    <div className="author-info">
                                        <Typography.Title level={4}>{strategy.author.username}</Typography.Title>
                                        <Typography.Text type="secondary">旅行爱好者</Typography.Text>
                                    </div>
                                </div>
                                <div className="author-bio">
                                    <Typography.Paragraph ellipsis={{ rows: 3 }}>
                                        {/* 如果有作者简介则显示，否则显示默认文本 */}
                                        {(strategy.author as any)?.bio || '这位作者很懒，还没有填写个人简介。'}
                                    </Typography.Paragraph>
                                </div>
                                <div className="author-stats">
                                    <div className="stat-item">
                                        <div className="stat-value">12</div>
                                        <div className="stat-label">攻略</div>
                                    </div>
                                    <div className="stat-item">
                                        <div className="stat-value">358</div>
                                        <div className="stat-label">粉丝</div>
                                    </div>
                                    <div className="stat-item">
                                        <div className="stat-value">26</div>
                                        <div className="stat-label">城市</div>
                                    </div>
                                </div>
                                {isAuthenticated && user?.id !== (strategy.author as any).id && (
                                    <Button type="primary" block>关注作者</Button>
                                )}
                            </Card>
                        )}
                        
                        {/* 目的地卡片 */}
                        {strategy && strategy.city && (
                            <Card 
                                title={
                                    <Space>
                                        <EnvironmentOutlined />
                                        <span>目的地信息</span>
                                    </Space>
                                } 
                                bordered={false} 
                                className="destination-card"
                            >
                                <Typography.Title level={4}>{strategy.city}</Typography.Title>
                                <div className="destination-action">
                                    <Button type="link" onClick={() => navigate(`/scenic?city=${strategy.city}`)}>
                                        查看{strategy.city}的所有景点
                                    </Button>
                                </div>
                            </Card>
                        )}
                    </div>
                </Col>
            </Row>

            {/* 登录提示模态框 */}
            <Modal
                title="需要登录"
                open={showLoginModal}
                onCancel={() => setShowLoginModal(false)}
                footer={[
                    <Button key="cancel" onClick={() => setShowLoginModal(false)}>
                        取消
                    </Button>,
                    <Button key="login" type="primary" onClick={goToLogin}>
                        去登录
                    </Button>
                ]}
            >
                <p>您需要登录后才能执行此操作。</p>
            </Modal>
        </div>
    );
};

export default StrategyDetail; 