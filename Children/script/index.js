// document.addEventListener("DOMContentLoaded", function() {
//     // Функция для преобразования первой буквы строки в заглавную
//     function capitalizeFirstLetter(string) {
//         return string.charAt(0).toUpperCase() + string.slice(1);
//     }

//     // Находим кнопку "Добавить"
//     var addButton = document.querySelector(".section-one__button");

//     // Добавляем обработчик события нажатия на кнопку
//     addButton.addEventListener("click", function() {
//         // Находим выбранные кнопки из секции section-one
//         var selectedButtons = document.querySelectorAll(".section-one__box__button-1.selected, .section-one__box__button-2.selected");

//         // Проверяем, выбраны ли кнопки
//         if (selectedButtons.length === 0) {
//             alert("Пожалуйста, укажите время посещения.");
//             return;
//         }

//         // Создаем контейнер для информации о заказе
//         var orderContainer = document.createElement("div");
//         orderContainer.classList.add("section-two__box");

//         // Строим HTML структуру заказа
//         var orderHTML = `
//             <div class="section-two__box_Child-1">
//                 <nav class="section-two__box_Child-1__nav">
//                     <div class="section-two__box_Child-1__nav_section">
//                         <p class="section-two__box_Child-1__nav_section_par-1">Сумма</p>`;
//         // Добавляем информацию о сумме заказа
//         selectedButtons.forEach(function(button) {
//             var price = button.querySelector(".section-one__box__button-1_sag-3").textContent;
//             orderHTML += `<p class="section-two__box_Child-1__nav_section_par-2">${price}</p>`;
//             // Удаляем выбранные кнопки
//             button.classList.remove("selected");
//         });
//         orderHTML += `
//                     </div>
//                     <div class="section-two__box_Child-1__nav_section">
//                         <p class="section-two__box_Child-1__nav_section_par-1">Зашёл в</p>
//                         <p class="section-two__box_Child-1__nav_section_par-2">${getCurrentTime()}</p>
//                     </div>
//                     <div class="section-two__box_Child-1__nav_section">
//                         <p class="section-two__box_Child-1__nav_section_par-1">Посещение</p>
//                         <p class="section-two__box_Child-1__nav_section_par-2">${getDuration(selectedButtons)}</p>
//                     </div>
//                 </nav>
//                 <div class="section-two__box_Child-1_line"><!-- Линия --></div>

//                 <div class="section-two__box_Child-1__info">
//                     <div class="section-two__box_Child-1__info_parents">
//                         <h5 class="section-two__box_Child-1__info_parents_number">${capitalizeFirstLetter(document.querySelector('.section-one__container_4').value)}</h5>
//                         <p class="section-two__box_Child-1__info_parents_par">${document.querySelector('.section-one__container_3').value}</p>
//                     </div>
//                     <div class="section-two__box_Child-1__info_line-1"><!-- Линия --></div>
//                     <h3 class="section-two__box_Child-1__info_name">${capitalizeFirstLetter(document.querySelector('.section-one__container_1').value)}</h3>
//                     <h3 class="section-two__box_Child-1__info_sag">Осталось:</h3>
//                     <h3 class="section-two__box_Child-1__info_time" id="countdown">${calculateCountdownTime(selectedButtons)}</h3>
//                     <div  class="section-two__box_Child-1__info_img"><!-- Пауза/продолжение --></div>
//                     <div class="section-two__box_Child-1__info_counter">
//                         <h5 class="section-two__box_Child-1__info_counter_item">0</h5>
//                         <h5 class="section-two__box_Child-1__info_counter_item">0</h5>
//                     </div>
//                     <div class="section-two__box_Child-1__info_line-2"><!-- Линия --></div>
//                     <div class="section-two__box_Child-1__info_end">
//                         <div class="section-two__box_Child-1__info_end_1">
//                             <h4 class="section-two__box_Child-1__info_end_1_sag">+ 5 минут</h4>
//                             <p class="section-two__box_Child-1__info_end_1_par-1">Бонус</p>
//                         </div>
//                         <div class="section-two__box_Child-1__info_end_line"><!-- Линия --></div>
//                             <div class="section-two__box_Child-1__info_end_1">
//                             <h4 class="section-two__box_Child-1__info_end_1_sag">- 5 минут</h4>
//                             <p class="section-two__box_Child-1__info_end_1_par-2">Штраф</p>
//                         </div>
//                     </div>
//                 </div>
//             </div>
            
//             <div class="section-two__box_Child-2">
//                 <h5 class="section-two__box_Child-2_sag">Ребёнок ушёл</h5>
//             </div>

//             <div class="section-two__box_Child-3">
//                 <h5 class="section-two__box_Child-3_sag">Удалить</h5>
//                 <div class="section-two__box_Child-3_img"><!-- img корзины --></div>
//             </div>
            
//             <div class="section-two__box_Child-4">
//                 <h5 class="section-two__box_Child-4_sag">Изменить заказ</h5>
//             </div>`;
        
//         // Добавляем сгенерированный HTML в контейнер
//         orderContainer.innerHTML = orderHTML;

//         // Находим блок для добавления информации о заказе
//         var sectionTwoLending = document.querySelector(".section-two_lending");

//         // Вставляем созданный контейнер с информацией о заказе в начало списка
//         sectionTwoLending.insertBefore(orderContainer, sectionTwoLending.firstChild);

//         // Запускаем обратный отсчет
//         startCountdown(selectedButtons, orderContainer);

//         // Добавляем обработчик события клика по кнопке паузы/продолжения
//         var pauseButton = orderContainer.querySelector(".section-two__box_Child-1__info_img");

