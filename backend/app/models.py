from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Time
from datetime import datetime
from .database import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    sum = Column(Integer, nullable=False)
    date = Column(String, index=True)  # Изменено с Date на String для формата DD.MM.YYYY
    time = Column(String, index=True)  # Изменено с Time на String для формата HH.MM.SS
    
    # Новые поля
    child_names = Column(String, default="")
    phone = Column(String, default="")
    note = Column(String, default="")
    duration = Column(String, default="")
    total_seconds = Column(Integer, default=0)
    remaining_seconds = Column(Integer, default=0)
    is_paused = Column(Boolean, default=False)
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.now)