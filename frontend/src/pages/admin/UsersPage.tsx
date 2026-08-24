import React, { useState, useEffect, useCallback } from 'react';
import { Users, UserPlus, Search, Shield, HardHat, User as UserIcon, RefreshCw } from 'lucide-react';
import { usersApi } from '../../api';
import { User } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { formatDate } from '../../utils';

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'worker',
    phone: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usersApi.list({ role: roleFilter || undefined, search: search || undefined, limit: 100 });
      setUsers(res.data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await usersApi.create(formData);
      setShowAddModal(false);
      setFormData({ name: '', email: '', password: '', role: 'worker', phone: '' });
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="badge bg-purple-100 text-purple-700 flex items-center gap-1"><Shield size={12} /> Administrator</span>;
      case 'worker':
        return <span className="badge bg-amber-100 text-amber-700 flex items-center gap-1"><HardHat size={12} /> Worker</span>;
      default:
        return <span className="badge bg-blue-100 text-blue-700 flex items-center gap-1"><UserIcon size={12} /> Citizen</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500">Manage administrator, field worker, and registered citizen accounts</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchUsers} className="btn-secondary flex items-center gap-2 py-2">
            <RefreshCw size={16} /> Refresh
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2 py-2">
            <UserPlus size={16} /> Add Personnel
          </button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="card py-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              className="input pl-9 py-2"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input py-2 w-auto"
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="admin">Administrators</option>
            <option value="worker">Field Workers</option>
            <option value="citizen">Citizens</option>
          </select>
        </div>
      </div>

      {/* Users list table */}
      {loading ? (
        <LoadingSpinner className="py-16" text="Loading user accounts..." />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Contact Phone</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                          {u.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{u.name}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">{getRoleBadge(u.role)}</td>
                    <td className="py-3 px-4 text-gray-600">{u.phone || '–'}</td>
                    <td className="py-3 px-4">
                      <span className={`badge ${u.is_active !== 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {u.is_active !== 0 ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-xs">{formatDate(u.created_at || '')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add User Account" size="md">
        <form onSubmit={handleCreateUser} className="space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}
          <div>
            <label className="label">Full Name</label>
            <input
              className="input"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Ramesh Kulkarni"
            />
          </div>
          <div>
            <label className="label">Email Address</label>
            <input
              type="email"
              className="input"
              required
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="user@smartwater.gov"
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              required
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              placeholder="Temporary password"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Role</label>
              <select
                className="input py-2"
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="worker">Maintenance Worker</option>
                <option value="admin">Administrator</option>
                <option value="citizen">Citizen</option>
              </select>
            </div>
            <div>
              <label className="label">Phone</label>
              <input
                type="tel"
                className="input"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 00000"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-3">
            <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1">
              {submitting ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UsersPage;