//         pauseButton.addEventListener("click", function() {
//             pauseButton.classList.toggle("section-two__box_Child-1__info_img-active");
//         });
//     });

//     // Добавляем обработчик события клика по кнопкам выбора времени
//     var timeButtons = document.querySelectorAll(".section-one__box__button-1, .section-one__box__button-2");
//     timeButtons.forEach(function(button) {
//         button.addEventListener("click", function() {
//             button.classList.toggle("selected");
//         });
//     });

//     // Добавляем обработчик события клика по кнопке "По-факту"
//     var factButton = document.querySelector(".section-one__container__parent__fact");
//     factButton.addEventListener("click", function() {
//         // Убираем выделение у всех кнопок времени посещения
//         timeButtons.forEach(function(button) {
//             button.classList.remove("selected");
//         });
//         // Добавляем класс "selected" кнопке "По-факту"
//         factButton.classList.add("selected");
//     });

//     // Функция для получения текущего времени
//     function getCurrentTime() {
//         var currentTime = new Date();
//         var hours = currentTime.getHours();
//         var minutes = currentTime.getMinutes();
//         if (minutes < 10) {
//             minutes = "0" + minutes;
//         }
//         return hours + ":" + minutes;
//     }

//     // Функция для получения времени пребывания
//     function getDuration(selectedButtons) {
//         var durationTime = "";
//         selectedButtons.forEach(function(button) {
//             var timeText = button.textContent.trim(); // Получаем текст времени и удаляем лишние пробелы
//             durationTime += timeText + ", ";
//         });
//         return durationTime.slice(0, -2); // Удаляем последнюю запятую
//     }

//     // Функция для расчета времени обратного отсчета
//     function calculateCountdownTime(selectedButtons) {
//         var totalSeconds = getTotalDurationInSeconds(selectedButtons);
//         var countdownDate = new Date();
//         countdownDate.setSeconds(countdownDate.getSeconds() + totalSeconds);
//         return formatTime(countdownDate.getHours()) + ":" + formatTime(countdownDate.getMinutes()) + ":" + formatTime(countdownDate.getSeconds());
//     }

//     // Функция для получения общей продолжительности заказа в секундах
//     function getTotalDurationInSeconds(selectedButtons) {
//         var totalSeconds = 0;
//         selectedButtons.forEach(function(button) {
//             var timeText = button.textContent.trim(); // Получаем текст времени и удаляем лишние пробелы
//             var seconds = timeToSeconds(timeText); // Преобразуем время в секунды
//             totalSeconds += seconds;
//         });
//         return totalSeconds;
//     }

//     // Функция для преобразования времени в секунды
//     function timeToSeconds(timeText) {
//         switch (timeText) {
//             case "15 минут":
//                 return 15 * 60;
//             case "30 минут":
//                 return 30 * 60;
//             case "1 час":
//                 return 60 * 60;
//             case "2 часа":
//                 return 2 * 60 * 60;
//             case "Аренда 1 час":
//                 return 60 * 60;
//             case "Аренда 2 часа":
//                 return 2 * 60 * 60;
//             default:
//                 return 0;
//         }
//     }

//     // Функция для форматирования времени (добавление нуля при необходимости)
//     function formatTime(time) {
//         return time < 10 ? "0" + time : time;
//     }

//     // Функция для запуска обратного отсчета
//     function startCountdown(selectedButtons, orderContainer) {
//         var countdownElement = orderContainer.querySelector(".section-two__box_Child-1__info_time");
//         var totalSeconds = getTotalDurationInSeconds(selectedButtons);
//         var countdownDate = new Date();
//         countdownDate.setSeconds(countdownDate.getSeconds() + totalSeconds);

//         function updateCountdown() {
//             var currentTime = new Date();
//             var remainingSeconds = Math.floor((countdownDate - currentTime) / 1000);

//             if (remainingSeconds < 0) {
//                 clearInterval(interval);
//                 countdownElement.textContent = "00:00:00";
//                 return;
//             }

//             var hours = Math.floor(remainingSeconds / 3600);
//             var minutes = Math.floor((remainingSeconds % 3600) / 60);
//             var seconds = remainingSeconds % 60;

//             countdownElement.textContent = formatTime(hours) + ":" + formatTime(minutes) + ":" + formatTime(seconds);
//         }

//         updateCountdown(); // Сразу обновляем время

//         var interval = setInterval(updateCountdown, 1000); // Запускаем обновление каждую секунду
//     }
// });










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
        startCountdown(selectedButtons, orderContainer);

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
            var timeText = button.textContent.trim(); // Получаем текст времени и удаляем лишние пробелы
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
            var minutes = parseInt(timeText); // Парсим минуты из текста кнопки
            totalSeconds += minutes * 60; // Преобразуем минуты в секунды
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

        function updateCountdown() {
            var currentTime = new Date();
            var remainingSeconds = Math.floor((countdownDate - currentTime) / 1000);

            if (remainingSeconds < 0) {
                clearInterval(interval);
                countdownElement.textContent = "00:00:00";
                return;
            }

            var hours = Math.floor(remainingSeconds / 3600);
            var minutes = Math.floor((remainingSeconds % 3600) / 60);
            var seconds = remainingSeconds % 60;

            countdownElement.textContent = formatTime(hours) + ":" + formatTime(minutes) + ":" + formatTime(seconds);
        }

        updateCountdown(); // Сразу обновляем время

        var interval = setInterval(updateCountdown, 1000); // Запускаем обновление каждую секунду
    }
});