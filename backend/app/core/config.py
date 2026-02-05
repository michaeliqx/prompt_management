"""
应用配置
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # 基础配置
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ENVIRONMENT: str = "development"
    
    # 安全配置
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    SECRET_KEY: str = "your-secret-key-change-this-in-production"
    
    # 数据库配置
    DATABASE_URL: str = "postgresql://prompt_user:PromptDb2024!@60.171.65.125:34049/prompt_db"
    
    # Redis配置
    REDIS_HOST: str = "60.171.65.125"
    REDIS_PORT: int = 34048
    REDIS_PASSWORD: str = "MuseRedis2024!"
    REDIS_DB: int = 2
    
    # 文件上传配置
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE: int = 5242880  # 5MB
    
    # 日志配置
    LOG_LEVEL: str = "INFO"
    LOG_DIR: str = "logs"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
