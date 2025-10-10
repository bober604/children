from pydantic import BaseModel, validator
from datetime import datetime, date, time
from typing import Optional

class OrderCreate(BaseModel):
    sum: int
    date: str  # формат "dd.mm.yyyy"
    time: str  # формат "hh.mm.ss"
    child_names: str = ""
    phone: str = ""
    note: str = ""
    duration: str = ""
    total_seconds: int = 0
    remaining_seconds: int = 0

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

# Новые схемы
class OrderTimerUpdate(BaseModel):
    remaining_seconds: int
    is_paused: bool

class OrderFullUpdate(BaseModel):
    child_names: Optional[str] = None
    phone: Optional[str] = None
    note: Optional[str] = None
    duration: Optional[str] = None
    sum: Optional[int] = None
    total_seconds: Optional[int] = None
    remaining_seconds: Optional[int] = None
    is_paused: Optional[bool] = None