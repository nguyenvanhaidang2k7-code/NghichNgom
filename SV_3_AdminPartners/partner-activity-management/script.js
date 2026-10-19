/* =====================================================
   TRANG QUẢN LÝ TRẢI NGHIỆM (ĐỐI TÁC) - TripWeave AI
   Chức năng: CRUD trải nghiệm (Thêm/Sửa/Xóa/Đổi trạng thái),
   tìm kiếm + lọc, mô phỏng AI gợi ý mô tả, đủ 4 trạng thái UI.
   Dữ liệu lưu ở LocalStorage khóa 'tw_activities'
   (trang admin-content cũng đọc khóa này để duyệt bài).
   ===================================================== */
const $ = (s) => document.querySelector(s);
const KHO = 'tw_activities';

// ---------- DỮ LIỆU MẪU LẦN ĐẦU (seed) ----------
const DU_LIEU_GOC = [
  { id: 'a1', ten: 'Làng cổ Đường Lâm', loai: 'Văn hóa', gia: 150000, sucChua: 30,
    moTa: 'Dạo bước giữa làng cổ đá ong, tìm hiểu kiến trúc và ẩm thực xứ Đoài.',
    ngay: 'Thứ 2 – Chủ nhật', gio: '07:00 – 17:00', trangThai: 'hoatdong', duyet: 'da' },
  { id: 'a2', ten: 'Du thuyền Hạ Long', loai: 'Nghỉ dưỡng', gia: 1200000, sucChua: 20,
    moTa: 'Trải nghiệm ngắm cảnh và dùng bữa trên du thuyền.',
    ngay: 'Thứ 2 – Chủ nhật', gio: '08:00 – 18:00', trangThai: 'hoatdong', duyet: 'cho' },
  { id: 'a3', ten: 'Homestay Sapa', loai: 'Nghỉ dưỡng', gia: 450000, sucChua: 12,
    moTa: 'Lưu trú bản địa, ngắm ruộng bậc thang và săn mây.',
    ngay: 'Thứ 6 – Chủ nhật', gio: 'Cả ngày', trangThai: 'tamngung', duyet: 'cho' }
];

