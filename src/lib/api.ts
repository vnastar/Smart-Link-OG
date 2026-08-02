import { User, UserRole, UserStatus, LinkItem, SiteSettings, UserStats, AdminStats, AuditLog, VisitLog, BotSimulationResult } from '../types.js';

const TOKEN_KEY = 'smart_link_og_token';

// Determine API Base URL dynamically
const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined' && (window as any).API_BASE_URL) {
    return String((window as any).API_BASE_URL).replace(/\/+$/, '');
  }
  const viteUrl = (import.meta as any).env?.VITE_API_URL;
  if (viteUrl) {
    return String(viteUrl).replace(/\/+$/, '');
  }
  return '';
};

export const api = {
  getToken(): string | null {
    try {
      const raw = localStorage.getItem(TOKEN_KEY);
      if (!raw || raw === 'null' || raw === 'undefined') return null;
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

  async request(path: string, options: RequestInit = {}): Promise<any> {
    const baseUrl = getApiBaseUrl();
    const url = baseUrl ? `${baseUrl}${path.startsWith('/') ? path : '/' + path}` : path;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {})
    };

    const token = this.getToken();
    if (token) {
      const cleanToken = String(token).replace(/[^\x21-\x7E]/g, '').trim();
      if (cleanToken) {
        headers['Authorization'] = `Bearer ${cleanToken}`;
      }
    }

    let res: Response;
    try {
      res = await fetch(url, {
        ...options,
        headers
      });
    } catch (err: any) {
      if (err?.name === 'SyntaxError' || err?.name === 'DOMException' || String(err).includes('pattern')) {
        throw new Error('Không thể kết nối đến máy chủ API. Vui lòng kiểm tra địa chỉ backend server.');
      }
      throw new Error('Lỗi kết nối máy chủ backend. Vui lòng kiểm tra lại kết nối mạng.');
    }

    const contentType = res.headers.get('content-type') || '';
    let data: any = {};

    if (contentType.includes('application/json')) {
      try {
        data = await res.json();
      } catch {
        data = {};
      }
    } else {
      const text = await res.text();
      if (!res.ok) {
        if (text.includes('<!DOCTYPE') || text.includes('<html')) {
          if (res.status === 404) {
            throw new Error(`Lỗi 404: Đường dẫn API '${path}' không tìm thấy trên Hostinger. Nguyên nhân: Hostinger đang phục vụ web tĩnh thay vì chuyển tiếp yêu cầu /api đến ứng dụng Node.js backend. Vui lòng kiểm tra mục 'Setup Node.js App' trong hPanel hoặc đặt window.API_BASE_URL trong index.html.`);
          }
          throw new Error(`Máy chủ trả về trang HTML thay vì JSON (Mã lỗi ${res.status}). Vui lòng kiểm tra lại cấu hình ứng dụng Node.js backend.`);
        }
        throw new Error(text || `Yêu cầu thất bại với mã lỗi ${res.status}`);
      }
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Dữ liệu máy chủ trả về không đúng định dạng JSON.');
      }
    }

    if (!res.ok) {
      const err: any = new Error(data.error || `Yêu cầu thất bại (${res.status})`);
      err.code = data.code;
      err.created_today = data.created_today;
      err.daily_limit = data.daily_limit;
      throw err;
    }

    return data;
  },

  // Public config
  async getPublicConfig(): Promise<{
    site_name: string;
    site_domain: string;
    register_enable?: boolean;
    upload_enable?: boolean;
    logo?: string;
    favicon?: string;
    cloudflare_turnstile_enable?: boolean;
    cloudflare_site_key?: string;
    default_expiration_days?: number;
    allow_unlimited_expiration?: boolean;
    max_expiration_days?: number;
  }> {
    try {
      return await this.request('/api/public/config');
    } catch {
      try {
        return await this.request('/api/public-settings');
      } catch {
        return { site_name: 'Smart Link OG', site_domain: window.location.origin };
      }
    }
  },

  // Auth
  async login(username: string, password: string, cfTurnstileResponse?: string): Promise<{ token: string; user: User }> {
    const cleanUsername = String(username || '').trim();
    const cleanPassword = String(password || '');
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: cleanUsername,
        password: cleanPassword,
        cf_turnstile_response: cfTurnstileResponse
      })
    });
    if (data?.token) {
      this.setToken(data.token);
    }
    return data;
  },

  async register(username: string, email: string, password: string): Promise<{ token: string; user: User }> {
    const cleanUsername = String(username || '').trim();
    const cleanEmail = String(email || '').trim();
    const cleanPassword = String(password || '');
    const data = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username: cleanUsername, email: cleanEmail, password: cleanPassword })
    });
    if (data?.token) {
      this.setToken(data.token);
    }
    return data;
  },

  async getMe(): Promise<User> {
    const data = await this.request('/api/auth/me');
    return data.user;
  },

  async changePassword(current_password?: string, new_password?: string): Promise<{ user: User }> {
    return this.request('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ current_password, new_password })
    });
  },

  logout() {
    this.clearToken();
  },

  // User Dashboard
  async getUserStats(): Promise<UserStats> {
    return this.request('/api/user/stats');
  },

  async getLinks(search?: string): Promise<LinkItem[]> {
    const path = search ? `/api/links?search=${encodeURIComponent(search)}` : '/api/links';
    const data = await this.request(path);
    return data.links;
  },

  async checkSlug(slug: string): Promise<boolean> {
    const data = await this.request('/api/links/check-slug', {
      method: 'POST',
      body: JSON.stringify({ slug })
    });
    return data.available;
  },

  async createLink(payload: {
    destination_url: string;
    slug?: string;
    title?: string;
    description?: string;
    image?: string;
    og_url?: string;
    og_type?: string;
    og_site_name?: string;
    expires_at?: string | null;
  }): Promise<LinkItem> {
    const data = await this.request('/api/links', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return data.link;
  },

  async updateLink(id: string, payload: Partial<LinkItem>): Promise<LinkItem> {
    const data = await this.request(`/api/links/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    return data.link;
  },

  async deleteLink(id: string): Promise<void> {
    await this.request(`/api/links/${id}`, {
      method: 'DELETE'
    });
  },

  async uploadImage(imageBase64: string, fileName?: string): Promise<string> {
    const data = await this.request('/api/upload', {
      method: 'POST',
      body: JSON.stringify({ image_base64: imageBase64, file_name: fileName })
    });
    return data.url;
  },

  async simulateBot(slug: string, userAgent: string): Promise<BotSimulationResult> {
    return this.request('/api/simulate-bot', {
      method: 'POST',
      body: JSON.stringify({ slug, user_agent: userAgent })
    });
  },

  // Admin
  async getAdminStats(): Promise<AdminStats> {
    return this.request('/api/admin/stats');
  },

  async getAdminLinks(search?: string): Promise<LinkItem[]> {
    const path = search ? `/api/admin/links?search=${encodeURIComponent(search)}` : '/api/admin/links';
    const data = await this.request(path);
    return data.links;
  },

  async bulkUpdateLinks(payload: {
    ids: string[];
    status?: 'active' | 'disabled';
    expires_at?: string | null;
    remove_expiration?: boolean;
  }): Promise<{ message: string; updatedCount: number }> {
    return this.request('/api/admin/links/bulk-update', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async bulkDeleteLinks(ids: string[]): Promise<{ message: string; deletedCount: number }> {
    return this.request('/api/admin/links/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids })
    });
  },

  async getAdminUsers(): Promise<User[]> {
    const data = await this.request('/api/admin/users');
    return data.users;
  },

  async createAdminUser(payload: {
    username: string;
    email: string;
    password: string;
    role?: UserRole;
    daily_limit?: number;
    status?: UserStatus;
    must_change_password?: boolean;
    default_expiration_days?: number | null;
    allow_unlimited_expiration?: boolean | null;
    max_expiration_days?: number | null;
  }): Promise<{ message: string; user: User }> {
    return this.request('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async updateAdminUser(id: string, updates: Partial<User>): Promise<User> {
    const data = await this.request(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    return data.user;
  },

  async resetUserPassword(id: string, new_password?: string): Promise<string> {
    const data = await this.request(`/api/admin/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ new_password })
    });
    return data.message;
  },

  async deleteAdminUser(id: string): Promise<void> {
    await this.request(`/api/admin/users/${id}`, {
      method: 'DELETE'
    });
  },

  async getAdminSettings(): Promise<SiteSettings> {
    const data = await this.request('/api/admin/settings');
    return data.settings;
  },

  async updateAdminSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
    const data = await this.request('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
    return data.settings;
  },

  async testTurnstileConfig(cfTurnstileResponse: string, secretKey?: string): Promise<{ success: boolean; message: string }> {
    return this.request('/api/admin/verify-turnstile-test', {
      method: 'POST',
      body: JSON.stringify({
        cf_turnstile_response: cfTurnstileResponse,
        secret_key: secretKey
      })
    });
  },

  async getAdminLogs(): Promise<{ visits: VisitLog[]; logs: AuditLog[] }> {
    return this.request('/api/admin/logs');
  }
};
