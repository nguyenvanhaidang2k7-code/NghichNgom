/* =====================================================
   TRANG ĐÁNH GIÁ (ĐỐI TÁC) - TripWeave AI
   Chức năng: Xem đánh giá, phản hồi khách (Update),
   ẩn đánh giá vi phạm (có xác nhận), tìm kiếm + lọc.
   Dữ liệu: LocalStorage khóa 'tw_reviews'.
   ===================================================== */
const $ = (s) => document.querySelector(s);
const KHO = 'tw_reviews';

// ---------- DỮ LIỆU MẪU LẦN ĐẦU (seed) ----------
const DU_LIEU_GOC = [
  { id: 'r1', ten: 'Nguyễn Thị Hoa', sao: 5, noiDung: 'Trải nghiệm tốt, nhân viên thân thiện.', traiNghiem: 'Du thuyền Hạ Long', ngay: '08/12/2026', phanHoi: '', an: false },
  { id: 'r2', ten: 'Trần Văn Nam', sao: 4, noiDung: 'Dịch vụ ổn, đồ ăn ngon nhưng chờ hơi lâu.', traiNghiem: 'Du thuyền Hạ Long', ngay: '07/12/2026', phanHoi: '', an: false },
  { id: 'r3', ten: 'Lê Minh Anh', sao: 3, noiDung: 'Cảnh đẹp, nên bổ sung thuyết minh tiếng Việt.', traiNghiem: 'Du thuyền Hạ Long', ngay: '06/12/2026', phanHoi: '', an: false }
];

