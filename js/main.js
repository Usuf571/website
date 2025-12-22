// Инициализация Dark Mode
let isDarkMode = localStorage.getItem('darkMode') === 'true';
if (isDarkMode) {
    document.body.classList.add('dark-mode');
    updateThemeIcon();
}

function updateThemeIcon() {
    const themeBtn = document.querySelector('.theme-toggle');
    if (isDarkMode) {
        // Солнце для тёмного режима
        themeBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
    } else {
        // Луна для светлого режима
        themeBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
    }
}

function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    
    // Добавляем переходный класс для плавного изменения фона
    document.body.style.transition = 'background 0.5s cubic-bezier(0.4, 0.0, 0.2, 1), color 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)';
    
    // Задержка 0.5 секунд перед изменением темы для визуального эффекта
    setTimeout(() => {
        document.body.classList.toggle('dark-mode');
        updateThemeIcon();
        localStorage.setItem('darkMode', isDarkMode);
    }, 250);
}

// Данные из localStorage или JSON
let products = JSON.parse(localStorage.getItem('products')) || [
    { id: 1, name: 'iPhone 15', price: 1099, desc: 'Флагман с AI-камерой.', image: 'https://via.placeholder.com/280x220/ff9a9e/ffffff?text=iPhone', category: 'phones' },
    { id: 2, name: 'Samsung Galaxy S24', price: 999, desc: 'Мощный с fold-экраном.', image: 'https://via.placeholder.com/280x220/6c5ce7/ffffff?text=Samsung', category: 'phones' },
    { id: 3, name: 'iPad Air', price: 799, desc: 'Легкий планшет для работы.', image: 'https://via.placeholder.com/280x220/a55eea/ffffff?text=iPad', category: 'tablets' },
    { id: 4, name: 'MacBook Pro', price: 1999, desc: 'Профессиональный ноутбук.', image: 'https://via.placeholder.com/280x220/4834d4/ffffff?text=MacBook', category: 'laptops' }
];
let reviews = JSON.parse(localStorage.getItem('reviews')) || [  // Добавил localStorage с fallback
    { text: 'Лучший магазин! Быстрая доставка.', author: 'Иван И.' },
    { text: 'Качество товаров на высоте.', author: 'Мария П.' },
    { text: 'Рекомендую всем!', author: 'Алексей К.' }
];
let settings = JSON.parse(localStorage.getItem('settings')) || {  // Добавил settings с fallback
    siteName: 'ЭлектроМир',
    storeAddress: 'Moscow, Russia'
};
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
let pageViews = JSON.parse(localStorage.getItem('pageViews')) || {};
let salesData = JSON.parse(localStorage.getItem('salesData')) || [];
let currentPage = 1;
const itemsPerPage = 6;

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

// Функция переключения мобильного меню
function toggleMenu() {
    const menu = document.getElementById('categoriesMenu');
    if (menu) {
        menu.classList.toggle('active');
    }
}

// Закрытие меню при клике на категорию
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const menu = document.getElementById('categoriesMenu');
            if (menu) menu.classList.remove('active');
        });
    });
});

