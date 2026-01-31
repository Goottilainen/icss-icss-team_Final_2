from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey, Text, CheckConstraint, JSON, TIMESTAMP
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql import func

Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(200), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)  # admin, pm, hosp, lecturer, student
    lecturer_id = Column(Integer, ForeignKey("lecturers.ID"), nullable=True)

    lecturer_profile = relationship("Lecturer")


class Lecturer(Base):
    __tablename__ = "lecturers"
    id = Column("ID", Integer, primary_key=True, index=True)
    first_name = Column(String(200), nullable=False)
    last_name = Column(String(200), nullable=True)
    title = Column(String(50), nullable=False)
    employment_type = Column(String(50), nullable=False)
    personal_email = Column(String(200), nullable=True)
    mdh_email = Column(String(200), nullable=True)
    phone = Column(String(50), nullable=True)
    location = Column(String(200), nullable=True)
    teaching_load = Column(String(100), nullable=True)


class StudyProgram(Base):
    __tablename__ = "study_programs"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    acronym = Column(String, nullable=False)
    # head_of_program column REMOVED (Data Normalization)
    status = Column(Boolean, default=True)
    start_date = Column(String, nullable=False)
    total_ects = Column(Integer, nullable=False)
    location = Column(String(200), nullable=True)
    level = Column(String(50), default="Bachelor")
    degree_type = Column(String, nullable=True)

    head_of_program_id = Column(Integer, ForeignKey("lecturers.ID"), nullable=True)

    # Relationship to fetch the name dynamically
    head_lecturer = relationship("Lecturer")


class Module(Base):
    __tablename__ = "modules"
    module_code = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    ects = Column(Integer, nullable=False)
    room_type = Column(String, nullable=False)  # seminar_room, lecture_hall, computer_lab
    assessment_type = Column(String, nullable=True)
    semester = Column(Integer, nullable=False)
    category = Column(String, nullable=True)
    program_id = Column(Integer, ForeignKey("study_programs.id"), nullable=True)

    specializations = relationship("Specialization", secondary="module_specializations", back_populates="modules")


class Specialization(Base):
    __tablename__ = "specializations"
    id = Column(Integer, primary_key=True, index=True)
    program_id = Column(Integer, ForeignKey("study_programs.id"))  # Parent Program
    name = Column(String, nullable=False)
    acronym = Column(String, nullable=False)
    start_date = Column(String, nullable=False)
    status = Column(Boolean, default=True)
    study_program = Column(String, nullable=True)  # Redundant name copy, can be kept or removed

    modules = relationship("Module", secondary="module_specializations", back_populates="specializations")


class ModuleSpecialization(Base):
    __tablename__ = "module_specializations"
    module_code = Column(String, ForeignKey("modules.module_code", ondelete="CASCADE"), primary_key=True)
    specialization_id = Column(Integer, ForeignKey("specializations.id", ondelete="CASCADE"), primary_key=True)


class Group(Base):
    __tablename__ = "groups"
    id = Column(Integer, primary_key=True, index=True)
    name = Column("Name", String(100), nullable=False)
    size = Column("Size", Integer, nullable=False)
    description = Column("Brief description", String(250), nullable=True)
    email = Column("Email", String(200), nullable=True)
    program = Column("Program", String, nullable=True)
    parent_group = Column("Parent_Group", String, nullable=True)


class Room(Base):
    __tablename__ = "rooms"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    capacity = Column(Integer, nullable=False)
    type = Column(String, nullable=False)
    status = Column(Boolean, default=True, nullable=False)
    equipment = Column("Equipment", String, nullable=True)
    location = Column(String(200), nullable=True)


class LecturerAvailability(Base):
    __tablename__ = "lecturer_availabilities"
    id = Column(Integer, primary_key=True, index=True)
    lecturer_id = Column(Integer, ForeignKey("lecturers.ID", ondelete="CASCADE"), unique=True, nullable=False)
    schedule_data = Column(JSON, default={}, nullable=False)  # Stores the grid (days/slots)


class ConstraintType(Base):
    __tablename__ = "constraint_types"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(80), unique=True, nullable=False)
    active = Column(Boolean, default=True, nullable=False)
    constraint_level = Column(String)
    constraint_format = Column(String)
    valid_from = Column(Date, nullable=True)
    valid_to = Column(Date, nullable=True)
    constraint_rule = Column(Text, nullable=True)
    constraint_target = Column(String, nullable=True)


class SchedulerConstraint(Base):
    __tablename__ = "scheduler_constraints"
    id = Column(Integer, primary_key=True, index=True)
    constraint_type_id = Column(Integer, ForeignKey("constraint_types.id"), nullable=False)
    hardness = Column(String(10), nullable=False)  # soft / hard
    weight = Column(Integer, nullable=True)
    scope = Column(String(20), nullable=False)  # global, program, lecturer, etc.
    target_id = Column(Integer, nullable=True)
    config = Column(JSON, default={}, nullable=False)
    is_enabled = Column(Boolean, default=True, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)