import React from 'react';
import { User } from '../types.js';
import { LayoutDashboard, PlusCircle, List, KeyRound, Shield, Users, Link as LinkIcon, Settings, ScrollText, AlertOctagon } from 'lucide-react';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  user: User | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPath, onNavigate, user }) => {
  if (!user) return null;

  const isLocked = user.must_change_password;

  const userMenuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/dashboard/create', label: 'Tạo Link', icon: PlusCircle },
    { path: '/dashboard/links', label: 'Danh sách Link', icon: List },
    { path: '/dashboard/password', label: 'Đổi mật khẩu', icon: KeyRound }
  ];

  const adminMenuItems = [
    { path: '/admin', label: 'Tổng quan Admin', icon: Shield },
    { path: '/admin/users', label: 'Quản lý Users', icon: Users },
    { path: '/admin/links', label: 'Quản lý Links', icon: LinkIcon },
    { path: '/admin/settings', label: 'Cấu hình System', icon: Settings },
    { path: '/admin/logs', label: 'Nhật ký Visits & Logs', icon: ScrollText }
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 shrink-0 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between shadow-xs">
      <div>
        {/* Force password change warning notice if locked */}
        {isLocked && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2">
            <AlertOctagon className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <strong className="block font-semibold">Tài khoản bị khóa tạm thời!</strong>
              Bạn cần đổi mật khẩu mặc định tại mục Đổi mật khẩu để mở khóa toàn bộ tính năng.
            </div>
          </div>
        )}

        {/* User Navigation Section */}
        <div className="mb-6">
          <div className="px-3 mb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
            Menu Cá Nhân
          </div>
          <nav className="space-y-1">
            {userMenuItems.map((item) => {
              const Icon = item.icon;
              const active = currentPath === item.path;
              const disabled = isLocked && item.path !== '/dashboard/password';

              return (
                <button
                  key={item.path}
                  disabled={disabled}
                  onClick={() => onNavigate(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                    active
                      ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                      : disabled
                      ? 'opacity-40 cursor-not-allowed text-slate-400'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Admin Navigation Section */}
        {user.role === 'admin' && (
          <div className="border-t border-slate-100 pt-4">
            <div className="px-3 mb-2 text-[11px] font-semibold text-purple-600 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-purple-600" /> Quản Trị Hệ Thống
            </div>
            <nav className="space-y-1">
              {adminMenuItems.map((item) => {
                const Icon = item.icon;
                const active = currentPath === item.path;
                const disabled = isLocked && item.path !== '/dashboard/password';

                return (
                  <button
                    key={item.path}
                    disabled={disabled}
                    onClick={() => onNavigate(item.path)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                      active
                        ? 'bg-purple-50 text-purple-700 font-semibold shadow-xs'
                        : disabled
                        ? 'opacity-40 cursor-not-allowed text-slate-400'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-purple-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* System Domain badge footer */}
      <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
        <div className="flex items-center justify-between">
          <span>Engine:</span>
          <span className="font-mono text-indigo-600 font-semibold">Laravel 12 Specs</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Target:</span>
          <span className="font-mono text-slate-600">sls.vnastar.com</span>
        </div>
      </div>
    </aside>
  );
};
