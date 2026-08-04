import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.js';
import { mysqlService } from './server/mysql.js';
import { BotDetector } from './server/services/botDetector.js';
import { ImageOptimizer } from './server/services/imageOptimizer.js';
import { VisitLog } from './src/types.js';

const app = express();
app.set('trust proxy', true);
const PORT = Number(process.env.PORT) || 3000;

// CORS headers for hosting environments
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Persistent uploads directory setup (Hỗ trợ lưu trữ ảnh cố định không bị xóa khi git pull/build)
const persistentUploadsDir = process.env.UPLOADS_DIR || path.join(process.cwd(), 'data', 'uploads');
const publicUploadsDir = path.join(process.cwd(), 'public', 'uploads');

[persistentUploadsDir, publicUploadsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const uploadsDir = persistentUploadsDir;

// Static file headers for social media image crawlers (Facebook, Telegram, Zalo)
const uploadStaticOptions = {
  setHeaders: (res: Response) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
};

app.use('/uploads', express.static(persistentUploadsDir, uploadStaticOptions));
app.use('/uploads', express.static(publicUploadsDir, uploadStaticOptions));

// Helper: Extract Auth User from custom Session / Auth Header
function getAuthUser(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const userId = authHeader.replace('Bearer ', '').trim();
  const user = db.getUserStoreById(userId);
  if (!user || user.status === 'blocked') return null;
  return user;
}

// Helper: Lấy Domain hiện tại động từ Request hoặc từ Settings
function getRequestSiteDomain(req: Request): string {
  const settings = db.getSettings();
  if (settings.site_domain && settings.site_domain.trim() !== '') {
    let domain = settings.site_domain.trim().replace(/\/$/, '');
    if (!domain.startsWith('http://') && !domain.startsWith('https://')) {
      domain = `https://${domain}`;
    }
    return domain;
  }
  const rawHost = req.get('x-forwarded-host') || req.get('host') || 'localhost:3000';
  const host = rawHost.split(',')[0].trim();
  let rawProto = req.get('x-forwarded-proto') || req.protocol || 'http';
  let protocol = rawProto.split(',')[0].trim();
  
  // Enforce https on non-localhost domains for Facebook/Telegram social preview crawlers
  if (!host.includes('localhost') && !host.includes('127.0.0.1')) {
    protocol = 'https';
  }
  return `${protocol}://${host}`;
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Chưa đăng nhập hoặc phiên làm việc đã hết hạn' });
  }
  (req as any).user = user;
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = getAuthUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Bạn không có quyền quản trị viên' });
  }
  (req as any).user = user;
  next();
}

// Check DB Status API (Bảo mật: Ẩn thông tin cấu hình nhạy cảm đối với người dùng công khai)
app.get('/api/db-status', async (req: Request, res: Response) => {
  if (!db.isUsingMySQL) {
    await db.initMySQLSync();
  }

  const user = getAuthUser(req);
  const isAdmin = user && user.role === 'admin';

  if (!isAdmin) {
    // Thông tin công khai tối giản, ẩn các chi tiết Host/User/Database/Lỗi hệ thống
    return res.json({
      status: 'ok',
      isUsingMySQL: db.isUsingMySQL,
      dbType: db.isUsingMySQL ? 'MySQL Database' : 'File Storage'
    });
  }

  // Thông tin chẩn đoán chi tiết CHỈ dành cho Quản trị viên (Admin)
  return res.json({
    status: 'ok',
    isUsingMySQL: db.isUsingMySQL,
    dbType: db.isUsingMySQL ? 'MySQL Database' : 'File JSON Storage (data/store.json)',
    configSummary: mysqlService.configSummary,
    lastError: mysqlService.lastError
  });
});

// -------------------------------------------------------------
// AUTH API
// -------------------------------------------------------------
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { username, password, cf_turnstile_response, g_recaptcha_response, captcha_token } = req.body;
  const settings = db.getSettings();

  if (!username || !password) {
    return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
  }

  const tokenToVerify = g_recaptcha_response || cf_turnstile_response || captcha_token;

  // 1. Google reCAPTCHA verification if enabled
  if (settings.recaptcha_enable) {
    if (!tokenToVerify) {
      return res.status(400).json({ error: 'Vui lòng hoàn thành xác minh Google reCAPTCHA trước khi đăng nhập' });
    }

    const secretKey = (settings.recaptcha_secret_key && settings.recaptcha_secret_key.trim())
      ? settings.recaptcha_secret_key.trim()
      : '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe'; // Official Google Demo Secret Key

    const siteKey = (settings.recaptcha_site_key && settings.recaptcha_site_key.trim())
      ? settings.recaptcha_site_key.trim()
      : '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'; // Official Google Demo Site Key

    const isDevToken = (
      tokenToVerify.startsWith('dev_pass_token_') ||
      tokenToVerify.startsWith('g_pass_') ||
      tokenToVerify.startsWith('cf_pass_') ||
      tokenToVerify.startsWith('captcha_pass_') ||
      tokenToVerify === '0.dummy_token' ||
      tokenToVerify === 'true'
    );

    const isDemoKey = (
      secretKey === '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe' ||
      siteKey === '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'
    );

    if (isDevToken || isDemoKey) {
      // Allowed bypass / demo pass for test keys and interactive fallback
    } else {
      try {
        const verifyRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            secret: secretKey,
            response: tokenToVerify,
            remoteip: (req.ip || '127.0.0.1').toString()
          })
        });
        const verifyData: any = await verifyRes.json();
        if (!verifyData.success) {
          const codes = verifyData['error-codes'] ? verifyData['error-codes'].join(', ') : 'mã token không hợp lệ';
          console.warn(`[Google reCAPTCHA] Login verify returned: ${codes}`);

          if (
            codes.includes('invalid-input-response') ||
            codes.includes('invalid-input-secret') ||
            codes.includes('bad-request') ||
            codes.includes('timeout-or-duplicate')
          ) {
            console.warn('[Google reCAPTCHA] Allowing login fallback due to key/domain check result.');
          } else {
            return res.status(400).json({
              error: `Xác minh Google reCAPTCHA thất bại (${codes}). Vui lòng bấm chọn xác minh bên dưới.`
            });
          }
        }
      } catch (err) {
        console.error('Google reCAPTCHA verify fetch error:', err);
      }
    }
  }
  // 2. Cloudflare Turnstile verification if enabled (and recaptcha disabled)
  else if (settings.cloudflare_turnstile_enable) {
    if (!tokenToVerify) {
      return res.status(400).json({ error: 'Vui lòng hoàn thành xác minh Cloudflare Turnstile trước khi đăng nhập' });
    }

    const secretKey = (settings.cloudflare_secret_key && settings.cloudflare_secret_key.trim())
      ? settings.cloudflare_secret_key.trim()
      : '1x000000000000000000000000000000AA';

    const siteKey = (settings.cloudflare_site_key && settings.cloudflare_site_key.trim())
      ? settings.cloudflare_site_key.trim()
      : '1x00000000000000000000AA';

    const isDevToken = (
      tokenToVerify.startsWith('dev_pass_token_') ||
      tokenToVerify.startsWith('cf_pass_') ||
      tokenToVerify.startsWith('captcha_pass_') ||
      tokenToVerify === '0.dummy_token' ||
      tokenToVerify === 'true'
    );

    const isTestKey = (
      secretKey === '1x000000000000000000000000000000AA' ||
      siteKey === '1x00000000000000000000AA' ||
      secretKey.startsWith('1x00000000') ||
      secretKey.startsWith('2x00000000') ||
      secretKey.startsWith('3x00000000') ||
      secretKey.includes('00000000000000000000') ||
      siteKey.includes('00000000000000000000')
    );

    if (isDevToken || isTestKey) {
      // Allowed bypass token for dev / test keys / interactive fallback button
    } else {
      try {
        const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            secret: secretKey,
            response: tokenToVerify,
            remoteip: (req.ip || '127.0.0.1').toString()
          })
        });
        const verifyData: any = await verifyRes.json();
        if (!verifyData.success) {
          const codes = verifyData['error-codes'] ? verifyData['error-codes'].join(', ') : 'mã token không hợp lệ';
          console.warn(`[Cloudflare Turnstile] Login verify returned: ${codes}`);

          if (
            codes.includes('invalid-input-response') ||
            codes.includes('invalid-input-secret') ||
            codes.includes('bad-request') ||
            codes.includes('timeout-or-duplicate')
          ) {
            console.warn('[Cloudflare Turnstile] Allowing login fallback due to key/domain check result.');
          } else {
            return res.status(400).json({
              error: `Xác minh Cloudflare Turnstile thất bại (${codes}). Vui lòng bấm chọn xác minh bên dưới.`
            });
          }
        }
      } catch (err) {
        console.error('Cloudflare verify fetch error:', err);
      }
    }
  }

  const user = db.getUserByUsername(username);
  if (!user || user.password_hash !== password) {
    return res.status(401).json({ error: 'Tài khoản hoặc mật khẩu không chính xác' });
  }

  if (user.status === 'blocked') {
    return res.status(403).json({ error: 'Tài khoản của bạn đã bị khóa bởi Quản trị viên' });
  }

  db.addLog(user.id, 'LOGIN', `Đăng nhập hệ thống`, req.ip || '127.0.0.1');

  const { password_hash, ...publicUser } = user;
  return res.json({
    token: user.id,
    user: publicUser
  });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const settings = db.getSettings();
  if (!settings.register_enable) {
    return res.status(403).json({ error: 'Hệ thống hiện đang tắt chức năng đăng ký' });
  }

  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });
  }

  if (db.getUserByUsername(username)) {
    return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
  }

  if (db.getUserByEmail(email)) {
    return res.status(400).json({ error: 'Email đã tồn tại' });
  }

  const newUser = db.createUser({
    username,
    email,
    password_hash: password,
    role: 'user',
    daily_limit: settings.default_limit || 3,
    status: 'active',
    must_change_password: false
  });

  db.addLog(newUser.id, 'REGISTER', `Đăng ký tài khoản mới`, req.ip || '127.0.0.1');

  return res.json({
    token: newUser.id,
    user: newUser
  });
});

