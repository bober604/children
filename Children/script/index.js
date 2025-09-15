const guestChannel = new BroadcastChannel('guest_orders_channel');

// Функция для отправки сообщений
function sendToGuest(message) {
    try {
        guestChannel.postMessage(message);
        console.log('📤 Отправлено в гостевой режим:', message.type, message);
    } catch (error) {
        console.error('❌ Ошибка отправки в гостевой режим:', error);
    }
}

guestChannel.onmessage = (event) => {
    if (event.data.type === 'REQUEST_SYNC') {
        this.syncAllOrders();
    }
};

// Функция для синхронизации всех заказов
function syncAllOrders() {
    const orders = [];
    const orderElements = document.querySelectorAll('.section-two__box');
    
    orderElements.forEach(element => {
        if (element.isConnected && !element.classList.contains('in-section-two__box')) {
            const order = {
                id: element.dataset.timerId,
                child_name: element.querySelector('.section-two__box_Child-1__info_container-sag_name')?.textContent || '',
                phone: element.querySelector('.section-two__box_Child-1__info_parents_number')?.textContent || '',
                note: element.querySelector('.section-two__box_Child-1__info_parents_par')?.textContent || '',
                sum: parseFloat(element.querySelector('.price')?.textContent.replace('руб.', '').trim()) || 0,
                duration: element.querySelector('.section-two__box_Child-1__nav_section_par-3')?.textContent || '',
                start_time: element.querySelector('.section-two__box_Child-1__nav_section_par-2')?.textContent || '',
                remaining_seconds: getRemainingTime(element),
                status: 'active'
            };
            orders.push(order);
        }
    });
    
    sendToGuest({
        type: 'SYNC_ALL_ORDERS',
        orders: orders
    });
}

// Вызовем синхронизацию при загрузке
document.addEventListener("DOMContentLoaded", function() {
    setTimeout(syncAllOrders, 1000);
});

// ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ====================
let activeTimers = new Map();
let orderCount = 0;
let totalRevenue = 0;

// ==================== ГЛОБАЛЬНЫЕ ФУНКЦИИ ====================
// Функция для отправки запросов на сервер
function sendRequest(url, method, data) {
    console.log('Отправляемые данные:', data);
        
    return fetch(url, {
        method: method,
        headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify(data)
    })
    .then(res => {
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json(); // ← Возвращаем промис с данными
    })
    .then(data => {
        console.log('Успешный ответ:', data);
        return data; // ← Возвращаем данные
    })
    .catch(error => {
        console.error('Ошибка:', error);
        return null; // ← Возвращаем null при ошибке
    });
}

function stopTimer(orderId) {
    if (activeTimers.has(orderId)) {
        const timerInfo = activeTimers.get(orderId);
        clearInterval(timerInfo.interval);
        if (timerInfo.worker) {
            timerInfo.worker.terminate();
        }
        activeTimers.delete(orderId);
        return true;
    }
    return false;
}

function addDeleteFunctionality(orderContainer) {
    var deleteButton = orderContainer.querySelector(".section-two__box_Child-3");
    
    if (!deleteButton) return;

    // Удаляем старые обработчики, чтобы избежать дублирования
    const newDeleteButton = deleteButton.cloneNode(true);
    deleteButton.parentNode.replaceChild(newDeleteButton, deleteButton);

    newDeleteButton.addEventListener("click", function() {
        var confirmation = confirm("Хотите удалить заказ?");
        
        if (confirmation) {
            var secondConfirmation = confirm("Вы точно уверены?");
            
            if (secondConfirmation) {
                // Получаем сумму из data-атрибута или из DOM
                const sum = parseFloat(orderContainer.dataset.creationSum) || 
                           parseFloat(orderContainer.querySelector('.price')?.textContent.replace('руб.', '').trim()) || 0;

                // Останавливаем таймер
                const timerId = orderContainer.dataset.timerId;
                if (timerId && typeof stopTimer === 'function') {
                    stopTimer(timerId);
                }

                // Используем АКТУАЛЬНУЮ сумму из data-атрибута
                const currentSum = orderContainer.dataset.creationSum || sum;
                const creationDate = orderContainer.dataset.creationDate;
                const creationTime = orderContainer.dataset.creationTime;

                console.log('Данные для удаления:', {
                    sum: currentSum,
                    date: creationDate,
                    time: creationTime
                });

                // Отправляем запрос на удаление (если функция доступна)
                if (typeof sendRequest === 'function') {
                    // ИСПРАВЛЕННЫЙ URL - добавлен слеш в конце
                    sendRequest("http://127.0.0.1:8000/order/", "DELETE", {
                        sum: currentSum,
                        date: creationDate,
                        time: creationTime
                    }).then(result => {
                        if (result && result.message) {
                            // УСПЕШНО УДАЛЕНО - ОБНОВЛЯЕМ ИНТЕРФЕЙС
                            orderContainer.remove();
                            orderCount--;
                            
                            var orderCountElement = document.querySelector(".section-two__nav_block_sag-2");
                            if (orderCountElement) {
                                orderCountElement.textContent = orderCount;
                            }
                            
                            totalRevenue -= currentSum;
                            
                            var revenueElement = document.querySelector(".revenue");
                            if (revenueElement) {
                                revenueElement.textContent = Math.max(0, totalRevenue).toFixed(0);
                            }
                            
                            console.log('✅ Заказ успешно удален');
                            
                            if (typeof saveOrdersToStorage === 'function') {
                                saveOrdersToStorage();
                            }
                        } else {
                            console.log('❌ Ошибка при удалении заказа');
                            // Удаляем локально даже при ошибке сервера
                            orderContainer.remove();
                            updateCounters();
                            saveOrdersToStorage();
                        }
                    }).catch(error => {
                        console.log('❌ Ошибка сети при удалении заказа:', error);
                        // Удаляем локально при ошибке сети
                        orderContainer.remove();
                        updateCounters();
                        saveOrdersToStorage();
                    });
                } else {
                    // Если sendRequest недоступна, удаляем локально
                    orderContainer.remove();
                    updateCounters();
                    saveOrdersToStorage();
                }

                const deleteData = {
                    type: 'ORDER_DELETED', 
                    order_id: orderContainer.dataset.timerId
                };
                sendToGuest(deleteData);
            }
        }
    });
}

// Функция для получения текущего времени
function getCurrentTime() {
    var currentTime = new Date();
    var hours = currentTime.getHours();
    var minutes = currentTime.getMinutes();
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    return hours + ":" + minutes;
}

// Функция для получения времени пребывания
function getDuration(selectedButtons) {
    var durationTime = "";
    selectedButtons.forEach(function(button) {
        var timeText = button.querySelector("h2").textContent.trim(); // Получаем текст времени и удаляем лишние пробелы
        durationTime += timeText + ", ";
    });
    return durationTime.slice(0, -2); // Удаляем последнюю запятую
}

// Функция для расчета времени обратного отсчета
function calculateCountdownTime(selectedButtons) {
    var totalSeconds = getTotalDurationInSeconds(selectedButtons);
    var countdownDate = new Date();
    countdownDate.setSeconds(countdownDate.getSeconds() + totalSeconds);
    return formatTime(countdownDate.getHours()) + ":" + formatTime(countdownDate.getMinutes()) + ":" + formatTime(countdownDate.getSeconds());
}

// Функция для преобразования первой буквы строки в заглавную
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Вспомогательная функция для расчета цены
function calculatePriceFromDuration(durationText) {
    const priceMap = {
        '15 мин.': 50,
        '30 мин.': 100,
        '1 час': 150,
        '2 часа': 250,
        'Аренда 1 час': 2000,
        'Аренда 2 часа': 4000
    };
        
    return priceMap[durationText] || 0;
}

function updateCounters() {
    const orders = document.querySelectorAll('.section-two__box');
    let currentOrderCount = orders.length;
    
    let currentTotalRevenue = 0;
    orders.forEach(order => {
        const priceElement = order.querySelector('.price');
        if (priceElement) {
            const priceText = priceElement.textContent.replace('руб.', '').trim();
            currentTotalRevenue += parseFloat(priceText) || 0;
        }
    });
    
    // Обновляем глобальные переменные
    orderCount = currentOrderCount;
    totalRevenue = currentTotalRevenue;
    
    // Обновляем DOM
    var orderCountElement = document.querySelector(".section-two__nav_block_sag-2");
    if (orderCountElement) orderCountElement.textContent = orderCount;
    
    var revenueElement = document.querySelector(".revenue");
    if (revenueElement) revenueElement.textContent = totalRevenue.toFixed(0);
}

function formatDisplayTime(timeString) {
    if (!timeString) return '';
    
    // Если время в формате "HH.MM.SS" (с точками)
    if (timeString.includes('.')) {
        const parts = timeString.split('.');
        if (parts.length >= 2) {
            return parts[0] + ':' + parts[1]; // Берем только часы и минуты
        }
    }
    
    // Если время уже в правильном формате "HH:MM"
    if (timeString.includes(':')) {
        const parts = timeString.split(':');
        if (parts.length >= 2) {
            return parts[0] + ':' + parts[1]; // Берем только часы и минуты
        }
    }
    
    return timeString; // Возвращаем как есть, если формат неизвестен
}

