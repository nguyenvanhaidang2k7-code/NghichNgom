# TripWeave AI – giao diện demo

Mở `index.html` hoặc `login.html` bằng trình duyệt. Đây là prototype front-end tĩnh, dùng dữ liệu mẫu và chưa kết nối backend.

## Cấu trúc

- Mỗi màn hình có một file HTML riêng ở thư mục gốc.
- `assets/css/common.css` chứa design system và khung giao diện dùng chung; `partner.css`, `admin.css`, `auth.css`, `design-system.css` chứa style theo nhóm màn hình.
- `assets/js/app.js` dựng topbar/sidebar; `partner.js`, `admin.js`, `login.js` giữ hành vi riêng của từng nhóm màn hình.
- Nội dung trang, style và script được tách file; các trang dùng chung JS/CSS để sửa một lần cho nhất quán.

## Các màn hình

- Đối tác: `experience-list.html`, `experience-form.html`, `orders.html`, `reviews.html`, `revenue.html`, `profile.html`.
- Quản trị: `dashboard.html`, `users.html`, `content.html`, `categories.html`, `settings.html`.
- Khác: `login.html`, `design-system.html`.

Đăng nhập bằng email có chữ `admin` để mở trang quản trị; email khác mở trang đối tác. Các thao tác chỉ cập nhật dữ liệu demo trong phiên trình duyệt.
