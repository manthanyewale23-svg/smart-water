import React, { useEffect, useState, useCallback } from 'react';
import { Wrench, Plus, RefreshCw, Eye, Check, Clock } from 'lucide-react';
import { maintenanceApi, zonesApi, usersApi } from '../../api';
import { MaintenanceTask, Zone, User } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { StatusBadge, PriorityBadge } from '../../components/common/Badges';
import { formatDate, formatRelativeTime } from '../../utils';

const MaintenancePage: React.FC = () => {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [workers, setWorkers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<MaintenanceTask | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '', description: '', worker_id: '', priority: 'medium', zone_id: '', due_date: ''
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, zRes, uRes] = await Promise.all([
        maintenanceApi.list({ limit: 100 }),
        zonesApi.list(),
        usersApi.list({ role: 'worker', limit: 50 }),
      ]);
      setTasks(tRes.data.tasks || []);
      setZones(zRes.data.zones || []);
      setWorkers(uRes.data.users || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = tasks.filter(t => !filterStatus || t.status === filterStatus);

  const createTask = async () => {
    if (!createForm.title || !createForm.worker_id) return;
    setCreating(true);
    try {
      await maintenanceApi.create(createForm);
      setShowCreate(false);
      setCreateForm({ title: '', description: '', worker_id: '', priority: 'medium', zone_id: '', due_date: '' });
      await fetchAll();
    } finally { setCreating(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    await maintenanceApi.update(id, { status });
    await fetchAll();
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: status as any } : null);
  };

  const COUNTS = {
    pending: tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Maintenance Tasks</h1>
        <div className="flex gap-2">
          <button onClick={fetchAll} className="btn-secondary flex items-center gap-2 py-2"><RefreshCw size={16} /> Refresh</button>
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 py-2"><Plus size={16} /> New Task</button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending', count: COUNTS.pending, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: <Clock size={20} className="text-amber-500" /> },
          { label: 'In Progress', count: COUNTS.in_progress, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: <Wrench size={20} className="text-blue-500" /> },
          { label: 'Completed', count: COUNTS.completed, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', icon: <Check size={20} className="text-green-500" /> },
        ].map(item => (
          <div key={item.label} className={`card ${item.bg} border ${item.border}`}>
            <div className="flex items-center gap-3">
              {item.icon}
              <div>
                <div className={`text-2xl font-bold ${item.color}`}>{item.count}</div>
                <div className="text-xs text-gray-600">{item.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['', 'pending', 'in_progress', 'completed'].map(status => (
          <button
            key={status || 'all'}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatus === status ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {status ? status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'All'}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner className="py-12" /> : filtered.length === 0 ? (
        <EmptyState icon={<Wrench size={48} />} title="No tasks found" action={<button onClick={() => setShowCreate(true)} className="btn-primary">Create Task</button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(task => (
            <div key={task.id} className={`card cursor-pointer hover:shadow-md transition-all border-l-4 ${task.status === 'completed' ? 'border-green-400' : task.status === 'in_progress' ? 'border-blue-400' : 'border-amber-400'}`} onClick={() => setSelected(task)}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 text-sm leading-tight flex-1 pr-2">{task.title}</h3>
                <PriorityBadge priority={task.priority} />
              </div>
              {task.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{task.description}</p>}
              <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                <span>👷 {task.worker_name || 'Unassigned'}</span>
                <span>📍 {task.zone_name || 'No zone'}</span>
              </div>
              {task.due_date && (
                <div className="text-xs text-gray-500 mb-2">📅 Due: {formatDate(task.due_date)}</div>
              )}
              <div className="flex items-center justify-between">
                <StatusBadge status={task.status} />
                <span className="text-xs text-gray-400">{formatRelativeTime(task.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create task modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Maintenance Task" size="md">
        <div className="space-y-4">
          <div>
            <label className="label">Title *</label>
            <input className="input" value={createForm.title} onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g., Fix Pipeline Leak in Zone C" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={createForm.description} onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))} placeholder="Detailed description of the task..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Assign Worker *</label>
              <select className="input py-2" value={createForm.worker_id} onChange={e => setCreateForm(f => ({ ...f, worker_id: e.target.value }))}>
                <option value="">Select worker...</option>
                {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input py-2" value={createForm.priority} onChange={e => setCreateForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Zone</label>
              <select className="input py-2" value={createForm.zone_id} onChange={e => setCreateForm(f => ({ ...f, zone_id: e.target.value }))}>
                <option value="">Select zone...</option>
                {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Due Date</label>
              <input type="date" className="input py-2" value={createForm.due_date} onChange={e => setCreateForm(f => ({ ...f, due_date: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={createTask} disabled={creating || !createForm.title || !createForm.worker_id} className="btn-primary flex-1">
              {creating ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Task detail modal */}
      {selected && (
        <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={selected.title} size="md">
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-gray-500">Status</span><div className="mt-1"><StatusBadge status={selected.status} /></div></div>
              <div><span className="text-gray-500">Priority</span><div className="mt-1"><PriorityBadge priority={selected.priority} /></div></div>
              <div><span className="text-gray-500">Worker</span><p className="font-medium">{selected.worker_name || '–'}</p></div>
              <div><span className="text-gray-500">Zone</span><p className="font-medium">{selected.zone_name || '–'}</p></div>
              <div><span className="text-gray-500">Due Date</span><p className="font-medium">{selected.due_date ? formatDate(selected.due_date) : '–'}</p></div>
              <div><span className="text-gray-500">Created</span><p className="font-medium">{formatDate(selected.created_at)}</p></div>
            </div>
            {selected.description && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">Description</p>
                <p>{selected.description}</p>
              </div>
            )}
            {selected.notes && (
              <div className="bg-amber-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">Worker Notes</p>
                <p>{selected.notes}</p>
              </div>
            )}
            {selected.status !== 'completed' && (
              <div className="border-t border-gray-100 pt-4">
                <h4 className="font-semibold text-gray-800 mb-3">Update Status</h4>
                <div className="flex gap-2">
                  {['pending', 'in_progress', 'completed'].map(s => (
                    <button
                      key={s}
                      disabled={selected.status === s}
                      onClick={() => updateStatus(selected.id, s)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${selected.status === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                      {s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MaintenancePage;
