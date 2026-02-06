import React, { useState, useEffect, useRef, useCallback } from 'react'
import { promptApi, Prompt } from '../../services/api'
import './FloatBall.css'

const FloatBall: React.FC = () => {
  const [showMenu, setShowMenu] = useState(false)
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [menuPosition, setMenuPosition] = useState<React.CSSProperties>({})
  const [menuLayout, setMenuLayout] = useState<{
    horizontal: 'left' | 'right'
    vertical: 'top' | 'bottom'
  }>({ horizontal: 'right', vertical: 'bottom' })
  const [previewPrompt, setPreviewPrompt] = useState<Prompt | null>(null)
  const [previewPosition, setPreviewPosition] = useState<React.CSSProperties>({})
  const [copySuccess, setCopySuccess] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 3
  const ballRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const hideMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hoverPromptRef = useRef<Prompt | null>(null)
  const hoverItemRef = useRef<HTMLDivElement | null>(null)
  const lastMousePosRef = useRef<{ x: number; y: number } | null>(null)
  const lastMoveAtRef = useRef<number>(0)
  const isDraggingRef = useRef<boolean>(false)
  const clickStartTimeRef = useRef<number>(0)
  const clickStartPosRef = useRef<{ x: number; y: number } | null>(null)

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

  // 获取窗口位置
  const getWindowPosition = useCallback(async (): Promise<{ x: number; y: number }> => {
    if (window.electronAPI?.floatBallGetPosition) {
      const pos = await window.electronAPI.floatBallGetPosition()
      if (pos) {
        return { x: pos.x, y: pos.y }
      }
    }
    return { x: 0, y: 0 }
  }, [])

  // 计算菜单布局和位置（参考参考项目的实现）
  const calculateMenuLayout = useCallback(async () => {
    const { x: windowX, y: windowY } = await getWindowPosition()
    const currentWindowWidth = window.innerWidth || 500
    const currentWindowHeight = window.innerHeight || 640
    const screenWidth = window.screen.width
    const availHeight = window.screen.availHeight // 可用高度，排除任务栏
    
    // 悬浮球在窗口内的位置（相对于窗口）
    const ballTopInWindow = 300
    const ballSize = 40
    const ballXInWindow = currentWindowWidth / 2 // 悬浮球在窗口水平中心
    
    // 计算窗口中心在屏幕上的位置
    const windowCenterX = windowX + currentWindowWidth / 2
    
    // 计算到各边缘的距离
    const distToLeft = windowCenterX
    const distToRight = screenWidth - windowCenterX
    
    // 水平方向：窗口靠右 → 菜单靠左，窗口靠左 → 菜单靠右
    const horizontal: 'left' | 'right' = distToRight < distToLeft ? 'left' : 'right'
    
    // 计算悬浮球在屏幕上的实际Y坐标
    const ballCenterY = windowY + ballTopInWindow + ballSize / 2
    
    // 判断悬浮球是否在屏幕下半部分（相对于可用区域）
    const availCenterY = availHeight / 2
    const isInBottomHalf = ballCenterY > availCenterY
    
    // 菜单尺寸
    const menuWidth = 240
    const menuHeight = 400 // 估算菜单高度
    const gap = 5 // 菜单与悬浮球之间的间距
    const padding = 20 // 窗口内边距
    
    // 计算菜单在窗口内的位置（相对于窗口）
    let menuX: number
    let menuY: number
    let vertical: 'top' | 'bottom'
    
    // 水平位置计算
    if (horizontal === 'left') {
      // 菜单在左侧：菜单右边缘对齐到悬浮球左边缘
      menuX = ballXInWindow - ballSize / 2 - gap - menuWidth
    } else {
      // 菜单在右侧：菜单左边缘对齐到悬浮球右边缘
      menuX = ballXInWindow + ballSize / 2 + gap
    }
    
    // 垂直位置计算
    const ballTop = ballTopInWindow
    const ballBottom = ballTop + ballSize
    // 菜单在下方时，菜单上边缘对齐到悬浮球下边缘，使用0间距让边缘相接
    const menuYBottom = ballBottom // 菜单在下方时的Y位置（边缘相接）
    // 菜单在上方时，菜单下边缘对齐到悬浮球上边缘
    const menuYTop = ballTop - menuHeight // 菜单在上方时的Y位置（边缘相接）
    
    // 检查窗口内是否有足够空间显示菜单
    const availableSpaceTop = ballTop
    const availableSpaceBottom = currentWindowHeight - (ballTop + ballSize)
    
    // 根据窗口在屏幕上的位置决定菜单显示方向
    if (isInBottomHalf) {
      // 窗口在屏幕下半部分，菜单应该向上显示
      vertical = 'top'
      menuY = menuYTop // 菜单下边缘对齐到悬浮球上边缘
    } else {
      // 窗口在屏幕上半部分，菜单可以向下显示
      if (availableSpaceBottom >= menuHeight + padding) {
        // 下方有足够空间，优先显示在下方
        vertical = 'bottom'
        menuY = menuYBottom // 菜单上边缘对齐到悬浮球下边缘（边缘相接）
      } else if (availableSpaceTop >= menuHeight + padding) {
        // 上方有足够空间，显示在上方
        vertical = 'top'
        menuY = menuYTop // 菜单下边缘对齐到悬浮球上边缘（边缘相接）
      } else {
        // 如果上下都没有足够空间，选择空间更大的一侧
        if (availableSpaceBottom >= availableSpaceTop) {
          vertical = 'bottom'
          menuY = menuYBottom // 菜单上边缘对齐到悬浮球下边缘（边缘相接）
        } else {
          vertical = 'top'
          menuY = Math.max(padding, menuYTop) // 确保菜单不超出窗口顶部
        }
      }
    }
    
    // 确保菜单不超出窗口边界
    menuX = Math.max(padding, Math.min(menuX, currentWindowWidth - menuWidth - padding))
    if (!isInBottomHalf) {
      // 只在非屏幕下半部分时才调整 menuY，避免破坏对齐
      menuY = Math.max(padding, Math.min(menuY, currentWindowHeight - menuHeight - padding))
    } else {
      // 在屏幕下半部分时，确保菜单不超出窗口边界，但保持下沿对齐
      if (menuY < padding) {
        menuY = padding
      }
    }
    
    setMenuLayout({ horizontal, vertical })
    setMenuPosition({
      position: 'absolute',
      left: `${menuX}px`,
      top: `${menuY}px`,
    })
  }, [getWindowPosition])
  
  // 当菜单显示时，使用实际高度重新调整位置（参考参考项目的实现）
  useEffect(() => {
    if (showMenu && menuRef.current) {
      const actualMenuHeight = menuRef.current.offsetHeight
      const ballTop = 300
      const ballBottom = ballTop + 40
      
      if (actualMenuHeight > 0) {
        // 根据菜单布局方向调整位置
        if (menuLayout.vertical === 'top') {
          // 菜单在上方，菜单下边缘对齐到悬浮球上边缘（边缘相接）
          const newMenuY = ballTop - actualMenuHeight
          setMenuPosition(prev => ({
            ...prev,
            top: `${newMenuY}px`,
          }))
        } else {
          // 菜单在下方，菜单上边缘对齐到悬浮球下边缘（边缘相接）
          const newMenuY = ballBottom
          setMenuPosition(prev => ({
            ...prev,
            top: `${newMenuY}px`,
          }))
        }
      }
    }
  }, [showMenu, menuLayout.vertical])

  const handleMouseEnter = useCallback(async () => {
    if (isDraggingRef.current) {
      return
    }
    if (hideMenuTimeoutRef.current) {
      clearTimeout(hideMenuTimeoutRef.current)
      hideMenuTimeoutRef.current = null
    }
    // 计算菜单布局
    await calculateMenuLayout()
    setShowMenu(true)
    if (window.electronAPI?.floatBallSetIgnoreMouseEvents) {
      window.electronAPI.floatBallSetIgnoreMouseEvents(false)
    }
  }, [calculateMenuLayout])

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
      
      // 显示复制成功提示
      setCopySuccess(true)
      setTimeout(() => {
        setCopySuccess(false)
      }, 2000)
      
      // 通知主窗口显示复制成功提示
      if (window.electronAPI?.floatBallShowCopySuccess) {
        await window.electronAPI.floatBallShowCopySuccess(prompt.name)
      }
      
      // 复制后可以自动收起菜单（可选）
      setShowMenu(false)
      setPreviewPrompt(null)
      if (window.electronAPI?.floatBallSetIgnoreMouseEvents) {
        window.electronAPI.floatBallSetIgnoreMouseEvents(true, { forward: true })
      }
    } catch (error) {
      console.error('复制Prompt失败:', error)
    }
  }

  const showPreviewForHover = useCallback(() => {
    const prompt = hoverPromptRef.current
    const target = hoverItemRef.current
    const menuRect = menuRef.current?.getBoundingClientRect()
    if (!prompt || !target || !menuRect) return

    const rect = target.getBoundingClientRect()
    setPreviewPrompt(prompt)

    // 计算预览弹窗位置（在菜单的右侧或左侧）
    const previewWidth = 300
    const previewHeight = 200
    const gap = 8

    let previewX: number
    let previewY: number

    // 预览弹窗显示在菜单的右侧或左侧（根据菜单位置）
    if (menuLayout.horizontal === 'right') {
      // 菜单在右侧，预览显示在菜单左侧
      previewX = menuRect.left - previewWidth - gap
    } else {
      // 菜单在左侧，预览显示在菜单右侧
      previewX = menuRect.right + gap
    }

    // 预览弹窗垂直位置对齐到当前菜单项
    previewY = rect.top

    // 确保预览不超出屏幕
    const screenWidth = window.screen.width
    const screenHeight = window.screen.height

    // 如果预览在屏幕左侧超出，则显示在菜单另一侧
    if (previewX < 10) {
      if (menuLayout.horizontal === 'right') {
        previewX = menuRect.right + gap
      } else {
        previewX = menuRect.left - previewWidth - gap
      }
    }

    // 如果预览在屏幕右侧超出，调整位置
    if (previewX + previewWidth > screenWidth - 10) {
      previewX = screenWidth - previewWidth - 10
    }

    // 垂直方向调整
    if (previewY < 10) {
      previewY = 10
    }
    if (previewY + previewHeight > screenHeight - 10) {
      previewY = screenHeight - previewHeight - 10
    }

    setPreviewPosition({
      position: 'fixed',
      left: `${previewX}px`,
      top: `${previewY}px`,
    })
  }, [menuLayout.horizontal])

  const schedulePreviewShow = useCallback(() => {
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current)
    }
    previewTimeoutRef.current = setTimeout(() => {
      const idleMs = 300
      if (Date.now() - lastMoveAtRef.current < idleMs) {
        return
      }
      if (!menuRef.current) return
      showPreviewForHover()
    }, 300)
  }, [showPreviewForHover])

  // 处理鼠标悬停显示预览（鼠标静止时显示，移动则隐藏）
  const handlePromptMouseEnter = useCallback((prompt: Prompt, event: React.MouseEvent<HTMLDivElement>) => {
    hoverPromptRef.current = prompt
    hoverItemRef.current = event.currentTarget
    lastMousePosRef.current = { x: event.clientX, y: event.clientY }
    lastMoveAtRef.current = Date.now()
    schedulePreviewShow()
  }, [schedulePreviewShow])

  const handlePromptMouseMove = useCallback((prompt: Prompt, event: React.MouseEvent<HTMLDivElement>) => {
    if (!hoverPromptRef.current || hoverPromptRef.current.id !== prompt.id) {
      return
    }
    const lastPos = lastMousePosRef.current
    const dx = lastPos ? Math.abs(event.clientX - lastPos.x) : 2
    const dy = lastPos ? Math.abs(event.clientY - lastPos.y) : 2
    lastMousePosRef.current = { x: event.clientX, y: event.clientY }

    const moveThreshold = 2
    if (dx >= moveThreshold || dy >= moveThreshold) {
      lastMoveAtRef.current = Date.now()
      if (previewPrompt && previewPrompt.id === prompt.id) {
        setPreviewPrompt(null)
      }
      schedulePreviewShow()
    }
  }, [previewPrompt, schedulePreviewShow])

  const handlePromptMouseLeave = useCallback((prompt: Prompt) => {
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current)
      previewTimeoutRef.current = null
    }
    if (hoverPromptRef.current?.id === prompt.id) {
      hoverPromptRef.current = null
      hoverItemRef.current = null
      lastMousePosRef.current = null
    }
    if (previewPrompt?.id === prompt.id) {
      setPreviewPrompt(null)
    }
  }, [previewPrompt])

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

  // 移除二次调整位置的逻辑，位置在第一次计算时就确定好了

  useEffect(() => {
    return () => {
      if (hideMenuTimeoutRef.current) {
        clearTimeout(hideMenuTimeoutRef.current)
      }
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current)
      }
    }
  }, [])

  const filteredPrompts = searchKeyword
    ? prompts.filter(p =>
        p.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        p.content.toLowerCase().includes(searchKeyword.toLowerCase())
      )
    : prompts

  // 分页逻辑
  const totalPages = Math.ceil(filteredPrompts.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentPagePrompts = filteredPrompts.slice(startIndex, endIndex)

  // 当搜索关键词变化时，重置到第一页
  useEffect(() => {
    setCurrentPage(1)
  }, [searchKeyword])

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
            clickStartTimeRef.current = Date.now()
            clickStartPosRef.current = { x: e.clientX, y: e.clientY }
            if (window.electronAPI?.floatBallDragStart) {
              window.electronAPI.floatBallDragStart()
            }
            const handleMouseUp = (upEvent: MouseEvent) => {
              const moved = clickStartPosRef.current && (
                Math.abs(upEvent.clientX - clickStartPosRef.current.x) > 5 ||
                Math.abs(upEvent.clientY - clickStartPosRef.current.y) > 5
              )
              const clickDuration = Date.now() - clickStartTimeRef.current
              
              if (isDraggingRef.current) {
                isDraggingRef.current = false
                if (window.electronAPI?.floatBallDragEnd) {
                  window.electronAPI.floatBallDragEnd()
                }
                document.removeEventListener('mouseup', handleMouseUp)
                
                // 如果没有移动且点击时间很短，说明是点击，打开主窗口
                if (!moved && clickDuration < 300) {
                  if (window.electronAPI?.floatBallOpenMain) {
                    window.electronAPI.floatBallOpenMain()
                  }
                }
              }
            }
            document.addEventListener('mouseup', handleMouseUp)
          }
        }}
      >
        <div className="float-ball-icon-wrapper">
          <img src="/logo.png" alt="Prompt管理" className="float-ball-logo" />
        </div>
      </div>

      {showMenu && (
        <div
          ref={menuRef}
          className={`float-ball-menu float-ball-menu-${menuLayout.horizontal}-${menuLayout.vertical}`}
          style={menuPosition}
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
            <div className="float-ball-menu-hint">点击复制</div>
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
              <>
                {currentPagePrompts.map(prompt => (
                  <div
                    key={prompt.id}
                    className="float-ball-menu-item"
                    onClick={() => handleCopyPrompt(prompt)}
                    onMouseEnter={(e) => handlePromptMouseEnter(prompt, e)}
                    onMouseMove={(e) => handlePromptMouseMove(prompt, e)}
                    onMouseLeave={() => handlePromptMouseLeave(prompt)}
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
                ))}
                {totalPages > 1 && (
                  <div className="float-ball-menu-pagination">
                    <button
                      className="float-ball-menu-page-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (currentPage > 1) {
                          setCurrentPage(currentPage - 1)
                        }
                      }}
                      disabled={currentPage === 1}
                    >
                      上一页
                    </button>
                    <span className="float-ball-menu-page-info">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      className="float-ball-menu-page-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (currentPage < totalPages) {
                          setCurrentPage(currentPage + 1)
                        }
                      }}
                      disabled={currentPage === totalPages}
                    >
                      下一页
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {previewPrompt && (
        <div
          ref={previewRef}
          className="float-ball-preview"
          style={previewPosition}
          onMouseMove={() => {
            setPreviewPrompt(null)
          }}
        >
          <div className="float-ball-preview-header">
            <div className="float-ball-preview-title">{previewPrompt.name}</div>
            {previewPrompt.tags.length > 0 && (
              <div className="float-ball-preview-tags">
                {previewPrompt.tags.map(tag => (
                  <span
                    key={tag.id}
                    className="float-ball-preview-tag"
                    style={{ backgroundColor: tag.color + '20', color: tag.color }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="float-ball-preview-content">
            {previewPrompt.content}
          </div>
        </div>
      )}

      {copySuccess && (
        <div className="float-ball-copy-success">
          复制成功
        </div>
      )}
    </div>
  )
}

export default FloatBall
