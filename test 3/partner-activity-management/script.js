/* ============================================================
   TripWeave AI · Màn hình: Quản lý trải nghiệm (Đối tác địa phương)
   script.js — Vanilla JS thuần: state, render, CRUD giả lập, AI mô phỏng
   ============================================================ */
'use strict';

/* ---------- 1. DỮ LIỆU GIẢ LẬP (MOCK DATA) ---------- */
// Trạng thái hoạt động của một trải nghiệm
const STATUS = {
  active:   { label: 'Đang hoạt động',   cls: 'badge--success' },
  paused:   { label: 'Tạm ngưng',        cls: 'badge--warning' },
  disabled: { label: 'Đã vô hiệu hóa',   cls: 'badge--muted'   }
};

// Danh sách trải nghiệm ban đầu (load = % tải đặt chỗ khung cao điểm)
let experiences = [
  { id: 1, name: 'Làng cổ Đường Lâm',  category: 'Làng cổ',    price: 350000,  capacity: 30, slots: 6, load: 62, status: 'active', location: 'Sơn Tây, Hà Nội',        days: 'Thứ 2 – Chủ nhật', time: '08:00 – 17:00', desc: 'Dạo làng cổ, tìm hiểu kiến trúc nhà cổ và ẩm thực quê.' },
  { id: 2, name: 'Du thuyền Hạ Long',  category: 'Du thuyền',  price: 1200000, capacity: 20, slots: 4, load: 96, status: 'active', location: 'Vịnh Hạ Long, Quảng Ninh', days: 'Thứ 2 – Chủ nhật', time: '08:00 – 18:00', desc: 'Trải nghiệm ngắm cảnh và dùng bữa trên du thuyền.' },
  { id: 3, name: 'Homestay Sapa',      category: 'Homestay',   price: 650000,  capacity: 12, slots: 3, load: 48, status: 'paused', location: 'Sa Pa, Lào Cai',           days: 'Thứ 6 – Chủ nhật', time: '14:00 – 22:00', desc: 'Lưu trú bản địa, ngắm ruộng bậc thang mùa lúa chín.' },
  { id: 4, name: 'Tour đảo Cát Bà',    category: 'Tour đảo',   price: 890000,  capacity: 25, slots: 5, load: 71, status: 'active', location: 'Cát Bà, Hải Phòng',        days: 'Thứ 3 – Chủ nhật', time: '07:30 – 16:30', desc: 'Canoe qua các đảo nhỏ, lặn ngắm san hô và tắm biển.' },
  { id: 5, name: 'Resort Ninh Vân Bay',category: 'Nghỉ dưỡng', price: 2500000, capacity: 8,  slots: 2, load: 55, status: 'active', location: 'Nha Trang, Khánh Hòa',     days: 'Hằng ngày',          time: '06:00 – 22:00', desc: 'Nghỉ dưỡng biệt thự ven vịnh, spa và ẩm thực cao cấp.' }
];
let nextId = 6; // ID tự tăng cho bản ghi mới

/* ---------- 2. TRẠNG THÁI GIAO DIỆN (UI STATE) ---------- */
const state = {
  search: '',          // Từ khóa tìm kiếm trong trang
  status: 'all',       // Lọc theo trạng thái
  category: 'all',     // Lọc theo loại
  editingId: null,     // ID đang sửa (null = thêm mới)
  managingId: null,    // ID đang mở modal quản lý
  ai: {                // Trạng thái của trợ lý AI
    editing: false,    // Đang ở chế độ chỉnh sửa đề xuất?
    suggestions: [],   // Danh sách đề xuất hiện tại
    reasons: []        // Danh sách lý do giải thích
  }
};

/* ---------- 3. TIỆN ÍCH (UTILS) ---------- */
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// Escape ký tự HTML để chống vỡ markup khi render dữ liệu người dùng nhập
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
// Bỏ dấu tiếng Việt + lowercase để tìm kiếm không phân biệt dấu
function removeDiacritics(str) {
  return String(str).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
}
// Format tiền tệ kiểu Việt Nam: 1200000 -> "1.200.000đ"
function formatMoney(n) {
  return new Intl.NumberFormat('vi-VN').format(n) + 'đ';
}
// Giới hạn giá trị trong khoảng [min, max]
function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
/* ---------- 4. TOAST (THÔNG BÁO THÀNH CÔNG / LỖI) ---------- */
const TOAST_META = {
  success: { title: 'Thành công', color: 'var(--green)',  icon: '✓' },
  error:   { title: 'Lỗi',        color: 'var(--red)',    icon: '!' },
  warning: { title: 'Cảnh báo',   color: 'var(--orange)', icon: '!' },
  info:    { title: 'Thông báo',  color: 'var(--blue)',   icon: 'i' }
};
// Hiển thị toast ở góc phải màn hình, tự ẩn sau 3.8 giây
function showToast(type, message) {
  const meta = TOAST_META[type] || TOAST_META.info;
  const stack = $('#toastStack');
  const el = document.createElement('div');
  el.className = 'toast toast--' + type;
  el.innerHTML =
    '<span class="toast__icon" style="background:' + meta.color + '">' + meta.icon + '</span>' +
    '<div class="toast__content">' +
      '<p class="toast__title">' + meta.title + '</p>' +
      '<p class="toast__msg">' + escapeHtml(message) + '</p>' +
    '</div>' +
    '<button class="toast__close" aria-label="Đóng thông báo">✕</button>';
  stack.appendChild(el);
  el.querySelector('.toast__close').addEventListener('click', () => dismissToast(el));
  setTimeout(() => dismissToast(el), 3800);
}
function dismissToast(el) {
  if (!el || el.classList.contains('toast--leave')) return;
  el.classList.add('toast--leave');
  setTimeout(() => el.remove(), 250);
}

