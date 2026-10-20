/* =====================================================================
   TripWeave AI – pages/partner-admin/partner-admin.js
   Script RIÊNG của các trang PARTNER/ADMIN (7 trang), nạp SAU js/main.js:
     • admin-analytics            • admin-category-management
     • admin-content-moderation   • partner-activity-management
     • partner-analytics          • partner-orders
     • partner-profile
   Mỗi trang = 1 module IIFE với guard body[data-page] → chỉ module của
   trang đang mở chạy, các module khác thoát ngay dòng đầu tiên.
   Logic gốc được giữ nguyên 100% (tách từ khối <script> inline cũ).
   ===================================================================== */


/* ---------- Trang: admin-analytics.html (chi chay khi body[data-page="admin-analytics"]) ---------- */
(function () {
  if (document.body.getAttribute('data-page') !== 'admin-analytics') return;

  (function () {
    var user = twCurrentUser();
    if (!user) return;
    var $ = function (id) { return document.getElementById(id); };
    var orders = twGet(TW_KEYS.orders, []);
    var activities = twGet(TW_KEYS.activities, []);
    var places = twGet(TW_KEYS.places, []);
    var revenueData = twGet(TW_KEYS.revenue, { labels: [], values: [] });

    /* KPI */
    var valid = orders.filter(function (o) { return o.status === 'Confirmed' || o.status === 'Completed'; });
    var totalRevenue = valid.reduce(function (s, o) { return s + (Number(o.amount) || 0); }, 0);
    $('kpi-users').textContent = twGet(TW_KEYS.users, []).length;
    $('kpi-places').textContent = places.length;
    $('kpi-trips').textContent = twGet(TW_KEYS.trips, []).length;
    $('kpi-orders').textContent = orders.length;
    $('kpi-revenue').textContent = twFormatCompact(Math.round(totalRevenue / 1000)) + 'K đ';

    /* Revenue chart */
    twRenderBarChart('chart-revenue', revenueData.labels, revenueData.values, '#F59E0B', ' tr');

    /* Places by category */
    var byCat = {};
    places.forEach(function (p) { byCat[p.category] = (byCat[p.category] || 0) + 1; });
    var maxCat = Math.max.apply(null, Object.keys(byCat).map(function (k) { return byCat[k]; }).concat([1]));
    $('cat-breakdown').innerHTML = Object.keys(byCat).sort(function (a, b) { return byCat[b] - byCat[a]; }).map(function (k) {
      var pct = Math.round((byCat[k] / maxCat) * 100);
      return '<div>' +
        '<div class="flex items-center justify-between text-sm mb-1"><span class="font-semibold text-slate-700">' + twEscapeHtml(k) + '</span><span class="font-bold text-amber-600">' + byCat[k] + ' địa điểm</span></div>' +
        '<div class="progress-track"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
      '</div>';
    }).join('');

    /* Breakdown helper */
    function statusBars(el, items, rows) {
      $(el).innerHTML = rows.map(function (r) {
        var count = items.filter(function (x) { return x.status === r.key; }).length;
        var pct = items.length ? Math.round((count / items.length) * 100) : 0;
        return '<div class="flex items-center gap-3">' +
          '<span class="w-24 text-xs font-semibold text-slate-500 shrink-0">' + r.label + '</span>' +
          '<div class="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden"><div class="h-full rounded-full ' + r.cls + '" style="width:' + pct + '%"></div></div>' +
          '<span class="text-xs font-bold text-slate-700 w-14 text-right">' + count + ' (' + pct + '%)</span>' +
        '</div>';
      }).join('');
    }
    statusBars('order-breakdown', orders, [
      { key: 'Pending', label: 'Chờ xác nhận', cls: 'bg-amber-400' },
      { key: 'Confirmed', label: 'Đã xác nhận', cls: 'bg-blue-500' },
      { key: 'Completed', label: 'Hoàn thành', cls: 'bg-emerald-500' },
      { key: 'Rejected', label: 'Từ chối', cls: 'bg-red-400' }
    ]);
    statusBars('activity-breakdown', activities, [
      { key: 'Pending', label: 'Chờ duyệt', cls: 'bg-amber-400' },
      { key: 'Approved', label: 'Đã duyệt', cls: 'bg-emerald-500' },
      { key: 'Rejected', label: 'Từ chối', cls: 'bg-red-400' }
    ]);

    /* Checklist */
    function renderChecklist() {
      var list = twGet(TW_KEYS.checklist, []);
      var done = list.filter(function (c) { return c.done; }).length;
      var pct = list.length ? Math.round((done / list.length) * 100) : 0;
      $('ck-progress-text').textContent = done + '/' + list.length + ' (' + pct + '%)';
      $('ck-progress').style.width = pct + '%';
      $('ck-list').innerHTML = list.length ? list.map(function (c) {
        return '<label class="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition">' +
          '<input type="checkbox" data-ck="' + c.id + '" ' + (c.done ? 'checked' : '') + ' class="w-4 h-4 accent-violet-500 shrink-0">' +
          '<span class="text-sm ' + (c.done ? 'line-through text-slate-400' : 'text-slate-700 font-medium') + '">' + twEscapeHtml(c.label) + '</span>' +
        '</label>';
      }).join('') : '<p class="text-sm text-slate-400 text-center py-4">Chưa có việc nào.</p>';
    }
    $('ck-list').addEventListener('change', function (e) {
      var box = e.target.closest('[data-ck]');
      if (!box) return;
      var list = twGet(TW_KEYS.checklist, []);
      var item = list.find(function (c) { return c.id === box.getAttribute('data-ck'); });
      if (item) { item.done = box.checked; twSet(TW_KEYS.checklist, list); renderChecklist(); }
    });
    renderChecklist();

    /* Export JSON */
    $('btn-export').addEventListener('click', function () {
      var dump = { exportedAt: new Date().toISOString(), by: user.email };
      Object.keys(TW_KEYS).forEach(function (k) { dump[k] = twGet(TW_KEYS[k], null); });
      var blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'tripweave-backup-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
      showToast('Đã xuất bản sao lưu dữ liệu JSON!');
    });

    /* Reset data */
    $('btn-reset').addEventListener('click', function () {
      if (!confirm('Reset toàn bộ dữ liệu về mặc định? Mọi thay đổi sẽ bị mất.')) return;
      twResetData();
      showToast('Đã reset dữ liệu về mặc định!', 'warning');
      setTimeout(function () { location.reload(); }, 900);
    });
  })();

})();

