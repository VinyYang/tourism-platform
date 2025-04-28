import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 通知类型
interface Notification {
    id: string;
    message: string;
    read: boolean;
    timestamp: Date;
    type: 'order' | 'system';
}

// 上下文接口
interface NotificationContextType {
    notifications: Notification[];
    hasUnreadNotifications: boolean;
    addNotification: (message: string, type: 'order' | 'system') => void;
    markAllAsRead: () => void;
    markAsRead: (id: string) => void;
    clearNotifications: () => void;
}

// 创建上下文
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// 通知提供者组件
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

    // 检查未读通知状态
    useEffect(() => {
        const unreadExists = notifications.some(notification => !notification.read);
        setHasUnreadNotifications(unreadExists);
    }, [notifications]);

    // 添加新通知
    const addNotification = (message: string, type: 'order' | 'system' = 'order') => {
        const newNotification: Notification = {
            id: Date.now().toString(),
            message,
            read: false,
            timestamp: new Date(),
            type
        };
        setNotifications(prev => [newNotification, ...prev]);
    };

    // 将所有通知标记为已读
    const markAllAsRead = () => {
        setNotifications(prev => 
            prev.map(notification => ({
                ...notification,
                read: true
            }))
        );
    };

    // 将单个通知标记为已读
    const markAsRead = (id: string) => {
        setNotifications(prev => 
            prev.map(notification => 
                notification.id === id 
                    ? { ...notification, read: true } 
                    : notification
            )
        );
    };

    // 清空所有通知
    const clearNotifications = () => {
        setNotifications([]);
    };

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                hasUnreadNotifications,
                addNotification,
                markAllAsRead,
                markAsRead,
                clearNotifications
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

// 自定义钩子
export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}; 