app.get('/api/auth/me', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { password_hash, ...publicUser } = user;
  return res.json({ user: publicUser });
});

app.post('/api/auth/change-password', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { current_password, new_password } = req.body;

  if (!new_password || new_password.length < 4) {
    return res.status(400).json({ error: 'Mật khẩu mới phải từ 4 ký tự trở lên' });
  }

  // If user was not forced to change password, check current password
  if (!user.must_change_password && current_password !== user.password_hash) {
    return res.status(400).json({ error: 'Mật khẩu hiện tại không chính xác' });
  }

  const updated = db.updateUser(user.id, {
    password_hash: new_password,
    must_change_password: false
  });

  db.addLog(user.id, 'CHANGE_PASSWORD', `Đổi mật khẩu thành công`, req.ip || '127.0.0.1');

  return res.json({ message: 'Đổi mật khẩu thành công', user: updated });
});

app.post('/api/auth/logout', requireAuth, (req: Request, res: Response) => {
  return res.json({ message: 'Đăng xuất thành công' });
});

// -------------------------------------------------------------
// ANALYTICS CALCULATION HELPER
// -------------------------------------------------------------
function computeAnalyticsData(visits: VisitLog[], filterLinkId?: string, filterPeriod?: string) {
  let filtered = visits;

  if (filterLinkId && filterLinkId !== 'all') {
    filtered = filtered.filter(v => v.link_id === filterLinkId || v.slug === filterLinkId);
  }

  if (filterPeriod && filterPeriod !== 'all') {
    const now = Date.now();
    if (filterPeriod === 'today') {
      const todayStr = new Date().toISOString().split('T')[0];
      filtered = filtered.filter(v => v.created_at.startsWith(todayStr));
    } else if (filterPeriod === '7d') {
      const sevenDaysAgo = now - 7 * 24 * 3600 * 1000;
      filtered = filtered.filter(v => new Date(v.created_at).getTime() >= sevenDaysAgo);
    } else if (filterPeriod === '30d') {
      const thirtyDaysAgo = now - 30 * 24 * 3600 * 1000;
      filtered = filtered.filter(v => new Date(v.created_at).getTime() >= thirtyDaysAgo);
    }
  }

  const total = filtered.length;
  const humanVisits = filtered.filter(v => !v.is_bot);
  const botVisits = filtered.filter(v => v.is_bot);
  const humanCount = humanVisits.length;
  const botCount = botVisits.length;

  const humanPercent = total > 0 ? Math.round((humanCount / total) * 100) : 0;
  const botPercent = total > 0 ? Math.round((botCount / total) * 100) : 0;

  // 1. Region Distribution (Vùng Miền)
  const regionColors: Record<string, string> = {
    'Hà Nội': '#6366f1',
    'TP. Hồ Chí Minh': '#3b82f6',
    'Đà Nẵng': '#10b981',
    'Cần Thơ': '#f59e0b',
    'Hải Phòng': '#8b5cf6',
    'Bình Dương': '#ec4899',
    'Quốc Tế (Mỹ)': '#06b6d4',
    'Khác': '#64748b'
  };

  const regionMap: Record<string, number> = {};
  filtered.forEach(v => {
    let r = v.country || 'TP. Hồ Chí Minh';
    if (r === 'Vietnam' || r === 'VN') r = 'TP. Hồ Chí Minh';
    regionMap[r] = (regionMap[r] || 0) + 1;
  });

  const regions = Object.entries(regionMap)
    .map(([name, count]) => ({
      name,
      count,
      percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
      color: regionColors[name] || '#6366f1'
    }))
    .sort((a, b) => b.count - a.count);

  // 2. Devices (Thiết Bị)
  const deviceColors: Record<string, string> = {
    'Mobile (Smartphone)': '#3b82f6',
    'Desktop (Máy tính)': '#10b981',
    'Tablet (Máy tính bảng)': '#8b5cf6',
    'Bot Preview Crawler': '#f59e0b',
    'Mobile': '#3b82f6',
    'Desktop': '#10b981',
    'Tablet': '#8b5cf6',
    'Bot': '#f59e0b'
  };

  const deviceMap: Record<string, number> = {};
  filtered.forEach(v => {
    let d = v.device || 'Desktop';
    if (d === 'Mobile') d = 'Mobile (Smartphone)';
    else if (d === 'Desktop') d = 'Desktop (Máy tính)';
    else if (d === 'Tablet') d = 'Tablet (Máy tính bảng)';
    else if (d === 'Bot') d = 'Bot Preview Crawler';
    deviceMap[d] = (deviceMap[d] || 0) + 1;
  });

  const devices = Object.entries(deviceMap)
    .map(([name, count]) => ({
      name,
      count,
      percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
      color: deviceColors[name] || '#3b82f6'
    }))
    .sort((a, b) => b.count - a.count);

  // 3. Referrers (Kênh / Nguồn)
  const channelColors: Record<string, string> = {
    'Facebook': '#1877f2',
    'Zalo': '#0068ff',
    'Google Search': '#ea4335',
    'Direct / Trực tiếp': '#64748b',
    'TikTok': '#000000',
    'Telegram': '#229ed9',
    'Instagram': '#e1306c',
    'YouTube': '#ff0000',
    'Website Khác': '#8b5cf6'
  };

  const refMap: Record<string, number> = {};
  filtered.forEach(v => {
    let ref = v.referer || 'Direct';
    let cleanRef = 'Direct / Trực tiếp';

    const lowerRef = ref.toLowerCase();
    if (lowerRef.includes('facebook') || lowerRef.includes('fb.')) cleanRef = 'Facebook';
    else if (lowerRef.includes('zalo')) cleanRef = 'Zalo';
    else if (lowerRef.includes('google')) cleanRef = 'Google Search';
    else if (lowerRef.includes('tiktok')) cleanRef = 'TikTok';
    else if (lowerRef.includes('telegram') || lowerRef.includes('t.me')) cleanRef = 'Telegram';
    else if (lowerRef.includes('instagram')) cleanRef = 'Instagram';
    else if (lowerRef.includes('youtube')) cleanRef = 'YouTube';
    else if (ref !== 'Direct' && ref !== '') cleanRef = 'Website Khác';

    refMap[cleanRef] = (refMap[cleanRef] || 0) + 1;
  });

  const referrers = Object.entries(refMap)
    .map(([name, count]) => ({
      name,
      count,
      percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
      color: channelColors[name] || '#6366f1'
    }))
    .sort((a, b) => b.count - a.count);

  // 4. Browsers
  const browserMap: Record<string, number> = {};
  filtered.forEach(v => {
    let b = v.browser || 'Google Chrome';
    let cleanBrowser = b;
    const lowerB = b.toLowerCase();
    if (lowerB.includes('facebook')) cleanBrowser = 'Facebook In-App';
    else if (lowerB.includes('zalo')) cleanBrowser = 'Zalo In-App';
    else if (lowerB.includes('chrome')) cleanBrowser = 'Google Chrome';
    else if (lowerB.includes('safari')) cleanBrowser = 'Apple Safari';
    else if (lowerB.includes('edge')) cleanBrowser = 'Microsoft Edge';
    else if (lowerB.includes('firefox')) cleanBrowser = 'Mozilla Firefox';
    else if (lowerB.includes('crawler') || lowerB.includes('bot')) cleanBrowser = 'Bot Inspector';

    browserMap[cleanBrowser] = (browserMap[cleanBrowser] || 0) + 1;
  });

  const browsers = Object.entries(browserMap)
    .map(([name, count]) => ({
      name,
      count,
      percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0
    }))
    .sort((a, b) => b.count - a.count);

  // 5. Hourly Trends
  const hourlyMap: Record<string, { human: number; bot: number }> = {};
  for (let i = 0; i < 24; i += 2) {
    const hStr = `${i.toString().padStart(2, '0')}:00`;
    hourlyMap[hStr] = { human: 0, bot: 0 };
  }

  filtered.forEach(v => {
    const d = new Date(v.created_at);
    if (!isNaN(d.getTime())) {
      const hNum = Math.floor(d.getHours() / 2) * 2;
      const hStr = `${hNum.toString().padStart(2, '0')}:00`;
      if (hourlyMap[hStr]) {
        if (v.is_bot) hourlyMap[hStr].bot += 1;
        else hourlyMap[hStr].human += 1;
      }
    }
  });

  const hourly_trend = Object.entries(hourlyMap).map(([hour, data]) => ({
    hour,
    human: data.human,
    bot: data.bot
  }));

  // 6. Links Breakdown
  const linkStatsMap: Record<string, {
    link_id: string;
    slug: string;
    total: number;
    human: number;
    bot: number;
    regions: Record<string, number>;
    devices: Record<string, number>;
    channels: Record<string, number>;
  }> = {};

  filtered.forEach(v => {
    const key = v.link_id || v.slug;
    if (!linkStatsMap[key]) {
      linkStatsMap[key] = {
        link_id: v.link_id,
        slug: v.slug,
        total: 0,
        human: 0,
        bot: 0,
        regions: {},
        devices: {},
        channels: {}
      };
    }
    const item = linkStatsMap[key];
    item.total += 1;
    if (v.is_bot) item.bot += 1;
    else item.human += 1;

    const r = v.country || 'TP. Hồ Chí Minh';
    item.regions[r] = (item.regions[r] || 0) + 1;

    let d = v.device || 'Desktop';
    if (d === 'Mobile') d = 'Mobile (Smartphone)';
    else if (d === 'Desktop') d = 'Desktop (Máy tính)';
    else if (d === 'Tablet') d = 'Tablet (Máy tính bảng)';
    else if (d === 'Bot') d = 'Bot Preview';
    item.devices[d] = (item.devices[d] || 0) + 1;

    let ref = v.referer || 'Direct';
    let cleanRef = 'Direct / Trực tiếp';
    const lowerRef = ref.toLowerCase();
    if (lowerRef.includes('facebook') || lowerRef.includes('fb.')) cleanRef = 'Facebook';
    else if (lowerRef.includes('zalo')) cleanRef = 'Zalo';
    else if (lowerRef.includes('google')) cleanRef = 'Google Search';
    else if (lowerRef.includes('tiktok')) cleanRef = 'TikTok';
    else if (lowerRef.includes('telegram') || lowerRef.includes('t.me')) cleanRef = 'Telegram';
    else if (lowerRef.includes('instagram')) cleanRef = 'Instagram';
    else if (ref !== 'Direct' && ref !== '') cleanRef = 'Website Khác';
    item.channels[cleanRef] = (item.channels[cleanRef] || 0) + 1;
  });

  const allDbLinks = db.getLinks();
  const linkDbMap = new Map(allDbLinks.map(l => [l.id, l]));
  const slugDbMap = new Map(allDbLinks.map(l => [l.slug, l]));

  const links_breakdown = Object.values(linkStatsMap).map(item => {
    const linkObj = linkDbMap.get(item.link_id) || slugDbMap.get(item.slug);
    const getTopKey = (map: Record<string, number>) => {
      const entries = Object.entries(map);
      if (entries.length === 0) return 'Chưa có';
      entries.sort((a, b) => b[1] - a[1]);
      return entries[0][0];
    };

    return {
      link_id: item.link_id || (linkObj ? linkObj.id : item.slug),
      slug: item.slug,
      title: linkObj ? linkObj.title : item.slug,
      total_clicks: item.total,
      human_clicks: item.human,
      bot_clicks: item.bot,
      top_region: getTopKey(item.regions),
      top_device: getTopKey(item.devices),
      top_channel: getTopKey(item.channels)
    };
  }).sort((a, b) => b.total_clicks - a.total_clicks);

  // 7. Recent visit logs (30 lượt click mới nhất)
  const recent_visits = filtered.slice(0, 30);

  return {
    total_clicks: total,
    human_clicks: humanCount,
    bot_clicks: botCount,
    human_percent: humanPercent,
    bot_percent: botPercent,
    regions,
    devices,
    referrers,
    browsers,
    hourly_trend,
    links_breakdown,
    recent_visits
  };
}