// ---------- TRẠNG THÁI TOÀN CỤC ----------
let ds = [];
let boLoc = { tuKhoa: '', chip: 'tatca' };
let dangXemId = null;        // Đánh giá đang mở ở modal "Xem"
let dangPhanHoiId = null;    // Đánh giá đang mở ở modal "Phản hồi"
let hanhDongXacNhan = null;  // Hàm chạy khi bấm "Đồng ý" ở modal xác nhận

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
// CHUẨN HÓA 1 đánh giá: thiếu trường nào điền mặc định trường đó
// -> dữ liệu cũ/hỏng trong LocalStorage không thể làm crash hàm render.
function chuanHoa(r) {
  if (!r || typeof r !== 'object') return null;
  const sao = Number(r.sao);
  return {
    id: String(r.id || 'r' + Math.random().toString(36).slice(2, 9)),
    ten: String(r.ten || r.khach || 'Khách ẩn danh'),
    sao: sao >= 1 && sao <= 5 ? sao : 5,
    noiDung: String(r.noiDung || r.noi_dung || ''),
    traiNghiem: String(r.traiNghiem || 'Trải nghiệm'),
    ngay: String(r.ngay || '—'),
    phanHoi: String(r.phanHoi || ''),
    an: r.an === true
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
// Màu huy hiệu theo số sao: >=4 xanh lá, 3 vàng, <3 đỏ
const mauSao = (sao) => (sao >= 4 ? 'success' : sao === 3 ? 'warning' : 'danger');

// ---------- RENDER DANH SÁCH ĐÁNH GIÁ ----------
function renderDanhSach(loading = false) {
  const box = $('#danh-sach');
  if (loading) { box.innerHTML = '<div class="skeleton"></div>'.repeat(3); return; }
  let ketQua = ds.filter((r) => !r.an); // Đánh giá bị ẩn không hiển thị
  if (boLoc.chip === 'chuaphanhoi') ketQua = ketQua.filter((r) => !r.phanHoi);
  if (boLoc.tuKhoa) {
    const k = boLoc.tuKhoa.toLowerCase();
    ketQua = ketQua.filter((r) => r.ten.toLowerCase().includes(k) || r.noiDung.toLowerCase().includes(k));
  }
  if (!ketQua.length) { // Trạng thái RỖNG
    box.innerHTML = `<div class="card empty-state"><span class="emoji">⭐</span>
      <p>Chưa có đánh giá nào khớp bộ lọc.</p>
      <button class="btn btn-secondary" id="btn-xoa-loc">Xóa bộ lọc</button></div>`;
    $('#btn-xoa-loc').onclick = () => {
      boLoc = { tuKhoa: '', chip: 'tatca' };
      $('#search-input').value = '';
      ganChip('tatca');
      renderDanhSach(true);
      setTimeout(() => renderDanhSach(), 400);
    };
    return;
  }
  box.innerHTML = '<div class="list">' + ketQua.map((r) => `
    <div class="card row-card">
      <div class="thumb-avatar">${r.ten.charAt(0)}</div>
      <div>
        <p class="row-title">${r.ten}</p>
        <p class="row-sub">${r.noiDung}</p>
      </div>
      <div class="spacer"></div>
      <div class="badges">
        ${r.phanHoi ? '<span class="badge info">Đã phản hồi</span>' : ''}
        <span class="badge ${mauSao(r.sao)}">${r.sao.toFixed(1)} ★</span>
      </div>
      <div class="row-actions">
        <button class="btn btn-secondary" data-hoi="${r.id}">Phản hồi</button>
        <button class="btn btn-primary" data-xem="${r.id}">Xem</button>
      </div>
    </div>`).join('') + '</div>';
}

// ---------- TÌM KIẾM (debounce) + CHIP LỌC ----------
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
  boLoc.chip = giaTri;
  document.querySelectorAll('#chip-row .chip')
    .forEach((c) => c.classList.toggle('active', c.dataset.loc === giaTri));
}
$('#chip-row').addEventListener('click', (e) => {
  if (!e.target.classList.contains('chip')) return;
  ganChip(e.target.dataset.loc);
  renderDanhSach(true);
  setTimeout(() => renderDanhSach(), 400);
});
// Bấm nút trong danh sách (ủy quyền sự kiện)
$('#danh-sach').addEventListener('click', (e) => {
  const nutHoi = e.target.closest('[data-hoi]');
  const nutXem = e.target.closest('[data-xem]');
  if (nutHoi) moPhanHoi(nutHoi.dataset.hoi);
  if (nutXem) moXem(nutXem.dataset.xem);
});

// ---------- MODAL XEM CHI TIẾT (READ) ----------
function moXem(id) {
  dangXemId = id;
  const r = ds.find((x) => x.id === id);
  $('#rv-ten').textContent = r.ten;
  $('#rv-tn').textContent = r.traiNghiem;
  $('#rv-ngay').textContent = r.ngay;
  $('#rv-sao').innerHTML = `<span class="badge ${mauSao(r.sao)}">${r.sao.toFixed(1)} ★</span>`;
  $('#rv-noi-dung').textContent = r.noiDung;
  $('#rv-phan-hoi').textContent = r.phanHoi || '(chưa phản hồi)';
  moModal('modal-xem');
}
$('#rv-dong').onclick = () => dongModal('modal-xem');

// Ẩn đánh giá (kiểm duyệt) - luôn hỏi lại qua modal xác nhận
$('#rv-an').onclick = () => {
  const r = ds.find((x) => x.id === dangXemId);
  moXacNhan('Ẩn đánh giá của "' + r.ten + '" khỏi danh sách công khai?', () => {
    r.an = true;
    luuLS();
    dongModal('modal-xem');
    renderDanhSach(true);
    setTimeout(() => renderDanhSach(), 400);
    toast('Đã ẩn đánh giá (mô phỏng kiểm duyệt).', 'info');
  });
};

// ---------- MODAL PHẢN HỒI ĐÁNH GIÁ (UPDATE) ----------
function moPhanHoi(id) {
  dangPhanHoiId = id;
  const r = ds.find((x) => x.id === id);
  $('#ph-noi-dung').value = r.phanHoi; // Điền phản hồi cũ nếu có
  moModal('modal-phan-hoi');
}
$('#ph-huy').onclick = () => dongModal('modal-phan-hoi');
$('#form-phan-hoi').addEventListener('submit', (e) => {
  e.preventDefault();
  const noiDung = $('#ph-noi-dung').value.trim();
  if (!noiDung) { // Trạng thái LỖI: phản hồi rỗng
    toast('Nội dung phản hồi không được để trống.', 'error');
    return;
  }
  const r = ds.find((x) => x.id === dangPhanHoiId);
  r.phanHoi = noiDung;
  luuLS();
  dongModal('modal-phan-hoi');
  renderDanhSach(true);
  setTimeout(() => renderDanhSach(), 400);
  toast('Đã gửi phản hồi đến ' + r.ten + '.', 'success'); // Trạng thái THÀNH CÔNG
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
        <p>Không thể tải đánh giá. Vui lòng thử lại.</p>
        <button class="btn btn-primary" id="btn-thu-lai">Thử lại</button></div>`;
      $('#btn-thu-lai').onclick = khoiDong;
      return;
    }
    renderDanhSach();
  }, 600);
}
khoiDong();

