/* =====================================================================
   TripWeave AI – pages/guide/guide.js
   Script RIÊNG của các trang GUIDE – HDV (4 trang), nạp SAU js/main.js:
     • guide-curated-collections  • guide-dashboard
     • guide-profile              • guide-trip-review
   Mỗi trang = 1 module IIFE với guard body[data-page] → chỉ module của
   trang đang mở chạy, các module khác thoát ngay dòng đầu tiên.
   Logic gốc được giữ nguyên 100% (tách từ khối <script> inline cũ).
   ===================================================================== */


/* ---------- Trang: guide-curated-collections.html (chi chay khi body[data-page="guide-curated-collections"]) ---------- */
(function () {
  if (document.body.getAttribute('data-page') !== 'guide-curated-collections') return;

  (function () {
    var user = twCurrentUser();
    if (!user) return;
    var $ = function (id) { return document.getElementById(id); };
    var places = twGet(TW_KEYS.places, []);

    function allCols() { return twGet(TW_KEYS.collections, []); }
    function saveCols(list) { twSet(TW_KEYS.collections, list); }

    function render() {
      var cols = allCols();
      $('collections-empty').classList.toggle('hidden', cols.length > 0);
      $('collections-grid').innerHTML = cols.map(function (c) {
        var chips = (c.places || []).slice(0, 6).map(function (pid) {
          var p = places.find(function (x) { return x.id === pid; });
          if (!p) return '';
          return '<span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-medium">' + p.image + ' ' + twEscapeHtml(p.title) + '</span>';
        }).join('');
        var more = (c.places || []).length > 6 ? '<span class="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-[11px] font-bold">+' + ((c.places || []).length - 6) + '</span>' : '';
        return '<article class="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition fade-up flex flex-col">' +
          '<div class="flex items-center gap-3">' +
            '<span class="w-11 h-11 rounded-xl ph-img ph-green text-lg shrink-0"><i class="fa-solid fa-bookmark"></i></span>' +
            '<div><h3 class="font-bold text-slate-900">' + twEscapeHtml(c.title) + '</h3>' +
            '<p class="text-xs text-slate-400">' + (c.itemsCount || (c.places || []).length) + ' địa điểm</p></div>' +
          '</div>' +
          '<p class="mt-3 text-sm text-slate-600 flex-1">' + twEscapeHtml(c.description || '') + '</p>' +
          '<div class="mt-3 flex flex-wrap gap-1.5">' + chips + more + '</div>' +
          '<div class="mt-4 flex gap-2">' +
            '<button type="button" data-act="edit" data-id="' + c.id + '" class="flex-1 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"><i class="fa-solid fa-pen mr-1.5"></i>Chỉnh sửa</button>' +
            '<button type="button" data-act="delete" data-id="' + c.id + '" class="py-2 px-3 rounded-lg border border-red-200 text-xs font-semibold text-red-500 hover:bg-red-50 transition"><i class="fa-solid fa-trash-can"></i></button>' +
          '</div>' +
        '</article>';
      }).join('');
    }

    /* Form */
    function renderPlacePicker(filter, selected) {
      var q = (filter || '').toLowerCase();
      var list = places.filter(function (p) { return !q || (p.title + ' ' + p.location + ' ' + p.category).toLowerCase().indexOf(q) !== -1; });
      $('cf-places').innerHTML = list.map(function (p) {
        var on = (selected || []).indexOf(p.id) !== -1;
        return '<label class="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-emerald-50/60 transition ' + (on ? 'bg-emerald-50' : '') + '">' +
          '<input type="checkbox" name="cf-place" value="' + p.id + '"' + (on ? ' checked' : '') + ' class="accent-emerald-600">' +
          '<span class="text-xl">' + p.image + '</span>' +
          '<span class="flex-1 min-w-0"><span class="block text-sm font-semibold text-slate-800 truncate">' + twEscapeHtml(p.title) + '</span>' +
          '<span class="block text-[11px] text-slate-400">' + twEscapeHtml(p.location) + ' · ' + twEscapeHtml(p.category) + ' · ' + p.rating + ' ★</span></span>' +
        '</label>';
      }).join('') || '<p class="text-sm text-slate-400 text-center py-4">Không tìm thấy địa điểm.</p>';
      updateCount();
    }
    function updateCount() {
      $('cf-count').textContent = '(' + document.querySelectorAll('input[name="cf-place"]:checked').length + ')';
    }
    function openForm(col) {
      $('col-modal-title').innerHTML = col ? '<i class="fa-solid fa-pen text-emerald-500 mr-2"></i>Chỉnh sửa bộ sưu tập' : '<i class="fa-solid fa-bookmark text-emerald-500 mr-2"></i>Tạo bộ sưu tập';
      $('cf-id').value = col ? col.id : '';
      $('cf-title').value = col ? col.title : '';
      $('cf-desc').value = col ? col.description : '';
      $('cf-search').value = '';
      renderPlacePicker('', col ? col.places : []);
      openModal('modal-col');
    }
    $('btn-new-col').addEventListener('click', function () { openForm(null); });
    $('cf-search').addEventListener('input', function () {
      var selected = Array.prototype.slice.call(document.querySelectorAll('input[name="cf-place"]:checked')).map(function (c) { return c.value; });
      renderPlacePicker(this.value.trim(), selected);
    });
    $('cf-places').addEventListener('change', updateCount);
    $('col-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var title = $('cf-title').value.trim();
      if (!title) { showToast('Vui lòng nhập tên bộ sưu tập!', 'error'); return; }
      var picked = Array.prototype.slice.call(document.querySelectorAll('input[name="cf-place"]:checked')).map(function (c) { return c.value; });
      if (!picked.length) { showToast('Chọn ít nhất 1 địa điểm!', 'error'); return; }
      var cols = allCols();
      var id = $('cf-id').value;
      if (id) {
        var col = cols.find(function (c) { return c.id === id; });
        col.title = title; col.description = $('cf-desc').value.trim(); col.places = picked; col.itemsCount = picked.length;
        showToast('Đã cập nhật bộ sưu tập "' + title + '"!');
      } else {
        cols.unshift({ id: twUid('c'), title: title, description: $('cf-desc').value.trim(), itemsCount: picked.length, places: picked, createdBy: user.name });
        showToast('Đã tạo bộ sưu tập "' + title + '" với ' + picked.length + ' địa điểm!');
      }
      saveCols(cols);
      closeModal('modal-col');
      render();
    });

    /* Delete */
    var pendingDeleteId = null;
    $('collections-grid').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-act]');
      if (!btn) return;
      var act = btn.getAttribute('data-act'), id = btn.getAttribute('data-id');
      var col = allCols().find(function (c) { return c.id === id; });
      if (!col) return;
      if (act === 'edit') openForm(col);
      if (act === 'delete') {
        pendingDeleteId = id;
        $('delete-col-name').textContent = 'Bộ sưu tập "' + col.title + '" sẽ bị xóa vĩnh viễn.';
        openModal('modal-delete-col');
      }
    });
    $('confirm-delete-col').addEventListener('click', function () {
      if (!pendingDeleteId) return;
      saveCols(allCols().filter(function (c) { return c.id !== pendingDeleteId; }));
      pendingDeleteId = null;
      closeModal('modal-delete-col');
      render(); showToast('Đã xóa bộ sưu tập.', 'info');
    });

    render();
  })();

})();

