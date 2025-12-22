// Данные
let products = JSON.parse(localStorage.getItem('products')) || [];
let reviews = JSON.parse(localStorage.getItem('reviews')) || [
    { id: 1, author: 'Иван И.', text: 'Лучший магазин! Быстрая доставка.', rating: 5, date: '2025-12-01' },
    { id: 2, author: 'Мария П.', text: 'Качество товаров на высоте.', rating: 4, date: '2025-12-02' },
    { id: 3, author: 'Алексей К.', text: 'Рекомендую всем!', rating: 5, date: '2025-12-03' }
];
let orders = JSON.parse(localStorage.getItem('orders')) || [
    { id: 1, orderNumber: 'ORD-001', customerName: 'Иван Петров', customerEmail: 'ivan@mail.ru', customerPhone: '+996 555 123456', deliveryAddress: 'г. Ош, ул. Ленина, д. 15', status: 'delivered', total: 15999, date: '2025-12-01', items: [{name: 'iPhone 15', quantity: 1, price: 1099}], note: 'Доставлено' },
    { id: 2, orderNumber: 'ORD-002', customerName: 'Мария Сидорова', customerEmail: 'maria@mail.ru', customerPhone: '+996 777 654321', deliveryAddress: 'г. Бишкек, ул. Чуй, д. 42', status: 'shipped', total: 8999, date: '2025-12-02', items: [{name: 'Samsung Galaxy S24', quantity: 1, price: 999}], note: 'В пути' },
    { id: 3, orderNumber: 'ORD-003', customerName: 'Алексей Иванов', customerEmail: 'alex@mail.ru', customerPhone: '+996 500 234567', deliveryAddress: 'г. Нарын, ул. Советская, д. 8', status: 'processing', total: 24998, date: '2025-12-03', items: [{name: 'MacBook Pro', quantity: 1, price: 1999}], note: 'На комплектации' }
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
    if (tab === 'warehouse') renderWarehouseData();
    if (tab === 'reviews') renderAdminTable('reviews', document.getElementById('adminSearchReviews').value);
    if (tab === 'orders') renderOrders(document.getElementById('adminSearchOrders').value);
    if (tab === 'analytics') renderAnalytics();
    if (tab === 'settings') renderSettingsDisplay();
}

// Debounce для поиска
function debouncedRender(tab) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        if (tab === 'orders') {
            renderOrders(document.getElementById('adminSearchOrders').value);
        } else {
            renderAdminTable(tab, document.getElementById(`adminSearch${tab.charAt(0).toUpperCase() + tab.slice(1)}`).value);
        }
    }, 300);
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
    if (tab === 'orders') {
        const checkboxes = document.querySelectorAll('.order-selector');
        checkboxes.forEach(cb => cb.checked = document.getElementById('selectAllOrders').checked);
    } else {
        const checkboxes = document.querySelectorAll(`#${tab}Tab .item-checkbox`);
        checkboxes.forEach(cb => cb.checked = document.getElementById(`selectAll${tab.charAt(0).toUpperCase() + tab.slice(1)}`).checked);
    }
}