/* ---------- Trang: admin-category-management.html (chi chay khi body[data-page="admin-category-management"]) ---------- */
(function () {
  if (document.body.getAttribute('data-page') !== 'admin-category-management') return;

  (function () {
    var user = twCurrentUser();
    if (!user) return;
    var $ = function (id) { return document.getElementById(id); };
    var editId = null;

    function allCats() { return twGet(TW_KEYS.categories, []); }
    function saveCats(list) { twSet(TW_KEYS.categories, list); }
    function placeCount(name) {
      return twGet(TW_KEYS.places, []).filter(function (p) { return p.category === name; }).length;
    }

    function render() {
      var cats = allCats();
      $('st-total').textContent = cats.length;
      $('st-active').textContent = cats.filter(function (c) { return c.active; }).length;
      $('st-inactive').textContent = cats.filter(function (c) { return !c.active; }).length;
      $('cat-empty').classList.toggle('hidden', cats.length > 0);
      $('cat-tbody').innerHTML = cats.map(function (c) {
        var count = placeCount(c.name);
        return '<tr class="hover:bg-slate-50/70 transition">' +
          '<td class="px-4 py-3"><div class="flex items-center gap-2.5">' +
            '<span class="w-9 h-9 rounded-xl ph-img ph-amber text-sm shrink-0"><i class="fa-solid fa-tag"></i></span>' +
            '<span class="font-semibold text-slate-800">' + twEscapeHtml(c.name) + '</span></div></td>' +
          '<td class="px-4 py-3 text-slate-600">' + count + ' địa điểm</td>' +
          '<td class="px-4 py-3"><button type="button" data-act="toggle" data-id="' + c.id + '" title="Bật/tắt" class="relative w-11 h-6 rounded-full transition ' + (c.active ? 'bg-emerald-500' : 'bg-slate-300') + '">' +
            '<span class="absolute top-0.5 ' + (c.active ? 'left-[22px]' : 'left-0.5') + ' w-5 h-5 rounded-full bg-white shadow transition-all"></span></button>' +
            '<span class="ml-2 text-xs font-semibold ' + (c.active ? 'text-emerald-600' : 'text-slate-400') + '">' + (c.active ? 'Hoạt động' : 'Ngưng') + '</span></td>' +
          '<td class="px-4 py-3"><div class="flex justify-end gap-1.5">' +
            '<button type="button" data-act="edit" data-id="' + c.id + '" class="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 text-xs font-semibold transition" title="Sửa"><i class="fa-solid fa-pen"></i></button>' +
            '<button type="button" data-act="del" data-id="' + c.id + '" class="px-2.5 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 text-xs font-semibold transition" title="Xóa"><i class="fa-solid fa-trash"></i></button>' +
          '</div></td>' +
        '</tr>';
      }).join('');
    }

    /* Add / edit modal */
    $('cat-add-btn').addEventListener('click', function () {
      editId = null;
      $('cm-title').textContent = 'Thêm danh mục';
      $('cm-name').value = '';
      $('cm-active').checked = true;
      openModal('modal-cat');
      $('cm-name').focus();
    });

    $('cat-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('cm-name').value.trim();
      if (!name) { showToast('Vui lòng nhập tên danh mục!', 'error'); return; }
      var cats = allCats();
      var dup = cats.find(function (c) { return c.name.toLowerCase() === name.toLowerCase() && c.id !== editId; });
      if (dup) { showToast('Danh mục "' + name + '" đã tồn tại!', 'error'); return; }
      if (editId) {
        var target = cats.find(function (c) { return c.id === editId; });
        var oldName = target.name;
        /* đổi tên thì cập nhật luôn category của các địa điểm */
        if (oldName !== name) {
          var places = twGet(TW_KEYS.places, []);
          places.forEach(function (p) { if (p.category === oldName) p.category = name; });
          twSet(TW_KEYS.places, places);
        }
        target.name = name;
        target.active = $('cm-active').checked;
        showToast('Đã cập nhật danh mục "' + name + '"!');
      } else {
        cats.unshift({ id: twUid('cat'), name: name, active: $('cm-active').checked });
        showToast('Đã thêm danh mục "' + name + '"!');
      }
      saveCats(cats);
      closeModal('modal-cat');
      render();
    });

    /* Row actions */
    $('cat-tbody').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-act]');
      if (!btn) return;
      var act = btn.getAttribute('data-act'), id = btn.getAttribute('data-id');
      var cats = allCats();
      var cat = cats.find(function (c) { return c.id === id; });
      if (!cat) return;
      if (act === 'toggle') {
        cat.active = !cat.active;
        saveCats(cats);
        showToast('Danh mục "' + cat.name + '" ' + (cat.active ? 'đã được kích hoạt.' : 'đã ngưng hoạt động.'), 'info');
        render();
      } else if (act === 'edit') {
        editId = id;
        $('cm-title').textContent = 'Sửa danh mục';
        $('cm-name').value = cat.name;
        $('cm-active').checked = cat.active;
        openModal('modal-cat');
        $('cm-name').focus();
      } else if (act === 'del') {
        var count = placeCount(cat.name);
        if (count > 0) { showToast('Không thể xóa: "' + cat.name + '" đang được dùng bởi ' + count + ' địa điểm!', 'error'); return; }
        if (!confirm('Xóa danh mục "' + cat.name + '"?')) return;
        saveCats(cats.filter(function (c) { return c.id !== id; }));
        showToast('Đã xóa danh mục "' + cat.name + '".', 'warning');
        render();
      }
    });

    render();
  })();

})();

