import React from 'react';
import { Row, Col, Breadcrumb } from 'antd';
import { Link } from 'react-router-dom';
import { HomeOutlined, EnvironmentOutlined } from '@ant-design/icons';
import FlightBookingForm from '../components/FlightBookingForm';

/**
 * 机票预订页面
 */
const FlightBookingPage: React.FC = () => {
    return (
        <div className="flight-booking-page">
            <Row justify="center">
                <Col xs={24} sm={24} md={20} lg={18} xl={16}>
                    <Breadcrumb className="page-breadcrumb">
                        <Breadcrumb.Item>
                            <Link to="/"><HomeOutlined /> 首页</Link>
                        </Breadcrumb.Item>
                        <Breadcrumb.Item>
                            <Link to="/transport-map"><EnvironmentOutlined /> 交通地图</Link>
                        </Breadcrumb.Item>
                        <Breadcrumb.Item>机票预订</Breadcrumb.Item>
                    </Breadcrumb>
                    
                    <FlightBookingForm />
                </Col>
            </Row>
        </div>
    );
};

export default FlightBookingPage; 