import React, { useEffect, useState, useCallback } from 'react';
import { MessageSquare, Filter, Eye, UserCheck, ChevronDown, Search, RefreshCw } from 'lucide-react';
import { complaintsApi, zonesApi, usersApi } from '../../api';
import { Complaint, Zone, User } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { StatusBadge, PriorityBadge } from '../../components/common/Badges';
import { formatDate, formatDateTime, PROBLEM_TYPE_LABELS } from '../../utils';

const STATUS_FLOW = ['reported', 'verified', 'assigned', 'in_progress', 'resolved', 'closed'];

const AdminComplaintsPage: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [workers, setWorkers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [filters, setFilters] = useState({ status: '', zone_id: '', priority: '', search: '' });
  const [updating, setUpdating] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, zRes, uRes] = await Promise.all([
        complaintsApi.list({ limit: 100 }),
        zonesApi.list(),
        usersApi.list({ role: 'worker', limit: 50 }),
      ]);
      setComplaints(cRes.data.complaints || []);
      setZones(zRes.data.zones || []);
      setWorkers(uRes.data.users || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = complaints.filter(c => {
    if (filters.status && c.status !== filters.status) return false;
    if (filters.zone_id && c.zone_id !== filters.zone_id) return false;
    if (filters.priority && c.priority !== filters.priority) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!c.description?.toLowerCase().includes(q) && !c.citizen_name?.toLowerCase().includes(q) && !c.id.includes(q)) return false;
    }
    return true;
  });

  const updateComplaint = async (id: string, data: any) => {
    setUpdating(true);
    try {
      await complaintsApi.update(id, data);
      await fetchAll();
      if (selected?.id === id) {
        const updated = complaints.find(c => c.id === id);
        if (updated) setSelected({ ...updated, ...data });
      }
    } finally { setUpdating(false); }
  };

  const PRIORITY_COUNTS = {
    total: complaints.length,
    open: complaints.filter(c => !['resolved', 'closed'].includes(c.status)).length,
    critical: complaints.filter(c => c.priority === 'critical').length,
    resolved: complaints.filter(c => ['resolved', 'closed'].includes(c.status)).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Complaint Management</h1>
        <button onClick={fetchAll} className="btn-secondary flex items-center gap-2 py-2"><RefreshCw size={16} /> Refresh</button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', value: PRIORITY_COUNTS.total, color: 'text-gray-900' },
          { label: 'Open', value: PRIORITY_COUNTS.open, color: 'text-blue-600' },
          { label: 'Critical', value: PRIORITY_COUNTS.critical, color: 'text-red-600' },
          { label: 'Resolved', value: PRIORITY_COUNTS.resolved, color: 'text-green-600' },
        ].map(item => (
          <div key={item.label} className="card py-3 text-center">
            <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
            <div className="text-xs text-gray-500">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card py-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input className="input pl-9 py-2" placeholder="Search complaints..." value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
          </div>
          <select className="input py-2 w-auto" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
            <option value="">All Status</option>
            {STATUS_FLOW.map(s => <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
          </select>
          <select className="input py-2 w-auto" value={filters.zone_id} onChange={e => setFilters(f => ({ ...f, zone_id: e.target.value }))}>
            <option value="">All Zones</option>
            {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>
          <select className="input py-2 w-auto" value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}>
            <option value="">All Priority</option>
            {['low', 'medium', 'high', 'critical'].map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
          </select>
        </div>
      </div>

      {loading ? <LoadingSpinner className="py-12" /> : filtered.length === 0 ? (
        <EmptyState icon={<MessageSquare size={48} />} title="No complaints found" description="No complaints match your current filters" />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['ID', 'Problem', 'Citizen', 'Zone', 'Priority', 'Status', 'Assigned To', 'Date', 'Actions'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-xs text-gray-500 whitespace-nowrap">#{c.id.slice(-6).toUpperCase()}</td>
                    <td className="py-3 px-4 font-medium text-gray-800 whitespace-nowrap max-w-[160px] truncate">{PROBLEM_TYPE_LABELS[c.problem_type]}</td>
                    <td className="py-3 px-4 text-gray-600 whitespace-nowrap">{c.citizen_name || '–'}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs whitespace-nowrap max-w-[100px] truncate">{c.zone_name || '–'}</td>
                    <td className="py-3 px-4"><PriorityBadge priority={c.priority} /></td>
                    <td className="py-3 px-4"><StatusBadge status={c.status} /></td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{c.assigned_worker_name || <span className="text-gray-300">Unassigned</span>}</td>
                    <td className="py-3 px-4 text-gray-400 text-xs whitespace-nowrap">{formatDate(c.created_at)}</td>
                    <td className="py-3 px-4">
                      <button onClick={() => setSelected(c)} className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-1">
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Complaint Detail Modal */}
      {selected && (
        <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`Complaint #${selected.id.slice(-6).toUpperCase()}`} size="lg">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Problem Type</span><p className="font-semibold">{PROBLEM_TYPE_LABELS[selected.problem_type]}</p></div>
              <div><span className="text-gray-500">Reported By</span><p className="font-semibold">{selected.citizen_name}</p></div>
              <div><span className="text-gray-500">Zone</span><p className="font-semibold">{selected.zone_name || '–'}</p></div>
              <div><span className="text-gray-500">Date</span><p className="font-semibold">{formatDateTime(selected.created_at)}</p></div>
              <div><span className="text-gray-500">Priority</span><PriorityBadge priority={selected.priority} /></div>
              <div><span className="text-gray-500">Status</span><StatusBadge status={selected.status} /></div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Description</p>
              <p className="text-sm text-gray-800">{selected.description}</p>
            </div>

            {selected.photo_url && (
              <div>
                <p className="text-xs text-gray-500 mb-2">Attached Photo</p>
                <img src={`http://localhost:3001${selected.photo_url}`} alt="Complaint" className="max-h-48 rounded-xl object-cover" />
              </div>
            )}

            {selected.latitude && (
              <div className="text-sm text-gray-600">
                📍 Location: {selected.latitude.toFixed(5)}, {selected.longitude?.toFixed(5)}
              </div>
            )}

            {/* Status update */}
            <div className="border-t border-gray-100 pt-4">
              <h4 className="font-semibold text-gray-800 mb-3">Update Status</h4>
              <div className="flex flex-wrap gap-2">
                {STATUS_FLOW.map(status => (
                  <button
                    key={status}
                    disabled={updating || selected.status === status}
                    onClick={() => updateComplaint(selected.id, { status })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      selected.status === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </button>
                ))}
              </div>
            </div>

            {/* Assign worker */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Assign Worker</h4>
              <div className="flex gap-2">
                <select
                  className="input py-2 flex-1"
                  defaultValue={selected.assigned_worker_id || ''}
                  onChange={e => {
                    if (e.target.value) updateComplaint(selected.id, { assigned_worker_id: e.target.value, status: 'assigned' });
                  }}
                >
                  <option value="">Select worker...</option>
                  {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              {selected.assigned_worker_name && <p className="text-xs text-gray-500 mt-1">Currently: {selected.assigned_worker_name}</p>}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminComplaintsPage;
