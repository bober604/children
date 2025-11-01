const API_BASE_URL = "http://127.0.0.1:8000";

// ==================== СИНХРОНИЗАЦИЯ С СЕРВЕРОМ ====================

// Функция для периодической синхронизации активных заказов
function startPeriodicSync() {
    // Синхронизируем каждую секунду
    setInterval(() => {
        syncOrdersFromAPI();
    }, 1000);
}

// Функция для синхронизации заказов из API
async function syncOrdersFromAPI() {
    try {
        const today = new Date();
        const todayStr = formatDateString(today);
        
        const response = await fetch(`${API_BASE_URL}/orders/${todayStr}`);
        if (response.ok) {
            const ordersFromAPI = await response.json();
            
            // ФИЛЬТРУЕМ ТОЛЬКО ЗАКАЗЫ ЗА СЕГОДНЯ
            const todayOrders = ordersFromAPI.filter(order => 
                (order.date || '').includes(todayStr)
            );
            
            updateLocalOrders(todayOrders);
            
            // Также обновляем счетчики
            await updateCountersFromAPI();
        }
    } catch (error) {
        console.error('Ошибка синхронизации заказов:', error);
    }
}

// Функция для обновления локальных заказов данными из API
function updateLocalOrders(ordersFromAPI) {
    const orderElements = document.querySelectorAll('.section-two__box[data-order-id]');
    
    ordersFromAPI.forEach(apiOrder => {
        const orderElement = document.querySelector(`[data-order-id="${apiOrder.id}"]`);
        
        if (orderElement) {
            updateOrderElement(orderElement, apiOrder);
        } else {
            // Если заказа нет в DOM, но есть в API - создаем его
            recreateOrderFromAPI(apiOrder);
        }
    });
    
    // Удаляем заказы, которых нет в API
    const apiOrderIds = ordersFromAPI.map(order => order.id.toString());
    orderElements.forEach(element => {
        const orderId = element.dataset.orderId;
        if (orderId && !apiOrderIds.includes(orderId)) {
            element.remove();
        }
    });
}

// Функция для обновления элемента заказа
function updateOrderElement(orderElement, apiOrder) {
    
    // Обновляем оставшееся время
    const timeElement = orderElement.querySelector('.section-two__box_Child-1__info_time');
    if (timeElement) {
        const timeString = formatTimeFromSeconds(apiOrder.remaining_seconds);
        timeElement.textContent = timeString;
        
        // ВАЖНО: Добавляем красную обводку при истечении времени
        if (apiOrder.remaining_seconds <= 0) {
            orderElement.classList.add('order-expired');
        } else {
            orderElement.classList.remove('order-expired');
        }
    }
    
    // Обновляем состояние паузы
    const pauseButton = orderElement.querySelector('.section-two__box_Child-1__info_img');
    if (pauseButton) {
        if (apiOrder.is_paused) {
            pauseButton.classList.add('section-two__box_Child-1__info_img-active');
        } else {
            pauseButton.classList.remove('section-two__box_Child-1__info_img-active');
        }
    }
    
    // ВАЖНОЕ ИСПРАВЛЕНИЕ: Обновляем состояние завершения ТОЛЬКО на основе данных из API
    // Но игнорируем is_completed если время истекло (оставляем заказ активным)
    if (apiOrder.is_completed && !orderElement.classList.contains('in-section-two__box')) {
        // Убираем красную обводку перед применением стилей завершения
        orderElement.classList.remove('order-expired');
        applyCompletedStyles(orderElement);
    } else if (!apiOrder.is_completed && orderElement.classList.contains('in-section-two__box')) {
        // Если заказ возобновлен в БД - убираем серый стиль
        removeCompletedStyles(orderElement);
    }
    
    // Обновляем данные в локальном таймере
    updateLocalTimer(orderElement, apiOrder.remaining_seconds, apiOrder.is_paused);
}

// Функция для обновления локального таймера
function updateLocalTimer(orderElement, remainingSeconds, isPaused) {
    const orderId = orderElement.dataset.timerId;
    
    if (orderId && activeTimers.has(orderId)) {
        const timerInfo = activeTimers.get(orderId);
        
        // Обновляем оставшееся время
        timerInfo.remainingSeconds = remainingSeconds;
        timerInfo.isPaused = isPaused;
        timerInfo.lastUpdate = Date.now();
        
        // Синхронизируем визуальное состояние кнопки паузы
        const pauseButton = orderElement.querySelector('.section-two__box_Child-1__info_img');
        if (pauseButton) {
            if (isPaused) {
                pauseButton.classList.add('section-two__box_Child-1__info_img-active');
            } else {
                pauseButton.classList.remove('section-two__box_Child-1__info_img-active');
            }
        }
        
        activeTimers.set(orderId, timerInfo);
    }
}

// Функция для завершения заказа в интерфейсе
function completeOrderInInterface(orderElement) {
    if (orderElement.classList.contains('in-section-two__box')) return;
    
    // Останавливаем таймер
    const orderId = orderElement.dataset.timerId;
    if (orderId && activeTimers.has(orderId)) {
        stopTimer(orderId);
    }

    // ВАЖНОЕ ИСПРАВЛЕНИЕ: Убираем красную обводку ПЕРЕД применением стилей завершения
    orderElement.classList.remove('order-expired');
    
    // Применяем стили завершенного заказа
    applyCompletedStyles(orderElement);
}

// Функция для возобновления заказа в интерфейсе
function resumeOrderInInterface(orderElement) {
    if (!orderElement.classList.contains('in-section-two__box')) return;
    
    // ВАЖНОЕ ИСПРАВЛЕНИЕ: Убираем красную обводку
    orderElement.classList.remove('order-expired');
    
    // Убираем стили завершенного заказа
    removeCompletedStyles(orderElement);
    
    // Перезапускаем таймер
    const durationElement = orderElement.querySelector('.section-two__box_Child-1__nav_section_par-3');
    if (durationElement) {
        const durationText = durationElement.textContent.trim();
        const fakeButtons = [{
            textContent: durationText,
            querySelector: () => ({ textContent: durationText })
        }];
        
        // Получаем актуальное оставшееся время из элемента
        const remainingSeconds = getRemainingTime(orderElement);
        const newTimerId = startCountdown(fakeButtons, orderContainer, remainingSeconds);
        orderElement.dataset.timerId = newTimerId;
    }
}

