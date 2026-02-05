"""
分组管理路由
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import PromptGroup, Prompt
from app.schemas import PromptGroupCreate, PromptGroupUpdate, PromptGroupResponse, MessageResponse

router = APIRouter()

@router.get("", response_model=List[PromptGroupResponse])
async def get_groups(db: Session = Depends(get_db)):
    """获取分组列表"""
    groups = db.query(PromptGroup).order_by(PromptGroup.sort_order, PromptGroup.created_at).all()
    return [PromptGroupResponse.model_validate(group) for group in groups]

@router.post("", response_model=PromptGroupResponse)
async def create_group(group_data: PromptGroupCreate, db: Session = Depends(get_db)):
    """创建分组"""
    # 检查名称是否已存在
    existing = db.query(PromptGroup).filter(PromptGroup.name == group_data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="分组名称已存在")
    
    group = PromptGroup(
        name=group_data.name,
        description=group_data.description,
        sort_order=group_data.sort_order or 0
    )
    
    db.add(group)
    db.commit()
    db.refresh(group)
    
    return PromptGroupResponse.model_validate(group)

@router.put("/{group_id}", response_model=PromptGroupResponse)
async def update_group(
    group_id: int,
    group_data: PromptGroupUpdate,
    db: Session = Depends(get_db)
):
    """更新分组"""
    group = db.query(PromptGroup).filter(PromptGroup.id == group_id).first()
    
    if not group:
        raise HTTPException(status_code=404, detail="分组不存在")
    
    # 检查名称是否与其他分组冲突
    if group_data.name and group_data.name != group.name:
        existing = db.query(PromptGroup).filter(PromptGroup.name == group_data.name).first()
        if existing:
            raise HTTPException(status_code=400, detail="分组名称已存在")
        group.name = group_data.name
    
    if group_data.description is not None:
        group.description = group_data.description
    if group_data.sort_order is not None:
        group.sort_order = group_data.sort_order
    
    db.commit()
    db.refresh(group)
    
    return PromptGroupResponse.model_validate(group)

@router.delete("/{group_id}", response_model=MessageResponse)
async def delete_group(group_id: int, db: Session = Depends(get_db)):
    """删除分组"""
    group = db.query(PromptGroup).filter(PromptGroup.id == group_id).first()
    
    if not group:
        raise HTTPException(status_code=404, detail="分组不存在")
    
    # 检查是否有关联的Prompt
    prompt_count = db.query(Prompt).filter(
        Prompt.group_id == group_id,
        Prompt.deleted_at.is_(None)
    ).count()
    
    if prompt_count > 0:
        raise HTTPException(status_code=400, detail=f"该分组下还有{prompt_count}个Prompt，无法删除")
    
    db.delete(group)
    db.commit()
    
    return MessageResponse(message="删除成功")
