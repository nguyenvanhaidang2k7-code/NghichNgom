/* =====================================================================
   TRIPWEAVE AI - CSE122: XÂY HÀNH TRÌNH DU LỊCH THEO SỞ THÍCH
   Trang: QUẢN LÝ TRẢI NGHIỆM (vai trò Đối tác địa phương)
   ---------------------------------------------------------------------
   Tệp này chứa toàn bộ logic của trang:
     1. Dữ liệu mẫu + lưu trữ LocalStorage (khóa dùng chung vai trò đối tác)
     2. Render danh sách với các trạng thái: thường / loading / trống /
        không kết quả / lỗi
     3. CRUD Thêm - Sửa qua Modal, validation tiếng Việt chi tiết
     4. Modal "Quản lý": đổi trạng thái, lưu trữ, xóa (có xác nhận)
     5. Luồng AI mô phỏng: gợi ý mô tả -> loading -> kết quả -> giải thích
        lý do -> Chấp nhận / Sửa / Tạo lại / Từ chối
   ===================================================================== */
"use strict";

/* ==================== 1. HẰNG SỐ VÀ DỮ LIỆU MẪU ==================== */

// Khóa LocalStorage dùng chung cho các trang cùng vai trò (Đối tác địa phương)
// => đồng bộ dữ liệu: trang Đơn đặt, Doanh thu... (nhiệm vụ sau) đọc lại khóa này.
const STORAGE_KEY = "tripweave_partner_experiences_v1";

// Thông tin trạng thái: nhãn hiển thị + class badge màu tương ứng
const STATUS_META = {
  active:   { label: "Đang hoạt động", badge: "badge-active"   },
  paused:   { label: "Tạm ngưng",      badge: "badge-paused"   },
  archived: { label: "Đã lưu trữ",     badge: "badge-archived" },
};

// Dữ liệu mẫu bám theo mockup (chỉ được ghi vào LocalStorage ở lần truy cập đầu)
function getSeedData() {
  const now = Date.now();
  return [
    {
      id: "exp_seed_1",
      name: "Làng cổ Đường Lâm",
      type: "Làng cổ",
      price: 350000,
      capacity: 30,
      description: "Tham quan làng cổ Đường Lâm với kiến trúc nhà cổ hàng trăm năm tuổi, tìm hiểu nghề làm tương truyền thống và thưởng thức đặc sản địa phương.",
      days: "Thứ 2 – Chủ nhật",
      hours: "07:30 – 17:00",
      status: "active",
      createdAt: now - 86400000 * 12,
      updatedAt: now - 86400000 * 12,
    },
    {
      id: "exp_seed_2",
      name: "Du thuyền Hạ Long",
      type: "Du thuyền",
      price: 1200000,
      capacity: 20,
      description: "Trải nghiệm ngắm cảnh và dùng bữa trên du thuyền giữa vịnh Hạ Long - di sản thiên nhiên thế giới, kèm hướng dẫn viên suốt hành trình.",
      days: "Thứ 2 – Chủ nhật",
      hours: "08:00 – 18:00",
      status: "active",
      createdAt: now - 86400000 * 8,
      updatedAt: now - 86400000 * 3,
    },
    {
      id: "exp_seed_3",
      name: "Homestay Sapa",
      type: "Homestay",
      price: 650000,
      capacity: 12,
      description: "Nghỉ tại homestay bản Tả Van view ruộng bậc thang, giao lưu văn hóa người H'Mông và thưởng thức bữa tối bản địa ấm cúng.",
      days: "Thứ 6 – Chủ nhật",
      hours: "14:00 – 12:00",
      status: "paused",
      createdAt: now - 86400000 * 5,
      updatedAt: now - 86400000,
    },
  ];
}

/* ==================== 2. HÀM TIỆN ÍCH ==================== */

// Viết tắt querySelector cho gọn
const $ = (sel) => document.querySelector(sel);

// Sinh ID duy nhất cho bản ghi mới
function uid() {
  return "exp_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}

// Escape HTML để tránh lỗi hiển thị khi render dữ liệu động
function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[ch]));
}

// Định dạng giá theo chuẩn Việt Nam: 1200000 -> "1.200.000₫/người"
function formatPrice(price) {
  return Number(price).toLocaleString("vi-VN") + "₫/người";
}

// Định dạng timestamp thành ngày giờ ngắn gọn (dd/mm/yyyy hh:mm)
function formatDate(ts) {
  return new Date(ts).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}

/* ==================== 3. TRẠNG THÁI TRANG & THAM CHIẾU PHẦN TỬ DOM ==================== */

