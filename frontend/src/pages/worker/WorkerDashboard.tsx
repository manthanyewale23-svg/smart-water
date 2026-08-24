import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, CheckCircle2, Clock, MapPin, AlertCircle, ArrowRight } from 'lucide-react';
import { maintenanceApi } from '../../api';
import { MaintenanceTask } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatusBadge, PriorityBadge } from '../../components/common/Badges';
import { formatDate, formatRelativeTime } from '../../utils';
import { useAuth } from '../../context/AuthContext';

const WorkerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    maintenanceApi.list().then(res => {
      setTasks(res.data.tasks || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Worker Dashboard</h1>
        <p className="text-sm text-gray-500">Welcome back, {user?.name}. Here is your field maintenance queue.</p>
      </div>

      {/* Task Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card bg-amber-50 border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-800">Pending Tasks</p>
              <p className="text-3xl font-bold text-amber-900 mt-1">{pendingTasks.length}</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-xl text-amber-600">
              <Clock size={24} />
            </div>
          </div>
        </div>

        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">In Progress</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{inProgressTasks.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
              <ClipboardList size={24} />
            </div>
          </div>
        </div>

        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Completed</p>
              <p className="text-3xl font-bold text-green-900 mt-1">{completedTasks.length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl text-green-600">
              <CheckCircle2 size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Action banner */}
      <div className="card bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold">Field Navigation Map</h3>
          <p className="text-blue-200 text-sm mt-0.5">Explore active water asset positions, pipe leaks, and valves across Pune</p>
        </div>
        <Link
          to="/worker/map"
          className="px-4 py-2 bg-white text-blue-900 font-semibold text-sm rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2"
        >
          <MapPin size={16} /> Open Network Map
        </Link>
      </div>

      {/* Immediate Tasks Queue */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Active Work Orders</h3>
          <Link to="/worker/tasks" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
            View All Tasks <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner className="py-8" />
        ) : tasks.filter(t => t.status !== 'completed').length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">No active tasks assigned to you right now.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {tasks.filter(t => t.status !== 'completed').map(task => (
              <div key={task.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 text-sm">{task.title}</span>
                    <PriorityBadge priority={task.priority} />
                    <StatusBadge status={task.status} />
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-1">{task.description || 'No description provided.'}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                    {task.zone_name && <span>📍 {task.zone_name}</span>}
                    {task.due_date && <span>📅 Due: {formatDate(task.due_date)}</span>}
                  </div>
                </div>
                <Link
                  to="/worker/tasks"
                  className="btn-secondary text-xs py-1.5 px-3 self-start sm:self-center"
                >
                  Manage
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerDashboard;
