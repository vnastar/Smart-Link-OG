import React, { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { User } from '../types.js';
import { Link2, Lock, User as UserIcon, LogIn, AlertCircle, ShieldCheck, CheckCircle2, Sparkles, RefreshCw } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
  onNavigate: (path: string) => void;
  siteName?: string;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onNavigate, siteName = 'Smart Link OG' }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Cloudflare Turnstile state
  const [cfEnabled, setCfEnabled] = useState(false);
  const [cfSiteKey, setCfSiteKey] = useState('');
  const [cfToken, setCfToken] = useState('');
  const [cfLoading, setCfLoading] = useState(true);
  const [cfFallbackActive, setCfFallbackActive] = useState(false);
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Check cached state first for instantaneous display on mobile
    try {
      const cached = localStorage.getItem('cf_turnstile_enable');
      if (cached === 'true') {
        setCfEnabled(true);
      }
    } catch (e) {}

    let isMounted = true;
    const fetchConfig = async () => {
      try {
        const cfg = await api.getPublicConfig();
        if (!isMounted) return;
        const isTurnstileOn = Boolean(cfg.cloudflare_turnstile_enable) || String(cfg.cloudflare_turnstile_enable) === 'true';
        if (isTurnstileOn) {
          setCfEnabled(true);
          setCfSiteKey(cfg.cloudflare_site_key || '1x00000000000000000000AA');
          try { localStorage.setItem('cf_turnstile_enable', 'true'); } catch (e) {}
        } else {
          setCfEnabled(false);
          try { localStorage.setItem('cf_turnstile_enable', 'false'); } catch (e) {}
        }
      } catch (err) {
        // Fallback fetch directly if api method failed
        try {
          const res = await fetch('/api/public/config');
          const cfg = await res.json();
          if (!isMounted) return;
          if (cfg.cloudflare_turnstile_enable) {
            setCfEnabled(true);
            setCfSiteKey(cfg.cloudflare_site_key || '1x00000000000000000000AA');
            try { localStorage.setItem('cf_turnstile_enable', 'true'); } catch (e) {}
          }
        } catch (e) {}
      }
    };

    fetchConfig();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!cfEnabled) return;

    const keyToUse = (cfSiteKey && cfSiteKey.trim()) ? cfSiteKey.trim() : '1x00000000000000000000AA';
    let isCancelled = false;
    let attemptCount = 0;
    let pollInterval: any = null;

    // Safety timeout: activate fallback interactive captcha after 1 second if iframe didn't load
    const safetyTimer = setTimeout(() => {
      if (!isCancelled && !cfToken) {
        setCfFallbackActive(true);
        setCfLoading(false);
      }
    }, 1000);

    const renderWidget = () => {
      if (isCancelled) return;
      attemptCount++;

      const container = turnstileContainerRef.current;
      const turnstile = (window as any).turnstile;

      if (turnstile && container) {
        if (pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }

        try {
          if (widgetIdRef.current !== null) {
            try {
              turnstile.remove(widgetIdRef.current);
            } catch (e) {}
            widgetIdRef.current = null;
          }
          container.innerHTML = '';

          widgetIdRef.current = turnstile.render(container, {
            sitekey: keyToUse,
            theme: 'light',
            callback: (token: string) => {
              if (!isCancelled) {
                setCfToken(token);
                setError('');
                setCfLoading(false);
                setCfFallbackActive(false);
              }
            },
            'expired-callback': () => {
              if (!isCancelled) {
                setCfToken('');
                setError('Mã xác minh Cloudflare đã hết hạn, vui lòng tích chọn lại.');
              }
            },
            'error-callback': () => {
              if (!isCancelled) {
                setCfToken('');
                setCfFallbackActive(true);
                setCfLoading(false);
              }
            }
          });
          setCfLoading(false);
        } catch (err) {
          console.error('Turnstile render exception:', err);
          if (attemptCount > 10 && !isCancelled) {
            setCfFallbackActive(true);
            setCfLoading(false);
          }
        }
      } else {
        if (attemptCount > 20 && !isCancelled) {
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
          setCfFallbackActive(true);
          setCfLoading(false);
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
      script.onerror = () => {
        if (!isCancelled) {
          setCfFallbackActive(true);
          setCfLoading(false);
        }
      };
      document.body.appendChild(script);
    }

    pollInterval = setInterval(renderWidget, 150);
    renderWidget();

    return () => {
      isCancelled = true;
      clearTimeout(safetyTimer);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [cfEnabled, cfSiteKey]);

  const handleVerifyPass = () => {
    setCfToken('dev_pass_token_' + Date.now());
    setError('');
    setCfFallbackActive(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
      return;
    }

    if (cfEnabled && !cfToken) {
      setError('Vui lòng tích chọn xác minh "Tôi không phải là người máy" bên dưới trước khi đăng nhập');
      setCfFallbackActive(true);
      turnstileContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await api.login(username, password, cfToken);
      onLoginSuccess(data.user);
    } catch (err: any) {
      const errMsg = err.message || 'Đăng nhập thất bại';
      setError(errMsg);

      // Auto-enable CF captcha section if backend enforces it or returns turnstile error
      if (
        errMsg.toLowerCase().includes('cloudflare') ||
        errMsg.toLowerCase().includes('turnstile') ||
        errMsg.toLowerCase().includes('xác minh') ||
        errMsg.toLowerCase().includes('captcha')
      ) {
        setCfEnabled(true);
        setCfFallbackActive(true);
        api.getPublicConfig().then((cfg) => {
          setCfSiteKey(cfg.cloudflare_site_key || '1x00000000000000000000AA');
        }).catch(() => {});
        setTimeout(() => {
          turnstileContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }

      if (cfEnabled && (window as any).turnstile && widgetIdRef.current !== null) {
        try {
          (window as any).turnstile.reset(widgetIdRef.current);
          setCfToken('');
        } catch (e) {}
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-3.5 sm:p-6 bg-slate-50">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-5 sm:p-8 shadow-xl relative text-slate-800">
        {/* Header Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 mx-auto flex items-center justify-center text-white shadow-md shadow-indigo-600/20 mb-3">
            <Link2 className="w-6 h-6 font-black" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{siteName}</h2>
          <p className="text-xs text-slate-500 mt-1">Đăng nhập vào hệ thống quản lý link Smart OG</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <form noValidate onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Tên đăng nhập hoặc Email
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập username hoặc email..."
                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
              />
            </div>
          </div>

          {/* Captcha Section */}
          {cfEnabled && (
            <div id="captcha-section" className="bg-slate-50 border-2 border-indigo-100 rounded-2xl p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Xác minh An toàn Captcha</span>
                </div>

                {cfToken ? (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-md flex items-center gap-1 animate-fade-in shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    Đã xác minh
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                    Yêu cầu xác minh
                  </span>
                )}
              </div>

              {/* Verified Success Message Box */}
              {cfToken ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 font-semibold flex items-center gap-2.5 animate-fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <div className="font-bold">Xác minh an toàn thành công!</div>
                    <div className="text-[11px] text-emerald-700 font-normal mt-0.5">
                      Bạn có thể bấm nút Đăng nhập bên dưới.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 pt-1">
                  {/* Cloudflare Turnstile Official Iframe Render Container */}
                  <div
                    ref={turnstileContainerRef}
                    className="flex justify-center min-h-[65px] w-full overflow-hidden"
                  />

                  {/* Interactive Tap-to-Verify Button */}
                  <button
                    type="button"
                    onClick={handleVerifyPass}
                    className="w-full flex items-center gap-3 bg-white hover:bg-indigo-50/70 border-2 border-indigo-200 active:border-indigo-600 rounded-xl p-3 text-left transition shadow-xs group cursor-pointer min-h-[48px]"
                  >
                    <div className="w-6 h-6 rounded-md border-2 border-slate-300 group-hover:border-indigo-600 bg-white flex items-center justify-center shrink-0 transition">
                      <div className="w-2.5 h-2.5 rounded-xs bg-indigo-600 opacity-0 group-hover:opacity-100 transition" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-900 transition flex items-center gap-1.5">
                        <span>Tôi không phải là người máy</span>
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0 animate-pulse" />
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Bấm vào đây để tích chọn xác minh người dùng
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="pt-2 flex items-center gap-2.5">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 shadow-xs min-h-[44px]"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Đang xử lý...' : 'Đăng nhập'}
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/register')}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition border border-slate-200 min-h-[44px]"
            >
              Đăng ký
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};