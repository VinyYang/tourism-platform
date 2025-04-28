import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Result, Spin, Modal, Descriptions, Button, message } from 'antd';
import trainAPI, { Train as TrainType } from '../api/train';
import TrainList from '../components/TrainList';
import './Train.css';

const TrainPage: React.FC = () => {
  // 获取路由和导航
  const location = useLocation();
  const navigate = useNavigate();
  
  // 状态管理
  const [loading, setLoading] = useState(false);
  const [trainList, setTrainList] = useState<TrainType[]>([]);
  const [filters, setFilters] = useState<any>(null);
  const [searchParams, setSearchParams] = useState<any>({});
  const [selectedTrain, setSelectedTrain] = useState<TrainType | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  // 从URL中解析查询参数
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const departureCityName = query.get('departureCityName');
    const arrivalCityName = query.get('arrivalCityName');
    const departureDate = query.get('departureDate');
    
    // 如果URL中包含完整的查询参数，则自动查询
    if (departureCityName && arrivalCityName && departureDate) {
      const params = {
        departureCityName,
        arrivalCityName,
        departureDate
      };
      setSearchParams(params);
      searchTrains(params);
    }
  }, [location]);
  
  // 查询火车票
  const searchTrains = async (params: any) => {
    try {
      setLoading(true);
      const { departureCityName, arrivalCityName, departureDate } = params;
      
      // 调用API获取火车票信息
      const response = await trainAPI.getTrainTickets(
        departureDate,
        departureCityName,
        arrivalCityName
      );
      
      if (response && response.code === 200 && response.data) {
        setTrainList(response.data.list || []);
        setFilters(response.data.filter || null);
        
        // 更新URL，方便分享和刷新
        navigate({
          pathname: location.pathname,
          search: `?departureCityName=${encodeURIComponent(departureCityName)}&arrivalCityName=${encodeURIComponent(arrivalCityName)}&departureDate=${encodeURIComponent(departureDate)}`
        }, { replace: true });
      } else {
        message.error('获取火车票信息失败');
        setTrainList([]);
      }
    } catch (error) {
      console.error('查询火车票失败:', error);
      message.error('查询火车票失败，请稍后重试');
      setTrainList([]);
    } finally {
      setLoading(false);
    }
  };
  
  // 处理查看详情
  const handleViewDetail = (train: TrainType) => {
    setSelectedTrain(train);
    setModalVisible(true);
  };
  
  // 关闭详情对话框
  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedTrain(null);
  };
  
  // 渲染座位类型和价格
  const renderSeatPrices = (prices: TrainType['prices']) => {
    return prices.map((price, index) => (
      <Descriptions.Item key={index} label={price.seatName}>
        ¥{price.price}
        {price.leftNumber > 0 
          ? (price.leftNumber === 99 
              ? '(有票)' 
              : `(剩余${price.leftNumber}张)`)
          : '(无票)'}
      </Descriptions.Item>
    ));
  };
  
  return (
    <div className="train-page-container">
      <h1 className="page-title">火车票查询</h1>
      
      {/* 火车票列表组件 */}
      <TrainList
        trainList={trainList}
        loading={loading}
        filters={filters}
        onSearch={searchTrains}
        onViewDetail={handleViewDetail}
      />
      
      {/* 无数据时显示提示 */}
      {!loading && trainList.length === 0 && (
        <Result
          status="info"
          title="暂无符合条件的列车"
          subTitle="请尝试修改查询条件后重新搜索"
        />
      )}
      
      {/* 火车票详情弹窗 */}
      <Modal
        title="列车详情"
        open={modalVisible}
        onCancel={handleCloseModal}
        width={700}
        footer={[
          <Button key="close" onClick={handleCloseModal}>
            关闭
          </Button>,
          <Button 
            key="order" 
            type="primary" 
            onClick={() => {
              message.info('订票功能正在开发中，敬请期待！');
            }}
          >
            预订车票
          </Button>
        ]}
      >
        {selectedTrain && (
          <div className="train-detail">
            <Descriptions title={`${selectedTrain.trainNum} ${selectedTrain.trainTypeName}`} bordered column={2}>
              <Descriptions.Item label="出发站">{selectedTrain.departStationName}</Descriptions.Item>
              <Descriptions.Item label="到达站">{selectedTrain.destStationName}</Descriptions.Item>
              <Descriptions.Item label="出发时间">{selectedTrain.departDepartTime}</Descriptions.Item>
              <Descriptions.Item label="到达时间">{selectedTrain.destArriveTime}</Descriptions.Item>
              <Descriptions.Item label="运行时间">{selectedTrain.durationStr}</Descriptions.Item>
              <Descriptions.Item label="发车日期">{selectedTrain.trainStartDate}</Descriptions.Item>
              <Descriptions.Item label="可刷身份证进站" span={2}>
                {selectedTrain.accessByIdcard === 'Y' ? '是' : '否'}
              </Descriptions.Item>
              {renderSeatPrices(selectedTrain.prices)}
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TrainPage; 