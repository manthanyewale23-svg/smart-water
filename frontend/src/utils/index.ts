export const getLossStatus = (pct: number): 'LOW' | 'MEDIUM' | 'HIGH' => {
  if (pct < 10) return 'LOW';
  if (pct < 20) return 'MEDIUM';
  return 'HIGH';
};

export const getLossColor = (status: 'LOW' | 'MEDIUM' | 'HIGH') =>
  ({ LOW: 'text-green-600', MEDIUM: 'text-amber-600', HIGH: 'text-red-600' }[status]);

export const getLossBgColor = (status: 'LOW' | 'MEDIUM' | 'HIGH') =>
  ({ LOW: 'bg-green-100', MEDIUM: 'bg-amber-100', HIGH: 'bg-red-100' }[status]);

export const getLossBorderColor = (status: 'LOW' | 'MEDIUM' | 'HIGH') =>
  ({ LOW: 'border-green-200', MEDIUM: 'border-amber-200', HIGH: 'border-red-200' }[status]);

export const formatLiters = (liters: number): string => {
  if (!liters) return '0 L';
  if (liters >= 1_000_000) return `${(liters / 1_000_000).toFixed(2)}M L`;
  if (liters >= 1_000) return `${(liters / 1_000).toFixed(1)}K L`;
  return `${Math.round(liters)} L`;
};

export const formatNumber = (n: number): string => {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return Math.round(n).toString();
};

export const formatDate = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return dateStr; }
};

export const formatDateTime = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch { return dateStr; }
};

export const formatRelativeTime = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
};

export const getPriorityColor = (p: string) => ({
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
}[p] || 'bg-gray-100 text-gray-700');

export const getStatusColor = (s: string) => ({
  reported: 'bg-gray-100 text-gray-700',
  verified: 'bg-blue-100 text-blue-700',
  assigned: 'bg-purple-100 text-purple-700',
  in_progress: 'bg-amber-100 text-amber-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-slate-100 text-slate-600',
  pending: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  active: 'bg-red-100 text-red-700',
  acknowledged: 'bg-blue-100 text-blue-700',
  normal: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  offline: 'bg-gray-100 text-gray-500',
  critical: 'bg-red-100 text-red-700',
}[s] || 'bg-gray-100 text-gray-700');

export const getSeverityColor = (s: string) => ({
  low: 'border-blue-400 bg-blue-50',
  medium: 'border-amber-500 bg-amber-50',
  high: 'border-orange-500 bg-orange-50',
  critical: 'border-red-600 bg-red-50',
}[s] || 'border-gray-300 bg-gray-50');

export const PROBLEM_TYPE_LABELS: Record<string, string> = {
  pipeline_leakage: 'Pipeline Leakage',
  road_leakage: 'Road Leakage',
  tank_overflow: 'Tank Overflow',
  low_pressure: 'Low Pressure',
  no_water: 'No Water Supply',
  broken_valve: 'Broken Valve',
  other: 'Other',
};

export const STATUS_LABELS: Record<string, string> = {
  reported: 'Reported',
  verified: 'Verified',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
  pending: 'Pending',
  completed: 'Completed',
  active: 'Active',
  acknowledged: 'Acknowledged',
};