// Инициализация настроек (логотип и карта)
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.logo').textContent = settings.siteName;
    
    // Правильное имя для iframe карты
    const mapIframe = document.querySelector('.map');
    if (mapIframe) {
        mapIframe.src = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2245.2!2d37.6173!3d55.7558!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x46b54a5a5a5a5a5a%3A0x1a1a1a1a1a1a1a1a!2s${encodeURIComponent(settings.storeAddress)}!5e0!3m2!1sen!2sus!4v1630000000000`;
    }
    
    // Скрыть прелоадер после загрузки
    hidePreloader();
});

// Рендер товаров с пагинацией и фильтрами (исправил вызовы для сохранения фильтров)
function renderProducts(filter = 'all', search = '', minPrice = 0, maxPrice = Infinity, page = 1) {
    let filtered = products.filter(p => 
        (filter === 'all' || p.category === filter) &&
        p.name.toLowerCase().includes(search.toLowerCase()) &&
        p.price >= minPrice && p.price <= maxPrice
    );
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const start = (page - 1) * itemsPerPage;
    const paginated = filtered.slice(start, start + itemsPerPage);

    const grid = document.getElementById('productsGrid');
    grid.innerHTML = '';
    paginated.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        const isFavorite = wishlist.some(p => p.id === product.id);
        card.onclick = () => openProductModal(product);
        card.innerHTML = `
            <div class="product-image" style="position: relative;">
                <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/280x220?text=Изображение'">
                <button class="heart-btn" data-id="${product.id}" style="position: absolute; top: 10px; right: 10px; background: white; border: none; font-size: 1.5rem; cursor: pointer; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.2); transition: transform 0.2s;" onclick="event.stopPropagation(); addToWishlist(${product.id});" title="Добавить в избранное">${isFavorite ? '❤️' : '🤍'}</button>
            </div>
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-price">${product.price.toLocaleString()} сом</div>
            </div>
        `;
        grid.appendChild(card);
    });

    renderPagination(totalPages, page, filter, search, minPrice, maxPrice);
}

// Пагинация (исправил: передаёт все параметры в renderProducts)
function renderPagination(totalPages, current, filter, search, minPrice, maxPrice) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    if (totalPages <= 1) return;
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.className = i === current ? 'active' : '';
        btn.onclick = () => renderProducts(filter, search, minPrice, maxPrice, currentPage = i);
        pagination.appendChild(btn);
    }
}

// Фильтры
function applyFilters() {
    const min = parseInt(document.getElementById('minPrice').value) || 0;
    const max = parseInt(document.getElementById('maxPrice').value) || Infinity;
    renderProducts(getCurrentFilter(), document.getElementById('searchInput').value, min, max, currentPage = 1);
}

function getCurrentFilter() {
    return document.querySelector('.category-btn.active')?.dataset.category || 'all';
}

// Модал товара
function openProductModal(product) {
    // Отслеживаем просмотр товара для аналитики
    if (!pageViews[product.id]) pageViews[product.id] = 0;
    pageViews[product.id]++;
    localStorage.setItem('pageViews', JSON.stringify(pageViews));
    
    const isFavorite = wishlist.some(p => p.id === product.id);
    const recommendations = getRecommendations(product.id);
    const frequentlyBought = getFrequentlyBought(product.id);
    
    let recommendationsHTML = '';
    if (recommendations.length > 0) {
        recommendationsHTML = `
            <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                <h4 style="margin-bottom: 1rem;">Похожие товары</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem;">
                    ${recommendations.map(r => `
                        <div style="cursor: pointer; padding: 0.5rem; border-radius: 10px; background: var(--card-bg); border: 1px solid var(--border-color);" onclick="openProductModal(products.find(p => p.id === ${r.id}))">
                            <img src="${r.image}" alt="${r.name}" style="width: 100%; height: 80px; object-fit: cover; border-radius: 8px; margin-bottom: 0.5rem;">
                            <div style="font-size: 0.85rem; font-weight: bold;">${r.name}</div>
                            <div style="color: var(--text-secondary); font-size: 0.8rem;">${r.price.toLocaleString()} сом</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    let frequentlyHTML = '';
    if (frequentlyBought.length > 0) {
        frequentlyHTML = `
            <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                <h4 style="margin-bottom: 1rem;">Часто покупают вместе</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem;">
                    ${frequentlyBought.map(r => `
                        <div style="cursor: pointer; padding: 0.5rem; border-radius: 10px; background: var(--card-bg); border: 1px solid var(--border-color);" onclick="openProductModal(products.find(p => p.id === ${r.id}))">
                            <img src="${r.image}" alt="${r.name}" style="width: 100%; height: 80px; object-fit: cover; border-radius: 8px; margin-bottom: 0.5rem;">
                            <div style="font-size: 0.85rem; font-weight: bold;">${r.name}</div>
                            <div style="color: var(--text-secondary); font-size: 0.8rem;">${r.price.toLocaleString()} сом</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    document.getElementById('modalBody').innerHTML = `
        <img src="${product.image}" alt="${product.name}" style="width: 100%; border-radius: 15px; margin-bottom: 1rem;" onerror="this.src='https://via.placeholder.com/300?text=Изображение'">
        <h3>${product.name}</h3>
        <p><strong>Цена:</strong> ${product.price.toLocaleString()} сом</p>
        <p>${product.desc}</p>
        <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
            <button class="btn" style="flex: 1;" onclick="addToCart(${product.id}); event.stopPropagation();">В корзину</button>
            <button class="heart-btn" data-id="${product.id}" style="padding: 0.75rem 1.5rem; font-size: 1.5rem; border: none; background: var(--card-bg); border-radius: 8px; cursor: pointer;" onclick="addToWishlist(${product.id}); this.textContent = wishlist.some(p => p.id === ${product.id}) ? '❤️' : '🤍';">${isFavorite ? '❤️' : '🤍'}</button>
        </div>
        ${recommendationsHTML}
        ${frequentlyHTML}
    `;
    document.getElementById('productModal').style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Корзина (обновлённая часть)
function addToCart(id) {
    const product = products.find(p => p.id === id);
    if (product) {
        const existingItem = cart.find(item => item.id === id);
        if (existingItem) {
            existingItem.quantity = (existingItem.quantity || 1) + 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartUI();
        alert('Товар добавлен в корзину!');
    }
}

function toggleCart() {
    const modal = document.getElementById('cartModal');
    modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
    updateCartUI();
}

function updateCartUI() {
    // Обновляем счётчики (общее количество товаров)
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    document.getElementById('cartCount').textContent = totalItems;
    document.getElementById('cartTotalItems').textContent = totalItems;

    const itemsDiv = document.getElementById('cartItems');
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

    if (cart.length === 0) {
        itemsDiv.innerHTML = '<div class="cart-empty">Корзина пуста. Добавьте товары!</div>';
        document.getElementById('cartTotal').textContent = '0';
        return;
    }

    // Рендер позиций с количеством и общей ценой
    itemsDiv.innerHTML = cart.map(item => `
        <div class="cart-item">
            <span>${item.name} (x${item.quantity || 1}) — ${item.price.toLocaleString()} сом/шт (итого: ${(item.price * (item.quantity || 1)).toLocaleString()} сом)</span>
            <button onclick="removeFromCart(${item.id}); event.stopPropagation();">Удалить 🗑️</button>
        </div>
    `).join('');
    document.getElementById('cartTotal').textContent = totalPrice.toLocaleString();
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
}

function checkout() {
    if (!currentUser) {
        alert('Пожалуйста, войдите в аккаунт перед оформлением заказа!');
        toggleAuthModal();
        return;
    }

    if (cart.length === 0) {
        alert('Корзина пуста!');
        return;
    }

    // Сохраняем заказ в историю
    const order = saveOrder();

    // Генерация сообщения
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    let message = `Здравствуйте! Хочу оформить заказ из ${settings.siteName}:\n\n`;
    message += cart.map((item, index) => `${index + 1}. ${item.name} (кол-во: ${item.quantity || 1}) — ${item.price.toLocaleString()} сом/шт (итого: ${(item.price * (item.quantity || 1)).toLocaleString()} сом)`).join('\n');
    message += `\n\nИтого товаров: ${totalItems}\nИтого к оплате: ${totalPrice.toLocaleString()} Сом\n\nОтправитель: ${currentUser.name}\nEmail: ${currentUser.email}\nДоставка в ${settings.storeAddress || 'Ош'}. Жду подтверждения!`;

    // Отслеживаем продажи для аналитики
    cart.forEach(item => {
        recordSale(item.id, item.quantity || 1, item.price);
    });

    // Открытие WhatsApp
    const whatsappUrl = `https://wa.me/996222112120?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    // Очистка корзины
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
    toggleCart();
    alert('✅ Заказ сохранён в вашу историю и отправлен в WhatsApp! Проверьте чат.');
}

// Поиск и категории
document.addEventListener('DOMContentLoaded', () => {
    // Поиск с задержкой (debounce)
    let searchTimeout;
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                renderProducts(getCurrentFilter(), e.target.value, 0, Infinity, currentPage = 1);
            }, 300);
        });
    }

    // Категории
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderProducts(btn.dataset.category, searchInput.value, 0, Infinity, currentPage = 1);
            
            // Закрыть мобильное меню
            const menu = document.getElementById('categoriesMenu');
            if (menu && window.innerWidth <= 768) {
                menu.classList.remove('active');
            }
        });
    });

    // Кнопка применить фильтры
    const applyBtn = document.querySelector('.search-btn');
    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            const min = parseInt(document.getElementById('minPrice').value) || 0;
            const max = parseInt(document.getElementById('maxPrice').value) || Infinity;
            renderProducts(getCurrentFilter(), searchInput.value, min, max, currentPage = 1);
        });
    }
    
    // Инициализация товаров и отзывов
    renderProducts();
    renderReviews();
    updateCartUI();
    updateWishlistUI();
});

