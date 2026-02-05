"""
搜索路由
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from app.database import get_db
from app.models import Prompt, PromptTag
from app.schemas import SearchResponse, PromptListItem

router = APIRouter()

@router.get("", response_model=SearchResponse)
async def search_prompts(
    keyword: str = Query(..., min_length=1, description="搜索关键词"),
    limit: int = Query(20, ge=1, le=100, description="返回数量限制"),
    db: Session = Depends(get_db)
):
    """搜索Prompt"""
    if not keyword:
        return SearchResponse(items=[], total=0)
    
    keyword_pattern = f"%{keyword}%"
    
    # 搜索Prompt名称、内容、备注
    query = db.query(Prompt).filter(
        Prompt.deleted_at.is_(None),
        or_(
            Prompt.name.ilike(keyword_pattern),
            Prompt.content.ilike(keyword_pattern),
            Prompt.description.ilike(keyword_pattern)
        )
    )
    
    # 搜索标签名称
    tag_ids = db.query(PromptTag.id).filter(PromptTag.name.ilike(keyword_pattern)).all()
    tag_ids = [tid[0] for tid in tag_ids]
    
    if tag_ids:
        # 如果找到匹配的标签，也搜索使用这些标签的Prompt
        query = query.union(
            db.query(Prompt).join(Prompt.tags).filter(
                PromptTag.id.in_(tag_ids),
                Prompt.deleted_at.is_(None)
            )
        )
    
    # 去重并限制数量
    items = query.distinct().limit(limit).all()
    total = query.distinct().count()
    
    return SearchResponse(
        items=[PromptListItem.model_validate(item) for item in items],
        total=total
    )
