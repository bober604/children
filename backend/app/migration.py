from sqlalchemy import create_engine, text
from database import Base, engine
import models

def migrate_database():
    # Создаем новую таблицу с обновленной структурой
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("Миграция базы данных завершена")

if __name__ == "__main__":
    migrate_database()