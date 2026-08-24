import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Droplet, AlertCircle, Shield, HardHat, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      const stored = localStorage.getItem('sw_user');
      if (stored) {
        const user = JSON.parse(stored);
        navigate(`/${user.role}/dashboard`);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      // Prepared for Firebase Google Auth:
      // When you connect Firebase:
      // const provider = new GoogleAuthProvider();
      // const result = await signInWithPopup(auth, provider);
      // For now, authenticate as demo citizen with Google profile:
      setTimeout(() => {
        const demoGoogleUser = {
          id: 'user-google-1',
          name: 'Google User',
          email: 'citizen.google@gmail.com',
          role: 'citizen',
          phone: '+91 98765 00000',
        };
        localStorage.setItem('sw_token', 'demo_google_jwt_token');
        localStorage.setItem('sw_user', JSON.stringify(demoGoogleUser));
        navigate('/citizen/dashboard');
      }, 800);
    } catch (err: any) {
      setError('Google Sign-In failed. Check Firebase setup.');
      setGoogleLoading(false);
    }
  };

  const quickLogin = (role: 'admin' | 'worker' | 'citizen') => {
    const creds = {
      admin: { email: 'admin@smartwater.gov', password: 'Admin@123' },
      worker: { email: 'worker@smartwater.gov', password: 'Worker@123' },
      citizen: { email: 'citizen@smartwater.gov', password: 'Citizen@123' },
    };
    setEmail(creds[role].email);
    setPassword(creds[role].password);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left side – branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 rounded-xl p-2.5">
            <Droplet size={28} className="text-white" />
          </div>
          <div>
            <div className="text-xl font-bold">SmartWater</div>
            <div className="text-blue-200 text-sm">Urban Water Management System</div>
          </div>
        </div>
        <div>
          <h2 className="text-4xl font-bold mb-4 leading-tight">
            Intelligent Water<br />Management for<br />Smart Cities
          </h2>
          <p className="text-blue-200 text-lg leading-relaxed mb-8">
            Monitor water supply, detect leakages, manage infrastructure, and empower citizens
            to report issues in real time.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: '💧', label: 'Supply Monitoring', desc: 'Real-time flow data' },
              { icon: '🔍', label: 'Loss Detection', desc: 'Automated alerts' },
              { icon: '📍', label: 'GIS Network Map', desc: 'Interactive mapping' },
              { icon: '🔧', label: 'Maintenance', desc: 'Task management' },
            ].map(f => (
              <div key={f.label} className="bg-white/10 rounded-xl p-4">
                <div className="text-2xl mb-1">{f.icon}</div>
                <div className="font-semibold text-sm">{f.label}</div>
                <div className="text-blue-200 text-xs">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-blue-300 text-sm">
          SIH Project · Urban Water Network · Pune Municipal Corporation
        </div>
      </div>

      {/* Right side – login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="bg-blue-600 rounded-xl p-2">
              <Droplet size={24} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-gray-900">SmartWater</div>
              <div className="text-gray-500 text-sm">Urban Water Management</div>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
          <p className="text-gray-500 mb-6">Sign in to your municipal or citizen account</p>

          {/* Quick demo access */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
              <span>⚡</span> 1-Click Demo Login
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => quickLogin('admin')}
                className="flex flex-col items-center gap-1.5 p-2.5 bg-white rounded-lg border border-blue-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all group"
              >
                <Shield size={18} className="text-blue-600 group-hover:text-white" />
                <span className="text-xs font-medium">Admin</span>
              </button>
              <button
                onClick={() => quickLogin('worker')}
                className="flex flex-col items-center gap-1.5 p-2.5 bg-white rounded-lg border border-blue-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all group"
              >
                <HardHat size={18} className="text-blue-600 group-hover:text-white" />
                <span className="text-xs font-medium">Worker</span>
              </button>
              <button
                onClick={() => quickLogin('citizen')}
                className="flex flex-col items-center gap-1.5 p-2.5 bg-white rounded-lg border border-blue-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all group"
              >
                <User size={18} className="text-blue-600 group-hover:text-white" />
                <span className="text-xs font-medium">Citizen</span>
              </button>
            </div>
          </div>

          {/* Google Sign-in Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 px-4 rounded-xl shadow-sm transition-all mb-4"
          >
            {googleLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>

          <div className="flex items-center my-4">
            <div className="flex-1 border-t border-gray-200" />
            <span className="px-3 text-xs text-gray-400 uppercase font-medium">Or sign in with email</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base font-semibold"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Signing in...
                </span>
              ) : 'Sign in with Email'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            New citizen?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
