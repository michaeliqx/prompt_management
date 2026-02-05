"""
图片管理路由
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Prompt, PromptImage
from app.schemas import PromptImageResponse, MessageResponse
from app.utils import save_upload_file, delete_file
from app.config import settings

router = APIRouter()

ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif"]

@router.post("/{prompt_id}", response_model=PromptImageResponse)
async def upload_image(
    prompt_id: int,
    file: UploadFile = File(...),
    sort_order: int = 0,
    db: Session = Depends(get_db)
):
    """上传Prompt效果图"""
    # 验证Prompt是否存在
    prompt = db.query(Prompt).filter(
        Prompt.id == prompt_id,
        Prompt.deleted_at.is_(None)
    ).first()
    
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt不存在")
    
    # 验证文件类型
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="不支持的文件类型，仅支持JPG、PNG、GIF")
    
    # 验证文件大小
    file_content = await file.read()
    if len(file_content) > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail=f"文件大小超过限制（最大{settings.MAX_FILE_SIZE // 1024 // 1024}MB）")
    
    # 重置文件指针
    file.file.seek(0)
    
    # 保存文件
    file_info = save_upload_file(file, prompt_id)
    
    # 创建数据库记录
    image = PromptImage(
        prompt_id=prompt_id,
        file_path=file_info["file_path"],
        file_name=file_info["file_name"],
        file_size=file_info["file_size"],
        file_type=file_info["file_type"],
        sort_order=sort_order
    )
    
    db.add(image)
    db.commit()
    db.refresh(image)
    
    return PromptImageResponse.model_validate(image)

@router.get("/{image_id}", response_model=PromptImageResponse)
async def get_image(image_id: int, db: Session = Depends(get_db)):
    """获取图片信息"""
    image = db.query(PromptImage).filter(PromptImage.id == image_id).first()
    
    if not image:
        raise HTTPException(status_code=404, detail="图片不存在")
    
    return PromptImageResponse.model_validate(image)

@router.delete("/{image_id}", response_model=MessageResponse)
async def delete_image(image_id: int, db: Session = Depends(get_db)):
    """删除图片"""
    image = db.query(PromptImage).filter(PromptImage.id == image_id).first()
    
    if not image:
        raise HTTPException(status_code=404, detail="图片不存在")
    
    file_path = image.file_path
    
    # 删除数据库记录
    db.delete(image)
    db.commit()
    
    # 删除文件
    delete_file(file_path)
    
    return MessageResponse(message="删除成功")