/* ---------- 5. MODAL (MỞ / ĐÓNG / XÁC NHẬN) ---------- */
function openModal(id) {
  $('#' + id).classList.add('is-open');
  $('#' + id).setAttribute('aria-hidden', 'false');
  document.body.classList.add('no-scroll');
}
function closeModal(id) {
  $('#' + id).classList.remove('is-open');
  $('#' + id).setAttribute('aria-hidden', 'true');
  // Chỉ mở lại cuộn trang khi không còn modal nào đang mở
  if (!document.querySelector('.modal.is-open')) document.body.classList.remove('no-scroll');
}
// Modal xác nhận dùng chung cho các thao tác nguy hiểm (xóa, vô hiệu hóa)
let confirmCallback = null;
function openConfirm(opts) {
  $('#confirmTitle').textContent = opts.title;
  $('#confirmMessage').textContent = opts.message;
  const okBtn = $('#confirmOk');
  okBtn.textContent = opts.confirmText || 'Xác nhận';
  okBtn.className = 'btn ' + (opts.danger === false ? 'btn--primary' : 'btn--danger');
  confirmCallback = opts.onConfirm;
  openModal('modalConfirm');
}

/* ---------- 6. CHUYỂN VIEW (DANH SÁCH / FORM) ---------- */
function showView(name) {
  $('#viewList').classList.toggle('hidden', name !== 'list');
  $('#viewForm').classList.toggle('hidden', name !== 'form');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
/* ---------- 7. RENDER DANH SÁCH (NORMAL / SKELETON / EMPTY) ---------- */
// Lấy danh sách đã áp dụng tìm kiếm + bộ lọc
function getFiltered() {
  const kw = removeDiacritics(state.search.trim());
  return experiences.filter(e => {
    const matchSearch = !kw ||
      removeDiacritics(e.name).includes(kw) ||
      removeDiacritics(e.category).includes(kw) ||
      removeDiacritics(e.location).includes(kw);
    const matchStatus = state.status === 'all' || e.status === state.status;
    const matchCategory = state.category === 'all' || e.category === state.category;
    return matchSearch && matchStatus && matchCategory;
  });
}
// Trạng thái Loading: hiển thị các khung skeleton nhấp nháy
function renderSkeleton(count = 3) {
  $('#emptyState').classList.add('hidden');
  $('#listCount').textContent = '';
  let html = '';
  for (let i = 0; i < count; i++) {
    html +=
      '<div class="row card skeleton-row">' +
        '<div class="skeleton sk-thumb"></div>' +
        '<div class="skeleton__lines"><div class="skeleton sk-line w60"></div><div class="skeleton sk-line w40"></div></div>' +
        '<div class="skeleton sk-badge"></div>' +
        '<div class="skeleton sk-btn"></div>' +
        '<div class="skeleton sk-btn"></div>' +
      '</div>';
  }
  $('#listContainer').innerHTML = html;
}
// Trạng thái rỗng: phân biệt "chưa có dữ liệu" và "không có kết quả lọc"
function renderEmpty(mode) {
  $('#listContainer').innerHTML = '';
  $('#listCount').textContent = '';
  const empty = $('#emptyState');
  empty.classList.remove('hidden');
  if (mode === 'no-data') {
    $('#emptyTitle').textContent = 'Chưa có trải nghiệm nào';
    $('#emptyDesc').textContent = 'Hãy thêm trải nghiệm đầu tiên để bắt đầu nhận đơn đặt từ khách hàng.';
    $('#emptyClear').classList.add('hidden');
  } else {
    $('#emptyTitle').textContent = 'Không tìm thấy trải nghiệm phù hợp';
    $('#emptyDesc').textContent = 'Thử thay đổi từ khóa tìm kiếm hoặc xóa bộ lọc đang áp dụng.';
    $('#emptyClear').classList.remove('hidden');
  }
}
// Trạng thái Normal: render thẻ dữ liệu dạng hàng (giống mockup)
function renderList() {
  const empty = $('#emptyState');
  if (experiences.length === 0) { renderEmpty('no-data'); return; }
  const items = getFiltered();
  if (items.length === 0) { renderEmpty('no-result'); return; }
  empty.classList.add('hidden');
  $('#listCount').textContent = 'Hiển thị ' + items.length + '/' + experiences.length + ' trải nghiệm';
  $('#listContainer').innerHTML = items.map(e => {
    const st = STATUS[e.status];
    return (
      '<article class="row card" data-id="' + e.id + '">' +
        '<div class="row__thumb">' + escapeHtml(e.category) + '</div>' +
        '<div class="row__info">' +
          '<h3>' + escapeHtml(e.name) + '</h3>' +
          '<p class="row__meta">' + escapeHtml(e.location) + ' • Sức chứa ' + e.capacity + ' người • ' + formatMoney(e.price) + '/người • ' + e.slots + ' slot/ngày</p>' +
        '</div>' +
        '<span class="badge ' + st.cls + '">' + st.label + '</span>' +
        '<div class="row__actions">' +
          '<button class="btn btn--secondary" data-action="edit" data-id="' + e.id + '">Sửa</button>' +
          '<button class="btn btn--primary" data-action="manage" data-id="' + e.id + '">Quản lý</button>' +
        '</div>' +
      '</article>'
    );
  }).join('');
}
// Giả lập gọi API: hiện skeleton một lát rồi render dữ liệu thật
function triggerReload(delay = 350) {
  renderSkeleton();
  setTimeout(renderList, delay);
}
/* ---------- 8. TÌM KIẾM & BỘ LỌC ---------- */
// Tiện ích debounce: chờ người dùng gõ xong mới xử lý
function debounce(fn, wait) {
  let t = null;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}
// Ô tìm kiếm trong trang: debounce 250ms rồi reload kèm skeleton
$('#searchInput').addEventListener('input', debounce(function (e) {
  state.search = e.target.value;
  triggerReload(300);
}, 250));
// Chip lọc theo trạng thái / loại (event delegation)
$('#filters').addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  const group = chip.parentElement.dataset.group; // 'status' | 'category'
  chip.parentElement.querySelectorAll('.chip').forEach(c => c.classList.remove('is-active'));
  chip.classList.add('is-active');
  state[group] = chip.dataset.value;
  triggerReload(250);
});
// Nút "Xóa bộ lọc" trong Empty State
$('#emptyClear').addEventListener('click', () => {
  state.search = ''; state.status = 'all'; state.category = 'all';
  $('#searchInput').value = '';
  $$('.chips').forEach(gr => {
    gr.querySelectorAll('.chip').forEach(c => c.classList.toggle('is-active', c.dataset.value === 'all'));
  });
  triggerReload(250);
});
// Nút "Thêm trải nghiệm" trong Empty State
$('#emptyAdd').addEventListener('click', () => openForm('add'));

