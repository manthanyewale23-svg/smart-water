import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationsApi } from '../api';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  unreadCount: number;
  refreshCount: () => void;
}

const NotificationContext = createContext<NotificationContextType>({ unreadCount: 0, refreshCount: () => {} });

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  const refreshCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await notificationsApi.count();
      setUnreadCount(res.data.unread_count || 0);
    } catch { /* ignore */ }
  }, [user]);

  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    refreshCount();
    const interval = setInterval(refreshCount, 30000);
    return () => clearInterval(interval);
  }, [user, refreshCount]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
