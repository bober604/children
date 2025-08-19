from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import date as date_cls
from . import models

def create_order(db: Session, sum_: int, date_obj, time_obj):
    order = models.Order(sum=sum_, date=date_obj, time=time_obj)
    db.add(order)
    db.commit()
    db.refresh(order)
    return order

def get_orders_by_date(db: Session, date_obj):
    return db.query(models.Order).filter(models.Order.date == date_obj).order_by(models.Order.time).all()

def get_total_revenue_by_date(db: Session, date_obj):
    res = db.query(func.sum(models.Order.sum)).filter(models.Order.date == date_obj).scalar()
    return int(res or 0)

def get_orders_count_by_date(db: Session, date_obj):
    return db.query(func.count(models.Order.id)).filter(models.Order.date == date_obj).scalar() or 0

def get_average_check_by_date(db: Session, date_obj):
    count = get_orders_count_by_date(db, date_obj)
    if not count:
        return 0.0
    total = get_total_revenue_by_date(db, date_obj)
    return total / count

def get_orders_by_range(db: Session, start_date, end_date):
    return db.query(models.Order).filter(and_(models.Order.date >= start_date, models.Order.date <= end_date)).order_by(models.Order.date, models.Order.time).all()

def delete_order(db: Session, sum_, date_obj, time_obj):
    q = db.query(models.Order).filter(
        models.Order.sum == sum_,
        models.Order.date == date_obj,
        models.Order.time == time_obj
    )
    obj = q.first()
    if not obj:
        return False
    q.delete()
    db.commit()
    return True

def update_order(db: Session, old_sum, date_obj, time_obj, new_sum):
    q = db.query(models.Order).filter(
        models.Order.sum == old_sum,
        models.Order.date == date_obj,
        models.Order.time == time_obj
    )
    obj = q.first()
    if not obj:
        return None
    obj.sum = new_sum
    db.commit()
    db.refresh(obj)
    return obj
