import React, { useEffect, useState } from 'react';
import {
  Image as ImageIcon,
  HardDrive,
  Trash2,
  RefreshCw,
  Search,
  ExternalLink,
  Copy,
  Check,
  Filter,
  Sparkles,
  AlertTriangle,
  Grid,
  List,
  Eye,
  Info,
  Link as LinkIcon
} from 'lucide-react';
import { api } from '../lib/api.js';
import { AdminImageData, AdminImagesResponse } from '../types.js';

export const AdminImagesView: React.FC = () => {
  const [data, setData] = useState<AdminImagesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Filters & State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'used' | 'orphaned'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'size_desc' | 'size_asc'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals & Action States
  const [selectedImage, setSelectedImage] = useState<AdminImageData | null>(null);
  const [deletingFilename, setDeletingFilename] = useState<string | null>(null);
  const [cleaningOrphans, setCleaningOrphans] = useState(false);
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fetchImages = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const res = await api.getAdminImages();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải dữ liệu thư viện hình ảnh');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 3000);
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    showToast('Đã sao chép liên kết hình ảnh!');
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleDeleteImage = async (filename: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn file hình ảnh "${filename}" khỏi máy chủ?`)) {
      return;
    }

    setDeletingFilename(filename);
    try {
      await api.deleteAdminImage(filename);
      showToast(`Đã xóa thành công ${filename}`);
      if (selectedImage?.filename === filename) {
        setSelectedImage(null);
      }
      fetchImages(true);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa file hình ảnh');
    } finally {
      setDeletingFilename(null);
    }
  };

  const handleCleanupOrphans = async () => {
    setCleaningOrphans(true);
    try {
      const res = await api.cleanupOrphanImages();
      showToast(res.message);
      setShowCleanupModal(false);
      fetchImages(true);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi dọn dẹp ảnh rác');
    } finally {
      setCleaningOrphans(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  // Filter & Sort Logic
  const filteredImages = (data?.images || []).filter(img => {
    const matchesSearch =
      img.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      img.used_by_links.some(
        l =>
          l.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (l.user_name && l.user_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );

    if (!matchesSearch) return false;

    if (filterType === 'used') return !img.is_orphaned;
    if (filterType === 'orphaned') return img.is_orphaned;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'size_desc') return b.size - a.size;
    if (sortBy === 'size_asc') return a.size - b.size;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs font-medium">Đang tải thư viện hình ảnh...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-bounce">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-purple-600" />
            Quản Lý & Thư Viện Hình Ảnh
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý tập trung các file xem trước OpenGraph (og:image) do người dùng tải lên
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchImages(true)}
            disabled={refreshing}
            className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-xl transition flex items-center gap-1.5 text-xs font-medium"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-purple-600' : ''}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>

          {(data?.orphaned_count || 0) > 0 && (
            <button
              onClick={() => setShowCleanupModal(true)}
              className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Dọn dẹp ảnh rác ({data?.orphaned_count})</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Stat Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block font-mono">
              Tổng Dung Lượng
            </span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">
              {formatSize(data?.total_size_bytes || 0)}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Lưu trữ máy chủ local</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
            <HardDrive className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block font-mono">
              Tổng Số File Ảnh
            </span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">
              {data?.total_files || 0} file
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Thư mục /uploads</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <ImageIcon className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block font-mono">
              Ảnh Đang Gán Link
            </span>
            <span className="text-xl font-bold text-emerald-600 mt-1 block">
              {(data?.total_files || 0) - (data?.orphaned_count || 0)} file
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Hiển thị khi Share/Bot Bot</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <LinkIcon className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block font-mono">
              Ảnh Rác (Không Dùng)
            </span>
            <span className="text-xl font-bold text-amber-600 mt-1 block">
              {data?.orphaned_count || 0} file ({formatSize(data?.orphaned_size_bytes || 0)})
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Cần dọn dẹp bộ nhớ</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo tên file, slug link, tiêu đề..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Filter options */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Status Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-medium">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  filterType === 'all'
                    ? 'bg-white text-slate-800 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất cả ({data?.total_files || 0})
              </button>
              <button
                onClick={() => setFilterType('used')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  filterType === 'used'
                    ? 'bg-white text-emerald-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Đang dùng ({(data?.total_files || 0) - (data?.orphaned_count || 0)})
              </button>
              <button
                onClick={() => setFilterType('orphaned')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  filterType === 'orphaned'
                    ? 'bg-white text-amber-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ảnh rác ({data?.orphaned_count || 0})
              </button>
            </div>

            {/* Sort Select */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="newest">Mới nhất</option>
              <option value="size_desc">Dung lượng lớn nhất</option>
              <option value="size_asc">Dung lượng nhỏ nhất</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid' ? 'bg-white text-purple-600 shadow-xs' : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Dạng lưới"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'table' ? 'bg-white text-purple-600 shadow-xs' : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Dạng danh sách"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Images Grid / Table */}
      {filteredImages.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <div className="text-sm font-semibold text-slate-700">Không tìm thấy file hình ảnh nào</div>
          <div className="text-xs text-slate-400 mt-1">Thử thay đổi bộ lọc tìm kiếm hoặc làm mới dữ liệu</div>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredImages.map(img => (
            <div
              key={img.filename}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col group"
            >
              {/* Image Thumbnail Header (Aspect Ratio 1.91:1 standard OG ratio) */}
              <div className="relative aspect-[1200/630] bg-slate-900/5 overflow-hidden group-hover:opacity-95 transition">
                <img
                  src={img.url}
                  alt={img.filename}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />

                {/* Status Badge */}
                <div className="absolute top-2 left-2 z-10">
                  {img.is_orphaned ? (
                    <span className="px-2 py-0.5 bg-amber-500/90 text-white text-[10px] font-bold rounded-md backdrop-blur-xs shadow-xs">
                      Ảnh rác
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-emerald-600/90 text-white text-[10px] font-bold rounded-md backdrop-blur-xs shadow-xs flex items-center gap-1">
                      <LinkIcon className="w-3 h-3" />
                      {img.used_by_links.length} Link
                    </span>
                  )}
                </div>

                {/* Quick overlay actions */}
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  <button
                    onClick={() => setSelectedImage(img)}
                    className="p-2 bg-white text-slate-800 rounded-xl hover:bg-slate-100 transition shadow-lg text-xs font-semibold flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4 text-purple-600" />
                    <span>Xem chi tiết</span>
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <div
                    className="text-xs font-mono font-bold text-slate-800 truncate"
                    title={img.filename}
                  >
                    {img.filename}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-between">
                    <span>{formatSize(img.size)}</span>
                    <span>{formatDate(img.created_at)}</span>
                  </div>
                </div>

                {/* Used by links preview */}
                {!img.is_orphaned && img.used_by_links.length > 0 && (
                  <div className="bg-slate-50 p-2 rounded-xl text-[11px] text-slate-600 space-y-1 border border-slate-100">
                    <span className="font-semibold text-slate-500 block text-[10px] uppercase font-mono">
                      Link đang gán:
                    </span>
                    <div className="truncate font-medium text-indigo-700">
                      /{img.used_by_links[0].slug} - {img.used_by_links[0].title}
                    </div>
                  </div>
                )}

                {/* Card Actions Footer */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleCopy(img.url)}
                    className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition text-xs flex items-center gap-1 min-h-[36px]"
                    title="Sao chép URL ảnh"
                  >
                    {copiedUrl === img.url ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span className="text-[11px]">Copy Link</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <a
                      href={img.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition min-h-[36px] min-w-[36px] flex items-center justify-center"
                      title="Mở ảnh tab mới"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <button
                      onClick={() => handleDeleteImage(img.filename)}
                      disabled={deletingFilename === img.filename}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition min-h-[36px] min-w-[36px] flex items-center justify-center"
                      title="Xóa tệp ảnh"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider font-mono">
                  <th className="p-3.5">Hình ảnh</th>
                  <th className="p-3.5">Tên File</th>
                  <th className="p-3.5">Dung Lượng</th>
                  <th className="p-3.5">Trạng Thái</th>
                  <th className="p-3.5">Link liên kết</th>
                  <th className="p-3.5">Ngày Tải Lên</th>
                  <th className="p-3.5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredImages.map(img => (
                  <tr key={img.filename} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5">
                      <div className="w-16 h-10 rounded-lg bg-slate-100 overflow-hidden border border-slate-200">
                        <img
                          src={img.url}
                          alt={img.filename}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>

                    <td className="p-3.5 font-mono font-medium text-slate-900 max-w-[200px] truncate">
                      {img.filename}
                    </td>

                    <td className="p-3.5 font-mono font-semibold text-slate-600">
                      {formatSize(img.size)}
                    </td>

                    <td className="p-3.5">
                      {img.is_orphaned ? (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-semibold rounded-md text-[10px]">
                          Ảnh rác
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-semibold rounded-md text-[10px]">
                          Đang dùng ({img.used_by_links.length})
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 max-w-[200px] truncate">
                      {!img.is_orphaned && img.used_by_links.length > 0 ? (
                        <span className="text-indigo-600 font-medium">
                          /{img.used_by_links[0].slug} ({img.used_by_links[0].user_name})
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Chưa gắn link</span>
                      )}
                    </td>

                    <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                      {formatDate(img.created_at)}
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedImage(img)}
                          className="p-1.5 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCopy(img.url)}
                          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Copy Link"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteImage(img.filename)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Xóa tệp"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Image Detail Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-purple-600" />
                Chi tiết tệp ảnh: {selectedImage.filename}
              </h3>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Large Image Preview Card */}
              <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-900/5 aspect-[1200/630] flex items-center justify-center">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.filename}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] font-mono uppercase">Tên Tệp:</span>
                  <span className="font-bold text-slate-800 font-mono break-all">{selectedImage.filename}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] font-mono uppercase">Dung Lượng:</span>
                  <span className="font-bold text-slate-800 font-mono">{formatSize(selectedImage.size)}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] font-mono uppercase">Ngày Tải Lên:</span>
                  <span className="font-bold text-slate-800 font-mono">{formatDate(selectedImage.created_at)}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] font-mono uppercase">Trạng Thái:</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {selectedImage.is_orphaned ? '⚠️ Ảnh rác (Chưa gán link nào)' : `✅ Đang được gán trong ${selectedImage.used_by_links.length} Link`}
                  </span>
                </div>
              </div>

              {/* Public URL Box */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase font-mono">
                  URL Công Khai Direct:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={selectedImage.url}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-700"
                  />
                  <button
                    onClick={() => handleCopy(selectedImage.url)}
                    className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold transition flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </button>
                </div>
              </div>

              {/* Associated Links Section */}
              {!selectedImage.is_orphaned && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-800 block">
                    Danh sách Link rút gọn đang dùng ảnh này:
                  </span>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {selectedImage.used_by_links.map(l => (
                      <div
                        key={l.id}
                        className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-indigo-700 font-mono">/{l.slug}</div>
                          <div className="text-[11px] text-slate-500 truncate">{l.title}</div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                          {l.user_name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => handleDeleteImage(selectedImage.filename)}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Xóa File Này</span>
              </button>

              <button
                onClick={() => setSelectedImage(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cleanup Orphans Modal */}
      {showCleanupModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-slate-900 text-base">Xác nhận dọn dẹp ảnh rác</h3>
              <p className="text-xs text-slate-500">
                Hệ thống quét được <strong className="text-amber-600 font-bold">{data?.orphaned_count} tệp ảnh</strong> không được gán vào bất cứ link rút gọn nào.
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span>Số tệp sẽ xóa:</span>
                <strong className="text-slate-800">{data?.orphaned_count} file</strong>
              </div>
              <div className="flex justify-between">
                <span>Dung lượng sẽ giải phóng:</span>
                <strong className="text-emerald-600">{formatSize(data?.orphaned_size_bytes || 0)}</strong>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowCleanupModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleCleanupOrphans}
                disabled={cleaningOrphans}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl transition shadow-sm flex items-center justify-center gap-1.5"
              >
                {cleaningOrphans && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Đồng ý Dọn Dẹp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