// Карусель отзывов
let currentSlide = 0;
function renderReviews() {
    const inner = document.getElementById('carouselInner');
    inner.innerHTML = reviews.map((review, index) => `<div class="review-slide ${index === 0 ? 'active' : ''}"><p>"${review.text}"</p><strong>- ${review.author}</strong></div>`).join('');
}
function nextSlide() { currentSlide = (currentSlide + 1) % reviews.length; updateCarousel(); }
function prevSlide() { currentSlide = (currentSlide - 1 + reviews.length) % reviews.length; updateCarousel(); }
function updateCarousel() {
    document.querySelectorAll('.review-slide').forEach((slide, i) => slide.classList.toggle('active', i === currentSlide));
    document.querySelector('.carousel-inner').style.transform = `translateX(-${currentSlide * 100}%)`;
}
setInterval(nextSlide, 4000);

// Функции Вишлиста
function toggleWishlist() {
    const modal = document.getElementById('wishlistModal');
    modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
    if (modal.style.display === 'block') renderWishlist();
}

function addToWishlist(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const index = wishlist.findIndex(p => p.id === productId);
    if (index > -1) {
        wishlist.splice(index, 1);
    } else {
        wishlist.push(product);
    }
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    updateWishlistUI();
}

function removeFromWishlist(productId) {
    const index = wishlist.findIndex(p => p.id === productId);
    if (index > -1) {
        wishlist.splice(index, 1);
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
        updateWishlistUI();
        renderWishlist();
    }
}

