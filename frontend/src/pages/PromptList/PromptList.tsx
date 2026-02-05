import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePromptStore } from '../../store/promptStore'
import PromptCard from '../../components/PromptCard/PromptCard'
import './PromptList.css'

const PromptList: React.FC = () => {
  const navigate = useNavigate()
  const { prompts, loading, viewMode, setViewMode, fetchPrompts, page, total, pageSize, setPage } = usePromptStore()

  useEffect(() => {
    fetchPrompts()
  }, [page])

  const handleCardClick = (promptId: number) => {
    navigate(`/prompt/${promptId}`)
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="prompt-list-page">
      <div className="prompt-list-header">
        <h1 className="prompt-list-title">Prompt管理</h1>
        <div className="prompt-list-actions">
          <div className="prompt-list-view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'card' ? 'active' : ''}`}
              onClick={() => setViewMode('card')}
            >
              卡片
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              列表
            </button>
          </div>
          <button
            className="prompt-list-add-btn"
            onClick={() => navigate('/prompt/new')}
          >
            + 新建Prompt
          </button>
        </div>
      </div>

      {loading ? (
        <div className="prompt-list-loading">加载中...</div>
      ) : prompts.length === 0 ? (
        <div className="prompt-list-empty">
          <p>暂无Prompt</p>
          <button onClick={() => navigate('/prompt/new')}>创建第一个Prompt</button>
        </div>
      ) : (
        <>
          <div className={`prompt-list-content ${viewMode}`}>
            {prompts.map(prompt => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                onClick={() => handleCardClick(prompt.id)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="prompt-list-pagination">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                上一页
              </button>
              <span>
                第 {page} / {totalPages} 页
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default PromptList