// Массовое удаление
function bulkDelete(tab) {
    if (tab === 'orders') {
        const selectedIds = Array.from(document.querySelectorAll('.order-selector:checked')).map(cb => parseInt(cb.dataset.id));
        if (selectedIds.length === 0) return alert('Выберите заказы!');
        if (confirm(`Удалить ${selectedIds.length} заказ(ов)?`)) {
            orders = orders.filter(o => !selectedIds.includes(o.id));
            localStorage.setItem('orders', JSON.stringify(orders));
            renderOrders();
            alert(`✅ ${selectedIds.length} заказ(ов) удалено!`);
        }
        return;
    }
    
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

// ============ УПРАВЛЕНИЕ СКЛАДОМ ============
let warehouse = JSON.parse(localStorage.getItem('warehouse')) || [];
let warehouseHistory = JSON.parse(localStorage.getItem('warehouseHistory')) || [];

function openWarehouseModal(editId = null) {
    const form = document.getElementById('warehouseForm');
    form.reset();
    document.getElementById('warehouseEditId').value = editId || '';
    document.getElementById('warehouseModalTitle').textContent = editId ? 'Редактировать остаток' : 'Добавить остаток';
    
    // Заполняем список товаров
    const select = document.getElementById('warehouseProductId');
    select.innerHTML = '<option value="">Выберите товар...</option>';
    products.forEach(p => {
        select.innerHTML += `<option value="${p.id}">${p.name}</option>`;
    });
    
    if (editId) {
        const item = warehouse.find(w => w.id === editId);
        if (item) {
            document.getElementById('warehouseProductId').value = item.productId;
            document.getElementById('warehouseQuantity').value = item.quantity;
            document.getElementById('warehouseMinimum').value = item.minimum;
            document.getElementById('warehouseCostPrice').value = item.costPrice;
            document.getElementById('warehouseDate').value = item.date;
            document.getElementById('warehouseNote').value = item.note || '';
        }
    } else {
        document.getElementById('warehouseDate').value = new Date().toISOString().split('T')[0];
    }
    
    document.getElementById('warehouseModal').style.display = 'block';
}

function closeWarehouseModal() {
    document.getElementById('warehouseModal').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    const warehouseForm = document.getElementById('warehouseForm');
    if (warehouseForm) {
        warehouseForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const editId = document.getElementById('warehouseEditId').value;
            const productId = parseInt(document.getElementById('warehouseProductId').value);
            const quantity = parseInt(document.getElementById('warehouseQuantity').value);
            const minimum = parseInt(document.getElementById('warehouseMinimum').value);
            const costPrice = parseFloat(document.getElementById('warehouseCostPrice').value);
            const date = document.getElementById('warehouseDate').value;
            const note = document.getElementById('warehouseNote').value;

            if (editId) {
                const item = warehouse.find(w => w.id === parseInt(editId));
                if (item) {
                    item.productId = productId;
                    item.quantity = quantity;
                    item.minimum = minimum;
                    item.costPrice = costPrice;
                    item.date = date;
                    item.note = note;
                }
            } else {
                const newItem = {
                    id: warehouse.length > 0 ? Math.max(...warehouse.map(w => w.id)) + 1 : 1,
                    productId,
                    quantity,
                    minimum,
                    costPrice,
                    date,
                    note,
                    createdAt: new Date().toISOString()
                };
                warehouse.push(newItem);

                // Добавляем в историю поступлений
                warehouseHistory.push({
                    id: warehouseHistory.length > 0 ? Math.max(...warehouseHistory.map(w => w.id)) + 1 : 1,
                    productId,
                    quantity,
                    costPrice,
                    date,
                    totalSum: quantity * costPrice,
                    note
                });
            }

            localStorage.setItem('warehouse', JSON.stringify(warehouse));
            localStorage.setItem('warehouseHistory', JSON.stringify(warehouseHistory));
            closeWarehouseModal();
            renderWarehouseData();
        });
    }
});

function deleteWarehouseItem(id) {
    if (confirm('Удалить остаток?')) {
        warehouse = warehouse.filter(w => w.id !== id);
        localStorage.setItem('warehouse', JSON.stringify(warehouse));
        renderWarehouseData();
    }
}

