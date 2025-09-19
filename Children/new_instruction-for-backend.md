# Техническое задание для бэкенд-разработчика

## 📋 Общая задача

Необходимо модифицировать существующее API для работы с заказами детской комнаты. Требуется расширить функциональность: сохранять полную информацию о заказах (включая таймеры, состояния паузы и завершения) в базе данных и обеспечить синхронизацию между админской и гостевой страницами в реальном времени.

## 🗃️ Изменения в модели данных

### Текущая структура Order:
```python
class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    sum = Column(Integer)
    date = Column(String)
    time = Column(String)
```

### Новая структура Order:
```python
class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    sum = Column(Integer)  # Сумма заказа
    date = Column(String)  # Дата в формате DD.MM.YYYY
    time = Column(String)  # Время создания в формате HH.MM.SS
    
    # НОВЫЕ ПОЛЯ:
    child_names = Column(String)  # Имена детей через запятую
    phone = Column(String)  # Номер телефона
    note = Column(String)  # Примечание
    duration = Column(String)  # Продолжительность (30 мин., 1 час и т.д.)
    total_seconds = Column(Integer)  # Общее время в секундах
    remaining_seconds = Column(Integer)  # Оставшееся время в секундах
    is_paused = Column(Boolean, default=False)  # На паузе ли таймер
    is_completed = Column(Boolean, default=False)  # Завершен ли заказ
    created_at = Column(DateTime, default=datetime.now)  # Время создания
```

## 📡 Новые эндпоинты API

### 1. Получить все активные заказы
- **Метод:** GET
- **URL:** `/orders/active`
- **Ответ:** `List[OrderOut]`
- **Описание:** Возвращает все заказы с `is_completed = False`

### 2. Обновить таймер заказа
- **Метод:** PUT  
- **URL:** `/order/{order_id}/timer`
- **Тело запроса:**
```json
{
    "remaining_seconds": 3600,
    "is_paused": false
}
```
- **Описание:** Обновляет оставшееся время и состояние паузы

### 3. Отметить заказ как выполненный
- **Метод:** PUT
- **URL:** `/order/{order_id}/complete`
- **Описание:** Устанавливает `is_completed = True`, `remaining_seconds = 0`, `is_paused = False`

### 4. Удалить заказ по ID
- **Метод:** DELETE
- **URL:** `/order/{order_id}`
- **Описание:** Удаляет заказ из базы данных

## 🔄 Измененные эндпоинты

### 1. Создание заказа (расширенный формат)
- **Метод:** POST
- **URL:** `/order`
- **Текущее тело:**
```json
{
    "sum": 100,
    "date": "15.12.2023",
    "time": "14.30.00"
}
```

- **Новое тело:**
```json
{
    "sum": 100,
    "date": "15.12.2023",
    "time": "14.30.00",
    "child_names": "Анна, Мария",
    "phone": "+79001234567",
    "note": "Аллергия на шоколад",
    "duration": "1 час",
    "total_seconds": 3600,
    "remaining_seconds": 3600
}
```

### 2. Удаление заказа (новый формат)
- **Старый URL:** `/order` (через тело запроса)
- **Новый URL:** `/order/{order_id}` (через URL параметр)

## 🛠️ Требуемые изменения в CRUD операциях

### 1. `create_order` - расширенная версия
```python
def create_order(db: Session, sum: int, date: str, time: str, 
                child_names: str, phone: str, note: str, 
                duration: str, total_seconds: int, remaining_seconds: int):
    db_order = models.Order(
        sum=sum,
        date=date,
        time=time,
        child_names=child_names,
        phone=phone,
        note=note,
        duration=duration,
        total_seconds=total_seconds,
        remaining_seconds=remaining_seconds,
        is_paused=False,
        is_completed=False
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order
```

### 2. `get_active_orders` - новый метод
```python
def get_active_orders(db: Session):
    return db.query(models.Order).filter(models.Order.is_completed == False).all()
```

### 3. `update_order_timer` - новый метод
```python
def update_order_timer(db: Session, order_id: int, remaining_seconds: int, is_paused: bool):
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if db_order:
        db_order.remaining_seconds = remaining_seconds
        db_order.is_paused = is_paused
        db.commit()
        db.refresh(db_order)
    return db_order
```

### 4. `complete_order` - новый метод
```python
def complete_order(db: Session, order_id: int):
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if db_order:
        db_order.is_completed = True
        db_order.remaining_seconds = 0
        db_order.is_paused = False
        db.commit()
        db.refresh(db_order)
    return db_order
```

### 5. `delete_order` - обновленный метод
```python
def delete_order(db: Session, order_id: int):
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if db_order:
        db.delete(db_order)
        db.commit()
        return True
    return False
```

## 📊 Схемы Pydantic (Schemas)

### 1. OrderCreate (расширенная)
```python
class OrderCreate(BaseModel):
    sum: int
    date: str
    time: str
    child_names: str
    phone: str
    note: str
    duration: str
    total_seconds: int
    remaining_seconds: int
```

### 2. OrderTimerUpdate (новая)
```python
class OrderTimerUpdate(BaseModel):
    remaining_seconds: int
    is_paused: bool
```

### 3. OrderOut (расширенная)
```python
class OrderOut(BaseModel):
    id: int
    sum: int
    date: str
    time: str
    child_names: str
    phone: str
    note: str
    duration: str
    total_seconds: int
    remaining_seconds: int
    is_paused: bool
    is_completed: bool
    created_at: datetime
    
    class Config:
        orm_mode = True
```

## ⚡ Особенности реализации

### 1. **Частые обновления таймера**
- Таймер обновляется каждую секунду для активных заказов
- Необходимо обеспечить производительность частых UPDATE запросов
- Рекомендуется: индексация по `id` и `is_completed`

### 2. **Синхронизация в реальном времени**
- Гостевая страница получает данные через WebSocket (/ws/stats)
- При изменениях таймера/состояния - рассылать обновления через `broadcast_today_stats()`

### 3. **Обработка завершенных заказов**
- Заказы с `is_completed = True` не показываются в `/orders/active`
- Но сохраняются в базе для статистики

### 4. **Миграция базы данных**
- Необходимо создать миграцию для добавления новых полей
- Или пересоздать таблицу с новой структурой

## 🚀 Приоритеты реализации

1. **Высокий приоритет:**
   - Расширение модели Order
   - Новые эндпоинты для управления таймерами
   - Обновление эндпоинта создания заказа

2. **Средний приоритет:**
   - WebSocket обновления для гостевой страницы
   - Оптимизация частых обновлений таймеров

3. **Низкий приоритет:**
   - Кэширование для улучшения производительности
   - История завершенных заказов

## 📞 Контакты для согласования

- **Фронтенд-разработчик:** [Ваши контакты]
- **Время на реализацию:** 3-5 рабочих дней
- **Среда выполнения:** Python 3.8+, FastAPI, SQLAlchemy, существующая БД

---

**Примечание:** Фронтенд уже подготовлен для работы с новой API структурой. После реализации бэкенда необходимо провести совместное тестирование интеграции.