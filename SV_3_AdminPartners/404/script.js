/* =====================================================
   TRANG LỖI 404 - TripWeave AI
   - Hiện đường dẫn bị lỗi (lấy từ location.pathname).
   - Nút "Về trang Đăng nhập" là thẻ <a> nên chạy
     được cả khi JavaScript bị tắt.
   - Nút "Quay lại trang trước": nếu không có lịch sử
     (mở file trực tiếp) thì tự chuyển về trang đăng nhập.
   - Nút "Sao chép đường dẫn lỗi": dùng Clipboard API, có
     phương án dự phòng cho trình duyệt cũ / giao thức file://.
   - Phím tắt: L (đăng nhập) / R (đăng ký) / B (quay lại).
   ===================================================== */

const $ = (s) => document.querySelector(s);

// ---------- TOAST: thông báo dạng pop-up nhẹ nhàng (giống các trang khác) ----------
function toast(thongDiep, loai = 'success') {
  const hop = document.createElement('div');
  hop.className = 'toast ' + loai;
  hop.textContent = thongDiep;
  $('#toast-box').appendChild(hop);
  setTimeout(() => hop.remove(), 3000);
}

// ---------- 1) HIỆN ĐƯỜNG DẪN ĐANG BỊ LỖI ----------
// Giúp người dùng (và bộ phận hỗ trợ) biết chính xác địa chỉ nào sai.
function hienDuongDanLoi() {
  const o = $('#duong-dan');
  if (!o) return;
  let duongDan = '';
  try {
    // decodeURIComponent: đọc được tên thư mục có dấu tiếng Việt
    duongDan = decodeURIComponent(window.location.pathname || '');
  } catch (err) {
    duongDan = window.location.pathname || '';
  }
  // Lấy 2 cấp cuối cho gọn (ví dụ: /Test 6/abc/index.html -> abc/index.html)
  const cacCap = duongDan.split('/').filter(Boolean);
  o.textContent = cacCap.length > 2 ? '…/' + cacCap.slice(-2).join('/') : (duongDan || 'không xác định');
  o.title = duongDan; // rê chuột sẽ thấy đường dẫn đầy đủ
}

// ---------- 2) NÚT "QUAY LẠI TRANG TRƯỚC" ----------
function quayLai() {
  // history.length > 1 nghĩa là CÓ trang trước đó để quay về
  if (window.history.length > 1) {
    window.history.back();
  } else {
    // Mở file trực tiếp (không có lịch sử) -> đưa về trang đăng nhập
    toast('Không có trang trước đó — chuyển bạn về trang đăng nhập.', 'info');
    setTimeout(() => { window.location.href = '../login/index.html'; }, 900);
  }
}

// ---------- 3) SAO CHÉP ĐƯỜNG DẪN LỖI (gửi cho bộ phận hỗ trợ) ----------
async function saoChepDuongDan() {
  const duongDan = window.location.href;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(duongDan);
    } else {
      // Phương án dự phòng: tạo ô nhập tạm rồi dùng lệnh copy
      const tam = document.createElement('textarea');
      tam.value = duongDan;
      tam.style.position = 'fixed';
      tam.style.opacity = '0';
      document.body.appendChild(tam);
      tam.select();
      document.execCommand('copy');
      tam.remove();
    }
    toast('Đã sao chép đường dẫn lỗi vào bộ nhớ tạm.', 'success');
  } catch (err) {
    toast('Trình duyệt chặn sao chép. Đường dẫn: ' + duongDan, 'error');
  }
}

// ---------- 4) GẮN SỰ KIỆN ----------
document.addEventListener('DOMContentLoaded', () => {
  hienDuongDanLoi();

  const btnQuayLai = $('#btn-quay-lai');
  if (btnQuayLai) btnQuayLai.addEventListener('click', quayLai);

  const btnSaoChep = $('#btn-sao-chep');
  if (btnSaoChep) btnSaoChep.addEventListener('click', saoChepDuongDan);

  // Phím tắt: L = đăng nhập, R = đăng ký, B = quay lại trang trước
  document.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;      // bỏ qua tổ hợp phím
    const phim = (e.key || '').toLowerCase();
    if (phim === 'l') { window.location.href = '../login/index.html'; }
    if (phim === 'r') { window.location.href = '../login/index.html#dang-ky'; }
    if (phim === 'b') { quayLai(); }
  });
});
