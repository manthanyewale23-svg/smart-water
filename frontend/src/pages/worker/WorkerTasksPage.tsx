import React, { useEffect, useState } from 'react';
import { ClipboardList, Camera, Check, RefreshCw, Clock, AlertCircle } from 'lucide-react';
import { maintenanceApi } from '../../api';
import { MaintenanceTask } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { StatusBadge, PriorityBadge } from '../../components/common/Badges';
import { formatDate, formatRelativeTime } from '../../utils';

const WorkerTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  const [notes, setNotes] = useState('');
  const [afterPhoto, setAfterPhoto] = useState<File | null>(null);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await maintenanceApi.list({ status: filterStatus || undefined });
      setTasks(res.data.tasks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [filterStatus]);

  const handleUpdateStatus = async (task: MaintenanceTask, newStatus: string) => {
    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append('status', newStatus);
      if (notes) formData.append('notes', notes);
      if (afterPhoto) formData.append('after_photo', afterPhoto);

      await maintenanceApi.update(task.id, formData);
      setSelectedTask(null);
      setNotes('');
      setAfterPhoto(null);
      fetchTasks();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Assigned Work Orders</h1>
          <p className="text-sm text-gray-500">View repair tasks, record before/after progress, and resolve issues</p>
        </div>
        <button onClick={fetchTasks} className="btn-secondary flex items-center gap-2 py-2">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['', 'pending', 'in_progress', 'completed'].map(st => (
          <button
            key={st || 'all'}
            onClick={() => setFilterStatus(st)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === st ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {st ? st.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'All Tasks'}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner className="py-16" text="Loading maintenance tasks..." />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={48} className="text-gray-300" />}
          title="No tasks found"
          description="There are currently no tasks matching your selected filter."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map(task => (
            <div
              key={task.id}
              className={`card flex flex-col justify-between border-l-4 ${
                task.status === 'completed' ? 'border-green-500' :
                task.status === 'in_progress' ? 'border-blue-500' : 'border-amber-500'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900 text-base">{task.title}</h3>
                  <PriorityBadge priority={task.priority} />
                </div>
                <p className="text-sm text-gray-600 mb-4">{task.description || 'No description provided.'}</p>
                <div className="space-y-1 text-xs text-gray-500 mb-4">
                  {task.zone_name && <div>📍 <strong>Zone:</strong> {task.zone_name}</div>}
                  {task.due_date && <div>📅 <strong>Due Date:</strong> {formatDate(task.due_date)}</div>}
                  {task.notes && (
                    <div className="p-2 bg-gray-50 rounded text-gray-700 mt-2">
                      <strong>Notes:</strong> {task.notes}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <StatusBadge status={task.status} />
                <button
                  onClick={() => {
                    setSelectedTask(task);
                    setNotes(task.notes || '');
                  }}
                  className="btn-primary text-xs py-1.5 px-3"
                >
                  Update Task
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Update Modal */}
      {selectedTask && (
        <Modal isOpen={!!selectedTask} onClose={() => setSelectedTask(null)} title="Update Work Order Progress" size="md">
          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-gray-900">{selectedTask.title}</h4>
              <p className="text-xs text-gray-500 mt-0.5">{selectedTask.description}</p>
            </div>

            <div>
              <label className="label">Field Technician Notes</label>
              <textarea
                className="input"
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Describe work completed, parts replaced, or ongoing findings..."
              />
            </div>

            <div>
              <label className="label">Upload Resolution Photo (Optional)</label>
              <input
                type="file"
                accept="image/*"
                className="input py-1.5 text-xs"
                onChange={e => e.target.files?.[0] && setAfterPhoto(e.target.files[0])}
              />
            </div>

            <div className="border-t border-gray-100 pt-4">
              <label className="label mb-2">Change Status</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => handleUpdateStatus(selectedTask, 'pending')}
                  className={`py-2 text-xs font-semibold rounded-lg border ${
                    selectedTask.status === 'pending' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  Pending
                </button>
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => handleUpdateStatus(selectedTask, 'in_progress')}
                  className={`py-2 text-xs font-semibold rounded-lg border ${
                    selectedTask.status === 'in_progress' ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  In Progress
                </button>
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => handleUpdateStatus(selectedTask, 'completed')}
                  className={`py-2 text-xs font-semibold rounded-lg border ${
                    selectedTask.status === 'completed' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  Mark Completed
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default WorkerTasksPage;
