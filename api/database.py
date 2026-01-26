import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

# Get URL from environment (Vercel Settings)
raw_url = os.getenv("DATABASE_URL")

# Safe check to prevent crashes during build if variable is missing
if not raw_url:
    # We set a dummy URL for build time, or raise error only at runtime
    print("WARNING: DATABASE_URL not set. App will crash if DB is accessed.")
    db_url = "sqlite:///./build_dummy.db"
else:
    # Postgres compatibility for SQLAlchemy
    db_url = raw_url.replace("postgres://", "postgresql://", 1)

# Create engine
# SSL is required for Neon
engine = create_engine(
    db_url,
    pool_pre_ping=True,
    connect_args={"sslmode": "require"} if "postgresql" in db_url else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()