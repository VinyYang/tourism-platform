import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Spin, Rate, Button, message, Divider, notification } from 'antd';
import { HeartOutlined, HeartFilled, StarOutlined, EnvironmentOutlined, ClockCircleOutlined, DollarOutlined } from '@ant-design/icons';
import scenicAPI, { ScenicDetail as ScenicDetailType, ApiResponse } from '../api/scenic';
import { useAuth } from '../context/AuthContext';
import './ScenicDetail.css';

const ScenicDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [scenicData, setScenicData] = useState<ScenicDetailType | null>(null);
    const [activeImage, setActiveImage] = useState<number>(0);
    const [isFavorite, setIsFavorite] = useState<boolean>(false);
    const [favoriteLoading, setFavoriteLoading] = useState<boolean>(false);
    
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    // 加载景点数据
    useEffect(() => {
        const fetchScenicDetail = async () => {
            if (!id) return;
            
            setLoading(true);
            setError(null);
            
            try {
                const response = await scenicAPI.getScenicDetail(parseInt(id));
                // 在设置状态前，先做一次基本的数据校验和处理，确保 images 是数组
                console.log('获取到景点详情数据:', JSON.stringify(response.data));
                
                // 修正：API实际返回格式为 { success: true, data: {...} }
                let scenicDetail: ScenicDetailType | null = null;
                
                // 检查response.data是否符合ApiResponse<ScenicDetail>格式
                const isApiResponseFormat = 
                    response.data && 
                    typeof response.data === 'object' && 
                    'success' in response.data && 
                    'data' in response.data;
                
                if (isApiResponseFormat) {
                    // 新的API格式 - 嵌套结构
                    const apiResponse = response.data as ApiResponse<ScenicDetailType>;
                    scenicDetail = apiResponse.data;
                } else {
                    // 兼容旧格式 - 直接结构
                    scenicDetail = response.data as ScenicDetailType;
                }
                
                if (scenicDetail && typeof scenicDetail === 'object') {
                    // 处理图片数据
                    let imagesArray: string[] = [];
                    if (scenicDetail.images) {
                        if (Array.isArray(scenicDetail.images)) {
                            imagesArray = scenicDetail.images;
                        } else if (typeof scenicDetail.images === 'string') {
                            try {
                                const parsed = JSON.parse(scenicDetail.images);
                                imagesArray = Array.isArray(parsed) ? parsed : [];
                            } catch (e) {
                                console.warn(`景点 ID ${id} 的 images 字段不是有效的 JSON:`, scenicDetail.images);
                                // 尝试按逗号分隔
                                imagesArray = scenicDetail.images.split(',').map((img: string) => img.trim());
                            }
                        }
                    } else if (scenicDetail.cover_image || scenicDetail.coverImage) {
                        // 如果只有封面图片，将其作为唯一图片
                        const coverImg = scenicDetail.cover_image || scenicDetail.coverImage;
                        if (coverImg) imagesArray = [coverImg];
                    }
                    
                    // 添加默认图片
                    if (imagesArray.length === 0) {
                        imagesArray = ['https://th.bing.com/th/id/R.10c59a6bbe5d106587c91bab159bb416?rik=PA9u5SN2wgi%2fiQ&pid=ImgRaw&r=0'];
                    }
                    
                    // 确保其他需要是数组的字段也是数组
                    scenicDetail.images = imagesArray;
                    scenicDetail.features = Array.isArray(scenicDetail.features) ? scenicDetail.features : [];
                    
                    // 处理附近景点数据
                    scenicDetail.nearbySpots = Array.isArray(scenicDetail.nearbySpots) ? scenicDetail.nearbySpots : [];
                    
                    // 处理评论数据
                    scenicDetail.reviews = Array.isArray(scenicDetail.reviews) ? scenicDetail.reviews : [];
                    
                    // 确保文本字段有默认值
                    scenicDetail.name = scenicDetail.name || '未知景点';
                    scenicDetail.address = scenicDetail.address || '地址信息暂无';
                    scenicDetail.description = scenicDetail.description || '暂无描述信息';
                    scenicDetail.openTime = scenicDetail.openTime || scenicDetail.open_time || '营业时间信息暂无';
                    
                    // 确保评分字段存在
                    scenicDetail.hotScore = scenicDetail.hotScore || scenicDetail.hot_score || scenicDetail.score || scenicDetail.rating || 0;
                    
                    // 设置价格字段
                    scenicDetail.ticketPrice = scenicDetail.ticketPrice || scenicDetail.ticket_price || scenicDetail.price || 0;
                    
                    // 确保coverImage字段存在
                    if (!scenicDetail.coverImage && imagesArray.length > 0) {
                        scenicDetail.coverImage = imagesArray[0];
                    }
                    
                    // 处理标签字段
                    if (typeof scenicDetail.label === 'string') {
                        scenicDetail.features = scenicDetail.label.split(',');
                    } else if (Array.isArray(scenicDetail.label)) {
                        scenicDetail.features = scenicDetail.label;
                    }
                    
                    console.log('处理后的景点数据:', scenicDetail);
                    setScenicData(scenicDetail);
                } else {
                    throw new Error('获取到的景点数据格式无效');
                }
                
                // TODO: 检查是否已收藏，实际项目中应从API获取
                setIsFavorite(false);
            } catch (err) {
                console.error('获取景点详情失败:', err);
                setError('获取景点详情失败，请稍后再试');
                setScenicData(null); // 确保出错时 scenicData 为 null
            } finally {
                setLoading(false);
            }
        };
        
        fetchScenicDetail();
    }, [id]);

    // 切换到下一张图片
    const nextImage = () => {
        // 确保 scenicData 和 images 存在且是数组
        if (scenicData && Array.isArray(scenicData.images) && scenicData.images.length > 0) {
            setActiveImage((prev) => (prev === scenicData.images.length - 1 ? 0 : prev + 1));
        }
    };

    // 切换到上一张图片
    const prevImage = () => {
        // 确保 scenicData 和 images 存在且是数组
        if (scenicData && Array.isArray(scenicData.images) && scenicData.images.length > 0) {
            setActiveImage((prev) => (prev === 0 ? scenicData.images.length - 1 : prev - 1));
        }
    };
    
    // 收藏/取消收藏景点
    const toggleFavorite = async () => {
        if (!isAuthenticated) {
            message.warning('请先登录后再收藏');
            navigate('/login', { state: { from: `/scenic/${id}` } });
            return;
        }
        
        setFavoriteLoading(true);
        
        try {
            if (isFavorite) {
                // 实际项目中需要根据API设计调整
                // await scenicAPI.removeFavorite(scenicId);
                
                // 模拟API调用
                await new Promise(resolve => setTimeout(resolve, 500));
                
                message.success('已取消收藏');
            } else {
                if (!id) return;
                
                // 实际项目中取消注释
                // await scenicAPI.addFavorite(id);
                
                // 模拟API调用
                await new Promise(resolve => setTimeout(resolve, 500));
                
                message.success('已添加到收藏');
            }
            
            setIsFavorite(!isFavorite);
        } catch (err) {
            message.error('操作失败，请稍后再试');
            console.error('收藏操作失败:', err);
        } finally {
            setFavoriteLoading(false);
        }
    };
    
    // 预订门票
    const handleBooking = () => {
        if (!isAuthenticated) {
            message.warning('请先登录后再预订');
            navigate('/login', { state: { from: `/scenic/${id}` } });
            return;
        }
        
        // 确保id存在
        if (!id) {
            message.error('景点ID无效');
            return;
        }
        
        console.log('跳转到预订页面，景点ID:', id);
        // 跳转到预订页面
        navigate(`/booking/${id}`);
    };

    if (loading) {
        return (
            <div className="scenic-detail-loading">
                <Spin size="large" />
                <p>正在加载景点信息...</p>
            </div>
        );
    }

    // 这里的检查 !scenicData 应该可以防止后续访问 undefined 的属性
    if (error || !scenicData) {
        return (
            <div className="scenic-detail-error">
                <p>{error || '无法获取景点信息'}</p>
                <Button type="primary" onClick={() => navigate('/scenic')}>
                    返回景点列表
                </Button>
            </div>
        );
    }
    
    // 渲染主图片
    const renderMainImage = () => {
        let mainImageUrl: string | null = null;
        
        // 直接使用处理后的 scenicData.images (应该已经是数组了)
        if (Array.isArray(scenicData.images) && scenicData.images.length > 0) {
            const validIndex = Math.max(0, Math.min(activeImage, scenicData.images.length - 1));
            mainImageUrl = scenicData.images[validIndex];
        } else if (scenicData.coverImage) { // 备选：使用 coverImage
            mainImageUrl = scenicData.coverImage;
        } else if (scenicData.cover_image) { // 再备选：使用 cover_image
            mainImageUrl = scenicData.cover_image;
        }

        // 设置默认图片
        const fallbackImage = 'https://th.bing.com/th/id/R.10c59a6bbe5d106587c91bab159bb416?rik=PA9u5SN2wgi%2fiQ&pid=ImgRaw&r=0';
        
        // 图片加载错误处理
        const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
            e.currentTarget.src = fallbackImage;
            e.currentTarget.onerror = null; // 防止循环请求
        };

        if (mainImageUrl) {
            return (
                <>
                    <img 
                        src={mainImageUrl} 
                        alt={scenicData.name || '景点图片'} 
                        onError={handleImageError}
                    />
                    {/* 只有多于一张图片时才显示切换按钮 */}
                    {Array.isArray(scenicData.images) && scenicData.images.length > 1 && (
                        <>
                            <button className="gallery-nav prev" onClick={prevImage}>&#10094;</button>
                            <button className="gallery-nav next" onClick={nextImage}>&#10095;</button>
                        </>
                    )}
                </>
            );
        }
        
        // 如果没有图片，显示占位符
        return (
            <div style={{ height: '100%', width: '100%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#bfbfbf' }}>暂无图片</span>
            </div>
        );
    };

    // 渲染缩略图
    const renderThumbnails = () => {
        // 默认图片
        const fallbackImage = 'https://th.bing.com/th/id/R.10c59a6bbe5d106587c91bab159bb416?rik=PA9u5SN2wgi%2fiQ&pid=ImgRaw&r=0';
        
        // 图片加载错误处理
        const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
            e.currentTarget.src = fallbackImage;
            e.currentTarget.onerror = null; // 防止循环请求
        };
        
        // 直接使用处理后的 scenicData.images，并检查长度
        if (Array.isArray(scenicData.images) && scenicData.images.length > 1) { 
            return scenicData.images.map((img: string, index: number) => (
                <img
                    key={index}
                    src={img}
                    alt={`${scenicData.name} ${index + 1}`}
                    className={index === activeImage ? 'active' : ''}
                    onClick={() => setActiveImage(index)}
                    onError={handleImageError}
                />
            ));
        }
        return null; // 如果图片不足，不渲染缩略图区域
    };

    return (
        <div className="scenic-detail-container">
            {/* 页面头部 */}
            <div className="scenic-detail-header">
                <h1>{scenicData.name}</h1>
                <div className="scenic-detail-breadcrumb">
                    <Link to="/">首页</Link> &gt; <Link to="/scenic">景点</Link> &gt; <span>{scenicData.name}</span>
                </div>
            </div>

            {/* 景点信息 */}
            <div className="scenic-detail-info">
                <div className="scenic-detail-gallery">
                    <div className="scenic-detail-main-image">
                         {renderMainImage()} 
                    </div>
                    <div className="scenic-detail-thumbnails">
                         {renderThumbnails()} 
                    </div>
                </div>

                <div className="scenic-detail-meta">
                    <div className="scenic-detail-rating">
                        <span className="rating-value">{(scenicData.hotScore || scenicData.score || scenicData.rating || 0) / 10 || 0}</span>
                        <div className="rating-stars">
                            <Rate disabled defaultValue={(scenicData.hotScore || scenicData.score || scenicData.rating || 0) / 10 || 0} allowHalf />
                        </div>
                    </div>

                    <div className="scenic-detail-basics">
                        <p><EnvironmentOutlined /> <strong>地址：</strong>{scenicData.address}</p>
                        <p><ClockCircleOutlined /> <strong>开放时间：</strong>{scenicData.openTime}</p>
                        <p><DollarOutlined /> <strong>门票：</strong>
                            {(() => {
                                // 确保价格是有效数字
                                const ticketPrice = scenicData.ticketPrice || scenicData.ticket_price || scenicData.price || null;
                                
                                if (ticketPrice === 0) {
                                    return '免费';
                                } else if (ticketPrice !== null) {
                                    return `¥${ticketPrice}`;
                                } else {
                                    return '价格待定';
                                }
                            })()}
                        </p>
                    </div>

                    {/* 特色标签 - 使用处理后的 scenicData.features */}
                    <div className="scenic-detail-features">
                        <h3>特色标签</h3>
                        <div className="feature-tags">
                            {(() => {
                                // 处理特色标签的显示逻辑
                                let tagsToDisplay: string[] = [];
                                
                                // 优先使用features字段
                                if (Array.isArray(scenicData.features) && scenicData.features.length > 0) {
                                    tagsToDisplay = scenicData.features;
                                } 
                                // 其次使用label字段
                                else if (typeof scenicData.label === 'string' && scenicData.label.trim()) {
                                    tagsToDisplay = scenicData.label.split(',').map(tag => tag.trim());
                                }
                                // 再其次使用labels字段
                                else if (scenicData.labels) {
                                    if (Array.isArray(scenicData.labels)) {
                                        tagsToDisplay = scenicData.labels as string[];
                                    } else if (typeof scenicData.labels === 'string') {
                                        tagsToDisplay = scenicData.labels.split(',').map(tag => tag.trim());
                                    }
                                }
                                
                                // 如果没有任何标签数据，显示默认标签
                                if (tagsToDisplay.length === 0) {
                                    tagsToDisplay = ['景点'];
                                }
                                
                                // 渲染标签
                                return tagsToDisplay.map((tag, index) => (
                                    <span key={index} className="feature-tag">{tag}</span>
                                ));
                            })()}
                        </div>
                    </div>

                    <div className="scenic-detail-booking">
                        <Button 
                            type="primary" 
                            size="large" 
                            className="booking-btn"
                            onClick={handleBooking}
                        >
                            立即预订
                        </Button>
                        <Button
                            type={isFavorite ? "default" : "primary"}
                            ghost={!isFavorite}
                            size="large"
                            icon={isFavorite ? <HeartFilled /> : <HeartOutlined />}
                            className="wishlist-btn"
                            onClick={toggleFavorite}
                            loading={favoriteLoading}
                        >
                            {isFavorite ? '已收藏' : '收藏'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* 景点描述 */}
            <div className="scenic-detail-description">
                <h2>景点描述</h2>
                <p>{scenicData.description}</p>
            </div>

            {/* 附近景点 - 使用处理后的 scenicData.nearbySpots */}
            {Array.isArray(scenicData.nearbySpots) && scenicData.nearbySpots.length > 0 && (
                <div className="scenic-detail-nearby">
                    <h2>附近景点</h2>
                    <div className="nearby-spots-list">
                        {scenicData.nearbySpots.map((spot) => (
                            <div key={spot.id} className="nearby-spot-item">
                                <Link to={`/scenic/${spot.id}`}>
                                    <h3>{spot.name}</h3>
                                    <p>距离: {spot.distance}</p>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 用户评价 - 使用处理后的 scenicData.reviews */}
            {Array.isArray(scenicData.reviews) && scenicData.reviews.length > 0 && (
                <div className="scenic-detail-reviews">
                    <h2>用户评价</h2>
                    <div className="reviews-list"> {/* 修改类名为 reviews-list */} 
                        {scenicData.reviews.map((review) => (
                            <div key={review.id} className="review-item">
                                <div className="review-header">
                                    <div className="review-user">
                                        {/* 添加对 review.avatar 的检查 */}
                                        {review.avatar && (
                                            <img src={review.avatar} alt={review.username || '用户头像'} className="reviewer-avatar" />
                                        )}
                                        <span>{review.username || '匿名用户'}</span>
                                    </div>
                                    <div className="review-rating">
                                         {/* 添加对 review.rating 的检查 */}
                                        {typeof review.rating === 'number' && <Rate disabled defaultValue={review.rating} />}
                                    </div>
                                    {/* 添加对 review.createdAt 的检查 */}
                                    <div className="review-date">{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}</div>
                                </div>
                                <div className="review-content">{review.content}</div>
                            </div>
                        ))}
                    </div>
                     {/* 添加写评价按钮（可选，需要功能实现） */}
                     <div className="add-review-section" style={{ marginTop: '20px' }}>
                         {isAuthenticated ? (
                             <Button 
                                 type="primary" 
                                 icon={<StarOutlined />}
                                 onClick={() => message.info('评价功能开发中')}
                             >
                                 写评价
                             </Button>
                         ) : (
                             <p>请 <Link to={`/login?redirect=/scenic/${id}`}>登录</Link> 后发表评价</p>
                         )}
                     </div>
                </div>
            )}

             {/* 如果没有评论，也可以显示提示 */} 
            {!(Array.isArray(scenicData.reviews) && scenicData.reviews.length > 0) && (
                 <div className="scenic-detail-reviews">
                     <h2>用户评价</h2>
                     <div className="no-reviews">
                         <p>暂无评价</p>
                         {isAuthenticated ? (
                             <Button 
                                 type="primary" 
                                 icon={<StarOutlined />}
                                 onClick={() => message.info('评价功能开发中')}
                             >
                                 写评价
                             </Button>
                         ) : (
                             <p>请 <Link to={`/login?redirect=/scenic/${id}`}>登录</Link> 后发表评价</p>
                         )}
                     </div>
                 </div>
            )}
        </div>
    );
};

export default ScenicDetail; 