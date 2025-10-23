import asyncio
from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect, BackgroundTasks, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, time as time_cls
import zoneinfo
from fastapi.middleware.cors import CORSMiddleware
import hashlib

from . import models, database, crud, schemas, ws_manager

from pydantic import BaseModel

class AuthRequest(BaseModel):
    username: str
    password: str

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="BlackPizza Stats API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

LOCAL_TZ = zoneinfo.ZoneInfo("Asia/Yekaterinburg")

async def timer_update_loop():
    """Фоновая задача для автоматического обновления таймеров"""
    while True:
        try:
            from .database import SessionLocal
            db = SessionLocal()
            try:
                # Получаем заказы, которым нужно обновить таймер
                orders_to_update = crud.get_orders_needing_timer_update(db)
                
                for order in orders_to_update:
                    # Обновляем таймер
                    updated_order = crud.update_order_timer_auto(db, order.id)
                    # if updated_order and updated_order.remaining_seconds == 0:
                    #     # Если время вышло, автоматически завершаем заказ
                    #     crud.complete_order(db, order.id)
                    #     print(f"Заказ {order.id} автоматически завершен")
                
                if orders_to_update:
                    # Рассылаем обновления всем подключенным клиентам
                    await broadcast_active_orders()
                    await broadcast_today_stats()
                    
            finally:
                db.close()
        except Exception as e:
            print(f"Ошибка в timer_update_loop: {e}")
        
        # Ждем 1 секунду перед следующим обновлением
        await asyncio.sleep(1)

async def periodic_timer_broadcast():
    """Периодическая рассылка обновлений таймеров"""
    while True:
        try:
            from .database import SessionLocal
            db = SessionLocal()
            try:
                # Получаем активные заказы
                active_orders = crud.get_active_orders(db)
                if active_orders:
                    # Рассылаем обновленные активные заказы
                    await broadcast_active_orders()
            finally:
                db.close()
        except Exception as e:
            print(f"Ошибка в periodic_timer_broadcast: {e}")
        
        # Рассылаем обновления каждую секунду
        await asyncio.sleep(1)

# ----------------------
# КОНФИГУРАЦИЯ АДМИНИСТРАТОРА
# ----------------------

# Для генерации хэшей используйте: https://emn178.github.io/online-tools/sha256.html
ADMIN_CREDENTIALS = {
    "username_hash": "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918",
    "password_hash": "1d7d1f63300144a76270d9616c386f48da2902bccc311501e5318e1aa67502a3"
}

def hash_string(text: str) -> str:
    """Функция для хэширования строки в SHA-256"""
    return hashlib.sha256(text.encode()).hexdigest()

# ----------------------
# ЭНДПОИНТЫ АВТОРИЗАЦИИ
# ----------------------

class AuthRequest(BaseModel):
    username: str
    password: str

@app.post("/admin/auth")
async def admin_auth(auth_data: AuthRequest):
    """
    Аутентификация администратора
    """
    # Хэшируем введенные данные
    username_hash = hash_string(auth_data.username.lower().strip())
    password_hash = hash_string(auth_data.password)
    
    # Сравниваем с хранимыми хэшами
    if (username_hash == ADMIN_CREDENTIALS["username_hash"] and 
        password_hash == ADMIN_CREDENTIALS["password_hash"]):
        return {
            "success": True, 
            "message": "Авторизация успешна",
            "session_timeout": 8 * 60 * 60  # 8 часов в секундах
        }
    else:
        raise HTTPException(
            status_code=401, 
            detail="Неверные учетные данные"
        )

# ----------------------
# НОВЫЕ эндпоинты API
# ----------------------

@app.get("/orders/active", response_model=list[schemas.OrderOut])
def get_active_orders(db: Session = Depends(database.get_db)):
    """Получить все активные заказы"""
    return crud.get_active_orders(db)

@app.put("/order/{order_id}/timer")
def update_order_timer(
    order_id: int, 
    timer_update: schemas.OrderTimerUpdate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(database.get_db)
):
    """Обновить таймер заказа"""
    db_order = crud.update_order_timer(db, order_id, timer_update.remaining_seconds, timer_update.is_paused)
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    background_tasks.add_task(broadcast_today_stats)
    background_tasks.add_task(broadcast_active_orders)
    return {"message": "Timer updated successfully"}

