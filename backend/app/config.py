"""
应用配置
"""
from pydantic_settings import BaseSettings
from typing import List
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # 服务器配置
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ENVIRONMENT: str = "development"
    
    # 数据库配置
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://prompt_user:PromptDb2024!@60.171.65.125:34049/prompt_db")
    
    # Redis配置
    REDIS_HOST: str = os.getenv("REDIS_HOST", "60.171.65.125")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "34048"))
    REDIS_PASSWORD: str = os.getenv("REDIS_PASSWORD", "MuseRedis2024!")
    REDIS_DB: int = int(os.getenv("REDIS_DB", "2"))
    
    # CORS配置
    CORS_ORIGINS: List[str] = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    
    # 文件上传配置
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads/images")
    MAX_FILE_SIZE: int = int(os.getenv("MAX_FILE_SIZE", "5242880"))  # 5MB
    
    # 日志配置
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_DIR: str = os.getenv("LOG_DIR", "logs")
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
