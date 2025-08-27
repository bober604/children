import asyncio
from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, time as time_cls
import zoneinfo
from fastapi.middleware.cors import CORSMiddleware

from . import models, database, crud, schemas, ws_manager

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="BlackPizza Stats API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

LOCAL_TZ = zoneinfo.ZoneInfo("Asia/Yekaterinburg")  # можно заменить на нужную зону

# ----------------------
# REST endpoints
# ----------------------

@app.post("/order", response_model=schemas.OrderOut)
def add_order(order: schemas.OrderCreate, db: Session = Depends(database.get_db)):
    o = crud.create_order(db, order.sum, order.date, order.time)
    # после создания — рассылаем обновлённую статистику по дню
    # asyncio.create_task(broadcast_today_stats())
    return o

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

from fastapi import BackgroundTasks, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

@app.delete("/order")
def delete_order(payload: schemas.OrderDelete, background_tasks: BackgroundTasks, db: Session = Depends(database.get_db)):
    deleted = crud.delete_order(db, payload.sum, payload.date, payload.time)
    background_tasks.add_task(broadcast_today_stats)
    if deleted:
        return {"message": "Order deleted successfully"}
    return JSONResponse(status_code=404, content={"detail": "not found"})

# Нерабочий код Джамшеда
# @app.delete("/order")
# def delete_order(payload: schemas.OrderDelete, db: Session = Depends(database.get_db)):
#     ok = crud.delete_order(db, payload.sum, payload.date, payload.time)
#     # оповещаем клиентов
#     asyncio.create_task(broadcast_today_stats())
#     return {"deleted": ok}

from fastapi import BackgroundTasks, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

@app.post("/order/update")
def update_order(
    payload: schemas.OrderUpdate, background_tasks: BackgroundTasks, db: Session = Depends(database.get_db)):
    updated = crud.update_order(db, payload.old_sum, payload.date, payload.time, payload.new_sum)
    background_tasks.add_task(broadcast_today_stats)
    if updated:
        return updated
    return JSONResponse(status_code=404, content={"detail": "not found"})

# Нерабочий код Джамшеда
# @app.post("/order/update")
# def update_order(payload: schemas.OrderUpdate, db: Session = Depends(database.get_db)):
#     updated = crud.update_order(db, payload.old_sum, payload.date, payload.time, payload.new_sum)
#     asyncio.create_task(broadcast_today_stats())
#     if updated:
#         return updated
#     return JSONResponse(status_code=404, content={"detail": "not found"})


# ----------------------
# WebSocket endpoint
# ----------------------

@app.websocket("/ws/stats")
async def ws_stats(websocket: WebSocket):
    await ws_manager.manager.connect(websocket)
    try:
        # при подключении сразу отправляем текущую статистику на сегодня
        await websocket.send_json(await get_today_stats_payload())
        while True:
            # клиенты могут присылать ping/pong или фильтры — сейчас просто читаем, но не требуем
            await websocket.receive_text()
    except WebSocketDisconnect:
        await ws_manager.manager.disconnect(websocket)
    except Exception:
        await ws_manager.manager.disconnect(websocket)

# ----------------------
# Статистика / broadcast helpers
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
            "date": today.isoformat(),
            "orders_count": int(count),
            "total_revenue": int(total),
            "average_check": float(avg)
        }
    finally:
        db.close()

async def broadcast_today_stats():
    payload = await get_today_stats_payload()
    await ws_manager.manager.broadcast_json({"type": "today_stats", "data": payload})

# ----------------------
# Фоновая задача: оповещение о новом дне в 00:00 локального времени
# ----------------------

async def midnight_notifier_loop():
    # расчёт времени до следующего локального полуночи
    while True:
        now = datetime.now(LOCAL_TZ)
        # следующий день в 00:00:00
        next_midnight = datetime.combine((now + timedelta(days=1)).date(), time_cls.min).replace(tzinfo=LOCAL_TZ)
        wait_seconds = (next_midnight - now).total_seconds()
        # safety sleep
        await asyncio.sleep(wait_seconds + 0.5)
        # в момент после 00:00 — оповещаем всех: статистика сегодня = 0 (пока нет заказов)
        payload = {
            "type": "new_day",
            "date": next_midnight.date().isoformat(),
            "data": {"orders_count": 0, "total_revenue": 0, "average_check": 0.0}
        }
        await ws_manager.manager.broadcast_json(payload)
        # также можем сразу расшарить актуальную (пока нулевая) today_stats
        await broadcast_today_stats()

@app.on_event("startup")
async def startup_event():
    # запускаем фоновой цикл (в отдельных задачах)
    loop = asyncio.get_event_loop()
    loop.create_task(midnight_notifier_loop())
