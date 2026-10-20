(function () {
  var menus = {
    partner: [
      ['experience-list.html', 'Trải nghiệm'],
      ['orders.html', 'Đơn đặt'],
      ['reviews.html', 'Đánh giá'],
      ['revenue.html', 'Doanh thu'],
      ['profile.html', 'Hồ sơ']
    ],
    admin: [
      ['dashboard.html', 'Dashboard'],
      ['users.html', 'Người dùng'],
      ['content.html', 'Nội dung'],
      ['categories.html', 'Danh mục'],
      ['settings.html', 'Cài đặt']
    ]
  };
  var page = document.body.dataset.page || '';
  var role = document.body.dataset.role || 'partner';
  var links = menus[role] || menus.partner;
  var currentFile = location.pathname.split(/[\\/]/).pop();
  var isAdmin = role === 'admin';

  document.body.insertAdjacentHTML('afterbegin',
    '<header class="topbar">' +
      '<button class="icon-button mobile-menu" type="button" aria-label="Mở menu">☰</button>' +
      '<a class="brand" href="index.html"><span class="brand-mark">△</span>TripWeave AI</a>' +
      '<label class="global-search"><span aria-hidden="true">⌕</span><input type="search" placeholder="Tìm kiếm địa điểm, thành phố, hoạt động..."></label>' +
      '<div class="topbar-actions"><button class="icon-button" type="button" aria-label="Thông báo">♧</button><button class="avatar" type="button" aria-label="Tài khoản"></button></div>' +
    '</header>' +
    '<div class="app-layout">' +
      '<aside class="sidebar"><nav class="sidebar-nav" aria-label="Điều hướng chính">' +
        links.map(function (entry) {
          var active = currentFile === entry[0] || page === entry[0].replace('.html', '') ||
            (page === 'experience-form' && entry[0] === 'experience-list.html');
          return '<a class="nav-link' + (active ? ' active' : '') + '" href="' + entry[0] + '"' + (active ? ' aria-current="page"' : '') + '>' + entry[1] + '</a>';
        }).join('') +
      '</nav><div class="sidebar-bottom">' + (isAdmin ? 'Quản trị viên' : 'Đối tác địa phương') + '</div></aside>' +
      '<main class="main-area"><div class="page-content">' + document.querySelector('[data-page-content]').innerHTML + '</div></main>' +
    '</div><div class="toast" role="status" aria-live="polite" hidden></div>'
  );

  document.querySelector('[data-page-content]').remove();
  document.querySelector('.mobile-menu').addEventListener('click', function () {
    document.querySelector('.sidebar').classList.toggle('open');
  });
  document.querySelector('.avatar').addEventListener('click', function () {
    if (confirm('Đăng xuất khỏi TripWeave AI?')) location.href = 'login.html';
  });

  window.twToast = function (message) {
    var toast = document.querySelector('.toast');
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(window.twToastTimer);
    window.twToastTimer = setTimeout(function () { toast.hidden = true; }, 2600);
  };
})();
