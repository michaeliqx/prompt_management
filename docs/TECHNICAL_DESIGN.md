# Prompt管理工具 - 技术方案文档

## 1. 技术架构概述

### 1.1 整体架构
```
┌─────────────────────────────────────────┐
│         Electron 桌面应用                │
│  ┌──────────────┐  ┌──────────────┐   │
│  │   前端UI层    │  │   后端API层   │   │
│  │  (React/Vue) │◄─┤  (Python)    │   │
│  └──────────────┘  └──────────────┘   │
│         │                  │            │
└─────────┼──────────────────┼────────────┘
          │                  │
          ▼                  ▼
    ┌──────────┐      ┌──────────────┐
    │ 本地存储  │      │  PostgreSQL  │
    │ (Electron)│      │   数据库      │
    └──────────┘      └──────────────┘
```

### 1.2 技术栈选型

#### 前端技术栈
- **框架**: Electron + React/Vue.js
- **UI框架**: 
  - Ant Design / Material-UI / Tailwind CSS
  - 参考orbit-devops风格，建议使用Tailwind CSS + Headless UI
- **状态管理**: Redux / Zustand / Pinia
- **路由**: React Router / Vue Router
- **HTTP客户端**: Axios
- **图片处理**: 使用Electron的native能力或sharp库

#### 后端技术栈
- **框架**: FastAPI（推荐）或 Flask
- **ORM**: SQLAlchemy
- **数据库**: PostgreSQL
- **数据验证**: Pydantic
- **文件上传**: FastAPI UploadFile / Flask-Uploads

#### 数据库
- **数据库**: PostgreSQL 12+
- **连接池**: SQLAlchemy连接池
- **迁移工具**: Alembic

## 2. 数据库设计

### 2.1 数据库表结构

#### 2.1.1 prompts表（Prompt主表）
```sql
CREATE TABLE prompts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    description TEXT,
    group_id INTEGER REFERENCES prompt_groups(id) ON DELETE SET NULL,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_prompts_group_id ON prompts(group_id);
CREATE INDEX idx_prompts_name ON prompts(name);
CREATE INDEX idx_prompts_created_at ON prompts(created_at);
```

#### 2.1.2 prompt_groups表（分组表）
```sql
CREATE TABLE prompt_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_prompt_groups_sort_order ON prompt_groups(sort_order);
```

#### 2.1.3 prompt_tags表（标签表）
```sql
CREATE TABLE prompt_tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    color VARCHAR(20) DEFAULT '#1890ff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2.1.4 prompt_tag_relations表（Prompt标签关联表）
```sql
CREATE TABLE prompt_tag_relations (
    id SERIAL PRIMARY KEY,
    prompt_id INTEGER NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES prompt_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(prompt_id, tag_id)
);

CREATE INDEX idx_prompt_tag_relations_prompt_id ON prompt_tag_relations(prompt_id);
CREATE INDEX idx_prompt_tag_relations_tag_id ON prompt_tag_relations(tag_id);
```

#### 2.1.5 prompt_images表（效果图表）
```sql
CREATE TABLE prompt_images (
    id SERIAL PRIMARY KEY,
    prompt_id INTEGER NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_prompt_images_prompt_id ON prompt_images(prompt_id);
```

#### 2.1.6 search_history表（搜索历史表，可选）
```sql
CREATE TABLE search_history (
    id SERIAL PRIMARY KEY,
    keyword VARCHAR(255) NOT NULL,
    search_count INTEGER DEFAULT 1,
    last_searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_search_history_keyword ON search_history(keyword);
```

### 2.2 数据库关系图
```
prompt_groups (1) ────< (N) prompts
prompts (1) ────< (N) prompt_tag_relations >─── (N) prompt_tags
prompts (1) ────< (N) prompt_images
```

## 3. 后端API设计

### 3.1 API架构
- **框架**: FastAPI
- **API风格**: RESTful API
- **数据格式**: JSON
- **认证**: JWT Token（如需要）

### 3.2 API接口列表

#### 3.2.1 Prompt管理接口

**获取Prompt列表**
```
GET /api/v1/prompts
Query Parameters:
  - page: int (页码，默认1)
  - page_size: int (每页数量，默认20)
  - group_id: int (分组ID，可选)
  - tag_id: int (标签ID，可选)
  - keyword: string (搜索关键词，可选)
  - sort_by: string (排序字段：created_at, updated_at, usage_count, name)
  - order: string (排序方向：asc, desc)

Response:
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "page_size": 20
  }
}
```

**获取Prompt详情**
```
GET /api/v1/prompts/{prompt_id}

