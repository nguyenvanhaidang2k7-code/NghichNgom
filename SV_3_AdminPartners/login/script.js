/* =====================================================
   TRANG ĐĂNG NHẬP - TripWeave AI (CÓ CHỌN VAI TRÒ)
   - 4 vai trò: Quản trị viên (admin) / Khách du lịch
     (traveler) / Hướng dẫn viên (guide) / Đối tác địa
     phương (partner).
   - Quản trị viên: kiểm tra thông tin (demo: email hợp lệ +
     mật khẩu >= 6 ký tự là được chấp nhận) rồi CHUYỂN HƯỚNG
     vào trang quản trị ../admin-dashboard/index.html.
   - Đối tác địa phương: cùng quy tắc kiểm tra, CHUYỂN HƯỚNG
     vào trang quản lý của đối tác ../partner-overview/index.html.
   - Khách du lịch / Hướng dẫn viên: hiện toast (pop-up nhẹ
     nhàng) "Tính năng đang phát triển...".
   ===================================================== */

const $ = (s) => document.querySelector(s);

const form = $('#login-form');
const emailInput = $('#email');
const passInput = $('#password');
const submitBtn = $('#submit-btn');
const errorBox = $('#form-error');
const rolePicker = $('#role-picker');

// Thông tin hiển thị của từng vai trò (dùng cho toast + chuyển hướng).
// Vai trò có thuộc tính "trang" = được phép đăng nhập và chuyển hướng.
const THONG_TIN_VAI_TRO = {
  admin: { ten: 'Quản trị viên', icon: '🛡️', trang: '../admin-dashboard/index.html' },
  traveler: { ten: 'Khách du lịch', icon: '🧳' },
  guide: { ten: 'Hướng dẫn viên', icon: '🧭' },
  partner: { ten: 'Đối tác địa phương', icon: '🏪', trang: '../partner-overview/index.html' }
};

// ---------- TOAST: thông báo dạng pop-up nhẹ nhàng ----------
function toast(thongDiep, loai = 'success') {
  const hop = document.createElement('div');
  hop.className = 'toast ' + loai;
  hop.textContent = thongDiep;
  $('#toast-box').appendChild(hop);
  setTimeout(() => hop.remove(), 3500);
}

// ---------- HIỆN / ẨN THÔNG BÁO LỖI CỦA FORM ----------
function baoLoi(msg) {
  errorBox.textContent = msg;
  errorBox.hidden = false;
}
function xoaLoi() {
  errorBox.hidden = true;
  errorBox.textContent = '';
}

// ---------- BỘ CHỌN VAI TRÒ ----------
// Lấy giá trị vai trò đang được chọn (mặc định: admin)
function vaiTroHienTai() {
  const o = rolePicker.querySelector('input[name="vai-tro"]:checked');
  return o ? o.value : 'admin';
}
// Tô sáng thẻ vai trò đang chọn (class .active) + hỗ trợ bàn phím
rolePicker.addEventListener('change', () => {
  rolePicker.querySelectorAll('.role-opt').forEach((the) => {
    the.classList.toggle('active', the.querySelector('input').checked);
  });
  xoaLoi();
});