/* ---------- Trang: guide-dashboard.html (chi chay khi body[data-page="guide-dashboard"]) ---------- */
(function () {
  if (document.body.getAttribute('data-page') !== 'guide-dashboard') return;

  (function () {
    var user = twCurrentUser();
    if (!user) return;
    var $ = function (id) { return document.getElementById(id); };
    var profile = twGet(TW_KEYS.guideProfile, {});
    var trips = twGet(TW_KEYS.trips, []);
    var users = twGet(TW_KEYS.users, []);
    var reviews = twGet(TW_KEYS.reviews, []).filter(function (r) { return r.target === 'guide'; });
    var collections = twGet(TW_KEYS.collections, []);
    var pending = trips.filter(function (t) { return t.status === 'Chờ review'; });

    $('hello-name').textContent = user.name;
    $('st-pending').textContent = pending.length;
    $('st-collections').textContent = collections.length;
    $('st-rating').textContent = profile.avgRating || '–';
    $('st-views').textContent = twFormatCompact(profile.views || 0);

    /* Profile card */
    var initials = (profile.name || user.name).trim().split(/\s+/).slice(-2).map(function (w) { return w.charAt(0); }).join('').toUpperCase();
    $('profile-initials').textContent = initials;
    $('profile-name').textContent = profile.name || user.name;
    $('profile-title').textContent = profile.title || 'Hướng dẫn viên bản địa';
    $('profile-bio').textContent = profile.bio || '';
    $('profile-tours').textContent = profile.tours || 0;
    $('profile-exp').textContent = profile.experience || '–';
    $('profile-reviews').textContent = profile.reviewsCount || 0;

    /* Pending trips */
    $('pending-list').innerHTML = pending.length ? pending.map(function (t) {
      var owner = users.find(function (u) { return u.id === t.ownerId; });
      return '<div class="flex items-center gap-3 p-3 rounded-xl border border-amber-100 bg-amber-50/50 hover:bg-amber-50 transition">' +
        '<span class="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0"><i class="fa-solid fa-route"></i></span>' +
        '<div class="flex-1 min-w-0">' +
          '<p class="text-sm font-bold text-slate-800 truncate">' + twEscapeHtml(t.title) + '</p>' +
          '<p class="text-xs text-slate-500">' + twEscapeHtml(owner ? owner.name : 'Du khách') + ' · ' + twEscapeHtml(t.destination) + ' · ' + (t.itineraryDays || []).length + ' ngày · ' + twFormatMoney(t.budget) + '</p>' +
        '</div>' +
        '<a href="guide-trip-review.html?trip=' + t.id + '" class="px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow transition shrink-0">Review <i class="fa-solid fa-arrow-right ml-1"></i></a>' +
      '</div>';
    }).join('') : '<p class="text-sm text-slate-400 text-center py-6"><i class="fa-solid fa-circle-check text-emerald-400 mr-1"></i>Tuyệt vời! Không còn lịch trình nào chờ review.</p>';

    /* Reviews */
    $('review-list').innerHTML = reviews.length ? reviews.map(function (r) {
      return '<div class="flex gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition">' +
        '<span class="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0">' + twEscapeHtml(r.author.trim().split(/\s+/).slice(-2).map(function (w) { return w.charAt(0); }).join('').toUpperCase()) + '</span>' +
        '<div class="flex-1 min-w-0">' +
          '<div class="flex items-center justify-between gap-2"><p class="text-sm font-semibold text-slate-800">' + twEscapeHtml(r.author) + '</p><span class="text-[11px] text-slate-400">' + twEscapeHtml(r.date) + '</span></div>' +
          '<div class="mt-0.5">' + twStars(r.rating) + '</div>' +
          '<p class="mt-1 text-sm text-slate-600">' + twEscapeHtml(r.comment) + '</p>' +
        '</div>' +
      '</div>';
    }).join('') : '<p class="text-sm text-slate-400 text-center py-4">Chưa có đánh giá nào.</p>';

    /* Chart: lịch trình đã duyệt theo 6 tháng gần nhất */
    var labels = [], values = [];
    var now = new Date();
    for (var i = 5; i >= 0; i--) {
      var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push('T' + (d.getMonth() + 1));
      values.push(trips.filter(function (t) {
        if (t.status !== 'Approved') return false;
        var sd = (t.startDate || '').split('-');
        return Number(sd[0]) === d.getFullYear() && Number(sd[1]) === d.getMonth() + 1;
      }).length);
    }
    twRenderBarChart('chart-approved', labels, values, '#10B981', '');
  })();

})();