Response:
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "name": "Prompt名称",
    "content": "Prompt内容",
    "description": "备注说明",
    "group": {...},
    "tags": [...],
    "images": [...],
    "usage_count": 10,
    "created_at": "2026-02-05T10:00:00",
    "updated_at": "2026-02-05T10:00:00"
  }
}
```

**创建Prompt**
```
POST /api/v1/prompts
Content-Type: multipart/form-data

Request Body:
  - name: string (必填)
  - content: string (必填)
  - description: string (可选)
  - group_id: int (可选)
  - tag_ids: array[int] (可选)
  - images: file[] (可选，多文件)

Response:
{
  "code": 200,
  "message": "创建成功",
  "data": {
    "id": 1,
    ...
  }
}
```

**更新Prompt**
```
PUT /api/v1/prompts/{prompt_id}
Content-Type: multipart/form-data

Request Body: (同创建接口，所有字段可选)

Response:
{
  "code": 200,
  "message": "更新成功",
  "data": {...}
}
```

**删除Prompt**
```
DELETE /api/v1/prompts/{prompt_id}

Response:
{
  "code": 200,
  "message": "删除成功"
}
```

**批量删除Prompt**
```
DELETE /api/v1/prompts/batch
Request Body:
{
  "ids": [1, 2, 3]
}
```

**复制Prompt（增加使用次数）**
```
POST /api/v1/prompts/{prompt_id}/copy

Response:
{
  "code": 200,
  "message": "复制成功",
  "data": {
    "content": "Prompt内容"
  }
}
```

#### 3.2.2 分组管理接口

**获取分组列表**
```
GET /api/v1/groups

Response:
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "name": "分组名称",
      "description": "描述",
      "prompt_count": 10,
      "sort_order": 0
    }
  ]
}
```

**创建分组**
```
POST /api/v1/groups
Request Body:
{
  "name": "分组名称",
  "description": "描述",
  "sort_order": 0
}
```

**更新分组**
```
PUT /api/v1/groups/{group_id}
```

**删除分组**
```
DELETE /api/v1/groups/{group_id}
```

#### 3.2.3 标签管理接口

**获取标签列表**
```
GET /api/v1/tags
```

**创建标签**
```
POST /api/v1/tags
Request Body:
{
  "name": "标签名称",
  "color": "#1890ff"
}
```

**更新标签**
```
PUT /api/v1/tags/{tag_id}
```

**删除标签**
```
DELETE /api/v1/tags/{tag_id}
```

#### 3.2.4 搜索接口

**搜索Prompt**
```
GET /api/v1/search
Query Parameters:
  - keyword: string (必填)
  - limit: int (默认20)

Response:
{
  "code": 200,
  "data": {
    "items": [...],
    "total": 10
  }
}
```

#### 3.2.5 图片管理接口

**上传图片**
```
POST /api/v1/prompts/{prompt_id}/images
Content-Type: multipart/form-data
Request Body:
  - file: file (必填)
  - sort_order: int (可选)

