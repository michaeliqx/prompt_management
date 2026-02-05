"""
Prompt管理工具 - 后端主入口
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from app.database import engine, Base
from app.routers import prompts, groups, tags, search, images

# 加载环境变量
load_dotenv()

# 创建数据库表
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时创建表
    Base.metadata.create_all(bind=engine)
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

@app.get("/")
async def root():
    return {"message": "Prompt管理工具 API", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
