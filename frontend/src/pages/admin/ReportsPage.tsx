import React, { useState, useEffect } from 'react';
import { FileText, Download, Filter, Calendar } from 'lucide-react';
import { reportsApi, zonesApi } from '../../api';
import { Zone } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatLiters, formatDate } from '../../utils';

const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState('weekly');
  const [zoneId, setZoneId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [zones, setZones] = useState<Zone[]>([]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    zonesApi.list().then(res => setZones(res.data.zones || [])).catch(() => {});
  }, []);

  const generateReport = async () => {
    setLoading(true);
    try {
      const res = await reportsApi.get({
        type: reportType,
        zone_id: zoneId || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      setData(res.data);
    } catch (err) {
      console.error('Failed to generate report', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateReport();
  }, [reportType, zoneId]);

  const exportCSV = () => {
    if (!data?.list || data.list.length === 0) return;
    let headers: string[] = [];
    let rows: any[][] = [];

    if (reportType === 'complaints') {
      headers = ['ID', 'Problem Type', 'Citizen', 'Zone', 'Priority', 'Status', 'Date'];
      rows = data.list.map((c: any) => [c.id, c.problem_type, c.citizen_name, c.zone_name, c.priority, c.status, c.created_at]);
    } else if (reportType === 'maintenance') {
      headers = ['ID', 'Title', 'Worker', 'Zone', 'Priority', 'Status', 'Due Date', 'Completed Date'];
      rows = data.list.map((m: any) => [m.id, m.title, m.worker_name, m.zone_name, m.priority, m.status, m.due_date, m.completed_at]);
    } else {
      headers = ['Date', 'Zone', 'Supplied (L)', 'Consumed (L)', 'Loss (L)', 'Loss %'];
      rows = data.list.map((r: any) => [r.date || '-', r.zone_name, r.supplied, r.consumed, r.loss, r.loss_pct]);
    }

    const csvContent = [headers.join(','), ...rows.map(e => e.map(val => `"${val || ''}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `smartwater_report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-500">Generate, audit, and export municipal water operations reports</p>
        </div>
        <button
          onClick={exportCSV}
          disabled={!data?.list || data.list.length === 0}
          className="btn-secondary flex items-center gap-2 py-2 disabled:opacity-50"
        >
          <Download size={16} /> Export to CSV
        </button>
      </div>

      {/* Filter Card */}
      <div className="card py-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="label">Report Category</label>
            <select
              className="input py-2"
              value={reportType}
              onChange={e => setReportType(e.target.value)}
            >
              <option value="weekly">Weekly Water Supply & Loss</option>
              <option value="monthly">Monthly Audit</option>
              <option value="zone-loss">Zone-Wise Water Loss</option>
              <option value="complaints">Citizen Complaints Summary</option>
              <option value="maintenance">Maintenance Operations</option>
            </select>
          </div>

          <div>
            <label className="label">Filter by Zone</label>
            <select
              className="input py-2"
              value={zoneId}
              onChange={e => setZoneId(e.target.value)}
            >
              <option value="">All Zones</option>
              {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Start Date</label>
            <input
              type="date"
              className="input py-2"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>

          <div>
            <label className="label">End Date</label>
            <input
              type="date"
              className="input py-2"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>

          <button onClick={generateReport} className="btn-primary flex items-center gap-2 py-2">
            <Filter size={16} /> Generate
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner className="py-16" text="Compiling report data..." />
      ) : data ? (
        <div className="space-y-6">
          {/* Summary metrics if available */}
          {data.totals && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="card bg-blue-50/50 border-blue-100">
                <p className="text-sm font-medium text-gray-500">Period Supply</p>
                <p className="text-2xl font-bold text-blue-700">{formatLiters(data.totals.total_supplied)}</p>
              </div>
              <div className="card bg-teal-50/50 border-teal-100">
                <p className="text-sm font-medium text-gray-500">Period Consumption</p>
                <p className="text-2xl font-bold text-teal-700">{formatLiters(data.totals.total_consumed)}</p>
              </div>
              <div className="card bg-amber-50/50 border-amber-100">
                <p className="text-sm font-medium text-gray-500">Period Loss</p>
                <p className="text-2xl font-bold text-amber-700">{formatLiters(data.totals.total_loss)}</p>
              </div>
            </div>
          )}

          {/* Results Table */}
          <div className="card p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">
                Report Records ({data.list?.length || 0})
              </h3>
              <span className="text-xs text-gray-400">
                Range: {formatDate(data.start)} – {formatDate(data.end)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {reportType === 'complaints' ? (
                      <>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Citizen</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Zone</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Priority</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Date</th>
                      </>
                    ) : reportType === 'maintenance' ? (
                      <>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Task ID</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Title</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Worker</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Zone</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Due Date</th>
                      </>
                    ) : (
                      <>
                        {data.list?.[0]?.date && <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Date</th>}
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Zone</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Supplied</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Consumed</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Loss</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Loss %</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.list?.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      {reportType === 'complaints' ? (
                        <>
                          <td className="py-3 px-4 font-mono text-xs text-gray-500">#{row.id?.slice(-6).toUpperCase()}</td>
                          <td className="py-3 px-4 font-medium text-gray-800">{row.problem_type}</td>
                          <td className="py-3 px-4 text-gray-600">{row.citizen_name || '–'}</td>
                          <td className="py-3 px-4 text-gray-600">{row.zone_name || '–'}</td>
                          <td className="py-3 px-4 uppercase text-xs font-semibold">{row.priority}</td>
                          <td className="py-3 px-4">{row.status}</td>
                          <td className="py-3 px-4 text-gray-400 text-xs">{formatDate(row.created_at)}</td>
                        </>
                      ) : reportType === 'maintenance' ? (
                        <>
                          <td className="py-3 px-4 font-mono text-xs text-gray-500">#{row.id?.slice(-6).toUpperCase()}</td>
                          <td className="py-3 px-4 font-medium text-gray-800">{row.title}</td>
                          <td className="py-3 px-4 text-gray-600">{row.worker_name || '–'}</td>
                          <td className="py-3 px-4 text-gray-600">{row.zone_name || '–'}</td>
                          <td className="py-3 px-4 font-medium">{row.status}</td>
                          <td className="py-3 px-4 text-gray-400 text-xs">{row.due_date ? formatDate(row.due_date) : '–'}</td>
                        </>
                      ) : (
                        <>
                          {row.date && <td className="py-3 px-4 text-gray-600">{formatDate(row.date)}</td>}
                          <td className="py-3 px-4 font-medium text-gray-800">{row.zone_name}</td>
                          <td className="py-3 px-4 text-gray-600">{formatLiters(row.supplied)}</td>
                          <td className="py-3 px-4 text-gray-600">{formatLiters(row.consumed)}</td>
                          <td className="py-3 px-4 text-amber-600 font-medium">{formatLiters(row.loss)}</td>
                          <td className="py-3 px-4 font-bold">{row.loss_pct}%</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ReportsPage;
