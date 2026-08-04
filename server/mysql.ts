import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { User, LinkItem, SiteSettings, VisitLog, AuditLog } from '../src/types.js';

dotenv.config();

export interface UserStore extends User {
  password_hash: string;
}

export class MySQLService {
  private pool: mysql.Pool | null = null;
  public isConnected = false;
  public lastError: string | null = null;
  public configSummary: Record<string, any> = {};

  constructor() {
    this.initPool();
  }

  public initPool() {
    dotenv.config(); // Nạp lại biến môi trường từ .env nếu vừa thay đổi
    const host = process.env.MYSQL_HOST || process.env.DB_HOST;
    const user = process.env.MYSQL_USER || process.env.DB_USER;
    const password = process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || process.env.DB_PASS;
    const database = process.env.MYSQL_DATABASE || process.env.DB_NAME;
    const port = Number(process.env.MYSQL_PORT || process.env.DB_PORT) || 3306;

    this.configSummary = {
      host: host || '(Chưa cấu hình)',
      port,
      user: user || '(Chưa cấu hình)',
      database: database || '(Chưa cấu hình)',
      hasPassword: Boolean(password)
    };

    if (!host || !user || !database) {
      this.lastError = 'Chưa thiết lập biến môi trường MySQL (Thiếu MYSQL_HOST, MYSQL_USER hoặc MYSQL_DATABASE)';
      console.log('ℹ️ Cấu hình MySQL chưa hoàn tất trong .env / Environment Variables.');
      return;
    }

    try {
      this.pool = mysql.createPool({
        host,
        port,
        user,
        password: password || '',
        database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        charset: 'utf8mb4'
      });
      this.lastError = null;
      console.log(`🔌 Đã khởi tạo kết nối MySQL Pool tới: ${user}@${host}:${port}/${database}`);
    } catch (err: any) {
      this.lastError = err?.message || String(err);
      console.error('❌ Lỗi kết nối MySQL Pool:', err);
    }
  }

