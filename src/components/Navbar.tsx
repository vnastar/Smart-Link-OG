import React from 'react';
import { User } from '../types.js';
import { Link2, Bot, LogOut, Globe, AlertTriangle, Menu, X } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onOpenBotSimulator: () => void;
  siteName?: string;
  siteDomain?: string;
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  onOpenBotSimulator,
  siteName = 'Smart Link OG',
  siteDomain = typeof window !== 'undefined' ? window.location.origin : '',
  onToggleMobileMenu,
  isMobileMenuOpen = false
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Mobile Menu Button & Brand Logo */}
        <div className="flex items-center gap-2.5">
          {user && onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-indigo-600" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <Link2 className="w-4 h-4 font-extrabold" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-slate-800 text-sm sm:text-base tracking-tight leading-none">{siteName}</span>
                <span className="hidden sm:inline-flex text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-md font-mono items-center gap-1">
                  <Globe className="w-3 h-3 text-indigo-600" /> {siteDomain.replace(/^https?:\/\//, '')}
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] text-slate-500 block truncate max-w-[200px] sm:max-w-none">
                Rút gọn link thông minh • Tùy chỉnh OG
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls & User Info */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Bot Inspector Tool Launcher */}
          <button
            onClick={onOpenBotSimulator}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition shadow-sm"
          >
            <Bot className="w-4 h-4 text-indigo-600" />
            <span>Test DetectBot</span>
          </button>

          {user && (
            <div className="flex items-center gap-2 sm:gap-3 border-l border-slate-200 pl-2 sm:pl-3">
              {/* Force password change indicator */}
              {user.must_change_password && (
                <span className="bg-amber-50 border border-amber-200 text-amber-700 text-[11px] sm:text-xs px-2 py-1 rounded-lg flex items-center gap-1 font-medium animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">Yêu cầu </span>đổi MK
                </span>
              )}

              {/* User Profile info */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-indigo-600 font-bold text-xs shadow-sm shrink-0">
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
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition min-h-[44px] min-w-[44px] flex items-center justify-center"
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