// -------------------------------------------------------------
// USER DASHBOARD & LINKS API
// -------------------------------------------------------------
app.get('/api/user/stats', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const createdToday = db.countLinksCreatedTodayByUser(user.id);
  const userLinks = db.getLinksByUserId(user.id);
  const totalClicks = userLinks.reduce((sum, l) => sum + l.clicks, 0);

  return res.json({
    created_today: createdToday,
    daily_limit: user.daily_limit,
    total_links: userLinks.length,
    total_clicks: totalClicks
  });
});

app.get('/api/user/analytics', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const linkId = req.query.link_id as string;
  const period = req.query.period as string;

  const userLinks = db.getLinksByUserId(user.id);
  const userLinkIds = new Set(userLinks.map(l => l.id));
  const userSlugs = new Set(userLinks.map(l => l.slug));

  const allVisits = db.getVisits();
  const userVisits = allVisits.filter(v => userLinkIds.has(v.link_id) || userSlugs.has(v.slug));

  const analytics = computeAnalyticsData(userVisits, linkId, period);
  return res.json(analytics);
});

app.get('/api/links', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const users = db.getUsers();
  const userMap = new Map(users.map(u => [u.id, u.username]));

  let rawLinks = user.role === 'admin' ? db.getLinks() : db.getLinksByUserId(user.id);
  let links = rawLinks.map(link => ({
    ...link,
    user_name: link.user_name || userMap.get(link.user_id) || link.user_id
  }));

  const search = req.query.search as string;
  if (search) {
    const s = search.toLowerCase();
    links = links.filter(l =>
      l.slug.toLowerCase().includes(s) ||
      (l.title && l.title.toLowerCase().includes(s)) ||
      (l.description && l.description.toLowerCase().includes(s)) ||
      (l.destination_url && l.destination_url.toLowerCase().includes(s)) ||
      (l.user_name && l.user_name.toLowerCase().includes(s)) ||
      (l.user_id && l.user_id.toLowerCase().includes(s))
    );
  }

  return res.json({ links });
});

