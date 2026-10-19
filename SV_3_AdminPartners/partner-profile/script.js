/* =====================================================
   TRANG HỒ SƠ ĐỐI TÁC - TripWeave AI
   Chức năng: Xem hồ sơ (READ), Sửa hồ sơ (UPDATE),
   đổi trạng thái hoạt động, tab Hỗ trợ + Giấy phép.
   Dữ liệu: LocalStorage khóa 'tw_profile'.
   ===================================================== */
const $ = (s) => document.querySelector(s);
const KHO = 'tw_profile';

// ---------- DỮ LIỆU MẪU LẦN ĐẦU (seed) ----------
const DU_LIEU_GOC = {
  ten: 'Vịnh Xanh Travel', loai: 'Đối tác địa phương',
  sdt: '0901 234 567', email: 'partner@tripweave.ai',
  diaChi: 'Số 12 Trần Phú, Hà Nội, Việt Nam',
  moTa: 'Đơn vị tổ chức tour trải nghiệm văn hóa - nghỉ dưỡng tại miền Bắc.',
  ngay: 'Thứ 2 – Chủ nhật', gio: '08:00 – 18:00', trangThai: 'hoatdong'
};

let hoSo = null;        // Hồ sơ hiện tại
let dangSua = false;    // Trang thái chỉnh sửa: bật/tắt khóa form

// ---------- TIỆN ÍCH CHUNG ----------
function toast(thongDiep, loai = 'success') {
  const hop = document.createElement('div');
  hop.className = 'toast ' + loai;
  hop.textContent = thongDiep;
  $('#toast-box').appendChild(hop);
  setTimeout(() => hop.remove(), 2600);
}
function napDuLieu() { // Trả về false nếu dữ liệu hỏng -> hiện trạng thái LỖI
  try {
    const raw = localStorage.getItem(KHO);
    hoSo = raw ? JSON.parse(raw) : { ...DU_LIEU_GOC };
    if (!hoSo.ten) throw new Error('Sai định dạng');
    localStorage.setItem(KHO, JSON.stringify(hoSo));
    return true;
  } catch (e) { return false; }
}

// ---------- HIỂN THỊ HỒ SƠ LÊN GIAO DIỆN (READ) ----------
function dienHoSo() {
  $('#pf-ten-hien').textContent = hoSo.ten;
  $('#pf-ten').value = hoSo.ten; $('#pf-loai').value = hoSo.loai;
  $('#pf-sdt').value = hoSo.sdt; $('#pf-email').value = hoSo.email;
  $('#pf-dia-chi').value = hoSo.diaChi; $('#pf-mo-ta').value = hoSo.moTa;
  $('#pf-ngay').value = hoSo.ngay; $('#pf-gio').value = hoSo.gio;
  // Huy hiệu + nút theo trạng thái hoạt động
  const badge = $('#pf-trang-thai');
  badge.textContent = hoSo.trangThai === 'hoatdong' ? 'Đang hoạt động' : 'Tạm ngưng hoạt động';
  badge.className = 'badge ' + (hoSo.trangThai === 'hoatdong' ? 'success' : 'warning');
  $('#btn-doi-trang-thai').textContent = hoSo.trangThai === 'hoatdong' ? 'Tạm ngưng hoạt động' : 'Kích hoạt lại';
}

// ---------- KHÓA / MỞ FORM (chế độ xem <-> chế độ sửa) ----------
const O_NHAP = ['pf-ten', 'pf-sdt', 'pf-email', 'pf-dia-chi', 'pf-mo-ta', 'pf-ngay', 'pf-gio'];
function datCheDo(mo) {
  dangSua = mo;
  O_NHAP.forEach((id) => { $('#' + id).disabled = !mo; });
  $('#btn-luu').hidden = !mo;
  $('#btn-sua').textContent = mo ? 'Hủy sửa' : 'Sửa hồ sơ';
}
$('#btn-sua').onclick = () => {
  if (dangSua) { datCheDo(false); dienHoSo(); toast('Đã hủy chỉnh sửa.', 'info'); }
  else datCheDo(true);
};

