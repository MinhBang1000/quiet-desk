import type { FocusSession, Portfolio, PublicPortfolio, Settings, Tag, Task } from '../types'

export class ApiError extends Error {
  status: number
  retryAfterMs?: number
  constructor(message: string, status: number, retryAfterMs?: number) {
    super(message)
    this.status = status
    this.retryAfterMs = retryAfterMs
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  })
  if (res.status === 401 && !path.startsWith('/auth/')) {
    // Session expired or was never established — send the user back to the
    // PIN gate rather than letting the app limp along with failed requests.
    window.location.reload()
    throw new ApiError('unauthenticated', 401)
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as { error?: string; retryAfterMs?: number })
    throw new ApiError(body.error || `API ${path} failed: ${res.status}`, res.status, body.retryAfterMs)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export interface AuthStatus {
  hasPin: boolean
  authenticated: boolean
}

export const api = {
  getAuthStatus: () => request<AuthStatus>('/auth/status'),
  setupPin: (pin: string) => request<{ ok: true }>('/auth/setup', { method: 'POST', body: JSON.stringify({ pin }) }),
  login: (pin: string) => request<{ ok: true }>('/auth/login', { method: 'POST', body: JSON.stringify({ pin }) }),
  logout: () => request<{ ok: true }>('/auth/logout', { method: 'POST' }),

  getTasks: () => request<Task[]>('/tasks'),
  createTask: (input: { title: string; tag: string; due: string; done?: boolean }) =>
    request<Task>('/tasks', { method: 'POST', body: JSON.stringify(input) }),
  updateTask: (id: string, patch: Partial<Pick<Task, 'title' | 'tag' | 'due' | 'done'>>) =>
    request<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteTask: (id: string) => request<void>(`/tasks/${id}`, { method: 'DELETE' }),

  getSessions: () => request<FocusSession[]>('/sessions'),
  createSession: (input: { startedAt: string; minutes: number; taskId: string | null; tag: string | null }) =>
    request<FocusSession>('/sessions', { method: 'POST', body: JSON.stringify(input) }),

  getSettings: () => request<Settings>('/settings'),
  updateSettings: (patch: Partial<Settings>) =>
    request<Settings>('/settings', { method: 'PUT', body: JSON.stringify(patch) }),

  getTags: () => request<Tag[]>('/tags'),
  createTag: (input: { name: string; colorIndex?: number }) =>
    request<Tag>('/tags', { method: 'POST', body: JSON.stringify(input) }),
  updateTag: (id: number, patch: Partial<Pick<Tag, 'name' | 'colorIndex'>>) =>
    request<Tag>(`/tags/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteTag: (id: number) => request<void>(`/tags/${id}`, { method: 'DELETE' }),

  getPortfolio: () => request<Portfolio>('/portfolio'),
  updatePortfolio: (patch: Partial<Omit<Portfolio, 'shareToken'>>) =>
    request<Portfolio>('/portfolio', { method: 'PUT', body: JSON.stringify(patch) }),
  rotatePortfolioToken: () => request<{ shareToken: string }>('/portfolio/rotate-token', { method: 'POST' }),
  getPublicPortfolio: (token: string) => request<PublicPortfolio>(`/public/portfolio/${token}`),

  exportAll: () =>
    request<{ tasks: Task[]; sessions: FocusSession[]; settings: Settings; tags: Tag[]; portfolio: Portfolio; exportedAt: string }>(
      '/export'
    ),
  importAll: (data: { tasks?: Task[]; sessions?: FocusSession[]; settings?: Settings; tags?: Tag[]; portfolio?: Portfolio }) =>
    request<{ ok: true }>('/import', { method: 'POST', body: JSON.stringify(data) }),
}