// Trạng thái trung tâm của trang (quản lý state mô phỏng)
const state = {
  list: [],             // danh sách trải nghiệm đầy đủ
  query: "",            // từ khóa tìm kiếm hiện tại
  filter: "all",        // bộ lọc trạng thái
  editingId: null,      // id trải nghiệm đang sửa (null = đang thêm mới)
  managingId: null,     // id trải nghiệm đang mở modal "Quản lý"
  pendingDeleteId: null,// id đang chờ xác nhận xóa
  saving: false,        // chống nhấn nút Lưu 2 lần liên tiếp
  aiRunning: false,     // AI có đang xử lý không
  aiText: "",           // nội dung gợi ý mới nhất của AI
  aiVariants: 0,        // số lần đã bấm "Tạo lại" (để gợi ý khác đi)
};

// Cache các phần tử DOM để không phải truy vấn lặp lại
const el = {
  // Header
  globalSearch: $("#globalSearch"),
  btnNotif: $("#btnNotif"),
  btnAvatar: $("#btnAvatar"),
  // Thanh công cụ
  searchInput: $("#searchInput"),
  filterStatus: $("#filterStatus"),
  btnAdd: $("#btnAdd"),
  // Các khối trạng thái của danh sách
  listArea: $("#listArea"),
  loadingState: $("#loadingState"),
  errorState: $("#errorState"),
  emptyState: $("#emptyState"),
  noResultState: $("#noResultState"),
  expList: $("#expList"),
  btnRetry: $("#btnRetry"),
  btnResetData: $("#btnResetData"),
  btnEmptyAdd: $("#btnEmptyAdd"),
  btnClearFilter: $("#btnClearFilter"),
  // Modal thêm/sửa (form "Thông tin trải nghiệm")
  formModal: $("#formModal"),
  formModalTitle: $("#formModalTitle"),
  expForm: $("#expForm"),
  fName: $("#fName"), fType: $("#fType"), fPrice: $("#fPrice"),
  fCapacity: $("#fCapacity"), fDesc: $("#fDesc"),
  fDays: $("#fDays"), fHours: $("#fHours"),
  btnSave: $("#btnSave"),
  // Khung trợ lý AI
  btnAi: $("#btnAi"), aiPanel: $("#aiPanel"),
  aiLoading: $("#aiLoading"), aiResult: $("#aiResult"),
  aiText: $("#aiText"), aiReasons: $("#aiReasons"),
  aiAccept: $("#aiAccept"), aiEdit: $("#aiEdit"),
  aiRegen: $("#aiRegen"), aiReject: $("#aiReject"),
  // Modal quản lý + xác nhận xóa
  manageModal: $("#manageModal"), manageBody: $("#manageBody"),
  btnToggleStatus: $("#btnToggleStatus"),
  btnArchive: $("#btnArchive"), btnDelete: $("#btnDelete"),
  confirmModal: $("#confirmModal"), confirmMsg: $("#confirmMsg"),
  btnConfirmYes: $("#btnConfirmYes"), btnConfirmNo: $("#btnConfirmNo"),
  // Khung toast
  toastWrap: $("#toastWrap"),
};

/* ==================== 4. ĐỌC / GHI LOCALSTORAGE ==================== */

// Đọc dữ liệu từ LocalStorage; lần đầu truy cập thì ghi dữ liệu mẫu
function loadFromStorage() {
  showOnly("loading");                    // hiện trạng thái đang tải (skeleton)
  el.listArea.setAttribute("aria-busy", "true");

  // Giả lập độ trễ "gọi API" 0.7s để người xem thấy được trạng thái loading
  setTimeout(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) {
        state.list = getSeedData();       // lần đầu: khởi tạo dữ liệu mẫu
        persist();
      } else {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) throw new Error("Dữ liệu không phải mảng");
        state.list = parsed;
      }
      render();                           // render sẽ tự chọn trạng thái phù hợp
    } catch (err) {
      console.error("Lỗi đọc LocalStorage:", err);
      showOnly("error");                  // hiện trạng thái lỗi + nút Thử lại
    } finally {
      el.listArea.setAttribute("aria-busy", "false");
    }
  }, 700);
}

// Ghi danh sách hiện tại xuống LocalStorage (có bắt lỗi chế độ riêng tư)
function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.list));
    return true;
  } catch (err) {
    console.error("Lỗi ghi LocalStorage:", err);
    showToast("error", "Không thể lưu dữ liệu cục bộ (LocalStorage đang bị chặn?).");
    return false;
  }
}