Response:
{
  "code": 200,
  "data": {
    "id": 1,
    "file_path": "/uploads/images/xxx.jpg",
    "file_name": "xxx.jpg",
    ...
  }
}
```

**删除图片**
```
DELETE /api/v1/images/{image_id}
```

**获取图片**
```
GET /api/v1/images/{image_id}
```

## 4. 前端架构设计

### 4.1 项目结构
```
prompt-management/
├── electron/
│   ├── main.js              # Electron主进程
│   ├── preload.js           # 预加载脚本
│   └── tray.js              # 系统托盘/悬浮球
├── src/
│   ├── components/          # 组件目录
│   │   ├── Sidebar/         # 侧边栏组件
│   │   ├── PromptCard/      # Prompt卡片组件
│   │   ├── PromptDetail/    # Prompt详情组件
│   │   ├── FloatingBall/    # 悬浮球组件
│   │   └── SearchBar/       # 搜索栏组件
│   ├── pages/               # 页面目录
│   │   ├── PromptList/      # Prompt列表页
│   │   ├── PromptDetail/    # Prompt详情页
│   │   └── GroupManage/     # 分组管理页
│   ├── store/               # 状态管理
│   │   ├── promptStore.js
│   │   ├── groupStore.js
│   │   └── tagStore.js
│   ├── services/            # API服务
│   │   └── api.js
│   ├── utils/               # 工具函数
│   │   ├── clipboard.js
│   │   └── storage.js
│   ├── styles/              # 样式文件
│   └── App.jsx              # 根组件
├── public/                  # 静态资源
├── package.json
└── webpack.config.js        # 构建配置
```

### 4.2 核心组件设计

#### 4.2.1 主布局组件
- 左侧固定侧边栏（可收起）
- 右侧主内容区
- 顶部导航栏
- 底部状态栏

#### 4.2.2 侧边栏组件
- Prompt列表展示
- 分组树形结构
- 搜索框
- 新建Prompt按钮

#### 4.2.3 Prompt卡片组件
- 网格布局
- 卡片内容：名称、内容预览、标签、分组
- 悬停效果
- 点击进入详情

#### 4.2.4 Prompt详情组件
- 完整信息展示
- 编辑模式切换
- 图片预览（支持轮播）
- 快速复制按钮

#### 4.2.5 悬浮球组件
- 桌面悬浮窗口
- 点击展开/收起
- 搜索功能
- Prompt列表展示
- 点击复制功能

### 4.3 状态管理设计

#### 4.3.1 Prompt状态
```javascript
{
  prompts: [],           // Prompt列表
  currentPrompt: null,   // 当前选中的Prompt
  loading: false,       // 加载状态
  searchKeyword: '',    // 搜索关键词
  selectedGroup: null,  // 选中的分组
  selectedTags: [],     // 选中的标签
  viewMode: 'list'      // 视图模式：list/card
}
```

#### 4.3.2 分组状态
```javascript
{
  groups: [],           // 分组列表
  currentGroup: null    // 当前分组
}
```

#### 4.3.3 标签状态
```javascript
{
  tags: [],             // 标签列表
  selectedTags: []      // 选中的标签
}
```

## 5. Electron集成设计

### 5.1 主进程（main.js）
- 窗口管理
- 应用生命周期管理
- 系统托盘/悬浮球管理
- 全局快捷键注册
- 文件系统访问

### 5.2 预加载脚本（preload.js）
- 暴露安全的API给渲染进程
- 剪贴板操作
- 文件选择对话框
- 系统通知

### 5.3 悬浮球实现
- 使用BrowserWindow创建无边框窗口
- 设置alwaysOnTop和skipTaskbar
- 监听鼠标事件实现拖拽
- IPC通信与主窗口交互

### 5.4 全局快捷键
- Ctrl+Shift+P: 打开/关闭悬浮球
- Ctrl+F: 聚焦搜索框
- Ctrl+N: 新建Prompt

## 6. 文件存储设计

### 6.1 图片存储
- 存储路径：`{userData}/uploads/images/`
- 文件命名：`{prompt_id}_{timestamp}_{random}.{ext}`
- 支持格式：JPG, PNG, GIF
- 大小限制：单张5MB

### 6.2 数据库存储
- PostgreSQL数据库文件存储在应用数据目录
- 支持数据备份和恢复

### 6.3 配置文件
- 应用配置：`config.json`
- 用户设置：`settings.json`

## 7. 安全设计

### 7.1 数据安全
- 敏感数据加密存储
- SQL注入防护（使用ORM）
- XSS防护（前端转义）

### 7.2 文件安全
- 文件类型验证
- 文件大小限制
- 文件路径安全检查

## 8. 性能优化方案

### 8.1 前端优化
- 虚拟滚动（长列表）
- 图片懒加载
- 组件懒加载
- 防抖和节流（搜索、滚动）

### 8.2 后端优化
- 数据库索引优化
- 查询结果分页
- 图片压缩和缩略图
- API响应缓存

### 8.3 数据库优化
- 合理使用索引
- 查询优化
- 连接池配置

## 9. 开发环境搭建

### 9.1 后端环境
```bash
# Python环境
python 3.9+

