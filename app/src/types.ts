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

export type View = 'focus' | 'today' | 'calendar' | 'stats' | 'portfolio'
export type TimerMode = 'focus' | 'break'
