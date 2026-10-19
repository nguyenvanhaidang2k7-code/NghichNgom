/* =====================================================
   TRANG QUẢN TRỊ NGƯỜI DÙNG - TripWeave AI (BẢN ĐÃ SỬA LỖI)
   1) Mảng dữ liệu giả lập (mock data) đầy đủ ngay trong file.
   2) renderUsers() tự động đổ dữ liệu ra màn hình khi trang
      tải xong (DOMContentLoaded).
   3) Chip lọc (Tất cả / Đang hoạt động / Bị khóa) + ô tìm
      kiếm lọc trực tiếp trên mảng dữ liệu thật.
   * Dữ liệu cũ trong LocalStorage được CHUẨN HÓA trước khi
     render nên không còn lỗi trống / kẹt khung xám.
   ===================================================== */
const $ = (s) => document.querySelector(s);
const KHO = 'tw_users';

// ---------- 1) MẢNG DỮ LIỆU GIẢ LẬP (MOCK DATA) ----------
const DU_LIEU_GOC = [
  { id: 'u1', ten: 'Nguyễn Văn An', email: 'nguyenvanan@gmail.com', vaiTro: 'Khách du lịch', matKhau: '123456', sdt: '0901 111 111', ngay: '01/2024', trangThai: 'hoatdong' },
  { id: 'u2', ten: 'Trần Thị Bích', email: 'tranthibich@gmail.com', vaiTro: 'Khách du lịch', matKhau: '123456', sdt: '0902 222 222', ngay: '03/2024', trangThai: 'hoatdong' },
  { id: 'u3', ten: 'Lê Minh Châu', email: 'minhchau.le@gmail.com', vaiTro: 'Khách du lịch', matKhau: '123456', sdt: '0906 666 666', ngay: '05/2024', trangThai: 'khoa' },
  { id: 'u4', ten: 'Công ty Du lịch Xanh', email: 'doanhnghiepxanh@gmail.com', vaiTro: 'Đối tác', matKhau: '123456', sdt: '0903 333 333', ngay: '06/2024', trangThai: 'hoatdong' },
  { id: 'u5', ten: 'Homestay Sapa', email: 'sapa@gmail.com', vaiTro: 'Đối tác', matKhau: '123456', sdt: '0904 444 444', ngay: '08/2024', trangThai: 'khoa' },
  { id: 'u6', ten: 'Du thuyền Hạ Long', email: 'halongcruise@gmail.com', vaiTro: 'Đối tác', matKhau: '123456', sdt: '0907 777 777', ngay: '09/2024', trangThai: 'hoatdong' },
  { id: 'u7', ten: 'Phạm Quốc Dũng', email: 'dungpham@gmail.com', vaiTro: 'Khách du lịch', matKhau: '123456', sdt: '0908 888 888', ngay: '10/2024', trangThai: 'hoatdong' },
  { id: 'u8', ten: 'Quản Trị Hệ Thống', email: 'admin@tripweave.ai', vaiTro: 'Quản trị', matKhau: '123456', sdt: '0905 555 555', ngay: '01/2024', trangThai: 'hoatdong' }
];

// ---------- TRẠNG THÁI TOÀN CỤC ----------
let ds = [];                                    // Danh sách người dùng đang hiển thị
let boLoc = { tuKhoa: '', trangThai: 'tatca' }; // Từ khóa tìm + chip lọc
let dangXemId = null;                           // Người dùng đang mở ở modal chi tiết
let hanhDongXacNhan = null;                     // Hàm chạy khi bấm "Đồng ý" ở modal xác nhận

// ---------- TIỆN ÍCH CHUNG ----------
function toast(thongDiep, loai = 'success') {
  const hop = document.createElement('div');
  hop.className = 'toast ' + loai;
  hop.textContent = thongDiep;
  $('#toast-box').appendChild(hop);
  setTimeout(() => hop.remove(), 2600);
}
function moModal(id) { document.getElementById(id).classList.add('open'); }
function dongModal(id) { document.getElementById(id).classList.remove('open'); }
document.addEventListener('click', (e) => { // Bấm ra ngoài thì đóng modal
  if (e.target.classList.contains('modal-overlay')) dongModal(e.target.id);
});

