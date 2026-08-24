import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Droplets, Activity, AlertTriangle, MessageSquare, Wrench, CheckCircle,
  TrendingUp, Play, Square, RefreshCw, MapPin, Zap
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { dashboardApi } from '../../api';
import { DashboardData, Alert, Complaint } from '../../types';
import { StatCard } from '../../components/cards/StatCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatusBadge, PriorityBadge } from '../../components/common/Badges';
import { formatLiters, formatDate, formatRelativeTime, PROBLEM_TYPE_LABELS } from '../../utils';
import { useDemo } from '../../context/DemoContext';

const COLORS = ['#3b82f6', '#0ea5e9', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];
const STATUS_COLORS: Record<string, string> = {
  reported: '#6b7280', verified: '#3b82f6', assigned: '#8b5cf6',
  in_progress: '#f59e0b', resolved: '#10b981', closed: '#374151'
};

const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isRunning, startDemo, stopDemo, lastUpdate, alertTriggered } = useDemo();

  const fetchData = useCallback(async () => {
    try {
      const res = await dashboardApi.get();
      setData(res.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, isRunning ? 3000 : 30000);
    return () => clearInterval(interval);
  }, [fetchData, isRunning]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <LoadingSpinner size="lg" text="Loading dashboard..." />
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <AlertTriangle className="mx-auto text-red-500 mb-2" size={32} />
      <p className="text-red-700 font-medium">{error}</p>
      <button onClick={fetchData} className="btn-primary mt-3">Retry</button>
    </div>
  );

  const s = data?.summary;
  const lossColor = s?.loss_status === 'LOW' ? 'text-green-600' : s?.loss_status === 'MEDIUM' ? 'text-amber-600' : 'text-red-600';
  const lossIconBg = s?.loss_status === 'LOW' ? 'bg-green-100' : s?.loss_status === 'MEDIUM' ? 'bg-amber-100' : 'bg-red-100';

  // Pie chart data for complaint status
  const complaintPieData = Object.entries(data?.complaint_status_counts || {}).map(([k, v]) => ({
    name: k.replace('_', ' '), value: v, color: STATUS_COLORS[k] || '#6b7280'
  }));

  // Maintenance donut data
  const maintData = Object.entries(data?.maintenance_status_counts || {}).map(([k, v]) => ({
    name: k, value: v, color: k === 'completed' ? '#10b981' : k === 'in_progress' ? '#f59e0b' : '#6b7280'
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm">SmartWater Urban Water Management System · Pune</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <span className="text-xs text-gray-400">Updated {formatRelativeTime(lastUpdate.toISOString())}</span>
          )}
          <button onClick={fetchData} className="btn-secondary flex items-center gap-2 py-2">
            <RefreshCw size={16} /> Refresh
          </button>
          {!isRunning ? (
            <button
              onClick={startDemo}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:opacity-90 font-medium text-sm"
            >
              <Play size={16} /> Start Live Demo
            </button>
          ) : (
            <button
              onClick={stopDemo}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm"
            >
              <Square size={16} /> Stop Demo
            </button>
          )}
        </div>
      </div>

      {/* Demo Mode Banner */}
      {isRunning && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <span className="animate-pulse-dot text-amber-500 text-lg">●</span>
          <div>
            <span className="font-semibold text-amber-800">DEMO MODE ACTIVE</span>
            <span className="text-amber-600 text-sm ml-2">– Simulated sensor data updating every 3 seconds</span>
          </div>
          <div className="ml-auto text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-full font-medium">
            ⚠️ SIMULATED DATA
          </div>
        </div>
      )}

      {/* Alert Toast */}
      {alertTriggered && (
        <div className="fixed top-20 right-4 z-50 bg-red-600 text-white rounded-xl p-4 shadow-2xl max-w-sm animate-bounce-once">
          <div className="flex items-start gap-3">
            <Zap size={20} className="flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm">⚠️ Alert Triggered (Demo)</div>
              <div className="text-sm text-red-100 mt-1">{alertTriggered}</div>
            </div>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <StatCard
          title="Total Supply"
          value={formatLiters(s?.total_supplied || 0)}
          subtitle="All zones today"
          icon={<Droplets size={22} className="text-blue-600" />}
          iconBg="bg-blue-100"
        />
        <StatCard
          title="Total Consumed"
          value={formatLiters(s?.total_consumed || 0)}
          subtitle="Billed consumption"
          icon={<Activity size={22} className="text-teal-600" />}
          iconBg="bg-teal-100"
        />
        <StatCard
          title="Water Loss"
          value={formatLiters(s?.water_loss || 0)}
          subtitle={`${s?.loss_percentage?.toFixed(1)}% – ${s?.loss_status}`}
          icon={<AlertTriangle size={22} className={lossColor} />}
          iconBg={lossIconBg}
          valueColor={lossColor}
        />
        <StatCard
          title="Active Alerts"
          value={s?.active_alerts || 0}
          subtitle="Require attention"
          icon={<AlertTriangle size={22} className="text-red-600" />}
          iconBg="bg-red-100"
          valueColor={s?.active_alerts ? 'text-red-600' : 'text-gray-900'}
        />
        <StatCard
          title="Open Complaints"
          value={s?.open_complaints || 0}
          subtitle="Pending action"
          icon={<MessageSquare size={22} className="text-purple-600" />}
          iconBg="bg-purple-100"
        />
        <StatCard
          title="Pending Maintenance"
          value={s?.pending_maintenance || 0}
          subtitle="Tasks in queue"
          icon={<Wrench size={22} className="text-amber-600" />}
          iconBg="bg-amber-100"
        />
        <StatCard
          title="Resolved"
          value={s?.resolved_complaints || 0}
          subtitle="Complaints closed"
          icon={<CheckCircle size={22} className="text-green-600" />}
          iconBg="bg-green-100"
          valueColor="text-green-600"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Consumption Chart */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Daily Consumption (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data?.daily_consumption || []}>
              <defs>
                <linearGradient id="supplyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="consumeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: any) => [formatLiters(v), '']} />
              <Legend />
              <Area type="monotone" dataKey="supplied" name="Supplied" stroke="#3b82f6" fill="url(#supplyGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="consumed" name="Consumed" stroke="#0ea5e9" fill="url(#consumeGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Zone-wise Supply/Consumption */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Zone-wise Supply vs Consumption (Today)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data?.zone_summary || []} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} tickFormatter={n => n.split(' ')[1] || n} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: any) => [formatLiters(v), '']} />
              <Legend />
              <Bar dataKey="supplied" name="Supplied" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="consumed" name="Consumed" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              <Bar dataKey="loss" name="Loss" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Complaint Status Pie */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Complaint Status Distribution</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="60%" height={200}>
              <PieChart>
                <Pie data={complaintPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                  {complaintPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v: any, n: any) => [v, n]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 flex-1">
              {complaintPieData.map(item => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-600 capitalize">{item.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Maintenance Status */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Maintenance Task Status</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="60%" height={200}>
              <PieChart>
                <Pie data={maintData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                  {maintData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 flex-1">
              {maintData.map(item => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-600 capitalize">{item.name.replace('_', ' ')}</span>
                  </div>
                  <span className="font-bold text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Map Preview + Recent data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Static Map Preview */}
        <div className="card overflow-hidden p-0">
          <div className="bg-gradient-to-br from-blue-800 to-blue-900 p-6 text-white relative" style={{ minHeight: 220 }}>
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '30px 30px'
            }} />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={20} />
                <h3 className="font-semibold text-lg">Water Network Map</h3>
                <span className="ml-auto text-xs bg-white/20 px-2 py-1 rounded-full">Pune, India</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: 'Water Tanks', count: 5, color: 'bg-blue-400' },
                  { label: 'Pump Stations', count: 3, color: 'bg-purple-400' },
                  { label: 'Active Sensors', count: 9, color: 'bg-green-400' },
                  { label: 'Active Complaints', count: s?.open_complaints || 0, color: 'bg-red-400' },
                ].map(item => (
                  <div key={item.label} className="bg-white/10 rounded-xl p-3">
                    <div className={`${item.color} w-3 h-3 rounded-full mb-1`} />
                    <div className="text-xl font-bold">{item.count}</div>
                    <div className="text-xs text-blue-200">{item.label}</div>
                  </div>
                ))}
              </div>
              <Link
                to="/admin/map"
                className="inline-flex items-center gap-2 bg-white text-blue-900 font-semibold px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors text-sm"
              >
                <MapPin size={16} /> Open Full Map
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Recent Alerts</h3>
            <Link to="/admin/alerts" className="text-sm text-blue-600 hover:text-blue-700">View all</Link>
          </div>
          {data?.recent_alerts?.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No active alerts</p>
          ) : (
            <div className="space-y-3">
              {data?.recent_alerts?.map(alert => (
                <div key={alert.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`flex-shrink-0 mt-0.5 rounded-full h-2 w-2 ${
                    alert.severity === 'critical' ? 'bg-red-500' :
                    alert.severity === 'high' ? 'bg-orange-500' :
                    alert.severity === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{alert.alert_type}</p>
                    <p className="text-xs text-gray-500 truncate">{alert.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatRelativeTime(alert.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Complaints */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Recent Complaints</h3>
          <Link to="/admin/complaints" className="text-sm text-blue-600 hover:text-blue-700">View all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">ID</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Problem</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Citizen</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Priority</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Date</th>
              </tr>
            </thead>
            <tbody>
              {data?.recent_complaints?.map(c => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2.5 px-3 font-mono text-xs text-gray-500">#{c.id.slice(-6).toUpperCase()}</td>
                  <td className="py-2.5 px-3 font-medium text-gray-800">{PROBLEM_TYPE_LABELS[c.problem_type] || c.problem_type}</td>
                  <td className="py-2.5 px-3 text-gray-600">{c.citizen_name || '–'}</td>
                  <td className="py-2.5 px-3"><PriorityBadge priority={c.priority} /></td>
                  <td className="py-2.5 px-3"><StatusBadge status={c.status} /></td>
                  <td className="py-2.5 px-3 text-gray-400 text-xs">{formatDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
