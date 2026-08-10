"""
GeoGuard AI - Backend Configuration
"""
from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import Optional
import json


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "GeoGuard AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    API_PREFIX: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./geoguard.db"
    MONGODB_URL: str = "mongodb://localhost:27017/geoguard_db"
    MONGODB_DB_NAME: str = "geoguard_db"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # JWT Auth
    JWT_SECRET_KEY: str = "geoguard-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS
    CORS_ORIGINS: list[str] | str | None = ["http://localhost:5173", "http://localhost:3000"]
    
    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: str | list[str] | None) -> list[str]:
        if v is None:
            return ["*"]
        if isinstance(v, str):
            v_str = v.strip()
            if v_str.startswith("[") and v_str.endswith("]"):
                try:
                    parsed = json.loads(v_str)
                    if isinstance(parsed, list):
                        return [str(item) for item in parsed]
                except Exception:
                    pass
            if v_str == "*":
                return ["*"]
            return [i.strip() for i in v_str.split(",") if i.strip()]
        return [str(item) for item in v]
    
    # External APIs
    OPENWEATHER_API_KEY: Optional[str] = None
    NASA_EARTHDATA_TOKEN: Optional[str] = None
    
    # ML Models
    MODEL_DIR: str = "./ml/models"
    
    # File Storage
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 10
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