@app.put("/order/{order_id}/complete")
def complete_order(
    order_id: int, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(database.get_db)
):
    """Отметить заказ как выполненный"""
    db_order = crud.complete_order(db, order_id)
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    background_tasks.add_task(broadcast_today_stats)
    background_tasks.add_task(broadcast_active_orders)
    return {"message": "Order completed successfully"}

@app.put("/order/{order_id}/update-full")
def update_order_full(
    order_id: int,
    payload: dict,
    background_tasks: BackgroundTasks,
    db: Session = Depends(database.get_db)
):
    """Полное обновление заказа"""
    db_order = crud.get_order_by_id(db, order_id)
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Обновляем все поля
    update_data = {
        "child_names": payload.get("child_names", db_order.child_names),
        "phone": payload.get("phone", db_order.phone),
        "note": payload.get("note", db_order.note),
        "duration": payload.get("duration", db_order.duration),
        "sum": payload.get("sum", db_order.sum),
        "total_seconds": payload.get("total_seconds", db_order.total_seconds),
        "remaining_seconds": payload.get("remaining_seconds", db_order.remaining_seconds),
        "is_paused": payload.get("is_paused", db_order.is_paused)
    }
    
    updated_order = crud.update_order_full(db, order_id, update_data)
    
    background_tasks.add_task(broadcast_today_stats)
    background_tasks.add_task(broadcast_active_orders)
    
    return {"message": "Order fully updated", "order": updated_order}

