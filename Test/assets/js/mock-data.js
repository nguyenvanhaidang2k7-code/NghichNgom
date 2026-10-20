const MockDB = {
    init: () => {
        if (!localStorage.getItem('tw_db')) {
            const initialDB = {
                users: [
                    { id: 'u1', name: 'Nguyễn Thị Ngân', email: 'traveler@tripweave.demo', password: '123', role: 'traveler', avatar: 'https://ui-avatars.com/api/?name=Ngân&background=2563EB&color=fff' },
                    { id: 'u2', name: 'Nguyễn Văn Minh', email: 'guide@tripweave.demo', password: '123', role: 'guide', avatar: 'https://ui-avatars.com/api/?name=Minh&background=10B981&color=fff' },
                    { id: 'u3', name: 'Admin TripWeave', email: 'admin@tripweave.demo', password: '123', role: 'admin', avatar: 'https://ui-avatars.com/api/?name=Admin&background=8B5CF6&color=fff' }
                ],
                trips: [
                    {
                        id: 'trip-101',
                        title: 'Hà Nội – Hạ Long – Ninh Bình',
                        userId: 'u1',
                        days: 5,
                        budget: '5.000.000 - 10.000.000đ',
                        status: 'pending', // 'pending', 'approved', 'rejected'
                        guideFeedback: '',
                        createdAt: new Date().toISOString()
                    }
                ],
                partners: [
                    { id: 'p1', name: 'Công ty Du lịch Hạ Long', type: 'Du thuyền', status: 'active', revenue: 45000000 }
                ],
                experiences: [
                    { id: 'e1', title: 'Du thuyền Hạ Long 5 sao', price: '1.200.000đ', status: 'approved' }
                ],
                places: [
                    { id: 1, name: 'Vịnh Hạ Long', category: 'Thiên nhiên', rating: 4.9, price: '1,500,000đ', image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&q=80&w=800', desc: 'Di sản thiên nhiên thế giới với hàng ngàn hòn đảo đá vôi.' },
                    { id: 2, name: 'Phố cổ Hội An', category: 'Văn hóa', rating: 4.8, price: 'Miễn phí', image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&q=80&w=800', desc: 'Kiến trúc cổ kính, đèn lồng rực rỡ về đêm.' },
                    { id: 3, name: 'Bún chả Hương Liên', category: 'Ẩm thực', rating: 4.7, price: '60,000đ', image: 'https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&q=80&w=800', desc: 'Quán bún chả nổi tiếng từng đón cựu Tổng thống Obama.' },
                    { id: 4, name: 'Resort Amanoi', category: 'Nghỉ dưỡng', rating: 5.0, price: '20,000,000đ', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=800', desc: 'Nghỉ dưỡng xa hoa bậc nhất tại Ninh Thuận.' }
                ]
            };
            localStorage.setItem('tw_db', JSON.stringify(initialDB));
        }
    },
    get: () => {
        return JSON.parse(localStorage.getItem('tw_db'));
    },
    save: (data) => {
        localStorage.setItem('tw_db', JSON.stringify(data));
    },
    updateTripStatus: (tripId, status, feedback = '') => {
        const db = MockDB.get();
        const tripIndex = db.trips.findIndex(t => t.id === tripId);
        if (tripIndex !== -1) {
            db.trips[tripIndex].status = status;
            if (feedback) db.trips[tripIndex].guideFeedback = feedback;
            MockDB.save(db);
        }
    },
    addTrip: (trip) => {
        const db = MockDB.get();
        db.trips.unshift(trip);
        MockDB.save(db);
    },
    addUser: (user) => {
        const db = MockDB.get();
        user.id = 'u' + (db.users.length + 1);
        db.users.push(user);
        MockDB.save(db);
    }
};

// Auto init
MockDB.init();