/* ---------- Trang: admin-content-moderation.html (chi chay khi body[data-page="admin-content-moderation"]) ---------- */
(function () {
  if (document.body.getAttribute('data-page') !== 'admin-content-moderation') return;

  (function () {
    var user = twCurrentUser();
    if (!user) return;
    var $ = function (id) { return document.getElementById(id); };
    var state = { tab: 'Tất cả', q: '' };

    function notify(role, text) {
      var notes = twGet(TW_KEYS.notifications, []);
      notes.unshift({ id: twUid('n'), role: role, text: text, time: 'Vừa xong', read: false });
      twSet(TW_KEYS.notifications, notes);
    }

    function buildQueue() {
      var partner = twGet(TW_KEYS.partnerProfile, {});
      var acts = twGet(TW_KEYS.activities, []).map(function (a) {
        return { kind: 'activity', id: a.id, title: a.title, meta: a.type + ' • ' + a.location + ' • ' + twFormatMoney(a.price), author: partner.company || 'Đối tác địa phương', date: '', status: a.status };
      });
      var posts = twGet(TW_KEYS.posts, []).map(function (p) {
        return { kind: 'post', id: p.id, title: p.title, meta: p.type + (p.placeId ? ' • gắn với địa điểm' : ''), author: p.author, date: p.date, status: p.status };
      });
      return acts.concat(posts);
    }

    function renderStats() {
      var queue = buildQueue();
      $('st-pending-acts').textContent = queue.filter(function (x) { return x.kind === 'activity' && x.status === 'Pending'; }).length;
      $('st-pending-posts').textContent = queue.filter(function (x) { return x.kind === 'post' && x.status === 'Pending'; }).length;
      $('st-approved').textContent = queue.filter(function (x) { return x.status === 'Approved'; }).length;
      $('st-rejected').textContent = queue.filter(function (x) { return x.status === 'Rejected'; }).length;
    }

    function render() {
      var q = state.q.toLowerCase();
      var list = buildQueue().filter(function (x) {
        var matchTab = state.tab === 'Tất cả' || (state.tab === 'Dịch vụ' && x.kind === 'activity') || (state.tab === 'Bài viết' && x.kind === 'post');
        var matchQ = !q || (x.title + ' ' + x.author + ' ' + x.meta).toLowerCase().indexOf(q) !== -1;
        return matchTab && matchQ;
      });
      $('mod-empty').classList.toggle('hidden', list.length > 0);
      $('mod-list').innerHTML = list.map(function (x) {
        var icon = x.kind === 'activity'
          ? '<span class="w-11 h-11 rounded-xl ph-img ph-violet shrink-0"><i class="fa-solid fa-store"></i></span>'
          : '<span class="w-11 h-11 rounded-xl ph-img ph-amber shrink-0"><i class="fa-regular fa-newspaper"></i></span>';
        var actions = x.status === 'Pending'
          ? '<button type="button" data-act="approve" data-kind="' + x.kind + '" data-id="' + x.id + '" class="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition"><i class="fa-solid fa-check mr-1"></i>Duyệt</button>' +
            '<button type="button" data-act="reject" data-kind="' + x.kind + '" data-id="' + x.id + '" class="px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 text-xs font-semibold transition"><i class="fa-solid fa-xmark mr-1"></i>Từ chối</button>'
          : '<span class="text-xs text-slate-300">Đã xử lý</span>';
        return '<div class="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:shadow-md transition">' +
          icon +
          '<div class="flex-1 min-w-0">' +
            '<div class="flex items-center gap-2 flex-wrap"><p class="font-semibold text-slate-900 truncate">' + twEscapeHtml(x.title) + '</p>' + twStatusPill(x.status) + '</div>' +
            '<p class="text-xs text-slate-400 mt-0.5"><i class="fa-regular fa-user mr-1"></i>' + twEscapeHtml(x.author) + ' · ' + twEscapeHtml(x.meta) + (x.date ? ' · ' + twEscapeHtml(x.date) : '') + '</p>' +
          '</div>' +
          '<div class="flex gap-2 shrink-0">' + actions + '</div>' +
        '</div>';
      }).join('');
      renderStats();
    }

    /* Tabs + search */
    $('mod-tabs').addEventListener('click', function (e) {
      var btn = e.target.closest('.mtab');
      if (!btn) return;
      state.tab = btn.getAttribute('data-tab');
      this.querySelectorAll('.mtab').forEach(function (b) {
        b.className = 'mtab px-3.5 py-1.5 rounded-lg text-xs transition ' + (b === btn ? 'font-semibold bg-amber-500 text-white' : 'font-medium text-slate-500 hover:bg-slate-200');
      });
      render();
    });
    $('mod-search').addEventListener('input', function () { state.q = this.value.trim(); render(); });

    /* Approve / reject */
    $('mod-list').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-act]');
      if (!btn) return;
      var act = btn.getAttribute('data-act'), kind = btn.getAttribute('data-kind'), id = btn.getAttribute('data-id');
      if (kind === 'activity') {
        var acts = twGet(TW_KEYS.activities, []);
        var a = acts.find(function (x) { return x.id === id; });
        if (!a) return;
        a.status = act === 'approve' ? 'Approved' : 'Rejected';
        twSet(TW_KEYS.activities, acts);
        notify('partner', 'Dịch vụ "' + a.title + '" đã được quản trị viên ' + (act === 'approve' ? 'duyệt' : 'từ chối') + '.');
        showToast(act === 'approve' ? 'Đã duyệt dịch vụ "' + a.title + '"!' : 'Đã từ chối dịch vụ "' + a.title + '".', act === 'approve' ? 'success' : 'warning');
      } else {
        var posts = twGet(TW_KEYS.posts, []);
        var p = posts.find(function (x) { return x.id === id; });
        if (!p) return;
        p.status = act === 'approve' ? 'Approved' : 'Rejected';
        twSet(TW_KEYS.posts, posts);
        notify(p.type === 'Chia sẻ du khách' ? 'traveler' : 'guide', 'Bài viết "' + p.title + '" đã được ' + (act === 'approve' ? 'duyệt đăng' : 'từ chối') + '.');
        showToast(act === 'approve' ? 'Đã duyệt bài viết "' + p.title + '"!' : 'Đã từ chối bài viết "' + p.title + '".', act === 'approve' ? 'success' : 'warning');
      }
      render();
    });

    render();
  })();

})();

