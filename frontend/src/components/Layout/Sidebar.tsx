import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePromptStore } from '../../store/promptStore'
import { groupApi, promptApi, PromptGroup } from '../../services/api'
import './Sidebar.css'

const Sidebar: React.FC = () => {
  const navigate = useNavigate()
  const { prompts, searchKeyword, selectedGroup, setSearchKeyword, setSelectedGroup, fetchPrompts } = usePromptStore()
  const [groups, setGroups] = useState<PromptGroup[]>([])
  const [ungroupedCount, setUngroupedCount] = useState<number>(0)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')

  useEffect(() => {
    loadGroups()
    loadUngroupedCount()
    fetchPrompts()
  }, [])

  useEffect(() => {
    // 当分组切换时，重新加载分组列表和未分组数量
    loadGroups()
    loadUngroupedCount()
  }, [selectedGroup])

  // 监听prompt变化事件，当prompt被创建、删除或更新时，重新加载分组数量
  useEffect(() => {
    const handlePromptChange = () => {
      loadGroups()
      loadUngroupedCount()
    }

    window.addEventListener('prompt-changed', handlePromptChange)
    return () => {
      window.removeEventListener('prompt-changed', handlePromptChange)
    }
  }, [])

  const loadGroups = async () => {
    try {
      const data = await groupApi.getGroups()
      setGroups(data)
    } catch (error) {
      console.error('加载分组失败:', error)
    }
  }

  const loadUngroupedCount = async () => {
    try {
      // 直接调用API获取未分组的prompt总数（不使用关键词搜索，确保获取准确数量）
      const response = await promptApi.getPrompts({ 
        group_id: 0, 
        page_size: 1, 
        keyword: undefined,
        tag_id: undefined
      })
      setUngroupedCount(response.total)
    } catch (error) {
      console.error('加载未分组数量失败:', error)
    }
  }

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return
    try {
      await groupApi.createGroup({ name: newGroupName.trim() })
      setNewGroupName('')
      setShowCreateGroup(false)
      await loadGroups()
      await loadUngroupedCount()
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
        <img src="/logo.png" alt="Prompt管理" className="sidebar-logo" />
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
            {ungroupedCount}
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
              {group.prompt_count || 0}
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