// Chỉ hiển thị 1 khối trạng thái duy nhất trong khu vực danh sách
function showOnly(which) {
  el.loadingState.hidden  = which !== "loading";
  el.errorState.hidden    = which !== "error";
  el.emptyState.hidden    = which !== "empty";
  el.noResultState.hidden = which !== "noresult";
  el.expList.hidden       = which !== "list";
}

/* ==================== 5. RENDER DANH SÁCH + TRẠNG THÁI ==================== */

// Hàm render chính: tìm kiếm + lọc -> quyết định hiển thị khối trạng thái nào
function render() {
  const q = state.query.trim().toLowerCase();

  // Bước 1: lọc theo trạng thái. "all" = đang vận hành (không tính bản lưu trữ)
  let items = state.list.filter((exp) =>
    state.filter === "all" ? exp.status !== "archived" : exp.status === state.filter
  );

  // Bước 2: tìm kiếm theo tên / loại / mô tả (không phân biệt hoa thường)
  if (q) {
    items = items.filter((exp) =>
      (exp.name + " " + exp.type + " " + exp.description).toLowerCase().includes(q)
    );
  }

  // Bước 3: chọn trạng thái hiển thị phù hợp
  if (state.list.length === 0) {
    showOnly("empty");                     // chưa có dữ liệu nào -> empty state
    el.expList.innerHTML = "";
    return;
  }
  if (items.length === 0) {
    showOnly("noresult");                  // tìm/lọc không khớp -> no-result state
    el.expList.innerHTML = "";
    return;
  }

  // Bước 4: render từng dòng trải nghiệm ra danh sách
  showOnly("list");
  el.expList.innerHTML = items.map(buildRow).join("");
}

// Dựng HTML cho 1 dòng trải nghiệm (theo mockup: ảnh loại - tên - badge - nút)
function buildRow(exp) {
  const meta = STATUS_META[exp.status] || STATUS_META.active;
  return `
  <article class="card exp-row" data-id="${exp.id}">
    <div class="exp-thumb">${escapeHtml(exp.type)}</div>
    <div class="exp-info">
      <h3 class="exp-name">${escapeHtml(exp.name)}</h3>
      <p class="exp-meta">
        ${escapeHtml(formatPrice(exp.price))} • ${Number(exp.capacity)} người • ${escapeHtml(exp.days || "—")}
      </p>
    </div>
    <span class="badge ${meta.badge}">${meta.label}</span>
    <div class="exp-actions">
      <button class="btn btn-light" data-action="edit" type="button">Sửa</button>
      <button class="btn btn-primary" data-action="manage" type="button">Quản lý</button>
    </div>
  </article>`;
}

// Ủy quyền sự kiện cho toàn danh sách: bắt nút "Sửa" / "Quản lý" khi click
function onListClick(e) {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const row = btn.closest(".exp-row");
  if (!row) return;
  const id = row.dataset.id;
  if (btn.dataset.action === "edit") openForm(id);        // mở modal sửa
  if (btn.dataset.action === "manage") openManage(id);    // mở modal quản lý
}

// Tiện ích: tìm 1 trải nghiệm theo id
function findById(id) {
  return state.list.find((exp) => exp.id === id) || null;
}

/* ==================== 6. MODAL THÊM / SỬA (CREATE - UPDATE) ==================== */

// Mở modal form: id = null -> thêm mới; id hợp lệ -> chỉnh sửa bản ghi cũ
function openForm(id) {
  state.editingId = id || null;
  el.expForm.reset();
  clearFieldErrors();
  hideAiPanel();

  if (id) {
    const exp = findById(id);
    if (!exp) return;
    el.formModalTitle.textContent = "Cập nhật trải nghiệm";
    el.fName.value = exp.name;
    el.fType.value = exp.type;
    el.fPrice.value = exp.price;
    el.fCapacity.value = exp.capacity;
    el.fDesc.value = exp.description;
    el.fDays.value = exp.days;
    el.fHours.value = exp.hours;
  } else {
    el.formModalTitle.textContent = "Thêm trải nghiệm";
  }
  openModal("formModal");
  el.fName.focus();
}

// Mở / đóng modal chung (bật tắt thuộc tính hidden của lớp phủ)
function openModal(id) { document.getElementById(id).hidden = false; }
function closeModal(id) { document.getElementById(id).hidden = true; }

/* ---------- Validation form: thông báo lỗi tiếng Việt rõ ràng ---------- */

// Xóa toàn bộ đánh dấu lỗi đỏ trên form
function clearFieldErrors() {
  el.expForm.querySelectorAll(".control").forEach((c) => c.classList.remove("invalid"));
  el.expForm.querySelectorAll(".field-error").forEach((p) => { p.hidden = true; p.textContent = ""; });
}

