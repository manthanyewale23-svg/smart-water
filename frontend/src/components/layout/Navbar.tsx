import React, { useState } from 'react';
import { Menu, Bell, LogOut } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

interface Props {
  onMenuClick: () => void;
  title?: string;
}

export const Navbar: React.FC<Props> = ({ onMenuClick, title }) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifPath = `/${user?.role}/notifications`;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
        >
          <Menu size={20} />
        </button>
        {title && <h1 className="font-semibold text-gray-900 text-lg hidden sm:block">{title}</h1>}
      </div>

      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <Link
          to={notifPath}
          className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-600"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100"
          >
            <div className="bg-blue-600 rounded-full h-7 w-7 flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
              {user?.name}
            </span>
          </button>
          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-20 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
                <Link
                  to={`/${user?.role}/profile`}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setShowUserMenu(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
