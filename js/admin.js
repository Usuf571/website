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

// Функция для скрытия прелоадера
function hidePreloader() {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        setTimeout(() => {
            preloader.classList.add('hide');
            setTimeout(() => preloader.style.display = 'none', 500);
        }, 800);
    }
}

// Инициализация настроек (логотип)
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('siteLogo').textContent = `Админка ${settings.siteName}`;
    hidePreloader();
});

// Пароль (проверка с base64 + логика 3 попыток)
let loginAttempts = sessionStorage.getItem('loginAttempts') ? parseInt(sessionStorage.getItem('loginAttempts')) : 0;

function checkPassword() {
    const password = document.getElementById('adminPassword').value;
    const errorMessage = document.getElementById('errorMessage');
    
    if (!password) {
        errorMessage.textContent = 'Введите пароль!';
        errorMessage.style.display = 'block';
        return;
    }

    // Проверка пароля
    if (btoa(password) === settings.password) {
        document.getElementById('passwordPrompt').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
        sessionStorage.removeItem('loginAttempts');
        renderAdminTable('products');
        renderSettingsDisplay();
    } else {
        loginAttempts++;
        sessionStorage.setItem('loginAttempts', loginAttempts);
        
        const remainingAttempts = 3 - loginAttempts;
        
        if (remainingAttempts > 0) {
            errorMessage.textContent = `❌ Неверный пароль! Осталось попыток: ${remainingAttempts}`;
            errorMessage.style.display = 'block';
            document.getElementById('adminPassword').value = '';
            document.getElementById('adminPassword').focus();
        } else {
            // Закрыть страницу после 3 неправильных попыток
            errorMessage.textContent = '❌ Слишком много неправильных попыток! Доступ закрыт на эту сессию.';
            errorMessage.style.display = 'block';
            document.getElementById('adminPassword').disabled = true;
            document.querySelector('button.btn').disabled = true;
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        }
    }
}

// Нажатие Enter для входа
document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.getElementById('adminPassword');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                checkPassword();
            }
        });
    }
});

