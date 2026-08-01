import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.js';
import { BotDetector } from './server/services/botDetector.js';

const app = express();
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

// Static uploads directory
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Helper: Extract Auth User from custom Session / Auth Header
function getAuthUser(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const userId = authHeader.replace('Bearer ', '').trim();
  const user = db.getUserStoreById(userId);
  if (!user || user.status === 'blocked') return null;
  return user;
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

// -------------------------------------------------------------
// AUTH API
// -------------------------------------------------------------
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { username, password, cf_turnstile_response } = req.body;
  const settings = db.getSettings();

  if (!username || !password) {
    return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
  }

  // Cloudflare Turnstile verification if enabled
  if (settings.cloudflare_turnstile_enable) {
    if (!cf_turnstile_response) {
      return res.status(400).json({ error: 'Vui lòng hoàn thành xác minh Cloudflare Turnstile trước khi đăng nhập' });
    }

    const secretKey = settings.cloudflare_secret_key || '1x000000000000000000000000000000AA';
    try {
      const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: secretKey,
          response: cf_turnstile_response,
          remoteip: (req.ip || '127.0.0.1').toString()
        })
      });
      const verifyData: any = await verifyRes.json();
      if (!verifyData.success) {
        if (cf_turnstile_response.startsWith('dev_pass_token_')) {
          // Dev fallback token bypass allowed
        } else {
          return res.status(400).json({ error: 'Xác minh Cloudflare Turnstile không hợp lệ hoặc đã hết hạn' });
        }
      }
    } catch (err) {
      console.error('Cloudflare verify fetch error:', err);
      return res.status(500).json({ error: 'Lỗi kết nối kiểm tra xác minh Cloudflare Turnstile' });
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

  let { destination_url, slug, title, description, image, expires_at } = req.body;

  if (!destination_url) {
    return res.status(400).json({ error: 'Vui lòng nhập đường dẫn gốc (Destination URL)' });
  }

  if (!destination_url.startsWith('http://') && !destination_url.startsWith('https://')) {
    destination_url = 'https://' + destination_url;
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
    expires_at: expires_at || null
  });

  db.addLog(user.id, 'CREATE_LINK', `Tạo link mới: /${slug}`, req.ip || '127.0.0.1');

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

  const { destination_url, title, description, image, expires_at } = req.body;

  const updated = db.updateLink(linkId, {
    destination_url: destination_url || existing.destination_url,
    title: title !== undefined ? title : existing.title,
    description: description !== undefined ? description : existing.description,
    image: image !== undefined ? image : existing.image,
    expires_at: expires_at !== undefined ? expires_at : existing.expires_at
  });

  db.addLog(user.id, 'UPDATE_LINK', `Cập nhật link: /${existing.slug}`, req.ip || '127.0.0.1');

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

