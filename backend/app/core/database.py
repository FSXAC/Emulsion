"""Database connection and session management."""

from typing import Generator
from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker, Session

from app.core.config import settings
from app.models.base import Base


# Enable foreign key constraints for SQLite
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_conn, connection_record):
    """Enable foreign key constraints for SQLite connections."""
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


# Create SQLite engine
# - check_same_thread=False is needed for FastAPI's async nature
# - echo=True for development (shows SQL queries in console)
engine = create_engine(
    settings.get_sqlalchemy_database_url(),
    connect_args={"check_same_thread": False},
    echo=settings.debug,  # Log SQL queries in debug mode
)

# Create session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db() -> Generator[Session, None, None]:
    """
    Dependency function to get database session.
    
    Use this in FastAPI endpoints with Depends(get_db) to get a database session.
    The session is automatically closed after the request completes.
    
    Yields:
        Database session
        
    Example:
        @app.get("/rolls")
        def get_rolls(db: Session = Depends(get_db)):
            return db.query(FilmRoll).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """
    Initialize database by creating all tables.
    
    This should be called on application startup to ensure all tables exist.
    In production, use Alembic migrations instead.
    
    Note: This only creates tables that don't exist yet. It won't modify existing tables.
    """
    # Import models to ensure they're registered with Base
    from app.models import FilmRoll, ChemistryBatch
    
    # Ensure database directory exists
    settings.get_database_path()
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
