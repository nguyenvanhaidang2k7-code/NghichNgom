/* =====================================================
   TRANG QUẢN TRỊ DOANH THU - TripWeave AI
   Chức năng: thống kê doanh thu toàn hệ thống, 2 biểu đồ
   cột vẽ bằng CSS (người dùng + doanh thu theo tháng),
   top dịch vụ theo tỉ trọng, mô phỏng xuất báo cáo.
   Dữ liệu: LocalStorage khóa 'tw_admin_revenue'.
   ===================================================== */
const $ = (s) => document.querySelector(s);
const KHO = 'tw_admin_revenue';

// ---------- DỮ LIỆU MẪU LẦN ĐẦU (seed) ----------
const DU_LIEU_GOC = {
  thangNay: 125000000,   // Doanh thu hệ thống tháng này (₫)
  donHoanThanh: 320,     // Tổng đơn hoàn thành
  danhGiaTB: 4.6,        // Điểm đánh giá trung bình toàn hệ thống
  tangTruong: 18,        // % tăng trưởng so với tháng trước
  nguoiDungThang: [ // Tăng trưởng người dùng mới theo tháng
    { t: 'T7', v: 12 }, { t: 'T8', v: 18 }, { t: 'T9', v: 15 },
    { t: 'T10', v: 22 }, { t: 'T11', v: 26 }, { t: 'T12', v: 30 }
  ],
  doanhThuThang: [ // Doanh thu hệ thống theo tháng (triệu ₫)
    { t: 'T7', v: 95 }, { t: 'T8', v: 110 }, { t: 'T9', v: 102 },
    { t: 'T10', v: 118 }, { t: 'T11', v: 121 }, { t: 'T12', v: 125 }
  ],
  top: [ // Top dịch vụ theo % tỉ trọng doanh thu
    { ten: 'Du thuyền Hạ Long', pct: 45 },
    { ten: 'Homestay Sapa', pct: 30 },
    { ten: 'Làng cổ Đường Lâm', pct: 18 }
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
const tien = (so) => new Intl.NumberFormat('vi-VN').format(so) + '₫';
function napDuLieu() { // Trả về false nếu dữ liệu hỏng -> hiện trạng thái LỖI
  try {
    const raw = localStorage.getItem(KHO);
    dl = raw ? JSON.parse(raw) : { ...DU_LIEU_GOC };
    if (!Array.isArray(dl.doanhThuThang)) throw new Error('Sai định dạng');
    localStorage.setItem(KHO, JSON.stringify(dl));
    return true;
  } catch (e) { return false; }
}

// ---------- HIỂN THỊ 4 THẺ THỐNG KÊ ----------
function dienThongKe() {
  $('#stat-doanh-thu').textContent = tien(dl.thangNay);
  $('#stat-don').textContent = dl.donHoanThanh;
  $('#stat-sao').textContent = dl.danhGiaTB.toFixed(1) + '★';
  $('#stat-tang').textContent = '+' + dl.tangTruong + '%';
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

// ---------- TOP DỊCH VỤ: thanh tiến trình xanh theo % ----------
function veTopDichVu() {
  if (!dl.top.length) { // Trạng thái RỖNG
    $('#top-dich-vu').innerHTML = '<p class="stat-label">Chưa có dữ liệu dịch vụ.</p>';
    return;
  }
  $('#top-dich-vu').innerHTML = dl.top.map((d) => `
    <div class="top-item">
      <div class="top-info">
        <div class="top-head"><span>${d.ten}</span><b>${d.pct}%</b></div>
        <div class="progress"><div class="progress-bar green" style="width:${d.pct}%"></div></div>
      </div>
    </div>`).join('');
}

// ---------- NÚT "XUẤT BÁO CÁO": mô phỏng tải rồi báo thành công ----------
$('#btn-xuat-bao-cao').onclick = () => {
  toast('Đang tổng hợp dữ liệu báo cáo...', 'info'); // Trạng thái LOADING
  setTimeout(() => toast('Đã xuất báo cáo doanh thu (mô phỏng).', 'success'), 1200);
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

// ---------- KHỞI ĐỘNG: loading -> nạp dữ liệu -> render ----------
function khoiDong() {
  $('#chart-nguoi-dung').innerHTML = '<div class="skeleton chart-skeleton"></div>';
  $('#chart-doanh-thu').innerHTML = '<div class="skeleton chart-skeleton"></div>';
  setTimeout(() => {
    if (!napDuLieu()) { // Trạng thái LỖI
      $('#chart-nguoi-dung').innerHTML = `<div class="error-state"><span class="emoji">⚠️</span>
        <p>Không thể tải số liệu doanh thu hệ thống.</p>
        <button class="btn btn-primary" id="btn-thu-lai">Thử lại</button></div>`;
      $('#btn-thu-lai').onclick = khoiDong;
      return;
    }
    dienThongKe();
    veCot('#chart-nguoi-dung', dl.nguoiDungThang);
    veCot('#chart-doanh-thu', dl.doanhThuThang);
    veTopDichVu();
  }, 600);
}
khoiDong();
