document.addEventListener('DOMContentLoaded', function () {
  var form = document.querySelector('#login-form');
  if (!form) return;
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var email = document.querySelector('#email').value.trim();
    var password = document.querySelector('#password').value;
    if (!email || !password) {
      window.twToast('Vui lòng nhập email và mật khẩu.');
      return;
    }
    localStorage.setItem('tripweave-demo-user', email);
    window.location.href = email.toLowerCase().includes('admin') ? 'dashboard.html' : 'experience-list.html';
  });

  window.twToast = function (message) {
    var toast = document.querySelector('.toast');
    toast.textContent = message;
    toast.hidden = false;
  };
});
