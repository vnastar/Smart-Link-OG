import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { User, UserStats, LinkItem } from '../types.js';
import { PlusCircle, Link2, MousePointerClick, Calendar, Shield, Copy, Check, QrCode, ExternalLink, Bot, Trash2, Edit3, Search, RefreshCw } from 'lucide-react';
import { ClickAnalyticsCard } from '../components/ClickAnalyticsCard.js';

interface DashboardViewProps {
  user: User;
  onNavigate: (path: string) => void;
  onOpenQR: (slug: string, dest: string) => void;
  onOpenBotInspector: (slug: string) => void;
  siteDomain?: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  onNavigate,
  onOpenQR,
  onOpenBotInspector,
  siteDomain
}) => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, l] = await Promise.all([
        api.getUserStats(),
        api.getLinks()
      ]);
      setStats(s);
      setLinks(l);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopy = (slug: string) => {
    const domain = siteDomain || (typeof window !== 'undefined' ? window.location.origin : '');
    const fullUrl = `${domain.replace(/\/$/, '')}/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleDelete = async (id: string, slug: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa link /${slug} không?`)) {
      try {
        await api.deleteLink(id);
        loadData();
      } catch (err: any) {
        alert(err.message || 'Xóa link thất bại');
      }
    }
  };

  const filteredLinks = links.filter(l =>
    l.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.destination_url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-3.5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            Xin chào, <span className="text-indigo-600">{user.username}</span> 👋
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Bảng điều khiển quản lý Smart Link OG và chỉ số truy cập bot/người dùng
          </p>
        </div>
        <button
          onClick={() => onNavigate('/dashboard/create')}
          className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2 shadow-xs min-h-[44px] w-full sm:w-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Tạo Link Rút Gọn Mới
        </button>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Đã tạo hôm nay */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider truncate">Đã tạo hôm nay</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
            {stats ? stats.created_today : '-'}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">
            Số link tạo trong ngày
          </div>
        </div>

        {/* Card 2: Giới hạn */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider truncate">Giới hạn hôm nay</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-purple-700 font-mono truncate">
            {stats ? `${stats.created_today} / ${stats.daily_limit}` : '-'}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">
            Reset lúc 00:00 hàng ngày
          </div>
        </div>

        {/* Card 3: Số link */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider truncate">Tổng số link</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Link2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-indigo-600 font-mono">
            {stats ? stats.total_links : '-'}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">
            Link đang hoạt động
          </div>
        </div>

        {/* Card 4: Click */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider truncate">Lượt Click</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <MousePointerClick className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-600 font-mono">
            {stats ? stats.total_clicks : '-'}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">
            Truy cập từ người dùng
          </div>
        </div>
      </div>

      {/* Click Analytics Analysis Section (Vùng miền & Đối tượng) */}
      <ClickAnalyticsCard links={links} />

      {/* Recent Links Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-bold text-base sm:text-lg text-slate-800">Danh Sách Link Gần Đây</h3>
            <p className="text-xs text-slate-500">Các liên kết ngắn đã được cấu hình OpenGraph</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm slug, tiêu đề..."
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[40px]"
              />
            </div>
            <button
              onClick={loadData}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition shrink-0 min-h-[40px] min-w-[40px] flex items-center justify-center"
              title="Làm mới"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">Đang tải dữ liệu link...</div>
        ) : filteredLinks.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            Chưa có link nào. Hãy nhấn <strong className="text-indigo-600">Tạo Link</strong> để bắt đầu.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Slug / Link Rút Gọn</th>
                  <th className="p-3">Tiêu Đề & Link Gốc</th>
                  <th className="p-3">Lượt Click</th>
                  <th className="p-3">Ngày Tạo</th>
                  <th className="p-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLinks.map((link) => (
                  <tr key={link.id} className="hover:bg-slate-50 transition">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          /{link.slug}
                        </span>
                        <button
                          onClick={() => handleCopy(link.slug)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600"
                          title="Sao chép link"
                        >
                          {copiedSlug === link.slug ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    <td className="p-3 max-w-xs">
                      <div className="font-medium text-slate-800 truncate">{link.title}</div>
                      <div className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                        <span className="truncate">{link.destination_url}</span>
                        <a href={link.destination_url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-indigo-600">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </td>

                    <td className="p-3 font-mono text-indigo-600 font-bold">
                      {link.clicks}
                    </td>

                    <td className="p-3 text-slate-500 text-[11px]">
                      {new Date(link.created_at).toLocaleDateString('vi-VN')}
                    </td>

                    <td className="p-3 text-right space-x-1">
                      <button
                        onClick={() => onOpenBotInspector(link.slug)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium inline-flex items-center gap-1 border border-slate-200"
                        title="Kiểm tra bot"
                      >
                        <Bot className="w-3 h-3 text-indigo-600" /> Bot View
                      </button>
                      <button
                        onClick={() => onOpenQR(link.slug, link.destination_url)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium inline-flex items-center gap-1 border border-slate-200"
                        title="Tạo QR"
                      >
                        <QrCode className="w-3 h-3 text-blue-600" /> QR
                      </button>
                      <button
                        onClick={() => handleDelete(link.id, link.slug)}
                        className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded"
                        title="Xóa link"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