/* ---------- Trang: guide-profile.html (chi chay khi body[data-page="guide-profile"]) ---------- */
(function () {
  if (document.body.getAttribute('data-page') !== 'guide-profile') return;

  (function () {
    var user = twCurrentUser();
    if (!user) return;
    var $ = function (id) { return document.getElementById(id); };

    function getProfile() { return twGet(TW_KEYS.guideProfile, {}); }

    function fillHeader() {
      var p = getProfile();
      var name = p.name || user.name;
      $('pf-initials').textContent = name.trim().split(/\s+/).slice(-2).map(function (w) { return w.charAt(0); }).join('').toUpperCase();
      $('pf-name').textContent = name;
      $('pf-title').textContent = p.title || 'Hướng dẫn viên bản địa';
      $('pf-stars').innerHTML = twStars(p.avgRating || 0);
      $('pf-rating').textContent = (p.avgRating || 0) + ' / 5';
      $('pf-views').textContent = twFormatCompact(p.views || 0);
      $('pf-bio').textContent = p.bio || '';
      $('pf-tours').textContent = p.tours || 0;
      $('pf-exp').textContent = p.experience || '–';
      $('pf-reviews').textContent = p.reviewsCount || 0;
      var tags = [];
      if (p.specialties) tags = tags.concat(p.specialties.split(',').map(function (s) { return s.trim(); }).filter(Boolean));
      if (p.regions) tags.push(p.regions);
      if (p.languages) tags.push('Ngôn ngữ: ' + p.languages);
      $('pf-tags').innerHTML = tags.map(function (t) { return '<span class="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-medium">' + twEscapeHtml(t) + '</span>'; }).join('');
    }

    function fillForm() {
      var p = getProfile();
      $('pf-in-name').value = p.name || user.name;
      $('pf-in-title').value = p.title || '';
      $('pf-in-specialties').value = p.specialties || '';
      $('pf-in-regions').value = p.regions || '';
      $('pf-in-experience').value = p.experience || '';
      $('pf-in-languages').value = p.languages || '';
      $('pf-in-bio').value = p.bio || '';
    }

    function renderReviews() {
      var reviews = twGet(TW_KEYS.reviews, []).filter(function (r) { return r.target === 'guide'; });
      $('pf-review-list').innerHTML = reviews.length ? reviews.map(function (r) {
        return '<div class="flex gap-3 p-3 rounded-xl border border-slate-100">' +
          '<span class="w-9 h-9 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-bold shrink-0">' + twEscapeHtml(r.author.trim().split(/\s+/).slice(-2).map(function (w) { return w.charAt(0); }).join('').toUpperCase()) + '</span>' +
          '<div class="flex-1 min-w-0">' +
            '<div class="flex items-center justify-between gap-2"><p class="text-sm font-semibold text-slate-800">' + twEscapeHtml(r.author) + '</p><span class="text-[11px] text-slate-400">' + twEscapeHtml(r.date) + '</span></div>' +
            '<div class="mt-0.5">' + twStars(r.rating) + '</div>' +
            '<p class="mt-1 text-sm text-slate-600">' + twEscapeHtml(r.comment) + '</p>' +
          '</div>' +
        '</div>';
      }).join('') : '<p class="text-sm text-slate-400 text-center py-4">Chưa có đánh giá nào.</p>';
    }

    function renderPosts() {
      var p = getProfile();
      var posts = twGet(TW_KEYS.posts, []).filter(function (g) { return g.type === 'Bài viết hướng dẫn' || g.author === (p.name || user.name); });
      $('pf-post-list').innerHTML = posts.length ? posts.map(function (g) {
        return '<div class="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition">' +
          '<div class="flex items-center gap-3 min-w-0">' +
            '<span class="w-9 h-9 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center shrink-0"><i class="fa-solid fa-newspaper"></i></span>' +
            '<div class="min-w-0"><p class="text-sm font-semibold text-slate-800 truncate">' + twEscapeHtml(g.title) + '</p>' +
            '<p class="text-[11px] text-slate-400">' + twEscapeHtml(g.date) + '</p></div>' +
          '</div>' + twStatusPill(g.status) +
        '</div>';
      }).join('') : '<p class="text-sm text-slate-400 text-center py-4">Chưa có bài viết nào.</p>';
    }

    $('profile-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var p = getProfile();
      var name = $('pf-in-name').value.trim();
      if (!name) { showToast('Vui lòng nhập họ tên!', 'error'); return; }
      p.name = name;
      p.title = $('pf-in-title').value.trim();
      p.specialties = $('pf-in-specialties').value.trim();
      p.regions = $('pf-in-regions').value.trim();
      p.experience = $('pf-in-experience').value.trim();
      p.languages = $('pf-in-languages').value.trim();
      p.bio = $('pf-in-bio').value.trim();
      twSet(TW_KEYS.guideProfile, p);
      /* đồng bộ tên hiển thị ở users */
      var users = twGet(TW_KEYS.users, []);
      var me = users.find(function (u) { return u.id === user.id; });
      if (me) { me.name = name; twSet(TW_KEYS.users, users); twSetCurrentUser(me); }
      fillHeader();
      showToast('Đã lưu hồ sơ hướng dẫn viên!');
      setTimeout(function () { location.reload(); }, 800);
    });

    fillHeader(); fillForm(); renderReviews(); renderPosts();
  })();

})();