// LocalStorage "an toàn": trình duyệt có thể chặn (file://, private mode)
function docLS() { try { return localStorage.getItem(KHO); } catch (e) { return null; } }
function luuLS() { try { localStorage.setItem(KHO, JSON.stringify(ds)); } catch (e) { /* bỏ qua */ } }

// CHUẨN HÓA 1 bản ghi: thiếu trường nào điền mặc định trường đó.
// (Nguyên nhân lỗi cũ: dữ liệu cũ thiếu ten/email làm hàm render
//  ném lỗi "Cannot read properties of undefined" -> kẹt khung xám.)
function chuanHoa(u) {
  if (!u || typeof u !== 'object') return null;
  return {
    id: String(u.id || 'u' + Math.random().toString(36).slice(2, 9)),
    ten: String(u.ten || u.name || u.hoTen || 'Người dùng ẩn danh'),
    email: String(u.email || 'khong-ro@example.com'),
    vaiTro: String(u.vaiTro || u.role || 'Khách du lịch'),
    matKhau: String(u.matKhau || '123456'),
    sdt: String(u.sdt || '(chưa cập nhật)'),
    ngay: String(u.ngay || '01/2024'),
    trangThai: u.trangThai === 'khoa' ? 'khoa' : 'hoatdong'
  };
}

// NẠP DỮ LIỆU: ưu tiên LocalStorage, LUÔN trả về mảng hợp lệ.
// Trả về false nếu phải khôi phục dữ liệu mẫu (để hiện toast cảnh báo).
function napDuLieu() {
  try {
    const raw = docLS();
    if (!raw) { ds = DU_LIEU_GOC.map((o) => ({ ...o })); luuLS(); return true; }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('Sai định dạng');
    ds = parsed.map(chuanHoa).filter(Boolean); // chuẩn hóa + loại bản ghi rác
    if (!ds.length) throw new Error('Danh sách rỗng');
    luuLS();
    return true;
  } catch (e) {
    ds = DU_LIEU_GOC.map((o) => ({ ...o })); // tự khôi phục bộ mẫu
    luuLS();
    return false;
  }
}
// Nút "Khôi phục dữ liệu mẫu" trong trạng thái lỗi
function khoiPhucDuLieu() {
  try { localStorage.removeItem(KHO); } catch (e) { /* bỏ qua */ }
  napDuLieu();
  renderUsers();
  toast('Đã khôi phục dữ liệu mẫu.', 'info');
}
// Chữ cái đầu để vẽ avatar (Nguyễn Văn An -> "N")
const chuCaiDau = (ten) => String(ten || '?').trim().charAt(0).toUpperCase();

