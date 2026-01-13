import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload

import models
import schemas
from database import engine, get_db

USE_MOCK_DB = os.getenv("USE_MOCK_DB", "true").lower() == "true"

app = FastAPI(title="Study Program Backend")

# ✅ CORS: sin "*" si usas allow_credentials=True
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://172.21.252.23:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("Backend started | USE_MOCK_DB =", USE_MOCK_DB)

# SOLO crear tablas si estás en DB real
if not USE_MOCK_DB:
    try:
        models.Base.metadata.create_all(bind=engine)
        print("Tables created/verified in real DB")
    except Exception as e:
        print("DB connection failed on startup:", e)


def get_db_safe():
    if USE_MOCK_DB:
        yield None
        return
    yield from get_db()


@app.get("/")
def root():
    return {"message": "Study Program Backend Online", "mock_mode": USE_MOCK_DB}


# =========================
# STUDY PROGRAMS (CRUD)
# =========================
@app.get("/study-programs/", response_model=list[schemas.StudyProgramResponse])
def read_programs(db: Session = Depends(get_db_safe)):
    if USE_MOCK_DB:
        return []
    return (
        db.query(models.StudyProgram)
        .options(joinedload(models.StudyProgram.specializations))
        .all()
    )


@app.post("/study-programs/", response_model=schemas.StudyProgramResponse)
def create_program(program: schemas.StudyProgramCreate, db: Session = Depends(get_db_safe)):
    if USE_MOCK_DB:
        return {**program.model_dump(), "id": 1, "specializations": []}
    db_program = models.StudyProgram(**program.model_dump())
    db.add(db_program)
    db.commit()
    db.refresh(db_program)
    return db_program


@app.put("/study-programs/{program_id}", response_model=schemas.StudyProgramResponse)
def update_program(program_id: int, program: schemas.StudyProgramCreate, db: Session = Depends(get_db_safe)):
    if USE_MOCK_DB:
        raise HTTPException(status_code=400, detail="Mock mode: update disabled")
    db_program = db.query(models.StudyProgram).filter(models.StudyProgram.id == program_id).first()
    if not db_program:
        raise HTTPException(status_code=404, detail="Program not found")
    for k, v in program.model_dump().items():
        setattr(db_program, k, v)
    db.commit()
    db.refresh(db_program)
    return db_program


@app.delete("/study-programs/{program_id}")
def delete_program(program_id: int, db: Session = Depends(get_db_safe)):
    if USE_MOCK_DB:
        raise HTTPException(status_code=400, detail="Mock mode: delete disabled")
    db_program = db.query(models.StudyProgram).filter(models.StudyProgram.id == program_id).first()
    if not db_program:
        raise HTTPException(status_code=404, detail="Program not found")
    db.delete(db_program)
    db.commit()
    return {"ok": True}


# =========================
# MODULES (CRUD)
# =========================
@app.get("/modules/", response_model=list[schemas.ModuleResponse])
def read_modules(db: Session = Depends(get_db_safe)):
    if USE_MOCK_DB:
        return []
    return db.query(models.Module).all()


@app.post("/modules/", response_model=schemas.ModuleResponse)
def create_module(module: schemas.ModuleCreate, db: Session = Depends(get_db_safe)):
    if USE_MOCK_DB:
        return {**module.model_dump(), "module_id": 1}
    db_module = models.Module(**module.model_dump())
    db.add(db_module)
    db.commit()
    db.refresh(db_module)
    return db_module


@app.put("/modules/{module_id}", response_model=schemas.ModuleResponse)
def update_module(module_id: int, module: schemas.ModuleCreate, db: Session = Depends(get_db_safe)):
    if USE_MOCK_DB:
        raise HTTPException(status_code=400, detail="Mock mode: update disabled")
    db_module = db.query(models.Module).filter(models.Module.module_id == module_id).first()
    if not db_module:
        raise HTTPException(status_code=404, detail="Module not found")
    for k, v in module.model_dump().items():
        setattr(db_module, k, v)
    db.commit()
    db.refresh(db_module)
    return db_module


@app.delete("/modules/{module_id}")
def delete_module(module_id: int, db: Session = Depends(get_db_safe)):
    if USE_MOCK_DB:
        raise HTTPException(status_code=400, detail="Mock mode: delete disabled")
    db_module = db.query(models.Module).filter(models.Module.module_id == module_id).first()
    if not db_module:
        raise HTTPException(status_code=404, detail="Module not found")
    db.delete(db_module)
    db.commit()
    return {"ok": True}


# =========================
# LECTURERS (CRUD)
# =========================
@app.get("/lecturers/", response_model=list[schemas.LecturerResponse])
def read_lecturers(db: Session = Depends(get_db_safe)):
    if USE_MOCK_DB:
        return []
    return db.query(models.Lecturer).all()


@app.post("/lecturers/", response_model=schemas.LecturerResponse)
def create_lecturer(lecturer: schemas.LecturerCreate, db: Session = Depends(get_db_safe)):
    if USE_MOCK_DB:
        return {**lecturer.model_dump(), "id": 1}
    db_lecturer = models.Lecturer(**lecturer.model_dump())
    db.add(db_lecturer)
    db.commit()
    db.refresh(db_lecturer)
    return db_lecturer


