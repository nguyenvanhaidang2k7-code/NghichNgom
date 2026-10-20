(function () {
  var page = document.body.dataset.page;
  var experiences = [
    { title: 'Làng cổ Đường Lâm', type: 'Làng cổ', status: 'Đang hoạt động' },
    { title: 'Du thuyền Hạ Long', type: 'Du thuyền', status: 'Đang hoạt động' },
    { title: 'Homestay Sapa', type: 'Homestay', status: 'Tạm ngưng' }
  ];
  var orders = [
    { name: 'Trần An', service: 'Du thuyền Hạ Long', status: 'Chờ xác nhận' },
    { name: 'Lê Minh', service: 'Du thuyền Hạ Long', status: 'Đã xác nhận' },
    { name: 'Nguyễn Hà', service: 'Du thuyền Hạ Long', status: 'Đã hoàn thành' }
  ];
  var reviews = [
    { name: 'Nguyễn Thị Hoa', score: '5.0', copy: 'Trải nghiệm tốt, nhân viên thân thiện...' },
    { name: 'Trần Văn Nam', score: '4.0', copy: 'Trải nghiệm tốt, nhân viên thân thiện...' },
    { name: 'Lê Minh Anh', score: '3.0', copy: 'Trải nghiệm tốt, nhân viên thân thiện...' }
  ];

  function statusClass(value) {
    if (/hoạt động|xác nhận|hoàn thành/i.test(value)) return 'success';
    if (/tạm ngưng|chờ/i.test(value)) return 'warning';
    return 'neutral';
  }

  function renderExperiences(query) {
    var target = document.querySelector('#experience-list');
    if (!target) return;
    var matches = experiences.filter(function (item) {
      return item.title.toLowerCase().includes(query.toLowerCase());
    });
    target.innerHTML = matches.map(function (item, index) {
      return '<article class="card list-row experience-row">' +
        '<div class="placeholder">' + item.type + '</div>' +
        '<div><div class="row-title">' + item.title + '</div></div>' +
        '<span class="status ' + statusClass(item.status) + '">' + item.status + '</span>' +
        '<div class="actions"><a class="btn btn-secondary" href="experience-form.html">Sửa</a>' +
          '<button class="btn btn-primary" type="button" data-pause="' + index + '">Quản lý</button></div>' +
      '</article>';
    }).join('') || '<div class="card empty-state">Không tìm thấy trải nghiệm phù hợp.</div>';
    target.querySelectorAll('[data-pause]').forEach(function (button) {
      button.addEventListener('click', function () {
        var item = experiences[Number(button.dataset.pause)];
        item.status = item.status === 'Tạm ngưng' ? 'Đang hoạt động' : 'Tạm ngưng';
        renderExperiences(document.querySelector('#experience-search').value);
        window.twToast('Đã cập nhật trạng thái trải nghiệm.');
      });
    });
  }

  function renderOrders(query, filter) {
    var target = document.querySelector('#order-list');
    if (!target) return;
    var matches = orders.filter(function (item) {
      return item.name.toLowerCase().includes(query.toLowerCase()) &&
        (filter === 'Tất cả' || item.status === filter);
    });
    target.innerHTML = matches.map(function (item) {
      return '<article class="card list-row">' +
        '<div class="row-title">' + item.name + '</div>' +
        '<div class="row-subtitle">' + item.service + ' · 2 người</div>' +
        '<span class="status ' + statusClass(item.status) + '">' + item.status + '</span>' +
        '<div class="actions"><button class="btn btn-secondary" type="button" data-detail="' + item.name + '">Chi tiết</button>' +
          '<button class="btn btn-primary" type="button" data-update="' + item.name + '">Cập nhật</button></div>' +
      '</article>';
    }).join('') || '<div class="card empty-state">Không có đơn đặt phù hợp.</div>';
    target.querySelectorAll('[data-update]').forEach(function (button) {
      button.addEventListener('click', function () {
        var order = orders.find(function (item) { return item.name === button.dataset.update; });
        if (order.status === 'Chờ xác nhận') order.status = 'Đã xác nhận';
        else if (order.status === 'Đã xác nhận') order.status = 'Đã hoàn thành';
        renderOrders(document.querySelector('#order-search').value, selectedOrderFilter);
        window.twToast('Trạng thái đơn của ' + order.name + ' đã được cập nhật.');
      });
    });
    target.querySelectorAll('[data-detail]').forEach(function (button) {
      button.addEventListener('click', function () { window.twToast('Đang xem đơn đặt của ' + button.dataset.detail + '.'); });
    });
  }

  var selectedOrderFilter = 'Tất cả';

  function drawChart(target, values, labels) {
    if (!target) return;
    var max = Math.max.apply(null, values);
    target.innerHTML = '<div class="chart">' + values.map(function (value) {
      return '<div class="chart-column"><div class="chart-bar" style="height:' + Math.round(value / max * 100) + '%"></div></div>';
    }).join('') + '</div><div class="chart-labels">' + labels.map(function (label) {
      return '<span class="chart-label">' + label + '</span>';
    }).join('') + '</div>';
  }

  if (page === 'experience-list') {
    renderExperiences('');
    document.querySelector('#experience-search').addEventListener('input', function (event) {
      renderExperiences(event.target.value);
    });
  }

  if (page === 'orders') {
    renderOrders('', selectedOrderFilter);
    document.querySelector('#order-search').addEventListener('input', function (event) {
      renderOrders(event.target.value, selectedOrderFilter);
    });
    document.querySelectorAll('[data-order-filter]').forEach(function (tab) {
      tab.addEventListener('click', function () {
        selectedOrderFilter = tab.dataset.orderFilter;
        document.querySelectorAll('[data-order-filter]').forEach(function (other) { other.classList.toggle('active', other === tab); });
        renderOrders(document.querySelector('#order-search').value, selectedOrderFilter);
      });
    });
  }

  if (page === 'reviews') {
    var reviewTarget = document.querySelector('#review-list');
    reviewTarget.innerHTML = reviews.map(function (review) {
      return '<article class="card list-row review-row"><div><div class="row-title">' + review.name +
        '</div><div class="review-copy">' + review.copy + '</div></div><div class="review-score">★ ' + review.score +
        '</div><div class="actions"><button class="btn btn-secondary" type="button" data-reply="' + review.name +
        '">Phản hồi</button><button class="btn btn-primary" type="button" data-review="' + review.name + '">Xem</button></div></article>';
    }).join('');
    reviewTarget.querySelectorAll('[data-reply], [data-review]').forEach(function (button) {
      button.addEventListener('click', function () { window.twToast('Đã mở đánh giá của ' + (button.dataset.reply || button.dataset.review) + '.'); });
    });
  }

  if (page === 'revenue') drawChart(document.querySelector('#revenue-chart'), [48, 68, 57, 94, 112, 145], ['1', '2', '3', '4', '5', '6']);

  if (page === 'experience-form') {
    var form = document.querySelector('#experience-form');
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!form.reportValidity()) return;
      window.twToast('Đã lưu trải nghiệm.');
      setTimeout(function () { location.href = 'experience-list.html'; }, 650);
    });
  }

  if (page === 'profile') {
    document.querySelector('#profile-edit').addEventListener('click', function () {
      window.twToast('Chức năng chỉnh sửa hồ sơ đã sẵn sàng.');
    });
  }
})();
