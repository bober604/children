// Проверяем, не объявлен ли уже класс
if (typeof GuestMode === 'undefined') {

    class GuestMode {
        constructor() {
            this.orders = new Map();
            this.channel = null;
            this.isConnected = false;
            this.init();
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
                    this.completeOrder(message.order_id);
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
                    // ТОЛЬКО обновляем визуальное состояние паузы
                    if (!message.order_id || message.is_paused === undefined) return;
                    this.updatePauseState(message.order_id, message.is_paused);
                    break;
                    
                default:
                    console.warn('⚠️ Неизвестный тип сообщения:', message.type);
            }
        }

        // Добавляем простой метод для обновления состояния паузы
        updatePauseState(orderId, isPaused) {
            if (this.orders.has(orderId)) {
                const order = this.orders.get(orderId);
                order.is_paused = isPaused;
                this.orders.set(orderId, order);
                
                // Обновляем только визуальное отображение
                this.updateOrderElement(order);
            }
        }

        addOrder(orderData) {
            console.log('Добавление нового заказа:', orderData);
            
            // Создаем объект заказа
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
                created_at: Date.now()
            };

            this.orders.set(order.id, order);
            this.saveToStorage();
            this.updateDisplay();
            this.createOrderElement(order);
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
                this.orders.set(orderId, order);
                this.saveToStorage();
                this.updateOrderElement(order);
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
            console.log('Синхронизация всех заказов:', ordersArray.length);
            this.orders.clear();
            ordersArray.forEach(order => {
                this.orders.set(order.id, order);
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

            ordersBlock.appendChild(orderElement);
            this.startTimer(orderElement, order.remaining_seconds);
        }

        getOrderHTML(order) {
            const displayTime = this.formatDisplayTime(order.time); // Исправлено: используем order.time вместо order.start_time
            const durationText = this.getDurationText(order.duration);
            const remainingTime = this.formatTimeFromSeconds(order.remaining_seconds);
            
            // Определяем классы для разных состояний
            const statusClass = order.is_completed ? 'status-completed' : 'status-active';
            const statusText = order.is_completed ? 'завершено' : 'активно';
            const timerClass = order.is_paused ? 'timer-paused' : '';

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
                            <span class="order-status ${statusClass}">${statusText}</span>
                            ${order.is_paused ? '<span class="order-status status-paused">на паузе</span>' : ''}
                        </div>
                    </nav>
                    <div class="section-two__box_Child-1_line"></div>

                    <div class="section-two__box_Child-1__info">
                        <div class="section-two__box_Child-1__info_container-sag">
                            <h3 class="section-two__box_Child-1__info_container-sag_name">${this.escapeHtml(order.child_names)}</h3>
                        </div>
                        <h3 class="section-two__box_Child-1__info_sag">Осталось:</h3>
                        <h3 class="section-two__box_Child-1__info_time ${timerClass}">${remainingTime}</h3>
                    </div>
                </div>
            `;
        }

        startTimer(orderElement, initialSeconds) {
            const countdownElement = orderElement.querySelector(".section-two__box_Child-1__info_time");
            if (!countdownElement || initialSeconds <= 0) return;

            let remainingSeconds = initialSeconds;
            const timerId = setInterval(() => {
                if (remainingSeconds <= 0) {
                    clearInterval(timerId);
                    countdownElement.textContent = "00:00:00";
                    this.updateOrderStatus(orderElement.dataset.orderId, 'completed');
                    return;
                }

                remainingSeconds--;
                countdownElement.textContent = this.formatTimeFromSeconds(remainingSeconds);
                
                // Обновляем оставшееся время в данных
                if (this.orders.has(orderElement.dataset.orderId)) {
                    const order = this.orders.get(orderElement.dataset.orderId);
                    order.remaining_seconds = remainingSeconds;
                    this.orders.set(orderElement.dataset.orderId, order);
                }
            }, 1000);

            orderElement.dataset.timerId = timerId;
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
                orderElement.outerHTML = this.getOrderHTML(order);
                if (order.status === 'active' && order.remaining_seconds > 0) {
                    this.startTimer(orderElement, order.remaining_seconds);
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
                    
                    this.orders.forEach(order => {
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