# Smart Link OpenGraph (SLS) - Hệ Thống Rút Gọn Link Thông Minh & Tùy Chỉnh OpenGraph Metadata

> **Smart Link Service (SLS)** là hệ thống rút gọn liên kết hiện đại, hỗ trợ tùy chỉnh metadata OpenGraph (`og:title`, `og:description`, `og:image`) hiển thị trên các mạng xã hội như Facebook, Zalo, Telegram, X/Twitter, Discord, iMessage... Hệ thống được tích hợp cơ chế **DetectBot Smart Redirect** thông minh để trả về HTML OpenGraph chuẩn SEO cho các Crawler/Bot mạng xã hội, đồng thời chuyển hướng (301/302) trực tiếp người dùng thực đến liên kết gốc.

---

## 🌟 Tính Năng Nổi Bật (Key Features)

### 1. 🤖 Cơ Chế DetectBot & Smart Redirect (Core Feature)
* **Tự động phân loại truy cập theo User-Agent:**
  * **Nếu là Crawler / Bot mạng xã hội** (Facebook, Zalo, Telegram, Twitterbot, Discordbot, Googlebot, WhatsApp...): Hệ thống sẽ render và trả về trang HTML chứa đầy đủ các thẻ meta OpenGraph (`og:title`, `og:description`, `og:image`, `og:url`, `og:site_name`) tối ưu cho xem trước bài viết card đẹp mắt.
  * **Nếu là Người dùng thực (Trình duyệt Chrome, Safari, Firefox...)**: Hệ thống trả về lệnh chuyển hướng HTTP 302/301 ngay lập tức tới Link gốc (`Destination URL`), tăng tốc độ trải nghiệm và ghi nhận lượt click chính xác.
* **Tự do tùy biến danh sách Bot User-Agent:** Admin có thể thêm/bớt chuỗi ký tự nhận diện Crawler trong trang Cấu hình Hệ thống.

### 2. 🔗 Quản Lý Link Rút Gọn Tùy Chỉnh
* **Tạo Shortlink linh hoạt:**
  * Hỗ trợ tạo **Slug tùy chỉnh** (ví dụ: `/khuyen-mai-thang-8`) hoặc **tự động sinh ngẫu nhiên** (dạng 6 ký tự như `/P8Hsj9`).
  * **Kiểm tra trùng lặp Slug thời gian thực (Real-time Slug Check)** ngay khi gõ.
* **Tùy chỉnh OpenGraph Card:**
  * Đặt Tiêu đề (`og:title`), Mô tả (`og:description`), Ảnh xem trước (`og:image`).
  * **Hỗ trợ Tải ảnh trực tiếp từ máy (Local Upload max 5MB)** hoặc nhập URL hình ảnh trực tuyến.
* **Thời gian hết hạn (Expiration Date):** Cài đặt ngày giờ hết hạn liên kết. Link hết hạn sẽ tự động thông báo dừng chuyển hướng.
* **Công cụ QR Code tích hợp:** Tự động tạo mã QR Code nét cao cho từng link rút gọn, hỗ trợ sao chép liên kết hoặc tải ảnh QR (PNG) về máy.

### 3. 🔍 Công Cụ Giả Lập Kiểm Tra Bot (DetectBot Inspector)
* Môi trường thử nghiệm cho phép Admin & Thành viên giả lập truy cập link rút gọn dưới tư cách các Crawler mẫu (Facebook External Hit, Zalo Crawler, TelegramBot, TwitterBot...) hoặc nhập Custom User-Agent.
* Hiển thị kết quả kiểm tra mã trạng thái HTTP (200 / 302), chế độ nhận diện (Bot vs Browser) và mã nguồn HTML Meta Tags trả về thực tế.

### 4. 📊 Bảng Điều Khiển & Thống Kê Analytics
* **Tổng quan chỉ số:** Tổng số link đã tạo, tổng lượt click toàn hệ thống, số link tạo trong ngày.
* **Biểu đồ Analytics 30 ngày:** Theo dõi biến động lượt click theo thời gian.
* **Top Link phổ biến:** Xếp hạng các liên kết có lượng truy cập nhiều nhất.
* **Phân tích tỉ lệ Bot vs Human:** Thống kê tỉ lệ truy cập từ bot xem trước bài viết so với lượt click thực của người dùng.

