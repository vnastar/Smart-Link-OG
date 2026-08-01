-- Smart Link OpenGraph (SLS) - MySQL Database Schema & Sample Data
-- Suitable for Direct Import into MySQL 5.7+ / 8.0+ / MariaDB 10.3+
-- Command: mysql -u root -p < schema.sql

SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- Drop existing tables
-- --------------------------------------------------------
DROP TABLE IF EXISTS `analytics`;
DROP TABLE IF EXISTS `settings`;
DROP TABLE IF EXISTS `links`;
DROP TABLE IF EXISTS `users`;

-- --------------------------------------------------------
-- Table structure for `users`
-- --------------------------------------------------------
CREATE TABLE `users` (
  `id` CHAR(36) NOT NULL,
  `username` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin','user') NOT NULL DEFAULT 'user',
  `status` ENUM('active','blocked') NOT NULL DEFAULT 'active',
  `daily_limit` INT NOT NULL DEFAULT 5,
  `must_change_password` TINYINT(1) NOT NULL DEFAULT 0,
  `remember_token` VARCHAR(100) DEFAULT NULL,
  `email_verified_at` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_username` (`username`),
  UNIQUE KEY `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `links`
-- --------------------------------------------------------
CREATE TABLE `links` (
  `id` VARCHAR(50) NOT NULL,
  `slug` VARCHAR(100) NOT NULL,
  `destination_url` TEXT NOT NULL,
  `title` VARCHAR(255) DEFAULT '',
  `description` TEXT,
  `image` TEXT,
  `user_id` VARCHAR(50) NOT NULL,
  `clicks` INT NOT NULL DEFAULT 0,
  `bot_views` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `redirect_code` INT NOT NULL DEFAULT 302,
  `expires_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_slug` (`slug`),
  KEY `fk_links_users` (`user_id`),
  CONSTRAINT `fk_links_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `settings`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `settings`;

CREATE TABLE `settings` (
  `id` VARCHAR(50) NOT NULL DEFAULT 'default',
  `site_name` VARCHAR(150) NOT NULL DEFAULT 'Smart Link Service',
  `site_domain` VARCHAR(255) NOT NULL DEFAULT 'http://localhost:3000',
  `logo` TEXT,
  `favicon` TEXT,
  `default_redirect` VARCHAR(10) NOT NULL DEFAULT '302',
  `default_limit` INT NOT NULL DEFAULT 5,
  `register_enable` TINYINT(1) NOT NULL DEFAULT 1,
  `upload_enable` TINYINT(1) NOT NULL DEFAULT 1,
  `bot_list` TEXT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `analytics`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `analytics`;

CREATE TABLE `analytics` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `date` DATE NOT NULL,
  `clicks` INT NOT NULL DEFAULT 0,
  `bot_views` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Initial Seed Data: `users`
-- Passwords stored as SHA-256 hashes:
-- 'admin'   -> 8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918
-- 'user123' -> ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f
-- --------------------------------------------------------
INSERT INTO `users` (`id`, `username`, `email`, `password`, `role`, `status`, `daily_limit`, `must_change_password`, `created_at`) VALUES
('usr_admin_default', 'admin', 'admin@sls.local', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'admin', 'active', 9999, 1, '2026-01-01 00:00:00'),
('usr_user_demo', 'user', 'user@sls.local', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'user', 'active', 5, 0, '2026-01-01 00:00:00');

-- --------------------------------------------------------
-- Initial Seed Data: `settings`
-- --------------------------------------------------------
INSERT INTO `settings` (`id`, `site_name`, `site_domain`, `logo`, `favicon`, `default_redirect`, `default_limit`, `register_enable`, `upload_enable`, `bot_list`) VALUES
('default', 'Smart Link Service', 'http://localhost:3000', '', '', '302', 5, 1, 1, 'facebookexternalhit, facebot, twitterbot, telegrambot, whatsapp, discordbot, googlebot, bingbot, slackbot, zalo, zalocrawler, linkedinbot, applebot');

-- --------------------------------------------------------
-- Initial Seed Data: `links`
-- --------------------------------------------------------
INSERT INTO `links` (`id`, `slug`, `destination_url`, `title`, `description`, `image`, `user_id`, `clicks`, `bot_views`, `is_active`, `redirect_code`, `created_at`) VALUES
('link_demo_01', 'demo', 'https://youtube.com', 'Demo Hướng Dẫn Smart Link OG', 'Khám phá giải pháp rút gọn link chuyên nghiệp với hiển thị OpenGraph tự chọn dành cho mạng xã hội.', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80', 'usr_admin_default', 12, 45, 1, 302, '2026-01-02 10:00:00');

SET FOREIGN_KEY_CHECKS = 1;
