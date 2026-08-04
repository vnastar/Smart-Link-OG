import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { LinkItem } from '../types.js';
import { Link as LinkIcon, Search, Copy, Check, QrCode, Bot, Trash2, Edit3, ExternalLink, Calendar, Upload, X, Save, Sliders, ChevronDown, ChevronUp, Layers, Power, CheckSquare, Square, Clock, BarChart3 } from 'lucide-react';
import { OGPreviewCard } from '../components/OGPreviewCard.js';

interface AdminLinksViewProps {
  onOpenQR: (slug: string, dest: string) => void;
  onOpenBotInspector: (slug: string) => void;
  onOpenAnalytics?: (link: LinkItem) => void;
  siteDomain?: string;
}

export const AdminLinksView: React.FC<AdminLinksViewProps> = ({
  onOpenQR,
  onOpenBotInspector,
  onOpenAnalytics,
  siteDomain = typeof window !== 'undefined' ? window.location.origin : ''
}) => {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Selection & Bulk Edit States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<'keep' | 'active' | 'disabled'>('keep');
  const [bulkExpirationOption, setBulkExpirationOption] = useState<'keep' | 'set' | 'remove'>('keep');
  const [bulkExpiresAt, setBulkExpiresAt] = useState('');
  const [processingBulk, setProcessingBulk] = useState(false);

  // Edit Modal States
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);
  const [editSlug, setEditSlug] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editDest, setEditDest] = useState('');
  const [editOgUrl, setEditOgUrl] = useState('');
  const [editOgType, setEditOgType] = useState('website');
  const [editOgSiteName, setEditOgSiteName] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'disabled'>('active');
  const [editRedirectCode, setEditRedirectCode] = useState<number>(302);
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

  const toggleSelectAll = () => {
    if (selectedIds.length === links.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(links.map(l => l.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleOpenBulkModal = () => {
    if (selectedIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 link');
      return;
    }
    setBulkStatus('keep');
    setBulkExpirationOption('keep');

    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    const isoStr = new Date(defaultDate.getTime() - defaultDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setBulkExpiresAt(isoStr);

    setShowBulkModal(true);
  };

  const handleApplyBulk = async () => {
    if (bulkStatus === 'keep' && bulkExpirationOption === 'keep') {
      alert('Vui lòng chọn ít nhất 1 thông số để thay đổi (Trạng thái hoặc Hạn dùng)');
      return;
    }

    if (bulkExpirationOption === 'set' && !bulkExpiresAt) {
      alert('Vui lòng chọn thời gian hết hạn mới');
      return;
    }

    setProcessingBulk(true);
    try {
      await api.bulkUpdateLinks({
        ids: selectedIds,
        status: bulkStatus !== 'keep' ? bulkStatus : undefined,
        expires_at: bulkExpirationOption === 'set' ? bulkExpiresAt : undefined,
        remove_expiration: bulkExpirationOption === 'remove'
      });
      setShowBulkModal(false);
      setSelectedIds([]);
      loadLinks();
    } catch (err: any) {
      alert(err.message || 'Cập nhật hàng loạt thất bại');
    } finally {
      setProcessingBulk(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Quản trị viên: Bạn có chắc chắn muốn xóa ${selectedIds.length} link đã chọn?`)) {
      try {
        await api.bulkDeleteLinks(selectedIds);
        setSelectedIds([]);
        loadLinks();
      } catch (err: any) {
        alert(err.message || 'Xóa hàng loạt thất bại');
      }
    }
  };

  const startEdit = (link: LinkItem) => {
    setEditingLink(link);
    setEditSlug(link.slug || '');
    setEditTitle(link.title || '');
    setEditDesc(link.description || '');
    setEditImage(link.image || '');
    setEditDest(link.destination_url || '');
    setEditOgUrl(link.og_url || '');
    setEditOgType(link.og_type || 'website');
    setEditOgSiteName(link.og_site_name || '');
    setEditStatus(link.status || 'active');
    setEditRedirectCode(link.redirect_code || 302);
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
    if (!editDest.trim()) {
      alert('Vui lòng nhập Đường dẫn đích (Destination URL)');
      return;
    }
    setSavingEdit(true);
    try {
      await api.updateLink(editingLink.id, {
        slug: editSlug.trim(),
        title: editTitle,
        description: editDesc,
        image: editImage,
        destination_url: editDest.trim(),
        og_url: editOgUrl.trim(),
        og_type: editOgType.trim() || 'website',
        og_site_name: editOgSiteName.trim(),
        status: editStatus,
        redirect_code: editRedirectCode,
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
        {/* Bulk Action Banner */}
        {selectedIds.length > 0 && (
          <div className="mb-4 bg-purple-950/60 border border-purple-500/40 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-slate-100">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-semibold">
                Đã chọn <strong className="text-purple-300 font-mono text-sm">{selectedIds.length}</strong> / {links.length} liên kết
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleOpenBulkModal}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-lg shadow-purple-600/20"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Sửa Hàng Loạt (Trạng thái & Hạn dùng)</span>
              </button>

              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa ({selectedIds.length})</span>
              </button>

              <button
                onClick={() => setSelectedIds([])}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg text-xs transition"
              >
                Bỏ chọn
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">Đang tải danh sách link...</div>
        ) : links.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">Không tìm thấy link nào</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={links.length > 0 && selectedIds.length === links.length}
                      onChange={toggleSelectAll}
                      className="rounded accent-purple-500 cursor-pointer w-4 h-4"
                      title="Chọn tất cả"
                    />
                  </th>
                  <th className="p-3">User Tạo</th>
                  <th className="p-3">Slug</th>
                  <th className="p-3">Tiêu Đề & Link Gốc</th>
                  <th className="p-3">Trạng Thái</th>
                  <th className="p-3">Clicks</th>
                  <th className="p-3">Ngày Tạo / Hạn Dùng</th>
                  <th className="p-3 text-right">Thao Tác Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {links.map((link) => {
                  const isSelected = selectedIds.includes(link.id);
                  const isExpired = link.expires_at ? new Date(link.expires_at) < new Date() : false;
                  const isDisabled = link.status === 'disabled';

                  return (
                    <tr
                      key={link.id}
                      className={`transition ${isSelected ? 'bg-purple-950/30' : 'hover:bg-slate-800/40'}`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(link.id)}
                          className="rounded accent-purple-500 cursor-pointer w-4 h-4"
                        />
                      </td>

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

                      <td className="p-3">
                        {isDisabled ? (
                          <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 inline-flex items-center gap-1">
                            <Power className="w-3 h-3" /> Đã tắt
                          </span>
                        ) : isExpired ? (
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Hết hạn
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 inline-flex items-center gap-1">
                            <Check className="w-3 h-3" /> Hoạt động
                          </span>
                        )}
                      </td>

                      <td className="p-3 font-mono text-emerald-400 font-semibold">
                        {link.clicks}
                      </td>

                      <td className="p-3 text-slate-400 text-[11px]">
                        <div>{new Date(link.created_at).toLocaleDateString('vi-VN')}</div>
                        {link.expires_at && (
                          <div className="mt-1">
                            {isExpired ? (
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
                          onClick={() => onOpenAnalytics && onOpenAnalytics(link)}
                          className="px-2 py-1 bg-indigo-900/50 hover:bg-indigo-800/70 text-indigo-300 rounded text-[11px] font-medium inline-flex items-center gap-1 border border-indigo-700/50"
                          title="Xem phân tích chi tiết lượt click, vị trí, thiết bị"
                        >
                          <BarChart3 className="w-3 h-3 text-indigo-400" /> Thống kê
                        </button>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin Edit Modal */}
      {editingLink && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingLink(null);
          }}
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl relative text-slate-100 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xs shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                    Quản Trị Viên: Chỉnh Sửa Link
                    <span className="font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 text-xs">
                      /{editingLink.slug}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Tùy chỉnh slug, đường dẫn đích, thẻ OpenGraph và thuộc tính link</p>
                </div>
              </div>
              <button
                onClick={() => setEditingLink(null)}
                className="text-slate-400 hover:text-slate-200 p-2 rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Custom Slug Editing (Admin Only) */}
              <div className="bg-purple-950/30 border border-purple-500/20 rounded-xl p-3.5 space-y-1.5">
                <label className="block text-xs font-bold text-purple-300 uppercase tracking-wider">
                  Đường Dẫn Slug (Tùy chỉnh Admin)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-2 rounded-lg border border-slate-800 shrink-0">
                    {siteDomain.replace(/\/$/, '')}/
                  </span>
                  <input
                    type="text"
                    value={editSlug}
                    onChange={(e) => setEditSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    placeholder="custom-slug"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-purple-200 focus:outline-none focus:border-purple-500 min-h-[40px]"
                  />
                </div>
                <p className="text-[10px] text-slate-400">Admins có thể sửa đổi slug của bất kỳ liên kết nào trên hệ thống.</p>
              </div>

              {/* Destination URL */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Link Đích (Destination URL) <span className="text-rose-400">*</span></span>
                </label>
                <input
                  type="url"
                  required
                  value={editDest}
                  onChange={(e) => setEditDest(e.target.value)}
                  placeholder="https://trangweb.com/link-goc"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500 min-h-[42px]"
                />
              </div>

              {/* Status & Redirect Code Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-950 border border-slate-800 rounded-xl p-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Trạng Thái Link
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditStatus('active')}
                      className={`py-2 px-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                        editStatus === 'active'
                          ? 'bg-emerald-600 text-white border-emerald-500 font-bold shadow-2xs'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      Hoạt động
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditStatus('disabled')}
                      className={`py-2 px-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                        editStatus === 'disabled'
                          ? 'bg-rose-600 text-white border-rose-500 font-bold shadow-2xs'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      Tạm khóa
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Mã Chuyển Hướng HTTP
                  </label>
                  <select
                    value={editRedirectCode}
                    onChange={(e) => setEditRedirectCode(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-semibold focus:outline-none focus:border-purple-500 min-h-[38px]"
                  >
                    <option value={302}>302 - Tạm thời (Recommended)</option>
                    <option value={301}>301 - Vĩnh viễn (Permanent)</option>
                    <option value={307}>307 - Temporary Redirect</option>
                    <option value={308}>308 - Permanent Redirect</option>
                  </select>
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Tiêu đề OpenGraph
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Tiêu đề bài viết, trang web..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500 min-h-[40px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Mô tả OpenGraph
                </label>
                <textarea
                  rows={2}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Mô tả xem trước khi chia sẻ..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              {/* Image URL + Upload + Live Preview */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
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
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="cursor-pointer bg-purple-900/40 hover:bg-purple-900/60 text-purple-200 border border-purple-500/30 px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 min-h-[38px]">
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
                      <button
                        type="button"
                        onClick={() => setEditImage('')}
                        className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-lg transition"
                      >
                        Xóa ảnh
                      </button>
                    )}
                  </div>

                  {/* Live Thumbnail Box */}
                  {editImage && (
                    <div className="p-2 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-3">
                      <img
                        src={editImage}
                        alt="Preview"
                        className="w-16 h-12 object-cover rounded-lg border border-slate-800 shrink-0 bg-slate-900"
                        onError={(e) => { (e.target as any).style.display = 'none'; }}
                      />
                      <div className="text-[11px] text-slate-300 min-w-0">
                        <span className="font-bold text-emerald-400 block">✓ Đã gắn ảnh đại diện</span>
                        <span className="text-[10px] text-slate-500 truncate block font-mono">{editImage}</span>
                      </div>
                    </div>
                  )}
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
                        Tùy chọn Nâng cao (og:site_name, og:url, og:type)
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Tùy chỉnh thẻ Meta nâng cao cho crawler mạng xã hội
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
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        OpenGraph Site Name (og:site_name)
                      </label>
                      <input
                        type="text"
                        value={editOgSiteName}
                        onChange={(e) => setEditOgSiteName(e.target.value)}
                        placeholder="Ví dụ: Báo Mới, YouTube, Netflix..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                      />
                    </div>

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
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
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
                    {/* Quick Preset Buttons */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">Nhanh:</span>
                      {[
                        { label: '+1 Ngày', days: 1 },
                        { label: '+7 Ngày', days: 7 },
                        { label: '+30 Ngày', days: 30 }
                      ].map(preset => (
                        <button
                          key={preset.days}
                          type="button"
                          onClick={() => {
                            const d = new Date();
                            d.setDate(d.getDate() + preset.days);
                            const isoStr = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                            setEditExpiresAt(isoStr);
                          }}
                          className="px-2 py-0.5 bg-slate-900 border border-slate-800 hover:border-purple-500 text-[10px] text-slate-300 font-medium rounded transition"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Live OG Social Card Preview inside Edit Link Modal */}
              <div className="pt-2">
                <OGPreviewCard
                  title={editTitle}
                  description={editDesc}
                  image={editImage}
                  domain={siteDomain}
                  slug={editingLink.slug}
                  ogUrl={editOgUrl}
                  ogType={editOgType}
                  ogSiteName={editOgSiteName}
                />
              </div>
            </div>

            {/* Modal Footer - Sticky Bottom */}
            <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 backdrop-blur-xs flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setEditingLink(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={savingEdit}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition"
              >
                <Save className="w-4 h-4" />
                <span>{savingEdit ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Bulk Edit Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-5 space-y-4 text-slate-100 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2 text-purple-400">
                  <Sliders className="w-4 h-4" /> Quản Trị Viên: Sửa Hàng Loạt ({selectedIds.length} Link)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Thay đổi trạng thái hoạt động hoặc thời gian hết hạn cho các link được chọn
                </p>
              </div>
              <button
                onClick={() => setShowBulkModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 1. Trạng thái Link */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                <label className="block text-[11px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Power className="w-3.5 h-3.5 text-purple-400" />
                  1. Trạng thái Link (Bulk Status)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'keep', label: 'Giữ nguyên', desc: 'Không đổi' },
                    { id: 'active', label: 'Hoạt động', desc: 'Cho phép truy cập' },
                    { id: 'disabled', label: 'Vô hiệu hóa', desc: 'Tắt link' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setBulkStatus(item.id as any)}
                      className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                        bulkStatus === item.id
                          ? 'bg-purple-900/40 border-purple-500 text-purple-200 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-xs">{item.label}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Thời gian hết hạn */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                <label className="block text-[11px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-purple-400" />
                  2. Thời gian hết hạn (Bulk Expiration)
                </label>

                <div className="space-y-2.5 pt-1">
                  <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="bulkExp"
                      checked={bulkExpirationOption === 'keep'}
                      onChange={() => setBulkExpirationOption('keep')}
                      className="accent-purple-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Giữ nguyên thời gian hết hạn hiện tại</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="bulkExp"
                      checked={bulkExpirationOption === 'remove'}
                      onChange={() => setBulkExpirationOption('remove')}
                      className="accent-purple-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-emerald-400 font-medium">Bỏ hết hạn (Bỏ hạn dùng - Hạn vĩnh viễn)</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="bulkExp"
                      checked={bulkExpirationOption === 'set'}
                      onChange={() => setBulkExpirationOption('set')}
                      className="accent-purple-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Đặt ngày giờ hết hạn chung cho tất cả</span>
                  </label>

                  {bulkExpirationOption === 'set' && (
                    <div className="pt-2 pl-6">
                      <div className="relative">
                        <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="datetime-local"
                          value={bulkExpiresAt}
                          onChange={(e) => setBulkExpiresAt(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleApplyBulk}
                disabled={processingBulk}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-lg shadow-purple-600/30"
              >
                <Save className="w-4 h-4" />
                <span>{processingBulk ? 'Đang lưu...' : `Áp Dụng (${selectedIds.length} Link)`}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