function renderWishlist() {
    const container = document.getElementById('wishlistItems');
    const emptyMsg = document.getElementById('wishlistEmpty');
    
    if (wishlist.length === 0) {
        container.innerHTML = '';
        emptyMsg.style.display = 'block';
        return;
    }
    
    emptyMsg.style.display = 'none';
    container.innerHTML = wishlist.map(product => `
        <div class="product-card">
            <div class="product-image"><img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/280x220?text=Изображение'"></div>
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-price">${product.price.toLocaleString()} сом</div>
                <div class="wishlist-actions" style="margin-top: 0.5rem;">
                    <button class="btn" style="width: 100%; padding: 0.5rem;" onclick="addToCart(${product.id})">В корзину</button>
                    <button class="btn" style="width: 100%; padding: 0.5rem; background: #ff6b6b; margin-top: 0.5rem;" onclick="removeFromWishlist(${product.id})">Удалить</button>
                </div>
            </div>
        </div>
    `).join('');
}

function updateWishlistUI() {
    const count = document.getElementById('wishlistCount');
    count.textContent = wishlist.length;
    
    // Обновляем иконки сердечек на карточках
    document.querySelectorAll('.product-card').forEach(card => {
        const heartBtn = card.querySelector('.heart-btn');
        if (heartBtn) {
            const productId = parseInt(heartBtn.dataset.id);
            const isFavorite = wishlist.some(p => p.id === productId);
            heartBtn.textContent = isFavorite ? '❤️' : '🤍';
        }
    });
}

// Функции Рекомендаций
function getRecommendations(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return [];
    
    // Рекомендуем товары из той же категории и разной цены
    return products
        .filter(p => p.category === product.category && p.id !== productId)
        .slice(0, 3);
}

