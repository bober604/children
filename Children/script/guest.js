// Глобальные переменные
let activeOrders = [];
let socket = null;

// Функция для подключения к WebSocket серверу
function connectWebSocket() {
    // Замените на ваш WebSocket сервер
    socket = new WebSocket('ws://localhost:8000/ws/guest');
    
    socket.onopen = function() {
        console.log('WebSocket подключен');
        // Запрашиваем текущие активные заказы
        socket.send(JSON.stringify({type: 'get_active_orders'}));
    };
    
    socket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        
        if (data.type === 'active_orders') {
            activeOrders = data.orders;
            updateOrdersDisplay();
        } else if (data.type === 'order_update') {
            // Обновляем конкретный заказ
            updateOrder(data.order);
        } else if (data.type === 'order_completed') {
            // Удаляем завершенный заказ
            removeOrder(data.order_id);
        }
    };
    
    socket.onclose = function() {
        console.log('WebSocket отключен, переподключаемся...');
        setTimeout(connectWebSocket, 3000);
    };
    
    socket.onerror = function(error) {
        console.error('WebSocket ошибка:', error);
    };
}

// Функция для обновления отображения заказов
function updateOrdersDisplay() {
    const ordersBlock = document.getElementById('ordersBlock');
    const activeOrdersCount = document.getElementById('activeOrdersCount');
    
    // Обновляем счетчик
    activeOrdersCount.textContent = activeOrders.length;
    
    // Очищаем блок с заказами
    ordersBlock.innerHTML = '';
    
    // Добавляем каждый активный заказ
    activeOrders.forEach(order => {
        const orderElement = createGuestOrderElement(order);
        ordersBlock.appendChild(orderElement);
    });
}

// Функция для создания элемента заказа в гостевом режиме
function createGuestOrderElement(order) {
    const orderContainer = document.createElement("div");
    orderContainer.classList.add("section-two__box", "guest-order");
    orderContainer.dataset.orderId = order.id;
    
    const displayTime = formatDisplayTime(order.start_time);
    const durationText = getDurationText(order.duration_seconds);
    const remainingTime = formatTimeFromSeconds(order.remaining_seconds);
    
    orderContainer.innerHTML = `
        <div class="section-two__box_Child-1">
            <nav class="section-two__box_Child-1__nav">
                <div class="section-two__box_Child-1__nav_section">
                    <p class="section-two__box_Child-1__nav_section_par-1">Зашёл в</p>
                    <p class="section-two__box_Child-1__nav_section_par-2">${displayTime}</p>
                </div>
                <div class="section-two__box_Child-1__nav_section">
                    <p class="section-two__box_Child-1__nav_section_par-1">Посещение</p>
                    <p class="section-two__box_Child-1__nav_section_par-2">${durationText}</p>
                </div>
            </nav>
            <div class="section-two__box_Child-1_line"></div>

            <div class="section-two__box_Child-1__info">
                <div class="section-two__box_Child-1__info_container-sag">
                    <h3 class="section-two__box_Child-1__info_container-sag_name">${order.child_name}</h3>
                </div>
                <h3 class="section-two__box_Child-1__info_sag">Осталось:</h3>
                <h3 class="section-two__box_Child-1__info_time">${remainingTime}</h3>
            </div>
        </div>
    `;
    
    // Запускаем таймер для этого заказа
    startGuestTimer(orderContainer, order.remaining_seconds);
    
    return orderContainer;
}

// Функция для запуска таймера в гостевом режиме
function startGuestTimer(orderContainer, initialSeconds) {
    const countdownElement = orderContainer.querySelector(".section-two__box_Child-1__info_time");
    let remainingSeconds = initialSeconds;
    
    const timerId = setInterval(() => {
        if (remainingSeconds <= 0) {
            clearInterval(timerId);
            countdownElement.textContent = "00:00:00";
            // Можно добавить визуальное обозначение завершенного таймера
            countdownElement.style.color = "var(--gray)";
            return;
        }
        
        remainingSeconds--;
        countdownElement.textContent = formatTimeFromSeconds(remainingSeconds);
    }, 1000);
    
    // Сохраняем ID таймера для возможной остановки
    orderContainer.dataset.timerId = timerId;
}

// Функция для обновления отдельного заказа
function updateOrder(updatedOrder) {
    const orderElement = document.querySelector(`[data-order-id="${updatedOrder.id}"]`);
    
    if (orderElement) {
        // Останавливаем старый таймер
        if (orderElement.dataset.timerId) {
            clearInterval(parseInt(orderElement.dataset.timerId));
        }
        
        // Обновляем содержимое
        const displayTime = formatDisplayTime(updatedOrder.start_time);
        const durationText = getDurationText(updatedOrder.duration_seconds);
        
        orderElement.querySelector(".section-two__box_Child-1__nav_section_par-2").textContent = displayTime;
        orderElement.querySelector(".section-two__box_Child-1__nav_section_par-2:nth-child(2)").textContent = durationText;
        orderElement.querySelector(".section-two__box_Child-1__info_container-sag_name").textContent = updatedOrder.child_name;
        
        // Перезапускаем таймер
        startGuestTimer(orderElement, updatedOrder.remaining_seconds);
    } else {
        // Если заказ новый, добавляем его
        activeOrders.push(updatedOrder);
        updateOrdersDisplay();
    }
}

// Функция для удаления заказа
function removeOrder(orderId) {
    activeOrders = activeOrders.filter(order => order.id !== orderId);
    updateOrdersDisplay();
}

// Вспомогательные функции
function formatTimeFromSeconds(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${formatTime(hours)}:${formatTime(minutes)}:${formatTime(seconds)}`;
}

function formatTime(time) {
    return time < 10 ? "0" + time : time;
}

function getDurationText(seconds) {
    if (seconds >= 7200) return "2 часа";
    if (seconds >= 3600) return "1 час";
    if (seconds >= 1800) return "30 мин.";
    return "15 мин.";
}

function formatDisplayTime(timeString) {
    if (!timeString) return '';
    return timeString.replace(/\./g, ':').substring(0, 5);
}

// Инициализация при загрузке страницы
document.addEventListener("DOMContentLoaded", function() {
    // Обработка соглашения
    const agreeCheckbox = document.getElementById('agreeCheckbox');
    const agreeButton = document.getElementById('agreeButton');
    const agreementBlock = document.getElementById('agreementBlock');
    const ordersBlock = document.getElementById('ordersBlock');
    
    agreeCheckbox.addEventListener('change', function() {
        agreeButton.disabled = !this.checked;
    });
    
    agreeButton.addEventListener('click', function() {
        // Скрываем блок с соглашением и показываем заказы
        agreementBlock.style.display = 'none';
        ordersBlock.style.display = 'block';
        
        // Подключаемся к WebSocket
        connectWebSocket();
    });
    
    // Для демонстрации - если WebSocket недоступен, можно использовать polling
    setInterval(fetchActiveOrders, 5000); // Опрос каждые 5 секунд
});

// Функция для получения активных заказов через HTTP (fallback)
function fetchActiveOrders() {
    if (socket && socket.readyState === WebSocket.OPEN) return;
    
    fetch('http://localhost:8000/api/active-orders')
        .then(response => response.json())
        .then(orders => {
            activeOrders = orders;
            updateOrdersDisplay();
        })
        .catch(error => {
            console.error('Ошибка получения заказов:', error);
        });
}