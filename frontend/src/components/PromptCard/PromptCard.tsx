import React, { useState } from 'react'
import { Prompt, promptApi } from '../../services/api'
import { modalManager } from '../Modal'
import './PromptCard.css'

interface PromptCardProps {
  prompt: Prompt
  onClick: () => void
}

const PromptCard: React.FC<PromptCardProps> = ({ prompt, onClick }) => {
  const [copying, setCopying] = useState(false)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'copied'>('idle')
  const contentPreview = prompt.content.length > 100
    ? prompt.content.substring(0, 100) + '...'
    : prompt.content

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation() // 阻止事件冒泡，避免触发卡片点击
    if (copying || copyStatus === 'copying') return
    
    setCopying(true)
    setCopyStatus('copying')
    try {
      const result = await promptApi.copyPrompt(prompt.id)
      // 复制到剪贴板
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(result.content)
        setCopyStatus('copied')
        // 发送复制成功事件，由 Layout 组件显示 Toast
        window.dispatchEvent(new CustomEvent('prompt-copied', { 
          detail: { promptName: prompt.name } 
        }))
        setTimeout(() => {
          setCopyStatus('idle')
          setCopying(false)
        }, 1500)
      } else {
        setCopyStatus('idle')
        setCopying(false)
      }
    } catch (error) {
      console.error('复制失败:', error)
      setCopyStatus('idle')
      setCopying(false)
      modalManager.alert('复制失败，请重试', '错误')
    }
  }

  const getCopyButtonText = () => {
    if (copyStatus === 'copied') return '已复制'
    if (copyStatus === 'copying') return '复制中...'
    return '复制'
  }

  return (
    <div className="prompt-card glass-panel" onClick={onClick}>
      <div className="prompt-card-header">
        <h3 className="prompt-card-title">{prompt.name}</h3>
        <div className="prompt-card-header-right">
          {prompt.group && (
            <span className="prompt-card-group">{prompt.group.name}</span>
          )}
          <button
            className={`prompt-card-copy-btn ${copyStatus === 'copied' ? 'copied' : ''}`}
            onClick={handleCopy}
            disabled={copying || copyStatus === 'copying'}
            title="复制Prompt内容"
          >
            {getCopyButtonText()}
          </button>
        </div>
      </div>

      <p className="prompt-card-content">{contentPreview}</p>

      {prompt.description && (
        <p className="prompt-card-description">{prompt.description}</p>
      )}

      {prompt.tags.length > 0 && (
        <div className="prompt-card-tags">
          {prompt.tags.map(tag => (
            <span
              key={tag.id}
              className="prompt-card-tag"
              style={{ backgroundColor: tag.color + '20', color: tag.color }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      <div className="prompt-card-footer">
        <span className="prompt-card-meta">
          使用 {prompt.usage_count} 次
        </span>
        <span className="prompt-card-meta">
          {new Date(prompt.updated_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  )
}

export default PromptCard
