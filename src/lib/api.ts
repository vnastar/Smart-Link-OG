import { User, LinkItem, SiteSettings, UserStats, AdminStats, AuditLog, VisitLog, BotSimulationResult } from '../types.js';

const TOKEN_KEY = 'smart_link_og_token';

export const api = {
  getToken(): string | null {
    try {
      const raw = localStorage.getItem(TOKEN_KEY);
      if (!raw || raw === 'null' || raw === 'undefined') return null;
      // Strip any non-printable ASCII or control characters
      const clean = raw.replace(/[^\x20-\x7E]/g, '').trim();
      return clean || null;
    } catch {
      return null;
    }
  },

  setToken(token: string) {
    try {
      if (token) {
        const clean = String(token).replace(/[^\x20-\x7E]/g, '').trim();
        localStorage.setItem(TOKEN_KEY, clean);
      } else {
        this.clearToken();
      }
    } catch (e) {
      console.error('Failed to set token', e);
    }
  },

  clearToken() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (e) {
      console.error('Failed to clear token', e);
    }
  },

  async headers(): Promise<Record<string, string>> {
    const token = this.getToken();
    const h: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      const safeToken = String(token).replace(/[^\x21-\x7E]/g, '');
      if (safeToken) {
        h['Authorization'] = `Bearer ${safeToken}`;
      }
    }
    return h;
  },

  // Auth
  async login(username: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.trim(), password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    }
    this.setToken(data.token);
    return data;
  },

  async register(username: string, email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Đăng ký thất bại');
    this.setToken(data.token);
    return data;
  },

  async getMe(): Promise<User> {
    const headers = await this.headers();
    const res = await fetch('/api/auth/me', { headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể lấy thông tin tài khoản');
    return data.user;
  },

  async changePassword(current_password?: string, new_password?: string): Promise<{ user: User }> {
    const headers = await this.headers();
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers,
      body: JSON.stringify({ current_password, new_password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Đổi mật khẩu thất bại');
    return data;
  },

  logout() {
    this.clearToken();
  },

  // User Dashboard
  async getUserStats(): Promise<UserStats> {
    const headers = await this.headers();
    const res = await fetch('/api/user/stats', { headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi tải thống kê');
    return data;
  },

  async getLinks(search?: string): Promise<LinkItem[]> {
    const headers = await this.headers();
    const url = search ? `/api/links?search=${encodeURIComponent(search)}` : '/api/links';
    const res = await fetch(url, { headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi tải danh sách link');
    return data.links;
  },

  async checkSlug(slug: string): Promise<boolean> {
    const headers = await this.headers();
    const res = await fetch('/api/links/check-slug', {
      method: 'POST',
      headers,
      body: JSON.stringify({ slug })
    });
    const data = await res.json();
    return data.available;
  },

  async createLink(payload: {
    destination_url: string;
    slug?: string;
    title?: string;
    description?: string;
    image?: string;
    expires_at?: string | null;
  }): Promise<LinkItem> {
    const headers = await this.headers();
    const res = await fetch('/api/links', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      const err: any = new Error(data.error || 'Tạo link thất bại');
      err.code = data.code;
      err.created_today = data.created_today;
      err.daily_limit = data.daily_limit;
      throw err;
    }
    return data.link;
  },

  async updateLink(id: string, payload: Partial<LinkItem>): Promise<LinkItem> {
    const headers = await this.headers();
    const res = await fetch(`/api/links/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Cập nhật link thất bại');
    return data.link;
  },

  async deleteLink(id: string): Promise<void> {
    const headers = await this.headers();
    const res = await fetch(`/api/links/${id}`, {
      method: 'DELETE',
      headers
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Xóa link thất bại');
  },

  async uploadImage(imageBase64: string, fileName?: string): Promise<string> {
    const headers = await this.headers();
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers,
      body: JSON.stringify({ image_base64: imageBase64, file_name: fileName })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload ảnh thất bại');
    return data.url;
  },

  async simulateBot(slug: string, userAgent: string): Promise<BotSimulationResult> {
    const res = await fetch('/api/simulate-bot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, user_agent: userAgent })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi giả lập bot');
    return data;
  },

  // Admin
  async getAdminStats(): Promise<AdminStats> {
    const headers = await this.headers();
    const res = await fetch('/api/admin/stats', { headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi tải thống kê quản trị');
    return data;
  },

  async getAdminUsers(): Promise<User[]> {
    const headers = await this.headers();
    const res = await fetch('/api/admin/users', { headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi tải danh sách người dùng');
    return data.users;
  },

  async updateAdminUser(id: string, updates: Partial<User>): Promise<User> {
    const headers = await this.headers();
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Cập nhật tài khoản thất bại');
    return data.user;
  },

  async resetUserPassword(id: string, new_password?: string): Promise<string> {
    const headers = await this.headers();
    const res = await fetch(`/api/admin/users/${id}/reset-password`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ new_password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Reset mật khẩu thất bại');
    return data.message;
  },

  async deleteAdminUser(id: string): Promise<void> {
    const headers = await this.headers();
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'DELETE',
      headers
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Xóa tài khoản thất bại');
  },

  async getAdminSettings(): Promise<SiteSettings> {
    const headers = await this.headers();
    const res = await fetch('/api/admin/settings', { headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi tải cấu hình');
    return data.settings;
  },

  async updateAdminSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
    const headers = await this.headers();
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers,
      body: JSON.stringify(settings)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Cập nhật cấu hình thất bại');
    return data.settings;
  },

  async getAdminLogs(): Promise<{ visits: VisitLog[]; logs: AuditLog[] }> {
    const headers = await this.headers();
    const res = await fetch('/api/admin/logs', { headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi tải nhật ký hệ thống');
    return data;
  },

  async getPublicConfig(): Promise<{ site_name: string; site_domain: string; register_enable: boolean; logo: string; favicon: string }> {
    const res = await fetch('/api/public/config');
    return res.json();
  }
};