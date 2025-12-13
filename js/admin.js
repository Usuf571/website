// Данные
let products = JSON.parse(localStorage.getItem('products')) || [];
let reviews = JSON.parse(localStorage.getItem('reviews')) || [
    { id: 1, author: 'Иван И.', text: 'Лучший магазин! Быстрая доставка.', rating: 5, date: '2025-12-01' },
    { id: 2, author: 'Мария П.', text: 'Качество товаров на высоте.', rating: 4, date: '2025-12-02' },
    { id: 3, author: 'Алексей К.', text: 'Рекомендую всем!', rating: 5, date: '2025-12-03' }
];
let settings = JSON.parse(localStorage.getItem('settings')) || {
    siteName: 'ЭлектроМир',
    storeAddress: 'Moscow, Russia',
    password: btoa('admin123') // Base64 для простоты (в проде — хэш)
};
let currentTab = 'products';
let sortKey = 'id', sortDir = 1;
let debounceTimer;

// Инициализация настроек (логотип)
document.getElementById('siteLogo').textContent = `Админка ${settings.siteName}`;

// Пароль (проверка с base64)
function checkPassword() {
    const password = document.getElementById('adminPassword').value;
    const recaptchaResponse = grecaptcha.getResponse(); // Для v2
    if (!recaptchaResponse) {
        document.getElementById('recaptchaError').style.display = 'block';
        return;
    }
    document.getElementById('recaptchaError').style.display = 'none';

    // Для реальной верификации: Отправь token на сервер (fetch('/verify-recaptcha', {token: recaptchaResponse}))
    // Здесь симуляция (в проде — backend с secret key)
    if (btoa(password) === settings.password) {
        document.getElementById('passwordPrompt').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
        renderAdminTable('products');
        renderSettingsDisplay();
    } else {
        alert('Неверный пароль!');
        grecaptcha.reset(); // Сброс reCAPTCHA
    }
}

// Callback для v2 (если data-callback)
function onRecaptchaSuccess(token) {
    console.log('reCAPTCHA passed');
}

// Переключение вкладок
function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.getElementById(`${tab}Tab`).style.display = 'block';
    document.querySelectorAll('.sidebar a').forEach(a => a.classList.remove('active'));
    event.target.classList.add('active');
    if (tab === 'products') renderAdminTable('products', document.getElementById('adminSearchProducts').value);
    if (tab === 'reviews') renderAdminTable('reviews', document.getElementById('adminSearchReviews').value);
    if (tab === 'settings') renderSettingsDisplay();
}

// Debounce для поиска
function debouncedRender(tab) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => renderAdminTable(tab, document.getElementById(`adminSearch${tab.charAt(0).toUpperCase() + tab.slice(1)}`).value), 300);
}

// Универсальная сортировка
function sortTable(tab, key) {
    const data = tab === 'products' ? products : reviews;
    if (sortKey === key) sortDir *= -1; else { sortKey = key; sortDir = 1; }
    data.sort((a, b) => {
        let valA = a[key], valB = b[key];
        if (typeof valA === 'string' && key !== 'text' && key !== 'desc') valA = valA.toLowerCase();
        if (key === 'price' || key === 'rating') { valA = parseInt(valA); valB = parseInt(valB); }
        if (key === 'date') { valA = new Date(valA); valB = new Date(valB); }
        return (valA > valB ? 1 : valA < valB ? -1 : 0) * sortDir;
    });
    renderAdminTable(tab, document.getElementById(`adminSearch${tab.charAt(0).toUpperCase() + tab.slice(1)}`).value);
    // Обновить иконку сортировки
    document.querySelectorAll(`#${tab}Tab th`).forEach((th, index) => {
        if (th.onclick.toString().includes(key)) {
            th.textContent = th.textContent.replace(/[▲▼]/g, '') + (sortDir === 1 ? ' ▲' : ' ▼');
        }
    });
}