// ---------- TRẠNG THÁI TOÀN CỤC CỦA TRANG ----------
let ds = [];                                    // Danh sách trải nghiệm hiện tại
let boLoc = { tuKhoa: '', trangThai: 'tatca' }; // Bộ lọc tìm kiếm + chip
let dangSuaId = null;                           // id đang sửa trong modal (null = thêm mới)
let dangQuanLyId = null;                        // id đang mở ở khung nhìn "Quản lý"
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
// Bấm ra ngoài khung modal thì đóng
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) dongModal(e.target.id);
});
function luuLS() { localStorage.setItem(KHO, JSON.stringify(ds)); }
// CHUẨN HÓA 1 trải nghiệm: thiếu trường nào điền mặc định trường đó
// -> dữ liệu cũ/hỏng trong LocalStorage không thể làm crash hàm render.
function chuanHoa(t) {
  if (!t || typeof t !== 'object') return null;
  return {
    id: String(t.id || 'a' + Math.random().toString(36).slice(2, 9)),
    ten: String(t.ten || 'Trải nghiệm chưa đặt tên'),
    loai: String(t.loai || 'Khác'),
    gia: Number(t.gia) >= 0 ? Number(t.gia) : 0,
    sucChua: Number(t.sucChua) > 0 ? Number(t.sucChua) : 10,
    moTa: String(t.moTa || ''),
    ngay: String(t.ngay || 'Theo lịch đối tác'),
    gio: String(t.gio || '—'),
    trangThai: t.trangThai === 'tamngung' ? 'tamngung' : 'hoatdong',
    duyet: (t.duyet === 'da' || t.duyet === 'tuchoi') ? t.duyet : 'cho'
  };
}
// Nạp dữ liệu: trả về false nếu LocalStorage hỏng => hiện trạng thái LỖI
// (đồng thời tự khôi phục bộ dữ liệu mẫu để bấm "Thử lại" là chạy ngay)
function napDuLieu() {
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

function dinhDangGia(gia) { return new Intl.NumberFormat('vi-VN').format(gia) + 'đ/người'; }
function nhanThumb(ten) { return ten.split(' ').slice(0, 2).join(' '); }
const BADGE = { hoatdong: ['success', 'Đang hoạt động'], tamngung: ['warning', 'Tạm ngưng'] };

// ---------- RENDER DANH SÁCH (bao phủ trạng thái loading / rỗng) ----------
function renderDanhSach(loading = false) {
  const box = $('#danh-sach');
  if (loading) { // Trạng thái LOADING: 3 khối skeleton nhấp nháy
    box.innerHTML = '<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>';
    return;
  }
  // Lọc theo chip trạng thái + từ khóa tìm kiếm
  let ketQua = ds.slice();
  if (boLoc.trangThai !== 'tatca') ketQua = ketQua.filter((t) => t.trangThai === boLoc.trangThai);
  if (boLoc.tuKhoa) {
    const k = boLoc.tuKhoa.toLowerCase();
    ketQua = ketQua.filter((t) => (t.ten + ' ' + t.loai).toLowerCase().includes(k));
  }
  // Trạng thái RỖNG: không có kết quả nào
  if (!ketQua.length) {
    box.innerHTML = `<div class="card empty-state"><span class="emoji">🗺️</span>
      <p>Không tìm thấy trải nghiệm phù hợp.</p>
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
  // Trạng thái BÌNH THƯỜNG: vẽ từng hàng trải nghiệm
  box.innerHTML = '<div class="list">' + ketQua.map((t) => `
    <div class="card row-card">
      <div class="thumb">${nhanThumb(t.ten)}</div>
      <div>
        <p class="row-title">${t.ten}</p>
        <p class="row-sub">${t.loai} • ${dinhDangGia(t.gia)} • Sức chứa ${t.sucChua}</p>
      </div>
      <div class="spacer"></div>
      <div class="badges">
        ${t.duyet === 'cho' ? '<span class="badge info">Chờ duyệt</span>' : ''}
        <span class="badge ${BADGE[t.trangThai][0]}">${BADGE[t.trangThai][1]}</span>
      </div>
      <div class="row-actions">
        <button class="btn btn-secondary" data-sua="${t.id}">Sửa</button>
        <button class="btn btn-primary" data-ql="${t.id}">Quản lý</button>
      </div>
    </div>`).join('') + '</div>';
}

// Hiển thị trạng thái LỖI khi không nạp được dữ liệu
function hienLoiTai() {
  $('#danh-sach').innerHTML = `<div class="card error-state"><span class="emoji">⚠️</span>
    <p>Không thể tải dữ liệu trải nghiệm. Vui lòng thử lại.</p>
    <button class="btn btn-primary" id="btn-thu-lai">Thử lại</button></div>`;
  $('#btn-thu-lai').onclick = khoiDong;
}

// ---------- TÌM KIẾM (gõ chậm 300ms mới lọc - debounce) ----------
let henGioTim = null;
$('#search-input').addEventListener('input', (e) => {
  boLoc.tuKhoa = e.target.value.trim();
  clearTimeout(henGioTim);
  henGioTim = setTimeout(() => {
    renderDanhSach(true);                    // loading ngắn
    setTimeout(() => renderDanhSach(), 400); // rồi render kết quả
  }, 300);
});

// ---------- CHIP LỌC TRẠNG THÁI ----------
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

// ---------- BẤM NÚT SỬA / QUẢN LÝ TRONG DANH SÁCH (ủy quyền sự kiện) ----------
$('#danh-sach').addEventListener('click', (e) => {
  const nutSua = e.target.closest('[data-sua]');
  const nutQl = e.target.closest('[data-ql]');
  if (nutSua) moModalForm(nutSua.dataset.sua);
  if (nutQl) moQuanLy(nutQl.dataset.ql);
});

// ---------- MODAL THÊM / SỬA TRẢI NGHIỆM (Create & Update) ----------
function moModalForm(id = null) {
  dangSuaId = id;
  const t = id ? ds.find((x) => x.id === id) : null;
  $('#modal-form-title').textContent = t ? 'Sửa trải nghiệm' : 'Thêm trải nghiệm';
  // Điền dữ liệu cũ nếu đang sửa, để trống nếu thêm mới
  $('#md-ten').value = t ? t.ten : '';
  $('#md-loai').value = t ? t.loai : 'Văn hóa';
  $('#md-gia').value = t ? t.gia : '';
  $('#md-suc-chua').value = t ? t.sucChua : '';
  $('#md-mo-ta').value = t ? t.moTa : '';
  $('#md-ngay').value = t ? t.ngay : 'Thứ 2 – Chủ nhật';
  $('#md-gio').value = t ? t.gio : '08:00 – 18:00';
  anAI(); // Ẩn kết quả AI cũ
  moModal('modal-form');
}
$('#btn-them').onclick = () => moModalForm(null);
$('#md-huy').onclick = () => dongModal('modal-form');

// Bấm "Lưu" trong modal: kiểm tra dữ liệu rồi thêm mới hoặc cập nhật
$('#form-modal').addEventListener('submit', (e) => {
  e.preventDefault();
  const duLieu = {
    ten: $('#md-ten').value.trim(),
    loai: $('#md-loai').value,
    gia: Number($('#md-gia').value),
    sucChua: Number($('#md-suc-chua').value),
    moTa: $('#md-mo-ta').value.trim(),
    ngay: $('#md-ngay').value.trim() || 'Thứ 2 – Chủ nhật',
    gio: $('#md-gio').value.trim() || 'Cả ngày'
  };
  // Trạng thái LỖI: dữ liệu nhập vào không hợp lệ
  if (!duLieu.ten) { toast('Vui lòng nhập tên trải nghiệm.', 'error'); return; }
  if (!(duLieu.gia > 0)) { toast('Giá phải lớn hơn 0.', 'error'); return; }
  if (!(duLieu.sucChua > 0)) { toast('Sức chứa phải lớn hơn 0.', 'error'); return; }

  if (dangSuaId) { // SỬA (Update)
    const t = ds.find((x) => x.id === dangSuaId);
    Object.assign(t, duLieu);
    toast('Đã cập nhật "' + duLieu.ten + '".', 'success');
  } else {         // THÊM (Create) - mặc định chờ quản trị duyệt
    ds.unshift({ id: 'a' + Date.now(), trangThai: 'hoatdong', duyet: 'cho', ...duLieu });
    toast('Đã thêm "' + duLieu.ten + '" (chờ quản trị duyệt).', 'success');
  }
  luuLS();
  dongModal('modal-form');
  renderDanhSach(true);
  setTimeout(() => renderDanhSach(), 400);
});

// ---------- KHUNG NHÌN QUẢN LÝ (mở khi bấm nút "Quản lý") ----------
function moQuanLy(id) {
  dangQuanLyId = id;
  const t = ds.find((x) => x.id === id);
  $('#ql-ten').value = t.ten; $('#ql-loai').value = t.loai;
  $('#ql-gia').value = t.gia; $('#ql-suc-chua').value = t.sucChua;
  $('#ql-mo-ta').value = t.moTa; $('#ql-ngay').value = t.ngay; $('#ql-gio').value = t.gio;
  capNhatNutTrangThai();
  $('#view-danh-sach').hidden = true;  // Ẩn danh sách
  $('#view-quan-ly').hidden = false;   // Hiện form quản lý
  window.scrollTo(0, 0);
}
// Đổi chữ nút theo trạng thái hiện tại
function capNhatNutTrangThai() {
  const t = ds.find((x) => x.id === dangQuanLyId);
  $('#btn-doi-trang-thai').textContent = t.trangThai === 'hoatdong' ? 'Tạm ngưng hoạt động' : 'Kích hoạt lại';
}
function quayLaiDanhSach() {
  dangQuanLyId = null;
  $('#view-quan-ly').hidden = true;
  $('#view-danh-sach').hidden = false;
  renderDanhSach(true);
  setTimeout(() => renderDanhSach(), 400);
}
$('#btn-quay-lai').onclick = quayLaiDanhSach;

// Nút "Lưu trải nghiệm" trong form quản lý (Update)
$('#form-quan-ly').addEventListener('submit', (e) => {
  e.preventDefault();
  const t = ds.find((x) => x.id === dangQuanLyId);
  const gia = Number($('#ql-gia').value), sucChua = Number($('#ql-suc-chua').value);
  if (!$('#ql-ten').value.trim() || !(gia > 0) || !(sucChua > 0)) {
    toast('Dữ liệu chưa hợp lệ, vui lòng kiểm tra lại.', 'error'); return;
  }
  t.ten = $('#ql-ten').value.trim(); t.loai = $('#ql-loai').value;
  t.gia = gia; t.sucChua = sucChua; t.moTa = $('#ql-mo-ta').value.trim();
  t.ngay = $('#ql-ngay').value.trim(); t.gio = $('#ql-gio').value.trim();
  luuLS();
  renderDanhSach(); // Cập nhật luôn danh sách nền
  toast('Đã lưu trải nghiệm!', 'success');
});

// Đổi trạng thái Đang hoạt động <-> Tạm ngưng (lưu trữ tạm)
$('#btn-doi-trang-thai').onclick = () => {
  const t = ds.find((x) => x.id === dangQuanLyId);
  t.trangThai = t.trangThai === 'hoatdong' ? 'tamngung' : 'hoatdong';
  luuLS(); capNhatNutTrangThai(); renderDanhSach();
  toast('Đã đổi trạng thái: ' + BADGE[t.trangThai][1], 'info');
};

// XÓA trải nghiệm (Delete) - luôn hỏi lại qua modal xác nhận
$('#btn-xoa').onclick = () => {
  const t = ds.find((x) => x.id === dangQuanLyId);
  moXacNhan('Xóa vĩnh viễn trải nghiệm "' + t.ten + '"? Thao tác này không thể hoàn tác.', () => {
    ds = ds.filter((x) => x.id !== dangQuanLyId);
    luuLS(); quayLaiDanhSach();
    toast('Đã xóa trải nghiệm.', 'success');
  });
};

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

// ---------- AI MÔ PHỎNG: GỢI Ý MÔ TẢ TRẢI NGHIỆM ----------
// Luồng: Nhập (tên + loại) -> Loading 1.2s -> Kết quả + Giải thích
//        -> Người dùng: Chấp nhận / Tạo lại / Từ chối
const AI_MAU = [
  {
    moTa: (ten, loai) => `${ten} là trải nghiệm ${loai.toLowerCase()} đặc trưng, phù hợp du khách thích khám phá và chụp ảnh. Tour thiết kế lịch trình linh hoạt, hướng dẫn viên bản địa và ẩm thực đặc sản.`,
    viSao: (loai) => `Từ khóa "${loai}" đang khớp xu hướng tìm kiếm của du khách; mô tả có "lịch trình linh hoạt + hướng dẫn viên bản địa" giúp tăng ~20% tỉ lệ đặt.`
  },
  {
    moTa: (ten, loai) => `Đến với ${ten}, du khách sẽ hòa mình vào không gian ${loai.toLowerCase()}, nghe người dân kể chuyện và tham gia hoạt động trải nghiệm thực tế. Phù hợp gia đình và nhóm bạn nhỏ.`,
    viSao: (loai) => `AI nhận thấy nhóm khách gia đình quan tâm danh mục ${loai} đang tăng; nhấn mạnh "hoạt động thực tế" phù hợp insight này.`
  }
];
function chayAI() {
  const ten = $('#md-ten').value.trim() || 'Trải nghiệm này';
  const loai = $('#md-loai').value;
  $('#ai-loading').hidden = false; $('#ai-result').hidden = true; // Trạng thái LOADING
  setTimeout(() => { // Giả lập AI xử lý trong 1.2 giây
    const mau = AI_MAU[Math.floor(Math.random() * AI_MAU.length)];
    $('#ai-text').textContent = mau.moTa(ten, loai);
    $('#ai-why').textContent = mau.viSao(loai);
    $('#ai-loading').hidden = true; $('#ai-result').hidden = false; // Trạng thái KẾT QUẢ
  }, 1200);
}
function anAI() { $('#ai-loading').hidden = true; $('#ai-result').hidden = true; }
$('#btn-ai').onclick = chayAI;
$('#ai-regen').onclick = chayAI; // Tạo lại gợi ý khác
$('#ai-accept').onclick = () => { // Chấp nhận: ghi mô tả AI vào ô mô tả
  $('#md-mo-ta').value = $('#ai-text').textContent;
  anAI(); toast('Đã áp dụng mô tả AI đề xuất.', 'success');
};
$('#ai-reject').onclick = () => { anAI(); toast('Đã từ chối đề xuất của AI.', 'info'); };

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

// ---------- KHỞI ĐỘNG TRANG: loading -> nạp dữ liệu -> render ----------
function khoiDong() {
  renderDanhSach(true);
  setTimeout(() => {
    if (!napDuLieu()) { hienLoiTai(); return; } // Trạng thái LỖI nếu LS hỏng
    renderDanhSach();                            // Bình thường (hoặc RỖNG)
  }, 600);
}
khoiDong();



