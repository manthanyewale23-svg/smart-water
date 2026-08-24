import React, { useEffect, useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Filter, Download } from 'lucide-react';
import { consumptionApi, zonesApi } from '../../api';
import { Zone } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatCard } from '../../components/cards/StatCard';
import { Droplets, Activity, AlertTriangle } from 'lucide-react';
import { formatLiters, getLossStatus, getLossColor, getLossBgColor } from '../../utils';

const ConsumptionPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');
  const [zoneId, setZoneId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = { period };
      if (zoneId) params.zone_id = zoneId;
      if (period === 'custom' && startDate) { params.start_date = startDate; params.end_date = endDate || new Date().toISOString().split('T')[0]; }
      const [consRes, zonesRes] = await Promise.all([consumptionApi.list(params), zonesApi.list()]);
      setData(consRes.data);
      setZones(zonesRes.data.zones || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [period, zoneId]);

  const t = data?.totals;
  const lossStatus = t?.total_supplied > 0 ? getLossStatus((t.total_loss / t.total_supplied) * 100) : 'LOW';

  // Aggregate zone data from the dataset
  const zoneData: Record<string, { zone_name: string; supplied: number; consumed: number; loss: number }> = {};
  (data?.data || []).forEach((row: any) => {
    if (!zoneData[row.zone_id]) zoneData[row.zone_id] = { zone_name: row.zone_name, supplied: 0, consumed: 0, loss: 0 };
    zoneData[row.zone_id].supplied += row.supplied;
    zoneData[row.zone_id].consumed += row.consumed;
    zoneData[row.zone_id].loss += row.loss;
  });

  const exportCSV = () => {
    const headers = ['Date', 'Zone', 'Supplied (L)', 'Consumed (L)', 'Loss (L)', 'Loss %'];
    const rows = (data?.data || []).map((r: any) => [r.date, r.zone_name, r.supplied, r.consumed, r.loss, r.loss_percentage]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'consumption_report.csv'; a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Water Consumption</h1>
        <button onClick={exportCSV} className="btn-secondary flex items-center gap-2 py-2">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="card py-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="label">Period</label>
            <select className="input py-2" value={period} onChange={e => setPeriod(e.target.value)}>
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          {period === 'custom' && (
            <>
              <div>
                <label className="label">Start Date</label>
                <input type="date" className="input py-2" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="label">End Date</label>
                <input type="date" className="input py-2" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </>
          )}
          <div>
            <label className="label">Zone</label>
            <select className="input py-2" value={zoneId} onChange={e => setZoneId(e.target.value)}>
              <option value="">All Zones</option>
              {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
          </div>
          <button onClick={fetchData} className="btn-primary flex items-center gap-2 py-2">
            <Filter size={16} /> Apply
          </button>
        </div>
      </div>

      {loading ? <LoadingSpinner className="py-12" text="Loading consumption data..." /> : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard title="Total Supplied" value={formatLiters(t?.total_supplied || 0)} icon={<Droplets size={20} className="text-blue-600" />} iconBg="bg-blue-100" />
            <StatCard title="Total Consumed" value={formatLiters(t?.total_consumed || 0)} icon={<Activity size={20} className="text-teal-600" />} iconBg="bg-teal-100" />
            <StatCard title="Total Loss" value={formatLiters(t?.total_loss || 0)} valueColor={getLossColor(lossStatus)} icon={<AlertTriangle size={20} className={getLossColor(lossStatus)} />} iconBg={getLossBgColor(lossStatus)} />
            <StatCard title="Avg Loss %" value={t?.total_supplied > 0 ? `${((t.total_loss / t.total_supplied) * 100).toFixed(1)}%` : '0%'} subtitle={lossStatus} valueColor={getLossColor(lossStatus)} icon={<AlertTriangle size={20} className={getLossColor(lossStatus)} />} iconBg={getLossBgColor(lossStatus)} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Daily Trend</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data?.daily || []}>
                  <defs>
                    <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
                    <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} /><stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d?.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(v: any) => [formatLiters(v), '']} />
                  <Legend />
                  <Area type="monotone" dataKey="supplied" name="Supplied" stroke="#3b82f6" fill="url(#sg)" strokeWidth={2} />
                  <Area type="monotone" dataKey="consumed" name="Consumed" stroke="#0ea5e9" fill="url(#cg)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Zone-wise Consumption</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={Object.values(zoneData)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="zone_name" tick={{ fontSize: 10 }} tickFormatter={n => n?.split(' – ')?.[1] || n?.split(' - ')?.[1] || n?.split(' ')?.[1] || n} />
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

          {/* Zone table */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Zone-wise Summary</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Zone', 'Supplied', 'Consumed', 'Loss', 'Loss %', 'Status'].map(h => (
                      <th key={h} className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.values(zoneData).map(z => {
                    const lossPct = z.supplied > 0 ? (z.loss / z.supplied) * 100 : 0;
                    const status = getLossStatus(lossPct);
                    return (
                      <tr key={z.zone_name} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2.5 px-3 font-medium text-gray-800">{z.zone_name}</td>
                        <td className="py-2.5 px-3 text-gray-600">{formatLiters(z.supplied)}</td>
                        <td className="py-2.5 px-3 text-gray-600">{formatLiters(z.consumed)}</td>
                        <td className="py-2.5 px-3 text-gray-600">{formatLiters(z.loss)}</td>
                        <td className="py-2.5 px-3 font-semibold">{lossPct.toFixed(1)}%</td>
                        <td className="py-2.5 px-3">
                          <span className={`badge ${getLossBgColor(status)} ${getLossColor(status)}`}>{status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ConsumptionPage;
