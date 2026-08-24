import React, { useState } from 'react';
import { User, Phone, Mail, Shield, Save, Check, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usersApi } from '../api';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [password, setPassword] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      await usersApi.update(user.id, {
        name,
        phone,
        password: password || undefined,
      });
      // Update local storage user
      const updatedUser = { ...user, name, phone };
      localStorage.setItem('sw_user', JSON.stringify(updatedUser));
      setSaved(true);
      setPassword('');
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
        <p className="text-sm text-gray-500">Manage your SmartWater platform credentials and contact details</p>
      </div>

      {saved && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl flex items-center gap-2 text-sm">
          <Check size={18} className="text-green-600" />
          Profile updated successfully.
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="card">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-2xl">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{user?.name}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className="badge bg-blue-100 text-blue-700 mt-1 uppercase font-semibold text-xs">
              {user?.role} Role
            </span>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                className="input pl-9"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Email Address (Read-only)</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                className="input pl-9 bg-gray-50 text-gray-500 cursor-not-allowed"
                value={user?.email || ''}
                disabled
              />
            </div>
          </div>

          <div>
            <label className="label">Contact Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                className="input pl-9"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          <div>
            <label className="label">New Password (leave blank to keep current)</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="password"
                className="input pl-9"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter new password if changing"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center gap-2 py-2.5 px-6 pt-2"
          >
            <Save size={18} /> {loading ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