function getFrequentlyBought(productId) {
    // Рекомендуем товары из разных категорий
    const product = products.find(p => p.id === productId);
    if (!product) return [];
    
    const others = products.filter(p => p.category !== product.category);
    return others.slice(0, 2);
}

// 🎄 Новогодний эффект снега
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

window.onclick = (e) => {
    if (e.target.classList && e.target.classList.contains('modal')) {
        document.querySelectorAll('.modal').forEach(m => {
            if (m.style.display === 'block') {
                m.style.display = 'none';
            }
        });
    }
};

// 🔐 Система аутентификации и профиля пользователя
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let users = JSON.parse(localStorage.getItem('users')) || [];
let orders = JSON.parse(localStorage.getItem('orders')) || [];

function updateUserUI() {
    const userBtn = document.getElementById('userBtn');
    if (currentUser) {
        userBtn.innerHTML = '👤 ' + currentUser.name.split(' ')[0];
        userBtn.style.fontSize = '0.9rem';
    } else {
        userBtn.innerHTML = '👤';
        userBtn.style.fontSize = '1.5rem';
    }
}

function toggleAuthModal() {
    const modal = document.getElementById('authModal');
    modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
    if (modal.style.display === 'block') {
        switchAuthForm(true);
    }
}

function toggleProfileModal() {
    if (!currentUser) {
        toggleAuthModal();
        return;
    }
    const modal = document.getElementById('profileModal');
    modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
    if (modal.style.display === 'block') {
        renderProfile();
    }
}

function toggleUserMenu() {
    if (currentUser) {
        toggleProfileModal();
    } else {
        toggleAuthModal();
    }
}

function switchAuthForm(toLogin = null) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    if (toLogin === null) {
        loginForm.style.display = loginForm.style.display === 'none' ? 'block' : 'none';
        registerForm.style.display = registerForm.style.display === 'none' ? 'block' : 'none';
    } else if (toLogin) {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    }
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function registerUser() {
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirm = document.getElementById('registerConfirm').value;
    const errorEl = document.getElementById('authError');

    errorEl.style.display = 'none';

    if (!name || !email || !password || !confirm) {
        errorEl.textContent = 'Заполните все поля!';
        errorEl.style.display = 'block';
        return;
    }

    if (!validateEmail(email)) {
        errorEl.textContent = 'Введите корректный email!';
        errorEl.style.display = 'block';
        return;
    }

    if (password.length < 6) {
        errorEl.textContent = 'Пароль должен быть не менее 6 символов!';
        errorEl.style.display = 'block';
        return;
    }

    if (password !== confirm) {
        errorEl.textContent = 'Пароли не совпадают!';
        errorEl.style.display = 'block';
        return;
    }

    if (users.some(u => u.email === email)) {
        errorEl.textContent = 'Пользователь с таким email уже существует!';
        errorEl.style.display = 'block';
        return;
    }

    const newUser = {
        id: Date.now(),
        name,
        email,
        password: btoa(password), // Простое кодирование (для реального приложения нужна хеширование)
        created: new Date().toLocaleDateString('ru-RU')
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    currentUser = newUser;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    toggleAuthModal();
    updateUserUI();
    alert('Добро пожаловать, ' + name + '! ✨');
    
    // Очистка формы
    document.getElementById('registerForm').reset();
}

function loginUser() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('authError');

    errorEl.style.display = 'none';

    if (!email || !password) {
        errorEl.textContent = 'Заполните все поля!';
        errorEl.style.display = 'block';
        return;
    }

    const user = users.find(u => u.email === email && u.password === btoa(password));

    if (!user) {
        errorEl.textContent = 'Неверный email или пароль!';
        errorEl.style.display = 'block';
        return;
    }

    currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    toggleAuthModal();
    updateUserUI();
    alert('Рады видеть вас снова, ' + user.name + '! 👋');
    
    // Очистка формы
    document.getElementById('loginForm').reset();
}

function logoutUser() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateUserUI();
    toggleProfileModal();
    alert('Вы вышли из аккаунта! До встречи! 👋');
}