function setupBurgerMenuHandlers() {
    // Удаляем все старые обработчики чтобы избежать дублирования
    document.removeEventListener('click', handleBurgerMenuClick);
    
    // Добавляем единый обработчик для всего документа
    document.addEventListener('click', handleBurgerMenuClick);
}

function handleBurgerMenuClick(event) {
    // Обработка клика по бургер-меню (обычные заказы)
    if (event.target.closest('.section-two__box_Child-1__info_burger')) {
        const burger = event.target.closest('.section-two__box_Child-1__info_burger');
        const container = burger.closest('.section-two__box');
        
        if (container) {
            toggleBurgerMenu(container, burger);
            event.stopPropagation();
        }
        return;
    }
    
    // Обработка клика по бургер-меню (завершенные заказы)
    if (event.target.closest('.in-section-two__box_Child-1__info_burger')) {
        const burger = event.target.closest('.in-section-two__box_Child-1__info_burger');
        const container = burger.closest('.in-section-two__box');
        
        if (container) {
            toggleBurgerMenu(container, burger);
            event.stopPropagation();
        }
        return;
    }
    
    // Закрытие меню при клике вне его области
    const allContainers = document.querySelectorAll('.section-two__box');
    allContainers.forEach(container => {
        const burger = container.querySelector('.section-two__box_Child-1__info_burger');
        if (burger && burger.classList.contains('section-two__box_Child-1__info_burger-active')) {
            closeBurgerMenu(container, burger);
        }
    });
}

function toggleBurgerMenu(container, burger) {
    const isActive = burger.classList.contains('section-two__box_Child-1__info_burger-active');
    
    // Сначала закрываем все другие открытые меню
    document.querySelectorAll('.section-two__box_Child-1__info_burger.section-two__box_Child-1__info_burger-active').forEach(otherBurger => {
        if (otherBurger !== burger) {
            const otherContainer = otherBurger.closest('.section-two__box');
            closeBurgerMenu(otherContainer, otherBurger);
        }
    });
    
    // Переключаем текущее меню
    if (isActive) {
        closeBurgerMenu(container, burger);
    } else {
        openBurgerMenu(container, burger);
    }
}

function openBurgerMenu(container, burger) {
    burger.classList.add('section-two__box_Child-1__info_burger-active');
    burger.classList.add('rotated'); // Добавляем класс поворота
    
    const children = container.querySelectorAll('.section-two__box_Child-2, .section-two__box_Child-3, .section-two__box_Child-4');
    
    children.forEach((child, index) => {
        child.classList.add('active');
        if (window.innerWidth < 480) {
            child.style.marginTop = `${60 + 50 * index}px`;
        }
    });
}

function closeBurgerMenu(container, burger) {
    burger.classList.remove('section-two__box_Child-1__info_burger-active');
    burger.classList.remove('rotated'); // Убираем класс поворота
    
    const children = container.querySelectorAll('.section-two__box_Child-2, .section-two__box_Child-3, .section-two__box_Child-4');
    children.forEach(child => {
        child.classList.remove('active');
        child.style.marginTop = '0';
    });
}

// Функция для закрытия всех бургер-меню
function closeAllBurgerMenus() {
    document.querySelectorAll('.section-two__box_Child-1__info_burger.section-two__box_Child-1__info_burger-active').forEach(burger => {
        const container = burger.closest('.section-two__box');
        burger.classList.remove('rotated'); // Сбрасываем анимацию
        closeBurgerMenu(container, burger);
    });
    
    // Также сбрасываем для завершенных заказов
    document.querySelectorAll('.in-section-two__box_Child-1__info_burger.section-two__box_Child-1__info_burger-active').forEach(burger => {
        const container = burger.closest('.in-section-two__box');
        burger.classList.remove('rotated'); // Сбрасываем анимацию
        closeBurgerMenu(container, burger);
    });
}

function clearDailyOrders() {
    // Находим все заказы
    const orders = document.querySelectorAll('.section-two__box');
    
    // Удаляем все заказы из DOM
    orders.forEach(order => {
        order.remove();
    });
    
    // Сбрасываем счетчики
    orderCount = 0;
    totalRevenue = 0;
    
    // Обновляем отображение счетчиков
    updateCounters();
    
    // Очищаем localStorage от заказов (но сохраняем другие данные если нужно)
    localStorage.removeItem('orders');
    localStorage.setItem('orderCount', '0');
    localStorage.setItem('totalRevenue', '0');
    
    console.log('Все заказы очищены (ежедневная очистка)');
}

function checkAndClearDailyOrders() {
    const now = new Date();
    const currentTime = now.getHours() + ':' + now.getMinutes();
    
    // Получаем дату последней очистки из localStorage
    const lastClearDate = localStorage.getItem('lastClearDate');
    const today = now.toDateString();
    
    // Если сегодня еще не очищали или время 00:00-00:01
    if (lastClearDate !== today || (currentTime === '0:0' || currentTime === '0:1')) {
        clearDailyOrders();
        localStorage.setItem('lastClearDate', today);
    }
}

function setupDailyClear() {
    // Проверяем сразу при загрузке
    checkAndClearDailyOrders();
    
    // Проверяем каждую минуту
    setInterval(checkAndClearDailyOrders, 60000);
    
    // Альтернативно: проверяем каждую секунду в полночь
    setInterval(() => {
        const now = new Date();
        if (now.getHours() === 0 && now.getMinutes() === 0 && now.getSeconds() === 0) {
            clearDailyOrders();
            localStorage.setItem('lastClearDate', now.toDateString());
        }
    }, 1000);
}

function stopAllTimersForContainer(orderContainer) {
    const orderId = orderContainer.dataset.timerId;
    if (orderId && activeTimers.has(orderId)) {
        const timerInfo = activeTimers.get(orderId);
        clearInterval(timerInfo.interval);
        if (timerInfo.worker) {
            timerInfo.worker.terminate();
        }
        activeTimers.delete(orderId);
    }
    
    // Также ищем любые другие таймеры, которые могут ссылаться на этот контейнер
    for (const [id, timer] of activeTimers.entries()) {
        if (timer.container === orderContainer) {
            clearInterval(timer.interval);
            if (timer.worker) {
                timer.worker.terminate();
            }
            activeTimers.delete(id);
        }
    }
}

function formatTime(time) {
    return time < 10 ? "0" + time : time;
}

function getRemainingTime(orderContainer) {
    const countdownElement = orderContainer.querySelector(".section-two__box_Child-1__info_time");
    if (!countdownElement) return 0;
    
    const timeText = countdownElement.textContent.trim();
    const timeParts = timeText.split(':');
    
    if (timeParts.length !== 3) return 0;
    
    const hours = parseInt(timeParts[0]) || 0;
    const minutes = parseInt(timeParts[1]) || 0;
    const seconds = parseInt(timeParts[2]) || 0;
    
    // Если время "00:00:00", возвращаем 0
    if (hours === 0 && minutes === 0 && seconds === 0) {
        return 0;
    }
    
    return hours * 3600 + minutes * 60 + seconds;
}

// Функция для получения общей продолжительности заказа в секундах
function getTotalDurationInSeconds(selectedButtons) {
    let totalSeconds = 0;
    selectedButtons.forEach(function(button) {
        const timeText = button.textContent ? button.textContent.trim() : '';
           
        if (timeText.includes('15 мин.')) {
            totalSeconds += 15 * 60;
        } else if (timeText.includes('30 мин.')) {
            totalSeconds += 30 * 60;
        } else if (timeText.includes('1 час')) {
            totalSeconds += 60 * 60;
        } else if (timeText.includes('2 часа')) {
            totalSeconds += 120 * 60;
        } else if (timeText.includes('Аренда 1 час')) {
            totalSeconds += 60 * 60;
        } else if (timeText.includes('Аренда 2 часа')) {
            totalSeconds += 120 * 60;
        }
    });
    return totalSeconds;
}

