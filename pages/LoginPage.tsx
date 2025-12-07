import React, { useState } from 'react';
import { authService } from '../services/authService';
import { User } from '../types';
import { Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Logo } from '../components/Logo';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await authService.login(username, password);
      // The authService login now returns the user data directly query from Firebase
      if (user) {
        // Ensure the returned object matches User type or map it if necessary
        // Assuming Firebase user doc matches simple User interface
        onLoginSuccess(user as User);
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      console.error(err);
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 shadow-xl rounded-lg p-8 max-w-md w-full animate-in fade-in zoom-in duration-300">

        {/* Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 mb-4 flex items-center justify-center">
            <Logo className="w-full h-full" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Crowngate Portal</h1>
          <p className="text-slate-500 text-sm font-medium">Dental Lab Management System</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded border border-red-200 flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div>
            <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded p-3 text-slate-900 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 focus:outline-none transition-all"
              placeholder="Enter your username"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 text-xs font-bold uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded p-3 pr-10 text-slate-900 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 focus:outline-none transition-all"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-800 hover:bg-brand-900 text-white rounded font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <span>Logging in...</span>
            ) : (
              <>
                <Lock size={16} />
                <span>Secure Login</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">
            For access issues, please contact Crowngate Administration.<br />
            <a href="https://crowngatedental.in" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-800 font-medium mt-1 inline-block">crowngatedental.in</a>
          </p>

        </div>
      </div>
    </div>
  );
};