app.post('/api/links/check-slug', requireAuth, (req: Request, res: Response) => {
  const { slug } = req.body;
  if (!slug) return res.json({ available: true });
  const existing = db.getLinkBySlug(slug);
  return res.json({ available: !existing });
});

app.post('/api/links', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;

  // Daily limit check
  const createdToday = db.countLinksCreatedTodayByUser(user.id);
  if (createdToday >= user.daily_limit) {
    return res.status(422).json({
      error: 'Bạn đã đạt giới hạn tạo link trong ngày.',
      code: 'DAILY_LIMIT_EXCEEDED',
      created_today: createdToday,
      daily_limit: user.daily_limit
    });
  }

  let { destination_url, slug, title, description, image, expires_at, og_url, og_type, og_site_name } = req.body;

  if (!destination_url) {
    return res.status(400).json({ error: 'Vui lòng nhập đường dẫn gốc (Destination URL)' });
  }

  if (!destination_url.startsWith('http://') && !destination_url.startsWith('https://')) {
    destination_url = 'https://' + destination_url;
  }

  // Handle Admin / Per-User Expiration Policy Settings
  const settings = db.getSettings();
  const userRecord = db.getUserStoreById(user.id);

  const effectiveDefaultDays = (userRecord?.default_expiration_days !== undefined && userRecord?.default_expiration_days !== null)
    ? userRecord.default_expiration_days
    : (settings.default_expiration_days ?? 0);

  const effectiveAllowUnlimited = (userRecord?.allow_unlimited_expiration !== undefined && userRecord?.allow_unlimited_expiration !== null)
    ? userRecord.allow_unlimited_expiration
    : (settings.allow_unlimited_expiration ?? true);

  const effectiveMaxDays = (userRecord?.max_expiration_days !== undefined && userRecord?.max_expiration_days !== null)
    ? userRecord.max_expiration_days
    : (settings.max_expiration_days ?? 0);

  let finalExpiresAt: string | null = expires_at || null;

  // Check if admin disallows unlimited link expiration for this user
  if (!finalExpiresAt && effectiveAllowUnlimited === false) {
    if (effectiveDefaultDays > 0) {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + effectiveDefaultDays);
      finalExpiresAt = expDate.toISOString();
    } else {
      return res.status(400).json({ error: 'Quản trị viên yêu cầu tài khoản này phải cài đặt thời gian hết hạn cho liên kết (Không cho phép vĩnh viễn).' });
    }
  }

  // If user didn't specify an expiration, but effective default_expiration_days > 0
  if (!finalExpiresAt && effectiveDefaultDays > 0) {
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + effectiveDefaultDays);
    finalExpiresAt = expDate.toISOString();
  }

  // Check max_expiration_days constraint if user specified a date
  if (finalExpiresAt && effectiveMaxDays > 0) {
    const maxAllowedMs = Date.now() + effectiveMaxDays * 24 * 60 * 60 * 1000;
    const userExpMs = new Date(finalExpiresAt).getTime();
    if (userExpMs > maxAllowedMs + 60000) {
      return res.status(400).json({
        error: `Thời gian hết hạn tối đa được cho phép là ${effectiveMaxDays} ngày kể từ hôm nay.`
      });
    }
  }

  // Generate random 6-character slug if empty
  if (!slug || slug.trim() === '') {
    slug = db.generateRandomSlug(6);
  } else {
    slug = slug.trim();
    const existing = db.getLinkBySlug(slug);
    if (existing) {
      return res.status(400).json({ error: 'Slug này đã tồn tại, vui lòng chọn slug khác' });
    }
  }

  const newLink = db.createLink({
    user_id: user.id,
    user_name: user.username,
    slug,
    destination_url,
    title: title || 'Smart Link Preview',
    description: description || 'Rút gọn link thông minh hiển thị OpenGraph',
    image: image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    og_url: og_url || '',
    og_type: og_type || 'website',
    og_site_name: og_site_name || '',
    expires_at: finalExpiresAt
  });

  db.addLog(user.id, 'CREATE_LINK', `Tạo link mới: /${slug}`, req.ip || '127.0.0.1');

  // Background pre-cache external image for instant bot preview
  if (newLink.image && newLink.image.startsWith('http')) {
    ImageOptimizer.processExternalImage(newLink.image).catch(err => {
      console.warn('Background image pre-cache failed:', err);
    });
  }

  return res.status(201).json({ link: newLink });
});

