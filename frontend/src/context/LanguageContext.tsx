import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import i18n from '../i18n'; // 引入 i18n 配置

interface LanguageContextProps {
    language: string;
    changeLanguage: (lang: string) => void;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

interface LanguageProviderProps {
    children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
    // 从 i18next 获取当前语言，或从 localStorage 获取，默认为 'zh'
    const [language, setLanguage] = useState<string>(() => {
        const savedLang = localStorage.getItem('i18nextLng');
        return savedLang || i18n.language || 'zh';
    });

    // 切换语言函数
    const changeLanguage = (lang: string) => {
        i18n.changeLanguage(lang); // 触发 i18next 切换语言
        setLanguage(lang);
        localStorage.setItem('i18nextLng', lang); // 更新 localStorage
    };

    // 监听 i18next 语言变化事件 (可选，如果其他地方也会改变语言)
    useEffect(() => {
        const handleLanguageChanged = (lng: string) => {
            setLanguage(lng);
            localStorage.setItem('i18nextLng', lng);
        };
        i18n.on('languageChanged', handleLanguageChanged);
        return () => {
            i18n.off('languageChanged', handleLanguageChanged);
        };
    }, []);

    // 设置初始语言
    useEffect(() => {
        const currentLang = localStorage.getItem('i18nextLng') || 'zh';
        if (i18n.language !== currentLang) {
             i18n.changeLanguage(currentLang);
        }
        setLanguage(currentLang);
    }, []);

    return (
        <LanguageContext.Provider value={{ language, changeLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
};

// 自定义 Hook
export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage 必须在 LanguageProvider 内部使用');
    }
    return context;
}; 