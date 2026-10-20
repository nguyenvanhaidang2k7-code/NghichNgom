(function () {
  var users = [
    { name: 'Nguyễn Thị Ngân', role: 'Du khách', status: 'Hoạt động' },
    { name: 'Nguyễn Văn Minh', role: 'Hướng dẫn viên', status: 'Hoạt động' },
    { name: 'Công ty Hạ Long', role: 'Đối tác', status: 'Chờ duyệt' }
  ];
  var content = [
    { name: 'Du thuyền Hạ Long', type: 'Dịch vụ', status: 'Chờ duyệt' },
    { name: 'Homestay Sapa', type: 'Dịch vụ', status: 'Chờ duyệt' },
    { name: 'Trải nghiệm làng cổ', type: 'Bài viết', status: 'Đã duyệt' }
  ];
  var categories = [
    { name: 'Thiên nhiên', count: 64, active: true },
    { name: 'Văn hóa', count: 48, active: true },
    { name: 'Ẩm thực', count: 52, active: true },
    { name: 'Nghỉ dưỡng', count: 35, active: true }
  ];
  var page = document.body.dataset.page;

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }

  function showStatus(value) {
    var type = /hoạt động|đã duyệt/i.test(value) ? 'success' : /chờ/i.test(value) ? 'warning' : 'neutral';
    return '<span class="status ' + type + '">' + value + '</span>';
  }

  function renderUsers(query) {
    var target = document.querySelector('#user-list');
    if (!target) return;
    var matches = users.filter(function (user) {
      return (user.name + ' ' + user.role).toLowerCase().includes(query.toLowerCase());
    });
    target.innerHTML = matches.map(function (user) {
      return '<article class="card list-row"><div class="row-title">' + user.name + '</div><div class="row-subtitle">' + user.role +
        '</div>' + showStatus(user.status) + '<div class="actions"><button class="btn btn-secondary" type="button" data-user-view="' + user.name +
        '">Xem</button><button class="btn btn-primary" type="button" data-user-action="' + user.name + '">Thao tác</button></div></article>';
    }).join('') || '<div class="card empty-state">Không tìm thấy người dùng phù hợp.</div>';
    target.querySelectorAll('[data-user-action]').forEach(function (button) {
      button.addEventListener('click', function () {
        var user = users.find(function (item) { return item.name === button.dataset.userAction; });
        user.status = user.status === 'Hoạt động' ? 'Đã khóa' : 'Hoạt động';
        renderUsers(document.querySelector('#user-search').value);
        window.twToast('Đã cập nhật tài khoản ' + user.name + '.');
      });
    });
  }

  function renderContent(query) {
    var target = document.querySelector('#content-list');
    if (!target) return;
    var matches = content.filter(function (item) {
      return item.name.toLowerCase().includes(query.toLowerCase());
    });
    target.innerHTML = matches.map(function (item, index) {
      return '<article class="card list-row admin-content-row"><div class="placeholder">Ảnh</div><div><div class="row-title">' + item.name +
        '</div><div class="row-subtitle">' + item.type + ' · cập nhật hôm nay</div></div>' + showStatus(item.status) +
        '<div class="actions"><button class="btn btn-secondary" type="button" data-view="' + index + '">Xem</button>' +
        '<button class="btn btn-primary" type="button" data-approve="' + index + '">Duyệt</button>' +
        '<button class="btn btn-danger" type="button" data-reject="' + index + '">Từ chối</button></div></article>';
    }).join('') || '<div class="card empty-state">Không có nội dung phù hợp.</div>';
    target.querySelectorAll('[data-approve], [data-reject]').forEach(function (button) {
      button.addEventListener('click', function () {
        var item = content[Number(button.dataset.approve || button.dataset.reject)];
        item.status = button.hasAttribute('data-approve') ? 'Đã duyệt' : 'Từ chối';
        renderContent(document.querySelector('#content-search').value);
        window.twToast('Đã cập nhật trạng thái: ' + item.name + '.');
      });
    });
    target.querySelectorAll('[data-view]').forEach(function (button) {
      button.addEventListener('click', function () { window.twToast('Đang xem nội dung ' + content[Number(button.dataset.view)].name + '.'); });
    });
  }

  function renderCategories(query) {
    var target = document.querySelector('#category-list');
    if (!target) return;
    query = (query || '').toLowerCase();
    target.innerHTML = categories.map(function (category, index) {
      var hidden = category.name.toLowerCase().includes(query) ? '' : ' hidden';
      return '<article class="card list-row"' + hidden + '><div class="row-title">' + escapeHtml(category.name) + '</div>' +
        '<div class="row-subtitle">' + category.count + ' địa điểm</div>' +
        '<div class="actions"><button class="btn btn-secondary" type="button" data-edit-category="' + index + '">Sửa</button>' +
        '<button class="btn btn-danger" type="button" data-toggle-category="' + index + '">' + (category.active ? 'Vô hiệu hóa' : 'Kích hoạt') + '</button></div></article>';
    }).join('');
    target.querySelectorAll('[data-toggle-category]').forEach(function (button) {
      button.addEventListener('click', function () {
        var category = categories[Number(button.dataset.toggleCategory)];
        category.active = !category.active;
        renderCategories(document.querySelector('.toolbar input[type="search"]').value);
        window.twToast(category.name + (category.active ? ' đã được kích hoạt.' : ' đã vô hiệu hóa.'));
      });
    });
    target.querySelectorAll('[data-edit-category]').forEach(function (button) {
      button.addEventListener('click', function () { window.twToast('Đang chỉnh sửa ' + categories[Number(button.dataset.editCategory)].name + '.'); });
    });
  }

  function drawChart(target, values, labels) {
    if (!target) return;
    var max = Math.max.apply(null, values);
    target.innerHTML = '<div class="chart">' + values.map(function (value) {
      return '<div class="chart-column"><div class="chart-bar" style="height:' + Math.round(value / max * 100) + '%"></div></div>';
    }).join('') + '</div><div class="chart-labels">' + labels.map(function (label) {
      return '<span class="chart-label">' + label + '</span>';
    }).join('') + '</div>';
  }

  if (page === 'dashboard') drawChart(document.querySelector('#admin-chart'), [45, 68, 55, 93, 79, 128, 108], ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']);
  if (page === 'users') {
    renderUsers('');
    document.querySelector('#user-search').addEventListener('input', function (event) { renderUsers(event.target.value); });
  }
  if (page === 'content') {
    renderContent('');
    document.querySelector('#content-search').addEventListener('input', function (event) { renderContent(event.target.value); });
  }
  if (page === 'categories') {
    renderCategories('');
    document.querySelector('.toolbar input[type="search"]').addEventListener('input', function (event) {
      renderCategories(event.target.value);
    });
    document.querySelector('#category-add').addEventListener('click', function () {
      var name = prompt('Nhập tên danh mục mới:');
      if (!name || !name.trim()) return;
      categories.push({ name: name.trim(), count: 0, active: true });
      renderCategories();
      window.twToast('Đã thêm danh mục ' + name.trim() + '.');
    });
  }
  if (page === 'settings') {
    document.querySelectorAll('[data-toggle-setting]').forEach(function (button) {
      button.addEventListener('click', function () {
        var enabled = button.getAttribute('aria-pressed') === 'true';
        button.setAttribute('aria-pressed', String(!enabled));
        button.textContent = enabled ? 'Tắt' : 'Bật';
        window.twToast('Đã lưu cài đặt.');
      });
    });
  }
})();
