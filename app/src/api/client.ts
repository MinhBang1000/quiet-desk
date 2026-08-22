import type {
  Asset,
  AssetSnapshot,
  Category,
  CategoryModule,
  Collection,
  ExchangeRate,
  FocusSession,
  LinkEntityType,
  LinkRecord,
  ListEntity,
  ListItem,
  Location,
  Person,
  Place,
  Portfolio,
  PublicPortfolio,
  Settings,
  Tag,
  Task,
  Thing,
} from '../types'

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

  getCategories: (module?: CategoryModule) => request<Category[]>(`/categories${module ? `?module=${module}` : ''}`),
  createCategory: (input: { module: CategoryModule; name: string; colorIndex?: number }) =>
    request<Category>('/categories', { method: 'POST', body: JSON.stringify(input) }),
  updateCategory: (id: number, patch: Partial<Pick<Category, 'name' | 'colorIndex'>>) =>
    request<Category>(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteCategory: (id: number) => request<void>(`/categories/${id}`, { method: 'DELETE' }),

  getPeople: () => request<Person[]>('/people'),
  createPerson: (input: Partial<Person> & { fullName: string }) =>
    request<Person>('/people', { method: 'POST', body: JSON.stringify(input) }),
  updatePerson: (id: string, patch: Partial<Person>) =>
    request<Person>(`/people/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deletePerson: (id: string) => request<void>(`/people/${id}`, { method: 'DELETE' }),

  getLocations: () => request<Location[]>('/locations'),
  createLocation: (input: { name: string; parentId?: string | null }) =>
    request<Location>('/locations', { method: 'POST', body: JSON.stringify(input) }),
  updateLocation: (id: string, patch: { name: string }) =>
    request<Location>(`/locations/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteLocation: (id: string) => request<void>(`/locations/${id}`, { method: 'DELETE' }),

  getThings: () => request<Thing[]>('/things'),
  createThing: (input: Partial<Thing> & { name: string }) =>
    request<Thing>('/things', { method: 'POST', body: JSON.stringify(input) }),
  updateThing: (id: string, patch: Partial<Thing>) =>
    request<Thing>(`/things/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteThing: (id: string) => request<void>(`/things/${id}`, { method: 'DELETE' }),

  getLinks: (type?: LinkEntityType, id?: string) =>
    request<LinkRecord[]>(`/links${type && id ? `?type=${type}&id=${id}` : ''}`),
  createLink: (input: { fromType: LinkEntityType; fromId: string; toType: LinkEntityType; toId: string; relation?: string; note?: string }) =>
    request<LinkRecord>('/links', { method: 'POST', body: JSON.stringify(input) }),
  deleteLink: (id: string) => request<void>(`/links/${id}`, { method: 'DELETE' }),

  getPlaces: () => request<Place[]>('/places'),
  createPlace: (input: Partial<Place> & { name: string }) =>
    request<Place>('/places', { method: 'POST', body: JSON.stringify(input) }),
  updatePlace: (id: string, patch: Partial<Place>) =>
    request<Place>(`/places/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deletePlace: (id: string) => request<void>(`/places/${id}`, { method: 'DELETE' }),

  getCollections: () => request<Collection[]>('/collections'),
  createCollection: (input: { name: string }) =>
    request<Collection>('/collections', { method: 'POST', body: JSON.stringify(input) }),
  updateCollection: (id: string, patch: { name: string }) =>
    request<Collection>(`/collections/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  setCollectionMembers: (id: string, placeIds: string[]) =>
    request<Collection>(`/collections/${id}/members`, { method: 'PATCH', body: JSON.stringify({ placeIds }) }),
  deleteCollection: (id: string) => request<void>(`/collections/${id}`, { method: 'DELETE' }),

  getLists: () => request<ListEntity[]>('/lists'),
  createList: (input: { name: string; style: ListEntity['style']; notes?: string }) =>
    request<ListEntity>('/lists', { method: 'POST', body: JSON.stringify(input) }),
  updateList: (id: string, patch: Partial<Pick<ListEntity, 'name' | 'favorite' | 'notes'>>) =>
    request<ListEntity>(`/lists/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteList: (id: string) => request<void>(`/lists/${id}`, { method: 'DELETE' }),
  resetList: (id: string) => request<ListItem[]>(`/lists/${id}/reset`, { method: 'POST' }),
  getListItems: (listId: string) => request<ListItem[]>(`/lists/${listId}/items`),
  createListItem: (listId: string, input: Partial<ListItem> & { text: string }) =>
    request<ListItem>(`/lists/${listId}/items`, { method: 'POST', body: JSON.stringify(input) }),
  updateListItem: (id: string, patch: Partial<ListItem>) =>
    request<ListItem>(`/list-items/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteListItem: (id: string) => request<void>(`/list-items/${id}`, { method: 'DELETE' }),
  convertListItem: (id: string, toType: 'place' | 'thing', fields?: { name?: string }) =>
    request<{ item: ListItem; created: Place | Thing }>(`/list-items/${id}/convert`, {
      method: 'POST',
      body: JSON.stringify({ toType, fields }),
    }),

  getAssets: () => request<Asset[]>('/assets'),
  createAsset: (input: Partial<Asset> & { name: string; category: Asset['category'] }) =>
    request<Asset>('/assets', { method: 'POST', body: JSON.stringify(input) }),
  updateAsset: (id: string, patch: Partial<Asset>) =>
    request<Asset>(`/assets/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteAsset: (id: string) => request<void>(`/assets/${id}`, { method: 'DELETE' }),

  getExchangeRates: () => request<ExchangeRate[]>('/exchange-rates'),
  setExchangeRates: (rates: { currency: string; rateToBase: number }[]) =>
    request<ExchangeRate[]>('/exchange-rates', { method: 'PUT', body: JSON.stringify({ rates }) }),

  getAssetSnapshots: () => request<AssetSnapshot[]>('/asset-snapshots'),
  createAssetSnapshot: () => request<AssetSnapshot>('/asset-snapshots', { method: 'POST' }),

  exportAll: () =>
    request<{
      tasks: Task[]
      sessions: FocusSession[]
      settings: Settings
      tags: Tag[]
      portfolio: Portfolio
      categories: Category[]
      people: Person[]
      personCategories: { personId: string; categoryId: number }[]
      locations: Location[]
      things: Thing[]
      links: LinkRecord[]
      places: Place[]
      placeTags: { placeId: string; categoryId: number }[]
      collections: Collection[]
      lists: ListEntity[]
      listItems: ListItem[]
      assets: Asset[]
      exchangeRates: ExchangeRate[]
      assetSnapshots: AssetSnapshot[]
      exportedAt: string
    }>('/export'),
  importAll: (data: {
    tasks?: Task[]
    sessions?: FocusSession[]
    settings?: Settings
    tags?: Tag[]
    portfolio?: Portfolio
    categories?: Category[]
    people?: Person[]
    personCategories?: { personId: string; categoryId: number }[]
    locations?: Location[]
    things?: Thing[]
    links?: LinkRecord[]
    places?: Place[]
    placeTags?: { placeId: string; categoryId: number }[]
    collections?: Collection[]
    lists?: ListEntity[]
    listItems?: ListItem[]
    assets?: Asset[]
    exchangeRates?: ExchangeRate[]
    assetSnapshots?: AssetSnapshot[]
  }) => request<{ ok: true }>('/import', { method: 'POST', body: JSON.stringify(data) }),
}
