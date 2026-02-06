import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import FloatBall from '../FloatBall'
import { promptApi } from '../../../services/api'

vi.mock('../../../services/api', () => ({
  promptApi: {
    getPrompts: vi.fn(),
    copyPrompt: vi.fn(),
  },
}))

describe('FloatBall 预览逻辑', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(window as any).electronAPI = {
      floatBallGetPosition: vi.fn().mockResolvedValue({ x: 0, y: 0 }),
      floatBallSetIgnoreMouseEvents: vi.fn(),
    }
    Object.defineProperty(window, 'innerWidth', { value: 500, writable: true })
    Object.defineProperty(window, 'innerHeight', { value: 640, writable: true })
    Object.defineProperty(window, 'screen', {
      value: { width: 1920, height: 1080, availHeight: 1040 },
      writable: true,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('鼠标静止显示预览，移动则隐藏', async () => {
    const mockPrompts = [
      {
        id: 1,
        name: 'Mock Prompt',
        content: 'Mock Content',
        usage_count: 0,
        created_at: '',
        updated_at: '',
        tags: [],
        images: [],
      },
    ]
    vi.mocked(promptApi.getPrompts).mockResolvedValue({
      items: mockPrompts,
      total: 1,
      page: 1,
      page_size: 50,
    })

    render(<FloatBall />)

    const ball = document.querySelector('.float-ball') as HTMLElement
    expect(ball).toBeTruthy()
    act(() => {
      fireEvent.mouseEnter(ball)
    })

    const item = await screen.findByText('Mock Prompt')

    vi.useFakeTimers()
    act(() => {
      fireEvent.mouseEnter(item, { clientX: 100, clientY: 100 })
    })
    await act(async () => {
      vi.advanceTimersByTime(310)
    })
    expect(screen.queryByText('Mock Content')).toBeTruthy()

    act(() => {
      fireEvent.mouseMove(item, { clientX: 120, clientY: 100 })
    })
    expect(screen.queryByText('Mock Content')).toBeNull()
  })
})