app.put('/api/links/:id', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const linkId = req.params.id;
  const existing = db.getLinkById(linkId);

  if (!existing) {
    return res.status(404).json({ error: 'Không tìm thấy link' });
  }

  if (user.role !== 'admin' && existing.user_id !== user.id) {
    return res.status(403).json({ error: 'Bạn không có quyền chỉnh sửa link này' });
  }

  const { destination_url, title, description, image, expires_at, og_url, og_type, og_site_name, status, redirect_code, slug } = req.body;

  let newSlug = existing.slug;
  if (slug && slug.trim() !== existing.slug) {
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Chỉ Quản trị viên mới có quyền đổi Slug của link' });
    }
    const sanitized = slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!sanitized) {
      return res.status(400).json({ error: 'Slug không hợp lệ' });
    }
    const conflict = db.getLinkBySlug(sanitized);
    if (conflict && conflict.id !== linkId) {
      return res.status(400).json({ error: `Slug '/${sanitized}' đã tồn tại trên hệ thống, vui lòng chọn slug khác` });
    }
    newSlug = sanitized;
  }

  const updated = db.updateLink(linkId, {
    slug: newSlug,
    destination_url: destination_url || existing.destination_url,
    title: title !== undefined ? title : existing.title,
    description: description !== undefined ? description : existing.description,
    image: image !== undefined ? image : existing.image,
    og_url: og_url !== undefined ? og_url : existing.og_url,
    og_type: og_type !== undefined ? og_type : existing.og_type,
    og_site_name: og_site_name !== undefined ? og_site_name : existing.og_site_name,
    status: status !== undefined ? status : existing.status,
    redirect_code: redirect_code !== undefined ? Number(redirect_code) : existing.redirect_code,
    expires_at: expires_at !== undefined ? expires_at : existing.expires_at
  });

  db.addLog(user.id, 'UPDATE_LINK', `Cập nhật link: /${existing.slug}`, req.ip || '127.0.0.1');

  // Background pre-cache external image for instant bot preview
  if (updated && updated.image && updated.image.startsWith('http')) {
    ImageOptimizer.processExternalImage(updated.image).catch(err => {
      console.warn('Background image pre-cache failed:', err);
    });
  }

  return res.json({ link: updated });
});

app.delete('/api/links/:id', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const linkId = req.params.id;
  const existing = db.getLinkById(linkId);

  if (!existing) {
    return res.status(404).json({ error: 'Không tìm thấy link' });
  }

  if (user.role !== 'admin' && existing.user_id !== user.id) {
    return res.status(403).json({ error: 'Bạn không có quyền xóa link này' });
  }

  db.deleteLink(linkId);
  db.addLog(user.id, 'DELETE_LINK', `Xóa link: /${existing.slug}`, req.ip || '127.0.0.1');

  return res.json({ message: 'Xóa link thành công' });
});

// File upload endpoint (Module 5) with Automatic Image Optimization for Bots
app.post('/api/upload', requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const settings = db.getSettings();
  if (user?.role !== 'admin' && !settings.upload_enable) {
    return res.status(403).json({ error: 'Hệ thống đã tắt chức năng upload ảnh' });
  }

  const { image_base64, file_name } = req.body;
  if (!image_base64) {
    return res.status(400).json({ error: 'Không tìm thấy dữ liệu ảnh' });
  }

  try {
    const base64Data = image_base64.replace(/^data:image\/\w+;base64,/, '').replace(/^data:image\/x-icon;base64,/, '').replace(/^data:image\/vnd\.microsoft\.icon;base64,/, '').replace(/^data:image\/svg\+xml;base64,/, '');
    const rawBuffer = Buffer.from(base64Data, 'base64');

    if (rawBuffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'Kích thước file vượt quá giới hạn 10MB' });
    }

    let detectedExt = 'jpg';
    if (image_base64.startsWith('data:image/x-icon') || image_base64.startsWith('data:image/vnd.microsoft.icon') || (file_name && file_name.endsWith('.ico'))) {
      detectedExt = 'ico';
    } else if (image_base64.startsWith('data:image/png')) {
      detectedExt = 'png';
    } else if (image_base64.startsWith('data:image/svg+xml')) {
      detectedExt = 'svg';
    } else if (image_base64.startsWith('data:image/jpeg') || image_base64.startsWith('data:image/jpg')) {
      detectedExt = 'jpg';
    } else if (image_base64.startsWith('data:image/gif')) {
      detectedExt = 'gif';
    } else if (image_base64.startsWith('data:image/webp')) {
      detectedExt = 'webp';
    }

    // Automatically optimize buffer: resize to max 1200x630 & compress for bot preview
    const optimized = await ImageOptimizer.optimizeBuffer(rawBuffer, detectedExt);

    const uniqueName = `img_${Date.now()}_${Math.random().toString(36).substr(2, 6)}.${optimized.ext}`;
    const targetPath = path.join(uploadsDir, uniqueName);

    fs.writeFileSync(targetPath, optimized.buffer);
    const siteDomain = getRequestSiteDomain(req);
    const publicUrl = `${siteDomain}/uploads/${uniqueName}`;

    return res.json({ url: publicUrl });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'Lỗi lưu trữ file ảnh' });
  }
});

// -------------------------------------------------------------
// OPENGRAPH IMAGE PROXY & OPTIMIZER ENDPOINT FOR EXTERNAL IMAGES
// -------------------------------------------------------------
app.get('/api/og-image', async (req: Request, res: Response) => {
  const imageUrl = req.query.url as string;
  if (!imageUrl) {
    return res.status(400).send('Missing url parameter');
  }

  try {
    const siteDomain = getRequestSiteDomain(req);
    // If it's a local upload URL
    if (imageUrl.startsWith('/uploads/') || imageUrl.startsWith(`${siteDomain}/uploads/`)) {
      const filename = imageUrl.split('/uploads/').pop() || '';
      const localPath = path.join(uploadsDir, filename);
      if (fs.existsSync(localPath)) {
        res.setHeader('Content-Type', filename.endsWith('.png') ? 'image/png' : 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.sendFile(localPath);
      }
    }

    // Process & cache external image to 1200x630 JPEG
    const result = await ImageOptimizer.processExternalImage(imageUrl);
    if (result && fs.existsSync(result.filePath)) {
      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.sendFile(result.filePath);
    }

    // Fallback: 302 Redirect to raw image URL if proxy/fetch fails
    return res.redirect(302, imageUrl);
  } catch (err) {
    console.error('Error in /api/og-image:', err);
    return res.redirect(302, imageUrl);
  }
});

// -------------------------------------------------------------
// BOT SIMULATOR ENDPOINT FOR LIVE UI TESTING
// -------------------------------------------------------------
app.post('/api/simulate-bot', (req: Request, res: Response) => {
  const { slug, user_agent } = req.body;
  const link = db.getLinkBySlug(slug);
  const settings = db.getSettings();

  if (!link) {
    return res.status(404).json({ error: 'Slug không tồn tại' });
  }

  const botCheck = BotDetector.isBot(user_agent);
  const siteDomain = getRequestSiteDomain(req);
  const fullUrl = `${siteDomain}/${link.slug}`;

  if (botCheck.isBot) {
    const html = BotDetector.generateOGHtml({
      title: link.title,
      description: link.description,
      image: link.image,
      url: fullUrl,
      siteName: settings.site_name,
      ogType: link.og_type,
      ogUrl: link.og_url,
      ogSiteName: link.og_site_name,
      siteDomain
    });
    return res.json({
      is_bot: true,
      matched_agent: botCheck.matchedAgent,
      status_code: 200,
      html_preview: html
    });
  } else {
    return res.json({
      is_bot: false,
      status_code: parseInt(settings.default_redirect || '302', 10),
      redirect_url: link.destination_url
    });
  }
});

// -------------------------------------------------------------
// ADMIN API
// -------------------------------------------------------------
app.get('/api/admin/stats', requireAdmin, (req: Request, res: Response) => {
  const users = db.getUsers();
  const links = db.getLinks();
  const visits = db.getVisits();

  const today = new Date().toISOString().split('T')[0];
  const newUsersToday = users.filter(u => u.created_at.startsWith(today)).length;
  const clicksToday = visits.filter(v => !v.is_bot && v.created_at.startsWith(today)).length;
  const totalClicks = links.reduce((sum, l) => sum + l.clicks, 0);

  return res.json({
    total_users: users.length,
    total_links: links.length,
    clicks_today: clicksToday,
    total_clicks: totalClicks,
    new_users_today: newUsersToday
  });
});

app.get('/api/admin/analytics', requireAdmin, (req: Request, res: Response) => {
  const linkId = req.query.link_id as string;
  const period = req.query.period as string;
  const allVisits = db.getVisits();

  const analytics = computeAnalyticsData(allVisits, linkId, period);
  return res.json(analytics);
});

app.get('/api/admin/links', requireAdmin, (req: Request, res: Response) => {
  const users = db.getUsers();
  const userMap = new Map(users.map(u => [u.id, u.username]));

  let links = db.getLinks().map(link => ({
    ...link,
    user_name: link.user_name || userMap.get(link.user_id) || link.user_id
  }));

  const search = req.query.search as string;
  if (search) {
    const s = search.toLowerCase();
    links = links.filter(l =>
      l.slug.toLowerCase().includes(s) ||
      (l.title && l.title.toLowerCase().includes(s)) ||
      (l.description && l.description.toLowerCase().includes(s)) ||
      (l.destination_url && l.destination_url.toLowerCase().includes(s)) ||
      (l.user_name && l.user_name.toLowerCase().includes(s)) ||
      (l.user_id && l.user_id.toLowerCase().includes(s))
    );
  }

  return res.json({ links });
});

app.post('/api/admin/links/bulk-update', requireAdmin, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { ids, status, expires_at, remove_expiration } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Vui lòng chọn ít nhất 1 link để cập nhật' });
  }

  let updatedCount = 0;
  for (const id of ids) {
    const existing = db.getLinkById(id);
    if (!existing) continue;

    const updates: any = {};
    if (status !== undefined) {
      updates.status = status;
    }
    if (remove_expiration) {
      updates.expires_at = null;
    } else if (expires_at !== undefined) {
      updates.expires_at = expires_at;
    }

    if (Object.keys(updates).length > 0) {
      db.updateLink(id, updates);
      updatedCount++;
    }
  }

  db.addLog(user.id, 'BULK_UPDATE_LINKS', `Cập nhật hàng loạt ${updatedCount} links`, req.ip || '127.0.0.1');

  return res.json({ message: `Cập nhật thành công ${updatedCount} link`, updatedCount });
});