/* ---------- Trang: partner-activity-management.html (chi chay khi body[data-page="partner-activity-management"]) ---------- */
(function () {
  if (document.body.getAttribute('data-page') !== 'partner-activity-management') return;

  (function () {
    var user = twCurrentUser();
    if (!user) return;
    var $ = function (id) { return document.getElementById(id); };
    var TYPE_ICONS = { 'Tour': 'fa-person-hiking', 'Homestay': 'fa-house-chimney', 'Dịch vụ': 'fa-concierge-bell' };
    var state = { q: twGetQueryParam('q') || '', type: 'Tất cả', status: 'Tất cả' };

    function allActs() { return twGet(TW_KEYS.activities, []); }
    function saveActs(list) { twSet(TW_KEYS.activities, list); }
    function notifyAdmin(text) {
      var notes = twGet(TW_KEYS.notifications, []);
      notes.unshift({ id: twUid('n'), role: 'admin', text: text, time: 'Vừa xong', read: false });
      twSet(TW_KEYS.notifications, notes);
    }

    function renderStats() {
      var a = allActs();
      $('st-total').textContent = a.length;
      $('st-approved').textContent = a.filter(function (x) { return x.status === 'Approved'; }).length;
      $('st-pending').textContent = a.filter(function (x) { return x.status === 'Pending'; }).length;
      $('st-rejected').textContent = a.filter(function (x) { return x.status === 'Rejected'; }).length;
    }

    function render() {
      var q = state.q.toLowerCase();
      var list = allActs().filter(function (a) {
        var matchQ = !q || (a.title + ' ' + a.location + ' ' + (a.description || '')).toLowerCase().indexOf(q) !== -1;
        return matchQ && (state.type === 'Tất cả' || a.type === state.type) && (state.status === 'Tất cả' || a.status === state.status);
      });
      $('act-empty').classList.toggle('hidden', list.length > 0);
      $('act-tbody').innerHTML = list.map(function (a) {
        return '<tr class="hover:bg-slate-50/70 transition">' +
          '<td class="px-4 py-3"><div class="flex items-center gap-3"><span class="w-9 h-9 rounded-xl ph-img ph-violet text-sm shrink-0"><i class="fa-solid ' + (TYPE_ICONS[a.type] || 'fa-store') + '"></i></span>' +
            '<div class="min-w-0"><p class="font-semibold text-slate-800 truncate max-w-[220px]">' + twEscapeHtml(a.title) + '</p>' +
            '<p class="text-xs text-slate-400 truncate max-w-[260px]">' + twEscapeHtml(a.description || '') + '</p></div></div></td>' +
          '<td class="px-4 py-3"><span class="px-2.5 py-1 rounded-lg bg-violet-50 text-violet-600 text-xs font-semibold">' + twEscapeHtml(a.type) + '</span></td>' +
          '<td class="px-4 py-3 text-slate-600"><i class="fa-solid fa-location-dot text-slate-300 mr-1"></i>' + twEscapeHtml(a.location) + '</td>' +
          '<td class="px-4 py-3 font-bold text-violet-600">' + twFormatMoney(a.price) + '</td>' +
          '<td class="px-4 py-3 text-slate-600"><i class="fa-regular fa-user text-slate-300 mr-1"></i>' + a.capacity + '</td>' +
          '<td class="px-4 py-3">' + twStatusPill(a.status) + '</td>' +
          '<td class="px-4 py-3"><div class="flex justify-end gap-1.5">' +
            '<button type="button" data-act="edit" data-id="' + a.id + '" class="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-violet-50 hover:text-violet-600 transition" title="Sửa"><i class="fa-solid fa-pen"></i></button>' +
            '<a href="partner-orders.html?service=' + encodeURIComponent(a.title) + '" class="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition flex items-center justify-center" title="Xem đơn đặt"><i class="fa-solid fa-receipt"></i></a>' +
            '<button type="button" data-act="delete" data-id="' + a.id + '" class="w-8 h-8 rounded-lg border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-500 transition" title="Xóa"><i class="fa-solid fa-trash-can"></i></button>' +
          '</div></td>' +
        '</tr>';
      }).join('');
      renderStats();
    }

    /* Toolbar */
    $('act-search').value = state.q;
    $('act-search').addEventListener('input', function () { state.q = this.value.trim(); render(); });
    $('act-type').addEventListener('change', function () { state.type = this.value; render(); });
    $('act-status-tabs').addEventListener('click', function (e) {
      var btn = e.target.closest('.atab');
      if (!btn) return;
      state.status = btn.getAttribute('data-tab');
      this.querySelectorAll('.atab').forEach(function (b) {
        b.className = 'atab px-3 py-1.5 rounded-lg text-xs transition ' + (b === btn ? 'font-semibold bg-violet-500 text-white' : 'font-medium text-slate-500 hover:bg-slate-200');
      });
      render();
    });
    /* Form */
    function openForm(act) {
      $('act-modal-title').innerHTML = act ? '<i class="fa-solid fa-pen text-violet-500 mr-2"></i>Chỉnh sửa dịch vụ' : '<i class="fa-solid fa-store text-violet-500 mr-2"></i>Thêm trải nghiệm';
      $('af-id').value = act ? act.id : '';
      $('af-title').value = act ? act.title : '';
      $('af-type').value = act ? act.type : 'Tour';
      $('af-location').value = act ? act.location : '';
      $('af-price').value = act ? act.price : 500000;
      $('af-capacity').value = act ? act.capacity : 10;
      $('af-desc').value = act ? act.description || '' : '';
      openModal('modal-act');
    }
    $('btn-new-act').addEventListener('click', function () { openForm(null); });
    $('act-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var title = $('af-title').value.trim();
      var location = $('af-location').value.trim();
      if (!title || !location) { showToast('Vui lòng nhập tên dịch vụ và địa điểm!', 'error'); return; }
      var acts = allActs();
      var id = $('af-id').value;
      var data = {
        title: title, type: $('af-type').value, location: location,
        price: Number($('af-price').value) || 0, capacity: Number($('af-capacity').value) || 1,
        description: $('af-desc').value.trim(), status: 'Pending'
      };
      if (id) {
        var act = acts.find(function (a) { return a.id === id; });
        Object.assign(act, data);
        notifyAdmin('Dịch vụ "' + title + '" vừa được cập nhật, chờ duyệt lại.');
        showToast('Đã cập nhật và gửi lại chờ duyệt!');
      } else {
        acts.unshift(Object.assign({ id: twUid('a') }, data));
        notifyAdmin('Đối tác vừa đăng dịch vụ mới "' + title + '" chờ duyệt.');
        showToast('Đã thêm dịch vụ mới – đang chờ quản trị viên duyệt!');
      }
      saveActs(acts);
      closeModal('modal-act');
      render();
    });

    /* Delete */
    var pendingDeleteId = null;
    $('act-tbody').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-act]');
      if (!btn) return;
      var action = btn.getAttribute('data-act'), id = btn.getAttribute('data-id');
      var target = allActs().find(function (a) { return a.id === id; });
      if (!target) return;
      if (action === 'edit') openForm(target);
      if (action === 'delete') {
        pendingDeleteId = id;
        $('delete-act-name').textContent = 'Dịch vụ "' + target.title + '" sẽ bị xóa vĩnh viễn.';
        openModal('modal-delete-act');
      }
    });
    $('confirm-delete-act').addEventListener('click', function () {
      if (!pendingDeleteId) return;
      saveActs(allActs().filter(function (a) { return a.id !== pendingDeleteId; }));
      pendingDeleteId = null;
      closeModal('modal-delete-act');
      render(); showToast('Đã xóa dịch vụ.', 'info');
    });

    render();
  })();

})();

