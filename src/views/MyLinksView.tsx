import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { User, LinkItem } from '../types.js';
import { List, Search, Copy, Check, QrCode, Bot, Trash2, Edit3, ExternalLink, ArrowUpDown, ChevronLeft, ChevronRight, X, Save, Upload, Calendar, Sliders, ChevronDown, ChevronUp } from 'lucide-react';

interface MyLinksViewProps {
  user: User;
  onOpenQR: (slug: string, dest: string) => void;
  onOpenBotInspector: (slug: string) => void;
  siteDomain?: string;
}

export const MyLinksView: React.FC<MyLinksViewProps> = ({
  user,
  onOpenQR,
  onOpenBotInspector,
  siteDomain = 'https://sls.vnastar.com'
}) => {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'created' | 'clicks'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Edit Modal state
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editDest, setEditDest] = useState('');
  const [editOgUrl, setEditOgUrl] = useState('');
  const [editOgType, setEditOgType] = useState('website');
  const [editOgSiteName, setEditOgSiteName] = useState('');
  const [showEditAdvanced, setShowEditAdvanced] = useState(false);
  const [editExpiresAt, setEditExpiresAt] = useState('');
  const [hasEditExpiration, setHasEditExpiration] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

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
    if (confirm(`Bạn có chắc muốn xóa link /${slug}?`)) {
      try {
        await api.deleteLink(id);
        loadLinks();
      } catch (err: any) {
        alert(err.message || 'Xóa link thất bại');
      }
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

  const startEdit = (link: LinkItem) => {
    setEditingLink(link);
    setEditTitle(link.title);
    setEditDesc(link.description);
    setEditImage(link.image);
    setEditDest(link.destination_url);
    setEditOgUrl(link.og_url || '');
    setEditOgType(link.og_type || 'website');
    setEditOgSiteName(link.og_site_name || '');
    setShowEditAdvanced(!!(link.og_url || link.og_site_name || (link.og_type && link.og_type !== 'website')));

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
        og_site_name: editOgSiteName.trim(),
        expires_at: hasEditExpiration && editExpiresAt ? editExpiresAt : null
      });
      setEditingLink(null);
      loadLinks();
    } catch (err: any) {
      alert(err.message || 'Lỗi cập nhật link');
    } finally {
      setSavingEdit(false);
    }
  };

  // Sort & Filter logic
  const sortedLinks = [...links].sort((a, b) => {
    if (sortBy === 'clicks') {
      return sortOrder === 'desc' ? b.clicks - a.clicks : a.clicks - b.clicks;
    } else {
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      return sortOrder === 'desc' ? tb - ta : ta - tb;
    }
  });

  const totalPages = Math.ceil(sortedLinks.length / pageSize) || 1;
  const paginatedLinks = sortedLinks.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-3.5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <List className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
            Danh Sách Link Rút Gọn (My Links)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý, tìm kiếm, chỉnh sửa và theo dõi toàn bộ liên kết cá nhân
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm kiếm theo slug, tiêu đề hoặc link gốc..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => {
              if (sortBy === 'created') {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              } else {
                setSortBy('created');
                setSortOrder('desc');
              }
            }}
            className={`flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition min-h-[40px] ${
              sortBy === 'created'
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" /> Ngày tạo ({sortOrder.toUpperCase()})
          </button>

          <button
            onClick={() => {
              if (sortBy === 'clicks') {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              } else {
                setSortBy('clicks');
                setSortOrder('desc');
              }
            }}
            className={`flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition min-h-[40px] ${
              sortBy === 'clicks'
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" /> Lượt click ({sortOrder.toUpperCase()})
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-6 shadow-xs">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Đang tải dữ liệu...</div>
        ) : paginatedLinks.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">Không tìm thấy link phù hợp</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3 font-semibold">Slug / Link</th>
                  <th className="p-3 font-semibold">Tiêu đề OG & Link gốc</th>
                  <th className="p-3 font-semibold">Click</th>
                  <th className="p-3 font-semibold">Ngày tạo</th>
                  <th className="p-3 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedLinks.map((link) => (
                  <tr key={link.id} className="hover:bg-slate-50 transition">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          /{link.slug}
                        </span>
                        <button
                          onClick={() => handleCopy(link.slug)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600"
                          title="Copy shortlink"
                        >
                          {copiedSlug === link.slug ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    <td className="p-3 max-w-sm">
                      <div className="font-semibold text-slate-900 truncate">{link.title}</div>
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
                      <div>{new Date(link.created_at).toLocaleDateString('vi-VN')}</div>
                      {link.expires_at && (
                        <div className="mt-1">
                          {new Date(link.expires_at) < new Date() ? (
                            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200 inline-block">
                              Đã hết hạn
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-block">
                              Hạn: {new Date(link.expires_at).toLocaleDateString('vi-VN')}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="p-3 text-right space-x-1">
                      <button
                        onClick={() => onOpenBotInspector(link.slug)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-medium inline-flex items-center gap-1 border border-slate-200"
                        title="Kiểm tra bot rendering"
                      >
                        <Bot className="w-3 h-3 text-indigo-600" /> Bot View
                      </button>
                      <button
                        onClick={() => onOpenQR(link.slug, link.destination_url)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-medium inline-flex items-center gap-1 border border-slate-200"
                        title="Tải QR Code"
                      >
                        <QrCode className="w-3 h-3 text-blue-600" /> QR
                      </button>
                      <button
                        onClick={() => startEdit(link)}
                        className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-amber-600 rounded-md"
                        title="Sửa link"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(link.id, link.slug)}
                        className="p-1.5 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-md"
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

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 pt-4 mt-4 text-xs text-slate-500">
            <div>
              Hiển thị trang <strong>{page}</strong> / <strong>{totalPages}</strong>
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 bg-slate-100 border border-slate-200 text-slate-700 disabled:opacity-40 rounded-lg hover:bg-slate-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 bg-slate-100 border border-slate-200 text-slate-700 disabled:opacity-40 rounded-lg hover:bg-slate-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Link Modal */}
      {editingLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl relative text-slate-800">
            <button
              onClick={() => setEditingLink(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-amber-500" />
              Chỉnh Sửa Link /{editingLink.slug}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Destination URL
                </label>
                <input
                  type="url"
                  value={editDest}
                  onChange={(e) => setEditDest(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Tiêu đề OpenGraph
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Mô tả OpenGraph
                </label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  URL Ảnh OpenGraph
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editImage}
                    onChange={(e) => setEditImage(e.target.value)}
                    placeholder="Dán URL ảnh hoặc tải ảnh lên..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[40px]"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 min-h-[38px]">
                      <Upload className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{uploadingImage ? 'Đang tải lên...' : 'Tải ảnh từ máy (Max 5MB)'}</span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    {editImage && (
                      <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                        <Check className="w-3 h-3" />
                        Đã có ảnh
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Advanced Options Accordion */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden transition-all">
                <button
                  type="button"
                  onClick={() => setShowEditAdvanced(!showEditAdvanced)}
                  className="w-full p-3 flex items-center justify-between text-left hover:bg-slate-100/80 transition"
                >
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-600" />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Tùy chọn Nâng cao (Advance: og:url, og:type, og:site_name)
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Tùy chỉnh thẻ meta og:url, og:type và og:site_name
                      </span>
                    </div>
                  </div>
                  {showEditAdvanced ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </button>

                {showEditAdvanced && (
                  <div className="p-3 border-t border-slate-200 space-y-3 bg-white">
                    {/* og:site_name */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                        OpenGraph Site Name (og:site_name)
                      </label>
                      <input
                        type="text"
                        value={editOgSiteName}
                        onChange={(e) => setEditOgSiteName(e.target.value)}
                        placeholder="Ví dụ: Báo Mới, YouTube, Netflix..."
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* og:url */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                        OpenGraph Canonical URL (og:url)
                      </label>
                      <input
                        type="url"
                        value={editOgUrl}
                        onChange={(e) => setEditOgUrl(e.target.value)}
                        placeholder="https://trangweb.com/bai-viet"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* og:type */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
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
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
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
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Expiration Date Toggle */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <Calendar className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <label htmlFor="toggle-edit-expiration" className="text-xs font-bold text-slate-800 cursor-pointer select-none block">
                        Đặt ngày hết hạn
                      </label>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {hasEditExpiration ? 'Link sẽ tự động vô hiệu hóa sau thời gian bên dưới' : 'Bật tính năng này để đặt thời hạn hoạt động cho link'}
                      </p>
                    </div>
                  </div>

                  <button
                    id="toggle-edit-expiration"
                    type="button"
                    role="switch"
                    aria-checked={hasEditExpiration}
                    onClick={() => handleToggleEditExpiration(!hasEditExpiration)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      hasEditExpiration ? 'bg-indigo-600' : 'bg-slate-300'
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
                  <div className="pt-2 border-t border-slate-200/80">
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                      Thời gian hết hạn
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="datetime-local"
                        value={editExpiresAt}
                        onChange={(e) => setEditExpiresAt(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[40px]"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingLink(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={savingEdit}
                  onClick={saveEdit}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  {savingEdit ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
