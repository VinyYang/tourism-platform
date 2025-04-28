import React from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css'; // 复用NotFound样式

const Forbidden: React.FC = () => {
    return (
        <div className="not-found-container">
            <div className="not-found-content">
                <h1>403</h1>
                <h2>禁止访问</h2>
                <p>抱歉，您没有权限访问此页面</p>
                <Link to="/" className="home-link">返回首页</Link>
            </div>
        </div>
    );
};

export default Forbidden; 