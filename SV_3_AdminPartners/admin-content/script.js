/* =====================================================
   TRANG QUẢN TRỊ NỘI DUNG - TripWeave AI (BẢN ĐÃ SỬA LỖI)
   - Mock data đầy đủ, renderContent() chạy khi DOMContentLoaded.
   - Chip lọc (Tất cả / Chờ duyệt / Đã duyệt) + tìm theo tên.
   - Duyệt / từ chối nội dung, dữ liệu chuẩn hóa trước khi
     render (khóa 'tw_activities' dùng chung với trang đối tác).
   ===================================================== */
const $ = (s) => document.querySelector(s);
const KHO = 'tw_activities';

// ---------- MẢNG DỮ LIỆU GIẢ LẬP (MOCK DATA) ----------
const DU_LIEU_GOC = [
  { id: 'a1', ten: 'Làng cổ Đường Lâm', loai: 'Văn hóa', gia: 150000, sucChua: 30,
    moTa: 'Dạo bước giữa làng cổ đá ong, tìm hiểu kiến trúc và ẩm thực xứ Đoài.',
    ngay: 'Thứ 2 – Chủ nhật', gio: '07:00 – 17:00', trangThai: 'hoatdong', duyet: 'da' },
  { id: 'a2', ten: 'Du thuyền Hạ Long', loai: 'Nghỉ dưỡng', gia: 1200000, sucChua: 20,
    moTa: 'Trải nghiệm ngắm cảnh và dùng bữa trên du thuyền.',
    ngay: 'Thứ 2 – Chủ nhật', gio: '08:00 – 18:00', trangThai: 'hoatdong', duyet: 'cho' },
  { id: 'a3', ten: 'Homestay Sapa', loai: 'Nghỉ dưỡng', gia: 450000, sucChua: 12,
    moTa: 'Lưu trú bản địa, ngắm ruộng bậc thang và săn mây.',
    ngay: 'Thứ 6 – Chủ nhật', gio: 'Cả ngày', trangThai: 'tamngung', duyet: 'cho' },
  { id: 'a4', ten: 'Phố cổ Hội An về đêm', loai: 'Văn hóa', gia: 99000, sucChua: 50,
    moTa: 'Thả đèn hoa đăng, dạo phố lồng đèn và thưởng thức cao lầu.',
    ngay: 'Thứ 5 – Chủ nhật', gio: '17:00 – 22:00', trangThai: 'hoatdong', duyet: 'cho' }
];

// ---------- TRẠNG THÁI TOÀN CỤC ----------
let ds = [];
let boLoc = { tuKhoa: '', duyet: 'tatca' };
let dangXemId = null;
let hanhDongXacNhan = null;

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

