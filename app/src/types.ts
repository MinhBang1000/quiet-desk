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

export interface PortfolioProject {
  title: string
  description: string
  url: string
}

export interface Portfolio {
  displayName: string
  headline: string
  bio: string
  links: PortfolioLink[]
  projects: PortfolioProject[]
  shareEnabled: boolean
  shareToken: string
}

export interface PublicPortfolio {
  displayName: string
  headline: string
  bio: string
  links: PortfolioLink[]
  projects: PortfolioProject[]
  sessions: { startedAt: string; minutes: number }[]
}

export type View = 'focus' | 'today' | 'calendar' | 'stats' | 'portfolio'
export type TimerMode = 'focus' | 'break'
