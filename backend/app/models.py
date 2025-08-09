from sqlalchemy import Column, Integer, Date, Time
from .database import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    sum = Column(Integer, nullable=False)           # сумма в целых (руб/коп — по договоренности)
    date = Column(Date, index=True)                 # хранится как DATE
    time = Column(Time, index=True)                 # хранится как TIME
