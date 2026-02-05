import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface Prompt {
  id: number
  name: string
  content: string
  description?: string
  group_id?: number
  usage_count: number
  created_at: string
  updated_at: string
  group?: PromptGroup
  tags: PromptTag[]
  images: PromptImage[]
}

export interface PromptGroup {
  id: number
  name: string
  description?: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface PromptTag {
  id: number
  name: string
  color: string
  created_at: string
}

export interface PromptImage {
  id: number
  prompt_id: number
  file_path: string
  file_name: string
  file_size: number
  file_type: string
  sort_order: number
  created_at: string
}

export interface PromptListParams {
  page?: number
  page_size?: number
  group_id?: number
  tag_id?: number
  keyword?: string
  sort_by?: 'created_at' | 'updated_at' | 'usage_count' | 'name'
  order?: 'asc' | 'desc'
}

export interface PromptListResponse {
  items: Prompt[]
  total: number
  page: number
  page_size: number
}

export const promptApi = {
  // 获取Prompt列表
  getPrompts: async (params: PromptListParams = {}): Promise<PromptListResponse> => {
    const response = await api.get('/api/v1/prompts', { params })
    return response.data
  },

  // 获取Prompt详情
  getPrompt: async (id: number): Promise<Prompt> => {
    const response = await api.get(`/api/v1/prompts/${id}`)
    return response.data
  },

  // 创建Prompt
  createPrompt: async (data: {
    name: string
    content: string
    description?: string
    group_id?: number
    tag_ids?: number[]
  }): Promise<Prompt> => {
    const response = await api.post('/api/v1/prompts', data)
    return response.data
  },

  // 更新Prompt
  updatePrompt: async (id: number, data: Partial<{
    name: string
    content: string
    description?: string
    group_id?: number
    tag_ids?: number[]
  }>): Promise<Prompt> => {
    const response = await api.put(`/api/v1/prompts/${id}`, data)
    return response.data
  },

  // 删除Prompt
  deletePrompt: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/prompts/${id}`)
  },

  // 批量删除Prompt
  batchDeletePrompts: async (ids: number[]): Promise<void> => {
    await api.delete('/api/v1/prompts/batch', { data: { ids } })
  },

  // 复制Prompt
  copyPrompt: async (id: number): Promise<{ content: string }> => {
    const response = await api.post(`/api/v1/prompts/${id}/copy`)
    return response.data.data
  },
}

export const groupApi = {
  getGroups: async (): Promise<PromptGroup[]> => {
    const response = await api.get('/api/v1/groups')
    return response.data
  },

  createGroup: async (data: { name: string; description?: string; sort_order?: number }): Promise<PromptGroup> => {
    const response = await api.post('/api/v1/groups', data)
    return response.data
  },

  updateGroup: async (id: number, data: Partial<{ name: string; description?: string; sort_order?: number }>): Promise<PromptGroup> => {
    const response = await api.put(`/api/v1/groups/${id}`, data)
    return response.data
  },

  deleteGroup: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/groups/${id}`)
  },
}

export const tagApi = {
  getTags: async (): Promise<PromptTag[]> => {
    const response = await api.get('/api/v1/tags')
    return response.data
  },

  createTag: async (data: { name: string; color?: string }): Promise<PromptTag> => {
    const response = await api.post('/api/v1/tags', data)
    return response.data
  },

  updateTag: async (id: number, data: Partial<{ name: string; color?: string }>): Promise<PromptTag> => {
    const response = await api.put(`/api/v1/tags/${id}`, data)
    return response.data
  },

  deleteTag: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/tags/${id}`)
  },
}

export const searchApi = {
  search: async (keyword: string, limit: number = 20): Promise<{ items: Prompt[]; total: number }> => {
    const response = await api.get('/api/v1/search', { params: { keyword, limit } })
    return response.data
  },
}

export const imageApi = {
  uploadImage: async (promptId: number, file: File, sortOrder: number = 0): Promise<PromptImage> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('sort_order', sortOrder.toString())
    const response = await api.post(`/api/v1/images/${promptId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  deleteImage: async (imageId: number): Promise<void> => {
    await api.delete(`/api/v1/images/${imageId}`)
  },
}

export default api
