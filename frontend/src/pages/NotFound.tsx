import React from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css';

const NotFound: React.FC = () => {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <h1>404</h1>
        <h2>页面未找到</h2>
        <p>很抱歉，您要访问的页面不存在或已被移动。</p>
        <div className="not-found-actions">
          <Link to="/" className="back-home-button">返回首页</Link>
          <button 
            className="go-back-button"
            onClick={() => window.history.back()}
          >
            返回上一页
          </button>
        </div>
        <div className="not-found-illustration">
          <div className="traveler"></div>
          <div className="map"></div>
        </div>
      </div>
    </div>
  );
};

export default NotFound; 