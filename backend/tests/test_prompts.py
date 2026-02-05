"""
Prompt API测试
"""
import pytest
from fastapi import status

class TestPromptCRUD:
    """Prompt CRUD操作测试"""
    
    def test_create_prompt_success(self, client, sample_group, sample_tag):
        """测试成功创建Prompt"""
        response = client.post("/api/v1/prompts", json={
            "name": "新Prompt",
            "content": "这是新Prompt的内容",
            "description": "描述信息",
            "group_id": sample_group.id,
            "tag_ids": [sample_tag.id]
        })
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["name"] == "新Prompt"
        assert data["content"] == "这是新Prompt的内容"
        assert data["group_id"] == sample_group.id
        assert len(data["tags"]) == 1
    
    def test_create_prompt_missing_required_fields(self, client):
        """测试缺少必填字段"""
        response = client.post("/api/v1/prompts", json={
            "name": "只有名称"
        })
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_create_prompt_empty_name(self, client):
        """测试名称为空"""
        response = client.post("/api/v1/prompts", json={
            "name": "",
            "content": "内容"
        })
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_create_prompt_empty_content(self, client):
        """测试内容为空"""
        response = client.post("/api/v1/prompts", json={
            "name": "名称",
            "content": ""
        })
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_create_prompt_invalid_group(self, client):
        """测试无效的分组ID"""
        response = client.post("/api/v1/prompts", json={
            "name": "测试",
            "content": "内容",
            "group_id": 99999
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_create_prompt_invalid_tags(self, client, sample_group):
        """测试无效的标签ID"""
        response = client.post("/api/v1/prompts", json={
            "name": "测试",
            "content": "内容",
            "group_id": sample_group.id,
            "tag_ids": [99999]
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_get_prompt_list(self, client, sample_prompt):
        """测试获取Prompt列表"""
        response = client.get("/api/v1/prompts")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert len(data["items"]) > 0
    
    def test_get_prompt_list_with_pagination(self, client):
        """测试分页"""
        response = client.get("/api/v1/prompts?page=1&page_size=10")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["page"] == 1
        assert data["page_size"] == 10
    
    def test_get_prompt_list_filter_by_group(self, client, sample_prompt, sample_group):
        """测试按分组筛选"""
        response = client.get(f"/api/v1/prompts?group_id={sample_group.id}")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert all(item["group_id"] == sample_group.id for item in data["items"])
    
    def test_get_prompt_list_search(self, client, sample_prompt):
        """测试搜索功能"""
        response = client.get("/api/v1/prompts?keyword=测试")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data["items"]) > 0
    
    def test_get_prompt_detail(self, client, sample_prompt):
        """测试获取Prompt详情"""
        response = client.get(f"/api/v1/prompts/{sample_prompt.id}")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == sample_prompt.id
        assert data["name"] == sample_prompt.name
    
    def test_get_prompt_detail_not_found(self, client):
        """测试获取不存在的Prompt"""
        response = client.get("/api/v1/prompts/99999")
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_update_prompt_success(self, client, sample_prompt):
        """测试成功更新Prompt"""
        response = client.put(f"/api/v1/prompts/{sample_prompt.id}", json={
            "name": "更新后的名称",
            "content": "更新后的内容"
        })
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["name"] == "更新后的名称"
        assert data["content"] == "更新后的内容"
    
    def test_update_prompt_partial(self, client, sample_prompt):
        """测试部分更新"""
        response = client.put(f"/api/v1/prompts/{sample_prompt.id}", json={
            "name": "只更新名称"
        })
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["name"] == "只更新名称"
        assert data["content"] == sample_prompt.content
    
    def test_update_prompt_not_found(self, client):
        """测试更新不存在的Prompt"""
        response = client.put("/api/v1/prompts/99999", json={
            "name": "测试"
        })
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_update_prompt_remove_group(self, client, sample_prompt):
        """测试移除分组"""
        response = client.put(f"/api/v1/prompts/{sample_prompt.id}", json={
            "group_id": 0
        })
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["group_id"] is None
    
    def test_delete_prompt_success(self, client, sample_prompt):
        """测试成功删除Prompt"""
        response = client.delete(f"/api/v1/prompts/{sample_prompt.id}")
        assert response.status_code == status.HTTP_200_OK
        
        # 验证已删除（软删除）
        get_response = client.get(f"/api/v1/prompts/{sample_prompt.id}")
        assert get_response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_delete_prompt_not_found(self, client):
        """测试删除不存在的Prompt"""
        response = client.delete("/api/v1/prompts/99999")
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_batch_delete_prompts(self, client, db_session):
        """测试批量删除"""
        from app.models import Prompt
        
        # 创建多个Prompt
        prompts = []
        for i in range(3):
            prompt = Prompt(name=f"测试{i}", content=f"内容{i}")
            db_session.add(prompt)
            prompts.append(prompt)
        db_session.commit()
        
        ids = [p.id for p in prompts]
        response = client.delete("/api/v1/prompts/batch", json={"ids": ids})
        assert response.status_code == status.HTTP_200_OK
    
    def test_copy_prompt(self, client, sample_prompt):
        """测试复制Prompt（增加使用次数）"""
        initial_count = sample_prompt.usage_count
        response = client.post(f"/api/v1/prompts/{sample_prompt.id}/copy")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "content" in data["data"]
        
        # 验证使用次数增加
        get_response = client.get(f"/api/v1/prompts/{sample_prompt.id}")
        assert get_response.json()["usage_count"] == initial_count + 1
    
    def test_copy_prompt_not_found(self, client):
        """测试复制不存在的Prompt"""
        response = client.post("/api/v1/prompts/99999/copy")
        assert response.status_code == status.HTTP_404_NOT_FOUND
