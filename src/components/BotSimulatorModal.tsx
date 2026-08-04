import React, { useState, useEffect } from 'react';
import { X, Bot, Play, Globe, CheckCircle2, AlertCircle, RefreshCw, Code, ArrowRight } from 'lucide-react';
import { api } from '../lib/api.js';
import { BotSimulationResult } from '../types.js';

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-xl relative text-slate-800 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <Bot className="w-6 h-6 text-indigo-600" />
          <h3 className="font-bold text-xl text-slate-900">Kiểm Tra Bot (DetectBot Inspector)</h3>
        </div>
        <p className="text-xs text-slate-500 mb-6">
          Giả lập truy cập link rút gọn với User-Agent của Facebook, Zalo, Telegram... để kiểm tra OpenGraph HTML meta tags trả về so với trình duyệt người dùng.
        </p>

        {/* Form Controls */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Slug Link Rút Gọn
            </label>
            <div className="flex items-center gap-2">
              <span className="bg-slate-100 text-slate-500 px-3 py-2 rounded-lg text-sm font-mono border border-slate-200">
                /
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="video01"
                className="flex-1 bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Chọn User-Agent Mẫu
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
                  className={`p-2.5 rounded-lg border text-left text-xs transition flex flex-col justify-between ${
                    selectedBotIndex === idx && !customUA
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-medium'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-semibold text-slate-800">{b.name}</span>
                  <span className="text-[10px] text-slate-500 truncate mt-1">
                    {idx === PRESET_BOTS.length - 1 ? 'Non-Bot Redirect' : 'Crawler OG'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Hoặc Nhập Custom User-Agent Header
            </label>
            <input
              type="text"
              value={customUA}
              onChange={(e) => setCustomUA(e.target.value)}
              placeholder="Nhập User-Agent tùy chỉnh..."
              className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>

          <button
            onClick={handleSimulate}
            disabled={loading || !slug.trim()}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg transition flex items-center justify-center gap-2 shadow-xs"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Đang kiểm tra...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> Chạy Giả Lập DetectBot
              </>
            )}
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2 mb-4">
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
                  <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5" /> DETECTED AS BOT (Render OG HTML)
                  </span>
                ) : (
                  <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" /> HUMAN BROWSER ({result.status_code} Redirect)
                  </span>
                )}
              </div>
              <span className="text-xs font-mono text-slate-500">
                Status: <strong className="text-indigo-600">{result.status_code}</strong>
              </span>
            </div>

            {result.is_bot ? (
              <div>
                <div className="text-xs text-slate-500 mb-1 flex items-center justify-between font-medium">
                  <span>Matched Pattern: <strong className="text-indigo-600 font-mono">{result.matched_agent}</strong></span>
                  <span className="text-[10px] text-slate-500">View OG meta tags render</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 overflow-x-auto max-h-48 text-xs font-mono text-emerald-400 whitespace-pre">
                  {result.html_preview}
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs flex items-center justify-between">
                <div>
                  <div className="text-slate-500">Target Redirect URL:</div>
                  <div className="font-mono text-indigo-600 font-bold truncate mt-0.5">
                    {result.redirect_url}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-slate-500 font-mono text-xs">
                  HTTP 302 <ArrowRight className="w-4 h-4 text-indigo-600" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
