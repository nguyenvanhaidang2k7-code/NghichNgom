/* =====================================================
   TRANG TỔNG QUAN (ĐỐI TÁC) - TripWeave AI
   Đọc dữ liệu từ LocalStorage (chia sẻ với các trang khác)
   để tính số liệu thống kê + vẽ biểu đồ + liệt kê việc cần làm.
   ===================================================== */
const $ = (s) => document.querySelector(s);

// ---------- TOAST THÔNG BÁO ----------
function toast(thongDiep, loai = 'success') {
  const hop = document.createElement('div');
  hop.className = 'toast ' + loai;
  hop.textContent = thongDiep;
  $('#toast-box').appendChild(hop);
  setTimeout(() => hop.remove(), 2600);
}

// ---------- ĐỌC DỮ LIỆU AN TOÀN TỪ LOCALSTORAGE ----------
// Nếu chưa có dữ liệu thì trả về mặc định (mảng rỗng / object rỗng)
function docLS(khoa, macDinh) {
  try {
    const raw = localStorage.getItem(khoa);
    return raw ? JSON.parse(raw) : macDinh;
  } catch (err) {
    console.error('Lỗi đọc LocalStorage:', err);
    return macDinh;
  }
}

// ---------- DỮ LIỆU MẪU (seed) để trang Tổng quan luôn có số liệu ----------
// Các trang đơn/đánh giá/doanh thu cũng tự seed giống hệt khi mở lần đầu.
const SEED = {
  tw_orders: [
    { id: 'o1', khach: 'Trần An', traiNghiem: 'Du thuyền Hạ Long', soLuong: 2, trangThai: 'cho', ngay: '10/12/2026', tong: 2400000, sdt: '0901 234 567', ghiChu: 'Đón tại bến Tuần Châu lúc 8:00.' },
    { id: 'o2', khach: 'Lê Minh', traiNghiem: 'Du thuyền Hạ Long', soLuong: 2, trangThai: 'xacnhan', ngay: '11/12/2026', tong: 2400000, sdt: '0912 345 678', ghiChu: 'Khách yêu cầu chỗ ngồi tầng trên.' },
    { id: 'o3', khach: 'Nguyễn Hà', traiNghiem: 'Du thuyền Hạ Long', soLuong: 2, trangThai: 'hoanthanh', ngay: '05/12/2026', tong: 2400000, sdt: '0987 654 321', ghiChu: '' }
  ],
  tw_reviews: [
    { id: 'r1', ten: 'Nguyễn Thị Hoa', sao: 5, noiDung: 'Trải nghiệm tốt, nhân viên thân thiện.', traiNghiem: 'Du thuyền Hạ Long', ngay: '08/12/2026', phanHoi: '' },
    { id: 'r2', ten: 'Trần Văn Nam', sao: 4, noiDung: 'Dịch vụ ổn, đồ ăn ngon nhưng chờ hơi lâu.', traiNghiem: 'Du thuyền Hạ Long', ngay: '07/12/2026', phanHoi: '' },
    { id: 'r3', ten: 'Lê Minh Anh', sao: 3, noiDung: 'Cảnh đẹp, nên bổ sung thuyết minh tiếng Việt.', traiNghiem: 'Du thuyền Hạ Long', ngay: '06/12/2026', phanHoi: '' }
  ],
  tw_revenue: {
    thangNay: 45000000, donHoanThanh: 128, danhGiaTB: 4.7, tangTruong: 12,
    thang: [{ t: 'T7', v: 18 }, { t: 'T8', v: 26 }, { t: 'T9', v: 22 }, { t: 'T10', v: 34 }, { t: 'T11', v: 38 }, { t: 'T12', v: 45 }],
    top: [{ ten: 'Du thuyền Hạ Long', phanTram: 82 }, { ten: 'Homestay Sapa', phanTram: 24 }]
  }
};
Object.keys(SEED).forEach((khoa) => {
  if (!localStorage.getItem(khoa)) localStorage.setItem(khoa, JSON.stringify(SEED[khoa]));
});

// ---------- ĐỌC CÁC BẢNG DỮ LIỆU CHIA SẺ ----------

const dsTraiNghiem = docLS('tw_activities', []);
const dsDon        = docLS('tw_orders', []);
const dsDanhGia    = docLS('tw_reviews', []);
const doanhThu     = docLS('tw_revenue', null);

// ---------- TRẠNG THÁI LOADING: hiện skeleton 0.6s rồi mới điền số ----------
function hienSkeleton() {
  ['stat-hoat-dong', 'stat-don-cho', 'stat-danh-gia', 'stat-doanh-thu']
    .forEach((id) => { document.getElementById(id).textContent = '...'; });
}

function dienSoLieu() {
  // 1) Số trải nghiệm đang hoạt động
  const soHoatDong = dsTraiNghiem.filter((t) => t.trangThai === 'hoatdong').length;
  $('#stat-hoat-dong').textContent = soHoatDong;

  // 2) Số đơn đang chờ đối tác xác nhận
  const soDonCho = dsDon.filter((d) => d.trangThai === 'cho').length;
  $('#stat-don-cho').textContent = soDonCho;

  // 3) Điểm đánh giá trung bình (làm tròn 1 chữ số thập phân)
  const tb = dsDanhGia.length
    ? (dsDanhGia.reduce((tong, r) => tong + r.sao, 0) / dsDanhGia.length).toFixed(1)
    : '0.0';
  $('#stat-danh-gia').textContent = tb + ' ★';

  // 4) Doanh thu tháng hiện tại (định dạng tiền tệ Việt Nam)
  const dt = doanhThu ? doanhThu.thangNay : 0;
  $('#stat-doanh-thu').textContent = new Intl.NumberFormat('vi-VN').format(dt) + '₫';
}

// ---------- VẼ BIỂU ĐỒ CỘT BẰNG CSS (chiều cao tính theo % giá trị lớn nhất) ----------
function veBieuDo() {
  const duLieu = doanhThu ? doanhThu.thang : [];
  const giaTriLonNhat = Math.max(...duLieu.map((d) => d.v), 1);
  $('#chart').innerHTML = duLieu.map((d) => `
    <div class="col" title="${d.t}: ${d.v} triệu ₫">
      <div class="bar" style="height:${Math.round((d.v / giaTriLonNhat) * 100)}%"></div>
      <span class="lbl">${d.t}</span>
    </div>`).join('');
}

// ---------- DANH SÁCH VIỆC CẦN XỬ LÝ (liên kết sang trang khác) ----------
function hienViecCanLam() {
  const donCho   = dsDon.filter((d) => d.trangThai === 'cho').length;
  const choDuyet = dsTraiNghiem.filter((t) => t.duyet === 'cho').length;
  const chuaHoi  = dsDanhGia.filter((r) => !r.phanHoi).length;

  $('#viec-can-lam').innerHTML = `
    <li><span>${donCho} đơn đặt chờ xác nhận</span><a href="../partner-orders/index.html">Xử lý →</a></li>
    <li><span>${choDuyet} trải nghiệm chờ quản trị duyệt</span><a href="../partner-activity-management/index.html">Xem →</a></li>
    <li><span>${chuaHoi} đánh giá chưa phản hồi</span><a href="../partner-reviews/index.html">Phản hồi →</a></li>`;
}

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

// ---------- CHẠY KHI MỞ TRANG: loading -> điền dữ liệu ----------
hienSkeleton();
setTimeout(() => { dienSoLieu(); veBieuDo(); hienViecCanLam(); }, 600);
