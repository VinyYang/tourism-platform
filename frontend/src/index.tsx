import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, theme as antdTheme, App as AntdApp } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { NotificationProvider } from './context/NotificationContext';
import App from './App';
import './i18n';
import './index.css';
import './theme.css';

const AppWrapper: React.FC = () => {
    const { theme } = useTheme();
    const { defaultAlgorithm, darkAlgorithm } = antdTheme;

    return (
        <ConfigProvider
            theme={{
                algorithm: theme === 'dark' ? darkAlgorithm : defaultAlgorithm,
            }}
        >
            <AntdApp>
                <App />
            </AntdApp>
        </ConfigProvider>
    );
};

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

const queryClient = new QueryClient();

root.render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <AuthProvider>
                    <NotificationProvider>
                        <ThemeProvider>
                            <LanguageProvider>
                                <AppWrapper />
                            </LanguageProvider>
                        </ThemeProvider>
                    </NotificationProvider>
                </AuthProvider>
            </BrowserRouter>
        </QueryClientProvider>
    </React.StrictMode>
); 