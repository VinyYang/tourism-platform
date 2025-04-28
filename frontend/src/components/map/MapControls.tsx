import React from 'react';
import { Card, Radio, Slider, Switch, Button, Select, Row, Col, Tooltip, DatePicker } from 'antd';
import { 
  ZoomInOutlined, 
  ZoomOutOutlined, 
  ReloadOutlined,
  EnvironmentOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { TransportType } from '../../api/transport';
import dayjs from 'dayjs';
import CitySelector from '../common/CitySelector';
import './MapControls.css';

const { Option } = Select;

interface MapControlsProps {
  transportType: string;
  onTransportTypeChange: (type: string) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  showRoutes: boolean;
  onShowRoutesChange: (show: boolean) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  fromCity?: string;
  toCity?: string;
  onFromCityChange?: (city: string) => void;
  onToCityChange?: (city: string) => void;
  popularCities?: string[];
  selectedDate?: string;
  onDateChange?: (date: string) => void;
}

const MapControls: React.FC<MapControlsProps> = ({
  transportType,
  onTransportTypeChange,
  priceRange,
  onPriceRangeChange,
  showRoutes,
  onShowRoutesChange,
  onZoomIn,
  onZoomOut,
  onReset,
  fromCity,
  toCity,
  onFromCityChange,
  onToCityChange,
  popularCities = [],
  selectedDate,
  onDateChange
}) => {
  // 处理交通类型变更
  const handleTransportTypeChange = (e: any) => {
    onTransportTypeChange(e.target.value);
  };
  
  // 处理价格范围变更
  const handlePriceRangeChange = (value: [number, number] | number | number[]) => {
    let rangeValue: [number, number];
    
    if (typeof value === 'number') {
      // 如果是单个数值，将其作为最大值
      rangeValue = [0, value];
    } else if (Array.isArray(value) && value.length === 2) {
      // 如果是数组且长度为2，直接使用
      rangeValue = value as [number, number];
    } else if (Array.isArray(value)) {
      // 如果是其他长度的数组，使用第一个和最后一个值
      rangeValue = [value[0] || 0, value[value.length - 1] || 5000];
    } else {
      // 默认值
      rangeValue = [0, 5000];
    }
    
    onPriceRangeChange(rangeValue);
  };
  
  // 处理路线显示切换
  const handleShowRoutesChange = (checked: boolean) => {
    onShowRoutesChange(checked);
  };

  // 处理日期变更
  const handleDateChange = (date: any) => {
    if (date && onDateChange) {
      onDateChange(date.format('YYYY-MM-DD'));
    }
  };

  return (
    <Card title="地图控制" className="map-controls">
      <Row gutter={[16, 16]}>
        {/* 交通类型选择 */}
        <Col span={24}>
          <div className="control-item">
            <div className="control-label">交通类型</div>
            <Radio.Group value={transportType} onChange={handleTransportTypeChange}>
              <Radio.Button value="all">全部</Radio.Button>
              <Radio.Button value={TransportType.PLANE}>飞机</Radio.Button>
              <Radio.Button value={TransportType.TRAIN}>火车</Radio.Button>
            </Radio.Group>
          </div>
        </Col>
        
        {/* 价格范围 */}
        <Col span={24}>
          <div className="control-item">
            <div className="control-label">价格范围</div>
            <Slider
              range
              min={0}
              max={5000}
              value={priceRange}
              onChange={handlePriceRangeChange}
              tipFormatter={value => `¥${value}`}
            />
          </div>
        </Col>
        
        {/* 起始城市和目的地城市 */}
        {onFromCityChange && onToCityChange && (
          <Col span={24}>
            <div className="control-item">
              <Row gutter={8}>
                <Col span={12}>
                  <div className="control-label">出发城市</div>
                  <CitySelector
                    value={fromCity}
                    onChange={onFromCityChange}
                    placeholder="选择出发城市"
                    style={{ width: '100%' }}
                    mode="autocomplete"
                    level="city"
                    allowClear={true}
                  />
                </Col>
                <Col span={12}>
                  <div className="control-label">目的地城市</div>
                  <CitySelector
                    value={toCity}
                    onChange={onToCityChange}
                    placeholder="选择目的地城市"
                    style={{ width: '100%' }}
                    mode="autocomplete"
                    level="city"
                    allowClear={true}
                  />
                </Col>
              </Row>
            </div>
          </Col>
        )}
        
        {/* 添加日期选择器 */}
        {onDateChange && (
          <Col span={24}>
            <div className="control-item">
              <div className="control-label">出发日期</div>
              <DatePicker
                value={selectedDate ? dayjs(selectedDate) : undefined}
                onChange={handleDateChange}
                style={{ width: '100%' }}
                placeholder="选择日期"
                format="YYYY-MM-DD"
                disabledDate={(current) => current && current < dayjs().startOf('day')}
              />
            </div>
          </Col>
        )}
        
        {/* 显示路线开关 */}
        <Col span={24}>
          <div className="control-item">
            <div className="control-label">显示路线</div>
            <Switch checked={showRoutes} onChange={handleShowRoutesChange} />
          </div>
        </Col>
        
        {/* 地图缩放控制 */}
        <Col span={24}>
          <div className="control-item zoom-controls">
            <Tooltip title="放大">
              <Button icon={<ZoomInOutlined />} onClick={onZoomIn} />
            </Tooltip>
            <Tooltip title="缩小">
              <Button icon={<ZoomOutOutlined />} onClick={onZoomOut} />
            </Tooltip>
            <Tooltip title="重置视图">
              <Button icon={<ReloadOutlined />} onClick={onReset} />
            </Tooltip>
            <Tooltip title="定位当前选择的城市">
              <Button icon={<EnvironmentOutlined />} disabled={!fromCity && !toCity} />
            </Tooltip>
          </div>
        </Col>
      </Row>
    </Card>
  );
};

export default MapControls; 