// ---------- LOGIC XỬ LÝ KHI NHẤN "ĐĂNG NHẬP" ----------
form.addEventListener('submit', (e) => {
  e.preventDefault();
  xoaLoi();

  const vaiTro = vaiTroHienTai();
  const email = emailInput.value.trim();
  const matKhau = passInput.value;

  // --- Kiểm tra dữ liệu nhập (áp dụng cho cả 3 vai trò) ---
  if (!email || !matKhau) {
    baoLoi('Vui lòng nhập đầy đủ Email và Mật khẩu.');
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    baoLoi('Email không đúng định dạng (ví dụ: ban@vidu.com).');
    return;
  }
  if (matKhau.length < 6) {
    baoLoi('Mật khẩu phải có ít nhất 6 ký tự.');
    return;
  }

  // --- Trạng thái LOADING: khóa nút + hiện spinner xoay ---
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner"></span> Đang đăng nhập...';

  // Mô phỏng gửi yêu cầu lên máy chủ (~1 giây)
  setTimeout(() => {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Đăng nhập';

    // --- Admin & Đối tác địa phương: đăng nhập + chuyển hướng vào khu vực tương ứng ---
    const ttDangNhap = THONG_TIN_VAI_TRO[vaiTro];
    if (ttDangNhap && ttDangNhap.trang) {
      // Demo: email hợp lệ + mật khẩu >= 6 ký tự -> chấp nhận đăng nhập.
      // Lưu phiên vào LocalStorage (bọc try/catch vì file:// có thể bị chặn).
      try {
        localStorage.setItem('tw_session', JSON.stringify({
          email,
          vaiTro,
          tenVaiTro: ttDangNhap.ten,
          thoiGian: Date.now()
        }));
      } catch (err) { /* bỏ qua nếu trình duyệt chặn LocalStorage */ }

      toast(ttDangNhap.icon + ' Đăng nhập thành công với vai trò ' + ttDangNhap.ten + '!', 'success');
      // CHUYỂN HƯỚNG: admin -> trang quản trị; partner -> trang quản lý đối tác
      setTimeout(() => { window.location.href = ttDangNhap.trang; }, 700);
      return;
    }

    // --- Khách du lịch / Hướng dẫn viên: tính năng đang phát triển ---
    const tt = THONG_TIN_VAI_TRO[vaiTro];
    toast(
      tt.icon + ' Tính năng dành cho ' + tt.ten +
      ' đang trong giai đoạn phát triển — hệ thống sẽ chuyển bạn đến trang tương ứng khi hoàn tất.',
      'info'
    );
  }, 1000);
});

// ---------- QUÊN MẬT KHẨU (demo) ----------
$('#forgot-link').addEventListener('click', (e) => {
  e.preventDefault();
  toast('Chức năng quên mật khẩu sẽ gửi link đặt lại qua email (demo).', 'info');
});

/* =====================================================
   PHẦN MỞ RỘNG (1/3): TAB CHUYỂN ĐỔI "ĐĂNG NHẬP / ĐĂNG KÝ"
   Đăng ký được GỘP CHUNG vào trang login (không tách thư mục
   register riêng). Toàn bộ logic đăng nhập phía trên giữ nguyên.
   - Chuyển tab bằng: nút trên thanh tab, dòng "Đăng ký ngay" /
     "Đăng nhập ngay", phím ← →, hoặc đường dẫn #dang-ky.
   ===================================================== */
const theLogin = $('#login-card');
const khoiTabs = $('#tabs');
const tabDangNhap = $('#tab-dangnhap');
const tabDangKy = $('#tab-dangky');
const CAC_TAB = ['dangnhap', 'dangky']; // 2 tab hợp lệ

// ---------- CHUYỂN SANG TAB ĐƯỢC YÊU CẦU ----------
function moTab(ten, doiUrl = true) {
  if (!CAC_TAB.includes(ten)) return;

  // 1) Cập nhật thanh tab: trạng thái active + vị trí con trượt (CSS tự trượt)
  khoiTabs.dataset.active = ten;
  [tabDangNhap, tabDangKy].forEach((nut) => {
    const dangChon = nut.dataset.tab === ten;
    nut.classList.toggle('active', dangChon);
    nut.setAttribute('aria-selected', dangChon ? 'true' : 'false');
  });

  // 2) Ẩn form này - hiện form kia (có hiệu ứng vào mượt trong CSS)
  document.querySelectorAll('.panel').forEach((p) => {
    p.classList.toggle('active', p.dataset.panel === ten);
  });

  // 3) Đổi nội dung giới thiệu ở cột trái cho hợp ngữ cảnh
  theLogin.dataset.mode = ten;

  // 4) Đồng bộ đường dẫn để tải lại trang vẫn đúng tab đang mở
  //    (bọc try/catch vì giao thức file:// có thể bị trình duyệt chặn)
  if (doiUrl) {
    const hash = ten === 'dangky' ? '#dang-ky' : '#dang-nhap';
    if (window.location.hash !== hash) {
      try { history.replaceState(null, '', hash); } catch (err) { /* bỏ qua */ }
    }
  }

  // 5) Dọn thông báo lỗi cũ của cả 2 form mỗi lần đổi tab
  xoaLoi();
  dkXoaLoi();
}

