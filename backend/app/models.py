"""
数据库模型
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

# Prompt和Tag的多对多关联表
prompt_tag_relations = Table(
    'prompt_tag_relations',
    Base.metadata,
    Column('id', Integer, primary_key=True, index=True),
    Column('prompt_id', Integer, ForeignKey('prompts.id', ondelete='CASCADE'), nullable=False),
    Column('tag_id', Integer, ForeignKey('prompt_tags.id', ondelete='CASCADE'), nullable=False),
)

class Prompt(Base):
    __tablename__ = "prompts"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    content = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    group_id = Column(Integer, ForeignKey('prompt_groups.id', ondelete='SET NULL'), nullable=True, index=True)
    usage_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    # 关系
    group = relationship("PromptGroup", back_populates="prompts")
    tags = relationship("PromptTag", secondary=prompt_tag_relations, back_populates="prompts")
    images = relationship("PromptImage", back_populates="prompt", cascade="all, delete-orphan")

class PromptGroup(Base):
    __tablename__ = "prompt_groups"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    sort_order = Column(Integer, default=0, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # 关系
    prompts = relationship("Prompt", back_populates="group")

class PromptTag(Base):
    __tablename__ = "prompt_tags"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False, unique=True, index=True)
    color = Column(String(20), default='#1890ff', nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # 关系
    prompts = relationship("Prompt", secondary=prompt_tag_relations, back_populates="tags")

class PromptImage(Base):
    __tablename__ = "prompt_images"
    
    id = Column(Integer, primary_key=True, index=True)
    prompt_id = Column(Integer, ForeignKey('prompts.id', ondelete='CASCADE'), nullable=False, index=True)
    file_path = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)
    file_type = Column(String(50), nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # 关系
    prompt = relationship("Prompt", back_populates="images")
