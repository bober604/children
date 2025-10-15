class ThemeSwitcher {
    constructor() {
        this.currentTheme = localStorage.getItem('adminTheme') || 'light';
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.createThemeToggle();
        this.setupEventListeners();
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('adminTheme', theme);
        this.currentTheme = theme;
        
        // Обновляем иконку переключателя
        this.updateThemeIcon();
    }

    createThemeToggle() {
        // Создаем кнопку переключателя
        const themeToggle = document.createElement('div');
        themeToggle.className = 'theme-toggle';
        themeToggle.innerHTML = `
            <div class="theme-toggle-container">
                <img class="theme-toggle-icon" src="${this.currentTheme === 'dark' ? '../img/light-sun.png' : '../img/dark-moon.png'}" alt="Переключить тему">
            </div>
        `;

        // Находим контейнер с кнопкой "Выйти"
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            // Вставляем переключатель темы перед кнопкой "Выйти"
            logoutButton.parentNode.insertBefore(themeToggle, logoutButton);
        } else {
            // Fallback: добавляем в навигацию, если кнопка выхода не найдена
            const navContainer = document.querySelector('.section-two__nav_container-1');
            if (navContainer) {
                navContainer.appendChild(themeToggle);
            }
        }
    }

    updateThemeIcon() {
        const toggleIcon = document.querySelector('.theme-toggle-icon');
        if (toggleIcon && toggleIcon.tagName === 'IMG') {
            toggleIcon.src = this.currentTheme === 'dark' ? '../img/light-sun.png' : '../img/dark-moon.png';
            toggleIcon.alt = this.currentTheme === 'dark' ? 'Переключить на светлую тему' : 'Переключить на темную тему';
        }
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.theme-toggle')) {
                this.toggleTheme();
            }
        });

        // Также добавляем обработчик клавиатуры для доступности
        document.addEventListener('keydown', (e) => {
            if (e.key === 't' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.toggleTheme();
            }
        });
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
    }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    new ThemeSwitcher();
});