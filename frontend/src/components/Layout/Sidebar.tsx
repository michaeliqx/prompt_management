import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePromptStore } from '../../store/promptStore'
import { groupApi, PromptGroup } from '../../services/api'
import './Sidebar.css'

const Sidebar: React.FC = () => {
  const navigate = useNavigate()
  const { prompts, searchKeyword, selectedGroup, setSearchKeyword, setSelectedGroup, fetchPrompts } = usePromptStore()
  const [groups, setGroups] = useState<PromptGroup[]>([])
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')

  useEffect(() => {
    loadGroups()
    fetchPrompts()
  }, [])

  const loadGroups = async () => {
    try {
      const data = await groupApi.getGroups()
      setGroups(data)
    } catch (error) {
      console.error('加载分组失败:', error)
    }
  }

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return
    try {
      await groupApi.createGroup({ name: newGroupName.trim() })
      setNewGroupName('')
      setShowCreateGroup(false)
      await loadGroups()
    } catch (error) {
      console.error('创建分组失败:', error)
    }
  }

  const handleGroupClick = (groupId: number | null) => {
    setSelectedGroup(groupId)
  }

  const handlePromptClick = (promptId: number) => {
    navigate(`/prompt/${promptId}`)
  }

  // 按分组筛选prompts
  const filteredPrompts = selectedGroup
    ? prompts.filter(p => p.group_id === selectedGroup)
    : prompts.filter(p => !p.group_id)

  // 搜索过滤
  const searchFilteredPrompts = searchKeyword
    ? filteredPrompts.filter(p =>
        p.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        p.content.toLowerCase().includes(searchKeyword.toLowerCase())
      )
    : filteredPrompts

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">Prompt管理</h2>
      </div>

      <div className="sidebar-search">
        <input
          type="text"
          placeholder="搜索Prompt..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          className="sidebar-search-input"
        />
      </div>

      <div className="sidebar-groups">
        <div className="sidebar-groups-header">
          <span>分组</span>
          <button
            className="sidebar-add-group-btn"
            onClick={() => setShowCreateGroup(!showCreateGroup)}
            title="新建分组"
          >
            +
          </button>
        </div>

        {showCreateGroup && (
          <div className="sidebar-create-group">
            <input
              type="text"
              placeholder="分组名称"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateGroup()}
              className="sidebar-create-group-input"
              autoFocus
            />
            <div className="sidebar-create-group-actions">
              <button onClick={handleCreateGroup}>确定</button>
              <button onClick={() => {
                setShowCreateGroup(false)
                setNewGroupName('')
              }}>取消</button>
            </div>
          </div>
        )}

        <div
          className={`sidebar-group-item ${selectedGroup === null ? 'active' : ''}`}
          onClick={() => handleGroupClick(null)}
        >
          <span>未分组</span>
          <span className="sidebar-group-count">
            {prompts.filter(p => !p.group_id).length}
          </span>
        </div>

        {groups.map(group => (
          <div
            key={group.id}
            className={`sidebar-group-item ${selectedGroup === group.id ? 'active' : ''}`}
            onClick={() => handleGroupClick(group.id)}
          >
            <span>{group.name}</span>
            <span className="sidebar-group-count">
              {prompts.filter(p => p.group_id === group.id).length}
            </span>
          </div>
        ))}
      </div>

      <div className="sidebar-prompts">
        <div className="sidebar-prompts-header">
          <span>Prompt列表</span>
          <span className="sidebar-prompts-count">{searchFilteredPrompts.length}</span>
        </div>
        <div className="sidebar-prompts-list">
          {searchFilteredPrompts.map(prompt => (
            <div
              key={prompt.id}
              className="sidebar-prompt-item"
              onClick={() => handlePromptClick(prompt.id)}
            >
              <div className="sidebar-prompt-name">{prompt.name}</div>
              {prompt.tags.length > 0 && (
                <div className="sidebar-prompt-tags">
                  {prompt.tags.slice(0, 2).map(tag => (
                    <span
                      key={tag.id}
                      className="sidebar-prompt-tag"
                      style={{ backgroundColor: tag.color + '20', color: tag.color }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
          {searchFilteredPrompts.length === 0 && (
            <div className="sidebar-empty">暂无Prompt</div>
          )}
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
