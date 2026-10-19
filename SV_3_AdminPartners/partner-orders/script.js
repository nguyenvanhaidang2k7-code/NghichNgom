/* =====================================================
   TRANG ĐƠN ĐẶT (ĐỐI TÁC) - TripWeave AI
   Chức năng: Xem danh sách đơn, tìm kiếm, lọc trạng thái,
   xem chi tiết (modal), cập nhật trạng thái đơn (modal).
   Dữ liệu: LocalStorage khóa 'tw_orders' (dùng chung với
   trang Tổng quan để đếm "đơn chờ xác nhận").
   ===================================================== */
const $ = (s) => document.querySelector(s);
const KHO = 'tw_orders';

// ---------- DỮ LIỆU MẪU LẦN ĐẦU (seed) ----------
const DU_LIEU_GOC = [
  { id: 'o1', khach: 'Trần An', traiNghiem: 'Du thuyền Hạ Long', soLuong: 2, trangThai: 'cho', ngay: '10/12/2026', tong: 2400000, sdt: '0901 234 567', ghiChu: 'Đón tại bến Tuần Châu lúc 8:00.' },
  { id: 'o2', khach: 'Lê Minh', traiNghiem: 'Du thuyền Hạ Long', soLuong: 2, trangThai: 'xacnhan', ngay: '11/12/2026', tong: 2400000, sdt: '0912 345 678', ghiChu: 'Khách yêu cầu chỗ ngồi tầng trên.' },
  { id: 'o3', khach: 'Nguyễn Hà', traiNghiem: 'Du thuyền Hạ Long', soLuong: 2, trangThai: 'hoanthanh', ngay: '05/12/2026', tong: 2400000, sdt: '0987 654 321', ghiChu: '' }
];

// Nhãn + màu huy hiệu theo trạng thái đơn
const TRANG_THAI = {
  cho: ['warning', 'Chờ xác nhận'],
  xacnhan: ['success', 'Đã xác nhận'],
  hoanthanh: ['success', 'Đã hoàn thành'],
  huy: ['danger', 'Đã hủy']
};

// ---------- TRẠNG THÁI TOÀN CỤC ----------
let ds = [];
let boLoc = { tuKhoa: '', trangThai: 'tatca' };
let dangCapNhatId = null; // Đơn đang mở trong modal cập nhật

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
function luuLS() { localStorage.setItem(KHO, JSON.stringify(ds)); }
// CHUẨN HÓA 1 đơn đặt: thiếu trường nào điền mặc định trường đó
// -> dữ liệu cũ/hỏng trong LocalStorage không thể làm crash hàm render.
function chuanHoa(d) {
  if (!d || typeof d !== 'object') return null;
  return {
    id: String(d.id || 'o' + Math.random().toString(36).slice(2, 9)),
    khach: String(d.khach || d.tenKhach || 'Khách hàng'),
    traiNghiem: String(d.traiNghiem || d.hoatDong || 'Trải nghiệm'),
    soLuong: Number(d.soLuong) > 0 ? Number(d.soLuong) : 1,
    trangThai: TRANG_THAI[d.trangThai] ? d.trangThai : 'cho',
    ngay: String(d.ngay || d.ngayDat || '—'),
    tong: Number(d.tong) > 0 ? Number(d.tong) : 0,
    sdt: String(d.sdt || '(chưa cập nhật)'),
    ghiChu: String(d.ghiChu || '')
  };
}
function napDuLieu() { // Trả về false nếu dữ liệu hỏng -> hiện trạng thái LỖI
  try {
    const raw = localStorage.getItem(KHO);
    if (!raw) { ds = DU_LIEU_GOC.map((o) => ({ ...o })); luuLS(); return true; }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('Sai định dạng');
    ds = parsed.map(chuanHoa).filter(Boolean);
    luuLS();
    return true;
  } catch (e) {
    ds = DU_LIEU_GOC.map((o) => ({ ...o }));
    luuLS();
    return false;
  }
}
const tien = (so) => new Intl.NumberFormat('vi-VN').format(so) + '₫';