// Универсальная рендер таблицы
function renderAdminTable(tab, search = '') {
    const tbodyId = `adminTableBody${tab.charAt(0).toUpperCase() + tab.slice(1)}`;
    const tbody = document.getElementById(tbodyId);
    const data = tab === 'products' ? products : reviews;
    let filtered = data.filter(item => {
        const searchLower = search.toLowerCase();
        return item.name?.toLowerCase().includes(searchLower) || 
               item.author?.toLowerCase().includes(searchLower) ||
               item.text?.toLowerCase().includes(searchLower) ||
               item.desc?.toLowerCase().includes(searchLower);
    });
    tbody.innerHTML = filtered.map(item => `
        <tr data-id="${item.id}">
            <td class="checkbox-col"><input type="checkbox" class="item-checkbox" value="${item.id}"></td>
            <td>${item.id}</td>
            <td>${tab === 'products' ? item.name : item.author}</td>
            <td>${tab === 'products' ? `${item.price} ₽` : `★${item.rating}`}</td>
            <td>${tab === 'products' ? item.category : item.date}</td>
            <td>
                <button class="admin-btn-small edit-btn" onclick="${tab === 'products' ? 'editProduct' : 'editReview'}(${item.id})">Редактировать</button>
                <button class="admin-btn-small delete-btn" onclick="${tab === 'products' ? 'deleteProduct' : 'deleteReview'}(${item.id})">Удалить</button>
            </td>
        </tr>
    `).join('');
}

// Выбор всех
function toggleSelectAll(tab) {
    const checkboxes = document.querySelectorAll(`#${tab}Tab .item-checkbox`);
    checkboxes.forEach(cb => cb.checked = document.getElementById(`selectAll${tab.charAt(0).toUpperCase() + tab.slice(1)}`).checked);
}

// Массовое удаление
function bulkDelete(tab) {
    const selectedIds = Array.from(document.querySelectorAll(`#${tab}Tab .item-checkbox:checked`)).map(cb => parseInt(cb.value));
    if (selectedIds.length === 0) return alert('Выберите элементы!');
    if (confirm(`Удалить ${selectedIds.length} ${tab === 'products' ? 'товаров' : 'отзывов'}?`)) {
        if (tab === 'products') {
            products = products.filter(p => !selectedIds.includes(p.id));
            localStorage.setItem('products', JSON.stringify(products));
        } else {
            reviews = reviews.filter(r => !selectedIds.includes(r.id));
            localStorage.setItem('reviews', JSON.stringify(reviews));
        }
        renderAdminTable(tab, document.getElementById(`adminSearch${tab.charAt(0).toUpperCase() + tab.slice(1)}`).value);
        document.getElementById(`selectAll${tab.charAt(0).toUpperCase() + tab.slice(1)}`).checked = false;
    }
}

// ТОВАРЫ: Полная реализация CRUD
function openAddModal(editId = null) {
    const form = document.getElementById('productForm');
    form.reset();
    document.getElementById('modalTitle').textContent = editId ? 'Редактировать товар' : 'Добавить товар';
    document.getElementById('editId').value = editId || '';
    if (editId) {
        const product = products.find(p => p.id === editId);
        if (product) {
            document.getElementById('productName').value = product.name;
            document.getElementById('productPrice').value = product.price;
            document.getElementById('productDesc').value = product.desc;
            document.getElementById('productImage').value = product.image;
            document.getElementById('productCategory').value = product.category;
        } else {
            alert('Товар не найден!');
            return;
        }
    }
    document.getElementById('addModal').style.display = 'block';
}

function closeAddModal() {
    document.getElementById('addModal').style.display = 'none';
}

document.getElementById('productForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    if (!form.checkValidity()) {
        alert('Заполните все поля правильно!');
        return;
    }
    const id = parseInt(document.getElementById('editId').value) || Date.now();
    const newProduct = {
        id,
        name: document.getElementById('productName').value.trim(),
        price: parseInt(document.getElementById('productPrice').value),
        desc: document.getElementById('productDesc').value.trim(),
        image: document.getElementById('productImage').value.trim(),
        category: document.getElementById('productCategory').value
    };
    const index = products.findIndex(p => p.id === id);
    if (index > -1) {
        products[index] = newProduct;
    } else {
        products.push(newProduct);
    }
    localStorage.setItem('products', JSON.stringify(products));
    closeAddModal();
    renderAdminTable('products', document.getElementById('adminSearchProducts').value);
    alert('Товар сохранён!');
});

function editProduct(id) {
    openAddModal(id);
}

