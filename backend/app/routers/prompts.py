"""
Prompt管理路由
"""
from fastapi import APIRouter, Depends, HTTPException, Query, File, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import List, Optional
from app.database import get_db
from app.models import Prompt, PromptGroup, PromptTag, PromptImage
from app.schemas import (
    PromptCreate, PromptUpdate, PromptResponse, PromptListResponse,
    PromptListItem, MessageResponse
)
from app.utils import save_upload_file
import os
from app.config import settings

router = APIRouter()

@router.get("", response_model=PromptListResponse)
async def get_prompts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    group_id: Optional[int] = None,
    tag_id: Optional[int] = None,
    keyword: Optional[str] = None,
    sort_by: str = Query("created_at", regex="^(created_at|updated_at|usage_count|name)$"),
    order: str = Query("desc", regex="^(asc|desc)$"),
    db: Session = Depends(get_db)
):
    """获取Prompt列表"""
    query = db.query(Prompt).filter(Prompt.deleted_at.is_(None))
    
    # 分组筛选
    if group_id is not None:
        if group_id == 0:
            # group_id=0 表示查询未分组的prompts
            query = query.filter(Prompt.group_id.is_(None))
        else:
            query = query.filter(Prompt.group_id == group_id)
    
    # 标签筛选
    if tag_id:
        query = query.join(Prompt.tags).filter(PromptTag.id == tag_id)
    
    # 关键词搜索
    if keyword:
        keyword_pattern = f"%{keyword}%"
        query = query.filter(
            or_(
                Prompt.name.ilike(keyword_pattern),
                Prompt.content.ilike(keyword_pattern),
                Prompt.description.ilike(keyword_pattern)
            )
        )
    
    # 排序
    if sort_by == "name":
        order_by = Prompt.name.asc() if order == "asc" else Prompt.name.desc()
    elif sort_by == "usage_count":
        order_by = Prompt.usage_count.asc() if order == "asc" else Prompt.usage_count.desc()
    elif sort_by == "updated_at":
        order_by = Prompt.updated_at.asc() if order == "asc" else Prompt.updated_at.desc()
    else:  # created_at
        order_by = Prompt.created_at.asc() if order == "asc" else Prompt.created_at.desc()
    
    query = query.order_by(order_by)
    
    # 总数
    total = query.count()
    
    # 分页
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    
    return PromptListResponse(
        items=[PromptListItem.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size
    )

@router.get("/{prompt_id}", response_model=PromptResponse)
async def get_prompt(prompt_id: int, db: Session = Depends(get_db)):
    """获取Prompt详情"""
    prompt = db.query(Prompt).filter(
        Prompt.id == prompt_id,
        Prompt.deleted_at.is_(None)
    ).first()
    
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt不存在")
    
    return PromptResponse.model_validate(prompt)

@router.post("", response_model=PromptResponse)
async def create_prompt(
    prompt_data: PromptCreate,
    db: Session = Depends(get_db)
):
    """创建Prompt"""
    # 验证分组是否存在
    if prompt_data.group_id:
        group = db.query(PromptGroup).filter(PromptGroup.id == prompt_data.group_id).first()
        if not group:
            raise HTTPException(status_code=400, detail="分组不存在")
    
    # 验证标签是否存在
    if prompt_data.tag_ids:
        tags = db.query(PromptTag).filter(PromptTag.id.in_(prompt_data.tag_ids)).all()
        if len(tags) != len(prompt_data.tag_ids):
            raise HTTPException(status_code=400, detail="部分标签不存在")
    
    # 创建Prompt
    prompt = Prompt(
        name=prompt_data.name,
        content=prompt_data.content,
        description=prompt_data.description,
        group_id=prompt_data.group_id
    )
    
    db.add(prompt)
    db.flush()  # 获取prompt.id
    
    # 关联标签
    if prompt_data.tag_ids:
        prompt.tags = tags
    
    db.commit()
    db.refresh(prompt)
    
    return PromptResponse.model_validate(prompt)

@router.put("/{prompt_id}", response_model=PromptResponse)
async def update_prompt(
    prompt_id: int,
    prompt_data: PromptUpdate,
    db: Session = Depends(get_db)
):
    """更新Prompt"""
    prompt = db.query(Prompt).filter(
        Prompt.id == prompt_id,
        Prompt.deleted_at.is_(None)
    ).first()
    
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt不存在")
    
    # 更新字段
    if prompt_data.name is not None:
        prompt.name = prompt_data.name
    if prompt_data.content is not None:
        prompt.content = prompt_data.content
    if prompt_data.description is not None:
        prompt.description = prompt_data.description
    if prompt_data.group_id is not None:
        if prompt_data.group_id == 0:  # 0表示移除分组
            prompt.group_id = None
        else:
            group = db.query(PromptGroup).filter(PromptGroup.id == prompt_data.group_id).first()
            if not group:
                raise HTTPException(status_code=400, detail="分组不存在")
            prompt.group_id = prompt_data.group_id
    
    # 更新标签
    if prompt_data.tag_ids is not None:
        tags = db.query(PromptTag).filter(PromptTag.id.in_(prompt_data.tag_ids)).all()
        if len(tags) != len(prompt_data.tag_ids):
            raise HTTPException(status_code=400, detail="部分标签不存在")
        prompt.tags = tags
    
    db.commit()
    db.refresh(prompt)
    
    return PromptResponse.model_validate(prompt)

@router.delete("/{prompt_id}", response_model=MessageResponse)
async def delete_prompt(prompt_id: int, db: Session = Depends(get_db)):
    """删除Prompt（软删除）"""
    from datetime import datetime
    
    prompt = db.query(Prompt).filter(
        Prompt.id == prompt_id,
        Prompt.deleted_at.is_(None)
    ).first()
    
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt不存在")
    
    prompt.deleted_at = datetime.utcnow()
    db.commit()
    
    return MessageResponse(message="删除成功")

@router.post("/batch", response_model=MessageResponse)
async def batch_delete_prompts(
    ids: List[int],
    db: Session = Depends(get_db)
):
    """批量删除Prompt"""
    from datetime import datetime
    
    prompts = db.query(Prompt).filter(
        Prompt.id.in_(ids),
        Prompt.deleted_at.is_(None)
    ).all()
    
    if not prompts:
        raise HTTPException(status_code=404, detail="未找到要删除的Prompt")
    
    for prompt in prompts:
        prompt.deleted_at = datetime.utcnow()
    
    db.commit()
    
    return MessageResponse(message=f"成功删除{len(prompts)}个Prompt")

@router.post("/{prompt_id}/copy", response_model=MessageResponse)
async def copy_prompt(prompt_id: int, db: Session = Depends(get_db)):
    """复制Prompt（增加使用次数）"""
    prompt = db.query(Prompt).filter(
        Prompt.id == prompt_id,
        Prompt.deleted_at.is_(None)
    ).first()
    
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt不存在")
    
    prompt.usage_count += 1
    db.commit()
    
    return MessageResponse(
        message="复制成功",
        data={"content": prompt.content}
    )
