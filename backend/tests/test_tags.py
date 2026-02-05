"""
标签API测试
"""
import pytest
from fastapi import status

class TestTagCRUD:
    """标签CRUD操作测试"""
    
    def test_create_tag_success(self, client):
        """测试成功创建标签"""
        response = client.post("/api/v1/tags", json={
            "name": "新标签",
            "color": "#ff0000"
        })
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["name"] == "新标签"
        assert data["color"] == "#ff0000"
    
    def test_create_tag_default_color(self, client):
        """测试使用默认颜色创建标签"""
        response = client.post("/api/v1/tags", json={
            "name": "默认颜色标签"
        })
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["color"] == "#1890ff"
    
    def test_create_tag_duplicate_name(self, client, sample_tag):
        """测试重复的标签名称"""
        response = client.post("/api/v1/tags", json={
            "name": sample_tag.name,
            "color": "#000000"
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_get_tags_list(self, client, sample_tag):
        """测试获取标签列表"""
        response = client.get("/api/v1/tags")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
    
    def test_update_tag_success(self, client, sample_tag):
        """测试成功更新标签"""
        response = client.put(f"/api/v1/tags/{sample_tag.id}", json={
            "name": "更新后的标签名",
            "color": "#00ff00"
        })
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["name"] == "更新后的标签名"
        assert data["color"] == "#00ff00"
    
    def test_update_tag_not_found(self, client):
        """测试更新不存在的标签"""
        response = client.put("/api/v1/tags/99999", json={
            "name": "测试"
        })
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_update_tag_duplicate_name(self, client, db_session):
        """测试更新为重复的标签名"""
        from app.models import PromptTag
        
        tag1 = PromptTag(name="标签1", color="#ff0000")
        tag2 = PromptTag(name="标签2", color="#00ff00")
        db_session.add_all([tag1, tag2])
        db_session.commit()
        
        response = client.put(f"/api/v1/tags/{tag2.id}", json={
            "name": "标签1"
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_delete_tag_success(self, client, db_session):
        """测试成功删除标签"""
        from app.models import PromptTag
        
        tag = PromptTag(name="待删除标签", color="#000000")
        db_session.add(tag)
        db_session.commit()
        
        response = client.delete(f"/api/v1/tags/{tag.id}")
        assert response.status_code == status.HTTP_200_OK
    
    def test_delete_tag_not_found(self, client):
        """测试删除不存在的标签"""
        response = client.delete("/api/v1/tags/99999")
        assert response.status_code == status.HTTP_404_NOT_FOUND
