# TripWeave AI — Frontend Prototype (HTML/CSS/JS thuần)

Bộ giao diện mẫu cho nền tảng du lịch thông minh **TripWeave AI**, xây dựng hoàn toàn bằng
**HTML + CSS + JavaScript thuần** (không framework, không thư viện ngoài). Mỗi màn hình là một
trang độc lập trong thư mục riêng (`index.html` + `style.css` + `script.js`), dữ liệu mô phỏng
được lưu ở **LocalStorage** của trình duyệt.

## 1. Cách chạy demo

1. Mở **trang đăng nhập** trong trình duyệt: file `login/index.html`. Trang này **gộp chung Đăng nhập
   và Đăng ký trên cùng 1 trang**, chuyển qua lại bằng **2 tab** (không tách thư mục `register/` riêng).
2. **Tab Đăng nhập:** chọn **vai trò** trên thẻ, nhập email hợp lệ + mật khẩu bất kỳ (tối thiểu 6 ký tự):
   - **Quản trị viên** → điều hướng tới `admin-dashboard/` (khu quản trị hệ thống).
   - **Đối tác địa phương** → điều hướng tới `partner-overview/` (trang quản lý của đối tác).
   - **Khách du lịch / Hướng dẫn viên** → toast "tính năng đang phát triển" (demo).
3. **Tab Đăng ký:** bấm tab *Đăng ký* (hoặc dòng **Đăng ký ngay**, hoặc mở thẳng
   `login/index.html#dang-ky`) → chọn 1 trong 4 vai trò, điền thông tin (có validate + đo độ mạnh mật khẩu)
   → tài khoản được ghi vào `tw_users` (vai trò Đối tác tạo thêm hồ sơ **chờ duyệt** trong `tw_partners`)
   → hiện **modal "Đăng ký thành công!"** với 2 lựa chọn: *Ở lại trang này* (làm mới form) hoặc
   *Tới form đăng nhập* (tự chuyển tab và điền sẵn email + mật khẩu + vai trò vừa đăng ký).
4. Di chuyển giữa các màn hình bằng sidebar. Bấm avatar góc phải → đăng xuất (quay về `login/`).
5. Gõ sai đường dẫn? Mở thử `404/index.html` — trang lỗi có minh hoạ, đếm ngược tự về trang đăng nhập,
   nút *Quay lại trang trước* và gợi ý nhanh các màn hình.

> Không cần server: chỉ cần mở file bằng trình duyệt (hoặc Live Server của VS Code).

**Vòng điều hướng giữa các trang dùng chung:**
`login/` (tab *Đăng nhập* ⇄ tab *Đăng ký* `#dang-ky`) → `admin-*` / `partner-*` → (đăng xuất) → `login/`;
`404/` liên kết tới trang đăng nhập, tab đăng ký và cả 3 khu màn hình chính.

## 2. Cấu trúc thư mục (15 trang)

