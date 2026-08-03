# HƯỚNG DẪN NÂNG CẤP CODE QUA GITHUB TRÊN HOSTINGER (BẢO TỒN DATABASE & ẢNH UPLOAD)

Tài liệu này hướng dẫn chi tiết cách cấu hình và thực hiện nâng cấp code (Update/Deploy) trực tiếp từ GitHub về Hostinger mà **hoàn toàn giữ nguyên dữ liệu MySQL, cấu hình hệ thống và toàn bộ ảnh upload**.

---

## 🛡️ CƠ CHẾ BẢO VỆ DỮ LIỆU CỦA HỆ THỐNG (PHƯƠNG ÁN 1)

1. **Cơ sở dữ liệu MySQL (Tự động Nâng cấp Cấu trúc/Auto Migration)**:
   - Khi bạn nâng cấp code mới và khởi chạy lại ứng dụng, hệ thống sẽ thực hiện `CREATE TABLE IF NOT EXISTS` và tự động kiểm tra, bổ sung các cột mới (`ALTER TABLE ADD COLUMN`) nếu phiên bản code mới yêu cầu.
   - **Tuyệt đối không xóa hay ghi đè** bất kỳ dòng dữ liệu (Users, Links, Logs, Visits, Settings) nào đã có trong MySQL.

2. **Hình ảnh Upload cố định (Persistent Uploads)**:
   - Hệ thống lưu trữ ảnh tại thư mục `data/uploads/` (hoặc thư mục tùy chỉnh qua biến `UPLOADS_DIR`).
   - Thư mục này đã được loại trừ trong `.gitignore` (`data/uploads/*`, `public/uploads/*`, `data/store.json`).
   - Khi Hostinger kéo code mới từ GitHub (`git pull` hoặc Auto-Deploy), Git sẽ **không chạm vào hoặc xóa** các tệp ảnh đã upload trong thư mục này.

---

## 🚀 CÁC BƯỚC THỰC HIỆN NÂNG CẤP WEBSITE TRÊN HOSTINGER

### Bước 1: Sao lưu dữ liệu dự phòng (Tùy chọn khuyến nghị)
Trước khi đẩy phiên bản code mới lên GitHub, bạn có thể tải bản Sao lưu Database dự phòng từ Admin Panel:
1. Đăng nhập tài khoản Quản trị viên (Admin).
2. Truy cập API Sao lưu: `https://ten-mien-cua-ban.com/api/admin/backup/export`
3. Hệ thống sẽ tự động tải về tệp `smartlink_backup_xxxx.json` chứa toàn bộ tài khoản, liên kết và nhật ký.

---

### Bước 2: Thiết lập biến môi trường trên Hostinger Environment
Trong phần Cấu hình Ứng dụng Node.js / Environment Variables trên Hostinger Dashboard, đảm bảo bạn đã điền các biến sau:

| Tên biến | Ví dụ giá trị | Mô tả |
|---|---|---|
| `MYSQL_HOST` | `127.0.0.1` hoặc IP host MySQL | Host máy chủ MySQL Hostinger |
| `MYSQL_PORT` | `3306` | Cổng kết nối MySQL |
| `MYSQL_USER` | `u123456789_user` | Tên người dùng Database |
| `MYSQL_PASSWORD` | `MatKhauKhaiBao123` | Mật khẩu Database |
| `MYSQL_DATABASE` | `u123456789_db` | Tên Cơ sở dữ liệu MySQL |
| `UPLOADS_DIR` | `./data/uploads` | Thư mục lưu ảnh cố định ngoài Git |

---

### Bước 3: Đẩy Code mới lên GitHub
Tại máy tính cá nhân hoặc trong kho code:
```bash
git add .
git commit -m "Nâng cấp tính năng mới"
git push origin main
```

---

### Bước 4: Deploy & Khởi chạy lại trên Hostinger
1. Vào **Hostinger Dashboard** -> **Git / Deployments** (hoặc Web Applications).
2. Nhấn **Deploy / Pull Latest Changes**.
3. Chạy lệnh xây dựng nếu cần:
   ```bash
   npm run build
   ```
4. Restart lại Node.js app.

---

## 🔍 KIỂM TRA SAU KHI NÂNG CẤP
- Truy cập liên kết: `https://ten-mien-cua-ban.com/api/db-status`
- Đăng nhập Admin để kiểm tra: `isUsingMySQL: true`.
- Mọi dữ liệu cũ (Tài khoản, Link rút gọn, Ảnh upload) sẽ tự động xuất hiện đầy đủ trên giao diện mới!
