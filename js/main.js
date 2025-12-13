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
let currentPage = 1;
const itemsPerPage = 6;

// Инициализация настроек (логотип и карта)
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.logo').textContent = settings.siteName;
    const mapIframe = document.querySelector('#map');
    if (mapIframe) {
        mapIframe.src = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2245.2!2d37.6173!3d55.7558!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x46b54a5a5a5a5a5a%3A0x1a1a1a1a1a1a1a1a!2s${encodeURIComponent(settings.storeAddress)}!5e0!3m2!1sen!2sus!4v1630000000000`;
    }
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
        card.onclick = () => openProductModal(product);
        card.innerHTML = `
            <div class="product-image"><img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/280x220?text=Изображение'"></div>
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
    document.getElementById('modalBody').innerHTML = `
        <img src="${product.image}" alt="${product.name}" style="width: 100%; border-radius: 15px; margin-bottom: 1rem;" onerror="this.src='https://via.placeholder.com/300?text=Изображение'">
        <h3>${product.name}</h3>
        <p><strong>Цена:</strong> ${product.price.toLocaleString()} ₽</p>
        <p>${product.desc}</p>
        <button class="btn" onclick="addToCart(${product.id}); event.stopPropagation();">В корзину</button>
    `;
    document.getElementById('productModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('productModal').style.display = 'none';
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
            <span>${item.name} (x${item.quantity || 1}) — ${item.price.toLocaleString()} ₽/шт (итого: ${(item.price * (item.quantity || 1)).toLocaleString()} ₽)</span>
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
    if (cart.length === 0) {
        alert('Корзина пуста!');
        return;
    }

    // Генерация сообщения
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    let message = `Здравствуйте! Хочу оформить заказ из ${settings.siteName}:\n\n`;
    message += cart.map((item, index) => `${index + 1}. ${item.name} (кол-во: ${item.quantity || 1}) — ${item.price.toLocaleString()} ₽/шт (итого: ${(item.price * (item.quantity || 1)).toLocaleString()} сом)`).join('\n');
    message += `\n\nИтого товаров: ${totalItems}\nИтого к оплате: ${totalPrice.toLocaleString()} Сом\n\nДоставка в ${settings.storeAddress || 'Ош'}. Жду подтверждения!`;

    // Открытие WhatsApp
const whatsappUrl = `https://wa.me/996222112120?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    // Очистка корзины
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
    toggleCart();
    alert('Заказ отправлен в WhatsApp! Проверьте чат.');
}

// Поиск и категории
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('searchInput').addEventListener('input', (e) => {
        renderProducts(getCurrentFilter(), e.target.value, 0, Infinity, currentPage = 1);
    });

    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderProducts(btn.dataset.category, document.getElementById('searchInput').value, 0, Infinity, currentPage = 1);
        });
    });

    // Кнопка применить фильтры
    const applyBtn = document.querySelector('.filters button');
    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            const min = parseInt(document.getElementById('minPrice').value) || 0;
            const max = parseInt(document.getElementById('maxPrice').value) || Infinity;
            renderProducts(getCurrentFilter(), document.getElementById('searchInput').value, min, max, currentPage = 1);
        });
    }
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

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    renderReviews();
    updateCartUI();
});

window.onclick = (e) => {
    if (e.target.classList.contains('modal')) {
        document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
    }
};