// Đánh dấu lỗi cho 1 trường cụ thể (viền đỏ + dòng thông báo bên dưới)
function setFieldError(input, errEl, msg) {
  input.classList.add("invalid");
  errEl.textContent = msg;
  errEl.hidden = false;
}

// Kiểm tra tính hợp lệ của toàn bộ form; trả về true khi mọi trường đều đạt
function validateForm() {
  clearFieldErrors();
  let ok = true;

  const name = el.fName.value.trim();
  const type = el.fType.value;
  const price = Number(el.fPrice.value);
  const capacity = Number(el.fCapacity.value);
  const desc = el.fDesc.value.trim();
  const days = el.fDays.value.trim();
  const hours = el.fHours.value.trim();

  // Tên: bắt buộc, tối thiểu 5 ký tự
  if (name.length < 5) { setFieldError(el.fName, $("#errName"), "Tên trải nghiệm bắt buộc, tối thiểu 5 ký tự."); ok = false; }
  // Loại: bắt buộc chọn
  if (!type) { setFieldError(el.fType, $("#errType"), "Vui lòng chọn loại trải nghiệm."); ok = false; }
  // Giá: số dương, không vượt quá 100 triệu
  if (!el.fPrice.value || isNaN(price) || price <= 0) {
    setFieldError(el.fPrice, $("#errPrice"), "Giá phải là số lớn hơn 0 (VNĐ)."); ok = false;
  } else if (price > 100000000) {
    setFieldError(el.fPrice, $("#errPrice"), "Giá vượt quá 100.000.000₫ — vui lòng kiểm tra lại."); ok = false;
  }
  // Sức chứa: số nguyên từ 1 đến 500
  if (!el.fCapacity.value || !Number.isInteger(capacity) || capacity < 1) {
    setFieldError(el.fCapacity, $("#errCapacity"), "Sức chứa phải là số nguyên ≥ 1."); ok = false;
  } else if (capacity > 500) {
    setFieldError(el.fCapacity, $("#errCapacity"), "Sức chứa tối đa 500 người."); ok = false;
  }
  // Mô tả: tối thiểu 20 ký tự (gợi ý người dùng có thể dùng AI)
  if (desc.length < 20) {
    setFieldError(el.fDesc, $("#errDesc"), 'Mô tả tối thiểu 20 ký tự (có thể bấm "✨ AI gợi ý mô tả").'); ok = false;
  }
  // Ngày hoạt động: bắt buộc
  if (!days) { setFieldError(el.fDays, $("#errDays"), "Vui lòng nhập ngày hoạt động."); ok = false; }
  // Khung giờ: đúng định dạng "HH:MM – HH:MM"
  if (!/^\d{1,2}:\d{2}\s*[-–—]\s*\d{1,2}:\d{2}$/.test(hours)) {
    setFieldError(el.fHours, $("#errHours"), "Khung giờ sai định dạng. VD: 08:00 – 18:00."); ok = false;
  }

  if (!ok) {
    const firstBad = el.expForm.querySelector(".control.invalid");
    if (firstBad) firstBad.focus();          // đưa con trỏ tới trường lỗi đầu tiên
  }
  return ok;
}

/* ---------- Xử lý submit: loading -> ghi dữ liệu -> toast thành công ---------- */
function onSubmitForm(e) {
  e.preventDefault();
  if (state.saving) return;                  // chống nhấn đúp nút Lưu
  if (!validateForm()) {
    showToast("error", "Thông tin chưa hợp lệ. Vui lòng kiểm tra các trường bị đánh dấu đỏ.");
    return;
  }

  // Trạng thái loading của nút Lưu (spinner + chữ "Đang lưu...")
  state.saving = true;
  el.btnSave.disabled = true;
  const oldLabel = el.btnSave.textContent;
  el.btnSave.innerHTML = '<span class="spinner spinner-white"></span> Đang lưu...';

  setTimeout(() => {                         // giả lập thời gian xử lý phía server
    const data = {
      name: el.fName.value.trim(),
      type: el.fType.value,
      price: Number(el.fPrice.value),
      capacity: Number(el.fCapacity.value),
      description: el.fDesc.value.trim(),
      days: el.fDays.value.trim(),
      hours: el.fHours.value.trim(),
      updatedAt: Date.now(),
    };

    if (state.editingId) {
      // UPDATE: gộp dữ liệu mới vào bản ghi đang sửa
      const exp = findById(state.editingId);
      if (exp) Object.assign(exp, data);
      showToast("success", `Đã cập nhật trải nghiệm "${data.name}".`);
    } else {
      // CREATE: thêm bản ghi mới, trạng thái mặc định "Đang hoạt động"
      state.list.unshift({ id: uid(), status: "active", createdAt: Date.now(), ...data });
      showToast("success", `Đã thêm trải nghiệm "${data.name}".`);
    }

    persist();                               // đồng bộ xuống LocalStorage
    render();                                // làm mới danh sách + trạng thái
    closeModal("formModal");

    // Trả nút Lưu về trạng thái thường
    state.saving = false;
    el.btnSave.disabled = false;
    el.btnSave.textContent = oldLabel;
  }, 700);
}

