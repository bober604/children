from sqlalchemy import Integer, Column, String, Boolean, Text
from sqlalchemy.orm import DeclarativeBase, Session
import sqlalchemy
from werkzeug.security import generate_password_hash, check_password_hash

engine = sqlalchemy.create_engine("sqlite:///data/DataBase.db")

class Base(DeclarativeBase): pass

class User(Base):
    __tablename__ = "Users"

    id = Column(Integer, primary_key=True, index=True)
    login = Column(String, nullable=False)
    password_hash = Column(String(128))
    admin = Column(Boolean, default=False)
    page_number = Column(Integer)

Base.metadata.create_all(bind=engine)