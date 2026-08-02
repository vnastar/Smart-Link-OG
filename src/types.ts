export type UserRole = 'admin' | 'user';
export type UserStatus = 'active' | 'blocked';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  daily_limit: number;
  status: UserStatus;
  must_change_password: boolean;
  created_at: string;
  updated_at: string;
}

export interface LinkItem {
  id: string;
  user_id: string;
  user_name?: string;
  slug: string;
  destination_url: string;
  title: string;
  description: string;
  image: string;
  og_url?: string;
  og_type?: string;
  og_site_name?: string;
  clicks: number;
  status?: 'active' | 'disabled';
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SiteSettings {
  site_name: string;
  site_domain: string;
  default_limit: number;
  register_enable: boolean;
  upload_enable: boolean;
  default_redirect: '301' | '302';
  logo: string;
  favicon: string;
  bot_list: string;
  cloudflare_turnstile_enable?: boolean;
  cloudflare_site_key?: string;
  cloudflare_secret_key?: string;
  default_expiration_days?: number;
  allow_unlimited_expiration?: boolean;
  max_expiration_days?: number;
}

export interface VisitLog {
  id: string;
  link_id: string;
  slug: string;
  ip: string;
  country: string;
  referer: string;
  browser: string;
  device: string;
  is_bot: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_name?: string;
  action: string;
  details: string;
  ip: string;
  created_at: string;
}

export interface UserStats {
  created_today: number;
  daily_limit: number;
  total_links: number;
  total_clicks: number;
}

export interface AdminStats {
  total_users: number;
  total_links: number;
  clicks_today: number;
  total_clicks: number;
  new_users_today: number;
}

export interface BotSimulationResult {
  is_bot: boolean;
  matched_agent?: string;
  status_code: number;
  html_preview?: string;
  redirect_url?: string;
}
