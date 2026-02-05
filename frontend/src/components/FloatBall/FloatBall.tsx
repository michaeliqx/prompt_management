import React, { useState, useEffect, useRef, useCallback } from 'react'
import { promptApi, Prompt } from '../../services/api'
import './FloatBall.css'

declare global {
  interface Window {
    electronAPI?: {
      floatBallGetPosition?: () => Promise<{ x: number; y: number } | null>
      floatBallSetSize?: (width: number, height: number) => Promise<void>
      floatBallSetIgnoreMouseEvents?: (ignore: boolean, options?: { forward?: boolean }) => Promise<void>
      floatBallDragStart?: () => Promise<void>
      floatBallDragEnd?: () => Promise<void>
      floatBallClose?: () => Promise<void>
    }
  }
}

const FloatBall: React.FC = () => {
  const [showMenu, setShowMenu] = useState(false)
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const ballRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const hideMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isDraggingRef = useRef<boolean>(false)

  useEffect(() => {
    if (showMenu) {
      loadPrompts()
    }
  }, [showMenu])

  const loadPrompts = async () => {
    setLoading(true)
    try {
      const response = await promptApi.getPrompts({
        page: 1,
        page_size: 50,
        keyword: searchKeyword || undefined,
      })
      setPrompts(response.items)
    } catch (error) {
      console.error('加载Prompt列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (showMenu && searchKeyword !== undefined) {
      const timeout = setTimeout(() => {
        loadPrompts()
      }, 300)
      return () => clearTimeout(timeout)
    }
  }, [searchKeyword])

  const handleMouseEnter = useCallback(() => {
    if (isDraggingRef.current) {
      return
    }
    if (hideMenuTimeoutRef.current) {
      clearTimeout(hideMenuTimeoutRef.current)
      hideMenuTimeoutRef.current = null
    }
    setShowMenu(true)
    if (window.electronAPI?.floatBallSetIgnoreMouseEvents) {
      window.electronAPI.floatBallSetIgnoreMouseEvents(false)
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    hideMenuTimeoutRef.current = setTimeout(() => {
      setShowMenu(false)
      if (window.electronAPI?.floatBallSetIgnoreMouseEvents) {
        window.electronAPI.floatBallSetIgnoreMouseEvents(true, { forward: true })
      }
    }, 200)
  }, [])

  const handleCopyPrompt = async (prompt: Prompt) => {
    try {
      const result = await promptApi.copyPrompt(prompt.id)
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(result.content)
      }
      // 复制后可以自动收起菜单（可选）
      setShowMenu(false)
      if (window.electronAPI?.floatBallSetIgnoreMouseEvents) {
        window.electronAPI.floatBallSetIgnoreMouseEvents(true, { forward: true })
      }
    } catch (error) {
      console.error('复制Prompt失败:', error)
    }
  }

  useEffect(() => {
    if (showMenu) {
      if (window.electronAPI?.floatBallSetIgnoreMouseEvents) {
        window.electronAPI.floatBallSetIgnoreMouseEvents(false)
      }
    } else {
      if (window.electronAPI?.floatBallSetIgnoreMouseEvents) {
        window.electronAPI.floatBallSetIgnoreMouseEvents(true, { forward: true })
      }
    }
  }, [showMenu])

  useEffect(() => {
    if (window.electronAPI?.floatBallSetIgnoreMouseEvents) {
      window.electronAPI.floatBallSetIgnoreMouseEvents(true, { forward: true })
    }
  }, [])

  useEffect(() => {
    return () => {
      if (hideMenuTimeoutRef.current) {
        clearTimeout(hideMenuTimeoutRef.current)
      }
    }
  }, [])

  const filteredPrompts = searchKeyword
    ? prompts.filter(p =>
        p.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        p.content.toLowerCase().includes(searchKeyword.toLowerCase())
      )
    : prompts

  return (
    <div className="float-ball-container">
      <div
        ref={ballRef}
        className="float-ball"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={(e) => {
          if (e.button === 0) {
            e.preventDefault()
            e.stopPropagation()
            setShowMenu(false)
            isDraggingRef.current = true
            if (window.electronAPI?.floatBallDragStart) {
              window.electronAPI.floatBallDragStart()
            }
            const handleMouseUp = () => {
              if (isDraggingRef.current) {
                isDraggingRef.current = false
                if (window.electronAPI?.floatBallDragEnd) {
                  window.electronAPI.floatBallDragEnd()
                }
                document.removeEventListener('mouseup', handleMouseUp)
              }
            }
            document.addEventListener('mouseup', handleMouseUp)
          }
        }}
      >
        <div className="float-ball-icon-wrapper">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="18" fill="var(--accent)" />
            <text x="20" y="26" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">P</text>
          </svg>
        </div>
      </div>

      {showMenu && (
        <div
          ref={menuRef}
          className="float-ball-menu"
          onMouseEnter={() => {
            if (hideMenuTimeoutRef.current) {
              clearTimeout(hideMenuTimeoutRef.current)
              hideMenuTimeoutRef.current = null
            }
            setShowMenu(true)
          }}
          onMouseLeave={handleMouseLeave}
          onClick={(e) => {
            e.stopPropagation()
          }}
        >
          <div className="float-ball-menu-header">
            <h3>Prompt列表</h3>
          </div>

          <div className="float-ball-menu-search">
            <input
              type="text"
              placeholder="搜索Prompt..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="float-ball-menu-search-input"
            />
          </div>

          <div className="float-ball-menu-list">
            {loading ? (
              <div className="float-ball-menu-loading">加载中...</div>
            ) : filteredPrompts.length === 0 ? (
              <div className="float-ball-menu-empty">暂无Prompt</div>
            ) : (
              filteredPrompts.map(prompt => (
                <div
                  key={prompt.id}
                  className="float-ball-menu-item"
                  onClick={() => handleCopyPrompt(prompt)}
                >
                  <div className="float-ball-menu-item-name">{prompt.name}</div>
                  {prompt.tags.length > 0 && (
                    <div className="float-ball-menu-item-tags">
                      {prompt.tags.slice(0, 2).map(tag => (
                        <span
                          key={tag.id}
                          className="float-ball-menu-item-tag"
                          style={{ backgroundColor: tag.color + '20', color: tag.color }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default FloatBall