/* ---------- 9. FORM THÊM / SỬA + VALIDATE ---------- */
// Mở view form: mode 'add' (thêm mới) hoặc 'edit' (sửa theo id)
function openForm(mode, id = null) {
  state.editingId = mode === 'edit' ? id : null;
  $('#formTitle').textContent = mode === 'edit' ? 'Thông tin trải nghiệm' : 'Thêm trải nghiệm mới';
  clearFormErrors();
  if (mode === 'edit') {
    const e = experiences.find(x => x.id === id);
    if (!e) { showToast('error', 'Không tìm thấy trải nghiệm để chỉnh sửa.'); return; }
    $('#fName').value = e.name;
    $('#fCategory').value = e.category;
    $('#fPrice').value = e.price;
    $('#fCapacity').value = e.capacity;
    $('#fDesc').value = e.desc || '';
    $('#fDays').value = e.days || '';
    $('#fTime').value = e.time || '';
  } else {
    $('#expForm').reset();
  }
  showView('form');
}
// Xóa toàn bộ thông báo lỗi cũ trên form
function clearFormErrors() {
  $$('.field-error').forEach(el => (el.textContent = ''));
  $$('#expForm .input').forEach(el => el.classList.remove('input--error'));
}
// Đánh dấu một trường lỗi (viền đỏ + thông báo bên dưới)
function setFieldError(inputId, errId, msg) {
  $('#' + inputId).classList.add('input--error');
  $('#' + errId).textContent = msg;
}
// Đọc dữ liệu người dùng nhập trong form
function readForm() {
  return {
    name: $('#fName').value.trim(),
    category: $('#fCategory').value,
    priceRaw: $('#fPrice').value.trim(),
    price: parseInt($('#fPrice').value.replace(/[^\d]/g, ''), 10),
    capacityRaw: $('#fCapacity').value.trim(),
    capacity: parseInt($('#fCapacity').value, 10),
    desc: $('#fDesc').value.trim(),
    days: $('#fDays').value.trim() || 'Đang cập nhật',
    time: $('#fTime').value.trim()
  };
}
// Validate toàn bộ form: trả về true khi hợp lệ
function validateForm(data) {
  clearFormErrors();
  let ok = true;
  if (!data.name) {
    setFieldError('fName', 'errName', 'Vui lòng nhập tên trải nghiệm.'); ok = false;
  } else if (experiences.some(e => e.id !== state.editingId && removeDiacritics(e.name) === removeDiacritics(data.name))) {
    setFieldError('fName', 'errName', 'Tên trải nghiệm đã tồn tại.'); ok = false;
  }
  if (!data.category) { setFieldError('fCategory', 'errCategory', 'Vui lòng chọn loại trải nghiệm.'); ok = false; }
  if (!data.priceRaw) { setFieldError('fPrice', 'errPrice', 'Vui lòng nhập giá.'); ok = false; }
  else if (isNaN(data.price) || data.price <= 0) { setFieldError('fPrice', 'errPrice', 'Giá phải là số dương (đ/người).'); ok = false; }
  if (!data.capacityRaw) { setFieldError('fCapacity', 'errCapacity', 'Vui lòng nhập sức chứa.'); ok = false; }
  else if (isNaN(data.capacity) || data.capacity <= 0) { setFieldError('fCapacity', 'errCapacity', 'Sức chứa phải là số nguyên dương.'); ok = false; }
  if (data.desc.length > 300) { setFieldError('fDesc', 'errDesc', 'Mô tả tối đa 300 ký tự.'); ok = false; }
  const TIME_RE = /^\d{1,2}:\d{2}\s*[-–—]\s*\d{1,2}:\d{2}$/;
  if (data.time && !TIME_RE.test(data.time)) { setFieldError('fTime', 'errTime', 'Khung giờ không hợp lệ (VD: 08:00 – 18:00).'); ok = false; }
  return ok;
}
/* ---------- 10. SUBMIT FORM + WIRING CÁC NÚT ---------- */
// Submit form: validate → spinner trên nút → lưu dữ liệu → toast
$('#expForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const data = readForm();
  if (!validateForm(data)) {
    showToast('error', 'Form có trường bị lỗi, vui lòng kiểm tra lại.');
    const firstErr = document.querySelector('.input--error');
    if (firstErr) firstErr.focus();
    return;
  }
  const btn = $('#btnSubmitForm');
  btn.classList.add('is-loading');
  setTimeout(() => { // Giả lập gọi mạng 0.7 giây
    btn.classList.remove('is-loading');
    if (state.editingId) {
      // UPDATE: cập nhật bản ghi đang sửa
      const exp = experiences.find(x => x.id === state.editingId);
      Object.assign(exp, { name: data.name, category: data.category, price: data.price, capacity: data.capacity, desc: data.desc, days: data.days, time: data.time });
      showToast('success', 'Cập nhật "' + data.name + '" thành công.');
    } else {
      // CREATE: thêm bản ghi mới lên đầu danh sách
      experiences.unshift({
        id: nextId++, name: data.name, category: data.category, price: data.price,
        capacity: data.capacity, slots: 3, load: 40 + Math.floor(Math.random() * 30),
        status: 'active', location: 'Đang cập nhật', days: data.days, time: data.time, desc: data.desc
      });
      showToast('success', 'Đã thêm trải nghiệm mới "' + data.name + '".');
    }
    showView('list');
    buildAiChecks();
    triggerReload(400);
  }, 700);
});
// Hủy / quay lại danh sách / thêm mới
$('#btnBack').addEventListener('click', () => showView('list'));
$('#btnCancelForm').addEventListener('click', () => showView('list'));
$('#btnAdd').addEventListener('click', () => openForm('add'));
// Nút "Sửa" / "Quản lý" trên từng hàng (event delegation)
$('#listContainer').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const id = Number(btn.dataset.id);
  if (btn.dataset.action === 'edit') openForm('edit', id);
  if (btn.dataset.action === 'manage') openManage(id);
});

