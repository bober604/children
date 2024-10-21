document.addEventListener("DOMContentLoaded", function() {
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


    // Функция для преобразования первой буквы строки в заглавную
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // Инициализируем переменную для подсчета количества заказов
    var orderCount = 0;

    // Инициализируем переменную для подсчета общей суммы выручки
    var totalRevenue = 0;

    // Находим кнопку "Добавить"
    var addButton = document.querySelector(".section-one__button");

        // Добавляем обработчик события нажатия на кнопку
        addButton.addEventListener("click", function() {
            // Увеличиваем счетчик заказов на 1
            orderCount++;
    
            // Находим элемент с количеством заказов и обновляем его значение
            var orderCountElement = document.querySelector(".section-two__nav_block_sag-2");
            orderCountElement.textContent = orderCount;
    
            // Находим выбранные кнопки с ценами
            var selectedButtons = document.querySelectorAll(".section-one__box__button-1.selected, .section-one__box__button-2.selected");
    
            // Проверяем, выбраны ли кнопки
            if (selectedButtons.length === 0) {
                alert("Пожалуйста, укажите время посещения.");
                return;
            }
    
            // Переменная для суммы текущего заказа
            var currentOrderTotal = 0;
    
            // Добавляем информацию о сумме заказа
            selectedButtons.forEach(function(button) {
                var priceText = button.querySelector(".section-one__box__button-1_sag-3").textContent;
    
                // Преобразуем текст цены в число
                var price = parseFloat(priceText.replace("руб.", "").trim());
                currentOrderTotal += price;
    
                // Удаляем класс selected после добавления заказа
                button.classList.remove("selected");
            });
    
            // Добавляем текущую сумму к общей выручке
            totalRevenue += currentOrderTotal;
    
            // Находим элемент с отображением выручки и обновляем его значение
            var revenueElement = document.querySelector(".revenue");
            revenueElement.textContent = totalRevenue.toFixed(0); // Округляем до целых

            // Расчет среднего чека
            var averageCheck = (orderCount > 0) ? (totalRevenue / orderCount).toFixed(0) : 0;

            // Находим элемент для отображения среднего чека и обновляем его значение
            var averageCheckElement = document.querySelector(".section-two__nav_block-2 .section-two__nav_block_sag-2");
            averageCheckElement.textContent = averageCheck;

    
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
            selectedButtons.forEach(function(button) {
                var price = button.querySelector(".section-one__box__button-1_sag-3").textContent;
                orderHTML += `<p class="section-two__box_Child-1__nav_section_par-2">${price}</p>`;
            });
    
            orderHTML += `
                        </div>
                        <div class="section-two__box_Child-1__nav_section">
                            <p class="section-two__box_Child-1__nav_section_par-1">Зашёл в</p>
                            <p class="section-two__box_Child-1__nav_section_par-2">${getCurrentTime()}</p>
                        </div>
                        <div class="section-two__box_Child-1__nav_section">
                            <p class="section-two__box_Child-1__nav_section_par-1">Посещение</p>
                            <p class="section-two__box_Child-1__nav_section_par-2">${getDuration(selectedButtons)}</p>
                        </div>
                    </nav>
                    <div class="section-two__box_Child-1_line"><!-- Линия --></div>
    
                    <div class="section-two__box_Child-1__info">
                        <div class="section-two__box_Child-1__info_parents">
                            <h5 class="section-two__box_Child-1__info_parents_number">${capitalizeFirstLetter(document.querySelector('.section-one__container_4').value)}</h5>
                            <p class="section-two__box_Child-1__info_parents_par">${document.querySelector('.section-one__container_3').value}</p>
                        </div>
                        <div class="section-two__box_Child-1__info_line-1"><!-- Линия --></div>
                        <h3 class="section-two__box_Child-1__info_name">${capitalizeFirstLetter(document.querySelector('.section-one__container_1').value)}</h3>
                        <h3 class="section-two__box_Child-1__info_sag">Осталось:</h3>
                        <h3 class="section-two__box_Child-1__info_time" id="countdown">${calculateCountdownTime(selectedButtons)}</h3>
                        <div class="section-two__box_Child-1__info_img"><!-- Пауза/продолжение --></div>
                        <div class="section-two__box_Child-1__info_counter">
                            <h5 class="section-two__box_Child-1__info_counter_item">0</h5>
                            <h5 class="section-two__box_Child-1__info_counter_item">0</h5>
                        </div>
                        <div class="section-two__box_Child-1__info_line-2"><!-- Линия --></div>
                        <div class="section-two__box_Child-1__info_end">
                            <div class="section-two__box_Child-1__info_end_1">
                                <h4 class="section-two__box_Child-1__info_end_1_sag">+ 5 минут</h4>
                                <p class="section-two__box_Child-1__info_end_1_par-1">Бонус</p>
                            </div>
                            <div class="section-two__box_Child-1__info_end_line"><!-- Линия --></div>
                            <div class="section-two__box_Child-1__info_end_1 section-two__box_Child-1__info_end_2">
                                <h4 class="section-two__box_Child-1__info_end_1_sag">- 5 минут</h4>
                                <p class="section-two__box_Child-1__info_end_1_par-2">Штраф</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="section-two__box_Child-2">
                    <h5 class="section-two__box_Child-2_sag">Ребенок ушёл</h5>
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
    
            // Запускаем обратный отсчет
            startCountdown(selectedButtons, orderContainer);


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
                    targetBlock.querySelector(".section-two__box_Child-1__info_name").classList.remove("in-section-two__box_Child-1__info_name");
                    targetBlock.querySelector(".section-two__box_Child-1__info_line-2").classList.remove("in-section-two__box_Child-1__info_line-2");
                    targetBlock.querySelector(".section-two__box_Child-1__info_end_1").classList.remove("in-section-two__box_Child-1__info_end_1");
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
                    targetBlock.querySelector(".section-two__box_Child-1__info_name").classList.add("in-section-two__box_Child-1__info_name");
                    targetBlock.querySelector(".section-two__box_Child-1__info_line-2").classList.add("in-section-two__box_Child-1__info_line-2");
                    targetBlock.querySelector(".section-two__box_Child-1__info_end_1").classList.add("in-section-two__box_Child-1__info_end_1");
                    targetBlock.querySelector(".section-two__box_Child-1__info_end_2").classList.add("in-section-two__box_Child-1__info_end_1");
                    targetBlock.querySelector(".section-two__box_Child-1__info_end_line").classList.add("in-section-two__box_Child-1__info_end_line");
                    
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
                // Первое всплывающее окно подтверждения
                var confirmation = confirm("Хотите удалить заказ?");
                
                // Если пользователь подтвердил первое уведомление
                if (confirmation) {
                    // Второе всплывающее окно подтверждения
                    var secondConfirmation = confirm("Вы точно уверены?");
                    
                    // Если пользователь подтвердил и второе уведомление
                    if (secondConfirmation) {
                        // Получаем сумму текущего заказа, которую нужно вычесть
                        var orderTotal = currentOrderTotal; // Используем сохранённое значение

                        orderContainer.remove(); // Удаляем блок

                        // Уменьшаем количество заказов
                        orderCount--;

                        // Обновляем элемент с количеством заказов
                        var orderCountElement = document.querySelector(".section-two__nav_block-1 .section-two__nav_block_sag-2");
                        orderCountElement.textContent = orderCount;

                        // Уменьшаем общую выручку на сумму удалённого заказа
                        totalRevenue -= orderTotal;

                        // Обновляем элемент с общей выручкой
                        var revenueElement = document.querySelector(".section-two__nav_block-3 .revenue");
                        revenueElement.textContent = totalRevenue.toFixed(0);

                        // Пересчитываем средний чек
                        var averageCheck = (orderCount > 0) ? (totalRevenue / orderCount).toFixed(0) : 0;

                        // Обновляем элемент со средним чеком
                        var averageCheckElement = document.querySelector(".section-two__nav_block-2 .section-two__nav_block_sag-2");
                        averageCheckElement.textContent = averageCheck;
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
        var totalSeconds = 0;
        selectedButtons.forEach(function(button) {
            var timeText = button.textContent.trim(); // Получаем текст времени и удаляем лишние пробелы
            var result = timeText.match(/\d+/); // Найти первое целое число
            if (result) {
                var minutes = parseInt(result[0], 10);
            }

            if(button.classList.contains('hour')) {
                totalSeconds += minutes * 3600; // Преобразуем часы в секунды
            } else {
                totalSeconds += minutes * 60; // Преобразуем минуты в секунды
            }
        });
        return totalSeconds;
    }

    // Функция для форматирования времени (добавление нуля при необходимости)
    function formatTime(time) {
        return time < 10 ? "0" + time : time;
    }

    // Функция для запуска обратного отсчета
    function startCountdown(selectedButtons, orderContainer) {
        var countdownElement = orderContainer.querySelector(".section-two__box_Child-1__info_time");
        var totalSeconds = getTotalDurationInSeconds(selectedButtons);
        var countdownDate = new Date();
        countdownDate.setSeconds(countdownDate.getSeconds() + totalSeconds);

        var isPaused = false;
        var remainingSeconds = totalSeconds;

        function updateCountdown() {
            if (!isPaused) {
                var currentTime = new Date();
                var remainingTime = countdownDate - currentTime;
                remainingSeconds = Math.floor(remainingTime / 1000);

                if (remainingSeconds <= 0) {
                    clearInterval(interval);
                    countdownElement.textContent = "00:00:00";
                    return;
                }

                var hours = Math.floor(remainingSeconds / 3600);
                var minutes = Math.floor((remainingSeconds % 3600) / 60);
                var seconds = remainingSeconds % 60;

                countdownElement.textContent = formatTime(hours) + ":" + formatTime(minutes) + ":" + formatTime(seconds);
            }
        }

        updateCountdown(); // Сразу обновляем время

        var interval = setInterval(updateCountdown, 1000); // Запускаем обновление каждую секунду

        // Добавляем обработчик события клика по кнопке паузы/продолжения
        var pauseButton = orderContainer.querySelector(".section-two__box_Child-1__info_img");

        pauseButton.addEventListener("click", function() {
            pauseButton.classList.toggle("section-two__box_Child-1__info_img-active");
            isPaused = !isPaused;

            if (isPaused) {
                // Останавливаем таймер
                clearInterval(interval);
            } else {
                // Перезапускаем таймер с оставшимся временем
                countdownDate = new Date();
                countdownDate.setSeconds(countdownDate.getSeconds() + remainingSeconds);
                interval = setInterval(updateCountdown, 1000);
            }
        });

        // Инициализируем переменные для подсчета бонусов и штрафов
        var bonusCount = 0;
        var penaltyCount = 0;

        orderContainer.querySelectorAll(".section-two__box_Child-1__info_end_1").forEach(function(endButton) {
            endButton.addEventListener("click", function() {
                var timeAdjustment = endButton.querySelector("h4").textContent.includes("+") ? 300 : -300;
                adjustCountdownTime(timeAdjustment);
        
                // Определяем, какая кнопка была нажата (бонус или штраф)
                if (timeAdjustment > 0) {
                    // Если это бонус
                    bonusCount++;
                    // Обновляем значение в <h5> для бонуса
                    orderContainer.querySelectorAll(".section-two__box_Child-1__info_counter_item")[0].textContent = bonusCount;
                } else {
                    // Если это штраф
                    penaltyCount++;
                    // Обновляем значение в <h5> для штрафа
                    orderContainer.querySelectorAll(".section-two__box_Child-1__info_counter_item")[1].textContent = penaltyCount;
                }
            });
        });

        // Функция для изменения времени обратного отсчета
        function adjustCountdownTime(seconds) {
            var timeParts = countdownElement.textContent.split(":");
            var hours = parseInt(timeParts[0], 10);
            var minutes = parseInt(timeParts[1], 10);
            var secs = parseInt(timeParts[2], 10);

            var totalSeconds = hours * 3600 + minutes * 60 + secs + seconds;

            countdownDate = new Date();
            countdownDate.setSeconds(countdownDate.getSeconds() + totalSeconds);

            updateCountdown(); // Обновляем таймер
        }
    }
});