/* ---------- Trang: partner-analytics.html (chi chay khi body[data-page="partner-analytics"]) ---------- */
(function () {
  if (document.body.getAttribute('data-page') !== 'partner-analytics') return;

  (function () {
    var user = twCurrentUser();
    if (!user) return;
    var $ = function (id) { return document.getElementById(id); };
    var orders = twGet(TW_KEYS.orders, []);
    var revenueData = twGet(TW_KEYS.revenue, { labels: [], values: [] });
    var reviews = twGet(TW_KEYS.reviews, []).filter(function (r) { return r.target === 'partner'; });
    var valid = orders.filter(function (o) { return o.status === 'Confirmed' || o.status === 'Completed'; });

    /* KPI */
    var totalRevenue = valid.reduce(function (s, o) { return s + (Number(o.amount) || 0); }, 0);
    $('kpi-revenue').textContent = twFormatCompact(Math.round(totalRevenue / 1000)) + 'K đ';
    $('kpi-orders').textContent = orders.length;
    $('kpi-avg').textContent = orders.length ? twFormatCompact(Math.round(totalRevenue / Math.max(valid.length, 1) / 1000)) + 'K đ' : '0đ';
    var byService = {};
    valid.forEach(function (o) { byService[o.serviceTitle] = (byService[o.serviceTitle] || 0) + (Number(o.amount) || 0); });
    var topService = Object.keys(byService).sort(function (a, b) { return byService[b] - byService[a]; })[0];
    $('kpi-top').textContent = topService || '–';

    /* Revenue chart */
    twRenderBarChart('chart-revenue', revenueData.labels, revenueData.values, '#8B5CF6', ' tr');

    /* Service breakdown */
    var maxService = Math.max.apply(null, Object.keys(byService).map(function (k) { return byService[k]; }).concat([1]));
    $('service-breakdown').innerHTML = Object.keys(byService).length ? Object.keys(byService).sort(function (a, b) { return byService[b] - byService[a]; }).map(function (k) {
      var pct = Math.round((byService[k] / maxService) * 100);
      return '<div>' +
        '<div class="flex items-center justify-between text-sm mb-1"><span class="font-semibold text-slate-700">' + twEscapeHtml(k) + '</span><span class="font-bold text-violet-600">' + twFormatMoney(byService[k]) + '</span></div>' +
        '<div class="progress-track"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
      '</div>';
    }).join('') : '<p class="text-sm text-slate-400 text-center py-6">Chưa có doanh thu.</p>';

    /* Status breakdown */
    var STATUS = [
      { key: 'Pending', label: 'Chờ xác nhận', cls: 'bg-amber-400' },
      { key: 'Confirmed', label: 'Đã xác nhận', cls: 'bg-blue-500' },
      { key: 'Completed', label: 'Hoàn thành', cls: 'bg-emerald-500' },
      { key: 'Rejected', label: 'Từ chối', cls: 'bg-red-400' }
    ];
    $('status-breakdown').innerHTML = STATUS.map(function (s) {
      var count = orders.filter(function (o) { return o.status === s.key; }).length;
      var pct = orders.length ? Math.round((count / orders.length) * 100) : 0;
      return '<div class="flex items-center gap-3">' +
        '<span class="w-28 text-xs font-semibold text-slate-500 shrink-0">' + s.label + '</span>' +
        '<div class="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden"><div class="h-full rounded-full ' + s.cls + '" style="width:' + pct + '%"></div></div>' +
        '<span class="text-xs font-bold text-slate-700 w-14 text-right">' + count + ' (' + pct + '%)</span>' +
      '</div>';
    }).join('');

    /* Reviews */
    var avg = reviews.length ? (reviews.reduce(function (s, r) { return s + r.rating; }, 0) / reviews.length).toFixed(1) : '–';
    $('partner-reviews').innerHTML = '<div class="flex items-center gap-3 mb-3 p-3 rounded-xl bg-amber-50 border border-amber-100">' +
        '<span class="text-3xl font-black text-amber-500">' + avg + '</span>' +
        '<div>' + twStars(Number(avg) || 0) + '<p class="text-xs text-slate-500 mt-0.5">' + reviews.length + ' đánh giá từ du khách</p></div>' +
      '</div>' + (reviews.length ? reviews.map(function (r) {
        return '<div class="flex gap-3 p-2.5 rounded-xl border border-slate-100">' +
          '<span class="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold shrink-0">' + twEscapeHtml(r.author.trim().split(/\s+/).slice(-2).map(function (w) { return w.charAt(0); }).join('').toUpperCase()) + '</span>' +
          '<div class="flex-1 min-w-0"><div class="flex items-center justify-between gap-2"><p class="text-sm font-semibold text-slate-800">' + twEscapeHtml(r.author) + '</p><span class="text-[11px] text-slate-400">' + twEscapeHtml(r.date) + '</span></div>' +
          twStars(r.rating) + '<p class="mt-1 text-sm text-slate-600">' + twEscapeHtml(r.comment) + '</p></div>' +
        '</div>';
      }).join('') : '<p class="text-sm text-slate-400 text-center py-4">Chưa có đánh giá.</p>');
  })();

})();

