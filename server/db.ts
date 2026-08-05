import fs from 'fs';
import path from 'path';
import { User, LinkItem, SiteSettings, VisitLog, AuditLog } from '../src/types.js';
import { mysqlService, type UserStore } from './mysql.js';

export type { UserStore };

interface DatabaseSchema {
  users: UserStore[];
  links: LinkItem[];
  settings: SiteSettings;
  visits: VisitLog[];
  logs: AuditLog[];
}

const DB_PATH = path.join(process.cwd(), 'data', 'store.json');

const DEFAULT_BOT_LIST = [
  'facebookexternalhit',
  'facebot',
  'twitterbot',
  'discordbot',
  'telegrambot',
  'linkedinbot',
  'slackbot',
  'whatsapp',
  'pinterest',
  'googleinspectiontool',
  'bingbot',
  'googlebot',
  'applebot',
  'yandex',
  'duckduckbot',
  'baiduspider',
  'skypeuripreview',
  'vkshare',
  'outbrain',
  'zalo',
  'viber'
].join(', ');

const DEFAULT_SETTINGS: SiteSettings = {
  site_name: 'Smart Link OG',
  site_domain: '',
  default_limit: 3,
  register_enable: true,
  upload_enable: true,
  default_redirect: '302',
  logo: '',
  favicon: '',
  bot_list: DEFAULT_BOT_LIST,
  cloudflare_turnstile_enable: false,
  cloudflare_site_key: '',
  cloudflare_secret_key: '',
  recaptcha_enable: false,
  recaptcha_site_key: '',
  recaptcha_secret_key: '',
  recaptcha_version: 'v2_checkbox',
  captcha_provider: 'recaptcha',
  default_expiration_days: 0,
  allow_unlimited_expiration: true,
  max_expiration_days: 0,
  private_mode_enable: false,
  custom_login_path: '/login'
};

