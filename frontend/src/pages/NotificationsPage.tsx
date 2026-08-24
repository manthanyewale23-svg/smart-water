import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, RefreshCw, AlertCircle, CheckCircle2, Wrench, MessageSquare } from 'lucide-react';
import { notificationsApi } from '../api';
import { Notification } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { formatRelativeTime } from '../utils';
import { useNotifications } from '../context/NotificationContext';

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { refreshCount } = useNotifications();

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationsApi.list();
      setNotifications(res.data.notifications || []);
      refreshCount();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: 1 } : n));
      refreshCount();
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: 1 })));
      refreshCount();
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <div className="p-2 bg-red-100 text-red-600 rounded-lg"><AlertCircle size={18} /></div>;
      case 'complaint':
        return <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><MessageSquare size={18} /></div>;
      case 'task':
      case 'maintenance':
        return <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><Wrench size={18} /></div>;
      default:
        return <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Bell size={18} /></div>;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500">Stay updated on complaints, network alerts, and assigned work orders</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchNotifications} className="btn-secondary flex items-center gap-2 py-2">
            <RefreshCw size={16} /> Refresh
          </button>
          <button
            onClick={markAllAsRead}
            disabled={notifications.every(n => n.read === 1)}
            className="btn-secondary flex items-center gap-2 py-2 disabled:opacity-50"
          >
            <CheckCheck size={16} /> Mark all as read
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner className="py-16" text="Loading notifications..." />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Bell size={48} className="text-gray-300" />}
          title="No notifications"
          description="You're all caught up! There are no new notifications for your account."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => n.read === 0 && markAsRead(n.id)}
              className={`card flex items-start gap-4 transition-all cursor-pointer ${
                n.read === 0 ? 'bg-blue-50/40 border-blue-200 shadow-sm' : 'bg-white hover:bg-gray-50'
              }`}
            >
              {getIcon(n.type)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className={`text-sm font-semibold truncate ${n.read === 0 ? 'text-blue-900' : 'text-gray-800'}`}>
                    {n.title}
                  </h4>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {formatRelativeTime(n.created_at)}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{n.message}</p>
              </div>
              {n.read === 0 && (
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600 flex-shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
