// Khởi tạo Cơ sở dữ liệu giả lập nếu chưa có
function initDatabase() {
  if (!localStorage.getItem('tw_users')) {
    const defaultUsers = [
      { name: 'Du khách Demo', email: 'traveler@tripweave.demo', password: '123', role: 'traveler' },
      { name: 'HDV Minh', email: 'guide@tripweave.demo', password: '123', role: 'guide' },
      { name: 'Admin Hệ thống', email: 'admin@tripweave.demo', password: '123', role: 'admin' }
    ];
    localStorage.setItem('tw_users', JSON.stringify(defaultUsers));
  }
}

// Gọi khởi tạo DB
initDatabase();

// 1. Xử lý Đăng ký
document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.querySelector('#registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const name = document.querySelector('#registerName')?.value.trim();
      const email = document.querySelector('#registerEmail')?.value.trim();
      const password = document.querySelector('#registerPassword')?.value;
      const role = document.querySelector('input[name="role"]:checked')?.value || 'traveler';

      if (!name || !email || !password) {
        alert('Vui lòng điền đầy đủ thông tin!');
        return;
      }

      const users = JSON.parse(localStorage.getItem('tw_users')) || [];
      const userExists = users.some(u => u.email === email);

      if (userExists) {
        alert('Email này đã được đăng ký! Vui lòng chọn email khác hoặc Đăng nhập.');
        return;
      }

      // Lưu người dùng mới
      users.push({ name, email, password, role });
      localStorage.setItem('tw_users', JSON.stringify(users));

      alert('Đăng ký thành công! Vui lòng đăng nhập.');
      window.location.href = 'login.html';
    });
  }

  // 2. Xử lý Đăng nhập
  const loginForm = document.querySelector('#loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const email = document.querySelector('#loginEmail')?.value.trim();
      const password = document.querySelector('#loginPassword')?.value;

      const users = JSON.parse(localStorage.getItem('tw_users')) || [];
      const user = users.find(u => u.email === email && u.password === password);

      if (!user) {
        alert('Email hoặc mật khẩu không chính xác!');
        return;
      }

      // Lưu phiên đăng nhập
      localStorage.setItem('tw_currentUser', JSON.stringify(user));

      // Chuyển hướng theo Vai trò
      redirectByRole(user.role);
    });
  }
});

// Hàm chuyển hướng trang theo Vai trò
function redirectByRole(role) {
  const bp = getBasePath();
  switch (role) {
    case 'traveler':
      window.location.href = bp + 'traveler/discover.html';
      break;
    case 'guide':
      window.location.href = bp + 'guide/dashboard.html';
      break;
    case 'admin':
      window.location.href = bp + 'admin/dashboard.html';
      break;
    default:
      window.location.href = bp + 'traveler/discover.html';
  }
}

// 3. Hàm Đăng nhập nhanh bằng Account Demo (gắn vào các nút Quick Login)
function quickLogin(email, password) {
  const users = JSON.parse(localStorage.getItem('tw_users')) || [];
  const user = users.find(u => u.email === email);
  if (user) {
    localStorage.setItem('tw_currentUser', JSON.stringify(user));
    redirectByRole(user.role);
  } else {
    alert('Tài khoản demo chưa sẵn sàng!');
  }
}

// Hàm hỗ trợ để lấy basePath cho redirect & check auth
function getBasePath() {
    const path = window.location.pathname;
    if (path.includes('/traveler/') || path.includes('/guide/') || path.includes('/partner/') || path.includes('/admin/')) {
        return '../';
    }
    return './';
}

// Object Auth tĩnh để tương thích với app.js
const Auth = {
    getBasePath: getBasePath,
    logout: () => {
        localStorage.removeItem('tw_currentUser');
        window.location.href = getBasePath() + 'login.html';
    },
    getCurrentUser: () => {
        try {
            const user = JSON.parse(localStorage.getItem('tw_currentUser'));
            if(user && !user.avatar) {
                // Tạo avatar giả nếu chưa có
                const colors = { 'traveler': '2563EB', 'guide': '10B981', 'admin': '8B5CF6' };
                user.avatar = `https://ui-avatars.com/api/?name=${user.name}&background=${colors[user.role] || '2563EB'}&color=fff`;
            }
            return user;
        } catch(e) { return null; }
    },
    checkAuth: () => {
        const user = Auth.getCurrentUser();
        if (!user) {
            window.location.href = getBasePath() + 'login.html';
        }
        return user;
    }
};
