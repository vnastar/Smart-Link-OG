import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { User, LinkItem } from '../types.js';
import { OGPreviewCard } from '../components/OGPreviewCard.js';
import { PlusCircle, Link2, Upload, Image as ImageIcon, Sparkles, AlertTriangle, Check, ArrowRight, Calendar, Globe, AlertOctagon } from 'lucide-react';

interface CreateLinkViewProps {
  user: User;
  onNavigate: (path: string) => void;
  siteDomain?: string;
}

export const CreateLinkView: React.FC<CreateLinkViewProps> = ({
  user,
  onNavigate,
  siteDomain = 'https://sls.vnastar.com'
}) => {
  const [destinationUrl, setDestinationUrl] = useState('');
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdLink, setCreatedLink] = useState<LinkItem | null>(null);
  const [copied, setCopied] = useState(false);

  const [createdToday, setCreatedToday] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(user.daily_limit);

  // Check daily limit on load
  useEffect(() => {
    api.getUserStats().then(s => {
      setCreatedToday(s.created_today);
      setDailyLimit(s.daily_limit);
    }).catch(err => console.error(err));
  }, []);

  const limitReached = createdToday >= dailyLimit;

  // Realtime slug checking
  useEffect(() => {
    if (!slug.trim()) {
      setSlugAvailable(null);
      return;
    }
    const timer = setTimeout(() => {
      api.checkSlug(slug.trim()).then(avail => setSlugAvailable(avail));
    }, 300);
    return () => clearTimeout(timer);
  }, [slug]);

  // Handle Image File Upload (Module 5)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File ảnh không được vượt quá 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setUploading(true);
      setError('');
      try {
        const url = await api.uploadImage(base64, file.name);
        setImage(url);
      } catch (err: any) {
        setError(err.message || 'Upload ảnh thất bại');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateRandomSlug = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let res = '';
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSlug(res);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destinationUrl) {
      setError('Vui lòng nhập đường dẫn gốc (Destination URL)');
      return;
    }

    if (limitReached) {
      setError('Bạn đã đạt giới hạn tạo link trong ngày.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const newLink = await api.createLink({
        destination_url: destinationUrl,
        slug: slug.trim(),
        title: title || 'Smart Link Preview',
        description,
        image,
        expires_at: expiresAt || null
      });

      setCreatedLink(newLink);
    } catch (err: any) {
      if (err.code === 'DAILY_LIMIT_EXCEEDED') {
        setError('Bạn đã đạt giới hạn tạo link trong ngày.');
      } else {
        setError(err.message || 'Tạo link thất bại');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyResult = () => {
    if (!createdLink) return;
    const fullUrl = `${siteDomain.replace(/\/$/, '')}/${createdLink.slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <PlusCircle className="w-6 h-6 text-indigo-600" />
            Tạo Link Rút Gọn Mới (Smart OG)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Thiết lập link rút gọn với ảnh OpenGraph tùy chỉnh cho Facebook, Zalo, Telegram...
          </p>
        </div>

        {/* Daily limit badge */}
        <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 font-mono shadow-xs">
          <span className="text-slate-500">Giới hạn hôm nay:</span>
          <span className={`font-bold ${limitReached ? 'text-red-600' : 'text-indigo-600'}`}>
            {createdToday} / {dailyLimit}
          </span>
        </div>
      </div>

      {/* Daily limit alert banner if limit reached */}
      {limitReached && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm flex items-start gap-3">
          <AlertOctagon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold text-amber-900">
              Thông báo: Bạn đã đạt giới hạn tạo link trong ngày.
            </strong>
            Tài khoản của bạn đã sử dụng {createdToday}/{dailyLimit} lượt tạo link hôm nay. Vui lòng quay lại vào ngày mai hoặc liên hệ Quản trị viên để nâng giới hạn.
          </div>
        </div>
      )}

      {/* Success Modal / Card when Link is Created */}
      {createdLink ? (
        <div className="bg-white border border-emerald-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-lg">
            <Check className="w-6 h-6 bg-emerald-100 p-1 rounded-full text-emerald-700" />
            Tạo Link Rút Gọn Thành Công!
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="text-xs text-slate-500 font-medium">Link Rút Gọn Smart OG:</div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`${siteDomain.replace(/\/$/, '')}/${createdLink.slug}`}
                className="flex-1 bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-indigo-700 font-mono font-bold focus:outline-none select-all"
              />
              <button
                onClick={handleCopyResult}
                className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs transition flex items-center gap-1.5 shadow-xs"
              >
                {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                {copied ? 'Đã sao chép' : 'Copy Link'}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setCreatedLink(null);
                setDestinationUrl('');
                setSlug('');
                setTitle('');
                setDescription('');
                setImage('');
              }}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition"
            >
              Tạo Thêm Link Khác
            </button>
            <button
              onClick={() => onNavigate('/dashboard/links')}
              className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition"
            >
              Xem Danh Sách Link
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Form */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Destination URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Link gốc (Destination URL) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    required
                    value={destinationUrl}
                    onChange={(e) => setDestinationUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Slug */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Slug tùy chỉnh (Bỏ trống sẽ tự sinh ngẫu nhiên)
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateRandomSlug}
                    className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-mono font-medium"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Tạo ngẫu nhiên (P8Hsj9)
                  </button>
                </div>

                <div className="flex items-center gap-0">
                  <span className="bg-slate-50 border border-r-0 border-slate-200 text-slate-500 px-3 py-2.5 rounded-l-lg text-xs font-mono">
                    {siteDomain.replace(/^https?:\/\//, '')}/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="video01"
                    className="flex-1 bg-white border border-slate-200 rounded-r-lg px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                {slug && (
                  <div className="mt-1 text-[11px] font-mono">
                    {slugAvailable === true && (
                      <span className="text-emerald-600 font-semibold">✓ Slug /{slug} hợp lệ và khả dụng</span>
                    )}
                    {slugAvailable === false && (
                      <span className="text-red-600 font-semibold">✗ Slug /{slug} đã bị trùng lặp</span>
                    )}
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Tiêu đề OpenGraph (og:title)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Video Hướng Dẫn Chi Tiết Rút Gọn Link..."
                  className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Mô tả OpenGraph (og:description)
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả nội dung link khi chia sẻ trên mạng xã hội..."
                  className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Image Upload / URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Hình ảnh xem trước (og:image)
                </label>

                <div className="space-y-2">
                  <div className="relative">
                    <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      placeholder="Dán URL ảnh hoặc tải ảnh lên từ máy..."
                      className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-lg text-xs font-medium transition flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{uploading ? 'Đang tải lên...' : 'Tải ảnh từ máy (Max 5MB)'}</span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[11px] text-slate-500">Định dạng: JPG, PNG, WEBP</span>
                  </div>
                </div>
              </div>

              {/* Expiration Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Ngày hết hạn (Tuỳ chọn)
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || limitReached || slugAvailable === false}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2 shadow-sm mt-4"
              >
                <PlusCircle className="w-5 h-5" />
                {loading ? 'Đang tạo link...' : 'Tạo Link Smart OG'}
              </button>
            </form>
          </div>

          {/* Right Column: Live OG Preview */}
          <div className="lg:col-span-5 space-y-3">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Xem Trước Hiển Thị Thời Gian Thực
            </div>
            <OGPreviewCard
              title={title}
              description={description}
              image={image}
              domain={siteDomain}
              slug={slug || 'P8Hsj9'}
            />
          </div>
        </div>
      )}
    </div>
  );
};