### 5. 👥 Phân Quyền Người Dùng & Giới Hạn Tạo Link (Daily Limit)
* **Phân quyền Role:**
  * **Quản trị viên (Admin):** Toàn quyền quản lý hệ thống, cấu hình domain, sửa/xóa bất kỳ link nào, quản lý người dùng, chỉnh sửa daily limit, reset mật khẩu.
  * **Thành viên (User):** Chỉ xem và quản lý danh sách link rút gọn của chính mình.
* **Giới hạn số lượng link tạo theo ngày (Daily Limit):** Tự động đếm và chặn khi người dùng tạo vượt mức cho phép trong ngày. Admin có thể thay đổi giới hạn riêng cho từng tài khoản.
* **Bắt buộc đổi mật khẩu (Mandatory Password Change):** Hệ thống tự động phát hiện tài khoản sử dụng mật khẩu mặc định (ví dụ: `admin/admin`) hoặc tài khoản vừa được Admin reset mật khẩu, tự động điều hướng và yêu cầu đổi mật khẩu mới để bảo mật.

### 6. ⚙️ Cấu Hình Hệ Thống Dành Cho Admin (System Settings)
* **Branding:** Tùy chỉnh Tên website, Website Domain Prefix (`http://localhost:3000` hoặc domain chạy thực tế), Logo, Favicon.
* **Chuyển hướng:** Tùy chỉnh mã HTTP Redirect mặc định (HTTP 301 Moved Permanently hoặc HTTP 302 Found).
* **Quản lý tính năng:** Bật/tắt cổng Đăng ký tài khoản mới (`Allow Registration`), Bật/tắt upload tệp tin hình ảnh.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

* **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide React Icons, Motion Animation.
* **Backend:** Node.js, Express.js Custom Server, Vite Middleware integration.
* **Database / Persistence:** JSON File Storage (`/data/db.json`) có cơ chế tự động khởi tạo dữ liệu mẫu chuẩn (Auto-seeding).
* **Build Tools:** Vite, esbuild, tsx.

---

## 💻 Hướng Dẫn Cài Đặt & Chạy Dự Án (Installation & Setup)

### Yêu Cầu Môi Trường (Prerequisites)
* Node.js >= 18.0.0
* npm >= 9.0.0 (hoặc yarn / pnpm / bun)

### Các Bước Cài Đặt Chi Tiết

#### Bước 1: Clone Repository hoặc Tải Mã Nguồn
```bash
git clone <repository_url>
cd <project_directory>
```

#### Bước 2: Cài Đặt Các Thư Viện Phụ Thuộc (Dependencies)
```bash
npm install
```

#### Bước 3: Cấu Hình Biến Môi Trường (Environment Variables)
Tạo tệp `.env` tại thư mục gốc dự án (tham khảo từ `.env.example`):
```env
# GEMINI_API_KEY (Tùy chọn nếu sử dụng tính năng AI)
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

# APP_URL: Domain prefix hiển thị cho liên kết rút gọn
APP_URL="http://localhost:3000"
```

#### Bước 4: Chạy Dự Án ở Chế Độ Phát Triển (Development Mode)
```bash
npm run dev
```
Sau khi lệnh chạy thành công, ứng dụng sẽ lắng nghe tại: **`http://localhost:3000`**

#### Bước 5: Biên Dịch & Chạy ở Chế Độ Sản Xuất (Production Mode)
```bash
# Biên dịch frontend và server
npm run build

# Khởi chạy server production
npm run start
```

---

## 🗄️ Hướng Dẫn Cấu Hình Cơ Sở Dữ Liệu MySQL (MySQL Database Setup)

Mặc định dự án sử dụng lưu trữ tệp tin JSON (`data/db.json`) giúp dễ dàng chạy thử nghiệm mà không cần cài đặt database. Khi muốn chuyển đổi hoặc mở rộng ứng dụng sang hệ quản trị cơ sở dữ liệu **MySQL / MariaDB** cho môi trường Production, hãy thực hiện theo hướng dẫn chi tiết dưới đây:

### 1. Tạo Database & Schema SQL (Create Database & Tables)

