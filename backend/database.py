from sqlmodel import SQLModel, create_engine, Session
import os

# Default to a local postgres database if not set
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://user_desa:password_desa@localhost:5432/db_desa"
)

   

engine = create_engine(DATABASE_URL, echo=True)

def get_session():
    with Session(engine) as session:
        yield session

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
