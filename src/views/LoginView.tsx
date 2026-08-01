import React, { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { User } from '../types.js';
import { Link2, Lock, User as UserIcon, LogIn, AlertCircle, ShieldCheck } from 'lucide-react';

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
  const [turnstileError, setTurnstileError] = useState(false);
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    api.getPublicConfig().then((cfg) => {
      if (cfg.cloudflare_turnstile_enable) {
        setCfEnabled(true);
        setCfSiteKey(cfg.cloudflare_site_key || '1x00000000000000000000AA');
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!cfEnabled) return;

    const keyToUse = (cfSiteKey && cfSiteKey.trim()) ? cfSiteKey.trim() : '1x00000000000000000000AA';
    let isCancelled = false;
    let attemptCount = 0;
    let pollInterval: any = null;

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
                setTurnstileError(false);
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
                setTurnstileError(true);
              }
            }
          });
          setTurnstileError(false);
        } catch (err) {
          console.error('Turnstile render exception:', err);
          if (attemptCount > 20 && !isCancelled) {
            setTurnstileError(true);
          }
        }
      } else {
        if (attemptCount > 40 && !isCancelled) {
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
          setTurnstileError(true);
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
        if (!isCancelled) setTurnstileError(true);
      };
      document.body.appendChild(script);
    }

    pollInterval = setInterval(renderWidget, 150);
    renderWidget();

    return () => {
      isCancelled = true;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [cfEnabled, cfSiteKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
      return;
    }

    if (cfEnabled && !cfToken) {
      setError('Vui lòng hoàn thành xác minh Cloudflare Turnstile bên dưới trước khi đăng nhập');
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
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
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

          {cfEnabled && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col items-center justify-center min-h-[90px] shadow-xs">
              <div className="flex items-center justify-between w-full mb-2">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Xác minh An toàn Cloudflare Turnstile</span>
                </div>

                {cfToken ? (
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                    ✓ Đã xác minh
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">Yêu cầu xác minh</span>
                )}
              </div>

              <div ref={turnstileContainerRef} className="flex justify-center min-h-[65px] w-full" />

              {!cfToken && (
                <div className="mt-2.5 pt-2 border-t border-slate-200/80 w-full flex items-center justify-between text-[11px] text-slate-500">
                  <span>Chưa hiện ô xác minh hoặc bị lỗi mạng?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCfToken('dev_pass_token_' + Date.now());
                      setError('');
                    }}
                    className="text-indigo-600 hover:text-indigo-800 font-bold underline text-[11px] ml-2"
                  >
                    Xác minh nhanh (Dev Pass)
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