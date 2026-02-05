"""
搜索API测试
"""
import pytest
from fastapi import status

class TestSearch:
    """搜索功能测试"""
    
    def test_search_by_keyword(self, client, sample_prompt):
        """测试按关键词搜索"""
        response = client.get("/api/v1/search?keyword=测试")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert len(data["items"]) > 0
    
    def test_search_empty_keyword(self, client):
        """测试空关键词"""
        response = client.get("/api/v1/search?keyword=")
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_search_no_results(self, client):
        """测试无结果搜索"""
        response = client.get("/api/v1/search?keyword=不存在的关键词xyzabc123")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data["items"]) == 0
        assert data["total"] == 0
    
    def test_search_by_name(self, client, sample_prompt):
        """测试按名称搜索"""
        response = client.get(f"/api/v1/search?keyword={sample_prompt.name}")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert any(item["name"] == sample_prompt.name for item in data["items"])
    
    def test_search_by_content(self, client, sample_prompt):
        """测试按内容搜索"""
        keyword = sample_prompt.content[:5]
        response = client.get(f"/api/v1/search?keyword={keyword}")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data["items"]) > 0
    
    def test_search_with_limit(self, client, db_session):
        """测试限制返回数量"""
        from app.models import Prompt
        
        # 创建多个Prompt
        for i in range(5):
            prompt = Prompt(name=f"测试Prompt{i}", content="测试内容")
            db_session.add(prompt)
        db_session.commit()
        
        response = client.get("/api/v1/search?keyword=测试&limit=3")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data["items"]) <= 3
