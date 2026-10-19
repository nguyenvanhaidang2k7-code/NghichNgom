/* =====================================================
   TRANG CÀI ĐẶT HỆ THỐNG (QUẢN TRỊ) - TripWeave AI
   Chức năng: lưu cấu hình hiển thị kết quả tìm kiếm,
   phiên đăng nhập, 2FA; cài đặt thông báo;
   CRUD danh mục hoạt động (thêm / xóa có xác nhận).
   Dữ liệu: LocalStorage khóa 'tw_settings' + 'tw_categories'.
   ===================================================== */
const $ = (s) => document.querySelector(s);
const KHO_CAU_HINH = 'tw_settings';
const KHO_DANH_MUC = 'tw_categories';

// ---------- DỮ LIỆU MẪU LẦN ĐẦU (seed) ----------
const CAU_HINH_GOC = {
  hienThi: 'Ưu tiên đối tác', // Cơ chế hiển thị kết quả tìm kiếm
  phien: '30',                 // Thời gian hết phiên (phút)
  haiFa: true,                 // Bật xác thực 2 lớp
  thongBao: { email: true, push: true, tuan: false }
};
const DANH_MUC_GOC = ['Văn hóa', 'Thiên nhiên', 'Ẩm thực', 'Nghỉ dưỡng', 'Phiêu lưu'];

let cauHinh = null;   // Cấu hình hiện tại
let danhMuc = [];     // Danh sách danh mục hiện tại
let hanhDongXacNhan = null; // Hàm chạy khi bấm "Đồng ý" ở modal xác nhận

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
// Nạp dữ liệu: hỏng thì khôi phục mặc định (trạng thái LỖI có dự phòng)
function napDuLieu() {
  try {
    cauHinh = JSON.parse(localStorage.getItem(KHO_CAU_HINH)) || { ...CAU_HINH_GOC, thongBao: { ...CAU_HINH_GOC.thongBao } };
    danhMuc = JSON.parse(localStorage.getItem(KHO_DANH_MUC)) || [...DANH_MUC_GOC];
    if (!Array.isArray(danhMuc)) throw new Error('Sai định dạng');
  } catch (e) {
    cauHinh = { ...CAU_HINH_GOC, thongBao: { ...CAU_HINH_GOC.thongBao } };
    danhMuc = [...DANH_MUC_GOC];
    luuCauHinh(); luuDanhMuc();
    toast('Dữ liệu cài đặt bị hỏng, đã khôi phục mặc định.', 'error');
    return false;
  }
  luuCauHinh(); luuDanhMuc();
  return true;
}
function luuCauHinh() { localStorage.setItem(KHO_CAU_HINH, JSON.stringify(cauHinh)); }
function luuDanhMuc() { localStorage.setItem(KHO_DANH_MUC, JSON.stringify(danhMuc)); }

// ---------- ĐỔ CẤU HÌNH VÀO FORM ----------
function dienCauHinh() {
  $('#set-hien-thi').value = cauHinh.hienThi;
  $('#set-phien').value = cauHinh.phien;
  $('#set-2fa').checked = cauHinh.haiFa;
  $('#tb-email').checked = cauHinh.thongBao.email;
  $('#tb-push').checked = cauHinh.thongBao.push;
  $('#tb-tuan').checked = cauHinh.thongBao.tuan;
}

// ---------- LƯU CẤU HÌNH HỆ THỐNG (UPDATE) ----------
$('#form-cau-hinh').addEventListener('submit', (e) => {
  e.preventDefault();
  cauHinh.hienThi = $('#set-hien-thi').value;
  cauHinh.phien = $('#set-phien').value;
  cauHinh.haiFa = $('#set-2fa').checked;
  luuCauHinh();
  toast('Đã lưu cấu hình hệ thống!', 'success'); // Trạng thái THÀNH CÔNG
});

// ---------- LƯU CÀI ĐẶT THÔNG BÁO (UPDATE) ----------
$('#form-thong-bao').addEventListener('submit', (e) => {
  e.preventDefault();
  cauHinh.thongBao = {
    email: $('#tb-email').checked,
    push: $('#tb-push').checked,
    tuan: $('#tb-tuan').checked
  };
  luuCauHinh();
  toast('Đã lưu cài đặt thông báo!', 'success');
});

// ---------- RENDER DANH SÁCH DANH MỤC ----------
function renderDanhMuc() {
  const box = $('#danh-muc-list');
  if (!danhMuc.length) { // Trạng thái RỖNG
    box.innerHTML = '<p class="hint">Chưa có danh mục nào. Thêm mới ở ô bên dưới.</p>';
    return;
  }
  box.innerHTML = danhMuc.map((ten, i) => `
    <div class="dm-item">🏷 <b>${ten}</b> <span class="badge muted">#${i + 1}</span>
      <div class="spacer"></div>
      <button class="btn btn-danger" data-xoa="${i}" type="button">Xóa</button>
    </div>`).join('');
}

// ---------- THÊM DANH MỤC (CREATE) ----------
$('#btn-them-dm').onclick = () => {
  const ten = $('#dm-ten').value.trim();
  // Trạng thái LỖI: tên rỗng hoặc trùng lặp
  if (!ten) { toast('Vui lòng nhập tên danh mục.', 'error'); return; }
  if (danhMuc.some((t) => t.toLowerCase() === ten.toLowerCase())) {
    toast('Danh mục "' + ten + '" đã tồn tại.', 'error'); return;
  }
  danhMuc.push(ten);
  luuDanhMuc();
  $('#dm-ten').value = '';
  renderDanhMuc();
  toast('Đã thêm danh mục "' + ten + '".', 'success'); // THÀNH CÔNG
};
// Bấm Enter trong ô nhập cũng thêm danh mục
$('#dm-ten').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); $('#btn-them-dm').click(); }
});

// ---------- XÓA DANH MỤC (DELETE) - ủy quyền sự kiện + xác nhận ----------
$('#danh-muc-list').addEventListener('click', (e) => {
  const nut = e.target.closest('[data-xoa]');
  if (!nut) return;
  const viTri = Number(nut.dataset.xoa);
  moXacNhan('Xóa danh mục "' + danhMuc[viTri] + '" khỏi hệ thống?', () => {
    danhMuc.splice(viTri, 1);
    luuDanhMuc();
    renderDanhMuc();
    toast('Đã xóa danh mục.', 'success');
  });
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

// ---------- KHỞI ĐỘNG: loading -> nạp dữ liệu -> render ----------
function khoiDong() {
  // Trạng thái LOADING cho danh sách danh mục
  $('#danh-muc-list').innerHTML = '<div class="skeleton" style="height:56px"></div><div class="skeleton" style="height:56px"></div>';
  setTimeout(() => {
    napDuLieu();     // Nếu hỏng dữ liệu -> tự khôi phục mặc định + toast lỗi
    dienCauHinh();   // Đổ cấu hình vào form
    renderDanhMuc(); // Vẽ danh sách danh mục
  }, 600);
}
khoiDong();

