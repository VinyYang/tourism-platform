# 旅游服务平台前端

这是一个使用 React 和 TypeScript 构建的旅游服务平台前端项目。

## 项目概述

本项目是一个集成化旅游服务平台，提供景点信息展示、旅游攻略推荐、在线预订和个性化推荐等功能。系统支持多角色权限管理，包括用户、旅游顾问和管理员三种角色。

## 项目结构

```
frontend/
├── node_modules/      # 依赖包目录
├── public/            # 静态资源目录
│   ├── index.html     # HTML 模板
│   └── manifest.json  # Web 应用配置文件
├── src/               # 源代码目录
│   ├── assets/        # 资源文件（图片、字体等）
│   ├── components/    # 可复用组件
│   │   ├── Navbar.tsx # 导航栏组件
│   │   └── Navbar.css # 导航栏样式
│   ├── pages/         # 页面组件
│   │   ├── Home.tsx         # 首页
│   │   ├── Home.css         # 首页样式
│   │   ├── About.tsx        # 关于页面
│   │   ├── About.css        # 关于页面样式
│   │   ├── Login.tsx        # 登录页面
│   │   ├── Register.tsx     # 注册页面
│   │   ├── Auth.css         # 认证页面样式
│   │   ├── NotFound.tsx     # 404页面
│   │   ├── NotFound.css     # 404页面样式
│   │   ├── Scenic.tsx       # 景点页面
│   │   ├── Scenic.css       # 景点页面样式
│   │   ├── Strategies.tsx   # 攻略页面
│   │   ├── Strategies.css   # 攻略页面样式
│   │   ├── Hotels.tsx       # 酒店页面
│   │   ├── Hotels.css       # 酒店页面样式
│   │   ├── UserCenter.tsx   # 用户中心页面
│   │   └── UserCenter.css   # 用户中心页面样式
│   ├── api/           # API 服务
│   │   ├── auth.ts          # 认证API
│   │   ├── user.ts          # 用户API
│   │   └── scenic.ts        # 景点API
│   ├── context/       # 上下文管理
│   │   └── AuthContext.tsx  # 认证上下文
│   ├── utils/         # 工具函数
│   ├── App.tsx        # 应用主组件
│   ├── App.css        # 应用主样式
│   ├── index.tsx      # 入口文件
│   └── index.css      # 全局样式
├── package.json       # 项目配置和依赖
├── tsconfig.json      # TypeScript 配置
├── README.md          # 项目说明文档
└── project.md         # 项目结构文档
```

## 可用脚本

在项目目录中，你可以运行：

### `npm start`

