/* =====================================================
   TRANG TỔNG QUAN HỆ THỐNG (QUẢN TRỊ) - TripWeave AI
   Chức năng: thống kê người dùng, 2 biểu đồ cột vẽ bằng
   CSS (tăng trưởng người dùng + doanh thu hệ thống),
   top nhà cung cấp theo % tăng trưởng.
   Dữ liệu: LocalStorage khóa 'tw_admin_stats'.
   ===================================================== */
const $ = (s) => document.querySelector(s);
const KHO = 'tw_admin_stats';

// ---------- DỮ LIỆU MẪU LẦN ĐẦU (seed) ----------
const DU_LIEU_GOC = {
  tong: 1250, doiTac: 340, nguoiDung: 910, khach: 820,
  // Tăng trưởng người dùng mới theo tháng (trăm người)
  tangTruong: [{ t: 'T7', v: 12 }, { t: 'T8', v: 18 }, { t: 'T9', v: 15 }, { t: 'T10', v: 22 }, { t: 'T11', v: 26 }, { t: 'T12', v: 30 }],
  // Doanh thu hệ thống theo tháng (tỉ ₫)
  doanhThu: [{ t: 'T7', v: 12 }, { t: 'T8', v: 16 }, { t: 'T9', v: 14 }, { t: 'T10', v: 20 }, { t: 'T11', v: 22 }, { t: 'T12', v: 26 }],
  // Top nhà cung cấp theo % tăng trưởng
  top: [
    { ten: 'Du thuyền Hạ Long', pct: 12 },
    { ten: 'Homestay Sapa', pct: 8 },
    { ten: 'Làng cổ Đường Lâm', pct: 15 }
  ]
};

let dl = null;

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
    dl = raw ? JSON.parse(raw) : { ...DU_LIEU_GOC };
    if (!Array.isArray(dl.tangTruong)) throw new Error('Sai định dạng');
    localStorage.setItem(KHO, JSON.stringify(dl));
    return true;
  } catch (e) { return false; }
}
const soLon = (n) => new Intl.NumberFormat('vi-VN').format(n);

// ---------- HIỂN THỊ 4 THẺ THỐNG KÊ ----------
function dienThongKe() {
  $('#stat-tong').textContent = soLon(dl.tong);
  $('#stat-doi-tac').textContent = soLon(dl.doiTac);
  $('#stat-nguoi-dung').textContent = soLon(dl.nguoiDung);
  $('#stat-khach').textContent = soLon(dl.khach);
}

// ---------- VẼ BIỂU ĐỒ CỘT BẰNG CSS (dùng cho cả 2 khung) ----------
function veCot(idKhung, duLieu) {
  const max = Math.max(...duLieu.map((d) => d.v), 1);
  $(idKhung).innerHTML = duLieu.map((d) => `
    <div class="col" title="${d.t}: ${d.v}">
      <div class="bar" style="height:0%" data-h="${Math.round((d.v / max) * 100)}"></div>
      <span class="lbl">${d.t}</span>
    </div>`).join('');
  // Đặt chiều cao thật sau 50ms -> cột "mọc lên" có animation
  setTimeout(() => {
    document.querySelectorAll(idKhung + ' .bar')
      .forEach((b) => { b.style.height = b.dataset.h + '%'; });
  }, 50);
}

// ---------- TOP NHÀ CUNG CẤP: huy hiệu % + thanh tiến trình xanh ----------
function veTopNhaCungCap() {
  if (!dl.top.length) { // Trạng thái RỖNG
    $('#top-nha-cung-cap').innerHTML = '<p class="stat-label">Chưa có dữ liệu nhà cung cấp.</p>';
    return;
  }
  $('#top-nha-cung-cap').innerHTML = dl.top.map((n) => `
    <div class="top-item">
      <div class="top-thumb">🏢</div>
      <div class="top-info">
        <p class="row-title">${n.ten}</p>
        <div class="progress"><div class="progress-bar green" style="width:${Math.min(n.pct * 4, 100)}%"></div></div>
      </div>
      <span class="badge success">+${n.pct}%</span>
    </div>`).join('');
}

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

// ---------- KHỞI ĐỘNG: loading -> nạp dữ liệu -> render ----------
function khoiDong() {
  $('#chart-nguoi-dung').innerHTML = '<div class="skeleton chart-skeleton"></div>';
  $('#chart-doanh-thu').innerHTML = '<div class="skeleton chart-skeleton"></div>';
  setTimeout(() => {
    if (!napDuLieu()) { // Trạng thái LỖI
      $('#chart-nguoi-dung').innerHTML = `<div class="error-state"><span class="emoji">⚠️</span>
        <p>Không thể tải số liệu hệ thống.</p>
        <button class="btn btn-primary" id="btn-thu-lai">Thử lại</button></div>`;
      $('#btn-thu-lai').onclick = khoiDong;
      return;
    }
    dienThongKe();
    veCot('#chart-nguoi-dung', dl.tangTruong);
    veCot('#chart-doanh-thu', dl.doanhThu);
    veTopNhaCungCap();
  }, 600);
}
khoiDong();