// Bấm vào nút trên thanh tab
khoiTabs.addEventListener('click', (e) => {
  const nut = e.target.closest('.tab');
  if (nut) moTab(nut.dataset.tab);
});

// Dùng phím ← / → khi con trỏ đang ở thanh tab (hỗ trợ bàn phím)
khoiTabs.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') { e.preventDefault(); moTab('dangky'); tabDangKy.focus(); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); moTab('dangnhap'); tabDangNhap.focus(); }
});

// Dòng "Đăng ký ngay" (ở form đăng nhập) và "Đăng nhập ngay" (ở form đăng ký)
$('#lnk-sang-dang-ky').addEventListener('click', (e) => { e.preventDefault(); moTab('dangky'); });
$('#lnk-sang-dang-nhap').addEventListener('click', (e) => { e.preventDefault(); moTab('dangnhap'); });

// Người dùng sửa #dang-ky / #dang-nhap trên thanh địa chỉ -> đổi tab theo
window.addEventListener('hashchange', () => {
  if (window.location.hash === '#dang-ky') moTab('dangky', false);
  else if (window.location.hash === '#dang-nhap') moTab('dangnhap', false);
});

/* =====================================================
   PHẦN MỞ RỘNG (2/3): FORM ĐĂNG KÝ - DỮ LIỆU & HÀM HỖ TRỢ
   ===================================================== */
const KHO_NGUOI_DUNG = 'tw_users';    // khóa bảng người dùng (admin-user-management đọc)
const KHO_DOI_TAC = 'tw_partners';    // khóa bảng đối tác (admin-partners đọc)