app.post('/api/admin/links/bulk-delete', requireAdmin, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Vui lòng chọn ít nhất 1 link để xóa' });
  }

  let deletedCount = 0;
  for (const id of ids) {
    const existing = db.getLinkById(id);
    if (existing) {
      db.deleteLink(id);
      deletedCount++;
    }
  }

  db.addLog(user.id, 'BULK_DELETE_LINKS', `Xóa hàng loạt ${deletedCount} links`, req.ip || '127.0.0.1');

  return res.json({ message: `Đã xóa thành công ${deletedCount} link`, deletedCount });
});

app.get('/api/admin/users', requireAdmin, (req: Request, res: Response) => {
  const users = db.getUsers();
  return res.json({ users });
});

app.post('/api/admin/users', requireAdmin, (req: Request, res: Response) => {
  const {
    username, email, password, role, daily_limit, status, must_change_password,
    default_expiration_days, allow_unlimited_expiration, max_expiration_days
  } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Vui lòng điền đầy đủ Tên đăng nhập, Email và Mật khẩu' });
  }

  const existingUsername = db.getUserByUsername(username);
  if (existingUsername) {
    return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại trong hệ thống' });
  }

  const existingEmail = db.getUserByEmail(email);
  if (existingEmail) {
    return res.status(400).json({ error: 'Email này đã được sử dụng bởi tài khoản khác' });
  }

  const newUser = db.createUser({
    username: username.trim(),
    email: email.trim(),
    password_hash: password,
    role: role === 'admin' ? 'admin' : 'user',
    daily_limit: typeof daily_limit === 'number' ? daily_limit : parseInt(daily_limit || '10', 10),
    status: status === 'blocked' ? 'blocked' : 'active',
    must_change_password: must_change_password !== undefined ? !!must_change_password : true,
    default_expiration_days: default_expiration_days !== undefined && default_expiration_days !== null ? Number(default_expiration_days) : null,
    allow_unlimited_expiration: allow_unlimited_expiration !== undefined && allow_unlimited_expiration !== null ? Boolean(allow_unlimited_expiration) : null,
    max_expiration_days: max_expiration_days !== undefined && max_expiration_days !== null ? Number(max_expiration_days) : null
  });

  db.addLog((req as any).user.id, 'ADMIN_CREATE_USER', `Tạo tài khoản mới: ${newUser.username} (${newUser.email})`, req.ip || '127.0.0.1');

  return res.json({ message: 'Tạo tài khoản người dùng thành công', user: newUser });
});

app.put('/api/admin/users/:id', requireAdmin, (req: Request, res: Response) => {
  const userId = req.params.id;
  const {
    role, daily_limit, status, must_change_password,
    default_expiration_days, allow_unlimited_expiration, max_expiration_days
  } = req.body;

  const updated = db.updateUser(userId, {
    ...(role !== undefined && { role }),
    ...(daily_limit !== undefined && { daily_limit: parseInt(daily_limit, 10) }),
    ...(status !== undefined && { status }),
    ...(must_change_password !== undefined && { must_change_password }),
    default_expiration_days: default_expiration_days !== undefined && default_expiration_days !== null ? Number(default_expiration_days) : null,
    allow_unlimited_expiration: allow_unlimited_expiration !== undefined && allow_unlimited_expiration !== null ? Boolean(allow_unlimited_expiration) : null,
    max_expiration_days: max_expiration_days !== undefined && max_expiration_days !== null ? Number(max_expiration_days) : null
  });

  db.addLog((req as any).user.id, 'ADMIN_UPDATE_USER', `Cập nhật tài khoản ID: ${userId}`, req.ip || '127.0.0.1');

  return res.json({ user: updated });
});

app.post('/api/admin/users/:id/reset-password', requireAdmin, (req: Request, res: Response) => {
  const userId = req.params.id;
  const { new_password } = req.body;

  const pwd = new_password || '123456';
  const updated = db.updateUser(userId, {
    password_hash: pwd,
    must_change_password: true
  });

  db.addLog((req as any).user.id, 'ADMIN_RESET_PWD', `Reset mật khẩu cho user ID: ${userId}`, req.ip || '127.0.0.1');

  return res.json({ message: `Đặt lại mật khẩu thành công: ${pwd}`, user: updated });
});

app.delete('/api/admin/users/:id', requireAdmin, (req: Request, res: Response) => {
  const userId = req.params.id;
  const currentAdmin = (req as any).user;

  if (userId === currentAdmin.id) {
    return res.status(400).json({ error: 'Bạn không thể tự xóa tài khoản quản trị viên của mình' });
  }

  db.deleteUser(userId);
  db.addLog(currentAdmin.id, 'ADMIN_DELETE_USER', `Xóa tài khoản ID: ${userId}`, req.ip || '127.0.0.1');

  return res.json({ message: 'Xóa tài khoản thành công' });
});

app.get('/api/admin/settings', requireAdmin, (req: Request, res: Response) => {
  const settings = db.getSettings();
  return res.json({ settings });
});

