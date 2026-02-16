# api/index.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import datetime

from .database import engine
from . import models

# --- IMPORTAMOS TODOS LOS ROUTERS ---
from .routers.dev import router as dev_router
# 1. Aquí le ponemos el nombre "auth_router"
from .routers.auth_routes import router as auth_router
from .routers.programs import router as programs_router
from .routers.lecturers import router as lecturers_router
from .routers.modules import router as modules_router
from .routers.specializations import router as specializations_router
from .routers.groups import router as groups_router
from .routers.rooms import router as rooms_router
from .routers.constraints import router as constraints_router
from .routers.availabilities import router as availabilities_router
from .routers.semesters import router as semesters_router

# TUS ROUTERS NUEVOS:
from .routers.offered_modules import router as offered_modules_router
from .routers.schedule import router as schedule_router

# Crear tablas
try:
    models.Base.metadata.create_all(bind=engine)
    print("✅ DB connected.")
except Exception as e:
    print("❌ DB Startup Error:", e)

app = FastAPI(title="Study Program Backend", root_path="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Backend Online"}

@app.get("/version")
def check_version():
    return {
        "status": "VERSION LISTA PARA CALENDARIO",
        "timestamp": str(datetime.datetime.now())
    }

# --- CONECTAMOS LOS ROUTERS ---
app.include_router(dev_router)
# 2. ✅ CORREGIDO: Usamos el nombre correcto "auth_router"
app.include_router(auth_router)
app.include_router(programs_router)
app.include_router(lecturers_router)
app.include_router(modules_router)
app.include_router(specializations_router)
app.include_router(groups_router)
app.include_router(rooms_router)
app.include_router(constraints_router)
app.include_router(availabilities_router)
app.include_router(semesters_router)

# ACTIVAMOS TUS FUNCIONALIDADES:
app.include_router(offered_modules_router)
app.include_router(schedule_router)