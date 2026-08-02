import React from 'react';
import { User } from '../types.js';
import { LayoutDashboard, PlusCircle, List, KeyRound, Shield, Users, Link as LinkIcon, Settings, ScrollText, AlertOctagon, X, Bot, BarChart3 } from 'lucide-react';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  user: User | null;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onOpenBotSimulator?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  user,
  isMobileOpen = false,
  onCloseMobile,
  onOpenBotSimulator
}) => {
  if (!user) return null;

  const isLocked = user.must_change_password;

  const userMenuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/dashboard/create', label: 'Tạo Link', icon: PlusCircle },
    { path: '/dashboard/links', label: 'Danh sách Link', icon: List },
    { path: '/dashboard/analytics', label: 'Phân tích Click', icon: BarChart3 },
    { path: '/dashboard/password', label: 'Đổi mật khẩu', icon: KeyRound }
  ];

  const adminMenuItems = [
    { path: '/admin', label: 'Tổng quan Admin', icon: Shield },
    { path: '/admin/users', label: 'Quản lý Users', icon: Users },
    { path: '/admin/links', label: 'Quản lý Links', icon: LinkIcon },
    { path: '/admin/settings', label: 'Cấu hình System', icon: Settings },
    { path: '/admin/logs', label: 'Nhật ký Visits & Logs', icon: ScrollText }
  ];

  const handleNavClick = (path: string) => {
    onNavigate(path);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const navContent = (
    <div className="flex flex-col h-full justify-between p-4 bg-white">
      <div>
        {/* Mobile Header in Drawer */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 md:hidden">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">{user.username}</div>
              <div className="text-[10px] text-slate-500 font-mono">Limit: {user.daily_limit} link/ngày</div>
            </div>
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

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

        {/* Mobile Bot Inspector launcher */}
        {onOpenBotSimulator && (
          <button
            onClick={() => {
              onOpenBotSimulator();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full mb-4 md:hidden flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold transition"
          >
            <Bot className="w-4 h-4 text-indigo-600" />
            <span>Test DetectBot Simulator</span>
          </button>
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
                  onClick={() => handleNavClick(item.path)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 md:py-2 rounded-xl text-sm transition-all min-h-[44px] ${
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
                    onClick={() => handleNavClick(item.path)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 md:py-2 rounded-xl text-sm transition-all min-h-[44px] ${
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
    </div>
  );

  return (
    <>
      {/* Desktop Permanent Sidebar */}
      <aside className="hidden md:block w-64 bg-white border-r border-slate-200 shrink-0 min-h-[calc(100vh-4rem)] shadow-xs">
        {navContent}
      </aside>

      {/* Mobile Slide-Over Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />

          {/* Drawer Content */}
          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl z-10 flex flex-col">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
