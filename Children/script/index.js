document.addEventListener("DOMContentLoaded", function() {
    // Функция для отправки запросов на сервер
    function sendRequest(url, method, data) {
        console.log('Отправляемые данные:', data); // Проверьте здесь формат
        
        return fetch(url, {
            method: method,
            headers: { 
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(data) // Просто преобразуем в JSON, не меняя ключи
        })
        .then(res => res.json())
        .then(data => console.log(data))
        .catch(error => console.error('Ошибка:', error));
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

    // Находим все ваши поля ввода
    var inputs = document.querySelectorAll(".section-one__container_1, .section-one__container_4, .section-one__container__parent_2.section-one__container_3");

    inputs.forEach(function(input, index) {
        input.addEventListener("keydown", function(event) {
            // Проверяем, нажата ли клавиша Enter
            if (event.key === "Enter") {
                event.preventDefault(); // Отменяем стандартное поведение
                // Если есть следующее поле, перемещаем фокус на него
                if (index < inputs.length - 1) {
                    inputs[index + 1].focus();
                } else {
                    // Если это последнее поле, можно переместить фокус обратно на первое
                    inputs[0].focus();
                }
            }
        });
    });


    // Находим все кнопки по классу
    const buttons = document.querySelectorAll('.section-one__box__button-1, .section-one__box__button-2');

    // Добавляем обработчик события для клика
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            // Добавляем или удаляем класс .scaled
            button.classList.toggle('scaled');
        });
    });


    // Функция для преобразования первой буквы строки в заглавную
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // Инициализируем переменную для подсчета количества заказов
    var orderCount = 0;

    // Инициализируем переменную для подсчета общей суммы выручки
    var totalRevenue = 0;

    // Глобальные переменные для управления таймерами
    let activeTimers = new Map(); // Хранилище активных таймеров

    // Функция для остановки таймера
    function stopTimer(orderId) {
        if (activeTimers.has(orderId)) {
            clearInterval(activeTimers.get(orderId));
            activeTimers.delete(orderId);
        }
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

    // Находим кнопку "Добавить"
    var addButton = document.querySelector(".section-one__button");

    // Добавляем обработчик события нажатия на кнопку
    addButton.addEventListener("click", function() {
            
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

        sendRequest("http://127.0.0.1:8000/order", "POST", {
            sum: currentOrderTotal,
            date: dateStr,
            time: timeStr
        });

        // После успешного создания заказа
        orderContainer.dataset.creationDate = dateStr;
        orderContainer.dataset.creationTime = timeStr;


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

        // Следующий код для мобильной интерактивности

        // Делегирование событий для всех бургеров и связанных блоков
        document.addEventListener('click', (event) => {
            // Обработка для .section-two__box_Child-1__info_burger
            if (event.target.closest('.section-two__box_Child-1__info_burger')) {
                const burger = event.target.closest('.section-two__box_Child-1__info_burger');

                // Переключаем класс active для бургера
                burger.classList.toggle('section-two__box_Child-1__info_burger-active');

                // Находим родительский контейнер
                const parentContainer = burger.closest('.section-two__box');

                if (parentContainer) {
                    // Находим связанные блоки
                    const children = parentContainer.querySelectorAll('.section-two__box_Child-2, .section-two__box_Child-3, .section-two__box_Child-4');

                    children.forEach((child, index) => {
                        // Переключаем класс active
                        child.classList.toggle('active');

                        // Устанавливаем margin-top для активных элементов
                        if (child.classList.contains('active')) {
                            child.style.marginTop = `${60 + 50 * index}px`; // Расчёт margin-top
                        } else {
                            child.style.marginTop = '0'; // Возврат в исходное положение
                        }
                    });
                }
            }

            // Обработка для .section-two__box_Child-2.active
            if (event.target.closest(".section-two__box_Child-2.active")) {
                const child = event.target.closest(".section-two__box_Child-2.active");
                const parentContainer = child.closest(".section-two__box");

                if (parentContainer) {
                    const burger = parentContainer.querySelector(".section-two__box_Child-1__info_burger");
                    const children = parentContainer.querySelectorAll(
                        ".section-two__box_Child-2, .section-two__box_Child-3, .section-two__box_Child-4"
                    );

                    // Убираем класс active у всех связанных блоков
                    children.forEach((child) => {
                        child.classList.remove("active");
                        child.style.marginTop = "0";
                    });

                    // Снимаем active у бургера
                    if (burger) burger.classList.remove("section-two__box_Child-1__info_burger-active");
                }
            }

            // Обработка для .section-two__box_Child-4.active
            if (event.target.closest(".section-two__box_Child-4.active")) {
                const child = event.target.closest(".section-two__box_Child-4.active");
                const parentContainer = child.closest(".section-two__box");

                if (parentContainer) {
                    const burger = parentContainer.querySelector(".section-two__box_Child-1__info_burger");
                    const children = parentContainer.querySelectorAll(
                        ".section-two__box_Child-2, .section-two__box_Child-3, .section-two__box_Child-4"
                    );

                    // Убираем класс active у всех связанных блоков
                    children.forEach((child) => {
                        child.classList.remove("active");
                        child.style.marginTop = "0";
                    });

                    // Снимаем active у бургера
                    if (burger) burger.classList.remove("section-two__box_Child-1__info_burger-active");
                }
            }

            // Обработка для .in-section-two__box_Child-1__info_burger
            if (event.target.closest(".in-section-two__box_Child-1__info_burger")) {
                const burger = event.target.closest(".in-section-two__box_Child-1__info_burger");
                const parentContainer = burger.closest(".in-section-two__box");

                if (parentContainer) {
                    const children = parentContainer.querySelectorAll(
                        ".in-section-two__box_Child-2, .in-section-two__box_Child-3, .in-section-two__box_Child-4"
                    );

                    children.forEach((child, index) => {
                        // Переключаем класс active
                        child.classList.toggle("active");

                        // Устанавливаем margin-top для активных элементов
                        if (child.classList.contains("active")) {
                            child.style.marginTop = `${60 + 50 * index}px`; // Расчёт margin-top
                        } else {
                            child.style.marginTop = "0"; // Возврат в исходное положение
                        }
                    });

                    // Переключаем класс active для бургера
                    burger.classList.toggle("in-section-two__box_Child-1__info_burger-active");
                }
            }

            // Обработка для .in-section-two__box_Child-2.active
            if (event.target.closest(".in-section-two__box_Child-2.active")) {
                const child = event.target.closest(".in-section-two__box_Child-2.active");
                const parentContainer = child.closest(".in-section-two__box");

                if (parentContainer) {
                    const burger = parentContainer.querySelector(".in-section-two__box_Child-1__info_burger");
                    const children = parentContainer.querySelectorAll(
                        ".in-section-two__box_Child-2, .in-section-two__box_Child-3, .in-section-two__box_Child-4"
                    );

                    // Убираем класс active у всех связанных блоков
                    children.forEach((child) => {
                        child.classList.remove("active");
                        child.style.marginTop = "0";
                    });

                    // Снимаем active у бургера
                    if (burger) burger.classList.remove("in-section-two__box_Child-1__info_burger-active");
                }
            }

            // Обработка для .in-section-two__box_Child-4.active
            if (event.target.closest(".in-section-two__box_Child-4.active")) {
                const child = event.target.closest(".in-section-two__box_Child-4.active");
                const parentContainer = child.closest(".in-section-two__box");

                if (parentContainer) {
                    const burger = parentContainer.querySelector(".in-section-two__box_Child-1__info_burger");
                    const children = parentContainer.querySelectorAll(
                        ".in-section-two__box_Child-2, .in-section-two__box_Child-3, .in-section-two__box_Child-4"
                    );

                    // Убираем класс active у всех связанных блоков
                    children.forEach((child) => {
                        child.classList.remove("active");
                        child.style.marginTop = "0";
                    });

                    // Снимаем active у бургера
                    if (burger) burger.classList.remove("in-section-two__box_Child-1__info_burger-active");
                }
            }
        });

        // Код для мобильной интерактивности окончен

        // Всё связанное с блоком редактирования заказа
        document.addEventListener("click", function (event) {
            const editOrderButton = event.target.closest(".section-two__box_Child-4");
    
            if (editOrderButton) {
                // Удаляем предыдучный блок, если он существует
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
                                <div class="section-one__orderChange__box__buttons_block-1 section-one__orderChange__box__buttons_block-mobile">
                                    <h2 class="section-one__orderChange__box__buttons_block-1_sag">15 мин.</h2>
                                    <div class="${durationValue === '15 мин.' ? 'section-one__orderChange__box__buttons_block-1_active' : 'section-one__orderChange__box__buttons_block-1_inactive'}"></div>
                                </div>

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

                    // Получаем новое время и рассчитываем цену
                    const timeText = selectedButtons[0].previousElementSibling.textContent.trim();
                    const newPrice = calculatePriceFromDuration(timeText);
                    const newName = document.getElementById("order-1").value;
                    const newPhone = document.getElementById("order-2").value;
                    const newNote = document.getElementById("order-3").value;

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
                    revenueElement.textContent = totalRevenue.toFixed(0);

                    // Затем используйте их
                    sendRequest("http://127.0.0.1:8000/order/update", "POST", {
                        old_sum: oldPrice,
                        date: orderContainer.dataset.creationDate,
                        time: orderContainer.dataset.creationTime,
                        new_sum: newPrice
                    });

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

                    console.log("Original duration:", originalDurationSeconds, "seconds");
                    console.log("Remaining time:", remainingSeconds, "seconds");
                    console.log("Elapsed time:", elapsedSeconds, "seconds");
                    console.log("New total time:", newTotalSeconds, "seconds");
                    console.log("Initial time for new timer:", initialSeconds, "seconds");

                    startCountdown(fakeButtons, parentOrder, initialSeconds);

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

        // Добавляем интерактивность для изменения стилей
        var changeStyleButton = orderContainer.querySelector(".section-two__box_Child-2");
        changeStyleButton.addEventListener("click", function() {
            // Получаем блок, который нужно изменить
            var targetBlock = orderContainer.closest(".section-two__box");
            
            // Проверяем, есть ли классы для изменённых стилей
            if (targetBlock.classList.contains("in-section-two__box")) {
                // Если есть, убираем новые стили
                targetBlock.classList.remove("in-section-two__box");
                targetBlock.querySelector(".section-two__box_Child-1").classList.remove("in-section-two__box_Child-1");
                targetBlock.querySelector(".section-two__box_Child-1_line").classList.remove("in-section-two__box_Child-1_line");
                targetBlock.querySelector(".section-two__box_Child-1__info_line-1").classList.remove("in-section-two__box_Child-1__info_line-1");
                targetBlock.querySelector(".section-two__box_Child-1__info_container-sag_name").classList.remove("in-section-two__box_Child-1__info_container-sag_name");
                targetBlock.querySelector(".section-two__box_Child-1__info_end_1").classList.remove("in-section-two__box_Child-1__info_end_1");
                targetBlock.querySelector(".section-two__box_Child-1__info_end_1_par-1").classList.remove("in-section-two__box_Child-1__info_end_1_par-1");
                targetBlock.querySelector(".section-two__box_Child-1__info_end_2").classList.remove("in-section-two__box_Child-1__info_end_1");
                targetBlock.querySelector(".section-two__box_Child-1__info_end_line").classList.remove("in-section-two__box_Child-1__info_end_line");
                
                targetBlock.querySelector(".section-two__box_Child-2").classList.remove("in-section-two__box_Child-2");
                targetBlock.querySelector(".section-two__box_Child-2_sag").classList.remove("in-section-two__box_Child-2_sag");

                targetBlock.querySelector(".section-two__box_Child-3").classList.remove("in-section-two__box_Child-3");
                targetBlock.querySelector(".section-two__box_Child-3_sag").classList.remove("in-section-two__box_Child-3_sag");
                
                targetBlock.querySelector(".section-two__box_Child-4").classList.remove("in-section-two__box_Child-4");
                targetBlock.querySelector(".section-two__box_Child-4_sag").classList.remove("in-section-two__box_Child-4_sag");
            } else {
                // Если классов нет, добавляем новые стили
                targetBlock.classList.add("in-section-two__box");
                targetBlock.querySelector(".section-two__box_Child-1").classList.add("in-section-two__box_Child-1");
                targetBlock.querySelector(".section-two__box_Child-1_line").classList.add("in-section-two__box_Child-1_line");
                targetBlock.querySelector(".section-two__box_Child-1__info_line-1").classList.add("in-section-two__box_Child-1__info_line-1");
                targetBlock.querySelector(".section-two__box_Child-1__info_container-sag_name").classList.add("in-section-two__box_Child-1__info_container-sag_name");
                    
                targetBlock.querySelector(".section-two__box_Child-2").classList.add("in-section-two__box_Child-2");
                targetBlock.querySelector(".section-two__box_Child-2_sag").classList.add("in-section-two__box_Child-2_sag");

                targetBlock.querySelector(".section-two__box_Child-3").classList.add("in-section-two__box_Child-3");
                targetBlock.querySelector(".section-two__box_Child-3_sag").classList.add("in-section-two__box_Child-3_sag");
                    
                targetBlock.querySelector(".section-two__box_Child-4").classList.add("in-section-two__box_Child-4");
                targetBlock.querySelector(".section-two__box_Child-4_sag").classList.add("in-section-two__box_Child-4_sag");
            }
        });
            

        // Добавляем интерактивность для удаления блока
        addDeleteFunctionality(orderContainer, currentOrderTotal);
    });
        

    function addDeleteFunctionality(orderContainer, currentOrderTotal) {
        var deleteButton = orderContainer.querySelector(".section-two__box_Child-3");

        deleteButton.addEventListener("click", function() {
            var confirmation = confirm("Хотите удалить заказ?");
            
            if (confirmation) {
                var secondConfirmation = confirm("Вы точно уверены?");
                
                if (secondConfirmation) {
                    // Останавливаем таймер
                    const timerId = orderContainer.dataset.timerId;
                    if (timerId) {
                        stopTimer(timerId);
                    }

                    var orderTotal = currentOrderTotal;
                    
                    // Используем сохраненные дату и время создания заказа
                    const creationDate = orderContainer.dataset.creationDate;
                    const creationTime = orderContainer.dataset.creationTime;

                    console.log('Данные для удаления:', {
                        sum: orderTotal,
                        date: creationDate,
                        time: creationTime
                    });

                    // Отправляем данные об удалении заказа на сервер
                    sendRequest("http://127.0.0.1:8000/order", "DELETE", {
                        sum: orderTotal,
                        date: creationDate,
                        time: creationTime
                    }).then(result => {
                        if (result !== null) { // ← Измените проверку
                            // Успешно удалено, удаляем элемент из DOM
                            orderContainer.remove();
                            
                            // Уменьшаем количество заказов
                            orderCount--;
                            
                            // Обновляем элемент с количеством заказов
                            var orderCountElement = document.querySelector(".section-two__nav_block-1 .section-two__nav_block_sag-2");
                            if (orderCountElement) {
                                orderCountElement.textContent = orderCount;
                            }
                            
                            // Уменьшаем общую выручку на сумму удалённого заказа
                            totalRevenue -= orderTotal;
                            
                            // Обновляем элемент с общей выручкой
                            var revenueElement = document.querySelector(".section-two__nav_block-3 .revenue");
                            if (revenueElement) {
                                revenueElement.textContent = totalRevenue.toFixed(0);
                            }
                        } else {
                            console.log('Ошибка при удалении заказа');
                        }
                    });
                }
            }
        });
    }
    

    // Добавляем обработчик события клика по кнопкам выбора времени
    var timeButtons = document.querySelectorAll(".section-one__box__button-1, .section-one__box__button-2");
    timeButtons.forEach(function(button) {
        button.addEventListener("click", function() {
            button.classList.toggle("selected");
        });
    });

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

    // Функция для форматирования времени (добавление нуля при необходимости)
    function formatTime(time) {
        return time < 10 ? "0" + time : time;
    }

    function startCountdown(selectedButtons, orderContainer, initialSeconds = null) {
        // Используем существующий timerId или создаем новый
        let orderId = orderContainer.dataset.timerId;
        if (!orderId) {
            orderId = Date.now().toString();
            orderContainer.dataset.timerId = orderId;
        }
        
        // Останавливаем предыдущий таймер
        stopTimer(orderId);

        const countdownElement = orderContainer.querySelector(".section-two__box_Child-1__info_time");
        const pauseButton = orderContainer.querySelector(".section-two__box_Child-1__info_img");
        
        // Вычисляем общее время и вычитаем уже прошедшее
        const totalSeconds = getTotalDurationInSeconds(selectedButtons);
        let remainingSeconds = initialSeconds !== null ? initialSeconds : totalSeconds;
        
        let isPaused = false;
        let interval = null;

        function updateCountdown() {
            if (remainingSeconds <= 0) {
                stopTimer(orderId);
                if (countdownElement) countdownElement.textContent = "00:00:00";
                return;
            }

            if (!isPaused) {
                remainingSeconds--;
                
                const hours = Math.floor(remainingSeconds / 3600);
                const minutes = Math.floor((remainingSeconds % 3600) / 60);
                const seconds = remainingSeconds % 60;

                if (countdownElement) {
                    countdownElement.textContent = formatTime(hours) + ":" + formatTime(minutes) + ":" + formatTime(seconds);
                }
            }
        }

        // Инициализируем отображение
        const hours = Math.floor(remainingSeconds / 3600);
        const minutes = Math.floor((remainingSeconds % 3600) / 60);
        const seconds = remainingSeconds % 60;
        countdownElement.textContent = formatTime(hours) + ":" + formatTime(minutes) + ":" + formatTime(seconds);

        // Запускаем таймер
        interval = setInterval(updateCountdown, 1000);
        activeTimers.set(orderId, interval);

        // Обработчик паузы
        if (pauseButton) {
            // Удаляем старые обработчики
            const newPauseButton = pauseButton.cloneNode(true);
            pauseButton.parentNode.replaceChild(newPauseButton, pauseButton);
            
            newPauseButton.addEventListener("click", function() {
                isPaused = !isPaused;
                this.classList.toggle("section-two__box_Child-1__info_img-active");
                
                if (isPaused) {
                    clearInterval(interval);
                    activeTimers.delete(orderId);
                } else {
                    interval = setInterval(updateCountdown, 1000);
                    activeTimers.set(orderId, interval);
                }
            });
        }
    }

    //Дальнейший код только для мобильной версии

    // Находим кнопку .section-two__nav_button-1
    const creatureButton = document.querySelector(".section-two__nav_button-1");

    // Добавляем обработчик клика для кнопки создания заказа
    creatureButton.addEventListener("click", function () {
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
});