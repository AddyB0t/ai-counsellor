const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }))
    throw new Error(error.detail || 'An error occurred')
  }

  return response.json()
}

export const api = {
  // Profile
  getProfile: (token: string) =>
    fetchAPI('/api/profile', { headers: { Authorization: `Bearer ${token}` } }),

  updateProfile: (token: string, data: object) =>
    fetchAPI('/api/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  saveOnboarding: (token: string, data: object) =>
    fetchAPI('/api/profile/onboarding', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  // Universities
  getUniversities: (token: string, filters?: object) =>
    fetchAPI(`/api/universities${filters ? `?${new URLSearchParams(filters as Record<string, string>)}` : ''}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  shortlistUniversity: (token: string, universityId: string, category: string, reasoning?: string) =>
    fetchAPI('/api/universities/shortlist', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ university_id: universityId, category, reasoning }),
    }),

  lockUniversity: (token: string, universityId: string) =>
    fetchAPI(`/api/universities/lock/${universityId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),

  getShortlist: (token: string) =>
    fetchAPI('/api/universities/shortlist', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  searchExternalUniversities: (token: string, params: { name?: string; country?: string; limit?: number }) =>
    fetchAPI(`/api/universities/search-external?${new URLSearchParams(params as Record<string, string>)}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  shortlistExternalUniversity: (token: string, data: { name: string; country: string; category: string; website?: string; reasoning?: string }) =>
    fetchAPI('/api/universities/shortlist-external', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  // Tasks
  getTasks: (token: string) =>
    fetchAPI('/api/tasks', { headers: { Authorization: `Bearer ${token}` } }),

  createTask: (token: string, data: object) =>
    fetchAPI('/api/tasks', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  updateTask: (token: string, taskId: string, data: object) =>
    fetchAPI(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  // AI Counsellor
  chat: (token: string, message: string) =>
    fetchAPI('/api/counsellor/chat', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message }),
    }),
}
