import { create } from 'zustand'
import { api } from '../api/client'
import { iso } from '../lib/date'
import { requestNotificationPermission, notifyTaskDue } from '../lib/notify'
import type { ThemeId } from '../lib/themes'
import type {
  Asset,
  AssetSnapshot,
  Category,
  CategoryModule,
  Collection,
  ExchangeRate,
  FocusSession,
  LinkRecord,
  ListEntity,
  ListItem,
  Location,
  Person,
  Place,
  Portfolio,
  Settings,
  Tag,
  Task,
  Thing,
  TimerMode,
  View,
} from '../types'

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
  categories: Category[]
  people: Person[]
  things: Thing[]
  locations: Location[]
  links: LinkRecord[]
  places: Place[]
  collections: Collection[]
  lists: ListEntity[]
  listItems: ListItem[]
  assets: Asset[]
  exchangeRates: ExchangeRate[]
  assetSnapshots: AssetSnapshot[]
  selectedPersonId: string | null
  selectedThingId: string | null
  selectedPlaceId: string | null
  selectedListId: string | null

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

  addCategory: (module: CategoryModule, name: string) => Promise<void>
  renameCategory: (id: number, name: string) => Promise<void>
  recolorCategory: (id: number, colorIndex: number) => Promise<void>
  deleteCategory: (id: number) => Promise<void>

  selectPerson: (id: string | null) => void
  addPerson: (input: Partial<Person> & { fullName: string }) => Promise<Person>
  updatePerson: (id: string, patch: Partial<Person>) => Promise<void>
  removePerson: (id: string) => Promise<void>

  addLocation: (name: string, parentId?: string | null) => Promise<Location>
  renameLocation: (id: string, name: string) => Promise<void>
  removeLocation: (id: string) => Promise<void>

  selectThing: (id: string | null) => void
  addThing: (input: Partial<Thing> & { name: string }) => Promise<Thing>
  updateThing: (id: string, patch: Partial<Thing>) => Promise<void>
  removeThing: (id: string) => Promise<void>

  addLink: (input: { fromType: LinkRecord['fromType']; fromId: string; toType: LinkRecord['toType']; toId: string; relation?: string; note?: string }) => Promise<void>
  removeLink: (id: string) => Promise<void>

  selectPlace: (id: string | null) => void
  addPlace: (input: Partial<Place> & { name: string }) => Promise<Place>
  updatePlace: (id: string, patch: Partial<Place>) => Promise<void>
  removePlace: (id: string) => Promise<void>

  addCollection: (name: string) => Promise<Collection>
  renameCollection: (id: string, name: string) => Promise<void>
  setCollectionMembers: (id: string, placeIds: string[]) => Promise<void>
  removeCollection: (id: string) => Promise<void>

  selectList: (id: string | null) => void
  addList: (name: string, style: ListEntity['style']) => Promise<ListEntity>
  updateList: (id: string, patch: Partial<Pick<ListEntity, 'name' | 'favorite' | 'notes'>>) => Promise<void>
  removeList: (id: string) => Promise<void>
  resetList: (id: string) => Promise<void>
  addListItem: (listId: string, input: Partial<ListItem> & { text: string }) => Promise<void>
  updateListItem: (id: string, patch: Partial<ListItem>) => Promise<void>
  removeListItem: (id: string) => Promise<void>
  convertListItem: (id: string, toType: 'place' | 'thing', fields?: { name?: string }) => Promise<void>

  addAsset: (input: Partial<Asset> & { name: string; category: Asset['category'] }) => Promise<Asset>
  updateAsset: (id: string, patch: Partial<Asset>) => Promise<void>
  removeAsset: (id: string) => Promise<void>
  setExchangeRates: (rates: { currency: string; rateToBase: number }[]) => Promise<void>
  saveAssetSnapshot: () => Promise<void>

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
  settings: { focusMinutes: 25, breakMinutes: 5, autoStartBreak: true, goalMinutes: 120, theme: 'night', baseCurrency: 'TWD' },
  tags: [],
  portfolio: null,
  categories: [],
  people: [],
  things: [],
  locations: [],
  links: [],
  places: [],
  collections: [],
  lists: [],
  listItems: [],
  assets: [],
  exchangeRates: [],
  assetSnapshots: [],
  selectedPersonId: null,
  selectedThingId: null,
  selectedPlaceId: null,
  selectedListId: null,

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
    const [
      tasks, sessions, settings, tags, portfolio, categories, people, things, locations, links,
      places, collections, lists, assets, exchangeRates, assetSnapshots,
    ] = await Promise.all([
      api.getTasks(),
      api.getSessions(),
      api.getSettings(),
      api.getTags(),
      api.getPortfolio(),
      api.getCategories(),
      api.getPeople(),
      api.getThings(),
      api.getLocations(),
      api.getLinks(),
      api.getPlaces(),
      api.getCollections(),
      api.getLists(),
      api.getAssets(),
      api.getExchangeRates(),
      api.getAssetSnapshots(),
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
      categories,
      people,
      things,
      locations,
      links,
      places,
      collections,
      lists,
      assets,
      exchangeRates,
      assetSnapshots,
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

  addCategory: async (module, name) => {
    const created = await api.createCategory({ module, name })
    set((s) => ({ categories: [...s.categories, created] }))
  },

  renameCategory: async (id, name) => {
    const updated = await api.updateCategory(id, { name })
    set((s) => ({ categories: s.categories.map((c) => (c.id === id ? updated : c)) }))
  },

  recolorCategory: async (id, colorIndex) => {
    const updated = await api.updateCategory(id, { colorIndex })
    set((s) => ({ categories: s.categories.map((c) => (c.id === id ? updated : c)) }))
  },

  deleteCategory: async (id) => {
    await api.deleteCategory(id)
    const [categories, people, things, places] = await Promise.all([
      api.getCategories(), api.getPeople(), api.getThings(), api.getPlaces(),
    ])
    set({ categories, people, things, places })
  },

  selectPerson: (id) => set({ selectedPersonId: id }),

  addPerson: async (input) => {
    const created = await api.createPerson(input)
    set((s) => ({ people: [...s.people, created].sort((a, b) => a.fullName.localeCompare(b.fullName)) }))
    return created
  },

  updatePerson: async (id, patch) => {
    const updated = await api.updatePerson(id, patch)
    set((s) => ({ people: s.people.map((p) => (p.id === id ? updated : p)) }))
  },

  removePerson: async (id) => {
    await api.deletePerson(id)
    set((s) => ({
      people: s.people.filter((p) => p.id !== id),
      selectedPersonId: s.selectedPersonId === id ? null : s.selectedPersonId,
      things: s.things.map((t) => (t.loanPersonId === id ? { ...t, loanPersonId: null } : t)),
      links: s.links.filter((l) => !(l.fromType === 'person' && l.fromId === id) && !(l.toType === 'person' && l.toId === id)),
    }))
  },

  addLocation: async (name, parentId) => {
    const created = await api.createLocation({ name, parentId: parentId ?? null })
    set((s) => ({ locations: [...s.locations, created] }))
    return created
  },

  renameLocation: async (id, name) => {
    const updated = await api.updateLocation(id, { name })
    set((s) => ({ locations: s.locations.map((l) => (l.id === id ? updated : l)) }))
  },

  removeLocation: async (id) => {
    await api.deleteLocation(id)
    set((s) => ({ locations: s.locations.filter((l) => l.id !== id) }))
  },

  selectThing: (id) => set({ selectedThingId: id }),

  addThing: async (input) => {
    const created = await api.createThing(input)
    set((s) => ({ things: [...s.things, created].sort((a, b) => a.name.localeCompare(b.name)) }))
    return created
  },

  updateThing: async (id, patch) => {
    const updated = await api.updateThing(id, patch)
    set((s) => ({ things: s.things.map((t) => (t.id === id ? updated : t)) }))
  },

  removeThing: async (id) => {
    await api.deleteThing(id)
    set((s) => ({
      things: s.things.filter((t) => t.id !== id).map((t) => (t.containerId === id ? { ...t, containerId: null } : t)),
      selectedThingId: s.selectedThingId === id ? null : s.selectedThingId,
      links: s.links.filter((l) => !(l.fromType === 'thing' && l.fromId === id) && !(l.toType === 'thing' && l.toId === id)),
    }))
  },

  addLink: async (input) => {
    const created = await api.createLink(input)
    set((s) => ({ links: [...s.links, created] }))
  },

  removeLink: async (id) => {
    await api.deleteLink(id)
    set((s) => ({ links: s.links.filter((l) => l.id !== id) }))
  },

  selectPlace: (id) => set({ selectedPlaceId: id }),

  addPlace: async (input) => {
    const created = await api.createPlace(input)
    set((s) => ({ places: [...s.places, created].sort((a, b) => a.name.localeCompare(b.name)) }))
    return created
  },

  updatePlace: async (id, patch) => {
    const updated = await api.updatePlace(id, patch)
    set((s) => ({ places: s.places.map((p) => (p.id === id ? updated : p)) }))
  },

  removePlace: async (id) => {
    await api.deletePlace(id)
    set((s) => ({
      places: s.places.filter((p) => p.id !== id),
      selectedPlaceId: s.selectedPlaceId === id ? null : s.selectedPlaceId,
      collections: s.collections.map((c) => ({ ...c, placeIds: c.placeIds.filter((pid) => pid !== id) })),
      links: s.links.filter((l) => !(l.fromType === 'place' && l.fromId === id) && !(l.toType === 'place' && l.toId === id)),
    }))
  },

  addCollection: async (name) => {
    const created = await api.createCollection({ name })
    set((s) => ({ collections: [...s.collections, created].sort((a, b) => a.name.localeCompare(b.name)) }))
    return created
  },

  renameCollection: async (id, name) => {
    const updated = await api.updateCollection(id, { name })
    set((s) => ({ collections: s.collections.map((c) => (c.id === id ? updated : c)) }))
  },

  setCollectionMembers: async (id, placeIds) => {
    const updated = await api.setCollectionMembers(id, placeIds)
    set((s) => ({ collections: s.collections.map((c) => (c.id === id ? updated : c)) }))
  },

  removeCollection: async (id) => {
    await api.deleteCollection(id)
    set((s) => ({ collections: s.collections.filter((c) => c.id !== id) }))
  },

  selectList: (id) => {
    set({ selectedListId: id })
    if (id) {
      api.getListItems(id).then((listItems) => set({ listItems })).catch(() => {})
    } else {
      set({ listItems: [] })
    }
  },

  addList: async (name, style) => {
    const created = await api.createList({ name, style })
    set((s) => ({ lists: [created, ...s.lists] }))
    return created
  },

  updateList: async (id, patch) => {
    const updated = await api.updateList(id, patch)
    set((s) => ({ lists: s.lists.map((l) => (l.id === id ? updated : l)) }))
  },

  removeList: async (id) => {
    await api.deleteList(id)
    set((s) => ({
      lists: s.lists.filter((l) => l.id !== id),
      selectedListId: s.selectedListId === id ? null : s.selectedListId,
      listItems: s.selectedListId === id ? [] : s.listItems,
    }))
  },

  resetList: async (id) => {
    const listItems = await api.resetList(id)
    if (get().selectedListId === id) set({ listItems })
  },

  addListItem: async (listId, input) => {
    const created = await api.createListItem(listId, input)
    if (get().selectedListId === listId) set((s) => ({ listItems: [...s.listItems, created] }))
  },

  updateListItem: async (id, patch) => {
    const updated = await api.updateListItem(id, patch)
    set((s) => ({ listItems: s.listItems.map((i) => (i.id === id ? updated : i)) }))
  },

  removeListItem: async (id) => {
    await api.deleteListItem(id)
    set((s) => ({ listItems: s.listItems.filter((i) => i.id !== id) }))
  },

  convertListItem: async (id, toType, fields) => {
    const { item, created } = await api.convertListItem(id, toType, fields)
    set((s) => ({
      listItems: s.listItems.map((i) => (i.id === id ? item : i)),
      places: toType === 'place' ? [...s.places, created as Place].sort((a, b) => a.name.localeCompare(b.name)) : s.places,
      things: toType === 'thing' ? [...s.things, created as Thing].sort((a, b) => a.name.localeCompare(b.name)) : s.things,
    }))
  },

  addAsset: async (input) => {
    const created = await api.createAsset(input)
    set((s) => ({ assets: [...s.assets, created].sort((a, b) => a.name.localeCompare(b.name)) }))
    return created
  },

  updateAsset: async (id, patch) => {
    const updated = await api.updateAsset(id, patch)
    set((s) => ({ assets: s.assets.map((a) => (a.id === id ? updated : a)) }))
  },

  removeAsset: async (id) => {
    await api.deleteAsset(id)
    set((s) => ({ assets: s.assets.filter((a) => a.id !== id) }))
  },

  setExchangeRates: async (rates) => {
    const exchangeRates = await api.setExchangeRates(rates)
    set({ exchangeRates })
  },

  saveAssetSnapshot: async () => {
    const snapshot = await api.createAssetSnapshot()
    set((s) => ({ assetSnapshots: [...s.assetSnapshots, snapshot] }))
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
