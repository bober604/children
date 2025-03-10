// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDTYDcBhc4WucicvZj6CjVIgHiovS3EZ3g",
  authDomain: "black-pizza---play-room.firebaseapp.com",
  projectId: "black-pizza---play-room",
  storageBucket: "black-pizza---play-room.firebasestorage.app",
  messagingSenderId: "697383277537",
  appId: "1:697383277537:web:8a227496c14394f6d7f8a0",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

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
                            child.style.marginTop = '0'; // Возврат в исходное состояние
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
                            child.style.marginTop = "0"; // Возврат в исходное состояние
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
                            const timeDiv = this.querySelector('div');
                            if (timeDiv) {
                                timeDiv.classList.toggle("section-one__orderChange__box__buttons_block-1_active");
                                timeDiv.classList.toggle("section-one__orderChange__box__buttons_block-1_inactive");
                            }
                        });
                    });

                    // Идентификатор текущего таймера и оставшееся время
                    let currentTimerId = null;
                    let remainingTime = 0; // В секундах

                    // Функция для остановки текущего таймера
                    function stopCurrentTimer() {
                        if (currentTimerId !== null) {
                            clearInterval(currentTimerId); // Удаляем старый таймер
                            currentTimerId = null;
                        }
                    }

                    // Функция для запуска нового таймера
                    function startNewTimer(durationInMinutes, countdownElement) {
                        stopCurrentTimer(); // Останавливаем текущий таймер

                        remainingTime = durationInMinutes * 60; // Обновляем оставшееся время (в секундах)

                        remainingTime = durationInMinutes * 60; // Устанавливаем новое время (в секундах)

                        function updateTimerDisplay() {
                            const hours = Math.floor(remainingTime / 3600);
                            const minutes = Math.floor((remainingTime % 3600) / 60);
                            const seconds = remainingTime % 60;

                            countdownElement.textContent = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
                        }

                        // Обновляем дисплей сразу
                        updateTimerDisplay();

                        // Устанавливаем интервал для нового таймера
                        currentTimerId = setInterval(() => {
                            if (remainingTime > 0) {
                                remainingTime--;
                                updateTimerDisplay();
                            } else {
                                // Таймер завершён
                                stopCurrentTimer();
                            }
                        }, 1000);
                    }

                    // Сопоставление времени и стоимости
                    const timePrices = {
                        "15 мин.": 50,
                        "30 мин.": 100,
                        "1 час": 150,
                        "2 часа": 250,
                        "Аренда 1 час": 2000,
                        "Аренда 2 часа": 4000,
                    };

                    // Функция для обработки бонусов/штрафов
                    function adjustTimer(minutes) {
                        remainingTime += minutes * 60; // Добавляем/вычитаем время (в секундах)
                        if (remainingTime < 0) remainingTime = 0; // Убеждаемся, что время не уходит в отрицательные значения
                    }

                    // Обработка сохранения изменений
                    const saveButton = newOrderBlock.querySelector(".section-one__orderChange__box_save");
                    saveButton.addEventListener("click", function () {
                        const selectedButtons = newOrderBlock.querySelectorAll(".section-one__orderChange__box__buttons_block-1_active");

                        // Суммируем время из выбранных кнопок
                        let totalMinutes = 0;
                        const selectedDurations = Array.from(selectedButtons).map(button => {
                            const timeText = button.previousElementSibling.textContent.trim();

                            // Считаем минуты
                            if (timeText.includes("мин")) {
                                totalMinutes += parseInt(timeText);
                            } else if (timeText.includes("час")) {
                                totalMinutes += parseInt(timeText) * 60;
                            }

                            return timeText; // Сохраняем текстовое значение для отображения
                        });

                        // Учитываем прошедшее время
                        const adjustedMinutes = Math.max(totalMinutes - Math.floor(elapsedSeconds / 60), 0);

                        // Формируем текст для id="duration"
                        const durationText = selectedDurations.join(", ");
                        document.getElementById("duration").textContent = durationText;

                        // Обновляем сумму заказа
                        let totalPrice = 0;
                        document.querySelector(".price").textContent = `${totalPrice} руб.`;
                
                        // Запускаем новый таймер
                        const countdownElement = document.querySelector(".section-two__box_Child-1__info_time");
                        startNewTimer(adjustedMinutes, countdownElement);

                        // Обновляем дополнительные данные (имя, телефон, примечания)
                        parentOrder.querySelector(".section-two__box_Child-1__info_container-sag_name").textContent = document.getElementById("order-1").value;
                        parentOrder.querySelector(".section-two__box_Child-1__info_parents_number").textContent = document.getElementById("order-2").value;
                        parentOrder.querySelector(".section-two__box_Child-1__info_parents_par").textContent = document.getElementById("order-3").value;

                        // Удаляем блок изменения заказа
                        newOrderBlock.remove();
                    });

                    // Изменяем обработчики для бонуса/штрафа
                    document.querySelector(".section-two__box_Child-1__info_end_1_par-1").addEventListener("click", () => adjustTimer(5)); // +5 минут
                    document.querySelector(".section-two__box_Child-1__info_end_1_par-2").addEventListener("click", () => adjustTimer(-5)); // -5 минут

                    // Изменяем обработчик для паузы/продолжения
                    document.querySelector(".section-two__box_Child-1__info_img").addEventListener("click", () => {
                        if (currentTimerId !== null) {
                            stopCurrentTimer(); // Останавливаем текущий таймер
                        } else {
                            startNewTimer(Math.ceil(remainingTime / 60), document.querySelector(".section-two__box_Child-1__info_time")); // Возобновляем таймер
                        }
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
                    targetBlock.querySelector(".section-two__box_Child-1__info_line-2").classList.remove("in-section-two__box_Child-1__info_line-2");
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
                    targetBlock.querySelector(".section-two__box_Child-1__info_line-2").classList.add("in-section-two__box_Child-1__info_line-2");
                    targetBlock.querySelector(".section-two__box_Child-1__info_end_1").classList.add("in-section-two__box_Child-1__info_end_1");
                    targetBlock.querySelector(".section-two__box_Child-1__info_end_1_par-1").classList.add("in-section-two__box_Child-1__info_end_1_par-1");
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

                if (button.classList.contains('hour')) {
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
                remainingSeconds += seconds;

                if (remainingSeconds <= 0) {
                    remainingSeconds = 0;
                    countdownElement.textContent = "00:00:00";
                    clearInterval(interval);
                    return;
                }

                var hours = Math.floor(remainingSeconds / 3600);
                var minutes = Math.floor((remainingSeconds % 3600) / 60);
                var secs = remainingSeconds % 60;

                countdownElement.textContent = formatTime(hours) + ":" + formatTime(minutes) + ":" + formatTime(secs);

                if (!isPaused) {
                    countdownDate = new Date();
                    countdownDate.setSeconds(countdownDate.getSeconds() + remainingSeconds);
                }
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