/* ---------- Trang: partner-orders.html (chi chay khi body[data-page="partner-orders"]) ---------- */
(function () {
  if (document.body.getAttribute('data-page') !== 'partner-orders') return;

  (function () {
    var user = twCurrentUser();
    if (!user) return;
    var $ = function (id) { return document.getElementById(id); };
    var state = { q: twGetQueryParam('q') || '', service: twGetQueryParam('service') || 'Tất cả', status: 'Tất cả' };

    function allOrders() { return twGet(TW_KEYS.orders, []); }
    function saveOrders(list) { twSet(TW_KEYS.orders, list); }

    function renderStats() {
      var o = allOrders();
      $('st-total').textContent = o.length;
      $('st-pending').textContent = o.filter(function (x) { return x.status === 'Pending'; }).length;
      $('st-confirmed').textContent = o.filter(function (x) { return x.status === 'Confirmed'; }).length;
      $('st-completed').textContent = o.filter(function (x) { return x.status === 'Completed'; }).length;
      var revenue = o.filter(function (x) { return x.status === 'Confirmed' || x.status === 'Completed'; })
        .reduce(function (s, x) { return s + (Number(x.amount) || 0); }, 0);
      $('st-revenue').textContent = twFormatCompact(Math.round(revenue / 1000)) + 'K đ';
    }

    function actionBtns(o) {
      if (o.status === 'Pending') {
        return '<button type="button" data-act="confirm" data-id="' + o.id + '" class="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition" title="Xác nhận"><i class="fa-solid fa-check mr-1"></i>Xác nhận</button>' +
          '<button type="button" data-act="reject" data-id="' + o.id + '" class="px-2.5 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 text-xs font-semibold transition" title="Từ chối"><i class="fa-solid fa-xmark"></i></button>';
      }
      if (o.status === 'Confirmed') {
        return '<button type="button" data-act="complete" data-id="' + o.id + '" class="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"><i class="fa-solid fa-flag-checkered mr-1"></i>Hoàn thành</button>';
      }
      return '<span class="text-xs text-slate-300">—</span>';
    }

    function render() {
      var q = state.q.toLowerCase();
      var list = allOrders().filter(function (o) {
        var matchQ = !q || (o.id + ' ' + o.customerName + ' ' + o.serviceTitle).toLowerCase().indexOf(q) !== -1;
        return matchQ && (state.service === 'Tất cả' || o.serviceTitle === state.service) && (state.status === 'Tất cả' || o.status === state.status);
      });
      $('od-empty').classList.toggle('hidden', list.length > 0);
      $('od-tbody').innerHTML = list.map(function (o) {
        return '<tr class="hover:bg-slate-50/70 transition">' +
          '<td class="px-4 py-3 font-mono text-xs font-bold text-slate-500">' + twEscapeHtml(o.id) + '</td>' +
          '<td class="px-4 py-3"><div class="flex items-center gap-2"><span class="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold shrink-0">' + twEscapeHtml(o.customerName.trim().split(/\s+/).slice(-2).map(function (w) { return w.charAt(0); }).join('').toUpperCase()) + '</span>' +
          '<span class="font-semibold text-slate-800">' + twEscapeHtml(o.customerName) + '</span></div></td>' +
          '<td class="px-4 py-3 text-slate-600">' + twEscapeHtml(o.serviceTitle) + '</td>' +
          '<td class="px-4 py-3 text-slate-500">' + twEscapeHtml(o.date) + '</td>' +
          '<td class="px-4 py-3 text-slate-600"><i class="fa-regular fa-user text-slate-300 mr-1"></i>' + o.people + '</td>' +
          '<td class="px-4 py-3 font-bold text-violet-600">' + twFormatMoney(o.amount) + '</td>' +
          '<td class="px-4 py-3">' + twStatusPill(o.status) + '</td>' +
          '<td class="px-4 py-3"><div class="flex justify-end gap-1.5">' + actionBtns(o) + '</div></td>' +
        '</tr>';
      }).join('');
      renderStats();
    }

    /* Toolbar */
    var services = allOrders().map(function (o) { return o.serviceTitle; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
    $('od-service').innerHTML = '<option value="Tất cả">Mọi dịch vụ</option>' + services.map(function (s) { return '<option>' + twEscapeHtml(s) + '</option>'; }).join('');
    $('od-search').value = state.q;
    $('od-service').value = state.service;
    $('od-search').addEventListener('input', function () { state.q = this.value.trim(); render(); });
    $('od-service').addEventListener('change', function () { state.service = this.value; render(); });
    $('od-status-tabs').addEventListener('click', function (e) {
      var btn = e.target.closest('.otab');
      if (!btn) return;
      state.status = btn.getAttribute('data-tab');
      this.querySelectorAll('.otab').forEach(function (b) {
        b.className = 'otab px-3 py-1.5 rounded-lg text-xs transition ' + (b === btn ? 'font-semibold bg-violet-500 text-white' : 'font-medium text-slate-500 hover:bg-slate-200');
      });
      render();
    });

    /* Status actions */
    $('od-tbody').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-act]');
      if (!btn) return;
      var act = btn.getAttribute('data-act'), id = btn.getAttribute('data-id');
      var orders = allOrders();
      var order = orders.find(function (o) { return o.id === id; });
      if (!order) return;
      if (act === 'confirm') { order.status = 'Confirmed'; showToast('Đã xác nhận đơn ' + order.id + ' cho ' + order.customerName + '!'); }
      if (act === 'reject') { order.status = 'Rejected'; showToast('Đã từ chối đơn ' + order.id + '.', 'warning'); }
      if (act === 'complete') { order.status = 'Completed'; showToast('Đã đánh dấu đơn ' + order.id + ' hoàn thành!'); }
      saveOrders(orders);
      render();
    });

    render();
  })();

})();