/* ---------- 11. MODAL QUẢN LÝ TRẢI NGHIỆM ---------- */
function openManage(id) {
  const exp = experiences.find(x => x.id === id);
  if (!exp) { showToast('error', 'Không tìm thấy trải nghiệm.'); return; }
  state.managingId = id;
  renderManageBody(exp);
  openModal('modalManage');
}
// Dựng nội dung modal quản lý theo dữ liệu hiện tại của trải nghiệm
function renderManageBody(exp) {
  const st = STATUS[exp.status];
  const loadCls = exp.load < 60 ? 'low' : exp.load < 85 ? 'mid' : 'high';
  $('#manageBody').innerHTML =
    '<div class="manage__block manage__row">' +
      '<div><span class="manage__label">Trạng thái hiện tại</span><span class="badge ' + st.cls + '">' + st.label + '</span></div>' +
      (exp.status === 'active'
        ? '<button class="btn btn--warning" data-maction="toggle">Tạm ngưng hoạt động</button>'
        : '<button class="btn btn--success" data-maction="toggle">Kích hoạt lại</button>') +
    '</div>' +
    '<div class="manage__block">' +
      '<span class="manage__label">Thông tin nhanh</span>' +
      '<p class="manage__meta"><b>Loại:</b> ' + escapeHtml(exp.category) + ' · <b>Vị trí:</b> ' + escapeHtml(exp.location) + '<br/>' +
      '<b>Giá:</b> ' + formatMoney(exp.price) + '/người · <b>Ngày hoạt động:</b> ' + escapeHtml(exp.days) + ' · <b>Khung giờ:</b> ' + escapeHtml(exp.time || 'Đang cập nhật') + '</p>' +
    '</div>' +
    '<div class="manage__block">' +
      '<span class="manage__label">Tải đặt chỗ khung cao điểm</span>' +
      '<div class="progress"><div class="progress__bar progress__bar--' + loadCls + '" style="width:' + exp.load + '%"></div></div>' +
      '<p class="manage__loadtext">' + exp.load + '% công suất đang được đặt</p>' +
    '</div>' +
    '<div class="manage__block">' +
      '<span class="manage__label">Cập nhật sức chứa & slot</span>' +
      '<div class="manage__grid">' +
        '<div class="field"><label class="field-label" for="mCapacity">Sức chứa (người)</label><input class="input" id="mCapacity" type="number" min="1" value="' + exp.capacity + '" /></div>' +
        '<div class="field"><label class="field-label" for="mSlots">Slot/ngày</label><input class="input" id="mSlots" type="number" min="1" value="' + exp.slots + '" /></div>' +
        '<button class="btn btn--secondary" data-maction="saveCaps">Lưu thay đổi</button>' +
      '</div>' +
    '</div>' +
    '<div class="manage__danger">' +
      '<h4>Vùng nguy hiểm</h4>' +
      (exp.status !== 'disabled'
        ? '<button class="btn btn--danger" data-maction="disable">Vô hiệu hóa trải nghiệm</button>'
        : '<p class="manage__loadtext">Trải nghiệm này đang bị vô hiệu hóa — khách không thể đặt chỗ.</p>') +
      '<button class="btn btn--danger-ghost" data-maction="delete">Xóa vĩnh viễn</button>' +
    '</div>';
}
// Xử lý các thao tác bên trong modal quản lý (event delegation)
$('#manageBody').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-maction]');
  if (!btn) return;
  const exp = experiences.find(x => x.id === state.managingId);
  if (!exp) return;
  const action = btn.dataset.maction;
  if (action === 'toggle') {
    // UPDATE: đổi trạng thái hoạt động <-> tạm ngưng / kích hoạt lại
    exp.status = exp.status === 'active' ? 'paused' : 'active';
    renderManageBody(exp); renderList(); buildAiChecks();
    if (exp.status === 'active') showToast('success', 'Đã kích hoạt lại "' + exp.name + '".');
    else showToast('warning', 'Đã tạm ngưng "' + exp.name + '".');
  } else if (action === 'saveCaps') {
    // UPDATE: lưu sức chứa & slot mới (có validate)
    const cap = parseInt($('#mCapacity').value, 10);
    const slots = parseInt($('#mSlots').value, 10);
    if (isNaN(cap) || cap <= 0 || isNaN(slots) || slots <= 0) {
      showToast('error', 'Sức chứa và slot phải là số nguyên dương.');
      return;
    }
    exp.capacity = cap; exp.slots = slots;
    renderManageBody(exp); renderList(); buildAiChecks();
    showToast('success', 'Đã cập nhật sức chứa & slot cho "' + exp.name + '".');
  } else if (action === 'disable') {
    // UPDATE: vô hiệu hóa (cần xác nhận)
    openConfirm({
      title: 'Vô hiệu hóa trải nghiệm',
      message: 'Vô hiệu hóa "' + exp.name + '"? Khách sẽ không thể đặt trải nghiệm này đến khi bạn kích hoạt lại.',
      confirmText: 'Vô hiệu hóa',
      onConfirm: () => {
        exp.status = 'disabled';
        closeModal('modalConfirm');
        renderManageBody(exp); renderList(); buildAiChecks();
        showToast('warning', 'Đã vô hiệu hóa "' + exp.name + '".');
      }
    });
  } else if (action === 'delete') {
    // DELETE: xóa vĩnh viễn (cần xác nhận)
    openConfirm({
      title: 'Xóa vĩnh viễn',
      message: 'Xóa hoàn toàn "' + exp.name + '" khỏi danh sách? Thao tác này không thể hoàn tác.',
      confirmText: 'Xóa vĩnh viễn',
      onConfirm: () => {
        experiences = experiences.filter(x => x.id !== exp.id);
        closeModal('modalConfirm'); closeModal('modalManage');
        triggerReload(300); buildAiChecks();
        showToast('success', 'Đã xóa vĩnh viễn "' + exp.name + '".');
      }
    });
  }
});

