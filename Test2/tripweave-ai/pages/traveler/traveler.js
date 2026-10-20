/* =====================================================================
   TripWeave AI – pages/traveler/traveler.js
   Script RIÊNG của các trang TRAVELER (4 trang), nạp SAU js/main.js:
     • traveler-ai-itinerary  • traveler-discover
     • traveler-tours         • traveler-trip-planner
   Mỗi trang = 1 module IIFE với guard body[data-page] → chỉ module của
   trang đang mở chạy, các module khác thoát ngay dòng đầu tiên.
   Logic gốc được giữ nguyên 100% (tách từ khối <script> inline cũ).
   ===================================================================== */


/* ---------- Trang: traveler-ai-itinerary.html (chi chay khi body[data-page="traveler-ai-itinerary"]) ---------- */
(function () {
  if (document.body.getAttribute('data-page') !== 'traveler-ai-itinerary') return;

  (function () {
    var user = twCurrentUser();
    if (!user) return;
    var $ = function (id) { return document.getElementById(id); };
    var places = twGet(TW_KEYS.places, []);
    var INTERESTS = ['Thiên nhiên', 'Văn hóa', 'Ẩm thực', 'Nghỉ dưỡng', 'Trekking'];
    var ICONS = { 'Thiên nhiên': 'fa-mountain-sun', 'Văn hóa': 'fa-landmark', 'Ẩm thực': 'fa-utensils', 'Nghỉ dưỡng': 'fa-spa', 'Trekking': 'fa-person-hiking' };
    var current = null; /* kết quả AI hiện tại */

    /* --- Preferences UI --- */
    var locs = places.map(function (p) { return p.location; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
    $('ai-destination').innerHTML = '<option value="Tất cả">Toàn quốc – AI tự chọn</option>' + locs.map(function (l) { return '<option>' + l + '</option>'; }).join('');
    $('ai-interests').innerHTML = INTERESTS.map(function (i, idx) {
      return '<label class="cursor-pointer flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 transition has-[:checked]:border-violet-500 has-[:checked]:bg-violet-50 has-[:checked]:text-violet-700"><input type="checkbox" name="ai-interest" value="' + i + '"' + (idx < 2 ? ' checked' : '') + ' class="accent-violet-600"><i class="fa-solid ' + ICONS[i] + '"></i>' + i + '</label>';
    }).join('');
    twInitRange($('ai-budget'), function (v) { $('ai-budget-label').textContent = v.toLocaleString('vi-VN') + 'đ'; });

    /* --- AI generator (mô phỏng) --- */
    var STEPS = [
      { t: 650, msg: 'AI đang phân tích sở thích của bạn...', pct: 20 },
      { t: 700, msg: 'Đang lọc địa điểm phù hợp theo ngân sách...', pct: 45 },
      { t: 700, msg: 'Đang tối ưu cung đường & nhịp độ...', pct: 70 },
      { t: 650, msg: 'Sắp xếp lịch trình 5 ngày hoàn chỉnh...', pct: 92 },
      { t: 500, msg: 'Hoàn tất! Đây là hành trình của bạn ✨', pct: 100 }
    ];
    function generate() {
      var dest = $('ai-destination').value;
      var interests = Array.prototype.slice.call(document.querySelectorAll('input[name="ai-interest"]:checked')).map(function (c) { return c.value; });
      var budget = Number($('ai-budget').value);
      var pace = $('ai-pace').value;
      var note = $('ai-note').value.trim();
      if (!interests.length) { showToast('Chọn ít nhất 1 phong cách chuyến đi!', 'error'); return; }

      $('ai-empty').classList.add('hidden');
      $('ai-result').classList.add('hidden');
      $('ai-loading').classList.remove('hidden');
      $('ai-progress').style.width = '8%';
      var stepIdx = 0;
      function nextStep() {
        if (stepIdx >= STEPS.length) {
          $('ai-loading').classList.add('hidden');
          current = buildItinerary(dest, interests, budget, pace, note);
          twSet(TW_KEYS.tripDraft, current);
          renderResult(current);
          return;
        }
        var s = STEPS[stepIdx++];
        $('ai-loading-text').textContent = s.msg;
        $('ai-progress').style.width = s.pct + '%';
        setTimeout(nextStep, s.t);
      }
      nextStep();
    }

    function buildItinerary(dest, interests, budget, pace, note) {
      var pool = places.filter(function (p) {
        var matchCat = interests.indexOf(p.category) !== -1 || (p.tags || []).some(function (t) { return interests.indexOf(t) !== -1; });
        var matchLoc = dest === 'Tất cả' || p.location === dest;
        return matchCat && matchLoc && p.price <= budget / 3;
      }).sort(function (a, b) { return b.rating - a.rating; });
      if (pool.length < 3) {
        pool = places.filter(function (p) { return dest === 'Tất cả' || p.location === dest; }).sort(function (a, b) { return b.rating - a.rating; });
      }
      if (!pool.length) pool = places.slice(0);
      var foods = places.filter(function (p) { return p.category === 'Ẩm thực'; });
      var paceLabel = { relax: 'Thư thả', balanced: 'Cân bằng', active: 'Năng động' }[pace];
      var slots = pace === 'relax' ? 2 : 3;
      var destName = dest === 'Tất cả' ? pool[0].location : dest;
      var days = [];
      for (var d = 0; d < 5; d++) {
        var main = pool[d % pool.length];
        var food = foods.length ? foods[d % foods.length] : null;
        var items = [{ time: '09:00', title: 'Tham quan ' + main.title }];
        if (slots >= 3) items.push({ time: '14:00', title: 'Trải nghiệm ' + (main.tags[0] ? main.tags[0].toLowerCase() : main.category.toLowerCase()) + ' tại ' + main.location });
        if (slots >= 2) items.push({ time: '18:30', title: food ? 'Ăn tối – ' + food.title : 'Ăn tối đặc sản địa phương' });
        if (pace === 'relax' && items.length > 2) items.splice(1, 1);
        days.push({ day: d + 1, place: main.location, items: items });
      }
      return {
        title: 'Hành trình ' + destName + ' – ' + interests.slice(0, 2).join(' & '),
        destination: destName, interests: interests, budget: budget, pace: paceLabel, note: note,
        startDate: '', endDate: '', status: 'Saved', reviewFeedback: '', dayComments: {}, itineraryDays: days,
        createdAt: new Date().toISOString()
      };
    }
    /* --- Render result --- */
    function renderResult(r) {
      $('ai-title').textContent = r.title;
      $('ai-meta').innerHTML = '<i class="fa-solid fa-location-dot mr-1"></i>' + twEscapeHtml(r.destination) +
        ' · <i class="fa-solid fa-sack-dollar mr-1 ml-2"></i>' + twFormatMoney(r.budget) +
        ' · <i class="fa-solid fa-gauge-high mr-1 ml-2"></i>Nhịp độ: ' + twEscapeHtml(r.pace) +
        ' · <i class="fa-regular fa-calendar mr-1 ml-2"></i>5 ngày' +
        (r.note ? '<br><i class="fa-regular fa-note-sticky mr-1 mt-1"></i>Ghi chú: ' + twEscapeHtml(r.note) : '');
      $('ai-timeline').innerHTML = r.itineraryDays.map(function (d) {
        return '<div class="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition fade-up">' +
          '<div class="flex items-center gap-3">' +
            '<span class="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-sm font-bold flex items-center justify-center shrink-0 shadow">D' + d.day + '</span>' +
            '<div><p class="font-bold text-slate-900 text-sm">Ngày ' + d.day + ' – ' + twEscapeHtml(d.place) + '</p>' +
            '<p class="text-xs text-slate-400">' + d.items.length + ' hoạt động</p></div>' +
          '</div>' +
          '<div class="mt-3 ml-5 border-l-2 border-violet-100 pl-4 space-y-2.5">' +
            d.items.map(function (it) {
              return '<div class="relative"><span class="absolute -left-[1.42rem] top-1 w-2.5 h-2.5 rounded-full bg-violet-400 ring-2 ring-white"></span>' +
                '<p class="text-xs font-mono text-violet-500 font-bold">' + it.time + '</p>' +
                '<p class="text-sm text-slate-700">' + twEscapeHtml(it.title) + '</p></div>';
            }).join('') +
          '</div>' +
        '</div>';
      }).join('');
      $('ai-result').classList.remove('hidden');
    }

    /* --- Actions --- */
    function persist(status, thenGo) {
      if (!current) return;
      var trips = twGet(TW_KEYS.trips, []);
      var today = new Date();
      var start = new Date(today.getTime() + 7 * 864e5);
      var end = new Date(start.getTime() + 4 * 864e5);
      var fmt = function (dt) { return dt.toISOString().slice(0, 10); };
      var trip = Object.assign({}, current, {
        id: twUid('t'), ownerId: user.id, status: status,
        startDate: current.startDate || fmt(start), endDate: current.endDate || fmt(end)
      });
      delete trip.pace; delete trip.note; delete trip.createdAt;
      trips.unshift(trip);
      twSet(TW_KEYS.trips, trips);
      if (status === 'Chờ review') {
        var notes = twGet(TW_KEYS.notifications, []);
        notes.unshift({ id: twUid('n'), role: 'guide', text: 'Lịch trình AI "' + trip.title + '" đang chờ bạn review.', time: 'Vừa xong', read: false });
        twSet(TW_KEYS.notifications, notes);
      }
      twRemove(TW_KEYS.tripDraft);
      showToast(status === 'Chờ review' ? 'Đã lưu & gửi lịch trình tới hướng dẫn viên!' : 'Đã lưu lịch trình vào "Chuyến đi của tôi"!');
      if (thenGo) setTimeout(function () { location.href = 'traveler-trip-planner.html'; }, 900);
    }
    $('ai-form').addEventListener('submit', function (e) { e.preventDefault(); generate(); });
    $('ai-regenerate').addEventListener('click', function () { $('ai-result').classList.add('hidden'); generate(); });
    $('ai-save').addEventListener('click', function () { persist('Saved', true); });
    $('ai-submit').addEventListener('click', function () { persist('Chờ review', true); });

    /* --- Restore draft nếu có --- */
    var draft = twGet(TW_KEYS.tripDraft, null);
    if (draft && draft.itineraryDays) {
      current = draft;
      $('ai-empty').classList.add('hidden');
      renderResult(draft);
      showToast('Đã khôi phục bản nháp AI chưa lưu.', 'info');
    }
  })();

})();

/* ---------- Trang: traveler-discover.html (chi chay khi body[data-page="traveler-discover"]) ---------- */
(function () {
  if (document.body.getAttribute('data-page') !== 'traveler-discover') return;

  (function () {
    var user = twCurrentUser();
    if (!user) return;
    var $ = function (id) { return document.getElementById(id); };
    var places = twGet(TW_KEYS.places, []);
    var state = { q: twGetQueryParam('q') || '', cat: 'Tất cả', loc: 'Tất cả', budget: 2500000, rating: 0 };

    function savedCol() {
      var cols = twGet(TW_KEYS.collections, []);
      var id = 'c-saved-' + user.id;
      var col = cols.find(function (c) { return c.id === id; });
      if (!col) {
        col = { id: id, title: 'Địa điểm đã lưu của ' + user.name, description: 'Tự động tạo', itemsCount: 0, places: [] };
        cols.push(col); twSet(TW_KEYS.collections, cols);
      }
      return col;
    }
    function updateSavedCount() { $('saved-count').textContent = savedCol().places.length; }

    function render() {
      var list = places.filter(function (p) {
        var q = state.q.toLowerCase();
        var matchQ = !q || (p.title + ' ' + p.location + ' ' + p.tags.join(' ')).toLowerCase().indexOf(q) !== -1;
        return matchQ && (state.cat === 'Tất cả' || p.category === state.cat) && (state.loc === 'Tất cả' || p.location === state.loc) && p.price <= state.budget && p.rating >= state.rating;
      });
      $('places-count').textContent = '(' + list.length + ' địa điểm)';
      $('places-empty').classList.toggle('hidden', list.length > 0);
      var saved = savedCol().places;
      $('places-grid').innerHTML = list.map(function (p) {
        var isSaved = saved.indexOf(p.id) !== -1;
        return '<div class="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition fade-up">' +
          '<div class="ph-img h-28 text-5xl">' + p.image + '</div>' +
          '<div class="p-4">' +
            '<div class="flex items-start justify-between gap-2">' +
              '<div><h3 class="font-bold text-slate-900 text-sm leading-snug">' + twEscapeHtml(p.title) + '</h3>' +
              '<p class="text-xs text-slate-500 mt-0.5"><i class="fa-solid fa-location-dot mr-1"></i>' + twEscapeHtml(p.location) + '</p></div>' +
              '<span class="px-2 py-1 rounded-lg text-[11px] font-semibold bg-emerald-100 text-emerald-700 shrink-0">' + twEscapeHtml(p.category) + '</span>' +
            '</div>' +
            '<div class="mt-2 flex items-center gap-1.5 text-xs text-slate-500">' + twStars(p.rating) + '<span class="font-semibold text-slate-700">' + p.rating + '</span><span>(' + twFormatCompact(p.reviews) + ')</span></div>' +
            '<p class="mt-1.5 text-sm font-bold text-violet-600">' + twFormatMoney(p.price) + '</p>' +
            '<div class="mt-3 flex gap-1.5">' +
              '<button type="button" data-act="detail" data-id="' + p.id + '" class="flex-1 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">Chi tiết</button>' +
              '<button type="button" data-act="save" data-id="' + p.id + '" title="Lưu địa điểm" class="w-9 h-9 rounded-lg border ' + (isSaved ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 text-slate-400 hover:text-blue-500') + ' transition"><i class="' + (isSaved ? 'fa-solid' : 'fa-regular') + ' fa-bookmark"></i></button>' +
              '<button type="button" data-act="share" data-id="' + p.id + '" title="Chia sẻ" class="w-9 h-9 rounded-lg border border-slate-200 text-slate-400 hover:text-violet-500 transition"><i class="fa-solid fa-share-nodes"></i></button>' +
            '</div>' +
          '</div></div>';
      }).join('');
      updateSavedCount();
    }

    function toggleSave(placeId) {
      var cols = twGet(TW_KEYS.collections, []);
      var col = cols.find(function (c) { return c.id === 'c-saved-' + user.id; });
      if (!col) { col = { id: 'c-saved-' + user.id, title: 'Địa điểm đã lưu của ' + user.name, description: 'Tự động tạo', itemsCount: 0, places: [] }; cols.push(col); }
      var i = col.places.indexOf(placeId);
      var added = i === -1;
      if (added) col.places.push(placeId); else col.places.splice(i, 1);
      col.itemsCount = col.places.length;
      twSet(TW_KEYS.collections, cols);
      render(); renderSavedList();
      showToast(added ? 'Đã lưu vào bộ sưu tập của bạn!' : 'Đã bỏ lưu địa điểm.', added ? 'success' : 'info');
    }

    /* Filters */
    var cats = twGet(TW_KEYS.categories, []).filter(function (c) { return c.active; });
    $('f-category').innerHTML = '<option>Tất cả</option>' + cats.map(function (c) { return '<option>' + c.name + '</option>'; }).join('');
    var locs = places.map(function (p) { return p.location; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
    $('f-location').innerHTML = '<option>Tất cả</option>' + locs.map(function (l) { return '<option>' + l + '</option>'; }).join('');
    $('f-search').value = state.q;
    twInitRange($('f-budget'), function (v) {
      state.budget = v;
      $('f-budget-label').textContent = v >= 2500000 ? 'Tất cả mức giá' : v.toLocaleString('vi-VN') + 'đ';
      render();
    });
    $('f-search').addEventListener('input', function () { state.q = this.value.trim(); render(); });
    $('f-category').addEventListener('change', function () { state.cat = this.value; render(); });
    $('f-location').addEventListener('change', function () { state.loc = this.value; render(); });
    $('f-rating').addEventListener('change', function () { state.rating = Number(this.value); render(); });
    $('f-reset').addEventListener('click', function () {
      state = { q: '', cat: 'Tất cả', loc: 'Tất cả', budget: 2500000, rating: 0 };
      $('f-search').value = ''; $('f-category').value = 'Tất cả'; $('f-location').value = 'Tất cả'; $('f-rating').value = '0';
      $('f-budget').value = 2500000; $('f-budget').dispatchEvent(new Event('input'));
      render(); showToast('Đã đặt lại bộ lọc', 'info');
    });
    /* Card actions */
    var currentPlaceId = null;
    $('places-grid').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-act]');
      if (!btn) return;
      var act = btn.getAttribute('data-act'), id = btn.getAttribute('data-id');
      if (act === 'detail') openPlace(id);
      if (act === 'save') toggleSave(id);
      if (act === 'share') openShare(id);
    });
    function openPlace(id) {
      var p = places.find(function (x) { return x.id === id; });
      if (!p) return;
      currentPlaceId = id;
      $('mp-emoji').textContent = p.image;
      $('mp-title').textContent = p.title;
      $('mp-location').innerHTML = '<i class="fa-solid fa-location-dot mr-1"></i>' + twEscapeHtml(p.location);
      $('mp-meta').innerHTML =
        '<div class="bg-slate-50 rounded-xl p-3"><p class="text-[11px] text-slate-400 font-semibold">ĐÁNH GIÁ</p><p class="font-bold text-slate-800 mt-0.5">' + p.rating + ' ★ · ' + twFormatCompact(p.reviews) + ' lượt</p></div>' +
        '<div class="bg-slate-50 rounded-xl p-3"><p class="text-[11px] text-slate-400 font-semibold">GIÁ THAM KHẢO</p><p class="font-bold text-violet-600 mt-0.5">' + twFormatMoney(p.price) + '</p></div>' +
        '<div class="bg-slate-50 rounded-xl p-3"><p class="text-[11px] text-slate-400 font-semibold">GIỜ MỞ CỬA</p><p class="font-bold text-slate-800 mt-0.5">' + twEscapeHtml(p.hours) + '</p></div>' +
        '<div class="bg-slate-50 rounded-xl p-3"><p class="text-[11px] text-slate-400 font-semibold">THỜI LƯỢNG GỢI Ý</p><p class="font-bold text-slate-800 mt-0.5">' + twEscapeHtml(p.duration) + '</p></div>';
      $('mp-description').textContent = p.description;
      $('mp-tags').innerHTML = p.tags.map(function (t) { return '<span class="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">#' + twEscapeHtml(t) + '</span>'; }).join('');
      openModal('modal-place');
    }
    $('mp-save').onclick = function () { if (currentPlaceId) toggleSave(currentPlaceId); };
    $('mp-share').onclick = function () { closeModal('modal-place'); openShare(currentPlaceId); };

    /* Share to community */
    $('share-place').innerHTML = places.map(function (p) { return '<option value="' + p.id + '">' + twEscapeHtml(p.title) + '</option>'; }).join('');
    function openShare(id) {
      $('share-title').value = ''; $('share-content').value = '';
      if (id) $('share-place').value = id;
      openModal('modal-share');
    }
    $('btn-share').addEventListener('click', function () { openShare(null); });
    $('share-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var title = $('share-title').value.trim();
      var content = $('share-content').value.trim();
      var placeId = $('share-place').value;
      if (!title || !content) { showToast('Vui lòng nhập tiêu đề và nội dung!', 'error'); return; }
      var place = places.find(function (p) { return p.id === placeId; });
      var posts = twGet(TW_KEYS.posts, []);
      posts.unshift({ id: twUid('g'), title: title, content: content, placeId: placeId, author: user.name, type: 'Chia sẻ du khách', date: new Date().toISOString().slice(0, 10), status: 'Pending', likes: 0 });
      twSet(TW_KEYS.posts, posts);
      var notes = twGet(TW_KEYS.notifications, []);
      notes.unshift({ id: twUid('n'), role: 'admin', text: 'Bài chia sẻ mới "' + title + '" đang chờ kiểm duyệt.', time: 'Vừa xong', read: false });
      twSet(TW_KEYS.notifications, notes);
      closeModal('modal-share');
      renderCommunity();
      showToast('Đã gửi bài chia sẻ! Chờ quản trị viên duyệt.' + (place ? ' (Địa điểm: ' + place.title + ')' : ''));
    });
    /* Saved list */
    function renderSavedList() {
      var saved = savedCol().places;
      $('saved-list').innerHTML = saved.length ? saved.map(function (pid) {
        var p = places.find(function (x) { return x.id === pid; });
        if (!p) return '';
        return '<div class="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition">' +
          '<span class="ph-img w-10 h-10 rounded-lg text-xl shrink-0">' + p.image + '</span>' +
          '<div class="flex-1 min-w-0"><p class="text-sm font-semibold text-slate-800 truncate">' + twEscapeHtml(p.title) + '</p><p class="text-xs text-slate-400">' + twEscapeHtml(p.location) + ' · ' + p.rating + ' ★</p></div>' +
          '<button type="button" data-unsave="' + p.id + '" class="w-8 h-8 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition" title="Bỏ lưu"><i class="fa-solid fa-trash-can"></i></button>' +
        '</div>';
      }).join('') : '<p class="text-sm text-slate-400 text-center py-6">Chưa lưu địa điểm nào. Nhấn <i class="fa-regular fa-bookmark"></i> ở thẻ địa điểm để lưu.</p>';
      updateSavedCount();
    }
    $('saved-list').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-unsave]');
      if (btn) toggleSave(btn.getAttribute('data-unsave'));
    });
    $('btn-saved').addEventListener('click', function () { renderSavedList(); openModal('modal-saved'); });

    /* Community feed */
    function renderCommunity() {
      var posts = twGet(TW_KEYS.posts, []);
      $('community-feed').innerHTML = posts.length ? posts.map(function (g) {
        var place = g.placeId ? places.find(function (p) { return p.id === g.placeId; }) : null;
        var initials = twEscapeHtml((g.author || '?').trim().split(/\s+/).slice(-2).map(function (w) { return w.charAt(0); }).join('').toUpperCase());
        return '<article class="border border-slate-100 rounded-xl p-4 hover:shadow-sm transition">' +
          '<div class="flex items-start justify-between gap-2">' +
            '<div class="flex items-center gap-2.5">' +
              '<span class="w-9 h-9 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-sm font-bold shrink-0">' + initials + '</span>' +
              '<div><p class="text-sm font-bold text-slate-900">' + twEscapeHtml(g.title) + '</p>' +
              '<p class="text-xs text-slate-400">' + twEscapeHtml(g.author) + ' · ' + twEscapeHtml(g.type) + ' · ' + twEscapeHtml(g.date) + (place ? ' · <i class="fa-solid fa-location-dot mr-0.5"></i>' + twEscapeHtml(place.title) : '') + '</p></div>' +
            '</div>' + twStatusPill(g.status) +
          '</div>' +
          (g.content ? '<p class="mt-2.5 text-sm text-slate-600 leading-relaxed">' + twEscapeHtml(g.content) + '</p>' : '') +
          '<div class="mt-3 flex items-center gap-3">' +
            '<button type="button" data-like="' + g.id + '" class="text-xs font-semibold ' + (g.likedByMe ? 'text-violet-600' : 'text-slate-500 hover:text-violet-600') + ' transition"><i class="' + (g.likedByMe ? 'fa-solid' : 'fa-regular') + ' fa-heart mr-1"></i>' + (g.likes || 0) + ' thích</button>' +
          '</div>' +
        '</article>';
      }).join('') : '<p class="text-sm text-slate-400 text-center py-6">Chưa có bài chia sẻ nào. Hãy là người đầu tiên!</p>';
    }
    $('community-feed').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-like]');
      if (!btn) return;
      var posts = twGet(TW_KEYS.posts, []);
      var post = posts.find(function (g) { return g.id === btn.getAttribute('data-like'); });
      if (!post) return;
      post.likedByMe = !post.likedByMe;
      post.likes = Math.max(0, (post.likes || 0) + (post.likedByMe ? 1 : -1));
      twSet(TW_KEYS.posts, posts);
      renderCommunity();
    });

    render(); renderCommunity(); updateSavedCount();
  })();

})();

