import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { VisitLog, AuditLog } from '../types.js';
import { ScrollText, Bot, Globe, Shield, RefreshCw } from 'lucide-react';

export const AdminLogsView: React.FC = () => {
  const [tab, setTab] = useState<'visits' | 'audit'>('visits');
  const [visits, setVisits] = useState<VisitLog[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminLogs();
      setVisits(data.visits);
      setLogs(data.logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <ScrollText className="w-6 h-6 text-purple-400" />
            Nhật Ký Hệ Thống & Clicks (System Logs & Visits)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Theo dõi truy cập chi tiết từ crawler bot, thiết bị người dùng và lịch sử tác vụ admin
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition flex items-center gap-2 text-xs"
        >
          <RefreshCw className="w-4 h-4" /> Làm mới dữ liệu
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setTab('visits')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
            tab === 'visits'
              ? 'border-purple-500 text-purple-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Globe className="w-4 h-4" /> Clicks & Bot Visits ({visits.length})
        </button>
        <button
          onClick={() => setTab('audit')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
            tab === 'audit'
              ? 'border-purple-500 text-purple-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-4 h-4" /> Audit Logs Tác Vụ ({logs.length})
        </button>
      </div>

      {/* Content */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">Đang tải nhật ký...</div>
        ) : tab === 'visits' ? (
          visits.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">Chưa có lượt truy cập nào</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-3">Slug</th>
                    <th className="p-3">Loại Truy Cập</th>
                    <th className="p-3">IP Address</th>
                    <th className="p-3">Quốc Gia</th>
                    <th className="p-3">Referer</th>
                    <th className="p-3">Trình Duyệt / Bot</th>
                    <th className="p-3">Thời Gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {visits.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 font-bold text-emerald-400">/{v.slug}</td>
                      <td className="p-3">
                        {v.is_bot ? (
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] flex items-center gap-1 w-fit">
                            <Bot className="w-3 h-3" /> BOT OG VIEW
                          </span>
                        ) : (
                          <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded text-[10px] flex items-center gap-1 w-fit">
                            <Globe className="w-3 h-3" /> 302 REDIRECT
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-300">{v.ip}</td>
                      <td className="p-3 text-slate-400">{v.country}</td>
                      <td className="p-3 text-slate-400 truncate max-w-[150px]">{v.referer}</td>
                      <td className="p-3 text-slate-300 truncate max-w-[180px]">{v.browser} ({v.device})</td>
                      <td className="p-3 text-slate-400">{new Date(v.created_at).toLocaleString('vi-VN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          logs.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">Chưa có nhật ký tác vụ nào</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-3">User</th>
                    <th className="p-3">Hành Động</th>
                    <th className="p-3">Chi Tiết Tác Vụ</th>
                    <th className="p-3">IP Address</th>
                    <th className="p-3">Thời Gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {logs.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 font-bold text-purple-300">{l.user_name || l.user_id}</td>
                      <td className="p-3 font-bold text-slate-200">{l.action}</td>
                      <td className="p-3 text-slate-300">{l.details}</td>
                      <td className="p-3 text-slate-400">{l.ip}</td>
                      <td className="p-3 text-slate-400">{new Date(l.created_at).toLocaleString('vi-VN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
};