/* ---------- 12. WIRING MODAL XÁC NHẬN & PHÍM TẮT ---------- */
$('#confirmOk').addEventListener('click', () => {
  if (typeof confirmCallback === 'function') confirmCallback();
  confirmCallback = null;
});
$('#confirmCancel').addEventListener('click', () => { confirmCallback = null; closeModal('modalConfirm'); });
// Đóng modal bằng nút ✕ hoặc click nền mờ
$$('[data-close]').forEach(el => el.addEventListener('click', () => {
  if (el.dataset.close === 'modalConfirm') confirmCallback = null;
  closeModal(el.dataset.close);
}));
// Phím ESC: đóng modal đang mở / đóng sidebar mobile
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if ($('#modalConfirm').classList.contains('is-open')) { confirmCallback = null; closeModal('modalConfirm'); }
  else if ($('#modalManage').classList.contains('is-open')) closeModal('modalManage');
  closeSidebar();
});
/* ---------- 13. AI ROUTE BALANCE ASSISTANT (MÔ PHỎNG) ---------- */
// Bước 1 — Dựng danh sách checkbox chọn dữ liệu đầu vào (chỉ trải nghiệm đang hoạt động)
function buildAiChecks() {
  const active = experiences.filter(e => e.status === 'active');
  const box = $('#aiChecks');
  if (active.length === 0) {
    box.innerHTML = '<p class="ai-note">Không có trải nghiệm đang hoạt động để phân tích.</p>';
    $('#aiRun').disabled = true;
    return;
  }
  $('#aiRun').disabled = false;
  box.innerHTML = active.map(e =>
    '<label class="ai-check"><input type="checkbox" value="' + e.id + '" checked />' +
    escapeHtml(e.name) + ' <span class="ai-load">(' + e.load + '% tải)</span></label>'
  ).join('');
}
// Logic "suy luận" (giả lập): sinh đề xuất + lý do giải thích từ dữ liệu được chọn
function computeSuggestions(ids, period) {
  const sel = ids.map(id => experiences.find(e => e.id === Number(id))).filter(e => e && e.status === 'active');
  const suggestions = [];
  const reasons = [];
  if (sel.length >= 2) {
    const sorted = [...sel].sort((a, b) => b.load - a.load);
    const from = sorted[0], to = sorted[sorted.length - 1];
    if (from.load - to.load >= 20) {
      // Chênh lệch tải lớn: chuyển slot từ tuyến quá tải sang tuyến còn trống
      const slots = Math.max(1, Math.round(from.slots * 0.25));
      suggestions.push({ type: 'move', from: from.id, to: to.id, slots: slots });
      reasons.push('"' + from.name + '" đang quá tải — ' + from.load + '% tải khung ' + period + ', có nguy cơ hủy chỗ và giảm chất lượng trải nghiệm.');
      reasons.push('"' + to.name + '" mới đạt ' + to.load + '% tải — còn dư sức chứa để đón thêm khách.');
      reasons.push('Dữ liệu đặt chỗ lịch sử (mô phỏng): 68% khách chấp nhận chuyển sang tuyến tương đương cùng khung giờ.');
      reasons.push('Cân bằng slot giúp giảm khoảng 15% nguy cơ hủy chuyến và tăng mức độ hài lòng tổng thể.');
    } else {
      // Tải đã cân bằng: đề xuất giá động cho tuyến đông khách nhất
      const avg = Math.round(sel.reduce((s, e) => s + e.load, 0) / sel.length);
      suggestions.push({ type: 'price', target: from.id, percent: 5 });
      reasons.push('Tải trung bình các tuyến đã chọn là ' + avg + '% — ở mức khỏe mạnh, không cần chuyển slot.');
      reasons.push('Khung ' + period + ' của "' + from.name + '" vẫn dư cầu khoảng 8% — có thể tối ưu bằng giá động.');
      reasons.push('Mô hình dự báo doanh thu (mô phỏng) cho thấy tăng giá 5% không làm giảm tỷ lệ chuyển đổi đặt chỗ.');
    }
  } else if (sel.length === 1) {
    const e = sel[0];
    if (e.load >= 85) {
      suggestions.push({ type: 'price', target: e.id, percent: 8 });
      reasons.push('"' + e.name + '" đạt ' + e.load + '% tải — nên giãn cầu bằng giá động trong khung ' + period + '.');
      reasons.push('Giá động +8% được dự báo vẫn giữ tỷ lệ lấp đầy trên 90% (mô phỏng).');
    } else {
      suggestions.push({ type: 'boost', target: e.id, slots: Math.max(1, Math.round(e.slots * 0.3)) });
      reasons.push('"' + e.name + '" mới đạt ' + e.load + '% tải — còn nhiều dư địa tăng trưởng.');
      reasons.push('Bổ sung slot quảng bá giúp tăng hiển thị trong kết quả gợi ý của AI Itinerary.');
    }
  } else {
    reasons.push('Không có đủ dữ liệu trải nghiệm đang hoạt động để phân tích.');
  }
  return { suggestions: suggestions, reasons: reasons };
}
// Bước 3 — Hiển thị đề xuất (chế độ thường hoặc chế độ chỉnh sửa với ô nhập số)
function renderSuggestions() {
  const period = $('#aiPeriod').value;
  $('#aiSuggestions').innerHTML = state.ai.suggestions.map((s, i) => {
    const slotVal = state.ai.editing
      ? '<input class="ai-input" type="number" min="1" data-idx="' + i + '" data-field="slots" value="' + s.slots + '" /> slots/ngày'
      : '<b>' + s.slots + ' slots/ngày</b>';
    const pctVal = state.ai.editing
      ? '<input class="ai-input" type="number" min="1" max="30" data-idx="' + i + '" data-field="percent" value="' + s.percent + '" /> %'
      : '<b>' + s.percent + '%</b>';
    if (s.type === 'move') {
      const from = experiences.find(e => e.id === s.from);
      const to = experiences.find(e => e.id === s.to);
      return '<div class="ai-sug"><span class="ai-sug__icon">⇄</span><p>Chuyển ' + slotVal +
        ' từ "' + escapeHtml(from.name) + '" sang "' + escapeHtml(to.name) +
        '". Tải dự kiến: ' + from.load + '% → ' + clamp(from.load - s.slots * 5, 5, 99) +
        '% và ' + to.load + '% → ' + clamp(to.load + s.slots * 4, 5, 99) + '%.</p></div>';
    }
    const t = experiences.find(e => e.id === s.target);
    if (s.type === 'price') {
      return '<div class="ai-sug"><span class="ai-sug__icon">₫</span><p>Tăng giá động ' + pctVal +
        ' cho "' + escapeHtml(t.name) + '" vào khung ' + period + ' để giãn cầu giờ cao điểm.</p></div>';
    }
    // type === 'boost'
    return '<div class="ai-sug"><span class="ai-sug__icon">↑</span><p>Thêm ' + slotVal +
      ' quảng bá ngoài giờ cao điểm cho "' + escapeHtml(t.name) + '" để tăng hiển thị.</p></div>';
  }).join('');
}
// Bước 3 — Hiển thị danh sách lý do giải thích đề xuất
function renderReasons() {
  $('#aiReasons').innerHTML = state.ai.reasons.map(r => '<li>' + escapeHtml(r) + '</li>').join('');
}
// Nút "Chạy phân tích": validate đầu vào → trạng thái thinking → kết quả
$('#aiRun').addEventListener('click', () => {
  const ids = [...$$('#aiChecks input:checked')].map(cb => cb.value);
  if (ids.length === 0) {
    showToast('error', 'Vui lòng chọn ít nhất 1 trải nghiệm để phân tích.');
    return;
  }
  const period = $('#aiPeriod').value;
  // Ẩn bước 1, hiện bước 2 (đang phân tích)
  $('#aiStepInput').classList.add('hidden');
  $('#aiStepResult').classList.add('hidden');
  $('#aiStepThinking').classList.remove('hidden');
  // Dòng chữ thay đổi lần lượt tạo cảm giác AI đang "suy nghĩ"
  const texts = ['Đang thu thập dữ liệu đặt chỗ...', 'Đang phân tích tải theo khung giờ...', 'Đang so sánh sức chứa giữa các tuyến...', 'Đang sinh đề xuất cân bằng...'];
  let step = 0;
  $('#aiThinkingText').textContent = texts[0];
  const timer = setInterval(() => {
    step = (step + 1) % texts.length;
    $('#aiThinkingText').textContent = texts[step];
  }, 650);
  // Sau ~2.6 giây thì trả kết quả (mô phỏng thời gian xử lý của AI)
  setTimeout(() => {
    clearInterval(timer);
    $('#aiStepThinking').classList.add('hidden');
    const result = computeSuggestions(ids, period);
    state.ai.suggestions = result.suggestions;
    state.ai.reasons = result.reasons;
    state.ai.editing = false;
    $('#aiAccept').textContent = 'Chấp nhận';
    $('#aiEdit').textContent = 'Chỉnh sửa';
    if (result.suggestions.length === 0) {
      // Không có gì để cân bằng → ẩn nút Chấp nhận / Chỉnh sửa
      $('#aiSuggestions').innerHTML = '<div class="ai-sug"><span class="ai-sug__icon">✓</span><p>Không cần điều chỉnh — các tuyến đã chọn đang cân bằng tốt.</p></div>';
      $('#aiAccept').classList.add('hidden');
      $('#aiEdit').classList.add('hidden');
    } else {
      renderSuggestions();
      $('#aiAccept').classList.remove('hidden');
      $('#aiEdit').classList.remove('hidden');
    }
    renderReasons();
    $('#aiStepResult').classList.remove('hidden');
    showToast('info', 'AI đã phân tích xong cân bằng tuyến.');
  }, 2600);
});
// Nút "Chỉnh sửa": bật/tắt chế độ nhập số trên các đề xuất
$('#aiEdit').addEventListener('click', () => {
  state.ai.editing = !state.ai.editing;
  $('#aiAccept').textContent = state.ai.editing ? 'Lưu & Áp dụng' : 'Chấp nhận';
  $('#aiEdit').textContent = state.ai.editing ? 'Hủy chỉnh sửa' : 'Chỉnh sửa';
  renderSuggestions();
});
// Nút "Chấp nhận" (hoặc "Lưu & Áp dụng" khi đang chỉnh sửa)
$('#aiAccept').addEventListener('click', () => {
  if (state.ai.editing && !readEditedSuggestions()) return; // validate số đã sửa
  applySuggestions();
  resetAi();
});
// Nút "Từ chối": hủy đề xuất và ghi nhận feedback (mô phỏng)
$('#aiReject').addEventListener('click', () => {
  resetAi();
  showToast('info', 'Đã từ chối đề xuất. Hệ thống ghi nhận phản hồi để cải thiện mô hình.');
});
// Đọc các giá trị người dùng đã sửa từ ô nhập (kèm validate)
function readEditedSuggestions() {
  let ok = true;
  $$('#aiSuggestions .ai-input').forEach(inp => {
    const idx = Number(inp.dataset.idx);
    const field = inp.dataset.field;
    const val = parseInt(inp.value, 10);
    if (isNaN(val) || val <= 0 || (field === 'percent' && val > 30)) ok = false;
    else state.ai.suggestions[idx][field] = val;
  });
  if (!ok) showToast('error', 'Giá trị chỉnh sửa phải là số nguyên dương (phần trăm ≤ 30).');
  return ok;
}
// Áp dụng đề xuất vào dữ liệu mô phỏng + toast kết quả từng hành động
function applySuggestions() {
  state.ai.suggestions.forEach(s => {
    if (s.type === 'move') {
      // UPDATE: chuyển slot giữa hai tuyến, cập nhật tải dự kiến
      const from = experiences.find(e => e.id === s.from);
      const to = experiences.find(e => e.id === s.to);
      from.slots = Math.max(1, from.slots - s.slots);
      to.slots += s.slots;
      from.load = clamp(from.load - s.slots * 5, 5, 99);
      to.load = clamp(to.load + s.slots * 4, 5, 99);
      showToast('success', 'Đã chuyển ' + s.slots + ' slots/ngày từ "' + from.name + '" sang "' + to.name + '".');
    } else if (s.type === 'price') {
      // UPDATE: tăng giá động (làm tròn đến nghìn đồng)
      const t = experiences.find(e => e.id === s.target);
      t.price = Math.round(t.price * (100 + s.percent) / 100 / 1000) * 1000;
      showToast('success', 'Đã áp dụng giá động +' + s.percent + '% cho "' + t.name + '".');
    } else if (s.type === 'boost') {
      // UPDATE: thêm slot quảng bá ngoài giờ cao điểm
      const t = experiences.find(e => e.id === s.target);
      t.slots += s.slots;
      t.load = clamp(t.load + s.slots * 2, 5, 99);
      showToast('success', 'Đã thêm ' + s.slots + ' slot quảng bá cho "' + t.name + '".');
    }
  });
  renderList();
  buildAiChecks();
}
// Reset card AI về bước 1 (chọn dữ liệu đầu vào)
function resetAi() {
  state.ai.editing = false;
  state.ai.suggestions = [];
  state.ai.reasons = [];
  $('#aiStepResult').classList.add('hidden');
  $('#aiStepThinking').classList.add('hidden');
  $('#aiStepInput').classList.remove('hidden');
  $('#aiAccept').textContent = 'Chấp nhận';
  $('#aiEdit').textContent = 'Chỉnh sửa';
}
// Nút Thu gọn / Mở rộng card AI
$('#aiToggle').addEventListener('click', () => {
  const collapsed = $('#aiBody').classList.toggle('hidden');
  $('#aiToggle').textContent = collapsed ? 'Mở rộng' : 'Thu gọn';
});
/* ---------- 14. SỰ KIỆN UI KHÁC ---------- */
// Mở / đóng sidebar trên tablet & mobile
function openSidebar() {
  $('#sidebar').classList.add('is-open');
  $('#sidebarOverlay').classList.add('is-visible');
}
function closeSidebar() {
  $('#sidebar').classList.remove('is-open');
  $('#sidebarOverlay').classList.remove('is-visible');
}
$('#btnMenu').addEventListener('click', openSidebar);
$('#sidebarOverlay').addEventListener('click', closeSidebar);
// Menu sidebar: các màn hình khác ngoài phạm vi demo → thông báo mô phỏng
$$('.sidebar__link').forEach(link => link.addEventListener('click', (e) => {
  e.preventDefault();
  closeSidebar();
  if (!link.classList.contains('is-active')) {
    showToast('info', 'Màn hình "' + link.dataset.screen + '" nằm ngoài phạm vi demo này (Role 3 — Trải nghiệm).');
  }
}));
// Hành động topbar (mô phỏng)
$('#btnBell').addEventListener('click', () =>
  showToast('info', 'Bạn có 3 thông báo mới: 2 đơn đặt chờ xác nhận, 1 đánh giá mới (mô phỏng).'));
$('#btnAvatar').addEventListener('click', () =>
  showToast('info', 'Đã đăng nhập với vai trò: Đối tác địa phương — Công ty Du lịch Hạ Long.'));
$('#brandLink').addEventListener('click', (e) => { e.preventDefault(); showView('list'); });
// Tìm kiếm toàn cục: nhấn Enter → toast mô phỏng
$('#globalSearch').addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  const kw = e.target.value.trim();
  showToast('info', kw ? 'Tìm kiếm toàn cục (mô phỏng): "' + kw + '".' : 'Vui lòng nhập từ khóa tìm kiếm.');
});

/* ---------- 15. KHỞI TẠO (INIT) ---------- */
buildAiChecks();                    // Dựng checkbox đầu vào cho AI
renderSkeleton();                   // Hiện trạng thái Loading khi vào trang
setTimeout(renderList, 900);        // Giả lập fetch dữ liệu ban đầu rồi render









