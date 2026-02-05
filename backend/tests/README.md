# 测试说明

## 运行测试

```bash
# 运行所有测试
pytest

# 运行特定测试文件
pytest tests/test_prompts.py

# 运行特定测试类
pytest tests/test_prompts.py::TestPromptCRUD

# 运行特定测试方法
pytest tests/test_prompts.py::TestPromptCRUD::test_create_prompt_success

# 显示详细输出
pytest -v

# 显示覆盖率
pytest --cov=app --cov-report=html
```

## 测试覆盖范围

### Prompt API测试
- ✅ 创建Prompt（成功、失败场景）
- ✅ 获取Prompt列表（分页、筛选、搜索）
- ✅ 获取Prompt详情
- ✅ 更新Prompt（完整更新、部分更新）
- ✅ 删除Prompt（单个、批量）
- ✅ 复制Prompt（增加使用次数）

### 分组API测试
- ✅ 创建分组
- ✅ 获取分组列表
- ✅ 更新分组
- ✅ 删除分组（包括有关联Prompt的情况）

### 标签API测试
- ✅ 创建标签
- ✅ 获取标签列表
- ✅ 更新标签
- ✅ 删除标签

### 搜索API测试
- ✅ 按关键词搜索
- ✅ 按名称搜索
- ✅ 按内容搜索
- ✅ 限制返回数量

### 图片API测试
- ✅ 上传图片
- ✅ 删除图片
- ✅ 无效文件类型处理

## 注意事项

1. 测试使用独立的测试数据库（prompt_test_db）
2. 每个测试函数都会清理数据库
3. 需要确保测试数据库已创建
