from pydantic import BaseModel, validator
from datetime import datetime, date, time

class OrderCreate(BaseModel):
    sum: int
    date: str  # ожидаем "dd.mm.yyyy"
    time: str  # ожидаем "hh.mm.ss"

    @validator("date")
    def parse_date(cls, v):
        return datetime.strptime(v, "%d.%m.%Y").date()

    @validator("time")
    def parse_time(cls, v):
        return datetime.strptime(v, "%H.%M.%S").time()

class OrderOut(BaseModel):
    id: int
    sum: int
    date: date
    time: time

    class Config:
        orm_mode = True

class OrderUpdate(BaseModel):
    old_sum: int
    date: str
    time: str
    new_sum: int

    @validator("date")
    def parse_date(cls, v):
        return datetime.strptime(v, "%d.%m.%Y").date()
    @validator("time")
    def parse_time(cls, v):
        return datetime.strptime(v, "%H.%M.%S").time()

class OrderDelete(BaseModel):
    sum: int
    date: str
    time: str

    @validator("date")
    def parse_date(cls, v):
        return datetime.strptime(v, "%d.%m.%Y").date()
    @validator("time")
    def parse_time(cls, v):
        return datetime.strptime(v, "%H.%M.%S").time()
