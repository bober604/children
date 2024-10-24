document.addEventListener("DOMContentLoaded", function() {
    // Функция для преобразования первой буквы строки в заглавную
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // Находим кнопку "Добавить"
    var addButton = document.querySelector(".section-one__button");

    // Добавляем обработчик события нажатия на кнопку
    addButton.addEventListener("click", function() {
        // Находим выбранные кнопки из секции section-one
        var selectedButtons = document.querySelectorAll(".section-one__box__button-1.selected, .section-one__box__button-2.selected");

        // Проверяем, выбраны ли кнопки
        if (selectedButtons.length === 0) {
            alert("Пожалуйста, укажите время посещения.");
            return;
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
        selectedButtons.forEach(function(button) {
            var price = button.querySelector(".section-one__box__button-1_sag-3").textContent;
            orderHTML += `<p class="section-two__box_Child-1__nav_section_par-2">${price}</p>`;
            // Удаляем выбранные кнопки
            button.classList.remove("selected");
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
                    <div  class="section-two__box_Child-1__info_img"><!-- Пауза/продолжение --></div>
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
                            <div class="section-two__box_Child-1__info_end_1">
                            <h4 class="section-two__box_Child-1__info_end_1_sag">- 5 минут</h4>
                            <p class="section-two__box_Child-1__info_end_1_par-2">Штраф</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="section-two__box_Child-2">
                <h5 class="section-two__box_Child-2_sag">Ребёнок ушёл</h5>
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
        startCountdown(selectedButtons);

        // Добавляем обработчик события клика по кнопке паузы/продолжения
        var pauseButton = orderContainer.querySelector(".section-two__box_Child-1__info_img");

        pauseButton.addEventListener("click", function() {
            pauseButton.classList.toggle("section-two__box_Child-1__info_img-active");
        });
    });

    // Добавляем обработчик события клика по кнопкам выбора времени
    var timeButtons = document.querySelectorAll(".section-one__box__button-1, .section-one__box__button-2");
    timeButtons.forEach(function(button) {
        button.addEventListener("click", function() {
            button.classList.toggle("selected");
        });
    });

    // Добавляем обработчик события клика по кнопке "По-факту"
    var factButton = document.querySelector(".section-one__container__parent__fact");
    factButton.addEventListener("click", function() {
    // Убираем выделение у всех кнопок времени посещения
    timeButtons.forEach(function(button) {
        button.classList.remove("selected");
    });
    // Добавляем класс "selected" кнопке "По-факту"
    factButton.classList.add("selected");
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
            var duration = button.querySelector(".section-one__box__button-1_sag-2").textContent;
            durationTime += duration + ", ";
        });
        return durationTime.slice(0, -2); // Удаляем последнюю запятую
    }

    // Функция для рассчета обратного отсчета времени
    function calculateCountdownTime(selectedButtons) {
        var totalSeconds = getTotalDurationInSeconds(selectedButtons);
        var countdownDate = new Date();
        countdownDate.setSeconds(countdownDate.getSeconds() + totalSeconds);
        return formatTime(countdownDate.getHours()) + ":" + formatTime(countdownDate.getMinutes()) + ":" + formatTime(countdownDate.getSeconds());
    }


    // Функция для получения общей продолжительности времени в секундах
    function getTotalDurationInSeconds(selectedButtons) {
        var totalSeconds = 0;
        selectedButtons.forEach(function(button) {
            var durationParts = button.querySelector(".section-one__box__button-1_sag-2").textContent.split(" ");
            var durationValue = parseInt(durationParts[0]);
            var durationUnit = durationParts[1];
            switch (durationUnit) {
                case "мин.":
                    totalSeconds += durationValue * 60;
                    break;
                case "час":
                case "часа":
                case "часов":
                case "Аренда":
                    totalSeconds += durationValue * 3600;
                    break;
                default:
                    break;
            }
        });
        return totalSeconds;
    }


    // Функция для форматирования времени (добавление ведущего нуля при необходимости)
    function formatTime(time) {
        return time < 10 ? "0" + time : time;
    }

    // Функция для запуска обратного отсчета
    function startCountdown(selectedButtons) {
        var countdownElement = document.getElementById("countdown");
        var totalSeconds = getTotalDurationInSeconds(selectedButtons);
        var countdownDate = new Date();
        countdownDate.setSeconds(countdownDate.getSeconds() + totalSeconds);
        var countdownInterval = setInterval(function() {
            var now = new Date().getTime();
            var distance = countdownDate - now;
            if (distance <= 0) {
                clearInterval(countdownInterval);
                countdownElement.textContent = "00:00:00";
            } else {
                var hours = Math.floor(distance / (1000 * 60 * 60));
                var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                var seconds = Math.floor((distance % (1000 * 60)) / 1000);
                countdownElement.textContent = formatTime(hours) + ":" + formatTime(minutes) + ":" + formatTime(seconds);
            }
        }, 1000);
    }
});