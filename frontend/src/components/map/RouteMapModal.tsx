import React from 'react';
import { Modal, Spin, message, Alert, Empty, Typography } from 'antd';
import { MapSpot, ApiSpot } from '../../@types/spot';
import { transformSpotsForMap } from '../../utils/transformers';
import RouteMap from './RouteMap';

interface RouteMapModalProps {
  visible: boolean;
  route?: {
    featured_route_id: number;
    name: string;
    description: string;
    image_url: string | null;
    category: string | null;
    difficulty: string | null;
    spots?: ApiSpot[];
  };
  onClose: () => void;
}

const RouteMapModal: React.FC<RouteMapModalProps> = ({ visible, route, onClose }) => {
  if (!route) {
    return null;
  }

  // 转换景点数据
  const mapSpots = transformSpotsForMap(route.spots);

  return (
    <Modal
      title={`路线地图 - ${route.name}`}
      visible={visible}
      onCancel={onClose}
      footer={null}
      width="80%"
      style={{ maxWidth: '1200px' }}
      bodyStyle={{ height: '70vh', padding: '12px' }}
    >
      {route.spots && route.spots.length > 0 ? (
        <RouteMap
          spots={mapSpots}
          routeName={route.name}
          category={route.category}
          difficulty={route.difficulty}
          debug={false}
        />
      ) : (
        <Empty
          description={
            <Typography.Text type="secondary">
              该路线暂无景点数据
            </Typography.Text>
          }
        />
      )}
    </Modal>
  );
};

export default RouteMapModal; 