// Dữ liệu mẫu: seed sẵn vào LocalStorage nếu chưa có, để tài khoản vừa đăng ký
// nằm chung danh sách với dữ liệu demo thay vì làm biến mất dữ liệu mẫu.
// (Nội dung khớp đúng 2 màn hình admin-user-management và admin-partners.)
const DK_NGUOI_DUNG_MAU = [
  { id: 'u01', ten: 'admin', email: 'admin@gmail.com', vaiTro: 'Quản trị', matKhau: '123456', sdt: '0901 111 111', ngay: '01/2024', trangThai: 'hoatdong' },
  { id: 'u02', ten: 'Nguyễn Thị Hồng', email: 'hong.nt@gmail.com', vaiTro: 'Khách du lịch', matKhau: '123456', sdt: '0901 222 222', ngay: '02/2024', trangThai: 'hoatdong' },
  { id: 'u03', ten: 'Trần Văn Minh', email: 'minh.tv@gmail.com', vaiTro: 'Hướng dẫn viên', matKhau: '123456', sdt: '0901 333 333', ngay: '02/2024', trangThai: 'hoatdong' },
  { id: 'u04', ten: 'Lê Quốc Bảo', email: 'bao.lq@gmail.com', vaiTro: 'Đối tác', matKhau: '123456', sdt: '0901 444 444', ngay: '03/2024', trangThai: 'hoatdong' },
  { id: 'u05', ten: 'Phạm Thu Hà', email: 'ha.pt@gmail.com', vaiTro: 'Khách du lịch', matKhau: '123456', sdt: '0901 555 555', ngay: '03/2024', trangThai: 'hoatdong' },
  { id: 'u06', ten: 'Võ Đức Duy', email: 'duy.vd@gmail.com', vaiTro: 'Hướng dẫn viên', matKhau: '123456', sdt: '0901 666 666', ngay: '04/2024', trangThai: 'biKhoa' },
  { id: 'u07', ten: 'Đặng Thùy Linh', email: 'linh.dt@gmail.com', vaiTro: 'Đối tác', matKhau: '123456', sdt: '0901 777 777', ngay: '04/2024', trangThai: 'hoatdong' },
  { id: 'u08', ten: 'Bùi Thanh Tùng', email: 'tung.bt@gmail.com', vaiTro: 'Khách du lịch', matKhau: '123456', sdt: '0901 888 888', ngay: '05/2024', trangThai: 'hoatdong' }
];
const DK_DOI_TAC_MAU = [
  { id: 'p01', ten: 'Mekong Delta Boat Tours', email: 'contact@mekongboat.vn', sdt: '0901 444 444', khuVuc: 'Cần Thơ', loai: 'Tour thuyền', soTraiNghiem: 12, ngayThamGia: '01/2024', trangThai: 'hoatdong' },
  { id: 'p02', ten: 'Hội An Lantern Walk', email: 'lantern@hoianwalk.vn', sdt: '0901 777 777', khuVuc: 'Hội An', loai: 'Tour đêm', soTraiNghiem: 8, ngayThamGia: '02/2024', trangThai: 'hoatdong' },
  { id: 'p03', ten: 'Sapa Trekking Homestay', email: 'hello@sapatrek.vn', sdt: '0901 999 999', khuVuc: 'Sapa', loai: 'Trekking', soTraiNghiem: 15, ngayThamGia: '03/2024', trangThai: 'hoatdong' },
  { id: 'p04', ten: 'Phú Quốc Snorkel', email: 'info@pqsnorkel.vn', sdt: '0901 222 333', khuVuc: 'Phú Quốc', loai: 'Lặn biển', soTraiNghiem: 6, ngayThamGia: '04/2024', trangThai: 'choduyet' },
  { id: 'p05', ten: 'Hà Nội Street Food Tour', email: 'hnstreetfood@gmail.com', sdt: '0901 555 666', khuVuc: 'Hà Nội', loai: 'Ẩm thực', soTraiNghiem: 20, ngayThamGia: '05/2024', trangThai: 'hoatdong' },
  { id: 'p06', ten: 'Đà Lạt Coffee Farm', email: 'dalatfarm@coffee.vn', sdt: '0901 888 111', khuVuc: 'Đà Lạt', loai: 'Nông trại', soTraiNghiem: 4, ngayThamGia: '06/2024', trangThai: 'choduyet' },
  { id: 'p07', ten: 'Nha Trang Kayak', email: 'ntkayak@gmail.com', sdt: '0901 333 222', khuVuc: 'Nha Trang', loai: 'Kayak', soTraiNghiem: 9, ngayThamGia: '07/2024', trangThai: 'biKhoa' }
];

// Nhãn vai trò ghi vào tw_users (khớp đúng dữ liệu mẫu của admin-user-management)
const DK_NHAN_VAI_TRO = { admin: 'Quản trị', traveler: 'Khách du lịch', guide: 'Hướng dẫn viên', partner: 'Đối tác' };

// ---------- ĐỌC / GHI LocalStorage CÓ DỰ PHÒNG ----------
function dkDoc(khoa, duPhong) {
  try {
    const raw = localStorage.getItem(khoa);
    if (!raw) return duPhong.map((o) => ({ ...o })); // chưa có -> bản sao dữ liệu mẫu
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : duPhong.map((o) => ({ ...o }));
  } catch (err) { return duPhong.map((o) => ({ ...o })); }
}
function dkGhi(khoa, duLieu) {
  try { localStorage.setItem(khoa, JSON.stringify(duLieu)); return true; }
  catch (err) { return false; } // trình duyệt chặn / chế độ ẩn danh
}

