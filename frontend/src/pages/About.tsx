import React from 'react';
import './About.css';

const About: React.FC = () => {
    return (
        <div className="about-container">
            <div className="about-hero">
                <h1>关于旅游服务平台</h1>
                <p>您的旅行伙伴，随时随地为您提供优质旅游服务</p>
            </div>
            
            <div className="about-content">
                <section className="about-section">
                    <h2>我们的使命</h2>
                    <p>
                        旅游服务平台致力于为广大旅行爱好者提供一站式旅游服务，通过科技的力量，使旅行变得更加简单、个性化和愉悦。
                        我们相信，每一次旅行都应该是一次难忘的体验，而我们的使命就是帮助您规划和实现完美的旅程。
                    </p>
                </section>
                
                <section className="about-section">
                    <h2>核心功能</h2>
                    <div className="feature-grid">
                        <div className="feature-item">
                            <div className="feature-icon">🌍</div>
                            <h3>景点信息展示</h3>
                            <p>覆盖多个城市的热门景点详情，包括图片、介绍、开放时间、门票等</p>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">🔍</div>
                            <h3>旅游攻略推荐</h3>
                            <p>结合用户兴趣和热点趋势，自动推荐旅游路线与游记攻略</p>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">🛎</div>
                            <h3>在线预订功能</h3>
                            <p>支持景点门票、酒店、旅游路线的预订</p>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">🧑‍💻</div>
                            <h3>多角色权限管理</h3>
                            <p>用户、旅游顾问、管理员三种身份权限区分，便于业务分工与管理</p>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">🧠</div>
                            <h3>个性化推荐算法</h3>
                            <p>基于用户浏览记录、兴趣标签、预算等推荐定制行程</p>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">🧱</div>
                            <h3>可视化攻略搭建工具</h3>
                            <p>用户可自由组合景点、安排日程，生成个性化行程计划</p>
                        </div>
                    </div>
                </section>
                
                <section className="about-section">
                    <h2>我们的团队</h2>
                    <p>
                        我们的团队由一群充满激情的旅行爱好者和专业的技术人员组成。我们深知旅行者的需求和痛点，
                        并致力于通过技术创新和优质服务来解决这些问题，让每一位用户都能享受到便捷、愉悦的旅行体验。
                    </p>
                    <div className="team-values">
                        <div className="value-item">
                            <h4>用户至上</h4>
                            <p>我们以用户需求为核心，不断优化产品体验</p>
                        </div>
                        <div className="value-item">
                            <h4>品质保证</h4>
                            <p>严选优质旅游资源，确保用户满意度</p>
                        </div>
                        <div className="value-item">
                            <h4>创新精神</h4>
                            <p>不断探索旅游服务的新可能性</p>
                        </div>
                    </div>
                </section>
                
                <section className="about-section">
                    <h2>技术支持</h2>
                    <div className="tech-stack">
                        <div className="tech-category">
                            <h3>前端技术</h3>
                            <ul>
                                <li>React</li>
                                <li>TypeScript</li>
                                <li>React Router</li>
                                <li>CSS</li>
                            </ul>
                        </div>
                        <div className="tech-category">
                            <h3>后端技术</h3>
                            <ul>
                                <li>Node.js</li>
                                <li>Express</li>
                                <li>MySQL</li>
                                <li>Sequelize</li>
                            </ul>
                        </div>
                    </div>
                </section>
                
                <section className="about-section contact-section">
                    <h2>联系我们</h2>
                    <p>
                        如果您有任何问题、建议或合作意向，欢迎通过以下方式联系我们：
                    </p>
                    <div className="contact-info">
                        <div className="contact-item">
                            <span className="contact-label">电子邮箱：</span>
                            <a href="mailto:contact@travelplatform.com">contact@travelplatform.com</a>
                        </div>
                        <div className="contact-item">
                            <span className="contact-label">客服热线：</span>
                            <span>400-123-4567</span>
                        </div>
                        <div className="contact-item">
                            <span className="contact-label">公司地址：</span>
                            <span>北京市海淀区中关村创新大厦B座15层</span>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default About; 