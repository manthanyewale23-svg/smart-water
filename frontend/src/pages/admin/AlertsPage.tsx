import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, CheckCircle, RefreshCw, Filter, ShieldAlert } from 'lucide-react';
import { alertsApi, zonesApi } from '../../api';
import { Alert, Zone } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { SeverityBadge, StatusBadge } from '../../components/common/Badges';
import { formatRelativeTime } from '../../utils';

const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterZone, setFilterZone] = useState('');

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const [aRes, zRes] = await Promise.all([
        alertsApi.list({
          severity: filterSeverity || undefined,
          status: filterStatus || undefined,
          zone_id: filterZone || undefined,
        }),
        zonesApi.list(),
      ]);
      setAlerts(aRes.data.alerts || []);
      setZones(zRes.data.zones || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterSeverity, filterStatus, filterZone]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const updateAlertStatus = async (id: string, newStatus: string) => {
    try {
      await alertsApi.update(id, { status: newStatus });
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: newStatus as any } : a));
    } catch (err) {
      console.error('Failed to update alert', err);
    }
  };

  const activeCount = alerts.filter(a => a.status === 'active').length;
  const criticalCount = alerts.filter(a => a.severity === 'critical' && a.status === 'active').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Alerts & Incidents</h1>
          <p className="text-sm text-gray-500">Automated sensor anomaly detection and water network thresholds</p>
        </div>
        <button onClick={fetchAlerts} className="btn-secondary flex items-center gap-2 py-2">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Alert Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card bg-red-50 border-red-100 flex items-center gap-4">
          <div className="p-3 bg-red-100 rounded-xl text-red-600">
            <ShieldAlert size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-red-800">Critical Active Alerts</p>
            <p className="text-3xl font-bold text-red-900">{criticalCount}</p>
          </div>
        </div>
        <div className="card bg-amber-50 border-amber-100 flex items-center gap-4">
          <div className="p-3 bg-amber-100 rounded-xl text-amber-600">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-amber-800">Total Active Incidents</p>
            <p className="text-3xl font-bold text-amber-900">{activeCount}</p>
          </div>
        </div>
        <div className="card bg-green-50 border-green-100 flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-xl text-green-600">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-green-800">Resolved Alerts</p>
            <p className="text-3xl font-bold text-green-900">{alerts.filter(a => a.status === 'resolved').length}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card py-4">
        <div className="flex flex-wrap gap-3">
          <select
            className="input py-2 w-auto"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
          </select>

          <select
            className="input py-2 w-auto"
            value={filterSeverity}
            onChange={e => setFilterSeverity(e.target.value)}
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            className="input py-2 w-auto"
            value={filterZone}
            onChange={e => setFilterZone(e.target.value)}
          >
            <option value="">All Zones</option>
            {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner className="py-16" text="Loading alert triggers..." />
      ) : alerts.length === 0 ? (
        <EmptyState
          icon={<CheckCircle size={48} className="text-green-500" />}
          title="All systems normal"
          description="No active system alerts or anomalies currently recorded."
        />
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`card flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 ${
                alert.severity === 'critical' ? 'border-red-500 bg-red-50/20' :
                alert.severity === 'high' ? 'border-orange-500' :
                alert.severity === 'medium' ? 'border-amber-500' : 'border-blue-500'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className={`p-2 rounded-lg flex-shrink-0 ${
                  alert.severity === 'critical' ? 'bg-red-100 text-red-600' :
                  alert.severity === 'high' ? 'bg-orange-100 text-orange-600' :
                  alert.severity === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  <AlertTriangle size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-gray-900 text-sm">{alert.alert_type}</h3>
                    <SeverityBadge severity={alert.severity} />
                    <StatusBadge status={alert.status} />
                  </div>
                  <p className="text-sm text-gray-700">{alert.message}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-2">
                    {alert.zone_name && <span>📍 {alert.zone_name}</span>}
                    <span>⏱ {formatRelativeTime(alert.created_at)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                {alert.status === 'active' && (
                  <button
                    onClick={() => updateAlertStatus(alert.id, 'acknowledged')}
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    Acknowledge
                  </button>
                )}
                {alert.status !== 'resolved' && (
                  <button
                    onClick={() => updateAlertStatus(alert.id, 'resolved')}
                    className="btn-primary text-xs py-1.5 px-3 bg-green-600 hover:bg-green-700"
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlertsPage;
