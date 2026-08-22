import { useState, type ReactNode } from 'react'
import { api } from '../api/client'
import { useHistory } from '../hooks/useHistory'
import { BP_MOBILE, useMediaQuery } from '../hooks/useMediaQuery'
import { computeStreak, dayStats } from '../lib/derived'
import { iso } from '../lib/date'
import { useStore } from '../store/useStore'
import type { View } from '../types'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

const WORK_ITEMS: { id: View; label: string }[] = [
  { id: 'focus', label: 'Focus' },
  { id: 'today', label: 'Today' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'stats', label: 'Progress' },
]

const NAV_GROUPS: { label: string; items: { id: View; label: string }[] }[] = [
  { label: 'Work', items: WORK_ITEMS },
  {
    label: 'Life',
    items: [
      { id: 'people', label: 'People' },
      { id: 'things', label: 'Things' },
      { id: 'places', label: 'Places' },
      { id: 'lists', label: 'Lists' },
      { id: 'assets', label: 'Assets' },
    ],
  },
  {
    label: 'Personal',
    items: [
      { id: 'portfolio', label: 'Portfolio' },
      { id: 'settings', label: 'Settings' },
    ],
  },
]

function Wordmark({ compact }: { compact?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: compact ? 0 : '0 8px' }}>
      <div style={{ fontFamily: 'var(--fd)', fontSize: compact ? 19 : 23, letterSpacing: '-.01em', color: 'var(--fgs)' }}>
        Quiet Desk
      </div>
      {!compact && (
        <div
          style={{
            fontFamily: 'var(--fm)',
            fontSize: 9,
            letterSpacing: '.18em',
            textTransform: 'uppercase',
            color: 'var(--faint)',
          }}
        >
          focus · plan · learn
        </div>
      )}
    </div>
  )
}

function NavButton({ id, label, on, horizontal, clock, openCount }: { id: View; label: string; on: boolean; horizontal?: boolean; clock: string; openCount: number }) {
  const setView = useStore((s) => s.setView)
  return (
    <button
      onClick={() => setView(id)}
      className="nav-btn"
      style={{
        display: 'flex',
        flex: horizontal ? 1 : 'none',
        alignItems: 'center',
        justifyContent: horizontal ? 'center' : 'space-between',
        gap: 8,
        padding: horizontal ? '8px 6px' : '9px 12px',
        border: 0,
        borderRadius: 'var(--r)',
        textAlign: 'left',
        fontSize: horizontal ? 12.5 : 14,
        fontWeight: 500,
        fontFamily: 'inherit',
        background: on ? 'var(--hover)' : 'transparent',
        color: on ? 'var(--fgs)' : 'var(--dim)',
        boxShadow: on ? (horizontal ? 'inset 0 -2px 0 var(--accent)' : 'inset 2px 0 0 var(--accent)') : 'none',
        whiteSpace: 'nowrap',
      }}
    >
      <span>{label}</span>
      {id === 'focus' && <span style={{ fontFamily: 'var(--fm)', fontSize: horizontal ? 10 : 11, opacity: 0.65 }}>{clock}</span>}
      {id === 'today' && <span style={{ fontFamily: 'var(--fm)', fontSize: horizontal ? 10 : 11, opacity: 0.65 }}>{openCount}</span>}
    </button>
  )
}

/** Flat horizontal nav — used only for the mobile top bar (Work items). */
function Nav({ clock, openCount, horizontal }: { clock: string; openCount: number; horizontal?: boolean }) {
  const view = useStore((s) => s.view)
  return (
    <nav style={{ display: 'flex', flexDirection: horizontal ? 'row' : 'column', gap: horizontal ? 6 : 2 }}>
      {WORK_ITEMS.map((n) => (
        <NavButton key={n.id} id={n.id} label={n.label} on={view === n.id} horizontal={horizontal} clock={clock} openCount={openCount} />
      ))}
    </nav>
  )
}

/** Grouped vertical nav with section labels — desktop sidebar body, and the mobile "More" drawer. */
function GroupedNav({ groups, clock, openCount }: { groups: typeof NAV_GROUPS; clock: string; openCount: number }) {
  const view = useStore((s) => s.view)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {groups.map((g) => (
        <div key={g.label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div
            style={{
              fontFamily: 'var(--fm)',
              fontSize: 9,
              letterSpacing: '.18em',
              textTransform: 'uppercase',
              color: 'var(--faint)',
              padding: '0 12px 4px',
            }}
          >
            {g.label}
          </div>
          {g.items.map((n) => (
            <NavButton key={n.id} id={n.id} label={n.label} on={view === n.id} clock={clock} openCount={openCount} />
          ))}
        </div>
      ))}
    </div>
  )
}

