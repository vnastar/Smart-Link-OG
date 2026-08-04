-- ============================================================================
-- Smart Link OG - File Cập Nhật Database An Toàn (Non-Destructive Migration Script)
-- Tác dụng: Thêm bảng mới, thêm cột mới, khởi tạo dữ liệu mặc định mà KHÔNG làm mất dữ liệu cũ.
-- Tương thích: MySQL 5.7+, MySQL 8.0+, MariaDB 10.3+ / phpMyAdmin / Adminer
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;

-- ----------------------------------------------------------------------------
-- 1. TẠO BẢNG NẾU CHƯA TỒN TẠI (CREATE TABLE IF NOT EXISTS)
-- ----------------------------------------------------------------------------

-- Bảng users
CREATE TABLE IF NOT EXISTS `users` (
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

-- Bảng links
CREATE TABLE IF NOT EXISTS `links` (
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

-- Bảng settings
CREATE TABLE IF NOT EXISTS `settings` (
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

-- Bảng visits
CREATE TABLE IF NOT EXISTS `visits` (
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

-- Bảng logs
CREATE TABLE IF NOT EXISTS `logs` (
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
-- 2. ĐỘNG BỔ SUNG CỘT MỚI VÀO BẢNG CŨ BẰNG STORED PROCEDURE
-- ----------------------------------------------------------------------------

DELIMITER //

DROP PROCEDURE IF EXISTS SafeAddColumn //
CREATE PROCEDURE SafeAddColumn(
    IN p_tablename VARCHAR(64),
    IN p_columnname VARCHAR(64),
    IN p_columndef VARCHAR(255)
)
BEGIN
    IF NOT EXISTS (
        SELECT NULL 
        FROM information_schema.COLUMNS 
        WHERE table_schema = DATABASE()
          AND table_name = p_tablename 
          AND column_name = p_columnname
    ) THEN
        SET @query = CONCAT('ALTER TABLE `', p_tablename, '` ADD COLUMN `', p_columnname, '` ', p_columndef);
        PREPARE stmt FROM @query;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //

DELIMITER ;

-- Cập nhật cột bổ sung cho bảng settings (nếu là database cũ từ các phiên bản trước)
CALL SafeAddColumn('settings', 'cloudflare_turnstile_enable', 'TINYINT(1) NOT NULL DEFAULT 0');
CALL SafeAddColumn('settings', 'cloudflare_site_key', "VARCHAR(255) DEFAULT ''");
CALL SafeAddColumn('settings', 'cloudflare_secret_key', "VARCHAR(255) DEFAULT ''");
CALL SafeAddColumn('settings', 'recaptcha_enable', 'TINYINT(1) NOT NULL DEFAULT 0');
CALL SafeAddColumn('settings', 'recaptcha_site_key', "VARCHAR(255) DEFAULT ''");
CALL SafeAddColumn('settings', 'recaptcha_secret_key', "VARCHAR(255) DEFAULT ''");
CALL SafeAddColumn('settings', 'recaptcha_version', "VARCHAR(50) DEFAULT 'v2_checkbox'");
CALL SafeAddColumn('settings', 'captcha_provider', "VARCHAR(50) DEFAULT 'recaptcha'");
CALL SafeAddColumn('settings', 'default_expiration_days', 'INT DEFAULT 0');
CALL SafeAddColumn('settings', 'allow_unlimited_expiration', 'TINYINT(1) DEFAULT 1');
CALL SafeAddColumn('settings', 'max_expiration_days', 'INT DEFAULT 0');
CALL SafeAddColumn('settings', 'private_mode_enable', 'TINYINT(1) DEFAULT 0');
CALL SafeAddColumn('settings', 'custom_login_path', "VARCHAR(255) DEFAULT '/login'");

-- Cập nhật cột bổ sung cho bảng users (nếu thiếu cột hạn sử dụng link mặc định)
CALL SafeAddColumn('users', 'default_expiration_days', 'INT DEFAULT 0');
CALL SafeAddColumn('users', 'allow_unlimited_expiration', 'TINYINT(1) DEFAULT 1');
CALL SafeAddColumn('users', 'max_expiration_days', 'INT DEFAULT 0');

-- Cập nhật cột bổ sung cho bảng links (nếu thiếu cột ngày hết hạn)
CALL SafeAddColumn('links', 'expires_at', 'DATETIME DEFAULT NULL');

-- Xóa Stored Procedure sau khi hoàn tất cập nhật
DROP PROCEDURE IF EXISTS SafeAddColumn;

-- ----------------------------------------------------------------------------
-- 3. THÊM BẢN GHI MẶC ĐỊNH NẾU CHƯA TỒN TẠI (INSERT IGNORE)
-- ----------------------------------------------------------------------------

-- Tạo tài khoản Admin mặc định nếu chưa có (admin / admin)
INSERT IGNORE INTO `users` (`id`, `username`, `email`, `password`, `role`, `status`, `daily_limit`, `must_change_password`, `default_expiration_days`, `allow_unlimited_expiration`, `max_expiration_days`, `created_at`, `updated_at`) 
VALUES ('usr_admin', 'admin', 'admin@vnastar.com', 'admin', 'admin', 'active', 9999, 1, 0, 1, 0, NOW(), NOW());

-- Tạo tài khoản User demo mặc định nếu chưa có
INSERT IGNORE INTO `users` (`id`, `username`, `email`, `password`, `role`, `status`, `daily_limit`, `must_change_password`, `default_expiration_days`, `allow_unlimited_expiration`, `max_expiration_days`, `created_at`, `updated_at`) 
VALUES ('usr_demo', 'user', 'user@vnastar.com', 'user123', 'user', 'active', 3, 0, 0, 1, 0, NOW(), NOW());

-- Khởi tạo cài đặt hệ thống mặc định nếu chưa có
INSERT IGNORE INTO `settings` (`id`, `site_name`, `site_domain`, `default_limit`, `register_enable`, `upload_enable`, `default_redirect`, `logo`, `favicon`, `bot_list`, `cloudflare_turnstile_enable`, `cloudflare_site_key`, `cloudflare_secret_key`, `recaptcha_enable`, `recaptcha_site_key`, `recaptcha_secret_key`, `recaptcha_version`, `captcha_provider`, `default_expiration_days`, `allow_unlimited_expiration`, `max_expiration_days`, `private_mode_enable`, `custom_login_path`) 
VALUES ('default', 'Smart Link OG', '', 3, 1, 1, '302', '', '', 'facebookexternalhit, facebot, twitterbot, discordbot, telegrambot, linkedinbot, slackbot, whatsapp, pinterest, googleinspectiontool, bingbot, googlebot, applebot, yandex, duckduckbot, baiduspider, skypeuripreview, vkshare, outbrain, zalo, viber', 0, '', '', 0, '', '', 'v2_checkbox', 'recaptcha', 0, 1, 0, 0, '/login');

SET FOREIGN_KEY_CHECKS = 1;
