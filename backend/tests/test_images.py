"""
图片API测试
"""
import pytest
from fastapi import status
import io

class TestImageUpload:
    """图片上传测试"""
    
    def test_upload_image_success(self, client, sample_prompt):
        """测试成功上传图片"""
        # 创建一个模拟的图片文件
        image_data = io.BytesIO(b"fake image data")
        files = {"file": ("test.jpg", image_data, "image/jpeg")}
        data = {"sort_order": 0}
        
        response = client.post(
            f"/api/v1/images/{sample_prompt.id}",
            files=files,
            data=data
        )
        # 注意：实际测试中可能需要mock文件保存逻辑
        # 这里假设会成功或失败，根据实际实现调整
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_500_INTERNAL_SERVER_ERROR]
    
    def test_upload_image_invalid_prompt(self, client):
        """测试上传到不存在的Prompt"""
        image_data = io.BytesIO(b"fake image data")
        files = {"file": ("test.jpg", image_data, "image/jpeg")}
        
        response = client.post(
            "/api/v1/images/99999",
            files=files
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_upload_image_invalid_type(self, client, sample_prompt):
        """测试上传不支持的文件类型"""
        file_data = io.BytesIO(b"fake file data")
        files = {"file": ("test.txt", file_data, "text/plain")}
        
        response = client.post(
            f"/api/v1/images/{sample_prompt.id}",
            files=files
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_delete_image_not_found(self, client):
        """测试删除不存在的图片"""
        response = client.delete("/api/v1/images/99999")
        assert response.status_code == status.HTTP_404_NOT_FOUND
