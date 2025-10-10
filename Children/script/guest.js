// Проверяем, не объявлен ли уже класс
if (typeof GuestMode === 'undefined') {

    class GuestMode {
        constructor() {
            this.orders = new Map();
            this.channel = null;
            this.isConnected = false;
            this.init();
            this.syncInterval = null;
        }

        // Метод для периодической синхронизации
        startPeriodicSync() {
            // Синхронизируем каждую секунду
            this.syncInterval = setInterval(() => {
                this.loadOrdersFromAPI().then(success => {
                });
            }, 1000);
        }

        startDataSync() {
            // Синхронизация данных каждые 3 секунды
            this.dataSyncInterval = setInterval(() => {
                this.syncOrderDataFromAPI();
            }, 3000);
        }

        // Метод для синхронизации данных заказов
        async syncOrderDataFromAPI() {
            try {
                const response = await fetch('http://127.0.0.1:8000/orders/active');
                if (response.ok) {
                    const orders = await response.json();
                    this.updateOrderData(orders);
                }
            } catch (error) {
                console.error('Ошибка синхронизации данных заказов:', error);
            }
        }

        // Метод для обновления данных существующих заказов
        updateOrderData(ordersFromAPI) {
            ordersFromAPI.forEach(apiOrder => {
                if (this.orders.has(apiOrder.id)) {
                    const existingOrder = this.orders.get(apiOrder.id);
                    
                    // Проверяем, изменились ли критичные данные
                    const isDataChanged = 
                        existingOrder.child_names !== apiOrder.child_names ||
                        existingOrder.duration !== apiOrder.duration ||
                        existingOrder.remaining_seconds !== apiOrder.remaining_seconds;
                    
                    if (isDataChanged) {
                        console.log('🔄 Обновление данных заказа:', apiOrder.id);
                        
                        // Обновляем только необходимые поля
                        existingOrder.child_names = apiOrder.child_names;
                        existingOrder.duration = apiOrder.duration;
                        existingOrder.remaining_seconds = apiOrder.remaining_seconds;
                        existingOrder.is_paused = apiOrder.is_paused;
                        
                        this.orders.set(apiOrder.id, existingOrder);
                        this.updateOrderElement(existingOrder);
                    }
                }
            });
        }

        // Добавьте этот метод для полного обновления состояния
        refreshOrderState(orderId) {
            if (this.orders.has(orderId)) {
                const order = this.orders.get(orderId);
                this.updateOrderElement(order);
            }
        }

        // Добавляем метод для загрузки данных
        async loadOrdersFromAPI() {
            try {
                const response = await fetch('http://127.0.0.1:8000/orders/active');
                if (response.ok) {
                    const orders = await response.json();
                    this.syncOrders(orders);
                    return true;
                }
                return false;
            } catch (error) {
                console.error('Ошибка загрузки заказов из API:', error);
                return false;
            }
        }

        init() {
            console.log('Инициализация гостевого режима...');
            this.setupBroadcastChannel();
            this.setupEventListeners();
            
            // Пытаемся загрузить из API, если не получится - из localStorage
            this.loadOrdersFromAPI().then(success => {
                if (!success) {
                    this.loadFromStorage();
                }
                this.updateDisplay();
                this.startPeriodicSync(); // Запускаем периодическую синхронизацию
                this.startDataSync(); // ← ДОБАВЬТЕ ЭТУ СТРОКУ для запуска синхронизации данных
            });
        }

        setupBroadcastChannel() {
            try {
                this.channel = new BroadcastChannel('guest_orders_channel');
                
                this.channel.onmessage = (event) => {
                    console.log('Получено сообщение:', event.data);
                    this.isConnected = true;
                    this.handleMessage(event.data);
                };
                
                console.log('BroadcastChannel подключен');
                
                // Запрос синхронизации при подключении
                setTimeout(() => {
                    this.requestSync();
                }, 1000);
                
            } catch (error) {
                console.error('Ошибка подключения BroadcastChannel:', error);
                this.setupPolling();
            }
        }

        updateTimer(orderId, remainingSeconds, isPaused) {
            if (this.orders.has(orderId)) {
                const order = this.orders.get(orderId);
                order.remaining_seconds = remainingSeconds;
                order.is_paused = isPaused;
                this.orders.set(orderId, order);
                
                // Обновляем отображение
                this.updateOrderElement(order);
            }
        }

        pauseOrder(orderId) {
            if (this.orders.has(orderId)) {
                const order = this.orders.get(orderId);
                order.is_paused = true;
                this.orders.set(orderId, order);
                this.updateOrderElement(order);
            }
        }

        resumeOrder(orderId) {
            if (this.orders.has(orderId)) {
                const order = this.orders.get(orderId);
                order.is_paused = false;
                this.orders.set(orderId, order);
                this.updateOrderElement(order);
            }
        }

        handleMessage(message) {
            console.log('📨 ПОЛУЧЕНО сообщение:', message.type, message);
            
            if (!message || !message.type) {
                console.warn('⚠️ Получено пустое или некорректное сообщение');
                return;
            }
            
            switch (message.type) {
                case 'NEW_ORDER':
                    if (!message.order) return;
                    console.log('➕ Новый заказ получен:', message.order);
                    this.addOrder(message.order);
                    break;
                    
                case 'ORDER_COMPLETED':
                    if (!message.order_id) return;
                    this.deleteOrder(message.order_id);
                    break;
                    
                case 'ORDER_DELETED':
                    if (!message.order_id) return;
                    this.deleteOrder(message.order_id);
                    break;
                    
                case 'SYNC_ALL_ORDERS':
                    if (!message.orders || !Array.isArray(message.orders)) return;
                    console.log('🔄 Синхронизация заказов:', message.orders.length);
                    this.syncOrders(message.orders);
                    break;
                    
                case 'TIMER_UPDATED':
                    if (!message.order_id || message.is_paused === undefined) return;
                    this.updatePauseState(message.order_id, message.is_paused);
                    break;
                    
                case 'ORDER_UPDATED':
                    if (!message.order) return;
                    console.log('✏️ Заказ обновлен:', message.order);
                    this.updateOrderData([message.order]);
                    break;
                    
                default:
                    console.warn('⚠️ Неизвестный тип сообщения:', message.type);
            }
        }

        // Добавляем простой метод для обновления состояния паузы
        updatePauseState(orderId, isPaused) {
            if (this.orders.has(orderId)) {
                const order = this.orders.get(orderId);
                
                // Обновляем только состояние паузы, remaining_seconds остается из БД
                order.is_paused = isPaused;
                this.orders.set(orderId, order);
                
                // Всегда обновляем отображение при изменении паузы
                this.updateOrderElement(order);
            }
        }

        addOrder(orderData) {
            const order = {
                id: orderData.id || this.generateId(),
                child_name: orderData.child_name,
                phone: orderData.phone,
                note: orderData.note,
                sum: orderData.sum,
                duration: orderData.duration,
                start_time: orderData.start_time,
                remaining_seconds: orderData.remaining_seconds,
                status: orderData.status || 'active',
                created_at: Date.now() // Добавляем timestamp создания
            };

            this.orders.set(order.id, order);
            this.saveToStorage();
            
            // Сначала обновляем отображение, чтобы новый заказ добавился в начало
            this.updateDisplay();
        }

        updateOrder(orderData) {
            if (this.orders.has(orderData.id)) {
                const existingOrder = this.orders.get(orderData.id);
                const updatedOrder = { ...existingOrder, ...orderData };
                this.orders.set(orderData.id, updatedOrder);
                this.saveToStorage();
                this.updateOrderElement(updatedOrder);
            }
        }

        completeOrder(orderId) {
            if (this.orders.has(orderId)) {
                const order = this.orders.get(orderId);
                order.status = 'completed';
                order.remaining_seconds = 0;
                order.is_paused = false;
                this.orders.set(orderId, order);
                this.saveToStorage();
                this.updateOrderElement(order);
                
                // Останавливаем таймер
                const orderElement = document.querySelector(`[data-order-id="${orderId}"]`);
                if (orderElement && orderElement.dataset.timerId) {
                    clearInterval(orderElement.dataset.timerId);
                }
            }
        }

        deleteOrder(orderId) {
            if (this.orders.has(orderId)) {
                this.orders.delete(orderId);
                this.saveToStorage();
                this.removeOrderElement(orderId);
            }
        }

        syncOrders(ordersArray) {
            this.orders.clear();
            
            ordersArray.forEach(order => {
                // Используем remaining_seconds из БД для отображения текущего времени
                const orderWithCorrectTime = {
                    ...order,
                    remaining_seconds: order.remaining_seconds // ← используем актуальное оставшееся время
                };
                this.orders.set(order.id, orderWithCorrectTime);
            });
            
            this.saveToStorage();
            this.updateDisplay();
        }

        createOrderElement(order) {
            const ordersBlock = document.getElementById('ordersBlock');
            if (!ordersBlock) return;

            const orderElement = document.createElement('div');
            orderElement.className = 'section-two__box guest-order';
            orderElement.dataset.orderId = order.id;
            orderElement.innerHTML = this.getOrderHTML(order);

            // Добавляем в НАЧАЛО списка (первым элементом)
            if (ordersBlock.firstChild) {
                ordersBlock.insertBefore(orderElement, ordersBlock.firstChild);
            } else {
                ordersBlock.appendChild(orderElement);
            }
            
            this.startTimer(orderElement, order.remaining_seconds);
        }

        getOrderHTML(order) {
            const displayTime = this.formatDisplayTime(order.time);
            const durationText = this.getDurationText(order.duration);
            const remainingTime = this.formatTimeFromSeconds(order.remaining_seconds);
            
            // Определяем статусы
            const isCompleted = order.status === 'completed' || order.remaining_seconds <= 0;
            const isPaused = !isCompleted && order.is_paused;
            const isActive = !isCompleted && !order.is_paused;

            // Формируем HTML для статусов
            let statusHTML = '';
            
            if (isCompleted) {
                statusHTML = '<span class="order-status status-completed">завершено</span>';
            } else if (isPaused) {
                statusHTML = '<span class="order-status status-paused">на паузе</span>';
            } else {
                statusHTML = '<span class="order-status status-active">активно</span>';
            }

            return `
                <div class="section-two__box_Child-1">
                    <nav class="section-two__box_Child-1__nav">
                        <div class="section-two__box_Child-1__nav_section">
                            <p class="section-two__box_Child-1__nav_section_par-1">Зашёл в</p>
                            <p class="section-two__box_Child-1__nav_section_par-2">${displayTime}</p>
                        </div>
                        <div class="section-two__box_Child-1__nav_section">
                            <p class="section-two__box_Child-1__nav_section_par-1">Посещение</p>
                            <p class="section-two__box_Child-1__nav_section_par-2">${durationText}</p>
                            ${statusHTML}
                        </div>
                    </nav>
                    <div class="section-two__box_Child-1_line"></div>

                    <div class="section-two__box_Child-1__info">
                        <div class="section-two__box_Child-1__info_container-sag">
                            <h3 class="section-two__box_Child-1__info_container-sag_name">${this.escapeHtml(order.child_names)}</h3>
                        </div>
                        <h3 class="section-two__box_Child-1__info_sag">Осталось:</h3>
                        <h3 class="section-two__box_Child-1__info_time ${isPaused ? 'timer-paused' : ''}">${remainingTime}</h3>
                    </div>
                </div>
            `;
        }

        startTimer(orderElement, initialSeconds) {
            const countdownElement = orderElement.querySelector(".section-two__box_Child-1__info_time");
            if (!countdownElement || initialSeconds <= 0) return;

            let remainingSeconds = initialSeconds;
            let lastUpdateTime = Date.now();
            let isTabActive = true;

            const handleVisibilityChange = () => {
                isTabActive = !document.hidden;
                if (isTabActive) {
                    lastUpdateTime = Date.now();
                }
            };

            document.addEventListener('visibilitychange', handleVisibilityChange);

            const updateTimer = () => {
                const orderId = orderElement.dataset.orderId;
                if (!this.orders.has(orderId)) {
                    clearInterval(timerId);
                    document.removeEventListener('visibilitychange', handleVisibilityChange);
                    return;
                }

                const order = this.orders.get(orderId);
                
                // Если заказ на паузе или завершен - не обновляем таймер
                if (order.is_paused || order.status === 'completed') {
                    return;
                }

                if (!isTabActive) return;

                const currentTime = Date.now();
                const elapsedSeconds = Math.floor((currentTime - lastUpdateTime) / 1000);
                
                if (elapsedSeconds >= 1) {
                    remainingSeconds = Math.max(0, remainingSeconds - elapsedSeconds);
                    lastUpdateTime = currentTime;

                    countdownElement.textContent = this.formatTimeFromSeconds(remainingSeconds);
                    
                    // Обновляем значение в данных (локально)
                    order.remaining_seconds = remainingSeconds;
                    this.orders.set(orderId, order);

                    if (remainingSeconds <= 0) {
                        this.completeOrder(orderId);
                        clearInterval(timerId);
                        document.removeEventListener('visibilitychange', handleVisibilityChange);
                    }
                }
            };

            const timerId = setInterval(updateTimer, 100);
            orderElement.dataset.timerId = timerId;
            countdownElement.textContent = this.formatTimeFromSeconds(remainingSeconds);
        }

        updateOrderStatus(orderId, status) {
            if (this.orders.has(orderId)) {
                const order = this.orders.get(orderId);
                order.status = status;
                this.orders.set(orderId, order);
                this.saveToStorage();
                this.updateOrderElement(order);
            }
        }

        updateOrderElement(order) {
            const orderElement = document.querySelector(`[data-order-id="${order.id}"]`);
            if (orderElement) {
                // Полностью заменяем HTML элемента
                orderElement.outerHTML = this.getOrderHTML(order);
                
                // Перезапускаем таймер только если заказ активен, время осталось и НЕ на паузе
                const newOrderElement = document.querySelector(`[data-order-id="${order.id}"]`);
                if (order.status === 'active' && order.remaining_seconds > 0 && !order.is_paused) {
                    this.startTimer(newOrderElement, order.remaining_seconds);
                }
            }
        }

        removeOrderElement(orderId) {
            const orderElement = document.querySelector(`[data-order-id="${orderId}"]`);
            if (orderElement) {
                orderElement.remove();
            }
        }

        updateDisplay() {
            const ordersBlock = document.getElementById('ordersBlock');
            const noOrdersBlock = document.getElementById('noOrdersBlock');
            const loadingBlock = document.getElementById('loadingBlock');

            if (loadingBlock) loadingBlock.style.display = 'none';

            if (this.orders.size === 0) {
                if (noOrdersBlock) noOrdersBlock.style.display = 'block';
                if (ordersBlock) ordersBlock.style.display = 'none';
            } else {
                if (noOrdersBlock) noOrdersBlock.style.display = 'none';
                if (ordersBlock) {
                    ordersBlock.style.display = 'block';
                    ordersBlock.innerHTML = '';
                    
                    // Сортируем заказы: сначала новые (по created_at или id)
                    const sortedOrders = Array.from(this.orders.values()).sort((a, b) => {
                        // Сначала по дате создания (новые первыми)
                        if (a.created_at && b.created_at) {
                            return b.created_at - a.created_at;
                        }
                        // Или по ID (больший ID = новее заказ)
                        return b.id - a.id;
                    });
                    
                    // Добавляем заказы в отсортированном порядке
                    sortedOrders.forEach(order => {
                        this.createOrderElement(order);
                    });
                }
            }
        }

        // Вспомогательные методы
        formatTimeFromSeconds(totalSeconds) {
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            return `${this.formatTime(hours)}:${this.formatTime(minutes)}:${this.formatTime(seconds)}`;
        }

        formatTime(time) {
            return time < 10 ? "0" + time : time;
        }

        getDurationText(duration) {
            if (duration.includes('2 часа')) return "2 часа";
            if (duration.includes('1 час')) return "1 час";
            if (duration.includes('30 мин')) return "30 мин.";
            if (duration.includes('15 мин')) return "15 мин.";
            return duration;
        }

        formatDisplayTime(timeString) {
            if (!timeString) return '--:--';
            return timeString.replace(/\./g, ':').substring(0, 5);
        }

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        generateId() {
            return 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        setupEventListeners() {
            const refreshButton = document.getElementById('refreshButton');
            if (refreshButton) {
                refreshButton.addEventListener('click', () => {
                    this.requestSync();
                    this.showNotification('Данные обновлены');
                });
            }
        }

        requestSync() {
            // Запрос синхронизации с основным приложением
            if (this.channel) {
                this.channel.postMessage({ type: 'REQUEST_SYNC' });
                console.log('📤 Отправлен запрос синхронизации');
            }
            
            // Также пытаемся загрузить напрямую из API
            this.loadOrdersFromAPI().then(success => {
                if (success) {
                    console.log('✅ Синхронизация через API успешна');
                }
            });
        }

        setupPolling() {
            // Fallback: периодический опрос localStorage
            console.log('Запуск периодического опроса...');
            setInterval(() => {
                this.loadFromStorage();
                this.updateDisplay();
            }, 5000);
        }

        saveToStorage() {
            const ordersArray = Array.from(this.orders.values());
            localStorage.setItem('guest_orders', JSON.stringify(ordersArray));
        }

        loadFromStorage() {
            try {
                const savedOrders = JSON.parse(localStorage.getItem('guest_orders') || '[]');
                this.orders.clear();
                savedOrders.forEach(order => {
                    this.orders.set(order.id, order);
                });
            } catch (error) {
                console.error('Ошибка загрузки из storage:', error);
            }
        }

        showNotification(message) {
            console.log('Notification:', message);
        }
    }

    // Объявляем глобально после определения класса
    window.GuestMode = GuestMode;

} // конец if typeof GuestMode

// Инициализация
function initGuestMode() {
    if (typeof GuestMode !== 'undefined') {
        window.guestApp = new GuestMode();
        console.log('✅ GuestMode инициализирован');
    } else {
        console.error('❌ GuestMode не определен');
        // Альтернативная инициализация
        setupSimpleGuestMode();
    }
}

// Простая альтернативная реализация на случай проблем
function setupSimpleGuestMode() {
    console.log('🔄 Запуск упрощенного гостевого режима');
    
    const orders = new Map();
    
    // Загрузка из localStorage
    try {
        const savedOrders = JSON.parse(localStorage.getItem('guest_orders') || '[]');
        savedOrders.forEach(order => {
            orders.set(order.id, order);
        });
    } catch (error) {
        console.error('Ошибка загрузки заказов:', error);
    }
    
    // Показ заказов
    updateDisplay();
    
    function updateDisplay() {
        const ordersBlock = document.getElementById('ordersBlock');
        const noOrdersBlock = document.getElementById('noOrdersBlock');
        const loadingBlock = document.getElementById('loadingBlock');

        if (loadingBlock) loadingBlock.style.display = 'none';

        if (orders.size === 0) {
            if (noOrdersBlock) noOrdersBlock.style.display = 'block';
            if (ordersBlock) ordersBlock.style.display = 'none';
        } else {
            if (noOrdersBlock) noOrdersBlock.style.display = 'none';
            if (ordersBlock) {
                ordersBlock.style.display = 'block';
                ordersBlock.innerHTML = '';
                
                orders.forEach(order => {
                    createOrderElement(order);
                });
            }
        }
    }
    
    function createOrderElement(order) {
        const ordersBlock = document.getElementById('ordersBlock');
        if (!ordersBlock) return;

        const orderElement = document.createElement('div');
        orderElement.className = 'section-two__box guest-order';
        orderElement.innerHTML = `
            <div class="section-two__box_Child-1">
                <nav class="section-two__box_Child-1__nav">
                    <div class="section-two__box_Child-1__nav_section">
                        <p class="section-two__box_Child-1__nav_section_par-1">Зашёл в</p>
                        <p class="section-two__box_Child-1__nav_section_par-2">${order.start_time || '--:--'}</p>
                    </div>
                    <div class="section-two__box_Child-1__nav_section">
                        <p class="section-two__box_Child-1__nav_section_par-1">Посещение</p>
                        <p class="section-two__box_Child-1__nav_section_par-2">${order.duration || ''}</p>
                    </div>
                </nav>
                <div class="section-two__box_Child-1_line"></div>

                <div class="section-two__box_Child-1__info">
                    <div class="section-two__box_Child-1__info_container-sag">
                        <h3 class="section-two__box_Child-1__info_container-sag_name">${order.child_name || 'Не указано'}</h3>
                    </div>
                </div>
            </div>
        `;

        ordersBlock.appendChild(orderElement);
    }
}

// Экспорт для глобального доступа
window.initGuestMode = initGuestMode;

// Временно отключим FallbackManager
// new FallbackManager();