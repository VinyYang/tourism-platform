import React, { useState } from 'react';
import { Modal, Rate, Input, Button, message } from 'antd';
import userAPI from '../api/user';
import './ReviewModal.css';

const { TextArea } = Input;

interface ReviewModalProps {
    visible: boolean;
    orderId: string | number;
    orderTitle: string;
    onClose: () => void;
    onSuccess: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
    visible,
    orderId,
    orderTitle,
    onClose,
    onSuccess,
}) => {
    const [rating, setRating] = useState<number>(5);
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    const handleSubmit = async () => {
        if (!content.trim()) {
            message.error('请输入评价内容');
            return;
        }

        setLoading(true);

        try {
            // 实际项目中取消注释
            // await userAPI.addReview({
            //     orderId,
            //     rating,
            //     content,
            // });

            // 模拟API请求
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            message.success('评价提交成功');
            setRating(5);
            setContent('');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('提交评价失败', error);
            message.error('评价提交失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setRating(5);
        setContent('');
        onClose();
    };

    return (
        <Modal
            title="添加评价"
            open={visible}
            onCancel={handleCancel}
            footer={[
                <Button key="cancel" onClick={handleCancel}>
                    取消
                </Button>,
                <Button 
                    key="submit" 
                    type="primary" 
                    loading={loading}
                    onClick={handleSubmit}
                >
                    提交评价
                </Button>,
            ]}
        >
            <div className="review-modal-content">
                <div className="review-order-title">{orderTitle}</div>
                
                <div className="review-rating-container">
                    <div className="review-label">您的评分：</div>
                    <Rate 
                        allowHalf
                        value={rating}
                        onChange={setRating}
                    />
                    <div className="rating-text">
                        {rating === 5 && '非常满意'}
                        {rating === 4.5 && '满意'}
                        {rating === 4 && '比较满意'}
                        {rating === 3.5 && '一般'}
                        {rating === 3 && '一般'}
                        {rating === 2.5 && '不太满意'}
                        {rating === 2 && '不满意'}
                        {rating === 1.5 && '很不满意'}
                        {rating === 1 && '非常不满意'}
                        {rating === 0.5 && '极其不满意'}
                    </div>
                </div>
                
                <div className="review-content-container">
                    <div className="review-label">评价内容：</div>
                    <TextArea
                        rows={4}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="请分享您的体验和建议..."
                        maxLength={500}
                        showCount
                    />
                </div>
                
                <div className="review-tips">
                    您的评价将帮助我们改进服务，感谢您的反馈！
                </div>
            </div>
        </Modal>
    );
};

export default ReviewModal; 