import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Plus, RefreshCw, Eye } from 'lucide-react';
import { complaintsApi } from '../../api';
import { Complaint } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { StatusBadge, PriorityBadge } from '../../components/common/Badges';
import { formatDate, formatDateTime, PROBLEM_TYPE_LABELS } from '../../utils';

const CitizenComplaintsPage: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await complaintsApi.list({ limit: 50 });
      setComplaints(res.data.complaints || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Water Complaints</h1>
          <p className="text-sm text-gray-500">Track and view history of all reports submitted from your account</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchComplaints} className="btn-secondary flex items-center gap-2 py-2">
            <RefreshCw size={16} /> Refresh
          </button>
          <Link to="/citizen/report" className="btn-primary flex items-center gap-2 py-2">
            <Plus size={16} /> New Report
          </Link>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner className="py-16" text="Retrieving your submissions..." />
      ) : complaints.length === 0 ? (
        <EmptyState
          icon={<MessageSquare size={48} className="text-gray-300" />}
          title="No complaints filed"
          description="You haven't submitted any water reports. You can submit leaks or pressure outages anytime."
          action={
            <Link to="/citizen/report" className="btn-primary inline-flex items-center gap-2">
              <Plus size={16} /> Report an Issue
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {complaints.map(c => (
            <div
              key={c.id}
              onClick={() => setSelectedComplaint(c)}
              className="card cursor-pointer hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-mono text-xs text-gray-400 font-semibold">
                    #{c.id.slice(-6).toUpperCase()}
                  </span>
                  <PriorityBadge priority={c.priority} />
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">
                  {PROBLEM_TYPE_LABELS[c.problem_type] || c.problem_type}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-3 mb-4">{c.description}</p>
              </div>

              <div>
                <div className="text-xs text-gray-400 mb-2">
                  <span>📅 Submitted: {formatDate(c.created_at)}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <StatusBadge status={c.status} />
                  <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                    <Eye size={14} /> Details
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Complaint Detail Modal */}
      {selectedComplaint && (
        <Modal
          isOpen={!!selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          title={`Report Details #${selectedComplaint.id.slice(-6).toUpperCase()}`}
          size="md"
        >
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
              <div>
                <p className="text-xs text-gray-500">Current Status</p>
                <div className="mt-1"><StatusBadge status={selectedComplaint.status} /></div>
              </div>
              <div>
                <p className="text-xs text-gray-500">Priority</p>
                <div className="mt-1"><PriorityBadge priority={selectedComplaint.priority} /></div>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-gray-500">Issue Category: </span>
                <span className="font-semibold text-gray-800">
                  {PROBLEM_TYPE_LABELS[selectedComplaint.problem_type] || selectedComplaint.problem_type}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Zone: </span>
                <span className="font-semibold text-gray-800">{selectedComplaint.zone_name || 'Assigned automatically'}</span>
              </div>
              <div>
                <span className="text-gray-500">Filed On: </span>
                <span className="text-gray-800">{formatDateTime(selectedComplaint.created_at)}</span>
              </div>
              {selectedComplaint.assigned_worker_name && (
                <div>
                  <span className="text-gray-500">Assigned Technician: </span>
                  <span className="font-semibold text-gray-800">{selectedComplaint.assigned_worker_name}</span>
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-3.5 rounded-xl">
              <p className="text-xs font-semibold text-gray-600 mb-1">Description</p>
              <p className="text-gray-800 text-sm leading-relaxed">{selectedComplaint.description}</p>
            </div>

            {selectedComplaint.photo_url && (
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-1">Attached Photo</p>
                <img
                  src={`http://localhost:3001${selectedComplaint.photo_url}`}
                  alt="Complaint attachment"
                  className="rounded-xl max-h-52 w-full object-cover"
                />
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CitizenComplaintsPage;
