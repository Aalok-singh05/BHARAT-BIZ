from fastapi import FastAPI
from app.database import Base, engine
import app.models  # IMPORTANT: this loads all models

app = FastAPI(title="Textile AI Backend")

@app.on_event("startup")
def create_tables():
    Base.metadata.create_all(bind=engine)