@app.put("/lecturers/{lecturer_id}", response_model=schemas.LecturerResponse)
def update_lecturer(lecturer_id: int, lecturer: schemas.LecturerCreate, db: Session = Depends(get_db_safe)):
    if USE_MOCK_DB:
        raise HTTPException(status_code=400, detail="Mock mode: update disabled")
    row = db.query(models.Lecturer).filter(models.Lecturer.id == lecturer_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Lecturer not found")
    for k, v in lecturer.model_dump().items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return row


@app.delete("/lecturers/{lecturer_id}")
def delete_lecturer(lecturer_id: int, db: Session = Depends(get_db_safe)):
    if USE_MOCK_DB:
        raise HTTPException(status_code=400, detail="Mock mode: delete disabled")
    row = db.query(models.Lecturer).filter(models.Lecturer.id == lecturer_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Lecturer not found")
    db.delete(row)
    db.commit()
    return {"ok": True}


# =========================
# GROUPS (CRUD)
# =========================
@app.get("/groups/", response_model=list[schemas.GroupResponse])
def read_groups(db: Session = Depends(get_db_safe)):
    if USE_MOCK_DB:
        return []
    return db.query(models.Group).all()


@app.post("/groups/", response_model=schemas.GroupResponse)
def create_group(group: schemas.GroupCreate, db: Session = Depends(get_db_safe)):
    if USE_MOCK_DB:
        return {**group.model_dump(), "id": 1}
    row = models.Group(**group.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@app.put("/groups/{group_id}", response_model=schemas.GroupResponse)
def update_group(group_id: int, group: schemas.GroupCreate, db: Session = Depends(get_db_safe)):
    if USE_MOCK_DB:
        raise HTTPException(status_code=400, detail="Mock mode: update disabled")
    row = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Group not found")
    for k, v in group.model_dump().items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return row


@app.delete("/groups/{group_id}")
def delete_group(group_id: int, db: Session = Depends(get_db_safe)):
    if USE_MOCK_DB:
        raise HTTPException(status_code=400, detail="Mock mode: delete disabled")
    row = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Group not found")
    db.delete(row)
    db.commit()
    return {"ok": True}


# =========================================================
# SCHEDULER CONSTRAINTS (CRUD)
# =========================================================

@app.get("/constraint-types/", response_model=list[schemas.ConstraintTypeResponse])
def read_constraint_types(db: Session = Depends(get_db_safe)):
    if USE_MOCK_DB:
        return []
    return db.query(models.ConstraintType).order_by(models.ConstraintType.id.asc()).all()


@app.get("/rooms/", response_model=list[schemas.RoomResponse])
def read_rooms(db: Session = Depends(get_db_safe)):
    if USE_MOCK_DB:
        return []
    return db.query(models.Room).order_by(models.Room.id.asc()).all()


@app.get("/scheduler-constraints/", response_model=list[schemas.SchedulerConstraintResponse])
def read_scheduler_constraints(db: Session = Depends(get_db_safe)):
    if USE_MOCK_DB:
        return []
    return db.query(models.SchedulerConstraint).order_by(models.SchedulerConstraint.id.asc()).all()


@app.post("/scheduler-constraints/", response_model=schemas.SchedulerConstraintResponse)
def create_scheduler_constraint(
    payload: schemas.SchedulerConstraintCreate,
    db: Session = Depends(get_db_safe),
):
    if USE_MOCK_DB:
        return {**payload.model_dump(), "id": 1}

    ct = db.query(models.ConstraintType).filter(models.ConstraintType.id == payload.constraint_type_id).first()
    if not ct:
        raise HTTPException(status_code=400, detail="constraint_type_id does not exist")

    row = models.SchedulerConstraint(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@app.put("/scheduler-constraints/{constraint_id}", response_model=schemas.SchedulerConstraintResponse)
def update_scheduler_constraint(
    constraint_id: int,
    payload: schemas.SchedulerConstraintCreate,
    db: Session = Depends(get_db_safe),
):
    if USE_MOCK_DB:
        raise HTTPException(status_code=400, detail="Mock mode: update disabled")

    row = db.query(models.SchedulerConstraint).filter(models.SchedulerConstraint.id == constraint_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Scheduler constraint not found")

    ct = db.query(models.ConstraintType).filter(models.ConstraintType.id == payload.constraint_type_id).first()
    if not ct:
        raise HTTPException(status_code=400, detail="constraint_type_id does not exist")

    for k, v in payload.model_dump().items():
        setattr(row, k, v)

    db.commit()
    db.refresh(row)
    return row


@app.delete("/scheduler-constraints/{constraint_id}")
def delete_scheduler_constraint(
    constraint_id: int,
    db: Session = Depends(get_db_safe),
):
    if USE_MOCK_DB:
        raise HTTPException(status_code=400, detail="Mock mode: delete disabled")

    row = db.query(models.SchedulerConstraint).filter(models.SchedulerConstraint.id == constraint_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Scheduler constraint not found")

    db.delete(row)
    db.commit()
    return {"ok": True}
