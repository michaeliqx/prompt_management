import { create } from 'zustand'
import { promptApi, Prompt, PromptListParams } from '../services/api'

interface PromptState {
  prompts: Prompt[]
  currentPrompt: Prompt | null
  loading: boolean
  searchKeyword: string
  selectedGroup: number | null
  selectedTags: number[]
  viewMode: 'list' | 'card'
  total: number
  page: number
  pageSize: number
  
  // Actions
  fetchPrompts: (params?: PromptListParams) => Promise<void>
  fetchPrompt: (id: number) => Promise<void>
  createPrompt: (data: {
    name: string
    content: string
    description?: string
    group_id?: number
    tag_ids?: number[]
  }) => Promise<Prompt>
  updatePrompt: (id: number, data: Partial<{
    name: string
    content: string
    description?: string
    group_id?: number
    tag_ids?: number[]
  }>) => Promise<void>
  deletePrompt: (id: number) => Promise<void>
  copyPrompt: (id: number) => Promise<void>
  setSearchKeyword: (keyword: string) => void
  setSelectedGroup: (groupId: number | null) => void
  setSelectedTags: (tagIds: number[]) => void
  setViewMode: (mode: 'list' | 'card') => void
  setPage: (page: number) => void
}

export const usePromptStore = create<PromptState>((set, get) => ({
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

  fetchPrompts: async (params = {}) => {
    set({ loading: true })
    try {
      const state = get()
      const response = await promptApi.getPrompts({
        page: params.page || state.page,
        page_size: params.page_size || state.pageSize,
        group_id: params.group_id !== undefined ? params.group_id : (state.selectedGroup !== null ? state.selectedGroup : 0),
        tag_id: params.tag_id || (state.selectedTags.length === 1 ? state.selectedTags[0] : undefined),
        keyword: params.keyword !== undefined ? params.keyword : state.searchKeyword || undefined,
        sort_by: params.sort_by || 'created_at',
        order: params.order || 'desc',
      })
      set({
        prompts: response.items,
        total: response.total,
        page: response.page,
        loading: false,
      })
    } catch (error) {
      console.error('获取Prompt列表失败:', error)
      set({ loading: false })
    }
  },

  fetchPrompt: async (id: number) => {
    set({ loading: true })
    try {
      const prompt = await promptApi.getPrompt(id)
      set({ currentPrompt: prompt, loading: false })
    } catch (error) {
      console.error('获取Prompt详情失败:', error)
      set({ loading: false })
    }
  },

  createPrompt: async (data) => {
    try {
      const prompt = await promptApi.createPrompt(data)
      await get().fetchPrompts()
      // 通知Sidebar刷新分组数量
      window.dispatchEvent(new CustomEvent('prompt-changed'))
      return prompt
    } catch (error) {
      console.error('创建Prompt失败:', error)
      throw error
    }
  },

  updatePrompt: async (id, data) => {
    try {
      await promptApi.updatePrompt(id, data)
      await get().fetchPrompt(id)
      await get().fetchPrompts()
      // 通知Sidebar刷新分组数量
      window.dispatchEvent(new CustomEvent('prompt-changed'))
    } catch (error) {
      console.error('更新Prompt失败:', error)
      throw error
    }
  },

  deletePrompt: async (id) => {
    try {
      await promptApi.deletePrompt(id)
      await get().fetchPrompts()
      // 通知Sidebar刷新分组数量
      window.dispatchEvent(new CustomEvent('prompt-changed'))
      if (get().currentPrompt?.id === id) {
        set({ currentPrompt: null })
      }
    } catch (error) {
      console.error('删除Prompt失败:', error)
      throw error
    }
  },

  copyPrompt: async (id) => {
    try {
      const result = await promptApi.copyPrompt(id)
      // 复制到剪贴板
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(result.content)
      }
      await get().fetchPrompts()
      if (get().currentPrompt?.id === id) {
        await get().fetchPrompt(id)
      }
    } catch (error) {
      console.error('复制Prompt失败:', error)
      throw error
    }
  },

  setSearchKeyword: (keyword: string) => {
    set({ searchKeyword: keyword, page: 1 })
    get().fetchPrompts()
  },

  setSelectedGroup: (groupId: number | null) => {
    set({ selectedGroup: groupId, page: 1 })
    get().fetchPrompts()
  },

  setSelectedTags: (tagIds: number[]) => {
    set({ selectedTags: tagIds, page: 1 })
    get().fetchPrompts()
  },

  setViewMode: (mode: 'list' | 'card') => {
    set({ viewMode: mode })
  },

  setPage: (page: number) => {
    set({ page })
    get().fetchPrompts()
  },
}))