/* ==================== 7. MODAL "QUẢN LÝ": TRẠNG THÁI, LƯU TRỮ, XÓA (DELETE) ==================== */

// Mở modal quản lý cho 1 trải nghiệm
function openManage(id) {
  const exp = findById(id);
  if (!exp) return;
  state.managingId = id;
  renderManageBody(exp);
  renderManageButtons(exp);
  openModal("manageModal");
}

// Render khối thông tin chi tiết bên trong modal quản lý
function renderManageBody(exp) {
  const meta = STATUS_META[exp.status] || STATUS_META.active;
  el.manageBody.innerHTML = `
    <div class="manage-grid">
      <div class="manage-item full">
        <p class="manage-label">Tên trải nghiệm</p>
        <p class="manage-value">${escapeHtml(exp.name)}</p>
      </div>
      <div class="manage-item"><p class="manage-label">Loại</p><p class="manage-value">${escapeHtml(exp.type)}</p></div>
      <div class="manage-item"><p class="manage-label">Trạng thái</p><p class="manage-value"><span class="badge ${meta.badge}">${meta.label}</span></p></div>
      <div class="manage-item"><p class="manage-label">Giá</p><p class="manage-value">${escapeHtml(formatPrice(exp.price))}</p></div>
      <div class="manage-item"><p class="manage-label">Sức chứa</p><p class="manage-value">${Number(exp.capacity)} người</p></div>
      <div class="manage-item"><p class="manage-label">Ngày hoạt động</p><p class="manage-value">${escapeHtml(exp.days || "—")}</p></div>
      <div class="manage-item"><p class="manage-label">Khung giờ</p><p class="manage-value">${escapeHtml(exp.hours || "—")}</p></div>
      <div class="manage-item full"><p class="manage-label">Mô tả</p><p class="manage-value">${escapeHtml(exp.description)}</p></div>
      <div class="manage-item full"><p class="manage-label">Cập nhật lần cuối</p><p class="manage-value">${formatDate(exp.updatedAt || exp.createdAt)}</p></div>
    </div>`;
}

// Đổi nhãn + màu 3 nút điều hành tùy theo trạng thái hiện tại
function renderManageButtons(exp) {
  if (exp.status === "active") {
    el.btnToggleStatus.textContent = "⏸ Tạm ngưng hoạt động";
    el.btnToggleStatus.className = "btn btn-warning-light";
  } else if (exp.status === "paused") {
    el.btnToggleStatus.textContent = "▶ Kích hoạt lại";
    el.btnToggleStatus.className = "btn btn-success-light";
  } else {
    // archived
    el.btnToggleStatus.textContent = "↺ Khôi phục hoạt động";
    el.btnToggleStatus.className = "btn btn-success-light";
  }
  el.btnArchive.textContent = exp.status === "archived" ? "Bỏ lưu trữ" : "Lưu trữ trải nghiệm";
}

// Chuyển trạng thái: active <-> paused; archived -> active
function onToggleStatus() {
  const exp = findById(state.managingId);
  if (!exp) return;
  if (exp.status === "active") {
    exp.status = "paused";
    showToast("info", `Đã tạm ngưng "${exp.name}". Du khách sẽ không thấy trải nghiệm này.`);
  } else {
    exp.status = "active";
    showToast("success", `Đã kích hoạt "${exp.name}".`);
  }
  exp.updatedAt = Date.now();
  persist(); render();
  renderManageBody(exp); renderManageButtons(exp);   // cập nhật lại modal đang mở
}

