// Пример инициализации тестовых данных для демонстрации
// Вставьте этот код в консоль браузера (F12 > Console)

// ========== ТЕСТОВЫЕ ДАННЫЕ СКЛАДА ==========

// Примеры остатков на складе
const testWarehouse = [
    {
        id: 1,
        productId: 1,
        quantity: 42,
        minimum: 10,
        costPrice: 850,
        date: "2025-12-18",
        note: "В наличии",
        createdAt: new Date().toISOString()
    },
    {
        id: 2,
        productId: 2,
        quantity: 5,
        minimum: 15,
        costPrice: 750,
        date: "2025-12-15",
        note: "На исходе",
        createdAt: new Date().toISOString()
    },
    {
        id: 3,
        productId: 3,
        quantity: 0,
        minimum: 5,
        costPrice: 650,
        date: "2025-12-10",
        note: "Нет в наличии",
        createdAt: new Date().toISOString()
    },
    {
        id: 4,
        productId: 4,
        quantity: 15,
        minimum: 8,
        costPrice: 1600,
        date: "2025-12-12",
        note: "Нормально",
        createdAt: new Date().toISOString()
    }
];

// История поступлений
const testWarehouseHistory = [
    {
        id: 1,
        productId: 1,
        quantity: 50,
        costPrice: 850,
        date: "2025-12-18",
        totalSum: 42500,
        note: "Оптовый заказ"
    },
    {
        id: 2,
        productId: 2,
        quantity: 30,
        costPrice: 750,
        date: "2025-12-15",
        totalSum: 22500,
        note: "Дополнительный заказ"
    },
    {
        id: 3,
        productId: 3,
        quantity: 25,
        costPrice: 650,
        date: "2025-12-10",
        totalSum: 16250,
        note: "Первичный заказ"
    }
];

// Добавить тестовые данные для склада
localStorage.setItem('warehouse', JSON.stringify(testWarehouse));
localStorage.setItem('warehouseHistory', JSON.stringify(testWarehouseHistory));

console.log('✅ Тестовые данные склада добавлены!');

// ========== ТЕСТОВЫЕ ДАННЫЕ ПРОСМОТРОВ ==========

const testPageViews = {
    1: 125,
    2: 89,
    3: 234,
    4: 56
};

localStorage.setItem('pageViews', JSON.stringify(testPageViews));
console.log('✅ Тестовые данные просмотров добавлены!');

// ========== ТЕСТОВЫЕ ДАННЫЕ ПРОДАЖ ==========

const today = new Date();
const testSalesData = [
    // Вчера
    {
        id: 1,
        productId: 1,
        quantity: 2,
        price: 1099,
        date: new Date(today.getTime() - 24*60*60*1000).toISOString().split('T')[0],
        time: "10:30:45"
    },
    {
        id: 2,
        productId: 2,
        quantity: 1,
        price: 999,
        date: new Date(today.getTime() - 24*60*60*1000).toISOString().split('T')[0],
        time: "14:15:22"
    },
    // Два дня назад
    {
        id: 3,
        productId: 3,
        quantity: 3,
        price: 799,
        date: new Date(today.getTime() - 2*24*60*60*1000).toISOString().split('T')[0],
        time: "09:45:10"
    },
    {
        id: 4,
        productId: 4,
        quantity: 1,
        price: 1999,
        date: new Date(today.getTime() - 2*24*60*60*1000).toISOString().split('T')[0],
        time: "16:20:33"
    },
    // Три дня назад
    {
        id: 5,
        productId: 1,
        quantity: 2,
        price: 1099,
        date: new Date(today.getTime() - 3*24*60*60*1000).toISOString().split('T')[0],
        time: "11:11:11"
    },
    // Четыре дня назад
    {
        id: 6,
        productId: 2,
        quantity: 2,
        price: 999,
        date: new Date(today.getTime() - 4*24*60*60*1000).toISOString().split('T')[0],
        time: "13:30:00"
    },
    // Пять дней назад
    {
        id: 7,
        productId: 3,
        quantity: 1,
        price: 799,
        date: new Date(today.getTime() - 5*24*60*60*1000).toISOString().split('T')[0],
        time: "15:45:22"
    }
];

localStorage.setItem('salesData', JSON.stringify(testSalesData));
console.log('✅ Тестовые данные продаж добавлены!');

// ========== ПРОВЕРКА ДАННЫХ ==========

console.log('\n📊 ТЕКУЩИЕ ДАННЫЕ В LOCALSTORAGE:\n');
console.log('🏢 Склад:', JSON.parse(localStorage.getItem('warehouse')));
console.log('📜 История поступлений:', JSON.parse(localStorage.getItem('warehouseHistory')));
console.log('👁️ Просмотры товаров:', JSON.parse(localStorage.getItem('pageViews')));
console.log('💰 Продажи:', JSON.parse(localStorage.getItem('salesData')));

console.log('\n✅ Все тестовые данные готовы! Откройте admin.html для проверки.');

// ========== ПОЛЕЗНЫЕ ФУНКЦИИ АНАЛИЗА ==========

// Получить статистику по складу
function getWarehouseStats() {
    const w = JSON.parse(localStorage.getItem('warehouse')) || [];
    const totalItems = w.reduce((sum, item) => sum + item.quantity, 0);
    const lowStockItems = w.filter(item => item.quantity > 0 && item.quantity <= item.minimum).length;
    const outOfStockItems = w.filter(item => item.quantity === 0).length;
    const totalValue = w.reduce((sum, item) => sum + (item.quantity * item.costPrice), 0);
    
    return { totalItems, lowStockItems, outOfStockItems, totalValue };
}

// Получить статистику по продажам
function getSalesStats() {
    const sales = JSON.parse(localStorage.getItem('salesData')) || [];
    const totalQuantity = sales.reduce((sum, s) => sum + s.quantity, 0);
    const totalRevenue = sales.reduce((sum, s) => sum + (s.quantity * s.price), 0);
    
    return { 
        totalSales: sales.length,
        totalQuantity, 
        totalRevenue,
        averageTransaction: totalRevenue / (sales.length || 1)
    };
}

// Выполнить функции анализа
console.log('\n📈 СТАТИСТИКА СКЛАДА:', getWarehouseStats());
console.log('💼 СТАТИСТИКА ПРОДАЖ:', getSalesStats());

// ========== ОЧИСТКА ТЕСТОВЫХ ДАННЫХ ==========
// Если нужно удалить тестовые данные, выполните:
// localStorage.removeItem('warehouse');
// localStorage.removeItem('warehouseHistory');
// localStorage.removeItem('pageViews');
// localStorage.removeItem('salesData');
// console.log('❌ Тестовые данные удалены!');
