from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import date as date_cls
from . import models

def create_order(db: Session, sum_: int, date_obj, time_obj, 
                child_names: str = "", phone: str = "", note: str = "", 
                duration: str = "", total_seconds: int = 0, remaining_seconds: int = 0):
    # Преобразуем date и time обратно в строки для хранения
    date_str = date_obj.strftime("%d.%m.%Y") if hasattr(date_obj, 'strftime') else date_obj
    time_str = time_obj.strftime("%H.%M.%S") if hasattr(time_obj, 'strftime') else time_obj
    
    order = models.Order(
        sum=sum_, 
        date=date_str, 
        time=time_str,
        child_names=child_names,
        phone=phone,
        note=note,
        duration=duration,
        total_seconds=total_seconds,
        remaining_seconds=remaining_seconds,
        is_paused=False,
        is_completed=False
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order

def get_orders_by_date(db: Session, date_obj):
    date_str = date_obj.strftime("%d.%m.%Y") if hasattr(date_obj, 'strftime') else date_obj
    return db.query(models.Order).filter(models.Order.date == date_str).order_by(models.Order.time).all()

def get_total_revenue_by_date(db: Session, date_obj):
    date_str = date_obj.strftime("%d.%m.%Y") if hasattr(date_obj, 'strftime') else date_obj
    res = db.query(func.sum(models.Order.sum)).filter(
        models.Order.date == date_str,
        models.Order.is_completed == False  # Только активные заказы
    ).scalar()
    return int(res or 0)

def get_orders_count_by_date(db: Session, date_obj):
    date_str = date_obj.strftime("%d.%m.%Y") if hasattr(date_obj, 'strftime') else date_obj
    return db.query(func.count(models.Order.id)).filter(
        models.Order.date == date_str,
        models.Order.is_completed == False  # Только активные заказы
    ).scalar() or 0

def get_average_check_by_date(db: Session, date_obj):
    count = get_orders_count_by_date(db, date_obj)
    if not count:
        return 0.0
    total = get_total_revenue_by_date(db, date_obj)
    return total / count

def get_orders_by_range(db: Session, start_date, end_date):
    start_str = start_date.strftime("%d.%m.%Y") if hasattr(start_date, 'strftime') else start_date
    end_str = end_date.strftime("%d.%m.%Y") if hasattr(end_date, 'strftime') else end_date
    
    # Получаем все заказы и фильтруем на Python-стороне
    all_orders = db.query(models.Order).order_by(models.Order.date, models.Order.time).all()
    
    filtered_orders = []
    for order in all_orders:
        try:
            # Парсим дату из строки DD.MM.YYYY
            day, month, year = order.date.split('.')
            order_date = date_cls(int(year), int(month), int(day))
            
            # Сравниваем с диапазоном
            if start_date <= order_date <= end_date:
                filtered_orders.append(order)
        except (ValueError, AttributeError):
            continue
    
    return filtered_orders

def delete_order(db: Session, order_id: int):
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if db_order:
        db.delete(db_order)
        db.commit()
        return True
    return False

def delete_order_legacy(db: Session, sum_, date_obj, time_obj):
    # Старая версия для обратной совместимости
    date_str = date_obj.strftime("%d.%m.%Y") if hasattr(date_obj, 'strftime') else date_obj
    time_str = time_obj.strftime("%H.%M.%S") if hasattr(time_obj, 'strftime') else time_obj
    
    q = db.query(models.Order).filter(
        models.Order.sum == sum_,
        models.Order.date == date_str,
        models.Order.time == time_str
    )
    obj = q.first()
    if not obj:
        return False
    q.delete()
    db.commit()
    return True

def update_order(db: Session, old_sum, date_obj, time_obj, new_sum):
    date_str = date_obj.strftime("%d.%m.%Y") if hasattr(date_obj, 'strftime') else date_obj
    time_str = time_obj.strftime("%H.%M.%S") if hasattr(time_obj, 'strftime') else time_obj
    
    q = db.query(models.Order).filter(
        models.Order.sum == old_sum,
        models.Order.date == date_str,
        models.Order.time == time_str
    )
    obj = q.first()
    if not obj:
        return None
    obj.sum = new_sum
    db.commit()
    db.refresh(obj)
    return obj

# Новые CRUD методы
def get_active_orders(db: Session):
    return db.query(models.Order).filter(models.Order.is_completed == False).all()

def update_order_timer(db: Session, order_id: int, remaining_seconds: int, is_paused: bool):
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if db_order:
        db_order.remaining_seconds = remaining_seconds
        db_order.is_paused = is_paused
        db.commit()
        db.refresh(db_order)
    return db_order

def complete_order(db: Session, order_id: int):
    """Отметить заказ как выполненный или возобновить"""
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if db_order:
        # Переключаем статус выполнения
        db_order.is_completed = not db_order.is_completed
        
        if db_order.is_completed:
            # Если завершаем - ставим на паузу
            db_order.is_paused = True
        else:
            # Если возобновляем - снимаем с паузу
            db_order.is_paused = False
            # НЕ меняем remaining_seconds - оставляем как есть
        
        db.commit()
        db.refresh(db_order)
        
    return db_order

def get_order_by_id(db: Session, order_id: int):
    return db.query(models.Order).filter(models.Order.id == order_id).first()

def get_order_by_id(db: Session, order_id: int):
    """Получить заказ по ID"""
    return db.query(models.Order).filter(models.Order.id == order_id).first()

def update_order_timer_auto(db: Session, order_id: int):
    """Автоматическое обновление таймера заказа (уменьшение времени)"""
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if db_order and not db_order.is_paused and not db_order.is_completed and db_order.remaining_seconds > 0:
        db_order.remaining_seconds = max(0, db_order.remaining_seconds - 1)
        db.commit()
        db.refresh(db_order)
    return db_order

def get_orders_needing_timer_update(db: Session):
    """Получить заказы, которым нужно обновить таймер"""
    return db.query(models.Order).filter(
        models.Order.is_completed == False,
        models.Order.is_paused == False,
        models.Order.remaining_seconds > 0
    ).all()

def update_order_full(db: Session, order_id: int, update_data: dict):
    """Полное обновление заказа"""
    db_order = get_order_by_id(db, order_id)
    if not db_order:
        return None
    
    for field, value in update_data.items():
        if hasattr(db_order, field):
            setattr(db_order, field, value)
    
    db.commit()
    db.refresh(db_order)
    return db_order