// ---------- RENDER DANH SÁCH ĐƠN ----------
function renderDanhSach(loading = false) {
  const box = $('#danh-sach');
  if (loading) { // Trạng thái LOADING
    box.innerHTML = '<div class="skeleton"></div>'.repeat(3);
    return;
  }
  let ketQua = ds.slice();
  if (boLoc.trangThai !== 'tatca') ketQua = ketQua.filter((d) => d.trangThai === boLoc.trangThai);
  if (boLoc.tuKhoa) {
    const k = boLoc.tuKhoa.toLowerCase();
    ketQua = ketQua.filter((d) => d.khach.toLowerCase().includes(k) || d.traiNghiem.toLowerCase().includes(k));
  }
  if (!ketQua.length) { // Trạng thái RỖNG
    box.innerHTML = `<div class="card empty-state"><span class="emoji">📭</span>
      <p>Không có đơn đặt nào khớp bộ lọc.</p>
      <button class="btn btn-secondary" id="btn-xoa-loc">Xóa bộ lọc</button></div>`;
    $('#btn-xoa-loc').onclick = () => {
      boLoc = { tuKhoa: '', trangThai: 'tatca' };
      $('#search-input').value = '';
      ganChip('tatca');
      renderDanhSach(true);
      setTimeout(() => renderDanhSach(), 400);
    };
    return;
  }
  // Trạng thái BÌNH THƯỜNG
  box.innerHTML = '<div class="list">' + ketQua.map((d) => `
    <div class="card row-card">
      <div class="thumb">🧾</div>
      <div>
        <p class="row-title">${d.khach}</p>
        <p class="row-sub">${d.traiNghiem} • ${d.soLuong} người • ${tien(d.tong)}</p>
      </div>
      <div class="spacer"></div>
      <span class="badge ${TRANG_THAI[d.trangThai][0]}">${TRANG_THAI[d.trangThai][1]}</span>
      <div class="row-actions">
        <button class="btn btn-secondary" data-xem="${d.id}">Chi tiết</button>
        <button class="btn btn-primary" data-cap-nhat="${d.id}">Cập nhật</button>
      </div>
    </div>`).join('') + '</div>';
}

// ---------- TÌM KIẾM (debounce 300ms) + CHIP LỌC ----------
let henGioTim = null;
$('#search-input').addEventListener('input', (e) => {
  boLoc.tuKhoa = e.target.value.trim();
  clearTimeout(henGioTim);
  henGioTim = setTimeout(() => {
    renderDanhSach(true);
    setTimeout(() => renderDanhSach(), 400);
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
  renderDanhSach(true);
  setTimeout(() => renderDanhSach(), 400);
});

// ---------- MODAL XEM CHI TIẾT ĐƠN (READ) ----------
function moChiTiet(id) {
  const d = ds.find((x) => x.id === id);
  $('#ct-khach').textContent = d.khach;
  $('#ct-sdt').textContent = d.sdt;
  $('#ct-tn').textContent = d.traiNghiem;
  $('#ct-so').textContent = d.soLuong + ' người';
  $('#ct-ngay').textContent = d.ngay;
  $('#ct-tong').textContent = tien(d.tong);
  $('#ct-trang-thai').innerHTML =
    `<span class="badge ${TRANG_THAI[d.trangThai][0]}">${TRANG_THAI[d.trangThai][1]}</span>`;
  $('#ct-ghi-chu').textContent = d.ghiChu || '(không có)';
  moModal('modal-chi-tiet');
}
$('#ct-dong').onclick = () => dongModal('modal-chi-tiet');

// ---------- MODAL CẬP NHẬT TRẠNG THÁI ĐƠN (UPDATE) ----------
function moCapNhat(id) {
  dangCapNhatId = id;
  const d = ds.find((x) => x.id === id);
  $('#cn-trang-thai').value = d.trangThai;
  $('#cn-ghi-chu').value = d.ghiChu;
  moModal('modal-cap-nhat');
}
$('#cn-huy').onclick = () => dongModal('modal-cap-nhat');
$('#form-cap-nhat').addEventListener('submit', (e) => {
  e.preventDefault();
  const d = ds.find((x) => x.id === dangCapNhatId);
  d.trangThai = $('#cn-trang-thai').value;
  d.ghiChu = $('#cn-ghi-chu').value.trim();
  luuLS();
  dongModal('modal-cap-nhat');
  renderDanhSach(true);
  setTimeout(() => renderDanhSach(), 400);
  toast('Đã cập nhật đơn của ' + d.khach + ': ' + TRANG_THAI[d.trangThai][1], 'success');
});

// ---------- BẤM CHI TIẾT / CẬP NHẬT TRONG DANH SÁCH ----------
$('#danh-sach').addEventListener('click', (e) => {
  const nutXem = e.target.closest('[data-xem]');
  const nutCn = e.target.closest('[data-cap-nhat]');
  if (nutXem) moChiTiet(nutXem.dataset.xem);
  if (nutCn) moCapNhat(nutCn.dataset.capNhat);
});

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

// ---------- KHỞI ĐỘNG: loading -> nạp dữ liệu -> render ----------
function khoiDong() {
  renderDanhSach(true);
  setTimeout(() => {
    if (!napDuLieu()) {
      $('#danh-sach').innerHTML = `<div class="card error-state"><span class="emoji">⚠️</span>
        <p>Không thể tải danh sách đơn đặt. Vui lòng thử lại.</p>
        <button class="btn btn-primary" id="btn-thu-lai">Thử lại</button></div>`;
      $('#btn-thu-lai').onclick = khoiDong;
      return;
    }
    renderDanhSach();
  }, 600);
}
khoiDong();