/* ---------- Trang: guide-trip-review.html (chi chay khi body[data-page="guide-trip-review"]) ---------- */
(function () {
  if (document.body.getAttribute('data-page') !== 'guide-trip-review') return;

  (function () {
    var user = twCurrentUser();
    if (!user) return;
    var $ = function (id) { return document.getElementById(id); };
    var users = twGet(TW_KEYS.users, []);
    var currentTab = 'Chờ review';
    var selectedId = twGetQueryParam('trip');

    function allTrips() { return twGet(TW_KEYS.trips, []); }
    function saveTrips(list) { twSet(TW_KEYS.trips, list); }
    function notify(role, text) {
      var notes = twGet(TW_KEYS.notifications, []);
      notes.unshift({ id: twUid('n'), role: role, text: text, time: 'Vừa xong', read: false });
      twSet(TW_KEYS.notifications, notes);
    }
    function ownerName(trip) {
      var o = users.find(function (u) { return u.id === trip.ownerId; });
      return o ? o.name : 'Du khách';
    }

    function renderQueue() {
      var list = allTrips().filter(function (t) { return currentTab === 'Tất cả' || t.status === currentTab; });
      $('trip-queue').innerHTML = list.length ? list.map(function (t) {
        var on = t.id === selectedId;
        return '<button type="button" data-trip="' + t.id + '" class="w-full text-left p-3 rounded-xl border transition ' + (on ? 'border-emerald-400 bg-emerald-50/70 shadow-sm' : 'border-slate-100 hover:border-emerald-200 hover:bg-slate-50') + '">' +
          '<p class="text-sm font-bold text-slate-800 truncate">' + twEscapeHtml(t.title) + '</p>' +
          '<p class="text-xs text-slate-500 mt-0.5">' + twEscapeHtml(ownerName(t)) + ' · ' + twEscapeHtml(t.destination) + ' · ' + (t.itineraryDays || []).length + ' ngày</p>' +
          '<div class="mt-1.5 flex items-center justify-between">' + twStatusPill(t.status) + '<span class="text-xs font-bold text-violet-600">' + twFormatMoney(t.budget) + '</span></div>' +
        '</button>';
      }).join('') : '<p class="text-sm text-slate-400 text-center py-8">Không có lịch trình nào ở mục này.</p>';
    }

    function renderReview() {
      var trip = allTrips().find(function (t) { return t.id === selectedId; });
      if (!trip) {
        $('review-empty').classList.remove('hidden');
        $('review-panel').classList.add('hidden');
        return;
      }
      $('review-empty').classList.add('hidden');
      $('review-panel').classList.remove('hidden');
      $('rv-title').textContent = trip.title;
      $('rv-meta').innerHTML = '<i class="fa-regular fa-user mr-1"></i>' + twEscapeHtml(ownerName(trip)) +
        ' · <i class="fa-solid fa-location-dot mr-1 ml-2"></i>' + twEscapeHtml(trip.destination) +
        ' · <i class="fa-regular fa-calendar mr-1 ml-2"></i>' + twEscapeHtml(trip.startDate) + ' → ' + twEscapeHtml(trip.endDate) +
        ' · <i class="fa-solid fa-sack-dollar mr-1 ml-2"></i>' + twFormatMoney(trip.budget);
      $('rv-status').innerHTML = twStatusPill(trip.status);
      $('rv-interests').innerHTML = (trip.interests || []).map(function (i) { return '<span class="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-medium">#' + twEscapeHtml(i) + '</span>'; }).join('');
      $('rv-days').innerHTML = (trip.itineraryDays || []).map(function (d) {
        var saved = (trip.dayComments || {})[d.day] || '';
        return '<div class="bg-white rounded-2xl border border-slate-200 p-4">' +
          '<div class="flex items-center gap-3">' +
            '<span class="w-10 h-10 rounded-xl bg-emerald-500 text-white text-sm font-bold flex items-center justify-center shrink-0 shadow">D' + d.day + '</span>' +
            '<div><p class="font-bold text-slate-900 text-sm">Ngày ' + d.day + ' – ' + twEscapeHtml(d.place) + '</p><p class="text-xs text-slate-400">' + d.items.length + ' hoạt động</p></div>' +
          '</div>' +
          '<div class="mt-3 ml-5 border-l-2 border-emerald-100 pl-4 space-y-2">' +
            d.items.map(function (it) {
              return '<div class="relative"><span class="absolute -left-[1.42rem] top-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white"></span>' +
                '<p class="text-xs font-mono text-emerald-600 font-bold">' + it.time + '</p><p class="text-sm text-slate-700">' + twEscapeHtml(it.title) + '</p></div>';
            }).join('') +
          '</div>' +
          '<div class="mt-3"><input type="text" data-day-comment="' + d.day + '" value="' + twEscapeHtml(saved) + '" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 bg-amber-50/40 transition" placeholder="Nhận xét riêng cho ngày ' + d.day + ' (không bắt buộc)"></div>' +
        '</div>';
      }).join('');
      $('rv-feedback').value = trip.reviewFeedback || '';
      var isPending = trip.status === 'Chờ review';
      $('btn-approve').classList.toggle('hidden', !isPending);
      $('btn-reject').classList.toggle('hidden', !isPending);
      $('rv-feedback').disabled = !isPending;
      $('rv-done').classList.toggle('hidden', isPending);
      if (!isPending) $('rv-done').textContent = trip.status === 'Approved' ? '✓ Lịch trình này đã được duyệt. Phản hồi đã gửi tới du khách.' : '✗ Lịch trình này đã bị từ chối với phản hồi đã gửi.';
    }
    function decide(status) {
      var trips = allTrips();
      var trip = trips.find(function (t) { return t.id === selectedId; });
      if (!trip || trip.status !== 'Chờ review') return;
      var feedback = $('rv-feedback').value.trim();
      if (status === 'Rejected' && !feedback) { showToast('Vui lòng nhập lý do từ chối để du khách cải thiện!', 'error'); return; }
      var dayComments = {};
      document.querySelectorAll('[data-day-comment]').forEach(function (el) {
        var v = el.value.trim();
        if (v) dayComments[el.getAttribute('data-day-comment')] = v;
      });
      trip.status = status;
      trip.reviewFeedback = feedback;
      trip.dayComments = dayComments;
      saveTrips(trips);
      notify('traveler', status === 'Approved' ? 'Lịch trình "' + trip.title + '" đã được hướng dẫn viên duyệt! 🎉' : 'Lịch trình "' + trip.title + '" bị từ chối. Xem phản hồi để chỉnh sửa nhé.');
      showToast(status === 'Approved' ? 'Đã duyệt lịch trình và gửi phản hồi cho du khách!' : 'Đã từ chối kèm phản hồi cho du khách.', status === 'Approved' ? 'success' : 'warning');
      renderQueue(); renderReview();
    }
    $('btn-approve').addEventListener('click', function () { decide('Approved'); });
    $('btn-reject').addEventListener('click', function () { decide('Rejected'); });

    $('queue-tabs').addEventListener('click', function (e) {
      var btn = e.target.closest('.qtab');
      if (!btn) return;
      currentTab = btn.getAttribute('data-tab');
      this.querySelectorAll('.qtab').forEach(function (b) {
        b.className = 'qtab flex-1 px-2 py-1.5 rounded-lg text-xs transition ' + (b === btn ? 'font-semibold bg-emerald-500 text-white' : 'font-medium text-slate-500 hover:bg-slate-200');
      });
      renderQueue();
    });
    $('trip-queue').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-trip]');
      if (btn) { selectedId = btn.getAttribute('data-trip'); renderQueue(); renderReview(); }
    });

    renderQueue(); renderReview();
  })();

})();