function startCountdown(selectedButtons, orderContainer, initialSeconds = null) {
    let orderId = orderContainer.dataset.timerId;
    
    // Гарантированно останавливаем предыдущий таймер для этого контейнера
    if (orderId && activeTimers.has(orderId)) {
        clearInterval(activeTimers.get(orderId).interval);
        if (activeTimers.get(orderId).worker) {
            activeTimers.get(orderId).worker.terminate();
        }
        activeTimers.delete(orderId);
    }
    
    // Создаем новый ID если нужно
    if (!orderId) {
        orderId = 'timer_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        orderContainer.dataset.timerId = orderId;
    }
    
    const countdownElement = orderContainer.querySelector(".section-two__box_Child-1__info_time");
    const pauseButton = orderContainer.querySelector(".section-two__box_Child-1__info_img");
    
    const totalSeconds = getTotalDurationInSeconds(selectedButtons);
    
    // Вычисляем оставшееся время
    let remainingSeconds = initialSeconds !== null ? initialSeconds : totalSeconds;
    
    if (initialSeconds === null && orderContainer.dataset.creationTime) {
        const creationTime = orderContainer.dataset.creationTime;
        const now = new Date();
        
        const [hours, minutes, seconds] = creationTime.split(/[.:]/).map(Number);
        const creationDate = new Date();
        creationDate.setHours(hours, minutes, seconds || 0, 0);
        
        const elapsedSeconds = Math.floor((now - creationDate) / 1000);
        remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
    }

    const startTime = Date.now();
    let isPaused = false;
    let pauseStartTime = 0;
    let totalPausedTime = 0;

    function updateDisplay(seconds) {
        if (!countdownElement) return;
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secondsLeft = seconds % 60;
        
        countdownElement.textContent = formatTime(hours) + ":" + formatTime(minutes) + ":" + formatTime(secondsLeft);
        
        // Автоматически помечаем как завершенный при достижении 0
        if (seconds <= 0 && !orderContainer.classList.contains('in-section-two__box')) {
            const completeButton = orderContainer.querySelector(".section-two__box_Child-2");
            if (completeButton) completeButton.click();
        }
    }

    function getAccurateRemainingTime() {
        if (isPaused) {
            return remainingSeconds;
        }
        
        const currentTime = Date.now();
        const elapsedSeconds = Math.floor((currentTime - startTime - totalPausedTime) / 1000);
        return Math.max(0, remainingSeconds - elapsedSeconds);
    }

    // Инициализируем отображение
    updateDisplay(remainingSeconds);

    const interval = setInterval(() => {
        if (!isPaused && orderContainer.isConnected) {
            const currentRemaining = getAccurateRemainingTime();
            updateDisplay(currentRemaining);
            
            if (currentRemaining <= 0) {
                clearInterval(interval);
                activeTimers.delete(orderId);
                saveOrdersToStorage();
            }
        }
    }, 1000);
    
    // Сохраняем информацию о таймере
    activeTimers.set(orderId, { 
        interval: interval, 
        isPaused: isPaused,
        remainingSeconds: remainingSeconds,
        container: orderContainer
    });

    // Обработчик паузы
    if (pauseButton) {
        // Удаляем старые обработчики
        const newPauseButton = pauseButton.cloneNode(true);
        pauseButton.parentNode.replaceChild(newPauseButton, pauseButton);
        
        newPauseButton.addEventListener("click", function() {
            isPaused = !isPaused;
            this.classList.toggle("section-two__box_Child-1__info_img-active");
            
            // Обновляем состояние в хранилище таймеров
            if (activeTimers.has(orderId)) {
                activeTimers.get(orderId).isPaused = isPaused;
            }
            
            if (isPaused) {
                pauseStartTime = Date.now();
            } else {
                totalPausedTime += Date.now() - pauseStartTime;
            }
            
            saveOrdersToStorage();
        });
    }
    
    return orderId;
}

// Функция для подсчета количества имен в строке
function countNames(nameString) {
    if (!nameString || typeof nameString !== 'string') return 0;
    return nameString.split(/\s+/).filter(name => name.length > 0).length;
}

// ==================== ФУНКЦИИ ДЛЯ LOCALSTORAGE ====================

// Функции для работы с LocalStorage
function saveOrdersToStorage() {
    const orders = [];
    
    const orderElements = document.querySelectorAll('.section-two__box');
    
    for (let i = orderElements.length - 1; i >= 0; i--) {
        const orderElement = orderElements[i];
        
        if (!orderElement.isConnected) continue;
        
        const startTimeElement = orderElement.querySelector('.section-two__box_Child-1__nav_section:nth-child(2) .section-two__box_Child-1__nav_section_par-2');
        const startTime = startTimeElement ? startTimeElement.textContent.trim() : '';
        
        const pauseButton = orderElement.querySelector('.section-two__box_Child-1__info_img');
        const isPaused = pauseButton ? pauseButton.classList.contains('section-two__box_Child-1__info_img-active') : false;
        
        // Сохраняем состояние "заказ выполнен"
        const isCompletedStyle = orderElement.classList.contains('in-section-two__box');
        
        const order = {
            name: orderElement.querySelector('.section-two__box_Child-1__info_container-sag_name')?.textContent || '',
            phone: orderElement.querySelector('.section-two__box_Child-1__info_parents_number')?.textContent || '',
            note: orderElement.querySelector('.section-two__box_Child-1__info_parents_par')?.textContent || '',
            sum: parseFloat(orderElement.querySelector('.price')?.textContent.replace('руб.', '').trim()) || 0,
            duration: orderElement.querySelector('.section-two__box_Child-1__nav_section_par-3')?.textContent || '',
            startTime: startTime,
            remainingTime: getRemainingTime(orderElement),
            totalTime: getTotalDurationFromElement(orderElement),
            creationDate: orderElement.dataset.creationDate || '',
            creationTime: orderElement.dataset.creationTime || '',
            isCompleted: orderElement.querySelector('.section-two__box_Child-1__info_time')?.textContent === '00:00:00',
            isPaused: isPaused,
            isCompletedStyle: orderElement.classList.contains('in-section-two__box'),
            isTimerStyled: orderElement.querySelector('.section-two__box_Child-1__info_time')?.classList.contains('in-section-two__box_Child-1__info_time'),
            isPauseButtonStyled: orderElement.querySelector('.section-two__box_Child-1__info_img')?.classList.contains('in-section-two__box_Child-1__info_img')
        };
        orders.push(order);
    }
    
    // Получаем актуальные значения счетчиков из DOM
    const orderCountElement = document.querySelector(".section-two__nav_block_sag-2");
    const revenueElement = document.querySelector(".revenue");
    
    const currentOrderCount = orderCountElement ? parseInt(orderCountElement.textContent) || 0 : 0;
    const currentTotalRevenue = revenueElement ? parseFloat(revenueElement.textContent) || 0 : 0;
    
    localStorage.setItem('orders', JSON.stringify(orders));
    localStorage.setItem('orderCount', currentOrderCount.toString());
    localStorage.setItem('totalRevenue', currentTotalRevenue.toString());
}

function loadOrdersFromStorage() {
    try {
        const savedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
        
        // Исправляем старые данные: если startTime содержит "руб.", используем creationTime
        const fixedOrders = savedOrders.map(order => {
            if (order.startTime && order.startTime.includes('руб.')) {
                order.startTime = order.creationTime || '';
            }
            return order;
        });
        
        // Сохраняем исправленные данные
        if (savedOrders.length > 0 && fixedOrders.some((order, index) => order.startTime !== savedOrders[index].startTime)) {
            localStorage.setItem('orders', JSON.stringify(fixedOrders));
        }
        
        // Получаем счетчики из DOM или из localStorage
        const orderCountElement = document.querySelector(".section-two__nav_block_sag-2");
        const revenueElement = document.querySelector(".revenue");
        
        let savedOrderCount = parseInt(localStorage.getItem('orderCount') || '0');
        let savedTotalRevenue = parseFloat(localStorage.getItem('totalRevenue') || '0');
        
        if (orderCountElement && orderCountElement.textContent !== '0') {
            savedOrderCount = parseInt(orderCountElement.textContent) || savedOrderCount;
        }
        
        if (revenueElement && revenueElement.textContent !== '0') {
            savedTotalRevenue = parseFloat(revenueElement.textContent) || savedTotalRevenue;
        }
        
        return {
            orders: fixedOrders, // Используем исправленные данные
            orderCount: savedOrderCount,
            totalRevenue: savedTotalRevenue
        };
    } catch (error) {
        console.error('Ошибка загрузки из localStorage:', error);
        return { orders: [], orderCount: 0, totalRevenue: 0 };
    }
}

function getTotalDurationFromElement(orderElement) {
    const durationText = orderElement.querySelector('.section-two__box_Child-1__nav_section_par-3')?.textContent || '';
    
    if (durationText.includes('15 мин.')) return 15 * 60;
    if (durationText.includes('30 мин.')) return 30 * 60;
    if (durationText.includes('1 час')) return 60 * 60;
    if (durationText.includes('2 часа')) return 120 * 60;
    if (durationText.includes('Аренда 1 час')) return 60 * 60;
    if (durationText.includes('Аренда 2 часа')) return 120 * 60;
    
    return 0;
}

