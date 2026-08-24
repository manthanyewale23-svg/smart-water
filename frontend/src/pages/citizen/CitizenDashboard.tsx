import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Droplet, Plus, MessageCircle, BarChart2, CheckCircle2, ArrowRight } from 'lucide-react';
import { complaintsApi } from '../../api';
import { Complaint } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatusBadge, PriorityBadge } from '../../components/common/Badges';
import { formatDate, PROBLEM_TYPE_LABELS } from '../../utils';
import { useAuth } from '../../context/AuthContext';

const CitizenDashboard: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    complaintsApi.list().then(res => {
      setComplaints(res.data.complaints || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const openComplaints = complaints.filter(c => !['resolved', 'closed'].includes(c.status));
  const resolvedComplaints = complaints.filter(c => ['resolved', 'closed'].includes(c.status));

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="card bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-700 text-white p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold">Hello, {user?.name}!</h1>
            <p className="text-blue-100 text-sm mt-1 max-w-xl">
              Welcome to the SmartWater citizen portal. Report water leaks, low pressure issues, or track household supply data in real time.
            </p>
          </div>
          <Link
            to="/citizen/report"
            className="px-5 py-3 bg-white text-blue-700 font-bold text-sm rounded-xl shadow-lg hover:bg-blue-50 transition-all flex items-center gap-2 flex-shrink-0"
          >
            <Plus size={18} /> Report an Issue
          </Link>
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/citizen/report" className="card hover:shadow-md transition-all group">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-blue-100 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Plus size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Report Problem</h3>
              <p className="text-xs text-gray-500 mt-0.5">Submit leakage or pressure reports</p>
            </div>
          </div>
        </Link>

        <Link to="/citizen/complaints" className="card hover:shadow-md transition-all group">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-purple-100 text-purple-600 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <MessageCircle size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">My Reports ({openComplaints.length})</h3>
              <p className="text-xs text-gray-500 mt-0.5">Track resolution status in real-time</p>
            </div>
          </div>
        </Link>

        <Link to="/citizen/consumption" className="card hover:shadow-md transition-all group">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-teal-100 text-teal-600 rounded-2xl group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <BarChart2 size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">My Water Usage</h3>
              <p className="text-xs text-gray-500 mt-0.5">Estimated daily supply & conservation tips</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Complaints by User */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">My Recent Submissions</h3>
          <Link to="/citizen/complaints" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
            View All ({complaints.length}) <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner className="py-8" />
        ) : complaints.length === 0 ? (
          <div className="text-center py-8">
            <Droplet className="mx-auto text-gray-300 mb-2" size={36} />
            <p className="text-gray-600 text-sm font-medium">You haven't submitted any complaints yet.</p>
            <Link to="/citizen/report" className="btn-primary mt-3 inline-flex text-xs py-2">
              Report an Issue Now
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {complaints.slice(0, 5).map(c => (
              <div key={c.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 text-sm">
                      {PROBLEM_TYPE_LABELS[c.problem_type] || c.problem_type}
                    </span>
                    <PriorityBadge priority={c.priority} />
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-1">{c.description}</p>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {formatDate(c.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CitizenDashboard;
