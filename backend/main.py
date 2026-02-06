"""
Prompt管理工具 - 后端主入口
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os
import logging
from dotenv import load_dotenv
from pathlib import Path

from app.database import engine, Base
from app.routers import prompts, groups, tags, search, images
from app.config import settings

# 配置日志
import logging.handlers
from pathlib import Path

# 创建日志目录
log_dir = Path("logs")
log_dir.mkdir(exist_ok=True)

# 配置日志格式
log_format = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# 配置根日志记录器
root_logger = logging.getLogger()
root_logger.setLevel(logging.INFO)

# 控制台处理器 - 只显示 WARNING 及以上级别
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.WARNING)
console_handler.setFormatter(log_format)
root_logger.addHandler(console_handler)

# 文件处理器 - 记录所有 INFO 及以上级别
file_handler = logging.handlers.RotatingFileHandler(
    filename=log_dir / "app.log",
    maxBytes=10*1024*1024,  # 10MB
    backupCount=5,
    encoding='utf-8'
)
file_handler.setLevel(logging.INFO)
file_handler.setFormatter(log_format)
root_logger.addHandler(file_handler)

# 设置 SQLAlchemy 引擎日志级别为 WARNING（只记录错误）
logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)
logging.getLogger('sqlalchemy.pool').setLevel(logging.WARNING)
logging.getLogger('sqlalchemy.dialects').setLevel(logging.WARNING)

logger = logging.getLogger(__name__)

# 加载环境变量
load_dotenv()

# 创建数据库表
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时创建表
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("数据库连接成功，表创建完成")
    except Exception as e:
        logger.error(f"数据库连接失败: {e}")
        logger.warning("应用将在无数据库连接的情况下启动，相关API功能可能不可用")
        logger.warning("请检查数据库配置：DATABASE_URL、用户名、密码等")
    yield
    # 关闭时清理（如果需要）

app = FastAPI(
    title="Prompt管理工具 API",
    description="Prompt管理工具后端API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS配置
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(prompts.router, prefix="/api/v1/prompts", tags=["prompts"])
app.include_router(groups.router, prefix="/api/v1/groups", tags=["groups"])
app.include_router(tags.router, prefix="/api/v1/tags", tags=["tags"])
app.include_router(search.router, prefix="/api/v1/search", tags=["search"])
app.include_router(images.router, prefix="/api/v1/images", tags=["images"])

# 静态文件服务 - 提供上传的图片
# 注意：必须在路由注册之后，避免覆盖API路由
# 获取项目根目录（backend目录的父目录）
backend_dir = Path(__file__).parent.absolute()
project_root = backend_dir.parent
# 创建上传目录
upload_dir = project_root / settings.UPLOAD_DIR
upload_dir.mkdir(parents=True, exist_ok=True)
# 挂载uploads目录，这样/uploads/images/xxx可以访问到uploads/images/xxx文件
# StaticFiles的mount会去掉URL前缀，所以挂载/uploads到uploads目录
app.mount("/uploads", StaticFiles(directory=str(project_root / "uploads")), name="uploads")

@app.get("/")
async def root():
    return {"message": "Prompt管理工具 API", "version": "1.0.0"}

@app.get("/health")
async def health():
    """健康检查端点，检查数据库连接状态"""
    db_status = "unknown"
    try:
        with engine.connect() as conn:
            conn.execute("SELECT 1")
            db_status = "connected"
    except Exception as e:
        db_status = f"disconnected: {str(e)}"
    
    return {
        "status": "ok",
        "database": db_status
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
