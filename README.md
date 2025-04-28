# 旅游服务平台

## 项目简介

本项目是一个全栈在线旅游服务平台，集成了景点浏览、酒店预订、旅游攻略、个性化行程规划、订单管理及强大的后台管理系统。适合课程设计、毕业设计、旅游行业原型等场景。

## 主要特性

- **前台功能**：用户注册/登录、景点/酒店/攻略浏览与搜索、行程规划、订单管理、地图可视化、评论互动等。
- **后台管理**：用户、景点、酒店、订单、攻略、评论、精选路线等全方位管理，支持数据统计与权限分配。
- **技术栈**：React + TypeScript + Ant Design（前端），Node.js + Express + Sequelize + MySQL（后端）。

## 目录结构（核心部分）

```
项目根目录
├── backend/                # 后端服务
│   ├── src/
│   │   ├── controllers/    # 业务控制器
│   │   ├── models/         # Sequelize模型
│   │   ├── routes/         # 路由
│   │   ├── middlewares/    # 中间件
│   │   ├── config/         # 配置
│   │   └── ...             
│   ├── package.json
│   └── ...
├── frontend/               # 前端项目
│   ├── src/
│   │   ├── pages/          # 页面（含 admin 后台管理）
│   │   ├── components/     # 组件
│   │   ├── api/            # API 封装
│   │   ├── context/        # 全局上下文
│   │   └── ...
│   ├── public/
│   ├── package.json
│   └── ...
├── sql/                    # 数据库初始化脚本
├── featured_data_examples_ordered.sql # 示例数据
├── .gitignore
├── README.md
└── ...
```

## 环境准备

### 1. 克隆项目

```bash
git clone https://github.com/你的用户名/你的仓库名.git
cd 你的仓库名
```

### 2. 配置环境变量

- **前端**：在 `frontend/` 下新建 `.env` 文件，内容示例（如无可用 `.env.example`）：

  ```
  REACT_APP_API_URL=http://localhost:3001/api/v1
  REACT_APP_AMAP_JS_KEY=你的高德JS API KEY
  REACT_APP_AMAP_SECURITY_CODE=你的高德安全密钥
  ```

- **后端**：在 `backend/` 下新建 `.env` 文件，内容示例：

  ```
  DB_HOST=localhost
  DB_PORT=3306
  DB_USER=root
  DB_PASSWORD=yourpassword
  DB_NAME=yourdbname
  JWT_SECRET=your_jwt_secret
  ```

### 3. 安装依赖

```bash
cd frontend
npm install
cd ../backend
npm install
```

### 4. 初始化数据库

- 推荐使用 `featured_data_examples_ordered.sql` 或 `sql/` 目录下脚本导入 MySQL。
- 确保数据库配置与 `.env` 保持一致。

### 5. 启动服务

- **后端**（开发模式）：
  ```bash
  cd backend
  npm run dev
  ```
- **前端**：
  ```bash
  cd frontend
  npm start
  ```

### 6. 访问

- 前端：http://localhost:3000
- 后端API：http://localhost:3001/api/v1

### 7. 默认账号

- 管理员：admin / 123456（如有，具体见数据库初始化脚本）

---

## 常见问题

- **端口冲突**：如 3000/3001 被占用，请在 `.env` 或 `package.json` 中修改端口。
- **数据库连接失败**：请检查 MySQL 是否启动、账号密码是否正确、数据库已初始化。
- **高德地图相关问题**：需自行申请高德 JS API KEY 并填入前端 `.env`。
- **依赖安装慢/失败**：可尝试使用淘宝镜像或 yarn/pnpm。

---

## 主要后台管理页面（部分）

- `frontend/src/pages/admin/UserManagement.tsx` 用户管理
- `frontend/src/pages/admin/ScenicManagement.tsx` 景点管理
- `frontend/src/pages/admin/HotelManagement.tsx` 酒店管理
- `frontend/src/pages/admin/OrderManagement.tsx` 订单管理
- `frontend/src/pages/admin/StrategyManagement.tsx` 攻略管理
- `frontend/src/pages/admin/ReviewManagement.tsx` 评论管理
- `frontend/src/pages/admin/FeaturedRouteManagement.tsx` 精选路线管理
- `frontend/src/pages/admin/Dashboard.tsx` 数据统计仪表盘

---

## 贡献与反馈

如有问题、建议或贡献意向，请提交 Issue 或 Pull Request。 