const SEED_DATA: DatabaseSchema = {
  users: [
    {
      id: 'usr_admin',
      username: 'admin',
      email: 'admin@vnastar.com',
      password_hash: 'admin',
      role: 'admin',
      daily_limit: 9999,
      status: 'active',
      must_change_password: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'usr_demo',
      username: 'user',
      email: 'user@vnastar.com',
      password_hash: 'user123',
      role: 'user',
      daily_limit: 3,
      status: 'active',
      must_change_password: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  links: [
    {
      id: 'lnk_video01',
      user_id: 'usr_admin',
      user_name: 'admin',
      slug: 'video01',
      destination_url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
      title: 'Hướng dẫn Rút gọn Link Smart OG chuyên nghiệp',
      description: 'Công cụ rút gọn link thông minh hiển thị ảnh OpenGraph trên Facebook, Zalo, Telegram cực chuẩn.',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      clicks: 42,
      status: 'active',
      expires_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'lnk_demo02',
      user_id: 'usr_demo',
      user_name: 'user',
      slug: 'P8Hsj9',
      destination_url: 'https://vnexpress.net',
      title: 'Trang tin tức tổng hợp VnExpress',
      description: 'Cập nhật tin tức mới nhất trong ngày tại Việt Nam và thế giới.',
      image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80',
      clicks: 15,
      status: 'active',
      expires_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  settings: DEFAULT_SETTINGS,
  visits: [],
  logs: []
};

class DBManager {
  private data: DatabaseSchema;
  public isUsingMySQL = false;

  constructor() {
    this.data = this.loadLocal();
    this.initMySQLSync();
  }

  public async initMySQLSync() {
    const success = await mysqlService.checkAndSeedTables();
    if (success) {
      this.isUsingMySQL = true;
      console.log('⚡ Đang đồng bộ hóa dữ liệu từ MySQL Database...');
      await this.reloadFromMySQL();
    } else {
      this.isUsingMySQL = false;
      console.log('📁 Sử dụng Bộ lưu trữ File JSON (data/store.json).');
    }
    return success;
  }

  public async reloadFromMySQL() {
    if (!mysqlService.isConnected) return;
    try {
      const users = await mysqlService.fetchAllUsers();
      const links = await mysqlService.fetchAllLinks();
      const settings = await mysqlService.fetchSettings();
      const visits = await mysqlService.fetchAllVisits();
      const logs = await mysqlService.fetchAllLogs();

      if (users.length > 0) this.data.users = users;
      if (links.length > 0) this.data.links = links;
      if (settings) this.data.settings = settings;
      if (visits.length > 0) this.data.visits = visits;
      if (logs.length > 0) this.data.logs = logs;

      console.log('✅ Đã tải thành công dữ liệu từ MySQL!');
    } catch (e) {
      console.error('❌ Lỗi khi tải dữ liệu từ MySQL:', e);
    }
  }

  public reloadLocal() {
    this.data = this.loadLocal();
  }

  private loadLocal(): DatabaseSchema {
    try {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify(SEED_DATA, null, 2), 'utf-8');
        return SEED_DATA;
      }
      const raw = fs.readFileSync(DB_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        users: parsed.users || SEED_DATA.users,
        links: parsed.links || SEED_DATA.links,
        settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
        visits: parsed.visits || [],
        logs: parsed.logs || []
      };
    } catch (e) {
      console.error('Failed to read db file, using seeds', e);
      return SEED_DATA;
    }
  }

  private save() {
    try {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write db file', e);
    }
  }

  // User Operations
  getUsers(): User[] {
    return this.data.users.map(({ password_hash, ...u }) => u);
  }

  getUserStoreById(id: string): UserStore | undefined {
    return this.data.users.find(u => u.id === id);
  }

  getUserByUsername(identifier: string): UserStore | undefined {
    if (!identifier) return undefined;
    const query = identifier.trim().toLowerCase();
    return this.data.users.find(u => u.username.toLowerCase() === query || u.email.toLowerCase() === query);
  }

  getUserByEmail(email: string): UserStore | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  createUser(user: Omit<UserStore, 'id' | 'created_at' | 'updated_at'>): User {
    const newUser: UserStore = {
      ...user,
      id: 'usr_' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.data.users.push(newUser);
    this.save();

    if (mysqlService.isConnected) {
      mysqlService.saveUser(newUser);
    }

    const { password_hash, ...publicUser } = newUser;
    return publicUser;
  }

  updateUser(id: string, updates: Partial<UserStore>): User | undefined {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return undefined;

    this.data.users[idx] = {
      ...this.data.users[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.save();

    if (mysqlService.isConnected) {
      mysqlService.saveUser(this.data.users[idx]);
    }

    const { password_hash, ...publicUser } = this.data.users[idx];
    return publicUser;
  }

  deleteUser(id: string): boolean {
    const initialLen = this.data.users.length;
    this.data.users = this.data.users.filter(u => u.id !== id);
    this.data.links = this.data.links.filter(l => l.user_id !== id);
    this.save();

    if (mysqlService.isConnected) {
      mysqlService.deleteUser(id);
    }

    return this.data.users.length < initialLen;
  }

  // Links Operations
  getLinks(): LinkItem[] {
    return this.data.links;
  }

  getLinksByUserId(userId: string): LinkItem[] {
    return this.data.links.filter(l => l.user_id === userId);
  }

  getLinkBySlug(slug: string): LinkItem | undefined {
    return this.data.links.find(l => l.slug.toLowerCase() === slug.toLowerCase());
  }

  getLinkById(id: string): LinkItem | undefined {
    return this.data.links.find(l => l.id === id);
  }

  countLinksCreatedTodayByUser(userId: string): number {
    const today = new Date().toISOString().split('T')[0];
    return this.data.links.filter(l => {
      if (l.user_id !== userId) return false;
      const createdDate = new Date(l.created_at).toISOString().split('T')[0];
      return createdDate === today;
    }).length;
  }

  createLink(link: Omit<LinkItem, 'id' | 'clicks' | 'created_at' | 'updated_at'>): LinkItem {
    const user = this.data.users.find(u => u.id === link.user_id);
    const newLink: LinkItem = {
      ...link,
      id: 'lnk_' + Math.random().toString(36).substr(2, 9),
      user_name: user ? user.username : 'Unknown',
      clicks: 0,
      status: link.status || 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.data.links.unshift(newLink);
    this.save();

    if (mysqlService.isConnected) {
      mysqlService.saveLink(newLink);
    }

    return newLink;
  }

  updateLink(id: string, updates: Partial<LinkItem>): LinkItem | undefined {
    const idx = this.data.links.findIndex(l => l.id === id);
    if (idx === -1) return undefined;
    this.data.links[idx] = {
      ...this.data.links[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.save();

    if (mysqlService.isConnected) {
      mysqlService.saveLink(this.data.links[idx]);
    }

    return this.data.links[idx];
  }

  deleteLink(id: string): boolean {
    const len = this.data.links.length;
    this.data.links = this.data.links.filter(l => l.id !== id);
    this.save();

    if (mysqlService.isConnected) {
      mysqlService.deleteLink(id);
    }

    return this.data.links.length < len;
  }

  incrementLinkClicks(id: string) {
    const link = this.data.links.find(l => l.id === id);
    if (link) {
      link.clicks += 1;
      this.save();

      if (mysqlService.isConnected) {
        mysqlService.incrementClicks(id);
      }
    }
  }

  // Settings
  getSettings(): SiteSettings {
    return this.data.settings;
  }

  updateSettings(updates: Partial<SiteSettings>): SiteSettings {
    this.data.settings = { ...this.data.settings, ...updates };
    this.save();

    if (mysqlService.isConnected) {
      mysqlService.saveSettings(this.data.settings);
    }

    return this.data.settings;
  }

  // Visits
  recordVisit(visit: Omit<VisitLog, 'id' | 'created_at'>): VisitLog {
    const newVisit: VisitLog = {
      ...visit,
      id: 'vst_' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    this.data.visits.unshift(newVisit);
    if (this.data.visits.length > 5000) {
      this.data.visits = this.data.visits.slice(0, 5000);
    }
    this.save();

    if (mysqlService.isConnected) {
      mysqlService.saveVisit(newVisit);
    }

    return newVisit;
  }

  getVisits(): VisitLog[] {
    return this.data.visits;
  }

  // Logs
  addLog(userId: string, action: string, details: string, ip: string): AuditLog {
    const user = this.data.users.find(u => u.id === userId);
    const newLog: AuditLog = {
      id: 'log_' + Math.random().toString(36).substr(2, 9),
      user_id: userId,
      user_name: user ? user.username : 'System',
      action,
      details,
      ip,
      created_at: new Date().toISOString()
    };
    this.data.logs.unshift(newLog);
    if (this.data.logs.length > 1000) {
      this.data.logs = this.data.logs.slice(0, 1000);
    }
    this.save();

    if (mysqlService.isConnected) {
      mysqlService.saveLog(newLog);
    }

    return newLog;
  }

  getLogs(): AuditLog[] {
    return this.data.logs;
  }

  // Helper random slug generator
  generateRandomSlug(length = 6): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    do {
      result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.getLinkBySlug(result));
    return result;
  }
}

export const db = new DBManager();
