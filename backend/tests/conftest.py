"""
测试配置和fixtures
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, get_db
from app.models import Prompt, PromptGroup, PromptTag, PromptImage
from main import app
import os

# 使用测试数据库
TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL", "postgresql://prompt_user:PromptDb2024!@60.171.65.125:34049/prompt_test_db")

engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    """创建测试数据库会话"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    """创建测试客户端"""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def sample_group(db_session):
    """创建示例分组"""
    group = PromptGroup(name="测试分组", description="测试描述")
    db_session.add(group)
    db_session.commit()
    db_session.refresh(group)
    return group

@pytest.fixture
def sample_tag(db_session):
    """创建示例标签"""
    tag = PromptTag(name="测试标签", color="#1890ff")
    db_session.add(tag)
    db_session.commit()
    db_session.refresh(tag)
    return tag

@pytest.fixture
def sample_prompt(db_session, sample_group, sample_tag):
    """创建示例Prompt"""
    prompt = Prompt(
        name="测试Prompt",
        content="这是一个测试Prompt内容",
        description="测试描述",
        group_id=sample_group.id
    )
    db_session.add(prompt)
    db_session.flush()
    prompt.tags.append(sample_tag)
    db_session.commit()
    db_session.refresh(prompt)
    return prompt