Kết nối vào MySQL server của bạn (thông qua MySQL Workbench, phpMyAdmin, DBeaver hoặc CLI) và chạy đoạn mã DDL SQL sau để khởi tạo cấu trúc các bảng:

```sql
-- Khởi tạo Database
CREATE DATABASE IF NOT EXISTS `sls_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `sls_db`;

-- 1. Bảng Users (Quản lý tài khoản)
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(50) PRIMARY KEY,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'user') DEFAULT 'user',
  `status` ENUM('active', 'blocked') DEFAULT 'active',
  `daily_limit` INT DEFAULT 5,
  `must_change_password` TINYINT(1) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Bảng Links (Quản lý liên kết rút gọn & OpenGraph metadata)
CREATE TABLE IF NOT EXISTS `links` (
  `id` VARCHAR(50) PRIMARY KEY,
  `slug` VARCHAR(100) NOT NULL UNIQUE,
  `destination_url` TEXT NOT NULL,
  `title` VARCHAR(255) DEFAULT '',
  `description` TEXT,
  `image` TEXT,
  `user_id` VARCHAR(50) NOT NULL,
  `clicks` INT DEFAULT 0,
  `bot_views` INT DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `redirect_code` INT DEFAULT 302,
  `expires_at` DATETIME NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Bảng Settings (Cấu hình hệ thống & danh sách Bot)
CREATE TABLE IF NOT EXISTS `settings` (
  `id` VARCHAR(50) PRIMARY KEY DEFAULT 'default',
  `site_name` VARCHAR(150) DEFAULT 'Smart Link Service',
  `site_domain` VARCHAR(255) DEFAULT 'http://localhost:3000',
  `logo` TEXT,
  `favicon` TEXT,
  `default_redirect` VARCHAR(10) DEFAULT '302',
  `default_limit` INT DEFAULT 5,
  `register_enable` TINYINT(1) DEFAULT 1,
  `upload_enable` TINYINT(1) DEFAULT 1,
  `bot_list` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Bảng Analytics (Thống kê truy cập theo ngày)
CREATE TABLE IF NOT EXISTS `analytics` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `date` DATE NOT NULL UNIQUE,
  `clicks` INT DEFAULT 0,
  `bot_views` INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tạo tài khoản Admin mặc định (Username: admin / Password: admin)
INSERT INTO `users` (`id`, `username`, `email`, `password`, `role`, `status`, `daily_limit`, `must_change_password`)
VALUES ('usr_admin_default', 'admin', 'admin@sls.local', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'admin', 'active', 9999, 1)
ON DUPLICATE KEY UPDATE `id`=`id`;

-- Tạo cấu hình mặc định ban đầu
INSERT INTO `settings` (`id`, `site_name`, `site_domain`, `default_redirect`, `default_limit`, `register_enable`, `upload_enable`, `bot_list`)
VALUES ('default', 'Smart Link Service', 'http://localhost:3000', '302', 5, 1, 1, 'facebookexternalhit, facebot, twitterbot, telegrambot, whatsapp, discordbot, googlebot, bingbot, slackbot, zalo, zalocrawler, linkedinbot, applebot')
ON DUPLICATE KEY UPDATE `id`=`id`;
```

### 2. Khai Báo Biến Môi Trường MySQL (`.env`)

Thêm các tham số cấu hình kết nối database trong tệp `.env`:

```env
# Đổi kiểu database sang mysql
DB_TYPE="mysql"

# Thông tin kết nối MySQL Database
DB_HOST="localhost"
DB_PORT=3306
DB_USER="root"
DB_PASSWORD="your_mysql_password_here"
DB_NAME="sls_db"
```

### 3. Cài Đặt Thư Viện Kết Nối `mysql2`

Chạy lệnh cài đặt thư viện kết nối MySQL tốc độ cao cho Node.js:

```bash
npm install mysql2
```

### 4. Mẫu Kết Nối Connection Pool trong Node.js (`server/db_mysql.ts`)

Tạo tệp `server/db_mysql.ts` để quản lý kết nối và thực thi các câu lệnh truy vấn tới MySQL server:

```typescript
import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sls_db',
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Thử kết nối database
export async function checkConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Kết nối MySQL Database thành công!');
    connection.release();
  } catch (error) {
    console.error('❌ Lỗi kết nối MySQL Database:', error);
  }
}
```

---

## 🔑 Tài Khoản Dùng Thử Demo (Preset Demo Accounts)

Hệ thống đã tự động khởi tạo sẵn 2 tài khoản demo để bạn thử nghiệm ngay sau khi chạy:

| Quyền hạn | Username | Mật khẩu mặc định | Ghi chú |
| :--- | :--- | :--- | :--- |
| **Admin (Quản trị)** | `admin` | `admin` | Sẽ xuất hiện thông báo yêu cầu đổi mật khẩu bắt buộc ngay khi đăng nhập |
| **User (Thành viên)** | `user` | `user123` | Tài khoản thành viên thông thường với giới hạn 5 link/ngày |

---

## 📁 Cấu Trúc Thư Mục Dự Án (Project Structure)

```text
├── data/
│   └── db.json               # Cơ sở dữ liệu JSON lưu trữ links, users, settings, analytics
├── public/
│   └── uploads/              # Thư mục chứa hình ảnh OpenGraph upload từ người dùng
├── server/
│   └── db.ts                 # Module thao tác CRUD cơ sở dữ liệu JSON
├── server.ts                 # Server Express chính, xử lý DetectBot middleware & API routes
├── src/
│   ├── components/           # Component dùng chung (Navbar, OGPreviewCard, BotSimulatorModal, QRCodeModal)
│   ├── views/                # Các màn hình chính (Dashboard, CreateLink, MyLinks, AdminUsers, AdminSettings, PasswordView, LoginView, RegisterView)
│   ├── App.tsx               # Client-side Router & Authentication State Manager
│   ├── main.tsx              # React Entry Point
│   └── index.css             # Tailwind CSS global styles
├── package.json              # Khai báo dependencies và npm scripts
└── README.md                 # Tệp hướng dẫn sử dụng chi tiết
```

---

## ⚡ Các Endpoint API Chính (API Endpoints Overview)

### Public Links & Redirect
* `GET /:slug` - Tự động phát hiện Bot/User: Trả về HTML OpenGraph if Bot, HTTP 302 Redirect if Human.
* `GET /api/public-settings` - Lấy thông tin thương hiệu công khai (Site name, logo, domain).
* `GET /api/check-slug/:slug` - Kiểm tra slug đã tồn tại hay chưa.

### Authentication & User APIs
* `POST /api/login` - Đăng nhập hệ thống.
* `POST /api/register` - Đăng ký tài khoản thành viên mới.
* `POST /api/change-password` - Đổi mật khẩu tài khoản (hỗ trợ bắt buộc đổi mật khẩu).

### Link Management APIs (Yêu cầu đăng nhập)
* `GET /api/links` - Danh sách link của user hiện tại.
* `POST /api/links` - Tạo link rút gọn Smart OG mới.
* `PUT /api/links/:id` - Chỉnh sửa thông tin link.
* `DELETE /api/links/:id` - Xóa link.
* `POST /api/upload` - Tải hình ảnh OpenGraph lên server (Max 5MB).
* `POST /api/simulate-bot` - Chạy giả lập crawler kiểm tra DetectBot.

### Admin APIs (Yêu cầu quyền Admin)
* `GET /api/admin/analytics` - Lấy dữ liệu thống kê tổng quan hệ thống.
* `GET /api/admin/users` - Danh sách người dùng hệ thống.
* `PUT /api/admin/users/:id` - Cập nhật role, daily limit, trạng thái user.
* `POST /api/admin/users/:id/reset-password` - Reset mật khẩu user về mặc định `123456`.
* `DELETE /api/admin/users/:id` - Xóa tài khoản user.
* `GET /api/admin/settings` - Lấy cấu hình hệ thống.
* `POST /api/admin/settings` - Cập nhật cấu hình hệ thống (bot list, redirect code, allow register...).

---

## 🛡️ License & Bán Quyền

Dự án được phát triển phục vụ mục đích quản lý Smart Link OpenGraph chuyên nghiệp. Hãy duy trì mã nguồn sạch và bảo mật biến môi trường khi triển khai thực tế.