// Lưu trữ (xóa mềm - ẩn khỏi danh sách vận hành) / bỏ lưu trữ
function onArchive() {
  const exp = findById(state.managingId);
  if (!exp) return;
  const archiving = exp.status !== "archived";
  exp.status = archiving ? "archived" : "paused";
  exp.updatedAt = Date.now();
  persist(); render();
  closeModal("manageModal");
  showToast(archiving ? "info" : "success",
    archiving
      ? `Đã lưu trữ "${exp.name}". Xem lại bằng bộ lọc "Đã lưu trữ".`
      : `Đã bỏ lưu trữ "${exp.name}" (trạng thái: Tạm ngưng).`);
}

// Yêu cầu xóa: mở modal xác nhận trước khi thực hiện
function onRequestDelete() {
  const exp = findById(state.managingId);
  if (!exp) return;
  state.pendingDeleteId = exp.id;
  el.confirmMsg.textContent = `Hành động này không thể hoàn tác. Trải nghiệm "${exp.name}" sẽ bị xóa vĩnh viễn khỏi danh sách của bạn.`;
  openModal("confirmModal");
}

// DELETE thật: xóa bản ghi sau khi người dùng bấm xác nhận
function onConfirmDelete() {
  const exp = findById(state.pendingDeleteId);
  state.list = state.list.filter((e) => e.id !== state.pendingDeleteId);
  persist(); render();
  state.pendingDeleteId = null;
  closeModal("confirmModal");
  closeModal("manageModal");
  if (exp) showToast("error", `Đã xóa vĩnh viễn "${exp.name}".`);
}

/* ==================== 8. AI MÔ PHỎNG: GỢI Ý MÔ TẢ TRẢI NGHIỆM ====================
   Luồng đầy đủ theo yêu cầu đồ án:
     [Nhập thông tin] -> [AI xử lý (loading)] -> [Kết quả gợi ý]
     -> [Giải thích lý do] -> [Chấp nhận / Sửa / Tạo lại / Từ chối]
   ----------------------------------------------------------------------------- */

// "Kho tri thức" giả lập của AI cho từng loại hình trải nghiệm
const AI_TEMPLATES = {
  "Du thuyền":  "Hành trình du thuyền đưa du khách lướt qua những khối núi đá vôi kỳ vĩ, thưởng thức bữa ăn hải sản tươi ngon trên boong và lưu lại bộ ảnh hoàng hôn rực rỡ giữa vịnh.",
  "Làng cổ":    "Chuyến tham quan làng cổ đưa du khách lạc bước giữa những nếp nhà hàng trăm năm tuổi, tìm hiểu nghề truyền thống và thưởng thức đặc sản địa phương đậm chất vùng quê Bắc Bộ.",
  "Homestay":   "Kỳ nghỉ homestay ấm cúng giữa thiên nhiên: thức dậy với view núi đồi, cùng gia chủ nấu bữa ăn bản địa và lắng nghe những câu chuyện văn hóa thú vị của người dân địa phương.",
  "Nghỉ dưỡng": "Trải nghiệm nghỉ dưỡng trọn gói giúp du khách thả lỏng hoàn toàn: không gian yên tĩnh, dịch vụ chăm sóc tận tình và ẩm thực tinh tế giữa khung cảnh thiên nhiên trong lành.",
  "Ẩm thực":    "Food tour dẫn dắt du khách qua những quán ăn địa phương lâu năm, thưởng thức đặc sản trứ danh và nghe đầu bếp kể câu chuyện phía sau từng món ăn.",
  "Trekking":   "Chuyến trekking băng qua những cung đường mòn tuyệt đẹp, chinh phục các điểm ngắm cảnh trên cao và cắm trại giữa thiên nhiên hoang sơ cùng hướng dẫn viên bản địa giàu kinh nghiệm.",
};

// Kích hoạt luồng AI: cần tối thiểu tên + loại để "phân tích"
function startAi() {
  const name = el.fName.value.trim();
  const type = el.fType.value;
  if (!name || !type) {
    showToast("error", "Vui lòng nhập tên và chọn loại trải nghiệm trước khi dùng AI gợi ý.");
    return;
  }
  if (state.aiRunning) return;               // đang xử lý thì bỏ qua lần bấm này
  state.aiRunning = true;
  el.btnAi.disabled = true;

  // Bước [AI xử lý]: hiện khung + spinner
  el.aiPanel.hidden = false;
  el.aiLoading.hidden = false;
  el.aiResult.hidden = true;

  setTimeout(() => {                         // giả lập độ trễ AI ~1.5s
    const suggestion = buildAiSuggestion();
    state.aiText = suggestion.text;
    state.aiVariants += 1;

    // Bước [Kết quả gợi ý]
    el.aiText.textContent = suggestion.text;
    // Bước [Giải thích lý do]
    el.aiReasons.innerHTML = suggestion.reasons.map((r) => `<li>${escapeHtml(r)}</li>`).join("");

    el.aiLoading.hidden = true;
    el.aiResult.hidden = false;
    state.aiRunning = false;
    el.btnAi.disabled = false;
  }, 1500);
}