function TodayCard({ todayMinutes, goalMinutes, streak, sessionsToday }: { todayMinutes: number; goalMinutes: number; streak: number; sessionsToday: number }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: 14,
        border: '1px solid var(--line)',
        borderRadius: 'calc(var(--r) + 1px)',
        background: 'var(--panel)',
      }}
    >
      <div style={{ fontFamily: 'var(--fm)', fontSize: 9, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--faint)' }}>
        Today
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontFamily: 'var(--fm)', fontSize: 26, color: 'var(--fgs)' }}>{todayMinutes}</span>
        <span style={{ fontSize: 12, color: 'var(--dim2)' }}>/ {goalMinutes} min focus</span>
      </div>
      <div style={{ height: 3, background: 'var(--line)', borderRadius: 3, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${Math.min(100, (todayMinutes / goalMinutes) * 100)}%`,
            background: 'var(--accent)',
            borderRadius: 3,
          }}
        />
      </div>
      <div style={{ fontSize: 12, color: 'var(--dim2)' }}>
        {streak}-day streak · {sessionsToday} sessions
      </div>
    </div>
  )
}

function LogoutButton() {
  return (
    <button
      onClick={() => api.logout().finally(() => window.location.reload())}
      className="btn-text"
      style={{
        padding: '0 8px',
        border: 0,
        background: 'transparent',
        color: 'var(--faint)',
        fontSize: 11.5,
        textAlign: 'left',
      }}
    >
      Log out
    </button>
  )
}

function useSidebarData() {
  const remaining = useStore((s) => s.remaining)
  const tasks = useStore((s) => s.tasks)
  const goalMinutes = useStore((s) => s.settings.goalMinutes)
  const history = useHistory()

  const today = new Date()
  const t0 = iso(today)
  const todayMinutes = dayStats(history, t0).minutes
  const sessionsToday = useStore((s) => s.sessions).filter((sess) => iso(new Date(sess.startedAt)) === t0).length
  const streak = computeStreak(history, today)
  const openCount = tasks.filter((t) => !t.done).length
  const mm = Math.floor(remaining / 60)
  const ss = remaining % 60
  const clock = `${pad(mm)}:${pad(ss)}`

  return { todayMinutes, goalMinutes, sessionsToday, streak, openCount, clock }
}

function DesktopSidebar() {
  const { todayMinutes, goalMinutes, sessionsToday, streak, openCount, clock } = useSidebarData()

  return (
    <aside
      style={{
        width: 222,
        flex: 'none',
        borderRight: '1px solid var(--line)',
        padding: '26px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 26,
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
      }}
    >
      <Wordmark />
      <GroupedNav groups={NAV_GROUPS} clock={clock} openCount={openCount} />
      <TodayCard todayMinutes={todayMinutes} goalMinutes={goalMinutes} streak={streak} sessionsToday={sessionsToday} />
      <div style={{ marginTop: 'auto' }}>
        <LogoutButton />
      </div>
    </aside>
  )
}

function MobileMenuRow({ children }: { children: ReactNode }) {
  return <div style={{ padding: '0 14px' }}>{children}</div>
}

function MobileSidebar() {
  const { todayMinutes, goalMinutes, sessionsToday, streak, openCount, clock } = useSidebarData()
  const [open, setOpen] = useState(false)

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'var(--bg)', borderBottom: '1px solid var(--line)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px 8px' }}>
        <Wordmark compact />
        <button
          onClick={() => setOpen((v) => !v)}
          className="icon-btn"
          style={{
            padding: '6px 12px',
            border: '1px solid var(--line2)',
            borderRadius: 'var(--r)',
            background: open ? 'var(--hover)' : 'transparent',
            color: 'var(--dim)',
            fontSize: 12,
          }}
        >
          {open ? 'Close' : 'More'}
        </button>
      </div>
      <div style={{ padding: '0 14px 10px' }}>
        <Nav clock={clock} openCount={openCount} horizontal />
      </div>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: '4px 0 18px', borderTop: '1px solid var(--line)' }}>
          <MobileMenuRow>
            <div style={{ paddingTop: 16 }}>
              <TodayCard todayMinutes={todayMinutes} goalMinutes={goalMinutes} streak={streak} sessionsToday={sessionsToday} />
            </div>
          </MobileMenuRow>
          <MobileMenuRow>
            <GroupedNav groups={NAV_GROUPS.slice(1)} clock={clock} openCount={openCount} />
          </MobileMenuRow>
          <MobileMenuRow>
            <LogoutButton />
          </MobileMenuRow>
        </div>
      )}
    </div>
  )
}

export function Sidebar() {
  const isMobile = useMediaQuery(BP_MOBILE)
  return isMobile ? <MobileSidebar /> : <DesktopSidebar />
}
