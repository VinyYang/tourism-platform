import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import hotelAPI, { HotelDetail as HotelDetailType, HotelPolicies } from '../api/hotel';
import './HotelDetail.css'; // 稍后会创建这个CSS文件

const HotelDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [hotel, setHotel] = useState<HotelDetailType | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'info' | 'rooms' | 'reviews' | 'map'>('info');

    useEffect(() => {
        const fetchHotelDetail = async () => {
            setLoading(true);
            try {
                if (!id) {
                    throw new Error('酒店ID不存在');
                }
                const response = await hotelAPI.getHotelDetail(id);
                
                // 增强数据验证和类型转换逻辑
                if (response.data) {
                    // 创建新对象避免直接修改原始响应数据
                    const hotelData = { ...response.data };
                    
                    // 确保policies对象格式正确
                    if (hotelData.policies && typeof hotelData.policies === 'object') {
                        // 确保每个属性都是字符串类型
                        const safePolicy: HotelPolicies = {
                            checkIn: typeof hotelData.policies.checkIn === 'string' ? hotelData.policies.checkIn : String(hotelData.policies.checkIn || ''),
                            checkOut: typeof hotelData.policies.checkOut === 'string' ? hotelData.policies.checkOut : String(hotelData.policies.checkOut || ''),
                            children: typeof hotelData.policies.children === 'string' ? hotelData.policies.children : String(hotelData.policies.children || ''),
                            pets: typeof hotelData.policies.pets === 'string' ? hotelData.policies.pets : String(hotelData.policies.pets || ''),
                            cancellation: typeof hotelData.policies.cancellation === 'string' ? hotelData.policies.cancellation : String(hotelData.policies.cancellation || '')
                        };
                        hotelData.policies = safePolicy;
                    }
                    
                    // 确保images字段是数组
                    if (hotelData.images && typeof hotelData.images === 'string') {
                        hotelData.images = hotelData.images.split(',');
                    }
                    
                    // 处理facilities(amenities)字段映射
                    if (hotelData.amenities && !hotelData.facilities) {
                        hotelData.facilities = hotelData.amenities;
                    }
                    
                    // 处理评分字段映射
                    if (hotelData.score !== undefined && hotelData.rating === undefined) {
                        // 确保传递给parseFloat的是字符串
                        hotelData.rating = typeof hotelData.score === 'string' 
                            ? parseFloat(hotelData.score) 
                            : hotelData.score as number;
                    }
                    
                    // 处理房间数据字段映射 - 使用类型断言
                    if (hotelData.rooms && Array.isArray(hotelData.rooms)) {
                        hotelData.rooms = hotelData.rooms.map(room => {
                            // 使用类型断言来访问可能不存在的字段
                            const roomAny = room as any;
                            return {
                                id: room.id,
                                name: roomAny.name || roomAny.type || '未命名房型',
                                description: roomAny.description || `${roomAny.size || ''} ${roomAny.beds || ''}`.trim(),
                                price: room.price,
                                capacity: roomAny.maxOccupancy || roomAny.capacity || 2,
                                facilities: roomAny.amenities || roomAny.facilities || [],
                                images: Array.isArray(roomAny.images) ? roomAny.images : [roomAny.images].filter(Boolean),
                                available: roomAny.available !== undefined ? roomAny.available : true
                            };
                        });
                    }
                    
                    // 处理评论数据字段映射 - 使用类型断言
                    if (hotelData.reviews && Array.isArray(hotelData.reviews)) {
                        hotelData.reviews = hotelData.reviews.map(review => {
                            // 使用类型断言来访问可能不存在的字段
                            const reviewAny = review as any;
                            return {
                                id: review.id,
                                userId: review.userId,
                                username: reviewAny.username || reviewAny.userName || '匿名用户',
                                avatar: reviewAny.avatar || `https://placehold.co/50?text=U${review.userId}`,
                                content: reviewAny.content || reviewAny.comment || '',
                                rating: review.rating,
                                createdAt: reviewAny.createdAt || reviewAny.date || new Date().toISOString()
                            };
                        });
                    }
                    
                    // 确保nearbyAttractions字段存在
                    if (hotelData.location && hotelData.location.nearbyAttractions && !hotelData.nearbyAttractions) {
                        hotelData.nearbyAttractions = hotelData.location.nearbyAttractions.map((attraction, idx) => ({
                            id: idx + 1,
                            name: attraction.name,
                            distance: attraction.distance,
                            type: '景点'
                        }));
                    }
                    
                    console.log('处理后的酒店数据:', hotelData);
                    setHotel(hotelData);
                    
                    // 初始化选中的图片为第一张
                    if (hotelData.images) {
                        if (Array.isArray(hotelData.images) && hotelData.images.length > 0) {
                            setSelectedImage(hotelData.images[0]);
                        } else if (typeof hotelData.images === 'string') {
                            setSelectedImage(hotelData.images);
                        }
                    }
                }
            } catch (err) {
                console.error('获取酒店详情失败:', err);
                setError('获取酒店详情失败，请稍后重试');
            } finally {
                setLoading(false);
            }
        };

        fetchHotelDetail();
    }, [id]);

    // 渲染星级评分
    const renderStars = (stars: number) => {
        return Array.from({ length: 5 }, (_, i) => (
            <span key={i} className={`star ${i < stars ? 'filled' : 'empty'}`}>★</span>
        ));
    };

    // 处理图片切换
    const handleImageClick = (image: string) => {
        setSelectedImage(image);
    };

    if (loading) {
        return <div className="loading">加载中...</div>;
    }

    if (error || !hotel) {
        return <div className="error">{error || '未找到酒店信息'}</div>;
    }

    return (
        <div className="hotel-detail-container">
            <div className="hotel-detail-header">
                <h1 className="hotel-name">{hotel.name}</h1>
                <div className="hotel-rating">
                    {renderStars(hotel.stars || Math.floor(hotel.rating))}
                    <span className="rating-text">({hotel.rating}分)</span>
                </div>
                <div className="hotel-address">
                    <span className="hotel-city">{hotel.city}</span>
                    <span className="hotel-location">{hotel.address}</span>
                </div>
            </div>

            <div className="hotel-image-gallery">
                <div className="main-image">
                    <img 
                        src={selectedImage || (hotel.images && (Array.isArray(hotel.images) ? (hotel.images.length > 0 ? hotel.images[0] : '') : hotel.images)) || 'https://placehold.co/800x600?text=酒店图片'} 
                        alt={hotel.name}
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://placehold.co/800x600?text=酒店图片';
                        }}
                    />
                </div>
                <div className="thumbnail-container">
                    {(() => {
                        // 确保images是数组
                        const imagesArray: string[] = Array.isArray(hotel.images) 
                            ? hotel.images 
                            : (typeof hotel.images === 'string' ? hotel.images.split(',') : []);
                        
                        return imagesArray.map((image: string, index: number) => (
                            <div 
                                key={index} 
                                className={`thumbnail ${selectedImage === image ? 'active' : ''}`}
                                onClick={() => handleImageClick(image)}
                            >
                                <img 
                                    src={image} 
                                    alt={`${hotel.name} - 图片 ${index + 1}`}
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = 'https://placehold.co/150x150?text=缩略图';
                                    }}
                                />
                            </div>
                        ));
                    })()}
                </div>
            </div>

            <div className="hotel-detail-tabs">
                <div className={`tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>
                    酒店信息
                </div>
                <div className={`tab ${activeTab === 'rooms' ? 'active' : ''}`} onClick={() => setActiveTab('rooms')}>
                    房型与价格
                </div>
                <div className={`tab ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>
                    用户评价
                </div>
                <div className={`tab ${activeTab === 'map' ? 'active' : ''}`} onClick={() => setActiveTab('map')}>
                    地图与周边
                </div>
            </div>

            <div className="hotel-detail-content">
                {activeTab === 'info' && (
                    <div className="hotel-info-tab">
                        <div className="hotel-description">
                            <h2>酒店简介</h2>
                            <p>{hotel.description}</p>
                        </div>
                        
                        <div className="hotel-facilities">
                            <h2>酒店设施</h2>
                            <div className="facilities-list">
                                {(() => {
                                    // 确保facilities是数组
                                    const facilitiesArray = Array.isArray(hotel.facilities) 
                                        ? hotel.facilities 
                                        : (hotel.amenities && Array.isArray(hotel.amenities) 
                                            ? hotel.amenities 
                                            : []);
                                    
                                    return facilitiesArray.map((facility, index) => (
                                        <div key={index} className="facility-item">
                                            <span className="facility-icon">✓</span>
                                            <span className="facility-name">{facility}</span>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                        
                        <div className="hotel-policies">
                            <h2>酒店政策</h2>
                            {hotel.policies && typeof hotel.policies === 'object' ? (
                                <div className="policies-list">
                                    {/* 确保以安全的方式访问policies属性 */}
                                    {hotel.policies.checkIn && typeof hotel.policies.checkIn === 'string' && (
                                        <div className="policy-item">
                                            <span className="policy-label">入住时间:</span>
                                            <span className="policy-value">{hotel.policies.checkIn}</span>
                                        </div>
                                    )}
                                    {hotel.policies.checkOut && typeof hotel.policies.checkOut === 'string' && (
                                        <div className="policy-item">
                                            <span className="policy-label">退房时间:</span>
                                            <span className="policy-value">{hotel.policies.checkOut}</span>
                                        </div>
                                    )}
                                    {hotel.policies.children && typeof hotel.policies.children === 'string' && (
                                        <div className="policy-item">
                                            <span className="policy-label">儿童政策:</span>
                                            <span className="policy-value">{hotel.policies.children}</span>
                                        </div>
                                    )}
                                    {hotel.policies.pets && typeof hotel.policies.pets === 'string' && (
                                        <div className="policy-item">
                                            <span className="policy-label">宠物政策:</span>
                                            <span className="policy-value">{hotel.policies.pets}</span>
                                        </div>
                                    )}
                                    {hotel.policies.cancellation && typeof hotel.policies.cancellation === 'string' && (
                                        <div className="policy-item">
                                            <span className="policy-label">取消政策:</span>
                                            <span className="policy-value">{hotel.policies.cancellation}</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p>暂无政策信息</p>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'rooms' && (
                    <div className="hotel-rooms-tab">
                        <h2>可预订房型</h2>
                        <div className="rooms-list">
                            {hotel.rooms && hotel.rooms.map(room => (
                                <div key={room.id} className={`room-card ${!room.available ? 'unavailable' : ''}`}>
                                    <div className="room-image">
                                        <img 
                                            src={room.images && room.images.length > 0 ? room.images[0] : 'https://placehold.co/300x200?text=房间图片'} 
                                            alt={room.name}
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = 'https://placehold.co/300x200?text=房间图片';
                                            }}
                                        />
                                    </div>
                                    <div className="room-info">
                                        <h3 className="room-type">{room.name}</h3>
                                        <p className="room-description">{room.description}</p>
                                        <div className="room-capacity">
                                            可住: {room.capacity}人
                                        </div>
                                        <div className="room-facilities">
                                            {Array.isArray(room.facilities) && room.facilities.map((facility, index) => (
                                                <span key={index} className="room-facility">{facility}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="room-booking">
                                        <div className="room-price">¥{Number(room.price).toFixed(2)}<span className="price-unit">/晚</span></div>
                                        {room.available ? (
                                            <Link to={`/booking/hotel/${hotel.id}?roomId=${room.id}`} className="book-button">
                                                预订
                                            </Link>
                                        ) : (
                                            <div className="sold-out">已售罄</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'reviews' && (
                    <div className="hotel-reviews-tab">
                        <h2>用户评价</h2>
                        <div className="reviews-list">
                            {hotel.reviews && hotel.reviews.length > 0 ? (
                                hotel.reviews.map(review => (
                                    <div key={review.id} className="review-card">
                                        <div className="review-header">
                                            <div className="reviewer-info">
                                                <div className="reviewer-avatar">
                                                    <img 
                                                        src={review.avatar} 
                                                        alt={review.username} 
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.src = `https://placehold.co/40?text=${review.username?.charAt(0)}`;
                                                        }}
                                                    />
                                                </div>
                                                <span className="reviewer-name">{review.username}</span>
                                            </div>
                                            <div className="review-rating">
                                                {Array.from({ length: 5 }, (_, i) => (
                                                    <span key={i} className={`star ${i < review.rating ? 'filled' : 'empty'}`}>★</span>
                                                ))}
                                                <span className="rating-value">({review.rating}分)</span>
                                            </div>
                                        </div>
                                        <div className="review-content">
                                            {review.content}
                                        </div>
                                        <div className="review-date">
                                            {review.createdAt ? new Date(review.createdAt).toLocaleDateString('zh-CN') : '-'}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="no-reviews">暂无评价</p>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'map' && (
                    <div className="hotel-map-tab">
                        <h2>地图位置</h2>
                        <div className="hotel-map">
                            {/* 这里可以添加地图组件，暂时用占位符替代 */}
                            <div className="map-placeholder">
                                <p>地图加载中...</p>
                                <img 
                                    src={`https://placehold.co/800x400?text=酒店位置:${hotel.address}`}
                                    alt="酒店地图位置"
                                />
                            </div>
                        </div>
                        
                        <div className="nearby-attractions">
                            <h3>周边景点</h3>
                            {hotel.nearbyAttractions && hotel.nearbyAttractions.length > 0 ? (
                                <div className="attractions-list">
                                    {hotel.nearbyAttractions.map((attraction, index) => (
                                        <div key={index} className="attraction-item">
                                            <span className="attraction-name">{attraction.name}</span>
                                            <span className="attraction-distance">{attraction.distance}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p>暂无周边景点信息</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="hotel-bottom-actions">
                <div className="hotel-price-summary">
                    <div className="price-label">价格</div>
                    <div className="price-value">
                        {(() => {
                            // 找出所有房型中的最低价格
                            let lowestPrice = hotel.price;
                            if (hotel.rooms && hotel.rooms.length > 0) {
                                const validPrices = hotel.rooms
                                    .map(room => room.price)
                                    .filter(price => price !== undefined && price !== null && !isNaN(price));
                                
                                if (validPrices.length > 0) {
                                    lowestPrice = Math.min(...validPrices);
                                }
                            }
                            
                            // 确保显示有效价格
                            const displayPrice = lowestPrice !== undefined && lowestPrice !== null && !isNaN(lowestPrice) 
                                ? `¥${Number(lowestPrice).toFixed(2)}` 
                                : '价格待定';
                                
                            return (
                                <>
                                    {displayPrice}<span className="price-unit">/晚起</span>
                                </>
                            );
                        })()}
                    </div>
                </div>
                <Link to={`/booking/hotel/${hotel.id}`} className="book-now-button">
                    立即预订
                </Link>
            </div>
        </div>
    );
};

export default HotelDetail; 
