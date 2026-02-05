import React from 'react'
import { Prompt } from '../../services/api'
import './PromptCard.css'

interface PromptCardProps {
  prompt: Prompt
  onClick: () => void
}

const PromptCard: React.FC<PromptCardProps> = ({ prompt, onClick }) => {
  const contentPreview = prompt.content.length > 100
    ? prompt.content.substring(0, 100) + '...'
    : prompt.content

  return (
    <div className="prompt-card glass-panel" onClick={onClick}>
      <div className="prompt-card-header">
        <h3 className="prompt-card-title">{prompt.name}</h3>
        {prompt.group && (
          <span className="prompt-card-group">{prompt.group.name}</span>
        )}
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
