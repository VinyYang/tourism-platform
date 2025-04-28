import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 不再从外部文件导入，直接嵌入 JSON 内容
// import translationEN from './locales/en/translation.json';
// import translationZH from './locales/zh/translation.json';

const translationEN = {
    "appName": "旅游平台",
    "welcomeMessage": "Welcome to our travel platform!",
    "userCenter": {
        "title": "User Center",
        "profile": "Profile",
        "orders": "My Orders",
        "favorites": "My Favorites",
        "settings": "Settings",
        "logout": "Logout",
        "changePassword": "Change Password",
        "saveChanges": "Save Changes"
    },
    "settings": {
        "theme": "Theme",
        "language": "Language",
        "light": "Light",
        "dark": "Dark"
    },
    "loading": "Loading...", // 添加其他可能需要的翻译
    "retry": "Retry",
    "noFavorites": "No favorites yet."
};

const translationZH = {
    "appName": "旅游平台",
    "welcomeMessage": "欢迎来到我们的旅游平台！",
    "userCenter": {
        "title": "个人中心",
        "profile": "个人资料",
        "orders": "我的订单",
        "favorites": "我的收藏",
        "settings": "系统设置",
        "logout": "退出登录",
        "changePassword": "修改密码",
        "saveChanges": "保存修改"
    },
    "settings": {
        "theme": "主题",
        "language": "语言",
        "light": "亮色模式",
        "dark": "暗色模式"
    },
    "loading": "加载中...", // 添加其他可能需要的翻译
    "retry": "重试",
    "noFavorites": "暂无收藏"
};


const resources = {
  en: {
    translation: translationEN,
  },
  zh: {
    translation: translationZH,
  },
};

i18n
  // 检测用户语言
  // 文档: https://github.com/i18next/i18next-browser-languageDetector
  .use(LanguageDetector)
  // 将 i18n 实例传递给 react-i18next
  .use(initReactI18next)
  // 初始化 i18next
  // 文档: https://www.i18next.com/overview/configuration-options
  .init({
    debug: process.env.NODE_ENV === 'development', // 开发环境开启 debug
    fallbackLng: 'zh', // 如果检测不到语言，则默认使用中文
    interpolation: {
      escapeValue: false, // react 已经处理了 XSS
    },
    resources: resources,
    // 配置 language detector
    detection: {
      // order and from where user language should be detected
      order: ['localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],

      // keys or params to lookup language from
      lookupLocalStorage: 'i18nextLng',

      // cache user language on
      caches: ['localStorage'],
      excludeCacheFor: ['cimode'], // languages to not persist (localStorage)

      // optional htmlTag attribute used to detect language
      // e.g. <html lang="en">
      htmlTag: document.documentElement,
    }
  });

export default i18n; 