// CHUẨN HÓA 1 trải nghiệm: thiếu trường nào điền mặc định trường đó;
// giá trị lạ bị đưa về mặc định -> render không bao giờ crash.
function chuanHoa(t) {
  if (!t || typeof t !== 'object') return null;
  return {
    id: String(t.id || 'a' + Math.random().toString(36).slice(2, 9)),
    ten: String(t.ten || t.name || t.tieuDe || 'Trải nghiệm chưa đặt tên'),
    loai: String(t.loai || t.danhMuc || 'Khác'),
    gia: Number(t.gia) >= 0 ? Number(t.gia) : 0,
    sucChua: Number(t.sucChua) > 0 ? Number(t.sucChua) : 10,
    moTa: String(t.moTa || t.description || ''),
    ngay: String(t.ngay || 'Theo lịch đối tác'),
    gio: String(t.gio || '—'),
    trangThai: t.trangThai === 'tamngung' ? 'tamngung' : 'hoatdong',
    duyet: (t.duyet === 'da' || t.duyet === 'tuchoi') ? t.duyet : 'cho'
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
  renderContent();
  toast('Đã khôi phục dữ liệu mẫu.', 'info');
}
const dinhDangGia = (gia) => new Intl.NumberFormat('vi-VN').format(Number(gia) || 0) + 'đ/người';
const nhanThumb = (ten) => String(ten || '?').split(' ').slice(0, 2).join(' ');
const BADGE = { hoatdong: ['success', 'Đang hoạt động'], tamngung: ['warning', 'Tạm ngưng'] };
// ---------- DUYỆT NỘI DUNG (UPDATE: cho -> da) ----------
function duyetBai(id) {
  const t = ds.find((x) => x.id === id);
  if (!t) return;
  if (t.duyet === 'da') { toast('Nội dung đã được duyệt trước đó.', 'info'); return; }
  t.duyet = 'da';
  luuLS(); renderContent();
  toast('Đã duyệt "' + t.ten + '".', 'success'); // Trạng thái THÀNH CÔNG
}

// ---------- HÀM RENDER DANH SÁCH NỘI DUNG RA MÀN HÌNH ----------
function renderContent(loading = false) {
  const box = $('#danh-sach');
  if (!box) return;
  if (loading) { box.innerHTML = '<div class="skeleton"></div>'.repeat(3); return; }
  // LỌC THEO CHIP (trạng thái duyệt) + TỪ KHÓA TÌM KIẾM
  let ketQua = ds.slice();
  if (boLoc.duyet !== 'tatca') ketQua = ketQua.filter((t) => t.duyet === boLoc.duyet);
  if (boLoc.tuKhoa) {
    const k = boLoc.tuKhoa.toLowerCase();
    ketQua = ketQua.filter((t) => t.ten.toLowerCase().includes(k) || t.loai.toLowerCase().includes(k));
  }
  try {
    if (!ketQua.length) { // TRẠNG THÁI RỖNG
      box.innerHTML = `<div class="card empty-state"><span class="emoji">📚</span>
        <p>Không có nội dung nào khớp bộ lọc.</p>
        <button class="btn btn-secondary" id="btn-xoa-loc" type="button">Xóa bộ lọc</button></div>`;
      $('#btn-xoa-loc').onclick = () => {
        boLoc = { tuKhoa: '', duyet: 'tatca' };
        $('#search-input').value = '';
        ganChip('tatca');
        renderContent(true);
        setTimeout(() => renderContent(), 400);
      };
      return;
    }
    // TRẠNG THÁI THÀNH CÔNG: thumb chữ + tên + loại/giá + huy hiệu + nút
    box.innerHTML = '<div class="list">' + ketQua.map((t) => `
      <div class="card row-card">
        <div class="thumb">${nhanThumb(t.ten)}</div>
        <div>
          <p class="row-title">${t.ten}</p>
          <p class="row-sub">${t.loai} • ${dinhDangGia(t.gia)} • Sức chứa ${t.sucChua} người</p>
        </div>
        <div class="spacer"></div>
        <span class="badge ${BADGE[t.trangThai][0]}">${BADGE[t.trangThai][1]}</span>
        <span class="badge ${t.duyet === 'da' ? 'success' : 'info'}">
          ${t.duyet === 'da' ? 'Đã duyệt' : 'Chờ duyệt'}
        </span>
        <div class="row-actions">
          <button class="btn btn-secondary" data-xem="${t.id}" type="button">Chi tiết</button>
          <button class="btn btn-primary btn-sm" data-duyet="${t.id}" type="button" ${t.duyet === 'da' ? 'disabled' : ''}>
            ${t.duyet === 'da' ? '✓ Đã duyệt' : 'Duyệt'}
          </button>
        </div>
      </div>`).join('') + '</div>';
  } catch (err) {
    console.error('Lỗi render danh sách nội dung:', err);
    box.innerHTML = `<div class="card error-state"><span class="emoji">⚠️</span>
      <p>Không thể hiển thị danh sách nội dung.</p>
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
    renderContent(true);
    setTimeout(() => renderContent(), 400);
  }, 300);
});
function ganChip(giaTri) {
  boLoc.duyet = giaTri;
  document.querySelectorAll('#chip-row .chip')
    .forEach((c) => c.classList.toggle('active', c.dataset.loc === giaTri));
}
$('#chip-row').addEventListener('click', (e) => {
  if (!e.target.classList.contains('chip')) return;
  ganChip(e.target.dataset.loc);
  renderContent(true);
  setTimeout(() => renderContent(), 400);
});
// Bấm nút trong danh sách: xem chi tiết / duyệt nhanh
$('#danh-sach').addEventListener('click', (e) => {
  const nutXem = e.target.closest('[data-xem]');
  const nutDuyet = e.target.closest('[data-duyet]');
  if (nutXem) moChiTiet(nutXem.dataset.xem);
  if (nutDuyet && !nutDuyet.disabled) duyetBai(nutDuyet.dataset.duyet);
});
// ---------- MODAL CHI TIẾT NỘI DUNG (READ + duyệt / từ chối) ----------
function moChiTiet(id) {
  dangXemId = id;
  const t = ds.find((x) => x.id === id);
  if (!t) return;
  $('#ct-ten').textContent = t.ten;
  $('#ct-loai').textContent = t.loai;
  $('#ct-gia').textContent = dinhDangGia(t.gia);
  $('#ct-suc-chua').textContent = t.sucChua + ' người';
  $('#ct-ngay').textContent = t.ngay;
  $('#ct-gio').textContent = t.gio;
  $('#ct-mo-ta').textContent = t.moTa || '(chưa có mô tả)';
  $('#ct-trang-thai').innerHTML =
    `<span class="badge ${BADGE[t.trangThai][0]}">${BADGE[t.trangThai][1]}</span>`;
  $('#ct-duyet-trang-thai').innerHTML =
    `<span class="badge ${t.duyet === 'da' ? 'success' : 'info'}">
      ${t.duyet === 'da' ? 'Đã duyệt' : 'Chờ duyệt'}</span>`;
  $('#ct-duyet').textContent = t.duyet === 'da' ? 'Đã duyệt' : 'Duyệt bài';
  $('#ct-duyet').disabled = t.duyet === 'da';
  moModal('modal-chi-tiet');
}
$('#ct-dong').onclick = () => dongModal('modal-chi-tiet');
// Duyệt bài từ modal chi tiết (UPDATE)
$('#ct-duyet').onclick = () => {
  duyetBai(dangXemId);
  dongModal('modal-chi-tiet');
};
// Từ chối nội dung = gỡ khỏi hệ thống (DELETE) - luôn xác nhận
$('#ct-tu-choi').onclick = () => {
  const t = ds.find((x) => x.id === dangXemId);
  if (!t) return;
  moXacNhan('Từ chối và gỡ "' + t.ten + '" khỏi hệ thống? Đối tác sẽ được thông báo (mô phỏng).', () => {
    ds = ds.filter((x) => x.id !== dangXemId);
    luuLS(); dongModal('modal-chi-tiet'); renderContent();
    toast('Đã từ chối và gỡ nội dung.', 'info');
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
  renderContent(true); // LOADING
  setTimeout(() => {
    const ok = napDuLieu();
    if (!ok) toast('Dữ liệu cũ không hợp lệ - đã khôi phục dữ liệu mẫu.', 'info');
    renderContent();   // SUCCESS
  }, 600);
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', khoiDong);
} else {
  khoiDong();
}

// =====================================================
//  TÍNH NĂNG AI-2: ROUTE BALANCE ASSISTANT
//  Mô phỏng AI tự động quét các tuyến đường / lịch trình do
//  người dùng tạo ra:
//  - Phát hiện lịch trình QUÁ TẢI (quá nhiều điểm trong ngày)
//    và khoảng cách giữa 2 điểm đến QUÁ XA (trên 30km).
//  - Đưa ra gợi ý cân bằng lại lộ trình.
//  - Quản trị viên duyệt bằng 3 nút: Chấp nhận (Accept) /
//    Yêu cầu chỉnh sửa (Request Edit) / Từ chối (Reject).
// =====================================================

// ---------- DỮ LIỆU GIẢ LẬP: CÁC LỊCH TRÌNH DO NGƯỜI DÙNG TẠO ----------
// Mỗi ngày gồm các điểm đến; "km" = khoảng cách từ điểm liền trước (điểm đầu ngày = 0)
const DU_LIEU_LO_TRINH = [
  { id: 'r1', ten: 'Hành trình di sản miền Trung', nguoiTao: 'Khách du lịch minhchau.le@gmail.com',
    ngay: [
      { ten: 'ngày 1', diem: [
        { ten: 'Phố cổ Hội An', km: 0 }, { ten: 'Chùa Cầu', km: 1.2 }, { ten: 'Làng rau Trà Quế', km: 4.5 } ] },
      { ten: 'ngày 2', diem: [
        { ten: 'Phố cổ Hội An', km: 0 }, { ten: 'Thánh địa Mỹ Sơn', km: 45 },
        { ten: 'Bán đảo Sơn Trà', km: 62 }, { ten: 'Cầu Rồng Đà Nẵng', km: 12 }, { ten: 'Ngũ Hành Sơn', km: 9 } ] }
    ] },
  { id: 'r2', ten: 'Khám phá Tây Bắc 3 ngày', nguoiTao: 'Hướng dẫn viên dungpham@gmail.com',
    ngay: [
      { ten: 'ngày 1', diem: [ { ten: 'Thị xã Sapa', km: 0 }, { ten: 'Bản Cát Cát', km: 3 }, { ten: 'Núi Hàm Rồng', km: 4 } ] },
      { ten: 'ngày 2', diem: [ { ten: 'Đèo Ô Quy Hồ', km: 18 }, { ten: 'Thác Bạc', km: 6 }, { ten: 'Cổng Trời', km: 9 } ] },
      { ten: 'ngày 3', diem: [ { ten: 'Ruộng bậc thang Mường Hoa', km: 12 }, { ten: 'Chợ phiên Sapa', km: 8 } ] }
    ] },
  { id: 'r3', ten: 'Food tour Hà Nội trong 1 ngày', nguoiTao: 'Khách du lịch nguyenvanan@gmail.com',
    ngay: [
      { ten: 'ngày 1', diem: [
        { ten: 'Hồ Gươm', km: 0 }, { ten: 'Phố ẩm thực Tạ Hiện', km: 1.2 }, { ten: 'Làng gốm Bát Tràng', km: 38 },
        { ten: 'Văn Miếu - Quốc Tử Giám', km: 42 }, { ten: 'Chợ Đồng Xuân', km: 6 } ] }
    ] },
  { id: 'r4', ten: 'Nghỉ dưỡng Phú Quốc 2 ngày 1 đêm', nguoiTao: 'Đối tác halongpremium@gmail.com',
    ngay: [
      { ten: 'ngày 1', diem: [ { ten: 'Bãi Sao', km: 0 }, { ten: 'Nhà tù Phú Quốc', km: 7 }, { ten: 'Chợ đêm Dương Đông', km: 18 } ] },
      { ten: 'ngày 2', diem: [ { ten: 'VinWonders Phú Quốc', km: 14 }, { ten: 'Bãi Dài', km: 5 } ] }
    ] }
];

// ---------- NGƯỠNG "AI" DÙNG ĐỂ PHÁT SINH CẢNH BÁO ----------
const NGUONG_KM_XA = 30;   // 2 điểm liên tiếp cách nhau trên 30km -> di chuyển quá xa
const NGUONG_SO_DIEM = 4;  // 1 ngày vượt quá 4 điểm dừng -> lịch trình quá tải

// ---------- LOGIC AI: QUÉT & PHÂN TÍCH TỪNG NGÀY CỦA MỖI LỊCH TRÌNH ----------
function phanTichLoTrinh() {
  const canhBao = [];
  let soLoTrinh = 0, soNgay = 0;
  DU_LIEU_LO_TRINH.forEach((lt) => {
    soLoTrinh++;
    (lt.ngay || []).forEach((ngay, i) => {
      soNgay++;
      const diem = ngay.diem || [];
      // Các đoạn di chuyển vượt ngưỡng 30km
      const doanXa = diem.filter((d) => Number(d.km) > NGUONG_KM_XA);
      // Ngày quá dày điểm dừng
      const quaTai = diem.length > NGUONG_SO_DIEM;
      if (!doanXa.length && !quaTai) return; // Ngày hợp lý -> bỏ qua
      // Ghép câu cảnh báo (đúng mẫu: "Lịch trình ngày X quá tải, khoảng cách...")
      const phan = [];
      if (quaTai) phan.push('lịch trình ' + ngay.ten + ' quá tải (' + diem.length + ' điểm dừng trong 1 ngày)');
      if (doanXa.length) {
        phan.push('khoảng cách giữa 2 điểm đến quá xa (trên ' + NGUONG_KM_XA + 'km): ' +
          doanXa.map((d) => d.ten + ' cách điểm trước ' + d.km + 'km').join(', '));
      }
      const tongKm = diem.reduce((s, d) => s + Number(d.km || 0), 0);
      canhBao.push({
        id: lt.id + '-n' + (i + 1),
        ten: lt.ten, nguoiTao: lt.nguoiTao, ngayTen: ngay.ten,
        muc: (quaTai && doanXa.length) ? 'danger' : 'warning',
        vanDe: '⚠️ Cảnh báo: ' + phan.join('; ') + '.',
        goiY: '💡 Gợi ý cân bằng của AI: ' + (quaTai
          ? 'dời bớt điểm "' + diem[diem.length - 1].ten + '" sang ngày kế tiếp và giữ tối đa ' + NGUONG_SO_DIEM + ' điểm/ngày'
          : 'dời điểm "' + doanXa[0].ten + '" sang ngày khác hoặc bổ sung điểm nghỉ giữa quãng') +
          ' — tổng quãng đường ngày này sẽ giảm từ ' + tongKm.toFixed(1) + 'km xuống mức hợp lý.'
      });
    });
  });
  return { canhBao, soLoTrinh, soNgay };
}

// ---------- TRẠNG THÁI AI + RENDER KẾT QUẢ CẢNH BÁO ----------
let aiKetQua = null;    // Kết quả lần quét gần nhất
let aiDangQuet = false; // Chống bấm nút "quét" liên tục

function renderAiKetQua() {
  const box = $('#ai-results');
  if (!box || !aiKetQua) return;
  if (!aiKetQua.canhBao.length) { // TRẠNG THÁI: mọi lộ trình đều hợp lý
    box.innerHTML = '<div class="ai-ok">🎉 AI đã quét ' + aiKetQua.soLoTrinh +
      ' lộ trình (' + aiKetQua.soNgay + ' ngày lịch trình). Tất cả đều hợp lý — không phát hiện lịch trình quá tải hay quãng đường di chuyển bất thường.</div>';
    return;
  }
  // TRẠNG THÁI: có cảnh báo -> thẻ cảnh báo + gợi ý cân bằng + 3 nút duyệt
  box.innerHTML = aiKetQua.canhBao.map((c) => `
    <div class="ai-item ${c.muc === 'warning' ? 'muc-warning' : ''}" data-canh-bao="${c.id}">
      <div class="ai-item-head">
        <span class="ai-badge">${c.muc === 'danger' ? '🚨 Quá tải nghiêm trọng' : '⚠️ Cần cân bằng'}</span>
        <b>Lộ trình "${c.ten}" — ${c.ngayTen}</b>
        <span class="ai-creator">👤 Người tạo: ${c.nguoiTao}</span>
      </div>
      <p class="ai-msg">${c.vanDe}</p>
      <p class="ai-suggest">${c.goiY}</p>
      <div class="ai-actions">
        <button class="btn btn-primary" data-ai="accept" type="button">✓ Chấp nhận</button>
        <button class="btn btn-secondary" data-ai="edit" type="button">✏️ Yêu cầu chỉnh sửa</button>
        <button class="btn btn-danger" data-ai="reject" type="button">✕ Từ chối</button>
      </div>
    </div>`).join('');
}

// ---------- MÔ PHỎNG QUÁ TRÌNH AI QUÉT (trạng thái + thanh tiến trình) ----------
function chayQuetAI() {
  if (aiDangQuet) return;
  aiDangQuet = true;
  const btn = $('#ai-scan-btn'), status = $('#ai-status');
  const stText = $('#ai-status-text'), prog = $('#ai-progress'), bar = $('#ai-progress-bar');
  btn.disabled = true; btn.textContent = '⏳ AI đang quét...';
  status.className = 'ai-status scanning';
  $('#ai-results').innerHTML = '<div class="skeleton"></div><div class="skeleton"></div>'; // LOADING
  prog.hidden = false; bar.style.width = '0%';
  let pct = 0;
  const tangTienDo = setInterval(() => {
    pct = Math.min(100, pct + Math.random() * 16 + 7);
    bar.style.width = pct + '%';
    stText.textContent = 'AI đang quét lộ trình... ' + Math.floor(pct) + '%';
    if (pct < 100) return;
    // Quét xong: chạy thuật toán phân tích + hiển thị cảnh báo
    clearInterval(tangTienDo);
    aiKetQua = phanTichLoTrinh();
    renderAiKetQua();
    prog.hidden = true;
    const m = aiKetQua.canhBao.length;
    status.className = 'ai-status ' + (m ? 'alert' : 'done');
    stText.textContent = m
      ? 'Đã quét ' + aiKetQua.soLoTrinh + ' lộ trình — phát hiện ' + m + ' cảnh báo'
      : 'Đã quét ' + aiKetQua.soLoTrinh + ' lộ trình — tất cả hợp lý';
    btn.disabled = false; btn.textContent = '🔍 Quét lại lộ trình';
    aiDangQuet = false;
    if (m) toast('🤖 AI-2 phát hiện ' + m + ' lịch trình cần cân bằng lại.', 'error');
    else toast('🤖 AI-2: mọi lộ trình đều hợp lý.', 'success');
  }, 200);
}
$('#ai-scan-btn').addEventListener('click', chayQuetAI);

// ---------- XỬ LÝ 3 NÚT DUYỆT: CHẤP NHẬN / YÊU CẦU CHỈNH SỬA / TỪ CHỐI ----------
$('#ai-results').addEventListener('click', (e) => {
  const nut = e.target.closest('[data-ai]');
  if (!nut) return;
  const item = nut.closest('[data-canh-bao]');
  if (!item || item.classList.contains('decided')) return; // đã ra quyết định thì bỏ qua
  const hanhDong = nut.dataset.ai;
  const gio = new Date().toLocaleTimeString('vi-VN');
  item.classList.add('decided');
  const quyetDinh = document.createElement('p');
  quyetDinh.className = 'ai-decision';
  if (hanhDong === 'accept') { // CHẤP NHẬN (Accept) gợi ý cân bằng của AI
    quyetDinh.textContent = '✅ CHẤP NHẬN (' + gio + ') — AI sẽ tự động cân bằng lại lộ trình theo gợi ý và gửi thông báo tới người tạo.';
    toast('Đã chấp nhận gợi ý cân bằng lộ trình của AI.', 'success');
  } else if (hanhDong === 'edit') { // YÊU CẦU CHỈNH SỬA (Request Edit)
    quyetDinh.textContent = '✏️ YÊU CẦU CHỈNH SỬA (' + gio + ') — hệ thống đã gửi phân tích của AI kèm yêu cầu chỉnh sửa tới người tạo lộ trình.';
    toast('Đã gửi yêu cầu chỉnh sửa tới người tạo lộ trình.', 'info');
  } else { // TỪ CHỐI (Reject) cảnh báo
    quyetDinh.textContent = '✕ TỪ CHỐI (' + gio + ') — cảnh báo bị bỏ qua, lộ trình được giữ nguyên như người tạo đã sắp xếp.';
    toast('Đã từ chối cảnh báo của AI.', 'error');
  }
  item.querySelector('.ai-actions').replaceWith(quyetDinh); // thay 3 nút bằng kết quả duyệt
});

// AI TỰ ĐỘNG QUÉT khi mở trang (sau khi danh sách nội dung render xong)
setTimeout(chayQuetAI, 1500);


