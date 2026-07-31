import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { LinkItem } from '../types.js';
import { Link as LinkIcon, Search, Copy, Check, QrCode, Bot, Trash2, ExternalLink } from 'lucide-react';

interface AdminLinksViewProps {
  onOpenQR: (slug: string, dest: string) => void;
  onOpenBotInspector: (slug: string) => void;
  siteDomain?: string;
}

export const AdminLinksView: React.FC<AdminLinksViewProps> = ({
  onOpenQR,
  onOpenBotInspector,
  siteDomain = 'https://sls.vnastar.com'
}) => {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const loadLinks = async () => {
    setLoading(true);
    try {
      const data = await api.getLinks(search);
      setLinks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLinks();
  }, [search]);

  const handleCopy = (slug: string) => {
    const fullUrl = `${siteDomain.replace(/\/$/, '')}/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleDelete = async (id: string, slug: string) => {
    if (confirm(`Quản trị viên: Bạn có chắc muốn xóa link /${slug}?`)) {
      try {
        await api.deleteLink(id);
        loadLinks();
      } catch (err: any) {
        alert(err.message || 'Xóa link thất bại');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <LinkIcon className="w-6 h-6 text-purple-400" />
          Quản Lý Toàn Bộ Liên Kết (All System Links)
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Xem, kiểm tra OpenGraph và quản lý link của toàn bộ người dùng trong hệ thống
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm theo slug, user tạo, tiêu đề..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">Đang tải danh sách link...</div>
        ) : links.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">Không tìm thấy link nào</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3">User Tạo</th>
                  <th className="p-3">Slug</th>
                  <th className="p-3">Tiêu Đề & Link Gốc</th>
                  <th className="p-3">Clicks</th>
                  <th className="p-3">Ngày Tạo</th>
                  <th className="p-3 text-right">Thao Tác Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {links.map((link) => (
                  <tr key={link.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-semibold text-purple-300">
                      {link.user_name || link.user_id}
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          /{link.slug}
                        </span>
                        <button
                          onClick={() => handleCopy(link.slug)}
                          className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-emerald-400"
                        >
                          {copiedSlug === link.slug ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    <td className="p-3 max-w-xs">
                      <div className="font-medium text-slate-100 truncate">{link.title}</div>
                      <div className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                        <span className="truncate">{link.destination_url}</span>
                        <a href={link.destination_url} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-emerald-400">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </td>

                    <td className="p-3 font-mono text-emerald-400 font-semibold">
                      {link.clicks}
                    </td>

                    <td className="p-3 text-slate-400 text-[11px]">
                      {new Date(link.created_at).toLocaleDateString('vi-VN')}
                    </td>

                    <td className="p-3 text-right space-x-1">
                      <button
                        onClick={() => onOpenBotInspector(link.slug)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-medium inline-flex items-center gap-1"
                      >
                        <Bot className="w-3 h-3 text-emerald-400" /> Test OG
                      </button>
                      <button
                        onClick={() => onOpenQR(link.slug, link.destination_url)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-medium inline-flex items-center gap-1"
                      >
                        <QrCode className="w-3 h-3 text-blue-400" /> QR
                      </button>
                      <button
                        onClick={() => handleDelete(link.id, link.slug)}
                        className="p-1 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded"
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
