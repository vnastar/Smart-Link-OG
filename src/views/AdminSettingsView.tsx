import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { SiteSettings } from '../types.js';
import { Settings, Save, CheckCircle2, Globe, Shield, Bot, Code, Sliders, ShieldCheck, Key } from 'lucide-react';

export const AdminSettingsView: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    api.getAdminSettings().then(setSettings).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setSavedMsg('');
    try {
      const updated = await api.updateAdminSettings(settings);
      setSettings(updated);
      setSavedMsg('Đã lưu cấu hình hệ thống thành công!');
      setTimeout(() => setSavedMsg(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Lỗi lưu cấu hình');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return <div className="py-12 text-center text-slate-500 text-xs">Đang tải cấu hình...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-600" />
          Cấu Hình Hệ Thống (System Settings)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Quản lý tên miền, mã chuyển hướng 301/302, giới hạn mặc định và danh sách User-Agent Bot
        </p>
      </div>

      {savedMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{savedMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Branding & Domain */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
            <Globe className="w-4 h-4 text-indigo-600" /> Thông Tin Thương Hiệu & Domain
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Website Name
              </label>
              <input
                type="text"
                value={settings.site_name}
                onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Website Domain Prefix
              </label>
              <input
                type="text"
                value={settings.site_domain}
                onChange={(e) => setSettings({ ...settings, site_domain: e.target.value })}
                placeholder="https://sls.vnastar.com"
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Logo URL
              </label>
              <input
                type="text"
                value={settings.logo}
                onChange={(e) => setSettings({ ...settings, logo: e.target.value })}
                placeholder="https://example.com/logo.png"
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Favicon URL
              </label>
              <input
                type="text"
                value={settings.favicon}
                onChange={(e) => setSettings({ ...settings, favicon: e.target.value })}
                placeholder="https://example.com/favicon.ico"
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Redirect & Limits */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
            <Sliders className="w-4 h-4 text-indigo-600" /> Cấu Hình Chuyển Hướng & Giới Hạn
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Mã Chuyển Hướng Mặc Định (Redirect Code)
              </label>
              <select
                value={settings.default_redirect}
                onChange={(e) => setSettings({ ...settings, default_redirect: e.target.value as '301' | '302' })}
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="302">302 Found (Tạm thời - Khuyên dùng cho Social Tracking)</option>
                <option value="301">301 Moved Permanently (Vĩnh viễn - Cache trình duyệt)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Default Daily Limit (Mặc định cho User mới)
              </label>
              <input
                type="number"
                min="1"
                value={settings.default_limit}
                onChange={(e) => setSettings({ ...settings, default_limit: parseInt(e.target.value, 10) || 3 })}
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition">
              <input
                type="checkbox"
                checked={settings.register_enable}
                onChange={(e) => setSettings({ ...settings, register_enable: e.target.checked })}
                className="w-4 h-4 accent-indigo-600 rounded"
              />
              <div>
                <span className="text-xs font-semibold text-slate-800">Cho phép đăng ký mới (Allow Register)</span>
                <span className="text-[11px] text-slate-500 block">Bật/tắt mở cổng đăng ký tài khoản thành viên</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition">
              <input
                type="checkbox"
                checked={settings.upload_enable}
                onChange={(e) => setSettings({ ...settings, upload_enable: e.target.checked })}
                className="w-4 h-4 accent-indigo-600 rounded"
              />
              <div>
                <span className="text-xs font-semibold text-slate-800">Cho phép Upload ảnh (Upload Enable)</span>
                <span className="text-[11px] text-slate-500 block">Tải ảnh OpenGraph tối đa 5MB lên local storage</span>
              </div>
            </label>
          </div>
        </div>

        {/* Section 3: Cloudflare Turnstile Login Verification */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" /> Cấu Hình API Xác Minh Đăng Nhập Cloudflare Turnstile
            </h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              settings.cloudflare_turnstile_enable ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}>
              {settings.cloudflare_turnstile_enable ? 'ĐANG BẬT' : 'ĐANG TẮT'}
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Bật tính năng xác minh CAPTCHA thông minh Cloudflare Turnstile trên trang đăng nhập để ngăn chặn tấn công dò mật khẩu tự động (Brute-force) và Bot spam.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-3">
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={!!settings.cloudflare_turnstile_enable}
                  onChange={(e) => setSettings({ ...settings, cloudflare_turnstile_enable: e.target.checked })}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Kích hoạt xác minh Cloudflare Turnstile khi Đăng Nhập</span>
                  <span className="text-[11px] text-slate-500 block">Yêu cầu người dùng xác minh chống bot trước khi gửi yêu cầu đăng nhập</span>
                </div>
              </div>
            </label>

            {settings.cloudflare_turnstile_enable && (
              <div className="pt-3 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Cloudflare Site Key</span>
                    <span className="text-[10px] font-mono text-indigo-600 normal-case">(Frontend Site Key)</span>
                  </label>
                  <input
                    type="text"
                    value={settings.cloudflare_site_key || ''}
                    onChange={(e) => setSettings({ ...settings, cloudflare_site_key: e.target.value })}
                    placeholder="VD: 0x4AAAAAA... (hoặc 1x00000000000000000000AA)"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Cloudflare Secret Key</span>
                    <span className="text-[10px] font-mono text-indigo-600 normal-case">(Backend Secret Key)</span>
                  </label>
                  <input
                    type="password"
                    value={settings.cloudflare_secret_key || ''}
                    onChange={(e) => setSettings({ ...settings, cloudflare_secret_key: e.target.value })}
                    placeholder="VD: 0x4AAAAAA... (hoặc 1x000000000000000000000000000000AA)"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="md:col-span-2 bg-indigo-50/70 border border-indigo-100 rounded-lg p-3 text-[11px] text-indigo-900 leading-relaxed">
                  <strong>Mã Key dùng thử nghiệm chính thức từ Cloudflare:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-0.5 font-mono text-[10px] text-indigo-800">
                    <li>Site Key test (Luôn thành công): <code className="bg-white px-1.5 py-0.5 rounded border border-indigo-200 font-bold select-all">1x00000000000000000000AA</code></li>
                    <li>Secret Key test (Luôn đúng): <code className="bg-white px-1.5 py-0.5 rounded border border-indigo-200 font-bold select-all">1x000000000000000000000000000000AA</code></li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Bot Inspector List */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
            <Bot className="w-4 h-4 text-indigo-600" /> Danh Sách User-Agent Nhận Dạng Bot (Bot List)
          </h3>
          <p className="text-xs text-slate-500">
            Các chuỗi ký tự nhận diện bot crawler của Facebook, Zalo, Telegram, Twitter... Khi DetectBot phát hiện User-Agent chứa 1 trong các chuỗi này, hệ thống sẽ trả về trang HTML OpenGraph thay vì chuyển hướng 302.
          </p>

          <textarea
            rows={4}
            value={settings.bot_list}
            onChange={(e) => setSettings({ ...settings, bot_list: e.target.value })}
            placeholder="facebookexternalhit, facebot, twitterbot, discordbot, telegrambot..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs text-indigo-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2 shadow-xs"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Đang lưu cấu hình...' : 'Lưu Tất Cả Cấu Hình System'}
        </button>
      </form>
    </div>
  );
};
