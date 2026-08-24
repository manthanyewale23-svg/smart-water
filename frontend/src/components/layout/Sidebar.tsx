import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BarChart3, Droplets, Activity, Map, MessageSquare,
  Wrench, FileText, AlertTriangle, Users, Settings, Bell, User,
  ClipboardList, MessageCircle, BarChart2, Plus, LogOut, Droplet,
  ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const adminNav: NavItem[] = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'Consumption', path: '/admin/consumption', icon: <BarChart3 size={20} /> },
  { label: 'Water Loss', path: '/admin/water-loss', icon: <Droplets size={20} /> },
  { label: 'Sensors', path: '/admin/sensors', icon: <Activity size={20} /> },
  { label: 'Water Network Map', path: '/admin/map', icon: <Map size={20} /> },
  { label: 'Complaints', path: '/admin/complaints', icon: <MessageSquare size={20} /> },
  { label: 'Maintenance', path: '/admin/maintenance', icon: <Wrench size={20} /> },
  { label: 'Reports', path: '/admin/reports', icon: <FileText size={20} /> },
  { label: 'Alerts', path: '/admin/alerts', icon: <AlertTriangle size={20} /> },
  { label: 'Users', path: '/admin/users', icon: <Users size={20} /> },
  { label: 'Settings', path: '/admin/settings', icon: <Settings size={20} /> },
  { label: 'Notifications', path: '/admin/notifications', icon: <Bell size={20} /> },
];

const workerNav: NavItem[] = [
  { label: 'Dashboard', path: '/worker/dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'My Tasks', path: '/worker/tasks', icon: <ClipboardList size={20} /> },
  { label: 'Water Map', path: '/worker/map', icon: <Map size={20} /> },
  { label: 'Notifications', path: '/worker/notifications', icon: <Bell size={20} /> },
  { label: 'Profile', path: '/worker/profile', icon: <User size={20} /> },
];

const citizenNav: NavItem[] = [
  { label: 'Dashboard', path: '/citizen/dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'My Consumption', path: '/citizen/consumption', icon: <BarChart2 size={20} /> },
  { label: 'Report Problem', path: '/citizen/report', icon: <Plus size={20} /> },
  { label: 'My Complaints', path: '/citizen/complaints', icon: <MessageCircle size={20} /> },
  { label: 'Notifications', path: '/citizen/notifications', icon: <Bell size={20} /> },
  { label: 'Profile', path: '/citizen/profile', icon: <User size={20} /> },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, collapsed, onToggleCollapse }) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const navItems = user?.role === 'admin' ? adminNav : user?.role === 'worker' ? workerNav : citizenNav;
  const roleLabel = user?.role === 'admin' ? 'Administrator' : user?.role === 'worker' ? 'Maintenance Worker' : 'Citizen';
  const notifPath = `/${user?.role}/notifications`;

  const handleLogout = () => { logout(); navigate('/login'); };

  const SidebarContent = () => (
    <div className="h-full flex flex-col bg-slate-900 text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 bg-slate-800 border-b border-slate-700">
        <div className="bg-blue-600 rounded-xl p-2 flex-shrink-0">
          <Droplet size={22} className="text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="font-bold text-white text-base leading-tight">SmartWater</div>
            <div className="text-xs text-slate-400 leading-tight">Urban Water Management</div>
          </div>
        )}
        {/* Desktop collapse toggle */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex ml-auto p-1 rounded hover:bg-slate-700 flex-shrink-0"
        >
          {collapsed ? <ChevronRight size={16} className="text-slate-400" /> : <ChevronLeft size={16} className="text-slate-400" />}
        </button>
        {/* Mobile close */}
        <button onClick={onClose} className="lg:hidden ml-auto p-1 rounded hover:bg-slate-700">
          <X size={18} className="text-slate-400" />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {navItems.map((item) => {
          const isNotif = item.path === notifPath;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => { if (window.innerWidth < 1024) onClose(); }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg mb-0.5 transition-colors relative ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <span className="flex-shrink-0 relative">
                {item.icon}
                {isNotif && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold leading-none">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </span>
              {!collapsed && <span className="text-sm font-medium leading-none">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="border-t border-slate-700 p-3">
        <div className={`flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 cursor-pointer ${collapsed ? 'justify-center' : ''}`}>
          <div className="flex-shrink-0 bg-blue-600 rounded-full h-8 w-8 flex items-center justify-center font-bold text-sm">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-white truncate">{user?.name}</div>
              <div className="text-xs text-slate-400 truncate">{roleLabel}</div>
            </div>
          )}
          {!collapsed && (
            <button onClick={handleLogout} className="p-1 rounded hover:bg-slate-700 flex-shrink-0" title="Logout">
              <LogOut size={16} className="text-slate-400" />
            </button>
          )}
        </div>
        {collapsed && (
          <button onClick={handleLogout} className="w-full flex justify-center p-2 rounded hover:bg-slate-800 mt-1" title="Logout">
            <LogOut size={16} className="text-slate-400" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onClose} />
      )}

      {/* Desktop sidebar */}
      <div className={`hidden lg:flex flex-col flex-shrink-0 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
        <div className="fixed top-0 left-0 h-full" style={{ width: collapsed ? 64 : 256, zIndex: 20 }}>
          <SidebarContent />
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className={`fixed top-0 left-0 h-full w-72 z-40 lg:hidden transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </div>
    </>
  );
};
