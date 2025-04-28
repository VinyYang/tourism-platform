# 高德地图配置指南

本项目使用高德地图JavaScript API进行地图功能的实现，包括地图展示、路线规划等功能。

## 环境变量配置

项目需要配置以下高德地图相关的环境变量：

1. `REACT_APP_AMAP_JS_KEY`：高德地图 JavaScript API Key
2. `REACT_APP_AMAP_SECURITY_CODE`：高德地图安全密钥

## 配置步骤

1. 在项目的`frontend`目录下，创建一个名为`.env.local`的文件
2. 按照以下格式填入配置信息：

```
# 高德地图API配置
REACT_APP_AMAP_JS_KEY=你的JavaScript API Key
REACT_APP_AMAP_SECURITY_CODE=你的安全密钥
```

3. 在前端开发服务器重启后，环境变量将被应用

## 获取高德地图开发者密钥

1. 访问[高德开放平台](https://lbs.amap.com/)并注册/登录账号
2. 创建一个新应用，选择"Web端(JS API)"类型
3. 在应用详情页面，您可以找到对应的JavaScript API Key和安全密钥

## 注意事项

- 确保您的高德地图API密钥有足够的配额用于开发和生产环境
- 正式部署应用时，请使用正规申请的高德地图API密钥，并设置合适的域名限制
- 不要在代码中硬编码API密钥，始终通过环境变量进行配置

## 地图API使用问题排查

如果您在使用地图功能时遇到问题，请检查：

1. 控制台是否有报错信息，特别是与`AMap`相关的错误
2. 环境变量是否正确配置并被应用
3. 使用的API版本是否与代码匹配（本项目使用AMap API v2.0）
4. 如果出现"禁止多种API加载方式混用"的错误，请确保在应用中统一使用`AMapLoader.load()`方法加载高德地图

## 开发者参考文档

- [高德地图 JavaScript API 参考手册](https://lbs.amap.com/api/jsapi-v2/documentation)
- [高德地图 Web服务 API](https://lbs.amap.com/api/webservice/guide/api/georegeo) 
