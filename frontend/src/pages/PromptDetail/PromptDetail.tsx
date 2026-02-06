import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePromptStore } from '../../store/promptStore'
import { groupApi, tagApi, imageApi, promptApi, PromptGroup, PromptTag } from '../../services/api'
import { modalManager } from '../../components/Modal'
import './PromptDetail.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const PromptDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentPrompt, loading, fetchPrompt, updatePrompt, deletePrompt, copyPrompt } = usePromptStore()
  const [isEditing, setIsEditing] = useState(id === 'new')
  const [groups, setGroups] = useState<PromptGroup[]>([])
  const [tags, setTags] = useState<PromptTag[]>([])
  const [pendingImages, setPendingImages] = useState<File[]>([])
  const [showCreateTag, setShowCreateTag] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#1890ff')
  
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
        tag_ids: currentPrompt.tags?.map(t => t.id) ?? [],
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
        // 创建prompt
        const createdPrompt = await promptApi.createPrompt({
          name: formData.name,
          content: formData.content,
          description: formData.description || undefined,
          group_id: formData.group_id ?? undefined,
          tag_ids: formData.tag_ids,
        })
        // 如果有待上传的图片，上传它们
        if (pendingImages.length > 0 && createdPrompt) {
          for (const imageFile of pendingImages) {
            try {
              await imageApi.uploadImage(createdPrompt.id, imageFile)
            } catch (error) {
              console.error('上传图片失败:', error)
            }
          }
          setPendingImages([])
        }
        await usePromptStore.getState().fetchPrompts()
        navigate('/')
      } else {
        await updatePrompt(Number(id), {
          name: formData.name,
          content: formData.content,
          description: formData.description || undefined,
          group_id: formData.group_id ?? undefined,
          tag_ids: formData.tag_ids,
        })
        await fetchPrompt(Number(id))
        setIsEditing(false)
      }
    } catch (error) {
      console.error('保存失败:', error)
    }
  }

  const handleDelete = async () => {
    if (!id || id === 'new') return
    const confirmed = await modalManager.confirm('确定要删除这个Prompt吗？', '删除确认')
    if (confirmed) {
      await deletePrompt(Number(id))
      navigate('/')
    }
  }

  const handleCopy = async () => {
    if (!id || id === 'new') return
    try {
      await copyPrompt(Number(id))
      // 发送复制成功事件，由 Layout 组件显示 Toast
      window.dispatchEvent(new CustomEvent('prompt-copied', { 
        detail: { promptName: currentPrompt?.name || 'Prompt' } 
      }))
    } catch (error) {
      console.error('复制失败:', error)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return
    
    if (id === 'new') {
      // 创建模式：将图片添加到待上传列表
      setPendingImages([...pendingImages, e.target.files[0]])
    } else {
      // 编辑模式：直接上传
      try {
        await imageApi.uploadImage(Number(id), e.target.files[0])
        await fetchPrompt(Number(id))
      } catch (error) {
        console.error('上传图片失败:', error)
      }
    }
    // 重置input
    e.target.value = ''
  }

  const handleRemovePendingImage = (index: number) => {
    setPendingImages(pendingImages.filter((_, i) => i !== index))
  }

  const handleDeleteImage = async (imageId: number) => {
    const confirmed = await modalManager.confirm('确定要删除这张效果图吗？', '删除确认')
    if (!confirmed) return
    try {
      await imageApi.deleteImage(imageId)
      if (id && id !== 'new') {
        await fetchPrompt(Number(id))
      }
    } catch (error) {
      console.error('删除图片失败:', error)
      await modalManager.alert('删除图片失败，请重试', '错误')
    }
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      await modalManager.alert('请输入标签名称', '提示')
      return
    }
    try {
      const newTag = await tagApi.createTag({ name: newTagName.trim(), color: newTagColor })
      setTags([...tags, newTag])
      setFormData({ ...formData, tag_ids: [...formData.tag_ids, newTag.id] })
      setNewTagName('')
      setNewTagColor('#1890ff')
      setShowCreateTag(false)
    } catch (error: any) {
      console.error('创建标签失败:', error)
      await modalManager.alert(error.response?.data?.detail || '创建标签失败', '错误')
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
          {id !== 'new' && !isEditing && (
            <>
              <button className="prompt-detail-edit-btn" onClick={() => setIsEditing(!isEditing)}>
                编辑
              </button>
              <button className="prompt-detail-delete-btn" onClick={handleDelete}>
                删除
              </button>
            </>
          )}
          {id !== 'new' && isEditing && (
            <>
              <button className="prompt-detail-edit-btn" onClick={() => setIsEditing(false)}>
                取消
              </button>
              <button className="prompt-detail-save-btn" onClick={handleSave}>
                保存
              </button>
            </>
          )}
          {id === 'new' && (
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
                  <button
                    type="button"
                    className="prompt-detail-create-tag-btn"
                    onClick={() => setShowCreateTag(!showCreateTag)}
                  >
                    + 新建标签
                  </button>
                </div>
                {showCreateTag && (
                  <div className="prompt-detail-create-tag-form">
                    <input
                      type="text"
                      placeholder="标签名称"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      className="prompt-detail-create-tag-input"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCreateTag()
                        } else if (e.key === 'Escape') {
                          setShowCreateTag(false)
                          setNewTagName('')
                          setNewTagColor('#1890ff')
                        }
                      }}
                    />
                    <div className="prompt-detail-create-tag-color-wrapper">
                      <button
                        type="button"
                        className="prompt-detail-create-tag-color-btn"
                        style={{ backgroundColor: newTagColor }}
                        onClick={() => {
                          const colorInput = document.createElement('input')
                          colorInput.type = 'color'
                          colorInput.value = newTagColor
                          colorInput.onchange = (e: any) => setNewTagColor(e.target.value)
                          colorInput.click()
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleCreateTag}
                      className="prompt-detail-create-tag-submit"
                    >
                      创建
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateTag(false)
                        setNewTagName('')
                        setNewTagColor('#1890ff')
                      }}
                      className="prompt-detail-create-tag-cancel"
                    >
                      取消
                    </button>
                  </div>
                )}
              </div>

              <div className="prompt-detail-field">
                <label>效果图</label>
                {id === 'new' && pendingImages.length > 0 && (
                  <div className="prompt-detail-pending-images">
                    {pendingImages.map((file, index) => (
                      <div key={index} className="prompt-detail-pending-image-item">
                        <img src={URL.createObjectURL(file)} alt={file.name} />
                        <button
                          type="button"
                          onClick={() => handleRemovePendingImage(index)}
                          className="prompt-detail-remove-image-btn"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {id !== 'new' && currentPrompt?.images && currentPrompt.images.length > 0 && (
                  <div className="prompt-detail-pending-images">
                    {currentPrompt.images.map((image) => (
                      <div key={image.id} className="prompt-detail-pending-image-item">
                        <img src={`${API_BASE_URL}/${image.file_path}`} alt={image.file_name} />
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(image.id)}
                          className="prompt-detail-remove-image-btn"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="prompt-detail-upload">
                  <label>
                    <span>上传效果图</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                  </label>
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

              {(currentPrompt?.tags?.length ?? 0) > 0 && (
                <div className="prompt-detail-tags">
                  {(currentPrompt?.tags ?? []).map(tag => (
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

              <div className="prompt-detail-content-text-wrapper">
                <div className="prompt-detail-content-text">
                  <pre>{currentPrompt?.content}</pre>
                </div>
                {id !== 'new' && !isEditing && (
                  <button className="prompt-detail-copy-btn-inline" onClick={handleCopy} title="复制Prompt内容">
                    复制
                  </button>
                )}
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
                        <img src={`${API_BASE_URL}/${image.file_path}`} alt={image.file_name} />
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
                    <span>上传效果图</span>
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
