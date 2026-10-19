/* =====================================================
   TRANG QUẢN TRỊ ĐƠN ĐẶT - TripWeave AI (BẢN ĐÃ SỬA LỖI)
   - Mock data đầy đủ, renderOrders() chạy khi DOMContentLoaded.
   - Chip lọc trạng thái + tìm kiếm theo tên khách/tên trải nghiệm.
   - Dữ liệu LocalStorage cũ được CHUẨN HÓA trước khi render
     (khóa 'tw_orders' dùng chung với trang đối tác).
   ===================================================== */
const $ = (s) => document.querySelector(s);
const KHO = 'tw_orders';

// ---------- MẢNG DỮ LIỆU GIẢ LẬP (MOCK DATA) ----------
const DU_LIEU_GOC = [
  { id: 'o1', khach: 'Trần An', traiNghiem: 'Du thuyền Hạ Long', soLuong: 2, trangThai: 'cho', ngay: '10/12/2026', tong: 2400000, sdt: '0901 234 567', ghiChu: 'Đón tại bến Tuần Châu lúc 8:00.' },
  { id: 'o2', khach: 'Lê Minh', traiNghiem: 'Du thuyền Hạ Long', soLuong: 2, trangThai: 'xacnhan', ngay: '11/12/2026', tong: 2400000, sdt: '0912 345 678', ghiChu: 'Khách yêu cầu chỗ ngồi tầng trên.' },
  { id: 'o3', khach: 'Nguyễn Hà', traiNghiem: 'Làng cổ Đường Lâm', soLuong: 4, trangThai: 'hoanthanh', ngay: '05/12/2026', tong: 600000, sdt: '0987 654 321', ghiChu: '' },
  { id: 'o4', khach: 'Vũ Tuấn', traiNghiem: 'Homestay Sapa', soLuong: 2, trangThai: 'huy', ngay: '02/12/2026', tong: 900000, sdt: '0933 123 456', ghiChu: 'Khách hủy do thay đổi kế hoạch.' },
  { id: 'o5', khach: 'Phạm Quỳnh', traiNghiem: 'Làng cổ Đường Lâm', soLuong: 3, trangThai: 'cho', ngay: '12/12/2026', tong: 450000, sdt: '0977 888 999', ghiChu: '' }
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
// LocalStorage "an toàn"
function docLS() { try { return localStorage.getItem(KHO); } catch (e) { return null; } }
function luuLS() { try { localStorage.setItem(KHO, JSON.stringify(ds)); } catch (e) { /* bỏ qua */ } }

// CHUẨN HÓA 1 đơn: thiếu trường nào điền mặc định trường đó,
// trạng thái lạ thì đưa về 'cho' -> render không bao giờ crash.
function chuanHoa(d) {
  if (!d || typeof d !== 'object') return null;
  return {
    id: String(d.id || 'o' + Math.random().toString(36).slice(2, 9)),
    khach: String(d.khach || d.tenKhach || d.ten || 'Khách hàng'),
    traiNghiem: String(d.traiNghiem || d.hoatDong || d.activity || 'Trải nghiệm'),
    soLuong: Number(d.soLuong) > 0 ? Number(d.soLuong) : 1,
    trangThai: TRANG_THAI[d.trangThai] ? d.trangThai : 'cho',
    ngay: String(d.ngay || d.ngayDat || '—'),
    tong: Number(d.tong) > 0 ? Number(d.tong) : 0,
    sdt: String(d.sdt || d.dienThoai || '(chưa cập nhật)'),
    ghiChu: String(d.ghiChu || '')
  };
}

// NẠP DỮ LIỆU: luôn trả về mảng hợp lệ; false = phải khôi phục mẫu
function napDuLieu() {
  try {
    const raw = docLS();
    if (!raw) { ds = DU_LIEU_GOC.map((o) => ({ ...o })); luuLS(); return true; }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('Sai định dạng');
    ds = parsed.map(chuanHoa).filter(Boolean);
    if (!ds.length) throw new Error('Danh sách rỗng');
    luuLS();
    return true;
  } catch (e) {
    ds = DU_LIEU_GOC.map((o) => ({ ...o }));
    luuLS();
    return false;
  }
}
function khoiPhucDuLieu() {
  try { localStorage.removeItem(KHO); } catch (e) { /* bỏ qua */ }
  napDuLieu();
  renderOrders();
  toast('Đã khôi phục dữ liệu mẫu.', 'info');
}
const tien = (so) => new Intl.NumberFormat('vi-VN').format(Number(so) || 0) + '₫';
// ---------- HÀM RENDER DANH SÁCH ĐƠN RA MÀN HÌNH ----------
function renderOrders(loading = false) {
  const box = $('#danh-sach');
  if (!box) return;
  if (loading) { box.innerHTML = '<div class="skeleton"></div>'.repeat(3); return; }
  // LỌC THEO CHIP TRẠNG THÁI + TÌM KIẾM (tên khách / tên trải nghiệm)
  let ketQua = ds.slice();
  if (boLoc.trangThai !== 'tatca') ketQua = ketQua.filter((d) => d.trangThai === boLoc.trangThai);
  if (boLoc.tuKhoa) {
    const k = boLoc.tuKhoa.toLowerCase();
    ketQua = ketQua.filter((d) => d.khach.toLowerCase().includes(k) || d.traiNghiem.toLowerCase().includes(k));
  }
  try {
    if (!ketQua.length) { // TRẠNG THÁI RỖNG
      box.innerHTML = `<div class="card empty-state"><span class="emoji">📭</span>
        <p>Không có đơn đặt nào khớp bộ lọc.</p>
        <button class="btn btn-secondary" id="btn-xoa-loc" type="button">Xóa bộ lọc</button></div>`;
      $('#btn-xoa-loc').onclick = () => {
        boLoc = { tuKhoa: '', trangThai: 'tatca' };
        $('#search-input').value = '';
        ganChip('tatca');
        renderOrders(true);
        setTimeout(() => renderOrders(), 400);
      };
      return;
    }
    // TRẠNG THÁI THÀNH CÔNG: mỗi hàng là một đơn đặt toàn hệ thống
    box.innerHTML = '<div class="list">' + ketQua.map((d) => `
      <div class="card row-card">
        <div class="avatar-letter">${d.khach.trim().charAt(0).toUpperCase()}</div>
        <div>
          <p class="row-title">${d.khach} <span class="badge muted">#${d.id.toUpperCase()}</span></p>
          <p class="row-sub">${d.traiNghiem} • ${d.soLuong} người • ${d.ngay}</p>
        </div>
        <div class="spacer"></div>
        <div class="row-right">
          <b>${tien(d.tong)}</b>
          <span class="badge ${TRANG_THAI[d.trangThai][0]}">${TRANG_THAI[d.trangThai][1]}</span>
        </div>
        <div class="row-actions">
          <button class="btn btn-secondary" data-xem="${d.id}" type="button">Chi tiết</button>
          <button class="btn btn-primary" data-cap-nhat="${d.id}" type="button">Cập nhật</button>
        </div>
      </div>`).join('') + '</div>';
  } catch (err) {
    console.error('Lỗi render danh sách đơn:', err);
    box.innerHTML = `<div class="card error-state"><span class="emoji">⚠️</span>
      <p>Không thể hiển thị danh sách đơn đặt.</p>
      <button class="btn btn-primary" id="btn-khoi-phuc" type="button">Khôi phục dữ liệu mẫu</button></div>`;
    $('#btn-khoi-phuc').onclick = khoiPhucDuLieu;
  }
}

// ---------- TÌM KIẾM (debounce) + CHIP LỌC ----------
let henGioTim = null;
$('#search-input').addEventListener('input', (e) => {
  boLoc.tuKhoa = e.target.value.trim();
  clearTimeout(henGioTim);
  henGioTim = setTimeout(() => {
    renderOrders(true);
    setTimeout(() => renderOrders(), 400);
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
  renderOrders(true);
  setTimeout(() => renderOrders(), 400);
});
// ---------- MODAL XEM CHI TIẾT ĐƠN (READ) ----------
function moChiTiet(id) {
  const d = ds.find((x) => x.id === id);
  if (!d) return;
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
  if (!d) return;
  $('#cn-trang-thai').value = d.trangThai;
  $('#cn-ghi-chu').value = d.ghiChu;
  moModal('modal-cap-nhat');
}
$('#cn-huy').onclick = () => dongModal('modal-cap-nhat');
$('#form-cap-nhat').addEventListener('submit', (e) => {
  e.preventDefault();
  const d = ds.find((x) => x.id === dangCapNhatId);
  if (!d) { dongModal('modal-cap-nhat'); return; }
  d.trangThai = $('#cn-trang-thai').value;
  d.ghiChu = $('#cn-ghi-chu').value.trim();
  luuLS();
  dongModal('modal-cap-nhat');
  renderOrders(true);
  setTimeout(() => renderOrders(), 400);
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
$('#bell-btn').addEventListener('click', () => toast('Bạn có 5 thông báo mới (mô phỏng).', 'info'));
$('#avatar-btn').addEventListener('click', () => {
  if (confirm('Bạn muốn đăng xuất khỏi TripWeave AI?')) {
    localStorage.removeItem('tw_session');
    location.href = '../login/index.html';
  }
});

// ---------- KHỞI ĐỘNG KHI TRANG TẢI XONG (DOMContentLoaded) ----------
function khoiDong() {
  renderOrders(true); // LOADING
  setTimeout(() => {
    const ok = napDuLieu();
    if (!ok) toast('Dữ liệu cũ không hợp lệ - đã khôi phục dữ liệu mẫu.', 'info');
    renderOrders();   // SUCCESS
  }, 600);
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', khoiDong);
} else {
  khoiDong();
}