// ---------- CÁC Ô NHẬP CỦA FORM ĐĂNG KÝ ----------
const dkForm = $('#register-form');
const dkPicker = $('#role-picker-dk');
const dkTen = $('#dk-ten');
const dkSdt = $('#dk-sdt');
const dkEmail = $('#dk-email');
const dkKhuVuc = $('#dk-khu-vuc');
const dkLinhVuc = $('#dk-linh-vuc');
const dkMatKhau = $('#dk-mat-khau');
const dkNhapLai = $('#dk-nhap-lai');
const dkDieuKhoan = $('#dk-dieu-khoan');
const dkError = $('#dk-form-error');
const dkBtn = $('#dk-submit-btn');
const dkKhoiDoiTac = $('#dk-khoi-doi-tac');
const dkOThanhDo = $('#dk-strength-bar');
const dkTxtThanhDo = $('#dk-strength-txt');
const dkTheDieuKhoan = $('.terms');
const CAC_O_DANG_KY = [dkTen, dkSdt, dkEmail, dkKhuVuc, dkMatKhau, dkNhapLai];

// ---------- VAI TRÒ ĐANG CHỌN Ở FORM ĐĂNG KÝ ----------
function dkVaiTro() {
  const o = dkPicker.querySelector('input[name="vai-tro-dk"]:checked');
  return o ? o.value : 'traveler';
}
// Tô sáng thẻ vai trò đang chọn (giống hệt form đăng nhập)
function dkDongBoTheVaiTro() {
  dkPicker.querySelectorAll('.role-opt').forEach((the) => {
    the.classList.toggle('active', the.querySelector('input').checked);
  });
}
dkPicker.addEventListener('change', () => {
  dkDongBoTheVaiTro();
  // Chỉ hiện khối "Khu vực / Lĩnh vực" khi chọn vai trò Đối tác
  dkKhoiDoiTac.classList.toggle('hien', dkVaiTro() === 'partner');
  dkXoaLoi();
});

// ---------- THÔNG BÁO LỖI RIÊNG CHO FORM ĐĂNG KÝ ----------
function dkBaoLoi(msg, oLoi) {
  dkError.textContent = msg;
  dkError.hidden = false;
  // Tô đỏ đúng ô nhập sai để người dùng biết sửa chỗ nào
  CAC_O_DANG_KY.forEach((o) => o.classList.remove('loi'));
  dkTheDieuKhoan.classList.remove('loi');
  if (oLoi === 'dieu-khoan') dkTheDieuKhoan.classList.add('loi');
  else if (oLoi) oLoi.classList.add('loi');
}
function dkXoaLoi() {
  if (!dkError) return;
  dkError.hidden = true;
  dkError.textContent = '';
  CAC_O_DANG_KY.forEach((o) => o.classList.remove('loi'));
  if (dkTheDieuKhoan) dkTheDieuKhoan.classList.remove('loi');
}
// Gõ lại là tự xóa lỗi cũ -> trải nghiệm nhập liệu tự nhiên
CAC_O_DANG_KY.forEach((o) => {
  o.addEventListener('input', () => { o.classList.remove('loi'); if (!dkError.hidden) dkXoaLoi(); });
});
dkDieuKhoan.addEventListener('change', () => dkXoaLoi());

