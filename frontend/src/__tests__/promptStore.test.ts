/**
 * Prompt Store单元测试
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { usePromptStore } from '../store/promptStore'
import { promptApi } from '../services/api'

// Mock API
vi.mock('../services/api', () => ({
  promptApi: {
    getPrompts: vi.fn(),
    getPrompt: vi.fn(),
    createPrompt: vi.fn(),
    updatePrompt: vi.fn(),
    deletePrompt: vi.fn(),
    copyPrompt: vi.fn(),
  },
}))

describe('PromptStore', () => {
  beforeEach(() => {
    // 重置store状态
    usePromptStore.setState({
      prompts: [],
      currentPrompt: null,
      loading: false,
      searchKeyword: '',
      selectedGroup: null,
      selectedTags: [],
      viewMode: 'card',
      total: 0,
      page: 1,
      pageSize: 20,
    })
    vi.clearAllMocks()
  })

  describe('fetchPrompts', () => {
    it('应该成功获取Prompt列表', async () => {
      const mockPrompts = [
        { id: 1, name: 'Test Prompt 1', content: 'Content 1', usage_count: 0, created_at: '', updated_at: '', tags: [], images: [] },
        { id: 2, name: 'Test Prompt 2', content: 'Content 2', usage_count: 0, created_at: '', updated_at: '', tags: [], images: [] },
      ]
      const mockResponse = {
        items: mockPrompts,
        total: 2,
        page: 1,
        page_size: 20,
      }

      vi.mocked(promptApi.getPrompts).mockResolvedValue(mockResponse)

      await usePromptStore.getState().fetchPrompts()

      expect(promptApi.getPrompts).toHaveBeenCalled()
      expect(usePromptStore.getState().prompts).toEqual(mockPrompts)
      expect(usePromptStore.getState().total).toBe(2)
      expect(usePromptStore.getState().loading).toBe(false)
    })

    it('应该在加载时设置loading状态', async () => {
      vi.mocked(promptApi.getPrompts).mockImplementation(() => new Promise(() => {}))

      const promise = usePromptStore.getState().fetchPrompts()
      expect(usePromptStore.getState().loading).toBe(true)

      // 取消promise以避免未完成的测试
      promise.catch(() => {})
    })

    it('应该在错误时处理异常', async () => {
      const error = new Error('API Error')
      vi.mocked(promptApi.getPrompts).mockRejectedValue(error)

      await usePromptStore.getState().fetchPrompts()

      expect(usePromptStore.getState().loading).toBe(false)
    })
  })

  describe('fetchPrompt', () => {
    it('应该成功获取Prompt详情', async () => {
      const mockPrompt = {
        id: 1,
        name: 'Test Prompt',
        content: 'Content',
        usage_count: 0,
        created_at: '',
        updated_at: '',
        tags: [],
        images: [],
      }

      vi.mocked(promptApi.getPrompt).mockResolvedValue(mockPrompt)

      await usePromptStore.getState().fetchPrompt(1)

      expect(promptApi.getPrompt).toHaveBeenCalledWith(1)
      expect(usePromptStore.getState().currentPrompt).toEqual(mockPrompt)
    })
  })

  describe('createPrompt', () => {
    it('应该成功创建Prompt并刷新列表', async () => {
      const newPrompt = {
        name: 'New Prompt',
        content: 'New Content',
        description: 'Description',
      }

      vi.mocked(promptApi.createPrompt).mockResolvedValue({} as any)
      vi.mocked(promptApi.getPrompts).mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        page_size: 20,
      })

      await usePromptStore.getState().createPrompt(newPrompt)

      expect(promptApi.createPrompt).toHaveBeenCalledWith(newPrompt)
      expect(promptApi.getPrompts).toHaveBeenCalled()
    })
  })

  describe('updatePrompt', () => {
    it('应该成功更新Prompt', async () => {
      const updateData = { name: 'Updated Name' }

      vi.mocked(promptApi.updatePrompt).mockResolvedValue({} as any)
      vi.mocked(promptApi.getPrompt).mockResolvedValue({} as any)
      vi.mocked(promptApi.getPrompts).mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        page_size: 20,
      })

      await usePromptStore.getState().updatePrompt(1, updateData)

      expect(promptApi.updatePrompt).toHaveBeenCalledWith(1, updateData)
    })
  })

  describe('deletePrompt', () => {
    it('应该成功删除Prompt', async () => {
      vi.mocked(promptApi.deletePrompt).mockResolvedValue()
      vi.mocked(promptApi.getPrompts).mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        page_size: 20,
      })

      usePromptStore.setState({ currentPrompt: { id: 1 } as any })

      await usePromptStore.getState().deletePrompt(1)

      expect(promptApi.deletePrompt).toHaveBeenCalledWith(1)
      expect(usePromptStore.getState().currentPrompt).toBeNull()
    })
  })

  describe('copyPrompt', () => {
    it('应该成功复制Prompt到剪贴板', async () => {
      const mockResult = { content: 'Copied Content' }
      vi.mocked(promptApi.copyPrompt).mockResolvedValue(mockResult)

      // Mock clipboard API
      const writeTextMock = vi.fn().mockResolvedValue(undefined)
      Object.assign(navigator, { clipboard: { writeText: writeTextMock } })

      await usePromptStore.getState().copyPrompt(1)

      expect(promptApi.copyPrompt).toHaveBeenCalledWith(1)
      expect(writeTextMock).toHaveBeenCalledWith('Copied Content')
    })
  })

  describe('setSearchKeyword', () => {
    it('应该设置搜索关键词并重置页码', () => {
      usePromptStore.setState({ page: 5 })
      usePromptStore.getState().setSearchKeyword('test')

      expect(usePromptStore.getState().searchKeyword).toBe('test')
      expect(usePromptStore.getState().page).toBe(1)
    })
  })

  describe('setSelectedGroup', () => {
    it('应该设置选中的分组并重置页码', () => {
      usePromptStore.setState({ page: 5 })
      usePromptStore.getState().setSelectedGroup(1)

      expect(usePromptStore.getState().selectedGroup).toBe(1)
      expect(usePromptStore.getState().page).toBe(1)
    })
  })
})
