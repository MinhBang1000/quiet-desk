export interface Task {
  id: string
  title: string
  tag: string
  due: string // YYYY-MM-DD
  done: boolean
}

export interface FocusSession {
  id: string
  startedAt: string // ISO datetime
  minutes: number
  taskId: string | null
  tag: string | null
}

export interface Settings {
  focusMinutes: number
  breakMinutes: number
  autoStartBreak: boolean
  goalMinutes: number
  theme: string
  baseCurrency: string
}

export interface Tag {
  id: number
  name: string
  colorIndex: number
  createdAt: string
}

export interface PortfolioLink {
  label: string
  url: string
}

/** One CV-style block: a job, degree, award, project, publication, etc. */
export interface PortfolioEntry {
  heading: string
  subheading?: string
  meta?: string // e.g. dates / location
  bullets: string[]
  url?: string
}

/** A named, reorderable group of entries — the unit sections are added/removed by. */
export interface PortfolioSection {
  id: string
  title: string
  entries: PortfolioEntry[]
}

export interface Portfolio {
  displayName: string
  headline: string
  bio: string
  avatarUrl: string
  gallery: string[]
  links: PortfolioLink[]
  sections: PortfolioSection[]
  theme: string
  shareEnabled: boolean
  shareToken: string
}

export interface PublicPortfolio {
  displayName: string
  headline: string
  bio: string
  avatarUrl: string
  gallery: string[]
  links: PortfolioLink[]
  sections: PortfolioSection[]
  theme: string
  sessions: { startedAt: string; minutes: number }[]
}

export type CategoryModule = 'person' | 'thing' | 'place' | 'place_tag'

export interface Category {
  id: number
  module: CategoryModule
  name: string
  colorIndex: number
  createdAt: string
}

export interface Person {
  id: string
  fullName: string
  nickname: string
  photoUrl: string
  relationship: string
  organization: string
  position: string
  phone: string
  email: string
  otherContact: string
  website: string
  birthday: string | null // YYYY-MM-DD
  city: string
  country: string
  notes: string
  interests: string
  likes: string
  dislikes: string
  foodPreferences: string
  giftIdeas: string
  howWeMet: string
  firstMetDate: string | null
  lastContactedDate: string | null
  favorite: boolean
  categoryIds: number[]
  createdAt: string
}

export interface Location {
  id: string
  parentId: string | null
  name: string
  createdAt: string
}

export type ThingStatus = 'owned' | 'with_me' | 'stored' | 'lent' | 'borrowed' | 'lost' | 'sold' | 'disposed' | 'wishlist'

export interface ThingAttachment {
  label: string
  dataUrl: string
}

export interface Thing {
  id: string
  name: string
  photoUrl: string
  categoryId: number | null
  brand: string
  model: string
  serialNumber: string
  quantity: number
  notes: string
  purchaseDate: string | null
  purchaseLocation: string
  purchasePrice: number | null
  currency: string
  warrantyExpires: string | null
  attachments: ThingAttachment[]
  status: ThingStatus
  locationId: string | null
  containerId: string | null
  loanPersonId: string | null
  loanSince: string | null
  loanDue: string | null
  createdAt: string
}

export type LinkEntityType = 'person' | 'place' | 'thing' | 'asset' | 'list_item'

export interface LinkRecord {
  id: string
  fromType: LinkEntityType
  fromId: string
  toType: LinkEntityType
  toId: string
  relation: string
  note: string
  createdAt: string
}

export interface Place {
  id: string
  name: string
  categoryId: number | null
  address: string
  mapLink: string
  phone: string
  website: string
  openingHours: string
  rating: number | null
  visited: boolean
  wantToVisit: boolean
  favorite: boolean
  notes: string
  lastVisitedDate: string | null
  visitCount: number
  city: string
  country: string
  createdAt: string
  tagIds: number[]
}

export interface Collection {
  id: string
  name: string
  createdAt: string
  placeIds: string[]
}

export type ListStyle = 'simple' | 'checklist' | 'reusable_checklist' | 'ranked'

export interface ListEntity {
  id: string
  name: string
  style: ListStyle
  favorite: boolean
  notes: string
  createdAt: string
}

export type ListItemLinkType = 'person' | 'place' | 'thing'

export interface ListItem {
  id: string
  listId: string
  text: string
  description: string
  completed: boolean
  position: number
  notes: string
  date: string | null
  linkType: ListItemLinkType | null
  linkId: string | null
  convertedToType: 'place' | 'thing' | null
  convertedToId: string | null
  createdAt: string
}

export type AssetCategory =
  | 'cash' | 'bank' | 'foreign_currency' | 'savings' | 'gold' | 'silver'
  | 'stock' | 'etf' | 'fund' | 'bond' | 'crypto' | 'receivable' | 'payable' | 'other'

export interface AssetDetails {
  institution?: string
  metal?: string
  purity?: string
  quantity?: number
  weight?: number
  unit?: string
  purchasePrice?: number
  purchaseDate?: string
  referencePrice?: number
  symbol?: string
  avgCost?: number
  referenceValue?: number
}

export interface Asset {
  id: string
  name: string
  category: AssetCategory
  currency: string
  estimatedValue: number
  counterpartyPersonId: string | null
  details: AssetDetails
  notes: string
  lastUpdated: string
  createdAt: string
}

export interface ExchangeRate {
  currency: string
  rateToBase: number
  updatedAt: string
}

export interface AssetSnapshot {
  id: string
  takenAt: string
  totalBaseCurrency: number
  baseCurrency: string
  breakdown: { byCategory: Record<string, number>; byCurrency: Record<string, number> }
}

export type View =
  | 'focus' | 'today' | 'calendar' | 'stats' | 'portfolio'
  | 'people' | 'things' | 'places' | 'lists' | 'assets' | 'settings'
export type TimerMode = 'focus' | 'break'
