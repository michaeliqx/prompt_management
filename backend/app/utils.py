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
    # 获取项目根目录（backend目录的父目录）
    backend_dir = Path(__file__).parent.parent.absolute()
    project_root = backend_dir.parent
    
    # 创建上传目录（相对于项目根目录）
    upload_dir = project_root / settings.UPLOAD_DIR / str(prompt_id)
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
    relative_path = str(file_path.relative_to(project_root)).replace("\\", "/")
    
    return {
        "file_path": relative_path,
        "file_name": upload_file.filename,
        "file_size": len(content),
        "file_type": upload_file.content_type or "application/octet-stream"
    }

def delete_file(file_path: str) -> bool:
    """删除文件（file_path是相对于项目根目录的路径）"""
    try:
        # 获取项目根目录
        backend_dir = Path(__file__).parent.parent.absolute()
        project_root = backend_dir.parent
        
        # 构建完整路径
        full_path = project_root / file_path
        
        if full_path.exists():
            full_path.unlink()
            return True
        return False
    except Exception as e:
        print(f"删除文件失败: {e}")
        return False
