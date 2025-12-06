"""Application configuration settings."""

from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    
    Database configuration defaults to SQLite in ~/emulsion_data/emulsion.db
    for easy local deployment and backups.
    """
    
    # Application
    app_name: str = "Emulsion API"
    app_version: str = "0.1.0"
    debug: bool = True
    
    # Database - use absolute path to avoid issues with working directory
    # Default to backend/data/emulsion.db
    database_url: str = "sqlite:///" + str(Path(__file__).parent.parent.parent / "data" / "emulsion.db")
    
    # CORS - Allow all local origins (for development and production)
    # In production on same origin (localhost:8000), CORS is not needed
    # But this allows dev server and network access
    cors_origins: list[str] = [
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative dev server
        "http://localhost:8000",  # Production server
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
        "*",  # Allow all origins for local network access
    ]
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )
    
    def get_database_path(self) -> Path:
        """
        Get the resolved database file path.
        
        Resolves relative paths to absolute and creates parent directories.
        
        Returns:
            Absolute path to database file
        """
        # Remove sqlite:/// prefix and ./ if present
        db_path_str = self.database_url.replace("sqlite:///", "").lstrip("./")
        
        # Resolve to absolute path
        db_path = Path(db_path_str).resolve()
        
        # Create parent directory if it doesn't exist
        db_path.parent.mkdir(parents=True, exist_ok=True)
        
        return db_path
    
    def get_sqlalchemy_database_url(self) -> str:
        """
        Get SQLAlchemy-compatible database URL.
        
        For relative paths, keeps them relative for SQLite.
        For absolute paths, uses absolute path.
        
        Returns:
            Properly formatted SQLite URL
        """
        # Keep the URL as-is for relative paths (SQLite handles ./data correctly)
        return self.database_url


# Global settings instance
settings = Settings()