// Вспомогательная функция для применения стилей завершенного заказа
function applyCompletedStyles(orderElement) {
    if (orderElement.classList.contains('in-section-two__box')) return;
    
    // Останавливаем таймер
    const orderId = orderElement.dataset.timerId;
    if (orderId && activeTimers.has(orderId)) {
        stopTimer(orderId);
    }

    // Применяем стили завершенного заказа
    orderElement.classList.add("in-section-two__box");
    
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
        const element = orderElement.querySelector(selector);
        if (element) element.classList.add(className);
    });
}

// Вспомогательная функция для удаления стилей завершенного заказа
function removeCompletedStyles(orderElement) {
    if (!orderElement.classList.contains('in-section-two__box')) return;
    
    // Убираем стили завершенного заказа
    orderElement.classList.remove("in-section-two__box");
    
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
        const element = orderElement.querySelector(selector);
        if (element) element.classList.remove(className);
    });
}

// Функция для получения всех активных заказов
async function loadActiveOrdersFromAPI() {
    try {
        const response = await fetch(`${API_BASE_URL}/orders/active`);
        if (response.ok) {
            return await response.json();
        }
        return [];
    } catch (error) {
        console.error('Ошибка загрузки заказов из API:', error);
        return [];
    }
}

// Функция для обновления таймера на сервере
async function updateTimerOnServer(orderId, remainingSeconds, isPaused) {
    try {
        // ВАЖНО: НЕ обновляем состояние завершения при истечении времени
        // Заказ должен оставаться активным до ручного подтверждения
        const updateData = {
            remaining_seconds: remainingSeconds,
            is_paused: isPaused
        };
        
        // Если время истекло, НЕ помечаем заказ как завершенный
        if (remainingSeconds <= 0) {
            // Явно устанавливаем is_completed в false
            updateData.is_completed = false;
        }
        
        const response = await fetch(`${API_BASE_URL}/order/${orderId}/timer`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {}
}

// Функция для отметки заказа как выполненного на сервере
async function completeOrderOnServer(orderId, isCompleted) {
    try {
        await fetch(`${API_BASE_URL}/order/${orderId}/complete`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                is_completed: isCompleted
            })
        });
    } catch (error) {
        console.error('Ошибка завершения заказа:', error);
    }
}

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
    const orderElements = document.querySelectorAll('.section-two__box:not(.in-section-two__box)');
    
    orderElements.forEach(element => {
        if (element.isConnected && element.dataset.orderId) {
            try {
                const order = {
                    id: element.dataset.orderId,
                    child_names: element.querySelector('.section-two__box_Child-1__info_container-sag_name')?.textContent || '',
                    phone: element.querySelector('.section-two__box_Child-1__info_parents_number')?.textContent || '',
                    note: element.querySelector('.section-two__box_Child-1__info_parents_par')?.textContent || '',
                    sum: parseFloat(element.querySelector('.price')?.textContent.replace('руб.', '').trim()) || 0,
                    duration: element.querySelector('.section-two__box_Child-1__nav_section_par-3')?.textContent || '',
                    time: element.querySelector('.section-two__box_Child-1__nav_section_par-2')?.textContent || '',
                    remaining_seconds: getRemainingTime(element),
                    is_paused: element.querySelector('.section-two__box_Child-1__info_img')?.classList.contains('section-two__box_Child-1__info_img-active') || false
                };
                orders.push(order);
            } catch (error) {
                console.error('Ошибка получения данных заказа:', error);
            }
        }
    });
    
    // sendToGuest({
    //     type: 'SYNC_ALL_ORDERS',
    //     orders: orders
    // });
    
    console.log('✅ Синхронизировано заказов:', orders.length);
}

// Вызовем синхронизацию при загрузке
document.addEventListener("DOMContentLoaded", function() {
    setTimeout(syncAllOrders, 1000);
});

