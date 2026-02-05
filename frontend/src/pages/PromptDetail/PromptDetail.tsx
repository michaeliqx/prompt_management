import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePromptStore } from '../../store/promptStore'
import { groupApi, tagApi, imageApi, PromptGroup, PromptTag } from '../../services/api'
import './PromptDetail.css'

const PromptDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentPrompt, loading, fetchPrompt, updatePrompt, deletePrompt, copyPrompt } = usePromptStore()
  const [isEditing, setIsEditing] = useState(id === 'new')
  const [groups, setGroups] = useState<PromptGroup[]>([])
  const [tags, setTags] = useState<PromptTag[]>([])
  
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    description: '',
    group_id: null as number | null,
    tag_ids: [] as number[],
  })

  useEffect(() => {
    if (id && id !== 'new') {
      fetchPrompt(Number(id))
    }
    loadGroups()
    loadTags()
  }, [id])

  useEffect(() => {
    if (currentPrompt && id !== 'new') {
      setFormData({
        name: currentPrompt.name,
        content: currentPrompt.content,
        description: currentPrompt.description || '',
        group_id: currentPrompt.group_id || null,
        tag_ids: currentPrompt.tags.map(t => t.id),
      })
    }
  }, [currentPrompt])

  const loadGroups = async () => {
    try {
      const data = await groupApi.getGroups()
      setGroups(data)
    } catch (error) {
      console.error('加载分组失败:', error)
    }
  }

  const loadTags = async () => {
    try {
      const data = await tagApi.getTags()
      setTags(data)
    } catch (error) {
      console.error('加载标签失败:', error)
    }
  }

  const handleSave = async () => {
    try {
      if (id === 'new') {
        await usePromptStore.getState().createPrompt(formData)
        navigate('/')
      } else {
        await updatePrompt(Number(id), formData)
        setIsEditing(false)
      }
    } catch (error) {
      console.error('保存失败:', error)
    }
  }

  const handleDelete = async () => {
    if (!id || id === 'new') return
    if (window.confirm('确定要删除这个Prompt吗？')) {
      await deletePrompt(Number(id))
      navigate('/')
    }
  }

  const handleCopy = async () => {
    if (!id || id === 'new') return
    try {
      await copyPrompt(Number(id))
      alert('已复制到剪贴板')
    } catch (error) {
      console.error('复制失败:', error)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!id || id === 'new' || !e.target.files?.[0]) return
    try {
      await imageApi.uploadImage(Number(id), e.target.files[0])
      await fetchPrompt(Number(id))
    } catch (error) {
      console.error('上传图片失败:', error)
    }
  }

  if (loading && id !== 'new') {
    return <div className="prompt-detail-loading">加载中...</div>
  }

  return (
    <div className="prompt-detail">
      <div className="prompt-detail-header">
        <button className="prompt-detail-back-btn" onClick={() => navigate('/')}>
          ← 返回
        </button>
        <div className="prompt-detail-actions">
          {id !== 'new' && (
            <>
              <button className="prompt-detail-copy-btn" onClick={handleCopy}>
                复制
              </button>
              <button className="prompt-detail-edit-btn" onClick={() => setIsEditing(!isEditing)}>
                {isEditing ? '取消' : '编辑'}
              </button>
              <button className="prompt-detail-delete-btn" onClick={handleDelete}>
                删除
              </button>
            </>
          )}
          {isEditing && (
            <button className="prompt-detail-save-btn" onClick={handleSave}>
              保存
            </button>
          )}
        </div>
      </div>

      <div className="prompt-detail-content">
        <div className="prompt-detail-main">
          {isEditing ? (
            <>
              <div className="prompt-detail-field">
                <label>名称 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Prompt名称"
                />
              </div>

              <div className="prompt-detail-field">
                <label>内容 *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Prompt内容"
                  rows={10}
                />
              </div>

              <div className="prompt-detail-field">
                <label>备注说明</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="备注说明（可选）"
                  rows={4}
                />
              </div>

              <div className="prompt-detail-field">
                <label>分组</label>
                <select
                  value={formData.group_id || ''}
                  onChange={(e) => setFormData({ ...formData, group_id: e.target.value ? Number(e.target.value) : null })}
                >
                  <option value="">未分组</option>
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              </div>

              <div className="prompt-detail-field">
                <label>标签</label>
                <div className="prompt-detail-tags-select">
                  {tags.map(tag => (
                    <label key={tag.id} className="prompt-detail-tag-checkbox">
                      <input
                        type="checkbox"
                        checked={formData.tag_ids.includes(tag.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, tag_ids: [...formData.tag_ids, tag.id] })
                          } else {
                            setFormData({ ...formData, tag_ids: formData.tag_ids.filter(id => id !== tag.id) })
                          }
                        }}
                      />
                      <span style={{ color: tag.color }}>{tag.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <h1 className="prompt-detail-title">{currentPrompt?.name}</h1>
              
              {currentPrompt?.group && (
                <div className="prompt-detail-group">
                  分组: {currentPrompt.group.name}
                </div>
              )}

              {currentPrompt?.tags.length > 0 && (
                <div className="prompt-detail-tags">
                  {currentPrompt.tags.map(tag => (
                    <span
                      key={tag.id}
                      className="prompt-detail-tag"
                      style={{ backgroundColor: tag.color + '20', color: tag.color }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}

              <div className="prompt-detail-content-text">
                <pre>{currentPrompt?.content}</pre>
              </div>

              {currentPrompt?.description && (
                <div className="prompt-detail-description">
                  <h3>备注说明</h3>
                  <p>{currentPrompt.description}</p>
                </div>
              )}

              {currentPrompt?.images && currentPrompt.images.length > 0 && (
                <div className="prompt-detail-images">
                  <h3>效果图</h3>
                  <div className="prompt-detail-images-grid">
                    {currentPrompt.images.map(image => (
                      <div key={image.id} className="prompt-detail-image-item">
                        <img src={`http://localhost:8000/${image.file_path}`} alt={image.file_name} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="prompt-detail-meta">
                <div>使用次数: {currentPrompt?.usage_count}</div>
                <div>创建时间: {currentPrompt?.created_at ? new Date(currentPrompt.created_at).toLocaleString() : ''}</div>
                <div>更新时间: {currentPrompt?.updated_at ? new Date(currentPrompt.updated_at).toLocaleString() : ''}</div>
              </div>

              {id !== 'new' && (
                <div className="prompt-detail-upload">
                  <label>
                    上传效果图
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                  </label>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default PromptDetail
