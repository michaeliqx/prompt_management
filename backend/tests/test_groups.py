"""
分组API测试
"""
import pytest
from fastapi import status

class TestGroupCRUD:
    """分组CRUD操作测试"""
    
    def test_create_group_success(self, client):
        """测试成功创建分组"""
        response = client.post("/api/v1/groups", json={
            "name": "新分组",
            "description": "分组描述",
            "sort_order": 0
        })
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["name"] == "新分组"
        assert data["description"] == "分组描述"
    
    def test_create_group_duplicate_name(self, client, sample_group):
        """测试重复的分组名称"""
        response = client.post("/api/v1/groups", json={
            "name": sample_group.name,
            "description": "描述"
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_get_groups_list(self, client, sample_group):
        """测试获取分组列表"""
        response = client.get("/api/v1/groups")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
    
    def test_update_group_success(self, client, sample_group):
        """测试成功更新分组"""
        response = client.put(f"/api/v1/groups/{sample_group.id}", json={
            "name": "更新后的分组名",
            "description": "更新后的描述"
        })
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["name"] == "更新后的分组名"
    
    def test_update_group_not_found(self, client):
        """测试更新不存在的分组"""
        response = client.put("/api/v1/groups/99999", json={
            "name": "测试"
        })
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_update_group_duplicate_name(self, client, db_session):
        """测试更新为重复的分组名"""
        from app.models import PromptGroup
        
        group1 = PromptGroup(name="分组1")
        group2 = PromptGroup(name="分组2")
        db_session.add_all([group1, group2])
        db_session.commit()
        
        response = client.put(f"/api/v1/groups/{group2.id}", json={
            "name": "分组1"
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_delete_group_success(self, client, db_session):
        """测试成功删除分组"""
        from app.models import PromptGroup
        
        group = PromptGroup(name="待删除分组")
        db_session.add(group)
        db_session.commit()
        
        response = client.delete(f"/api/v1/groups/{group.id}")
        assert response.status_code == status.HTTP_200_OK
    
    def test_delete_group_with_prompts(self, client, sample_group, sample_prompt):
        """测试删除有关联Prompt的分组"""
        response = client.delete(f"/api/v1/groups/{sample_group.id}")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_delete_group_not_found(self, client):
        """测试删除不存在的分组"""
        response = client.delete("/api/v1/groups/99999")
        assert response.status_code == status.HTTP_404_NOT_FOUND
