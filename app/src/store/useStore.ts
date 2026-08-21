import { create } from 'zustand'
import { api } from '../api/client'
import { iso } from '../lib/date'
import { requestNotificationPermission, notifyTaskDue } from '../lib/notify'
import type { ThemeId } from '../lib/themes'
import type { FocusSession, Portfolio, Settings, Tag, Task, TimerMode, View } from '../types'

export const BREAK_IDEAS = [
  'Stand up, look at something 20 metres away for 20 seconds.',
  'Write one sentence about what you just learned.',
  'Refill water. Walk to the window and back.',
  'Two slow stretches: neck, then shoulders.',
  'Say out loud what the next session is for.',
  'No screen. Just breathe for a minute.',
]

interface AppState {
  loaded: boolean
  view: View
  theme: ThemeId
  tasks: Task[]
  sessions: FocusSession[]
  settings: Settings
  tags: Tag[]
  portfolio: Portfolio | null

  mode: TimerMode
  remaining: number
  running: boolean
  endAt: number | null
  activeId: string | null
  idea: number
  draft: string
  dueDraft: string
  monthOffset: number
  notificationsEnabled: boolean
  notifiedToday: Record<string, string>

  init: () => Promise<void>
  setView: (view: View) => void
  setTheme: (theme: ThemeId) => void
  updateSettings: (patch: Partial<Settings>) => void

  addTask: (raw: string, due?: string) => Promise<void>
  toggleTask: (id: string) => Promise<void>
  removeTask: (id: string) => Promise<void>
  updateTask: (id: string, patch: Partial<Pick<Task, 'title' | 'tag' | 'due'>>) => Promise<void>
  pickTask: (id: string) => void
  setDraft: (text: string) => void
  setDueDraft: (date: string) => void
  pickDateForNewTask: (date: string) => void

  addTag: (name: string) => Promise<void>
  renameTag: (id: number, name: string) => Promise<void>
  recolorTag: (id: number, colorIndex: number) => Promise<void>
  deleteTag: (id: number) => Promise<void>

  updatePortfolio: (patch: Partial<Omit<Portfolio, 'shareToken'>>) => Promise<void>
  rotateShareToken: () => Promise<void>

  enableNotifications: () => Promise<void>
  checkReminders: () => void

  toggleRun: () => void
  resetTimer: () => void
  tick: () => void
  complete: () => Promise<void>
  skip: () => Promise<void>
  nextIdea: () => void

  prevMonth: () => void
  nextMonth: () => void
  thisMonth: () => void
}

function periodLength(mode: TimerMode, settings: Settings): number {
  return (mode === 'focus' ? settings.focusMinutes : settings.breakMinutes) * 60
}

