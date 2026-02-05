"""
标签管理路由
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import PromptTag
from app.schemas import PromptTagCreate, PromptTagUpdate, PromptTagResponse, MessageResponse

router = APIRouter()

@router.get("", response_model=List[PromptTagResponse])
async def get_tags(db: Session = Depends(get_db)):
    """获取标签列表"""
    tags = db.query(PromptTag).order_by(PromptTag.created_at).all()
    return [PromptTagResponse.model_validate(tag) for tag in tags]

@router.post("", response_model=PromptTagResponse)
async def create_tag(tag_data: PromptTagCreate, db: Session = Depends(get_db)):
    """创建标签"""
    # 检查名称是否已存在
    existing = db.query(PromptTag).filter(PromptTag.name == tag_data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="标签名称已存在")
    
    tag = PromptTag(
        name=tag_data.name,
        color=tag_data.color or "#1890ff"
    )
    
    db.add(tag)
    db.commit()
    db.refresh(tag)
    
    return PromptTagResponse.model_validate(tag)

@router.put("/{tag_id}", response_model=PromptTagResponse)
async def update_tag(
    tag_id: int,
    tag_data: PromptTagUpdate,
    db: Session = Depends(get_db)
):
    """更新标签"""
    tag = db.query(PromptTag).filter(PromptTag.id == tag_id).first()
    
    if not tag:
        raise HTTPException(status_code=404, detail="标签不存在")
    
    # 检查名称是否与其他标签冲突
    if tag_data.name and tag_data.name != tag.name:
        existing = db.query(PromptTag).filter(PromptTag.name == tag_data.name).first()
        if existing:
            raise HTTPException(status_code=400, detail="标签名称已存在")
        tag.name = tag_data.name
    
    if tag_data.color is not None:
        tag.color = tag_data.color
    
    db.commit()
    db.refresh(tag)
    
    return PromptTagResponse.model_validate(tag)

@router.delete("/{tag_id}", response_model=MessageResponse)
async def delete_tag(tag_id: int, db: Session = Depends(get_db)):
    """删除标签"""
    tag = db.query(PromptTag).filter(PromptTag.id == tag_id).first()
    
    if not tag:
        raise HTTPException(status_code=404, detail="标签不存在")
    
    db.delete(tag)
    db.commit()
    
    return MessageResponse(message="删除成功")
