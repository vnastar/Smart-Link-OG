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
  default_expiration_days?: number | null;
  allow_unlimited_expiration?: boolean | null;
  max_expiration_days?: number | null;
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
  redirect_code?: number;
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
  recaptcha_enable?: boolean;
  recaptcha_site_key?: string;
  recaptcha_secret_key?: string;
  recaptcha_version?: 'v2_checkbox' | 'v2_invisible' | 'v3';
  captcha_provider?: 'recaptcha' | 'turnstile' | 'both';
  default_expiration_days?: number;
  allow_unlimited_expiration?: boolean;
  max_expiration_days?: number;
  private_mode_enable?: boolean;
  custom_login_path?: string;
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

export interface DistributionStat {
  name: string;
  count: number;
  percentage: number;
  color?: string;
}

export interface RegionStat {
  name: string;
  count: number;
  percentage: number;
  color?: string;
}

export interface LinkAnalyticsStat {
  link_id: string;
  slug: string;
  title: string;
  total_clicks: number;
  human_clicks: number;
  bot_clicks: number;
  top_region?: string;
  top_device?: string;
  top_channel?: string;
}

export interface AnalyticsData {
  total_clicks: number;
  human_clicks: number;
  bot_clicks: number;
  human_percent: number;
  bot_percent: number;
  regions: RegionStat[];
  devices: DistributionStat[];
  referrers: DistributionStat[];
  browsers: DistributionStat[];
  hourly_trend: { hour: string; human: number; bot: number }[];
  recent_visits?: VisitLog[];
  links_breakdown?: LinkAnalyticsStat[];
}

export interface BotSimulationResult {
  is_bot: boolean;
  matched_agent?: string;
  status_code: number;
  html_preview?: string;
  redirect_url?: string;
}

export interface AdminImageData {
  filename: string;
  url: string;
  relative_url: string;
  size: number;
  created_at: string;
  used_by_links: {
    id: string;
    slug: string;
    title: string;
    user_name?: string;
  }[];
  is_orphaned: boolean;
}

export interface AdminImagesResponse {
  total_files: number;
  total_size_bytes: number;
  orphaned_count: number;
  orphaned_size_bytes: number;
  images: AdminImageData[];
}
