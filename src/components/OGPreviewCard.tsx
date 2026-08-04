import React, { useState } from 'react';
import { Globe, Share2, Facebook, MessageCircle, Send, Twitter, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface OGPreviewCardProps {
  title: string;
  description: string;
  image: string;
  domain?: string;
  slug?: string;
  ogUrl?: string;
  ogType?: string;
  ogSiteName?: string;
  className?: string;
}

export const OGPreviewCard: React.FC<OGPreviewCardProps> = ({
  title,
  description,
  image,
  domain = typeof window !== 'undefined' ? window.location.origin : '',
  slug = 'preview',
  ogUrl,
  ogType,
  ogSiteName,
  className = ''
}) => {
  const [activePlatform, setActivePlatform] = useState<'facebook' | 'zalo' | 'telegram' | 'twitter'>('facebook');
  const [imageError, setImageError] = useState(false);

  // Normalize image URL
  const getFullImageUrl = (rawImage: string, cleanDomain: string): string => {
    if (!rawImage || !rawImage.trim()) return '';
    let img = rawImage.trim();
    const base = cleanDomain.replace(/\/$/, '');

    if (img.startsWith('/')) {
      return `${base}${img}`;
    }
    if (img.startsWith('uploads/')) {
      return `${base}/${img}`;
    }
    if (img.startsWith('http://') || img.startsWith('https://')) {
      return img;
    }
    return `${base}/${img}`;
  };

  const cleanDomain = domain ? domain.replace(/\/$/, '') : (typeof window !== 'undefined' ? window.location.origin : '');
  const displayTitle = title?.trim() || 'Tiêu đề bài viết / Trang web';
  const displayDesc = description?.trim() || 'Mô tả chi tiết nội dung khi người dùng hoặc bot xem trước link trên mạng xã hội...';
  const rawImgUrl = getFullImageUrl(image, cleanDomain);
  const displayImg = rawImgUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
  
  const fullUrl = ogUrl && ogUrl.trim() ? ogUrl.trim() : `${cleanDomain}/${slug || 'preview'}`;
  const displayType = ogType && ogType.trim() ? ogType.trim() : 'website';
  const displaySiteName = ogSiteName && ogSiteName.trim() ? ogSiteName.trim() : '';
  const hostOnly = cleanDomain.replace(/^https?:\/\//, '');

  return (
    <div className={`bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-slate-800 ${className}`}>
      {/* Header with platform tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Share2 className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Xem Trước Bot Preview OG Image
          </span>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs overflow-x-auto">
          <button
            type="button"
            onClick={() => { setActivePlatform('facebook'); setImageError(false); }}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 font-medium ${
              activePlatform === 'facebook'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Facebook className="w-3.5 h-3.5" /> Facebook
          </button>
          <button
            type="button"
            onClick={() => { setActivePlatform('zalo'); setImageError(false); }}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 font-medium ${
              activePlatform === 'zalo'
                ? 'bg-blue-500 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" /> Zalo
          </button>
          <button
            type="button"
            onClick={() => { setActivePlatform('telegram'); setImageError(false); }}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 font-medium ${
              activePlatform === 'telegram'
                ? 'bg-sky-500 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Send className="w-3.5 h-3.5" /> Telegram
          </button>
          <button
            type="button"
            onClick={() => { setActivePlatform('twitter'); setImageError(false); }}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 font-medium ${
              activePlatform === 'twitter'
                ? 'bg-slate-900 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Twitter className="w-3.5 h-3.5" /> Twitter / X
          </button>
        </div>
      </div>

      {/* Platform-Specific Preview Containers */}
      <div className="max-w-lg mx-auto">
        {/* FACEBOOK PREVIEW */}
        {activePlatform === 'facebook' && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-md">
            <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2.5 text-xs">
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-[11px]">
                f
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-slate-800 truncate">Facebook Post Preview</div>
                <div className="text-[10px] text-slate-400">facebookexternalhit / Facebot Crawler</div>
              </div>
            </div>

            {/* Banner Image */}
            <div className="relative aspect-[1.91/1] w-full bg-slate-900 overflow-hidden group">
              {!imageError && displayImg ? (
                <img
                  src={displayImg}
                  alt={displayTitle}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-400 p-4 text-center">
                  <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                  <span className="text-xs font-semibold">Chưa có ảnh đại diện</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Tải ảnh hoặc nhập URL ảnh để bot nhận diện</span>
                </div>
              )}
              <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded border border-white/20">
                1200 x 630
              </div>
            </div>

            {/* Meta Text */}
            <div className="p-3 bg-slate-100/80 border-t border-slate-200">
              <div className="text-[10px] font-mono uppercase text-slate-500 tracking-wider mb-0.5 truncate">
                {hostOnly}
              </div>
              <h4 className="font-bold text-slate-900 text-sm line-clamp-2 leading-snug mb-1">
                {displayTitle}
              </h4>
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {displayDesc}
              </p>
            </div>
          </div>
        )}

        {/* ZALO PREVIEW */}
        {activePlatform === 'zalo' && (
          <div className="bg-slate-50 rounded-2xl border border-blue-200 p-3 shadow-md">
            <div className="flex items-center gap-2 mb-2 px-1">
              <div className="w-6 h-6 rounded-lg bg-blue-500 text-white flex items-center justify-center font-bold text-[10px]">
                Z
              </div>
              <span className="text-xs font-bold text-blue-900">Zalo Chat Message Preview</span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="relative aspect-[16/9] w-full bg-slate-900 overflow-hidden">
                {!imageError && displayImg ? (
                  <img
                    src={displayImg}
                    alt={displayTitle}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-400 p-4 text-center">
                    <ImageIcon className="w-8 h-8 mb-1 opacity-50" />
                    <span className="text-xs font-semibold">Ảnh Zalo Bot</span>
                  </div>
                )}
              </div>
              <div className="p-3 space-y-1">
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 leading-tight">
                  {displayTitle}
                </h4>
                <p className="text-xs text-slate-500 line-clamp-2">
                  {displayDesc}
                </p>
                <div className="pt-1.5 flex items-center justify-between text-[10px] text-blue-600 font-mono font-semibold border-t border-slate-100">
                  <span className="truncate">{hostOnly}</span>
                  <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">ZaloBot/1.0</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TELEGRAM PREVIEW */}
        {activePlatform === 'telegram' && (
          <div className="bg-slate-800 text-slate-100 rounded-2xl p-3 shadow-md border border-slate-700">
            <div className="flex items-center justify-between mb-2 px-1 text-xs text-sky-400 font-semibold">
              <span className="flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5" /> Telegram Message Link Card
              </span>
              <span className="text-[10px] font-mono text-slate-400">TelegramBot</span>
            </div>

            <div className="bg-slate-900 border-l-4 border-sky-400 rounded-r-xl p-3 space-y-2">
              <div className="text-xs font-bold text-sky-400 truncate">
                {displaySiteName || hostOnly}
              </div>
              <h4 className="font-bold text-slate-100 text-xs sm:text-sm leading-snug line-clamp-2">
                {displayTitle}
              </h4>
              <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                {displayDesc}
              </p>

              <div className="relative aspect-[1.91/1] w-full rounded-lg bg-slate-950 overflow-hidden mt-2 border border-slate-800">
                {!imageError && displayImg ? (
                  <img
                    src={displayImg}
                    alt={displayTitle}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-semibold">
                    [Ảnh preview Telegram]
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TWITTER PREVIEW */}
        {activePlatform === 'twitter' && (
          <div className="bg-black text-white rounded-2xl border border-slate-800 overflow-hidden shadow-md p-3">
            <div className="flex items-center gap-1.5 mb-2 text-xs text-slate-400 font-bold">
              <Twitter className="w-3.5 h-3.5 text-white" /> X / Twitter Summary Large Image Card
            </div>
            <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
              <div className="relative aspect-[1.91/1] w-full bg-slate-900">
                {!imageError && displayImg ? (
                  <img
                    src={displayImg}
                    alt={displayTitle}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-semibold">
                    [Twitter Image Preview]
                  </div>
                )}
              </div>
              <div className="p-3 bg-black space-y-1 border-t border-slate-800">
                <div className="text-[11px] font-mono text-slate-500 truncate">
                  {hostOnly}
                </div>
                <h4 className="font-bold text-white text-xs sm:text-sm line-clamp-1">
                  {displayTitle}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-2">
                  {displayDesc}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer detail badges */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
          <div className="flex items-center gap-1 min-w-0">
            <Globe className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="font-mono text-[10px] truncate text-slate-600">{fullUrl}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-mono font-semibold">
              og:type={displayType}
            </span>
            {displaySiteName && (
              <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-semibold">
                {displaySiteName}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