function recreateOrderFromStorage(orderData) {
    var orderContainer = document.createElement("div");
    orderContainer.classList.add("section-two__box");
    
    // Сохраняем данные в data-атрибуты
    orderContainer.dataset.creationDate = orderData.creationDate;
    orderContainer.dataset.creationTime = orderData.creationTime;
    orderContainer.dataset.creationSum = orderData.sum;

    // Определяем оставшееся время
    let remainingTime = orderData.isCompleted ? 0 : orderData.remainingTime;
    const hours = Math.floor(remainingTime / 3600);
    const minutes = Math.floor((remainingTime % 3600) / 60);
    const seconds = remainingTime % 60;
    const timeString = formatTime(hours) + ":" + formatTime(minutes) + ":" + formatTime(seconds);

    // Форматируем время для отображения
    const displayTime = formatDisplayTime(orderData.creationTime || orderData.startTime || '');

    var orderHTML = `
        <div class="section-two__box_Child-1">
            <nav class="section-two__box_Child-1__nav">
                <div class="section-two__box_Child-1__nav_section">
                    <p class="section-two__box_Child-1__nav_section_par-1">Сумма</p>
                    <p class="section-two__box_Child-1__nav_section_par-2 price">${orderData.sum} руб.</p>
                </div>
                <div class="section-two__box_Child-1__nav_section">
                    <p class="section-two__box_Child-1__nav_section_par-1">Зашёл в</p>
                    <p class="section-two__box_Child-1__nav_section_par-2">${displayTime}</p>
                </div>
                <div class="section-two__box_Child-1__nav_section">
                    <p class="section-two__box_Child-1__nav_section_par-1">Посещение</p>
                    <p class="section-two__box_Child-1__nav_section_par-2 section-two__box_Child-1__nav_section_par-3">${orderData.duration}</p>
                </div>
            </nav>
            <div class="section-two__box_Child-1_line"></div>

            <div class="section-two__box_Child-1__info">
                <div class="section-two__box_Child-1__info_parents">
                    <h5 class="section-two__box_Child-1__info_parents_number">${orderData.phone}</h5>
                    <p class="section-two__box_Child-1__info_parents_par">${orderData.note}</p>
                </div>
                <div class="section-two__box_Child-1__info_line-1"></div>
                <div class="section-two__box_Child-1__info_container-sag">
                    <h3 class="section-two__box_Child-1__info_container-sag_name">${orderData.name}</h3>
                </div>
                <h3 class="section-two__box_Child-1__info_sag">Осталось:</h3>
                <h3 class="section-two__box_Child-1__info_time">${timeString}</h3>
                <div class="section-two__box_Child-1__info_img"></div>
                <div class="section-two__box_Child-1__info_line-3-mobile"></div>
                <img class="section-two__box_Child-1__info_burger" src="./img/burger.svg" alt="burger">
            </div>
        </div>
        
        <div class="section-two__box_Child-2">
            <h5 class="section-two__box_Child-2_sag">Заказ выполенен</h5>
        </div>

        <div class="section-two__box_Child-3">
            <h5 class="section-two__box_Child-3_sag">Удалить</h5>
            <div class="section-two__box_Child-3_img"></div>
        </div>
        
        <div class="section-two__box_Child-4">
            <h5 class="section-two__box_Child-4_sag">Изменить заказ</h5>
        </div>`;

    orderContainer.innerHTML = orderHTML;

    // Добавляем в DOM
    var sectionTwoLending = document.querySelector(".section-two_lending");
    if (sectionTwoLending) {
        sectionTwoLending.insertBefore(orderContainer, sectionTwoLending.firstChild);
    }

    // Восстанавливаем состояние "заказ выполнен"
    if (orderData.isCompletedStyle) {
        orderContainer.classList.add('in-section-two__box');
        
        // Применяем стили к дочерним элементам
        const applyStyle = (selector, className) => {
            const element = orderContainer.querySelector(selector);
            if (element) element.classList.add(className);
        };
        
        applyStyle('.section-two__box_Child-1', 'in-section-two__box_Child-1');
        applyStyle('.section-two__box_Child-1_line', 'in-section-two__box_Child-1_line');
        applyStyle('.section-two__box_Child-1__info_line-1', 'in-section-two__box_Child-1__info_line-1');
        applyStyle('.section-two__box_Child-1__info_container-sag_name', 'in-section-two__box_Child-1__info_container-sag_name');
        applyStyle('.section-two__box_Child-2', 'in-section-two__box_Child-2');
        applyStyle('.section-two__box_Child-2_sag', 'in-section-two__box_Child-2_sag');
        applyStyle('.section-two__box_Child-3', 'in-section-two__box_Child-3');
        applyStyle('.section-two__box_Child-3_sag', 'in-section-two__box_Child-3_sag');
        applyStyle('.section-two__box_Child-4', 'in-section-two__box_Child-4');
        applyStyle('.section-two__box_Child-4_sag', 'in-section-two__box_Child-4_sag');
        
        // Применяем стили к таймеру и кнопке паузы
        applyStyle('.section-two__box_Child-1__info_time', 'in-section-two__box_Child-1__info_time');
        applyStyle('.section-two__box_Child-1__info_img', 'in-section-two__box_Child-1__info_img');
    }

    // Если заказ не завершен, запускаем таймер
    if (!orderData.isCompleted && remainingTime > 0) {
        const fakeButtons = [{
            textContent: orderData.duration,
            querySelector: () => ({ textContent: orderData.duration })
        }];
        
        if (typeof startCountdown === 'function') {
            // Передаем remainingTime как initialSeconds
            startCountdown(fakeButtons, orderContainer, remainingTime);
            
            // Восстанавливаем состояние паузы
            if (orderData.isPaused) {
                const pauseButton = orderContainer.querySelector('.section-two__box_Child-1__info_img');
                if (pauseButton) {
                    setTimeout(() => {
                        pauseButton.click();
                    }, 100);
                }
            }
        }
    }

    // Добавляем обработчики событий
    if (typeof addDeleteFunctionality === 'function') {
        addDeleteFunctionality(orderContainer);
    }
    
    if (typeof addOrderCompletedFunctionality === 'function') {
        addOrderCompletedFunctionality(orderContainer);
    }
    
    if (typeof addEditOrderFunctionality === 'function') {
        addEditOrderFunctionality(orderContainer);
    }

    return orderContainer;

    // Переинициализируем обработчики после создания элемента
    setTimeout(() => {
        setupBurgerMenuHandlers();
    }, 100);
}