function renderWarehouseData() {
    // Обновляем статистику
    const totalItems = warehouse.reduce((sum, w) => sum + w.quantity, 0);
    const lowStockItems = warehouse.filter(w => w.quantity > 0 && w.quantity <= w.minimum).length;
    const outOfStockItems = warehouse.filter(w => w.quantity === 0).length;
    const totalValue = warehouse.reduce((sum, w) => sum + (w.quantity * w.costPrice), 0);

    document.getElementById('totalStockItems').textContent = `${totalItems} шт`;
    document.getElementById('lowStockItems').textContent = `${lowStockItems} шт`;
    document.getElementById('outOfStockItems').textContent = `${outOfStockItems} шт`;
    document.getElementById('totalStockValue').textContent = `${totalValue.toFixed(2)} сом`;

    // Уведомления об окончании товаров
    const alerts = warehouse.filter(w => w.quantity <= w.minimum);
    const alertsDiv = document.getElementById('warehouseAlerts');
    if (alertsDiv) {
        alertsDiv.innerHTML = alerts.map(alert => {
            const product = products.find(p => p.id === alert.productId);
            const alertType = alert.quantity === 0 ? 'danger' : 'warning';
            return `
                <div class="alert alert-${alertType}" style="margin-bottom: 1rem; padding: 1rem; border-radius: 8px; background: ${alert.quantity === 0 ? '#f8d7da' : '#fff3cd'}; border-left: 4px solid ${alert.quantity === 0 ? '#f5c6cb' : '#ffc107'};">
                    ${alert.quantity === 0 ? '❌ ' : '⚠️ '}<strong>${product?.name || 'Товар'}</strong>: ${alert.quantity === 0 ? 'Нет в наличии' : `только ${alert.quantity} шт`}
                </div>
            `;
        }).join('');
    }

    // История поступлений
    const historyTable = document.getElementById('warehouseHistoryTable');
    if (historyTable) {
        historyTable.innerHTML = warehouseHistory.map(h => {
            const product = products.find(p => p.id === h.productId);
            return `
                <tr>
                    <td>${h.date}</td>
                    <td>${product?.name || 'Товар'}</td>
                    <td>${h.quantity} шт</td>
                    <td>${h.costPrice} сом</td>
                    <td>${h.totalSum.toFixed(2)} сом</td>
                    <td><button class="admin-btn-small delete-btn" onclick="deleteWarehouseHistory(${h.id})">🗑️ Удал.</button></td>
                </tr>
            `;
        }).reverse().join('');
    }

    // Текущие остатки
    const stockTable = document.getElementById('warehouseStockTable');
    if (stockTable) {
        stockTable.innerHTML = warehouse.map(w => {
            const product = products.find(p => p.id === w.productId);
            let status = '<span style="color: #28a745;">✅ В наличии</span>';
            if (w.quantity === 0) status = '<span style="color: #dc3545;">❌ Нет</span>';
            else if (w.quantity <= w.minimum) status = '<span style="color: #ffc107;">⚠️ На исходе</span>';

            return `
                <tr>
                    <td>${product?.name || 'Товар'}</td>
                    <td><strong>${w.quantity} шт</strong></td>
                    <td>${w.minimum} шт</td>
                    <td>${status}</td>
                    <td>
                        <button class="admin-btn-small edit-btn" onclick="openWarehouseModal(${w.id})">✏️ Ред.</button>
                        <button class="admin-btn-small delete-btn" onclick="deleteWarehouseItem(${w.id})">🗑️ Удал.</button>
                    </td>
                </tr>
            `;
        }).join('');
    }
}

function deleteWarehouseHistory(id) {
    if (confirm('Удалить запись из истории?')) {
        warehouseHistory = warehouseHistory.filter(w => w.id !== id);
        localStorage.setItem('warehouseHistory', JSON.stringify(warehouseHistory));
        renderWarehouseData();
    }
}

function exportWarehouse() {
    let csv = 'Товар,Количество,Минимум,Цена закупки,Стоимость товаров\n';
    warehouse.forEach(w => {
        const product = products.find(p => p.id === w.productId);
        csv += `"${product?.name || 'Товар'}",${w.quantity},${w.minimum},${w.costPrice},${(w.quantity * w.costPrice).toFixed(2)}\n`;
    });
    downloadCSV(csv, 'warehouse.csv');
}

function exportWarehousePDF() {
    alert('💡 Для полного экспорта PDF используйте функцию Print (Ctrl+P) и сохраните как PDF');
}

// ============ РАСШИРЕННАЯ АНАЛИТИКА ============
let pageViews = JSON.parse(localStorage.getItem('pageViews')) || {};
let salesData = JSON.parse(localStorage.getItem('salesData')) || [];

function trackPageView(productId) {
    if (!pageViews[productId]) pageViews[productId] = 0;
    pageViews[productId]++;
    localStorage.setItem('pageViews', JSON.stringify(pageViews));
}

function recordSale(productId, quantity, price) {
    salesData.push({
        id: salesData.length + 1,
        productId,
        quantity,
        price,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString()
    });
    localStorage.setItem('salesData', JSON.stringify(salesData));
}

function updateAnalytics() {
    renderAnalytics();
}

function renderAnalytics() {
    const dateRange = document.getElementById('analyticsDateRange')?.value || 'month';
    
    // Расчёт дат
    const today = new Date();
    let startDate = new Date();
    if (dateRange === 'week') startDate.setDate(today.getDate() - 7);
    else if (dateRange === 'month') startDate.setDate(today.getDate() - 30);
    else if (dateRange === 'year') startDate.setFullYear(today.getFullYear() - 1);
    else startDate = new Date(0); // все время

    // Фильтруем данные по диапазону дат
    const filteredSales = salesData.filter(s => new Date(s.date) >= startDate);

    // Статистика
    document.getElementById('totalProducts').textContent = products.length;
    document.getElementById('avgPrice').textContent = products.length > 0 ? 
        `${(products.reduce((sum, p) => sum + p.price, 0) / products.length).toFixed(2)} сом` : '0 сом';
    document.getElementById('totalReviews').textContent = reviews.length;
    
    const totalViews = Object.values(pageViews).reduce((sum, v) => sum + v, 0);
    document.getElementById('totalViews').textContent = totalViews;

    // График продаж по дням
    renderSalesChart(filteredSales);

    // Топ товаров по просмотрам
    renderTopProducts();

    // Статистика трафика
    renderTrafficStats(filteredSales);

    // Статистика по категориям
    renderCategoryStats();
}