// ---------- ĐO ĐỘ MẠNH MẬT KHẨU (cập nhật ngay khi đang gõ) ----------
function dkDoManh(mk) {
  let diem = 0;
  if (mk.length >= 6) diem++;
  if (mk.length >= 10) diem++;
  if (/[a-z]/.test(mk) && /[A-Z]/.test(mk)) diem++;
  if (/\d/.test(mk)) diem++;
  if (/[^A-Za-z0-9]/.test(mk)) diem++;
  if (mk.length < 6) return { cap: 1, phanTram: 20, nhan: 'Yếu — mật khẩu cần tối thiểu 6 ký tự', mau: '#dc2626' };
  if (diem <= 2) return { cap: 1, phanTram: 40, nhan: 'Yếu — nên thêm chữ hoa và số', mau: '#dc2626' };
  if (diem === 3) return { cap: 2, phanTram: 70, nhan: 'Trung bình — thêm ký tự đặc biệt sẽ an toàn hơn', mau: '#d97706' };
  return { cap: 3, phanTram: 100, nhan: 'Mạnh — rất tốt!', mau: '#16a34a' };
}
dkMatKhau.addEventListener('input', () => {
  const mk = dkMatKhau.value;
  const kq = dkDoManh(mk);
  dkOThanhDo.style.width = (mk ? kq.phanTram : 0) + '%';
  dkOThanhDo.style.background = kq.mau;
  dkTxtThanhDo.textContent = mk ? 'Độ mạnh mật khẩu: ' + kq.nhan : 'Độ mạnh mật khẩu: chưa nhập';
  dkTxtThanhDo.className = 'strength-txt' + (mk ? ' manh-' + kq.cap : '');
});

// ---------- NÚT HIỆN / ẨN MẬT KHẨU ----------
$('#btn-hien-mk').addEventListener('click', function () {
  const dangAn = dkMatKhau.type === 'password';
  dkMatKhau.type = dangAn ? 'text' : 'password';
  this.textContent = dangAn ? '🙈' : '👁';
  this.setAttribute('aria-label', dangAn ? 'Ẩn mật khẩu' : 'Hiện mật khẩu');
  dkMatKhau.focus();
});

// ---------- 2 LINK ĐIỀU KHOẢN / BẢO MẬT (demo, không rời trang) ----------
$('#lnk-dieu-khoan').addEventListener('click', (e) => {
  e.preventDefault();
  toast('Điều khoản dịch vụ: không hủy trong 24h trước giờ khởi hành, hoàn tiền theo chính sách từng trải nghiệm.', 'info');
});
$('#lnk-bao-mat').addEventListener('click', (e) => {
  e.preventDefault();
  toast('Chính sách bảo mật: dữ liệu chỉ dùng để vận hành dịch vụ, không chia sẻ cho bên thứ ba (demo).', 'info');
});

/* =====================================================
   PHẦN MỞ RỘNG (3/3): KIỂM TRA FORM ĐĂNG KÝ + GHI LocalStorage
   ===================================================== */
const DK_REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DK_REGEX_SDT = /^(\+?84|0)(3|5|7|8|9)\d{8}$/; // SĐT Việt Nam 10 số

// Thông tin lần đăng ký thành công gần nhất (dùng cho nút "Tới form đăng nhập")
let lanDangKyCuoi = null;