@app.delete("/order/{order_id}")
def delete_order_by_id(
    order_id: int, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(database.get_db)
):
    """Удалить заказ по ID"""
    deleted = crud.delete_order(db, order_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Order not found")
    
    background_tasks.add_task(broadcast_today_stats)
    background_tasks.add_task(broadcast_active_orders)
    return {"message": "Order deleted successfully"}

# ----------------------
# ОБНОВЛЕННЫЕ эндпоинты
# ----------------------

@app.post("/order", response_model=schemas.OrderOut)
def add_order(order: schemas.OrderCreate, background_tasks: BackgroundTasks, db: Session = Depends(database.get_db)):
    """Создание заказа (расширенная версия)"""
    o = crud.create_order(
        db, 
        order.sum, 
        order.date, 
        order.time,
        child_names=order.child_names,
        phone=order.phone,
        note=order.note,
        duration=order.duration,
        total_seconds=order.total_seconds,
        remaining_seconds=order.remaining_seconds
    )
    background_tasks.add_task(broadcast_today_stats)
    background_tasks.add_task(broadcast_active_orders)
    return o

@app.delete("/order")
def delete_order_legacy(
    payload: schemas.OrderDelete, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(database.get_db)
):
    """Старая версия удаления (для обратной совместимости)"""
    deleted = crud.delete_order_legacy(db, payload.sum, payload.date, payload.time)
    background_tasks.add_task(broadcast_today_stats)
    background_tasks.add_task(broadcast_active_orders)
    
    if deleted:
        return {"message": "Order deleted successfully"}
    return JSONResponse(status_code=404, content={"detail": "not found"})

# ----------------------
# СУЩЕСТВУЮЩИЕ эндпоинты
# ----------------------

@app.get("/orders/{date_str}")
def get_orders(date_str: str, db: Session = Depends(database.get_db)):
    date_obj = datetime.strptime(date_str, "%d.%m.%Y").date()
    orders = crud.get_orders_by_date(db, date_obj)
    return orders

@app.get("/average/{date_str}")
def get_average(date_str: str, db: Session = Depends(database.get_db)):
    date_obj = datetime.strptime(date_str, "%d.%m.%Y").date()
    avg = crud.get_average_check_by_date(db, date_obj)
    return {"average_check": avg}

@app.get("/revenue/{date_str}")
def get_revenue(date_str: str, db: Session = Depends(database.get_db)):
    date_obj = datetime.strptime(date_str, "%d.%m.%Y").date()
    total = crud.get_total_revenue_by_date(db, date_obj)
    return {"total_revenue": total}

@app.get("/orders_range")
def orders_range(start_date: str, end_date: str, db: Session = Depends(database.get_db)):
    sd = datetime.strptime(start_date, "%d.%m.%Y").date()
    ed = datetime.strptime(end_date, "%d.%m.%Y").date()
    return crud.get_orders_by_range(db, sd, ed)

@app.post("/order/update")
def update_order(
    payload: schemas.OrderUpdate, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(database.get_db)
):
    updated = crud.update_order(db, payload.old_sum, payload.date, payload.time, payload.new_sum)
    background_tasks.add_task(broadcast_today_stats)
    background_tasks.add_task(broadcast_active_orders)
    
    if updated:
        return updated
    return JSONResponse(status_code=404, content={"detail": "not found"})

# ----------------------
# WebSocket endpoint (обновленный)
# ----------------------

@app.websocket("/ws/stats")
async def ws_stats(websocket: WebSocket):
    await ws_manager.manager.connect(websocket)
    try:
        # При подключении отправляем текущую статистику и активные заказы
        await websocket.send_json(await get_combined_payload())
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await ws_manager.manager.disconnect(websocket)
    except Exception:
        await ws_manager.manager.disconnect(websocket)

# ----------------------
# Вспомогательные функции для WebSocket
# ----------------------

async def get_today_stats_payload():
    from .database import SessionLocal
    db = SessionLocal()
    try:
        today = datetime.now(LOCAL_TZ).date()
        total = crud.get_total_revenue_by_date(db, today)
        count = crud.get_orders_count_by_date(db, today)
        avg = crud.get_average_check_by_date(db, today)
        return {
            "type": "today_stats",
            "data": {
                "date": today.isoformat(),
                "orders_count": int(count),
                "total_revenue": int(total),
                "average_check": float(avg)
            }
        }
    finally:
        db.close()

async def get_active_orders_payload():
    from .database import SessionLocal
    db = SessionLocal()
    try:
        orders = crud.get_active_orders(db)
        # Конвертируем ORM объекты в словари
        orders_data = []
        for order in orders:
            order_dict = {
                "id": order.id,
                "sum": order.sum,
                "date": order.date,
                "time": order.time,
                "child_names": order.child_names,
                "phone": order.phone,
                "note": order.note,
                "duration": order.duration,
                "total_seconds": order.total_seconds,
                "remaining_seconds": order.remaining_seconds,  # ← ВАЖНО: передаем оставшееся время
                "is_paused": order.is_paused,
                "is_completed": order.is_completed,
                "created_at": order.created_at.isoformat() if order.created_at else None
            }
            orders_data.append(order_dict)
        
        return {
            "type": "active_orders",
            "data": orders_data
        }
    finally:
        db.close()

async def get_combined_payload():
    """Возвращает комбинированный payload со статистикой и активными заказами"""
    stats = await get_today_stats_payload()
    orders = await get_active_orders_payload()
    return {
        "type": "initial_data",
        "data": {
            "stats": stats["data"],
            "active_orders": orders["data"]
        }
    }

async def broadcast_today_stats():
    payload = await get_today_stats_payload()
    await ws_manager.manager.broadcast_json(payload)

async def broadcast_active_orders():
    payload = await get_active_orders_payload()
    await ws_manager.manager.broadcast_json(payload)

async def broadcast_combined():
    """Рассылает обновленные данные по статистике и активным заказам"""
    await broadcast_today_stats()
    await broadcast_active_orders()

# ----------------------
# Фоновая задача
# ----------------------

async def midnight_notifier_loop():
    while True:
        now = datetime.now(LOCAL_TZ)
        next_midnight = datetime.combine((now + timedelta(days=1)).date(), time_cls.min).replace(tzinfo=LOCAL_TZ)
        wait_seconds = (next_midnight - now).total_seconds()
        await asyncio.sleep(wait_seconds + 0.5)
        
        payload = {
            "type": "new_day",
            "data": {
                "date": next_midnight.date().isoformat(),
                "orders_count": 0, 
                "total_revenue": 0, 
                "average_check": 0.0
            }
        }
        await ws_manager.manager.broadcast_json(payload)
        await broadcast_today_stats()

@app.on_event("startup")
async def startup_event():
    loop = asyncio.get_event_loop()
    loop.create_task(midnight_notifier_loop())
    loop.create_task(timer_update_loop())
    loop.create_task(periodic_timer_broadcast())