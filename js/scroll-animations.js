// ========== РАСШИРЕННЫЕ ЭФФЕКТЫ СКРОЛИНГА ==========
// Этот файл содержит дополнительные функции для красивых эффектов при скролинге

/**
 * Инициализирует Parallax эффект для элементов
 * @param {string} selector - CSS селектор элементов
 * @param {number} speed - Скорость параллакса (0.5 = половина скорости скролла)
 */
function initParallax(selector, speed = 0.5) {
    const elements = document.querySelectorAll(selector);
    
    window.addEventListener('scroll', () => {
        elements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            
            if (elementPosition < windowHeight) {
                const offset = (windowHeight - elementPosition) * speed;
                element.style.transform = `translateY(${offset}px)`;
            }
        });
    });
}

/**
 * Инициализирует Counter анимацию (счётчик)
 * @param {string} selector - CSS селектор элементов со счётчиком
 * @param {number} duration - Длительность анимации в миллисекундах
 */
function initCounterAnimation(selector, duration = 1500) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.dataset.counted) {
                const finalValue = parseInt(entry.target.dataset.count) || parseInt(entry.target.textContent);
                animateCounter(entry.target, 0, finalValue, duration);
                entry.target.dataset.counted = 'true';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll(selector).forEach(element => observer.observe(element));
}

/**
 * Анимирует счётчик от одного числа к другому
 */
function animateCounter(element, start, end, duration) {
    const increment = end / (duration / 16); // 60 FPS
    let current = start;
    
    const interval = setInterval(() => {
        current += increment;
        if (current >= end) {
            element.textContent = end;
            clearInterval(interval);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

/**
 * Инициализирует Fade-in анимацию с фазированием
 * @param {string} selector - CSS селектор элементов
 * @param {number} delay - Задержка между элементами в миллисекундах
 */
function initStaggerAnimation(selector, delay = 100) {
    const elements = document.querySelectorAll(selector);
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('scroll-animate-in');
                }, delay * index);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    elements.forEach(element => {
        element.classList.add('scroll-animate');
        observer.observe(element);
    });
}

/**
 * Инициализирует Reveal анимацию (слева/справа)
 * @param {string} selector - CSS селектор элементов
 * @param {string} direction - 'left' или 'right'
 */
function initRevealAnimation(selector, direction = 'left') {
    const elements = document.querySelectorAll(selector);
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (direction === 'left') {
                    entry.target.style.animation = 'scrollFadeInLeft 0.8s ease forwards';
                } else if (direction === 'right') {
                    entry.target.style.animation = 'scrollFadeInRight 0.8s ease forwards';
                }
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    elements.forEach(element => observer.observe(element));
}

/**
 * Инициализирует Blur-in анимацию (появление из размытости)
 */
function initBlurInAnimation() {
    const style = document.createElement('style');
    style.textContent = `
        .blur-in {
            animation: blurFadeIn 0.8s ease forwards;
        }

        @keyframes blurFadeIn {
            0% {
                opacity: 0;
                filter: blur(10px);
            }
            100% {
                opacity: 1;
                filter: blur(0);
            }
        }
    `;
    document.head.appendChild(style);

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('blur-in');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('[data-blur-in]').forEach(element => observer.observe(element));
}

/**
 * Инициализирует Wave эффект при скролинге
 */
function initWaveAnimation() {
    const style = document.createElement('style');
    style.textContent = `
        .wave-animate {
            background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.3), transparent);
            background-size: 200% 100%;
            animation: wave 1.5s infinite;
        }

        @keyframes wave {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
        }
    `;
    document.head.appendChild(style);

    document.querySelectorAll('[data-wave]').forEach(element => {
        element.classList.add('wave-animate');
    });
}

/**
 * Инициализирует Rotate масштабирование при скролинге
 */
function initRotateScaleAnimation() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'rotateScale 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    const style = document.createElement('style');
    style.textContent = `
        @keyframes rotateScale {
            0% {
                opacity: 0;
                transform: rotate(-5deg) scale(0.9);
            }
            100% {
                opacity: 1;
                transform: rotate(0) scale(1);
            }
        }
    `;
    document.head.appendChild(style);

    document.querySelectorAll('[data-rotate-scale]').forEach(element => observer.observe(element));
}

/**
 * Инициализирует Slide-in анимацию
 * @param {string} selector - CSS селектор элементов
 * @param {string} direction - 'up', 'down', 'left', 'right'
 */
function initSlideInAnimation(selector, direction = 'up') {
    const elements = document.querySelectorAll(selector);
    
    const slideDirections = {
        'up': 'translateY(50px)',
        'down': 'translateY(-50px)',
        'left': 'translateX(50px)',
        'right': 'translateX(-50px)'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = `slideIn${direction.charAt(0).toUpperCase() + direction.slice(1)} 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards`;
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInUp {
            from { opacity: 0; transform: translateY(50px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInDown {
            from { opacity: 0; transform: translateY(-50px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInLeft {
            from { opacity: 0; transform: translateX(50px); }
            to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
            from { opacity: 0; transform: translateX(-50px); }
            to { opacity: 1; transform: translateX(0); }
        }
    `;
    document.head.appendChild(style);

    elements.forEach(element => observer.observe(element));
}

/**
 * Инициализирует Clip-path анимацию (открывающийся занавес)
 */
function initClipPathAnimation() {
    const style = document.createElement('style');
    style.textContent = `
        .clip-path-animate {
            animation: clipPathReveal 0.8s ease forwards;
        }

        @keyframes clipPathReveal {
            0% {
                clip-path: polygon(0 50%, 100% 50%, 100% 50%, 0 50%);
                opacity: 0;
            }
            100% {
                clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('clip-path-animate');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('[data-clip-path]').forEach(element => observer.observe(element));
}

/**
 * Инициализирует Number incrementing с разделителями
 */
function initNumberIncrement(selector) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.dataset.counted) {
                const target = parseInt(entry.target.dataset.target) || 100;
                const duration = parseInt(entry.target.dataset.duration) || 1000;
                
                let count = 0;
                const increment = target / (duration / 16);
                
                const timer = setInterval(() => {
                    count += increment;
                    if (count >= target) {
                        entry.target.textContent = target.toLocaleString();
                        clearInterval(timer);
                    } else {
                        entry.target.textContent = Math.floor(count).toLocaleString();
                    }
                }, 16);
                
                entry.target.dataset.counted = 'true';
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll(selector).forEach(el => observer.observe(el));
}

/**
 * Глобальная функция для инициализации ВСЕх анимаций
 */
function initAllScrollAnimations() {
    console.log('✨ Инициализирование всех эффектов скролинга...');
    
    // Основная анимация (уже сделана в main.js)
    initScrollAnimation();
    
    // Дополнительные эффекты (если нужны)
    initBlurInAnimation();
    initWaveAnimation();
    initRotateScaleAnimation();
    
    console.log('✅ Все эффекты скролинга активированы!');
}

// Инициализируем при загрузке DOM если этот скрипт загружен
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllScrollAnimations);
} else {
    initAllScrollAnimations();
}