/* ---------- Trang: traveler-tours.html (chi chay khi body[data-page="traveler-tours"]) ---------- */
(function () {
  if (document.body.getAttribute('data-page') !== 'traveler-tours') return;

  (function () {
    var user = twRequireAuth('traveler');
    if (!user) return;
    var $ = function (id) { return document.getElementById(id); };
    var state = { tab: 'tours', q: '', sort: 'popular', tourId: null };
    var PH_COLORS = ['ph-blue', 'ph-green', 'ph-violet', 'ph-amber', 'ph-emerald'];

    function allTours() { return twGet(TW_KEYS.tours, []); }
    function allBookings() { return twGet(TW_KEYS.bookings, []); }
    function myBookings() { return allBookings().filter(function (b) { return b.userId === user.id; }); }
    function saveBookings(list) { twSet(TW_KEYS.bookings, list); }
    function notifyMe(text) {
      var notes = twGet(TW_KEYS.notifications, []);
      notes.unshift({ id: twUid('n'), role: 'traveler', text: text, time: 'Vừa xong', read: false });
      twSet(TW_KEYS.notifications, notes);
    }

    /* ---------- Stats ---------- */
    function renderStats() {
      var mine = myBookings();
      var spent = mine.filter(function (b) { return b.status === 'Confirmed' || b.status === 'Completed'; })
        .reduce(function (s, b) { return s + (Number(b.amount) || 0); }, 0);
      $('st-tours').textContent = allTours().length;
      $('st-bookings').textContent = mine.length;
      $('st-pending').textContent = mine.filter(function (b) { return b.status === 'Pending'; }).length;
      $('st-spent').textContent = spent.toLocaleString('vi-VN') + 'đ';
    }

    /* ---------- Tours grid ---------- */
    function renderTours() {
      var q = state.q.toLowerCase();
      var list = allTours().filter(function (t) {
        if (!q) return true;
        return (t.title + ' ' + t.destination + ' ' + t.departure + ' ' + t.tags.join(' ')).toLowerCase().indexOf(q) !== -1;
      });
      if (state.sort === 'popular') list.sort(function (a, b) { return b.sold - a.sold; });
      else if (state.sort === 'rating') list.sort(function (a, b) { return b.rating - a.rating; });
      else if (state.sort === 'price-asc') list.sort(function (a, b) { return a.price - b.price; });
      else if (state.sort === 'price-desc') list.sort(function (a, b) { return b.price - a.price; });
      $('tour-empty').classList.toggle('hidden', list.length > 0);
      $('tour-grid').innerHTML = list.map(function (t, i) {
        var disc = t.oldPrice > t.price ? Math.round((1 - t.price / t.oldPrice) * 100) : 0;
        var tags = t.tags.map(function (x) { return '<span class="inline-block bg-blue-50 text-blue-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">' + twEscapeHtml(x) + '</span>'; }).join('');
        return '<article class="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition flex flex-col">' +
          '<div class="h-36 ph-img ' + PH_COLORS[i % PH_COLORS.length] + ' text-6xl relative cursor-pointer" data-view="' + t.id + '">' + t.emoji +
            '<span class="absolute top-3 left-3 bg-white/90 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 shadow-sm"><i class="fa-solid fa-star text-amber-400 mr-1"></i>' + t.rating + '</span>' +
            (disc ? '<span class="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm">-' + disc + '%</span>' : '') +
          '</div>' +
          '<div class="p-4 flex-1 flex flex-col gap-2">' +
            '<h3 class="font-bold text-slate-900 leading-snug">' + twEscapeHtml(t.title) + '</h3>' +
            '<div class="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">' +
              '<span><i class="fa-solid fa-location-dot mr-1 text-blue-500"></i>' + twEscapeHtml(t.destination) + '</span>' +
              '<span><i class="fa-regular fa-clock mr-1 text-blue-500"></i>' + twEscapeHtml(t.duration) + '</span>' +
              '<span><i class="fa-solid fa-van-shuttle mr-1 text-blue-500"></i>Từ ' + twEscapeHtml(t.departure) + '</span>' +
            '</div>' +
            '<div class="flex flex-wrap gap-1">' + tags + '</div>' +
            '<div class="mt-auto flex items-end justify-between pt-2">' +
              '<div><p class="text-[11px] text-slate-400 line-through">' + twFormatMoney(t.oldPrice) + '</p>' +
              '<p class="text-lg font-bold text-blue-600">' + twFormatMoney(t.price) + '<span class="text-xs font-medium text-slate-400"> /người</span></p></div>' +
              '<span class="text-[11px] text-slate-400"><i class="fa-solid fa-fire text-orange-400"></i> Đã bán ' + t.sold + '</span>' +
            '</div>' +
            '<div class="flex gap-2 pt-1">' +
              '<button type="button" data-view="' + t.id + '" class="flex-1 py-2 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 text-xs font-semibold transition"><i class="fa-regular fa-eye mr-1"></i>Xem chi tiết</button>' +
              '<button type="button" data-book="' + t.id + '" class="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow transition"><i class="fa-solid fa-bolt mr-1"></i>Đặt ngay</button>' +
            '</div>' +
          '</div>' +
        '</article>';
      }).join('');
    }

    /* ---------- Tabs / search / sort / grid clicks ---------- */
    $('main-tabs').addEventListener('click', function (e) {
      var btn = e.target.closest('.main-tab');
      if (!btn) return;
      state.tab = btn.getAttribute('data-tab');
      this.querySelectorAll('.main-tab').forEach(function (b) {
        b.className = 'main-tab px-4 py-2 rounded-lg text-sm transition ' + (b === btn ? 'font-semibold bg-blue-600 text-white' : 'font-medium text-slate-500 hover:bg-slate-100');
      });
      $('tours-pane').classList.toggle('hidden', state.tab !== 'tours');
      $('history-pane').classList.toggle('hidden', state.tab !== 'history');
    });
    $('tour-search').addEventListener('input', function () { state.q = this.value.trim(); renderTours(); });
    $('tour-sort').addEventListener('change', function () { state.sort = this.value; renderTours(); });
    $('tour-grid').addEventListener('click', function (e) {
      var el = e.target.closest('[data-view],[data-book]');
      if (!el) return;
      openTourModal(el.getAttribute('data-view') || el.getAttribute('data-book'));
    });

    /* ---------- Tour detail modal + booking form ---------- */
    function todayStr() { return new Date().toISOString().slice(0, 10); }
    function updateTotal() {
      var tour = allTours().find(function (t) { return t.id === state.tourId; });
      if (!tour) return;
      var guests = Math.min(20, Math.max(1, Number($('bk-guests').value) || 1));
      $('bk-total').textContent = twFormatMoney(tour.price * guests);
    }
    function openTourModal(id) {
      var tour = allTours().find(function (t) { return t.id === id; });
      if (!tour) { showToast('Không tìm thấy chuyến đi!', 'error'); return; }
      state.tourId = tour.id;
      $('tm-emoji').textContent = tour.emoji;
      $('tm-title').textContent = tour.title;
      $('tm-meta').innerHTML =
        '<span><i class="fa-solid fa-location-dot mr-1 text-blue-500"></i>' + twEscapeHtml(tour.destination) + '</span>' +
        '<span><i class="fa-solid fa-van-shuttle mr-1 text-violet-500"></i>Khởi hành từ ' + twEscapeHtml(tour.departure) + '</span>' +
        '<span><i class="fa-regular fa-clock mr-1 text-emerald-500"></i>' + twEscapeHtml(tour.duration) + '</span>' +
        '<span><i class="fa-solid fa-star mr-1 text-amber-400"></i>' + tour.rating + ' (' + tour.sold + ' đã bán)</span>';
      $('tm-desc').textContent = tour.description;
      $('tm-tags').innerHTML = tour.tags.map(function (x) { return '<span class="inline-block bg-blue-50 text-blue-600 text-xs font-semibold px-2.5 py-1 rounded-full">' + twEscapeHtml(x) + '</span>'; }).join('');
      $('tm-highlights').innerHTML = tour.highlights.map(function (h) {
        return '<li class="flex items-start gap-2"><i class="fa-solid fa-circle-check text-emerald-500 mt-0.5 shrink-0"></i><span>' + twEscapeHtml(h) + '</span></li>';
      }).join('');
      $('tm-schedule').innerHTML = tour.schedule.map(function (s) {
        return '<div class="flex gap-3">' +
          '<div class="flex flex-col items-center"><span class="w-16 shrink-0 text-center bg-blue-600 text-white text-[10px] font-bold rounded-lg py-1 px-1">' + twEscapeHtml(s.day) + '</span>' +
          '<span class="w-px flex-1 bg-slate-200 mt-1"></span></div>' +
          '<div class="pb-1"><p class="text-sm font-semibold text-slate-800">' + twEscapeHtml(s.title) + '</p>' +
          '<p class="text-xs text-slate-500 leading-relaxed mt-0.5">' + twEscapeHtml(s.detail) + '</p></div>' +
        '</div>';
      }).join('');
      $('tm-includes').innerHTML = tour.includes.map(function (x) {
        return '<span class="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-lg"><i class="fa-solid fa-check"></i>' + twEscapeHtml(x) + '</span>';
      }).join('');
      $('bk-date').min = todayStr();
      $('bk-date').value = '';
      $('bk-guests').value = 2;
      updateTotal();
      openModal('modal-tour');
    }
    $('bk-guests').addEventListener('input', updateTotal);

    $('bk-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var tour = allTours().find(function (t) { return t.id === state.tourId; });
      if (!tour) return;
      var date = $('bk-date').value;
      var guests = Number($('bk-guests').value) || 0;
      if (!date) { showToast('Vui lòng chọn ngày khởi hành!', 'error'); return; }
      if (date < todayStr()) { showToast('Ngày khởi hành không được ở quá khứ!', 'error'); return; }
      if (guests < 1 || guests > 20) { showToast('Số khách phải từ 1 đến 20!', 'error'); return; }
      var booking = {
        id: twUid('b'), userId: user.id, tourId: tour.id, emoji: tour.emoji,
        tourTitle: tour.title, destination: tour.destination, date: date,
        guests: guests, amount: tour.price * guests, status: 'Pending', bookedAt: todayStr()
      };
      var list = allBookings();
      list.unshift(booking);
      saveBookings(list);
      notifyMe('Bạn đã đặt "' + tour.title + '" – khởi hành ' + date + ', ' + guests + ' khách. Đang chờ xác nhận.');
      closeModal('modal-tour');
      showToast('Đặt chuyến "' + tour.title + '" thành công! Xem tại Lịch sử đặt chuyến.');
      renderStats();
      renderHistory();
      document.querySelector('.main-tab[data-tab="history"]').click();
    });

    /* ---------- Booking history ---------- */
    function renderHistory() {
      var mine = myBookings();
      $('booking-empty').classList.toggle('hidden', mine.length > 0);
      $('booking-list').innerHTML = mine.map(function (b) {
        var canCancel = b.status === 'Pending' || b.status === 'Confirmed';
        var canRebook = b.status === 'Cancelled' || b.status === 'Completed';
        return '<div class="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col md:flex-row md:items-center gap-3 hover:shadow-md transition">' +
          '<span class="w-12 h-12 rounded-xl ph-img ph-blue text-2xl shrink-0">' + (b.emoji || '🧳') + '</span>' +
          '<div class="flex-1 min-w-0">' +
            '<div class="flex items-center gap-2 flex-wrap">' +
              '<h3 class="font-semibold text-slate-800 text-sm">' + twEscapeHtml(b.tourTitle) + '</h3>' + twStatusPill(b.status) +
            '</div>' +
            '<div class="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">' +
              '<span><i class="fa-solid fa-location-dot mr-1 text-blue-500"></i>' + twEscapeHtml(b.destination) + '</span>' +
              '<span><i class="fa-regular fa-calendar mr-1 text-violet-500"></i>Khởi hành: ' + twEscapeHtml(b.date) + '</span>' +
              '<span><i class="fa-solid fa-user-group mr-1 text-emerald-500"></i>' + b.guests + ' khách</span>' +
              '<span><i class="fa-regular fa-clock mr-1 text-slate-400"></i>Đặt lúc: ' + twEscapeHtml(b.bookedAt) + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="flex items-center gap-3 md:flex-col md:items-end">' +
            '<p class="text-base font-bold text-blue-600 whitespace-nowrap">' + twFormatMoney(b.amount) + '</p>' +
            '<div class="flex gap-2">' +
              (canRebook ? '<button type="button" data-rebook="' + b.tourId + '" class="text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition whitespace-nowrap"><i class="fa-solid fa-rotate-left mr-1"></i>Đặt lại</button>' : '') +
              (canCancel ? '<button type="button" data-cancel="' + b.id + '" class="text-xs px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition whitespace-nowrap"><i class="fa-solid fa-ban mr-1"></i>Hủy đặt</button>' : '') +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    $('booking-list').addEventListener('click', function (e) {
      var cancelBtn = e.target.closest('[data-cancel]');
      if (cancelBtn) {
        var id = cancelBtn.getAttribute('data-cancel');
        var list = allBookings();
        var bk = list.find(function (b) { return b.id === id; });
        if (!bk) return;
        if (!confirm('Hủy đặt chuyến "' + bk.tourTitle + '" (khởi hành ' + bk.date + ')?')) return;
        bk.status = 'Cancelled';
        saveBookings(list);
        notifyMe('Bạn đã hủy đặt chuyến "' + bk.tourTitle + '" khởi hành ' + bk.date + '.');
        showToast('Đã hủy đặt chuyến!', 'error');
        renderStats();
        renderHistory();
        return;
      }
      var rebookBtn = e.target.closest('[data-rebook]');
      if (rebookBtn) openTourModal(rebookBtn.getAttribute('data-rebook'));
    });

    /* ---------- Init ---------- */
    renderStats();
    renderTours();
    renderHistory();
  })();

})();

/* ---------- Trang: traveler-trip-planner.html (chi chay khi body[data-page="traveler-trip-planner"]) ---------- */
(function () {
  if (document.body.getAttribute('data-page') !== 'traveler-trip-planner') return;

  (function () {
    var user = twCurrentUser();
    if (!user) return;
    var $ = function (id) { return document.getElementById(id); };
    var currentTab = 'Tất cả';
    var INTERESTS = ['Thiên nhiên', 'Văn hóa', 'Ẩm thực', 'Nghỉ dưỡng', 'Trekking'];
    var TIMES = ['09:00', '14:00', '18:30'];

    function allTrips() { return twGet(TW_KEYS.trips, []); }
    function myTrips() { return allTrips().filter(function (t) { return t.ownerId === user.id; }); }
    function saveTrips(list) { twSet(TW_KEYS.trips, list); }
    /* ---------- Lịch sử đã đặt (dùng chung khóa tw_bookings với trang "Đặt chuyến") ---------- */
    function allBookings() { return twGet(TW_KEYS.bookings, []); }
    function saveBookings(list) { twSet(TW_KEYS.bookings, list); }
    function notifyMe(text) {
      var notes = twGet(TW_KEYS.notifications, []);
      notes.unshift({ id: twUid('n'), role: 'traveler', text: text, time: 'Vừa xong', read: false });
      twSet(TW_KEYS.notifications, notes);
    }
    function todayStr() { return new Date().toISOString().slice(0, 10); }

    function renderStats() {
      var mine = myTrips();
      $('st-total').textContent = mine.length;
      $('st-pending').textContent = mine.filter(function (t) { return t.status === 'Chờ review'; }).length;
      $('st-approved').textContent = mine.filter(function (t) { return t.status === 'Approved' || t.status === 'Đã duyệt'; }).length;
      $('st-budget').textContent = twFormatMoney(mine.reduce(function (s, t) { return s + (Number(t.budget) || 0); }, 0)).replace('Miễn phí', '0đ');
    }

    function renderTrips() {
      var mine = myTrips().filter(function (t) { return currentTab === 'Tất cả' || t.status === currentTab; });
      $('trips-empty').classList.toggle('hidden', mine.length > 0);
      $('trips-list').innerHTML = mine.map(function (t) {
        var days = (t.itineraryDays || []).length;
        var dayChips = (t.itineraryDays || []).slice(0, 5).map(function (d) {
          return '<span class="px-2 py-1 rounded-lg bg-slate-100 text-slate-500 text-[11px] font-medium" title="' + twEscapeHtml(d.items.map(function (i) { return i.time + ' ' + i.title; }).join(' | ')) + '">D' + d.day + ': ' + twEscapeHtml(d.place) + '</span>';
        }).join('');
        var feedback = '';
        if (t.reviewFeedback) {
          var isOk = t.status === 'Approved';
          feedback = '<div class="mt-3 rounded-xl p-3 text-sm ' + (isOk ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100') + '">' +
            '<p class="font-semibold text-xs uppercase tracking-wide mb-1"><i class="fa-solid ' + (isOk ? 'fa-circle-check' : 'fa-circle-xmark') + ' mr-1"></i>Phản hồi từ hướng dẫn viên</p>' + twEscapeHtml(t.reviewFeedback) + '</div>';
        }
        var dayComments = t.dayComments && Object.keys(t.dayComments).length ? '<div class="mt-2 space-y-1">' + Object.keys(t.dayComments).map(function (k) {
          return '<p class="text-xs text-slate-500 bg-slate-50 rounded-lg px-2.5 py-1.5"><i class="fa-regular fa-comment-dots text-amber-500 mr-1"></i><span class="font-semibold">Ngày ' + k + ':</span> ' + twEscapeHtml(t.dayComments[k]) + '</p>';
        }).join('') + '</div>' : '';
        return '<article class="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition fade-up">' +
          '<div class="flex items-start justify-between gap-3 flex-wrap">' +
            '<div>' +
              '<h3 class="font-bold text-slate-900 text-lg">' + twEscapeHtml(t.title) + '</h3>' +
              '<p class="text-sm text-slate-500 mt-0.5"><i class="fa-solid fa-location-dot text-blue-500 mr-1"></i>' + twEscapeHtml(t.destination) + ' · <i class="fa-regular fa-calendar mr-1"></i>' + twEscapeHtml(t.startDate) + ' → ' + twEscapeHtml(t.endDate) + '</p>' +
            '</div>' +
            '<div class="text-right">' + twStatusPill(t.status) + '<p class="mt-1.5 text-sm font-bold text-violet-600">' + twFormatMoney(t.budget) + '</p></div>' +
          '</div>' +
          '<div class="mt-3 flex flex-wrap gap-1.5">' + (t.interests || []).map(function (i) { return '<span class="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">#' + twEscapeHtml(i) + '</span>'; }).join('') + '<span class="px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-medium">' + days + ' ngày</span></div>' +
          '<div class="mt-2.5 flex flex-wrap gap-1.5">' + dayChips + '</div>' +
          feedback + dayComments +
          '<div class="mt-4 flex flex-wrap gap-2">' +
            '<button type="button" data-act="view" data-id="' + t.id + '" class="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow transition"><i class="fa-solid fa-eye mr-1.5"></i>Xem chuyến đi</button>' +
            '<button type="button" data-act="edit" data-id="' + t.id + '" class="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"><i class="fa-solid fa-pen mr-1.5"></i>Chỉnh sửa</button>' +
            (t.status === 'Saved' || t.status === 'Rejected' ? '<button type="button" data-act="submit-review" data-id="' + t.id + '" class="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow transition"><i class="fa-solid fa-paper-plane mr-1.5"></i>Gửi HDV review</button>' : '') +
            (t.status === 'Chờ review' ? '<button type="button" data-act="withdraw" data-id="' + t.id + '" class="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow transition"><i class="fa-solid fa-rotate-left mr-1.5"></i>Rút lại</button>' : '') +
            '<button type="button" data-act="delete" data-id="' + t.id + '" class="px-3.5 py-2 rounded-lg border border-red-200 text-xs font-semibold text-red-500 hover:bg-red-50 transition"><i class="fa-solid fa-trash-can mr-1.5"></i>Xóa</button>' +
          '</div>' +
        '</article>';
      }).join('');
      renderStats();
    }
    function refresh() { renderTrips(); }
    /* Tabs */
    $('status-tabs').addEventListener('click', function (e) {
      var btn = e.target.closest('.tab-btn');
      if (!btn) return;
      currentTab = btn.getAttribute('data-tab');
      this.querySelectorAll('.tab-btn').forEach(function (b) {
        var on = b === btn;
        b.className = 'tab-btn px-4 py-2 rounded-lg text-sm transition ' + (on ? 'font-semibold bg-blue-600 text-white' : 'font-medium text-slate-500 hover:bg-slate-100');
      });
      renderTrips();
    });

    /* List actions */
    var pendingDeleteId = null;
    $('trips-list').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-act]');
      if (!btn) return;
      var act = btn.getAttribute('data-act'), id = btn.getAttribute('data-id');
      var trips = allTrips();
      var trip = trips.find(function (t) { return t.id === id; });
      if (!trip) return;
      if (act === 'view') { openTripView(trip); }
      if (act === 'edit') { openTripForm(trip); }
      if (act === 'submit-review') {
        trip.status = 'Chờ review'; trip.reviewFeedback = ''; trip.dayComments = {};
        saveTrips(trips);
        var notes = twGet(TW_KEYS.notifications, []);
        notes.unshift({ id: twUid('n'), role: 'guide', text: 'Lịch trình "' + trip.title + '" đang chờ bạn review.', time: 'Vừa xong', read: false });
        twSet(TW_KEYS.notifications, notes);
        refresh(); showToast('Đã gửi lịch trình tới hướng dẫn viên bản địa!');
      }
      if (act === 'withdraw') {
        trip.status = 'Saved'; saveTrips(trips); refresh();
        showToast('Đã rút lại yêu cầu review, chuyển về bản nháp.', 'info');
      }
      if (act === 'delete') {
        pendingDeleteId = id;
        $('delete-trip-name').textContent = '"' + trip.title + '" sẽ bị xóa vĩnh viễn khỏi danh sách của bạn.';
        openModal('modal-delete');
      }
    });
    $('confirm-delete').addEventListener('click', function () {
      if (!pendingDeleteId) return;
      saveTrips(allTrips().filter(function (t) { return t.id !== pendingDeleteId; }));
      pendingDeleteId = null;
      closeModal('modal-delete');
      refresh(); showToast('Đã xóa chuyến đi.', 'info');
    });
    /* ---------- Xem chuyến đi + Thêm vào chuyến đi (lưu vào Lịch sử đã đặt) ---------- */
    var viewingTrip = null;
    var atGuests = 1;
    function renderAtGuests() { $('at-guests').value = atGuests; }
    function setAtAdded(added) {
      var btn = $('btn-add-to-trip');
      btn.disabled = added;
      btn.classList.toggle('opacity-50', added);
      btn.classList.toggle('cursor-not-allowed', added);
      $('at-status').classList.toggle('hidden', !added);
    }
    function tripAlreadyBooked(tripId) {
      return allBookings().some(function (b) { return b.userId === user.id && b.tourId === tripId && (b.status === 'Pending' || b.status === 'Confirmed'); });
    }
    function openTripView(trip) {
      viewingTrip = trip;
      $('tv-title').textContent = trip.title;
      $('tv-meta').innerHTML = '<i class="fa-solid fa-location-dot text-blue-500 mr-1"></i>' + twEscapeHtml(trip.destination) +
        ' · <i class="fa-regular fa-calendar mr-1"></i>' + twEscapeHtml(trip.startDate) + ' → ' + twEscapeHtml(trip.endDate);
      $('tv-interests').innerHTML = (trip.interests || []).map(function (i) {
        return '<span class="px-2.5 py-1 rounded-full bg-white border border-blue-100 text-blue-600 text-xs font-medium">#' + twEscapeHtml(i) + '</span>';
      }).join('');
      $('tv-status').innerHTML = twStatusPill(trip.status);
      $('tv-budget').textContent = twFormatMoney(trip.budget);
      var daysList = trip.itineraryDays || [];
      $('tv-itinerary').innerHTML = daysList.length ? daysList.map(function (d) {
        return '<div class="rounded-xl border border-slate-200 p-3 bg-slate-50/60">' +
          '<p class="text-xs font-bold text-slate-700 mb-1.5"><span class="inline-flex w-6 h-6 rounded-lg bg-blue-600 text-white text-[11px] items-center justify-center mr-1.5">D' + d.day + '</span>' + twEscapeHtml(d.place || trip.destination) + '</p>' +
          ((d.items && d.items.length) ? d.items.map(function (it) {
            return '<p class="text-xs text-slate-500 mt-1"><span class="font-mono text-slate-400 mr-1.5">' + twEscapeHtml(it.time || '') + '</span>' + twEscapeHtml(it.title) + '</p>';
          }).join('') : '<p class="text-xs text-slate-400 mt-1">Chưa có hoạt động.</p>') +
        '</div>';
      }).join('') : '<p class="text-sm text-slate-400">Chưa có lịch trình chi tiết.</p>';
      /* trạng thái mục "Thêm vào chuyến đi" */
      $('at-date').value = trip.startDate || '';
      $('at-date').min = todayStr();
      atGuests = 1;
      renderAtGuests();
      $('at-amount').textContent = twFormatMoney(trip.budget || 0);
      setAtAdded(tripAlreadyBooked(trip.id));
      openModal('modal-trip-view');
    }
    $('at-g-minus').addEventListener('click', function () { if (atGuests > 1) { atGuests--; renderAtGuests(); } });
    $('at-g-plus').addEventListener('click', function () { if (atGuests < 20) { atGuests++; renderAtGuests(); } });
    $('btn-add-to-trip').addEventListener('click', function () {
      if (!viewingTrip) return;
      var date = $('at-date').value;
      if (!date) { showToast('Vui lòng chọn ngày khởi hành!', 'error'); return; }
      if (tripAlreadyBooked(viewingTrip.id)) { showToast('Chuyến đi này đã có trong Lịch sử đã đặt!', 'error'); setAtAdded(true); return; }
      var list = allBookings();
      list.unshift({
        id: twUid('b'), userId: user.id, tourId: viewingTrip.id, emoji: '🧳',
        tourTitle: viewingTrip.title, destination: viewingTrip.destination, date: date,
        guests: atGuests, amount: Number(viewingTrip.budget) || 0,
        status: 'Pending', bookedAt: todayStr(), source: 'trip-planner'
      });
      saveBookings(list);
      notifyMe('Bạn đã thêm chuyến đi "' + viewingTrip.title + '" vào Lịch sử đã đặt (khởi hành ' + date + ').');
      showToast('Đã thêm vào chuyến đi! Xem tại "Đặt chuyến → Lịch sử đặt chuyến".');
      setAtAdded(true);
    });

    /* Trip form */
    function blankDays(dest) {
      return [1, 2, 3, 4, 5].map(function (d) {
        return { day: d, place: dest || '', items: TIMES.map(function (tm) { return { time: tm, title: '' }; }) };
      });
    }
    var editorDays = blankDays('');
    function renderInterests(selected) {
      $('tf-interests').innerHTML = INTERESTS.map(function (i) {
        var on = (selected || []).indexOf(i) !== -1;
        return '<label class="cursor-pointer px-3 py-1.5 rounded-full border text-xs font-semibold transition ' + (on ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:border-blue-300') + ' has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 has-[:checked]:text-blue-700"><input type="checkbox" class="hidden" name="interest" value="' + i + '"' + (on ? ' checked' : '') + '>' + i + '</label>';
      }).join('');
    }
    function renderItineraryEditor() {
      $('itinerary-editor').innerHTML = editorDays.map(function (d, idx) {
        return '<div class="rounded-xl border border-slate-200 p-3 bg-slate-50/60">' +
          '<div class="flex items-center gap-2 mb-2">' +
            '<span class="w-7 h-7 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">D' + (idx + 1) + '</span>' +
            '<input type="text" data-day="' + idx + '" data-field="place" value="' + twEscapeHtml(d.place) + '" class="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm font-medium outline-none focus:border-blue-400 bg-white transition" placeholder="Địa điểm ngày ' + (idx + 1) + '">' +
          '</div>' +
          d.items.map(function (it, j) {
            return '<div class="flex items-center gap-2 mt-1.5"><span class="text-xs text-slate-400 w-11 shrink-0 font-mono">' + it.time + '</span>' +
              '<input type="text" data-day="' + idx + '" data-item="' + j + '" value="' + twEscapeHtml(it.title) + '" class="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-blue-400 bg-white transition" placeholder="Hoạt động (VD: tham quan phố cổ)"></div>';
          }).join('') +
        '</div>';
      }).join('');
    }
    function openTripForm(trip) {
      $('trip-modal-title').innerHTML = trip ? '<i class="fa-solid fa-pen text-blue-500 mr-2"></i>Chỉnh sửa chuyến đi' : '<i class="fa-solid fa-route text-blue-500 mr-2"></i>Tạo chuyến đi mới';
      $('tf-id').value = trip ? trip.id : '';
      $('tf-title').value = trip ? trip.title : '';
      $('tf-destination').value = trip ? trip.destination : '';
      $('tf-budget').value = trip ? trip.budget : 5000000;
      $('tf-start').value = trip ? trip.startDate : '';
      $('tf-end').value = trip ? trip.endDate : '';
      renderInterests(trip ? trip.interests : []);
      editorDays = trip && trip.itineraryDays && trip.itineraryDays.length ? JSON.parse(JSON.stringify(trip.itineraryDays)) : blankDays($('tf-destination').value);
      renderItineraryEditor();
      openModal('modal-trip');
    }
    $('btn-new-trip').addEventListener('click', function () { openTripForm(null); });
    $('trip-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var title = $('tf-title').value.trim();
      var dest = $('tf-destination').value.trim();
      var budget = Number($('tf-budget').value) || 0;
      var start = $('tf-start').value, end = $('tf-end').value;
      if (!title || !dest || !start || !end) { showToast('Vui lòng điền đủ thông tin cơ bản!', 'error'); return; }
      if (end < start) { showToast('Ngày kết thúc phải sau ngày bắt đầu!', 'error'); return; }
      var interests = Array.prototype.slice.call(this.querySelectorAll('input[name="interest"]:checked')).map(function (c) { return c.value; });
      /* đọc lại lịch trình từ editor */
      $('itinerary-editor').querySelectorAll('input[data-field="place"]').forEach(function (inp) {
        editorDays[Number(inp.getAttribute('data-day'))].place = inp.value.trim();
      });
      $('itinerary-editor').querySelectorAll('input[data-item]').forEach(function (inp) {
        var d = Number(inp.getAttribute('data-day')), j = Number(inp.getAttribute('data-item'));
        if (editorDays[d] && editorDays[d].items[j]) editorDays[d].items[j].title = inp.value.trim();
      });
      var cleanDays = editorDays.map(function (d) {
        return { day: d.day, place: d.place || dest, items: d.items.filter(function (i) { return i.title; }) };
      });
      var trips = allTrips();
      var id = $('tf-id').value;
      if (id) {
        var trip = trips.find(function (t) { return t.id === id; });
        Object.assign(trip, { title: title, destination: dest, budget: budget, startDate: start, endDate: end, interests: interests, itineraryDays: cleanDays });
        if (trip.status === 'Approved' || trip.status === 'Rejected') { trip.status = 'Saved'; trip.reviewFeedback = ''; trip.dayComments = {}; }
        showToast('Đã cập nhật chuyến đi "' + title + '"!');
      } else {
        trips.unshift({ id: twUid('t'), ownerId: user.id, title: title, destination: dest, startDate: start, endDate: end, budget: budget, interests: interests, status: 'Saved', reviewFeedback: '', dayComments: {}, itineraryDays: cleanDays });
        showToast('Đã tạo chuyến đi "' + title + '"! Bạn có thể gửi HDV review.');
      }
      saveTrips(trips);
      closeModal('modal-trip');
      refresh();
    });

    refresh();
  })();

})();

