import React, { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { SiteSettings } from '../types.js';
import { Settings, Save, CheckCircle2, Globe, Shield, Bot, Code, Sliders, ShieldCheck, Key, Sparkles, RefreshCw, AlertCircle, Clock, Upload, Image as ImageIcon, X, Loader2, Trash2, Check, FileImage } from 'lucide-react';

export const AdminSettingsView: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  // Image Upload States
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [logoDragActive, setLogoDragActive] = useState(false);
  const [faviconDragActive, setFaviconDragActive] = useState(false);

  // CAPTCHA Test States (Google reCAPTCHA & Cloudflare)
  const [testCaptchaToken, setTestCaptchaToken] = useState('');
  const [testStatus, setTestStatus] = useState<{ type: 'success' | 'error' | 'loading' | null; msg: string }>({ type: null, msg: '' });
  const captchaTestRef = useRef<HTMLDivElement>(null);
  const captchaTestWidgetId = useRef<any>(null);

  useEffect(() => {
    api.getAdminSettings().then(setSettings).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!settings) return;
    const isRecaptcha = Boolean(settings.recaptcha_enable);
    const isTurnstile = Boolean(settings.cloudflare_turnstile_enable);
    if (!isRecaptcha && !isTurnstile) return;

    let isCancelled = false;
    let attemptCount = 0;
    let pollInterval: any = null;

    if (isRecaptcha) {
      const siteKeyToTest = (settings.recaptcha_site_key && settings.recaptcha_site_key.trim())
        ? settings.recaptcha_site_key.trim()
        : '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

      const renderRecaptchaTest = () => {
        if (isCancelled) return;
        attemptCount++;
        const container = captchaTestRef.current;
        const grecaptcha = (window as any).grecaptcha;

        if (grecaptcha && grecaptcha.render && container) {
          if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
          try {
            container.innerHTML = '';
            captchaTestWidgetId.current = grecaptcha.render(container, {
              sitekey: siteKeyToTest,
              theme: 'light',
              callback: (token: string) => {
                if (!isCancelled) {
                  setTestCaptchaToken(token);
                  setTestStatus({ type: null, msg: '' });
                }
              },
              'expired-callback': () => {
                if (!isCancelled) {
                  setTestCaptchaToken('');
                  setTestStatus({ type: 'error', msg: 'Mã token Google reCAPTCHA đã hết hạn, vui lòng tích chọn lại.' });
                }
              },
              'error-callback': () => {
                if (!isCancelled) {
                  setTestCaptchaToken('');
                  setTestStatus({ type: 'error', msg: 'Lỗi tải widget Google reCAPTCHA. Vui lòng kiểm tra lại Site Key.' });
                }
              }
            });
          } catch (e: any) {
            if (attemptCount > 15 && !isCancelled) {
              setTestStatus({ type: 'error', msg: 'Lỗi hiển thị widget Google reCAPTCHA: ' + (e.message || e) });
            }
          }
        } else {
          if (attemptCount > 30 && !isCancelled) {
            if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
            setTestStatus({ type: 'error', msg: 'Không thể tải thư viện Google reCAPTCHA.' });
          }
        }
      };

      const existingScript = document.getElementById('google-recaptcha-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'google-recaptcha-script';
        script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
      }

      pollInterval = setInterval(renderRecaptchaTest, 150);
      renderRecaptchaTest();
    } else if (isTurnstile) {
      const siteKeyToTest = (settings.cloudflare_site_key && settings.cloudflare_site_key.trim())
        ? settings.cloudflare_site_key.trim()
        : '1x00000000000000000000AA';

      const renderTurnstileTest = () => {
        if (isCancelled) return;
        attemptCount++;
        const container = captchaTestRef.current;
        const turnstile = (window as any).turnstile;

        if (turnstile && container) {
          if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
          try {
            if (captchaTestWidgetId.current !== null && turnstile.remove) {
              try { turnstile.remove(captchaTestWidgetId.current); } catch (e) {}
              captchaTestWidgetId.current = null;
            }
            container.innerHTML = '';
            captchaTestWidgetId.current = turnstile.render(container, {
              sitekey: siteKeyToTest,
              theme: 'light',
              callback: (token: string) => {
                if (!isCancelled) {
                  setTestCaptchaToken(token);
                  setTestStatus({ type: null, msg: '' });
                }
              },
              'expired-callback': () => {
                if (!isCancelled) {
                  setTestCaptchaToken('');
                  setTestStatus({ type: 'error', msg: 'Mã token đã hết hạn, vui lòng tích chọn lại.' });
                }
              },
              'error-callback': () => {
                if (!isCancelled) {
                  setTestCaptchaToken('');
                  setTestStatus({ type: 'error', msg: 'Lỗi tải widget Turnstile với Site Key này. Vui lòng kiểm tra lại Site Key.' });
                }
              }
            });
          } catch (e: any) {
            if (attemptCount > 15 && !isCancelled) {
              setTestStatus({ type: 'error', msg: 'Lỗi hiển thị widget Turnstile: ' + (e.message || e) });
            }
          }
        }
      };

      const existingScript = document.getElementById('cf-turnstile-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'cf-turnstile-script';
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
      }

      pollInterval = setInterval(renderTurnstileTest, 150);
      renderTurnstileTest();
    }

    return () => {
      isCancelled = true;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [settings?.recaptcha_site_key, settings?.recaptcha_enable, settings?.cloudflare_site_key, settings?.cloudflare_turnstile_enable]);

  const handleRunTest = async () => {
    if (!settings) return;
    if (!testCaptchaToken) {
      setTestStatus({ type: 'error', msg: 'Vui lòng tích chọn xác minh ô Captcha bên dưới trước khi bấm Kiểm Tra.' });
      return;
    }

    setTestStatus({ type: 'loading', msg: 'Đang gửi mã Token tới server xác minh siteverify...' });
    try {
      if (settings.recaptcha_enable) {
        const res = await api.testRecaptchaConfig(testCaptchaToken, settings.recaptcha_secret_key);
        if (res.success) {
          setTestStatus({ type: 'success', msg: res.message || 'Xác minh Google reCAPTCHA thành công! Cặp Key chính xác 100%.' });
        } else {
          setTestStatus({ type: 'error', msg: res.message || 'Xác minh Google reCAPTCHA thất bại' });
        }
      } else {
        const res = await api.testTurnstileConfig(testCaptchaToken, settings.cloudflare_secret_key);
        if (res.success) {
          setTestStatus({ type: 'success', msg: res.message || 'Xác minh Cloudflare Turnstile thành công! Cặp Key chính xác 100%.' });
        } else {
          setTestStatus({ type: 'error', msg: res.message || 'Xác minh thất bại' });
        }
      }
    } catch (err: any) {
      setTestStatus({ type: 'error', msg: err.message || 'Lỗi kiểm tra cấu hình Key với server' });
    }
  };

  const handleFillRecaptchaDemoKeys = () => {
    if (!settings) return;
    setSettings({
      ...settings,
      recaptcha_enable: true,
      cloudflare_turnstile_enable: false,
      captcha_provider: 'recaptcha',
      recaptcha_site_key: '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI',
      recaptcha_secret_key: '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe'
    });
    setTestStatus({ type: 'success', msg: 'Đã điền Cặp Key thử nghiệm Demo chính thức từ Google reCAPTCHA! Bạn có thể bấm kiểm tra phía dưới.' });
  };

  const handleFillDemoKeys = () => {
    if (!settings) return;
    setSettings({
      ...settings,
      cloudflare_turnstile_enable: true,
      recaptcha_enable: false,
      captcha_provider: 'turnstile',
      cloudflare_site_key: '1x00000000000000000000AA',
      cloudflare_secret_key: '1x000000000000000000000000000000AA'
    });
    setTestStatus({ type: 'success', msg: 'Đã điền Cặp Key thử nghiệm chuẩn từ Cloudflare. Hãy bấm kiểm tra captcha bên dưới.' });
  };

  const processImageUpload = async (file: File, target: 'logo' | 'favicon') => {
    if (!settings) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước ảnh không được vượt quá 5MB');
      return;
    }

    const setUploading = target === 'logo' ? setUploadingLogo : setUploadingFavicon;
    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        if (!base64) {
          alert('Không thể đọc dữ liệu file ảnh');
          setUploading(false);
          return;
        }
        try {
          const result = await api.uploadImage(base64, file.name);
          const uploadedUrl = typeof result === 'string' ? result : result.url;
          if (target === 'logo') {
            setSettings({ ...settings, logo: uploadedUrl });
          } else {
            setSettings({ ...settings, favicon: uploadedUrl });
          }
        } catch (err: any) {
          alert(err.message || 'Lỗi khi tải ảnh lên server');
        } finally {
          setUploading(false);
        }
      };
      reader.onerror = () => {
        alert('Lỗi đọc file từ thiết bị');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      alert('Có lỗi xảy ra: ' + (err.message || err));
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    // Check if CAPTCHA is enabled but has not been tested successfully
    if ((settings.recaptcha_enable || settings.cloudflare_turnstile_enable) && testStatus.type !== 'success') {
      setSaving(false);
      setTestStatus({
        type: 'error',
        msg: '⚠️ BẮT BUỘC KIỂM TRA: Bạn đang bật xác minh CAPTCHA khi đăng nhập. Vui lòng hoàn thành Bước 2 (Tích chọn captcha và bấm "Kiểm Tra Kết Nối") thành công trước khi lưu cấu hình để phòng tránh nguy cơ bị khóa trang đăng nhập!'
      });
      captchaTestRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSaving(true);
    setSavedMsg('');
    try {
      const updated = await api.updateAdminSettings(settings);
      setSettings(updated);
      try {
        localStorage.setItem('cf_turnstile_enable', String(Boolean(updated.cloudflare_turnstile_enable)));
      } catch (e) {}
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
                Website Domain Prefix (Tuỳ chọn)
              </label>
              <input
                type="text"
                value={settings.site_domain}
                onChange={(e) => setSettings({ ...settings, site_domain: e.target.value })}
                placeholder={typeof window !== 'undefined' ? window.location.origin : 'https://ten-mien-cua-ban.com'}
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Đề trống nếu muốn hệ thống tự động nhận diện tên miền hiện tại (Auto-Detect Domain) khi triển khai đa tên miền.
              </p>
            </div>

            {/* Logo Upload & Preview */}
            <div className="md:col-span-1 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Logo Website
                </label>
                {settings.logo && (
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, logo: '' })}
                    className="text-[11px] text-red-500 hover:text-red-700 flex items-center gap-1 font-medium transition"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Xóa Logo</span>
                  </button>
                )}
              </div>

              {/* Upload Drag & Drop Box */}
              <div
                onDragOver={(e) => { e.preventDefault(); setLogoDragActive(true); }}
                onDragLeave={() => setLogoDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setLogoDragActive(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    processImageUpload(e.dataTransfer.files[0], 'logo');
                  }
                }}
                className={`border-2 border-dashed rounded-xl p-3.5 transition flex flex-col items-center justify-center text-center ${
                  logoDragActive ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                {settings.logo ? (
                  <div className="w-full flex flex-col items-center gap-2">
                    <div className="h-14 max-w-full flex items-center justify-center p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                      <img
                        src={settings.logo}
                        alt="Logo preview"
                        className="max-h-10 object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" /> Đã có ảnh Logo
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 py-1">
                    <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                      {uploadingLogo ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileImage className="w-5 h-5" />}
                    </div>
                    <p className="text-xs text-slate-600 font-medium">Kéo thả hình ảnh Logo vào đây</p>
                    <p className="text-[10px] text-slate-400">Hỗ trợ PNG, SVG, WEBP, JPG (Max 5MB)</p>
                  </div>
                )}

                <div className="mt-2.5 flex items-center gap-2 w-full">
                  <label className="flex-1 cursor-pointer bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 py-1.5 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-2xs">
                    {uploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" /> : <Upload className="w-3.5 h-3.5 text-indigo-600" />}
                    <span>{uploadingLogo ? 'Đang tải lên...' : 'Tải Ảnh Logo Lên'}</span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp, image/svg+xml"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          processImageUpload(e.target.files[0], 'logo');
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Direct URL Input fallback */}
              <input
                type="text"
                value={settings.logo}
                onChange={(e) => setSettings({ ...settings, logo: e.target.value })}
                placeholder="Hoặc dán trực tiếp URL Logo (https://...)"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            {/* Favicon Upload & Preview */}
            <div className="md:col-span-1 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Favicon Website (.ico / .png / .svg)
                </label>
                {settings.favicon && (
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, favicon: '' })}
                    className="text-[11px] text-red-500 hover:text-red-700 flex items-center gap-1 font-medium transition"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Xóa Favicon</span>
                  </button>
                )}
              </div>

              {/* Upload Drag & Drop Box */}
              <div
                onDragOver={(e) => { e.preventDefault(); setFaviconDragActive(true); }}
                onDragLeave={() => setFaviconDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setFaviconDragActive(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    processImageUpload(e.dataTransfer.files[0], 'favicon');
                  }
                }}
                className={`border-2 border-dashed rounded-xl p-3.5 transition flex flex-col items-center justify-center text-center ${
                  faviconDragActive ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                {settings.favicon ? (
                  <div className="w-full flex flex-col items-center gap-2">
                    <div className="h-14 w-full flex items-center justify-center gap-2 p-2 bg-slate-900 rounded-lg border border-slate-700 shadow-2xs">
                      <img
                        src={settings.favicon}
                        alt="Favicon preview"
                        className="w-8 h-8 object-contain rounded"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="text-left">
                        <span className="text-[11px] font-medium text-slate-200 block truncate max-w-[180px]">{settings.site_name || 'Website Tab'}</span>
                        <span className="text-[9px] text-slate-400 block">Xem trước biểu tượng tab trình duyệt</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" /> Đã có ảnh Favicon
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 py-1">
                    <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                      {uploadingFavicon ? <Loader2 className="w-5 h-5 animate-spin" /> : <Globe className="w-5 h-5" />}
                    </div>
                    <p className="text-xs text-slate-600 font-medium">Kéo thả icon Favicon vào đây</p>
                    <p className="text-[10px] text-slate-400">Hỗ trợ .ICO, .PNG, .SVG, .WEBP (Max 5MB)</p>
                  </div>
                )}

                <div className="mt-2.5 flex items-center gap-2 w-full">
                  <label className="flex-1 cursor-pointer bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 py-1.5 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-2xs">
                    {uploadingFavicon ? <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" /> : <Upload className="w-3.5 h-3.5 text-indigo-600" />}
                    <span>{uploadingFavicon ? 'Đang tải lên...' : 'Tải Favicon Lên'}</span>
                    <input
                      type="file"
                      accept="image/x-icon, image/vnd.microsoft.icon, image/png, image/jpeg, image/webp, image/svg+xml, .ico, .svg"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          processImageUpload(e.target.files[0], 'favicon');
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Direct URL Input fallback */}
              <input
                type="text"
                value={settings.favicon}
                onChange={(e) => setSettings({ ...settings, favicon: e.target.value })}
                placeholder="Hoặc dán trực tiếp URL Favicon (https://...)"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
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

        {/* Section: Private Website Mode */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
            Chế Độ Website Riêng Tư (Private Mode / Stealth Site)
          </h3>

          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2 text-xs text-amber-900">
            <div className="flex items-center gap-2 font-bold text-amber-800 text-sm">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Bảo mật tối đa - Khóa trang công khai</span>
            </div>
            <p>
              Khi kích hoạt <strong>Chế Độ Private Website</strong>:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-700">
              <li><strong>Chặn truy cập trực tiếp:</strong> Người dùng vãng lai truy cập trang chủ <code>/</code> hoặc trang đăng ký <code>/register</code> sẽ bị chặn và tự động chuyển hướng về trang đăng nhập <code>{settings.custom_login_path || '/login'}</code>.</li>
              <li><strong>Điều hướng quản lý:</strong> Sau khi đăng nhập thành công, hệ thống chuyển hướng thẳng người dùng tới trang quản lý tại <code>/manager</code>.</li>
              <li><strong>Link rút gọn <code>/[slug]</code> vẫn hoạt động 100%:</strong> Bất kể khi người dùng nhấp vào link hay Bot mạng xã hội (Facebook, Telegram, Zalo...) truy cập cào ảnh OpenGraph, liên kết vẫn hoạt động hoàn toàn bình thường.</li>
            </ul>
          </div>

          <label className="flex items-center gap-3.5 p-4 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition">
            <input
              type="checkbox"
              checked={Boolean(settings.private_mode_enable)}
              onChange={(e) => setSettings({ ...settings, private_mode_enable: e.target.checked })}
              className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
            />
            <div>
              <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                Kích hoạt Chế độ Website Riêng Tư (Private Website Mode)
                {settings.private_mode_enable ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                    ĐANG BẬT
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 text-slate-600">
                    TẮT (CÔNG KHAI)
                  </span>
                )}
              </span>
              <span className="text-xs text-slate-500 block mt-0.5">
                Chỉ cho phép đăng nhập tại <code>{settings.custom_login_path || '/login'}</code> và làm việc tại trang quản lý <code>/manager</code>. Ẩn toàn bộ trang công khai đối với người lạ.
              </span>
            </div>
          </label>

          {/* Custom Login Path Configuration */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <label className="block text-xs font-bold text-slate-800 flex items-center justify-between flex-wrap gap-1">
              <span className="flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-600" />
                Đường Dẫn Đăng Nhập Tùy Chỉnh (Custom Login Path)
              </span>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, custom_login_path: '/login' })}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 hover:underline font-normal flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Mặc định (/login)
              </button>
            </label>
            <div className="space-y-1.5">
              <input
                type="text"
                value={settings.custom_login_path || '/login'}
                onChange={(e) => {
                  let val = e.target.value.trim();
                  if (!val.startsWith('/')) val = '/' + val;
                  setSettings({ ...settings, custom_login_path: val });
                }}
                placeholder="/login hoặc /portal-access"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>
            <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-[11px] text-indigo-950 space-y-1">
              <p className="font-semibold text-indigo-900">
                📌 Bảo mật ẩn địa chỉ đăng nhập:
              </p>
              <p className="text-slate-700">
                • Đường dẫn hiện tại: <code className="bg-white px-1.5 py-0.5 rounded border border-indigo-200 font-bold text-indigo-700 font-mono">{settings.custom_login_path || '/login'}</code>
              </p>
              <p className="text-slate-500">
                • Ví dụ tùy chỉnh: <code>/portal-access</code>, <code>/quantri-login</code>, <code>/auth-key</code>
              </p>
            </div>
          </div>
        </div>

        {/* Section: Link Expiration Rules */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
            <Clock className="w-4 h-4 text-indigo-600" /> Quy Định Hạn Dùng Mặc Định Cho Link Người Dùng
          </h3>

          <p className="text-xs text-slate-500">
            Cấu hình thời gian tự động hết hạn mặc định hoặc giới hạn thời gian tối đa cho các liên kết do người dùng tạo.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Thời gian hết hạn mặc định (Default Expiration Days)
              </label>
              <div className="space-y-2">
                <input
                  type="number"
                  min="0"
                  value={settings.default_expiration_days ?? 0}
                  onChange={(e) => setSettings({ ...settings, default_expiration_days: parseInt(e.target.value, 10) || 0 })}
                  placeholder="0 = Không hết hạn (Vĩnh viễn)"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  {[
                    { label: 'Vĩnh viễn (0 ngày)', val: 0 },
                    { label: '7 Ngày', val: 7 },
                    { label: '30 Ngày', val: 30 },
                    { label: '90 Ngày', val: 90 },
                    { label: '365 Ngày', val: 365 }
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => setSettings({ ...settings, default_expiration_days: preset.val })}
                      className={`px-2.5 py-1 rounded-md border text-xs transition ${
                        (settings.default_expiration_days ?? 0) === preset.val
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <span className="text-[11px] text-slate-500 block">
                  {(settings.default_expiration_days ?? 0) > 0
                    ? `Mọi link do người dùng tạo sẽ tự động hết hạn sau ${settings.default_expiration_days} ngày kể từ lúc tạo.`
                    : 'Mặc định các link mới sẽ KHÔNG bị hết hạn (Vĩnh viễn).'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Thời gian hết hạn tối đa được phép (Max Expiration Days)
              </label>
              <div className="space-y-2">
                <input
                  type="number"
                  min="0"
                  value={settings.max_expiration_days ?? 0}
                  onChange={(e) => setSettings({ ...settings, max_expiration_days: parseInt(e.target.value, 10) || 0 })}
                  placeholder="0 = Không giới hạn"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[11px] text-slate-500 block">
                  {(settings.max_expiration_days ?? 0) > 0
                    ? `Người dùng chỉ được phép hẹn giờ hết hạn tối đa ${settings.max_expiration_days} ngày.`
                    : 'Không giới hạn thời gian hết hạn tối đa khi user tự chọn ngày.'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition">
              <input
                type="checkbox"
                checked={settings.allow_unlimited_expiration ?? true}
                onChange={(e) => setSettings({ ...settings, allow_unlimited_expiration: e.target.checked })}
                className="w-4 h-4 accent-indigo-600 rounded"
              />
              <div>
                <span className="text-xs font-semibold text-slate-800">Cho phép tạo Link vĩnh viễn (Allow Unlimited Expiration)</span>
                <span className="text-[11px] text-slate-500 block">
                  Nếu TẮT, người dùng bắt buộc phải chọn thời gian hết hạn khi tạo link (không được để vĩnh viễn).
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Section 3: Google reCAPTCHA & Cloudflare Turnstile Verification */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" /> Xác Minh Đăng Nhập Chống Brute-force & Bot Spam
            </h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              (settings.recaptcha_enable || settings.cloudflare_turnstile_enable) ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}>
              {(settings.recaptcha_enable || settings.cloudflare_turnstile_enable) ? 'ĐANG BẬT' : 'ĐANG TẮT'}
            </span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Kích hoạt xác minh CAPTCHA thông minh trên trang đăng nhập để ngăn chặn tấn công dò mật khẩu tự động (Brute-force) và Bot rác.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
            {/* Provider Selection Radio Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label
                onClick={() => {
                  setSettings({
                    ...settings,
                    recaptcha_enable: true,
                    cloudflare_turnstile_enable: false,
                    captcha_provider: 'recaptcha'
                  });
                }}
                className={`p-3.5 border-2 rounded-xl cursor-pointer transition flex flex-col justify-between ${
                  settings.recaptcha_enable
                    ? 'bg-indigo-50/80 border-indigo-600 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-indigo-600" /> Google reCAPTCHA
                  </span>
                  <input
                    type="radio"
                    name="captcha_type"
                    checked={!!settings.recaptcha_enable}
                    onChange={() => {}}
                    className="w-4 h-4 accent-indigo-600"
                  />
                </div>
                <span className="text-[11px] text-slate-500">Google reCAPTCHA v2 / v3 phổ biến nhất thế giới</span>
              </label>

              <label
                onClick={() => {
                  setSettings({
                    ...settings,
                    cloudflare_turnstile_enable: true,
                    recaptcha_enable: false,
                    captcha_provider: 'turnstile'
                  });
                }}
                className={`p-3.5 border-2 rounded-xl cursor-pointer transition flex flex-col justify-between ${
                  settings.cloudflare_turnstile_enable
                    ? 'bg-indigo-50/80 border-indigo-600 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" /> Cloudflare Turnstile
                  </span>
                  <input
                    type="radio"
                    name="captcha_type"
                    checked={!!settings.cloudflare_turnstile_enable}
                    onChange={() => {}}
                    className="w-4 h-4 accent-indigo-600"
                  />
                </div>
                <span className="text-[11px] text-slate-500">CAPTCHA bảo mật nhẹ, không cần giải đố hình ảnh</span>
              </label>

              <label
                onClick={() => {
                  setSettings({
                    ...settings,
                    recaptcha_enable: false,
                    cloudflare_turnstile_enable: false
                  });
                }}
                className={`p-3.5 border-2 rounded-xl cursor-pointer transition flex flex-col justify-between ${
                  (!settings.recaptcha_enable && !settings.cloudflare_turnstile_enable)
                    ? 'bg-amber-50/80 border-amber-500 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800">Tắt CAPTCHA</span>
                  <input
                    type="radio"
                    name="captcha_type"
                    checked={!settings.recaptcha_enable && !settings.cloudflare_turnstile_enable}
                    onChange={() => {}}
                    className="w-4 h-4 accent-slate-600"
                  />
                </div>
                <span className="text-[11px] text-slate-500">Cho phép đăng nhập trực tiếp không cần xác minh</span>
              </label>
            </div>

            {/* Google reCAPTCHA Settings Panel */}
            {settings.recaptcha_enable && (
              <div className="pt-3 border-t border-slate-200 space-y-4 animate-fade-in">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Bước 1: Cấu hình API Keys Google reCAPTCHA
                  </span>
                  <button
                    type="button"
                    onClick={handleFillRecaptchaDemoKeys}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-md transition flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-500" />
                    Tự động điền Key Mẫu Google Demo
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Google reCAPTCHA Site Key</span>
                      <span className="text-[10px] font-mono text-indigo-600 normal-case">(Frontend Site Key)</span>
                    </label>
                    <input
                      type="text"
                      value={settings.recaptcha_site_key || ''}
                      onChange={(e) => setSettings({ ...settings, recaptcha_site_key: e.target.value })}
                      placeholder="VD: 6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Google reCAPTCHA Secret Key</span>
                      <span className="text-[10px] font-mono text-indigo-600 normal-case">(Backend Secret Key)</span>
                    </label>
                    <input
                      type="password"
                      value={settings.recaptcha_secret_key || ''}
                      onChange={(e) => setSettings({ ...settings, recaptcha_secret_key: e.target.value })}
                      placeholder="VD: 6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Step 2: Live Captcha Testing Panel */}
                <div className="mt-4 bg-white border border-indigo-100 rounded-xl p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-indigo-50 pb-2">
                    <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-indigo-600" />
                      Bước 2: Thử nghiệm xác minh Google reCAPTCHA trước khi lưu
                    </span>
                    <span className="text-[10px] font-medium text-slate-500">
                      Đảm bảo trang đăng nhập hoạt động chuẩn xác
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Hãy hoàn thành ô xác minh bên dưới và bấm nút <strong>Kiểm Tra Kết Nối</strong>. Nếu Google trả về kết quả 🟢 Thành Công, cặp Key của bạn chuẩn xác và an toàn để sử dụng.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <div className="flex flex-col items-center sm:items-start min-h-[78px] justify-center">
                      <div ref={captchaTestRef} className="g-recaptcha min-h-[78px]" />
                    </div>

                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={handleRunTest}
                        disabled={testStatus.type === 'loading'}
                        className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50 min-h-[42px]"
                      >
                        {testStatus.type === 'loading' ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            Đang kiểm tra...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Kiểm Tra Kết Nối Google Server
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {testStatus.type && (
                    <div
                      className={`p-3 rounded-lg text-xs flex items-start gap-2.5 animate-fade-in ${
                        testStatus.type === 'success'
                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                          : testStatus.type === 'error'
                          ? 'bg-rose-50 border border-rose-200 text-rose-900'
                          : 'bg-indigo-50 border border-indigo-200 text-indigo-900'
                      }`}
                    >
                      {testStatus.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                      {testStatus.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
                      {testStatus.type === 'loading' && <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin shrink-0 mt-0.5" />}
                      <span className="font-medium">{testStatus.msg}</span>
                    </div>
                  )}
                </div>

                {/* Hướng dẫn chi tiết tạo Google reCAPTCHA Keys */}
                <div className="bg-indigo-50/80 border border-indigo-100 rounded-xl p-4 text-xs text-indigo-950 space-y-2">
                  <div className="font-bold text-indigo-900 flex items-center gap-1.5">
                    <Code className="w-4 h-4 text-indigo-600" />
                    Hướng Dẫn Chi Tiết Tạo Google reCAPTCHA v2 / v3 Keys:
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-700 leading-relaxed pl-1">
                    <li>Truy cập Google reCAPTCHA Admin Console: <a href="https://www.google.com/recaptcha/admin" target="_blank" rel="noreferrer" className="text-indigo-600 underline font-semibold">google.com/recaptcha/admin</a></li>
                    <li>Đăng nhập bằng tài khoản Google của bạn và bấm vào biểu tượng dấu cộng <strong>(+)</strong> để tạo site mới.</li>
                    <li>Chọn kiểu reCAPTCHA: <strong>reCAPTCHA v2 ("I'm not a robot" Checkbox)</strong> hoặc <strong>v3</strong>.</li>
                    <li>Điền tên miền dự án của bạn (ví dụ: <code className="bg-white px-1 py-0.5 rounded border border-indigo-200 font-mono text-indigo-800">localhost</code> hoặc tên miền domain thực tế).</li>
                    <li>Sao chép <strong>Site Key</strong> và <strong>Secret Key</strong> dán vào 2 ô cấu hình ở trên và bấm <strong>Lưu Tất Cả Cấu Hình System</strong>.</li>
                  </ol>
                </div>
              </div>
            )}

            {/* Cloudflare Turnstile Settings Panel */}
            {settings.cloudflare_turnstile_enable && (
              <div className="pt-3 border-t border-slate-200 space-y-4 animate-fade-in">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Bước 1: Cấu hình thông số API Keys Cloudflare Turnstile
                  </span>
                  <button
                    type="button"
                    onClick={handleFillDemoKeys}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-md transition flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-500" />
                    Tự động điền Key Mẫu Cloudflare
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>

                {/* Step 2: Live Captcha Testing Panel */}
                <div className="mt-4 bg-white border border-indigo-100 rounded-xl p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-indigo-50 pb-2">
                    <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-indigo-600" />
                      Bước 2: Thử nghiệm xác minh CAPTCHA trước khi lưu
                    </span>
                    <span className="text-[10px] font-medium text-slate-500">
                      Ngăn ngừa lỗi khóa trang đăng nhập
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Hãy hoàn thành ô xác minh bên dưới và bấm nút <strong>Kiểm Tra Kết Nối</strong>. Nếu Cloudflare trả về kết quả 🟢 Thành Công, cặp Key của bạn chuẩn xác và an toàn để sử dụng.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <div className="flex flex-col items-center sm:items-start min-h-[65px]">
                      <div ref={captchaTestRef} className="cf-turnstile min-h-[65px]" />
                    </div>

                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={handleRunTest}
                        disabled={testStatus.type === 'loading'}
                        className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50 min-h-[42px]"
                      >
                        {testStatus.type === 'loading' ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            Đang kiểm tra...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Kiểm Tra Kết Nối Với Server
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {testStatus.type && (
                    <div
                      className={`p-3 rounded-lg text-xs flex items-start gap-2.5 animate-fade-in ${
                        testStatus.type === 'success'
                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                          : testStatus.type === 'error'
                          ? 'bg-rose-50 border border-rose-200 text-rose-900'
                          : 'bg-indigo-50 border border-indigo-200 text-indigo-900'
                      }`}
                    >
                      {testStatus.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                      {testStatus.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
                      {testStatus.type === 'loading' && <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin shrink-0 mt-0.5" />}
                      <span className="font-medium">{testStatus.msg}</span>
                    </div>
                  )}
                </div>

                <div className="bg-indigo-50/70 border border-indigo-100 rounded-lg p-3 text-[11px] text-indigo-900 leading-relaxed">
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