在开发模式下运行应用。
打开 [http://localhost:3000](http://localhost:3000) 在浏览器中查看。

### `npm run build`

将应用构建到 `build` 文件夹中。
它在生产模式下正确打包 React，并优化构建以获得最佳性能。

### `npm test`

在交互式监视模式下启动测试运行程序。

## 核心功能

- 🌍 **景点信息展示**：覆盖多个城市的热门景点详情，包括图片、介绍、开放时间、门票等
- 🔍 **旅游攻略推荐**：结合用户兴趣和热点趋势，自动推荐旅游路线与游记攻略
- 🛎 **在线预订功能**：支持景点门票、酒店、旅游路线的预订
- 🧑‍💻 **多角色权限管理**：用户、旅游顾问、管理员三种身份权限区分，便于业务分工与管理
- 🧠 **个性化推荐算法**：基于用户浏览记录、兴趣标签、预算等推荐定制行程
- 🧱 **可视化攻略搭建工具**：用户可自由组合景点、安排日程，生成个性化行程计划

## 技术栈

- React
- TypeScript
- React Router
- Axios
- Ant Design

## 实现进度

- [x] 项目初始化
- [ ] 数据库设计与实现
- [x] 用户认证与授权
  - [x] 实现认证API服务
  - [x] 创建认证上下文
  - [x] 实现受保护路由组件
  - [x] 添加403禁止访问页面
  - [x] 更新导航栏以适应登录状态
- [x] 用户中心页面实现
  - [x] 个人资料管理 
  - [x] 订单管理
  - [x] 收藏管理
  - [x] 表单验证和用户体验优化
  - [x] 头像上传功能
  - [x] 密码修改功能
  - [x] 订单评价功能
- [x] 景点信息展示模块
  - [x] 景点API服务实现
  - [x] 景点详情页面实现
  - [x] 收藏与预订功能
  - [x] 景点评价显示
  - [x] 景点列表页面
  - [x] 景点搜索功能
- [ ] 旅游攻略推荐模块
- [ ] 在线预订功能
- [ ] 可视化攻略搭建工具
- [ ] 后台管理系统

## 最近更新

### <插入当前日期>：修复行程创建页面初始化及API调用问题

- **修复问题**:
    1.  点击创建行程按钮后无法访问 `/itineraries/create` 页面。
    2.  创建行程时，API 请求未包含行程的具体内容，导致无法保存。
    3.  `frontend/src/api/itinerary.ts` 中的 TypeScript 类型定义错误。
- **修改内容**:
    1.  **修正 `ItineraryPlanner.tsx` 初始化逻辑**: 
        *   分析发现该组件在创建模式下 (`!id`) 时，由于 `itinerary` 状态初始为 `null`，导致 `initializeDays` 函数无法正确执行，组件无法渲染。
        *   修改了 `useEffect` 钩子，在创建模式下直接使用 `setItinerary` 设置一个包含默认值的初始 `ItineraryState` 对象。
    2.  **修正 `createItinerary` API 调用**: 
        *   在 `frontend/src/api/itinerary.ts` 中，修改 `createItinerary` 函数，使其在发送给后端的 `payload` 中包含 `daysList` 字段，确保行程内容被发送。
        *   添加了更详细的 Axios 错误处理，以便在 API 调用失败时显示更多信息。
    3.  **修复 TypeScript 类型错误**: 
        *   清理了 `frontend/src/api/itinerary.ts` 中的 `ItineraryDay` 接口，移除了重复的 `items` 属性和不相关的字段，解决了编译错误。
- **影响**: 
    *   现在可以正常访问 `/itineraries/create` 页面。
    *   创建行程的请求包含了完整的行程数据，应能成功保存。
    *   解决了相关的 TypeScript 编译错误。

### 2024-05-17：修复用户中心加载问题

- **修复问题**: 用户中心页面无法加载，控制台显示获取用户资料 (profile) 404 错误和获取订单列表 (orders) 500 错误，导致包括"设置"在内的标签页无法显示。
- **修改内容**:
    1.  **前端 API 路径修正**: 在 `frontend/src/api/user.ts` 中，将获取用户资料 (`getProfile`) 的请求路径从 `/api/v1/users/profile` 修改为 `/api/v1/auth/me`，与后端实际路由 `/auth/me` 匹配。
    2.  **前后端分页参数统一**:
        *   检查发现后端 `userController.js` 中的 `getOrders` 函数期望的分页参数是 `limit`，而前端传递的是 `pageSize`。
        *   修改了 `frontend/src/api/user.ts` 中的 `OrderQueryParams` 接口，将 `pageSize` 重命名为 `limit`。
        *   修改了 `frontend/src/pages/UserCenter.tsx` 中与订单分页相关的状态 (`orderPagination`)、API 调用 (`fetchUserOrders`) 和分页组件回调 (`handleOrderPageChange`)，统一使用 `limit` 参数，确保与后端 API 兼容。
    3.  **代码风格统一**: 在 `frontend/src/api/user.ts` 中，将 `changePassword` 重命名为 `updatePassword`，`cancelOrder` 的 HTTP 方法从 `POST` 改为 `PUT`，以符合后端定义和 RESTful 风格。
- **影响**: 修复了用户中心页面因后端 API 调用失败而无法加载的问题，现在用户资料和订单列表应能正常获取，"设置"标签页及其他功能应能正常显示和使用。

### 2023-07-06：修复组件接口和TypeScript类型错误

- 修复了`ItineraryDay`组件中`onRemove`可能为undefined的调用问题
- 更新了`ItineraryItem`接口实现，将`image`属性修改为接口定义的`imageUrl`属性
- 扩展了`ItineraryDayProps`接口，添加了`onAddItem`、`onUpdateItem`、`onRemoveItem`等属性
- 优化了组件间交互逻辑，使各组件可以相互协作
- 提高了类型安全性，减少了运行时错误风险

### 2023-07-05：修复TypeScript类型定义不一致问题

- 统一了项目中`ItineraryItem`和`ItineraryDay`接口定义，解决了不同文件间类型定义不一致导致的TypeScript编译错误
- 添加了数据转换函数`convertApiItineraryToFrontend`和`convertFrontendItineraryToApi`，用于API数据和前端数据的转换
- 修改了`ItineraryDay`组件，增强了对`onItemsChange`属性的支持
- 修复了Dashboard中缺失的`fetchDashboardData`函数
- 优化了行程编辑相关组件的属性传递机制

### 2023-06-20：景点列表和搜索功能实现

- 重新设计了景点列表页面，使用Ant Design组件实现了现代化的UI设计
- 集成景点API服务，实现了数据的动态获取和呈现
- 添加了多维度筛选功能，包括城市、景点类型、价格范围等
- 实现了排序功能，支持按热门程度、评分、价格进行排序
- 优化了移动端响应式布局，提升了用户体验
- 实现了景点列表的分页功能

### 2023-06-15：景点展示功能实现

- 实现了景点API服务，封装了景点数据获取、收藏和评价功能
- 新增了景点详情页面，包括景点基本信息、图片轮播、附近景点和用户评价展示
- 实现了景点收藏和预订功能，与用户认证系统集成
- 优化了页面样式，提供了良好的用户体验和响应式布局

### 2023-06-12：用户认证系统实现

- 创建了认证API服务和认证上下文，实现全局状态管理
- 添加了受保护路由组件，控制需要登录才能访问的页面
- 实现了403禁止访问页面，用于未授权访问
- 更新导航栏，根据用户登录状态显示不同选项

### 2023-06-10：用户中心功能增强

- 添加了用户API服务文件，处理与后端的通信
- 改进了用户中心页面，添加了表单验证和用户体验优化
- 实现了个人资料修改、订单管理、收藏管理的功能
- 添加了头像上传、密码修改和订单评价功能
- 优化了页面响应式布局，增强了移动端体验

### 2023-06-05：项目初始化

- 修复了App.tsx中的ESLint错误，重新排序了导入语句，确保导航栏组件的导入位于页面组件导入之前，符合ESLint规则
- 创建了基础页面框架：首页、景点页面、攻略页面、酒店页面和用户中心
- 设置了基本路由结构和导航组件
- 实现了404页面，用于处理未找到的路由