// "Sinh" nội dung gợi ý từ dữ liệu form (mô phỏng, không gọi API thật)
function buildAiSuggestion() {
  const name = el.fName.value.trim();
  const type = el.fType.value;
  const price = Number(el.fPrice.value) || 0;
  const capacity = Number(el.fCapacity.value) || 0;
  const days = el.fDays.value.trim() || "các ngày trong tuần";
  const hours = el.fHours.value.trim() || "trong ngày";

  // Phân loại phân khúc giá -> chọn tệp khách và giọng văn phù hợp
  const seg = price >= 1000000 ? { label: "cao cấp",   target: "khách nghỉ dưỡng và các cặp đôi" }
            : price >= 500000  ? { label: "tầm trung", target: "gia đình và nhóm bạn" }
            :                    { label: "tiết kiệm", target: "khách trẻ ưa khám phá" };

  const base = AI_TEMPLATES[type] || `Trải nghiệm "${name}" mang đến những khoảnh khắc đáng nhớ cho du khách.`;
  const variantNote = state.aiVariants > 0 ? ` (bản gợi ý thứ ${state.aiVariants + 1})` : "";

  const text = `${base} "${name}"${variantNote} có sức chứa ${capacity || "nhóm nhỏ"} khách, hoạt động ${days}, khung giờ ${hours}, thuộc phân khúc ${seg.label} — lựa chọn lý tưởng cho ${seg.target}.`;

  const reasons = [
    `Loại hình "${type}" kết hợp tên "${name}" được AI nhận diện là trải nghiệm thiên về khám phá — mô tả tập trung vào cảm xúc và điểm đặc sắc.`,
    `Mức giá ${price ? formatPrice(price) : "(chưa nhập)"} thuộc phân khúc ${seg.label} nên văn phong hướng tới tệp ${seg.target}.`,
    `Sức chứa ${capacity || "chưa rõ"} khách → AI bổ sung ý "nhóm nhỏ / riêng tư" để tăng sức hấp dẫn.`,
    `Lịch hoạt động (${days}, ${hours}) được đưa vào giúp du khách dễ hình dung và đặt chỗ chính xác hơn.`,
  ];
  return { text, reasons };
}

// Bước [Chấp nhận] / [Sửa]: đổ gợi ý vào ô mô tả
// focusToEdit = true -> con trỏ nhảy vào textarea để người dùng tinh chỉnh tiếp
function onAiAccept(focusToEdit) {
  el.fDesc.value = state.aiText;
  el.fDesc.classList.remove("invalid");
  const err = $("#errDesc");
  if (err) { err.hidden = true; err.textContent = ""; }
  hideAiPanel();

  if (focusToEdit) {
    el.fDesc.focus();
    showToast("info", "Đã chèn mô tả AI — bạn có thể chỉnh sửa lại theo ý mình.");
  } else {
    showToast("success", "Đã áp dụng mô tả do AI gợi ý.");
  }
}

// Bước [Tạo lại]: chạy lại luồng AI từ đầu (nội dung sẽ đánh số khác đi)
function onAiRegenerate() { startAi(); }

// Bước [Từ chối]: đóng khung AI, giữ nguyên mô tả người dùng tự viết
function onAiReject() {
  hideAiPanel();
  showToast("info", "Đã bỏ qua gợi ý của AI. Bạn có thể tự viết mô tả của mình.");
}

// Ẩn khung AI + reset trạng thái xử lý tạm
function hideAiPanel() {
  el.aiPanel.hidden = true;
  el.aiLoading.hidden = true;
  el.aiResult.hidden = true;
  state.aiRunning = false;
  el.btnAi.disabled = false;
}

/* ==================== 9. TOAST THÔNG BÁO ==================== */

// Hiện thông báo góc phải dưới; type: "success" | "error" | "info"
function showToast(type, msg) {
  const toast = document.createElement("div");
  toast.className = "toast " + type;
  toast.setAttribute("role", "status");
  toast.textContent = msg;
  el.toastWrap.appendChild(toast);

  // Tự ẩn sau ~3.2 giây (có hiệu ứng trượt ra)
  setTimeout(() => {
    toast.classList.add("hide");
    setTimeout(() => toast.remove(), 260);
  }, 3200);
}

/* ==================== 10. GẮN SỰ KIỆN CHO TOÀN TRANG ==================== */

