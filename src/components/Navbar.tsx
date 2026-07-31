import React from 'react';
import { User } from '../types.js';
import { Link2, Bot, LogOut, Shield, KeyRound, Globe, UserCheck, AlertTriangle } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onOpenBotSimulator: () => void;
  siteName?: string;
  siteDomain?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  onOpenBotSimulator,
  siteName = 'Smart Link OG',
  siteDomain = 'https://sls.vnastar.com'
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Domain */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Link2 className="w-4 h-4 font-extrabold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 text-base tracking-tight">{siteName}</span>
              <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-md font-mono flex items-center gap-1">
                <Globe className="w-3 h-3 text-indigo-600" /> {siteDomain.replace(/^https?:\/\//, '')}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 block -mt-0.5">
              Rút gọn link thông minh • Tùy chỉnh Open Graph
            </span>
          </div>
        </div>

        {/* Action Controls & User Info */}
        <div className="flex items-center gap-3">
          {/* Bot Inspector Tool Launcher */}
          <button
            onClick={onOpenBotSimulator}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition shadow-sm"
          >
            <Bot className="w-4 h-4 text-indigo-600" />
            <span>Test DetectBot</span>
          </button>

          {user && (
            <div className="flex items-center gap-3 border-l border-slate-200 pl-3">
              {/* Force password change indicator */}
              {user.must_change_password && (
                <span className="bg-amber-50 border border-amber-200 text-amber-700 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Yêu cầu đổi mật khẩu
                </span>
              )}

              {/* User Profile info */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-indigo-600 font-bold text-xs shadow-sm">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                    <span>Xin chào, {user.username}</span>
                    {user.role === 'admin' ? (
                      <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[9px] uppercase px-1.5 py-0.2 rounded font-mono font-semibold">
                        Admin
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[9px] uppercase px-1.5 py-0.2 rounded font-mono font-semibold">
                        User
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Limit: {user.daily_limit} link/ngày
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                title="Đăng xuất"
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