| Thư mục | Màn hình | Vai trò |
|---|---|---|
| `login/` | **Đăng nhập + Đăng ký gộp chung 1 trang**, chuyển qua lại bằng 2 tab. *Tab Đăng nhập*: 4 vai trò (Quản trị viên / Khách du lịch / Hướng dẫn viên / **Đối tác địa phương**) — validation, loading, toast, điều hướng theo vai trò. *Tab Đăng ký* (mở thẳng bằng `login/index.html#dang-ky`): validate (họ tên, email không trùng, SĐT, mật khẩu ≥ 6 ký tự + thanh đo độ mạnh, nhập lại, điều khoản), loading, toast, modal thành công → ghi `tw_users` (Đối tác tạo thêm hồ sơ **chờ duyệt** trong `tw_partners`) | Chung |
| `404/` | **Trang lỗi 404** — minh hoạ vẽ bằng CSS thuần, hiện đường dẫn bị lỗi, đếm ngược 8 giây tự về trang đăng nhập, nút *Quay lại trang trước*, 4 gợi ý màn hình, *Báo liên kết hỏng* (ghi `tw_broken_links`), phím tắt H / L / R | Chung |
| `partner-overview/` | Tổng quan đối tác: 4 thẻ thống kê, biểu đồ cột CSS, việc cần làm | Đối tác |
| `partner-activity-management/` | Quản lý trải nghiệm: danh sách, thêm/sửa (modal), form quản lý, xóa, đổi trạng thái, **AI gợi ý mô tả (mô phỏng)** | Đối tác |
| `partner-orders/` | Đơn đặt: danh sách, tìm kiếm, lọc chip, xem chi tiết, cập nhật trạng thái | Đối tác |
| `partner-reviews/` | Đánh giá: danh sách, phản hồi khách, ẩn đánh giá (có xác nhận) | Đối tác |
| `partner-revenue/` | Doanh thu: thống kê, biểu đồ cột 6 tháng, top dịch vụ, nút làm mới | Đối tác |
| `partner-profile/` | Hồ sơ đối tác: xem (khóa form), sửa + validate, tab Hỗ trợ / Giấy phép | Đối tác |
| `admin-dashboard/` | Tổng quan hệ thống: thống kê người dùng, 2 biểu đồ, top nhà cung cấp | Quản trị |
| `admin-user-management/` | CRUD người dùng: thêm, xem chi tiết, khóa/mở khóa, xóa (có xác nhận) | Quản trị |
| `admin-content/` | Quản trị nội dung: duyệt / từ chối trải nghiệm của đối tác + **AI-2 Route Balance Assistant** (tự quét lộ trình, cảnh báo lịch trình quá dày / 2 điểm cách nhau trên 30km, gợi ý cân bằng, 3 nút Chấp nhận / Yêu cầu chỉnh sửa / Từ chối) | Quản trị |
| `admin-orders/` | Quản trị đơn đặt toàn hệ thống | Quản trị |
| `admin-partners/` | Đối tác địa phương: duyệt hồ sơ, khóa/mở khóa, thêm đối tác | Quản trị |
| `admin-revenue/` | Doanh thu hệ thống + xuất báo cáo (mô phỏng) | Quản trị |
| `admin-settings/` | Cài đặt: cơ chế hiển thị tìm kiếm, 2FA, thông báo, CRUD danh mục | Quản trị |

## 3. Các bảng dữ liệu trong LocalStorage

| Khóa | Nội dung | Trang sử dụng |
|---|---|---|
| `tw_session` | Phiên đăng nhập `{ email, vaiTro }` | login + mọi trang (đăng xuất) + index (hiện thanh phiên) |
| `tw_activities` | Trải nghiệm (ten, loai, gia, sucChua, moTa, trangThai, duyet…) | partner-activity-management, partner-overview, admin-content, index (đếm số trải nghiệm) |
| `tw_orders` | Đơn đặt (khach, traiNghiem, soLuong, trangThai, tong…) | partner-orders, partner-overview, admin-orders |
| `tw_reviews` | Đánh giá (ten, sao, noiDung, phanHoi, an) | partner-reviews, partner-overview |
| `tw_revenue` | Doanh thu đối tác (thangNay, thang[], top[]) | partner-revenue, partner-overview |
| `tw_profile` | Hồ sơ đối tác | partner-profile |
| `tw_users` | Người dùng hệ thống | admin-user-management, **login** (tab Đăng ký ghi tài khoản mới + kiểm tra trùng email) |
| `tw_partners` | Đối tác địa phương (ten, email, vung, linhVuc, trangThai…) | admin-partners, **login** (tab Đăng ký tạo hồ sơ `choduyet` khi chọn vai trò Đối tác) |
| `tw_categories` | Danh mục hoạt động | admin-settings |
| `tw_settings` | Cấu hình hệ thống + thông báo | admin-settings |
| `tw_admin_stats` | Thống kê tổng quan hệ thống | admin-dashboard |
| `tw_admin_revenue` | Doanh thu toàn hệ thống | admin-revenue |
| `tw_broken_links` | Báo cáo liên kết hỏng từ trang 404 (tối đa 50 bản ghi) | 404 |

> `login/index.html` là **điểm vào duy nhất** của demo: mở file này trước, mọi màn hình khác đều
> đi tới được từ đó (hoặc qua các gợi ý nhanh ở trang `404/`).

Mỗi bảng có **dữ liệu mẫu (seed)** được tự ghi vào LocalStorage ở lần mở trang đầu tiên,
nên demo luôn có nội dung mà không cần chuẩn bị trước.

## 4. Trạng thái giao diện (đúng yêu cầu đề bài)

Mọi danh sách/biểu đồ đều mô phỏng đủ 4 trạng thái:

