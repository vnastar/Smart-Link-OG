import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { AdminStats } from '../types.js';
import { Shield, Users, Link2, MousePointerClick, UserPlus, TrendingUp, Activity } from 'lucide-react';

export const AdminDashboardView: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAdminStats().then(setStats).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Shield className="w-6 h-6 text-purple-400" />
          Tổng Quan Quản Trị Hệ Thống (Admin Dashboard)
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Chỉ số tổng thể người dùng, liên kết rút gọn và băng thông truy cập bot/human
        </p>
      </div>

      {/* 5 Cards Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Tổng User</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-300 font-mono">
            {stats ? stats.total_users : '-'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Tài khoản đã đăng ký</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Tổng Links</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Link2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {stats ? stats.total_links : '-'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Link rút gọn đã tạo</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Clicks Hôm Nay</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-400 font-mono">
            {stats ? stats.clicks_today : '-'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Lượt chuyển hướng 302</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Tổng Lượt Click</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <MousePointerClick className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono">
            {stats ? stats.total_clicks : '-'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Lượt xem tích lũy</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">User Mới Hôm Nay</span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-teal-300 font-mono">
            {stats ? stats.new_users_today : '-'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Thành viên mới đăng ký</div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
        <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-400" /> Trạng Thái Hệ Thống Smart Link OG
        </h3>
        <p className="text-xs text-slate-400">
          Hệ thống sẵn sàng phục vụ các truy vấn bot crawler Facebook, Zalo, Telegram và điều hướng 302/301 cho người dùng thực.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-slate-400 font-medium">DetectBot Engine</div>
            <div className="text-emerald-400 font-mono font-bold mt-1">HOẠT ĐỘNG NORMAL</div>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-slate-400 font-medium">Domain Server</div>
            <div className="text-emerald-400 font-mono font-bold mt-1">sls.vnastar.com</div>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-slate-400 font-medium">Default Redirect</div>
            <div className="text-emerald-400 font-mono font-bold mt-1">HTTP 302 (Found)</div>
          </div>
        </div>
      </div>
    </div>
  );
};
