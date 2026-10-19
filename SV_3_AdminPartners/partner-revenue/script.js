/* =====================================================
   TRANG DOANH THU (ĐỐI TÁC) - TripWeave AI
   Chức năng: hiển thị thống kê + biểu đồ cột 6 tháng
   (vẽ bằng CSS thuần) + top dịch vụ theo %.
   Dữ liệu: LocalStorage khóa 'tw_revenue'.
   ===================================================== */
const $ = (s) => document.querySelector(s);
const KHO = 'tw_revenue';

// ---------- DỮ LIỆU MẪU LẦN ĐẦU (seed) ----------
const DU_LIEU_GOC = {
  thangNay: 45000000,      // Doanh thu tháng hiện tại (₫)
  donHoanThanh: 128,       // Số đơn đã hoàn thành
  danhGiaTB: 4.7,          // Điểm đánh giá trung bình
  tangTruong: 12,          // % tăng trưởng so với tháng trước
  thang: [ // Doanh thu 6 tháng (triệu ₫) để vẽ biểu đồ
    { t: 'T7', v: 18 }, { t: 'T8', v: 26 }, { t: 'T9', v: 22 },
    { t: 'T10', v: 34 }, { t: 'T11', v: 38 }, { t: 'T12', v: 45 }
  ],
  top: [ // Top dịch vụ theo tỉ lệ %
    { ten: 'Du thuyền Hạ Long', phanTram: 82 },
    { ten: 'Homestay Sapa', phanTram: 24 }
  ]
};

let dl = null; // Dữ liệu doanh thu hiện tại

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
    if (!dl.thang || !Array.isArray(dl.thang)) throw new Error('Sai định dạng');
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
  $('#growth-value').textContent = '+' + dl.tangTruong + '%';
}

// ---------- VẼ BIỂU ĐỒ CỘT BẰNG CSS ----------
// Chiều cao mỗi cột = % so với cột cao nhất, có hiệu ứng chuyển động
function veBieuDo() {
  const max = Math.max(...dl.thang.map((d) => d.v), 1);
  $('#chart').innerHTML = dl.thang.map((d) => `
    <div class="col" title="${d.t}: ${d.v} triệu ₫">
      <div class="bar" style="height:0%" data-h="${Math.round((d.v / max) * 100)}"></div>
      <span class="lbl">${d.t}</span>
    </div>`).join('');
  // Sau 50ms mới đặt chiều cao thật -> cột "mọc lên" mượt mà
  setTimeout(() => {
    document.querySelectorAll('#chart .bar')
      .forEach((b) => { b.style.height = b.dataset.h + '%'; });
  }, 50);
}

// ---------- TOP DỊCH VỤ (thanh tiến trình) ----------
function veTopDichVu() {
  if (!dl.top.length) { // Trạng thái RỖNG
    $('#top-dich-vu').innerHTML = '<p class="stat-sub">Chưa có dữ liệu dịch vụ.</p>';
    return;
  }
  $('#top-dich-vu').innerHTML = dl.top.map((d) => `
    <div class="top-item">
      <div class="top-head"><span>${d.ten}</span><b>${d.phanTram}%</b></div>
      <div class="progress"><div class="progress-bar" style="width:${d.phanTram}%"></div></div>
    </div>`).join('');
}

// ---------- NÚT "LÀM MỚI SỐ LIỆU": mô phỏng tải lại dữ liệu ----------
$('#btn-lam-moi').onclick = () => {
  $('#chart').innerHTML = '<div class="skeleton chart-skeleton"></div>'; // LOADING
  setTimeout(() => {
    veBieuDo();
    dienThongKe();
    toast('Đã làm mới số liệu doanh thu.', 'success'); // THÀNH CÔNG
  }, 800);
};

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
  // Hiện skeleton giả trong 0.6 giây (trạng thái LOADING)
  $('#chart').innerHTML = '<div class="skeleton chart-skeleton"></div>';
  setTimeout(() => {
    if (!napDuLieu()) { // Trạng thái LỖI
      $('#chart').innerHTML = `<div class="error-state"><span class="emoji">⚠️</span>
        <p>Không thể tải số liệu doanh thu.</p>
        <button class="btn btn-primary" id="btn-thu-lai">Thử lại</button></div>`;
      $('#btn-thu-lai').onclick = khoiDong;
      return;
    }
    dienThongKe(); veBieuDo(); veTopDichVu();
  }, 600);
}
khoiDong();