function deleteProduct(id) {
    if (confirm('Удалить этот товар?')) {
        const row = document.querySelector(`#productsTab tr[data-id="${id}"]`);
        if (row) {
            row.style.transition = 'opacity 0.3s';
            row.style.opacity = '0';
        }
        setTimeout(() => {
            products = products.filter(p => p.id !== id);
            localStorage.setItem('products', JSON.stringify(products));
            renderAdminTable('products', document.getElementById('adminSearchProducts').value);
        }, 300);
    }
}

function exportProducts() {
    const date = new Date().toISOString().split('T')[0];
    const dataStr = JSON.stringify(products, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// ОТЗЫВЫ: CRUD
function openReviewModal(editId = null) {
    const form = document.getElementById('reviewForm');
    form.reset();
    document.getElementById('reviewModalTitle').textContent = editId ? 'Редактировать отзыв' : 'Добавить отзыв';
    document.getElementById('editReviewId').value = editId || '';
    if (editId) {
        const review = reviews.find(r => r.id === editId);
        if (review) {
            document.getElementById('reviewAuthor').value = review.author;
            document.getElementById('reviewText').value = review.text;
            document.getElementById('reviewRating').value = review.rating;
        } else {
            alert('Отзыв не найден!');
            return;
        }
    }
    document.getElementById('reviewModal').style.display = 'block';
}

function closeReviewModal() {
    document.getElementById('reviewModal').style.display = 'none';
}

document.getElementById('reviewForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!e.target.checkValidity()) {
        alert('Заполните все поля!');
        return;
    }
    const id = parseInt(document.getElementById('editReviewId').value) || Date.now();
    const newReview = {
        id,
        author: document.getElementById('reviewAuthor').value.trim(),
        text: document.getElementById('reviewText').value.trim(),
        rating: parseInt(document.getElementById('reviewRating').value),
        date: new Date().toISOString().split('T')[0]
    };
    const index = reviews.findIndex(r => r.id === id);
    if (index > -1) {
        reviews[index] = newReview;
    } else {
        reviews.push(newReview);
    }
    localStorage.setItem('reviews', JSON.stringify(reviews));
    closeReviewModal();
    renderAdminTable('reviews', document.getElementById('adminSearchReviews').value);
    alert('Отзыв сохранён!');
});

function editReview(id) {
    openReviewModal(id);
}

function deleteReview(id) {
    if (confirm('Удалить отзыв?')) {
        const row = document.querySelector(`#reviewsTab tr[data-id="${id}"]`);
        if (row) {
            row.style.opacity = '0';
            row.style.transition = 'opacity 0.3s';
        }
        setTimeout(() => {
            reviews = reviews.filter(r => r.id !== id);
            localStorage.setItem('reviews', JSON.stringify(reviews));
            renderAdminTable('reviews', document.getElementById('adminSearchReviews').value);
        }, 300);
    }
}

function exportReviews() {
    const date = new Date().toISOString().split('T')[0];
    const dataStr = JSON.stringify(reviews, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reviews-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// НАСТРОЙКИ
function openSettingsModal() {
    document.getElementById('siteName').value = settings.siteName;
    document.getElementById('storeAddress').value = settings.storeAddress;
    document.getElementById('newPassword').value = '';
    document.getElementById('settingsModal').style.display = 'block';
}

function closeSettingsModal() {
    document.getElementById('settingsModal').style.display = 'none';
}

function renderSettingsDisplay() {
    document.getElementById('settingsDisplay').innerHTML = `
        <p><strong>Название сайта:</strong> ${settings.siteName}</p>
        <p><strong>Адрес магазина:</strong> ${settings.storeAddress}</p>
        <p><strong>Пароль:</strong> ${atob(settings.password).replace(/./g, '*')} (скрыт)</p>
    `;
}

document.getElementById('settingsForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const newPassword = document.getElementById('newPassword').value.trim();
    if (newPassword) settings.password = btoa(newPassword);
    settings.siteName = document.getElementById('siteName').value.trim();
    settings.storeAddress = document.getElementById('storeAddress').value.trim();
    localStorage.setItem('settings', JSON.stringify(settings));
    document.getElementById('siteLogo').textContent = `Админка ${settings.siteName}`;
    closeSettingsModal();
    renderSettingsDisplay();
    alert('Настройки сохранены! Перезагрузите главную страницу для обновления карты.');
});

// Закрытие модалов
window.onclick = (e) => {
    if (e.target.classList.contains('modal')) {
        document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
    }
};