// Переключение вкладок
function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.getElementById(`${tab}Tab`).style.display = 'block';
    document.querySelectorAll('.sidebar a').forEach(a => a.classList.remove('active'));
    event.target.classList.add('active');
    if (tab === 'products') renderAdminTable('products', document.getElementById('adminSearchProducts').value);
    if (tab === 'reviews') renderAdminTable('reviews', document.getElementById('adminSearchReviews').value);
    if (tab === 'analytics') renderAnalytics();
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
    if (!tbody) return;
    
    const data = tab === 'products' ? products : reviews;
    let filtered = data.filter(item => {
        const searchLower = search.toLowerCase();
        return item.name?.toLowerCase().includes(searchLower) || 
               item.author?.toLowerCase().includes(searchLower) ||
               item.text?.toLowerCase().includes(searchLower) ||
               item.desc?.toLowerCase().includes(searchLower);
    });
    
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem;">Нет результатов</td></tr>`;
        return;
    }
    
    tbody.innerHTML = filtered.map(item => `
        <tr data-id="${item.id}">
            <td class="checkbox-col"><input type="checkbox" class="item-checkbox" value="${item.id}"></td>
            <td data-label="ID">${item.id}</td>
            <td data-label="${tab === 'products' ? 'Название' : 'Автор'}">${tab === 'products' ? item.name : item.author}</td>
            <td data-label="${tab === 'products' ? 'Цена' : 'Рейтинг'}">${tab === 'products' ? `${item.price} сом` : `★${item.rating}`}</td>
            <td data-label="${tab === 'products' ? 'Категория' : 'Дата'}">${tab === 'products' ? item.category : item.date}</td>
            <td data-label="Действия">
                <button class="admin-btn-small edit-btn" onclick="${tab === 'products' ? 'editProduct' : 'editReview'}(${item.id})">✏️ Ред.</button>
                <button class="admin-btn-small delete-btn" onclick="${tab === 'products' ? 'deleteProduct' : 'deleteReview'}(${item.id})">🗑️ Удал.</button>
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
// Глобальная переменная для хранения загруженного изображения
let uploadedImageData = null;

function openAddModal(editId = null) {
    const form = document.getElementById('productForm');
    form.reset();
    document.getElementById('modalTitle').textContent = editId ? 'Редактировать товар' : 'Добавить товар';
    document.getElementById('editId').value = editId || '';
    uploadedImageData = null;
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('productImageFile').value = '';
    
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

// Функция для загрузки изображения
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
        alert('Пожалуйста, выберите изображение!');
        return;
    }
    
    // Проверка размера файла (макс 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('Размер файла не должен превышать 5MB!');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        uploadedImageData = e.target.result;
        document.getElementById('previewImg').src = uploadedImageData;
        document.getElementById('imagePreview').style.display = 'block';
        document.getElementById('productImage').value = ''; // Очищаем URL поле
    };
    reader.readAsDataURL(file);
}

// Функция для очистки preview изображения
function clearImagePreview() {
    uploadedImageData = null;
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('productImageFile').value = '';
    document.getElementById('productImage').value = '';
}

document.getElementById('productForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    if (!form.checkValidity()) {
        alert('Заполните все поля правильно!');
        return;
    }
    
    // Проверяем, что есть изображение (либо загруженное, либо URL)
    let imageUrl = uploadedImageData || document.getElementById('productImage').value.trim();
    if (!imageUrl) {
        alert('Пожалуйста, добавьте изображение!');
        return;
    }
    
    const id = parseInt(document.getElementById('editId').value) || Date.now();
    const newProduct = {
        id,
        name: document.getElementById('productName').value.trim(),
        price: parseInt(document.getElementById('productPrice').value),
        desc: document.getElementById('productDesc').value.trim(),
        image: imageUrl,
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
    if (e.target.classList && e.target.classList.contains('modal')) {
        document.querySelectorAll('.modal').forEach(m => {
            if (m.style.display === 'block') {
                m.style.display = 'none';
            }
        });
    }
};

// Функции для статистики и аналитики
function renderAnalytics() {
    // Статистика товаров
    document.getElementById('totalProducts').textContent = products.length;
    
    const avgPrice = products.length > 0 
        ? Math.round(products.reduce((sum, p) => sum + p.price, 0) / products.length)
        : 0;
    document.getElementById('avgPrice').textContent = avgPrice + ' сом';
    
    // Отзывы
    document.getElementById('totalReviews').textContent = reviews.length;
    
    // Избранные товары (из localStorage)
    const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    document.getElementById('wishlistStats').textContent = wishlist.length;
    
    // Статистика по категориям
    const categories = ['phones', 'tablets', 'laptops'];
    const categoryStats = document.getElementById('categoryStats');
    categoryStats.innerHTML = categories.map(cat => {
        const count = products.filter(p => p.category === cat).length;
        const total = products.filter(p => p.category === cat).reduce((sum, p) => sum + p.price, 0);
        const categoryNames = {
            'phones': 'Телефоны',
            'tablets': 'Планшеты',
            'laptops': 'Ноутбуки'
        };
        return `
            <div style="margin-bottom: 1rem; padding: 1rem; background: var(--card-bg); border-radius: 10px; border-left: 4px solid var(--accent-color);">
                <strong>${categoryNames[cat]}</strong>: ${count} товаров | Сумма: ${total.toLocaleString()} сом
                <div style="width: 100%; background: #e0e0e0; height: 10px; border-radius: 5px; margin-top: 0.5rem; overflow: hidden;">
                    <div style="width: ${count * 20}%; background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); height: 100%;"></div>
                </div>
            </div>
        `;
    }).join('');
    
    // Популярные товары (по ID)
    const popularTable = document.getElementById('popularProductsTable');
    const popular = products.slice(0, 5);
    popularTable.innerHTML = popular.map(p => `
        <tr>
            <td>${p.name}</td>
            <td>${p.category === 'phones' ? 'Телефоны' : p.category === 'tablets' ? 'Планшеты' : 'Ноутбуки'}</td>
            <td>${p.price.toLocaleString()} сом</td>
            <td><span style="color: green; font-weight: bold;">✓ В наличии</span></td>
        </tr>
    `).join('');
}

// 🎄 Новогодний эффект снега (копируем из main.js)
function createSnowflakes() {
    const snowflakesContainer = document.getElementById('snowflakes');
    if (!snowflakesContainer) return;
    
    // Очищаем старые снежинки
    snowflakesContainer.innerHTML = '';
    
    // Создаём 10 снежинок
    const snowflakeSymbols = ['❄', '❅', '❆', '❇', '*'];
    
    for (let i = 0; i < 10; i++) {
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        snowflake.textContent = snowflakeSymbols[Math.floor(Math.random() * snowflakeSymbols.length)];
        snowflake.style.left = Math.random() * 100 + '%';
        snowflake.style.animationDelay = Math.random() * 2 + 's';
        snowflake.style.animationDuration = (Math.random() * 5 + 8) + 's';
        snowflakesContainer.appendChild(snowflake);
    }
    
    // Создаём новые снежинки каждые 3 секунды для непрерывного эффекта
    setInterval(() => {
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        snowflake.textContent = snowflakeSymbols[Math.floor(Math.random() * snowflakeSymbols.length)];
        snowflake.style.left = Math.random() * 100 + '%';
        snowflake.style.animationDuration = (Math.random() * 5 + 8) + 's';
        snowflakesContainer.appendChild(snowflake);
        
        // Удаляем старые снежинки, чтобы не перегружать память
        setTimeout(() => snowflake.remove(), (Math.random() * 5 + 8) * 1000);
    }, 800);
}

// Обработка Enter для входа в админку
document.addEventListener('DOMContentLoaded', () => {
    const passwordPrompt = document.getElementById('passwordPrompt');
    if (passwordPrompt && passwordPrompt.style.display !== 'none') {
        hidePreloader();
    }
    
    // Запуск снежинок при загрузке админки
    createSnowflakes();
});