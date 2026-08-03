import React, { useState } from 'react';
import { Globe, Share2, Facebook, MessageCircle, Send, Twitter } from 'lucide-react';

interface OGPreviewCardProps {
  title: string;
  description: string;
  image: string;
  domain?: string;
  slug?: string;
  ogUrl?: string;
  ogType?: string;
  ogSiteName?: string;
}

export const OGPreviewCard: React.FC<OGPreviewCardProps> = ({
  title,
  description,
  image,
  domain = typeof window !== 'undefined' ? window.location.origin : '',
  slug = 'video01',
  ogUrl,
  ogType,
  ogSiteName
}) => {
  const [activePlatform, setActivePlatform] = useState<'facebook' | 'zalo' | 'telegram' | 'twitter'>('facebook');

  const displayTitle = title || 'Tiêu đề bài viết của bạn...';
  const displayDesc = description || 'Mô tả chi tiết bài viết sẽ xuất hiện ở đây khi chia sẻ link trên mạng xã hội...';
  const displayImg = image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
  const fullUrl = ogUrl && ogUrl.trim() ? ogUrl.trim() : `${domain.replace(/\/$/, '')}/${slug || 'preview'}`;
  const displayType = ogType && ogType.trim() ? ogType.trim() : 'website';
  const displaySiteName = ogSiteName && ogSiteName.trim() ? ogSiteName.trim() : '';
  const hostOnly = domain.replace(/^https?:\/\//, '');

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-slate-800">
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Share2 className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            Xem trước hiển thị OpenGraph (OG)
          </span>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => setActivePlatform('facebook')}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
              activePlatform === 'facebook'
                ? 'bg-blue-600 text-white font-medium shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Facebook className="w-3.5 h-3.5" /> Facebook
          </button>
          <button
            type="button"
            onClick={() => setActivePlatform('zalo')}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
              activePlatform === 'zalo'
                ? 'bg-blue-500 text-white font-medium shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" /> Zalo
          </button>
          <button
            type="button"
            onClick={() => setActivePlatform('telegram')}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
              activePlatform === 'telegram'
                ? 'bg-sky-500 text-white font-medium shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Send className="w-3.5 h-3.5" /> Telegram
          </button>
          <button
            type="button"
            onClick={() => setActivePlatform('twitter')}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
              activePlatform === 'twitter'
                ? 'bg-slate-800 text-white font-medium shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Twitter className="w-3.5 h-3.5" /> Twitter / X
          </button>
        </div>
      </div>

      {/* Social Card Preview */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-md max-w-lg mx-auto">
        {/* Header bar simulated post */}
        <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2.5 text-xs">
          <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">
            SL
          </div>
          <div>
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              Smart Link OG
              <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.2 rounded font-semibold">
                Verified Bot View
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <span>Vừa xong</span> • <Globe className="w-3 h-3 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Thumbnail Image */}
        <div className="relative aspect-[1.91/1] w-full bg-slate-100 overflow-hidden group">
          <img
            src={displayImg}
            alt="OG Thumbnail"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
            }}
          />
          <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-mono px-2 py-0.5 rounded border border-slate-700">
            OG:IMAGE (1200x630)
          </div>
        </div>

        {/* Text Metadata Details */}
        <div className="p-3.5 bg-slate-50/80 border-t border-slate-100">
          <div className="text-[11px] font-mono uppercase text-slate-400 tracking-wider mb-1 truncate flex items-center justify-between gap-1">
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3 text-indigo-600" />
              {hostOnly}
            </span>
            <span className="flex items-center gap-1.5 flex-wrap">
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded text-[10px] font-semibold font-mono">
                og:type={displayType}
              </span>
              {displaySiteName && (
                <span className="bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded text-[10px] font-semibold font-mono">
                  og:site_name={displaySiteName}
                </span>
              )}
            </span>
          </div>
          <h4 className="font-semibold text-slate-900 text-sm line-clamp-2 leading-snug mb-1">
            {displayTitle}
          </h4>
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {displayDesc}
          </p>
        </div>

        {/* Bottom Bar Simulator */}
        <div className="px-3.5 py-2 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span className="truncate font-mono text-[10px] text-indigo-600 font-semibold">{fullUrl}</span>
          <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold">
            {activePlatform.toUpperCase()} OG CRAWLER
          </span>
        </div>
      </div>
    </div>
  );
};