dkForm.addEventListener('submit', (e) => {
  e.preventDefault();
  dkXoaLoi();

  const vaiTro = dkVaiTro();
  const ten = dkTen.value.trim();
  const sdt = dkSdt.value.trim();
  const email = dkEmail.value.trim().toLowerCase();
  const mk = dkMatKhau.value;
  const mk2 = dkNhapLai.value;

  // ---------- TRẠNG THÁI ERROR: kiểm tra lần lượt từng trường ----------
  if (ten.length < 2) { dkBaoLoi('Vui lòng nhập họ và tên (tối thiểu 2 ký tự).', dkTen); dkTen.focus(); return; }
  if (!sdt) { dkBaoLoi('Vui lòng nhập số điện thoại.', dkSdt); dkSdt.focus(); return; }
  if (!DK_REGEX_SDT.test(sdt.replace(/[\s.\-()]/g, ''))) {
    dkBaoLoi('Số điện thoại không hợp lệ. Ví dụ hợp lệ: 0901 234 567.', dkSdt); dkSdt.focus(); return;
  }
  if (!email) { dkBaoLoi('Vui lòng nhập email.', dkEmail); dkEmail.focus(); return; }
  if (!DK_REGEX_EMAIL.test(email)) {
    dkBaoLoi('Email không đúng định dạng. Ví dụ hợp lệ: ban@vidu.com.', dkEmail); dkEmail.focus(); return;
  }

  // Email trùng -> báo lỗi thay vì ghi đè tài khoản đã có
  const dsNguoiDung = dkDoc(KHO_NGUOI_DUNG, DK_NGUOI_DUNG_MAU);
  if (dsNguoiDung.some((u) => String(u.email || '').trim().toLowerCase() === email)) {
    dkBaoLoi('Email này đã được đăng ký. Hãy dùng email khác hoặc bấm "Đăng nhập ngay".', dkEmail);
    dkEmail.focus();
    return;
  }

  // Trường riêng cho Đối tác chỉ bắt buộc khi đúng vai trò đó
  if (vaiTro === 'partner' && !dkKhuVuc.value.trim()) {
    dkBaoLoi('Đối tác vui lòng nhập khu vực hoạt động.', dkKhuVuc); dkKhuVuc.focus(); return;
  }

  if (mk.length < 6) { dkBaoLoi('Mật khẩu phải có ít nhất 6 ký tự.', dkMatKhau); dkMatKhau.focus(); return; }
  if (mk !== mk2) { dkBaoLoi('Mật khẩu nhập lại không khớp.', dkNhapLai); dkNhapLai.focus(); return; }
  if (!dkDieuKhoan.checked) {
    dkBaoLoi('Bạn cần đồng ý với Điều khoản dịch vụ để tiếp tục.', 'dieu-khoan'); return;
  }

  // ---------- TRẠNG THÁI LOADING ----------
  dkBtn.disabled = true;
  dkBtn.innerHTML = '<span class="spinner"></span> Đang tạo tài khoản...';

  // Giả lập gọi API đăng ký (demo chạy bằng LocalStorage)
  setTimeout(() => {
    const homNay = new Date();
    const thangNam = String(homNay.getMonth() + 1).padStart(2, '0') + '/' + homNay.getFullYear();
    const soDuoi = Date.now().toString(36);

    // (1) Ghi tài khoản vào bảng tw_users — đúng cấu trúc admin-user-management
    dsNguoiDung.push({
      id: 'u' + soDuoi,
      ten, email,
      vaiTro: DK_NHAN_VAI_TRO[vaiTro] || 'Khách du lịch',
      matKhau: mk, sdt,
      ngay: thangNam,
      trangThai: 'hoatdong'
    });
    const okUsers = dkGhi(KHO_NGUOI_DUNG, dsNguoiDung);

    // (2) Riêng vai trò Đối tác: tạo thêm hồ sơ CHỜ DUYỆT trong tw_partners
    //     để Quản trị viên duyệt ở màn hình admin-partners.
    let okPartners = true;
    if (vaiTro === 'partner') {
      const dsDoiTac = dkDoc(KHO_DOI_TAC, DK_DOI_TAC_MAU);
      dsDoiTac.push({
        id: 'p' + soDuoi,
        ten, email, sdt,
        khuVuc: dkKhuVuc.value.trim(),
        loai: dkLinhVuc.value,
        soTraiNghiem: 0,
        ngayThamGia: thangNam,
        trangThai: 'choduyet'
      });
      okPartners = dkGhi(KHO_DOI_TAC, dsDoiTac);
    }

    // Kết thúc LOADING
    dkBtn.disabled = false;
    dkBtn.textContent = 'Đăng ký tài khoản';

    if (!okUsers || !okPartners) {
      dkBaoLoi('Trình duyệt đang chặn LocalStorage (chế độ ẩn danh?) nên chưa lưu được tài khoản.', null);
      toast('Không lưu được tài khoản vào LocalStorage.', 'error');
      return;
    }

    // ---------- TRẠNG THÁI SUCCESS: hiện modal + gợi ý bước tiếp theo ----------
    const tt = THONG_TIN_VAI_TRO[vaiTro];
    lanDangKyCuoi = { email, matKhau: mk, vaiTro };
    moModalThanhCong(ten, email, vaiTro);
    toast(tt.icon + ' Đã tạo tài khoản ' + tt.ten + ' thành công!', 'success');
  }, 1100);
});

