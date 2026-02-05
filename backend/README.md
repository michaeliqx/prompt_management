# Prompt管理工具 - 后端

## 环境要求
- Python 3.9+
- PostgreSQL 12+
- Redis 6+

## 安装依赖
```bash
pip install -r requirements.txt
```

## 配置环境变量
复制 `.env.example` 为 `.env` 并修改配置：
```bash
cp .env.example .env
```

## 初始化数据库
```bash
alembic upgrade head
```

## 运行开发服务器
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 运行测试
```bash
pytest
```