// Функция для форматирования времени в нужный формат (HH.MM.SS)
function formatTimeString(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}.${minutes}.${seconds}`;
}

// Функция для форматирования даты в нужный формат (DD.MM.YYYY)
function formatDateString(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

// ОБРАБОТЧИКИ ДЛЯ ЗАКАЗОВ
function addOrderCompletedFunctionality(orderContainer) {
    var completeButton = orderContainer.querySelector(".section-two__box_Child-2");
    
    if (!completeButton) return;
    
    const newCompleteButton = completeButton.cloneNode(true);
    completeButton.parentNode.replaceChild(newCompleteButton, completeButton);

    newCompleteButton.addEventListener("click", function() {
        const targetBlock = orderContainer.closest(".section-two__box");
        if (!targetBlock) return;
        
        const isCompleting = !targetBlock.classList.contains('in-section-two__box');
        
        if (isCompleting) {
            // ЗАВЕРШАЕМ ЗАКАЗ - останавливаем таймер
            const timerId = targetBlock.dataset.timerId;
            if (timerId && typeof stopTimer === 'function') {
                stopTimer(timerId);
            }
        } else {
            // ВОЗОБНОВЛЯЕМ ЗАКАЗ - перезапускаем таймер
            const durationElement = targetBlock.querySelector('.section-two__box_Child-1__nav_section_par-3');
            if (durationElement) {
                const durationText = durationElement.textContent.trim();
                const fakeButtons = [{
                    textContent: durationText,
                    querySelector: () => ({ textContent: durationText })
                }];
                
                // Получаем оставшееся время из элемента
                const countdownElement = targetBlock.querySelector(".section-two__box_Child-1__info_time");
                if (countdownElement) {
                    const timeText = countdownElement.textContent.trim();
                    const timeParts = timeText.split(':');
                    
                    if (timeParts.length === 3) {
                        const hours = parseInt(timeParts[0]) || 0;
                        const minutes = parseInt(timeParts[1]) || 0;
                        const seconds = parseInt(timeParts[2]) || 0;
                        const remainingSeconds = hours * 3600 + minutes * 60 + seconds;
                        
                        if (remainingSeconds > 0) {
                            // Перезапускаем таймер с оставшимся временем
                            startCountdown(fakeButtons, targetBlock, remainingSeconds);
                        }
                    }
                }
            }
        }
        
        // Переключаем визуальное состояние
        targetBlock.classList.toggle("in-section-two__box");
        
        // Переключаем классы для всех элементов
        const toggleClass = (selector, className) => {
            const element = targetBlock.querySelector(selector);
            if (element) element.classList.toggle(className);
        };
        
        const classesToToggle = [
            [".section-two__box_Child-1", "in-section-two__box_Child-1"],
            [".section-two__box_Child-1_line", "in-section-two__box_Child-1_line"],
            [".section-two__box_Child-1__info_line-1", "in-section-two__box_Child-1__info_line-1"],
            [".section-two__box_Child-1__info_container-sag_name", "in-section-two__box_Child-1__info_container-sag_name"],
            [".section-two__box_Child-2", "in-section-two__box_Child-2"],
            [".section-two__box_Child-2_sag", "in-section-two__box_Child-2_sag"],
            [".section-two__box_Child-3", "in-section-two__box_Child-3"],
            [".section-two__box_Child-3_sag", "in-section-two__box_Child-3_sag"],
            [".section-two__box_Child-4", "in-section-two__box_Child-4"],
            [".section-two__box_Child-4_sag", "in-section-two__box_Child-4_sag"],
            [".section-two__box_Child-1__info_time", "in-section-two__box_Child-1__info_time"],
            [".section-two__box_Child-1__info_img", "in-section-two__box_Child-1__info_img"]
        ];
        
        classesToToggle.forEach(([selector, className]) => {
            toggleClass(selector, className);
        });
        
        // Обновляем состояние паузы
        const pauseButton = targetBlock.querySelector(".section-two__box_Child-1__info_img");
        if (pauseButton && pauseButton.classList.contains("section-two__box_Child-1__info_img-active")) {
            pauseButton.click(); // Снимаем паузу при возобновлении
        }
        
        // Сохраняем состояние
        if (typeof saveOrdersToStorage === 'function') {
            setTimeout(saveOrdersToStorage, 100);
        }

        const completeData = {
            type: 'ORDER_COMPLETED',
            order_id: targetBlock.dataset.timerId
        };
        sendToGuest(completeData);
    });
}

function addEditOrderFunctionality(orderContainer) {
    var editButton = orderContainer.querySelector(".section-two__box_Child-4");
    
    editButton.addEventListener("click", function(event) {
        const editOrderButton = event.target.closest(".section-two__box_Child-4");
        
        if (editOrderButton) {
            // Удаляем предыдущий блок, если он существует
            const existingOrderChangeBlock = document.querySelector(".section-one__orderChange");
            if (existingOrderChangeBlock) {
                existingOrderChangeBlock.remove();
            }

                // Функция для преобразования времени из формата "1 час", "30 мин.", "Аренда" в "HH:MM:SS"
                function formatDurationToHHMMSS(duration) {
                    let totalMinutes = 0;
                
                    if (duration.includes("Аренда")) {
                        if (duration.includes("1 час")) {
                            totalMinutes = 60; // Аренда 1 час
                        } else if (duration.includes("2 часа")) {
                            totalMinutes = 120; // Аренда 2 часа
                        } else {
                            console.error("Неподдерживаемый формат аренды:", duration);
                            return "00:00:00";
                        }
                    } else {
                        if (duration.includes("час")) {
                            totalMinutes += parseInt(duration) * 60;
                        }
                        if (duration.includes("мин")) {
                            totalMinutes += parseInt(duration);
                        }
                    }
                    
                    const hours = Math.floor(totalMinutes / 60);
                    const minutes = totalMinutes % 60;
                    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`;
                }
        

                // Функция для вычисления прошедшего времени
                const calculateElapsedTime = (initialDuration, currentCountdown) => {
                    const initialSeconds = timeToSeconds(initialDuration); // Преобразуем начальное время в секунды
                    const currentSeconds = timeToSeconds(currentCountdown); // Преобразуем текущее оставшееся время в секунды
                    const elapsedSeconds = initialSeconds - currentSeconds; // Вычисляем разницу
                    return Math.max(elapsedSeconds, 0); // Убеждаемся, что результат не отрицательный
                };

                // Функция для преобразования времени в секунды
                function timeToSeconds(time) {
                    const [hours, minutes, seconds] = time.split(":").map(Number);
                    return (hours * 3600) + (minutes * 60) + seconds;
                }

                // Проверка и преобразование `durationValue`
                function validateAndFormatDuration(duration) {
                    if (duration.includes("час") || duration.includes("мин")) {
                        return formatDurationToHHMMSS(duration);
                    }
                    console.error("Неверный формат времени:", duration);
                    return "00:00:00"; // Значение по умолчанию для некорректных данных
                }
        
        
                const sectionOne = document.querySelector(".section-one");

                // Находим родительский блок заказа
                const parentOrder = editOrderButton.closest(".section-two__box");

                // Извлекаем данные из текущего заказа
                const nameValue = parentOrder.querySelector(".section-two__box_Child-1__info_container-sag_name").textContent.trim();
                const phoneValue = parentOrder.querySelector(".section-two__box_Child-1__info_parents_number").textContent.trim();
                const noteValue = parentOrder.querySelector(".section-two__box_Child-1__info_parents_par").textContent.trim();
                const durationValue = parentOrder.querySelector(".section-two__box_Child-1__nav_section_par-3").textContent.trim();

                const countdownElement = document.querySelector(".section-two__box_Child-1__info_time");
                const currentCountdown = countdownElement.textContent.trim();

                // Преобразуем и проверяем значения времени
                const formattedDuration = validateAndFormatDuration(durationValue);
                const elapsedSeconds = calculateElapsedTime(formattedDuration, currentCountdown);

                console.log("Duration Value (Initial):", durationValue);
                console.log("Current Countdown (Remaining):", currentCountdown);
                console.log("Formatted Duration:", formattedDuration);
                console.log("Прошедшее время в секундах:", elapsedSeconds);
                

                // Создаём блок для изменения заказа
                const newOrderBlock = document.createElement("div");
                newOrderBlock.classList.add("section-one__orderChange__box__buttons_block-1__counter");

                newOrderBlock.innerHTML = `
                    <div class="section-one__orderChange">
                        <div class="section-one__orderChange_line"></div> <!-- линия -->
                        <div class="section-one__orderChange_header">
                            <img class="section-one__orderChange_img" src="./img/back.svg" alt="back">
                            <h1 class="section-one__orderChange_sag">Изменить заказ</h1>
                        </div>
                        <div class="section-one__orderChange_line-mobile"></div> <!-- линия -->
                        <div class="section-one__orderChange__box">
                            <div class="section-one__orderChange__box__input">
                                <input id="order-1" class="section-one__orderChange__box__input_item" placeholder="Имя" type="text" value="${nameValue}">
                                <input id="order-2" class="section-one__orderChange__box__input_item" placeholder="Номер телефона" type="tel" value="${phoneValue}">
                                <input id="order-3" class="section-one__orderChange__box__input_item section-one__orderChange__box__input_item-mobile" placeholder="Примечание" type="text" value="${noteValue}">
                            </div>

                            <div class="section-one__orderChange__box__buttons">

                                <div class="section-one__orderChange__box__buttons_block-1 section-one__orderChange__box__buttons_element-1">
                                    <h2 class="section-one__orderChange__box__buttons_block-1_sag">30 мин.</h2>
                                    <div class="${durationValue === '30 мин.' ? 'section-one__orderChange__box__buttons_block-1_active' : 'section-one__orderChange__box__buttons_block-1_inactive'}"></div>
                                </div>

                                <div class="section-one__orderChange__box__buttons_block-1 section-one__orderChange__box__buttons_element-2">
                                    <h2 class="section-one__orderChange__box__buttons_block-1_sag">1 час</h2>
                                    <div class="${durationValue === '1 час' ? 'section-one__orderChange__box__buttons_block-1_active' : 'section-one__orderChange__box__buttons_block-1_inactive'}"></div>
                                </div>

                                <div class="section-one__orderChange__box__buttons_block-1 section-one__orderChange__box__buttons_element-3">
                                    <h2 class="section-one__orderChange__box__buttons_block-1_sag">2 часа</h2>
                                    <div class="${durationValue === '2 часа' ? 'section-one__orderChange__box__buttons_block-1_active' : 'section-one__orderChange__box__buttons_block-1_inactive'}"></div>
                                </div>

                                <div class="section-one__orderChange__box__buttons_block-2 section-one__orderChange__box__buttons_element-4">
                                    <h2 class="section-one__orderChange__box__buttons_block-1_sag section-one__orderChange__box__buttons_block-2_sag">Аренда 1 час</h2>
                                    <div class="${durationValue === 'Аренда 1 час' ? 'section-one__orderChange__box__buttons_block-1_active' : 'section-one__orderChange__box__buttons_block-1_inactive'}"></div>
                                </div>
                                
                                <div class="section-one__orderChange__box_cancellation section-one__orderChange__box__buttons_element-5">
                                    <h2 class="section-one__orderChange__box_cancellation_sag">Отмена</h2>
                                </div>

                                <div class="section-one__orderChange__box__buttons_block-3 section-one__orderChange__box__buttons_element-6">
                                    <h2 class="section-one__orderChange__box__buttons_block-1_sag section-one__orderChange__box__buttons_block-2_sag">Аренда 2 часа</h2>
                                    <div class="${durationValue === 'Аренда 2 часа' ? 'section-one__orderChange__box__buttons_block-1_active' : 'section-one__orderChange__box__buttons_block-1_inactive'}"></div>
                                </div>

                                <div class="section-one__orderChange__box_save section-one__orderChange__box__buttons_element-7">
                                    <h2 class="section-one__orderChange__box_save_sag">Сохранить</h2>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                sectionOne.appendChild(newOrderBlock);

                // Обработка клика по кнопкам времени
                newOrderBlock.querySelectorAll(".section-one__orderChange__box__buttons_block-1, .section-one__orderChange__box__buttons_block-2, .section-one__orderChange__box__buttons_block-3").forEach(button => {
                    button.addEventListener("click", function () {
                        // Сначала сбрасываем все выделения
                        newOrderBlock.querySelectorAll(".section-one__orderChange__box__buttons_block-1_active").forEach(activeBtn => {
                            activeBtn.classList.remove("section-one__orderChange__box__buttons_block-1_active");
                            activeBtn.classList.add("section-one__orderChange__box__buttons_block-1_inactive");
                        });
                        
                        // Затем выделяем текущую кнопку
                        const timeDiv = this.querySelector('div');
                        if (timeDiv) {
                            timeDiv.classList.remove("section-one__orderChange__box__buttons_block-1_inactive");
                            timeDiv.classList.add("section-one__orderChange__box__buttons_block-1_active");
                        }
                    });
                });

                // Сопоставление времени и стоимости
                const timePrices = {
                    "15 мин.": 50,
                    "30 мин.": 100,
                    "1 час": 150,
                    "2 часа": 250,
                    "Аренда 1 час": 2000,
                    "Аренда 2 часа": 4000,
                };

            function getOriginalDurationSeconds(orderContainer) {
                const durationElement = orderContainer.querySelector(".section-two__box_Child-1__nav_section_par-3");
                if (!durationElement) return 0;
                    
                const durationText = durationElement.textContent.trim();
                    
                if (durationText.includes('15 мин.')) return 15 * 60;
                if (durationText.includes('30 мин.')) return 30 * 60;
                if (durationText.includes('1 час')) return 60 * 60;
                if (durationText.includes('2 часа')) return 120 * 60;
                if (durationText.includes('Аренда 1 час')) return 60 * 60;
                if (durationText.includes('Аренда 2 часа')) return 120 * 60;
                    
                return 0;
            }

            // Обработка сохранения изменений
            const saveButton = newOrderBlock.querySelector(".section-one__orderChange__box_save");
            saveButton.addEventListener("click", function () {
                const selectedButtons = newOrderBlock.querySelectorAll(".section-one__orderChange__box__buttons_block-1_active");

                if (selectedButtons.length === 0) {
                    alert("Необходимо выбрать время посещения");
                    return;
                }

                // Получаем новое время и рассчитываем БАЗОВУЮ цену (за одно имя)
                const timeText = selectedButtons[0].previousElementSibling.textContent.trim();
                const basePriceForOneName = calculatePriceFromDuration(timeText);
                
                const newName = document.getElementById("order-1").value;
                const newPhone = document.getElementById("order-2").value;
                const newNote = document.getElementById("order-3").value;

                // === ИСПРАВЛЕНИЕ: Подсчитываем количество имен из ПОЛЯ ВВОДА в блоке изменения ===
                // Считаем количество имен (слов, разделенных пробелами) из поля ввода
                const newNames = newName.split(/\s+/).filter(name => name.length > 0);
                const nameCount = newNames.length;
                // ================================================================

                // Проверяем, выбрана ли аренда (цена аренды не умножается на кол-во имен)
                const isRental = timeText.includes('Аренда');
                
                // РАССЧИТЫВАЕМ ИТОГОВУЮ ЦЕНУ: для аренды берем базовую цену, для времени - умножаем на кол-во имен
                const newPrice = isRental ? basePriceForOneName : basePriceForOneName * nameCount;

                // Получаем оставшееся время из текущего таймера
                const remainingSeconds = getRemainingTime(parentOrder);
                    
                // Получаем исходную продолжительность заказа
                const originalDurationSeconds = getOriginalDurationSeconds(parentOrder);
                    
                // Вычисляем прошедшее время (исходное время - оставшееся время)
                const elapsedSeconds = Math.max(originalDurationSeconds - remainingSeconds, 0);

                // Обновляем данные в DOM
                parentOrder.querySelector(".section-two__box_Child-1__info_container-sag_name").textContent = newName;
                parentOrder.querySelector(".section-two__box_Child-1__info_parents_number").textContent = newPhone;
                parentOrder.querySelector(".section-two__box_Child-1__info_parents_par").textContent = newNote;
                parentOrder.querySelector(".section-two__box_Child-1__nav_section_par-3").textContent = timeText;
                    
                // Обновляем сумму заказа
                const priceElement = parentOrder.querySelector(".price");
                const oldPrice = parseFloat(priceElement.textContent.replace("руб.", "").trim());
                priceElement.textContent = newPrice + " руб.";

                // Обновляем общую выручку
                totalRevenue = totalRevenue - oldPrice + newPrice;
                var revenueElement = document.querySelector(".section-two__nav_block-3 .revenue");
                if (revenueElement) revenueElement.textContent = totalRevenue.toFixed(0);

                // ИСПОЛЬЗУЕМ ДАННЫЕ ИЗ РОДИТЕЛЬСКОГО ЗАКАЗА (parentOrder), а не orderContainer
                const originalDate = parentOrder.dataset.creationDate;
                const originalTime = parentOrder.dataset.creationTime;

                if (typeof sendRequest === 'function') {
                    sendRequest("http://127.0.0.1:8000/order/update", "POST", {
                        old_sum: oldPrice,
                        date: originalDate,
                        time: originalTime,
                        new_sum: newPrice
                    }).then(result => {
                        if (result && result.id) {
                            // ОБНОВЛЯЕМ ДАННЫЕ В РОДИТЕЛЬСКОМ ЗАКАЗЕ
                            parentOrder.dataset.creationSum = newPrice;
                            
                            console.log('✅ Данные заказа обновлены:', result);
                        } else {
                            console.log('❌ Ошибка при обновлении заказа:', result);
                        }
                    });
                }

                // Перезапускаем таймер с новым временем
                const fakeButtons = [{
                    textContent: timeText,
                    classList: {
                        contains: (className) => {
                            if (className === 'hour') return timeText.includes('час') || timeText.includes('Аренда');
                            if (className === 'minute') return timeText.includes('мин');
                            return false;
                        }
                    }
                }];

                // Вычисляем новое общее время
                const newTotalSeconds = getTotalDurationInSeconds(fakeButtons);
                    
                // Вычитаем прошедшее время из нового общего времени
                const initialSeconds = Math.max(newTotalSeconds - elapsedSeconds, 0);

                console.log("New name input:", newName);
                console.log("Name count:", nameCount);
                console.log("New price calculation:", isRental ? 
                    `Rental (${basePriceForOneName})` : 
                    `Time (${basePriceForOneName} × ${nameCount} = ${newPrice})`);

                // 1. ОСТАНАВЛИВАЕМ СТАРЫЙ ТАЙМЕР
                const oldTimerId = parentOrder.dataset.timerId;
                if (oldTimerId && typeof stopTimer === 'function') {
                    stopTimer(oldTimerId);
                }

                // 2. Перезапускаем таймер с новым временем
                stopAllTimersForContainer(parentOrder);
                const newTimerId = startCountdown(fakeButtons, parentOrder, initialSeconds);
                parentOrder.dataset.timerId = newTimerId;

                // ПОСЛЕ СОХРАНЕНИЯ ИЗМЕНЕНИЙ:
                saveOrdersToStorage();

                // Удаляем блок изменения заказа
                newOrderBlock.remove();
            });

            // Обработка нажатия кнопки "Отмена"
            const cancelButton = newOrderBlock.querySelector(".section-one__orderChange__box_cancellation");
            cancelButton.addEventListener("click", function () {
                newOrderBlock.remove(); // Удаляем блок изменения заказа
            });
        }
    });

    // После сохранения изменений переинициализируем обработчики
    setTimeout(() => {
        setupBurgerMenuHandlers();
    }, 100);

    // Добавляем интерактивность для удаления блока
    addDeleteFunctionality(orderContainer,);
}

// ==================== КОНЕЦ ФУНКЦИЙ ДЛЯ LOCALSTORAGE ====================

// ==================== ОСНОВНОЙ КОД ====================
document.addEventListener("DOMContentLoaded", function() {
    // Загружаем данные из LocalStorage
    const savedData = loadOrdersFromStorage();
    
    // Обновляем глобальные переменные
    orderCount = savedData.orderCount;
    totalRevenue = savedData.totalRevenue;

    // Обновляем счетчики в DOM
    var orderCountElement = document.querySelector(".section-two__nav_block_sag-2");
    if (orderCountElement) orderCountElement.textContent = orderCount;
    
    var revenueElement = document.querySelector(".revenue");
    if (revenueElement) revenueElement.textContent = totalRevenue.toFixed(0);

    // Восстанавливаем заказы из LocalStorage
    if (savedData.orders.length > 0) {
        savedData.orders.forEach(orderData => {
            recreateOrderFromStorage(orderData);
        });
        
        // После восстановления обновляем счетчики
        if (typeof updateCounters === 'function') {
            updateCounters();
        }
    }

    // Настраиваем ежедневную очистку заказов
    setupDailyClear();

    // Находим все ваши поля ввода
    var inputs = document.querySelectorAll(".section-one__container_1, .section-one__container_4, .section-one__container__parent_2.section-one__container_3");

    // Находим кнопку "Добавить"
    var addButton = document.querySelector(".section-one__button");

    inputs.forEach(function(input, index) {
        input.addEventListener("keydown", function(event) {
            // Проверяем, нажата ли клавиша Enter
            if (event.key === "Enter") {
                event.preventDefault(); // Отменяем стандартное поведение
                
                // Если есть следующее поле, перемещаем фокус на него
                if (index < inputs.length - 1) {
                    inputs[index + 1].focus();
                } else {
                    // Если это последнее поле, нажимаем кнопку "Добавить"
                    if (addButton) {
                        addButton.click();
                    }
                }
            }
        });
    });

    // Находим все кнопки по классу
    const buttons = document.querySelectorAll('.section-one__box__button-1, .section-one__box__button-2');

    // Добавляем обработчик события для клика (для визуального эффекта)
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            // Добавляем или удаляем класс .scaled
            button.classList.toggle('scaled');
        });
    });

    // Добавляем обработчик события клика по кнопкам выбора времени (для логики выбора)
    var timeButtons = document.querySelectorAll(".section-one__box__button-1, .section-one__box__button-2");
    timeButtons.forEach(function(button) {
        button.addEventListener("click", function() {
            button.classList.toggle("selected");
        });
    });

    // Находим кнопку "Добавить"
    var addButton = document.querySelector(".section-one__button");

    // Добавляем обработчик события нажатия на кнопку
    addButton.addEventListener("click", function() {

        // Закрываем все открытые бургер-меню перед созданием нового заказа
        closeAllBurgerMenus();
            
        // Сбрасываем классы .scaled для всех кнопок
        buttons.forEach(button => {
            if (button.classList.contains('scaled')) {
                button.classList.remove('scaled');
            }
        });

        // Находим выбранные кнопки с ценами
        var selectedButtons = document.querySelectorAll(".section-one__box__button-1.selected, .section-one__box__button-2.selected");
    
        // Проверяем, выбраны ли кнопки
        if (selectedButtons.length === 0) {
            alert("Пожалуйста, укажите время посещения.");
            return;
        }
            
        // Увеличиваем счетчик заказов на 1 только после того, как кнопки выбраны
        orderCount++;

        // Находим элемент с количеством заказов и обновляем его значение
        var orderCountElement = document.querySelector(".section-two__nav_block_sag-2");
        orderCountElement.textContent = orderCount;
            
        // Переменная для суммы текущего заказа
        var currentOrderTotal = 0;

        // Переменная для проверки, выбрана ли аренда
        let isRental = false;

        // Подсчёт общей суммы заказа
        selectedButtons.forEach(function (button) {
            var priceText = button.querySelector(".section-one__box__button-1_sag-3").textContent;
            var price = parseFloat(priceText.replace("руб.", "").trim());

            // Проверяем, выбрана ли аренда
            if (price === 2000 || price === 4000) {
                isRental = true;
            }

            currentOrderTotal += price;

            // Удаляем класс selected после добавления заказа
            button.classList.remove("selected");
        });

        // Подсчёт количества имён
        var nameInput = document.querySelector("#namesInput").value.trim();
        var names = nameInput.split(/\s+/); // Убираем лишние пробелы и разделяем текст на слова
        var nameCount = names.filter(name => name.length > 0).length; // Считаем только непустые слова

        // Если это не аренда, умножаем количество имён на стоимость времени посещения
        if (!isRental) {
            currentOrderTotal *= nameCount;
        }

        // Создаем контейнер для информации о заказе
        var orderContainer = document.createElement("div");
        orderContainer.classList.add("section-two__box");
    
        // Строим HTML структуру заказа
        var orderHTML = `
            <div class="section-two__box_Child-1">
                <nav class="section-two__box_Child-1__nav">
                    <div class="section-two__box_Child-1__nav_section">
                        <p class="section-two__box_Child-1__nav_section_par-1">Сумма</p>`;
        
        // Добавляем информацию о сумме заказа
        if (selectedButtons.length > 0) {
            selectedButtons.forEach(function (button) {
                var price = button.querySelector(".section-one__box__button-1_sag-3").textContent;
                orderHTML += `<p class="section-two__box_Child-1__nav_section_par-2 price">${price}</p>`;
            });
        } else {
            orderHTML += `<p class="section-two__box_Child-1__nav_section_par-2 price">0 руб.</p>`;
        }
    
        orderHTML += `
                    </div>
                    <div class="section-two__box_Child-1__nav_section">
                        <p class="section-two__box_Child-1__nav_section_par-1">Зашёл в</p>
                        <p class="section-two__box_Child-1__nav_section_par-2">${getCurrentTime()}</p>
                    </div>
                    <div class="section-two__box_Child-1__nav_section">
                        <p class="section-two__box_Child-1__nav_section_par-1">Посещение</p>
                        <p id="duration" class="section-two__box_Child-1__nav_section_par-2  section-two__box_Child-1__nav_section_par-3">${getDuration(selectedButtons)}</p>
                    </div>
                </nav>
                <div class="section-two__box_Child-1_line"><!-- Линия --></div>
    
                <div class="section-two__box_Child-1__info">
                    <div class="section-two__box_Child-1__info_parents">
                        <h5 class="section-two__box_Child-1__info_parents_number">${capitalizeFirstLetter(document.querySelector('.section-one__container_4').value)}</h5>
                        <p class="section-two__box_Child-1__info_parents_par">${document.querySelector('.section-one__container_3').value}</p>
                    </div>
                    <div class="section-two__box_Child-1__info_line-1"><!-- Линия --></div>
                    <div class="section-two__box_Child-1__info_container-sag">
                        <h3 class="section-two__box_Child-1__info_container-sag_name">${capitalizeFirstLetter(document.querySelector('.section-one__container_1').value)}</h3>
                    </div>
                    <h3 class="section-two__box_Child-1__info_sag">Осталось:</h3>
                    <h3 class="section-two__box_Child-1__info_time" id="countdown">${calculateCountdownTime(selectedButtons)}</h3>
                    <div class="section-two__box_Child-1__info_img"><!-- Пауза/продолжение --></div>
                    <div class="section-two__box_Child-1__info_line-3-mobile"><!-- Линия для моб. версии --></div>
                    <img class="section-two__box_Child-1__info_burger" src="./img/burger.svg" alt="burger">
                </div>
            </div>
            
            <div class="section-two__box_Child-2">
                <h5 class="section-two__box_Child-2_sag">Заказ выполенен</h5>
            </div>

            <div class="section-two__box_Child-3">
                <h5 class="section-two__box_Child-3_sag">Удалить</h5>
                <div class="section-two__box_Child-3_img"><!-- img корзины --></div>
            </div>
            
            <div class="section-two__box_Child-4">
                <h5 class="section-two__box_Child-4_sag">Изменить заказ</h5>
            </div>`;
    
        // Добавляем сгенерированный HTML в контейнер
        orderContainer.innerHTML = orderHTML;
    
        // Находим блок для добавления информации о заказе
        var sectionTwoLending = document.querySelector(".section-two_lending");
    
        // Вставляем созданный контейнер с информацией о заказе в начало списка
        sectionTwoLending.insertBefore(orderContainer, sectionTwoLending.firstChild);

        // Обновляем общую сумму заказа
        var priceElement = orderContainer.querySelector(".price");
        priceElement.textContent = currentOrderTotal.toFixed(0) + " руб.";

        // Добавляем текущую сумму к общей выручке
        totalRevenue += currentOrderTotal;

        // Отправляем данные о новом заказе на сервер
        const currentDate = new Date();
        const dateStr = formatDateString(currentDate);
        const timeStr = formatTimeString(currentDate);

        // Проверяем доступность функции sendRequest
        if (typeof sendRequest === 'function') {
            sendRequest("http://127.0.0.1:8000/order", "POST", {
                sum: currentOrderTotal,
                date: dateStr,
                time: timeStr
            });
        }

        // После успешного создания заказа
        orderContainer.dataset.creationDate = dateStr;
        orderContainer.dataset.creationTime = timeStr;
        orderContainer.dataset.creationSum = currentOrderTotal;

        // После успешного создания заказа:
        if (typeof saveOrdersToStorage === 'function') {
            saveOrdersToStorage();
        }

        const guestOrderData = {
            type: 'NEW_ORDER',
            order: {
                id: orderContainer.dataset.timerId,
                child_name: capitalizeFirstLetter(document.querySelector('.section-one__container_1').value),
                phone: document.querySelector('.section-one__container_4').value,
                note: document.querySelector('.section-one__container_3').value,
                sum: currentOrderTotal,
                duration: getDuration(selectedButtons),
                start_time: getCurrentTime(),
                remaining_seconds: getTotalDurationInSeconds(selectedButtons),
                status: 'active'
            }
        };
        sendToGuest(guestOrderData);

        // Добавим обработчик для запросов синхронизации
        guestChannel.onmessage = (event) => {
            if (event.data.type === 'REQUEST_SYNC') {
                console.log('📥 Запрос синхронизации от гостевого режима');
                syncAllOrders();
            }
        };

        // Функция синхронизации всех заказов
        function syncAllOrders() {
            const orders = [];
            const orderElements = document.querySelectorAll('.section-two__box:not(.in-section-two__box)');
            
            orderElements.forEach(element => {
                if (element.isConnected) {
                    try {
                        const order = {
                            id: element.dataset.timerId,
                            child_name: element.querySelector('.section-two__box_Child-1__info_container-sag_name')?.textContent || '',
                            phone: element.querySelector('.section-two__box_Child-1__info_parents_number')?.textContent || '',
                            note: element.querySelector('.section-two__box_Child-1__info_parents_par')?.textContent || '',
                            sum: parseFloat(element.querySelector('.price')?.textContent.replace('руб.', '').trim()) || 0,
                            duration: element.querySelector('.section-two__box_Child-1__nav_section_par-3')?.textContent || '',
                            start_time: element.querySelector('.section-two__box_Child-1__nav_section_par-2')?.textContent || '',
                            remaining_seconds: getRemainingTime(element),
                            status: 'active'
                        };
                        orders.push(order);
                    } catch (error) {
                        console.error('Ошибка получения данных заказа:', error);
                    }
                }
            });
            
            sendToGuest({
                type: 'SYNC_ALL_ORDERS',
                orders: orders
            });
            
            console.log('✅ Синхронизировано заказов:', orders.length);
        }

        // Вызовем синхронизацию при загрузке
        document.addEventListener("DOMContentLoaded", function() {
            setTimeout(syncAllOrders, 2000);
        });

        // Обновляем значение выручки
        var revenueElement = document.querySelector(".revenue");
        revenueElement.textContent = totalRevenue.toFixed(0);

        // Находим элемент с классом .price
        var priceElement = orderContainer.querySelector(".price");

        // Обновляем сумму заказа
        if (priceElement) {
            priceElement.textContent = currentOrderTotal.toFixed(0) + " руб.";
        } else {
            console.error("Элемент с классом 'price' не найден.");
        }
    
        // Запускаем обратный отсчет
        startCountdown(selectedButtons, orderContainer);

        // Очищаем все поля ввода
        if (addButton) {    
            inputs.forEach(input => input.value = "");
        }

        // Добавляем обработчики событий
        if (typeof addDeleteFunctionality === 'function') {
            addDeleteFunctionality(orderContainer);
        }
        
        if (typeof addOrderCompletedFunctionality === 'function') {
            addOrderCompletedFunctionality(orderContainer);
        }
        
        if (typeof addEditOrderFunctionality === 'function') {
            addEditOrderFunctionality(orderContainer);
        }

        // Настройка обработчиков бургер-меню
        setupBurgerMenuHandlers();

    });
        
    
    //Дальнейший код только для мобильной версии

    // Находим кнопку .section-two__nav_button-1
    const creatureButton = document.querySelector(".section-two__nav_button-1");

    // Добавляем обработчик клика для кнопки создания заказа
    creatureButton.addEventListener("click", function () {

        // Закрываем все открытые бургер-меню
        closeAllBurgerMenus();

        const sectionOne = document.querySelector(".section-one");
        const sectionOneBox = document.querySelector(".section-one__box");
        const sectionOneContainer = document.querySelector(".section-one__container");
        const sectionOneMobile = document.querySelector(".section-one__mobile ");

        if (sectionOne) {
            // Проверяем ширину экрана
            if (window.innerWidth < 480) {
                // Логика для мобильной версии
                sectionOne.style.display = sectionOne.style.display === "none" || sectionOne.style.display === "" ? "block" : "none";
            } else {
                // На десктопной версии .section-one всегда должно быть "block"
                sectionOne.style.display = "block";
            }
        }

        // Устанавливаем видимость для блоков .section-one__box и .section-one__container
        if (sectionOneBox) {
            sectionOneBox.style.display = "flex";
        }
        if (sectionOneContainer) {
            sectionOneContainer.style.display = "flex";
        }
        if (sectionOneMobile) {
            sectionOneMobile.style.display = "block";
        }
    });

    // Находим изображение для закрытия
    const backImage = document.querySelector(".section-one__mobile__container_img");

    // Добавляем обработчик клика на изображение
    backImage.addEventListener("click", function () {
        const sectionOne = document.querySelector(".section-one");

        if (sectionOne) {
            // Скрываем только на мобильной версии
            if (window.innerWidth < 480) {
                sectionOne.style.display = "none";
            }
        }
    });


    // Находим кнопку добавления
    var addButton = document.querySelector(".section-one__button");

    // Добавляем обработчик клика на кнопку добавления
    addButton.addEventListener("click", function () {
        const sectionOne = document.querySelector(".section-one");

        if (sectionOne) {
            // Скрываем только на мобильной версии
            if (window.innerWidth < 480) {
                sectionOne.style.display = "none";
            }
        }
    });


    // Гарантия отображения .section-one на десктопе при изменении размера окна
    window.addEventListener("resize", function () {
        const sectionOne = document.querySelector(".section-one");

        if (sectionOne) {
            // Если ширина экрана >= 480px, всегда отображаем .section-one
            if (window.innerWidth >= 480) {
                sectionOne.style.display = "block";
            }
        }
    });

    // Сохраняем состояние при нажатии на кнопку .section-two__box_Child-4.active
    let isOrderChangeActive = false;

    // Обработчик для .section-two__box_Child-4.active
    const container = document.querySelector(".section-two");

    if (container) {
        container.addEventListener("click", function (event) {
            const activeButton = event.target.closest(".section-two__box_Child-4.active");
            if (activeButton) {
                const sectionOne = document.querySelector(".section-one");
                const sectionOneMobile = document.querySelector(".section-one__mobile");
                const sectionOneBox = document.querySelector(".section-one__box");
                const sectionOneContainer = document.querySelector(".section-one__container");

                // Установка состояния для orderChange
                isOrderChangeActive = true;

                if (sectionOne) {
                    sectionOne.style.display = "block"; // Показываем блок на всех устройствах
                }

                // Логика для мобильной версии
                if (window.innerWidth < 480) {
                    [sectionOneMobile, sectionOneBox, sectionOneContainer].forEach((block) => {
                        if (block) block.style.display = "none";
                    });
                }
            }
        });
    }

    
    // Обработчики для кнопок section-one__orderChange__box_save и section-one__orderChange__box_cancellation
    document.addEventListener("click", function (event) {
        const saveButton = event.target.closest(".section-one__orderChange__box_save");
        const cancelButton = event.target.closest(".section-one__orderChange__box_cancellation");
        const orderChangeImage = event.target.closest(".section-one__orderChange_img");

        if (saveButton || cancelButton || orderChangeImage) {
            const existingOrderChangeBlock = document.querySelector(".section-one__orderChange");
            const sectionOne = document.querySelector(".section-one");
            const sectionOneMobile = document.querySelector(".section-one__mobile");
            const sectionOneBox = document.querySelector(".section-one__box");
            const sectionOneContainer = document.querySelector(".section-one__container");

            if (existingOrderChangeBlock) {
                existingOrderChangeBlock.remove(); // Удаляем блок изменения заказа
            }

            // Проверяем ширину экрана для мобильной версии
            if (window.innerWidth < 480) {
                // Скрываем только .section-one (остальные блоки остаются неизменными)
                if (sectionOne) {
                    sectionOne.style.display = "none";
                }
            } else {
                // Для десктопной версии показываем только .section-one__box и .section-one__container
                if (sectionOneBox) {
                    sectionOneBox.style.display = "flex";
                }
                if (sectionOneContainer) {
                    sectionOneContainer.style.display = "flex";
                }
            }
        }
    }); 


    // Обработчик изменения ширины экрана
    window.addEventListener("resize", function () {
        const sectionOne = document.querySelector(".section-one");
        const sectionOneMobile = document.querySelector(".section-one__mobile");
        const sectionOneBox = document.querySelector(".section-one__box");
        const sectionOneContainer = document.querySelector(".section-one__container");

        if (sectionOne) {
            if (window.innerWidth >= 480) {
                // На десктопе показываем все основные блоки
                sectionOne.style.display = "block";

                if (isOrderChangeActive) {
                    // Если активен orderChange, сохраняем блок orderChange
                    const orderChange = document.querySelector(".section-one__orderChange");
                    if (!orderChange) {
                        // Логика для создания блока orderChange, если он отсутствует
                        const newOrderChange = document.createElement("div");
                        newOrderChange.className = "section-one__orderChange";
                        sectionOne.appendChild(newOrderChange);
                    }
                }

                [sectionOneBox, sectionOneContainer].forEach((block) => {
                    if (block) block.style.display = "flex";
                });

                if (sectionOneMobile) {
                    sectionOneMobile.style.display = "none"; // Прячем мобильный блок
                }
            } else {
                // На мобильных устройствах показываем только мобильный блок
                if (sectionOneMobile) sectionOneMobile.style.display = "block";
            }
        }
    }); 

    // Автосохранение при закрытии/обновлении страницы
    window.addEventListener('beforeunload', function() {
        saveOrdersToStorage();
    });

    // Автосохранение каждые 30 секунд
    setInterval(function() {
        saveOrdersToStorage();
    }, 30000);

    // Настройка обработчиков бургер-меню
    setupBurgerMenuHandlers();
});