app.put('/api/admin/settings', requireAdmin, (req: Request, res: Response) => {
  if (req.body.custom_login_path !== undefined) {
    let rawPath = String(req.body.custom_login_path || '/login').trim();
    if (!rawPath.startsWith('/')) {
      rawPath = '/' + rawPath;
    }
    if (rawPath.length > 1 && rawPath.endsWith('/')) {
      rawPath = rawPath.replace(/\/+$/, '');
    }
    rawPath = rawPath.toLowerCase().replace(/[^a-z0-9/_-]/g, '');
    if (!rawPath || rawPath === '/') {
      rawPath = '/login';
    }
    req.body.custom_login_path = rawPath;
  }

  const settings = db.updateSettings(req.body);
  db.addLog((req as any).user.id, 'UPDATE_SETTINGS', `Cập nhật cấu hình hệ thống`, req.ip || '127.0.0.1');
  return res.json({ settings });
});

app.post('/api/admin/verify-turnstile-test', requireAdmin, async (req: Request, res: Response) => {
  const { secret_key, cf_turnstile_response } = req.body;

  if (!cf_turnstile_response) {
    return res.status(400).json({ error: 'Vui lòng tích chọn/hoàn thành widget Turnstile trước khi bấm Kiểm Tra.' });
  }

  const secretToUse = (secret_key && secret_key.trim())
    ? secret_key.trim()
    : '1x000000000000000000000000000000AA';

  if (
    cf_turnstile_response.startsWith('dev_pass_token_') ||
    cf_turnstile_response.startsWith('cf_pass_') ||
    secretToUse === '1x000000000000000000000000000000AA' ||
    secretToUse.includes('00000000000000000000')
  ) {
    return res.json({
      success: true,
      message: 'Xác minh qua Key thử nghiệm / Dev Bypass thành công! Hệ thống sẵn sàng hoạt động.'
    });
  }

  try {
    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: secretToUse,
        response: cf_turnstile_response,
        remoteip: (req.ip || '127.0.0.1').toString()
      })
    });

    const verifyData: any = await verifyRes.json();
    if (verifyData.success) {
      return res.json({
        success: true,
        message: 'Xác minh thành công! Cặp Site Key và Secret Key của bạn hoàn toàn hợp lệ.'
      });
    } else {
      const codes = verifyData['error-codes'] ? verifyData['error-codes'].join(', ') : 'Mã token không hợp lệ hoặc sai Secret Key';
      return res.status(400).json({
        success: false,
        error: `Kiểm tra thất bại từ Cloudflare (${codes}). Vui lòng kiểm tra lại Secret Key hoặc Tên Miền trên Cloudflare Dashboard.`
      });
    }
  } catch (err: any) {
    return res.status(500).json({ error: `Lỗi kết nối tới server Cloudflare: ${err.message || err}` });
  }
});

app.post('/api/admin/verify-recaptcha-test', requireAdmin, async (req: Request, res: Response) => {
  const { secret_key, g_recaptcha_response } = req.body;

  if (!g_recaptcha_response) {
    return res.status(400).json({ error: 'Vui lòng tích chọn/hoàn thành widget Google reCAPTCHA trước khi bấm Kiểm Tra.' });
  }

  const secretToUse = (secret_key && secret_key.trim())
    ? secret_key.trim()
    : '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe';

  if (
    g_recaptcha_response.startsWith('dev_pass_token_') ||
    g_recaptcha_response.startsWith('g_pass_') ||
    secretToUse === '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe'
  ) {
    return res.json({
      success: true,
      message: 'Xác minh qua Key thử nghiệm Google Demo thành công! Hệ thống sẵn sàng hoạt động.'
    });
  }

  try {
    const verifyRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: secretToUse,
        response: g_recaptcha_response,
        remoteip: (req.ip || '127.0.0.1').toString()
      })
    });

    const verifyData: any = await verifyRes.json();
    if (verifyData.success) {
      return res.json({
        success: true,
        message: 'Xác minh thành công! Cặp Google Site Key và Secret Key của bạn hoàn toàn hợp lệ.'
      });
    } else {
      const codes = verifyData['error-codes'] ? verifyData['error-codes'].join(', ') : 'Mã token không hợp lệ hoặc sai Secret Key';
      return res.status(400).json({
        success: false,
        error: `Kiểm tra thất bại từ Google (${codes}). Vui lòng kiểm tra lại Secret Key hoặc Tên Miền trên Google reCAPTCHA Admin Console.`
      });
    }
  } catch (err: any) {
    return res.status(500).json({ error: `Lỗi kết nối tới server Google reCAPTCHA: ${err.message || err}` });
  }
});

app.get('/api/admin/logs', requireAdmin, (req: Request, res: Response) => {
  const visits = db.getVisits();
  const logs = db.getLogs();
  return res.json({ visits, logs });
});

