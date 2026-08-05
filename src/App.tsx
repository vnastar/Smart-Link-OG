import React, { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { User } from './types.js';
import { api } from './lib/api.js';
import { Navbar } from './components/Navbar.js';
import { Sidebar } from './components/Sidebar.js';
import { QRCodeModal } from './components/QRCodeModal.js';
import { BotSimulatorModal } from './components/BotSimulatorModal.js';
import { LinkAnalyticsModal } from './components/LinkAnalyticsModal.js';

// Views
import { LoginView } from './views/LoginView.js';
import { RegisterView } from './views/RegisterView.js';
import { PasswordView } from './views/PasswordView.js';
import { DashboardView } from './views/DashboardView.js';
import { CreateLinkView } from './views/CreateLinkView.js';
import { MyLinksView } from './views/MyLinksView.js';
import { AdminDashboardView } from './views/AdminDashboardView.js';
import { AdminUsersView } from './views/AdminUsersView.js';
import { AdminLinksView } from './views/AdminLinksView.js';
import { AdminImagesView } from './views/AdminImagesView.js';
import { AdminSettingsView } from './views/AdminSettingsView.js';
import { AdminLogsView } from './views/AdminLogsView.js';
import { ClickAnalyticsCard } from './components/ClickAnalyticsCard.js';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  
  // Get initial path from window location if available
  const getInitialPath = () => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname;
      return p;
    }
    return '/manager';
  };

  const [currentPath, setCurrentPath] = useState<string>(getInitialPath());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [siteConfig, setSiteConfig] = useState<{
    site_name: string;
    site_domain: string;
    private_mode_enable?: boolean;
    custom_login_path?: string;
  }>({
    site_name: 'Smart Link OG',
    site_domain: typeof window !== 'undefined' ? window.location.origin : '',
    private_mode_enable: false,
    custom_login_path: '/login'
  });

  // Modal states
  const [qrModal, setQrModal] = useState<{ isOpen: boolean; slug: string; dest: string }>({
    isOpen: false,
    slug: '',
    dest: ''
  });
  const [botModal, setBotModal] = useState<{ isOpen: boolean; slug: string }>({
    isOpen: false,
    slug: 'video01'
  });
  const [analyticsModal, setAnalyticsModal] = useState<{ isOpen: boolean; link: any }>({
    isOpen: false,
    link: null
  });

  const openAnalytics = (link: any) => {
    setAnalyticsModal({ isOpen: true, link });
  };

  // Fetch initial session & public config
  useEffect(() => {
    api.getPublicConfig()
      .then(cfg => {
        const loginPath = cfg.custom_login_path || '/login';
        setSiteConfig({
          site_name: cfg.site_name || 'Smart Link OG',
          site_domain: cfg.site_domain || (typeof window !== 'undefined' ? window.location.origin : ''),
          private_mode_enable: Boolean(cfg.private_mode_enable),
          custom_login_path: loginPath
        });
      })
      .catch(console.error);

    const token = api.getToken();
    if (token) {
      api.getMe()
        .then(u => {
          setUser(u);
          if (u.must_change_password) {
            setCurrentPath('/dashboard/password');
          } else if (currentPath === '/login' || currentPath === siteConfig.custom_login_path || currentPath === '/register' || currentPath === '/') {
            setCurrentPath('/manager');
          }
        })
        .catch(() => {
          api.clearToken();
          setUser(null);
          setCurrentPath(siteConfig.custom_login_path || '/login');
        })
        .finally(() => setLoadingUser(false));
    } else {
      setLoadingUser(false);
      setCurrentPath(siteConfig.custom_login_path || '/login');
    }
  }, []);

  const handleLoginSuccess = (u: User) => {
    setUser(u);
    if (u.must_change_password) {
      setCurrentPath('/dashboard/password');
    } else {
      if (typeof window !== 'undefined' && window.history.pushState) {
        window.history.pushState({}, '', '/manager');
      }
      setCurrentPath('/manager');
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    const loginPath = siteConfig.custom_login_path || '/login';
    if (typeof window !== 'undefined' && window.history.pushState) {
      window.history.pushState({}, '', loginPath);
    }
    setCurrentPath(loginPath);
  };

  const handleNavigate = (path: string) => {
    setMobileMenuOpen(false);
    if (user && user.must_change_password && path !== '/dashboard/password') {
      setCurrentPath('/dashboard/password');
      return;
    }
    const targetPath = (path === '/dashboard') ? '/manager' : path;
    if (typeof window !== 'undefined' && window.history.pushState) {
      window.history.pushState({}, '', targetPath);
    }
    setCurrentPath(targetPath);
  };

  const openQR = (slug: string, dest: string) => {
    setQrModal({ isOpen: true, slug, dest });
  };

  const openBotInspector = (slug?: string) => {
    setBotModal({ isOpen: true, slug: slug || 'video01' });
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600 text-xs font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          <span>Đang tải hệ thống Smart Link OG...</span>
        </div>
      </div>
    );
  }

  // Auth pages (Login / Register) without sidebar
  if (!user) {
    const currentNorm = currentPath.toLowerCase();
    const loginNorm = (siteConfig.custom_login_path || '/login').toLowerCase();

    // If Private Mode is active, check if current path matches configured login path
    if (siteConfig.private_mode_enable) {
      if (currentNorm !== loginNorm && currentNorm !== `${loginNorm}/`) {
        return (
          <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center font-sans p-4">
            <div className="text-center max-w-sm">
              <h1 className="text-6xl font-extrabold text-sky-400 mb-2">404</h1>
              <h2 className="text-lg font-semibold mb-2">Trang không tồn tại</h2>
              <p className="text-xs text-slate-400">Đường dẫn bạn truy cập không tồn tại hoặc website đang ở chế độ riêng tư.</p>
            </div>
          </div>
        );
      }
    }

    if (currentPath === '/register' && !siteConfig.private_mode_enable) {
      return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
          <Navbar
            user={null}
            onLogout={() => {}}
            onOpenBotSimulator={() => openBotInspector('video01')}
            siteName={siteConfig.site_name}
            siteDomain={siteConfig.site_domain}
          />
          <RegisterView
            onRegisterSuccess={handleLoginSuccess}
            onNavigate={setCurrentPath}
            siteName={siteConfig.site_name}
          />
          <BotSimulatorModal
            isOpen={botModal.isOpen}
            onClose={() => setBotModal({ isOpen: false, slug: 'video01' })}
            initialSlug={botModal.slug}
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
        <Navbar
          user={null}
          onLogout={() => {}}
          onOpenBotSimulator={() => openBotInspector('video01')}
          siteName={siteConfig.site_name}
          siteDomain={siteConfig.site_domain}
        />
        {siteConfig.private_mode_enable && (
          <div className="max-w-md mx-auto w-full pt-4 px-4">
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-2.5 shadow-2xs">
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold block text-amber-800">Website đang ở Chế độ Riêng tư (Private Mode)</span>
                <span>Chỉ cho phép đăng nhập tại <code className="font-mono bg-amber-100 px-1 py-0.5 rounded text-amber-900 font-bold">{siteConfig.custom_login_path || '/login'}</code> để truy cập trang quản lý <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">/manager</code>.</span>
              </div>
            </div>
          </div>
        )}
        <LoginView
          onLoginSuccess={handleLoginSuccess}
          onNavigate={setCurrentPath}
          siteName={siteConfig.site_name}
        />
        <BotSimulatorModal
          isOpen={botModal.isOpen}
          onClose={() => setBotModal({ isOpen: false, slug: 'video01' })}
          initialSlug={botModal.slug}
        />
      </div>
    );
  }

  // Main Authenticated Dashboard Shell
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar
        user={user}
        onLogout={handleLogout}
        onOpenBotSimulator={() => openBotInspector('video01')}
        siteName={siteConfig.site_name}
        siteDomain={siteConfig.site_domain}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        isMobileMenuOpen={mobileMenuOpen}
      />

      <div className="flex flex-1 relative">
        <Sidebar
          currentPath={currentPath}
          onNavigate={handleNavigate}
          user={user}
          isMobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
          onOpenBotSimulator={() => openBotInspector('video01')}
        />

        <main className="flex-1 p-3.5 sm:p-6 overflow-y-auto max-w-7xl mx-auto w-full min-w-0">
          {(currentPath === '/manager' || currentPath === '/dashboard') && (
            <DashboardView
              user={user}
              onNavigate={handleNavigate}
              onOpenQR={openQR}
              onOpenBotInspector={openBotInspector}
              onOpenAnalytics={openAnalytics}
              siteDomain={siteConfig.site_domain}
            />
          )}

          {(currentPath === '/manager/create' || currentPath === '/dashboard/create') && (
            <CreateLinkView
              user={user}
              onNavigate={handleNavigate}
              siteDomain={siteConfig.site_domain}
            />
          )}

          {(currentPath === '/manager/links' || currentPath === '/dashboard/links') && (
            <MyLinksView
              user={user}
              onOpenQR={openQR}
              onOpenBotInspector={openBotInspector}
              onOpenAnalytics={openAnalytics}
              siteDomain={siteConfig.site_domain}
            />
          )}

          {(currentPath === '/manager/analytics' || currentPath === '/dashboard/analytics') && (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Phân Tích Tỷ Lệ Click Vùng & Đối Tượng</h1>
                <p className="text-xs text-slate-500 mt-0.5">Báo cáo phân tích chuyên sâu lưu lượng truy cập link rút gọn</p>
              </div>
              <ClickAnalyticsCard />
            </div>
          )}

          {(currentPath === '/manager/password' || currentPath === '/dashboard/password') && (
            <PasswordView
              user={user}
              onPasswordChanged={(updatedUser) => setUser(updatedUser)}
            />
          )}

          {currentPath === '/admin' && (
            <AdminDashboardView />
          )}

          {currentPath === '/admin/users' && (
            <AdminUsersView />
          )}

          {currentPath === '/admin/links' && (
            <AdminLinksView
              onOpenQR={openQR}
              onOpenBotInspector={openBotInspector}
              onOpenAnalytics={openAnalytics}
              siteDomain={siteConfig.site_domain}
            />
          )}

          {currentPath === '/admin/images' && (
            <AdminImagesView />
          )}

          {currentPath === '/admin/settings' && (
            <AdminSettingsView />
          )}

          {currentPath === '/admin/logs' && (
            <AdminLogsView />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <QRCodeModal
        isOpen={qrModal.isOpen}
        onClose={() => setQrModal({ isOpen: false, slug: '', dest: '' })}
        slug={qrModal.slug}
        destinationUrl={qrModal.dest}
        domain={siteConfig.site_domain}
      />

      <BotSimulatorModal
        isOpen={botModal.isOpen}
        onClose={() => setBotModal({ isOpen: false, slug: 'video01' })}
        initialSlug={botModal.slug}
      />

      <LinkAnalyticsModal
        isOpen={analyticsModal.isOpen}
        onClose={() => setAnalyticsModal({ isOpen: false, link: null })}
        link={analyticsModal.link}
        isAdmin={user?.role === 'admin'}
      />
    </div>
  );
}
