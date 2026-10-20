document.addEventListener('DOMContentLoaded', () => {
    const user = Auth.checkAuth();
    if (!user) return;

    // Setup Topbar
    const nameEl = document.getElementById('topbar-user-name');
    const roleEl = document.getElementById('topbar-user-role');
    const avatarEl = document.getElementById('topbar-user-avatar');
    
    if(nameEl) nameEl.textContent = user.name;
    if(avatarEl) avatarEl.src = user.avatar;
    if(roleEl) {
        const roleNames = { 'traveler': 'Du khách', 'guide': 'Hướng dẫn viên', 'partner': 'Đối tác', 'admin': 'Quản trị viên' };
        const roleColors = { 'traveler': 'text-accent', 'guide': 'text-green-600', 'partner': 'text-orange-600', 'admin': 'text-purple-600' };
        roleEl.textContent = roleNames[user.role];
        roleEl.className = `text-xs font-medium ${roleColors[user.role]}`;
    }

    // Setup User Dropdown
    const userBtn = document.getElementById('user-menu-btn');
    const userDropdown = document.getElementById('user-dropdown');
    if(userBtn && userDropdown) {
        userBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('hidden');
        });
        document.addEventListener('click', () => {
            userDropdown.classList.add('hidden');
        });
    }

    // Generate Sidebar Links based on role
    const sidebarNav = document.getElementById('sidebar-nav');
    if(sidebarNav) {
        const basePath = Auth.getBasePath();
        const links = {
            'traveler': [
                { icon: 'fa-compass', text: 'Khám phá', url: 'traveler/discover.html' },
                { icon: 'fa-wand-magic-sparkles', text: 'Tạo chuyến đi AI', url: 'traveler/trip-planner.html' },
                { icon: 'fa-map-location-dot', text: 'Chuyến đi của tôi', url: 'traveler/my-trips.html' }
            ],
            'guide': [
                { icon: 'fa-chart-pie', text: 'Dashboard', url: 'guide/dashboard.html' },
                { icon: 'fa-clipboard-check', text: 'Review Lịch trình', url: 'guide/trip-review.html' },
                { icon: 'fa-layer-group', text: 'Bộ sưu tập', url: 'guide/collections.html' },
                { icon: 'fa-user', text: 'Hồ sơ', url: 'guide/profile.html' }
            ],
            'admin': [
                { icon: 'fa-chart-pie', text: 'Dashboard', url: 'admin/dashboard.html' },
                { icon: 'fa-users', text: 'Người dùng', url: 'admin/users.html' },
                { icon: 'fa-shield-halved', text: 'Kiểm duyệt', url: 'admin/content-moderation.html' },
                { icon: 'fa-handshake', text: 'Đối tác & Dịch vụ', url: 'admin/partners.html' },
                { icon: 'fa-tags', text: 'Danh mục', url: 'admin/categories.html' },
                { icon: 'fa-cog', text: 'Cài đặt', url: 'admin/settings.html' }
            ]
        };

        const currentPath = window.location.pathname;
        let html = '<ul class="space-y-1 px-3">';
        links[user.role].forEach(link => {
            const isActive = currentPath.includes(link.url.split('/').pop());
            const activeClass = isActive ? 'bg-secondary text-white border-l-4 border-accent' : 'text-gray-300 hover:bg-secondary/50 hover:text-white border-l-4 border-transparent';
            html += `
                <li>
                    <a href="${basePath}${link.url}" class="flex items-center gap-3 px-3 py-2.5 rounded-r-lg transition-colors ${activeClass}">
                        <i class="fa-solid ${link.icon} w-5 text-center"></i>
                        <span class="font-medium text-sm">${link.text}</span>
                    </a>
                </li>
            `;
        });
        html += '</ul>';
        sidebarNav.innerHTML = html;
    }
});