export const useStore = create<AppState>((set, get) => ({
  loaded: false,
  view: 'focus',
  theme: 'night',
  tasks: [],
  sessions: [],
  settings: { focusMinutes: 25, breakMinutes: 5, autoStartBreak: true, goalMinutes: 120, theme: 'night' },
  tags: [],
  portfolio: null,

  mode: 'focus',
  remaining: 25 * 60,
  running: false,
  endAt: null,
  activeId: null,
  idea: 0,
  draft: '',
  dueDraft: iso(new Date()),
  monthOffset: 0,
  notificationsEnabled: false,
  notifiedToday: {},

  init: async () => {
    const [tasks, sessions, settings, tags, portfolio] = await Promise.all([
      api.getTasks(),
      api.getSessions(),
      api.getSettings(),
      api.getTags(),
      api.getPortfolio(),
    ])
    const t0 = iso(new Date())
    const theme = (settings.theme as ThemeId) || 'night'
    const activeId = tasks.find((t) => !t.done && t.due === t0)?.id ?? null
    set({
      loaded: true,
      tasks,
      sessions,
      settings,
      tags,
      portfolio,
      theme,
      activeId,
      remaining: settings.focusMinutes * 60,
    })
  },

  setView: (view) => set({ view }),

  setTheme: (theme) => {
    set({ theme })
    api.updateSettings({ theme }).catch(() => {})
  },

  updateSettings: (patch) => {
    const s = get()
    const nextSettings = { ...s.settings, ...patch }
    const wasAtFullLength = s.remaining === periodLength(s.mode, s.settings)
    set({
      settings: nextSettings,
      remaining: !s.running && wasAtFullLength ? periodLength(s.mode, nextSettings) : s.remaining,
    })
    api.updateSettings(patch).catch(() => {})
  },

  addTask: async (raw, due) => {
    const text = raw.trim()
    if (!text) return
    const tags = get().tags
    let tag = tags[0]?.name ?? 'Deep work'
    let title = text
    const m = text.match(/#(\w+)/)
    if (m) {
      const hit = tags.find((t) => t.name.toLowerCase().replace(' ', '') === m[1].toLowerCase())
      if (hit) tag = hit.name
      title = text.replace(m[0], '').trim()
    }
    const dueDate = due || get().dueDraft || iso(new Date())
    const created = await api.createTask({ title, tag, due: dueDate, done: false })
    set({ draft: '', dueDraft: iso(new Date()) })
    set((s) => ({ tasks: [created, ...s.tasks] }))
  },

  toggleTask: async (id) => {
    const task = get().tasks.find((t) => t.id === id)
    if (!task) return
    const done = !task.done
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, done } : t)) }))
    api.updateTask(id, { done }).catch(() => {})
  },

  removeTask: async (id) => {
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }))
    api.deleteTask(id).catch(() => {})
  },

  updateTask: async (id, patch) => {
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }))
    api.updateTask(id, patch).catch(() => {})
  },

  pickTask: (id) => set({ activeId: id, view: 'focus' }),

  setDraft: (draft) => set({ draft }),
  setDueDraft: (dueDraft) => set({ dueDraft }),
  pickDateForNewTask: (date) => set({ dueDraft: date, view: 'today' }),

  addTag: async (name) => {
    const created = await api.createTag({ name })
    set((s) => ({ tags: [...s.tags, created] }))
  },

  renameTag: async (id, name) => {
    const updated = await api.updateTag(id, { name })
    const tasks = await api.getTasks()
    set((s) => ({ tags: s.tags.map((t) => (t.id === id ? updated : t)), tasks }))
  },

  recolorTag: async (id, colorIndex) => {
    const updated = await api.updateTag(id, { colorIndex })
    set((s) => ({ tags: s.tags.map((t) => (t.id === id ? updated : t)) }))
  },

  deleteTag: async (id) => {
    await api.deleteTag(id)
    const tasks = await api.getTasks()
    set((s) => ({ tags: s.tags.filter((t) => t.id !== id), tasks }))
  },

  updatePortfolio: async (patch) => {
    const updated = await api.updatePortfolio(patch)
    set({ portfolio: updated })
  },

  rotateShareToken: async () => {
    const { shareToken } = await api.rotatePortfolioToken()
    set((s) => ({ portfolio: s.portfolio ? { ...s.portfolio, shareToken } : s.portfolio }))
  },

  enableNotifications: async () => {
    const granted = await requestNotificationPermission()
    set({ notificationsEnabled: granted })
  },

  checkReminders: () => {
    const s = get()
    if (!s.notificationsEnabled) return
    const t0 = iso(new Date())
    const due = s.tasks.filter((t) => !t.done && t.due === t0)
    if (!due.length) return
    const notifiedToday = { ...s.notifiedToday }
    let changed = false
    for (const task of due) {
      if (notifiedToday[task.id] === t0) continue
      notifyTaskDue(task)
      notifiedToday[task.id] = t0
      changed = true
    }
    if (changed) set({ notifiedToday })
  },

  toggleRun: () => {
    const s = get()
    const running = !s.running
    set({ running, endAt: running ? Date.now() + s.remaining * 1000 : null })
  },

  resetTimer: () => {
    const { mode, settings } = get()
    set({ remaining: periodLength(mode, settings), running: false, endAt: null })
  },

  // Anchored to a wall-clock end time rather than decrementing by 1 per
  // tick, so it self-corrects if ticks are delayed or throttled (e.g. the
  // tab is backgrounded) instead of silently drifting from real time.
  tick: () => {
    const s = get()
    if (!s.running || s.endAt == null) return
    const remaining = Math.round((s.endAt - Date.now()) / 1000)
    if (remaining <= 0) {
      get().complete()
    } else if (remaining !== s.remaining) {
      set({ remaining })
    }
  },

  complete: async () => {
    const s = get()
    const wasFocus = s.mode === 'focus'
    const nextMode: TimerMode = wasFocus ? 'break' : 'focus'
    const focusMinutes = s.settings.focusMinutes

    if (wasFocus) {
      const activeTask = s.tasks.find((t) => t.id === s.activeId)
      const startedAt = new Date(Date.now() - focusMinutes * 60 * 1000).toISOString()
      api
        .createSession({ startedAt, minutes: focusMinutes, taskId: s.activeId, tag: activeTask?.tag ?? null })
        .then((created) => set((st) => ({ sessions: [created, ...st.sessions] })))
        .catch(() => {})
    }

    const nextRemaining = periodLength(nextMode, s.settings)
    const nextRunning = wasFocus ? s.settings.autoStartBreak : false
    set({
      mode: nextMode,
      remaining: nextRemaining,
      running: nextRunning,
      endAt: nextRunning ? Date.now() + nextRemaining * 1000 : null,
      idea: wasFocus ? Math.floor(Math.random() * BREAK_IDEAS.length) : s.idea,
    })
  },

  skip: async () => {
    await get().complete()
  },

  nextIdea: () => set((s) => ({ idea: s.idea + 1 })),

  prevMonth: () => set((s) => ({ monthOffset: s.monthOffset - 1 })),
  nextMonth: () => set((s) => ({ monthOffset: s.monthOffset + 1 })),
  thisMonth: () => set({ monthOffset: 0 }),
}))