// Функция для форматирования времени из секунд в HH:MM:SS
function formatTimeFromSeconds(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${formatTime(hours)}:${formatTime(minutes)}:${formatTime(seconds)}`;
}

// Функция для получения данных из localStorage (если используется)
function loadOrdersFromStorage() {
    try {
        const savedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
        const savedOrderCount = parseInt(localStorage.getItem('orderCount') || '0');
        const savedTotalRevenue = parseFloat(localStorage.getItem('totalRevenue') || '0');
        
        return {
            orders: savedOrders,
            orderCount: savedOrderCount,
            totalRevenue: savedTotalRevenue
        };
    } catch (error) {
        console.error('Ошибка загрузки из localStorage:', error);
        return { orders: [], orderCount: 0, totalRevenue: 0 };
    }
}

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
        // Очищаем только если interval существует
        if (timerInfo.interval) {
            clearInterval(timerInfo.interval);
        }
        // Web Worker больше не используется
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
                // Получаем данные из data-атрибутов или DOM
                const orderId = orderContainer.dataset.orderId;
                const sum = parseFloat(orderContainer.dataset.creationSum) || 
                           parseFloat(orderContainer.querySelector('.price')?.textContent.replace('руб.', '').trim()) || 0;
                const date = orderContainer.dataset.creationDate;
                const time = orderContainer.dataset.creationTime;

                console.log('Данные для удаления:', {
                    orderId: orderId,
                    sum: sum,
                    date: date,
                    time: time
                });

                // Останавливаем таймер
                const timerId = orderContainer.dataset.timerId;
                if (timerId && typeof stopTimer === 'function') {
                    stopTimer(timerId);
                }

                // ПРЕИМУЩЕСТВЕННО ИСПОЛЬЗУЕМ УДАЛЕНИЕ ПО ID (новый метод)
                if (orderId) {
                    console.log('🔄 Удаление заказа по ID:', orderId);
                    
                    // Используем новый эндпоинт удаления по ID
                    fetch(`${API_BASE_URL}/order/${orderId}`, {
                        method: 'DELETE'
                    })
                    .then(response => {
                        if (response.ok) {
                            console.log('✅ Заказ успешно удален из БД по ID');
                            // УСПЕШНО УДАЛЕНО - ОБНОВЛЯЕМ ИНТЕРФЕЙС
                            removeOrderFromInterface(orderContainer);
                            return true;
                        } else {
                            console.error('❌ Ошибка при удалении заказа по ID:', response.status);
                            // Пробуем старый метод как fallback
                            return deleteByLegacyMethod(sum, date, time, orderContainer);
                        }
                    })
                    .catch(error => {
                        console.error('❌ Ошибка сети при удалении по ID:', error);
                        // Пробуем старый метод как fallback
                        return deleteByLegacyMethod(sum, date, time, orderContainer);
                    });
                    
                } else {
                    // Если нет orderId, используем старый метод
                    console.log('🔄 Удаление заказа по legacy методу');
                    deleteByLegacyMethod(sum, date, time, orderContainer);
                }

                // // Отправляем уведомление в гостевой режим
                // const deleteData = {
                //     type: 'ORDER_DELETED', 
                //     order_id: orderId || orderContainer.dataset.timerId
                // };
                // sendToGuest(deleteData);
            }
        }
    });
}

// Вспомогательная функция для удаления legacy методом
function deleteByLegacyMethod(sum, date, time, orderContainer) {
    if (!date || !time) {
        console.error('❌ Недостаточно данных для legacy удаления:', {sum, date, time});
        // Все равно удаляем локально
        removeOrderFromInterface(orderContainer);
        return false;
    }

    return sendRequest("http://127.0.0.1:8000/order/", "DELETE", {
        sum: sum,
        date: date,
        time: time
    }).then(result => {
        if (result && result.message) {
            console.log('✅ Заказ успешно удален из БД (legacy метод)');
            removeOrderFromInterface(orderContainer);
            return true;
        } else {
            console.log('❌ Ошибка при удалении заказа (legacy метод)');
            // Удаляем локально даже при ошибке сервера
            removeOrderFromInterface(orderContainer);
            return false;
        }
    }).catch(error => {
        console.log('❌ Ошибка сети при удалении заказа (legacy метод):', error);
        // Удаляем локально при ошибке сети
        removeOrderFromInterface(orderContainer);
        return false;
    });
}

// Вспомогательная функция для удаления из интерфейса
function removeOrderFromInterface(orderContainer) {
    orderContainer.remove();
    updateCounters();
    if (typeof saveOrdersToStorage === 'function') {
        saveOrdersToStorage();
    }
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
    // Считаем ВСЕ заказы (и активные, и завершенные)
    const activeOrders = document.querySelectorAll('.section-two__box:not(.in-section-two__box)');
    const completedOrders = document.querySelectorAll('.in-section-two__box');
    const allOrders = document.querySelectorAll('.section-two__box, .in-section-two__box');
    
    let currentOrderCount = allOrders.length;
    let currentTotalRevenue = 0;
    
    // Обрабатываем активные заказы
    activeOrders.forEach(order => {
        const priceElement = order.querySelector('.section-two__box_Child-1__nav_section_par-2.price');
        if (priceElement) {
            const priceText = priceElement.textContent.replace('руб.', '').trim();
            currentTotalRevenue += parseFloat(priceText) || 0;
        }
    });
    
    // Обрабатываем завершенные заказы (у них другие классы)
    completedOrders.forEach(order => {
        // Для завершенных заказов ищем цену в другом месте
        const priceElement = order.querySelector('.in-section-two__box_Child-1 .section-two__box_Child-1__nav_section_par-2.price') || 
                           order.querySelector('.section-two__box_Child-1__nav_section_par-2.price');
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
    
    // Останавливаем все таймеры
    orders.forEach(order => {
        const orderId = order.dataset.timerId;
        if (orderId && activeTimers.has(orderId)) {
            stopTimer(orderId);
        }
    });
    
    // Очищаем Map с таймерами
    activeTimers.clear();
    
    // Удаляем все заказы из DOM
    orders.forEach(order => {
        order.remove();
    });
    
    // Сбрасываем счетчики
    orderCount = 0;
    totalRevenue = 0;
    
    // Обновляем отображение счетчиков
    updateCounters();
    
    // Очищаем localStorage от заказов
    localStorage.removeItem('orders');
    localStorage.setItem('orderCount', '0');
    localStorage.setItem('totalRevenue', '0');
    
    console.log('Все заказы очищены (ежедневная очистка)');
    
    // // Отправляем уведомление в гостевой режим о сбросе
    // sendToGuest({
    //     type: 'SYNC_ALL_ORDERS',
    //     orders: [] // Пустой массив = очистить все
    // });
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
    
    // Останавливаем предыдущий таймер
    if (orderId && activeTimers.has(orderId)) {
        stopTimer(orderId);
    }
    
    if (!orderId) {
        orderId = 'timer_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        orderContainer.dataset.timerId = orderId;
    }
    
    const countdownElement = orderContainer.querySelector(".section-two__box_Child-1__info_time");
    const pauseButton = orderContainer.querySelector(".section-two__box_Child-1__info_img");
    
    const totalSeconds = getTotalDurationInSeconds(selectedButtons);
    let remainingSeconds = initialSeconds !== null ? initialSeconds : totalSeconds;
    
    let isPaused = false;
    let lastUpdateTime = Date.now();

    function updateDisplay(seconds) {
        if (!countdownElement) return;
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secondsLeft = seconds % 60;
        
        countdownElement.textContent = formatTime(hours) + ":" + formatTime(minutes) + ":" + formatTime(secondsLeft);
        
        // ВАЖНО: Добавляем красную обводку при истечении времени только для активных заказов
        if (seconds <= 0 && !orderContainer.classList.contains('in-section-two__box')) {
            orderContainer.classList.add('order-expired');
            
            // ВАЖНО: НЕ отправляем запрос на завершение заказа!
            // Только визуальная индикация - красная обводка
        } else if (seconds > 0) {
            orderContainer.classList.remove('order-expired');
        }
    }

    // Инициализируем отображение
    updateDisplay(remainingSeconds);

    // НЕ создаем локальный интервал - полагаемся только на синхронизацию с сервером
    // Вместо этого просто сохраняем состояние
    activeTimers.set(orderId, { 
        container: orderContainer,
        isPaused: isPaused,
        remainingSeconds: remainingSeconds,
        lastUpdate: lastUpdateTime,
        // Убираем interval и worker
        interval: null,
        worker: null
    });

    // Обработчик паузы - УПРОЩЕННАЯ ВЕРСИЯ
    if (pauseButton) {
        // Удаляем старые обработчики
        const newPauseButton = pauseButton.cloneNode(true);
        pauseButton.parentNode.replaceChild(newPauseButton, pauseButton);
        
        newPauseButton.addEventListener("click", async function() {
            isPaused = !isPaused;
            
            // Обновляем визуальное состояние кнопки
            this.classList.toggle("section-two__box_Child-1__info_img-active");
            
            // Обновляем состояние в локальном таймере
            if (activeTimers.has(orderId)) {
                const timerInfo = activeTimers.get(orderId);
                timerInfo.isPaused = isPaused;
                timerInfo.lastUpdate = Date.now();
                
                // Получаем актуальное оставшееся время из DOM
                const currentRemaining = getRemainingTime(orderContainer);
                timerInfo.remainingSeconds = currentRemaining;
                
                activeTimers.set(orderId, timerInfo);
            }
            
            // Обновляем состояние на сервере
            if (orderContainer.dataset.orderId) {
                const currentRemaining = getRemainingTime(orderContainer);
                await updateTimerOnServer(orderContainer.dataset.orderId, currentRemaining, isPaused);
                
                // // Отправляем уведомление в гостевой режим
                // sendToGuest({
                //     type: 'TIMER_UPDATED',
                //     order_id: orderContainer.dataset.orderId,
                //     is_paused: isPaused,
                //     remaining_seconds: currentRemaining
                // });
            }
        });
    }
    
    return orderId;
}

// Функция для подсчета количества имен в строке
function countNames(nameString) {
    if (!nameString || typeof nameString !== 'string') return 0;
    return nameString.split(/\s+/).filter(name => name.length > 0).length;
}

// Функция для расчета стоимости аэрохоккея
function calculateHockeyPrice() {
    const hockeyInput = document.getElementById('hockeyGamesInput');
    const gamesCount = parseInt(hockeyInput.value) || 0;
    return gamesCount * 30; // 30 рублей за игру
}

// Обработчики для поля ввода аэрохоккея
function setupHockeyInputHandlers() {
    // Обработчик для основного поля аэрохоккея
    const hockeyInput = document.getElementById('hockeyGamesInput');
    if (hockeyInput) {
        setupSingleHockeyInput(hockeyInput);
    }
    
    // Обработчик для поля аэрохоккея в блоке изменения заказа
    document.addEventListener('click', function(event) {
        if (event.target.closest('.section-one__orderChange')) {
            const editHockeyInput = document.getElementById('order-hockey');
            if (editHockeyInput && !editHockeyInput.dataset.handlersSet) {
                setupSingleHockeyInput(editHockeyInput);
                editHockeyInput.dataset.handlersSet = 'true';
            }
        }
    });
}

// Вспомогательная функция для настройки одного поля ввода
function setupSingleHockeyInput(inputElement) {
    // Предотвращаем ввод отрицательных значений
    inputElement.addEventListener('input', function() {
        if (this.value < 0) {
            this.value = 0;
        }
    });

    // Обработчик для фокуса - выделяем только числовую часть
    inputElement.addEventListener('focus', function() {
        this.select();
    });

    // Обработчик для потери фокуса - устанавливаем 0 если пусто
    inputElement.addEventListener('blur', function() {
        if (this.value === '' || this.value < 0) {
            this.value = '0';
        }
    });

    // Предотвращаем ввод текста (только цифры)
    inputElement.addEventListener('keydown', function(e) {
        // Разрешаем: backspace, delete, tab, escape, enter, точки, запятые
        if ([46, 8, 9, 27, 13, 110, 190].includes(e.keyCode) || 
            // Разрешаем: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
            (e.keyCode === 65 && e.ctrlKey === true) || 
            (e.keyCode === 67 && e.ctrlKey === true) ||
            (e.keyCode === 86 && e.ctrlKey === true) ||
            (e.keyCode === 88 && e.ctrlKey === true) ||
            // Разрешаем: цифры на основной клавиатуре и numpad
            (e.keyCode >= 48 && e.keyCode <= 57) ||
            (e.keyCode >= 96 && e.keyCode <= 105)) {
            return;
        }
        e.preventDefault();
    });
}

// Функция для извлечения количества игр из текста телефона
function extractHockeyGames(phoneText) {
    if (!phoneText) return '0';
    
    // Ищем паттерн "Количество игр в аэрохоккей: X"
    const match = phoneText.match(/Количество игр в аэрохоккей:\s*(\d+)/);
    if (match && match[1]) {
        return match[1];
    }
    
    // Если паттерн не найден, пробуем извлечь просто число
    const numberMatch = phoneText.match(/\d+/);
    return numberMatch ? numberMatch[0] : '0';
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
        
        // Исправляем старые данные
        const fixedOrders = savedOrders.map(order => {
            if (order.startTime && order.startTime.includes('руб.')) {
                order.startTime = order.creationTime || '';
            }
            return order;
        });
        
        // Получаем счетчики
        let savedOrderCount = parseInt(localStorage.getItem('orderCount') || '0');
        let savedTotalRevenue = parseFloat(localStorage.getItem('totalRevenue') || '0');
        
        // Дополнительные проверки на валидность
        if (isNaN(savedOrderCount)) savedOrderCount = 0;
        if (isNaN(savedTotalRevenue)) savedTotalRevenue = 0;
        
        return {
            orders: fixedOrders,
            orderCount: savedOrderCount,
            totalRevenue: savedTotalRevenue
        };
    } catch (error) {
        console.error('Ошибка загрузки из localStorage:', error);
        // Возвращаем пустые данные при ошибке
        return { orders: [], orderCount: 0, totalRevenue: 0 };
    }
}

async function loadOrdersOnStartup() {
    try {
        // ЗАГРУЖАЕМ ТОЛЬКО ЗАКАЗЫ ЗА ТЕКУЩИЙ ДЕНЬ
        const today = new Date();
        const dateStr = formatDateString(today);
        const orders = await fetch(`${API_BASE_URL}/orders/${dateStr}`).then(res => res.ok ? res.json() : []);
        
        // Очищаем текущие заказы в DOM
        const sectionTwoLending = document.querySelector(".section-two_lending");
        if (sectionTwoLending) {
            sectionTwoLending.innerHTML = '';
        }
        
        // ФИЛЬТРУЕМ ТОЛЬКО АКТИВНЫЕ ЗАКАЗЫ ЗА СЕГОДНЯ
        const todayOrders = orders.filter(order => {
            const orderDate = order.date || order.creationDate;
            return orderDate === dateStr;
        });
        
        // Создаем заказы из данных API (только за сегодня)
        if (todayOrders && todayOrders.length > 0) {
            todayOrders.forEach(orderData => {
                recreateOrderFromAPI(orderData);
            });
        }
        
        // Обновляем счетчики (только активные заказы за сегодня)
        updateCounters();
        
        console.log('✅ Заказы за сегодня загружены из БД:', todayOrders.length);
        
    } catch (error) {
        console.error('Ошибка загрузки заказов из API:', error);
        // Fallback: пробуем загрузить из localStorage, но тоже только за сегодня
        const savedData = loadOrdersFromStorage();
        if (savedData.orders && savedData.orders.length > 0) {
            const today = new Date();
            const todayStr = formatDateString(today);
            
            // Фильтруем заказы только за сегодня
            const todayOrders = savedData.orders.filter(order => 
                order.creationDate === todayStr
            );
            
            todayOrders.forEach(orderData => {
                recreateOrderFromStorage(orderData);
            });
            updateCounters();
        }
    }
}

async function updateCountersFromAPI() {
    try {
        const today = new Date();
        const dateStr = formatDateString(today);
        
        // Загружаем актуальные данные с сервера ЗА СЕГОДНЯ
        const [revenueResponse, countResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/revenue/${dateStr}`),
            fetch(`${API_BASE_URL}/orders/${dateStr}`)
        ]);
        
        if (revenueResponse.ok && countResponse.ok) {
            const revenueData = await revenueResponse.json();
            const orders = await countResponse.json();
            
            // СЧИТАЕМ ВСЕ ЗАКАЗЫ ЗА СЕГОДНЯ (и активные, и завершенные)
            const allOrders = orders.filter(order => 
                (order.date || '').includes(dateStr)
            );
            
            // Считаем общую выручку из всех заказов
            const totalRevenueFromAPI = allOrders.reduce((sum, order) => {
                return sum + (parseFloat(order.sum) || 0);
            }, 0);
            
            // Обновляем глобальные переменные
            orderCount = allOrders.length;
            totalRevenue = totalRevenueFromAPI;
            
            // Обновляем DOM
            const orderCountElement = document.querySelector(".section-two__nav_block_sag-2");
            const revenueElement = document.querySelector(".revenue");
            
            if (orderCountElement) orderCountElement.textContent = orderCount;
            if (revenueElement) revenueElement.textContent = totalRevenue.toFixed(0);
        }
    } catch (error) {
        console.error('Ошибка обновления счетчиков из API:', error);
        // Используем локальные счетчики как fallback
        updateCounters();
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

// Функция для воссоздания заказа из данных API
function recreateOrderFromAPI(orderData) {
    const orderContainer = document.createElement("div");
    orderContainer.classList.add("section-two__box");
    orderContainer.dataset.orderId = orderData.id;
    
    // Если заказ завершен, добавляем соответствующий класс
    if (orderData.is_completed) {
        orderContainer.classList.add("in-section-two__box");
    }
    
    // Форматируем время для отображения
    const displayTime = formatDisplayTime(orderData.time);
    const timeString = formatTimeFromSeconds(orderData.remaining_seconds);
    
    // Определяем классы для завершенных заказов
    const boxChild1Class = orderData.is_completed ? "section-two__box_Child-1 in-section-two__box_Child-1" : "section-two__box_Child-1";
    const timeClass = orderData.is_completed ? "section-two__box_Child-1__info_time in-section-two__box_Child-1__info_time" : "section-two__box_Child-1__info_time";
    const pauseClass = orderData.is_completed ? "section-two__box_Child-1__info_img in-section-two__box_Child-1__info_img" : "section-two__box_Child-1__info_img";
    
    // Создаем HTML структуру
    const orderHTML = `
        <div class="${boxChild1Class}">
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
            <div class="section-two__box_Child-1_line ${orderData.is_completed ? 'in-section-two__box_Child-1_line' : ''}"></div>

            <div class="section-two__box_Child-1__info">
                <div class="section-two__box_Child-1__info_parents">
                    <h5 class="section-two__box_Child-1__info_parents_number">${orderData.phone}</h5>
                    <p class="section-two__box_Child-1__info_parents_par">${orderData.note}</p>
                </div>
                <div class="section-two__box_Child-1__info_line-1 ${orderData.is_completed ? 'in-section-two__box_Child-1__info_line-1' : ''}"></div>
                <div class="section-two__box_Child-1__info_container-sag">
                    <h3 class="section-two__box_Child-1__info_container-sag_name ${orderData.is_completed ? 'in-section-two__box_Child-1__info_container-sag_name' : ''}">${orderData.child_names}</h3>
                </div>
                <h3 class="section-two__box_Child-1__info_sag">Осталось:</h3>
                <h3 class="${timeClass}">${timeString}</h3>
                <div class="${pauseClass} ${orderData.is_paused ? 'section-two__box_Child-1__info_img-active' : ''}"></div>
                <div class="section-two__box_Child-1__info_line-3-mobile"></div>
                <img class="section-two__box_Child-1__info_burger" alt="burger">
            </div>
        </div>
        
        <div class="section-two__box_Child-2 ${orderData.is_completed ? 'in-section-two__box_Child-2' : ''}">
            <h5 class="section-two__box_Child-2_sag ${orderData.is_completed ? 'in-section-two__box_Child-2_sag' : ''}">Заказ выполенен</h5>
        </div>

        <div class="section-two__box_Child-3 ${orderData.is_completed ? 'in-section-two__box_Child-3' : ''}">
            <h5 class="section-two__box_Child-3_sag ${orderData.is_completed ? 'in-section-two__box_Child-3_sag' : ''}">Удалить</h5>
            <div class="section-two__box_Child-3_img"></div>
        </div>
        
        <div class="section-two__box_Child-4 ${orderData.is_completed ? 'in-section-two__box_Child-4' : ''}">
            <h5 class="section-two__box_Child-4_sag ${orderData.is_completed ? 'in-section-two__box_Child-4_sag' : ''}">Изменить заказ</h5>
        </div>`;

    orderContainer.innerHTML = orderHTML;

    // Добавляем в DOM
    const sectionTwoLending = document.querySelector(".section-two_lending");
    if (sectionTwoLending) {
        sectionTwoLending.insertBefore(orderContainer, sectionTwoLending.firstChild);
    }

    // Если заказ не завершен, создаем таймер
    if (!orderData.is_completed && orderData.remaining_seconds > 0) {
        const fakeButtons = [{
            textContent: orderData.duration,
            querySelector: () => ({ textContent: orderData.duration })
        }];
        
        // Запускаем таймер с текущим временем
        const timerId = startCountdown(fakeButtons, orderContainer, orderData.remaining_seconds);
        orderContainer.dataset.timerId = timerId;
        
        // Восстанавливаем состояние паузы
        if (orderData.is_paused) {
            const timerInfo = activeTimers.get(timerId);
            if (timerInfo) {
                timerInfo.isPaused = true;
                activeTimers.set(timerId, timerInfo);
            }
        }
    }

    // Добавляем обработчики
    addDeleteFunctionality(orderContainer);
    addOrderCompletedFunctionality(orderContainer);
    addEditOrderFunctionality(orderContainer);

    return orderContainer;
}

function cleanupAllTimers() {
    for (const [orderId, timerInfo] of activeTimers.entries()) {
        clearInterval(timerInfo.interval);
        if (timerInfo.worker) {
            timerInfo.worker.terminate();
        }
        activeTimers.delete(orderId);
    }
    console.log('Все таймеры очищены');
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

    newCompleteButton.addEventListener("click", async function() {
        const targetBlock = orderContainer.closest(".section-two__box");
        if (!targetBlock) return;
        
        const orderId = targetBlock.dataset.orderId;
        
        if (orderId) {
            try {
                // Получаем текущее значение таймера
                const currentRemainingSeconds = getRemainingTime(targetBlock);
                
                // ОСТАНАВЛИВАЕМ ЛОКАЛЬНЫЙ ТАЙМЕР
                const timerId = targetBlock.dataset.timerId;
                if (timerId && typeof stopTimer === 'function') {
                    stopTimer(timerId);
                }
                
                // ВАЖНО: Определяем новое состояние - инвертируем текущее
                const willBeCompleted = !targetBlock.classList.contains('in-section-two__box');
                
                // Обновляем состояние на сервере
                await completeOrderOnServer(orderId, willBeCompleted);
                
                // ВАЖНОЕ ИСПРАВЛЕНИЕ: Переключаем стили напрямую
                if (targetBlock.classList.contains('in-section-two__box')) {
                    // Если заказ уже завершен - возобновляем
                    removeCompletedStyles(targetBlock);
                    
                    // Перезапускаем таймер с текущим временем
                    const durationElement = targetBlock.querySelector('.section-two__box_Child-1__nav_section_par-3');
                    if (durationElement) {
                        const durationText = durationElement.textContent.trim();
                        const fakeButtons = [{
                            textContent: durationText,
                            querySelector: () => ({ textContent: durationText })
                        }];
                        
                        const newTimerId = startCountdown(fakeButtons, targetBlock, currentRemainingSeconds);
                        targetBlock.dataset.timerId = newTimerId;
                    }
                } else {
                    // Если заказ активен - завершаем
                    targetBlock.classList.remove('order-expired'); // Убираем красную обводку
                    applyCompletedStyles(targetBlock);
                }
                
                // Обновляем счетчики
                updateCounters();
                
                // Отправляем уведомление в гостевой режим
                sendToGuest({
                    type: 'ORDER_COMPLETED',
                    order_id: orderId,
                    is_completed: willBeCompleted
                });
                
            } catch (error) {
                console.error('❌ Ошибка сети при переключении статуса заказа:', error);
                alert('Ошибка сети при изменении статуса заказа');
            }
        } else {
            // Fallback для заказов без ID (старые заказы)
            if (targetBlock.classList.contains('in-section-two__box')) {
                removeCompletedStyles(targetBlock);
            } else {
                targetBlock.classList.remove('order-expired');
                applyCompletedStyles(targetBlock);
            }
            updateCounters();
        }
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

            const countdownElement = parentOrder.querySelector(".section-two__box_Child-1__info_time");
            const currentCountdown = countdownElement ? countdownElement.textContent.trim() : "00:00:00";

            // Извлекаем количество игр в аэрохоккей из текста телефона
            const hockeyGames = extractHockeyGames(phoneValue);

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
                        <img class="section-one__orderChange_img" alt="back">
                        <h1 class="section-one__orderChange_sag">Изменить заказ</h1>
                    </div>
                    <div class="section-one__orderChange_line-mobile"></div> <!-- линия -->
                    <div class="section-one__orderChange__box">
                        <div class="section-one__orderChange__box__input">
                            <input id="order-1" class="section-one__orderChange__box__input_item" placeholder="Имя" type="text" value="${nameValue}">
                            <div class="section-one__container_hockey-wrapper">
                                <span class="section-one__container_hockey-prefix">Количество игр в аэрохоккей: </span>
                                <input id="order-hockey" class="section-one__orderChange__box__input_item" type="number" min="0" value="${hockeyGames}">
                            </div>
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
            saveButton.addEventListener("click", async function () {
                const selectedButtons = newOrderBlock.querySelectorAll(".section-one__orderChange__box__buttons_block-1_active");

                if (selectedButtons.length === 0) {
                    alert("Необходимо выбрать время посещения");
                    return;
                }

                // Получаем новое время и рассчитываем БАЗОВУЮ цену (за одно имя)
                const timeText = selectedButtons[0].closest('.section-one__orderChange__box__buttons_block-1, .section-one__orderChange__box__buttons_block-2, .section-one__orderChange__box__buttons_block-3')
                    .querySelector('h2').textContent.trim();
                const basePriceForOneName = calculatePriceFromDuration(timeText);
                
                const newName = document.getElementById("order-1").value;
                const newHockeyGames = document.getElementById("order-hockey").value;
                const newNote = document.getElementById("order-3").value;

                // Создаем текст для поля телефона с информацией об аэрохоккее
                const hockeyPhoneText = `Аэрохоккей: ${newHockeyGames}`;

                // Подсчитываем количество имен из поля ввода
                const newNames = newName.split(/\s+/).filter(name => name.length > 0);
                const nameCount = newNames.length;

                // Проверяем, выбрана ли аренда (цена аренды не умножается на кол-во имен)
                const isRental = timeText.includes('Аренда');
                
                // Рассчитываем базовую цену времени
                let baseTimePrice = isRental ? basePriceForOneName : basePriceForOneName * nameCount;

                // Добавляем стоимость аэрохоккея
                const hockeyPrice = parseInt(newHockeyGames) * 30;
                const newPrice = baseTimePrice + hockeyPrice;

                // Получаем оставшееся время из текущего таймера
                const remainingSeconds = getRemainingTime(parentOrder);
                    
                // Получаем исходную продолжительность заказа
                const originalDurationSeconds = getOriginalDurationSeconds(parentOrder);
                    
                // Вычисляем прошедшее время (исходное время - оставшееся время)
                const elapsedSeconds = Math.max(originalDurationSeconds - remainingSeconds, 0);

                // Вычисляем новое общее время в секундах
                const newTotalSeconds = getTotalDurationInSeconds([{ textContent: timeText }]);
                
                // Вычисляем новое оставшееся время
                const newRemainingSeconds = Math.max(newTotalSeconds - elapsedSeconds, 0);

                // Обновляем данные в DOM
                parentOrder.querySelector(".section-two__box_Child-1__info_container-sag_name").textContent = newName;
                parentOrder.querySelector(".section-two__box_Child-1__info_parents_number").textContent = hockeyPhoneText;
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

                // === ОБНОВЛЯЕМ ВСЕ ДАННЫЕ В БАЗЕ ДАННЫХ ===
                const orderId = parentOrder.dataset.orderId;
                
                if (orderId) {
                    try {
                        const response = await fetch(`${API_BASE_URL}/order/${orderId}/update-full`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                child_names: newName,
                                phone: hockeyPhoneText,
                                note: newNote,
                                duration: timeText,
                                sum: newPrice,
                                total_seconds: newTotalSeconds,
                                remaining_seconds: newRemainingSeconds,
                                is_paused: false // сбрасываем паузу при изменении
                            })
                        });

                        if (response.ok) {
                            const result = await response.json();
                            console.log('✅ Данные заказа полностью обновлены в БД:', result);
                            
                            // Обновляем данные в родительском заказе
                            parentOrder.dataset.creationSum = newPrice;
                            
                        } else {
                            console.error('❌ Ошибка при обновлении заказа в БД:', response.status);
                            alert('Ошибка при сохранении изменений в базе данных');
                        }
                    } catch (error) {
                        console.error('❌ Ошибка сети при обновлении заказа:', error);
                        alert('Ошибка сети при сохранении изменений');
                    }
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

                // 1. ОСТАНАВЛИВАЕМ СТАРЫЙ ТАЙМЕР
                const oldTimerId = parentOrder.dataset.timerId;
                if (oldTimerId && typeof stopTimer === 'function') {
                    stopTimer(oldTimerId);
                }

                // 2. Перезапускаем таймер с новым временем
                stopAllTimersForContainer(parentOrder);
                const newTimerId = startCountdown(fakeButtons, parentOrder, newRemainingSeconds);
                parentOrder.dataset.timerId = newTimerId;

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
    addDeleteFunctionality(orderContainer);
}

// ==================== КОНЕЦ ФУНКЦИЙ ДЛЯ LOCALSTORAGE ====================

// ==================== ОСНОВНОЙ КОД ====================
document.addEventListener("DOMContentLoaded", function() {

    // ==================== СИСТЕМА ГОРЯЧИХ КЛАВИШ ====================
    function setupHotkeys() {
        document.addEventListener('keydown', function(event) {
            // Определяем приоритеты обработки
            
            // 1. ВЫСШИЙ ПРИОРИТЕТ: Окно редактирования заказа
            const orderChangeBlock = document.querySelector('.section-one__orderChange');
            if (orderChangeBlock) {
                // Esc - отмена редактирования
                if (event.key === 'Escape') {
                    const cancelButton = orderChangeBlock.querySelector('.section-one__orderChange__box_cancellation');
                    if (cancelButton) {
                        cancelButton.click();
                        event.preventDefault();
                        event.stopPropagation();
                    }
                    return;
                }
                
                // Enter - сохранение редактирования
                if (event.key === 'Enter' && !event.shiftKey) {
                    const saveButton = orderChangeBlock.querySelector('.section-one__orderChange__box_save');
                    if (saveButton) {
                        saveButton.click();
                        event.preventDefault();
                        event.stopPropagation();
                    }
                    return;
                }
            }
            
            // 2. СРЕДНИЙ ПРИОРИТЕТ: Форма создания заказа (Alt+1 до Alt+5)
            const sectionOne = document.querySelector('.section-one');
            if (sectionOne && sectionOne.style.display !== 'none' && !orderChangeBlock) {
                if (event.altKey && event.key >= '1' && event.key <= '5') {
                    const buttonIndex = parseInt(event.key) - 1;
                    
                    // Получаем кнопки в правильном порядке как они отображаются:
                    // 0: 30 мин. (section-one__box__buttonMobile-3)
                    // 1: 1 час (section-one__box__buttonMobile-1)  
                    // 2: 2 часа (section-one__box__buttonMobile-4)
                    // 3: Аренда 1 час (section-one__box__buttonMobile-2)
                    // 4: Аренда 2 часа (section-one__box__buttonMobile-5)
                    const timeButtons = [
                        document.querySelector('.section-one__box__buttonMobile-3'), // 30 мин.
                        document.querySelector('.section-one__box__buttonMobile-1'), // 1 час
                        document.querySelector('.section-one__box__buttonMobile-4'), // 2 часа
                        document.querySelector('.section-one__box__buttonMobile-2'), // Аренда 1 час
                        document.querySelector('.section-one__box__buttonMobile-5')  // Аренда 2 часа
                    ].filter(button => button !== null);
                    
                    if (buttonIndex < timeButtons.length && timeButtons[buttonIndex]) {
                        // Снимаем выделение со всех кнопок
                        document.querySelectorAll('.section-one__box__button-1, .section-one__box__button-2').forEach(button => {
                            button.classList.remove('selected');
                            button.classList.remove('scaled');
                        });
                        
                        // Выделяем выбранную кнопку
                        const selectedButton = timeButtons[buttonIndex];
                        selectedButton.classList.add('selected');
                        selectedButton.classList.add('scaled');
                        
                        event.preventDefault();
                        event.stopPropagation();
                        
                        // Фокус на поле имен для продолжения ввода
                        const namesInput = document.querySelector('#namesInput');
                        if (namesInput) {
                            setTimeout(() => namesInput.focus(), 100);
                        }
                    }
                    return;
                }
            }
            
            // 3. НИЗКИЙ ПРИОРИТЕТ: Глобальные горячие клавиши (если не сработали выше)
            
            // Enter - фокус на первое поле ввода (только если не в поле ввода)
            if (event.key === 'Enter' && !event.shiftKey && !event.altKey) {
                const activeElement = document.activeElement;
                const isInputFocused = activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA';
                
                if (!isInputFocused && !orderChangeBlock) {
                    const firstInput = document.querySelector('#namesInput');
                    if (firstInput) {
                        firstInput.focus();
                        event.preventDefault();
                    }
                }
            }
            
            // Shift+Enter - добавление заказа (глобально)
            if (event.key === 'Enter' && event.shiftKey && !event.altKey) {
                const addButton = document.querySelector('.section-one__button');
                if (addButton && !orderChangeBlock) {
                    addButton.click();
                    event.preventDefault();
                }
            }
        });
    }

    // Инициализация горячих клавиш
    setupHotkeys();

    cleanupAllTimers();

    setupLogoutHandler();
    setupAutoLogout();

    // Загружаем данные из БД
    loadOrdersOnStartup().then(() => {
        console.log('✅ Приложение инициализировано с данными из БД');
        
        // Запускаем периодическую синхронизацию
        startPeriodicSync();
    });

    // Обновляем глобальные переменные из DOM
    updateCounters();
    
    // Инициализируем глобальные переменные нулями
    orderCount = 0;
    totalRevenue = 0;

    // Обновляем счетчики в DOM
    var orderCountElement = document.querySelector(".section-two__nav_block_sag-2");
    if (orderCountElement) orderCountElement.textContent = orderCount;
    
    var revenueElement = document.querySelector(".revenue");
    if (revenueElement) {
        revenueElement.textContent = '0';
    }

    // Настраиваем ежедневную очистку заказов
    setupDailyClear();

    const hockeyInput = document.getElementById('hockeyGamesInput');
    if (hockeyInput) {
        hockeyInput.addEventListener('focus', function() {
            if (this.value === '0') {
                this.value = '';
            }
        });
        
        hockeyInput.addEventListener('blur', function() {
            if (this.value === '') {
                this.value = '0';
            }
        });
    }

    // Настройка обработчиков для поля аэрохоккея
    setupHockeyInputHandlers();

    // Находим все поля ввода
    var inputs = document.querySelectorAll(".section-one__container_1, .section-one__container_4, .section-one__container__parent_2.section-one__container_3");

    // Находим кнопку "Добавить"
    var addButton = document.querySelector(".section-one__button");

    inputs.forEach(function(input, index) {
        input.addEventListener("keydown", function(event) {
            // Проверяем, нажата ли клавиша Enter
            if (event.key === "Enter") {
                event.preventDefault(); // Отменяем стандартное поведение
                
                // Shift+Enter - всегда нажимает кнопку "Добавить"
                if (event.shiftKey) {
                    if (addButton) {
                        addButton.click();
                    }
                    return;
                }
                
                // Обычный Enter - переходит к следующему полю или добавляет заказ
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
            // Если кнопка уже выбрана - снимаем выделение
            if (button.classList.contains("selected")) {
                button.classList.remove("selected");
                button.classList.remove("scaled");
            } else {
                // Снимаем выделение со всех других кнопок
                timeButtons.forEach(function(otherButton) {
                    otherButton.classList.remove("selected");
                    otherButton.classList.remove("scaled");
                });
                
                // Выделяем текущую кнопку
                button.classList.add("selected");
                button.classList.add("scaled");
            }
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

        // Добавляем стоимость аэрохоккея
        currentOrderTotal += calculateHockeyPrice();

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
                        <h5 class="section-two__box_Child-1__info_parents_number">Аэрохоккей: ${document.getElementById('hockeyGamesInput').value || 0}</h5>
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

        if (typeof sendRequest === 'function') {
            const totalSeconds = getTotalDurationInSeconds(selectedButtons);
            
            sendRequest(`${API_BASE_URL}/order`, "POST", {
                sum: currentOrderTotal,
                date: dateStr,
                time: timeStr,
                child_names: document.querySelector('.section-one__container_1').value,
                phone: `Аэрохоккей: ${document.getElementById('hockeyGamesInput').value || 0}`,
                note: document.querySelector('.section-one__container_3').value,
                duration: getDuration(selectedButtons),
                total_seconds: totalSeconds,
                remaining_seconds: totalSeconds
            }).then(result => {
                if (result && result.id) {
                    // Сохраняем ID заказа из ответа сервера
                    orderContainer.dataset.orderId = result.id;
                    console.log('✅ Заказ создан с ID:', result.id);
                }
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

        // const guestOrderData = {
        //     type: 'NEW_ORDER',
        //     order: {
        //         id: orderContainer.dataset.timerId,
        //         child_name: capitalizeFirstLetter(document.querySelector('.section-one__container_1').value),
        //         phone: document.querySelector('.section-one__container_4').value,
        //         note: document.querySelector('.section-one__container_3').value,
        //         sum: currentOrderTotal,
        //         duration: getDuration(selectedButtons),
        //         start_time: getCurrentTime(),
        //         remaining_seconds: getTotalDurationInSeconds(selectedButtons),
        //         status: 'active'
        //     }
        // };
        // sendToGuest(guestOrderData);

        // // Добавим обработчик для запросов синхронизации
        // guestChannel.onmessage = (event) => {
        //     if (event.data.type === 'REQUEST_SYNC') {
        //         console.log('📥 Запрос синхронизации от гостевого режима');
        //         syncAllOrders();
        //     }
        // };

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
            
            // sendToGuest({
            //     type: 'SYNC_ALL_ORDERS',
            //     orders: orders
            // });
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


    // ==================== АВТОРИЗАЦИЯ И ВЫХОД ====================
    // Обработчик кнопки выхода
    function setupLogoutHandler() {
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', function() {
                if (confirm('Вы уверены, что хотите выйти?')) {
                    // Очищаем данные авторизации
                    sessionStorage.removeItem('adminAuthenticated');
                    sessionStorage.removeItem('adminAuthTimestamp');
                    
                    // Перенаправляем на страницу авторизации
                    window.location.href = './check/checkpoint-admin.html';
                }
            });
        }
    }

    // Автоматический выход при бездействии (8 часов)
    function setupAutoLogout() {
        setInterval(() => {
            const authTimestamp = sessionStorage.getItem('adminAuthTimestamp');
            if (authTimestamp && (Date.now() - parseInt(authTimestamp)) > 8 * 60 * 60 * 1000) {
                sessionStorage.removeItem('adminAuthenticated');
                sessionStorage.removeItem('adminAuthTimestamp');
                alert('Сессия истекла. Пожалуйста, войдите снова.');
                window.location.href = './check/checkpoint-admin.html';
            }
        }, 60000); // Проверяем каждую минуту
    }
});