function renderSalesChart(data) {
    const chartDiv = document.getElementById('salesChart');
    if (!chartDiv) return;

    // Группируем продажи по дням
    const salesByDay = {};
    data.forEach(sale => {
        salesByDay[sale.date] = (salesByDay[sale.date] || 0) + sale.quantity * sale.price;
    });

    const days = Object.keys(salesByDay).sort();
    const values = Object.values(salesByDay);

    if (values.length === 0) {
        chartDiv.innerHTML = '<p style="text-align: center; padding: 2rem; color: #999;">Нет данных для отображения</p>';
        return;
    }

    const maxValue = Math.max(...values);
    const barHeight = 250;

    chartDiv.innerHTML = `
        <div style="display: flex; align-items: flex-end; justify-content: space-around; height: 100%; gap: 0.5rem;">
            ${days.map((day, i) => {
                const percentage = (values[i] / maxValue) * 100;
                return `
                    <div style="text-align: center; flex: 1;">
                        <div title="${values[i].toFixed(2)} сом" style="background: linear-gradient(180deg, #667eea, #764ba2); height: ${percentage}%; border-radius: 5px 5px 0 0; min-height: 30px; margin-bottom: 0.5rem; cursor: pointer; transition: all 0.3s ease;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'"></div>
                        <small style="font-size: 0.8rem;">${day.split('-').slice(2).join('-')}</small>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function renderTopProducts() {
    const topTable = document.getElementById('topProductsTable');
    if (!topTable) return;

    const topProducts = products
        .map(p => ({
            ...p,
            views: pageViews[p.id] || 0,
            likes: p.id // в реальной системе это был бы счётчик лайков
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

    topTable.innerHTML = topProducts.map((p, i) => {
        const trend = i < 3 ? '📈 Растёт' : i < 7 ? '➡️ Стабильно' : '📉 Падает';
        return `
            <tr>
                <td><strong>${i + 1}</strong></td>
                <td>${p.name}</td>
                <td>${p.views}</td>
                <td>❤️ ${Math.floor(Math.random() * 100)}</td>
                <td>${trend}</td>
            </tr>
        `;
    }).join('');
}

function renderTrafficStats(data) {
    const trafficDiv = document.getElementById('trafficStats');
    if (!trafficDiv) return;

    const totalSales = data.reduce((sum, s) => sum + s.quantity, 0);
    const totalRevenue = data.reduce((sum, s) => sum + s.quantity * s.price, 0);
    const avgTransaction = data.length > 0 ? totalRevenue / data.length : 0;

    trafficDiv.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
            <div style="background: var(--card-bg); padding: 1rem; border-radius: 8px; border-left: 4px solid #667eea;">
                <h4>📊 Всего продаж</h4>
                <p style="font-size: 1.5rem; font-weight: bold; margin: 0;">${totalSales}</p>
            </div>
            <div style="background: var(--card-bg); padding: 1rem; border-radius: 8px; border-left: 4px solid #28a745;">
                <h4>💰 Выручка</h4>
                <p style="font-size: 1.5rem; font-weight: bold; margin: 0;">${totalRevenue.toFixed(2)} сом</p>
            </div>
            <div style="background: var(--card-bg); padding: 1rem; border-radius: 8px; border-left: 4px solid #ffc107;">
                <h4>🔄 Средний чек</h4>
                <p style="font-size: 1.5rem; font-weight: bold; margin: 0;">${avgTransaction.toFixed(2)} сом</p>
            </div>
            <div style="background: var(--card-bg); padding: 1rem; border-radius: 8px; border-left: 4px solid #0066cc;">
                <h4>📝 Транзакций</h4>
                <p style="font-size: 1.5rem; font-weight: bold; margin: 0;">${data.length}</p>
            </div>
        </div>
    `;
}

function renderCategoryStats() {
    const categoryDiv = document.getElementById('categoryStats');
    if (!categoryDiv) return;

    const stats = {};
    products.forEach(p => {
        stats[p.category] = (stats[p.category] || 0) + 1;
    });

    categoryDiv.innerHTML = Object.entries(stats).map(([category, count]) => `
        <div style="margin-bottom: 0.8rem; padding: 0.8rem; background: var(--card-bg); border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
            <span>${category.charAt(0).toUpperCase() + category.slice(1)}</span>
            <div style="display: flex; align-items: center; gap: 1rem;">
                <div style="width: 200px; height: 20px; background: #e9ecef; border-radius: 10px; overflow: hidden;">
                    <div style="width: ${(count / Math.max(...Object.values(stats))) * 100}%; height: 100%; background: linear-gradient(90deg, #667eea, #764ba2);"></div>
                </div>
                <strong>${count}</strong>
            </div>
        </div>
    `).join('');
}

function exportAnalyticsCSV() {
    const dateRange = document.getElementById('analyticsDateRange')?.value || 'month';
    let csv = 'Аналитика продаж - ' + new Date().toLocaleString() + '\n\n';
    csv += 'Обзор,Значение\n';
    csv += `Всего товаров,${products.length}\n`;
    csv += `Средняя цена,${(products.reduce((sum, p) => sum + p.price, 0) / products.length).toFixed(2)} сом\n`;
    csv += `Отзывов,${reviews.length}\n`;
    csv += `Просмотров,${Object.values(pageViews).reduce((sum, v) => sum + v, 0)}\n\n`;
    csv += 'Топ товаров,Просмотры\n';
    products
        .map(p => ({ ...p, views: pageViews[p.id] || 0 }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10)
        .forEach(p => {
            csv += `"${p.name}",${p.views}\n`;
        });
    downloadCSV(csv, 'analytics.csv');
}

function exportAnalyticsPDF() {
    alert('💡 Для полного экспорта PDF используйте функцию Print (Ctrl+P) и сохраните как PDF');
}

function downloadCSV(csv, filename) {
    const link = document.createElement('a');
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    link.download = filename;
    link.click();
}

/* ================================ */
/* 📋 ФУНКЦИИ УПРАВЛЕНИЯ ЗАКАЗАМИ */
/* ================================ */

// Отрисовка карточек заказов
function renderOrders(search = '') {
    const grid = document.getElementById('ordersGrid');
    if (!grid) return;
    
    let filteredOrders = orders;
    if (search) {
        filteredOrders = orders.filter(order => 
            order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
            order.customerName.toLowerCase().includes(search.toLowerCase()) ||
            order.customerEmail.toLowerCase().includes(search.toLowerCase())
        );
    }
    
    grid.innerHTML = '';
    filteredOrders.forEach(order => {
        const card = document.createElement('div');
        card.className = 'order-card';
        card.innerHTML = `
            <div class="order-header">
                <span class="order-number">${order.orderNumber}</span>
                <span class="order-status ${order.status}">
                    ${getStatusIcon(order.status)} ${getStatusText(order.status)}
                </span>
            </div>
            
            <div class="order-info">
                <div class="order-info-row">
                    <span class="order-info-label">Клиент:</span>
                    <span>${order.customerName}</span>
                </div>
                <div class="order-info-row">
                    <span class="order-info-label">Email:</span>
                    <span>${order.customerEmail}</span>
                </div>
                <div class="order-info-row">
                    <span class="order-info-label">Телефон:</span>
                    <span>${order.customerPhone}</span>
                </div>
                <div class="order-info-row">
                    <span class="order-info-label">Адрес:</span>
                    <span>${order.deliveryAddress}</span>
                </div>
                <div class="order-info-row">
                    <span class="order-info-label">Дата:</span>
                    <span>${new Date(order.date).toLocaleDateString('ru-RU')}</span>
                </div>
            </div>
            
            <div class="order-total">Сумма: ${order.total} сом</div>
            
            <div class="order-items">
                ${order.items.map(item => `
                    <div class="order-item">
                        ${item.name} x${item.quantity} = ${item.price * item.quantity} сом
                    </div>
                `).join('')}
            </div>
            
            <div class="order-actions">
                <button class="order-edit-btn" onclick="editOrder(${order.id})">✏️ Редактировать</button>
                <button class="order-delete-btn" onclick="deleteOrder(${order.id})">🗑️ Удалить</button>
            </div>
            
            <div class="order-checkbox">
                <input type="checkbox" class="order-selector" data-id="${order.id}">
            </div>
        `;
        grid.appendChild(card);
    });
}

// Получить текст статуса
function getStatusText(status) {
    const statusMap = {
        'pending': 'Ожидание',
        'processing': 'Обработка',
        'shipped': 'Отправлено',
        'delivered': 'Доставлено',
        'cancelled': 'Отменено'
    };
    return statusMap[status] || status;
}

// Получить иконку статуса
function getStatusIcon(status) {
    const iconMap = {
        'pending': '⏳',
        'processing': '⚙️',
        'shipped': '🚚',
        'delivered': '✅',
        'cancelled': '❌'
    };
    return iconMap[status] || '📦';
}

// Открыть модал редактирования заказа
function editOrder(id) {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    
    document.getElementById('editOrderId').value = order.id;
    document.getElementById('orderNumber').value = order.orderNumber;
    document.getElementById('orderCustomerName').value = order.customerName;
    document.getElementById('orderCustomerEmail').value = order.customerEmail;
    document.getElementById('orderCustomerPhone').value = order.customerPhone;
    document.getElementById('orderDeliveryAddress').value = order.deliveryAddress;
    document.getElementById('orderStatus').value = order.status;
    document.getElementById('orderTotal').value = order.total;
    document.getElementById('orderDate').value = order.date;
    document.getElementById('orderNote').value = order.note || '';
    
    const itemsDiv = document.getElementById('orderItems');
    itemsDiv.innerHTML = order.items.map(item => `
        <div class="order-item">
            <strong>${item.name}</strong> x${item.quantity} = ${item.price * item.quantity} сом
        </div>
    `).join('');
    
    document.getElementById('orderModalTitle').textContent = `Редактировать заказ ${order.orderNumber}`;
    document.getElementById('orderModal').style.display = 'block';
}

// Сохранить изменения заказа
document.addEventListener('DOMContentLoaded', () => {
    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
        orderForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const orderId = parseInt(document.getElementById('editOrderId').value);
            const order = orders.find(o => o.id === orderId);
            
            if (order) {
                order.customerName = document.getElementById('orderCustomerName').value;
                order.customerEmail = document.getElementById('orderCustomerEmail').value;
                order.customerPhone = document.getElementById('orderCustomerPhone').value;
                order.deliveryAddress = document.getElementById('orderDeliveryAddress').value;
                order.status = document.getElementById('orderStatus').value;
                order.note = document.getElementById('orderNote').value;
                
                localStorage.setItem('orders', JSON.stringify(orders));
                closeOrderModal();
                renderOrders();
                alert('✅ Заказ успешно обновлен!');
            }
        });
    }
});

// Закрыть модал заказа
function closeOrderModal() {
    document.getElementById('orderModal').style.display = 'none';
    document.getElementById('orderForm').reset();
}

// Удалить заказ
function deleteOrder(id) {
    if (confirm('⚠️ Вы уверены, что хотите удалить этот заказ?')) {
        orders = orders.filter(o => o.id !== id);
        localStorage.setItem('orders', JSON.stringify(orders));
        renderOrders();
        alert('✅ Заказ удален!');
    }
}

// Массовое удаление заказов
function bulkDelete(type) {
    if (type === 'orders') {
        const selected = Array.from(document.querySelectorAll('.order-selector:checked')).map(checkbox => parseInt(checkbox.dataset.id));
        if (selected.length === 0) {
            alert('❌ Выберите заказы для удаления');
            return;
        }
        
        if (confirm(`⚠️ Вы уверены, что хотите удалить ${selected.length} заказ(ов)?`)) {
            orders = orders.filter(o => !selected.includes(o.id));
            localStorage.setItem('orders', JSON.stringify(orders));
            renderOrders();
            alert('✅ Заказы удалены!');
        }
        return;
    }
}

// Экспорт заказов в Excel
function exportOrders() {
    let csv = 'Номер заказа,Клиент,Email,Телефон,Адрес,Статус,Сумма,Дата\n';
    orders.forEach(order => {
        csv += `"${order.orderNumber}","${order.customerName}","${order.customerEmail}","${order.customerPhone}","${order.deliveryAddress}","${getStatusText(order.status)}","${order.total}","${order.date}"\n`;
    });
    downloadCSV(csv, 'orders_export.csv');
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