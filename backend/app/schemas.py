"""
Pydantic schemas for API request/response
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# Prompt相关schemas
class PromptBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Prompt名称")
    content: str = Field(..., min_length=1, description="Prompt内容")
    description: Optional[str] = Field(None, description="备注说明")
    group_id: Optional[int] = Field(None, description="分组ID")
    tag_ids: Optional[List[int]] = Field(default_factory=list, description="标签ID列表")

class PromptCreate(PromptBase):
    pass

class PromptUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[str] = Field(None, min_length=1)
    description: Optional[str] = None
    group_id: Optional[int] = None
    tag_ids: Optional[List[int]] = None

class PromptGroupBase(BaseModel):
    name: str
    description: Optional[str] = None
    sort_order: Optional[int] = 0

class PromptGroupResponse(PromptGroupBase):
    id: int
    created_at: datetime
    updated_at: datetime
    prompt_count: int = 0
    
    class Config:
        from_attributes = True

class PromptTagResponse(BaseModel):
    id: int
    name: str
    color: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class PromptImageResponse(BaseModel):
    id: int
    prompt_id: int
    file_path: str
    file_name: str
    file_size: int
    file_type: str
    sort_order: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class PromptResponse(BaseModel):
    id: int
    name: str
    content: str
    description: Optional[str]
    group_id: Optional[int]
    usage_count: int
    created_at: datetime
    updated_at: datetime
    group: Optional[PromptGroupResponse] = None
    tags: List[PromptTagResponse] = []
    images: List[PromptImageResponse] = []
    
    class Config:
        from_attributes = True

class PromptListItem(BaseModel):
    id: int
    name: str
    content: str
    description: Optional[str]
    group_id: Optional[int]
    usage_count: int
    created_at: datetime
    updated_at: datetime
    group: Optional[PromptGroupResponse] = None
    tags: List[PromptTagResponse] = []
    
    class Config:
        from_attributes = True

class PromptListResponse(BaseModel):
    items: List[PromptListItem]
    total: int
    page: int
    page_size: int

# 分组相关schemas
class PromptGroupCreate(PromptGroupBase):
    pass

class PromptGroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    sort_order: Optional[int] = None

# 标签相关schemas
class PromptTagBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    color: Optional[str] = Field(default="#1890ff", max_length=20)

class PromptTagCreate(PromptTagBase):
    pass

class PromptTagUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    color: Optional[str] = Field(None, max_length=20)

# 搜索相关schemas
class SearchResponse(BaseModel):
    items: List[PromptListItem]
    total: int

# 通用响应
class MessageResponse(BaseModel):
    code: int = 200
    message: str
    data: Optional[dict] = None