  // Helper kiểm tra và tự động thêm cột mới nếu DB đã tồn tại từ trước (Auto Migration)
  private async ensureColumnExists(conn: any, tableName: string, columnName: string, columnSpec: string) {
    try {
      const [cols]: any = await conn.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [tableName, columnName]
      );
      if (!cols || cols.length === 0) {
        console.log(`🔨 [Auto Migration] Đang tự động thêm cột [${columnName}] vào bảng [${tableName}]...`);
        await conn.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${columnSpec}`);
      }
    } catch (err) {
      console.warn(`⚠️ Lỗi kiểm tra tự động nâng cấp cột ${tableName}.${columnName}:`, err);
    }
  }

  // Kiểm tra & Khởi tạo Table tự động nếu chưa có
  async checkAndSeedTables() {
    if (!this.pool) {
      this.initPool();
    }
    if (!this.pool) return false;

    try {
      const conn = await this.pool.getConnection();
      this.isConnected = true;
      this.lastError = null;
      console.log('✅ Đã kết nối thành công tới Database MySQL!');

      // Create users table
      await conn.query(`
        CREATE TABLE IF NOT EXISTS \`users\` (
          \`id\` VARCHAR(50) NOT NULL,
          \`username\` VARCHAR(100) NOT NULL,
          \`email\` VARCHAR(150) NOT NULL,
          \`password\` VARCHAR(255) NOT NULL,
          \`role\` ENUM('admin', 'user') NOT NULL DEFAULT 'user',
          \`status\` ENUM('active', 'blocked') NOT NULL DEFAULT 'active',
          \`daily_limit\` INT NOT NULL DEFAULT 5,
          \`must_change_password\` TINYINT(1) NOT NULL DEFAULT 0,
          \`default_expiration_days\` INT DEFAULT 0,
          \`allow_unlimited_expiration\` TINYINT(1) DEFAULT 1,
          \`max_expiration_days\` INT DEFAULT 0,
          \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`idx_username\` (\`username\`),
          UNIQUE KEY \`idx_email\` (\`email\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // Auto Migration checks for users table
      await this.ensureColumnExists(conn, 'users', 'must_change_password', 'TINYINT(1) NOT NULL DEFAULT 0');
      await this.ensureColumnExists(conn, 'users', 'default_expiration_days', 'INT DEFAULT 0');
      await this.ensureColumnExists(conn, 'users', 'allow_unlimited_expiration', 'TINYINT(1) DEFAULT 1');
      await this.ensureColumnExists(conn, 'users', 'max_expiration_days', 'INT DEFAULT 0');

      // Create links table
      await conn.query(`
        CREATE TABLE IF NOT EXISTS \`links\` (
          \`id\` VARCHAR(50) NOT NULL,
          \`user_id\` VARCHAR(50) NOT NULL,
          \`user_name\` VARCHAR(100) DEFAULT '',
          \`slug\` VARCHAR(100) NOT NULL,
          \`destination_url\` TEXT NOT NULL,
          \`title\` VARCHAR(255) DEFAULT '',
          \`description\` TEXT,
          \`image\` TEXT,
          \`og_url\` TEXT,
          \`og_type\` VARCHAR(50) DEFAULT 'website',
          \`og_site_name\` VARCHAR(100) DEFAULT '',
          \`clicks\` INT NOT NULL DEFAULT 0,
          \`status\` ENUM('active', 'disabled') NOT NULL DEFAULT 'active',
          \`redirect_code\` INT NOT NULL DEFAULT 302,
          \`expires_at\` DATETIME DEFAULT NULL,
          \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`idx_slug\` (\`slug\`),
          KEY \`idx_user_id\` (\`user_id\`),
          KEY \`idx_status\` (\`status\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // Auto Migration checks for links table
      await this.ensureColumnExists(conn, 'links', 'user_name', "VARCHAR(100) DEFAULT ''");
      await this.ensureColumnExists(conn, 'links', 'og_url', 'TEXT');
      await this.ensureColumnExists(conn, 'links', 'og_type', "VARCHAR(50) DEFAULT 'website'");
      await this.ensureColumnExists(conn, 'links', 'og_site_name', "VARCHAR(100) DEFAULT ''");
      await this.ensureColumnExists(conn, 'links', 'redirect_code', 'INT NOT NULL DEFAULT 302');
      await this.ensureColumnExists(conn, 'links', 'expires_at', 'DATETIME DEFAULT NULL');

      // Create settings table
      await conn.query(`
        CREATE TABLE IF NOT EXISTS \`settings\` (
          \`id\` VARCHAR(50) NOT NULL DEFAULT 'default',
          \`site_name\` VARCHAR(150) NOT NULL DEFAULT 'Smart Link OG',
          \`site_domain\` VARCHAR(255) NOT NULL DEFAULT '',
          \`default_limit\` INT NOT NULL DEFAULT 3,
          \`register_enable\` TINYINT(1) NOT NULL DEFAULT 1,
          \`upload_enable\` TINYINT(1) NOT NULL DEFAULT 1,
          \`default_redirect\` VARCHAR(10) NOT NULL DEFAULT '302',
          \`logo\` TEXT,
          \`favicon\` TEXT,
          \`bot_list\` TEXT,
          \`cloudflare_turnstile_enable\` TINYINT(1) NOT NULL DEFAULT 0,
          \`cloudflare_site_key\` VARCHAR(255) DEFAULT '',
          \`cloudflare_secret_key\` VARCHAR(255) DEFAULT '',
          \`default_expiration_days\` INT DEFAULT 0,
          \`allow_unlimited_expiration\` TINYINT(1) DEFAULT 1,
          \`max_expiration_days\` INT DEFAULT 0,
          PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // Auto Migration checks for settings table
      await this.ensureColumnExists(conn, 'settings', 'cloudflare_turnstile_enable', 'TINYINT(1) NOT NULL DEFAULT 0');
      await this.ensureColumnExists(conn, 'settings', 'cloudflare_site_key', "VARCHAR(255) DEFAULT ''");
      await this.ensureColumnExists(conn, 'settings', 'cloudflare_secret_key', "VARCHAR(255) DEFAULT ''");
      await this.ensureColumnExists(conn, 'settings', 'default_expiration_days', 'INT DEFAULT 0');
      await this.ensureColumnExists(conn, 'settings', 'allow_unlimited_expiration', 'TINYINT(1) DEFAULT 1');
      await this.ensureColumnExists(conn, 'settings', 'max_expiration_days', 'INT DEFAULT 0');

      // Create visits table
      await conn.query(`
        CREATE TABLE IF NOT EXISTS \`visits\` (
          \`id\` VARCHAR(50) NOT NULL,
          \`link_id\` VARCHAR(50) NOT NULL,
          \`slug\` VARCHAR(100) NOT NULL,
          \`ip\` VARCHAR(45) DEFAULT NULL,
          \`country\` VARCHAR(100) DEFAULT 'TP. Hồ Chí Minh',
          \`referer\` VARCHAR(255) DEFAULT 'Direct',
          \`browser\` VARCHAR(100) DEFAULT 'Google Chrome',
          \`device\` VARCHAR(50) DEFAULT 'Mobile',
          \`is_bot\` TINYINT(1) NOT NULL DEFAULT 0,
          \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          KEY \`idx_link_id\` (\`link_id\`),
          KEY \`idx_slug\` (\`slug\`),
          KEY \`idx_is_bot\` (\`is_bot\`),
          KEY \`idx_created_at\` (\`created_at\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // Create logs table
      await conn.query(`
        CREATE TABLE IF NOT EXISTS \`logs\` (
          \`id\` VARCHAR(50) NOT NULL,
          \`user_id\` VARCHAR(50) NOT NULL,
          \`user_name\` VARCHAR(100) DEFAULT '',
          \`action\` VARCHAR(100) NOT NULL,
          \`details\` TEXT,
          \`ip\` VARCHAR(45) DEFAULT NULL,
          \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          KEY \`idx_user_id\` (\`user_id\`),
          KEY \`idx_created_at\` (\`created_at\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // Seed Default Admin User if empty
      const [users]: any = await conn.query('SELECT COUNT(*) as count FROM users');
      if (users[0].count === 0) {
        await conn.query(
          `INSERT INTO users (id, username, email, password, role, status, daily_limit, must_change_password)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          ['usr_admin', 'admin', 'admin@vnastar.com', 'admin', 'admin', 'active', 9999, 1]
        );
        await conn.query(
          `INSERT INTO users (id, username, email, password, role, status, daily_limit, must_change_password)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          ['usr_demo', 'user', 'user@vnastar.com', 'user123', 'user', 'active', 3, 0]
        );
        console.log('🌱 Đã tạo tài khoản admin và user mặc định trên MySQL.');
      }

      // Seed Default Settings if empty
      const [settings]: any = await conn.query('SELECT COUNT(*) as count FROM settings');
      if (settings[0].count === 0) {
        await conn.query(
          `INSERT INTO settings (id, site_name, site_domain, default_limit, register_enable, upload_enable, default_redirect, bot_list)
           VALUES ('default', 'Smart Link OG', '', 3, 1, 1, '302', ?)`,
          ['facebookexternalhit, facebot, twitterbot, discordbot, telegrambot, linkedinbot, slackbot, whatsapp, pinterest, googleinspectiontool, bingbot, googlebot, applebot, yandex, duckduckbot, baiduspider, skypeuripreview, vkshare, outbrain, zalo, viber']
        );
        console.log('🌱 Đã tạo cấu hình hệ thống mặc định trên MySQL.');
      }

      conn.release();
      return true;
    } catch (err: any) {
      this.lastError = err?.message || String(err);
      console.error('❌ Không thể kết nối hoặc khởi tạo MySQL table:', err);
      this.isConnected = false;
      return false;
    }
  }

  // --- QUERY METHODS ---

  async fetchAllUsers(): Promise<UserStore[]> {
    if (!this.pool || !this.isConnected) return [];
    try {
      const [rows]: any = await this.pool.query('SELECT * FROM users ORDER BY created_at DESC');
      return rows.map((r: any) => ({
        id: r.id,
        username: r.username,
        email: r.email,
        password_hash: r.password,
        role: r.role,
        status: r.status,
        daily_limit: r.daily_limit,
        must_change_password: Boolean(r.must_change_password),
        default_expiration_days: r.default_expiration_days || 0,
        allow_unlimited_expiration: r.allow_unlimited_expiration !== 0,
        max_expiration_days: r.max_expiration_days || 0,
        created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString()
      }));
    } catch (e) {
      console.error('Error fetching users from MySQL:', e);
      return [];
    }
  }

  async saveUser(user: UserStore) {
    if (!this.pool || !this.isConnected) return;
    try {
      await this.pool.query(
        `INSERT INTO users (id, username, email, password, role, status, daily_limit, must_change_password, default_expiration_days, allow_unlimited_expiration, max_expiration_days)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         username=VALUES(username), email=VALUES(email), password=VALUES(password), role=VALUES(role),
         status=VALUES(status), daily_limit=VALUES(daily_limit), must_change_password=VALUES(must_change_password),
         default_expiration_days=VALUES(default_expiration_days), allow_unlimited_expiration=VALUES(allow_unlimited_expiration),
         max_expiration_days=VALUES(max_expiration_days)`,
        [
          user.id,
          user.username,
          user.email,
          user.password_hash,
          user.role,
          user.status,
          user.daily_limit,
          user.must_change_password ? 1 : 0,
          user.default_expiration_days || 0,
          user.allow_unlimited_expiration ? 1 : 0,
          user.max_expiration_days || 0
        ]
      );
    } catch (e) {
      console.error('Error saving user to MySQL:', e);
    }
  }

  async deleteUser(id: string) {
    if (!this.pool || !this.isConnected) return;
    try {
      await this.pool.query('DELETE FROM users WHERE id = ?', [id]);
      await this.pool.query('DELETE FROM links WHERE user_id = ?', [id]);
    } catch (e) {
      console.error('Error deleting user from MySQL:', e);
    }
  }

  async fetchAllLinks(): Promise<LinkItem[]> {
    if (!this.pool || !this.isConnected) return [];
    try {
      const [rows]: any = await this.pool.query('SELECT * FROM links ORDER BY created_at DESC');
      return rows.map((r: any) => ({
        id: r.id,
        user_id: r.user_id,
        user_name: r.user_name || '',
        slug: r.slug,
        destination_url: r.destination_url,
        title: r.title || '',
        description: r.description || '',
        image: r.image || '',
        og_url: r.og_url || '',
        og_type: r.og_type || 'website',
        og_site_name: r.og_site_name || '',
        clicks: r.clicks || 0,
        status: r.status || 'active',
        redirect_code: r.redirect_code || 302,
        expires_at: r.expires_at ? new Date(r.expires_at).toISOString() : null,
        created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString()
      }));
    } catch (e) {
      console.error('Error fetching links from MySQL:', e);
      return [];
    }
  }

  async saveLink(link: LinkItem) {
    if (!this.pool || !this.isConnected) return;
    try {
      const expiresAt = link.expires_at ? new Date(link.expires_at) : null;
      await this.pool.query(
        `INSERT INTO links (id, user_id, user_name, slug, destination_url, title, description, image, og_url, og_type, og_site_name, clicks, status, redirect_code, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         user_name=VALUES(user_name), slug=VALUES(slug), destination_url=VALUES(destination_url), title=VALUES(title),
         description=VALUES(description), image=VALUES(image), og_url=VALUES(og_url), og_type=VALUES(og_type),
         og_site_name=VALUES(og_site_name), clicks=VALUES(clicks), status=VALUES(status), redirect_code=VALUES(redirect_code),
         expires_at=VALUES(expires_at)`,
        [
          link.id,
          link.user_id,
          link.user_name || '',
          link.slug,
          link.destination_url,
          link.title || '',
          link.description || '',
          link.image || '',
          link.og_url || '',
          link.og_type || 'website',
          link.og_site_name || '',
          link.clicks || 0,
          link.status || 'active',
          (link as any).redirect_code || 302,
          expiresAt
        ]
      );
    } catch (e) {
      console.error('Error saving link to MySQL:', e);
    }
  }

  async deleteLink(id: string) {
    if (!this.pool || !this.isConnected) return;
    try {
      await this.pool.query('DELETE FROM links WHERE id = ?', [id]);
    } catch (e) {
      console.error('Error deleting link from MySQL:', e);
    }
  }

  async incrementClicks(id: string) {
    if (!this.pool || !this.isConnected) return;
    try {
      await this.pool.query('UPDATE links SET clicks = clicks + 1 WHERE id = ?', [id]);
    } catch (e) {
      console.error('Error incrementing clicks on MySQL:', e);
    }
  }

  async fetchSettings(): Promise<SiteSettings | null> {
    if (!this.pool || !this.isConnected) return null;
    try {
      const [rows]: any = await this.pool.query('SELECT * FROM settings WHERE id = "default" LIMIT 1');
      if (!rows || rows.length === 0) return null;
      const r = rows[0];
      return {
        site_name: r.site_name,
        site_domain: r.site_domain,
        default_limit: r.default_limit,
        register_enable: Boolean(r.register_enable),
        upload_enable: Boolean(r.upload_enable),
        default_redirect: r.default_redirect,
        logo: r.logo || '',
        favicon: r.favicon || '',
        bot_list: r.bot_list || '',
        cloudflare_turnstile_enable: Boolean(r.cloudflare_turnstile_enable),
        cloudflare_site_key: r.cloudflare_site_key || '',
        cloudflare_secret_key: r.cloudflare_secret_key || '',
        default_expiration_days: r.default_expiration_days || 0,
        allow_unlimited_expiration: Boolean(r.allow_unlimited_expiration),
        max_expiration_days: r.max_expiration_days || 0
      };
    } catch (e) {
      console.error('Error fetching settings from MySQL:', e);
      return null;
    }
  }

  async saveSettings(settings: SiteSettings) {
    if (!this.pool || !this.isConnected) return;
    try {
      await this.pool.query(
        `INSERT INTO settings (id, site_name, site_domain, default_limit, register_enable, upload_enable, default_redirect, logo, favicon, bot_list, cloudflare_turnstile_enable, cloudflare_site_key, cloudflare_secret_key, default_expiration_days, allow_unlimited_expiration, max_expiration_days)
         VALUES ('default', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         site_name=VALUES(site_name), site_domain=VALUES(site_domain), default_limit=VALUES(default_limit),
         register_enable=VALUES(register_enable), upload_enable=VALUES(upload_enable), default_redirect=VALUES(default_redirect),
         logo=VALUES(logo), favicon=VALUES(favicon), bot_list=VALUES(bot_list), cloudflare_turnstile_enable=VALUES(cloudflare_turnstile_enable),
         cloudflare_site_key=VALUES(cloudflare_site_key), cloudflare_secret_key=VALUES(cloudflare_secret_key),
         default_expiration_days=VALUES(default_expiration_days), allow_unlimited_expiration=VALUES(allow_unlimited_expiration),
         max_expiration_days=VALUES(max_expiration_days)`,
        [
          settings.site_name,
          settings.site_domain,
          settings.default_limit,
          settings.register_enable ? 1 : 0,
          settings.upload_enable ? 1 : 0,
          settings.default_redirect,
          settings.logo || '',
          settings.favicon || '',
          settings.bot_list || '',
          settings.cloudflare_turnstile_enable ? 1 : 0,
          settings.cloudflare_site_key || '',
          settings.cloudflare_secret_key || '',
          settings.default_expiration_days || 0,
          settings.allow_unlimited_expiration ? 1 : 0,
          settings.max_expiration_days || 0
        ]
      );
    } catch (e) {
      console.error('Error saving settings to MySQL:', e);
    }
  }

  async fetchAllVisits(): Promise<VisitLog[]> {
    if (!this.pool || !this.isConnected) return [];
    try {
      const [rows]: any = await this.pool.query('SELECT * FROM visits ORDER BY created_at DESC LIMIT 5000');
      return rows.map((r: any) => ({
        id: r.id,
        link_id: r.link_id,
        slug: r.slug,
        ip: r.ip || '',
        country: r.country || '',
        referer: r.referer || '',
        browser: r.browser || '',
        device: r.device || '',
        is_bot: Boolean(r.is_bot),
        created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString()
      }));
    } catch (e) {
      console.error('Error fetching visits from MySQL:', e);
      return [];
    }
  }

  async saveVisit(visit: VisitLog) {
    if (!this.pool || !this.isConnected) return;
    try {
      await this.pool.query(
        `INSERT INTO visits (id, link_id, slug, ip, country, referer, browser, device, is_bot, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          visit.id,
          visit.link_id,
          visit.slug,
          visit.ip || '',
          visit.country || 'TP. Hồ Chí Minh',
          visit.referer || 'Direct',
          visit.browser || 'Chrome',
          visit.device || 'Mobile',
          visit.is_bot ? 1 : 0,
          new Date(visit.created_at)
        ]
      );
    } catch (e) {
      console.error('Error saving visit to MySQL:', e);
    }
  }

  async fetchAllLogs(): Promise<AuditLog[]> {
    if (!this.pool || !this.isConnected) return [];
    try {
      const [rows]: any = await this.pool.query('SELECT * FROM logs ORDER BY created_at DESC LIMIT 1000');
      return rows.map((r: any) => ({
        id: r.id,
        user_id: r.user_id,
        user_name: r.user_name || '',
        action: r.action,
        details: r.details || '',
        ip: r.ip || '',
        created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString()
      }));
    } catch (e) {
      console.error('Error fetching logs from MySQL:', e);
      return [];
    }
  }

  async saveLog(log: AuditLog) {
    if (!this.pool || !this.isConnected) return;
    try {
      await this.pool.query(
        `INSERT INTO logs (id, user_id, user_name, action, details, ip, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          log.id,
          log.user_id,
          log.user_name || '',
          log.action,
          log.details || '',
          log.ip || '',
          new Date(log.created_at)
        ]
      );
    } catch (e) {
      console.error('Error saving log to MySQL:', e);
    }
  }
}

export const mysqlService = new MySQLService();
