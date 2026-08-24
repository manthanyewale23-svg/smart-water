import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Droplet, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const RegisterPage: React.FC = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', phone: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    setError('');
    try {
      const { api } = await import('../api/client');
      await api.post('/auth/register', { name: form.name, email: form.email, password: form.password, phone: form.phone });
      await login(form.email, form.password);
      navigate('/citizen/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="bg-blue-600 rounded-xl p-2">
            <Droplet size={26} className="text-white" />
          </div>
          <div className="text-center">
            <div className="font-bold text-gray-900 text-xl">SmartWater</div>
            <div className="text-gray-500 text-sm">Urban Water Management</div>
          </div>
        </div>

        <div className="card">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Create account</h1>
          <p className="text-gray-500 text-sm mb-6">Register to report water issues and track your consumption</p>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input type="text" className="input" placeholder="Priya Mehta" value={form.name} onChange={set('name')} required />
            </div>
            <div>
              <label className="label">Email Address</label>
              <input type="email" className="input" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
            </div>
            <div>
              <label className="label">Phone Number</label>
              <input type="tel" className="input" placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} className="input pr-10" placeholder="Min. 6 characters" value={form.password} onChange={set('password')} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <input type="password" className="input" placeholder="Re-enter password" value={form.confirm} onChange={set('confirm')} required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? <span className="flex items-center justify-center gap-2"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Creating account...</span> : 'Create account'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