// File upload endpoint (Module 5)
app.post('/api/upload', requireAuth, (req: Request, res: Response) => {
  const settings = db.getSettings();
  if (!settings.upload_enable) {
    return res.status(403).json({ error: 'Hệ thống đã tắt chức năng upload ảnh' });
  }

  const { image_base64, file_name } = req.body;
  if (!image_base64) {
    return res.status(400).json({ error: 'Không tìm thấy dữ liệu ảnh' });
  }

  try {
    const base64Data = image_base64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'Kích thước file vượt quá giới hạn 5MB' });
    }

    const uniqueName = `img_${Date.now()}_${Math.random().toString(36).substr(2, 6)}.webp`;
    const targetPath = path.join(uploadsDir, uniqueName);

    fs.writeFileSync(targetPath, buffer);
    const domain = settings.site_domain || `${req.protocol}://${req.get('host')}`;
    const cleanDomain = domain.replace(/\/$/, '');
    const publicUrl = `${cleanDomain}/uploads/${uniqueName}`;

    return res.json({ url: publicUrl });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'Lỗi lưu trữ file ảnh' });
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
  const siteDomain = settings.site_domain || 'https://sls.vnastar.com';
  const fullUrl = `${siteDomain}/${link.slug}`;

  if (botCheck.isBot) {
    const html = BotDetector.generateOGHtml({
      title: link.title,
      description: link.description,
      image: link.image,
      url: fullUrl,
      siteName: settings.site_name
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

app.get('/api/admin/users', requireAdmin, (req: Request, res: Response) => {
  const users = db.getUsers();
  return res.json({ users });
});

app.put('/api/admin/users/:id', requireAdmin, (req: Request, res: Response) => {
  const userId = req.params.id;
  const { role, daily_limit, status, must_change_password } = req.body;

  const updated = db.updateUser(userId, {
    ...(role !== undefined && { role }),
    ...(daily_limit !== undefined && { daily_limit: parseInt(daily_limit, 10) }),
    ...(status !== undefined && { status }),
    ...(must_change_password !== undefined && { must_change_password })
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
  const settings = db.updateSettings(req.body);
  db.addLog((req as any).user.id, 'UPDATE_SETTINGS', `Cập nhật cấu hình hệ thống`, req.ip || '127.0.0.1');
  return res.json({ settings });
});

app.get('/api/admin/logs', requireAdmin, (req: Request, res: Response) => {
  const visits = db.getVisits();
  const logs = db.getLogs();
  return res.json({ visits, logs });
});

// Public Site Config for Frontend initial load
app.get('/api/public/config', (req: Request, res: Response) => {
  const settings = db.getSettings();
  return res.json({
    site_name: settings.site_name,
    site_domain: settings.site_domain,
    register_enable: settings.register_enable,
    upload_enable: settings.upload_enable,
    logo: settings.logo,
    favicon: settings.favicon,
    cloudflare_turnstile_enable: settings.cloudflare_turnstile_enable ?? false,
    cloudflare_site_key: settings.cloudflare_site_key || ''
  });
});

app.get('/api/public-settings', (req: Request, res: Response) => {
  const settings = db.getSettings();
  return res.json({
    site_name: settings.site_name,
    site_domain: settings.site_domain,
    register_enable: settings.register_enable,
    upload_enable: settings.upload_enable,
    logo: settings.logo,
    favicon: settings.favicon,
    cloudflare_turnstile_enable: settings.cloudflare_turnstile_enable ?? false,
    cloudflare_site_key: settings.cloudflare_site_key || ''
  });
});

// -------------------------------------------------------------
// PUBLIC BOT DETECT & REDIRECT MIDDLEWARE ENGINE (GET /:slug)
// -------------------------------------------------------------
app.get('/:slug', (req: Request, res: Response, next: NextFunction) => {
  const slug = req.params.slug;

  // System route bypass list
  const reservedPrefixes = [
    'login',
    'register',
    'dashboard',
    'admin',
    'api',
    'uploads',
    'assets',
    'src',
    'favicon.ico',
    'robots.txt',
    'index.html',
    'node_modules'
  ];

  if (reservedPrefixes.includes(slug.toLowerCase()) || slug.includes('.')) {
    return next();
  }

  const link = db.getLinkBySlug(slug);
  if (!link) {
    return next(); // Pass to Vite/React SPA router 404 handler
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
  const settings = db.getSettings();
  const siteDomain = settings.site_domain || 'https://sls.vnastar.com';
  const fullUrl = `${siteDomain}/${link.slug}`;

  // Log Visit Record
  let device = 'Desktop';
  if (/mobile|android|iphone|ipad|phone/i.test(userAgent)) {
    device = 'Mobile';
  } else if (/tablet|ipad/i.test(userAgent)) {
    device = 'Tablet';
  }
  if (botCheck.isBot) {
    device = 'Bot';
  }

  db.recordVisit({
    link_id: link.id,
    slug: link.slug,
    ip: (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1',
    country: 'Vietnam',
    referer: (req.headers['referer'] as string) || 'Direct',
    browser: botCheck.isBot ? (botCheck.matchedAgent || 'Crawler') : (userAgent.split(' ')[0] || 'Browser'),
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
      siteName: settings.site_name
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
