# 旅游服务平台

## 项目简介

本项目是一个全栈在线旅游服务平台，集成了景点浏览、酒店预订、旅游攻略、个性化行程规划、订单管理及强大的后台管理系统。适合课程设计、毕业设计、旅游行业原型等场景。

## 页面效果展示

### 首页
![Image](https://github.com/user-attachments/assets/48c6c046-af76-4252-bc8a-f6784dd05354)

![Image](https://github.com/user-attachments/assets/73778388-47ea-4f95-9bb3-019eaf014a6a)

![Image](https://github.com/user-attachments/assets/277cbf8d-ad36-4483-94ba-41a9d174e8aa)

![Image](https://github.com/user-attachments/assets/0b067bd5-61dd-4dfd-ab77-8e0eb1b9b0a7)

### 文旅景点

![Image](https://github.com/user-attachments/assets/9460651e-36c5-422d-a53f-c332105963c9)

### 文旅攻略

![Image](https://github.com/user-attachments/assets/6956deaf-0aed-4256-adf3-fe5e021d1c3f)

### 酒店

![Image](https://github.com/user-attachments/assets/f7083e65-1870-4f66-aa33-0d908a538019)

### 文旅路线

![Image](https://github.com/user-attachments/assets/b68a8c06-7433-4f8e-b537-7409b9f02192)


![Image](https://github.com/user-attachments/assets/27ae109a-2837-4384-8f3f-df739619e075)

### 文旅价格

![Image](https://github.com/user-attachments/assets/b73e26e4-127a-48ac-9c01-e308ba27f053)

### 文旅定制

![Image](https://github.com/user-attachments/assets/481fcead-ba2d-4721-9443-8601999efb22)

### 攻略写作

![Image](https://github.com/user-attachments/assets/c9c280da-59eb-4d32-a5f3-e6e1457c8877)

### 个人中心

![Image](https://github.com/user-attachments/assets/df1895fe-ce0d-4d25-ad4f-664f6502dc67)

![Image](https://github.com/user-attachments/assets/837caeef-ebdb-4897-ad18-2af5962d5065)

![Image](https://github.com/user-attachments/assets/81483a27-7bc5-4f7d-af56-ef924ab27f7c)

### 后台管理

![Image](https://github.com/user-attachments/assets/35c9f65b-73c0-4c00-8d91-a4b21644e908)

![Image](https://github.com/user-attachments/assets/a5991a2b-6432-4494-97ed-a0bff5a5f515)


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

- 推荐参考 sql 脚本导入 MySQL。
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