# 依赖安装
pip install fastapi uvicorn sqlalchemy psycopg2-binary pydantic python-multipart pillow
```

### 9.2 前端环境
```bash
# Node.js环境
node 16+

# 依赖安装
npm install electron react react-dom react-router-dom axios
npm install -D webpack webpack-cli babel-loader @babel/core @babel/preset-react
```

### 9.3 数据库环境
```bash
# PostgreSQL安装
PostgreSQL 12+

# 创建数据库
createdb prompt_management
```

## 10. 部署方案

### 10.1 开发环境
- 前后端分离开发
- 热重载支持
- 开发工具集成

### 10.2 生产环境
- Electron打包（electron-builder）
- 数据库初始化脚本
- 安装程序制作
- 自动更新机制（可选）

## 11. 测试方案

### 11.1 单元测试
- 后端API单元测试（pytest）
- 前端组件单元测试（Jest + React Testing Library）

### 11.2 集成测试
- API集成测试
- 前后端集成测试

### 11.3 E2E测试
- Electron应用E2E测试（Spectron / Playwright）

## 12. 开发计划

### 阶段一：基础架构搭建（3天）
- 项目初始化
- 数据库设计和创建
- 后端基础框架搭建
- 前端基础框架搭建

### 阶段二：核心功能开发（7天）
- Prompt CRUD功能
- 分组和标签功能
- 搜索功能
- 图片上传功能

### 阶段三：UI和交互优化（5天）
- 界面设计和实现
- 侧边栏和卡片视图
- 详情页实现
- 快速复制功能

### 阶段四：悬浮球功能（3天）
- 悬浮球UI实现
- 悬浮球交互功能
- 全局快捷键

### 阶段五：测试和优化（4天）
- 功能测试
- 性能优化
- Bug修复
- 文档完善

## 13. 技术难点和解决方案

### 13.1 悬浮球实现
- **难点**: 跨平台兼容性、窗口置顶、拖拽功能
- **方案**: 使用Electron的BrowserWindow，设置alwaysOnTop，监听鼠标事件

### 13.2 图片存储和管理
- **难点**: 图片上传、预览、删除
- **方案**: 使用FastAPI的UploadFile，存储到本地文件系统，数据库记录路径

### 13.3 搜索性能
- **难点**: 大量数据下的实时搜索
- **方案**: 数据库全文搜索索引、前端防抖、后端分页

### 13.4 数据同步
- **难点**: 多窗口数据同步
- **方案**: 使用Electron IPC通信、状态管理库

## 14. 后续扩展方向

### 14.1 功能扩展
- 云端同步
- 团队协作
- Prompt模板
- 版本管理
- 使用统计和分析

### 14.2 技术扩展
- 浏览器插件版本
- 移动端应用
- API服务提供
- 插件系统

## 15. 备注

- 本文档为技术方案初稿，具体实现细节需要在开发过程中不断完善
- 技术选型可以根据团队实际情况调整
- 数据库设计可以根据实际需求优化
- API设计遵循RESTful规范，可根据实际情况调整
