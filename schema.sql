-- ========================================================
-- Smart Link OG - MySQL Database Schema & Initial Seed Data
-- Database Engine: InnoDB
-- Character Set: utf8mb4 (utf8mb4_unicode_ci)
-- Full Compatibility: MySQL 5.7+, MySQL 8.0+, MariaDB 10.3+
-- ========================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET NAMES utf8mb4;

-- --------------------------------------------------------
-- Table structure for table `users`
-- --------------------------------------------------------

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

-- --------------------------------------------------------
-- Dumping initial seed data for table `users`
-- --------------------------------------------------------

INSERT INTO `users` (`id`, `username`, `email`, `password`, `role`, `status`, `daily_limit`, `must_change_password`, `default_expiration_days`, `allow_unlimited_expiration`, `max_expiration_days`, `created_at`, `updated_at`) VALUES
('usr_admin', 'admin', 'admin@vnastar.com', 'admin', 'admin', 'active', 9999, 1, 0, 1, 0, NOW(), NOW()),
('usr_demo', 'user', 'user@vnastar.com', 'user123', 'user', 'active', 3, 0, 0, 1, 0, NOW(), NOW());

-- --------------------------------------------------------
-- Table structure for table `links`
-- --------------------------------------------------------

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
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Dumping initial seed data for table `links`
-- --------------------------------------------------------

INSERT INTO `links` (`id`, `user_id`, `user_name`, `slug`, `destination_url`, `title`, `description`, `image`, `og_url`, `og_type`, `og_site_name`, `clicks`, `status`, `redirect_code`, `expires_at`, `created_at`, `updated_at`) VALUES
('lnk_video01', 'usr_admin', 'admin', 'video01', 'https://youtube.com/watch?v=dQw4w9WgXcQ', 'Hướng dẫn Rút gọn Link Smart OG chuyên nghiệp', 'Công cụ rút gọn link thông minh hiển thị ảnh OpenGraph trên Facebook, Zalo, Telegram cực chuẩn.', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80', '', 'website', '', 42, 'active', 302, NULL, NOW(), NOW()),
('lnk_demo02', 'usr_demo', 'user', 'P8Hsj9', 'https://vnexpress.net', 'Trang tin tức tổng hợp VnExpress', 'Cập nhật tin tức mới nhất trong ngày tại Việt Nam và thế giới.', 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80', '', 'website', '', 15, 'active', 302, NULL, NOW(), NOW());

-- --------------------------------------------------------
-- Table structure for table `settings`
-- --------------------------------------------------------

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
  `recaptcha_enable` TINYINT(1) NOT NULL DEFAULT 0,
  `recaptcha_site_key` VARCHAR(255) DEFAULT '',
  `recaptcha_secret_key` VARCHAR(255) DEFAULT '',
  `recaptcha_version` VARCHAR(50) DEFAULT 'v2_checkbox',
  `captcha_provider` VARCHAR(50) DEFAULT 'recaptcha',
  `default_expiration_days` INT DEFAULT 0,
  `allow_unlimited_expiration` TINYINT(1) DEFAULT 1,
  `max_expiration_days` INT DEFAULT 0,
  `private_mode_enable` TINYINT(1) DEFAULT 0,
  `custom_login_path` VARCHAR(255) DEFAULT '/login',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Dumping initial seed data for table `settings`
-- --------------------------------------------------------

INSERT INTO `settings` (`id`, `site_name`, `site_domain`, `default_limit`, `register_enable`, `upload_enable`, `default_redirect`, `logo`, `favicon`, `bot_list`, `cloudflare_turnstile_enable`, `cloudflare_site_key`, `cloudflare_secret_key`, `recaptcha_enable`, `recaptcha_site_key`, `recaptcha_secret_key`, `recaptcha_version`, `captcha_provider`, `default_expiration_days`, `allow_unlimited_expiration`, `max_expiration_days`, `private_mode_enable`, `custom_login_path`) VALUES
('default', 'Smart Link OG', '', 3, 1, 1, '302', '', '', 'facebookexternalhit, facebot, twitterbot, discordbot, telegrambot, linkedinbot, slackbot, whatsapp, pinterest, googleinspectiontool, bingbot, googlebot, applebot, yandex, duckduckbot, baiduspider, skypeuripreview, vkshare, outbrain, zalo, viber', 0, '', '', 0, '', '', 'v2_checkbox', 'recaptcha', 0, 1, 0, 0, '/login');

-- --------------------------------------------------------
-- Table structure for table `visits`
-- --------------------------------------------------------

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

-- --------------------------------------------------------
-- Table structure for table `logs`
-- --------------------------------------------------------

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

SET FOREIGN_KEY_CHECKS = 1;