// ---------- 2) HÀM RENDER DANH SÁCH NGƯỜI DÙNG RA MÀN HÌNH ----------
function renderUsers(loading = false) {
  const box = $('#danh-sach');
  if (!box) return;
  // TRẠNG THÁI LOADING: 3 khối skeleton
  if (loading) { box.innerHTML = '<div class="skeleton"></div>'.repeat(3); return; }
  // 3) LỌC THEO CHIP TRẠNG THÁI + TỪ KHÓA TÌM KIẾM (trên mảng ds thật)
  let ketQua = ds.slice();
  if (boLoc.trangThai !== 'tatca') ketQua = ketQua.filter((u) => u.trangThai === boLoc.trangThai);
  if (boLoc.tuKhoa) {
    const k = boLoc.tuKhoa.toLowerCase();
    ketQua = ketQua.filter((u) => u.ten.toLowerCase().includes(k) || u.email.toLowerCase().includes(k));
  }
  try {
    if (!ketQua.length) { // TRẠNG THÁI RỖNG
      box.innerHTML = `<div class="card empty-state"><span class="emoji">👥</span>
        <p>Không có người dùng nào khớp bộ lọc.</p>
        <button class="btn btn-secondary" id="btn-xoa-loc" type="button">Xóa bộ lọc</button></div>`;
      $('#btn-xoa-loc').onclick = () => {
        boLoc = { tuKhoa: '', trangThai: 'tatca' };
        $('#search-input').value = '';
        ganChip('tatca');
        renderUsers(true);
        setTimeout(() => renderUsers(), 400);
      };
      return;
    }
    // TRẠNG THÁI THÀNH CÔNG: avatar chữ cái + tên + email + huy hiệu + nút thao tác
    box.innerHTML = '<div class="list">' + ketQua.map((u) => `
      <div class="card row-card">
        <div class="avatar-letter">${chuCaiDau(u.ten)}</div>
        <div>
          <p class="row-title">${u.ten}</p>
          <p class="row-sub">${u.email} • ${u.vaiTro} • Tham gia ${u.ngay}</p>
        </div>
        <div class="spacer"></div>
        <span class="badge ${u.trangThai === 'hoatdong' ? 'success' : 'danger'}">
          ${u.trangThai === 'hoatdong' ? 'Đang hoạt động' : 'Bị khóa'}
        </span>
        <div class="row-actions">
          <button class="btn btn-secondary" data-xem="${u.id}" type="button">Chi tiết</button>
          <button class="btn ${u.trangThai === 'hoatdong' ? 'btn-danger' : 'btn-primary'}" data-khoa="${u.id}" type="button">
            ${u.trangThai === 'hoatdong' ? 'Khóa' : 'Mở khóa'}
          </button>
        </div>
      </div>`).join('') + '</div>';
  } catch (err) {
    // TRẠNG THÁI LỖI: không bao giờ để kẹt skeleton nữa
    console.error('Lỗi render danh sách người dùng:', err);
    box.innerHTML = `<div class="card error-state"><span class="emoji">⚠️</span>
      <p>Không thể hiển thị danh sách người dùng.</p>
      <button class="btn btn-primary" id="btn-khoi-phuc" type="button">Khôi phục dữ liệu mẫu</button></div>`;
    $('#btn-khoi-phuc').onclick = khoiPhucDuLieu;
  }
}
// ---------- 3) TÌM KIẾM (debounce) + CHIP LỌC ----------
let henGioTim = null;
$('#search-input').addEventListener('input', (e) => {
  boLoc.tuKhoa = e.target.value.trim();
  clearTimeout(henGioTim);
  henGioTim = setTimeout(() => {
    renderUsers(true);
    setTimeout(() => renderUsers(), 400);
  }, 300);
});
function ganChip(giaTri) {
  boLoc.trangThai = giaTri;
  document.querySelectorAll('#chip-row .chip')
    .forEach((c) => c.classList.toggle('active', c.dataset.loc === giaTri));
}
$('#chip-row').addEventListener('click', (e) => {
  if (!e.target.classList.contains('chip')) return;
  ganChip(e.target.dataset.loc);
  renderUsers(true);
  setTimeout(() => renderUsers(), 400);
});

// ---------- BẤM NÚT TRONG DANH SÁCH: chi tiết / khóa-mở khóa ----------
$('#danh-sach').addEventListener('click', (e) => {
  const nutXem = e.target.closest('[data-xem]');
  const nutKhoa = e.target.closest('[data-khoa]');
  if (nutXem) moChiTiet(nutXem.dataset.xem);
  if (nutKhoa) {
    const u = ds.find((x) => x.id === nutKhoa.dataset.khoa);
    if (!u) return;
    const laKhoa = u.trangThai === 'hoatdong';
    moXacNhan((laKhoa ? 'Khóa tài khoản "' : 'Mở khóa tài khoản "') + u.ten + '"?', () => {
      u.trangThai = laKhoa ? 'khoa' : 'hoatdong';
      luuLS(); renderUsers();
      toast(laKhoa ? 'Đã khóa ' + u.ten + '.' : 'Đã mở khóa ' + u.ten + '.', 'success');
    });
  }
});