function renderProfile() {
    if (!currentUser) return;

    document.getElementById('profileName').textContent = currentUser.name;
    document.getElementById('profileEmail').textContent = currentUser.email;

    const userOrders = orders.filter(o => o.userId === currentUser.id);
    const ordersList = document.getElementById('ordersList');
    const noOrders = document.getElementById('noOrders');

    if (userOrders.length === 0) {
        ordersList.innerHTML = '';
        noOrders.style.display = 'block';
    } else {
        noOrders.style.display = 'none';
        ordersList.innerHTML = userOrders.map(order => `
            <div class="order-item">
                <h5>Заказ №${order.id}</h5>
                <p><strong>Дата:</strong> ${order.date}</p>
                <p><strong>Сумма:</strong> ${order.total.toLocaleString()} сом</p>
                <p><strong>Товаров:</strong> ${order.items.length}</p>
                <span class="order-status ${order.status === 'completed' ? 'completed' : 'pending'}">
                    ${order.status === 'completed' ? '✓ Доставлено' : '⏳ В обработке'}
                </span>
            </div>
        `).join('');
    }
}

function saveOrder() {
    if (!currentUser) {
        alert('Пожалуйста, войдите в аккаунт перед заказом!');
        toggleAuthModal();
        return;
    }

    if (cart.length === 0) {
        alert('Корзина пуста!');
        return;
    }

    const totalPrice = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    
    const order = {
        id: Date.now(),
        userId: currentUser.id,
        items: [...cart],
        total: totalPrice,
        date: new Date().toLocaleDateString('ru-RU'),
        status: 'pending'
    };

    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    return order;
}

// Функция для отслеживания продаж в аналитику
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

// ========== ЭФФЕКТ ПОЯВЛЕНИЯ ПРИ СКРОЛИНГЕ (Scroll Animation) ==========
function initScrollAnimation() {
    const observerOptions = {
        threshold: 0.1,           // Запускается когда 10% элемента видно
        rootMargin: '0px 0px -50px 0px'  // Начинать чуть раньше
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Добавляем класс анимации
                entry.target.classList.add('scroll-animate-in');
                // Останавливаем наблюдение для экономии ресурсов
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Наблюдаем за всеми элементами с классом scroll-animate
    document.querySelectorAll('.scroll-animate').forEach(element => {
        observer.observe(element);
    });
}

// Запуск анимации при загрузке и изменении содержимого
function initScrollAnimationForNewElements() {
    // Инициализируем при загрузке страницы
    setTimeout(() => {
        initScrollAnimation();
    }, 100);
}

// Переопределяем renderProducts для добавления классов анимации
const originalRenderProducts = renderProducts;
renderProducts = function(filter = 'all', search = '', minPrice = 0, maxPrice = Infinity, page = 1) {
    const result = originalRenderProducts.call(this, filter, search, minPrice, maxPrice, page);
    
    // Добавляем классы анимации для товаров
    document.querySelectorAll('.product-card').forEach((card, index) => {
        card.classList.add('scroll-animate');
        card.style.animationDelay = `${index * 0.1}s`;
    });
    
    // Инициализируем IntersectionObserver для новых элементов
    setTimeout(() => initScrollAnimation(), 100);
    
    return result;
};

// Запуск снежинок при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    createSnowflakes();
    updateUserUI();
    
    // Инициализируем анимацию скролинга
    initScrollAnimationForNewElements();
    
    // Добавляем классы анимации к начальным элементам
    document.querySelectorAll('.product-card').forEach((card, index) => {
        card.classList.add('scroll-animate');
        card.style.animationDelay = `${index * 0.1}s`;
    });
    
    document.querySelectorAll('.carousel-item').forEach((item, index) => {
        item.classList.add('scroll-animate');
        item.style.animationDelay = `${index * 0.15}s`;
    });
    
    document.querySelectorAll('.review-item').forEach((item, index) => {
        item.classList.add('scroll-animate');
        item.style.animationDelay = `${index * 0.15}s`;
    });
    
    // Добавляем анимацию к другим элементам на странице
    document.querySelectorAll('section').forEach((section, index) => {
        section.classList.add('scroll-animate');
        section.style.animationDelay = `${index * 0.2}s`;
    });
    
    initScrollAnimation();
});
