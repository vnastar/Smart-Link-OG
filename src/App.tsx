import React, { useEffect, useState } from 'react';
import { User } from './types.js';
import { api } from './lib/api.js';
import { Navbar } from './components/Navbar.js';
import { Sidebar } from './components/Sidebar.js';
import { QRCodeModal } from './components/QRCodeModal.js';
import { BotSimulatorModal } from './components/BotSimulatorModal.js';

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
import { AdminSettingsView } from './views/AdminSettingsView.js';
import { AdminLogsView } from './views/AdminLogsView.js';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [currentPath, setCurrentPath] = useState('/dashboard');
  const [siteConfig, setSiteConfig] = useState({
    site_name: 'Smart Link OG',
    site_domain: 'https://sls.vnastar.com'
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

  // Fetch initial session & public config
  useEffect(() => {
    api.getPublicConfig()
      .then(cfg => {
        setSiteConfig({
          site_name: cfg.site_name || 'Smart Link OG',
          site_domain: cfg.site_domain || 'https://sls.vnastar.com'
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
          }
        })
        .catch(() => {
          api.clearToken();
          setUser(null);
          setCurrentPath('/login');
        })
        .finally(() => setLoadingUser(false));
    } else {
      setLoadingUser(false);
      setCurrentPath('/login');
    }
  }, []);

  const handleLoginSuccess = (u: User) => {
    setUser(u);
    if (u.must_change_password) {
      setCurrentPath('/dashboard/password');
    } else {
      setCurrentPath('/dashboard');
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setCurrentPath('/login');
  };

  const handleNavigate = (path: string) => {
    if (user && user.must_change_password && path !== '/dashboard/password') {
      setCurrentPath('/dashboard/password');
      return;
    }
    setCurrentPath(path);
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
    if (currentPath === '/register') {
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
      />

      <div className="flex flex-1">
        <Sidebar
          currentPath={currentPath}
          onNavigate={handleNavigate}
          user={user}
        />

        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          {currentPath === '/dashboard' && (
            <DashboardView
              user={user}
              onNavigate={handleNavigate}
              onOpenQR={openQR}
              onOpenBotInspector={openBotInspector}
            />
          )}

          {currentPath === '/dashboard/create' && (
            <CreateLinkView
              user={user}
              onNavigate={handleNavigate}
              siteDomain={siteConfig.site_domain}
            />
          )}

          {currentPath === '/dashboard/links' && (
            <MyLinksView
              user={user}
              onOpenQR={openQR}
              onOpenBotInspector={openBotInspector}
              siteDomain={siteConfig.site_domain}
            />
          )}

          {currentPath === '/dashboard/password' && (
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
              siteDomain={siteConfig.site_domain}
            />
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
    </div>
  );
}