// Tên hiển thị của các trang sidebar (dùng cho thông báo demo)
const NAV_PAGES = {
  "partner-overview": "Tổng quan",
  "partner-orders": "Đơn đặt",
  "partner-reviews": "Đánh giá",
  "partner-revenue": "Doanh thu",
  "partner-profile": "Hồ sơ",
};

function bindEvents() {
  // ----- Tìm kiếm & lọc danh sách -----
  el.searchInput.addEventListener("input", (e) => { state.query = e.target.value; render(); });
  el.filterStatus.addEventListener("change", (e) => { state.filter = e.target.value; render(); });
  el.btnClearFilter.addEventListener("click", () => {
    el.searchInput.value = ""; el.globalSearch.value = "";
    el.filterStatus.value = "all";
    state.query = ""; state.filter = "all";
    render();
  });

  // ----- Header: ô tìm kiếm toàn cục đồng bộ xuống danh sách -----
  el.globalSearch.addEventListener("input", (e) => {
    el.searchInput.value = e.target.value;
    state.query = e.target.value;
    render();
  });
  el.btnNotif.addEventListener("click", () =>
    showToast("info", "🔔 Bạn có thông báo mới: đơn đặt chờ xác nhận, đánh giá mới... (dữ liệu mô phỏng)"));
  el.btnAvatar.addEventListener("click", () =>
    showToast("info", "Xin chào Đối tác địa phương! Trang Hồ sơ sẽ được xây dựng ở nhiệm vụ tiếp theo."));

  // ----- Sidebar: trang chưa xây dựng thì báo toast demo (tránh link 404) -----
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const page = item.dataset.page;
      if (page === "partner-experience-management") return;      // đang ở trang này
      showToast("info", `Trang "${NAV_PAGES[page] || page}" (vai trò Đối tác) sẽ được xây dựng ở nhiệm vụ tiếp theo.`);
    });
  });

  // ----- Nút thêm mới (trên toolbar + trong empty state) -----
  el.btnAdd.addEventListener("click", () => openForm(null));
  el.btnEmptyAdd.addEventListener("click", () => openForm(null));

  // ----- Khối trạng thái lỗi -----
  el.btnRetry.addEventListener("click", loadFromStorage);
  el.btnResetData.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    showToast("info", "Đang khôi phục dữ liệu mẫu...");
    loadFromStorage();
  });

  // ----- Danh sách: ủy quyền sự kiện cho nút Sửa / Quản lý -----
  el.expList.addEventListener("click", onListClick);

  // ----- Form thêm/sửa -----
  el.expForm.addEventListener("submit", onSubmitForm);

  // ----- Các nút của luồng AI -----
  el.btnAi.addEventListener("click", startAi);
  el.aiAccept.addEventListener("click", () => onAiAccept(false));
  el.aiEdit.addEventListener("click", () => onAiAccept(true));
  el.aiRegen.addEventListener("click", onAiRegenerate);
  el.aiReject.addEventListener("click", onAiReject);

  // ----- Modal quản lý -----
  el.btnToggleStatus.addEventListener("click", onToggleStatus);
  el.btnArchive.addEventListener("click", onArchive);
  el.btnDelete.addEventListener("click", onRequestDelete);

  // ----- Modal xác nhận xóa -----
  el.btnConfirmYes.addEventListener("click", onConfirmDelete);
  el.btnConfirmNo.addEventListener("click", () => {
    state.pendingDeleteId = null;
    closeModal("confirmModal");
  });

  // ----- Nút đóng (×) / Hủy chung: data-close-modal="<id của modal>" -----
  document.querySelectorAll("[data-close-modal]").forEach((btn) => {
    btn.addEventListener("click", () => closeModal(btn.dataset.closeModal));
  });

  // ----- Click vào nền tối (overlay) để đóng modal -----
  document.querySelectorAll(".modal-overlay").forEach((ov) => {
    ov.addEventListener("click", (e) => { if (e.target === ov) ov.hidden = true; });
  });

  // ----- Phím ESC: đóng modal đang mở (ưu tiên modal trên cùng) -----
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!el.confirmModal.hidden) { state.pendingDeleteId = null; closeModal("confirmModal"); }
    else if (!el.manageModal.hidden) closeModal("manageModal");
    else if (!el.formModal.hidden) closeModal("formModal");
  });
}

/* ==================== 11. KHỞI CHẠY ỨNG DỤNG ==================== */
// Script đặt cuối <body> nên DOM đã sẵn sàng khi đoạn này chạy
document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  loadFromStorage();   // loading skeleton -> danh sách / empty / error
});