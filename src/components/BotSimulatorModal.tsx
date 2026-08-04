import React, { useState, useEffect } from 'react';
import { X, Bot, Play, Globe, CheckCircle2, AlertCircle, RefreshCw, Code, ArrowRight, Eye, Image as ImageIcon } from 'lucide-react';
import { api } from '../lib/api.js';
import { BotSimulationResult } from '../types.js';
import { OGPreviewCard } from './OGPreviewCard.js';

interface BotSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSlug?: string;
}

const PRESET_BOTS = [
  { name: 'Facebook Crawler', ua: 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)' },
  { name: 'Zalo Bot', ua: 'Mozilla/5.0 (compatible; ZaloBot/1.0; +http://zalo.me)' },
  { name: 'Telegram Bot', ua: 'TelegramBot (like TwitterBot)' },
  { name: 'Twitter / X Bot', ua: 'Twitterbot/1.0' },
  { name: 'Discord Bot', ua: 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)' },
  { name: 'Google Inspection Tool', ua: 'Mozilla/5.0 (compatible; GoogleInspectionTool/1.0; +https://search.google.com/search-console)' },
  { name: 'Normal Browser (Human)', ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36' }
];

export const BotSimulatorModal: React.FC<BotSimulatorModalProps> = ({
  isOpen,
  onClose,
  initialSlug = 'video01'
}) => {
  const [slug, setSlug] = useState(initialSlug);
  const [selectedBotIndex, setSelectedBotIndex] = useState(0);
  const [customUA, setCustomUA] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BotSimulationResult | null>(null);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'preview' | 'html'>('preview');

  const currentUA = customUA || PRESET_BOTS[selectedBotIndex].ua;

  const runSimulation = async (targetSlug: string, ua: string) => {
    if (!targetSlug.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await api.simulateBot(targetSlug.trim(), ua);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi giả lập yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const activeSlug = initialSlug || 'video01';
      setSlug(activeSlug);
      setResult(null);
      setError('');
      runSimulation(activeSlug, currentUA);
    }
  }, [isOpen, initialSlug]);

  if (!isOpen) return null;

  const handleSimulate = () => {
    runSimulation(slug, currentUA);
  };

  // Helper to parse meta tags from generated OG HTML
  const parseOGFromHtml = (html?: string) => {
    if (!html) return { title: '', description: '', image: '', url: '', siteName: '' };
    const getMeta = (prop: string) => {
      const regex = new RegExp(`<meta\\s+(?:property|name|itemprop)=["']${prop}["']\\s+content=["'](.*?)["']`, 'i');
      const match = html.match(regex);
      return match ? match[1] : '';
    };

    return {
      title: getMeta('og:title') || getMeta('twitter:title') || getMeta('name') || '',
      description: getMeta('og:description') || getMeta('twitter:description') || '',
      image: getMeta('og:image') || getMeta('og:image:secure_url') || getMeta('twitter:image') || '',
      url: getMeta('og:url') || getMeta('twitter:url') || '',
      siteName: getMeta('og:site_name') || ''
    };
  };

  const parsedOG = result?.html_preview ? parseOGFromHtml(result.html_preview) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl relative text-slate-800 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg sm:text-xl text-slate-900">Kiểm Tra Bot & Previews (DetectBot Inspector)</h3>
            <p className="text-xs text-slate-500">
              Giả lập truy cập từ Zalo, Facebook, Telegram để kiểm tra hình ảnh và thẻ OpenGraph bot thu thập được.
            </p>
          </div>
        </div>

        {/* Form Controls */}
        <div className="space-y-3.5 my-4 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
              Slug Link Rút Gọn
            </label>
            <div className="flex items-center gap-2">
              <span className="bg-white text-slate-500 px-3 py-2 rounded-lg text-xs font-mono border border-slate-200 shrink-0">
                /
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="video01"
                className="flex-1 bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[38px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
              Chọn Bot Mạng Xã Hội Đọc Link
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_BOTS.map((b, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedBotIndex(idx);
                    setCustomUA('');
                    runSimulation(slug, b.ua);
                  }}
                  className={`p-2 rounded-lg border text-left text-xs transition flex flex-col justify-between ${
                    selectedBotIndex === idx && !customUA
                      ? 'bg-indigo-600 text-white font-bold border-indigo-600 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate">{b.name}</span>
                  <span className={`text-[10px] mt-0.5 ${selectedBotIndex === idx && !customUA ? 'text-indigo-100' : 'text-slate-400'}`}>
                    {idx === PRESET_BOTS.length - 1 ? 'Chuyển hướng' : 'OG Bot View'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Hoặc Nhập Custom User-Agent
            </label>
            <input
              type="text"
              value={customUA}
              onChange={(e) => setCustomUA(e.target.value)}
              placeholder="User-Agent string..."
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>

          <button
            onClick={handleSimulate}
            disabled={loading || !slug.trim()}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-xs"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Đang kiểm tra...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> Chạy Giả Lập Bot Mạng Xã Hội
              </>
            )}
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Simulation Result */}
        {result && (
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                {result.is_bot ? (
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Nhận diện BOT ({result.matched_agent})
                  </span>
                ) : (
                  <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-amber-600" /> Trình duyệt người dùng ({result.status_code} Redirect)
                  </span>
                )}
              </div>
              <span className="text-xs font-mono text-slate-500">
                HTTP <strong className="text-indigo-600 font-bold">{result.status_code}</strong>
              </span>
            </div>

            {result.is_bot ? (
              <div className="space-y-3">
                {/* View Mode Toggle */}
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-indigo-600" />
                    Hình Ảnh & Thẻ OG Bot Nhận Được
                  </div>
                  <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setViewMode('preview')}
                      className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 ${
                        viewMode === 'preview'
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" /> Xem trước Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('html')}
                      className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 ${
                        viewMode === 'html'
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Code className="w-3.5 h-3.5" /> Mã HTML Meta
                    </button>
                  </div>
                </div>

                {viewMode === 'preview' && parsedOG ? (
                  <OGPreviewCard
                    title={parsedOG.title}
                    description={parsedOG.description}
                    image={parsedOG.image}
                    slug={slug}
                    ogUrl={parsedOG.url}
                    ogSiteName={parsedOG.siteName}
                  />
                ) : (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 overflow-x-auto max-h-56 text-xs font-mono text-emerald-400 whitespace-pre">
                    {result.html_preview}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-3 text-xs flex items-center justify-between">
                <div>
                  <div className="text-slate-500 font-semibold">URL Đích Chuyển Hướng Nhanh:</div>
                  <div className="font-mono text-indigo-600 font-bold truncate mt-0.5 max-w-sm">
                    {result.redirect_url}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-slate-500 font-mono text-xs shrink-0">
                  HTTP {result.status_code} <ArrowRight className="w-4 h-4 text-indigo-600" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

