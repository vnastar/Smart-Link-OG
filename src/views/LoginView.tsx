import React, { useState } from 'react';
import { api } from '../lib/api.js';
import { User } from '../types.js';
import { Link2, Lock, User as UserIcon, LogIn, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
  onNavigate: (path: string) => void;
  siteName?: string;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onNavigate, siteName = 'Smart Link OG' }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await api.login(username, password);
      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (usr: string, pwd: string) => {
    setUsername(usr);
    setPassword(pwd);
    setLoading(true);
    setError('');
    try {
      const data = await api.login(usr, pwd);
      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-xl relative text-slate-800">
        {/* Header Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 mx-auto flex items-center justify-center text-white shadow-md shadow-indigo-600/20 mb-3">
            <Link2 className="w-6 h-6 font-black" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{siteName}</h2>
          <p className="text-xs text-slate-500 mt-1">Đăng nhập vào hệ thống quản lý link Smart OG</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form noValidate onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Tên đăng nhập hoặc Email
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập username hoặc email..."
                className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2 shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Đang xử lý...' : 'Đăng nhập'}
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/register')}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition border border-slate-200"
            >
              Đăng ký
            </button>
          </div>
        </form>

        {/* Preset Credentials Quick Switcher */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="text-[11px] text-slate-500 font-medium mb-3 flex items-center gap-1.5 justify-center">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Tài khoản dùng thử Demo có sẵn:
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin', 'admin')}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left transition"
            >
              <div className="font-semibold text-purple-700 flex items-center justify-between">
                <span>Quản trị (Admin)</span>
                <span className="text-[9px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-semibold">Force Pwd</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">admin / admin</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('user', 'user123')}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left transition"
            >
              <div className="font-semibold text-indigo-700">Thành viên (User)</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">user / user123</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};