// ---------- LƯU HỒ SƠ (UPDATE) ----------
$('#form-ho-so').addEventListener('submit', (e) => {
  e.preventDefault();
  const ten = $('#pf-ten').value.trim(), sdt = $('#pf-sdt').value.trim();
  const email = $('#pf-email').value.trim(), diaChi = $('#pf-dia-chi').value.trim();
  // Trạng thái LỖI: kiểm tra dữ liệu bắt buộc + định dạng email
  if (!ten || !sdt || !email || !diaChi) { toast('Vui lòng điền đủ các trường bắt buộc.', 'error'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast('Email không hợp lệ.', 'error'); return; }
  hoSo.ten = ten; hoSo.sdt = sdt; hoSo.email = email; hoSo.diaChi = diaChi;
  hoSo.moTa = $('#pf-mo-ta').value.trim();
  hoSo.ngay = $('#pf-ngay').value.trim(); hoSo.gio = $('#pf-gio').value.trim();
  localStorage.setItem(KHO, JSON.stringify(hoSo));
  datCheDo(false);
  dienHoSo();
  toast('Đã cập nhật hồ sơ!', 'success'); // Trạng thái THÀNH CÔNG
});

// ---------- ĐỔI TRẠNG THÁI HOẠT ĐỘNG ----------
$('#btn-doi-trang-thai').onclick = () => {
  hoSo.trangThai = hoSo.trangThai === 'hoatdong' ? 'tamngung' : 'hoatdong';
  localStorage.setItem(KHO, JSON.stringify(hoSo));
  dienHoSo();
  toast('Đã đổi trạng thái hồ sơ.', 'info');
};

// ---------- TAB: THÔNG TIN / HỖ TRỢ / GIẤY PHÉP ----------
$('#tab-row').addEventListener('click', (e) => {
  if (!e.target.classList.contains('tab')) return;
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t === e.target));
  ['thong-tin', 'ho-tro', 'giay-phep'].forEach((ten) => {
    $('#tab-' + ten).hidden = ten !== e.target.dataset.tab;
  });
});
$('#btn-gui-yeu-cau').onclick = () => toast('Đã gửi yêu cầu hỗ trợ, chúng tôi sẽ phản hồi trong 24h (mô phỏng).', 'success');
$('#btn-tai-giay-phep').onclick = () => toast('Đã gửi giấy phép, chờ quản trị xác minh (mô phỏng).', 'success');
$('#lnk-doi-mat-khau').onclick = (e) => { e.preventDefault(); toast('Chức năng đổi mật khẩu (mô phỏng).', 'info'); };

// ---------- HEADER: tìm kiếm toàn cục + chuông + avatar (mô phỏng) ----------
$('#global-search').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') toast('Tìm kiếm toàn cục: "' + e.target.value + '" (mô phỏng)', 'info');
});
$('#bell-btn').addEventListener('click', () => toast('Bạn có 3 thông báo mới (mô phỏng).', 'info'));
$('#avatar-btn').addEventListener('click', () => {
  if (confirm('Bạn muốn đăng xuất khỏi TripWeave AI?')) {
    localStorage.removeItem('tw_session');
    location.href = '../login/index.html';
  }
});

// ---------- KHỞI ĐỘNG: loading ngắn -> nạp dữ liệu -> hiển thị ----------
function khoiDong() {
  setTimeout(() => {
    if (!napDuLieu()) { // Trạng thái LỖI
      $('#pf-ten-hien').textContent = '';
      toast('Không thể tải hồ sơ đối tác.', 'error');
      return;
    }
    datCheDo(false); // Mặc định: chế độ XEM (form bị khóa)
    dienHoSo();
  }, 500);
}
khoiDong();
