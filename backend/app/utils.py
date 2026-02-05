"""
工具函数
"""
import os
import uuid
from pathlib import Path
from fastapi import UploadFile
from app.config import settings

def save_upload_file(upload_file: UploadFile, prompt_id: int) -> dict:
    """
    保存上传的文件
    返回: {
        "file_path": str,
        "file_name": str,
        "file_size": int,
        "file_type": str
    }
    """
    # 创建上传目录
    upload_dir = Path(settings.UPLOAD_DIR) / str(prompt_id)
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # 生成唯一文件名
    file_ext = Path(upload_file.filename).suffix
    file_name = f"{uuid.uuid4()}{file_ext}"
    file_path = upload_dir / file_name
    
    # 保存文件
    with open(file_path, "wb") as f:
        content = upload_file.file.read()
        f.write(content)
    
    # 返回相对路径（相对于项目根目录）
    relative_path = str(file_path).replace("\\", "/")
    
    return {
        "file_path": relative_path,
        "file_name": upload_file.filename,
        "file_size": len(content),
        "file_type": upload_file.content_type or "application/octet-stream"
    }

def delete_file(file_path: str) -> bool:
    """删除文件"""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False
    except Exception as e:
        print(f"删除文件失败: {e}")
        return False
