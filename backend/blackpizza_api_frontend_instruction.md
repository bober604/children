
# Инструкция по работе с BlackPizza API для фронтенда

## 1. Что это за API
Это бэкенд, который хранит заказы, считает статистику и отдаёт её тебе на фронтенд.  
Твоя задача — отправлять запросы на API и показывать пользователю данные.

API работает по адресу (в тестовом режиме):
```
http://127.0.0.1:8000
```
(На продакшене будет другой адрес, например: `https://api.blackpizza.com` — тебе скажут.)

---

## 2. Как подключаться
Чтобы фронтенд мог обращаться к API, я включил **CORS**.  
Это значит, что ты можешь делать запросы к моему серверу даже если твой сайт запущен на другом порту или домене.

На бэкенде это выглядит так:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # пока открыт для всех доменов
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

📌 Для тестов `"*"` подходит идеально.  
📌 На продакшене мы пропишем конкретный домен сайта, чтобы никто посторонний не мог использовать API.

---

## 3. Примеры запросов

### 📥 Получить все заказы за конкретный день
```javascript
fetch("http://127.0.0.1:8000/orders/09.08.2025")
  .then(res => res.json())
  .then(data => console.log(data))
```

### 📥 Получить средний чек за день
```javascript
fetch("http://127.0.0.1:8000/average/09.08.2025")
  .then(res => res.json())
  .then(data => console.log(data))
```

### 📥 Получить общую выручку за день
```javascript
fetch("http://127.0.0.1:8000/revenue/09.08.2025")
  .then(res => res.json())
  .then(data => console.log(data))
```

### 📤 Добавить новый заказ
```javascript
fetch("http://127.0.0.1:8000/order", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    sum: 500,
    date: "09.08.2025",
    time: "14.25.00"
  })
})
.then(res => res.json())
.then(data => console.log(data))
```

### 📤 Изменить заказ
```javascript
fetch("http://127.0.0.1:8000/order/update", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    old_sum: 500,
    date: "09.08.2025",
    time: "14.25.00",
    new_sum: 750
  })
})
.then(res => res.json())
.then(data => console.log(data))
```

### 🗑 Удалить заказ
```javascript
fetch("http://127.0.0.1:8000/order", {
  method: "DELETE",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    sum: 500,
    date: "09.08.2025",
    time: "14.25.00"
  })
})
.then(res => res.json())
.then(data => console.log(data))
```

---

## 4. Как тестировать
- Для удобства используй **Swagger UI** — там можно проверить все запросы без кода:  
  ```
  http://127.0.0.1:8000/docs
  ```
- Сначала добавь пару заказов, потом проверь статистику.
- Если видишь `CORS error` — значит домен фронтенда не разрешён, пиши мне, я добавлю его в настройки.

---

## 5. Что ещё важно
- Все даты передавай в формате `DD.MM.YYYY`
- Все времена — в формате `HH.MM.SS`
- Все суммы (`sum`) — целые числа без копеек.
- Если надо получать данные за период — есть эндпоинт `/orders_range/{start}/{end}` (формат дат тот же).

---

## 6. Пример готового HTML + JS для теста
Скопируй этот код в файл `index.html`, открой в браузере, и ты сможешь отправлять запросы в API прямо с кнопок.

```html
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>BlackPizza API Test</title>
</head>
<body>
    <h1>Тест BlackPizza API</h1>

    <button onclick="getOrders()">Получить заказы за 09.08.2025</button>
    <button onclick="addOrder()">Добавить заказ</button>

    <pre id="output"></pre>

    <script>
        const API_URL = "http://127.0.0.1:8000";

        function getOrders() {
            fetch(`${API_URL}/orders/09.08.2025`)
                .then(res => res.json())
                .then(data => document.getElementById("output").textContent = JSON.stringify(data, null, 2))
                .catch(err => console.error(err));
        }

        function addOrder() {
            fetch(`${API_URL}/order`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sum: 500,
                    date: "09.08.2025",
                    time: "15.00.00"
                })
            })
            .then(res => res.json())
            .then(data => document.getElementById("output").textContent = JSON.stringify(data, null, 2))
            .catch(err => console.error(err));
        }
    </script>
</body>
</html>
```

📌 Запусти API командой:
```
uvicorn main:app --reload
```
📌 Открой `index.html` в браузере.  
📌 Нажимай кнопки — данные будут появляться в окне.