- **Loading:** skeleton shimmer ~0.6s trước khi hiển thị dữ liệu; spinner khi đăng nhập **và khi
  đăng ký** ("Đang tạo tài khoản…"); spinner + chữ "AI đang phân tích…" trong luồng AI gợi ý mô tả.
- **Empty:** khối "Không tìm thấy…/Chưa có…" + nút *Xóa bộ lọc* khi lọc/tìm không ra kết quả.
- **Error:** thông báo lỗi đỏ dưới form đăng nhập / **form đăng ký** (kèm tô đỏ riêng ô nhập sai,
  ví dụ email trùng, mật khẩu nhập lại không khớp, SĐT sai định dạng, chưa tích điều khoản);
  toast lỗi khi validate thất bại; khối "Không thể tải dữ liệu" + nút *Thử lại* nếu LocalStorage hỏng.
- **Success:** toast xanh "Đã thêm/Đã cập nhật/Đã lưu…", dữ liệu ghi ngay vào LocalStorage;
  tab Đăng ký có **modal "Đăng ký thành công!"** với 2 lựa chọn *Ở lại trang này* / *Tới form đăng nhập*.

Các thao tác nguy hiểm (xóa trải nghiệm, xóa người dùng, khóa tài khoản, từ chối nội dung,
ẩn đánh giá, xóa danh mục) luôn đi qua **modal xác nhận**.

## 5. Luồng AI mô phỏng

1. **Gợi ý mô tả trải nghiệm** (partner-activity-management): bấm *✨ AI gợi ý mô tả* →
   loading 1.2s → hiện mô tả + "Vì sao AI đề xuất?" → *Chấp nhận* (điền vào ô mô tả) /
   *Tạo lại* / *Từ chối*.
2. **Ưu tiên đối tác trong kết quả tìm kiếm** (admin-settings): select "Cơ chế hiển thị kết
   quả tìm kiếm" lưu vào `tw_settings.hienThi` — minh họa cho tính năng "AI cá nhân hóa kết
   quả tìm kiếm" của đề bài.
3. **AI-2 · Route Balance Assistant** (admin-content): mở trang → AI **tự động quét** các
   lịch trình do người dùng tạo (thanh tiến trình + trạng thái quét %) → hiện cảnh báo dạng
   *"⚠️ Cảnh báo: lịch trình ngày 2 quá tải (5 điểm dừng), khoảng cách giữa 2 điểm đến quá
   xa (trên 30km)"* → kèm **gợi ý cân bằng lộ trình** → Quản trị viên bấm **Chấp nhận
   (Accept)** / **Yêu cầu chỉnh sửa (Request Edit)** / **Từ chối (Reject)** cho từng cảnh báo.

## 6. Ghi chú kỹ thuật

- Biểu đồ cột, thanh tiến trình, skeleton, switch, modal, **thanh tab có con trượt chạy mượt +
  hình minh hoạ trang 404 (la bàn + kim quay + đường nét đứt)**… đều viết bằng **CSS thuần**
  (không dùng Chart.js hay thư viện nào, không dùng file ảnh).
- JavaScript tổ chức theo từng trang: seed → trạng thái → tiện ích (toast/modal/LS) →
  render → xử lý sự kiện → khởi động; toàn bộ chú thích bằng **tiếng Việt** phục vụ thuyết trình.
- Giao diện responsive: dưới 860px sidebar chuyển thành hàng ngang, form về 1 cột;
  các trang dùng chung (`login/`, `404/`) có 3 mốc **1100px / 900px / 620px**
  (menu hamburger, lưới 2 cột → 1 cột) và tôn trọng `prefers-reduced-motion`.
- Tab *Đăng nhập* / *Đăng ký* nằm chung trong `login/index.html`; trạng thái tab được đồng bộ qua
  **hash trên URL**: `login/index.html#dang-ky` mở thẳng tab Đăng ký, `#dang-nhap` mở tab Đăng nhập
  (tải lại trang vẫn giữ đúng tab đang xem). Có thể chuyển tab bằng nút bấm, dòng *Đăng ký ngay* /
  *Đăng nhập ngay*, hoặc phím ← → khi con trỏ đang ở thanh tab.
- Phiên đăng nhập được lưu vào `tw_session` (email + vai trò + thời điểm) khi đăng nhập thành công
  với vai trò Quản trị viên / Đối tác địa phương.
