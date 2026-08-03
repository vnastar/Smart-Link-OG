-- ============================================================================
-- Smart Link OpenGraph (SLS) - Schema MySQL & Dữ Liệu Mẫu
-- Tương thích với MySQL 5.7+, MySQL 8.0+, MariaDB 10.3+ & phpMyAdmin (Shared Hosting, cPanel, DirectAdmin)
-- HƯỚNG DẪN: 
-- 1. Mở phpMyAdmin và chọn đúng Database của bạn (ví dụ: u202109230_xxxxx)
-- 2. Chọn tab "Nhập" (Import) chọn file schema.sql này, hoặc mở tab "SQL" và dán toàn bộ nội dung này vào để chạy.
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- 1. Bảng `users` (Quản lý tài khoản người dùng & Admin)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` VARCHAR(50) NOT NULL,
  `username` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  `status` ENUM('active', 'blocked') NOT NULL DEFAULT 'active',
  `daily_limit` INT NOT NULL DEFAULT 5,
  `must_change_password` TINYINT(1) NOT NULL DEFAULT 0,
  `default_expiration_days` INT DEFAULT 0,
  `allow_unlimited_expiration` TINYINT(1) DEFAULT 1,
  `max_expiration_days` INT DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_username` (`username`),
  UNIQUE KEY `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. Bảng `links` (Quản lý rút gọn Link & OpenGraph Meta)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `links`;

CREATE TABLE `links` (
  `id` VARCHAR(50) NOT NULL,
  `user_id` VARCHAR(50) NOT NULL,
  `user_name` VARCHAR(100) DEFAULT '',
  `slug` VARCHAR(100) NOT NULL,
  `destination_url` TEXT NOT NULL,
  `title` VARCHAR(255) DEFAULT '',
  `description` TEXT,
  `image` TEXT,
  `og_url` TEXT,
  `og_type` VARCHAR(50) DEFAULT 'website',
  `og_site_name` VARCHAR(100) DEFAULT '',
  `clicks` INT NOT NULL DEFAULT 0,
  `status` ENUM('active', 'disabled') NOT NULL DEFAULT 'active',
  `redirect_code` INT NOT NULL DEFAULT 302,
  `expires_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_slug` (`slug`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_links_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. Bảng `settings` (Cấu hình hệ thống)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `settings`;

CREATE TABLE `settings` (
  `id` VARCHAR(50) NOT NULL DEFAULT 'default',
  `site_name` VARCHAR(150) NOT NULL DEFAULT 'Smart Link OG',
  `site_domain` VARCHAR(255) NOT NULL DEFAULT '',
  `default_limit` INT NOT NULL DEFAULT 3,
  `register_enable` TINYINT(1) NOT NULL DEFAULT 1,
  `upload_enable` TINYINT(1) NOT NULL DEFAULT 1,
  `default_redirect` VARCHAR(10) NOT NULL DEFAULT '302',
  `logo` TEXT,
  `favicon` TEXT,
  `bot_list` TEXT,
  `cloudflare_turnstile_enable` TINYINT(1) NOT NULL DEFAULT 0,
  `cloudflare_site_key` VARCHAR(255) DEFAULT '',
  `cloudflare_secret_key` VARCHAR(255) DEFAULT '',
  `default_expiration_days` INT DEFAULT 0,
  `allow_unlimited_expiration` TINYINT(1) DEFAULT 1,
  `max_expiration_days` INT DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. Bảng `visits` (Lịch sử Lượt Click & Crawler Bot)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `visits`;

CREATE TABLE `visits` (
  `id` VARCHAR(50) NOT NULL,
  `link_id` VARCHAR(50) NOT NULL,
  `slug` VARCHAR(100) NOT NULL,
  `ip` VARCHAR(45) DEFAULT NULL,
  `country` VARCHAR(100) DEFAULT 'TP. Hồ Chí Minh',
  `referer` VARCHAR(255) DEFAULT 'Direct',
  `browser` VARCHAR(100) DEFAULT 'Google Chrome',
  `device` VARCHAR(50) DEFAULT 'Mobile',
  `is_bot` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_link_id` (`link_id`),
  KEY `idx_slug` (`slug`),
  KEY `idx_is_bot` (`is_bot`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. Bảng `logs` (Nhật ký thao tác Audit Log)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `logs`;

CREATE TABLE `logs` (
  `id` VARCHAR(50) NOT NULL,
  `user_id` VARCHAR(50) NOT NULL,
  `user_name` VARCHAR(100) DEFAULT '',
  `action` VARCHAR(100) NOT NULL,
  `details` TEXT,
  `ip` VARCHAR(45) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. Bảng `analytics` (Thống kê lưu lượng tổng hợp theo ngày)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `analytics`;

CREATE TABLE `analytics` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `date` DATE NOT NULL,
  `clicks` INT NOT NULL DEFAULT 0,
  `bot_views` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- DỮ LIỆU KHỞI TẠO BAN ĐẦU (SEED DATA)
-- ============================================================================

-- 1. Tài khoản mặc định:
-- Admin: username 'admin' | mật khẩu mặc định 'admin'
-- User:  username 'user'  | mật khẩu mặc định 'user123'
INSERT INTO `users` (`id`, `username`, `email`, `password`, `role`, `status`, `daily_limit`, `must_change_password`, `created_at`) VALUES
('usr_admin', 'admin', 'admin@vnastar.com', 'admin', 'admin', 'active', 9999, 1, '2026-01-01 00:00:00'),
('usr_demo', 'user', 'user@vnastar.com', 'user123', 'user', 'active', 3, 0, '2026-01-01 00:00:00');

-- 2. Cấu hình hệ thống mặc định:
INSERT INTO `settings` (`id`, `site_name`, `site_domain`, `default_limit`, `register_enable`, `upload_enable`, `default_redirect`, `logo`, `favicon`, `bot_list`, `cloudflare_turnstile_enable`, `cloudflare_site_key`, `cloudflare_secret_key`, `default_expiration_days`, `allow_unlimited_expiration`, `max_expiration_days`) VALUES
('default', 'Smart Link OG', '', 3, 1, 1, '302', '', '', 'facebookexternalhit, facebot, twitterbot, discordbot, telegrambot, linkedinbot, slackbot, whatsapp, pinterest, googleinspectiontool, bingbot, googlebot, applebot, yandex, duckduckbot, baiduspider, skypeuripreview, vkshare, outbrain, zalo, viber', 0, '', '', 0, 1, 0);

-- 3. Mẫu Link rút gọn ban đầu:
INSERT INTO `links` (`id`, `user_id`, `user_name`, `slug`, `destination_url`, `title`, `description`, `image`, `clicks`, `status`, `redirect_code`, `created_at`) VALUES
('lnk_video01', 'usr_admin', 'admin', 'video01', 'https://youtube.com/watch?v=dQw4w9WgXcQ', 'Hướng dẫn Rút gọn Link Smart OG chuyên nghiệp', 'Công cụ rút gọn link thông minh hiển thị ảnh OpenGraph trên Facebook, Zalo, Telegram cực chuẩn.', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80', 42, 'active', 302, '2026-01-02 10:00:00'),
('lnk_demo02', 'usr_demo', 'user', 'P8Hsj9', 'https://vnexpress.net', 'Trang tin tức tổng hợp', 'Mẫu link trải nghiệm rút gọn dành cho thành viên', 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80', 18, 'active', 302, '2026-01-03 14:00:00');

-- 4. Nhật ký nhật ký lượt truy cập mẫu:
INSERT INTO `visits` (`id`, `link_id`, `slug`, `ip`, `country`, `referer`, `browser`, `device`, `is_bot`, `created_at`) VALUES
('vst_01', 'lnk_video01', 'video01', '113.190.1.20', 'Hà Nội', 'https://facebook.com', 'Facebook App', 'Mobile', 0, NOW() - INTERVAL 2 HOUR),
('vst_02', 'lnk_video01', 'video01', '14.161.22.45', 'TP. Hồ Chí Minh', 'Direct', 'Google Chrome', 'Mobile', 0, NOW() - INTERVAL 3 HOUR),
('vst_03', 'lnk_video01', 'video01', '113.160.10.5', 'TP. Hồ Chí Minh', 'https://zalo.me', 'Zalo App', 'Mobile', 0, NOW() - INTERVAL 4 HOUR),
('vst_04', 'lnk_video01', 'video01', '113.190.88.1', 'Hà Nội', 'https://facebook.com', 'Facebook externalhit/1.1', 'Bot', 1, NOW() - INTERVAL 5 HOUR);

SET FOREIGN_KEY_CHECKS = 1;
