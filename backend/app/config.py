"""
应用配置
"""
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator
from typing import List, Union
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # 服务器配置
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ENVIRONMENT: str = "development"
    
    # 安全配置
    SECRET_KEY: str = "your-secret-key-change-this-in-production"
    
    # 数据库配置
    DATABASE_URL: str = "postgresql://prompt_user:PromptDb2024!@60.171.65.125:34049/prompt_db"
    
    # Redis配置
    REDIS_HOST: str = "60.171.65.125"
    REDIS_PORT: int = 34048
    REDIS_PASSWORD: str = "MuseRedis2024!"
    REDIS_DB: int = 2
    
    # CORS配置 - 从环境变量读取逗号分隔的字符串
    # 注意：pydantic-settings 会将环境变量作为字符串读取，需要使用 validator 转换
    CORS_ORIGINS: str = Field(default="http://localhost:5173")
    
    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> str:
        """处理 CORS_ORIGINS，确保返回字符串"""
        if isinstance(v, list):
            return ",".join(v)
        if isinstance(v, str):
            return v
        return str(v)
    
    def get_cors_origins_list(self) -> List[str]:
        """获取CORS来源列表"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
    
    # 文件上传配置
    UPLOAD_DIR: str = "uploads/images"
    MAX_FILE_SIZE: int = 5242880  # 5MB
    
    # 日志配置
    LOG_LEVEL: str = "INFO"
    LOG_DIR: str = "logs"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
