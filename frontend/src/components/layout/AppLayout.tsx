import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

const pageTitles: Record<string, string> = {
  '/admin/dashboard': 'Dashboard',
  '/admin/consumption': 'Water Consumption',
  '/admin/water-loss': 'Water Loss Analysis',
  '/admin/sensors': 'Sensor Monitoring',
  '/admin/map': 'Water Network Map',
  '/admin/complaints': 'Complaint Management',
  '/admin/maintenance': 'Maintenance Tasks',
  '/admin/reports': 'Reports',
  '/admin/alerts': 'Alerts',
  '/admin/users': 'User Management',
  '/admin/settings': 'Settings',
  '/admin/notifications': 'Notifications',
  '/worker/dashboard': 'My Dashboard',
  '/worker/tasks': 'My Tasks',
  '/worker/map': 'Water Network Map',
  '/worker/notifications': 'Notifications',
  '/worker/profile': 'My Profile',
  '/citizen/dashboard': 'My Dashboard',
  '/citizen/consumption': 'My Water Usage',
  '/citizen/report': 'Report a Problem',
  '/citizen/complaints': 'My Complaints',
  '/citizen/notifications': 'Notifications',
  '/citizen/profile': 'My Profile',
};

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'SmartWater';

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(true)} title={title} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 max-w-screen-2xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