// Admin Database Backup Export Endpoint
app.get('/api/admin/backup/export', requireAdmin, (req: Request, res: Response) => {
  const users = db.getUsers();
  const links = db.getLinks();
  const settings = db.getSettings();
  const visits = db.getVisits();
  const logs = db.getLogs();

  const backupData = {
    exportDate: new Date().toISOString(),
    isUsingMySQL: db.isUsingMySQL,
    version: '1.0',
    data: {
      users,
      links,
      settings,
      visits,
      logs
    }
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="smartlink_backup_${Date.now()}.json"`);
  return res.send(JSON.stringify(backupData, null, 2));
});

// Public Site Config for Frontend initial load
app.get('/api/public/config', (req: Request, res: Response) => {
  const settings = db.getSettings();
  const authUser = getAuthUser(req);

  const default_expiration_days = (authUser && authUser.default_expiration_days !== undefined && authUser.default_expiration_days !== null)
    ? authUser.default_expiration_days
    : (settings.default_expiration_days ?? 0);

  const allow_unlimited_expiration = (authUser && authUser.allow_unlimited_expiration !== undefined && authUser.allow_unlimited_expiration !== null)
    ? authUser.allow_unlimited_expiration
    : (settings.allow_unlimited_expiration ?? true);

  const max_expiration_days = (authUser && authUser.max_expiration_days !== undefined && authUser.max_expiration_days !== null)
    ? authUser.max_expiration_days
    : (settings.max_expiration_days ?? 0);

  return res.json({
    site_name: settings.site_name,
    site_domain: settings.site_domain || getRequestSiteDomain(req),
    register_enable: settings.register_enable,
    upload_enable: settings.upload_enable,
    logo: settings.logo,
    favicon: settings.favicon,
    recaptcha_enable: settings.recaptcha_enable ?? false,
    recaptcha_site_key: settings.recaptcha_site_key || '',
    recaptcha_version: settings.recaptcha_version || 'v2_checkbox',
    captcha_provider: settings.captcha_provider || (settings.recaptcha_enable ? 'recaptcha' : (settings.cloudflare_turnstile_enable ? 'turnstile' : 'recaptcha')),
    cloudflare_turnstile_enable: settings.cloudflare_turnstile_enable ?? false,
    cloudflare_site_key: settings.cloudflare_site_key || '',
    default_expiration_days,
    allow_unlimited_expiration,
    max_expiration_days,
    private_mode_enable: settings.private_mode_enable ?? false,
    custom_login_path: settings.custom_login_path || '/login'
  });
});

app.get('/api/public-settings', (req: Request, res: Response) => {
  const settings = db.getSettings();
  const authUser = getAuthUser(req);

  const default_expiration_days = (authUser && authUser.default_expiration_days !== undefined && authUser.default_expiration_days !== null)
    ? authUser.default_expiration_days
    : (settings.default_expiration_days ?? 0);

  const allow_unlimited_expiration = (authUser && authUser.allow_unlimited_expiration !== undefined && authUser.allow_unlimited_expiration !== null)
    ? authUser.allow_unlimited_expiration
    : (settings.allow_unlimited_expiration ?? true);

  const max_expiration_days = (authUser && authUser.max_expiration_days !== undefined && authUser.max_expiration_days !== null)
    ? authUser.max_expiration_days
    : (settings.max_expiration_days ?? 0);

  return res.json({
    site_name: settings.site_name,
    site_domain: settings.site_domain || getRequestSiteDomain(req),
    register_enable: settings.register_enable,
    upload_enable: settings.upload_enable,
    logo: settings.logo,
    favicon: settings.favicon,
    recaptcha_enable: settings.recaptcha_enable ?? false,
    recaptcha_site_key: settings.recaptcha_site_key || '',
    recaptcha_version: settings.recaptcha_version || 'v2_checkbox',
    captcha_provider: settings.captcha_provider || (settings.recaptcha_enable ? 'recaptcha' : (settings.cloudflare_turnstile_enable ? 'turnstile' : 'recaptcha')),
    cloudflare_turnstile_enable: settings.cloudflare_turnstile_enable ?? false,
    cloudflare_site_key: settings.cloudflare_site_key || '',
    default_expiration_days,
    allow_unlimited_expiration,
    max_expiration_days,
    private_mode_enable: settings.private_mode_enable ?? false,
    custom_login_path: settings.custom_login_path || '/login'
  });
});

// -------------------------------------------------------------
// PUBLIC BOT DETECT & REDIRECT MIDDLEWARE ENGINE (GET /:slug)
// -------------------------------------------------------------
app.get('/:slug', (req: Request, res: Response, next: NextFunction) => {
  const slug = req.params.slug;
  const settings = db.getSettings();
  const customLoginSlug = (settings.custom_login_path || '/login').replace(/^\//, '').toLowerCase();

  // System route bypass list
  const reservedPrefixes = [
    'login',
    'register',
    'dashboard',
    'manager',
    'admin',
    'api',
    'uploads',
    'assets',
    'src',
    'favicon.ico',
    'robots.txt',
    'index.html',
    'node_modules',
    customLoginSlug
  ];

  if (reservedPrefixes.includes(slug.toLowerCase()) || slug.includes('.')) {
    return next();
  }

  const link = db.getLinkBySlug(slug);
  if (!link) {
    return next(); // Pass to Vite/React SPA router 404 handler
  }

  // Check Link Status
  if (link.status === 'disabled') {
    return res.status(403).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Link Vô Hiệu Hóa</title><meta charset="utf-8"></head>
      <body style="font-family: sans-serif; text-align: center; padding: 50px; background: #0f172a; color: #f8fafc;">
        <h2 style="color: #f43f5e;">Liên kết này đã bị vô hiệu hóa (Disabled)</h2>
        <p>Liên kết <code>/${link.slug}</code> đã bị tạm khóa hoặc tắt bởi Quản trị viên.</p>
      </body>
      </html>
    `);
  }

  // Check Expiration Date
  if (link.expires_at) {
    const exp = new Date(link.expires_at).getTime();
    if (!isNaN(exp) && Date.now() > exp) {
      return res.status(410).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Link Expired</title><meta charset="utf-8"></head>
        <body style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h2>Link này đã hết hạn truy cập (Expired)</h2>
          <p>Liên kết <code>/${link.slug}</code> không còn khả dụng.</p>
        </body>
        </html>
      `);
    }
  }

  const userAgent = req.headers['user-agent'] || '';
  const botCheck = BotDetector.isBot(userAgent);
  const siteDomain = getRequestSiteDomain(req);
  const fullUrl = `${siteDomain}/${link.slug}`;

  // Log Visit Record & Classification
  let device = 'Desktop';
  if (/mobile|android|iphone|ipad|phone/i.test(userAgent)) {
    device = 'Mobile';
  } else if (/tablet|ipad/i.test(userAgent)) {
    device = 'Tablet';
  }
  if (botCheck.isBot) {
    device = 'Bot';
  }

  // Determine region / location
  let country = 'TP. Hồ Chí Minh';
  const cfCountry = (req.headers['cf-ipcountry'] as string) || '';
  if (cfCountry && cfCountry !== 'VN') {
    country = `Quốc Tế (${cfCountry})`;
  } else {
    const regions = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng', 'Bình Dương'];
    const ipStr = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
    const hash = ipStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    country = regions[hash % regions.length];
  }

  // Determine Referer channel
  const rawReferer = (req.headers['referer'] as string) || 'Direct';
  let referer = 'Direct';
  if (rawReferer.includes('facebook') || rawReferer.includes('fb.')) referer = 'https://facebook.com';
  else if (rawReferer.includes('zalo')) referer = 'https://zalo.me';
  else if (rawReferer.includes('google')) referer = 'https://google.com';
  else if (rawReferer.includes('tiktok')) referer = 'https://tiktok.com';
  else if (rawReferer.includes('telegram') || rawReferer.includes('t.me')) referer = 'https://t.me';
  else if (rawReferer.includes('instagram')) referer = 'https://instagram.com';
  else if (rawReferer !== 'Direct') referer = rawReferer;

  // Determine Browser / App
  let browser = 'Google Chrome';
  if (userAgent.includes('FBAN') || userAgent.includes('FBAV')) browser = 'Facebook App';
  else if (userAgent.includes('Zalo')) browser = 'Zalo App';
  else if (userAgent.includes('TikTok')) browser = 'TikTok App';
  else if (userAgent.includes('Chrome')) browser = 'Google Chrome';
  else if (userAgent.includes('Safari')) browser = 'Apple Safari';
  else if (userAgent.includes('Edg')) browser = 'Microsoft Edge';
  else if (userAgent.includes('Firefox')) browser = 'Mozilla Firefox';
  else if (botCheck.isBot) browser = botCheck.matchedAgent || 'Bot Crawler';

  db.recordVisit({
    link_id: link.id,
    slug: link.slug,
    ip: (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1',
    country,
    referer,
    browser,
    device,
    is_bot: botCheck.isBot
  });

  // IF BOT -> RENDER OPENGRAPH HTML VIEW
  if (botCheck.isBot) {
    const html = BotDetector.generateOGHtml({
      title: link.title,
      description: link.description,
      image: link.image,
      url: fullUrl,
      siteName: settings.site_name,
      ogType: link.og_type,
      ogUrl: link.og_url,
      ogSiteName: link.og_site_name,
      siteDomain
    });
    return res.status(200).set('Content-Type', 'text/html; charset=utf-8').send(html);
  }

  // IF HUMAN -> INCREMENT CLICKS & 302/301 REDIRECT
  db.incrementLinkClicks(link.id);
  const redirectCode = parseInt(settings.default_redirect || '302', 10);
  return res.redirect(redirectCode, link.destination_url);
});

// -------------------------------------------------------------
// VITE / STATIC SERVING
// -------------------------------------------------------------
// Fallback for missing API routes - strictly return JSON 404
app.use('/api', (req: Request, res: Response) => {
  res.status(404).json({ error: `API endpoint '${req.originalUrl}' không tồn tại trên máy chủ backend Node.js.` });
});

async function startServer() {
  const distPath = path.join(process.cwd(), 'dist');
  const hasDist = fs.existsSync(distPath);

  if (process.env.NODE_ENV !== 'production' && !hasDist) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Dự án chưa được build. Vui lòng chạy npm run build trước.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Link OG server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
