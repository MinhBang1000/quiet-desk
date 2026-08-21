import type { FocusSession, Tag, Task } from '../types'
import { addDays, dowMon, iso } from './date'

export interface DayStats {
  minutes: number
  planned: number
  done: number
  tags: Record<string, number>
}

export type History = Record<string, DayStats>

function emptyDay(): DayStats {
  return { minutes: 0, planned: 0, done: 0, tags: {} }
}

/** Builds a per-day rollup from the real session log + task due dates. */
export function buildHistory(tasks: Task[], sessions: FocusSession[]): History {
  const history: History = {}

  const get = (key: string) => {
    if (!history[key]) history[key] = emptyDay()
    return history[key]
  }

  for (const s of sessions) {
    const key = iso(new Date(s.startedAt))
    const day = get(key)
    day.minutes += s.minutes
    if (s.tag) day.tags[s.tag] = (day.tags[s.tag] || 0) + s.minutes
  }

  for (const t of tasks) {
    const day = get(t.due)
    day.planned += 1
    if (t.done) day.done += 1
  }

  return history
}

/** Same as buildHistory but for a tasks-free session list (public portfolio). */
export function buildSessionHistory(sessions: { startedAt: string; minutes: number }[]): History {
  const history: History = {}
  for (const s of sessions) {
    const key = iso(new Date(s.startedAt))
    if (!history[key]) history[key] = emptyDay()
    history[key].minutes += s.minutes
  }
  return history
}

export function dayStats(history: History, key: string): DayStats {
  return history[key] || emptyDay()
}

export function computeStreak(history: History, today: Date): number {
  let streak = 0
  for (let i = 1; i < 400; i++) {
    const h = history[iso(addDays(today, -i))]
    if (h && h.minutes >= 25) streak++
    else break
  }
  const t0 = dayStats(history, iso(today))
  if (t0.minutes >= 25) streak++
  return streak
}

export interface Bar14 {
  key: string
  label: string
  minutes: number
  isToday: boolean
}

export function computeLast14(history: History, today: Date): { bars: Bar14[]; max: number } {
  const bars: Bar14[] = []
  let max = 1
  const t0 = iso(today)
  for (let i = 13; i >= 0; i--) {
    const d = addDays(today, -i)
    const key = iso(d)
    const m = dayStats(history, key).minutes
    max = Math.max(max, m)
    bars.push({ key, label: ['M', 'T', 'W', 'T', 'F', 'S', 'S'][dowMon(d)], minutes: m, isToday: key === t0 })
  }
  return { bars, max }
}

export interface Row7 {
  key: string
  label: string
  done: number
  planned: number
  pct: number
  metGoal: boolean
}

export function computeRows7(history: History, today: Date): Row7[] {
  const rows: Row7[] = []
  const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  for (let i = 6; i >= 0; i--) {
    const d = addDays(today, -i)
    const h = dayStats(history, iso(d))
    const p = Math.max(h.planned, 1)
    rows.push({
      key: iso(d),
      label: DOW[dowMon(d)],
      done: h.done,
      planned: h.planned,
      pct: Math.round((h.done / p) * 100),
      metGoal: h.planned > 0 && h.done >= h.planned,
    })
  }
  return rows
}

export interface TagRow {
  name: string
  minutes: number
  pct: number
}

export function computeTagRows30(history: History, today: Date, tags: Tag[]): TagRow[] {
  const totals: Record<string, number> = {}
  let sum = 0
  for (let i = 0; i < 30; i++) {
    const h = history[iso(addDays(today, -i))]
    if (!h) continue
    for (const [tag, mins] of Object.entries(h.tags)) {
      totals[tag] = (totals[tag] || 0) + mins
      sum += mins
    }
  }
  return tags
    .map((t) => {
      const v = totals[t.name] || 0
      return { name: t.name, minutes: v, pct: sum ? Math.round((v / sum) * 100) : 0 }
    })
    .sort((a, b) => b.minutes - a.minutes)
}

export interface HeatCell {
  key: string
  minutes: number // -1 = future (render transparent)
  isToday: boolean
}

export function computeHeatCols53(history: History, today: Date): { cols: HeatCell[][]; yearMinutes: number; activeDays: number } {
  const cols: HeatCell[][] = []
  let yearMinutes = 0
  let activeDays = 0
  const t0 = iso(today)
  const end = addDays(today, -dowMon(today))
  for (let w = 52; w >= 0; w--) {
    const cells: HeatCell[] = []
    for (let dow = 0; dow < 7; dow++) {
      const d = addDays(end, -w * 7 + dow)
      const key = iso(d)
      const m = d > today ? -1 : dayStats(history, key).minutes
      if (m > 0) {
        yearMinutes += m
        activeDays++
      }
      cells.push({ key, minutes: m, isToday: key === t0 })
    }
    cols.push(cells)
  }
  return { cols, yearMinutes, activeDays }
}

export interface Kpis {
  yearHours: number
  activeDays: number
  dailyAverage: number
  streak: number
  bestDayMinutes: number
}

export function computeKpis(history: History, today: Date): Kpis {
  const { yearMinutes, activeDays } = computeHeatCols53(history, today)
  const streak = computeStreak(history, today)
  const bestDayMinutes = Math.max(0, ...Object.values(history).map((h) => h.minutes))
  return {
    yearHours: Math.round(yearMinutes / 60),
    activeDays,
    dailyAverage: Math.round(yearMinutes / 365),
    streak,
    bestDayMinutes,
  }
}

export interface MonthCell {
  key: string
  dateKey: string
  dayNum: number | ''
  inMonth: boolean
  isToday: boolean
  minutes: number
  items: { id: string; title: string; done: boolean; tag: string }[]
}

export function computeMonthGrid(
  tasks: Task[],
  history: History,
  monthOffset: number,
  today: Date
): { cells: MonthCell[]; label: string; monthMinutes: number } {
  const first = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1)
  const lead = dowMon(first)
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
  const t0 = iso(today)
  const cells: MonthCell[] = []
  let monthMinutes = 0
  const totalCells = Math.ceil((lead + daysInMonth) / 7) * 7

  for (let i = 0; i < totalCells; i++) {
    const dn = i - lead + 1
    const inMonth = dn >= 1 && dn <= daysInMonth
    const d = new Date(first.getFullYear(), first.getMonth(), dn)
    const key = iso(d)
    const minutes = inMonth ? dayStats(history, key).minutes : 0
    if (inMonth) monthMinutes += minutes
    const items = inMonth
      ? tasks
          .filter((t) => t.due === key)
          .slice(0, 3)
          .map((t) => ({ id: t.id, title: t.title, done: t.done, tag: t.tag }))
      : []
    cells.push({
      key: `c${i}`,
      dateKey: key,
      dayNum: inMonth ? dn : '',
      inMonth,
      isToday: key === t0,
      minutes,
      items,
    })
  }

  return {
    cells,
    label: `${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][first.getMonth()]} ${first.getFullYear()}`,
    monthMinutes,
  }
}