// ---------- MODAL "ĐĂNG KÝ THÀNH CÔNG" ----------
const modalDangKy = $('#modal-dang-ky');

function moModalThanhCong(ten, email, vaiTro) {
  const tt = THONG_TIN_VAI_TRO[vaiTro];
  // Nội dung gợi ý bước tiếp theo khác nhau theo vai trò vừa đăng ký
  let buocTiep;
  if (vaiTro === 'partner') {
    buocTiep = 'Hồ sơ đối tác của bạn đang ở trạng thái <b>chờ duyệt</b>. '
      + 'Quản trị viên sẽ kích hoạt trong màn hình <b>Đối tác địa phương</b> '
      + '(menu Đối tác → Duyệt & kích hoạt).';
  } else if (vaiTro === 'admin') {
    buocTiep = 'Bạn có thể đăng nhập ngay để vào <b>trang Quản trị</b> (demo).';
  } else {
    buocTiep = 'Bạn có thể đăng nhập ngay để khám phá và đặt trải nghiệm (demo).';
  }
  $('#modal-noi-dung').innerHTML =
    'Tài khoản <b>' + email + '</b> đã được tạo với vai trò <b>' + tt.ten + '</b>.<br><br>' + buocTiep;
  modalDangKy.classList.add('open');
}
function dongModal() { modalDangKy.classList.remove('open'); }

// Xóa trắng form đăng ký để sẵn sàng cho lần nhập tiếp theo
function dkLamMoiForm() {
  dkForm.reset();
  dkDongBoTheVaiTro();                                  // trả về vai trò mặc định trong HTML
  dkKhoiDoiTac.classList.toggle('hien', dkVaiTro() === 'partner');
  dkOThanhDo.style.width = '0%';
  dkTxtThanhDo.textContent = 'Độ mạnh mật khẩu: chưa nhập';
  dkTxtThanhDo.className = 'strength-txt';
  dkMatKhau.type = 'password';
  $('#btn-hien-mk').textContent = '👁';
  dkXoaLoi();
}

// Nút "Ở lại trang này": đóng modal + làm mới form đăng ký
$('#btn-o-lai').addEventListener('click', () => { dongModal(); dkLamMoiForm(); dkTen.focus(); });

// Nút "Tới form đăng nhập": đóng modal, chuyển tab Đăng nhập, điền sẵn tài khoản vừa tạo
$('#btn-toi-dang-nhap').addEventListener('click', () => {
  dongModal();
  moTab('dangnhap');
  if (lanDangKyCuoi) {
    emailInput.value = lanDangKyCuoi.email;
    passInput.value = lanDangKyCuoi.matKhau;
    const oVaiTro = rolePicker.querySelector('input[value="' + lanDangKyCuoi.vaiTro + '"]');
    if (oVaiTro) {
      oVaiTro.checked = true;
      rolePicker.querySelectorAll('.role-opt').forEach((the) => {
        the.classList.toggle('active', the.querySelector('input').checked);
      });
    }
  }
  submitBtn.focus();
});

// Đóng modal khi bấm ra vùng nền tối hoặc nhấn phím Escape
modalDangKy.addEventListener('click', (e) => { if (e.target === modalDangKy) dongModal(); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalDangKy.classList.contains('open')) dongModal();
});

/* =====================================================
   KHỞI ĐỘNG: đồng bộ trạng thái ban đầu của tab Đăng ký
   ===================================================== */
(function khoiDong() {
  // Hiện/ẩn khối thông tin Đối tác theo vai trò đang được chọn sẵn trong HTML
  dkKhoiDoiTac.classList.toggle('hien', dkVaiTro() === 'partner');
  dkDongBoTheVaiTro();
  // Nếu mở trang kèm #dang-ky thì vào thẳng tab Đăng ký
  if (window.location.hash === '#dang-ky') moTab('dangky', false);
})();