/* ---------- Trang: partner-profile.html (chi chay khi body[data-page="partner-profile"]) ---------- */
(function () {
  if (document.body.getAttribute('data-page') !== 'partner-profile') return;

  (function () {
    var user = twCurrentUser();
    if (!user) return;
    var $ = function (id) { return document.getElementById(id); };

    function getProfile() { return twGet(TW_KEYS.partnerProfile, {}); }
    var TYPE_ICONS = { 'Tour': 'fa-person-hiking', 'Homestay': 'fa-house-chimney', 'Dịch vụ': 'fa-concierge-bell' };

    function fillHeader() {
      var p = getProfile();
      var company = p.company || user.name;
      $('pp-initials').textContent = company.trim().split(/\s+/).slice(-2).map(function (w) { return w.charAt(0); }).join('').toUpperCase();
      $('pp-company').textContent = company;
      $('pp-verified').classList.toggle('hidden', !p.verified);
      $('pp-address').innerHTML = '<i class="fa-solid fa-location-dot mr-1"></i>' + twEscapeHtml(p.address || '');
      $('pp-stars').innerHTML = twStars(p.rating || 0);
      $('pp-rating').textContent = (p.rating || 0) + ' / 5';
      $('pp-reviews').textContent = twFormatCompact(p.reviewsCount || 0);
      $('pp-services').textContent = twGet(TW_KEYS.activities, []).length;
      $('pp-desc').textContent = p.description || '';
      $('pp-contact').innerHTML =
        '<div class="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5 text-slate-600"><i class="fa-solid fa-phone text-violet-400"></i>' + twEscapeHtml(p.phone || '–') + '</div>' +
        '<div class="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5 text-slate-600"><i class="fa-solid fa-envelope text-violet-400"></i>' + twEscapeHtml(p.email || '–') + '</div>' +
        '<div class="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5 text-slate-600"><i class="fa-regular fa-clock text-violet-400"></i>' + twEscapeHtml(p.hours || '–') + '</div>';
    }

    function fillForm() {
      var p = getProfile();
      $('pp-in-company').value = p.company || user.name;
      $('pp-in-address').value = p.address || '';
      $('pp-in-phone').value = p.phone || '';
      $('pp-in-email').value = p.email || '';
      $('pp-in-hours').value = p.hours || '';
      $('pp-in-desc').value = p.description || '';
    }

    function renderServices() {
      var acts = twGet(TW_KEYS.activities, []);
      $('pp-service-list').innerHTML = acts.length ? acts.map(function (a) {
        return '<div class="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition">' +
          '<div class="flex items-center gap-3 min-w-0">' +
            '<span class="w-9 h-9 rounded-xl ph-img ph-violet text-sm shrink-0"><i class="fa-solid ' + (TYPE_ICONS[a.type] || 'fa-store') + '"></i></span>' +
            '<div class="min-w-0"><p class="text-sm font-semibold text-slate-800 truncate">' + twEscapeHtml(a.title) + '</p>' +
            '<p class="text-[11px] text-slate-400">' + twEscapeHtml(a.location) + ' · ' + twFormatMoney(a.price) + ' / khách</p></div>' +
          '</div>' + twStatusPill(a.status) +
        '</div>';
      }).join('') : '<p class="text-sm text-slate-400 text-center py-6">Chưa có dịch vụ nào.</p>';
    }

    $('pp-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var p = getProfile();
      var company = $('pp-in-company').value.trim();
      if (!company) { showToast('Vui lòng nhập tên công ty!', 'error'); return; }
      var email = $('pp-in-email').value.trim();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast('Email không hợp lệ!', 'error'); return; }
      p.company = company;
      p.address = $('pp-in-address').value.trim();
      p.phone = $('pp-in-phone').value.trim();
      p.email = email;
      p.hours = $('pp-in-hours').value.trim();
      p.description = $('pp-in-desc').value.trim();
      twSet(TW_KEYS.partnerProfile, p);
      /* đồng bộ tên hiển thị ở users */
      var users = twGet(TW_KEYS.users, []);
      var me = users.find(function (u) { return u.id === user.id; });
      if (me) { me.name = company; twSet(TW_KEYS.users, users); twSetCurrentUser(me); }
      fillHeader();
      showToast('Đã lưu thông tin doanh nghiệp!');
      setTimeout(function () { location.reload(); }, 800);
    });

    fillHeader(); fillForm(); renderServices();
  })();

})();