// ---------- MODAL CHI TIẾT NGƯỜI DÙNG (READ + khóa/mở + xóa) ----------
function moChiTiet(id) {
  dangXemId = id;
  const u = ds.find((x) => x.id === id);
  if (!u) return;
  $('#ct-ten').textContent = u.ten;
  $('#ct-email').textContent = u.email;
  $('#ct-vai-tro').textContent = u.vaiTro;
  $('#ct-ngay').textContent = u.ngay;
  $('#ct-trang-thai').innerHTML =
    `<span class="badge ${u.trangThai === 'hoatdong' ? 'success' : 'danger'}">
      ${u.trangThai === 'hoatdong' ? 'Đang hoạt động' : 'Bị khóa'}</span>`;
  $('#ct-khoa').textContent = u.trangThai === 'hoatdong' ? 'Khóa tài khoản' : 'Mở khóa tài khoản';
  moModal('modal-chi-tiet');
}
$('#ct-dong').onclick = () => dongModal('modal-chi-tiet');
$('#ct-khoa').onclick = () => { // UPDATE từ modal chi tiết
  const u = ds.find((x) => x.id === dangXemId);
  if (!u) return;
  const laKhoa = u.trangThai === 'hoatdong';
  moXacNhan((laKhoa ? 'Khóa tài khoản "' : 'Mở khóa tài khoản "') + u.ten + '"?', () => {
    u.trangThai = laKhoa ? 'khoa' : 'hoatdong';
    luuLS(); dongModal('modal-chi-tiet'); renderUsers();
    toast(laKhoa ? 'Đã khóa ' + u.ten + '.' : 'Đã mở khóa ' + u.ten + '.', 'success');
  });
};
$('#ct-xoa').onclick = () => { // DELETE - luôn xác nhận
  const u = ds.find((x) => x.id === dangXemId);
  if (!u) return;
  moXacNhan('Xóa vĩnh viễn người dùng "' + u.ten + '"? Thao tác này không thể hoàn tác.', () => {
    ds = ds.filter((x) => x.id !== dangXemId);
    luuLS(); dongModal('modal-chi-tiet'); renderUsers();
    toast('Đã xóa người dùng.', 'success');
  });
};

// ---------- MODAL THÊM NGƯỜI DÙNG (CREATE) ----------
$('#btn-them').onclick = () => {
  $('#td-ten').value = ''; $('#td-email').value = '';
  $('#td-vai-tro').value = 'Khách du lịch'; $('#td-mat-khau').value = '123456';
  moModal('modal-them');
};
$('#td-huy').onclick = () => dongModal('modal-them');
$('#form-them').addEventListener('submit', (e) => {
  e.preventDefault();
  const ten = $('#td-ten').value.trim(), email = $('#td-email').value.trim();
  if (!ten) { toast('Vui lòng nhập tên người dùng.', 'error'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast('Email không hợp lệ.', 'error'); return; }
  if (ds.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    toast('Email đã tồn tại trong hệ thống.', 'error'); return;
  }
  ds.unshift({
    id: 'u' + Date.now(), ten, email,
    vaiTro: $('#td-vai-tro').value, matKhau: $('#td-mat-khau').value || '123456',
    sdt: '(chưa cập nhật)', ngay: '12/2026', trangThai: 'hoatdong'
  });
  luuLS(); dongModal('modal-them');
  renderUsers(true);
  setTimeout(() => renderUsers(), 400);
  toast('Đã thêm người dùng ' + ten + '.', 'success');
});

// ---------- MODAL XÁC NHẬN DÙNG CHUNG ----------
function moXacNhan(thongBao, hanhDong) {
  $('#xn-thong-bao').textContent = thongBao;
  hanhDongXacNhan = hanhDong;
  moModal('modal-xac-nhan');
}
$('#xn-huy').onclick = () => dongModal('modal-xac-nhan');
$('#xn-dong-y').onclick = () => {
  dongModal('modal-xac-nhan');
  if (hanhDongXacNhan) hanhDongXacNhan();
};

// ---------- HEADER: tìm kiếm toàn cục + chuông + avatar (mô phỏng) ----------
$('#global-search').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') toast('Tìm kiếm toàn cục: "' + e.target.value + '" (mô phỏng)', 'info');
});
$('#bell-btn').addEventListener('click', () => toast('Bạn có 5 thông báo mới (mô phỏng).', 'info'));
$('#avatar-btn').addEventListener('click', () => {
  if (confirm('Bạn muốn đăng xuất khỏi TripWeave AI?')) {
    localStorage.removeItem('tw_session');
    location.href = '../login/index.html';
  }
});

// ---------- KHỞI ĐỘNG KHI TRANG TẢI XONG (DOMContentLoaded) ----------
function khoiDong() {
  renderUsers(true); // hiện skeleton (LOADING)
  setTimeout(() => {
    const ok = napDuLieu();
    if (!ok) toast('Dữ liệu cũ không hợp lệ - đã khôi phục dữ liệu mẫu.', 'info');
    renderUsers();   // đổ dữ liệu thật ra màn hình (SUCCESS)
  }, 600);
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', khoiDong);
} else {
  khoiDong();
}


