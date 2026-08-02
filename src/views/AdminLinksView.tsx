import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { LinkItem } from '../types.js';
import { Link as LinkIcon, Search, Copy, Check, QrCode, Bot, Trash2, Edit3, ExternalLink, Calendar, Upload, X, Save, Sliders, ChevronDown, ChevronUp } from 'lucide-react';

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

  // Edit Modal States
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editDest, setEditDest] = useState('');
  const [editOgUrl, setEditOgUrl] = useState('');
  const [editOgType, setEditOgType] = useState('website');
  const [showEditAdvanced, setShowEditAdvanced] = useState(false);
  const [editExpiresAt, setEditExpiresAt] = useState('');
  const [hasEditExpiration, setHasEditExpiration] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const loadLinks = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminLinks(search);
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

  const startEdit = (link: LinkItem) => {
    setEditingLink(link);
    setEditTitle(link.title || '');
    setEditDesc(link.description || '');
    setEditImage(link.image || '');
    setEditDest(link.destination_url || '');
    setEditOgUrl(link.og_url || '');
    setEditOgType(link.og_type || 'website');
    setShowEditAdvanced(!!(link.og_url || (link.og_type && link.og_type !== 'website')));

    if (link.expires_at) {
      const d = new Date(link.expires_at);
      const isoStr = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setEditExpiresAt(isoStr);
      setHasEditExpiration(true);
    } else {
      setEditExpiresAt('');
      setHasEditExpiration(false);
    }
  };

  const handleToggleEditExpiration = (enabled: boolean) => {
    setHasEditExpiration(enabled);
    if (enabled && !editExpiresAt) {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      const isoStr = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setEditExpiresAt(isoStr);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File ảnh không được vượt quá 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setUploadingImage(true);
      try {
        const url = await api.uploadImage(base64, file.name);
        const fullUrl = url.startsWith('/') ? `${window.location.origin}${url}` : url;
        setEditImage(fullUrl);
      } catch (err: any) {
        alert(err.message || 'Upload ảnh thất bại');
      } finally {
        setUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const saveEdit = async () => {
    if (!editingLink) return;
    setSavingEdit(true);
    try {
      await api.updateLink(editingLink.id, {
        title: editTitle,
        description: editDesc,
        image: editImage,
        destination_url: editDest,
        og_url: editOgUrl.trim(),
        og_type: editOgType.trim() || 'website',
        expires_at: hasEditExpiration && editExpiresAt ? editExpiresAt : null
      });
      setEditingLink(null);
      loadLinks();
    } catch (err: any) {
      alert(err.message || 'Lưu cập nhật thất bại');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <LinkIcon className="w-6 h-6 text-purple-400" />
            Quản Lý Toàn Bộ Liên Kết (All System Links)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Xem, chỉnh sửa, kiểm tra OpenGraph và quản lý link của toàn bộ người dùng trong hệ thống
          </p>
        </div>
        <div className="text-xs text-purple-300 bg-purple-500/10 px-3 py-1.5 rounded-xl border border-purple-500/20 font-mono font-bold self-start sm:self-auto">
          Tổng: {links.length} links
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm theo slug, user tạo, tiêu đề, mô tả, link gốc..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
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
                  <th className="p-3">Ngày Tạo / Hạn Dùng</th>
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
                          title="Sao chép link"
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
                      <div>{new Date(link.created_at).toLocaleDateString('vi-VN')}</div>
                      {link.expires_at && (
                        <div className="mt-1">
                          {new Date(link.expires_at) < new Date() ? (
                            <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20 inline-block">
                              Đã hết hạn
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 inline-block">
                              Hạn: {new Date(link.expires_at).toLocaleDateString('vi-VN')}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="p-3 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => startEdit(link)}
                        className="px-2 py-1 bg-purple-900/40 hover:bg-purple-800/60 text-purple-300 rounded text-[11px] font-medium inline-flex items-center gap-1 border border-purple-700/40"
                        title="Sửa thông tin link"
                      >
                        <Edit3 className="w-3 h-3" /> Sửa
                      </button>
                      <button
                        onClick={() => onOpenBotInspector(link.slug)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-medium inline-flex items-center gap-1"
                        title="Test OpenGraph Bot"
                      >
                        <Bot className="w-3 h-3 text-emerald-400" /> Test OG
                      </button>
                      <button
                        onClick={() => onOpenQR(link.slug, link.destination_url)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-medium inline-flex items-center gap-1"
                        title="Tạo mã QR"
                      >
                        <QrCode className="w-3 h-3 text-blue-400" /> QR
                      </button>
                      <button
                        onClick={() => handleDelete(link.id, link.slug)}
                        className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded inline-flex items-center"
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

      {/* Admin Edit Modal */}
      {editingLink && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-5 space-y-4 text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base flex items-center gap-2 text-purple-400">
                <Edit3 className="w-4 h-4" /> Quản Trị Viên: Chỉnh Sửa Link /{editingLink.slug}
              </h3>
              <button
                onClick={() => setEditingLink(null)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Link Đích (Destination URL)
                </label>
                <input
                  type="url"
                  value={editDest}
                  onChange={(e) => setEditDest(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500 min-h-[40px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Tiêu Đề OpenGraph
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500 min-h-[40px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Mô Tả OpenGraph
                </label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  URL Ảnh OpenGraph
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editImage}
                    onChange={(e) => setEditImage(e.target.value)}
                    placeholder="Dán URL ảnh hoặc tải ảnh lên..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500 min-h-[40px]"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 min-h-[38px]">
                      <Upload className="w-3.5 h-3.5 text-purple-400" />
                      <span>{uploadingImage ? 'Đang tải lên...' : 'Tải ảnh từ máy (Max 5MB)'}</span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    {editImage && (
                      <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                        <Check className="w-3 h-3" />
                        Đã có ảnh
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Advanced Options Accordion */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden transition-all">
                <button
                  type="button"
                  onClick={() => setShowEditAdvanced(!showEditAdvanced)}
                  className="w-full p-3 flex items-center justify-between text-left hover:bg-slate-800/60 transition"
                >
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-purple-400" />
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">
                        Tùy chọn Nâng cao (Advance: og:url, og:type)
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Tùy chỉnh thẻ meta og:url và og:type
                      </span>
                    </div>
                  </div>
                  {showEditAdvanced ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {showEditAdvanced && (
                  <div className="p-3 border-t border-slate-800 space-y-3 bg-slate-900">
                    {/* og:url */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        OpenGraph Canonical URL (og:url)
                      </label>
                      <input
                        type="url"
                        value={editOgUrl}
                        onChange={(e) => setEditOgUrl(e.target.value)}
                        placeholder="https://trangweb.com/bai-viet"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    {/* og:type */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        OpenGraph Type (og:type)
                      </label>
                      <div className="grid grid-cols-2 gap-1.5 mb-2">
                        {[
                          { value: 'website', label: 'website' },
                          { value: 'article', label: 'article' },
                          { value: 'video.other', label: 'video' },
                          { value: 'music.song', label: 'music' },
                          { value: 'profile', label: 'profile' },
                          { value: 'product', label: 'product' }
                        ].map((item) => (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => setEditOgType(item.value)}
                            className={`px-2 py-1 rounded border text-[11px] text-left transition ${
                              editOgType === item.value
                                ? 'bg-purple-900/60 border-purple-500 text-purple-300 font-bold'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={editOgType}
                        onChange={(e) => setEditOgType(e.target.value)}
                        placeholder="Hoặc nhập custom og:type..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Expiration Date Toggle */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <Calendar className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <label htmlFor="toggle-admin-expiration" className="text-xs font-bold text-slate-200 cursor-pointer select-none block">
                        Đặt ngày hết hạn
                      </label>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {hasEditExpiration ? 'Link sẽ tự động vô hiệu hóa sau thời gian bên dưới' : 'Bật tính năng này để đặt thời hạn hoạt động cho link'}
                      </p>
                    </div>
                  </div>

                  <button
                    id="toggle-admin-expiration"
                    type="button"
                    role="switch"
                    aria-checked={hasEditExpiration}
                    onClick={() => handleToggleEditExpiration(!hasEditExpiration)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      hasEditExpiration ? 'bg-purple-600' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        hasEditExpiration ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {hasEditExpiration && (
                  <div className="pt-2 border-t border-slate-800">
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Thời gian hết hạn
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="datetime-local"
                        value={editExpiresAt}
                        onChange={(e) => setEditExpiresAt(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500 min-h-[40px]"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingLink(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={savingEdit}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{savingEdit ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
